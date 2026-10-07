/**
 * dsh-hindsight-gui — host half.
 *
 * A settings page over the Hindsight stack. It does NOT embed the Control Plane:
 * the page edits the harness config and shows live status, and offers a button
 * that opens the Control Plane in a real browser tab.
 *
 * The user deploys Hindsight themselves — this plugin never installs a server.
 * They then point the page at it: the API address is written to the harness
 * config (`apiUrl`, which the upstream integration reads), and the Control Plane
 * address goes to this plugin's own settings file (see GUI_CONFIG_PATH).
 *
 * Why the browser half cannot talk to the API directly: the Hindsight API
 * answers on 127.0.0.1:8888 WITHOUT an `Access-Control-Allow-Origin` header, so
 * a cross-origin fetch from the DSH page is refused by the browser. This half is
 * therefore a same-origin proxy: the page calls `/plugins/dsh-hindsight-gui/…`
 * on the DSH web server, and the API request is made here, server-side, where
 * CORS does not apply.
 *
 * Why editing the config file is enough, with no restart: the DSH integration
 * re-reads `~/.hindsight/coding-agent.json` on every `loadConfig()` call, which
 * `resolveHostConfig()` performs each time it resolves memory for a turn
 * (`dist/dsh.js`: `loadConfig` → `readRaw(CONFIG_PATH)`). A saved change is
 * therefore picked up by the next turn.
 *
 * Routes:
 *   GET  /plugins/dsh-hindsight-gui/status   → aggregated status + current settings
 *   POST /plugins/dsh-hindsight-gui/config   → merge a whitelisted patch into the config
 */

import { copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

/** Cordis plugin name. */
export const name = 'hindsight-gui'

/** Route prefix owned by this plugin. */
const HTTP_BASE = '/plugins/dsh-hindsight-gui'

/** Where the API listens. */
const API_BASE = process.env.HINDSIGHT_API_URL ?? 'http://127.0.0.1:8888'

/** Fallback Control Plane address, when neither the file nor the env sets one. */
const DEFAULT_CONTROL_PLANE_URL = 'http://127.0.0.1:9999'

/** The harness config the coding-agent plugin reads. */
const CONFIG_PATH = process.env.HINDSIGHT_CONFIG ?? join(homedir(), '.hindsight', 'coding-agent.json')

/**
 * This plugin's own settings file.
 *
 * The Control Plane address lives HERE, not in `coding-agent.json`: upstream
 * `@vectorize-io/hindsight-coding-agents` has no key for it, so writing it
 * there would put a foreign key into a file the integration owns and rewrites.
 * Keeping it separate means an upstream format change cannot collide with it.
 */
const GUI_CONFIG_PATH = process.env.HINDSIGHT_GUI_CONFIG
  ?? join(dirname(CONFIG_PATH), 'dsh-hindsight-gui.json')

/** The only keys this plugin's own file may hold. */
const GUI_WRITABLE_KEYS = ['controlPlaneUrl', 'serverModels']

/**
 * The only keys this page may write.
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
 * @param req - the request.
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
 * Keep only whitelisted, correctly typed keys.
 *
 * Keys this plugin owns but stores elsewhere (`controlPlaneUrl`, `serverModels`)
 * are accepted here as no-ops and routed to their own file by the caller — counting
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
    },
    banks: [],
  }

  try {
    const health = await getJson(`${API_BASE}/health`)
    out.api.up = true
    out.api.status = typeof health.status === 'string' ? health.status : null
    out.api.database = typeof health.database === 'string' ? health.database : null
  } catch (error) {
    out.api.error = String(error?.message ?? error)
  }

  try {
    const payload = await getJson(`${API_BASE}/v1/default/banks`)
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

  const raw = await readConfigObject()
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

  out.controlPlane.up = await controlPlaneUp(controlPlaneUrl)
  return out
}

/**
 * Discover LLM providers and models advertised by the DSH environment.
 * @param ctx - plugin or host context.
 * @returns array of providers with their available models.
 */
async function fetchLlmModels(ctx) {
  const llm = ctx.get('llm')
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
              if (!validLocalRequest(req, { port: webCtx.webServer.port, mutate: mutating })) {
                throw new HttpError(403, 'exact same-origin loopback request required')
              }
              const body = mutating ? await readJsonBody(req) : undefined
              await action(body, res)
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
        const { patch, rejected } = sanitizePatch(body ?? {})

        // The Control Plane address is written to this plugin's own file, never
        // to the upstream config — see GUI_CONFIG_PATH. It is validated before
        // anything is written, so a bad address leaves both files untouched.
        const wantsCp = 'controlPlaneUrl' in (body ?? {})
        let normalizedCpUrl = null
        if (wantsCp) {
          normalizedCpUrl = normalizeControlPlaneUrl(body.controlPlaneUrl)
          if (normalizedCpUrl === null) {
            throw new HttpError(400, 'controlPlaneUrl must be an http(s) URL without credentials, query or fragment, e.g. http://127.0.0.1:9999')
          }
        }

        const wantsServerModels = 'serverModels' in (body ?? {})
        let normalizedServerModels = null
        if (wantsServerModels) {
          normalizedServerModels = normalizeServerModels(body.serverModels)
          if (normalizedServerModels === null) {
            throw new HttpError(400, 'serverModels must be an object with string model identifiers')
          }
        }

        const saved = Object.keys(patch)
        if (saved.length === 0 && !wantsCp && !wantsServerModels) {
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
        if (Object.keys(guiPatch).length > 0) {
          await writeGuiSettings(guiPatch)
        }

        const status = await collect()
        status.saved = [...saved, ...guiSaved]
        if (rejected.length > 0) status.rejected = rejected
        sendJson(res, 200, status)
      })

      return () => { for (const dispose of disposers) dispose() }
    }, 'hindsight-gui: status + config routes')
  })
}
