/** Management foundation over the existing host I/O, CAS and credential seams. */
import { createHash, randomUUID } from 'node:crypto'
import { BANK_FIELDS, COST_OPERATIONS, MEMORY_FIELDS, WRITE_OPERATIONS } from './management-contracts.js'

const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key)
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value)
export function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue)
  if (record(value)) return Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])]))
  return value
}
export const fingerprint = value => createHash('sha256').update(JSON.stringify(stableValue(value))).digest('hex')

const ENV_NAMES = {
  autoInject: 'HINDSIGHT_AUTO_INJECT', retainSessions: 'HINDSIGHT_RETAIN_SESSIONS',
  gitIngest: 'HINDSIGHT_GIT_INGEST', autoSeed: 'HINDSIGHT_AUTO_SEED', seedLimit: 'HINDSIGHT_SEED_LIMIT',
  optInOnly: 'HINDSIGHT_OPT_IN_ONLY', optInPaths: 'HINDSIGHT_OPT_IN_PATHS',
  surveyBudgetUsd: 'HINDSIGHT_SURVEY_BUDGET_USD', surveyRefreshCommits: 'HINDSIGHT_SURVEY_REFRESH_COMMITS',
  pageTriggerType: 'HINDSIGHT_PAGE_TRIGGER_TYPE', pageTriggerCron: 'HINDSIGHT_PAGE_TRIGGER_CRON',
  pageSearchLimit: 'HINDSIGHT_PAGE_SEARCH_LIMIT', reflectTimeoutMs: 'HINDSIGHT_REFLECT_TIMEOUT_MS',
  reflectToolTimeoutMs: 'HINDSIGHT_REFLECT_TOOL_TIMEOUT_MS',
  apiUrl: 'HINDSIGHT_API_URL', apiToken: 'HINDSIGHT_API_TOKEN', serverMode: 'HINDSIGHT_SERVER_MODE', apiPort: 'HINDSIGHT_API_PORT',
}
const API_METHODS = {
  stats: ['GET', '/v1/default/banks/{bank_id}/stats'],
  operations: ['GET', '/v1/default/banks/{bank_id}/operations'],
  operation: ['GET', '/v1/default/banks/{bank_id}/operations/{operation_id}'],
  operationRetry: ['POST', '/v1/default/banks/{bank_id}/operations/{operation_id}/retry'],
  operationCancel: ['DELETE', '/v1/default/banks/{bank_id}/operations/{operation_id}'],
  operationDelete: ['DELETE', '/v1/default/banks/{bank_id}/operations/{operation_id}/delete'],
  bankConfig: ['GET', '/v1/default/banks/{bank_id}/config'],
  bankPatch: ['PATCH', '/v1/default/banks/{bank_id}/config', 'bank_config_api'],
  bankReset: ['DELETE', '/v1/default/banks/{bank_id}/config', 'bank_config_api'],
  aliases: ['GET', '/v1/default/banks/{bank_id}/aliases'],
  aliasAdd: ['POST', '/v1/default/banks/{bank_id}/aliases'],
  aliasPrimary: ['PATCH', '/v1/default/banks/{bank_id}/aliases/{alias}'],
  aliasRemove: ['DELETE', '/v1/default/banks/{bank_id}/aliases/{alias}'],
  promptPreview: ['POST', '/v1/default/banks/{bank_id}/prompts/preview'],
  dryRun: ['POST', '/v1/default/banks/{bank_id}/memories/dry-run-extract'],
  llmTest: ['POST', '/v1/default/banks/{bank_id}/health/llm', 'bank_llm_health'],
  transferExport: ['POST', '/v1/default/banks/{bank_id}/transfer/export', 'document_export_api'],
  transferImport: ['POST', '/v1/default/banks/{bank_id}/transfer/import', 'document_import_api'],
  clone: ['POST', '/v1/default/banks/{bank_id}/clone', 'document_export_api'],
  transferDownload: ['GET', '/v1/default/files/download/{key}', 'document_export_api'],
}

/** One effect owns this runtime; no process-global queues, secrets or timers. */
export function createManagementRuntime(deps) {
  const { HttpError, redact, controller } = deps
  const fail = (status, message) => { throw new HttpError(status, message) }
  const check = () => deps.assertActive()
  const env = deps.env ?? {}
  const tickets = new Map()
  const now = deps.now ?? Date.now

  async function records() {
    check()
    const [config, gui] = await Promise.all([deps.readConfig(), deps.readGui()])
    if (config.error || gui.error) fail(409, config.error ?? gui.error)
    return { config, gui }
  }
  function layers(raw, scope) {
    const global = raw
    const harnesses = record(raw.harnesses) ? raw.harnesses : {}
    const dsh = record(harnesses.dsh) ? harnesses.dsh : {}
    return scope === 'global' ? [global] : [global, dsh]
  }
  function candidate(raw, key, scope = 'dsh') {
    let value
    let source = 'builtin:0.8.1'
    const name = ENV_NAMES[key]
    if (name && typeof env[name] === 'string' && env[name].trim() !== '') {
      value = env[name]
      source = `env:${name}`
      const field = MEMORY_FIELDS[key]
      if (field?.kind === 'boolean') value = ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
      else if (field?.kind === 'lines') value = value.split(',').map(item => item.trim()).filter(Boolean)
      else if (field?.kind === 'integer' || field?.kind === 'number' || key === 'apiPort') value = Number(value)
    }
    const entries = layers(raw, scope)
    entries.forEach((layer, index) => {
      if (own(layer, key)) { value = layer[key]; source = index ? 'file:harnesses.dsh' : 'file:global' }
    })
    return { value, source, configured: own(entries.at(-1), key) }
  }
  function effectiveApi(raw) {
    const mode = candidate(raw, 'serverMode').value
    const port = candidate(raw, 'apiPort').value || 9077
    return mode === 'daemon' ? `http://127.0.0.1:${port}` : candidate(raw, 'apiUrl').value ?? 'https://api.hindsight.vectorize.io'
  }
  function validateField(key, value) {
    if (!own(MEMORY_FIELDS, key)) fail(400, '不支持的记忆行为字段')
    const field = MEMORY_FIELDS[key]
    if (field.kind === 'boolean' && typeof value !== 'boolean') fail(400, `${field.label}必须是布尔值`)
    if (field.kind === 'choice' && !field.choices.includes(value)) fail(400, `${field.label}不在允许范围`)
    if (field.kind === 'integer' || field.kind === 'number') {
      if (typeof value !== 'number' || !Number.isFinite(value) || (field.kind === 'integer' && !Number.isInteger(value)) || value < field.min || value > 1_800_000) fail(400, `${field.label}数值无效`)
    }
    if (field.kind === 'text' && (typeof value !== 'string' || value.length > 256 || /[\r\n\0]/.test(value))) fail(400, `${field.label}格式无效`)
    if (field.kind === 'lines' && (!Array.isArray(value) || value.length > 100 || value.some(item => typeof item !== 'string' || !item.trim() || item.length > 1024 || /[\r\n\0]/.test(item)))) fail(400, `${field.label}列表无效`)
    if (key === 'pageTriggerCron' && value.trim().split(/\s+/).length !== 5) fail(400, 'Cron需为五个字段；可用 H * * * *')
    return value
  }
  async function authFor(config, gui, base, tolerate = false) {
    const auth = record(gui.apiAuth) ? gui.apiAuth : { mode: 'inherit' }
    const mode = auth.mode ?? 'inherit'
    let token = null
    let source = 'none'
    let error = null
    try {
      if (!['inherit', 'none', 'reference'].includes(mode)) fail(409, '已保存的API认证方式无效')
      if (mode === 'reference') {
        if (auth.boundBase !== base) fail(409, 'API认证引用绑定的地址已变化，请重新确认保存认证设置')
        if (typeof auth.reference !== 'string' || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(auth.reference)) fail(409, 'API凭据引用格式无效')
        const resolved = await deps.lookupCredential(auth.reference)
        if (!resolved?.value) fail(412, 'API凭据引用无法解析；不会退回无认证请求')
        token = resolved.value
        source = resolved.source
      } else if (mode === 'inherit') {
        const inherited = candidate(config, 'apiToken')
        if (typeof inherited.value === 'string' && inherited.value.trim()) {
          const expected = deps.apiTarget({ apiUrl: effectiveApi(config) }).base
          if (expected !== base) fail(409, '官方集成候选地址与本页实例不同，拒绝跨实例转发继承token')
          token = inherited.value.trim()
          source = inherited.source
        }
      }
      if (token) deps.rememberSecret(token)
    } catch (failure) {
      if (!tolerate) throw failure
      error = redact(failure.message)
    }
    return { token, public: { mode, reference: typeof auth.reference === 'string' ? auth.reference : '', boundBase: auth.boundBase ?? null, configured: token !== null, source, error } }
  }
  async function settings(input = {}) {
    const { config, gui } = await records()
    const scope = input.params?.scope ?? 'dsh'
    if (!['dsh', 'global'].includes(scope)) fail(400, '设置scope无效')
    const fields = {}
    for (const [key, field] of Object.entries(MEMORY_FIELDS)) {
      const current = candidate(config.values, key, scope)
      let value = current.value
      if (value === undefined || value === null) { value = field.default ?? ''; if (current.value == null) current.source = 'builtin:0.8.1' }
      if (key === 'reflectToolTimeoutMs' && current.value == null) value = Math.max(Number(candidate(config.values, 'reflectTimeoutMs', scope).value) || 0, 330000)
      fields[key] = { value, configured: current.configured, source: current.source }
    }
    const base = deps.apiTarget(config.values).base
    const auth = await authFor(config.values, gui.values, base, true)
    return { scope, configRevision: config.revision, guiRevision: gui.revision, fields, apiAuth: auth.public,
      runtimeApplied: 'unknown', warnings: ['仅显示配置候选值和来源；官方DSH适配器缓存工作区，保存不保证下一轮生效。', '知识页刷新设置只影响新建页面，不迁移已有页面。'],
      candidateApiUrl: redact(String(effectiveApi(config.values))) }
  }
  async function saveSettings(input) {
    const params = input.params ?? {}
    return deps.serializeConfig(async () => {
      const { config, gui } = await records()
      const target = deps.apiTarget(config.values)
      if (input.apiUrl !== target.base) fail(409, 'API地址变化，请重新读取设置')
      if (params.configRevision !== config.revision || params.guiRevision !== gui.revision) fail(409, '配置已变化，请重新读取；草稿未保存')
      const scope = params.scope ?? 'dsh'
      if (!['global', 'dsh'].includes(scope) || !record(params.patch ?? {}) || !Array.isArray(params.unset ?? [])) fail(400, '设置patch/scope/unset无效')
      const patch = {}
      for (const [key, value] of Object.entries(params.patch ?? {})) patch[key] = validateField(key, value)
      const unset = params.unset ?? []
      for (const key of unset) if (typeof key !== 'string' || !own(MEMORY_FIELDS, key) || own(patch, key)) fail(400, '继承字段无效或与patch冲突')
      let guiPatch = null
      if (own(params, 'apiAuth')) {
        const auth = params.apiAuth
        if (!record(auth) || Object.keys(auth).some(key => !['mode', 'reference'].includes(key)) || !['inherit', 'none', 'reference'].includes(auth.mode)) fail(400, 'API认证设置无效')
        if (auth.mode === 'reference' && (typeof auth.reference !== 'string' || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(auth.reference))) fail(400, 'API认证仅允许凭据引用名，不接受明文token或URL')
        guiPatch = { apiAuth: { mode: auth.mode, reference: auth.mode === 'reference' ? auth.reference : '', boundBase: target.base } }
      }
      const changed = Object.keys(patch).length > 0 || unset.length > 0
      if (!changed && !guiPatch) fail(400, '没有改变的设置')
      const savedFiles = []
      try {
        if (changed) {
          if (scope === 'dsh') {
            if (config.values.harnesses !== undefined && !record(config.values.harnesses)) fail(409, '原harnesses不可识别，拒绝覆盖')
            const harnesses = { ...config.values.harnesses }
            if (harnesses.dsh !== undefined && !record(harnesses.dsh)) fail(409, '原DSH配置不可识别，拒绝覆盖')
            const dsh = { ...harnesses.dsh, ...patch }
            for (const key of unset) delete dsh[key]
            harnesses.dsh = dsh
            await deps.writeConfig({ harnesses }, config)
          } else await deps.writeConfig(patch, config, unset)
          savedFiles.push('记忆行为')
        }
        check()
        if (guiPatch) { await deps.writeGui(guiPatch, gui); savedFiles.push('API认证') }
      } catch (failure) {
        if (savedFiles.length) fail(failure.status ?? 500, `${savedFiles.join('、')}已保存，其余未完成；请重读核对`)
        throw failure
      }
      return { ...await settings({ params: { scope } }), saved: savedFiles }
    })
  }

  async function session(input = {}, { probe = true } = {}) {
    const { config, gui } = await records()
    const target = deps.apiTarget(config.values)
    if (input.apiUrl !== undefined && input.apiUrl !== target.base) fail(409, 'API地址已变化，请刷新后再操作')
    // Local settings repair must remain possible when the old credential reference is broken.
    const auth = probe ? await authFor(config.values, gui.values, target.base) : { token: null, public: null }
    const identity = fingerprint({ base: target.base, token: auth.token, auth: gui.values.apiAuth ?? null })
    const headers = auth.token ? { authorization: `Bearer ${auth.token}` } : {}
    async function assertCurrent() {
      check()
      const latest = await records()
      if (deps.apiTarget(latest.config.values).base !== target.base) fail(409, '操作期间API目标变化；拒绝继续')
      const currentAuth = probe ? await authFor(latest.config.values, latest.gui.values, target.base) : { token: null }
      if (fingerprint({ base: target.base, token: currentAuth.token, auth: latest.gui.values.apiAuth ?? null }) !== identity) fail(409, '操作期间API认证变化；请重新确认')
    }
    const urlFor = path => {
      if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || /[\r\n\0]/.test(path)) fail(400, '只允许绑定API的相对路径')
      const segments = path.split('?')[0].split('/')
      for (const segment of segments) {
        let decoded
        try { decoded = decodeURIComponent(segment) } catch { fail(400, '请求路径编码无效') }
        if (decoded === '.' || decoded === '..' || decoded.includes('\\')) fail(400, '请求路径不安全')
      }
      const url = new URL(target.base + path)
      const base = new URL(target.base)
      if (url.origin !== base.origin || (base.pathname !== '/' && !url.pathname.startsWith(base.pathname + '/'))) fail(400, '请求越出绑定API')
      return url.href
    }
    const client = {
      base: target.base, signal: controller.signal, identity, auth: auth.public,
      capabilities: { apiVersion: null, features: {}, operations: {} }, paths: {}, assertCurrent,
      async json(method, path, body, options = {}) {
        await assertCurrent()
        try {
          return await deps.requestJson(method, urlFor(path), body, headers, options.timeoutMs ?? 30000, controller.signal)
        } catch (error) {
          if (error?.status >= 300 && error.status < 400) fail(502, '拒绝上游重定向，未转发认证')
          if (typeof error?.status === 'number') throw error
          if (controller.signal.aborted) fail(503, '插件已停用')
          fail(error?.name === 'AbortError' || error?.name === 'TimeoutError' ? 504 : 502, '上游连接或JSON响应失败；原始正文不回传，结果不明需刷新')
        }
      },
      async request(method, path, options = {}) {
        await assertCurrent()
        const response = await deps.fetch(urlFor(path), { method, headers: { ...options.headers, ...headers }, body: options.body,
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(options.timeoutMs ?? 120000)]), redirect: 'manual' })
        if (!response.ok) fail(response.status >= 300 && response.status < 400 ? 502 : response.status, `Hindsight请求失败（HTTP ${response.status}）；未转发错误正文或跟随重定向`)
        return response
      },
      require(method, path, feature) {
        if (!record(client.paths[path]) || !record(client.paths[path][method.toLowerCase()])) fail(409, '当前API未提供此接口；不能仅凭文档开放')
        if (feature && client.capabilities.features[feature] !== true) fail(403, `部署能力${feature}未开启或未知`)
      },
    }
    if (probe) {
      const [version, schema] = await Promise.all([client.json('GET', '/version'), client.json('GET', '/openapi.json')])
      if (!record(version) || typeof version.api_version !== 'string' || !record(version.features) || !record(schema?.paths)) fail(502, '版本/能力契约无效，管理动作禁用')
      client.paths = schema.paths
      client.capabilities.apiVersion = version.api_version
      client.capabilities.features = Object.fromEntries(Object.entries(version.features).filter(([key, value]) => /^[a-z_]+$/.test(key) && typeof value === 'boolean'))
      for (const [op, [method, path, feature]] of Object.entries(API_METHODS)) {
        let enabled = true, reason = null
        try {
          client.require(method, path, feature)
          if (op === 'clone') client.require(method, path, 'document_import_api')
          if (op === 'transferImport' && (typeof FormData !== 'function' || typeof Blob !== 'function')) fail(409, '宿主缺少FormData/Blob能力')
        } catch (error) { enabled = false; reason = redact(error.message) }
        client.capabilities.operations[op] = { enabled, reason }
      }
      client.capabilities.operations.saveSettings = { enabled: true, reason: null }
    }
    return client
  }
  function ticketIntent(input, identity) {
    return fingerprint({ op: input.op, apiUrl: input.apiUrl, bankId: input.bankId ?? null, params: input.params ?? {}, identity })
  }
  async function prepare(input) {
    const p = input.params
    if (!record(p) || !WRITE_OPERATIONS.includes(p.action) || !record(p.parameters ?? {})) fail(400, '确认动作/参数无效')
    const subject = p.action === 'saveSettings' ? 'SETTINGS' : input.bankId
    if (typeof subject !== 'string' || !subject || p.typedSubject !== subject || p.acceptRisk !== true) fail(403, '需输入确切目标并确认风险')
    if (COST_OPERATIONS.includes(p.action) && p.acceptCost !== true) fail(403, '需单独确认费用/资源风险')
    const client = await session(input, { probe: p.action !== 'saveSettings' })
    if (p.action !== 'saveSettings' && client.capabilities.operations[p.action]?.enabled !== true) fail(403, client.capabilities.operations[p.action]?.reason ?? '能力未知，动作禁用')
    for (const [token, entry] of tickets) if (entry.expiresAt <= now()) tickets.delete(token)
    if (tickets.size >= 128) fail(429, '等待确认的动作过多，请稍后重试')
    const token = randomUUID()
    tickets.set(token, { expiresAt: now() + 120000, intent: ticketIntent({ ...input, op: p.action, params: p.parameters }, client.identity) })
    return { confirmationToken: token, expiresAt: new Date(now() + 120000).toISOString(), action: p.action }
  }
  async function consume(input, client) {
    const token = input.confirmationToken
    const entry = typeof token === 'string' ? tickets.get(token) : null
    if (!entry || entry.expiresAt <= now() || entry.intent !== ticketIntent(input, client.identity)) fail(403, '确认令牌缺失、过期或与目标/参数不一致；请重新确认')
    tickets.delete(token)
    await client.assertCurrent()
  }
  async function diagnostics(input) {
    const result = { pluginVersion: deps.pluginVersion ?? 'unknown', apiVersion: null, features: {}, operations: {},
      liveness: { state: 'unknown' }, readiness: { state: 'unknown' }, auth: null,
      memory: { runtimeApplied: 'unknown', source: 'saved configuration candidate, not cached RuntimeCore' }, warnings: [] }
    try {
      const client = await session(input)
      Object.assign(result, client.capabilities)
      result.auth = client.auth
      for (const [key, path] of [['liveness', '/health/live'], ['readiness', '/health/ready']]) {
        try {
          const value = await client.json('GET', path, undefined, { timeoutMs: 6000 })
          const expected = key === 'liveness' ? ['alive', 'healthy', 'ok'] : ['healthy', 'ok']
          result[key] = { state: expected.includes(value?.status) ? 'ok' : 'error', status: typeof value?.status === 'string' ? redact(value.status) : null }
        } catch (failure) { result[key] = { state: 'error', error: redact(failure.message) } }
      }
    } catch (failure) {
      result.warnings.push(redact(failure.message))
      const { config, gui } = await records()
      result.auth = (await authFor(config.values, gui.values, deps.apiTarget(config.values).base, true)).public
      for (const op of Object.keys(API_METHODS)) result.operations[op] = { enabled: false, reason: '版本/能力或认证读取失败' }
    }
    result.operations.saveSettings = { enabled: true, reason: null }
    result.warnings.push('存活和就绪不证明LLM/向量链路成功；既有工作区运行配置无法从保存文件反推。')
    return result
  }
  function dispose() { tickets.clear() }
  return { session, settings, saveSettings, diagnostics, prepare, consume, dispose, validateField }
}
