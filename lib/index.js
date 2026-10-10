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
 *   POST /plugins/dsh-hindsight-gui/server/restart  → stop the listener, then launch again
 *   GET  /plugins/dsh-hindsight-gui/bankdefense     → read one bank's memory_defense policy
 *   POST /plugins/dsh-hindsight-gui/bankdefense     → write one bank's memory_defense policy
 */

import { spawn } from 'node:child_process'
import { closeSync, existsSync, openSync, readFileSync } from 'node:fs'
import { copyFile, mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { delimiter, dirname, join } from 'node:path'

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

/** Actions the OSS Memory Defense extension interprets. */
const DEFENSE_ACTIONS = new Set(['allow', 'redact', 'block'])

/** Accepted log levels (`dist/dsh.js` WEIGHT map). */
const LOG_LEVELS = new Set(['debug', 'info', 'warn', 'error'])

/** An error carrying the HTTP status to report. */
class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
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
  res.end(JSON.stringify(value))
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
async function getJson(url, timeoutMs = 6000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  timer.unref?.()
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { accept: 'application/json' } })
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
async function sendJsonRequest(method, url, body, timeoutMs = 8000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  timer.unref?.()
  try {
    const response = await fetch(url, {
      method,
      signal: controller.signal,
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(body),
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      const detail = payload?.detail ?? payload?.error ?? `HTTP ${response.status}`
      throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
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
  return new Promise((resolve) => {
    let out = ''
    let child
    try {
      child = spawn(command, args, { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] })
    } catch {
      resolve('')
      return
    }
    const timer = setTimeout(() => child.kill(), timeoutMs)
    timer.unref?.()
    child.stdout?.on('data', (chunk) => { out += String(chunk) })
    child.on('error', () => { clearTimeout(timer); resolve('') })
    child.on('close', () => { clearTimeout(timer); resolve(out) })
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
 * A missing or malformed file reads as empty rather than failing the page.
 * @returns the parsed object.
 */
async function readGuiSettings() {
  try {
    const parsed = JSON.parse(await readFile(GUI_CONFIG_PATH, 'utf8'))
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return parsed
  } catch {
    return {}
  }
}

/**
 * Merge a patch into this plugin's own settings file, atomically.
 * @param patch - whitelisted keys to set.
 * @returns the resulting settings object.
 */
async function writeGuiSettings(patch) {
  const next = { ...(await readGuiSettings()), ...patch }
  try {
    await mkdir(dirname(GUI_CONFIG_PATH), { recursive: true })
  } catch {
    // The directory almost always exists; a failure here surfaces on write.
  }
  try {
    await copyFile(GUI_CONFIG_PATH, `${GUI_CONFIG_PATH}.bak`)
  } catch {
    // A first-ever save has nothing to back up.
  }
  const temporary = `${GUI_CONFIG_PATH}.tmp-${process.pid}-${Date.now()}`
  await writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
  await rename(temporary, GUI_CONFIG_PATH)
  return next
}

/**
 * Whether something answers at the Control Plane address.
 * A reachable server is enough; the body is not read.
 * @param baseUrl - the address to probe.
 * @returns true when the Control Plane responds.
 */
async function controlPlaneUp(baseUrl) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 2500)
  timer.unref?.()
  try {
    const response = await fetch(baseUrl + '/', { signal: controller.signal, redirect: 'manual' })
    return response.status > 0
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Read the config file as a plain object.
 * A missing or malformed file reads as empty rather than failing the page.
 * @returns the parsed object.
 */
async function readConfigObject() {
  try {
    const parsed = JSON.parse(await readFile(CONFIG_PATH, 'utf8'))
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return parsed
  } catch {
    return {}
  }
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
    if (SERVER_MODEL_SCOPES.includes(key)) {
      if (typeof value === 'string') {
        out[key] = value.trim()
      }
    }
  }
  return out
}

/**
 * Validate the per-provider override map: provider id → connection overrides.
 * @param raw - the incoming providerOverrides object.
 * @returns the sanitized object, or null if invalid.
 */
function normalizeProviderOverrides(raw) {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null
  const out = {}
  for (const [provider, value] of Object.entries(raw)) {
    const id = provider.trim().toLowerCase()
    if (!/^[a-z0-9][a-z0-9._-]*$/.test(id) || value === null || typeof value !== 'object' || Array.isArray(value)) continue
    const entry = {}
    if (typeof value.provider === 'string' && /^[a-z][a-z0-9-]*$/.test(value.provider)) entry.provider = value.provider
    if (typeof value.baseUrl === 'string' && value.baseUrl.trim() !== '') {
      let url
      try { url = new URL(value.baseUrl.trim()) } catch { continue }
      if (url.protocol !== 'http:' && url.protocol !== 'https:') continue
      entry.baseUrl = url.origin + (url.pathname === '/' ? '' : url.pathname.replace(/\/+$/, ''))
    }
    if (typeof value.apiKey === 'string' && value.apiKey.trim() !== '') entry.apiKey = value.apiKey.trim()
    if (typeof value.apiKeyEnv === 'string' && /^[A-Za-z_][A-Za-z0-9_]*$/.test(value.apiKeyEnv.trim())) {
      entry.apiKeyEnv = value.apiKeyEnv.trim()
    }
    if (Object.keys(entry).length > 0) out[id] = entry
  }
  return out
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
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) && typeof value === 'string') out[key] = value
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
    if (GUI_WRITABLE_KEYS.includes(key)) continue
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
async function writeConfigPatch(patch) {
  const current = await readConfigObject()
  const next = { ...current, ...patch }

  try {
    await copyFile(CONFIG_PATH, `${CONFIG_PATH}.bak`)
  } catch {
    // A first-ever save has nothing to back up; not worth failing over.
  }

  const temporary = `${CONFIG_PATH}.tmp-${process.pid}-${Date.now()}`
  await writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
  await rename(temporary, CONFIG_PATH)
  return next
}

/* ---------------------------------------------------------------------------
 * Service manager: discovery, environment building, process lifecycle.
 * ------------------------------------------------------------------------- */

/** Live state of a server this host half launched, plus the last action result. */
const serverState = {
  managedPid: null,
  startedAt: null,
  entry: null,
  lastAction: null,
}

/**
 * Resolve the API base URL and port from the harness config, falling back to
 * the built-in default.
 * @param configObj - the harness config object.
 * @returns base origin and numeric port.
 */
function apiTarget(configObj) {
  const raw = typeof configObj.apiUrl === 'string' && configObj.apiUrl.trim() !== '' ? configObj.apiUrl.trim() : API_BASE
  try {
    const url = new URL(raw)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('scheme')
    return { base: url.origin, port: Number(url.port || (url.protocol === 'https:' ? 443 : 80)) }
  } catch {
    return { base: API_BASE, port: Number(new URL(API_BASE).port ?? 8888) }
  }
}

/**
 * Whether the API answers /health.
 * @param base - API base origin.
 * @returns true when /health responds.
 */
async function isApiUp(base) {
  try {
    await getJson(`${base}/health`, 2500)
    return true
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
  if (process.platform === 'win32') {
    const out = await execCapture('netstat', ['-ano', '-p', 'tcp'])
    for (const line of out.split(/\r?\n/)) {
      const match = line.match(/\s(?:\d{1,3}(?:\.\d{1,3}){3}|\[[^\]]+\]):(\d+)\s+\S+\s+LISTENING\s+(\d+)\s*$/i)
      if (match && Number(match[1]) === port) return Number(match[2])
    }
    return null
  }
  const out = await execCapture('lsof', ['-ti', `tcp:${port}`, '-s', 'TCP:LISTEN'])
  const pid = Number(out.trim().split(/\s+/)[0])
  return Number.isFinite(pid) && pid > 0 ? pid : null
}

/**
 * Terminate the process listening on the API port, then wait for the port to
 * free up.
 * @param port - the port whose listener should stop.
 * @returns true when the port is free (or already was).
 */
async function stopListener(port) {
  const pid = await findListenerPid(port)
  if (pid === null) return true
  if (process.platform === 'win32') {
    await execCapture('taskkill', ['/F', '/PID', String(pid)])
  } else {
    try { process.kill(pid, 'SIGTERM') } catch { /* already gone */ }
  }
  const deadline = Date.now() + 8000
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    if ((await findListenerPid(port)) === null) return true
  }
  return false
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
 * Best-effort lookup of a named credential in the DSH credential store
 * (`~/.dsh/.credentials.yaml`). Two shapes are understood: a flat flow-style
 * `NAME: value` entry, and a `records:` block whose record name is the
 * credential name and whose payload carries `secret:`/`token:`. The store is
 * optional — a miss here just moves the chain on to the next source.
 * @param name - credential name, e.g. `COMMANDCODE_API_KEY`.
 * @returns the secret, or null.
 */
function lookupDshStoreCredential(name) {
  try {
    const storePath = join(homedir(), '.dsh', '.credentials.yaml')
    if (!existsSync(storePath)) return null
    const text = readFileSync(storePath, 'utf8')
    const flat = text.match(new RegExp(`^${name}\\s*:\\s*["']?([^\\s"',}]+)`, 'm'))
    if (flat) return flat[1]
    const lines = text.split(/\r?\n/)
    let inRecords = false
    let recordMatches = false
    for (const line of lines) {
      const indent = line.length - line.trimStart().length
      const trimmed = line.trim()
      if (trimmed === '') continue
      if (indent === 0) {
        inRecords = trimmed === 'records:'
        recordMatches = false
        continue
      }
      if (!inRecords) continue
      if (indent === 2) {
        recordMatches = trimmed.replace(/:$/, '') === name
        continue
      }
      if (!recordMatches) continue
      const secret = trimmed.match(/^(?:secret|token|api_?key)\s*:\s*["']?([^\s"']+)/)
      if (secret) return secret[1]
    }
    return null
  } catch {
    return null
  }
}

/** Synchronous UTF-8 read for the credential-store scanner happens via the
 * `readFileSync` imported at the top; no lazy require here (ESM module). */

/**
 * Resolve one provider's API key: GUI override → environment variable →
 * DSH credential store. Every step is visible in the returned source label.
 * @param provider - DSH provider id (lowercase).
 * @param overrides - the provider's override entry, when present.
 * @returns {value, source} or null with the names that were tried.
 */
function lookupCredential(provider, overrides) {
  if (overrides && typeof overrides.apiKey === 'string' && overrides.apiKey !== '') {
    return { value: overrides.apiKey, source: '设置页配置' }
  }
  const upper = provider.toUpperCase()
  const names = []
  if (overrides && typeof overrides.apiKeyEnv === 'string' && overrides.apiKeyEnv !== '') names.push(overrides.apiKeyEnv)
  names.push(`${upper}_API_KEY`, `${upper}_TOKEN`)
  for (const name of names) {
    const fromEnv = process.env[name]
    if (typeof fromEnv === 'string' && fromEnv.trim() !== '') return { value: fromEnv.trim(), source: `env:${name}` }
  }
  for (const name of names) {
    const fromStore = lookupDshStoreCredential(name)
    if (fromStore) return { value: fromStore, source: `dsh-store:${name}` }
  }
  return { value: null, tried: names }
}

/**
 * Build the server process environment from the GUI settings.
 *
 * Pure function: it copies process.env and never mutates it. Each scope's
 * resolution outcome is reported so the page can show exactly what a
 * start/restart will apply — including failures, which are never silent.
 * @param gui - this plugin's settings object.
 * @returns the env plus per-scope resolutions.
 */
function buildServerEnv(gui) {
  const env = { ...process.env }
  // hindsight-api talks to local endpoints (its own DB, LLM gateways through
  // loopback proxies); a broken inherited NO_PROXY (bare `::1` entries) has
  // already crashed httpx client construction on one machine, so normalise it.
  const additions = ['localhost', '127.0.0.1', '::1']
  const existing = (env.NO_PROXY ?? env.no_proxy ?? '').split(',').map((part) => part.trim()).filter(Boolean)
  const merged = Array.from(new Set([...existing, ...additions])).join(',')
  env.NO_PROXY = merged
  env.no_proxy = merged
  // The startup banner uses block glyphs a GBK console cannot encode.
  env.PYTHONUTF8 = '1'

  const models = gui.serverModels && typeof gui.serverModels === 'object' && !Array.isArray(gui.serverModels)
    ? gui.serverModels
    : {}
  const overridesMap = gui.providerOverrides && typeof gui.providerOverrides === 'object' && !Array.isArray(gui.providerOverrides)
    ? gui.providerOverrides
    : {}
  const resolutions = []

  for (const [scope, prefix] of Object.entries(SCOPE_ENV_PREFIX)) {
    const spec = typeof models[scope] === 'string' ? models[scope].trim() : ''
    if (spec === '') {
      resolutions.push({ scope, spec: '', applied: false, mode: 'default', note: '未指定，使用 hindsight-api 自身默认' })
      continue
    }
    const slash = spec.indexOf('/')
    const provider = (slash > 0 ? spec.slice(0, slash) : spec).toLowerCase()
    const model = slash > 0 ? spec.slice(slash + 1) : spec
    const overrides = overridesMap[provider] ?? null
    const llmProvider = (overrides && typeof overrides.provider === 'string' ? overrides.provider : null)
      ?? (KNOWN_HINDSIGHT_PROVIDERS.has(provider) ? provider : 'openai')
    const baseUrl = overrides && typeof overrides.baseUrl === 'string' ? overrides.baseUrl : null
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
    const credential = lookupCredential(provider, overrides)
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
    if (baseUrl !== null) env[`${prefix}BASE_URL`] = baseUrl
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

  if (gui.auditLogEnabled === true) env.HINDSIGHT_API_AUDIT_LOG_ENABLED = 'true'
  else if (gui.auditLogEnabled === false) env.HINDSIGHT_API_AUDIT_LOG_ENABLED = 'false'

  // The plugin manages per-bank configuration (the redaction toggle writes it
  // through the bank config API), and hindsight-api gates those writes behind
  // HINDSIGHT_API_ENABLE_BANK_CONFIG_API — off by default, so one PATCH came
  // back 403 and the toggle snapped back silently. A server this plugin
  // launches therefore turns it on, unless the user set it explicitly (the
  // serverEnv passthrough below wins).
  if (env.HINDSIGHT_API_ENABLE_BANK_CONFIG_API === undefined) env.HINDSIGHT_API_ENABLE_BANK_CONFIG_API = 'true'

  if (gui.serverEnv && typeof gui.serverEnv === 'object' && !Array.isArray(gui.serverEnv)) {
    for (const [key, value] of Object.entries(gui.serverEnv)) {
      if (typeof value === 'string') env[key] = value
    }
  }

  return { env, resolutions }
}

/** How long to wait for /health after a launch, in milliseconds. */
const STARTUP_TIMEOUT_MS = 90_000

/**
 * Launch the Hindsight API process with the environment built from the GUI
 * settings, then wait for /health.
 * @param gui - this plugin's settings object.
 * @param configObj - the harness config object (for the API port).
 * @returns the action result.
 */
async function startServer(gui, configObj) {
  const target = apiTarget(configObj)
  if (await isApiUp(target.base)) {
    serverState.lastAction = { action: 'start', at: new Date().toISOString(), ok: true, detail: '服务已在运行，无需启动' }
    return { ok: true, alreadyRunning: true, resolutions: buildServerEnv(gui).resolutions }
  }
  const resolved = resolveServerEntry(gui)
  if (resolved.entry === null) {
    serverState.lastAction = { action: 'start', at: new Date().toISOString(), ok: false, detail: resolved.reason }
    return { ok: false, error: resolved.reason, resolutions: buildServerEnv(gui).resolutions }
  }
  const { env, resolutions } = buildServerEnv(gui)
  const logPath = join(dirname(GUI_CONFIG_PATH), 'dsh-hindsight-gui-server.log')
  try {
    const info = await stat(logPath)
    if (info.size > 5 * 1024 * 1024) await rename(logPath, `${logPath}.1`).catch(() => {})
  } catch {
    // First run: no log yet.
  }
  let logFd
  try {
    logFd = openSync(logPath, 'a')
  } catch (error) {
    const detail = `无法打开日志文件 ${logPath}：${String(error?.message ?? error)}`
    serverState.lastAction = { action: 'start', at: new Date().toISOString(), ok: false, detail }
    return { ok: false, error: detail, resolutions }
  }
  let child
  try {
    child = spawn(resolved.entry.command, ['--host', '127.0.0.1', '--port', String(target.port)], {
      detached: true,
      windowsHide: true,
      stdio: ['ignore', logFd, logFd],
      env,
    })
  } catch (error) {
    const detail = `启动失败：${String(error?.message ?? error)}`
    serverState.lastAction = { action: 'start', at: new Date().toISOString(), ok: false, detail }
    return { ok: false, error: detail, resolutions }
  } finally {
    // The child owns the fd after spawn; close our copy either way.
    try { closeSync(logFd) } catch { /* already closed */ }
  }
  child.unref()
  serverState.managedPid = child.pid
  serverState.startedAt = new Date().toISOString()
  serverState.entry = resolved.entry

  const deadline = Date.now() + STARTUP_TIMEOUT_MS
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    if (await isApiUp(target.base)) {
      serverState.lastAction = {
        action: 'start',
        at: new Date().toISOString(),
        ok: true,
        detail: `已启动 (pid ${child.pid}, ${resolved.entry.source})`,
      }
      return { ok: true, pid: child.pid, entry: resolved.entry, resolutions }
    }
    if (child.exitCode !== null) {
      const detail = `进程退出（code ${child.exitCode}）。日志：${logPath}`
      serverState.lastAction = { action: 'start', at: new Date().toISOString(), ok: false, detail }
      serverState.managedPid = null
      return { ok: false, error: detail, resolutions }
    }
  }
  const detail = `启动后 ${Math.round(STARTUP_TIMEOUT_MS / 1000)} 秒内 /health 未就绪。日志：${logPath}`
  serverState.lastAction = { action: 'start', at: new Date().toISOString(), ok: false, detail }
  return { ok: false, error: detail, resolutions }
}

/**
 * Restart the Hindsight API: stop whatever listens on the port (whether this
 * plugin launched it or not), then launch again with the current settings.
 * @param gui - this plugin's settings object.
 * @param configObj - the harness config object.
 * @returns the action result.
 */
async function restartServer(gui, configObj) {
  const target = apiTarget(configObj)
  const stopped = await stopListener(target.port)
  if (!stopped) {
    const detail = `无法终止端口 ${target.port} 上的监听进程`
    serverState.lastAction = { action: 'restart', at: new Date().toISOString(), ok: false, detail }
    return { ok: false, error: detail }
  }
  const result = await startServer(gui, configObj)
  serverState.lastAction = {
    ...serverState.lastAction,
    action: 'restart',
    at: new Date().toISOString(),
    ok: result.ok === true,
    detail: result.ok === true ? `已按当前设置重启${result.alreadyRunning === true ? '（原服务已在运行）' : ''}` : result.error,
  }
  if (result.ok === true) {
    await writeGuiSettings({ pendingRestart: false }).catch(() => {})
  }
  return result
}

/**
 * Gather everything the settings page shows.
 * @returns the status document.
 */
async function collect() {
  const gui = await readGuiSettings()
  const controlPlaneUrl = resolveControlPlaneUrl(gui)
  const out = {
    api: { url: API_BASE, up: false, status: null, database: null, error: null },
    controlPlane: { url: controlPlaneUrl, up: false },
    config: { path: CONFIG_PATH, exists: false, error: null, values: {}, extraKeys: [] },
    gui: {
      path: GUI_CONFIG_PATH,
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
      providerOverrides: gui.providerOverrides && typeof gui.providerOverrides === 'object' && !Array.isArray(gui.providerOverrides)
        ? gui.providerOverrides
        : {},
      serverEnv: gui.serverEnv && typeof gui.serverEnv === 'object' && !Array.isArray(gui.serverEnv)
        ? Object.keys(gui.serverEnv)
        : [],
      pendingRestart: gui.pendingRestart === true,
    },
    server: null,
    banks: [],
  }

  const raw = await readConfigObject()
  const target = apiTarget(raw)
  out.api.url = target.base

  try {
    const health = await getJson(`${target.base}/health`)
    out.api.up = true
    out.api.status = typeof health.status === 'string' ? health.status : null
    out.api.database = typeof health.database === 'string' ? health.database : null
  } catch (error) {
    out.api.error = String(error?.message ?? error)
  }

  try {
    const payload = await getJson(`${target.base}/v1/default/banks`)
    const rows = Array.isArray(payload?.banks) ? payload.banks : []
    out.banks = rows.map((row) => ({
      id: typeof row?.bank_id === 'string' ? row.bank_id : '',
      name: typeof row?.name === 'string' ? row.name : '',
      facts: typeof row?.fact_count === 'number' ? row.fact_count : 0,
      updatedAt: typeof row?.updated_at === 'string' ? row.updated_at : null,
    })).filter((row) => row.id !== '')
  } catch {
    // An unreachable or older API leaves the list empty rather than failing the page.
  }

  out.config.exists = Object.keys(raw).length > 0
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
  const { resolutions } = buildServerEnv(gui)
  out.server = {
    port: target.port,
    up: out.api.up,
    entry: resolved.entry,
    entryReason: resolved.entry === null ? resolved.reason : null,
    managedPid: serverState.managedPid,
    startedAt: serverState.startedAt,
    lastAction: serverState.lastAction,
    autoStart: gui.autoStart === true,
    pendingRestart: gui.pendingRestart === true,
    auditLogEnabled: typeof gui.auditLogEnabled === 'boolean' ? gui.auditLogEnabled : null,
    resolutions,
  }

  out.controlPlane.up = await controlPlaneUp(controlPlaneUrl)
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
async function fetchLlmModels(ctx) {
  const remote = ctx.get('remote')
  const llm = ctx.get('llm')
    ?? (remote && typeof remote.llm === 'object' ? remote.llm : undefined)
  if (!llm || typeof llm.listProviders !== 'function') {
    return []
  }
  try {
    const providers = llm.listProviders()
    const list = []
    for (const provider of providers) {
      let models = []
      try {
        if (typeof llm.listModels === 'function') {
          const rawModels = await llm.listModels(provider.id)
          if (Array.isArray(rawModels)) {
            models = rawModels.map((m) => ({
              id: typeof m?.id === 'string' ? m.id : '',
              name: typeof m?.name === 'string' ? m.name : '',
              description: typeof m?.description === 'string' ? m.description : undefined,
            })).filter((m) => m.id !== '')
          }
        }
      } catch {
        // Provider-specific model discovery errors are swallowed so other providers remain usable.
      }
      list.push({
        id: provider.id,
        name: provider.name || provider.id,
        models,
      })
    }
    return list
  } catch {
    return []
  }
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
                webCtx.logger.warn(`hindsight-gui: rejecting ${req.method} ${suffix}: ${reason ?? 'unknown'}`)
                throw new HttpError(403, 'exact same-origin loopback request required')
              }
              const body = mutating ? await readJsonBody(req) : undefined
              await action(body, res, req)
            } catch (error) {
              sendJson(res, error?.status ?? 500, { error: String(error?.message ?? error) })
            }
          },
        }))
      }

      route('status', 'GET', false, async (_body, res) => {
        sendJson(res, 200, await collect())
      })

      route('models', 'GET', false, async (_body, res) => {
        sendJson(res, 200, { providers: await fetchLlmModels(webCtx) })
      })

      route('config', 'POST', true, async (body, res) => {
        const incoming = body ?? {}
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
          normalizedOverrides = normalizeProviderOverrides(incoming.providerOverrides)
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
        const guiKeysRequested = [wantsCp, wantsServerModels, wantsAudit, wantsAutoStart, wantsServerCommand, wantsOverrides, wantsServerEnv]
        if (saved.length === 0 && !guiKeysRequested.some(Boolean)) {
          throw new HttpError(400, rejected.length > 0
            ? `no writable settings in the request (rejected: ${rejected.join(', ')})`
            : 'no settings to save')
        }

        if (saved.length > 0) await writeConfigPatch(patch)

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
        const serverAffecting = wantsServerModels || wantsAudit || wantsServerCommand || wantsOverrides || wantsServerEnv
        if (Object.keys(guiPatch).length > 0) {
          if (serverAffecting) guiPatch.pendingRestart = true
          await writeGuiSettings(guiPatch)
        }

        const status = await collect()
        status.saved = [...saved, ...guiSaved]
        if (rejected.length > 0) status.rejected = rejected
        sendJson(res, 200, status)
      })

      route('server/start', 'POST', true, async (_body, res) => {
        const gui = await readGuiSettings()
        const configObj = await readConfigObject()
        const result = await startServer(gui, configObj)
        sendJson(res, result.ok === true ? 200 : 502, { ...result, status: await collect() })
      })

      route('server/restart', 'POST', true, async (_body, res) => {
        const gui = await readGuiSettings()
        const configObj = await readConfigObject()
        const result = await restartServer(gui, configObj)
        sendJson(res, result.ok === true ? 200 : 502, { ...result, status: await collect() })
      })

      route('bankdefense', 'GET', false, async (_body, res, req) => {
        const target = apiTarget(await readConfigObject())
        const bank = new URL(req.url ?? '', 'http://localhost').searchParams.get('bank') ?? ''
        if (!BANK_ID_PATTERN.test(bank)) throw new HttpError(400, 'invalid bank id')
        const payload = await getJson(`${target.base}/v1/default/banks/${encodeURIComponent(bank)}/config`)
        const config = payload?.config ?? {}
        sendJson(res, 200, {
          bank,
          memoryDefense: config.memory_defense ?? null,
        })
      })

      route('bankdefense', 'POST', true, async (body, res) => {
        const incoming = body ?? {}
        const bank = typeof incoming.bankId === 'string' ? incoming.bankId.trim() : ''
        if (!BANK_ID_PATTERN.test(bank)) throw new HttpError(400, 'invalid bank id')
        const enabled = incoming.enabled === true
        const action = typeof incoming.action === 'string' && DEFENSE_ACTIONS.has(incoming.action) ? incoming.action : 'redact'
        const target = apiTarget(await readConfigObject())
        const policy = enabled
          ? { enabled: true, rules: [{ on: 'sensitive_data', action }] }
          : { enabled: false, rules: [] }
        const payload = await sendJsonRequest(
          'PATCH',
          `${target.base}/v1/default/banks/${encodeURIComponent(bank)}/config`,
          { memory_defense: policy },
        )
        sendJson(res, 200, {
          bank,
          memoryDefense: payload?.config?.memory_defense ?? policy,
        })
      })

      return () => { for (const dispose of disposers) dispose() }
    }, 'hindsight-gui: status + config + server routes')
  })
}
