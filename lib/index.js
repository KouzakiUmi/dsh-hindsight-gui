/**
 * dsh-hindsight-gui — host half.
 *
 * A settings page over the Hindsight stack, plus a SERVICE MANAGER: this half
 * can start, restart and (optionally, when asked) auto-start the Hindsight API
 * process, building its environment dynamically from the settings saved on the
 * page. What the page configures is what the server runs with — there is no
 * static launcher script in between.
 *
 * The user deploys Hindsight themselves (pip/uv install hindsight-api); this
 * plugin never installs packages. It only discovers an already-installed
 * `hindsight-api` entry point and launches it.
 *
 * Why the browser half cannot talk to the API directly: the Hindsight API
 * answers on 127.0.0.1:8888 WITHOUT an `Access-Control-Allow-Origin` header, so
 * a cross-origin fetch from the DSH page is refused by the browser. This half is
 * therefore a same-origin proxy: the page calls `/plugins/dsh-hindsight-gui/…`
 * on the DSH web server, and the API request is made here, server-side, where
 * CORS does not apply.
 *
 * Why editing the harness config needs no restart: the DSH integration re-reads
 * `~/.hindsight/coding-agent.json` on every `loadConfig()` call. Server-side
 * settings (models, audit log, env passthrough) are different — they shape the
 * SERVER process environment, so they apply on the next start/restart, and the
 * page tracks that with a `pendingRestart` flag.
 *
 * Routes:
 *   GET  /plugins/dsh-hindsight-gui/status          → aggregated status + current settings
 *   GET  /plugins/dsh-hindsight-gui/models          → DSH environment providers/models
 *   POST /plugins/dsh-hindsight-gui/config          → merge a whitelisted patch into the configs
 *   POST /plugins/dsh-hindsight-gui/server/start    → launch the API process (no-op when up)
 *   POST /plugins/dsh-hindsight-gui/server/restart  → preflight, stop verified owned child, relaunch
 *   GET  /plugins/dsh-hindsight-gui/bankdefense     → read one bank's memory_defense policy
 *   POST /plugins/dsh-hindsight-gui/bankdefense     → write one bank's memory_defense policy
 */

import { spawn } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { closeSync, existsSync, openSync, readSync } from 'node:fs'
import { copyFile, mkdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { delimiter, dirname, join, resolve } from 'node:path'

/** Cordis plugin name. */
export const name = 'hindsight-gui'

/** Route prefix owned by this plugin. */
const HTTP_BASE = '/plugins/dsh-hindsight-gui'

/** Where the API listens, when the harness config does not say. */
const API_BASE = process.env.HINDSIGHT_API_URL ?? 'http://127.0.0.1:8888'

/** Fallback Control Plane address, when neither the file nor the env sets one. */
const DEFAULT_CONTROL_PLANE_URL = 'http://127.0.0.1:9999'

/** The harness config the coding-agent plugin reads. */
const CONFIG_PATH = process.env.HINDSIGHT_CONFIG ?? join(homedir(), '.hindsight', 'coding-agent.json')

/**
 * This plugin's own settings file.
 *
 * Server-side settings live HERE, not in `coding-agent.json`: upstream
 * `@vectorize-io/hindsight-coding-agents` has no key for them, so writing them
 * there would put foreign keys into a file the integration owns and rewrites.
 */
const GUI_CONFIG_PATH = process.env.HINDSIGHT_GUI_CONFIG
  ?? join(dirname(CONFIG_PATH), 'dsh-hindsight-gui.json')

/** The only keys this plugin's own file may hold. */
const GUI_WRITABLE_KEYS = [
  'controlPlaneUrl',
  'serverModels',
  'serverEmbeddings',
  'auditLogEnabled',
  'autoStart',
  'serverCommand',
  'providerOverrides',
  'serverEnv',
]

/**
 * The only keys this page may write into the harness config.
 * Everything else in the file is preserved untouched on save.
 */
const WRITABLE_KEYS = [
  'disabled',
  'apiUrl',
  'logLevel',
  'autoUpdate',
  'codebaseSurvey',
  'surveyModel',
  'bankId',
  'dynamicBankId',
]

/** Scopes for server-side models configurable in dsh-hindsight-gui.json. */
const SERVER_MODEL_SCOPES = ['reflect', 'retain', 'consolidation', 'mentalModel']

/**
 * Environment prefix per scope, as hindsight-api reads them: the reflect scope
 * IS the default LLM (`HINDSIGHT_API_LLM_*`); the others are scoped variants.
 */
const SCOPE_ENV_PREFIX = {
  reflect: 'HINDSIGHT_API_LLM_',
  retain: 'HINDSIGHT_API_RETAIN_LLM_',
  consolidation: 'HINDSIGHT_API_CONSOLIDATION_LLM_',
  mentalModel: 'HINDSIGHT_API_MENTAL_MODEL_REFRESH_LLM_',
}

/**
 * LLM provider types hindsight-api knows natively (its PROVIDER_DEFAULT_MODELS
 * keys). A DSH provider id outside this set is launched as an openai-compatible
 * endpoint, which then REQUIRES a baseUrl override.
 */
const KNOWN_HINDSIGHT_PROVIDERS = new Set(['openai', 'openai-responses', 'anthropic', 'gemini', 'groq', 'minimax'])

/** Accepted log levels (`dist/dsh.js` WEIGHT map). */
const LOG_LEVELS = new Set(['debug', 'info', 'warn', 'error'])

/** An error carrying the HTTP status to report. */
class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const secretValues = new Set()
function rememberSecret(value) {
  if (typeof value === 'string' && value !== '') secretValues.add(value)
  return value
}

/** Project errors, URLs and log excerpts through the same secret boundary. */
function redact(value, extraSecrets = []) {
  let text = String(value ?? '')
  for (const secret of [...secretValues, ...extraSecrets].filter((s) => typeof s === 'string' && s.length > 0).sort((a, b) => b.length - a.length)) {
    text = text.split(secret).join('[REDACTED]')
  }
  return text
    .replace(/(https?:\/\/)[^\s/@]+:[^\s/@]+@/gi, '$1[REDACTED]@')
    .replace(/([?&](?:key|api[_-]?key|token|secret|password|auth|code)=)[^&#\s]*/gi, '$1[REDACTED]')
    .replace(/(authorization\s*[:=]\s*)(?:Bearer\s+|Basic\s+)?[^\s,;]+/gi, '$1[REDACTED]')
    .replace(/((?:api[_-]?key|access[_-]?token|refresh[_-]?token|secret|password|cookie)\s*["']?\s*[:=]\s*["']?)[^\s"',;}]+/gi, '$1[REDACTED]')
}

function withDeadline(promise, signal, ms = 6000) {
  return new Promise((resolveResult, reject) => {
    const abort = () => { clearTimeout(timer); reject(new HttpError(503, '操作已取消')) }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', abort)
      reject(new HttpError(504, '宿主服务解析超时'))
    }, ms)
    if (signal?.aborted) abort()
    signal?.addEventListener('abort', abort, { once: true })
    Promise.resolve(promise).then(resolveResult, reject).finally(() => {
      clearTimeout(timer)
      signal?.removeEventListener('abort', abort)
    })
  })
}

function hash(value) { return createHash('sha256').update(value).digest('hex') }
function stableJson(value) {
  if (Array.isArray(value)) return '[' + value.map(stableJson).join(',') + ']'
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map((key) => JSON.stringify(key) + ':' + stableJson(value[key])).join(',') + '}'
  return JSON.stringify(value)
}

/**
 * Accept only a same-origin loopback request.
 * Forwarded headers and arbitrary DNS names are never trusted.
 * @param req - the incoming request.
 * @param options - expected port, and whether this is a mutating request.
 * @returns whether the request is acceptable.
 */
function validLocalRequest(req, { port, mutate = false } = {}) {
  try {
    if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket?.remoteAddress)) return false
    const scheme = req.socket?.encrypted ? 'https:' : 'http:'
    const target = new URL(`${scheme}//${req.headers.host}`)
    if (!['localhost', '127.0.0.1', '[::1]'].includes(target.hostname)) return false
    if (port !== undefined && Number(target.port || (scheme === 'https:' ? 443 : 80)) !== Number(port)) return false
    const origin = req.headers.origin
    if (mutate && typeof origin !== 'string') return false
    if (origin !== undefined
      && (typeof origin !== 'string' || new URL(origin).origin !== target.origin || origin !== new URL(origin).origin)) return false
    const site = req.headers['sec-fetch-site']
    if (site !== undefined && site !== 'same-origin' && site !== 'none') return false
    return true
  } catch {
    return false
  }
}

/**
 * Why a request was rejected by {@link validLocalRequest}. Returned alongside
 * the boolean so the route handler can log the exact fence that tripped,
 * instead of guessing from a bare 403.
 * @param req - the incoming request.
 * @param options - expected port, and whether this is a mutating request.
 * @returns a human-readable reason, or null when the request is acceptable.
 */
function localRejectionReason(req, { port, mutate = false } = {}) {
  try {
    if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket?.remoteAddress)) return 'connection peer is not loopback'
    const scheme = req.socket?.encrypted ? 'https:' : 'http:'
    const target = new URL(`${scheme}//${req.headers.host}`)
    if (!['localhost', '127.0.0.1', '[::1]'].includes(target.hostname)) {
      return `host ${target.hostname} is not loopback`
    }
    if (port !== undefined && Number(target.port || (scheme === 'https:' ? 443 : 80)) !== Number(port)) {
      return `port ${target.port} does not match ${port}`
    }
    const origin = req.headers.origin
    if (mutate && typeof origin !== 'string') {
      return 'mutating request missing Origin header'
    }
    if (origin !== undefined) {
      try {
        if (new URL(origin).origin !== target.origin) {
          return `origin ${origin} is not same-origin with ${target.origin}`
        }
      } catch {
        return `origin ${String(origin)} is unparseable`
      }
    }
    const site = req.headers['sec-fetch-site']
    if (site !== undefined && site !== 'same-origin' && site !== 'none') {
      return `sec-fetch-site ${String(site)} is not same-origin`
    }
    return null
  } catch (error) {
    return `unparseable request: ${String(error?.message ?? error)}`
  }
}

/**
 * Write a JSON response.
 * @param res - the response.
 * @param status - HTTP status.
 * @param value - JSON-serialisable body.
 */
function sendJson(res, status, value) {
  if (res.destroyed || res.writableEnded) return
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  })
  res.end(JSON.stringify(value, (_key, item) => typeof item === 'string' ? redact(item) : item))
}

/**
 * Read a request body with a size cap.
 * @param req - the incoming request.
 * @returns the parsed JSON object.
 */
function readJsonBody(req, { maxBytes = 32 * 1024 } = {}) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    let settled = false
    const finish = (error, value) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (error) {
        req.resume()
        reject(error)
      } else resolve(value)
    }
    const timer = setTimeout(() => finish(new HttpError(408, 'request body timed out')), 10_000)
    timer.unref?.()
    req.on('data', (chunk) => {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      size += bytes.byteLength
      if (size > maxBytes) return finish(new HttpError(413, 'request body too large'))
      chunks.push(bytes)
    })
    req.on('end', () => {
      try {
        const value = JSON.parse(Buffer.concat(chunks).toString('utf8'))
        if (value === null || typeof value !== 'object' || Array.isArray(value)) {
          return finish(new HttpError(400, 'expected a JSON object'))
        }
        finish(null, value)
      } catch {
        finish(new HttpError(400, 'expected a valid JSON object'))
      }
    })
    req.on('error', () => finish(new HttpError(400, 'request body interrupted')))
    req.on('aborted', () => finish(new HttpError(503, 'request aborted')))
  })
}

/**
 * Fetch JSON with a deadline.
 * @param url - absolute URL.
 * @param timeoutMs - deadline in milliseconds.
 * @returns the parsed body.
 */
async function getJson(url, timeoutMs = 6000, signal) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  timer.unref?.()
  try {
    const response = await fetch(url, { signal: signal ? AbortSignal.any([controller.signal, signal]) : controller.signal, headers: { accept: 'application/json' } })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Send an HTTP request with a JSON body and read the JSON reply.
 * @param method - HTTP method.
 * @param url - absolute URL.
 * @param body - JSON-serialisable payload.
 * @param timeoutMs - deadline in milliseconds.
 * @returns the parsed body.
 */
async function sendJsonRequest(method, url, body, timeoutMs = 8000, signal) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  timer.unref?.()
  try {
    const response = await fetch(url, {
      method,
      signal: signal ? AbortSignal.any([controller.signal, signal]) : controller.signal,
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(body),
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      throw new HttpError(response.status, `Hindsight 请求失败（HTTP ${response.status}）；上游错误正文不回传以避免泄露凭据`)
    }
    return payload
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Run a short-lived system command and capture stdout.
 * @param command - executable.
 * @param args - argument list.
 * @param timeoutMs - deadline in milliseconds.
 * @returns stdout text (empty on spawn failure).
 */
function execCapture(command, args, timeoutMs = 8000) {
  return new Promise((resolveResult, reject) => {
    let out = ''
    let settled = false
    const child = spawn(command, args, { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] })
    const finish = (error) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (error) reject(error)
      else resolveResult(out)
    }
    const timeout = () => {
      // Killing a query does not guarantee a close event (e.g. inherited pipes).
      // Settle the request itself first; only this diagnostic child is stopped.
      finish(new HttpError(503, '系统进程查询/停止命令超时'))
      child.kill()
      child.unref?.()
    }
    const timer = setTimeout(timeout, timeoutMs)
    timer.unref?.()
    child.stdout?.on('data', (chunk) => {
      if (settled) return
      out += String(chunk)
      if (out.length > 256 * 1024) timeout()
    })
    child.on('error', () => finish(new HttpError(503, '系统进程查询/停止命令无法执行')))
    child.on('close', (code) => {
      if (code === 0 || (['lsof', 'ps'].includes(command) && code === 1 && out.trim() === '')) finish()
      else finish(new HttpError(503, `系统进程查询/停止命令失败（code ${code}）；不会强制终止`))
    })
  })
}

/**
 * Normalise a user-entered Control Plane address.
 *
 * This is the one address the page accepts as free text and then fetches, so
 * it is validated here rather than trusted: only http/https, no embedded
 * credentials, no query or fragment (nothing downstream reads either), and a
 * host that actually parses.
 * @param value - the raw field value.
 * @returns the normalised URL, or null when it is unusable.
 */
function normalizeControlPlaneUrl(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed === '') return DEFAULT_CONTROL_PLANE_URL
  let url
  try {
    url = new URL(trimmed)
  } catch {
    return null
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  if (url.username !== '' || url.password !== '') return null
  if (url.search !== '' || url.hash !== '') return null
  return url.origin + url.pathname.replace(/\/+$/, '')
}

/**
 * Resolve the Control Plane address: the settings file wins, then the
 * environment, then the default.
 * @param settings - this plugin's own settings object.
 * @returns the address to use.
 */
function resolveControlPlaneUrl(settings) {
  const stored = settings.controlPlaneUrl
  if (typeof stored === 'string' && stored !== '') {
    const normalized = normalizeControlPlaneUrl(stored)
    if (normalized !== null) return normalized
  }
  const fromEnv = process.env.HINDSIGHT_CP_URL
  if (typeof fromEnv === 'string' && fromEnv !== '') {
    const normalized = normalizeControlPlaneUrl(fromEnv)
    if (normalized !== null) return normalized
  }
  return DEFAULT_CONTROL_PLANE_URL
}

/**
 * Read this plugin's own settings file.
 * Missing files have defaults; malformed or unreadable files carry an explicit error.
 * @returns the parsed object.
 */
async function readJsonFile(path) {
  let text
  try {
    text = await readFile(path, 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') return { values: {}, exists: false, revision: hash('missing'), error: null }
    return { values: {}, exists: true, revision: null, error: `配置文件无法读取（${error.code ?? 'IO'}）` }
  }
  try {
    const values = JSON.parse(text)
    if (!values || typeof values !== 'object' || Array.isArray(values)) throw new Error('object required')
    return { values, exists: true, revision: hash(text), error: null }
  } catch {
    return { values: {}, exists: true, revision: hash(text), error: '配置文件不是有效的 JSON 对象；请先修复，保存不会覆盖它' }
  }
}

async function readGuiSettings() {
  const record = await readJsonFile(GUI_CONFIG_PATH)
  if (record.error) throw new HttpError(409, record.error)
  return record.values
}

async function atomicMerge(path, patch, record, state) {
  const check = () => { if (state) assertActive(state) }
  check()
  const current = record ?? await readJsonFile(path)
  if (current.error) throw new HttpError(409, current.error)
  const next = { ...current.values, ...patch }
  if (stableJson(next) === stableJson(current.values)) return next
  check()
  await mkdir(dirname(path), { recursive: true })
  const temporary = `${path}.tmp-${process.pid}-${randomUUID()}`
  try {
    check()
    await writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, { encoding: 'utf8', mode: 0o600, flag: 'wx' })
    const latest = await readJsonFile(path)
    if (latest.error || latest.revision !== current.revision) throw new HttpError(409, '配置已被其他操作修改，请刷新后重新保存')
    check()
    if (current.exists) await copyFile(path, `${path}.bak`)
    const final = await readJsonFile(path)
    if (final.error || final.revision !== current.revision) throw new HttpError(409, '配置已被其他操作修改，请刷新后重新保存')
    check()
    await rename(temporary, path)
  } finally {
    await unlink(temporary).catch((error) => { if (error.code !== 'ENOENT') throw error })
  }
  return next
}

/**
 * Merge a patch into this plugin's own settings file, atomically.
 * @param patch - whitelisted keys to set.
 * @returns the resulting settings object.
 */
async function writeGuiSettings(patch, record, state) {
  return atomicMerge(GUI_CONFIG_PATH, patch, record, state)
}

/**
 * Whether something answers at the Control Plane address.
 * A reachable server is enough; the body is not read.
 * @param baseUrl - the address to probe.
 * @returns true when the Control Plane responds.
 */
async function controlPlaneUp(baseUrl, signal) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 2500)
  timer.unref?.()
  try {
    const response = await fetch(baseUrl + '/', { signal: signal ? AbortSignal.any([controller.signal, signal]) : controller.signal, redirect: 'manual' })
    return response.status > 0
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Read the config file as a plain object.
 * Missing files have defaults; malformed or unreadable files refuse mutations.
 * @returns the parsed object.
 */
async function readConfigObject() {
  const record = await readJsonFile(CONFIG_PATH)
  if (record.error) throw new HttpError(409, record.error)
  return record.values
}

/**
 * Validate and sanitize serverModels mapping for Hindsight internal scopes.
 * @param raw - the incoming serverModels object.
 * @returns the sanitized object, or null if invalid.
 */
function normalizeServerModels(raw) {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null
  const out = {}
  for (const [key, value] of Object.entries(raw)) {
    if (!SERVER_MODEL_SCOPES.includes(key) || typeof value !== 'string') return null
    out[key] = value.trim()
  }
  return out
}

/**
 * Validate the per-provider override map: provider id → connection overrides.
 * @param raw - the incoming providerOverrides object.
 * @returns the sanitized object, or null if invalid.
 */
function normalizeProviderOverrides(raw, current = {}) {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null
  const out = { ...current }
  for (const [provider, value] of Object.entries(raw)) {
    const id = provider.trim().toLowerCase()
    if (!/^[a-z0-9][a-z0-9._-]*$/.test(id) || !value || typeof value !== 'object' || Array.isArray(value)) return null
    const entry = { ...(current[id] ?? {}) }
    for (const key of Object.keys(value)) {
      if (!['provider', 'baseUrl', 'apiKey', 'apiKeyEnv', 'clearApiKey'].includes(key)) return null
    }
    if ('provider' in value) {
      if (typeof value.provider !== 'string' || (value.provider !== '' && !KNOWN_HINDSIGHT_PROVIDERS.has(value.provider))) return null
      if (value.provider) entry.provider = value.provider
      else delete entry.provider
    }
    if ('baseUrl' in value) {
      if (typeof value.baseUrl !== 'string') return null
      if (value.baseUrl.trim() === '') delete entry.baseUrl
      else {
        const url = normalizeControlPlaneUrl(value.baseUrl)
        if (url === null) return null
        entry.baseUrl = url
      }
    }
    if ('apiKeyEnv' in value) {
      if (typeof value.apiKeyEnv !== 'string' || (value.apiKeyEnv.trim() !== '' && !/^[A-Za-z_][A-Za-z0-9_]*$/.test(value.apiKeyEnv.trim()))) return null
      if (value.apiKeyEnv.trim()) entry.apiKeyEnv = value.apiKeyEnv.trim()
      else delete entry.apiKeyEnv
    }
    if ('clearApiKey' in value && typeof value.clearApiKey !== 'boolean') return null
    if ('apiKey' in value && typeof value.apiKey !== 'string') return null
    if (value.clearApiKey === true && value.apiKey?.trim()) return null
    if (value.clearApiKey === true) delete entry.apiKey
    else if (value.apiKey?.trim()) entry.apiKey = rememberSecret(value.apiKey.trim())
    if (Object.keys(entry).length > 0) out[id] = entry
    else delete out[id]
  }
  return out
}

function publicProviderOverrides(raw = {}) {
  const out = {}
  for (const [id, entry] of Object.entries(raw)) {
    if (!entry || typeof entry !== 'object') continue
    rememberSecret(entry.apiKey)
    out[id] = {
      provider: typeof entry.provider === 'string' ? entry.provider : '',
      baseUrl: typeof entry.baseUrl === 'string' ? redact(entry.baseUrl) : '',
      apiKeyEnv: typeof entry.apiKeyEnv === 'string' ? entry.apiKeyEnv : '',
      secretConfigured: typeof entry.apiKey === 'string' && entry.apiKey !== '',
    }
  }
  return out
}

const EMBEDDING_PROVIDERS = new Set(['', 'local', 'openai', 'onnx', 'tei'])
const EMBEDDING_DEFAULTS = { provider: '', model: '', baseUrl: '', dimensions: null, apiKeyEnv: '', localForceCpu: null }

/** Dedicated settings do not migrate or overwrite the existing advanced environment. */
function normalizeServerEmbeddings(raw, current = {}) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !current || typeof current !== 'object' || Array.isArray(current)) return null
  const allowed = [...Object.keys(EMBEDDING_DEFAULTS), 'apiKey', 'clearApiKey']
  if ([...Object.keys(raw), ...Object.keys(current)].some((key) => !allowed.includes(key))) return null
  const next = { ...EMBEDDING_DEFAULTS, ...current }
  // A model/URL from one backend must never become another backend's default.
  // Keep only the separately owned OpenAI secret unless it is explicitly cleared.
  if (typeof raw.provider === 'string' && raw.provider.trim() !== (current.provider ?? '')) {
    Object.assign(next, EMBEDDING_DEFAULTS)
  }
  for (const key of ['provider', 'model', 'baseUrl', 'apiKeyEnv']) {
    if (key in raw) {
      if (typeof raw[key] !== 'string') return null
      next[key] = raw[key].trim()
    }
  }
  if (!EMBEDDING_PROVIDERS.has(next.provider)) return null
  if (next.baseUrl !== '') {
    const url = normalizeControlPlaneUrl(next.baseUrl)
    if (url === null) return null
    next.baseUrl = url
  }
  if (next.apiKeyEnv !== '' && !/^[A-Za-z_][A-Za-z0-9_]*$/.test(next.apiKeyEnv)) return null
  if ('dimensions' in raw) next.dimensions = raw.dimensions
  if (next.dimensions !== null && (!Number.isSafeInteger(next.dimensions) || next.dimensions <= 0)) return null
  if ('localForceCpu' in raw) next.localForceCpu = raw.localForceCpu
  if (next.localForceCpu !== null && typeof next.localForceCpu !== 'boolean') return null
  if ('apiKey' in raw && typeof raw.apiKey !== 'string') return null
  if ('clearApiKey' in raw && typeof raw.clearApiKey !== 'boolean') return null
  if (raw.clearApiKey === true && raw.apiKey?.trim()) return null
  if (raw.clearApiKey === true) delete next.apiKey
  else if (raw.apiKey?.trim()) next.apiKey = rememberSecret(raw.apiKey.trim())
  if (next.apiKey !== undefined && typeof next.apiKey !== 'string') return null
  const activeFields = { local: ['model', 'localForceCpu'], openai: ['model', 'baseUrl', 'dimensions', 'apiKeyEnv'], onnx: ['model', 'dimensions'], tei: ['baseUrl'] }[next.provider] ?? []
  for (const key of Object.keys(EMBEDDING_DEFAULTS)) {
    if (key !== 'provider' && !activeFields.includes(key)) next[key] = EMBEDDING_DEFAULTS[key]
  }
  rememberSecret(next.apiKey)
  delete next.clearApiKey
  return next
}

function publicServerEmbeddings(raw) {
  const settings = normalizeServerEmbeddings(raw ?? {})
  if (settings === null) return { ...EMBEDDING_DEFAULTS, secretConfigured: false, error: '向量模型专用配置无效' }
  const { apiKey, ...publicSettings } = settings
  rememberSecret(apiKey)
  return { ...publicSettings, secretConfigured: typeof apiKey === 'string' && apiKey !== '' }
}

/** Apply only active-provider fields after passthrough; absent/blank fields inherit. */
async function applyServerEmbeddings(gui, env, ctx, signal) {
  const settings = normalizeServerEmbeddings(gui.serverEmbeddings ?? {})
  const preview = { provider: null, model: null, baseUrl: null, dimensions: null,
    credentialSource: null, secretConfigured: false, source: 'default', mode: 'inherit',
    note: '继承现有启动环境或 Hindsight 默认值；不是当前运行配置',
    warnings: ['更换向量模型或维度可能需要重建/迁移已有向量索引，本页不会执行迁移。'] }
  if (settings === null) return { ...preview, mode: 'error', note: '已保存的 serverEmbeddings 无效，请先修复配置' }
  const prefix = 'HINDSIGHT_API_EMBEDDINGS_'
  const explicit = settings.provider !== ''
  preview.source = explicit ? 'file'
    : Object.keys(gui.serverEnv ?? {}).some((key) => key.startsWith(prefix)) ? 'serverEnv'
      : Object.keys(process.env).some((key) => key.startsWith(prefix)) ? 'env' : 'default'
  preview.mode = explicit ? 'override' : 'inherit'
  if (explicit) env[`${prefix}PROVIDER`] = settings.provider
  const provider = env[`${prefix}PROVIDER`] || null
  preview.provider = provider
  const modelKey = { local: `${prefix}LOCAL_MODEL`, openai: `${prefix}OPENAI_MODEL`, onnx: `${prefix}ONNX_MODEL_ID` }[provider]
  const urlKey = { openai: `${prefix}OPENAI_BASE_URL`, tei: `${prefix}TEI_URL` }[provider]
  const dimensionKey = { openai: `${prefix}OPENAI_DIMENSIONS`, onnx: `${prefix}ONNX_DIMENSIONS` }[provider]
  if (explicit) {
    if (modelKey && settings.model !== '') env[modelKey] = settings.model
    if (urlKey && settings.baseUrl !== '') env[urlKey] = settings.baseUrl
    if (dimensionKey && settings.dimensions !== null) env[dimensionKey] = String(settings.dimensions)
    if (provider === 'local' && settings.localForceCpu !== null) env[`${prefix}LOCAL_FORCE_CPU`] = String(settings.localForceCpu)
    if (provider === 'openai' && (settings.apiKey || settings.apiKeyEnv)) {
      try {
        const credential = await lookupCredential('openai', settings, ctx, signal)
        if (credential.value === null) return { ...preview, mode: 'error', note: '向量模型凭据引用无法解析；不会使用另一来源代替该显式引用' }
        env[`${prefix}OPENAI_API_KEY`] = credential.value
        preview.credentialSource = credential.source
      } catch {
        return { ...preview, mode: 'error', note: '向量模型凭据服务解析失败或操作取消' }
      }
    }
  }
  preview.model = modelKey && typeof env[modelKey] === 'string' && env[modelKey] !== '' ? env[modelKey] : null
  preview.baseUrl = urlKey && typeof env[urlKey] === 'string' && env[urlKey] !== '' ? env[urlKey] : null
  if (preview.baseUrl !== null) {
    // Preserve legal inherited query parameters (e.g. Azure api-version).
    // The dedicated form remains stricter; never rewrite the passthrough itself.
    let parsed
    try { parsed = new URL(preview.baseUrl) } catch { parsed = null }
    if (!parsed || !['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.hash) {
      return { ...preview, baseUrl: redact(preview.baseUrl), mode: 'error', note: '向量模型端点不是合法的无凭据 http(s) 地址' }
    }
    preview.baseUrl = redact(preview.baseUrl)
  }
  if (dimensionKey && env[dimensionKey]) {
    const value = Number(env[dimensionKey])
    if (!/^\d+$/.test(env[dimensionKey]) || !Number.isSafeInteger(value) || value <= 0) return { ...preview, mode: 'error', note: '向量维度必须为正整数' }
    preview.dimensions = value
  }
  if (provider === 'openai') {
    const key = env[`${prefix}OPENAI_API_KEY`] || env.HINDSIGHT_API_LLM_API_KEY
    preview.secretConfigured = typeof key === 'string' && key !== ''
    rememberSecret(key)
    if (preview.credentialSource === null && preview.secretConfigured) preview.credentialSource = env[`${prefix}OPENAI_API_KEY`] ? '继承向量环境凭据' : '继承服务端 LLM 凭据'
    if (!preview.secretConfigured) return { ...preview, mode: 'error', note: '当前核验的 Hindsight 版本要求非空向量 API Key 或服务端 LLM Key。本地免鉴权端点也需由用户明确配置非敏感占位值；本页不会自动生成凭据。' }
  }
  if (provider === 'local' || provider === 'onnx') preview.warnings.push('本地运行依赖和模型文件需自行准备，启动时 Hindsight 可能下载模型；本页不会下载或启用 trust_remote_code。')
  if (provider === 'tei' && preview.baseUrl === null) return { ...preview, mode: 'error', note: 'TEI 后端要求服务地址，请填写地址或在既有环境中配置 HINDSIGHT_API_EMBEDDINGS_TEI_URL。' }
  preview.note = explicit ? '下次本插件启动时应用；空字段仍继承现有启动环境/后端默认值'
    : provider === 'tei' ? '继承 TEI 端点；模型和维度由远端 TEI 服务决定'
      : '继承现有启动环境；未显示的模型/维度由 Hindsight 或远端服务决定'
  return preview
}

/**
 * Validate the advanced environment passthrough map.
 * @param raw - the incoming serverEnv object.
 * @returns the sanitized object (string → string), or null if invalid.
 */
function normalizeServerEnv(raw) {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null
  const out = {}
  for (const [key, value] of Object.entries(raw)) {
    if (!/^(?:HINDSIGHT_API_[A-Z0-9_]+|NO_PROXY|no_proxy|PYTHONUTF8)$/.test(key) || typeof value !== 'string') return null
    out[key] = value
  }
  return out
}

/**
 * Keep only whitelisted, correctly typed keys.
 *
 * Keys this plugin owns but stores elsewhere (the GUI_WRITABLE_KEYS set) are
 * accepted here as no-ops and routed to their own file by the caller — counting
 * them as rejected would report a successful save as a rejection.
 * @param body - the request body.
 * @returns the accepted patch and the rejected key names.
 */
function sanitizePatch(body) {
  const patch = {}
  const rejected = []
  for (const [key, value] of Object.entries(body)) {
    if (GUI_WRITABLE_KEYS.includes(key) || key === 'configRevision' || key === 'guiRevision') continue
    if (!WRITABLE_KEYS.includes(key)) {
      rejected.push(key)
      continue
    }
    if (key === 'logLevel') {
      if (typeof value !== 'string' || !LOG_LEVELS.has(value)) {
        rejected.push(key)
        continue
      }
    } else if (key === 'apiUrl' || key === 'bankId' || key === 'surveyModel') {
      if (typeof value !== 'string') {
        rejected.push(key)
        continue
      }
      if (key === 'apiUrl' && value.trim() !== '' && normalizeControlPlaneUrl(value) === null) {
        throw new HttpError(400, 'apiUrl 必须是无凭据、查询参数或片段的 http(s) 地址')
      }
    } else if (typeof value !== 'boolean') {
      rejected.push(key)
      continue
    }
    patch[key] = value
  }
  return { patch, rejected }
}

/**
 * Merge a patch into the config file.
 *
 * The merge is deliberately conservative: every key the page does not own is
 * carried over verbatim, so hand-written sections (`banks`, `paths`,
 * `mapPathToBank`, …) survive a save. The write goes through a temporary file
 * and a rename, so a crash mid-write cannot leave a half-written config behind.
 *
 * @param patch - whitelisted keys to set.
 * @returns the resulting config object.
 */
async function writeConfigPatch(patch, record, state) {
  return atomicMerge(CONFIG_PATH, patch, record, state)
}

/* ---------------------------------------------------------------------------
 * Service manager: discovery, environment building, process lifecycle.
 * ------------------------------------------------------------------------- */

/** A receipt is evidence of our launch, not permission to kill a port occupant. */
const SERVER_RECEIPT_PATH = `${GUI_CONFIG_PATH}.server.json`
function createServerState() {
  return { child: null, identity: null, launcherIdentity: null, managerIdentity: null,
    recovered: false, recovery: null, receiptQueue: Promise.resolve(), target: null, managedPid: null, startedAt: null,
    entry: null, lastAction: null, operation: null, runningConfig: null, launchConfig: null,
    exited: true, timedOut: false, spawnError: null, disposed: false,
    controller: new AbortController() }
}

function assertActive(state) {
  if (state.disposed || state.controller.signal.aborted) throw new HttpError(503, '插件已卸载，操作已取消')
}

function apiTarget(configObj) {
  const raw = typeof configObj.apiUrl === 'string' && configObj.apiUrl.trim() !== '' ? configObj.apiUrl.trim() : API_BASE
  const base = normalizeControlPlaneUrl(raw)
  if (base === null) throw new HttpError(400, 'apiUrl 无效；不会静默连接默认服务')
  const url = new URL(base)
  const port = Number(url.port || (url.protocol === 'https:' ? 443 : 80))
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  // The discovered CLI only serves plain HTTP on IPv4 loopback, without a mount path.
  const local = loopback && url.hostname !== '[::1]' && url.protocol === 'http:' && url.pathname === '/'
  return { base, port, local }
}

/**
 * Whether the API answers /health.
 * @param base - API base origin.
 * @returns true when /health responds.
 */
async function isApiUp(base, signal) {
  try {
    const health = await getJson(`${base}/health`, 2500, signal)
    return health?.status === 'healthy' || health?.status === 'ok'
  } catch {
    return false
  }
}

/**
 * Find the PID of the process listening on a local TCP port.
 * @param port - the port to look for.
 * @returns the PID, or null when nothing listens.
 */
async function findListenerPid(port) {
  let pids
  if (process.platform === 'win32') {
    const out = await execCapture('netstat', ['-ano', '-p', 'tcp'])
    pids = out.split(/\r?\n/).flatMap((line) => {
      const match = line.match(/\s(?:\d{1,3}(?:\.\d{1,3}){3}|\[[^\]]+\]):(\d+)\s+\S+\s+LISTENING\s+(\d+)\s*$/i)
      return match && Number(match[1]) === port ? [Number(match[2])] : []
    })
  } else {
    const out = await execCapture('lsof', ['-ti', `tcp:${port}`, '-s', 'TCP:LISTEN'])
    pids = out.trim().split(/\s+/).map(Number).filter((pid) => Number.isInteger(pid) && pid > 0)
  }
  const unique = [...new Set(pids)]
  if (unique.length > 1) throw new HttpError(409, '同端口存在多个监听身份，无法安全管理')
  return unique[0] ?? null
}

async function processIdentity(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return null
  if (process.platform === 'win32') {
    const script = `[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new(); $p = Get-CimInstance Win32_Process -Filter 'ProcessId = ${pid}'; if ($p) { @{ pid = $p.ProcessId; parentPid = $p.ParentProcessId; executable = $p.ExecutablePath; started = $p.CreationDate.ToUniversalTime().ToString('o') } | ConvertTo-Json -Compress }`
    const out = await execCapture('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script])
    if (!out.trim()) return null
    let value
    try { value = JSON.parse(out) } catch { throw new HttpError(503, '进程身份查询返回无效数据') }
    if (value.pid !== pid || typeof value.executable !== 'string' || !value.executable || typeof value.started !== 'string' || !value.started) return null
    return { pid, parentPid: value.parentPid, executable: resolve(value.executable).toLowerCase(), started: value.started }
  }
  const out = await execCapture('ps', ['-p', String(pid), '-o', 'ppid=', '-o', 'lstart=', '-o', 'comm='])
  const match = out.trim().match(/^(\d+)\s+(\S+\s+\S+\s+\d+\s+\d+:\d+:\d+\s+\d+)\s+(.+)$/)
  return match ? { pid, parentPid: Number(match[1]), executable: match[3], started: match[2] } : null
}

function validIdentity(identity) {
  return identity && Number.isInteger(identity.pid) && identity.pid > 0
    && typeof identity.executable === 'string' && identity.executable !== ''
    && typeof identity.started === 'string' && identity.started !== ''
}
function sameIdentity(a, b) {
  // Parent PID can change after reparenting; it is not part of process identity.
  return validIdentity(a) && validIdentity(b) && a.pid === b.pid
    && a.executable === b.executable && a.started === b.started
}
function liveChild(state) { return !state.exited && state.managedPid > 0 }
async function ownsProcess(state) {
  if (!liveChild(state) || state.identity === null) return false
  const expected = state.identity
  const identity = await processIdentity(expected.pid)
  // Status polling can overlap restart/promotion. A late query about the old
  // process must never clear the replacement's identity.
  if (state.identity !== expected || !liveChild(state)) return false
  if (sameIdentity(identity, expected)) return true
  state.exited = true
  state.managedPid = null
  state.runningConfig = null
  return false
}

/** Verify ancestry back to the exact launch identity, never just an executable name. */
async function launchedListener(pid, state) {
  const listener = await processIdentity(pid)
  let current = listener
  const seen = new Set()
  for (let depth = 0; current && depth < 8; depth++) {
    assertActive(state)
    if (sameIdentity(current, state.launcherIdentity)) return listener
    if (!Number.isInteger(current.parentPid) || current.parentPid <= 0 || seen.has(current.parentPid)) return null
    seen.add(current.pid)
    const parent = await processIdentity(current.parentPid)
    // A reused parent PID cannot prove descent from our earlier launch.
    const parentStarted = Date.parse(parent?.started)
    const childStarted = Date.parse(current.started)
    if (!parent || !Number.isFinite(parentStarted) || !Number.isFinite(childStarted) || parentStarted > childStarted) return null
    current = parent
  }
  return null
}

function saveServerReceipt(state) {
  const next = state.receiptQueue.then(async () => {
    assertActive(state)
    // Snapshot inside the queue: slow status writes cannot overwrite a newer launch.
    const receipt = { version: 1, managerIdentity: state.managerIdentity,
      launcherIdentity: state.launcherIdentity, identity: state.identity, target: state.target,
      entry: state.entry, startedAt: state.startedAt, launchConfig: state.launchConfig,
      runningConfig: state.runningConfig }
    const temporary = `${SERVER_RECEIPT_PATH}.tmp-${process.pid}-${randomUUID()}`
    try {
      await writeFile(temporary, JSON.stringify(receipt), { mode: 0o600 })
      assertActive(state)
      await rename(temporary, SERVER_RECEIPT_PATH)
    } finally {
      await unlink(temporary).catch((error) => { if (error.code !== 'ENOENT') throw error })
    }
  })
  // Keep the queue usable, but return the original rejection to the caller.
  state.receiptQueue = next.catch(() => {})
  return next
}

async function recoverServer(state) {
  if (state.recovery) return state.recovery
  if (state.recovered || liveChild(state)) return
  state.recovery = (async () => {
    const record = await readJsonFile(SERVER_RECEIPT_PATH)
    assertActive(state)
    if (record.error) throw new HttpError(503, '服务归属记录不可读；拒绝恢复管理')
    if (!record.exists) { state.recovered = true; return }
    const saved = record.values
    if (saved.version !== 1 || !validIdentity(saved.identity) || !validIdentity(saved.launcherIdentity)
      || !validIdentity(saved.managerIdentity) || typeof saved.target?.base !== 'string') {
      throw new HttpError(503, '服务归属记录无效；拒绝恢复管理')
    }
    const target = apiTarget({ apiUrl: saved.target.base })
    if (!target.local || target.port !== saved.target.port) throw new HttpError(503, '服务归属记录的地址无效')
    const manager = await processIdentity(saved.managerIdentity.pid)
    if (sameIdentity(manager, saved.managerIdentity) && manager.pid !== process.pid) {
      throw new HttpError(409, '服务仍由另一个存活的 DSH 进程管理；不会争抢接管')
    }
    const identity = await processIdentity(saved.identity.pid)
    if (!sameIdentity(identity, saved.identity)) { state.recovered = true; return }
    const currentManager = await processIdentity(process.pid)
    if (!currentManager) throw new HttpError(503, '当前 DSH 进程身份无法核验')
    assertActive(state)
    state.identity = identity
    state.launcherIdentity = saved.launcherIdentity
    state.managedPid = identity.pid
    state.target = target
    state.entry = saved.entry
    state.startedAt = saved.startedAt
    state.launchConfig = saved.launchConfig ?? null
    state.runningConfig = saved.runningConfig ?? null
    state.exited = false
    state.managerIdentity = currentManager
    await saveServerReceipt(state)
    state.recovered = true
  })()
  try { await state.recovery } finally { state.recovery = null }
}

async function reconcileListener(state, pid) {
  if (pid === null || pid === state.managedPid || !liveChild(state)) return
  // Promotion is only allowed from the retained launcher to its verified descendant.
  if (!sameIdentity(state.identity, state.launcherIdentity)) return
  const expected = state.identity
  const identity = await launchedListener(pid, state)
  if (!identity || state.identity !== expected) return
  assertActive(state)
  state.identity = identity
  state.managedPid = identity.pid
  await saveServerReceipt(state)
}

async function ownershipView(state, target) {
  try {
    await recoverServer(state)
    const pid = target.local ? await findListenerPid(target.port) : null
    if (state.target?.port === target.port) await reconcileListener(state, pid)
    const owned = await ownsProcess(state)
    if (owned && target.local && (pid === null || (state.target?.port === target.port && pid === state.managedPid))) {
      const originalListener = await findListenerPid(state.target.port)
      if (originalListener === null || originalListener === state.managedPid) return { ownership: 'managed', canStart: false, canRestart: true }
    }
    if (!target.local || pid !== null || liveChild(state)) return { ownership: 'unmanaged', canStart: false, canRestart: false }
    return { ownership: 'stopped', canStart: true, canRestart: false }
  } catch (error) {
    return { ownership: 'unknown', canStart: false, canRestart: false, ownershipError: redact(error.message) }
  }
}

function pause(ms, state) {
  assertActive(state)
  return new Promise((resolveWait, reject) => {
    const signal = state.controller.signal
    const aborted = () => { clearTimeout(timer); reject(new HttpError(503, '插件已卸载，等待已取消')) }
    const timer = setTimeout(() => { signal.removeEventListener('abort', aborted); resolveWait() }, ms)
    signal.addEventListener('abort', aborted, { once: true })
  })
}

/** Stop only the verified launch/receipt identity, never a port's arbitrary occupant. */
async function stopOwnedServer(state) {
  const target = state.target
  if (!target || !await ownsProcess(state)) throw new HttpError(409, '无法核验本插件启动的进程身份；拒绝停止')
  const ownedPid = state.managedPid
  const listener = await findListenerPid(target.port)
  if (listener !== null && listener !== state.managedPid) throw new HttpError(409, '原端口已由其他进程占用；拒绝停止')
  if (!await ownsProcess(state)) throw new HttpError(409, '进程身份发生变化；拒绝停止')
  assertActive(state)
  if (process.platform === 'win32') {
    // Node kill(SIGTERM) is forceful on Windows. Request non-force termination only;
    // console launchers may refuse it, in which case manual shutdown is required.
    await execCapture('taskkill', ['/PID', String(ownedPid)])
  } else if (state.child?.pid === ownedPid) {
    if (!state.child.kill('SIGTERM')) throw new HttpError(502, '服务未接受停止信号')
  } else process.kill(ownedPid, 'SIGTERM')
  const deadline = Date.now() + 8000
  while (Date.now() < deadline) {
    assertActive(state)
    const pid = await findListenerPid(target.port)
    if (pid !== null && pid !== ownedPid) throw new HttpError(409, '关闭期间端口被其他进程占用；不会启动新进程')
    if (!await ownsProcess(state) && pid === null) { state.runningConfig = null; return }
    await pause(250, state)
  }
  throw new HttpError(502, '服务未完成停止；不会强制终止或重复启动，请手动关闭后再启动')
}

/**
 * Locate a `hindsight-api` executable without trusting any machine-specific
 * path: explicit GUI override first, then PATH, then the common per-user
 * install locations of uv and pip.
 * @param gui - this plugin's settings object.
 * @returns {command, source} or null with a reason when nothing was found.
 */
function resolveServerEntry(gui) {
  const explicit = typeof gui.serverCommand === 'string' ? gui.serverCommand.trim() : ''
  if (explicit !== '') {
    if (!existsSync(explicit)) {
      return { entry: null, reason: `serverCommand 指定的文件不存在：${explicit}` }
    }
    return { entry: { command: explicit, source: 'config' } }
  }
  const executable = process.platform === 'win32' ? 'hindsight-api.exe' : 'hindsight-api'
  const pathDirs = (process.env.PATH ?? '').split(delimiter).filter(Boolean)
  for (const dir of pathDirs) {
    const candidate = join(dir, executable)
    if (existsSync(candidate)) return { entry: { command: candidate, source: 'PATH' } }
  }
  const candidates = process.platform === 'win32'
    ? [join(process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming'), 'uv', 'tools', 'hindsight-api', 'Scripts', executable)]
    : [
        join(homedir(), '.local', 'share', 'uv', 'tools', 'hindsight-api', 'bin', executable),
        join(homedir(), '.local', 'bin', executable),
      ]
  for (const candidate of candidates) {
    if (existsSync(candidate)) return { entry: { command: candidate, source: 'default install location' } }
  }
  return {
    entry: null,
    reason: '未找到 hindsight-api 可执行文件。请先安装（uv tool install hindsight-api 或 pip install hindsight-api），或在「服务管理」中指定完整路径。',
  }
}

/**
 * Resolve a validated reference through the existing DSH credentials service.
 * Never scan provider-owned YAML or depend on a hardcoded profile/store path.
 * @param name - credential name, e.g. `COMMANDCODE_API_KEY`.
 * @returns the secret, or null.
 */
async function lookupDshStoreCredential(name, ctx, signal) {
  const credentials = ctx?.get('credentials')
  if (!credentials || typeof credentials.resolve !== 'function') return null
  const result = await withDeadline(credentials.resolve(name), signal)
  if (!result || typeof result.value !== 'string' || result.value.trim() === '') return null
  return { value: rememberSecret(result.value), source: `dsh-credentials:${name}` }
}

/**
 * Resolve one provider's API key: GUI override → environment variable →
 * DSH credential store. Every step is visible in the returned source label.
 * @param provider - DSH provider id (lowercase).
 * @param overrides - the provider's override entry, when present.
 * @returns {value, source} or null with the names that were tried.
 */
async function lookupCredential(provider, overrides, ctx, signal) {
  if (overrides && typeof overrides.apiKey === 'string' && overrides.apiKey !== '') {
    return { value: rememberSecret(overrides.apiKey), source: '设置页配置' }
  }
  const upper = provider.toUpperCase().replace(/[^A-Z0-9_]/g, '_')
  const names = overrides?.apiKeyEnv ? [overrides.apiKeyEnv] : [`${upper}_API_KEY`, `${upper}_TOKEN`]
  for (const name of names) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) throw new HttpError(400, '无效的凭据引用名')
    const fromEnv = process.env[name]
    if (typeof fromEnv === 'string' && fromEnv.trim() !== '') return { value: rememberSecret(fromEnv.trim()), source: `env:${name}` }
    const fromStore = await lookupDshStoreCredential(name, ctx, signal)
    if (fromStore) return fromStore
  }
  return { value: null, tried: names }
}

/**
 * Build the server process environment from the GUI settings.
 *
 * It copies process.env and never mutates it; credential lookup uses the host seam. Each scope's
 * resolution outcome is reported so the page can show exactly what a
 * start/restart will apply — including failures, which are never silent.
 * @param gui - this plugin's settings object.
 * @returns the env plus per-scope resolutions.
 */
async function buildServerEnv(gui, ctx, signal) {
  const env = { ...process.env }
  const passthrough = normalizeServerEnv(gui.serverEnv ?? {})
  if (passthrough === null) throw new HttpError(400, 'serverEnv 只允许 HINDSIGHT_API_*、NO_PROXY/no_proxy 和 PYTHONUTF8 的字符串值')
  Object.assign(env, passthrough)
  for (const [key, value] of Object.entries(env)) if (/KEY|TOKEN|SECRET|PASSWORD|AUTH|COOKIE/i.test(key)) rememberSecret(value)
  if (normalizeServerModels(gui.serverModels ?? {}) === null) throw new HttpError(400, '已保存的 serverModels 无效')
  const validatedOverrides = normalizeProviderOverrides(gui.providerOverrides ?? {})
  if (validatedOverrides === null) throw new HttpError(400, '已保存的 providerOverrides 无效')
  // hindsight-api talks to local endpoints (its own DB, LLM gateways through
  // loopback proxies); a broken inherited NO_PROXY has already crashed httpx
  // client construction on one machine, so normalise it. httpx parses each
  // NO_PROXY entry and BRACKETS IPv6 hosts itself (`all://[::1]`), so the
  // entries must be BARE `::1` — a bracketed `[::1]` entry fails
  // ipaddress.IPv6Address, falls through to the wildcard mount
  // `all://*[::1]`, and raises `InvalidURL: Invalid port: ':1]'` at client
  // construction. Normalise any inherited bracketed form to bare.
  const additions = ['localhost', '127.0.0.1', '::1']
  const existing = (env.NO_PROXY ?? env.no_proxy ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => (part === '[::1]' ? '::1' : part))
  const merged = Array.from(new Set([...existing, ...additions])).join(',')
  env.NO_PROXY = merged
  env.no_proxy = merged
  // The startup banner uses block glyphs a GBK console cannot encode.
  env.PYTHONUTF8 = '1'

  const models = gui.serverModels && typeof gui.serverModels === 'object' && !Array.isArray(gui.serverModels)
    ? gui.serverModels
    : {}
  const overridesMap = validatedOverrides
  const resolutions = []

  for (const [scope, prefix] of Object.entries(SCOPE_ENV_PREFIX)) {
    const spec = typeof models[scope] === 'string' ? models[scope].trim() : ''
    if (spec === '') {
      resolutions.push({ scope, spec: '', applied: false, mode: 'default', model: env[`${prefix}MODEL`] ?? env.HINDSIGHT_API_LLM_MODEL ?? null,
        llmProvider: env[`${prefix}PROVIDER`] ?? env.HINDSIGHT_API_LLM_PROVIDER ?? null,
        note: '未指定，继承启动环境或 hindsight-api 默认；不是当前服务配置' })
      continue
    }
    const slash = spec.indexOf('/')
    const inheritedProvider = env[`${prefix}PROVIDER`] ?? env.HINDSIGHT_API_LLM_PROVIDER
    const provider = (slash > 0 ? spec.slice(0, slash) : inheritedProvider ?? '').toLowerCase()
    const model = slash > 0 ? spec.slice(slash + 1) : spec
    if (!provider || !model || !/^[a-z0-9][a-z0-9._-]*$/.test(provider)) {
      resolutions.push({ scope, spec, applied: false, mode: 'error', note: '请使用 provider/model；裸模型名必须先在启动环境中配置默认 Provider' })
      continue
    }
    const overrides = overridesMap[provider] ?? null
    const llmProvider = (overrides && typeof overrides.provider === 'string' ? overrides.provider : null)
      ?? (KNOWN_HINDSIGHT_PROVIDERS.has(provider) ? provider : 'openai')
    const baseUrl = overrides && typeof overrides.baseUrl === 'string' ? overrides.baseUrl
      : (slash <= 0 ? env[`${prefix}BASE_URL`] ?? env.HINDSIGHT_API_LLM_BASE_URL ?? null : null)
    if (llmProvider === 'openai' && baseUrl === null && !KNOWN_HINDSIGHT_PROVIDERS.has(provider)) {
      resolutions.push({
        scope,
        spec,
        provider,
        model,
        applied: false,
        mode: 'error',
        note: `provider "${provider}" 不是 hindsight-api 内置类型，需在「Provider 覆盖」中为它填写 openai 兼容的 Base URL`,
      })
      continue
    }
    let credential
    try {
      const inheritedKey = slash <= 0 ? env[`${prefix}API_KEY`] ?? env.HINDSIGHT_API_LLM_API_KEY : null
      credential = inheritedKey && !overrides?.apiKey && !overrides?.apiKeyEnv
        ? { value: rememberSecret(inheritedKey), source: '继承启动环境' }
        : await lookupCredential(provider, overrides, ctx, signal)
    } catch {
      resolutions.push({ scope, spec, provider, model, applied: false, mode: 'error', note: '宿主凭据服务解析失败；不会静默回退' })
      continue
    }
    if (credential.value === null) {
      resolutions.push({
        scope,
        spec,
        provider,
        model,
        applied: false,
        mode: 'error',
        note: `未找到 provider "${provider}" 的 API Key（已尝试：设置页覆盖、环境变量 ${(credential.tried ?? []).join(' / ')}、DSH 凭据库）`,
      })
      continue
    }
    env[`${prefix}PROVIDER`] = llmProvider
    env[`${prefix}MODEL`] = model
    env[`${prefix}API_KEY`] = credential.value
    if (baseUrl !== null) {
      const normalized = normalizeControlPlaneUrl(baseUrl)
      if (normalized === null) {
        resolutions.push({ scope, spec, applied: false, mode: 'error', note: 'Base URL 无效' })
        continue
      }
      env[`${prefix}BASE_URL`] = normalized
    } else delete env[`${prefix}BASE_URL`]
    resolutions.push({
      scope,
      spec,
      provider,
      model,
      llmProvider,
      baseUrl,
      applied: true,
      mode: 'override',
      credentialSource: credential.source,
    })
  }

  const embeddingPreview = await applyServerEmbeddings(gui, env, ctx, signal)

  if (gui.auditLogEnabled === true) env.HINDSIGHT_API_AUDIT_LOG_ENABLED = 'true'
  else if (gui.auditLogEnabled === false) env.HINDSIGHT_API_AUDIT_LOG_ENABLED = 'false'

  // The plugin manages per-bank configuration (the redaction toggle writes it
  // through the bank config API), and hindsight-api gates those writes behind
  // HINDSIGHT_API_ENABLE_BANK_CONFIG_API — off by default, so one PATCH came
  // back 403 and the toggle snapped back silently. A server this plugin
  // launches therefore turns it on, unless the user set it explicitly (the
  // serverEnv passthrough below wins).
  if (env.HINDSIGHT_API_ENABLE_BANK_CONFIG_API === undefined) env.HINDSIGHT_API_ENABLE_BANK_CONFIG_API = 'true'

  // Passthrough was applied first; explicit GUI model/audit settings win, so the
  // resolution preview and final launch environment cannot disagree.
  return { env, resolutions, embeddingPreview }
}

function launchFingerprint(target, entry, env) {
  const relevant = Object.fromEntries(Object.entries(env).filter(([key]) => /^HINDSIGHT_API_|^(?:NO_PROXY|no_proxy|PYTHONUTF8)$/.test(key)))
  return hash(stableJson({ base: target.base, command: entry?.command ?? null, env: relevant }))
}

/** How long to wait for /health after a launch, in milliseconds. */
const STARTUP_TIMEOUT_MS = 90_000

/** How much of the server log tail (bytes) to scan for a root cause. */
const STARTUP_LOG_TAIL_BYTES = 262_144

/**
 * Distil a human-actionable root cause from the tail of the server log after a
 * failed launch. hindsight-api logs the real reason — an embedding endpoint
 * that is down, a taken port, a bad credential, a broken install — as a Python
 * traceback; the bare "process exited (code 1)" tells the user nothing they can
 * act on, which used to leave the settings page stuck on "starting".
 * @param {string} logPath - the server log the child writes to.
 * @param {Record<string, string>} env - the environment the child runs with.
 * @returns {Promise<string|null>} a one-line cause + what to do, or null when nothing matched.
 */
export async function summarizeStartupFailure(logPath, env) {
  let tail = ''
  try {
    const info = await stat(logPath)
    const fd = openSync(logPath, 'r')
    try {
      const start = Math.max(0, info.size - STARTUP_LOG_TAIL_BYTES)
      const length = info.size - start
      const buffer = Buffer.alloc(length)
      readSync(fd, buffer, 0, length, start)
      tail = buffer.toString('utf8')
    } finally {
      closeSync(fd)
    }
  } catch {
    return null // No log yet (or unreadable): nothing to distil from.
  }
  tail = redact(tail, Object.entries(env).filter(([key]) => /KEY|TOKEN|SECRET|PASSWORD|AUTH|COOKIE/i.test(key)).map(([, value]) => value))
  const lines = tail.split(/\r?\n/)

  // Connection refused at startup init — the failure this machine actually
  // hit: LM Studio (the configured embedding endpoint) was not running, and
  // hindsight-api aborts startup instead of coming up degraded.
  if (/APIConnectionError|ConnectError/i.test(tail)) {
    if (/init_embeddings|embeddings/i.test(tail)) {
      const base = typeof env.HINDSIGHT_API_EMBEDDINGS_OPENAI_BASE_URL === 'string'
        ? env.HINDSIGHT_API_EMBEDDINGS_OPENAI_BASE_URL
        : null
      return `embedding 服务连接失败：启动初始化时无法连接 ${redact(base ?? '配置的 embedding 端点')}。请先启动该服务（如 LM Studio 并加载对应模型），或在设置页更换 embedding 提供方。`
    }
    return '远端服务连接失败：初始化时无法连接配置的 API 网关。请确认对应服务在运行、地址与端口正确。'
  }

  if (/address already in use|WinError 10048|only one usage of each socket|\[Errno 98\]/i.test(tail)) {
    return '监听端口被占用：另一个进程已占用目标端口。请结束占用该端口的进程，或在设置页更换端口。'
  }

  if (/AuthenticationError|invalid api key|invalid api-key/i.test(tail)) {
    return '上游服务鉴权失败（无效 API Key）：请检查设置页中的 API Key 或 Provider 覆盖里的凭据。'
  }

  if (/ModuleNotFoundError|ImportError/i.test(tail)) {
    return 'hindsight-api 安装不完整（Python 导入失败）：请重新安装或升级 hindsight-api 后重试。'
  }

  if (/OperationalError|psycopg2?\.(OperationalError|ProgrammingError)|cannot connect to server/i.test(tail)) {
    return '数据库连接失败：hindsight-api 无法连接其 PostgreSQL/PGVector 后端。请确认数据库服务在运行。'
  }

  // Fallback: the last error-looking log line, so the page at least shows
  // something real instead of a bare exit code.
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim()
    if (/error|exception|traceback/i.test(line)) {
      return '启动失败：服务日志含错误记录；未知错误原文不回传浏览器，请在本机安全检查日志'
    }
  }
  return null
}

/**
 * Launch the Hindsight API process with the environment built from the GUI
 * settings, then wait for /health.
 * @param gui - this plugin's settings object.
 * @param configObj - the harness config object (for the API port).
 * @returns the action result.
 */
async function preflightServer(gui, configObj, state, ctx) {
  assertActive(state)
  const target = apiTarget(configObj)
  if (!target.local) throw new HttpError(409, '此地址只支持连接；本机启动/重启仅支持根路径的 IPv4 回环 HTTP 地址')
  await recoverServer(state)
  const resolved = resolveServerEntry(gui)
  if (!resolved.entry) throw new HttpError(400, resolved.reason)
  const info = await stat(resolved.entry.command)
  if (!info.isFile() || (process.platform === 'win32' ? !/\.(exe|com)$/i.test(resolved.entry.command) : !(info.mode & 0o111))) throw new HttpError(400, '服务启动入口不是可执行文件')
  const { env, resolutions, embeddingPreview } = await buildServerEnv(gui, ctx, state.controller.signal)
  assertActive(state)
  const errors = resolutions.filter((resolution) => resolution.mode === 'error')
  if (embeddingPreview.mode === 'error') errors.push({ scope: '向量模型', note: embeddingPreview.note })
  if (errors.length > 0) throw new HttpError(400, errors.map((r) => `${r.scope}: ${r.note}`).join('；'))
  const pid = await findListenerPid(target.port)
  if (state.target?.port === target.port) await reconcileListener(state, pid)
  await ownsProcess(state)
  if (pid !== null && (!liveChild(state) || pid !== state.managedPid || state.target?.port !== target.port)) {
    throw new HttpError(409, '目标端口由非本插件进程占用；不会接管或终止它')
  }
  // Openability is checked before restart can stop the old service.
  assertActive(state)
  await mkdir(dirname(GUI_CONFIG_PATH), { recursive: true })
  assertActive(state)
  const logPath = join(dirname(GUI_CONFIG_PATH), 'dsh-hindsight-gui-server.log')
  const fd = openSync(logPath, 'a', 0o600)
  closeSync(fd)
  assertActive(state)
  return { target, entry: resolved.entry, env, resolutions, embeddingPreview, logPath,
    fingerprint: launchFingerprint(target, resolved.entry, env) }
}

async function startServer(gui, configObj, state, ctx, prepared) {
  const plan = prepared ?? await preflightServer(gui, configObj, state, ctx)
  const { target, entry, env, resolutions, embeddingPreview, logPath, fingerprint } = plan
  assertActive(state)
  if (liveChild(state)) throw new HttpError(409, '本插件已有存活的启动进程，请先查看状态；不会重复启动')
  if (await findListenerPid(target.port) !== null) throw new HttpError(409, '启动前端口已被占用；不会启动或接管')
  assertActive(state)
  const logFd = openSync(logPath, 'a', 0o600)
  let child
  try {
    child = spawn(entry.command, ['--host', '127.0.0.1', '--port', String(target.port)], {
      detached: true, windowsHide: true, stdio: ['ignore', logFd, logFd], env,
    })
  } finally { closeSync(logFd) }
  state.child = child
  state.exited = false
  state.spawnError = null
  state.identity = null
  state.managedPid = child.pid ?? null
  state.startedAt = new Date().toISOString()
  state.entry = entry
  state.target = target
  state.timedOut = false
  state.runningConfig = null
  state.launchConfig = { fingerprint, apiUrl: target.base, startedAt: state.startedAt, resolutions, embeddingPreview,
    auditLogEnabled: env.HINDSIGHT_API_AUDIT_LOG_ENABLED === 'true' }
  // Attach immediately: spawn failures are async events, not caught by try/spawn.
  child.on('error', (error) => {
    state.spawnError = `服务进程无法启动（${/^[A-Z0-9_]+$/.test(error.code ?? '') ? error.code : 'spawn error'}）；错误原文不回传`
    state.exited = true
    state.managedPid = null
    state.runningConfig = null
  })
  child.once('exit', () => {
    // Launcher exit is not necessarily listener exit; old children must not clear a new launch.
    if (state.child !== child || state.managedPid !== child.pid) return
    state.exited = true
    state.managedPid = null
    state.runningConfig = null
  })
  child.unref()
  const deadline = Date.now() + STARTUP_TIMEOUT_MS
  state.identity = await processIdentity(child.pid)
  state.launcherIdentity = state.identity
  state.managerIdentity = await processIdentity(process.pid)
  assertActive(state)
  if (!state.identity || !state.managerIdentity) throw new HttpError(503, '进程已启动，但身份无法核验；不会重复启动或接管，请检查进程')
  await saveServerReceipt(state)
  while (Date.now() < deadline) {
    assertActive(state)
    if (state.spawnError || state.exited) {
      const cause = await summarizeStartupFailure(logPath, env)
      throw new HttpError(502, redact(`进程启动失败（code ${child.exitCode ?? 'signal/error'}）。${state.spawnError ?? cause ?? ''}`))
    }
    const listener = await findListenerPid(target.port)
    await reconcileListener(state, listener)
    if (listener !== null && listener !== state.managedPid) {
      throw new HttpError(409, '监听进程无法证明来自本次启动器的进程链（launcher）；不会接管或终止它')
    }
    if (listener !== null && await ownsProcess(state) && await isApiUp(target.base, state.controller.signal)) {
      assertActive(state)
      if (!liveChild(state)) throw new HttpError(502, '服务在就绪检查期间退出')
      if (!await ownsProcess(state) || await findListenerPid(target.port) !== state.managedPid) throw new HttpError(409, '健康检查期间服务身份变化；拒绝确认启动')
      assertActive(state)
      state.runningConfig = state.launchConfig
      await saveServerReceipt(state)
      return { ok: true, pid: state.managedPid, entry, resolutions }
    }
    await pause(1000, state)
  }
  state.timedOut = true
  throw new HttpError(504, '启动健康检查超时；保留存活进程记录，不会重复启动，请刷新状态或手动处理')
}

/**
 * Restart only a verified launch or recovered receipt identity, after full preflight.
 * @param gui - this plugin's settings object.
 * @param configObj - the harness config object.
 * @returns the action result.
 */
async function restartServer(gui, configObj, state, ctx) {
  const plan = await preflightServer(gui, configObj, state, ctx)
  if (!await ownsProcess(state)) throw new HttpError(409, '当前服务不属于本插件实例；默认不接管、不重启')
  assertActive(state)
  await stopOwnedServer(state)
  assertActive(state)
  return startServer(gui, configObj, state, ctx, plan)
}

async function runServerAction(action, state, ctx) {
  assertActive(state)
  if (state.operation !== null) throw new HttpError(409, '已有服务操作正在执行')
  state.operation = action
  try {
    const gui = await readGuiSettings()
    const config = await readConfigObject()
    const result = action === 'restart'
      ? await restartServer(gui, config, state, ctx)
      : await startServer(gui, config, state, ctx)
    assertActive(state)
    state.lastAction = { action, at: new Date().toISOString(), ok: true, detail: '本插件启动的服务已通过身份及健康检查' }
    return result
  } catch (error) {
    state.lastAction = { action, at: new Date().toISOString(), ok: false, detail: redact(error.message) }
    throw error
  } finally { state.operation = null }
}

/**
 * Gather everything the settings page shows.
 * @returns the status document.
 */
async function collect(ctx, serverState = createServerState()) {
  const guiRecord = await readJsonFile(GUI_CONFIG_PATH)
  const configRecord = await readJsonFile(CONFIG_PATH)
  const gui = guiRecord.values
  const controlPlaneUrl = resolveControlPlaneUrl(gui)
  const overrides = publicProviderOverrides(gui.providerOverrides)
  for (const [key, value] of Object.entries(gui.serverEnv ?? {})) if (/KEY|TOKEN|SECRET|PASSWORD|AUTH|COOKIE/i.test(key)) rememberSecret(value)
  const out = {
    sampledAt: new Date().toISOString(),
    api: { url: API_BASE, up: false, state: 'unknown', status: null, database: null, error: null },
    controlPlane: { url: controlPlaneUrl, up: false },
    config: { path: CONFIG_PATH, exists: configRecord.exists, error: configRecord.error, revision: configRecord.revision, values: {}, extraKeys: [] },
    gui: {
      path: GUI_CONFIG_PATH,
      error: guiRecord.error,
      revision: guiRecord.revision,
      controlPlaneUrl,
      source: typeof gui.controlPlaneUrl === 'string' && gui.controlPlaneUrl !== ''
        ? 'file'
        : (process.env.HINDSIGHT_CP_URL ? 'env' : 'default'),
      serverModels: gui.serverModels && typeof gui.serverModels === 'object' && !Array.isArray(gui.serverModels)
        ? gui.serverModels
        : {},
      auditLogEnabled: typeof gui.auditLogEnabled === 'boolean' ? gui.auditLogEnabled : null,
      autoStart: gui.autoStart === true,
      serverCommand: typeof gui.serverCommand === 'string' ? gui.serverCommand : '',
      providerOverrides: overrides,
      serverEmbeddings: publicServerEmbeddings(gui.serverEmbeddings),
      serverEnv: gui.serverEnv && typeof gui.serverEnv === 'object' && !Array.isArray(gui.serverEnv)
        ? Object.keys(gui.serverEnv)
        : [],
      pendingRestart: gui.pendingRestart === true,
    },
    server: null,
    banks: [],
    banksError: null,
  }

  const raw = configRecord.values
  let target = null
  try {
    if (configRecord.error) throw new HttpError(409, configRecord.error)
    target = apiTarget(raw)
    out.api.url = target.base
    const health = await getJson(`${target.base}/health`, 6000, serverState.controller.signal)
    out.api.up = health?.status === 'healthy' || health?.status === 'ok'
    out.api.state = out.api.up ? 'ok' : 'error'
    out.api.status = typeof health?.status === 'string' ? redact(health.status) : null
    out.api.database = typeof health?.database === 'string' ? redact(health.database) : null
    if (!out.api.up) out.api.error = '健康端点未报告 healthy/ok'
  } catch (error) {
    out.api.state = target ? 'error' : 'unknown'
    out.api.error = redact(error.message)
  }

  try {
    if (!target) throw new HttpError(409, '服务地址或配置不可用')
    const payload = await getJson(`${target.base}/v1/default/banks`, 6000, serverState.controller.signal)
    if (!Array.isArray(payload?.banks)) throw new HttpError(502, '记忆库接口返回无效数据')
    out.banks = payload.banks.map((row) => ({
      id: typeof row?.bank_id === 'string' ? row.bank_id : '',
      name: typeof row?.name === 'string' ? row.name : '',
      facts: typeof row?.fact_count === 'number' ? row.fact_count : null,
      updatedAt: typeof row?.updated_at === 'string' ? row.updated_at : null,
    })).filter((row) => row.id !== '')
  } catch (error) {
    out.banksError = redact(error.message)
  }
  out.config.values = {
    disabled: raw.disabled === true,
    apiUrl: typeof raw.apiUrl === 'string' ? raw.apiUrl : '',
    logLevel: typeof raw.logLevel === 'string' ? raw.logLevel : 'info',
    autoUpdate: raw.autoUpdate === true,
    codebaseSurvey: raw.codebaseSurvey === true,
    surveyModel: typeof raw.surveyModel === 'string' ? raw.surveyModel : '',
    bankId: typeof raw.bankId === 'string' ? raw.bankId : '',
    dynamicBankId: raw.dynamicBankId === true || raw.bankId === undefined || raw.bankId === '',
  }
  // Keys the file holds that this page does not expose — shown read-only so a
  // hand-written section is visibly still in force rather than silently hidden.
  out.config.extraKeys = Object.keys(raw).filter((key) => !WRITABLE_KEYS.includes(key)).sort()

  // Service-manager view: what a start/restart would do right now.
  const resolved = resolveServerEntry(gui)
  let preview = { resolutions: [], env: {}, embeddingPreview: null }
  let previewError = guiRecord.error
  try { if (!previewError) preview = await buildServerEnv(gui, ctx, serverState.controller.signal) } catch (error) { previewError = redact(error.message) }
  const { resolutions } = preview
  const ownership = target ? await ownershipView(serverState, target)
    : { ownership: 'unknown', canStart: false, canRestart: false }
  // A slow startup may become healthy after its request timed out. Confirm only
  // the exact launch we still own, not today's (possibly changed) saved settings.
  if (ownership.ownership === 'managed' && out.api.up && !serverState.runningConfig && serverState.launchConfig
    && serverState.target.base === target.base && await findListenerPid(target.port) === serverState.managedPid
    && await ownsProcess(serverState)) {
    serverState.runningConfig = serverState.launchConfig
    serverState.timedOut = false
    await saveServerReceipt(serverState)
  }
  const runtimeConfigKnown = ownership.ownership === 'managed' && serverState.runningConfig !== null
  const pendingRestart = runtimeConfigKnown
    ? serverState.runningConfig.fingerprint !== launchFingerprint(target, resolved.entry, preview.env)
    : gui.pendingRestart === true
  out.gui.pendingRestart = pendingRestart
  out.server = {
    ...ownership,
    canStart: ownership.canStart && !guiRecord.error && !configRecord.error && !previewError && !resolutions.some((r) => r.mode === 'error') && preview.embeddingPreview?.mode !== 'error' && serverState.operation === null,
    canRestart: ownership.canRestart && !guiRecord.error && !configRecord.error && !previewError && !resolutions.some((r) => r.mode === 'error') && preview.embeddingPreview?.mode !== 'error' && serverState.operation === null,
    operation: serverState.operation,
    timedOut: serverState.timedOut,
    runtimeConfigKnown,
    runningConfig: runtimeConfigKnown ? serverState.runningConfig : null,
    previewError,
    embeddingPreview: preview.embeddingPreview,
    port: target?.port ?? null,
    up: out.api.up,
    entry: resolved.entry,
    entryReason: resolved.entry === null ? resolved.reason : null,
    managedPid: serverState.managedPid,
    startedAt: serverState.startedAt,
    lastAction: serverState.lastAction,
    autoStart: gui.autoStart === true,
    pendingRestart,
    auditLogEnabled: typeof gui.auditLogEnabled === 'boolean' ? gui.auditLogEnabled : null,
    resolutions,
  }

  out.controlPlane.up = await controlPlaneUp(controlPlaneUrl, serverState.controller.signal)
  return out
}

/**
 * Discover LLM providers and models advertised by the DSH environment.
 *
 * Newer Core (0.2.1-alpha.2+) exposes LlmRuntime as a `@Remote` Typert service
 * under `ctx.remote.llm`, not as a bare Cordis service. Older builds may still
 * publish it as `ctx.llm`; probe both so the route degrades gracefully instead
 * of silently returning an empty list.
 * @param ctx - plugin or host context.
 * @returns array of providers with their available models.
 */
async function fetchLlmModels(ctx, signal) {
  const remote = ctx.get('remote')
  const llm = ctx.get('llm') ?? remote?.llm
  const result = { providers: [], errors: [], state: 'ok', sampledAt: new Date().toISOString() }
  if (!llm || typeof llm.listProviders !== 'function' || typeof llm.listModels !== 'function') {
    return { ...result, state: 'unavailable', errors: [{ error: 'DSH 模型服务不可用' }] }
  }
  try {
    const providers = await withDeadline(llm.listProviders(), signal)
    if (!Array.isArray(providers)) throw new HttpError(502, 'Provider 清单格式无效')
    for (const provider of providers) {
      try {
        const rawModels = await withDeadline(llm.listModels(provider.id), signal)
        if (!Array.isArray(rawModels)) throw new HttpError(502, '模型清单格式无效')
        result.providers.push({ id: provider.id, name: provider.name || provider.id,
          models: rawModels.map((m) => ({ id: typeof m?.id === 'string' ? m.id : '',
            name: typeof m?.name === 'string' ? m.name : '',
            description: typeof m?.description === 'string' ? redact(m.description) : undefined })).filter((m) => m.id !== '') })
      } catch (error) { result.errors.push({ provider: provider.id, error: redact(error.message) }) }
    }
    if (result.errors.length) result.state = result.providers.length ? 'partial' : 'error'
  } catch (error) {
    result.state = 'error'
    result.errors.push({ error: redact(error.message) })
  }
  return result
}

/** Modify only the canonical redaction rule this UI owns, preserving stronger/custom rules. */
function mergeMemoryDefense(raw, enabled) {
  const current = raw ?? { enabled: false, rules: [] }
  if (!current || typeof current !== 'object' || Array.isArray(current) || !Array.isArray(current.rules)) {
    throw new HttpError(409, '现有 Memory Defense 策略不可识别；拒绝覆盖')
  }
  const owned = (rule) => rule && Object.keys(rule).length === 2 && rule.on === 'sensitive_data' && rule.action === 'redact'
  const rules = current.rules.filter((rule) => !owned(rule))
  if (enabled) rules.push({ on: 'sensitive_data', action: 'redact' })
  return { ...current, enabled: enabled || (current.enabled === true && rules.length > 0), rules }
}

/** Bank ids are URL path segments; keep them to a conservative charset. */
const BANK_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:\-]{0,127}$/

/**
 * Mount the status and config routes.
 * @param ctx - host plugin context.
 */
export function apply(ctx) {
  ctx.inject(['webServer'], (webCtx) => {
    webCtx.effect(() => {
      const disposers = []
      const serverState = createServerState()
      let configQueue = Promise.resolve()
      let bankQueue = Promise.resolve()
      const serializeConfig = (action) => {
        const next = configQueue.then(() => { assertActive(serverState); return action() })
        configQueue = next.catch(() => {})
        return next
      }
      const serializeBank = (action) => {
        const next = bankQueue.then(() => { assertActive(serverState); return action() })
        bankQueue = next.catch(() => {})
        return next
      }

      const route = (suffix, method, mutating, action) => {
        disposers.push(webCtx.webServer.register({
          kind: 'exact',
          path: `${HTTP_BASE}/${suffix}`,
          handler: async (req, res) => {
            try {
              if (req.method !== method) throw new HttpError(405, 'method not allowed')
              const port = webCtx.webServer.port
              if (!validLocalRequest(req, { port, mutate: mutating })) {
                const reason = localRejectionReason(req, { port, mutate: mutating })
                webCtx.logger.warn(`hindsight-gui: rejecting ${req.method} ${suffix}: ${redact(reason ?? 'unknown')}`)
                throw new HttpError(403, 'exact same-origin loopback request required')
              }
              const body = mutating ? await readJsonBody(req) : undefined
              assertActive(serverState)
              if (suffix === 'config' || suffix.startsWith('server/')) await serializeConfig(() => action(body, res, req))
              else await action(body, res, req)
            } catch (error) {
              sendJson(res, error?.status ?? 500, { error: redact(error?.message ?? error) })
            }
          },
        }))
      }

      route('status', 'GET', false, async (_body, res) => {
        sendJson(res, 200, await collect(webCtx, serverState))
      })

      route('models', 'GET', false, async (_body, res) => {
        sendJson(res, 200, await fetchLlmModels(webCtx, serverState.controller.signal))
      })

      route('config', 'POST', true, async (body, res) => {
        const incoming = body ?? {}
        const configRecord = await readJsonFile(CONFIG_PATH)
        const guiRecord = await readJsonFile(GUI_CONFIG_PATH)
        if (configRecord.error || guiRecord.error) throw new HttpError(409, configRecord.error ?? guiRecord.error)
        const { patch, rejected } = sanitizePatch(incoming)

        // The Control Plane address is written to this plugin's own file, never
        // to the upstream config — see GUI_CONFIG_PATH. It is validated before
        // anything is written, so a bad address leaves both files untouched.
        const wantsCp = 'controlPlaneUrl' in incoming
        let normalizedCpUrl = null
        if (wantsCp) {
          normalizedCpUrl = normalizeControlPlaneUrl(incoming.controlPlaneUrl)
          if (normalizedCpUrl === null) {
            throw new HttpError(400, 'controlPlaneUrl must be an http(s) URL without credentials, query or fragment, e.g. http://127.0.0.1:9999')
          }
        }

        const wantsServerModels = 'serverModels' in incoming
        let normalizedServerModels = null
        if (wantsServerModels) {
          normalizedServerModels = normalizeServerModels(incoming.serverModels)
          if (normalizedServerModels === null) {
            throw new HttpError(400, 'serverModels must be an object with string model identifiers')
          }
        }

        const wantsEmbeddings = 'serverEmbeddings' in incoming
        let normalizedEmbeddings = null
        if (wantsEmbeddings) {
          normalizedEmbeddings = normalizeServerEmbeddings(incoming.serverEmbeddings, guiRecord.values.serverEmbeddings ?? {})
          if (normalizedEmbeddings === null) throw new HttpError(400, 'serverEmbeddings 包含不支持的后端、无效字段、端点、凭据引用或非正整数维度')
        }

        const wantsAudit = 'auditLogEnabled' in incoming
        if (wantsAudit && typeof incoming.auditLogEnabled !== 'boolean') {
          throw new HttpError(400, 'auditLogEnabled must be a boolean')
        }
        const wantsAutoStart = 'autoStart' in incoming
        if (wantsAutoStart && typeof incoming.autoStart !== 'boolean') {
          throw new HttpError(400, 'autoStart must be a boolean')
        }
        const wantsServerCommand = 'serverCommand' in incoming
        if (wantsServerCommand && typeof incoming.serverCommand !== 'string') {
          throw new HttpError(400, 'serverCommand must be a string (full path to the hindsight-api executable; empty clears it)')
        }
        const wantsOverrides = 'providerOverrides' in incoming
        let normalizedOverrides = null
        if (wantsOverrides) {
          normalizedOverrides = normalizeProviderOverrides(incoming.providerOverrides, guiRecord.values.providerOverrides ?? {})
          if (normalizedOverrides === null) {
            throw new HttpError(400, 'providerOverrides must be an object keyed by provider id')
          }
        }
        const wantsServerEnv = 'serverEnv' in incoming
        let normalizedServerEnv = null
        if (wantsServerEnv) {
          normalizedServerEnv = normalizeServerEnv(incoming.serverEnv)
          if (normalizedServerEnv === null) {
            throw new HttpError(400, 'serverEnv must be an object of environment variable names to string values')
          }
        }

        const saved = Object.keys(patch)
        const guiKeysRequested = [wantsCp, wantsServerModels, wantsEmbeddings, wantsAudit, wantsAutoStart, wantsServerCommand, wantsOverrides, wantsServerEnv]
        if (saved.length === 0 && !guiKeysRequested.some(Boolean)) {
          throw new HttpError(400, rejected.length > 0
            ? `no writable settings in the request (rejected: ${rejected.join(', ')})`
            : 'no settings to save')
        }

        if (saved.length > 0 && incoming.configRevision !== configRecord.revision) throw new HttpError(409, '记忆配置已变化或缺少 revision，请刷新后重新保存')
        if (guiKeysRequested.some(Boolean) && incoming.guiRevision !== guiRecord.revision) throw new HttpError(409, '插件配置已变化或缺少 revision，请刷新后重新保存')

        const guiPatch = {}
        const guiSaved = []
        if (wantsCp) {
          guiPatch.controlPlaneUrl = normalizedCpUrl
          guiSaved.push('controlPlaneUrl')
        }
        if (wantsServerModels) {
          guiPatch.serverModels = normalizedServerModels
          guiSaved.push('serverModels')
        }
        if (wantsEmbeddings) {
          guiPatch.serverEmbeddings = normalizedEmbeddings
          guiSaved.push('serverEmbeddings')
        }
        if (wantsAudit) {
          guiPatch.auditLogEnabled = incoming.auditLogEnabled
          guiSaved.push('auditLogEnabled')
        }
        if (wantsAutoStart) {
          guiPatch.autoStart = incoming.autoStart
          guiSaved.push('autoStart')
        }
        if (wantsServerCommand) {
          guiPatch.serverCommand = incoming.serverCommand.trim()
          guiSaved.push('serverCommand')
        }
        if (wantsOverrides) {
          guiPatch.providerOverrides = normalizedOverrides
          guiSaved.push('providerOverrides')
        }
        if (wantsServerEnv) {
          guiPatch.serverEnv = normalizedServerEnv
          guiSaved.push('serverEnv')
        }
        // Server-affecting changes only reach the process on the next
        // start/restart; surface that on the page instead of letting it look
        // like a live change. `pendingRestart` is host-managed: a client-sent
        // value is ignored.
        const serverKeys = ['serverModels', 'serverEmbeddings', 'auditLogEnabled', 'serverCommand', 'providerOverrides', 'serverEnv']
        const semanticValue = (key, value) => {
          if (key === 'serverEmbeddings') return normalizeServerEmbeddings(value ?? {})
          if (key === 'auditLogEnabled') return value ?? null
          if (key === 'serverCommand') return value ?? ''
          if (key === 'serverModels') return Object.fromEntries(Object.entries(value ?? {}).filter(([, model]) => model !== ''))
          return value ?? {}
        }
        const serverAffecting = serverKeys.some((key) => key in guiPatch && stableJson(semanticValue(key, guiPatch[key])) !== stableJson(semanticValue(key, guiRecord.values[key])))
          || ('apiUrl' in patch && patch.apiUrl.trim() !== (configRecord.values.apiUrl ?? '').trim())
        if (serverAffecting) guiPatch.pendingRestart = true
        assertActive(serverState)
        // Each file is atomic and CAS-checked; a second-file IO failure is reported
        // explicitly rather than pretending the two-file update is a transaction.
        const savedFiles = []
        try {
          if (saved.length > 0) { await writeConfigPatch(patch, configRecord, serverState); savedFiles.push('记忆配置') }
          assertActive(serverState)
          if (Object.keys(guiPatch).length > 0) { await writeGuiSettings(guiPatch, guiRecord, serverState); savedFiles.push('插件配置') }
        } catch (error) {
          if (savedFiles.length) throw new HttpError(error.status ?? 500, `${savedFiles.join('、')}已保存，但其余配置未完成：${redact(error.message)}；请刷新核对`)
          throw error
        }

        const status = await collect(webCtx, serverState)
        status.saved = [...saved, ...guiSaved]
        if (rejected.length > 0) status.rejected = rejected
        sendJson(res, 200, status)
      })

      route('server/start', 'POST', true, async (_body, res) => {
        const result = await runServerAction('start', serverState, webCtx)
        sendJson(res, result.ok === true ? 200 : 502, { ...result, status: await collect(webCtx, serverState) })
      })

      route('server/restart', 'POST', true, async (_body, res) => {
        const result = await runServerAction('restart', serverState, webCtx)
        sendJson(res, result.ok === true ? 200 : 502, { ...result, status: await collect(webCtx, serverState) })
      })

      // GET and POST share one exact path. The webserver rejects a duplicate
      // (kind, path) registration, so the two verbs must dispatch inside a
      // single registered handler rather than two `route()` calls.
      disposers.push(webCtx.webServer.register({
        kind: 'exact',
        path: `${HTTP_BASE}/bankdefense`,
        handler: async (req, res) => {
          try {
            if (req.method !== 'GET' && req.method !== 'POST') throw new HttpError(405, 'method not allowed')
            const mutating = req.method === 'POST'
            const port = webCtx.webServer.port
            if (!validLocalRequest(req, { port, mutate: mutating })) {
              const reason = localRejectionReason(req, { port, mutate: mutating })
              webCtx.logger.warn(`hindsight-gui: rejecting ${req.method} bankdefense: ${redact(reason ?? 'unknown')}`)
              throw new HttpError(403, 'exact same-origin loopback request required')
            }
            assertActive(serverState)
            if (req.method === 'GET') {
              const target = apiTarget(await readConfigObject())
              const query = new URL(req.url ?? '', 'http://localhost').searchParams
              const bank = query.get('bank') ?? ''
              if (!BANK_ID_PATTERN.test(bank)) throw new HttpError(400, 'invalid bank id')
              if (query.has('apiUrl') && query.get('apiUrl') !== target.base) throw new HttpError(409, 'API 地址已变化，请刷新记忆库状态')
              const payload = await getJson(`${target.base}/v1/default/banks/${encodeURIComponent(bank)}/config`, 6000, serverState.controller.signal)
              if (!payload?.config || typeof payload.config !== 'object' || Array.isArray(payload.config)) throw new HttpError(502, '记忆库配置格式无效，防护状态未知')
              assertActive(serverState)
              const config = payload.config
              sendJson(res, 200, {
                bank,
                memoryDefense: config.memory_defense ?? null,
              })
              return
            }
            const body = await readJsonBody(req)
            const incoming = body ?? {}
            const bank = typeof incoming.bankId === 'string' ? incoming.bankId.trim() : ''
            if (!BANK_ID_PATTERN.test(bank)) throw new HttpError(400, 'invalid bank id')
            if (typeof incoming.enabled !== 'boolean' || ('action' in incoming && incoming.action !== 'redact')) throw new HttpError(400, 'enabled 必须是布尔值；此界面仅管理 redact 规则')
            await serializeBank(async () => {
              const target = apiTarget(await readConfigObject())
              if (incoming.apiUrl !== target.base) throw new HttpError(409, 'API 地址已变化或请求缺少目标地址；拒绝修改其他实例')
              const url = `${target.base}/v1/default/banks/${encodeURIComponent(bank)}/config`
              const before = await getJson(url, 6000, serverState.controller.signal)
              if (!before?.config || typeof before.config !== 'object') throw new HttpError(502, '未能读取当前策略；拒绝写入')
              const policy = mergeMemoryDefense(before.config.memory_defense, incoming.enabled)
              if (apiTarget(await readConfigObject()).base !== target.base) throw new HttpError(409, '读取策略期间 API 地址变化；未写入')
              assertActive(serverState)
              await sendJsonRequest('PATCH', url, { memory_defense: policy }, 8000, serverState.controller.signal)
              assertActive(serverState)
              const confirmed = await getJson(url, 6000, serverState.controller.signal)
              if (!confirmed?.config || typeof confirmed.config !== 'object') throw new HttpError(502, '策略已提交但无法确认，请刷新核对')
              sendJson(res, 200, { bank, memoryDefense: confirmed.config.memory_defense ?? null })
            })
          } catch (error) {
            sendJson(res, error?.status ?? 500, { error: redact(error?.message ?? error) })
          }
        },
      }))

      return () => {
        serverState.disposed = true
        serverState.controller.abort()
        serverState.identity = null
        serverState.runningConfig = null
        for (const dispose of disposers) dispose()
        // A detached API may outlive the UI. Leave the receipt for a future
        // instance to re-verify; unloading never force-kills the service.
      }
    }, 'hindsight-gui: status + config + server routes')
  })
}
