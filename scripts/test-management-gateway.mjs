/** Actual registered management routes with the existing fully mocked Host fixture. */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fixture } from './test-host.mjs'
const schema = JSON.parse(readFileSync(new URL('../docs/hindsight-management-contract.json', import.meta.url), 'utf8'))
const apiUrl = 'http://127.0.0.1:8888'
let passed = 0
async function test(name, action) { await action(); passed++; console.log('PASS '+name) }
async function setup() {
  const calls = []
  const f = await fixture({ fetch: async (url, init = {}) => {
    calls.push({ url, method: init.method ?? 'GET', body: init.body })
    let payload = {}
    if (url.endsWith('/version')) payload = { api_version: '0.10.2', features: { bank_config_api: true, bank_llm_health: false, document_export_api: true, document_import_api: true } }
    else if (url.endsWith('/openapi.json')) payload = schema
    else if (url.endsWith('/health/live')) payload = { status: 'alive' }
    else if (url.endsWith('/health/ready')) payload = { status: 'healthy' }
    else if (url.endsWith('/health')) payload = { status: 'healthy' }
    else if (url.endsWith('/retry')) payload = { success: true, operation_id: 'op-test', message: 'queued' }
    else if (url.endsWith('/banks')) payload = { banks: [] }
    return { ok: true, status: 200, json: async () => payload }
  } })
  return { f, calls }
}
const input = (op, params = {}, bankId = 'test-bank') => ({ op, apiUrl, bankId, params })
async function prepare(f, action) {
  return f.request('manage', { ...action, op: 'prepare', params: { action: action.op, parameters: action.params,
    typedSubject: action.op === 'saveSettings' ? 'SETTINGS' : action.bankId, acceptRisk: true, acceptCost: true } })
}
await test('GET只读settings不触发上游变更，配置来源可读', async () => {
  const { f, calls } = await setup()
  const res = await f.request('manage?op=settings&apiUrl='+encodeURIComponent(apiUrl))
  assert.equal(res.code, 200)
  assert.equal(res.body.data.scope, 'dsh')
  assert.equal(res.body.data.runtimeApplied, 'unknown')
  assert.equal(calls.length, 0)
  assert.equal(f.writes.length, 0)
  f.ctx.dispose()
})
await test('缺确认票据拒绝写入，prepare+CAS保存保留未知键', async () => {
  const { f } = await setup()
  const s = await f.request('manage?op=settings')
  const action = input('saveSettings', { scope: 'dsh', patch: { retainSessions: false }, unset: [], configRevision: s.body.data.configRevision, guiRevision: s.body.data.guiRevision })
  assert.equal((await f.request('manage', action)).code, 403)
  assert.equal(f.writes.length, 0)
  const ticket = await prepare(f, action)
  assert.equal(ticket.code, 200)
  const saved = await f.request('manage', { ...action, confirmationToken: ticket.body.data.confirmationToken })
  assert.equal(saved.code, 200)
  assert.equal(JSON.parse(f.files.get(f.configPath)).harnesses.dsh.retainSessions, false)
  assert.equal((await f.request('manage', { ...action, confirmationToken: ticket.body.data.confirmationToken })).code, 403)
  f.ctx.dispose()
})
await test('同源/loopback栅栏阻止prepare及副作用', async () => {
  const { f, calls } = await setup()
  const action = input('operationRetry', { operationId: 'op-test' })
  const body = { ...action, op: 'prepare', params: { action: action.op, parameters: action.params, typedSubject: action.bankId, acceptRisk: true, acceptCost: true } }
  assert.equal((await f.request('manage', body, { origin: 'https://foreign.example.invalid' })).code, 403)
  assert.equal((await f.request('manage', body, {}, '192.0.2.20')).code, 403)
  assert.equal(calls.length, 0)
  f.ctx.dispose()
})
await test('GET不能重试，POST不能伪装只读操作', async () => {
  const { f, calls } = await setup()
  assert.equal((await f.request('manage?op=operationRetry&apiUrl='+encodeURIComponent(apiUrl))).code, 400)
  assert.equal((await f.request('manage', input('settings'))).code, 400)
  assert.equal(calls.length, 0)
  f.ctx.dispose()
})
await test('确认绑定参数，实际重试只发送一次且响应不暴露payload', async () => {
  const { f, calls } = await setup()
  const action = input('operationRetry', { operationId: 'op-test' })
  const ticket = await prepare(f, action)
  assert.equal(ticket.code, 200)
  const token = ticket.body.data.confirmationToken
  const changed = await f.request('manage', { ...action, params: { operationId: 'different' }, confirmationToken: token })
  assert.equal(changed.code, 403)
  assert.equal(calls.filter(c => c.method === 'POST').length, 0)
  const result = await f.request('manage', { ...action, confirmationToken: token })
  assert.equal(result.code, 200)
  assert.equal(calls.filter(c => c.method === 'POST').length, 1)
  assert.equal(result.body.data.operation_id, 'op-test')
  f.ctx.dispose()
})
await test('关闭LLM健康能力不发推理POST', async () => {
  const { f, calls } = await setup()
  assert.equal((await prepare(f, input('llmTest'))).code, 403)
  assert.equal(calls.filter(c => c.method === 'POST').length, 0)
  f.ctx.dispose()
})
await test('ZIP不能走JSON入口，缺明确API地址不准备动作', async () => {
  const { f, calls } = await setup()
  assert.equal((await f.request('manage', input('transferImport'))).code, 400)
  assert.equal((await f.request('manage', { op: 'prepare', params: {} })).code, 400)
  assert.equal(calls.length, 0)
  f.ctx.dispose()
})
console.log(`management-gateway: ${passed} passed; actual handlers, synthetic I/O only.`)
