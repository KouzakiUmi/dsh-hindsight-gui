/**
 * Worker B — 迁移与二进制（clone / transferExport / transferImport / transferDownload）。
 *
 * 纯 Host 侧 Worker：不注册路由、不读真实配置或凭据、不创建服务器、不使用任何
 * 全局网络（fetch/undici 全部经由主代理注入的共享 API 会话 client.request/json）。
 *
 * 上游契约依据 Hindsight HTTP API 0.10.2（docs/hindsight-management-contract.json）
 * 与官方公开源码（vectorize-io/hindsight，hindsight-api-slim）核实：
 * - POST /v1/default/banks/{bank_id}/transfer/export — feature document_export_api；
 *   记录在被导出的 bank 名下（_submit_async_operation(bank_id, ...)）。
 * - POST /v1/default/banks/{bank_id}/transfer/import — feature document_import_api（multipart 字段名 file）；
 *   merge 模式禁止携带 target_bank_id 与任何 include 标志（服务端 400）；
 *   restore 的 include 标志缺省 true/true/false。submit_bank_import_async：
 *   记录 bank（URL bank）必须存在（async_operations 外键，缺失 404），
 *   target 必须不存在（已存在 ValueError→400）——因此 target==记录 bank 在上游
 *   永远不可能成立（无论记录 bank 存在与否都至少一边失败），本地预检与其语义一致。
 * - POST /v1/default/banks/{bank_id}/clone — 官方 http.py：clone 是 export+import
 *   连跑，feature document_export_api 与 document_import_api 必须同时开启；
 *   submit_bank_clone_async 显式拒绝 target==bank_id（"cannot be cloned onto itself"）。
 * - GET  /v1/default/files/download/{key:path} — feature document_export_api；key 为含
 *   斜杠的存储键：bank 导出为 banks/{bank_id}/exports/{operation_id}/transfer.zip（bank id
 *   原样），tenant 布局为 tenants/{schema}/banks/{bank_id}/...（各段经 quote(safe='') 编码，
 *   download_url 再整体 quote 一次，即双重编码）。PostgreSQL 存储返回 API 根相对路径
 *   /v1/default/files/download/{quote(key)}；S3 返回跨源预签名绝对 URL —— 本 Worker 一律
 *   拒绝跨源地址，绝不把认证转发给其它源。存储键中的 bank 必须与所选 bank 一致
 *   （服务端 retrieve_bank_file_stream 亦按 key 前缀校验 bank 归属）。
 * - GET  /v1/default/banks/{bank_id}/operations/{operation_id} — 轮询单个任务，
 *   include_payload 恒 false。import/clone 的操作记录在 URL bank（target 尚不存在），
 *   export 记录在被导出 bank —— 四个操作的 pollBankId 均为 input.bankId。
 * - bank id 规则（bank_utils.validate_new_bank_id）：非空、≤192 UTF-8 字节、无控制字符；
 *   另按 URI 安全拒绝斜杠/反斜杠/点路径（与 Worker A validateIdentifier 一致）。
 * 断言（assertCurrent）是异步的（真实会话复查 records/credentials），必须 await。
 * 副作用结果未知（超时等）时错误上抛，绝不自动重试。
 */
import { createHash } from 'node:crypto'
import { DOWNLOAD_LIMIT, UPLOAD_LIMIT } from './management-contracts.js'

/** 迁移类提交（transfer/clone）最长 120 秒；下载最长 180 秒；普通 JSON 轮询 30 秒。 */
const SUBMIT_TIMEOUT_MS = 120000
const DOWNLOAD_TIMEOUT_MS = 180000
const POLL_TIMEOUT_MS = 30000

const DOWNLOAD_PATH_PREFIX = '/v1/default/files/download/'

/** require() 使用的 OpenAPI 路径模板（与契约快照中的键一致）。 */
const PATHS = {
  export: '/v1/default/banks/{bank_id}/transfer/export',
  import: '/v1/default/banks/{bank_id}/transfer/import',
  clone: '/v1/default/banks/{bank_id}/clone',
  download: '/v1/default/files/download/{key}',
  operation: '/v1/default/banks/{bank_id}/operations/{operation_id}',
}

const OPERATIONS = ['clone', 'transferExport', 'transferImport', 'transferDownload']

/** 每个操作允许的 params 键（白名单，未知键一律拒绝）。 */
const PARAM_KEYS = {
  clone: ['targetBankId', 'includeData', 'includeBankConfig', 'includeHistory'],
  transferExport: ['includeData', 'includeBankConfig', 'includeHistory', 'documentIds'],
  transferImport: ['mode', 'targetBankId', 'documentConflict', 'includeData', 'includeBankConfig', 'includeHistory', 'fileSize', 'fileSha256', 'filename'],
  transferDownload: ['operationId'],
}

/** 官方 bank id 上限（bank_utils.BANK_ID_MAX_BYTES）。 */
const BANK_ID_LIMIT_BYTES = 192

function mb(bytes) { return Math.floor(bytes / (1024 * 1024)) }

/**
 * 构造 readZipBody(req, {signal,maxBytes,timeoutMs})：把上传的原始 ZIP 读进内存，
 * 不写临时/生产文件。处理断流、限长、超时与 abort，并在任何出口移除全部监听。
 * @param makeError - (status, message) => Error 工厂，绑定注入方或本模块的错误类型。
 */
function makeReadZipBody(makeError) {
  return function readZipBody(req, { signal, maxBytes = UPLOAD_LIMIT, timeoutMs = 120000 } = {}) {
    const limit = Number.isFinite(Number(maxBytes)) && Number(maxBytes) > 0 ? Number(maxBytes) : UPLOAD_LIMIT
    const wait = Number.isFinite(Number(timeoutMs)) && Number(timeoutMs) > 0 ? Number(timeoutMs) : 120000
    return new Promise((resolve, reject) => {
      if (!req || typeof req.on !== 'function' || typeof req.removeListener !== 'function') {
        reject(makeError(500, 'readZipBody 需要一个可读的请求对象'))
        return
      }
      let received = 0
      let settled = false
      let timer = null
      const chunks = []
      const settle = (finish) => {
        if (settled) return
        settled = true
        if (timer !== null) { clearTimeout(timer); timer = null }
        signal?.removeEventListener?.('abort', onAbort)
        req.removeListener('data', onData)
        req.removeListener('end', onEnd)
        req.removeListener('error', onError)
        req.removeListener('aborted', onAborted)
        req.removeListener('close', onClose)
        finish()
      }
      const onData = (chunk) => {
        const piece = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
        chunks.push(piece)
        received += piece.length
        if (received > limit) settle(() => { req.destroy?.(); reject(makeError(413, `上传内容超过 ${mb(limit)}MiB 上限`)) })
      }
      const onEnd = () => settle(() => resolve(Buffer.concat(chunks)))
      const onError = (error) => settle(() => { req.destroy?.(); reject(makeError(400, `上传读取失败：${error?.message ?? error}`)) })
      const onAborted = () => settle(() => reject(makeError(400, '上传已被客户端中断')))
      const onClose = () => { if (!settled) settle(() => reject(makeError(400, '上传连接提前关闭'))) }
      const onAbort = () => settle(() => { req.destroy?.(); reject(makeError(503, '操作已取消')) })
      const onTimeout = () => settle(() => { req.destroy?.(); reject(makeError(504, '上传超时')) })
      if (signal?.aborted) { settle(() => reject(makeError(503, '操作已取消'))); return }
      const declared = Number(String(req.headers?.['content-length'] ?? ''))
      if (Number.isFinite(declared) && declared > limit) {
        settle(() => { req.destroy?.(); reject(makeError(413, `上传内容声明长度（${declared} 字节）超过 ${mb(limit)}MiB 上限`)) })
        return
      }
      req.on('data', onData)
      req.on('end', onEnd)
      req.on('error', onError)
      req.on('aborted', onAborted)
      req.on('close', onClose)
      signal?.addEventListener?.('abort', onAbort, { once: true })
      timer = setTimeout(onTimeout, wait)
    })
  }
}

/** 供未走工厂注入路径时直接使用：错误带 .status，宿主 sendJson 按 status 透传。 */
class StatusError extends Error {
  constructor(status, message) { super(message); this.status = status }
}

/** 独立导出的 readZipBody（不依赖工厂注入）。 */
export const readZipBody = makeReadZipBody((status, message) => new StatusError(status, message))

/**
 * Worker B 工厂。
 * @param HttpError - 主代理注入的错误类型（constructor(status, message)）。
 * @param redact - 主代理注入的脱敏函数。
 * @returns {{ execute(client,input), readZipBody(req,opts) }}
 */
export function createTransferService({ HttpError, redact } = {}) {
  if (typeof HttpError !== 'function') throw new TypeError('createTransferService 需要注入 HttpError')
  if (typeof redact !== 'function') throw new TypeError('createTransferService 需要注入 redact')

  const fail = (status, message) => { throw new HttpError(status, message) }

  /**
   * 校验 bank id：官方规则（非空、≤192 UTF-8 字节、无控制字符）加 URI 安全
   * （无斜杠/反斜杠/点路径），与 Worker A validateIdentifier 一致。
   */
  function validateBankId(value, name) {
    if (typeof value !== 'string') fail(400, `${name} 必须是字符串`)
    const trimmed = value.trim()
    if (trimmed === '') fail(400, `${name} 不能为空`)
    if (Buffer.byteLength(trimmed, 'utf8') > BANK_ID_LIMIT_BYTES) fail(400, `${name} 超过 192 UTF-8 字节上限（中文最多 64 个字符）`)
    if (/[\x00-\x1f\x7f]/.test(trimmed)) fail(400, `${name} 不能包含控制字符`)
    if (trimmed.includes('/') || trimmed.includes('\\')) fail(400, `${name} 不能包含斜杠或反斜杠`)
    if (trimmed === '.' || trimmed === '..') fail(400, `${name} 不能是点路径`)
    return trimmed
  }

  /** 校验操作/文档等标识：非空、≤256 字符、无控制字符与斜杠。 */
  function validateToken(value, name) {
    if (typeof value !== 'string') fail(400, `${name} 必须是字符串`)
    const trimmed = value.trim()
    if (trimmed === '') fail(400, `${name} 不能为空`)
    if (trimmed.length > 256) fail(400, `${name} 过长（最多 256 字符）`)
    if (/[\x00-\x1f\x7f]/.test(trimmed)) fail(400, `${name} 不能包含控制字符`)
    if (trimmed.includes('/') || trimmed.includes('\\')) fail(400, `${name} 不能包含斜杠或反斜杠`)
    return trimmed
  }

  /** params 白名单：未知键一律拒绝，不让 UI 夹带未定义参数。 */
  function readParams(op, params) {
    if (params === undefined || params === null) return {}
    if (typeof params !== 'object' || Array.isArray(params)) fail(400, 'params 必须是对象')
    for (const key of Object.keys(params)) {
      if (!PARAM_KEYS[op].includes(key)) fail(400, `操作 ${op} 不支持参数：${key}`)
    }
    return params
  }

  function normalizeScope(params) {
    const read = (value, name, fallback) => {
      if (value === undefined || value === null) return fallback
      if (typeof value !== 'boolean') fail(400, `${name} 必须是布尔值`)
      return value
    }
    return {
      data: read(params.includeData, 'includeData', true),
      bankConfig: read(params.includeBankConfig, 'includeBankConfig', true),
      history: read(params.includeHistory, 'includeHistory', false),
    }
  }

  function normalizeDocumentIds(value) {
    if (value === undefined || value === null) return []
    if (!Array.isArray(value)) fail(400, 'documentIds 必须是字符串数组')
    return value.map((id) => validateToken(id, 'documentIds 中的文档 id'))
  }

  function bankPath(bankId, suffix) {
    return `/v1/default/banks/${encodeURIComponent(bankId)}${suffix}`
  }

  /**
   * 提交结果 DTO：202 只表示已提交。operation_id 为协议/官方字段名，
   * operationId 为本插件既有兼容名；pollBankId 为官方记录该操作的 bank
   * （export 记录在被导出 bank；import/clone 记录在 URL bank，target 尚不存在）。
   */
  function submissionFrom(data, pollBankId) {
    if (!data || typeof data !== 'object') fail(502, '上游返回不是有效的 JSON 对象')
    const operationId = data.operation_id
    if (typeof operationId !== 'string' || !operationId) fail(502, '上游返回缺少有效的 operation_id')
    const status = typeof data.status === 'string' && data.status ? data.status : 'pending'
    return { operationId, operation_id: operationId, status, submitted: true, pollBankId }
  }

  async function submitJson(client, method, path, pollBankId) {
    const data = await client.json(method, path, undefined, { timeoutMs: SUBMIT_TIMEOUT_MS })
    return submissionFrom(data, pollBankId)
  }

  /** 克隆：POST /banks/{id}/clone，要求 export+import 两个 feature 同时开启。 */
  async function doClone(client, input) {
    const params = input.params
    const targetBankId = validateBankId(params.targetBankId, 'targetBankId（克隆目标 bank）')
    const scope = normalizeScope(params)
    if (targetBankId === input.bankId) fail(400, '克隆目标 bank 不能与源 bank 相同（上游明确拒绝自我克隆）')
    if (!scope.data && !scope.bankConfig && !scope.history) fail(400, '至少需要保留一项克隆内容（数据 / bank 配置 / 历史）')
    // 官方实现：clone 是 export+import 连跑，两个 feature 必须同时开启（缺一即 404）。
    client.require('POST', PATHS.clone, 'document_export_api')
    client.require('POST', PATHS.clone, 'document_import_api')
    await client.assertCurrent()
    const query = new URLSearchParams({
      target_bank_id: targetBankId,
      include_data: String(scope.data),
      include_bank_config: String(scope.bankConfig),
      include_history: String(scope.history),
    })
    return submitJson(client, 'POST', `${bankPath(input.bankId, '/clone')}?${query}`, input.bankId)
  }

  /** 导出：POST /banks/{id}/transfer/export，feature document_export_api。 */
  async function doExport(client, input) {
    const params = input.params
    const scope = normalizeScope(params)
    const documentIds = normalizeDocumentIds(params.documentIds)
    if (!scope.data && !scope.bankConfig && !scope.history) fail(400, '至少需要导出一项内容（数据 / bank 配置 / 历史）')
    // 官方实现：文档子集导出不携带 bank 级内容（服务端 400）。
    if (documentIds.length && (scope.bankConfig || scope.history)) fail(400, '仅导出部分文档时不能携带 bank 配置或历史（仅整库导出支持）')
    client.require('POST', PATHS.export, 'document_export_api')
    await client.assertCurrent()
    const query = new URLSearchParams({
      include_data: String(scope.data),
      include_bank_config: String(scope.bankConfig),
      include_history: String(scope.history),
    })
    for (const id of documentIds) query.append('document_id', id)
    return submitJson(client, 'POST', `${bankPath(input.bankId, '/transfer/export')}?${query}`, input.bankId)
  }

  function isZipMagic(bytes) {
    if (bytes.byteLength < 4) return false
    return bytes[0] === 0x50 && bytes[1] === 0x4b
      && ((bytes[2] === 0x03 && bytes[3] === 0x04) || (bytes[2] === 0x05 && bytes[3] === 0x06))
  }

  /** 导入：POST /banks/{id}/transfer/import，multipart 字段 file，feature document_import_api。 */
  async function doImport(client, input) {
    const params = input.params
    const mode = params.mode === undefined || params.mode === null ? 'restore' : params.mode
    if (mode !== 'restore' && mode !== 'merge') fail(400, `无效的导入模式（仅支持 restore / merge）：${String(mode)}`)
    // 主代理上传入口已校验过，这里复验长度、SHA256 与 ZIP magic。
    const bytes = input.fileBytes
    if (!(bytes instanceof Uint8Array)) fail(400, '缺少上传的 ZIP 内容（fileBytes）')
    if (bytes.byteLength === 0) fail(400, '上传的 ZIP 内容为空')
    if (bytes.byteLength > UPLOAD_LIMIT) fail(413, `上传内容超过 ${mb(UPLOAD_LIMIT)}MiB 上限`)
    if (params.fileSize !== undefined && params.fileSize !== null) {
      if (!Number.isSafeInteger(params.fileSize) || params.fileSize < 0) fail(400, 'fileSize 必须是非负整数')
      if (params.fileSize !== bytes.byteLength) fail(400, `上传内容长度（${bytes.byteLength} 字节）与声明的 fileSize（${params.fileSize} 字节）不一致`)
    }
    const expectedSha = typeof params.fileSha256 === 'string' ? params.fileSha256.trim().toLowerCase() : ''
    if (!/^[0-9a-f]{64}$/.test(expectedSha)) fail(400, 'fileSha256 必须是 64 位十六进制的 SHA-256 摘要')
    if (createHash('sha256').update(bytes).digest('hex') !== expectedSha) fail(400, '上传内容 SHA-256 校验失败，文件可能已损坏或与准备令牌时不一致')
    if (!isZipMagic(bytes)) fail(400, '上传内容不是有效的 ZIP 归档（缺少 ZIP 文件标识）')
    let query
    if (mode === 'merge') {
      const conflict = params.documentConflict === undefined || params.documentConflict === null ? 'skip' : params.documentConflict
      if (!['skip', 'replace', 'new-id'].includes(conflict)) fail(400, 'documentConflict 仅支持 skip / replace / new-id')
      // merge 只收文档：target_bank_id 与 include 标志均不可携带（服务端 400）。
      query = new URLSearchParams({ mode: 'merge', document_conflict: conflict })
    } else {
      // restore 必须给明确目标，避免隐式写到 archive 中的源 bank。
      const targetBankId = validateBankId(params.targetBankId, 'targetBankId（restore 目标 bank）')
      // 上游语义（submit_bank_import_async）：记录 bank 必须存在（缺失 404），
      // target 必须不存在（已存在 400）。target==记录 bank 因此上游永远拒绝 —— 本地
      // 预检等价且报错更早，不是对“同名已存在”的推定，而是两条上游硬约束的交集。
      if (targetBankId === input.bankId) fail(400, 'restore 目标 bank 不能与记录 bank 相同：上游要求记录 bank 必须已存在而目标 bank 必须不存在，二者不可能同时成立')
      const scope = normalizeScope(params)
      query = new URLSearchParams({
        mode: 'restore',
        target_bank_id: targetBankId,
        include_data: String(scope.data),
        include_bank_config: String(scope.bankConfig),
        include_history: String(scope.history),
      })
    }
    client.require('POST', PATHS.import, 'document_import_api')
    await client.assertCurrent()
    const filename = sanitizeFilename(params.filename) ?? 'transfer.zip'
    const form = new FormData()
    form.append('file', new Blob([bytes], { type: 'application/zip' }), filename)
    const path = `${bankPath(input.bankId, '/transfer/import')}?${query}`
    const response = await client.request('POST', path, { body: form, timeoutMs: SUBMIT_TIMEOUT_MS })
    if (!response || !response.ok) {
      try { await response?.body?.cancel?.() } catch { /* 错误响应体不回传 */ }
      fail(response?.status ?? 502, `上游导入提交失败（HTTP ${response?.status ?? '未知状态'}）`)
    }
    let data = null
    try { data = await response.json() } catch { data = null }
    return submissionFrom(data, input.bankId)
  }

  function sanitizeFilename(value) {
    if (typeof value !== 'string') return null
    const cleaned = value.replace(/[\\/\x00-\x1f\x7f]/g, '').trim()
    if (!cleaned || cleaned === '.' || cleaned === '..') return null
    return cleaned.slice(0, 150)
  }

  function pickDownloadRef(meta) {
    if (!meta) return null
    if (typeof meta.download_url === 'string' && meta.download_url.trim()) return meta.download_url.trim()
    if (typeof meta.storage_key === 'string' && meta.storage_key.trim()) return `${DOWNLOAD_PATH_PREFIX}${meta.storage_key.trim()}`
    return null
  }

  function normalizeByteSize(value) {
    if (value === undefined || value === null || value === '') return null
    const num = Number(value)
    if (!Number.isSafeInteger(num) || num < 0) return null
    return num
  }

  function tryDecode(segment) {
    try { return decodeURIComponent(segment) } catch { return null }
  }

  /**
   * 只接受与绑定 API 同源、且位于 /v1/default/files/download/ 之内、键中 bank 与
   * 所选 bank 一致的地址；跨源（含对象存储签名 URL）、其它路径、查询串、路径穿越、
   * 其它 bank 的键一律拒绝，绝不把 bearer 转发给其它源。client.base 可带子路径
   * （如 http://host/hindsight）：绝对地址先剥离基路径再交给 client.request 拼接，
   * 避免重复。保留原始斜杠与既有百分号编码不转 %2F（官方客户端行为）。
   */
  function resolveDownloadPath(rawUrl, base, bankId) {
    let baseOrigin = null
    let basePath = ''
    try {
      const parsedBase = new URL(base)
      baseOrigin = parsedBase.origin
      basePath = parsedBase.pathname.replace(/\/+$/, '')
    } catch { baseOrigin = null }
    let pathname = null
    if (/^https?:\/\//i.test(rawUrl)) {
      let parsed = null
      try { parsed = new URL(rawUrl) } catch { fail(400, '已拒绝导出下载地址：不是合法的 URL') }
      if (baseOrigin === null || parsed.origin !== baseOrigin) fail(403, '已拒绝导出下载地址：与当前绑定的 API 不同源（不向其它地址转发认证）')
      if (parsed.search || parsed.hash) fail(400, '已拒绝导出下载地址：不允许携带查询串或片段')
      pathname = parsed.pathname
    } else if (rawUrl.startsWith('/')) {
      if (rawUrl.includes('?') || rawUrl.includes('#')) fail(400, '已拒绝导出下载地址：不允许携带查询串或片段')
      pathname = rawUrl
    } else {
      fail(400, '已拒绝导出下载地址：仅接受 API 相对路径或同源绝对地址')
    }
    // 剥离 base 子路径（如 /hindsight）：client.request 会重新以 base 拼接，避免重复。
    if (basePath !== '') {
      if (pathname === basePath) fail(400, '已拒绝导出下载地址：缺少存储键')
      if (pathname.startsWith(`${basePath}/`)) pathname = pathname.slice(basePath.length)
    }
    if (!pathname.startsWith(DOWNLOAD_PATH_PREFIX)) fail(400, '已拒绝导出下载地址：不在允许的下载路径内')
    if (/[\x00-\x1f\x7f\\]/.test(pathname)) fail(400, '已拒绝导出下载地址：包含非法字符')
    const key = pathname.slice(DOWNLOAD_PATH_PREFIX.length)
    if (!key) fail(400, '已拒绝导出下载地址：缺少存储键')
    let decoded = ''
    try { decoded = decodeURIComponent(key) } catch { fail(400, '已拒绝导出下载地址：包含无效的百分号编码') }
    const parts = decoded.split('/')
    if (parts.some((part) => part === '' || part === '.' || part === '..')) fail(400, '已拒绝导出下载地址：非法的存储键')
    // 与服务端一致的 IDOR 防线：只有 bank 范围内的键是可下载的。
    let keyBankSegment = null
    if (parts.length > 4 && parts[0] === 'tenants' && parts[2] === 'banks' && parts[3] !== '') keyBankSegment = parts[3]
    else if (parts.length > 2 && parts[0] === 'banks' && parts[1] !== '') keyBankSegment = parts[1]
    else fail(400, '已拒绝导出下载地址：存储键不在 bank 导出文件范围内')
    // 键中的 bank 必须对应所选 bank。tenant 布局的段是双重编码（storage 层
    // quote(safe='') 一次、download_url 再 quote 一次），banks 布局为原样 bank id，
    // 两种形态都比对（原始段与再解码段）。
    if (keyBankSegment !== bankId && tryDecode(keyBankSegment) !== bankId) {
      fail(400, '已拒绝导出下载地址：存储键不属于当前 bank')
    }
    return `${DOWNLOAD_PATH_PREFIX}${key}`
  }

  /** 下载：先以 include_payload=false 轮询一次导出任务，再构造同源下载请求。 */
  async function doDownload(client, input) {
    const params = input.params
    const operationId = validateToken(params.operationId, 'operationId（导出任务 id）')
    client.require('GET', PATHS.operation, undefined)
    client.require('GET', PATHS.download, 'document_export_api')
    await client.assertCurrent()
    const statusPath = `${bankPath(input.bankId, `/operations/${encodeURIComponent(operationId)}`)}?include_payload=false`
    const status = await client.json('GET', statusPath, undefined, { timeoutMs: POLL_TIMEOUT_MS })
    const state = status?.status
    if (state === 'pending' || state === 'processing') fail(409, `导出任务尚未完成（当前状态：${state ?? '未知'}），请稍后刷新后重试`)
    if (state === 'not_found') fail(404, '未找到该导出任务，可能已被清理或不属于该 bank')
    if (state !== 'completed') {
      const detail = typeof status?.error_message === 'string' && status.error_message ? `：${redact(status.error_message)}` : ''
      fail(502, `导出任务未成功完成（状态：${state ?? '未知'}）${detail}`)
    }
    const meta = status && typeof status.result_metadata === 'object' && status.result_metadata ? status.result_metadata : null
    const rawUrl = pickDownloadRef(meta)
    if (!rawUrl) fail(502, '导出任务已完成，但结果元数据中缺少下载位置')
    const downloadPath = resolveDownloadPath(rawUrl, client.base, input.bankId)
    const byteSize = normalizeByteSize(meta?.byte_size)
    if (byteSize !== null && byteSize > DOWNLOAD_LIMIT) fail(413, `导出文件（${byteSize} 字节）超过 ${mb(DOWNLOAD_LIMIT)}MiB 下载上限`)
    await client.assertCurrent()
    const response = await client.request('GET', downloadPath, { timeoutMs: DOWNLOAD_TIMEOUT_MS, headers: { accept: 'application/zip' } })
    if (!response || !response.ok) {
      try { await response?.body?.cancel?.() } catch { /* 错误响应体不回传 */ }
      fail(response?.status ?? 502, `下载导出文件失败（HTTP ${response?.status ?? '未知状态'}）`)
    }
    const filename = sanitizeFilename(meta?.filename) ?? 'hindsight-transfer.zip'
    // 不向浏览器回传原始 metadata / 签名 URL / 存储键；流式回传由主代理负责。
    return { binary: true, response, filename, byteSize }
  }

  /**
   * 执行一次迁移类操作。
   * @param client 主代理注入的共享 API 会话（base/signal/capabilities/require/json/request/assertCurrent）。
   * @param input {op, apiUrl?, bankId, params?, fileBytes?}
   */
  async function execute(client, input) {
    if (!client || typeof client !== 'object') fail(500, '缺少共享 API 会话（client）')
    if (!input || typeof input !== 'object') fail(400, '缺少输入参数')
    const op = input.op
    if (!OPERATIONS.includes(op)) fail(400, `不支持的迁移操作：${String(op)}`)
    const bankId = validateBankId(input.bankId, 'bankId')
    const params = readParams(op, input.params)
    const scopedInput = { ...input, bankId, params }
    switch (op) {
      case 'clone': return doClone(client, scopedInput)
      case 'transferExport': return doExport(client, scopedInput)
      case 'transferImport': return doImport(client, scopedInput)
      case 'transferDownload': return doDownload(client, scopedInput)
      default: fail(400, `不支持的迁移操作：${String(op)}`)
    }
  }

  return { execute, readZipBody: makeReadZipBody((status, message) => new HttpError(status, message)) }
}
