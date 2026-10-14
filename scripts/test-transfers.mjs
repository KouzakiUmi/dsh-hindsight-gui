/** Worker B（迁移与二进制）离线回归。上游 API 会话、请求与响应全部为内存 fake，无网络、无文件写入。 */
import assert from 'node:assert/strict'
import { EventEmitter, getEventListeners } from 'node:events'
import { createHash } from 'node:crypto'
import { createTransferService, readZipBody as standaloneReadZipBody } from '../lib/transfer-service.js'
import { UPLOAD_LIMIT, DOWNLOAD_LIMIT } from '../lib/management-contracts.js'

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status }
}
const redact = (value) => String(value ?? '').split('SECRET-TOKEN').join('[REDACTED]')
const service = createTransferService({ HttpError, redact })

/** 合成 ZIP：本地文件头 magic + 内容（fake 上游不解压，仅校验 magic）。 */
function makeZip(content = 'hello hindsight') {
  return Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from(content)])
}
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
const importParams = (bytes, extra = {}) => ({
  mode: 'restore',
  targetBankId: 'new-bank',
  includeData: true,
  includeBankConfig: true,
  includeHistory: false,
  fileSize: bytes.byteLength,
  fileSha256: sha256(bytes),
  ...extra,
})

const DOWNLOAD_URL = '/v1/default/files/download/banks/bank-a/exports/op-export-1/transfer.zip'

/** 共享 API 会话 fake：记录 require/json/request/assertCurrent 调用；assertCurrent 为异步（与真实会话一致）。 */
function makeClient(overrides = {}) {
  const features = overrides.features ?? { document_export_api: true, document_import_api: true }
  const calls = { require: [], json: [], request: [], assertCurrent: 0 }
  const client = {
    base: overrides.base ?? 'http://127.0.0.1:8888',
    signal: undefined,
    capabilities: { apiVersion: '0.10.2', features, operations: {} },
    require(method, pathTemplate, feature) {
      calls.require.push({ method, pathTemplate, feature })
      if (feature && !features[feature]) throw new HttpError(403, `上游功能 ${feature} 未启用`)
    },
    async json(method, path, body, opts) {
      calls.json.push({ method, path, body, opts })
      if (overrides.json) return overrides.json({ method, path, body, opts })
      if (path.includes('/operations/')) {
        return {
          operation_id: 'op-export-1',
          status: 'completed',
          result_metadata: { download_url: DOWNLOAD_URL, storage_key: 'banks/bank-a/exports/op-export-1/transfer.zip', byte_size: 1024, filename: 'bank-a-transfer.zip' },
        }
      }
      return { operation_id: 'op-submit-1', status: 'pending' }
    },
    async request(method, path, opts) {
      calls.request.push({ method, path, opts })
      if (overrides.request) return overrides.request({ method, path, opts })
      if (path.includes('/transfer/import')) return { ok: true, status: 202, json: async () => ({ operation_id: 'op-import-1', status: 'pending' }) }
      return { ok: true, status: 200, body: {} }
    },
    async assertCurrent() {
      calls.assertCurrent += 1
      if (overrides.assertCurrentImpl) return overrides.assertCurrentImpl()
      if (overrides.assertError) throw overrides.assertError
    },
  }
  return { client, calls }
}

function fakeReq(headers = {}) {
  const req = new EventEmitter()
  req.headers = headers
  req.destroyed = false
  req.destroy = () => { req.destroyed = true }
  return req
}

function assertNoListeners(req, signal) {
  for (const name of ['data', 'end', 'error', 'aborted', 'close']) {
    assert.equal(req.listenerCount(name), 0, `监听器未清理：${name}`)
  }
  if (signal) assert.equal(getEventListeners(signal, 'abort').length, 0, 'abort 监听器未清理')
}

async function withTimerTracking(run) {
  const created = []
  const cleared = new Set()
  const origSet = globalThis.setTimeout
  const origClear = globalThis.clearTimeout
  globalThis.setTimeout = (fn, ms, ...args) => { const timer = origSet(fn, ms, ...args); created.push(timer); return timer }
  globalThis.clearTimeout = (timer) => { cleared.add(timer); origClear(timer) }
  try {
    const result = await run()
    return { result, created, cleared }
  } finally {
    globalThis.setTimeout = origSet
    globalThis.clearTimeout = origClear
  }
}

const rejects = async (promise, status, includes) => {
  let error = null
  await promise.then(() => { throw new Error('应当抛出错误但成功返回') }, (caught) => { error = caught })
  assert.ok(error instanceof HttpError || error?.status !== undefined, `错误缺少 status：${error}`)
  assert.equal(error.status, status, `期望 status ${status}，实际 ${error.status}：${error.message}`)
  if (includes !== undefined) assert.ok(error.message.includes(includes), `错误信息应包含「${includes}」：${error.message}`)
  return error
}

/** 收集测试期间的未处理拒绝（await 缺失或监听泄漏都会暴露在这里）。 */
async function expectNoUnhandledRejection(run) {
  const unhandled = []
  const onUnhandled = (reason) => unhandled.push(reason)
  process.on('unhandledRejection', onUnhandled)
  try {
    const result = await run()
    await new Promise((resolve) => setImmediate(resolve))
    await new Promise((resolve) => setImmediate(resolve))
    return { result, unhandled }
  } finally {
    process.off('unhandledRejection', onUnhandled)
  }
}

const tests = []
const test = (name, fn) => tests.push({ name, fn })

/* ---------------- 工厂与入口分发 ---------------- */

test('工厂缺少 HttpError/redact 注入时抛 TypeError', () => {
  assert.throws(() => createTransferService({}), TypeError)
  assert.throws(() => createTransferService({ HttpError }), TypeError)
  assert.throws(() => createTransferService({ redact }), TypeError)
})

test('未知 op / 缺少 bankId / 缺少 client / params 非对象被拒绝', async () => {
  const { client, calls } = makeClient()
  await rejects(service.execute(client, { op: 'aliases', bankId: 'bank-a' }), 400)
  await rejects(service.execute(client, { op: 'clone', params: { targetBankId: 'x' } }), 400, 'bankId')
  await rejects(service.execute(null, { op: 'clone', bankId: 'bank-a' }), 500, 'client')
  await rejects(service.execute(client, { op: 'clone', bankId: 'a', params: ['x'] }), 400, 'params')
  assert.equal(calls.json.length + calls.request.length, 0, '不应有上游调用')
})

test('bank id 官方规则：非空、≤192 UTF-8 字节、无控制字符/斜杠/点路径', async () => {
  const { client, calls } = makeClient()
  await rejects(service.execute(client, { op: 'transferExport', bankId: 'a'.repeat(193), params: {} }), 400, '192')
  await rejects(service.execute(client, { op: 'transferExport', bankId: '银'.repeat(65), params: {} }), 400, '192')
  await rejects(service.execute(client, { op: 'transferExport', bankId: 'a/b', params: {} }), 400, '斜杠')
  await rejects(service.execute(client, { op: 'transferExport', bankId: 'a\\b', params: {} }), 400, '斜杠')
  await rejects(service.execute(client, { op: 'clone', bankId: 'a', params: { targetBankId: '..' } }), 400, '点路径')
  assert.equal(calls.json.length, 0)
  // 64 个汉字恰为 192 字节 → 允许
  const ok = makeClient()
  await service.execute(ok.client, { op: 'transferExport', bankId: '银'.repeat(64), params: {} })
  assert.ok(ok.calls.json[0].path.startsWith(`/v1/default/banks/${encodeURIComponent('银'.repeat(64))}/transfer/export`))
})

test('params 未知键被白名单拒绝（含 filename 不属于下载操作）', async () => {
  const zip = makeZip()
  const { client, calls } = makeClient()
  await rejects(service.execute(client, { op: 'clone', bankId: 'a', params: { targetBankId: 'b', webhook: 'x' } }), 400, '不支持参数：webhook')
  await rejects(service.execute(client, { op: 'transferExport', bankId: 'a', params: { targetBankId: 'b' } }), 400, '不支持参数')
  await rejects(service.execute(client, { op: 'transferImport', bankId: 'a', fileBytes: zip, params: { mode: 'restore', documentIds: ['x'] } }), 400, '不支持参数')
  await rejects(service.execute(client, { op: 'transferDownload', bankId: 'a', params: { operationId: 'x', filename: 'y' } }), 400, '不支持参数')
  assert.equal(calls.json.length + calls.request.length, 0)
})

/* ---------------- clone ---------------- */

test('clone 正常提交：路径/查询/双 feature 门控/DTO 含 operation_id 与 pollBankId', async () => {
  const { client, calls } = makeClient()
  const data = await service.execute(client, { op: 'clone', bankId: 'src-bank', params: { targetBankId: 'copy-bank', includeData: true, includeBankConfig: true, includeHistory: false } })
  assert.deepEqual(data, { operationId: 'op-submit-1', operation_id: 'op-submit-1', status: 'pending', submitted: true, pollBankId: 'src-bank' })
  assert.deepEqual(calls.require.map((c) => c.feature), ['document_export_api', 'document_import_api'])
  assert.equal(calls.assertCurrent, 1)
  assert.equal(calls.json.length, 1)
  assert.equal(calls.json[0].method, 'POST')
  assert.equal(calls.json[0].path, '/v1/default/banks/src-bank/clone?target_bank_id=copy-bank&include_data=true&include_bank_config=true&include_history=false')
  assert.equal(calls.json[0].opts.timeoutMs, 120000)
})

test('clone 缺少目标 / 目标等于源 / 全部 include 为 false 均被本地拒绝', async () => {
  const { client, calls } = makeClient()
  await rejects(service.execute(client, { op: 'clone', bankId: 'a', params: {} }), 400, 'targetBankId')
  await rejects(service.execute(client, { op: 'clone', bankId: 'a', params: { targetBankId: 'a' } }), 400, '不能与源')
  await rejects(service.execute(client, { op: 'clone', bankId: 'a', params: { targetBankId: 'b', includeData: false, includeBankConfig: false, includeHistory: false } }), 400, '至少')
  assert.equal(calls.json.length + calls.request.length + calls.require.length, 0, '参数校验失败不应触碰上游')
})

test('clone：export 或 import 任一 feature 关闭即拒绝且不发起上游调用', async () => {
  for (const features of [{ document_export_api: false, document_import_api: true }, { document_export_api: true, document_import_api: false }]) {
    const { client, calls } = makeClient({ features })
    await rejects(service.execute(client, { op: 'clone', bankId: 'a', params: { targetBankId: 'b' } }), 403)
    assert.equal(calls.json.length + calls.request.length, 0)
  }
})

test('clone：目标变化（assertCurrent 抛出）时不发起上游调用', async () => {
  const { client, calls } = makeClient({ assertError: new HttpError(409, 'API 目标已变化') })
  await rejects(service.execute(client, { op: 'clone', bankId: 'a', params: { targetBankId: 'b' } }), 409, '目标已变化')
  assert.equal(calls.json.length + calls.request.length, 0)
})

/* ---------------- transferExport ---------------- */

test('transferExport 正常提交：整库默认范围与 pollBankId', async () => {
  const { client, calls } = makeClient()
  const data = await service.execute(client, { op: 'transferExport', bankId: 'bank-a', params: {} })
  assert.deepEqual(data, { operationId: 'op-submit-1', operation_id: 'op-submit-1', status: 'pending', submitted: true, pollBankId: 'bank-a' })
  assert.deepEqual(calls.require, [{ method: 'POST', pathTemplate: '/v1/default/banks/{bank_id}/transfer/export', feature: 'document_export_api' }])
  assert.equal(calls.json[0].path, '/v1/default/banks/bank-a/transfer/export?include_data=true&include_bank_config=true&include_history=false')
})

test('transferExport 文档子集：document_id 重复查询且不带 bank 级内容', async () => {
  const { client, calls } = makeClient()
  await service.execute(client, { op: 'transferExport', bankId: 'bank-a', params: { includeBankConfig: false, documentIds: ['doc-1', 'doc-2'] } })
  assert.equal(calls.json[0].path, '/v1/default/banks/bank-a/transfer/export?include_data=true&include_bank_config=false&include_history=false&document_id=doc-1&document_id=doc-2')
})

test('transferExport 文档子集携带 bank 配置/历史被本地拒绝', async () => {
  const { client, calls } = makeClient()
  await rejects(service.execute(client, { op: 'transferExport', bankId: 'a', params: { documentIds: ['d1'] } }), 400, '仅导出部分文档')
  await rejects(service.execute(client, { op: 'transferExport', bankId: 'a', params: { documentIds: ['d1'], includeBankConfig: false, includeHistory: true } }), 400)
  await rejects(service.execute(client, { op: 'transferExport', bankId: 'a', params: { documentIds: 'd1' } }), 400, 'documentIds')
  await rejects(service.execute(client, { op: 'transferExport', bankId: 'a', params: { documentIds: ['a/b'] } }), 400, '斜杠')
  await rejects(service.execute(client, { op: 'transferExport', bankId: 'a', params: { includeData: false, includeBankConfig: false, includeHistory: false } }), 400, '至少')
  assert.equal(calls.json.length + calls.request.length, 0)
})

test('transferExport：feature 关闭即拒绝', async () => {
  const { client, calls } = makeClient({ features: { document_export_api: false, document_import_api: true } })
  await rejects(service.execute(client, { op: 'transferExport', bankId: 'a', params: {} }), 403)
  assert.equal(calls.json.length + calls.request.length, 0)
})

/* ---------------- transferImport ---------------- */

test('transferImport restore 正常提交：multipart file 字段、完整查询与 pollBankId', async () => {
  const { client, calls } = makeClient()
  const zip = makeZip('restore-payload')
  const data = await service.execute(client, {
    op: 'transferImport', bankId: 'bank-a', fileBytes: zip,
    params: importParams(zip, { includeBankConfig: false, includeHistory: true, filename: 'archive.zip' }),
  })
  assert.deepEqual(data, { operationId: 'op-import-1', operation_id: 'op-import-1', status: 'pending', submitted: true, pollBankId: 'bank-a' })
  assert.equal(calls.request.length, 1)
  assert.equal(calls.request[0].method, 'POST')
  assert.equal(calls.request[0].path, '/v1/default/banks/bank-a/transfer/import?mode=restore&target_bank_id=new-bank&include_data=true&include_bank_config=false&include_history=true')
  assert.equal(calls.request[0].opts.timeoutMs, 120000)
  const form = calls.request[0].opts.body
  assert.ok(form instanceof FormData, '请求体必须是 FormData')
  const file = form.get('file')
  assert.ok(file instanceof Blob)
  assert.equal(file.name, 'archive.zip')
  assert.equal(file.type, 'application/zip')
  assert.deepEqual(Buffer.from(await file.arrayBuffer()), zip)
})

test('transferImport merge 正常提交：仅 mode 与 document_conflict，不携带 target/include', async () => {
  const { client, calls } = makeClient()
  const zip = makeZip('merge-payload')
  await service.execute(client, {
    op: 'transferImport', bankId: 'bank-a', fileBytes: zip,
    params: importParams(zip, { mode: 'merge', documentConflict: 'replace', includeData: true, includeBankConfig: true }),
  })
  const { path, opts } = calls.request[0]
  assert.equal(path, '/v1/default/banks/bank-a/transfer/import?mode=merge&document_conflict=replace')
  const query = path.slice(path.indexOf('?') + 1)
  assert.ok(!query.includes('target_bank_id') && !query.includes('include_data') && !query.includes('include_bank_config') && !query.includes('include_history'), 'merge 查询不得携带 include/target 参数')
  assert.ok(opts.body instanceof FormData)
})

test('transferImport 复验失败：SHA256 / 长度 / magic / 大小', async () => {
  const { client, calls } = makeClient()
  const zip = makeZip('payload')
  await rejects(service.execute(client, { op: 'transferImport', bankId: 'a', fileBytes: zip, params: importParams(zip, { fileSha256: sha256(makeZip('other')) }) }), 400, 'SHA-256')
  await rejects(service.execute(client, { op: 'transferImport', bankId: 'a', fileBytes: zip, params: importParams(zip, { fileSize: zip.byteLength - 1 }) }), 400, 'fileSize')
  await rejects(service.execute(client, { op: 'transferImport', bankId: 'a', fileBytes: makeZip().subarray(0, 2), params: importParams(makeZip().subarray(0, 2)) }), 400, 'ZIP')
  await rejects(service.execute(client, { op: 'transferImport', bankId: 'a', fileBytes: zip, params: importParams(zip, { fileSha256: 'zz' }) }), 400, 'fileSha256')
  await rejects(service.execute(client, { op: 'transferImport', bankId: 'a', params: importParams(zip) }), 400, 'fileBytes')
  await rejects(service.execute(client, { op: 'transferImport', bankId: 'a', fileBytes: Buffer.alloc(0), params: importParams(Buffer.alloc(0)) }), 400, '为空')
  assert.equal(calls.require.length + calls.json.length + calls.request.length, 0, '复验失败不应触碰上游')
})

test('transferImport 超过 50MiB 上限被拒绝（413）', async () => {
  const { client, calls } = makeClient()
  const oversized = Buffer.alloc(UPLOAD_LIMIT + 1)
  await rejects(service.execute(client, { op: 'transferImport', bankId: 'a', fileBytes: oversized, params: importParams(oversized) }), 413, '上限')
  assert.equal(calls.request.length, 0)
})

test('transferImport 参数错误：restore 无目标 / 目标等于记录 bank / 非法模式与冲突策略', async () => {
  const { client, calls } = makeClient()
  const zip = makeZip()
  await rejects(service.execute(client, { op: 'transferImport', bankId: 'a', fileBytes: zip, params: importParams(zip, { targetBankId: undefined }) }), 400, 'targetBankId')
  await rejects(service.execute(client, { op: 'transferImport', bankId: 'a', fileBytes: zip, params: importParams(zip, { targetBankId: 'a' }) }), 400, '不可能同时成立')
  await rejects(service.execute(client, { op: 'transferImport', bankId: 'a', fileBytes: zip, params: importParams(zip, { mode: 'overwrite' }) }), 400, 'restore / merge')
  await rejects(service.execute(client, { op: 'transferImport', bankId: 'a', fileBytes: zip, params: importParams(zip, { mode: 'merge', documentConflict: 'drop' }) }), 400, 'documentConflict')
  assert.equal(calls.require.length + calls.request.length, 0)
})

test('transferImport：feature 关闭 / 上游非 202 / 响应缺 operation_id（且不自动重试）', async () => {
  const zip = makeZip()
  const off = makeClient({ features: { document_export_api: true, document_import_api: false } })
  await rejects(service.execute(off.client, { op: 'transferImport', bankId: 'a', fileBytes: zip, params: importParams(zip) }), 403)
  assert.equal(off.calls.request.length, 0)

  let cancelled = 0
  const failing = makeClient({ request: () => ({ ok: false, status: 422, body: { cancel: async () => { cancelled += 1 } } }) })
  await rejects(service.execute(failing.client, { op: 'transferImport', bankId: 'a', fileBytes: zip, params: importParams(zip) }), 422, 'HTTP 422')
  assert.equal(cancelled, 1, '失败响应体应被取消且不回传')
  assert.equal(failing.calls.request.length, 1, '副作用未知也不得自动重试')

  const malformed = makeClient({ request: () => ({ ok: true, status: 202, json: async () => ({ status: 'pending' }) }) })
  await rejects(service.execute(malformed.client, { op: 'transferImport', bankId: 'a', fileBytes: zip, params: importParams(zip) }), 502, 'operation_id')
  const notJson = makeClient({ request: () => ({ ok: true, status: 202, json: async () => { throw new Error('bad json') } }) })
  await rejects(service.execute(notJson.client, { op: 'transferImport', bankId: 'a', fileBytes: zip, params: importParams(zip) }), 502, 'JSON')
})

/* ---------------- transferDownload ---------------- */

test('transferDownload 正常：include_payload=false 轮询 + 同源下载，不泄漏 metadata', async () => {
  const { client, calls } = makeClient()
  const data = await service.execute(client, { op: 'transferDownload', bankId: 'bank-a', params: { operationId: 'op-export-1' } })
  assert.deepEqual(Object.keys(data).sort(), ['binary', 'byteSize', 'filename', 'response'])
  assert.equal(data.binary, true)
  assert.equal(data.filename, 'bank-a-transfer.zip')
  assert.equal(data.byteSize, 1024)
  assert.equal(calls.json.length, 1)
  assert.equal(calls.json[0].method, 'GET')
  assert.equal(calls.json[0].path, '/v1/default/banks/bank-a/operations/op-export-1?include_payload=false')
  assert.deepEqual(calls.json[0].opts, { timeoutMs: 30000 })
  assert.equal(calls.request.length, 1)
  assert.equal(calls.request[0].method, 'GET')
  assert.equal(calls.request[0].path, DOWNLOAD_URL)
  assert.equal(calls.request[0].opts.timeoutMs, 180000)
  assert.deepEqual(calls.request[0].opts.headers, { accept: 'application/zip' })
  assert.equal(calls.assertCurrent, 2, '轮询与下载前各复核一次')
})

test('transferDownload 状态未完成 / 失败 / 不存在', async () => {
  const pending = makeClient({ json: () => ({ status: 'processing' }) })
  await rejects(service.execute(pending.client, { op: 'transferDownload', bankId: 'a', params: { operationId: 'op-1' } }), 409, '尚未完成')
  assert.equal(pending.calls.request.length, 0)

  const failed = makeClient({ json: () => ({ status: 'failed', error_message: 'disk full SECRET-TOKEN' }) })
  const error = await rejects(service.execute(failed.client, { op: 'transferDownload', bankId: 'a', params: { operationId: 'op-1' } }), 502, 'disk full')
  assert.ok(error.message.includes('[REDACTED]'), '错误信息必须经过脱敏')
  assert.equal(failed.calls.request.length, 0)

  const missing = makeClient({ json: () => ({ status: 'not_found' }) })
  await rejects(service.execute(missing.client, { op: 'transferDownload', bankId: 'a', params: { operationId: 'op-1' } }), 404)
  assert.equal(missing.calls.request.length, 0)
})

test('transferDownload 拒绝跨源地址（对象存储签名 URL），不转发认证也不回显地址', async () => {
  const evil = 'https://storage.example.com/v1/default/files/download/banks/a/exports/op-1/transfer.zip?X-Amz-Signature=SECRET-TOKEN'
  const { client, calls } = makeClient({ json: () => ({ status: 'completed', result_metadata: { download_url: evil, byte_size: 10, filename: 'x.zip' } }) })
  const error = await rejects(service.execute(client, { op: 'transferDownload', bankId: 'a', params: { operationId: 'op-1' } }), 403, '不同源')
  assert.ok(!error.message.includes('storage.example.com') && !error.message.includes('SECRET-TOKEN'), '错误信息不得回显跨源地址或签名')
  assert.equal(calls.request.length, 0, '不得对跨源地址发起请求')
})

test('transferDownload 拒绝同源但带查询串的地址与非法路径', async () => {
  const base = 'http://127.0.0.1:8888'
  const withQuery = makeClient({ json: () => ({ status: 'completed', result_metadata: { download_url: `${base}${DOWNLOAD_URL}?sig=SECRET-TOKEN` } }) })
  await rejects(service.execute(withQuery.client, { op: 'transferDownload', bankId: 'a', params: { operationId: 'op-1' } }), 400, '查询串')
  assert.equal(withQuery.calls.request.length, 0)

  const otherPath = makeClient({ json: () => ({ status: 'completed', result_metadata: { download_url: '/v1/default/banks/a/documents/transfer.zip' } }) })
  await rejects(service.execute(otherPath.client, { op: 'transferDownload', bankId: 'a', params: { operationId: 'op-1' } }), 400, '下载路径内')

  const traversal = makeClient({ json: () => ({ status: 'completed', result_metadata: { download_url: '/v1/default/files/download/banks/../other/secret.zip' } }) })
  await rejects(service.execute(traversal.client, { op: 'transferDownload', bankId: 'a', params: { operationId: 'op-1' } }), 400, '存储键')

  const notBankScoped = makeClient({ json: () => ({ status: 'completed', result_metadata: { download_url: '/v1/default/files/download/random/file.zip' } }) })
  await rejects(service.execute(notBankScoped.client, { op: 'transferDownload', bankId: 'a', params: { operationId: 'op-1' } }), 400, 'bank')
})

test('transferDownload 下载键中的 bank 必须匹配所选 bank（banks/tenants/中文名/双重编码）', async () => {
  const other = makeClient({ json: () => ({ status: 'completed', result_metadata: { download_url: '/v1/default/files/download/banks/other-bank/exports/op-1/transfer.zip' } }) })
  await rejects(service.execute(other.client, { op: 'transferDownload', bankId: 'bank-a', params: { operationId: 'op-1' } }), 400, '不属于当前 bank')
  assert.equal(other.calls.request.length, 0)

  // banks 布局 bank id 原样（含中文名）
  const chinese = makeClient({ json: () => ({ status: 'completed', result_metadata: { download_url: '/v1/default/files/download/banks/银行-a/exports/op-1/transfer.zip' } }) })
  await service.execute(chinese.client, { op: 'transferDownload', bankId: '银行-a', params: { operationId: 'op-1' } })
  assert.equal(chinese.calls.request[0].path, '/v1/default/files/download/banks/银行-a/exports/op-1/transfer.zip')

  // tenants 布局：段经 storage 层 quote(safe='') 一次，download_url 再整体 quote 一次（双重编码）
  const single = makeClient({ json: () => ({ status: 'completed', result_metadata: { download_url: '/v1/default/files/download/tenants/pub/banks/%E9%93%B6%E8%A1%8C-a/exports/op-1/transfer.zip' } }) })
  await service.execute(single.client, { op: 'transferDownload', bankId: '银行-a', params: { operationId: 'op-1' } })
  assert.equal(single.calls.request[0].path, '/v1/default/files/download/tenants/pub/banks/%E9%93%B6%E8%A1%8C-a/exports/op-1/transfer.zip')

  const doubled = makeClient({ json: () => ({ status: 'completed', result_metadata: { download_url: '/v1/default/files/download/tenants/pub/banks/%25E9%2593%25B6%25E8%25A1%258C-a/exports/op-1/transfer.zip' } }) })
  await service.execute(doubled.client, { op: 'transferDownload', bankId: '银行-a', params: { operationId: 'op-1' } })
  assert.equal(doubled.calls.request[0].path, '/v1/default/files/download/tenants/pub/banks/%25E9%2593%25B6%25E8%25A1%258C-a/exports/op-1/transfer.zip')

  // tenants 布局指向其它 bank → 拒绝
  const tenantsOther = makeClient({ json: () => ({ status: 'completed', result_metadata: { download_url: '/v1/default/files/download/tenants/pub/banks/other-bank/exports/op-1/transfer.zip' } }) })
  await rejects(service.execute(tenantsOther.client, { op: 'transferDownload', bankId: 'bank-a', params: { operationId: 'op-1' } }), 400, '不属于当前 bank')
  assert.equal(tenantsOther.calls.request.length, 0)
})

test('transferDownload 支持带子路径的 client.base：剥离基路径后转发，不重复拼接', async () => {
  const base = 'http://127.0.0.1:8888/hindsight'
  const absolute = makeClient({ base, json: () => ({ status: 'completed', result_metadata: { download_url: `${base}/v1/default/files/download/banks/bank-a/exports/op-1/transfer.zip` } }) })
  await service.execute(absolute.client, { op: 'transferDownload', bankId: 'bank-a', params: { operationId: 'op-1' } })
  assert.equal(absolute.calls.request[0].path, '/v1/default/files/download/banks/bank-a/exports/op-1/transfer.zip')

  // 相对地址本身已含子路径 → 剥离后转发
  const relative = makeClient({ base, json: () => ({ status: 'completed', result_metadata: { download_url: '/hindsight/v1/default/files/download/banks/bank-a/exports/op-1/transfer.zip' } }) })
  await service.execute(relative.client, { op: 'transferDownload', bankId: 'bank-a', params: { operationId: 'op-1' } })
  assert.equal(relative.calls.request[0].path, '/v1/default/files/download/banks/bank-a/exports/op-1/transfer.zip')

  // 官方 PostgreSQL 存储的 API 根相对地址 → 原样转发，由 client.request 以 base 拼接
  const apiRelative = makeClient({ base, json: () => ({ status: 'completed', result_metadata: { download_url: '/v1/default/files/download/banks/bank-a/exports/op-1/transfer.zip' } }) })
  await service.execute(apiRelative.client, { op: 'transferDownload', bankId: 'bank-a', params: { operationId: 'op-1' } })
  assert.equal(apiRelative.calls.request[0].path, '/v1/default/files/download/banks/bank-a/exports/op-1/transfer.zip')

  // 同源但不含子路径的绝对地址 → 允许，路径原样
  const noSub = makeClient({ base, json: () => ({ status: 'completed', result_metadata: { download_url: 'http://127.0.0.1:8888/v1/default/files/download/banks/bank-a/exports/op-1/transfer.zip' } }) })
  await service.execute(noSub.client, { op: 'transferDownload', bankId: 'bank-a', params: { operationId: 'op-1' } })
  assert.equal(noSub.calls.request[0].path, '/v1/default/files/download/banks/bank-a/exports/op-1/transfer.zip')
})

test('transferDownload 接受 storage_key 回退', async () => {
  const byKey = makeClient({ json: () => ({ status: 'completed', result_metadata: { storage_key: 'banks/bank-a/exports/op-2/transfer.zip' } }) })
  await service.execute(byKey.client, { op: 'transferDownload', bankId: 'bank-a', params: { operationId: 'op-2' } })
  assert.equal(byKey.calls.request[0].path, '/v1/default/files/download/banks/bank-a/exports/op-2/transfer.zip')
})

test('transferDownload 元数据缺失 / 超过下载上限 / 上游失败', async () => {
  const noMeta = makeClient({ json: () => ({ status: 'completed', result_metadata: {} }) })
  await rejects(service.execute(noMeta.client, { op: 'transferDownload', bankId: 'bank-a', params: { operationId: 'op-1' } }), 502, '下载位置')
  assert.equal(noMeta.calls.request.length, 0)

  const huge = makeClient({ json: () => ({ status: 'completed', result_metadata: { download_url: DOWNLOAD_URL, byte_size: DOWNLOAD_LIMIT + 1 } }) })
  await rejects(service.execute(huge.client, { op: 'transferDownload', bankId: 'bank-a', params: { operationId: 'op-1' } }), 413, '下载上限')
  assert.equal(huge.calls.request.length, 0)

  let cancelled = 0
  const failing = makeClient({ request: () => ({ ok: false, status: 404, body: { cancel: async () => { cancelled += 1 } } }) })
  await rejects(service.execute(failing.client, { op: 'transferDownload', bankId: 'bank-a', params: { operationId: 'op-1' } }), 404, 'HTTP 404')
  assert.equal(cancelled, 1)
})

test('transferDownload：feature 关闭或目标变化时不发起下载', async () => {
  const off = makeClient({ features: { document_export_api: false, document_import_api: true } })
  await rejects(service.execute(off.client, { op: 'transferDownload', bankId: 'bank-a', params: { operationId: 'op-1' } }), 403)
  assert.equal(off.calls.json.length + off.calls.request.length, 0)

  const moved = makeClient({ assertError: new HttpError(409, 'API 目标已变化') })
  await rejects(service.execute(moved.client, { op: 'transferDownload', bankId: 'bank-a', params: { operationId: 'op-1' } }), 409)
  assert.equal(moved.calls.json.length + moved.calls.request.length, 0)
})

/* ---------------- assertCurrent 异步拒绝 ---------------- */

test('assertCurrent 异步拒绝被正确传播，不产生未处理拒绝', async () => {
  const { result, unhandled } = await expectNoUnhandledRejection(async () => {
    const clone = makeClient({ assertCurrentImpl: () => Promise.reject(new HttpError(409, 'API 目标已变化')) })
    await rejects(service.execute(clone.client, { op: 'clone', bankId: 'a', params: { targetBankId: 'b' } }), 409, '目标已变化')
    assert.equal(clone.calls.json.length + clone.calls.request.length, 0)

    const download = makeClient({ assertCurrentImpl: async () => { throw new HttpError(409, '绑定已变化') } })
    await rejects(service.execute(download.client, { op: 'transferDownload', bankId: 'bank-a', params: { operationId: 'op-1' } }), 409, '绑定已变化')
    assert.equal(download.calls.json.length + download.calls.request.length, 0)

    // 第一次复核通过（完成轮询）、第二次（下载前）拒绝：下载请求不得发出
    let first = true
    const later = makeClient({ assertCurrentImpl: async () => { if (first) { first = false; return } throw new HttpError(409, '轮询后绑定已变化') } })
    await rejects(service.execute(later.client, { op: 'transferDownload', bankId: 'bank-a', params: { operationId: 'op-1' } }), 409, '轮询后绑定已变化')
    assert.equal(later.calls.json.length, 1, '轮询已发生')
    assert.equal(later.calls.request.length, 0, '第二次复核失败后不得发起下载')
    return true
  })
  assert.equal(result, true)
  assert.deepEqual(unhandled, [], '不得产生未处理拒绝')
})

/* ---------------- readZipBody ---------------- */

test('readZipBody 正常读取：字节精确、监听与定时器全部清理', async () => {
  const { result, created, cleared } = await withTimerTracking(async () => {
    const req = fakeReq()
    const promise = service.readZipBody(req, { timeoutMs: 5000 })
    req.emit('data', Buffer.from('PK\x03\x04he'))
    req.emit('data', Buffer.from('llo'))
    req.emit('end')
    return promise
  })
  assert.deepEqual(result, Buffer.from('PK\x03\x04hello'))
  assert.equal(created.length, 1)
  assert.equal(cleared.size, 1)
  assert.ok(cleared.has(created[0]), '超时定时器未被清理')
})

test('readZipBody content-length 预检与流式超限均返回 413 并断开连接', async () => {
  const declared = fakeReq({ 'content-length': String(UPLOAD_LIMIT + 10) })
  await rejects(service.readZipBody(declared, {}), 413, '声明长度')
  assert.ok(declared.destroyed)
  assertNoListeners(declared)

  const streamed = fakeReq()
  const promise = service.readZipBody(streamed, { maxBytes: 10, timeoutMs: 5000 })
  streamed.emit('data', Buffer.alloc(11))
  await rejects(promise, 413, '上限')
  assert.ok(streamed.destroyed)
  assertNoListeners(streamed)
})

test('readZipBody 超时 / abort / 预先 abort', async () => {
  const timed = fakeReq()
  const timedPromise = service.readZipBody(timed, { timeoutMs: 10 })
  timed.emit('data', Buffer.from('PK\x03\x04partial'))
  await rejects(timedPromise, 504, '超时')
  assert.ok(timed.destroyed)
  assertNoListeners(timed)

  const controller = new AbortController()
  const aborted = fakeReq()
  const abortedPromise = service.readZipBody(aborted, { signal: controller.signal, timeoutMs: 5000 })
  controller.abort()
  await rejects(abortedPromise, 503, '取消')
  assert.ok(aborted.destroyed)
  assertNoListeners(aborted, controller.signal)

  const pre = new AbortController()
  pre.abort()
  const early = fakeReq()
  await rejects(service.readZipBody(early, { signal: pre.signal }), 503)
  assertNoListeners(early, pre.signal)
})

test('readZipBody 断流：error / aborted / 连接提前关闭', async () => {
  const errored = fakeReq()
  const errorPromise = service.readZipBody(errored, { timeoutMs: 5000 })
  errored.emit('error', new Error('ECONNRESET'))
  await rejects(errorPromise, 400, 'ECONNRESET')
  assert.ok(errored.destroyed)
  assertNoListeners(errored)

  const interrupted = fakeReq()
  const interruptedPromise = service.readZipBody(interrupted, { timeoutMs: 5000 })
  interrupted.emit('data', Buffer.from('PK\x03\x04x'))
  interrupted.emit('aborted')
  await rejects(interruptedPromise, 400, '中断')
  assertNoListeners(interrupted)

  const closed = fakeReq()
  const closedPromise = service.readZipBody(closed, { timeoutMs: 5000 })
  closed.emit('data', Buffer.from('PK\x03\x04x'))
  closed.emit('close')
  await rejects(closedPromise, 400, '提前关闭')
  assertNoListeners(closed)
})

test('readZipBody 使用注入的 HttpError；独立导出版本错误带 status', async () => {
  const req = fakeReq()
  const promise = service.readZipBody(req, { maxBytes: 2 })
  req.emit('data', Buffer.alloc(3))
  const error = await rejects(promise, 413)
  assert.ok(error instanceof HttpError, '工厂版应使用注入的 HttpError')

  const standalone = fakeReq()
  const standalonePromise = standaloneReadZipBody(standalone, { timeoutMs: 5000 })
  standalone.emit('error', new Error('boom'))
  const standaloneError = await rejects(standalonePromise, 400)
  assert.ok(!(standaloneError instanceof HttpError))
  assert.equal(standaloneError.constructor.name, 'StatusError')
})

/* ---------------- 运行 ---------------- */

let failed = 0
for (const { name, fn } of tests) {
  try {
    await fn()
    console.log(`ok   - ${name}`)
  } catch (error) {
    failed += 1
    console.error(`FAIL - ${name}\n       ${error?.stack ?? error}`)
  }
}
console.log(`\n${tests.length - failed}/${tests.length} 通过`)
process.exitCode = failed ? 1 : 0
