/** Pure injected runtime tests; never production configuration, credentials or HTTP. */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fixture } from './test-host.mjs'
import { createManagementRuntime } from '../lib/management-runtime.js'

const schema = JSON.parse(readFileSync(new URL('../docs/hindsight-management-contract.json', import.meta.url), 'utf8'))
class HttpError extends Error { constructor(status, message) { super(message); this.status = status } }
const SECRET = 'SYNTHETIC_MANAGEMENT_TOKEN_NOT_REAL'
let passed = 0
async function test(name, action) { await action(); passed++; console.log('PASS '+name) }
async function setup(options = {}) {
  const f = await fixture({ config: { apiUrl: 'https://api.example.invalid/hindsight', ...options.config }, gui: options.gui ?? {}, env: options.env })
  const controller = new AbortController()
  let time = Date.now()
  const calls = []
  const deps = {
    HttpError, controller, env: options.env ?? {}, now: () => time, pluginVersion: 'synthetic-test-version',
    assertActive: () => { if (controller.signal.aborted) throw new HttpError(503, 'disposed') },
    redact: value => String(value).replaceAll(SECRET, '[REDACTED]'), rememberSecret() {},
    apiTarget: f.m.apiTarget,
    readConfig: () => f.m.readJsonFile(f.configPath), readGui: () => f.m.readJsonFile(f.guiPath),
    writeConfig: (patch, record, remove = []) => f.m.atomicMerge(f.configPath, patch, record, f.state, remove),
    writeGui: (patch, record) => f.m.atomicMerge(f.guiPath, patch, record, f.state),
    serializeConfig: action => action(),
    lookupCredential: async name => options.lookup ? options.lookup(name) : { value: SECRET, source: 'synthetic-store:'+name },
    requestJson: async (method, url, body, headers) => {
      calls.push({ method, url, body, headers })
      if (options.request) return options.request(method, url, body, headers)
      if (url.endsWith('/version')) return { api_version: '0.10.2', features: { bank_config_api: true, bank_llm_health: false, document_export_api: true, document_import_api: true, ...options.features } }
      if (url.endsWith('/openapi.json')) return schema
      if (url.endsWith('/health/live')) return { status: 'alive' }
      if (url.endsWith('/health/ready')) return { status: 'healthy' }
      return { ok: true }
    },
    fetch: async () => { throw new Error('Unexpected raw fetch in JSON test') },
  }
  const runtime = createManagementRuntime(deps)
  return { f, runtime, controller, calls, advance: ms => { time += ms },
    input: (op, params = {}, bankId = 'synthetic-bank') => ({ op, apiUrl: 'https://api.example.invalid/hindsight', bankId, params }) }
}
async function confirmation(t, input, extra = {}) {
  return t.runtime.prepare({ ...input, op: 'prepare', params: {
    action: input.op, parameters: input.params,
    typedSubject: input.op === 'saveSettings' ? 'SETTINGS' : input.bankId,
    acceptRisk: true, acceptCost: true, ...extra,
  } })
}

await test('来源区分env/global/dsh，不冒称运行缓存已应用', async () => {
  const t = await setup({ config: { retainSessions: false, harnesses: { dsh: { autoInject: 'recall' }, other: { retainSessions: true } } }, env: { HINDSIGHT_AUTO_INJECT: 'pages' } })
  const data = await t.runtime.settings()
  assert.equal(data.fields.autoInject.value, 'recall')
  assert.equal(data.fields.autoInject.source, 'file:harnesses.dsh')
  assert.equal(data.fields.retainSessions.value, false)
  assert.equal(data.fields.retainSessions.configured, false)
  assert.equal(data.runtimeApplied, 'unknown')
  assert.equal(t.calls.length, 0)
})
await test('scope保存仅修改指定字段，保留其它harness和未知配置', async () => {
  const t = await setup({ config: { untouched: { a: 1 }, retainSessions: false, harnesses: { dsh: { untouched: 2 }, other: { x: 3 } } } })
  const s = await t.runtime.settings()
  await t.runtime.saveSettings(t.input('saveSettings', { scope: 'dsh', patch: { retainSessions: true }, unset: [], configRevision: s.configRevision, guiRevision: s.guiRevision }))
  const raw = JSON.parse(t.f.files.get(t.f.configPath))
  assert.equal(raw.retainSessions, false)
  assert.equal(raw.harnesses.dsh.retainSessions, true)
  assert.equal(raw.harnesses.dsh.untouched, 2)
  assert.deepEqual(raw.harnesses.other, { x: 3 })
  assert.deepEqual(raw.untouched, { a: 1 })
})
await test('global返回继承实际移除字段，不写null覆盖环境', async () => {
  const t = await setup({ config: { autoInject: 'none' }, env: { HINDSIGHT_AUTO_INJECT: 'pages' } })
  const s = await t.runtime.settings({ params: { scope: 'global' } })
  const result = await t.runtime.saveSettings(t.input('saveSettings', { scope: 'global', patch: {}, unset: ['autoInject'], configRevision: s.configRevision, guiRevision: s.guiRevision }))
  assert.ok(!Object.hasOwn(JSON.parse(t.f.files.get(t.f.configPath)), 'autoInject'))
  assert.equal(result.fields.autoInject.value, 'pages')
})
await test('CAS冲突和无效字段不写文件', async () => {
  const t = await setup()
  const s = await t.runtime.settings()
  const before = t.f.files.get(t.f.configPath)
  await assert.rejects(t.runtime.saveSettings(t.input('saveSettings', { patch: { retainSessions: false }, configRevision: 'stale', guiRevision: s.guiRevision })), e => e.status === 409)
  await assert.rejects(t.runtime.saveSettings(t.input('saveSettings', { patch: { apiToken: SECRET }, configRevision: s.configRevision, guiRevision: s.guiRevision })), e => e.status === 400)
  assert.equal(t.f.files.get(t.f.configPath), before)
})
await test('认证只在Host绑定请求header，不进入settings/diagnostics', async () => {
  const t = await setup({ gui: { apiAuth: { mode: 'reference', reference: 'SYNTHETIC_REF', boundBase: 'https://api.example.invalid/hindsight' } } })
  const data = await t.runtime.diagnostics(t.input('diagnostics'))
  assert.equal(data.auth.configured, true)
  assert.equal(t.calls[0].headers.authorization, 'Bearer '+SECRET)
  assert.ok(!JSON.stringify(data).includes(SECRET))
  assert.ok(!JSON.stringify(await t.runtime.settings()).includes(SECRET))
})
await test('明确凭据解析失败不匿名fallback，但本地修复仍可准备保存', async () => {
  const t = await setup({ gui: { apiAuth: { mode: 'reference', reference: 'BROKEN_REF', boundBase: 'https://api.example.invalid/hindsight' } }, lookup: async () => null })
  await assert.rejects(t.runtime.session(t.input('stats')), e => e.status === 412)
  assert.equal(t.calls.length, 0)
  const s = await t.runtime.settings()
  const input = t.input('saveSettings', { patch: {}, unset: [], scope: 'dsh', configRevision: s.configRevision, guiRevision: s.guiRevision, apiAuth: { mode: 'none' } })
  const ticket = await confirmation(t, input)
  const client = await t.runtime.session(input, { probe: false })
  await t.runtime.consume({ ...input, confirmationToken: ticket.confirmationToken }, client)
  const saved = await t.runtime.saveSettings(input)
  assert.equal(saved.apiAuth.mode, 'none')
})
await test('继承token不跨官方候选API目标转发', async () => {
  const t = await setup({ config: { apiToken: SECRET, harnesses: { dsh: { apiUrl: 'https://other.example.invalid' } } } })
  await assert.rejects(t.runtime.session(t.input('stats')), e => e.status === 409)
  assert.equal(t.calls.length, 0)
})
await test('关闭bank写能力仍能读取cfg，clone需要双feature', async () => {
  const t = await setup({ features: { bank_config_api: false, document_import_api: false } })
  const client = await t.runtime.session(t.input('bankConfig'))
  assert.equal(client.capabilities.operations.bankConfig.enabled, true)
  assert.equal(client.capabilities.operations.bankPatch.enabled, false)
  assert.equal(client.capabilities.operations.clone.enabled, false)
  assert.equal(client.capabilities.operations.llmTest.enabled, false)
})
await test('收费动作缺独立确认不签发票据', async () => {
  const t = await setup()
  await assert.rejects(confirmation(t, t.input('dryRun', { content: 'synthetic' }), { acceptCost: false }), e => e.status === 403)
  assert.equal(t.calls.length, 0)
})
await test('确认票据一次性、绑定API/bank/params，过期即拒绝', async () => {
  const t = await setup()
  const input = t.input('operationRetry', { operationId: 'synthetic-operation' })
  const ticket = await confirmation(t, input)
  const client = await t.runtime.session(input)
  await assert.rejects(t.runtime.consume({ ...input, params: { operationId: 'different' }, confirmationToken: ticket.confirmationToken }, client), e => e.status === 403)
  await t.runtime.consume({ ...input, confirmationToken: ticket.confirmationToken }, client)
  await assert.rejects(t.runtime.consume({ ...input, confirmationToken: ticket.confirmationToken }, client), e => e.status === 403)
  const another = await confirmation(t, input)
  t.advance(120001)
  await assert.rejects(t.runtime.consume({ ...input, confirmationToken: another.confirmationToken }, client), e => e.status === 403)
})
await test('目标变化与dispose阻止迟到动作', async () => {
  const t = await setup()
  const input = t.input('operationCancel', { operationId: 'synthetic-operation' })
  const client = await t.runtime.session(input)
  t.f.files.set(t.f.configPath, JSON.stringify({ apiUrl: 'https://other.example.invalid' }))
  await assert.rejects(client.assertCurrent(), e => e.status === 409)
  t.controller.abort(); t.runtime.dispose()
  await assert.rejects(t.runtime.settings(), e => e.status === 503)
})
await test('JSON解析/重定向错误不回传上游片段', async () => {
  const t = await setup({ request: async () => { throw new SyntaxError(SECRET) } })
  const data = await t.runtime.diagnostics(t.input('diagnostics'))
  assert.ok(!JSON.stringify(data).includes(SECRET))
  assert.equal(data.operations.dryRun.enabled, false)
})
console.log(`management-runtime: ${passed} passed; all configuration and HTTP I/O injected.`)
