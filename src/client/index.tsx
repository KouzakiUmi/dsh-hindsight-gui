/**
 * dsh-hindsight-gui — browser half.
 *
 * A SETTINGS page for the Hindsight stack: memory, connection, per-function
 * model routing, service lifecycle (start / restart / auto-start), audit log,
 * per-bank redaction, and a compact read-only status block. One icon button in
 * the sidebar (`sidebar.panellist`) and one page in `main`, linked by a shared
 * id — the same pairing `dsh-context` and the schedule panel use.
 *
 * Layout note, and the reason this file is written the way it is: `main` is
 * rendered inside a CSS-GRID grid item (`CenterColumn`), which has a definite
 * size, so the page simply follows it — `height: 100%`, ordinary document flow,
 * NO `position: absolute`, and NO fixed pixel width: the page is fluid and
 * follows the column the harness gives it. An earlier revision used
 * `position:absolute; inset:0`, found no positioned ancestor, expanded against
 * the viewport and covered the whole application. Do not reintroduce that.
 *
 * The page never fetches the API or writes the config file directly: it calls
 * this plugin's own same-origin routes, and the host half does the work. That is
 * required for the API (no `Access-Control-Allow-Origin`), and it keeps the
 * config write inside one audited place with a whitelist and an atomic save.
 *
 * Saving harness-side keys takes effect on the next turn. Server-side keys
 * (models, audit log, provider overrides) shape the SERVER process environment
 * and apply on the next start/restart — the page says so and offers the button.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/** Id shared by the sidebar button and the page; this is what links them. */
const PANEL_ID = 'hindsight-gui'

/** Same-origin routes served by the host half. */
const STATUS_URL = '/plugins/dsh-hindsight-gui/status'
const CONFIG_URL = '/plugins/dsh-hindsight-gui/config'
const MODELS_URL = '/plugins/dsh-hindsight-gui/models'
const SERVER_START_URL = '/plugins/dsh-hindsight-gui/server/start'
const SERVER_RESTART_URL = '/plugins/dsh-hindsight-gui/server/restart'
const BANKDEFENSE_URL = '/plugins/dsh-hindsight-gui/bankdefense'

/** Class-name prefix for this panel's hand-written stylesheet. */
const PREFIX = 'dsh-hsp-'

/** Log levels the integration accepts. */
const LOG_LEVELS = ['debug', 'info', 'warn', 'error']

/** Server model scopes, with the labels and hints shown on the page. */
const SERVER_SCOPES = [
  { key: 'reflect', label: '反思推理', hint: 'hindsight_reflect 记忆推理与问答。建议选用推理和长上下文能力强的模型。' },
  { key: 'retain', label: '事实提取', hint: '从会话中提取事实（Retain），Token 消耗量大。建议速度快、成本低且支持 JSON Schema 的模型。' },
  { key: 'consolidation', label: '记忆整理', hint: '后台聚合消歧与去重相似事实（Consolidation）。建议支持结构化输出的快速模型。' },
  { key: 'mentalModel', label: '知识提炼', hint: '刷新结构化知识库页面（Mental Model Refresh，如架构图、概念规范）。' },
]

const CSS = [
  /* ---- shell: fluid, no fixed width ------------------------------------- */
  '.' + PREFIX + 'root{box-sizing:border-box;height:100%;min-height:0;overflow:auto;',
  'display:flex;flex-direction:column;gap:14px;padding:18px 22px 44px;width:100%;',
  'color:var(--dsw-alias-label-primary,#1a1a1a);font-size:13px;line-height:20px;color-scheme:light dark;}',
  '.' + PREFIX + 'head{display:flex;flex-direction:column;gap:4px;}',
  '.' + PREFIX + 'h{margin:0;font-size:18px;line-height:26px;font-weight:650;}',
  '.' + PREFIX + 'sub{margin:0;color:var(--dsw-alias-label-tertiary,#8a8a8a);font-size:12.5px;}',
  /* ---- cards ------------------------------------------------------------ */
  '.' + PREFIX + 'card{border:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));',
  'border-radius:12px;padding:15px 18px;display:flex;flex-direction:column;gap:12px;',
  'background:var(--dsw-alias-bg-layer-1,transparent);min-width:0;}',
  '.' + PREFIX + 'cardhead{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;}',
  '.' + PREFIX + 'cardtitle{margin:0;font-size:13.5px;font-weight:650;}',
  /* ---- fields: two-column grid that collapses on narrow panels ---------- */
  '.' + PREFIX + 'field{display:grid;grid-template-columns:128px minmax(0,1fr);gap:6px 12px;align-items:start;}',
  '@media (max-width:680px){.' + PREFIX + 'field{grid-template-columns:minmax(0,1fr);}}',
  '.' + PREFIX + 'label{padding-top:5px;color:var(--dsw-alias-label-secondary,#555);}',
  '.' + PREFIX + 'control{min-width:0;display:flex;flex-direction:column;gap:6px;}',
  '.' + PREFIX + 'hint{color:var(--dsw-alias-label-tertiary,#8a8a8a);font-size:12px;}',
  /* ---- inputs ----------------------------------------------------------- */
  '.' + PREFIX + 'input,.' + PREFIX + 'select{box-sizing:border-box;width:100%;height:30px;padding:0 9px;',
  'border-radius:8px;border:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.18));',
  'background-color:var(--dsw-alias-bg-layer-1,var(--dsw-alias-bg-base,#fff));color:var(--dsw-alias-label-primary,inherit);',
  'font:inherit;font-size:13px;color-scheme:light dark;}',
  '.' + PREFIX + 'select option,.' + PREFIX + 'select optgroup{background-color:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#1a1a1a);}',
  '.' + PREFIX + 'input:focus,.' + PREFIX + 'select:focus{outline:2px solid var(--dsw-alias-brand-primary,#3b82f6);outline-offset:1px;}',
  '.' + PREFIX + 'check{display:flex;align-items:flex-start;gap:8px;cursor:pointer;}',
  '.' + PREFIX + 'check input{margin-top:3px;accent-color:var(--dsw-alias-brand-primary,#3b82f6);}',
  /* ---- buttons ---------------------------------------------------------- */
  '.' + PREFIX + 'btn{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 14px;',
  'border-radius:8px;border:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.14));',
  'background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.045));color:inherit;font:inherit;',
  'font-size:13px;cursor:pointer;text-decoration:none;white-space:nowrap;}',
  '.' + PREFIX + 'btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-active,rgba(0,0,0,.09));}',
  '.' + PREFIX + 'btn:disabled{opacity:.5;cursor:default;}',
  '.' + PREFIX + 'btnprimary{background:var(--dsw-alias-brand-primary,#3b82f6);border-color:transparent;',
  'color:#fff;}',
  '.' + PREFIX + 'btnprimary:hover:not(:disabled){background:var(--dsw-alias-brand-primary-hover,#2563eb);}',
  /* ---- status pills and rows -------------------------------------------- */
  '.' + PREFIX + 'pill{display:inline-flex;align-items:center;gap:6px;font-size:12px;',
  'padding:2px 10px;border-radius:999px;border:.5px solid transparent;white-space:nowrap;}',
  '.' + PREFIX + 'ok{color:#15803d;background:rgba(21,128,61,.10);border-color:rgba(21,128,61,.25);}',
  '.' + PREFIX + 'bad{color:#b91c1c;background:rgba(185,28,28,.10);border-color:rgba(185,28,28,.25);}',
  '.' + PREFIX + 'warn{color:#92400e;background:rgba(217,119,6,.12);border-color:rgba(217,119,6,.3);}',
  '.' + PREFIX + 'dot{width:8px;height:8px;border-radius:50%;background:currentColor;flex:0 0 auto;}',
  '.' + PREFIX + 'row{display:flex;align-items:baseline;gap:10px;min-width:0;}',
  '.' + PREFIX + 'key{flex:0 0 92px;color:var(--dsw-alias-label-tertiary,#8a8a8a);}',
  '.' + PREFIX + 'val{min-width:0;overflow-wrap:anywhere;}',
  /* ---- banners, lists, misc --------------------------------------------- */
  '.' + PREFIX + 'banner{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:9px 12px;',
  'border-radius:9px;font-size:12.5px;border:.5px solid rgba(217,119,6,.3);background:rgba(217,119,6,.10);color:#92400e;}',
  '.' + PREFIX + 'list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;}',
  '.' + PREFIX + 'item{display:flex;align-items:center;gap:12px;padding:7px 0;min-width:0;',
  'border-bottom:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.07));}',
  '.' + PREFIX + 'item:last-child{border-bottom:0;}',
  '.' + PREFIX + 'mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;overflow-wrap:anywhere;}',
  '.' + PREFIX + 'count{margin-left:auto;flex:0 0 auto;color:var(--dsw-alias-label-tertiary,#8a8a8a);font-size:12px;}',
  '.' + PREFIX + 'muted{color:var(--dsw-alias-label-tertiary,#8a8a8a);}',
  '.' + PREFIX + 'err{color:#b91c1c;}',
  '.' + PREFIX + 'good{color:#15803d;}',
  '.' + PREFIX + 'actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}',
  '.' + PREFIX + 'notice{color:var(--dsw-alias-state-ok-primary,#15803d);font-size:12.5px;}',
  '.' + PREFIX + 'details{border:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:10px;',
  'padding:11px 16px;font-size:12.5px;}',
  '.' + PREFIX + 'summary{cursor:pointer;color:var(--dsw-alias-label-secondary,#555);}',
  /* ---- dark theme -------------------------------------------------------- */
  'body[data-ds-dark-theme] .' + PREFIX + 'root{color-scheme:dark;}',
  'body[data-ds-dark-theme] .' + PREFIX + 'card{border-color:var(--dsw-alias-border-l3,rgba(255,255,255,.12));background-color:var(--dsw-alias-bg-layer-1,rgba(255,255,255,.02));}',
  'body[data-ds-dark-theme] .' + PREFIX + 'input,body[data-ds-dark-theme] .' + PREFIX + 'select{color-scheme:dark;background-color:var(--dsw-alias-bg-layer-2,#212123);color:var(--dsw-alias-label-primary,#f9fafb);border-color:var(--dsw-alias-border-l3,rgba(255,255,255,.18));}',
  'body[data-ds-dark-theme] .' + PREFIX + 'select option,body[data-ds-dark-theme] .' + PREFIX + 'select optgroup{background-color:var(--dsw-alias-bg-layer-2,#212123);color:var(--dsw-alias-label-primary,#f9fafb);}',
  'body[data-ds-dark-theme] .' + PREFIX + 'btn{border-color:var(--dsw-alias-border-l3,rgba(255,255,255,.14));background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06));}',
  'body[data-ds-dark-theme] .' + PREFIX + 'btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-active,rgba(255,255,255,.12));}',
  'body[data-ds-dark-theme] .' + PREFIX + 'item{border-bottom-color:var(--dsw-alias-border-l3,rgba(255,255,255,.07));}',
  'body[data-ds-dark-theme] .' + PREFIX + 'details{border-color:var(--dsw-alias-border-l3,rgba(255,255,255,.12));}',
  'body[data-ds-dark-theme] .' + PREFIX + 'warn{color:#fbbf24;background:rgba(251,191,36,.10);border-color:rgba(251,191,36,.3);}',
  'body[data-ds-dark-theme] .' + PREFIX + 'banner{color:#fbbf24;background:rgba(251,191,36,.08);border-color:rgba(251,191,36,.3);}',
  '@media (prefers-color-scheme:dark){',
  ' .' + PREFIX + 'root{color-scheme:dark;}',
  ' .' + PREFIX + 'input,.' + PREFIX + 'select{color-scheme:dark;background-color:var(--dsw-alias-bg-layer-2,#212123);color:var(--dsw-alias-label-primary,#f9fafb);border-color:var(--dsw-alias-border-l3,rgba(255,255,255,.18));}',
  ' .' + PREFIX + 'select option,.' + PREFIX + 'select optgroup{background-color:var(--dsw-alias-bg-layer-2,#212123);color:var(--dsw-alias-label-primary,#f9fafb);}',
  ' .' + PREFIX + 'card{border-color:var(--dsw-alias-border-l3,rgba(255,255,255,.12));background-color:var(--dsw-alias-bg-layer-1,rgba(255,255,255,.02));}',
  ' .' + PREFIX + 'btn{border-color:var(--dsw-alias-border-l3,rgba(255,255,255,.14));background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06));}',
  ' .' + PREFIX + 'warn{color:#fbbf24;background:rgba(251,191,36,.10);border-color:rgba(251,191,36,.3);}',
  ' .' + PREFIX + 'banner{color:#fbbf24;background:rgba(251,191,36,.08);border-color:rgba(251,191,36,.3);}',
  '}',
].join('')

/** Install this plugin's stylesheet once per document. */
function ensureStyles() {
  if (typeof document === 'undefined') return
  if (document.querySelector('style[data-plugin-css="' + PANEL_ID + '"]') !== null) return
  const tag = document.createElement('style')
  tag.dataset.plugin = PANEL_ID
  tag.dataset.pluginCss = PANEL_ID
  tag.textContent = CSS
  document.head.appendChild(tag)
}

/**
 * The sidebar button's glyph.
 * @param props - slot props; the sidebar supplies `size`.
 * @returns the icon element.
 */
function PanelIcon(props) {
  const size = typeof props.size === 'number' ? props.size : 18
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      <path d="M12 5v14" />
      <path d="M12 8.5A3 3 0 0 0 6.5 9.8 3 3 0 0 0 7 15.4 2.6 2.6 0 0 0 12 17" />
      <path d="M12 8.5A3 3 0 0 1 17.5 9.8 3 3 0 0 1 17 15.4 2.6 2.6 0 0 1 12 17" />
    </svg>
  )
}

/**
 * A coloured status pill with a dot.
 * @param props - `tone` ('ok' | 'bad' | 'warn') and the label as children.
 * @returns the pill element.
 */
function Pill(props) {
  return <span className={PREFIX + 'pill ' + PREFIX + (props.tone ?? 'bad')}><span className={PREFIX + 'dot'} />{props.children}</span>
}

/**
 * One key/value status line.
 * @param props - `label` plus the value as children.
 * @returns the row element.
 */
function Row(props) {
  return (
    <div className={PREFIX + 'row'}>
      <span className={PREFIX + 'key'}>{props.label}</span>
      <span className={PREFIX + 'val'}>{props.children}</span>
    </div>
  )
}

/**
 * A model selector field supporting both advertised list selection and manual custom typing.
 */
function ModelSelectField(props) {
  const { label, hint, value, defaultValue = '', onChange, providers } = props

  const allKnownRoutes = useMemo(() => {
    const set = new Set()
    for (const p of providers) {
      if (!Array.isArray(p.models)) continue
      for (const m of p.models) {
        set.add(`${p.id}/${m.id}`)
        set.add(m.id)
      }
    }
    return set
  }, [providers])

  const [customMode, setCustomMode] = useState(false)
  const isCustom = customMode || (value !== '' && !allKnownRoutes.has(value))

  return (
    <div className={PREFIX + 'field'}>
      <span className={PREFIX + 'label'}>{label}</span>
      <div className={PREFIX + 'control'}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            className={PREFIX + 'select'}
            value={isCustom ? '__custom__' : value}
            onChange={(e) => {
              const selected = e.target.value
              if (selected === '__custom__') {
                setCustomMode(true)
              } else {
                setCustomMode(false)
                onChange(selected)
              }
            }}
          >
            <option value="">{defaultValue ? `默认 (${defaultValue})` : '未指定（跟随系统默认）'}</option>
            {providers.map((p) => (
              <optgroup key={p.id} label={p.name || p.id}>
                {(p.models || []).map((m) => {
                  const routeKey = `${p.id}/${m.id}`
                  return (
                    <option key={routeKey} value={routeKey}>
                      {m.name || m.id} ({p.id}/{m.id})
                    </option>
                  )
                })}
              </optgroup>
            ))}
            <option value="__custom__">自定义输入...</option>
          </select>
          {isCustom && (
            <button
              type="button"
              className={PREFIX + 'btn'}
              style={{ padding: '0 8px', fontSize: '12px' }}
              onClick={() => {
                setCustomMode(false)
                onChange('')
              }}
              title="切换回选择列表"
            >
              列表
            </button>
          )}
        </div>
        {isCustom && (
          <input
            className={PREFIX + 'input'}
            type="text"
            value={value}
            placeholder="例如 deepseek-flash 或 provider/model"
            onChange={(e) => onChange(e.target.value)}
          />
        )}
        <span className={PREFIX + 'hint'}>{hint}</span>
      </div>
    </div>
  )
}

/**
 * The settings page.
 * @returns the page element.
 */
function PanelPage() {
  const [status, setStatus] = useState({ loading: true, data: null, error: null })
  const [draft, setDraft] = useState(null)
  // The Control Plane address lives in this plugin's own file, not in the
  // upstream config, so it is tracked separately from `draft`.
  const [cpDraft, setCpDraft] = useState(null)
  // Server-side settings live in dsh-hindsight-gui.json and apply on restart.
  const [serverModelsDraft, setServerModelsDraft] = useState({})
  const [auditDraft, setAuditDraft] = useState(null)
  const [autoStartDraft, setAutoStartDraft] = useState(false)
  const [serverCommandDraft, setServerCommandDraft] = useState('')
  const [overridesDraft, setOverridesDraft] = useState({})
  const [modelsState, setModelsState] = useState({ loading: false, providers: [], error: null })
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [serverBusy, setServerBusy] = useState(null) // 'start' | 'restart' | null
  const [serverMessage, setServerMessage] = useState(null)
  const [defense, setDefense] = useState({})

  /** Cooldown ref so a down API with auto-start on does not spawn-storm. */
  const autoStartCooldownRef = useRef(0)

  const load = useCallback(() => {
    setStatus((previous) => ({ ...previous, loading: true, error: null }))
    fetch(STATUS_URL, { headers: { accept: 'application/json' } })
      .then((response) => {
        if (!response.ok) throw new Error('HTTP ' + String(response.status))
        return response.json()
      })
      .then((data) => setStatus({ loading: false, data, error: null }))
      .catch((error) => setStatus((previous) => ({ loading: false, data: previous.data, error: String(error?.message ?? error) })))
  }, [])

  const loadModels = useCallback(() => {
    setModelsState((prev) => ({ ...prev, loading: true, error: null }))
    fetch(MODELS_URL, { headers: { accept: 'application/json' } })
      .then((res) => {
        if (!res.ok) throw new Error('HTTP ' + String(res.status))
        return res.json()
      })
      .then((data) => {
        setModelsState({
          loading: false,
          providers: Array.isArray(data?.providers) ? data.providers : [],
          error: null,
        })
      })
      .catch((err) => {
        setModelsState({ loading: false, providers: [], error: String(err?.message ?? err) })
      })
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadModels() }, [loadModels])

  /** Poll status while the page is open and visible. */
  useEffect(() => {
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
      load()
    }, 15000)
    return () => clearInterval(timer)
  }, [load])

  /** Seed the form from the loaded values. */
  useEffect(() => {
    if (status.data) setDraft({ ...status.data.config.values })
  }, [status.data])

  /** Seed the plugin-own settings from the resolved values. */
  useEffect(() => {
    const gui = status.data?.gui
    if (gui) {
      setCpDraft(gui.controlPlaneUrl)
      setServerModelsDraft({ ...(gui.serverModels ?? {}) })
      setAuditDraft(gui.auditLogEnabled)
      setAutoStartDraft(gui.autoStart === true)
      setServerCommandDraft(gui.serverCommand ?? '')
      setOverridesDraft({ ...(gui.providerOverrides ?? {}) })
    }
  }, [status.data])

  /** Load each bank's memory-defense policy when the bank list changes. */
  const banks = status.data && Array.isArray(status.data.banks) ? status.data.banks : []
  useEffect(() => {
    for (const bank of banks) {
      if (defense[bank.id] !== undefined) continue
      setDefense((prev) => ({ ...prev, [bank.id]: { loading: true, enabled: false, action: null, error: null } }))
      fetch(`${BANKDEFENSE_URL}?bank=${encodeURIComponent(bank.id)}`, { headers: { accept: 'application/json' } })
        .then((res) => {
          if (!res.ok) throw new Error('HTTP ' + String(res.status))
          return res.json()
        })
        .then((data) => {
          setDefense((prev) => ({
            ...prev,
            [bank.id]: {
              loading: false,
              enabled: data?.memoryDefense?.enabled === true,
              action: data?.memoryDefense?.rules?.[0]?.action ?? null,
              error: null,
            },
          }))
        })
        .catch((err) => {
          setDefense((prev) => ({ ...prev, [bank.id]: { loading: false, enabled: false, action: null, error: String(err?.message ?? err) } }))
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run when the bank list identity changes
  }, [banks.map((b) => b.id).join('|')])

  /**
   * Auto-start: when the option is on and the API is down, ask the host to
   * launch it. Rate-limited so a failing start cannot spawn-storm.
   */
  useEffect(() => {
    const gui = status.data?.gui
    const api = status.data?.api
    if (gui?.autoStart !== true || !api || api.up !== false) return
    if (serverBusy !== null) return
    if (Date.now() < autoStartCooldownRef.current) return
    autoStartCooldownRef.current = Date.now() + 45000
    setServerBusy('start')
    fetch(SERVER_START_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: '{}',
    })
      .then(async (res) => {
        const payload = await res.json().catch(() => null)
        if (!res.ok) throw new Error(payload?.error ?? `HTTP ${res.status}`)
        return payload
      })
      .then((payload) => {
        setStatus({ loading: false, data: payload.status, error: null })
        setServerMessage(payload.alreadyRunning === true ? '服务已在运行。' : '已自动启动 Hindsight 服务。')
      })
      .catch((error) => setServerMessage('自动启动失败：' + String(error?.message ?? error)))
      .finally(() => setServerBusy(null))
  }, [status.data, serverBusy])

  const dirty = useMemo(() => {
    if (!draft || !status.data) return false
    const saved = status.data.config.values
    const gui = status.data.gui
    if (cpDraft !== null && gui && cpDraft !== gui.controlPlaneUrl) return true
    if (gui) {
      const savedServer = gui.serverModels ?? {}
      const allKeys = new Set([...Object.keys(serverModelsDraft), ...Object.keys(savedServer)])
      for (const key of allKeys) {
        if ((serverModelsDraft[key] ?? '') !== (savedServer[key] ?? '')) return true
      }
      if ((auditDraft ?? null) !== (gui.auditLogEnabled ?? null)) return true
      if (autoStartDraft !== (gui.autoStart === true)) return true
      if ((serverCommandDraft ?? '') !== (gui.serverCommand ?? '')) return true
      const savedOverrides = gui.providerOverrides ?? {}
      const overrideKeys = new Set([...Object.keys(overridesDraft), ...Object.keys(savedOverrides)])
      for (const key of overrideKeys) {
        const a = overridesDraft[key] ?? {}
        const b = savedOverrides[key] ?? {}
        if ((a.baseUrl ?? '') !== (b.baseUrl ?? '') || (a.apiKey ?? '') !== (b.apiKey ?? '') || (a.apiKeyEnv ?? '') !== (b.apiKeyEnv ?? '')) return true
      }
    }
    return Object.keys(draft).some((key) => draft[key] !== saved[key])
  }, [draft, cpDraft, serverModelsDraft, auditDraft, autoStartDraft, serverCommandDraft, overridesDraft, status.data])

  const set = useCallback((key, value) => {
    setDraft((previous) => (previous === null ? previous : { ...previous, [key]: value }))
    setNotice(null)
    setSaveError(null)
  }, [])

  const setCp = useCallback((value) => {
    setCpDraft(value)
    setNotice(null)
    setSaveError(null)
  }, [])

  const setServerModel = useCallback((scope, val) => {
    setServerModelsDraft((prev) => ({ ...prev, [scope]: val }))
    setNotice(null)
    setSaveError(null)
  }, [])

  const setOverride = useCallback((provider, field, value) => {
    setOverridesDraft((prev) => ({ ...prev, [provider]: { ...(prev[provider] ?? {}), [field]: value } }))
    setNotice(null)
    setSaveError(null)
  }, [])

  const save = useCallback(() => {
    if (!draft) return
    setSaving(true)
    setNotice(null)
    setSaveError(null)
    const payloadBody = { ...draft }
    if (cpDraft !== null) payloadBody.controlPlaneUrl = cpDraft
    payloadBody.serverModels = serverModelsDraft
    payloadBody.auditLogEnabled = auditDraft === true
    payloadBody.autoStart = autoStartDraft
    payloadBody.serverCommand = serverCommandDraft
    payloadBody.providerOverrides = overridesDraft
    fetch(CONFIG_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(payloadBody),
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => null)
        if (!response.ok) throw new Error(payload?.error ?? `HTTP ${response.status}`)
        return payload
      })
      .then((payload) => {
        setSaving(false)
        setStatus({ loading: false, data: payload, error: null })
        const saved = Array.isArray(payload?.saved) ? payload.saved.join('、') : ''
        const serverSide = payload?.server?.pendingRestart === true
        setNotice(saved === ''
          ? '已保存。'
          : `已保存（${saved}）。${serverSide ? '服务端设置将在重启服务后生效。' : '下一轮对话生效。'}`)
      })
      .catch((error) => {
        setSaving(false)
        setSaveError(String(error?.message ?? error))
      })
  }, [draft, cpDraft, serverModelsDraft, auditDraft, autoStartDraft, serverCommandDraft, overridesDraft])

  const discard = useCallback(() => {
    const data = status.data
    if (!data) return
    setDraft({ ...data.config.values })
    setCpDraft(data.gui.controlPlaneUrl)
    setServerModelsDraft({ ...(data.gui.serverModels ?? {}) })
    setAuditDraft(data.gui.auditLogEnabled)
    setAutoStartDraft(data.gui.autoStart === true)
    setServerCommandDraft(data.gui.serverCommand ?? '')
    setOverridesDraft({ ...(data.gui.providerOverrides ?? {}) })
    setNotice(null)
    setSaveError(null)
  }, [status.data])

  const serverAction = useCallback((action) => {
    setServerBusy(action)
    setServerMessage(null)
    fetch(action === 'restart' ? SERVER_RESTART_URL : SERVER_START_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: '{}',
    })
      .then(async (res) => {
        const payload = await res.json().catch(() => null)
        if (!res.ok) throw new Error(payload?.error ?? `HTTP ${res.status}`)
        return payload
      })
      .then((payload) => {
        setStatus({ loading: false, data: payload.status, error: null })
        setServerMessage(action === 'restart' ? '已按当前设置重启服务。' : (payload.alreadyRunning === true ? '服务已在运行。' : '服务已启动。'))
      })
      .catch((error) => {
        setServerMessage((action === 'restart' ? '重启失败：' : '启动失败：') + String(error?.message ?? error))
        load()
      })
      .finally(() => setServerBusy(null))
  }, [load])

  const toggleDefense = useCallback((bankId, enabled) => {
    setDefense((prev) => ({ ...prev, [bankId]: { ...(prev[bankId] ?? { enabled }), loading: true, error: null } }))
    fetch(BANKDEFENSE_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ bankId, enabled }),
    })
      .then(async (res) => {
        const payload = await res.json().catch(() => null)
        if (!res.ok) throw new Error(payload?.error ?? `HTTP ${res.status}`)
        return payload
      })
      .then((payload) => {
        setDefense((prev) => ({
          ...prev,
          [bankId]: {
            loading: false,
            enabled: payload?.memoryDefense?.enabled === true,
            action: payload?.memoryDefense?.rules?.[0]?.action ?? null,
            error: null,
          },
        }))
      })
      .catch((error) => {
        setDefense((prev) => ({ ...prev, [bankId]: { ...(prev[bankId] ?? { enabled: !enabled }), loading: false, error: String(error?.message ?? error) } }))
      })
  }, [])

  const data = status.data
  const api = data ? data.api : null
  const cp = data ? data.controlPlane : null
  const config = data ? data.config : null
  const server = data ? data.server : null
  const extraKeys = config && Array.isArray(config.extraKeys) ? config.extraKeys : []
  const recordMode = draft && (draft.dynamicBankId === true) ? 'dynamic' : 'fixed'

  /**
   * Providers worth showing in the override editor: everything the DSH
   * environment advertises, everything a server model references, and
   * everything with a saved override.
   */
  const overrideProviders = useMemo(() => {
    const ids = []
    const seen = new Set()
    const push = (id) => {
      if (id && !seen.has(id)) {
        seen.add(id)
        ids.push(id)
      }
    }
    for (const p of modelsState.providers) push(p.id)
    for (const value of Object.values(serverModelsDraft)) {
      const spec = typeof value === 'string' ? value : ''
      const slash = spec.indexOf('/')
      push(slash > 0 ? spec.slice(0, slash).toLowerCase() : '')
    }
    for (const id of Object.keys(overridesDraft)) push(id)
    return ids
  }, [modelsState.providers, serverModelsDraft, overridesDraft])

  return (
    <div className={PREFIX + 'root'}>
      <div className={PREFIX + 'head'}>
        <h2 className={PREFIX + 'h'}>Hindsight</h2>
        <p className={PREFIX + 'sub'}>
          记忆设置保存后下一轮对话生效；服务端设置（模型路由、审计日志）在启动/重启服务时应用。
        </p>
      </div>

      {status.loading && draft === null && <div className={PREFIX + 'muted'}>读取中…</div>}

      {status.error !== null && (
        <div className={PREFIX + 'card'}>
          <Row label="读取失败"><span className={PREFIX + 'err'}>{status.error}</span></Row>
          <div className={PREFIX + 'actions'}>
            <button type="button" className={PREFIX + 'btn'} onClick={load}>重试</button>
          </div>
        </div>
      )}

      {/* ---- service management ------------------------------------------ */}
      {server && (
        <div className={PREFIX + 'card'}>
          <div className={PREFIX + 'cardhead'}>
            <h3 className={PREFIX + 'cardtitle'}>服务管理</h3>
            <div className={PREFIX + 'actions'}>
              <button type="button" className={PREFIX + 'btn'} disabled={serverBusy !== null || api?.up === true} onClick={() => serverAction('start')}>
                {serverBusy === 'start' ? '启动中…' : '启动服务'}
              </button>
              <button type="button" className={PREFIX + 'btn ' + PREFIX + 'btnprimary'} disabled={serverBusy !== null} onClick={() => serverAction('restart')}>
                {serverBusy === 'restart' ? '重启中…' : '重启服务'}
              </button>
            </div>
          </div>

          <Row label="API">
            <Pill tone={api?.up === true ? 'ok' : 'bad'}>{api?.up === true ? '运行中' : '未运行'}</Pill>
            <span className={PREFIX + 'muted'}> {api?.url}</span>
          </Row>
          {api?.up === true && (
            <Row label="数据库">
              <span className={PREFIX + 'mono'}>{api.database ?? '—'}</span>
              <span className={PREFIX + 'muted'}> · {api.status ?? '—'}</span>
            </Row>
          )}
          <Row label="控制台">
            <Pill tone={cp?.up === true ? 'ok' : 'bad'}>{cp?.up === true ? '运行中' : '未运行'}</Pill>
            <span className={PREFIX + 'muted'}> {cp?.url}</span>
          </Row>
          <Row label="启动入口">
            {server.entry
              ? <span className={PREFIX + 'mono'}>{server.entry.command}<span className={PREFIX + 'muted'}>（{server.entry.source}）</span></span>
              : <span className={PREFIX + 'err'}>{server.entryReason ?? '未找到'}</span>}
          </Row>
          {server.lastAction && (
            <Row label="最近操作">
              <span className={server.lastAction.ok === true ? PREFIX + 'good' : PREFIX + 'err'}>
                {server.lastAction.action === 'restart' ? '重启' : '启动'} · {server.lastAction.detail ?? ''}
              </span>
            </Row>
          )}

          <div className={PREFIX + 'field'}>
            <span className={PREFIX + 'label'}>自动启动</span>
            <div className={PREFIX + 'control'}>
              <label className={PREFIX + 'check'}>
                <input type="checkbox" checked={autoStartDraft}
                  onChange={(event) => setAutoStartDraft(event.target.checked)} />
                <span>API 未运行时，打开本页自动拉起服务（保存后生效）</span>
              </label>
              <span className={PREFIX + 'hint'}>
                由插件按下方「功能模型调用」等设置动态构建环境并启动，无需系统启动脚本。
              </span>
            </div>
          </div>

          <div className={PREFIX + 'field'}>
            <span className={PREFIX + 'label'}>启动命令覆盖</span>
            <div className={PREFIX + 'control'}>
              <input className={PREFIX + 'input'} type="text" value={serverCommandDraft}
                placeholder="留空 = 自动发现（PATH → uv/pip 默认安装位置）"
                onChange={(event) => setServerCommandDraft(event.target.value)} />
              <span className={PREFIX + 'hint'}>hindsight-api 可执行文件的完整路径；仅当自动发现失败时需要填写。</span>
            </div>
          </div>

          {server.pendingRestart === true && api?.up === true && (
            <div className={PREFIX + 'banner'}>
              <span>服务端设置已修改，当前运行的进程仍是旧配置。</span>
              <button type="button" className={PREFIX + 'btn'} disabled={serverBusy !== null} onClick={() => serverAction('restart')}>
                立即重启生效
              </button>
            </div>
          )}

          {Array.isArray(server.resolutions) && server.resolutions.length > 0 && (
            <div className={PREFIX + 'control'}>
              <span className={PREFIX + 'hint'}>下次启动/重启将应用：</span>
              <ul className={PREFIX + 'list'}>
                {server.resolutions.map((res) => (
                  <li className={PREFIX + 'item'} key={res.scope}>
                    <span className={PREFIX + 'muted'} style={{ flex: '0 0 64px' }}>
                      {SERVER_SCOPES.find((s) => s.key === res.scope)?.label ?? res.scope}
                    </span>
                    {res.mode === 'error'
                      ? <span className={PREFIX + 'err'} style={{ minWidth: 0 }}>{res.spec} — {res.note}</span>
                      : res.mode === 'default'
                        ? <span className={PREFIX + 'muted'}>{res.note}</span>
                        : (
                          <span style={{ minWidth: 0 }}>
                            <span className={PREFIX + 'mono'}>{res.spec}</span>
                            <span className={PREFIX + 'muted'}> · 凭据 {res.credentialSource}{res.baseUrl ? ` · ${res.baseUrl}` : ''}</span>
                          </span>
                        )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {serverMessage && <div className={PREFIX + 'notice'}>{serverMessage}</div>}

          <div className={PREFIX + 'actions'}>
            <a className={PREFIX + 'btn'} href={cp ? cp.url : '#'} target="_blank" rel="noreferrer noopener">
              打开 Control Plane
            </a>
            <button type="button" className={PREFIX + 'btn'} onClick={load}>刷新状态</button>
          </div>
        </div>
      )}

      {draft !== null && (
        <>
          <div className={PREFIX + 'card'}>
            <h3 className={PREFIX + 'cardtitle'}>记忆</h3>

            <div className={PREFIX + 'field'}>
              <span className={PREFIX + 'label'}>启用</span>
              <div className={PREFIX + 'control'}>
                <label className={PREFIX + 'check'}>
                  <input type="checkbox" checked={draft.disabled !== true}
                    onChange={(event) => set('disabled', !event.target.checked)} />
                  <span>在这个 harness 上启用长期记忆</span>
                </label>
                <span className={PREFIX + 'hint'}>
                  关闭后不召回、不写回、不注册 hindsight_* 工具（写入 disabled）。
                </span>
              </div>
            </div>

            <div className={PREFIX + 'field'}>
              <span className={PREFIX + 'label'}>记忆库命名</span>
              <div className={PREFIX + 'control'}>
                <label className={PREFIX + 'check'}>
                  <input type="radio" name="bankmode" checked={recordMode === 'dynamic'}
                    onChange={() => set('dynamicBankId', true)} />
                  <span>按工作区动态命名 <span className={PREFIX + 'muted'}>(harness::项目名，例如 coding-agent::DSH)</span></span>
                </label>
                <label className={PREFIX + 'check'}>
                  <input type="radio" name="bankmode" checked={recordMode === 'fixed'}
                    onChange={() => set('dynamicBankId', false)} />
                  <span>固定名字</span>
                </label>
                {recordMode === 'fixed' && (
                  <input className={PREFIX + 'input'} type="text" value={draft.bankId ?? ''}
                    placeholder="my-memory-bank"
                    onChange={(event) => set('bankId', event.target.value)} />
                )}
              </div>
            </div>
          </div>

          <div className={PREFIX + 'card'}>
            <h3 className={PREFIX + 'cardtitle'}>连接</h3>

            <div className={PREFIX + 'field'}>
              <span className={PREFIX + 'label'}>服务地址</span>
              <div className={PREFIX + 'control'}>
                <input className={PREFIX + 'input'} type="text" value={draft.apiUrl ?? ''}
                  placeholder="http://localhost:8888"
                  onChange={(event) => set('apiUrl', event.target.value)} />
                <span className={PREFIX + 'hint'}>
                  Hindsight API 的地址。启动/重启服务时按此端口监听（写入 apiUrl）。
                </span>
              </div>
            </div>

            <div className={PREFIX + 'field'}>
              <span className={PREFIX + 'label'}>控制台地址</span>
              <div className={PREFIX + 'control'}>
                <input className={PREFIX + 'input'} type="text" value={cpDraft ?? ''}
                  placeholder="http://127.0.0.1:9999"
                  onChange={(event) => setCp(event.target.value)} />
                <span className={PREFIX + 'hint'}>
                  Hindsight Control Plane 的地址（Web 控制台）。仅接受 http/https，不含路径参数。
                  {data?.gui?.source === 'env' && ' 当前取自环境变量 HINDSIGHT_CP_URL，保存后改由本页管理。'}
                  {data?.gui?.source === 'default' && ' 当前为默认值，保存后改由本页管理。'}
                </span>
              </div>
            </div>

            <div className={PREFIX + 'field'}>
              <span className={PREFIX + 'label'}>日志级别</span>
              <div className={PREFIX + 'control'}>
                <select className={PREFIX + 'select'} value={draft.logLevel ?? 'info'}
                  onChange={(event) => set('logLevel', event.target.value)}>
                  {LOG_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
                </select>
                <span className={PREFIX + 'hint'}>写入 ~/.hindsight/coding-agents-logs/plugin.log 的详细程度。</span>
              </div>
            </div>
          </div>

          <div className={PREFIX + 'card'}>
            <div className={PREFIX + 'cardhead'}>
              <h3 className={PREFIX + 'cardtitle'}>功能模型调用</h3>
              <button
                type="button"
                className={PREFIX + 'btn'}
                style={{ height: '24px', padding: '0 8px', fontSize: '11.5px' }}
                onClick={loadModels}
                disabled={modelsState.loading}
              >
                {modelsState.loading ? '获取模型中…' : '刷新 DSH 模型'}
              </button>
            </div>
            <span className={PREFIX + 'hint'} style={{ marginTop: '-4px' }}>
              从当前 DSH 环境已注册的 Provider 发现模型，支持下拉点选或手动指定；保存后重启服务生效。
            </span>

            <ModelSelectField
              label="代码库勘察"
              hint="新仓库或大规模更新时进行结构勘察（写入 coding-agent.json 的 surveyModel，下一轮对话生效）。"
              defaultValue="haiku"
              value={draft.surveyModel ?? ''}
              onChange={(val) => set('surveyModel', val)}
              providers={modelsState.providers}
            />

            {SERVER_SCOPES.map((scope) => (
              <ModelSelectField
                key={scope.key}
                label={scope.label}
                hint={scope.hint + `（写入 serverModels.${scope.key}）`}
                defaultValue={scope.key === 'reflect' ? 'MiniMax-M3' : 'deepseek-flash'}
                value={serverModelsDraft[scope.key] ?? ''}
                onChange={(val) => setServerModel(scope.key, val)}
                providers={modelsState.providers}
              />
            ))}
          </div>

          <div className={PREFIX + 'card'}>
            <h3 className={PREFIX + 'cardtitle'}>Provider 覆盖</h3>
            <span className={PREFIX + 'hint'}>
              为非内置 Provider 填写 openai 兼容端点与凭据；留空表示用环境变量（&lt;PROVIDER&gt;_API_KEY）或 DSH 凭据库。
            </span>
            {overrideProviders.length === 0 && <div className={PREFIX + 'muted'}>暂无需要覆盖的 Provider。</div>}
            {overrideProviders.map((provider) => {
              const entry = overridesDraft[provider] ?? {}
              return (
                <div className={PREFIX + 'field'} key={provider}>
                  <span className={PREFIX + 'label mono'}>{provider}</span>
                  <div className={PREFIX + 'control'}>
                    <input className={PREFIX + 'input'} type="text" value={entry.baseUrl ?? ''}
                      placeholder="Base URL（openai 兼容端点，例如 https://api.example.com/v1）"
                      onChange={(event) => setOverride(provider, 'baseUrl', event.target.value)} />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input className={PREFIX + 'input'} type="text" value={entry.apiKeyEnv ?? ''}
                        placeholder="API Key 环境变量名"
                        onChange={(event) => setOverride(provider, 'apiKeyEnv', event.target.value)} />
                      <input className={PREFIX + 'input'} type="password" value={entry.apiKey ?? ''}
                        placeholder="或直接填 Key"
                        onChange={(event) => setOverride(provider, 'apiKey', event.target.value)} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className={PREFIX + 'card'}>
            <h3 className={PREFIX + 'cardtitle'}>安全</h3>
            <div className={PREFIX + 'field'}>
              <span className={PREFIX + 'label'}>审计日志</span>
              <div className={PREFIX + 'control'}>
                <label className={PREFIX + 'check'}>
                  <input type="checkbox" checked={auditDraft === true}
                    onChange={(event) => setAuditDraft(event.target.checked)} />
                  <span>记录功能调用审计（HINDSIGHT_API_AUDIT_LOG_ENABLED）</span>
                </label>
                <span className={PREFIX + 'hint'}>
                  服务端部署级开关，重启服务后生效；也可按 bank 在 Control Plane 中单独覆盖。
                </span>
              </div>
            </div>
          </div>

          <div className={PREFIX + 'card'}>
            <h3 className={PREFIX + 'cardtitle'}>其他</h3>
            <label className={PREFIX + 'check'}>
              <input type="checkbox" checked={draft.autoUpdate === true}
                onChange={(event) => set('autoUpdate', event.target.checked)} />
              <span>自动更新（autoUpdate）</span>
            </label>
            <label className={PREFIX + 'check'}>
              <input type="checkbox" checked={draft.codebaseSurvey === true}
                onChange={(event) => set('codebaseSurvey', event.target.checked)} />
              <span>代码库勘察（codebaseSurvey）</span>
            </label>
          </div>

          <div className={PREFIX + 'actions'}>
            <button type="button" className={PREFIX + 'btn ' + PREFIX + 'btnprimary'} disabled={!dirty || saving} onClick={save}>
              {saving ? '保存中…' : '保存'}
            </button>
            <button type="button" className={PREFIX + 'btn'} disabled={!dirty || saving} onClick={discard}>
              放弃更改
            </button>
            {dirty && !saving && <span className={PREFIX + 'muted'}>有未保存的更改</span>}
            {notice && <span className={PREFIX + 'notice'}>{notice}</span>}
            {saveError && <span className={PREFIX + 'err'}>保存失败：{saveError}</span>}
          </div>
        </>
      )}

      {data && (
        <div className={PREFIX + 'card'}>
          <h3 className={PREFIX + 'cardtitle'}>记忆库 <span className={PREFIX + 'muted'}>({banks.length})</span></h3>
          {banks.length === 0
            ? <div className={PREFIX + 'muted'}>没有读到记忆库。</div>
            : (
              <ul className={PREFIX + 'list'}>
                {banks.map((bank) => {
                  const state = defense[bank.id] ?? { loading: true, enabled: false }
                  return (
                    <li className={PREFIX + 'item'} key={bank.id}>
                      <span className={PREFIX + 'mono'} style={{ minWidth: 0 }}>{bank.id}</span>
                      <span className={PREFIX + 'count'}>{bank.facts} facts</span>
                      {state.error && <span className={PREFIX + 'err'} style={{ flex: '1 1 100%', order: 3 }}>{state.error}</span>}
                      <label className={PREFIX + 'check'} style={{ flex: '0 0 auto' }}>
                        <input type="checkbox" disabled={state.loading === true}
                          checked={state.enabled === true}
                          onChange={(event) => toggleDefense(bank.id, event.target.checked)} />
                        <span className={PREFIX + 'muted'} style={{ fontSize: '12px' }}>脱敏</span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            )}
          <span className={PREFIX + 'hint'}>
            「脱敏」为该记忆库开启 Memory Defense（sensitive_data → redact）：密钥、令牌等敏感串在入库前被打码。
          </span>
        </div>
      )}

      {extraKeys.length > 0 && (
        <details className={PREFIX + 'details'}>
          <summary>配置文件里还有 {extraKeys.length} 个本页不改写的键（保存时会原样保留）</summary>
          <div className={PREFIX + 'mono'} style={{ marginTop: '8px' }}>{extraKeys.join('、')}</div>
        </details>
      )}
    </div>
  )
}

export const name = 'hindsight-gui'

/** Cordis services this half needs. */
export const inject = ['slots']

/**
 * Register the sidebar button and the page it opens.
 * @param ctx - browser plugin context.
 */
export function apply(ctx) {
  ensureStyles()

  ctx.slots.inject('main', () => ctx.slots.register({
    name: 'main',
    key: PANEL_ID,
  }, PanelPage))

  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist',
    id: PANEL_ID,
    order: 40,
    label: 'Hindsight',
  }, PanelIcon))
}
