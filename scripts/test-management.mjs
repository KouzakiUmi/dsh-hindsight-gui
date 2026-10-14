/**
 * Offline Worker-A regressions for lib/management-service.js.
 * The HttpError/redact pair and the bound API client are fully mocked: no
 * network, no credential use, no real file writes, no upstream process.
 * Run with: node scripts/test-management.mjs
 */
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { createManagementService } from '../lib/management-service.js'
import { BANK_FIELDS } from '../lib/management-contracts.js'

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const SECRET = 'sk-synthetic-test-key-NOT-REAL'
function redact(value) {
  let text = String(value ?? '')
  text = text.split(SECRET).join('[REDACTED]')
  return text
    .replace(/(https?:\/\/)[^\s/@]+:[^\s/@]+@/gi, '$1[REDACTED]@')
    .replace(/([?&](?:key|api[_-]?key|token|secret|password|auth|code)=)[^&#\s]*/gi, '$1[REDACTED]')
}

const service = createManagementService({ HttpError, redact })

/** The 0.10.2 public schema surface Worker A touches. */
const SCHEMA_0_10_2 = new Set([
  'GET /v1/default/banks/{bank_id}/stats',
  'GET /v1/default/banks/{bank_id}/operations',
  'GET /v1/default/banks/{bank_id}/operations/{operation_id}',
  'POST /v1/default/banks/{bank_id}/operations/{operation_id}/retry',
  'DELETE /v1/default/banks/{bank_id}/operations/{operation_id}',
  'DELETE /v1/default/banks/{bank_id}/operations/{operation_id}/delete',
  'GET /v1/default/banks/{bank_id}/config',
  'PATCH /v1/default/banks/{bank_id}/config',
  'DELETE /v1/default/banks/{bank_id}/config',
  'GET /v1/default/banks/{bank_id}/aliases',
  'POST /v1/default/banks/{bank_id}/aliases',
  'PATCH /v1/default/banks/{bank_id}/aliases/{alias}',
  'DELETE /v1/default/banks/{bank_id}/aliases/{alias}',
  'POST /v1/default/banks/{bank_id}/prompts/preview',
  'POST /v1/default/banks/{bank_id}/memories/dry-run-extract',
  'POST /v1/default/banks/{bank_id}/health/llm',
])

/**
 * A mock of the entry-provided client: require() consults the real schema set,
 * json() records every call and answers from a responder, assertCurrent()
 * counts invocations and can be armed to reject once.
 */
function makeClient({ features = { bank_config_api: true, bank_llm_health: true }, schema = SCHEMA_0_10_2, respond = () => ({}), responses } = {}) {
  const calls = []
  let assertCurrentCalls = 0
  let assertCurrentFailure = null
  const queue = responses ? [...responses] : []
  return {
    base: 'http://127.0.0.1:8888',
    signal: new AbortController().signal,
    capabilities: { apiVersion: '0.10.2', features, operations: {} },
    calls,
    get assertCurrentCalls() { return assertCurrentCalls },
    failNextAssertCurrent(message) { assertCurrentFailure = message },
    require(method, template, feature) {
      if (!schema.has(`${method} ${template}`)) throw new HttpError(409, `目标 API 不存在方法 ${method} ${template}`)
      if (feature !== undefined && features[feature] !== true) throw new HttpError(403, `能力 ${feature} 未开启`)
    },
    async json(method, path, body, options = {}) {
      const call = { method, path, body, timeoutMs: options.timeoutMs }
      calls.push(call)
      if (queue.length > 0) {
        const next = queue.shift()
        if (next instanceof Error) throw next
        return typeof next === 'function' ? next(call) : next
      }
      return respond(call)
    },
    assertCurrent() {
      assertCurrentCalls += 1
      if (assertCurrentFailure) {
        const failure = assertCurrentFailure
        assertCurrentFailure = null
        throw new HttpError(503, failure)
      }
    },
  }
}

const input = (op, bankId, params) => ({ op, apiUrl: 'http://127.0.0.1:8888', bankId, params })

async function expectStatus(status, promise, fragment) {
  try {
    await promise
  } catch (error) {
    assert.equal(error.status, status, `expected ${status}, got ${error.status}: ${error.message}`)
    if (fragment !== undefined) assert.ok(error.message.includes(fragment), `message should mention ${fragment}: ${error.message}`)
    return
  }
  assert.fail(`expected HttpError ${status}, but execute resolved`)
}

function stableJson(value) {
  if (Array.isArray(value)) return '[' + value.map(stableJson).join(',') + ']'
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',') + '}'
  return JSON.stringify(value ?? null)
}

const revisionOf = (overrides) => createHash('sha256').update(stableJson(overrides)).digest('hex')

// ---------------------------------------------------------------------------
// Fixtures shaped like the 0.10.2 public OpenAPI responses.
// ---------------------------------------------------------------------------

const statsFixture = () => ({
  bank_id: 'user123',
  total_nodes: 150,
  total_links: 300,
  total_documents: 10,
  nodes_by_fact_type: { fact: 100, observation: 20 },
  links_by_link_type: { entity: 50, temporal: 150 },
  links_by_fact_type: { fact: 200 },
  links_breakdown: { fact: { entity: 40, temporal: 100 } },
  pending_operations: 2,
  failed_operations: 0,
  operations_by_status: { pending: 2, completed: 40 },
  last_consolidated_at: '2026-10-01T10:00:00Z',
  last_memory_write_at: '2026-10-13T11:05:00Z',
  pending_consolidation: 0,
  failed_consolidation: 1,
  total_observations: 45,
  secret_debug: { api_key: SECRET },
})

const operationFixture = () => ({
  id: 'op-1',
  task_type: 'retain',
  operation_id: 'op-1',
  operation_type: 'retain',
  items_count: 5,
  document_id: 'doc-9',
  filename: null,
  mental_model_id: null,
  created_at: '2026-10-13T10:30:00Z',
  updated_at: '2026-10-13T10:31:00Z',
  status: 'failed',
  error_message: `boom near ${SECRET}`,
  retry_count: 1,
  next_retry_at: null,
  progress: { stage: 'processing_batch', at: '2026-10-13T10:30:20Z', processed: 3, total: 5, detail: { round: 1 }, extra: 'x' },
  details: { operation_type: 'refresh_mental_model', outcome: 'content_written', failure_reason: null },
  task_payload: { messages: ['raw submission params'] },
  result_metadata: { download_url: 'http://127.0.0.1:8888/v1/default/files/download/leak', nested_key: SECRET },
  download_url: 'http://127.0.0.1:8888/v1/default/files/download/leak',
})

const configFixture = () => ({
  bank_id: 'user123',
  config: {
    retain_mission: '保留技术细节',
    retain_extraction_mode: 'verbose',
    enable_auto_consolidation: true,
    recall_budget_min: 20,
    recall_budget_max: 60,
    disposition_skepticism: 3,
    audit_log_enabled: true,
    entity_labels: { attributes: [] },
    memory_defense: { enabled: true, rules: [{ on: 'sensitive_data', action: 'redact' }] },
    unknown_future_field: { keep: true },
    cloud_secret_field: { api_key: SECRET },
  },
  overrides: {
    retain_mission: '保留技术细节',
    recall_budget_min: 20,
    disposition_skepticism: 3,
    future_secret_override: 'do-not-leak',
  },
})

const aliasesFixture = () => ({
  bank_id: 'user123',
  aliases: [
    { alias: 'user-123', primary: true },
    { alias: '部门记忆库', primary: false },
  ],
})

const promptPreviewFixture = () => ({
  messages: [
    {
      role: 'system',
      blocks: [
        { text: 'bank agnostic preamble', source: 'builtin', field: '', section: 'bank_identity', heading: '身份', active: true, value: null, kind: 'text', editable: false },
        { text: `mission with ${SECRET}`, source: 'config', field: 'retain_mission', section: '', heading: '', active: true, value: 'mission with key', kind: 'text', editable: true, choices: null },
      ],
    },
    { role: 'user', blocks: [{ text: 'fixed placeholder', source: 'builtin', field: '', section: '', heading: '', active: true, value: null, kind: 'text', editable: false }] },
  ],
  strategy: 'default',
  strategies: ['default', 'concise'],
  run_settings: [
    { field: 'retain_chunk_size', value: '3000', kind: 'complex', editable: true },
  ],
  response_schema: { type: 'object' },
  skipped_reason: null,
})

const dryRunFixture = () => ({
  facts: [
    {
      text: '用户偏好深色模式',
      fact_type: 'preference',
      occurred_start: '2026-10-13T10:00:00Z',
      occurred_end: null,
      entities: ['用户', '深色模式'],
      chunk_index: 0,
      attachments: [{ block_index: 1, type: 'image', media_type: 'image/png' }],
      secret_field: SECRET,
    },
  ],
  chunks: [{ text: 'chunk one', fact_count: 1 }],
  usage: { input_tokens: 1500, output_tokens: 500, total_tokens: 2000, cached_tokens: 0, thoughts_tokens: 0 },
})

const llmHealthFixture = () => ({
  bank_id: 'user123',
  operations: [
    { operation: 'retain', ok: true, status: 'connected', latency_ms: 412 },
    { operation: 'consolidation', ok: true, status: 'connected', latency_ms: 412 },
    { operation: 'reflect', ok: false, status: 'not_configured', latency_ms: null },
  ],
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const tests = []
const test = (name, fn) => tests.push({ name, fn })

test('工厂缺少依赖时抛 TypeError', () => {
  assert.throws(() => createManagementService({ redact }), TypeError)
  assert.throws(() => createManagementService({ HttpError }), TypeError)
})

test('未知操作与基础参数校验', async () => {
  const client = makeClient()
  await expectStatus(400, service.execute(client, input('nonsense', 'user123')), '不支持的管理操作')
  await expectStatus(400, service.execute(client, input('stats')), 'bankId')
  await expectStatus(400, service.execute(client, input('stats', 'a/b')), '斜杠')
  await expectStatus(400, service.execute(client, input('stats', 'a\\b')), '斜杠')
  await expectStatus(400, service.execute(client, input('stats', '.')), '点路径')
  await expectStatus(400, service.execute(client, input('stats', 'bad\u0007id')), '控制字符')
  await expectStatus(400, service.execute(client, input('stats', 'x'.repeat(193))), '192')
  await expectStatus(400, service.execute(client, { op: 'stats', bankId: 'user123', params: 'nope' }), 'params 必须是对象')
})

test('stats：投影白名单字段并丢弃未知键', async () => {
  const client = makeClient({ respond: () => statsFixture() })
  const data = await service.execute(client, input('stats', 'user123'))
  assert.equal(data.total_nodes, 150)
  assert.equal(data.bank_id, 'user123')
  assert.equal(data.pending_consolidation, 0)
  assert.equal('secret_debug' in data, false, '未知键不得透传')
  assert.equal(client.calls.length, 1)
  assert.equal(client.calls[0].path, '/v1/default/banks/user123/stats')
  assert.equal(client.calls[0].timeoutMs, 30000)
})

test('stats：refresh 布尔门控', async () => {
  const client = makeClient({ respond: () => statsFixture() })
  await service.execute(client, input('stats', 'user123', { refresh: true }))
  assert.equal(client.calls[0].path, '/v1/default/banks/user123/stats?refresh=true')
  await expectStatus(400, service.execute(client, input('stats', 'user123', { refresh: 'yes' })), 'refresh')
  await expectStatus(400, service.execute(client, input('stats', 'user123', { limit: 5 })), '不支持参数')
})

test('stats：上游响应缺必需字段时报 502，不伪造成功', async () => {
  const client = makeClient({ respond: () => ({ bank_id: 'user123', total_nodes: 1 }) })
  await expectStatus(502, service.execute(client, input('stats', 'user123')), 'total_links')
})

test('operations：投影条目并永远丢弃 task_payload/result_metadata/下载 URL', async () => {
  const client = makeClient({ respond: () => ({ bank_id: 'user123', total: 1, limit: 20, offset: 0, operations: [operationFixture()] }) })
  const data = await service.execute(client, input('operations', 'user123'))
  assert.equal(data.total, 1)
  const [item] = data.operations
  assert.equal(item.id, 'op-1')
  assert.equal(item.progress.processed, 3)
  assert.equal(item.progress.detail.round, 1)
  assert.equal('extra' in item.progress, false)
  assert.ok(item.error_message.includes('[REDACTED]'), '错误消息须经脱敏')
  assert.equal('task_payload' in item, false)
  assert.equal('result_metadata' in item, false)
  assert.equal('download_url' in item, false)
})

test('operations：过滤参数白名单与取值校验（type 为开放安全标识符）', async () => {
  const client = makeClient({ respond: () => ({ bank_id: 'user123', total: 0, limit: 20, offset: 0, operations: [] }) })
  await service.execute(client, input('operations', 'user123', { status: 'failed', type: 'clone_bank', limit: 100, offset: 10, excludeParents: true }))
  assert.equal(client.calls[0].path, '/v1/default/banks/user123/operations?status=failed&type=clone_bank&limit=100&offset=10&exclude_parents=true')
  await service.execute(client, input('operations', 'user123', { type: 'bank_transfer_export' }))
  assert.ok(client.calls.some((call) => call.path.includes('type=bank_transfer_export')), '未来迁移任务类型不得被枚举排除')
  await expectStatus(400, service.execute(client, input('operations', 'user123', { status: 'exploded' })), 'status')
  await expectStatus(400, service.execute(client, input('operations', 'user123', { type: 'Bad Type!' })), 'type')
  await expectStatus(400, service.execute(client, input('operations', 'user123', { type: 'bank transfer' })), 'type')
  await expectStatus(400, service.execute(client, input('operations', 'user123', { type: 'x'.repeat(65) })), 'type')
  await expectStatus(400, service.execute(client, input('operations', 'user123', { type: 'RETAIN' })), 'type')
  await expectStatus(400, service.execute(client, input('operations', 'user123', { limit: 0 })), 'limit')
  await expectStatus(400, service.execute(client, input('operations', 'user123', { limit: 101 })), 'limit')
  await expectStatus(400, service.execute(client, input('operations', 'user123', { offset: -1 })), 'offset')
  await expectStatus(400, service.execute(client, input('operations', 'user123', { excludeParents: 'yes' })), 'excludeParents')
  await expectStatus(400, service.execute(client, input('operations', 'user123', { page: 1 })), '不支持参数')
})

test('operation：单任务读取不请求 payload，敏感元数据不透传', async () => {
  const client = makeClient({ respond: () => operationFixture() })
  const data = await service.execute(client, input('operation', 'user123', { operationId: 'op-1' }))
  assert.equal(data.operation_id, 'op-1')
  assert.equal(data.status, 'failed')
  assert.ok(!client.calls[0].path.includes('include_payload'))
  assert.equal('task_payload' in data, false)
  assert.equal('result_metadata' in data, false)
  await expectStatus(400, service.execute(client, input('operation', 'user123')), 'operationId')
  await expectStatus(400, service.execute(client, input('operation', 'user123', { operationId: 'a/b' })), '非法字符')
})

test('operation：status=not_found 与缺 status 的响应分别透传/报 502', async () => {
  const client = makeClient({ respond: () => ({ operation_id: 'gone', status: 'not_found' }) })
  const data = await service.execute(client, input('operation', 'user123', { operationId: 'gone' }))
  assert.equal(data.status, 'not_found')
  const broken = makeClient({ respond: () => ({ operation_id: 'gone' }) })
  await expectStatus(502, service.execute(broken, input('operation', 'user123', { operationId: 'gone' })), 'operation_id/status')
})

test('bankConfig：config/overrides 仅返回 BANK_FIELDS 白名单，revision 绑定原始全 overrides', async () => {
  const client = makeClient({ respond: () => configFixture() })
  const data = await service.execute(client, input('bankConfig', 'user123'))
  for (const key of Object.keys(data.config)) {
    assert.ok(Object.prototype.hasOwnProperty.call(BANK_FIELDS, key), `config 只允许 BANK_FIELDS：${key}`)
  }
  for (const key of Object.keys(data.overrides)) {
    assert.ok(Object.prototype.hasOwnProperty.call(BANK_FIELDS, key), `overrides 只允许 BANK_FIELDS：${key}`)
  }
  assert.equal('memory_defense' in data.config, false, '未知/策略配置不透传给前端')
  assert.equal('unknown_future_field' in data.config, false)
  assert.equal('cloud_secret_field' in data.config, false, '未来/云侧秘密字段不得暴露')
  assert.equal('future_secret_override' in data.overrides, false, '白名单外 override 不进响应')
  assert.equal(data.config.retain_mission, '保留技术细节')
  assert.equal(data.overrides.recall_budget_min, 20)
  for (const key of Object.keys(data.fields)) {
    assert.ok(Object.prototype.hasOwnProperty.call(BANK_FIELDS, key), `fields 只允许 BANK_FIELDS：${key}`)
  }
  assert.equal(data.fields.retain_mission.hasOverride, true)
  assert.equal(data.fields.retain_mission.overrideValue, '保留技术细节')
  assert.equal(data.fields.enable_auto_consolidation.hasOverride, false)
  assert.equal(data.fields.unknown_future_field, undefined, '未知字段不进可编辑列表')
  assert.equal(data.revision, revisionOf(configFixture().overrides), 'revision 须绑定原始全 overrides（含白名单外键）')
  await expectStatus(400, service.execute(client, input('bankConfig', 'user123', { x: 1 })), '不支持参数')
})

test('bankPatch：revision 匹配时以 updates 外层包装 PATCH，复读并返回新 revision', async () => {
  let configState = configFixture()
  const client = makeClient({
    respond: (call) => {
      if (call.method === 'GET') return configState
      const next = JSON.parse(JSON.stringify(configState))
      next.overrides.retain_mission = '新任务说明'
      next.config.retain_mission = '新任务说明'
      configState = next
      return next
    },
  })
  const data = await service.execute(client, input('bankPatch', 'user123', {
    updates: { retain_mission: '新任务说明' },
    revision: revisionOf(configFixture().overrides),
  }))
  const patch = client.calls.find((call) => call.method === 'PATCH')
  assert.ok(patch, '应发出 PATCH')
  assert.deepEqual(patch.body, { updates: { retain_mission: '新任务说明' } }, 'BankConfigUpdate 必须是 updates 外层包装')
  assert.equal(data.overrides.retain_mission, '新任务说明')
  assert.equal(data.revision, revisionOf({ retain_mission: '新任务说明', recall_budget_min: 20, disposition_skepticism: 3, future_secret_override: 'do-not-leak' }), '响应 revision 绑定全量 overrides')
  assert.ok(client.assertCurrentCalls >= 2, '写前须 assertCurrent')
})

test('bankPatch：null 是官方继承语义（tombstone），原样传递', async () => {
  let configState = configFixture()
  const client = makeClient({
    respond: (call) => {
      if (call.method === 'GET') return configState
      const next = JSON.parse(JSON.stringify(configState))
      delete next.overrides.retain_mission
      configState = next
      return next
    },
  })
  await service.execute(client, input('bankPatch', 'user123', {
    updates: { retain_mission: null },
    revision: revisionOf(configFixture().overrides),
  }))
  const patch = client.calls.find((call) => call.method === 'PATCH')
  assert.deepEqual(patch.body, { updates: { retain_mission: null } })
})

test('bankPatch：revision 不一致返回 409 且不写入', async () => {
  const client = makeClient({ respond: () => configFixture() })
  await expectStatus(409, service.execute(client, input('bankPatch', 'user123', {
    updates: { retain_mission: 'x' },
    revision: '0'.repeat(64),
  })), '刷新')
  assert.equal(client.calls.filter((call) => call.method === 'PATCH').length, 0, '不得发出 PATCH')
})

test('bankPatch：缺 revision/updates 非对象返回 400', async () => {
  const client = makeClient({ respond: () => configFixture() })
  await expectStatus(400, service.execute(client, input('bankPatch', 'user123', { updates: { retain_mission: 'x' } })), 'revision')
  await expectStatus(400, service.execute(client, input('bankPatch', 'user123', { updates: {}, revision: revisionOf({}) })), 'updates')
})

test('bankPatch：白名单外字段（含 memory_defense）拒绝', async () => {
  const client = makeClient({ respond: () => configFixture() })
  const revision = revisionOf(configFixture().overrides)
  await expectStatus(400, service.execute(client, input('bankPatch', 'user123', {
    updates: { memory_defense: { enabled: false } }, revision,
  })), '白名单')
  await expectStatus(400, service.execute(client, input('bankPatch', 'user123', {
    updates: { HINDSIGHT_API_RETAIN_MISSION: 'x' }, revision,
  })), '白名单')
  assert.equal(client.calls.length, 0)
})

test('bankPatch：字段值按类型与官方范围校验', async () => {
  const client = makeClient({ respond: () => configFixture() })
  const revision = revisionOf(configFixture().overrides)
  const base = { revision }
  await expectStatus(400, service.execute(client, input('bankPatch', 'user123', { ...base, updates: { enable_observations: 'yes' } })), '布尔')
  await expectStatus(400, service.execute(client, input('bankPatch', 'user123', { ...base, updates: { retain_extraction_mode: 'fast' } })), 'retain_extraction_mode')
  await expectStatus(400, service.execute(client, input('bankPatch', 'user123', { ...base, updates: { disposition_skepticism: 9 } })), 'disposition_skepticism')
  await expectStatus(400, service.execute(client, input('bankPatch', 'user123', { ...base, updates: { recall_budget_min: 0 } })), 'recall_budget_min')
  await expectStatus(400, service.execute(client, input('bankPatch', 'user123', { ...base, updates: { retain_chunk_size: 0 } })), 'retain_chunk_size')
  await expectStatus(400, service.execute(client, input('bankPatch', 'user123', { ...base, updates: { recall_budget_min: 90, recall_budget_max: 60 } })), 'recall_budget_max')
  await expectStatus(400, service.execute(client, input('bankPatch', 'user123', { ...base, updates: { entity_labels: 'nope' } })), 'entity_labels')
  const ok = makeClient({ respond: () => configFixture() })
  await service.execute(ok, input('bankPatch', 'user123', {
    updates: { disposition_skepticism: 5, recall_budget_min: 10, recall_budget_max: 30, retain_extraction_mode: 'chunks', entity_labels: { attributes: [] } },
    revision,
  }))
  assert.equal(ok.calls.filter((call) => call.method === 'PATCH').length, 1)
})

test('bankPatch：旧版 API 不认识字段（config 无该键）时拒绝盲写', async () => {
  const oldConfig = configFixture()
  delete oldConfig.config.audit_log_enabled
  const client = makeClient({ respond: () => oldConfig })
  await expectStatus(400, service.execute(client, input('bankPatch', 'user123', {
    updates: { audit_log_enabled: false },
    revision: revisionOf(oldConfig.overrides),
  })), '盲写')
  assert.equal(client.calls.filter((call) => call.method === 'PATCH').length, 0)
})

test('bankPatch：bank_config_api 能力关闭返回 403，未发任何请求', async () => {
  const client = makeClient({ features: { bank_config_api: false }, respond: () => configFixture() })
  await expectStatus(403, service.execute(client, input('bankPatch', 'user123', {
    updates: { retain_mission: 'x' }, revision: revisionOf({}),
  })), 'bank_config_api')
  assert.equal(client.calls.length, 0)
})

test('bankPatch：目标在写入前失效（assertCurrent 503）时不写入', async () => {
  const client = makeClient({ respond: () => configFixture() })
  client.failNextAssertCurrent('目标 API 已变化')
  await expectStatus(503, service.execute(client, input('bankPatch', 'user123', {
    updates: { retain_mission: 'x' },
    revision: revisionOf(configFixture().overrides),
  })), '目标 API 已变化')
  assert.equal(client.calls.filter((call) => call.method === 'PATCH').length, 0)
})

test('bankReset：整体 override 删除走 DELETE /config 并投影响应', async () => {
  let configState = configFixture()
  const client = makeClient({
    respond: (call) => {
      configState = { bank_id: 'user123', config: configState.config, overrides: {} }
      return configState
    },
  })
  const data = await service.execute(client, input('bankReset', 'user123'))
  assert.equal(client.calls[0].method, 'DELETE')
  assert.equal(client.calls[0].path, '/v1/default/banks/user123/config')
  assert.deepEqual(data.overrides, {})
  assert.equal(data.revision, revisionOf({}))
  assert.equal('memory_defense' in data.config, false, 'config 投影仅白名单，策略等未知字段不透传')
  assert.ok(data.config.retain_mission, '删除 override 后解析配置的白名单字段仍在')
})

test('bankReset：能力关闭 403 / 多余参数 400', async () => {
  const off = makeClient({ features: { bank_config_api: false }, respond: () => configFixture() })
  await expectStatus(403, service.execute(off, input('bankReset', 'user123')), 'bank_config_api')
  const client = makeClient({ respond: () => configFixture() })
  await expectStatus(400, service.execute(client, input('bankReset', 'user123', { field: 'retain_mission' })), '不支持参数')
})

test('aliases：读取投影 alias/primary', async () => {
  const client = makeClient({ respond: () => aliasesFixture() })
  const data = await service.execute(client, input('aliases', 'user123'))
  assert.equal(data.bank_id, 'user123')
  assert.equal(data.aliases.length, 2)
  assert.deepEqual(data.aliases[0], { alias: 'user-123', primary: true })
  const broken = makeClient({ respond: () => ({ bank_id: 'user123', aliases: [{ primary: true }] }) })
  await expectStatus(502, service.execute(broken, input('aliases', 'user123')), '别名条目')
})

test('aliasAdd：中文别名（UTF-8 ≤192 字节）可用并 URL 编码', async () => {
  const client = makeClient({ respond: () => aliasesFixture() })
  await service.execute(client, input('aliasAdd', 'user123', { alias: '部门记忆库', primary: true }))
  assert.equal(client.calls[0].method, 'POST')
  assert.equal(client.calls[0].path, '/v1/default/banks/user123/aliases')
  assert.deepEqual(client.calls[0].body, { alias: '部门记忆库', primary: true })
  const bare = makeClient({ respond: () => aliasesFixture() })
  await service.execute(bare, input('aliasAdd', 'user123', { alias: '部门记忆库' }))
  assert.deepEqual(bare.calls[0].body, { alias: '部门记忆库' })
})

test('aliasAdd：192 字节边界与非法别名拒绝', async () => {
  const client = makeClient({ respond: () => aliasesFixture() })
  await service.execute(client, input('aliasAdd', 'user123', { alias: '汉'.repeat(64) }))
  await expectStatus(400, service.execute(client, input('aliasAdd', 'user123', { alias: '汉'.repeat(65) })), '192')
  await expectStatus(400, service.execute(client, input('aliasAdd', 'user123', { alias: '../etc' })), '斜杠')
  await expectStatus(400, service.execute(client, input('aliasAdd', 'user123', { alias: '..' })), '点路径')
  await expectStatus(400, service.execute(client, input('aliasAdd', 'user123', { alias: 'x\u0000y' })), '控制字符')
  await expectStatus(400, service.execute(client, input('aliasAdd', 'user123')), 'alias')
})

test('aliasAdd：上游 409 冲突原样透传（受控 HTTP 状态）', async () => {
  const client = makeClient({ respond: () => { throw new HttpError(409, 'name already taken') } })
  await expectStatus(409, service.execute(client, input('aliasAdd', 'user123', { alias: 'taken' })))
})

test('aliasPrimary：PATCH {primary} 到编码后的别名路径', async () => {
  const client = makeClient({ respond: () => aliasesFixture() })
  const data = await service.execute(client, input('aliasPrimary', 'user123', { alias: '部门记忆库', primary: true }))
  assert.equal(client.calls[0].method, 'PATCH')
  assert.equal(client.calls[0].path, `/v1/default/banks/user123/aliases/${encodeURIComponent('部门记忆库')}`)
  assert.deepEqual(client.calls[0].body, { primary: true })
  assert.equal(data.aliases.length, 2)
  await expectStatus(400, service.execute(client, input('aliasPrimary', 'user123', { alias: 'a', primary: 'yes' })), 'primary')
  await expectStatus(400, service.execute(client, input('aliasPrimary', 'user123', { alias: 'a' })), 'primary')
})

test('aliasRemove：DELETE 编码路径；上游 404 透传', async () => {
  const client = makeClient({ respond: () => aliasesFixture() })
  await service.execute(client, input('aliasRemove', 'user123', { alias: 'user-123' }))
  assert.equal(client.calls[0].method, 'DELETE')
  assert.equal(client.calls[0].path, '/v1/default/banks/user123/aliases/user-123')
  const missing = makeClient({ respond: () => { throw new HttpError(404, 'no alias') } })
  await expectStatus(404, service.execute(missing, input('aliasRemove', 'user123', { alias: 'ghost' })))
})

test('promptPreview：仅接受 operation/strategy，消息块保留 source 并脱敏文本', async () => {
  const client = makeClient({ respond: () => promptPreviewFixture() })
  const data = await service.execute(client, input('promptPreview', 'user123', { operation: 'retain', strategy: 'default' }))
  assert.deepEqual(client.calls[0].body, { operation: 'retain', strategy: 'default' })
  assert.equal(data.messages.length, 2)
  const block = data.messages[0].blocks[1]
  assert.equal(block.source, 'config', '块的 source 元数据必须保留')
  assert.equal(block.field, 'retain_mission')
  assert.equal(block.editable, true)
  assert.ok(block.text.includes('[REDACTED]'), '提示词文本须过脱敏')
  assert.deepEqual(data.strategies, ['default', 'concise'])
  assert.equal(data.run_settings[0].field, 'retain_chunk_size')
  assert.deepEqual(data.response_schema, { type: 'object' })
  assert.equal(data.skipped_reason, null)
})

test('promptPreview：operation 默认 retain；mission/sample 覆盖被拒绝', async () => {
  const client = makeClient({ respond: () => promptPreviewFixture() })
  await service.execute(client, input('promptPreview', 'user123'))
  assert.deepEqual(client.calls[0].body, { operation: 'retain' })
  await expectStatus(400, service.execute(client, input('promptPreview', 'user123', { operation: 'nope' })), 'operation')
  await expectStatus(400, service.execute(client, input('promptPreview', 'user123', { mission: 'override' })), 'mission')
  await expectStatus(400, service.execute(client, input('promptPreview', 'user123', { sample_text: 'override' })), 'sample_text')
  await expectStatus(400, service.execute(client, input('promptPreview', 'user123', { operation: 'retain', strategy: 'a\u0000b' })), 'strategy')
})

test('operationRetry：POST retry 路径与结果投影', async () => {
  const client = makeClient({ respond: () => ({ success: true, operation_id: 'op-1', message: 'queued' }) })
  const data = await service.execute(client, input('operationRetry', 'user123', { operationId: 'op-1' }))
  assert.equal(client.calls[0].method, 'POST')
  assert.equal(client.calls[0].path, '/v1/default/banks/user123/operations/op-1/retry')
  assert.deepEqual(data, { success: true, operation_id: 'op-1', message: 'queued' })
  await expectStatus(400, service.execute(client, input('operationRetry', 'user123')), 'operationId')
  const broken = makeClient({ respond: () => ({ success: false, operation_id: 'op-1', message: 'no' }) })
  await expectStatus(502, service.execute(broken, input('operationRetry', 'user123', { operationId: 'op-1' })), '不伪造')
})

test('operationCancel：官方取消是 DELETE /operations/{id}（无 /delete 后缀）', async () => {
  const client = makeClient({ respond: () => ({ success: true, operation_id: 'op-1', message: 'cancelled' }) })
  await service.execute(client, input('operationCancel', 'user123', { operationId: 'op-1' }))
  assert.equal(client.calls[0].method, 'DELETE')
  assert.equal(client.calls[0].path, '/v1/default/banks/user123/operations/op-1')
  assert.ok(!client.calls[0].path.endsWith('/delete'))
})

test('operationDelete：DELETE /operations/{id}/delete', async () => {
  const client = makeClient({ respond: () => ({ success: true, operation_id: 'op-1', message: 'deleted' }) })
  await service.execute(client, input('operationDelete', 'user123', { operationId: 'op-1' }))
  assert.equal(client.calls[0].path, '/v1/default/banks/user123/operations/op-1/delete')
})

test('operationRetry/Cancel/Delete：能力未知名时 require 409 透传', async () => {
  const schema = new Set([...SCHEMA_0_10_2].filter((entry) => !entry.includes('/retry')))
  const client = makeClient({ schema, respond: () => ({ success: true, operation_id: 'op-1', message: 'x' }) })
  await expectStatus(409, service.execute(client, input('operationRetry', 'user123', { operationId: 'op-1' })), '不存在方法')
  assert.equal(client.calls.length, 0)
})

test('dryRun：接受纯文本 content 与候选覆盖字段，收费 120 秒', async () => {
  const client = makeClient({ respond: () => dryRunFixture() })
  const data = await service.execute(client, input('dryRun', 'user123', {
    content: '用户喜欢简洁回复',
    context: '测试会话',
    strategy: 'default',
    retain_mission: '候选任务说明',
    retain_extraction_mode: 'concise',
    retain_chunk_size: 2000,
    entities_allow_free_form: true,
    timestamp: '2026-10-13T12:00:00Z',
  }))
  assert.equal(client.calls[0].timeoutMs, 120000, '干跑是收费动作，120 秒 deadline')
  const body = client.calls[0].body
  assert.equal(body.content, '用户喜欢简洁回复')
  assert.equal(body.retain_extraction_mode, 'concise')
  assert.equal(body.agent_name, undefined, '不得提供已废弃的 agent_name')
  assert.equal(body.retain_extract_causal_links, undefined, '未提供的覆盖不夹带')
  assert.equal(data.facts[0].fact_type, 'preference')
  assert.equal(data.facts[0].attachments[0].media_type, 'image/png')
  assert.equal('secret_field' in data.facts[0], false)
  assert.equal(data.chunks[0].fact_count, 1)
  assert.equal(data.usage.total_tokens, 2000)
})

test('dryRun：agent_name、缺失/空/超长 content、非法候选值拒绝', async () => {
  const client = makeClient({ respond: () => dryRunFixture() })
  await expectStatus(400, service.execute(client, input('dryRun', 'user123', { content: 'x', agent_name: 'bot' })), 'agent_name')
  await expectStatus(400, service.execute(client, input('dryRun', 'user123')), 'content')
  await expectStatus(400, service.execute(client, input('dryRun', 'user123', { content: '   ' })), 'content')
  await expectStatus(400, service.execute(client, input('dryRun', 'user123', { content: 'a'.repeat(30_001) })), '32KiB')
  await expectStatus(400, service.execute(client, input('dryRun', 'user123', { content: 'x', retain_extraction_mode: 'turbo' })), 'retain_extraction_mode')
  await expectStatus(400, service.execute(client, input('dryRun', 'user123', { content: 'x', retain_chunk_size: 0 })), 'retain_chunk_size')
  await expectStatus(400, service.execute(client, input('dryRun', 'user123', { content: 'x', timestamp: 'yesterday' })), 'timestamp')
  await expectStatus(400, service.execute(client, input('dryRun', 'user123', { content: 'x', mission: 'override' })), 'mission')
  await expectStatus(400, service.execute(client, input('dryRun', 'user123', { content: 'x', entity_labels: 'bad' })), 'entity_labels')
})

test('dryRun：上游 422/超时(504)原样透传为受控 HTTP 状态', async () => {
  const unprocessable = makeClient({ responses: [new HttpError(422, 'Validation Error')] })
  await expectStatus(422, service.execute(unprocessable, input('dryRun', 'user123', { content: 'x' })))
  const timedOut = makeClient({ responses: [new HttpError(504, '提取超时')] })
  await expectStatus(504, service.execute(timedOut, input('dryRun', 'user123', { content: 'x' })))
  assert.equal(timedOut.calls[0].timeoutMs, 120000)
})

test('llmTest：bank_llm_health 门控、120 秒 deadline 与投影', async () => {
  const client = makeClient({ respond: () => llmHealthFixture() })
  const data = await service.execute(client, input('llmTest', 'user123'))
  assert.equal(client.calls[0].timeoutMs, 120000)
  assert.equal(client.calls[0].path, '/v1/default/banks/user123/health/llm')
  assert.equal(data.operations.length, 3)
  assert.deepEqual(data.operations[2], { operation: 'reflect', ok: false, status: 'not_configured' })
  assert.equal(data.operations[0].latency_ms, 412)
  const off = makeClient({ features: { bank_llm_health: false }, respond: () => llmHealthFixture() })
  await expectStatus(403, service.execute(off, input('llmTest', 'user123')), 'bank_llm_health')
  assert.equal(off.calls.length, 0)
  const client2 = makeClient({ respond: () => llmHealthFixture() })
  await expectStatus(400, service.execute(client2, input('llmTest', 'user123', { deep: true })), '不支持参数')
})

test('client 抛出非受控错误时包装为 502 且消息脱敏', async () => {
  const client = makeClient({ respond: () => { throw new TypeError(`socket blew up near ${SECRET}`) } })
  try {
    await service.execute(client, input('stats', 'user123'))
    assert.fail('expected 502')
  } catch (error) {
    assert.equal(error.status, 502)
    assert.ok(error.message.includes('[REDACTED]'), '包装消息须经脱敏')
  }
})

test('client 缺少 require/json 能力时立即 502', async () => {
  await expectStatus(502, service.execute({}, input('stats', 'user123')), 'client')
  await expectStatus(502, service.execute({ json: () => {} }, input('stats', 'user123')), 'require/json')
})

test('写操作在动作前调用 assertCurrent（目标变化防护）', async () => {
  const client = makeClient({ respond: () => aliasesFixture() })
  client.failNextAssertCurrent('绑定已变化')
  await expectStatus(503, service.execute(client, input('aliasAdd', 'user123', { alias: 'a1' })), '绑定已变化')
  assert.equal(client.calls.length, 0, 'assertCurrent 失败时不得发出请求')
})

test('operation：非 primitive 走私值被丢弃，文本一律脱敏', async () => {
  const smuggled = {
    operation_id: 'op-2', status: 'failed', operation_type: 'retain', id: 'op-2', task_type: 'retain',
    items_count: 1, created_at: '2026-10-13T10:30:00Z', updated_at: '2026-10-13T10:31:00Z',
    filename: { smuggled: true }, mental_model_id: { smuggled: true }, retry_count: 1,
    error_message: `err near ${SECRET}`,
    details: { outcome: 'content_written', failure_reason: { arbitrary: 'object' }, smuggled: 'x' },
    progress: { stage: `stage_${SECRET}`, at: '2026-10-13T10:30:20Z', processed: 1, total: 2, detail: { round: 1, note: 'str' } },
    child_operations: [{ operation_id: 'op-3', status: 'pending', sub_batch_index: 0, items_count: 2, error_message: `child ${SECRET}`, smuggled: true }],
    task_payload: { x: 1 }, result_metadata: { y: 1 },
  }
  const client = makeClient({ respond: () => smuggled })
  const data = await service.execute(client, input('operation', 'user123', { operationId: 'op-2' }))
  assert.equal('filename' in data, false, '对象走私值不得透传')
  assert.equal('mental_model_id' in data, false)
  assert.ok(data.error_message.includes('[REDACTED]'), '错误消息须脱敏')
  assert.equal(data.details.outcome, 'content_written')
  assert.equal('failure_reason' in data.details, false, '任意对象不得落入 failure_reason')
  assert.equal('smuggled' in data.details, false, 'details 只选已知键')
  assert.ok(data.progress.stage.includes('[REDACTED]'), 'progress 文本须脱敏')
  assert.equal(data.progress.detail.round, 1)
  assert.equal('note' in data.progress.detail, false, 'progress.detail 仅保留数值')
  const child = data.child_operations[0]
  assert.equal(child.sub_batch_index, 0)
  assert.ok(child.error_message.includes('[REDACTED]'))
  assert.equal('smuggled' in child, false)
  assert.equal('task_payload' in data, false)
  assert.equal('result_metadata' in data, false)
})

test('stats：统计映射仅保留有限数值项', async () => {
  const fixture = statsFixture()
  fixture.nodes_by_fact_type = { fact: 100, bad: 'nope', worse: { x: 1 } }
  fixture.links_breakdown = { fact: { entity: 40 }, bad: 'nope' }
  fixture.last_consolidated_at = `at ${SECRET}`
  const client = makeClient({ respond: () => fixture })
  const data = await service.execute(client, input('stats', 'user123'))
  assert.deepEqual(data.nodes_by_fact_type, { fact: 100 })
  assert.deepEqual(data.links_breakdown, { fact: { entity: 40 } })
  assert.ok(data.last_consolidated_at.includes('[REDACTED]'), 'stats 文本须脱敏')
})

test('dryRun：事实文本与实体名一律脱敏、非字符串实体被过滤', async () => {
  const fixture = dryRunFixture()
  fixture.facts[0].text = `提到 ${SECRET} 的偏好`
  fixture.facts[0].entities = ['用户', { smuggled: true }]
  const client = makeClient({ respond: () => fixture })
  const data = await service.execute(client, input('dryRun', 'user123', { content: 'x' }))
  assert.ok(data.facts[0].text.includes('[REDACTED]'), '事实文本须脱敏')
  assert.deepEqual(data.facts[0].entities, ['用户'])
})

test('输入预算：dryRun content 与 bankPatch 文本字段超预算给明确错误', async () => {
  const dr = makeClient({ respond: () => dryRunFixture() })
  await expectStatus(400, service.execute(dr, input('dryRun', 'user123', { content: 'a'.repeat(30_001) })), '32KiB')
  const bp = makeClient({ respond: () => configFixture() })
  await expectStatus(400, service.execute(bp, input('bankPatch', 'user123', {
    updates: { retain_mission: '汉'.repeat(6_000) },
    revision: revisionOf(configFixture().overrides),
  })), '32KiB')
  assert.equal(bp.calls.length, 0, '预算校验在本地完成，未发请求')
})

// ---------------------------------------------------------------------------

let passed = 0
let failed = 0
for (const { name, fn } of tests) {
  try {
    await fn()
    passed += 1
    console.log(`  ok - ${name}`)
  } catch (error) {
    failed += 1
    console.error(`  FAIL - ${name}`)
    console.error(`      ${error?.message ?? error}`)
  }
}
console.log(`\nmanagement-service: ${passed} passed, ${failed} failed`)
process.exitCode = failed > 0 ? 1 : 0
