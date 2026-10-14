/**
 * Worker A of the management feature: read + write service for tasks, bank
 * configuration, aliases and prompt previews.
 *
 * This module is deliberately transport-free. The shared entry (lib/index.js)
 * owns origin checks, the one-time confirmation tokens, target binding and the
 * CAS queues; it builds a `client` (see docs/management-implementation.md) and
 * calls `execute(client, input)`. The worker never uses global fetch, never
 * reads real configs or credentials, and registers nothing on its own. It still
 * re-validates every parameter, gates upstream methods/features through
 * `client.require`, re-asserts the binding via `client.assertCurrent` before
 * each real action, and re-reads the revision before a config write — a UI can
 * never be the only line of defence.
 *
 * Upstream contract verified against the public hindsight-api 0.10.2 source
 * (docs/hindsight-management-contract.json is its OpenAPI snapshot):
 * - `updates: {field: null}` is the official "clear this override" tombstone
 *   (config_resolver._validate_config_value_types); the read side filters null
 *   tombstones out of `overrides`, so the resolved value falls back to the
 *   server default. Writing null therefore means "inherit", not a stored null.
 * - PATCH /config requires the outer `{updates}` wrapper (BankConfigUpdate).
 * - HINDSIGHT_API_ENABLE_BANK_CONFIG_API gates only config writes (404 when
 *   off); GET /config is always available.
 * - Bank id / alias rules: non-empty, at most 192 bytes of UTF-8, no control
 *   characters (bank_utils.validate_new_bank_id). Slash/backslash/dot paths
 *   are additionally rejected here for URI safety.
 */

import { createHash } from 'node:crypto'
import { BANK_FIELDS } from './management-contracts.js'

/** Normal JSON reads. Charged calls (dryRun/llmTest) get CHARGED_TIMEOUT_MS. */
const READ_TIMEOUT_MS = 30_000
const CHARGED_TIMEOUT_MS = 120_000

/**
 * Per-field input budgets. The shared entry accepts at most 32 KiB of JSON per
 * request (readJsonBody), so every field cap stays below it and the error
 * message names the budget — the entry then never has to emit an opaque 413.
 */
const ENTRY_JSON_BUDGET_BYTES = 32 * 1024
/** Maximum UTF-8 bytes accepted for a free-text config field (missions etc.). */
const TEXT_FIELD_LIMIT_BYTES = 16_000
/** Maximum UTF-8 bytes accepted for the dry-run sample content. */
const DRY_RUN_CONTENT_LIMIT_BYTES = 30_000

/** Official alias/bank-id limit (bank_utils.BANK_ID_MAX_BYTES). */
const IDENTIFIER_LIMIT_BYTES = 192

/**
 * Operation status is a closed state machine (pending/processing/completed/
 * failed/cancelled — the OperationStatusResponse.status enum). The list
 * endpoint's `type` filter, however, is a plain string upstream: the five
 * values in its description are examples only, and the public 0.10.2 source
 * already submits clone_bank / import_bank / export_bank / graph_maintenance
 * and more. Validate it as a safe ASCII identifier instead of an enum so new
 * task types (e.g. bank_transfer_export) keep working.
 */
const OPERATION_STATUSES = new Set(['pending', 'processing', 'completed', 'failed', 'cancelled'])
const OPERATION_TYPE_PATTERN = /^[a-z][a-z0-9_]{0,63}$/

/** promptPreview only renders an operation under the bank's own config. */
const PROMPT_PREVIEW_OPERATIONS = new Set(['retain', 'consolidation', 'reflect'])

/** Dry-run candidate overrides the upstream request model actually defines. */
const DRY_RUN_KEYS = [
  'content', 'context', 'timestamp', 'strategy', 'retain_mission', 'retain_extraction_mode',
  'retain_custom_instructions', 'retain_extract_causal_links', 'retain_chunk_size',
  'entity_labels', 'entities_allow_free_form', 'llm_output_language',
]

const encoder = new TextEncoder()

function utf8Bytes(text) {
  return encoder.encode(text).length
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasControlCharacter(text) {
  // Unicode Cc is exactly U+0000–U+001F plus U+007F — the official rule.
  return /[\u0000-\u001f\u007f]/.test(text)
}

/** Key-sorted stable JSON, mirroring the host entry's stableJson. */
function stableJson(value) {
  if (Array.isArray(value)) return '[' + value.map(stableJson).join(',') + ']'
  if (isPlainObject(value)) {
    return '{' + Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',') + '}'
  }
  return JSON.stringify(value ?? null)
}

function revisionOf(overrides) {
  return createHash('sha256').update(stableJson(overrides)).digest('hex')
}

/**
 * Build the management worker.
 * @param {typeof import('./index.js').HttpError} HttpError - error class carrying `status`.
 * @param {(value: unknown) => string} redact - the host secret-boundary projection.
 * @returns {{ execute: (client: object, input: object) => Promise<object> } }
 */
export function createManagementService({ HttpError, redact }) {
  if (typeof HttpError !== 'function') throw new TypeError('createManagementService 需要 HttpError')
  if (typeof redact !== 'function') throw new TypeError('createManagementService 需要 redact')

  const fail = (status, message) => { throw new HttpError(status, message) }

  /** Truncate a free-text field and project it through the secret boundary. */
  const clampText = (value, max = 2000) => {
    if (value === null || value === undefined) return null
    const text = redact(String(value))
    return text.length > max ? text.slice(0, max) + '…(已截断)' : text
  }

  /**
   * Copy only known primitive fields: strings are projected through redact,
   * numbers/booleans/null pass, and any object/array a future upstream shape
   * smuggles into a scalar slot is dropped instead of forwarded.
   */
  const pickPrimitive = (source, target, keys) => {
    for (const key of keys) {
      const value = source[key]
      if (value === null) { target[key] = null; continue }
      if (value === undefined) continue
      if (typeof value === 'string') target[key] = redact(value)
      else if (typeof value === 'number' || typeof value === 'boolean') target[key] = value
    }
  }

  /**
   * Validate a bank id or alias. Official rule: non-empty, ≤192 UTF-8 bytes,
   * no control characters. Slash/backslash and dot paths are additionally
   * rejected so the value can never leave the intended URI segment.
   */
  const validateIdentifier = (value, label) => {
    if (typeof value !== 'string') fail(400, `${label} 必须是字符串`)
    const trimmed = value.trim()
    if (trimmed === '') fail(400, `${label} 不能为空`)
    if (utf8Bytes(trimmed) > IDENTIFIER_LIMIT_BYTES) {
      fail(400, `${label} 超过 192 UTF-8 字节上限（中文最多 64 个字符）`)
    }
    if (hasControlCharacter(trimmed)) fail(400, `${label} 不能包含控制字符`)
    if (trimmed.includes('/') || trimmed.includes('\\')) fail(400, `${label} 不能包含斜杠或反斜杠`)
    if (trimmed === '.' || trimmed === '..') fail(400, `${label} 不能是点路径`)
    return trimmed
  }

  const validateOperationId = (value) => {
    if (typeof value !== 'string' || value.trim() === '') fail(400, 'operationId 不能为空')
    const trimmed = value.trim()
    if (trimmed.length > 128) fail(400, 'operationId 过长')
    if (hasControlCharacter(trimmed) || trimmed.includes('/') || trimmed.includes('\\')) fail(400, 'operationId 含非法字符')
    return trimmed
  }

  /** Reject any parameter key the operation does not own — never trust the UI. */
  const readParams = (ctx, allowedKeys) => {
    const params = ctx.params ?? {}
    if (params === null || typeof params !== 'object' || Array.isArray(params)) fail(400, 'params 必须是对象')
    for (const key of Object.keys(params)) {
      if (!allowedKeys.includes(key)) fail(400, `操作 ${ctx.op} 不支持参数：${key}`)
    }
    return params
  }

  const bankPath = (bankId, suffix) => `/v1/default/banks/${encodeURIComponent(bankId)}${suffix}`

  const expectClient = (client) => {
    if (!client || typeof client !== 'object') fail(502, '管理服务需要已绑定的 API client')
    if (typeof client.require !== 'function' || typeof client.json !== 'function') fail(502, 'API client 缺少 require/json 能力')
  }

  const expectUpstreamObject = (payload, what) => {
    if (!isPlainObject(payload)) fail(502, `上游${what}响应格式无效`)
    return payload
  }

  // ---------------------------------------------------------------------------
  // Response projections: stable fields only. task_payload / result_metadata /
  // download URLs are never copied out, even if an upstream version leaks them.
  // ---------------------------------------------------------------------------

  const projectProgress = (progress) => {
    if (progress === null || progress === undefined) return null
    if (!isPlainObject(progress)) fail(502, '上游 progress 字段格式无效')
    const out = {}
    if (typeof progress.stage === 'string') out.stage = redact(progress.stage)
    if (typeof progress.at === 'string') out.at = redact(progress.at)
    if (typeof progress.processed === 'number') out.processed = progress.processed
    if (typeof progress.total === 'number') out.total = progress.total
    if (isPlainObject(progress.detail)) {
      const detail = {}
      for (const [key, value] of Object.entries(progress.detail)) {
        if (typeof value === 'number' && Number.isFinite(value)) detail[key] = value
      }
      out.detail = detail
    }
    return out
  }

  const projectOperationDetails = (details) => {
    if (details === null || details === undefined) return null
    if (!isPlainObject(details)) return null
    // Known primitives only: an arbitrary object never lands in failure_reason
    // or any other stable field, and strings pass through redact.
    const out = {}
    pickPrimitive(details, out, ['operation_type', 'outcome', 'failure_reason'])
    return out
  }

  const projectOperationListItem = (item) => {
    if (!isPlainObject(item)) fail(502, '上游任务列表条目格式无效')
    if (typeof item.id !== 'string' || typeof item.status !== 'string') fail(502, '上游任务条目缺少 id/status，不伪造成功')
    const out = {}
    pickPrimitive(item, out, ['id', 'task_type', 'operation_id', 'operation_type', 'items_count', 'document_id', 'filename', 'mental_model_id', 'created_at', 'updated_at', 'status', 'retry_count', 'next_retry_at'])
    out.error_message = clampText(item.error_message, 1000)
    out.details = projectOperationDetails(item.details)
    out.progress = projectProgress(item.progress)
    return out
  }

  const projectChildOperation = (child) => {
    if (!isPlainObject(child) || typeof child.operation_id !== 'string' || typeof child.status !== 'string') {
      fail(502, '上游子任务条目格式无效')
    }
    const out = {}
    pickPrimitive(child, out, ['operation_id', 'status', 'sub_batch_index', 'items_count'])
    out.error_message = clampText(child.error_message, 500)
    return out
  }

  const projectOperationDetail = (payload) => {
    expectUpstreamObject(payload, '任务状态')
    if (typeof payload.operation_id !== 'string' || typeof payload.status !== 'string') {
      fail(502, '上游任务状态缺少 operation_id/status，不伪造成功')
    }
    const out = {}
    pickPrimitive(payload, out, ['operation_id', 'status', 'operation_type', 'id', 'task_type', 'mental_model_id', 'created_at', 'updated_at', 'completed_at', 'retry_count', 'next_retry_at'])
    out.error_message = clampText(payload.error_message, 1000)
    out.details = projectOperationDetails(payload.details)
    out.progress = projectProgress(payload.progress)
    if (Array.isArray(payload.child_operations)) out.child_operations = payload.child_operations.map(projectChildOperation)
    // task_payload and result_metadata (and any download URL inside them) are
    // deliberately absent from the projection above.
    return out
  }

  const projectAliases = (payload) => {
    expectUpstreamObject(payload, '别名')
    if (typeof payload.bank_id !== 'string' || !Array.isArray(payload.aliases)) {
      fail(502, '上游别名响应格式无效')
    }
    return {
      bank_id: redact(payload.bank_id),
      aliases: payload.aliases.map((entry) => {
        if (!isPlainObject(entry) || typeof entry.alias !== 'string') fail(502, '上游别名条目格式无效')
        return { alias: redact(entry.alias), primary: entry.primary === true }
      }),
    }
  }

  /**
   * Bank config projection. `config`/`overrides` are filtered down to the
   * shared BANK_FIELDS whitelist before they reach the browser — unknown or
   * future fields (including anything cloud/secret-ish upstream may add) are
   * never forwarded; "retaining" them means PATCH does not touch them, not
   * that the UI sees them. The CAS `revision` still hashes the FULL raw
   * overrides object, so a change anywhere (whitelisted or not) invalidates
   * the value the next bankPatch must echo back.
   */
  const projectBankConfig = (payload) => {
    expectUpstreamObject(payload, '记忆库配置')
    if (!isPlainObject(payload.config) || !isPlainObject(payload.overrides)) {
      fail(502, '上游配置响应缺少 config/overrides，不伪造成功')
    }
    const revision = revisionOf(payload.overrides)
    const config = {}
    const overrides = {}
    const fields = {}
    for (const [key, spec] of Object.entries(BANK_FIELDS)) {
      const inConfig = Object.prototype.hasOwnProperty.call(payload.config, key)
      if (inConfig) config[key] = payload.config[key]
      const inOverrides = Object.prototype.hasOwnProperty.call(payload.overrides, key)
      if (inOverrides) overrides[key] = payload.overrides[key]
      if (inConfig) {
        fields[key] = {
          label: spec.label,
          kind: spec.kind,
          ...(spec.choices ? { choices: spec.choices } : {}),
          ...(spec.min !== undefined ? { min: spec.min } : {}),
          ...(spec.max !== undefined ? { max: spec.max } : {}),
          value: payload.config[key],
          hasOverride: inOverrides,
          overrideValue: inOverrides ? payload.overrides[key] : null,
        }
      }
    }
    return { config, overrides, revision, fields }
  }

  /** Keep only finite-number entries of a stats map (and nested maps). */
  const numberMap = (value) => {
    if (!isPlainObject(value)) return undefined
    const out = {}
    for (const [key, entry] of Object.entries(value)) {
      if (typeof entry === 'number' && Number.isFinite(entry)) out[key] = entry
    }
    return out
  }

  const projectStats = (payload) => {
    expectUpstreamObject(payload, '统计')
    for (const key of ['total_nodes', 'total_links', 'total_documents', 'pending_operations', 'failed_operations']) {
      if (typeof payload[key] !== 'number' || !Number.isFinite(payload[key])) {
        fail(502, `上游统计响应缺少 ${key}，不伪造成功`)
      }
    }
    const out = { bank_id: typeof payload.bank_id === 'string' ? redact(payload.bank_id) : undefined }
    for (const key of ['total_nodes', 'total_links', 'total_documents', 'pending_operations', 'failed_operations', 'pending_consolidation', 'failed_consolidation', 'total_observations']) {
      if (typeof payload[key] === 'number' && Number.isFinite(payload[key])) out[key] = payload[key]
    }
    for (const key of ['nodes_by_fact_type', 'links_by_link_type', 'links_by_fact_type', 'operations_by_status']) {
      const map = numberMap(payload[key])
      if (map !== undefined) out[key] = map
    }
    if (isPlainObject(payload.links_breakdown)) {
      const breakdown = {}
      for (const [key, nested] of Object.entries(payload.links_breakdown)) {
        const map = numberMap(nested)
        if (map !== undefined) breakdown[key] = map
      }
      out.links_breakdown = breakdown
    }
    for (const key of ['last_consolidated_at', 'last_memory_write_at']) {
      if (typeof payload[key] === 'string') out[key] = redact(payload[key])
    }
    return out
  }

  const projectPromptBlock = (block) => {
    if (!isPlainObject(block)) fail(502, '上游提示词块格式无效')
    const out = {}
    // Known primitives only; source/field/etc. describe the setting behind the
    // text and must survive (redacted), anything object-shaped is dropped.
    pickPrimitive(block, out, ['source', 'field', 'section', 'heading', 'active', 'value', 'kind', 'editable'])
    if (Array.isArray(block.choices)) out.choices = block.choices.filter((choice) => typeof choice === 'string').map((choice) => redact(choice))
    out.text = block.text === undefined ? '' : clampText(block.text, 20_000)
    return out
  }

  const projectPromptPreview = (payload) => {
    expectUpstreamObject(payload, '提示词预览')
    if (!Array.isArray(payload.messages)) fail(502, '上游提示词预览缺少 messages')
    const out = {
      messages: payload.messages.map((message) => {
        if (!isPlainObject(message)) fail(502, '上游提示词消息格式无效')
        const projected = {}
        if (typeof message.role === 'string') projected.role = redact(message.role)
        projected.blocks = Array.isArray(message.blocks) ? message.blocks.map(projectPromptBlock) : []
        return projected
      }),
    }
    if (Array.isArray(payload.strategies)) out.strategies = payload.strategies.filter((name) => typeof name === 'string').map((name) => redact(name))
    if (payload.strategy !== undefined) out.strategy = typeof payload.strategy === 'string' ? redact(payload.strategy) : null
    if (Array.isArray(payload.run_settings)) {
      out.run_settings = payload.run_settings.map((setting) => {
        if (!isPlainObject(setting)) fail(502, '上游运行设置格式无效')
        const projected = {}
        pickPrimitive(setting, projected, ['field', 'value', 'kind', 'editable'])
        if (Array.isArray(setting.choices)) projected.choices = setting.choices.filter((choice) => typeof choice === 'string').map((choice) => redact(choice))
        return projected
      })
    }
    if (isPlainObject(payload.response_schema)) out.response_schema = payload.response_schema
    out.skipped_reason = payload.skipped_reason === undefined ? null : clampText(payload.skipped_reason, 2000)
    return out
  }

  const projectDryRun = (payload) => {
    expectUpstreamObject(payload, '干跑提取')
    if (!Array.isArray(payload.facts) || !isPlainObject(payload.usage)) {
      fail(502, '上游干跑响应缺少 facts/usage，不伪造成功')
    }
    return {
      facts: payload.facts.map((fact) => {
        if (!isPlainObject(fact) || typeof fact.text !== 'string' || typeof fact.fact_type !== 'string') {
          fail(502, '上游干跑事实条目格式无效')
        }
        const out = { text: redact(fact.text), fact_type: redact(fact.fact_type) }
        for (const key of ['occurred_start', 'occurred_end']) {
          if (typeof fact[key] === 'string') out[key] = redact(fact[key])
        }
        if (typeof fact.chunk_index === 'number') out.chunk_index = fact.chunk_index
        out.entities = Array.isArray(fact.entities) ? fact.entities.filter((name) => typeof name === 'string').map((name) => redact(name)) : []
        out.attachments = Array.isArray(fact.attachments)
          ? fact.attachments.map((attachment) => {
              if (!isPlainObject(attachment)) fail(502, '上游附件条目格式无效')
              const projected = {}
              pickPrimitive(attachment, projected, ['block_index', 'type', 'media_type'])
              return projected
            })
          : []
        return out
      }),
      chunks: Array.isArray(payload.chunks)
        ? payload.chunks.map((chunk) => {
            if (!isPlainObject(chunk)) fail(502, '上游分块条目格式无效')
            const projected = {}
            if (typeof chunk.text === 'string') projected.text = redact(chunk.text)
            if (typeof chunk.fact_count === 'number') projected.fact_count = chunk.fact_count
            return projected
          })
        : [],
      usage: (() => {
        const usage = {}
        for (const key of ['input_tokens', 'output_tokens', 'total_tokens', 'cached_tokens', 'thoughts_tokens']) {
          if (typeof payload.usage[key] === 'number' && Number.isFinite(payload.usage[key])) usage[key] = payload.usage[key]
        }
        return usage
      })(),
    }
  }

  const projectLlmHealth = (payload) => {
    expectUpstreamObject(payload, 'LLM 连通性')
    if (typeof payload.bank_id !== 'string' || !Array.isArray(payload.operations)) {
      fail(502, '上游 LLM 连通性响应格式无效')
    }
    return {
      bank_id: redact(payload.bank_id),
      operations: payload.operations.map((entry) => {
        if (!isPlainObject(entry) || typeof entry.operation !== 'string' || typeof entry.ok !== 'boolean' || typeof entry.status !== 'string') {
          fail(502, '上游 LLM 连通性条目格式无效')
        }
        const out = { operation: redact(entry.operation), ok: entry.ok, status: redact(entry.status) }
        if (typeof entry.latency_ms === 'number') out.latency_ms = entry.latency_ms
        return out
      }),
    }
  }

  /** retry/cancel/delete answers: {success, operation_id, message}. */
  const projectActionResult = (payload, action) => {
    expectUpstreamObject(payload, action)
    if (payload.success !== true || typeof payload.operation_id !== 'string') {
      fail(502, `上游未确认${action}成功，不伪造结果`)
    }
    return { success: true, operation_id: redact(payload.operation_id), message: clampText(payload.message, 1000) }
  }

  // ---------------------------------------------------------------------------
  // Read operations
  // ---------------------------------------------------------------------------

  const readStats = async (ctx) => {
    const params = readParams(ctx, ['refresh'])
    if (params.refresh !== undefined && typeof params.refresh !== 'boolean') fail(400, 'refresh 必须是布尔值')
    ctx.client.require('GET', '/v1/default/banks/{bank_id}/stats')
    const query = params.refresh === true ? '?refresh=true' : ''
    const payload = await ctx.client.json('GET', bankPath(ctx.bankId, `/stats${query}`), undefined, { timeoutMs: READ_TIMEOUT_MS })
    return projectStats(payload)
  }

  const readOperations = async (ctx) => {
    const params = readParams(ctx, ['status', 'type', 'limit', 'offset', 'excludeParents'])
    const query = new URLSearchParams()
    if (params.status !== undefined && params.status !== null) {
      if (typeof params.status !== 'string' || !OPERATION_STATUSES.has(params.status)) {
        fail(400, 'status 必须是 pending/processing/completed/failed/cancelled 之一')
      }
      query.set('status', params.status)
    }
    if (params.type !== undefined && params.type !== null) {
      // Verified against the public 0.10.2 source: task types form an open
      // snake_case set (clone_bank, import_bank, export_bank, graph_maintenance,
      // …) — validate as a safe ASCII identifier, never as a closed enum, so
      // new migration tasks keep working.
      if (typeof params.type !== 'string' || !OPERATION_TYPE_PATTERN.test(params.type)) {
        fail(400, 'type 必须是小写 ASCII 标识符（字母开头，可含数字与下划线，≤64 字符），如 clone_bank')
      }
      query.set('type', params.type)
    }
    const limit = params.limit ?? 20
    if (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1 || limit > 100) fail(400, 'limit 必须是 1–100 的整数')
    const offset = params.offset ?? 0
    if (typeof offset !== 'number' || !Number.isInteger(offset) || offset < 0) fail(400, 'offset 必须是不小于 0 的整数')
    if (params.excludeParents !== undefined && typeof params.excludeParents !== 'boolean') fail(400, 'excludeParents 必须是布尔值')
    query.set('limit', String(limit))
    query.set('offset', String(offset))
    if (params.excludeParents === true) query.set('exclude_parents', 'true')
    ctx.client.require('GET', '/v1/default/banks/{bank_id}/operations')
    const payload = await ctx.client.json('GET', bankPath(ctx.bankId, `/operations?${query}`), undefined, { timeoutMs: READ_TIMEOUT_MS })
    expectUpstreamObject(payload, '任务列表')
    if (!Array.isArray(payload.operations)) fail(502, '上游任务列表缺少 operations 数组')
    return {
      bank_id: typeof payload.bank_id === 'string' ? payload.bank_id : undefined,
      total: typeof payload.total === 'number' ? payload.total : payload.operations.length,
      limit,
      offset,
      operations: payload.operations.map(projectOperationListItem),
    }
  }

  const readOperation = async (ctx) => {
    const params = readParams(ctx, ['operationId'])
    if (params.operationId === undefined) fail(400, '缺少 operationId')
    const operationId = validateOperationId(params.operationId)
    ctx.client.require('GET', '/v1/default/banks/{bank_id}/operations/{operation_id}')
    // include_payload stays false: the raw submission params never reach the UI.
    const payload = await ctx.client.json('GET', bankPath(ctx.bankId, `/operations/${encodeURIComponent(operationId)}`), undefined, { timeoutMs: READ_TIMEOUT_MS })
    return projectOperationDetail(payload)
  }

  const readBankConfig = async (ctx) => {
    readParams(ctx, [])
    // GET /config is always available upstream; only writes are feature-gated.
    ctx.client.require('GET', '/v1/default/banks/{bank_id}/config')
    const payload = await ctx.client.json('GET', bankPath(ctx.bankId, '/config'), undefined, { timeoutMs: READ_TIMEOUT_MS })
    return projectBankConfig(payload)
  }

  const readAliases = async (ctx) => {
    readParams(ctx, [])
    ctx.client.require('GET', '/v1/default/banks/{bank_id}/aliases')
    const payload = await ctx.client.json('GET', bankPath(ctx.bankId, '/aliases'), undefined, { timeoutMs: READ_TIMEOUT_MS })
    return projectAliases(payload)
  }

  // ---------------------------------------------------------------------------
  // Write operations
  // ---------------------------------------------------------------------------

  const writeOperationRetry = async (ctx) => {
    const params = readParams(ctx, ['operationId'])
    if (params.operationId === undefined) fail(400, '缺少 operationId')
    const operationId = validateOperationId(params.operationId)
    ctx.client.require('POST', '/v1/default/banks/{bank_id}/operations/{operation_id}/retry')
    ctx.client.assertCurrent?.()
    const payload = await ctx.client.json('POST', bankPath(ctx.bankId, `/operations/${encodeURIComponent(operationId)}/retry`), {}, { timeoutMs: READ_TIMEOUT_MS })
    return projectActionResult(payload, '任务重试')
  }

  const writeOperationCancel = async (ctx) => {
    const params = readParams(ctx, ['operationId'])
    if (params.operationId === undefined) fail(400, '缺少 operationId')
    const operationId = validateOperationId(params.operationId)
    // Official cancel is DELETE on the operation itself, not a /delete suffix.
    ctx.client.require('DELETE', '/v1/default/banks/{bank_id}/operations/{operation_id}')
    ctx.client.assertCurrent?.()
    const payload = await ctx.client.json('DELETE', bankPath(ctx.bankId, `/operations/${encodeURIComponent(operationId)}`), undefined, { timeoutMs: READ_TIMEOUT_MS })
    return projectActionResult(payload, '任务取消')
  }

  const writeOperationDelete = async (ctx) => {
    const params = readParams(ctx, ['operationId'])
    if (params.operationId === undefined) fail(400, '缺少 operationId')
    const operationId = validateOperationId(params.operationId)
    ctx.client.require('DELETE', '/v1/default/banks/{bank_id}/operations/{operation_id}/delete')
    ctx.client.assertCurrent?.()
    const payload = await ctx.client.json('DELETE', bankPath(ctx.bankId, `/operations/${encodeURIComponent(operationId)}/delete`), undefined, { timeoutMs: READ_TIMEOUT_MS })
    return projectActionResult(payload, '任务删除')
  }

  const validateFieldValue = (key, value) => {
    const spec = BANK_FIELDS[key]
    if (spec.kind === 'text') {
      if (typeof value !== 'string') fail(400, `${key} 必须是字符串`)
      if (utf8Bytes(value) > TEXT_FIELD_LIMIT_BYTES) fail(400, `${key} 超过单字段输入预算 ${TEXT_FIELD_LIMIT_BYTES} 字节（入口 JSON 上限 ${ENTRY_JSON_BUDGET_BYTES / 1024}KiB）`)
      return value
    }
    if (spec.kind === 'boolean') {
      if (typeof value !== 'boolean') fail(400, `${key} 必须是布尔值`)
      return value
    }
    if (spec.kind === 'integer') {
      if (typeof value !== 'number' || !Number.isInteger(value)) fail(400, `${key} 必须是整数`)
      // Shared contract pins recall budgets to min 1 (upstream positive-int
      // rule in config_resolver) — validate straight from the spec.
      const min = spec.min
      if (min !== undefined && value < min) fail(400, `${key} 不能小于 ${min}`)
      if (spec.max !== undefined && value > spec.max) fail(400, `${key} 不能大于 ${spec.max}`)
      return value
    }
    if (spec.kind === 'choice') {
      if (typeof value !== 'string' || !spec.choices.includes(value)) fail(400, `${key} 必须是 ${spec.choices.join('/')} 之一`)
      return value
    }
    if (spec.kind === 'json') {
      if (!isPlainObject(value) && !Array.isArray(value)) fail(400, `${key} 必须是 JSON 对象或数组`)
      try { JSON.stringify(value) } catch { fail(400, `${key} 不是可序列化的 JSON 值`) }
      return value
    }
    return fail(400, `${key} 的字段类型未定义，拒绝写入`)
  }

  const writeBankPatch = async (ctx) => {
    const params = readParams(ctx, ['updates', 'revision'])
    if (!isPlainObject(params.updates) || Object.keys(params.updates).length === 0) fail(400, 'updates 必须是非空对象')
    if (typeof params.revision !== 'string' || !/^[0-9a-f]{64}$/.test(params.revision)) fail(400, 'revision 必须是读取配置时返回的 SHA-256')
    const updates = {}
    for (const [key, value] of Object.entries(params.updates)) {
      if (!Object.prototype.hasOwnProperty.call(BANK_FIELDS, key)) {
        fail(400, `updates 含白名单外字段：${key}；仅允许 BANK_FIELDS 中的键`)
      }
      // Official tombstone: null clears the override and inherits upstream.
      updates[key] = value === null ? null : validateFieldValue(key, value)
    }
    const bothBounds = updates.recall_budget_min !== undefined && updates.recall_budget_max !== undefined
    if (bothBounds && updates.recall_budget_min !== null && updates.recall_budget_max !== null && updates.recall_budget_min > updates.recall_budget_max) {
      fail(400, 'recall_budget_min 不能大于 recall_budget_max')
    }
    ctx.client.require('PATCH', '/v1/default/banks/{bank_id}/config', 'bank_config_api')
    ctx.client.assertCurrent?.()
    const configPath = bankPath(ctx.bankId, '/config')
    // Read-modify-write: re-derive the revision from the live overrides and
    // reject the patch when anything changed since the UI read the config.
    const before = await ctx.client.json('GET', configPath, undefined, { timeoutMs: READ_TIMEOUT_MS })
    expectUpstreamObject(before, '记忆库配置')
    if (!isPlainObject(before.config) || !isPlainObject(before.overrides)) fail(502, '上游配置响应缺少 config/overrides，拒绝写入')
    if (revisionOf(before.overrides) !== params.revision) {
      fail(409, '配置已被其他操作修改，请刷新后重新保存')
    }
    for (const key of Object.keys(updates)) {
      if (!Object.prototype.hasOwnProperty.call(before.config, key)) {
        // Never blind-write a field this API generation does not expose.
        fail(400, `当前 API 不支持字段 ${key}（其配置响应中不存在），拒绝盲写`)
      }
    }
    ctx.client.assertCurrent?.()
    const payload = await ctx.client.json('PATCH', configPath, { updates }, { timeoutMs: READ_TIMEOUT_MS })
    return projectBankConfig(payload)
  }

  const writeBankReset = async (ctx) => {
    readParams(ctx, [])
    // Whole-bank override reset (DELETE /config), not a per-field restore.
    ctx.client.require('DELETE', '/v1/default/banks/{bank_id}/config', 'bank_config_api')
    ctx.client.assertCurrent?.()
    const payload = await ctx.client.json('DELETE', bankPath(ctx.bankId, '/config'), undefined, { timeoutMs: READ_TIMEOUT_MS })
    return projectBankConfig(payload)
  }

  const writeAliasAdd = async (ctx) => {
    const params = readParams(ctx, ['alias', 'primary'])
    if (params.alias === undefined) fail(400, '缺少 alias')
    const alias = validateIdentifier(params.alias, 'alias')
    if (params.primary !== undefined && typeof params.primary !== 'boolean') fail(400, 'primary 必须是布尔值')
    ctx.client.require('POST', '/v1/default/banks/{bank_id}/aliases')
    ctx.client.assertCurrent?.()
    const body = params.primary === undefined ? { alias } : { alias, primary: params.primary }
    const payload = await ctx.client.json('POST', bankPath(ctx.bankId, '/aliases'), body, { timeoutMs: READ_TIMEOUT_MS })
    return projectAliases(payload)
  }

  const writeAliasPrimary = async (ctx) => {
    const params = readParams(ctx, ['alias', 'primary'])
    if (params.alias === undefined) fail(400, '缺少 alias')
    const alias = validateIdentifier(params.alias, 'alias')
    if (typeof params.primary !== 'boolean') fail(400, 'primary 必须是布尔值')
    ctx.client.require('PATCH', '/v1/default/banks/{bank_id}/aliases/{alias}')
    ctx.client.assertCurrent?.()
    const payload = await ctx.client.json('PATCH', bankPath(ctx.bankId, `/aliases/${encodeURIComponent(alias)}`), { primary: params.primary }, { timeoutMs: READ_TIMEOUT_MS })
    return projectAliases(payload)
  }

  const writeAliasRemove = async (ctx) => {
    const params = readParams(ctx, ['alias'])
    if (params.alias === undefined) fail(400, '缺少 alias')
    const alias = validateIdentifier(params.alias, 'alias')
    ctx.client.require('DELETE', '/v1/default/banks/{bank_id}/aliases/{alias}')
    ctx.client.assertCurrent?.()
    const payload = await ctx.client.json('DELETE', bankPath(ctx.bankId, `/aliases/${encodeURIComponent(alias)}`), undefined, { timeoutMs: READ_TIMEOUT_MS })
    return projectAliases(payload)
  }

  const writePromptPreview = async (ctx) => {
    const params = readParams(ctx, ['operation', 'strategy'])
    const operation = params.operation ?? 'retain'
    if (typeof operation !== 'string' || !PROMPT_PREVIEW_OPERATIONS.has(operation)) {
      fail(400, 'operation 必须是 retain/consolidation/reflect 之一')
    }
    if (params.strategy !== undefined && params.strategy !== null) {
      if (typeof params.strategy !== 'string' || params.strategy.length > 128 || hasControlCharacter(params.strategy)) {
        fail(400, 'strategy 必须是不含控制字符的短字符串')
      }
    }
    // The upstream request model deliberately has nothing else to override —
    // missions or sample text are rejected here, not silently forwarded.
    ctx.client.require('POST', '/v1/default/banks/{bank_id}/prompts/preview')
    ctx.client.assertCurrent?.()
    const body = { operation }
    if (params.strategy !== undefined && params.strategy !== null) body.strategy = params.strategy
    const payload = await ctx.client.json('POST', bankPath(ctx.bankId, '/prompts/preview'), body, { timeoutMs: READ_TIMEOUT_MS })
    return projectPromptPreview(payload)
  }

  const writeDryRun = async (ctx) => {
    if (ctx.params && typeof ctx.params === 'object' && ctx.params.agent_name !== undefined) {
      // Deprecated upstream; check before the allowlist so the message is exact.
      fail(400, 'agent_name 已废弃：请在 context 中描述说话者；不提供该覆盖')
    }
    const params = readParams(ctx, DRY_RUN_KEYS)
    if (typeof params.content !== 'string' || params.content.trim() === '') fail(400, 'content 必须是非空文本')
    if (utf8Bytes(params.content) > DRY_RUN_CONTENT_LIMIT_BYTES) fail(400, `content 超过单字段输入预算 ${DRY_RUN_CONTENT_LIMIT_BYTES} 字节（入口 JSON 上限 ${ENTRY_JSON_BUDGET_BYTES / 1024}KiB）`)
    if (params.context !== undefined && params.context !== null) {
      if (typeof params.context !== 'string' || utf8Bytes(params.context) > 8192) fail(400, 'context 必须是不超过 8192 字节的文本')
    }
    if (params.timestamp !== undefined && params.timestamp !== null) {
      if (typeof params.timestamp !== 'string' || Number.isNaN(Date.parse(params.timestamp))) fail(400, 'timestamp 必须是 ISO 8601 时间')
    }
    if (params.strategy !== undefined && params.strategy !== null) {
      if (typeof params.strategy !== 'string' || params.strategy.length > 128 || hasControlCharacter(params.strategy)) {
        fail(400, 'strategy 必须是不含控制字符的短字符串')
      }
    }
    const stringOrNullOrAbsent = (key) => params[key] === undefined || params[key] === null || (typeof params[key] === 'string' && utf8Bytes(params[key]) <= TEXT_FIELD_LIMIT_BYTES)
    if (!stringOrNullOrAbsent('retain_mission')) fail(400, 'retain_mission 必须是字符串或 null')
    if (!stringOrNullOrAbsent('retain_custom_instructions')) fail(400, 'retain_custom_instructions 必须是字符串或 null')
    if (!stringOrNullOrAbsent('llm_output_language')) fail(400, 'llm_output_language 必须是字符串或 null')
    if (params.retain_extraction_mode !== undefined && params.retain_extraction_mode !== null) {
      const mode = params.retain_extraction_mode
      if (typeof mode !== 'string' || !BANK_FIELDS.retain_extraction_mode.choices.includes(mode)) {
        fail(400, `retain_extraction_mode 必须是 ${BANK_FIELDS.retain_extraction_mode.choices.join('/')} 之一`)
      }
    }
    for (const key of ['retain_extract_causal_links', 'entities_allow_free_form']) {
      if (params[key] !== undefined && params[key] !== null && typeof params[key] !== 'boolean') fail(400, `${key} 必须是布尔值或 null`)
    }
    if (params.retain_chunk_size !== undefined && params.retain_chunk_size !== null) {
      const size = params.retain_chunk_size
      if (typeof size !== 'number' || !Number.isInteger(size) || size < 1) fail(400, 'retain_chunk_size 必须是正整数或 null')
    }
    if (params.entity_labels !== undefined && params.entity_labels !== null) {
      if (!isPlainObject(params.entity_labels) && !Array.isArray(params.entity_labels)) fail(400, 'entity_labels 必须是对象或数组')
      try { JSON.stringify(params.entity_labels) } catch { fail(400, 'entity_labels 不是可序列化的 JSON 值') }
    }
    ctx.client.require('POST', '/v1/default/banks/{bank_id}/memories/dry-run-extract')
    ctx.client.assertCurrent?.()
    // Charged call (real extraction LLM run): 120-second deadline, and the
    // caller must refresh state afterwards — timeouts are never auto-retried.
    const body = { content: params.content }
    for (const key of DRY_RUN_KEYS) {
      if (key !== 'content' && params[key] !== undefined && params[key] !== null) body[key] = params[key]
    }
    const payload = await ctx.client.json('POST', bankPath(ctx.bankId, '/memories/dry-run-extract'), body, { timeoutMs: CHARGED_TIMEOUT_MS })
    return projectDryRun(payload)
  }

  const writeLlmTest = async (ctx) => {
    readParams(ctx, [])
    ctx.client.require('POST', '/v1/default/banks/{bank_id}/health/llm', 'bank_llm_health')
    ctx.client.assertCurrent?.()
    const payload = await ctx.client.json('POST', bankPath(ctx.bankId, '/health/llm'), {}, { timeoutMs: CHARGED_TIMEOUT_MS })
    return projectLlmHealth(payload)
  }

  const HANDLERS = {
    stats: readStats,
    operations: readOperations,
    operation: readOperation,
    bankConfig: readBankConfig,
    aliases: readAliases,
    operationRetry: writeOperationRetry,
    operationCancel: writeOperationCancel,
    operationDelete: writeOperationDelete,
    bankPatch: writeBankPatch,
    bankReset: writeBankReset,
    aliasAdd: writeAliasAdd,
    aliasPrimary: writeAliasPrimary,
    aliasRemove: writeAliasRemove,
    promptPreview: writePromptPreview,
    dryRun: writeDryRun,
    llmTest: writeLlmTest,
  }

  /**
   * Run one management operation.
   * @param client - the bound API client built by the shared entry.
   * @param input - `{op, apiUrl, bankId, params}` (token/origin checks already
   *   done by the entry; the worker still re-validates everything it uses).
   * @returns the projected, whitelist-only response data.
   */
  async function execute(client, input) {
    try {
      expectClient(client)
      const op = input?.op
      if (typeof op !== 'string' || !Object.prototype.hasOwnProperty.call(HANDLERS, op)) {
        fail(400, `不支持的管理操作：${String(op)}`)
      }
      const bankId = validateIdentifier(input.bankId, 'bankId')
      const params = input.params ?? {}
      if (!isPlainObject(params)) fail(400, 'params 必须是对象')
      return await HANDLERS[op]({ client, op, bankId, params })
    } catch (error) {
      // Client failures already carry a controlled status; anything else is
      // reported as a bad gateway with the message projected through redact.
      if (error instanceof HttpError || (error && typeof error.status === 'number')) throw error
      throw new HttpError(502, redact(`管理操作执行失败：${error?.message ?? String(error)}`))
    }
  }

  return { execute }
}
