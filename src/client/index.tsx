/**
 * dsh-hindsight-gui — browser half.
 *
 * A SETTINGS page for the Hindsight stack, plus a compact read-only status
 * block. One icon button in the sidebar (`sidebar.panellist`) and one page in
 * `main`, linked by a shared id — the same pairing `dsh-context` and the
 * schedule panel use.
 *
 * Layout note, and the reason this file is written the way it is: `main` is
 * rendered inside a CSS-GRID grid item (`CenterColumn`), which has a definite
 * size, so the page simply follows it — `height: 100%`, ordinary document flow,
 * NO `position: absolute`. An earlier revision used `position:absolute; inset:0`,
 * found no positioned ancestor, expanded against the viewport and covered the
 * whole application. Do not reintroduce absolute positioning here.
 *
 * The page never fetches the API or writes the config file directly: it calls
 * this plugin's own same-origin routes, and the host half does the work. That is
 * required for the API (no `Access-Control-Allow-Origin`), and it keeps the
 * config write inside one audited place with a whitelist and an atomic save.
 *
 * Saving takes effect on the next turn: the integration re-reads the config file
 * on every `loadConfig()` call, so no restart is needed.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'

/** Id shared by the sidebar button and the page; this is what links them. */
const PANEL_ID = 'hindsight-gui'

/** Same-origin routes served by the host half. */
const STATUS_URL = '/plugins/dsh-hindsight-gui/status'
const CONFIG_URL = '/plugins/dsh-hindsight-gui/config'
const MODELS_URL = '/plugins/dsh-hindsight-gui/models'

/** Class-name prefix for this panel's hand-written stylesheet. */
const PREFIX = 'dsh-hsp-'

/** Log levels the integration accepts. */
const LOG_LEVELS = ['debug', 'info', 'warn', 'error']

const CSS = [
  '.' + PREFIX + 'root{box-sizing:border-box;height:100%;min-height:0;overflow:auto;',
  'display:flex;flex-direction:column;gap:16px;padding:20px 24px 36px;max-width:760px;',
  'color:var(--dsw-alias-label-primary,#1a1a1a);font-size:13px;line-height:20px;}',
  '.' + PREFIX + 'head{display:flex;flex-direction:column;gap:4px;}',
  '.' + PREFIX + 'h{margin:0;font-size:17px;line-height:24px;font-weight:600;}',
  '.' + PREFIX + 'sub{margin:0;color:var(--dsw-alias-label-tertiary,#8a8a8a);font-size:12.5px;}',
  '.' + PREFIX + 'card{border:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));',
  'border-radius:10px;padding:14px 16px;display:flex;flex-direction:column;gap:11px;}',
  '.' + PREFIX + 'cardtitle{margin:0;font-size:13px;font-weight:600;}',
  '.' + PREFIX + 'field{display:flex;align-items:flex-start;gap:12px;}',
  '.' + PREFIX + 'label{flex:0 0 116px;padding-top:5px;color:var(--dsw-alias-label-secondary,#555);}',
  '.' + PREFIX + 'control{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:6px;}',
  '.' + PREFIX + 'hint{color:var(--dsw-alias-label-tertiary,#8a8a8a);font-size:12px;}',
  '.' + PREFIX + 'input,.dsh-hsp-select{box-sizing:border-box;width:100%;height:30px;padding:0 9px;',
  'border-radius:7px;border:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.18));',
  'background:var(--dsw-alias-bg-default,transparent);color:inherit;font:inherit;font-size:13px;}',
  '.' + PREFIX + 'input:focus,.dsh-hsp-select:focus{outline:2px solid var(--dsw-alias-brand-primary,#3b82f6);',
  'outline-offset:1px;}',
  '.' + PREFIX + 'radio{display:flex;align-items:flex-start;gap:8px;cursor:pointer;}',
  '.' + PREFIX + 'radio input{margin-top:3px;}',
  '.' + PREFIX + 'row{display:flex;align-items:center;gap:10px;min-width:0;}',
  '.' + PREFIX + 'key{flex:0 0 92px;color:var(--dsw-alias-label-tertiary,#8a8a8a);}',
  '.' + PREFIX + 'val{min-width:0;overflow-wrap:anywhere;}',
  '.' + PREFIX + 'badge{display:inline-flex;align-items:center;gap:5px;font-size:12px;',
  'padding:1px 9px;border-radius:999px;border:.5px solid transparent;white-space:nowrap;}',
  '.' + PREFIX + 'ok{color:#15803d;background:rgba(21,128,61,.10);border-color:rgba(21,128,61,.25);}',
  '.' + PREFIX + 'bad{color:#b91c1c;background:rgba(185,28,28,.10);border-color:rgba(185,28,28,.25);}',
  '.' + PREFIX + 'btn{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 14px;',
  'border-radius:8px;border:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.14));',
  'background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.045));color:inherit;font:inherit;',
  'font-size:13px;cursor:pointer;text-decoration:none;}',
  '.' + PREFIX + 'btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-active,rgba(0,0,0,.09));}',
  '.' + PREFIX + 'btn:disabled{opacity:.5;cursor:default;}',
  '.' + PREFIX + 'actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}',
  '.' + PREFIX + 'notice{color:var(--dsw-alias-state-ok-primary,#15803d);font-size:12.5px;}',
  '.' + PREFIX + 'list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;}',
  '.' + PREFIX + 'item{display:flex;align-items:baseline;gap:12px;padding:6px 0;min-width:0;',
  'border-bottom:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.07));}',
  '.' + PREFIX + 'item:last-child{border-bottom:0;}',
  '.' + PREFIX + 'mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;',
  'overflow-wrap:anywhere;}',
  '.' + PREFIX + 'count{margin-left:auto;flex:0 0 auto;color:var(--dsw-alias-label-tertiary,#8a8a8a);font-size:12px;}',
  '.' + PREFIX + 'muted{color:var(--dsw-alias-label-tertiary,#8a8a8a);}',
  '.' + PREFIX + 'err{color:#b91c1c;}',
  '.' + PREFIX + 'details{border:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:10px;',
  'padding:11px 16px;font-size:12.5px;}',
  '.' + PREFIX + 'summary{cursor:pointer;color:var(--dsw-alias-label-secondary,#555);}',
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
 * A coloured up/down badge.
 * @param props - `ok` selects the tone; children carry the label.
 * @returns the badge element.
 */
function Badge(props) {
  return <span className={PREFIX + 'badge ' + (props.ok ? PREFIX + 'ok' : PREFIX + 'bad')}>{props.children}</span>
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
  // Server-side LLM model routing lives in dsh-hindsight-gui.json
  const [serverModelsDraft, setServerModelsDraft] = useState({})
  const [modelsState, setModelsState] = useState({ loading: false, providers: [], error: null })
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const [saveError, setSaveError] = useState(null)

  const load = useCallback(() => {
    setStatus((previous) => ({ ...previous, loading: true, error: null }))
    fetch(STATUS_URL, { headers: { accept: 'application/json' } })
      .then((response) => {
        if (!response.ok) throw new Error('HTTP ' + String(response.status))
        return response.json()
      })
      .then((data) => setStatus({ loading: false, data, error: null }))
      .catch((error) => setStatus({ loading: false, data: null, error: String(error?.message ?? error) }))
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

  /** Seed the form from the loaded values. */
  useEffect(() => {
    if (status.data) setDraft({ ...status.data.config.values })
  }, [status.data])

  /** Seed the Control Plane field and serverModels from the resolved settings. */
  useEffect(() => {
    if (status.data?.gui) {
      setCpDraft(status.data.gui.controlPlaneUrl)
      setServerModelsDraft({ ...(status.data.gui.serverModels ?? {}) })
    }
  }, [status.data])

  const dirty = useMemo(() => {
    if (!draft || !status.data) return false
    const saved = status.data.config.values
    if (cpDraft !== null && status.data.gui) {
      if (cpDraft !== status.data.gui.controlPlaneUrl) return true
    }
    if (serverModelsDraft && status.data.gui) {
      const savedServer = status.data.gui.serverModels ?? {}
      const allKeys = new Set([...Object.keys(serverModelsDraft), ...Object.keys(savedServer)])
      for (const key of allKeys) {
        if ((serverModelsDraft[key] ?? '') !== (savedServer[key] ?? '')) return true
      }
    }
    return Object.keys(draft).some((key) => draft[key] !== saved[key])
  }, [draft, cpDraft, serverModelsDraft, status.data])

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

  const save = useCallback(() => {
    if (!draft) return
    setSaving(true)
    setNotice(null)
    setSaveError(null)
    // Send both the upstream harness config keys and this plugin's settings (cpUrl, serverModels)
    const payloadBody = { ...draft }
    if (cpDraft !== null) payloadBody.controlPlaneUrl = cpDraft
    if (serverModelsDraft !== null) payloadBody.serverModels = serverModelsDraft
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
        setNotice(saved === '' ? '已保存。' : `已保存（${saved}）。下一轮对话生效。`)
      })
      .catch((error) => {
        setSaving(false)
        setSaveError(String(error?.message ?? error))
      })
  }, [draft, cpDraft, serverModelsDraft])

  const data = status.data
  const api = data ? data.api : null
  const cp = data ? data.controlPlane : null
  const config = data ? data.config : null
  const banks = data && Array.isArray(data.banks) ? data.banks : []
  const extraKeys = config && Array.isArray(config.extraKeys) ? config.extraKeys : []
  const recordMode = draft && (draft.dynamicBankId === true) ? 'dynamic' : 'fixed'

  return (
    <div className={PREFIX + 'root'}>
      <div className={PREFIX + 'head'}>
        <h2 className={PREFIX + 'h'}>Hindsight 设置</h2>
        <p className={PREFIX + 'sub'}>写入 ~/.hindsight/coding-agent.json 与 dsh-hindsight-gui.json。保存后下一轮对话生效，无需重启。</p>
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

      {draft !== null && (
        <>
          <div className={PREFIX + 'card'}>
            <h3 className={PREFIX + 'cardtitle'}>记忆</h3>

            <div className={PREFIX + 'field'}>
              <span className={PREFIX + 'label'}>启用</span>
              <div className={PREFIX + 'control'}>
                <label className={PREFIX + 'radio'}>
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
                <label className={PREFIX + 'radio'}>
                  <input type="radio" name="bankmode" checked={recordMode === 'dynamic'}
                    onChange={() => set('dynamicBankId', true)} />
                  <span>按工作区动态命名 <span className={PREFIX + 'muted'}>(harness::项目名，例如 coding-agent::DSH)</span></span>
                </label>
                <label className={PREFIX + 'radio'}>
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
                  Hindsight API 的地址，需指向你已部署好的服务（写入 apiUrl）。
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
              直接从当前 DSH 环境已注册的 Provider 发现模型，支持下拉点选或手动指定。
            </span>

            <ModelSelectField
              label="代码库勘察"
              hint="新仓库或大规模更新时进行结构勘察（写入 coding-agent.json 的 surveyModel）。"
              defaultValue="haiku"
              value={draft.surveyModel ?? ''}
              onChange={(val) => set('surveyModel', val)}
              providers={modelsState.providers}
            />

            <ModelSelectField
              label="反思推理"
              hint="hindsight_reflect 记忆推理与问答。建议选用推理和长上下文能力强的模型（写入 serverModels.reflect）。"
              defaultValue="MiniMax-M3"
              value={serverModelsDraft.reflect ?? ''}
              onChange={(val) => setServerModel('reflect', val)}
              providers={modelsState.providers}
            />

            <ModelSelectField
              label="事实提取"
              hint="从会话中提取事实（Retain），Token 消耗量大。建议选用速度快、成本低且支持 JSON Schema 的模型（写入 serverModels.retain）。"
              defaultValue="deepseek-flash"
              value={serverModelsDraft.retain ?? ''}
              onChange={(val) => setServerModel('retain', val)}
              providers={modelsState.providers}
            />

            <ModelSelectField
              label="记忆整理"
              hint="后台聚合消歧与去重相似事实（Consolidation）。建议选用支持结构化输出的快速模型（写入 serverModels.consolidation）。"
              defaultValue="deepseek-flash"
              value={serverModelsDraft.consolidation ?? ''}
              onChange={(val) => setServerModel('consolidation', val)}
              providers={modelsState.providers}
            />

            <ModelSelectField
              label="知识提炼"
              hint="刷新结构化知识库页面（Mental Model Refresh，如架构图、概念规范）（写入 serverModels.mentalModel）。"
              defaultValue="deepseek-flash"
              value={serverModelsDraft.mentalModel ?? ''}
              onChange={(val) => setServerModel('mentalModel', val)}
              providers={modelsState.providers}
            />
          </div>

          <div className={PREFIX + 'card'}>
            <h3 className={PREFIX + 'cardtitle'}>其他</h3>
            <label className={PREFIX + 'radio'}>
              <input type="checkbox" checked={draft.autoUpdate === true}
                onChange={(event) => set('autoUpdate', event.target.checked)} />
              <span>自动更新（autoUpdate）</span>
            </label>
            <label className={PREFIX + 'radio'}>
              <input type="checkbox" checked={draft.codebaseSurvey === true}
                onChange={(event) => set('codebaseSurvey', event.target.checked)} />
              <span>代码库勘察（codebaseSurvey）</span>
            </label>
          </div>

          <div className={PREFIX + 'actions'}>
            <button type="button" className={PREFIX + 'btn'} disabled={!dirty || saving} onClick={save}>
              {saving ? '保存中…' : '保存'}
            </button>
            <button type="button" className={PREFIX + 'btn'} disabled={!dirty || saving}
              onClick={() => {
                setDraft({ ...config.values })
                if (data?.gui) {
                  setCpDraft(data.gui.controlPlaneUrl)
                  setServerModelsDraft({ ...(data.gui.serverModels ?? {}) })
                }
              }}>放弃更改</button>
            {dirty && !saving && <span className={PREFIX + 'muted'}>有未保存的更改</span>}
            {notice && <span className={PREFIX + 'notice'}>{notice}</span>}
            {saveError && <span className={PREFIX + 'err'}>保存失败：{saveError}</span>}
          </div>
        </>
      )}

      {data && (
        <>
          <div className={PREFIX + 'card'}>
            <h3 className={PREFIX + 'cardtitle'}>服务状态</h3>
            <Row label="API">
              <Badge ok={api?.up === true}>{api?.up ? '运行中' : '未运行'}</Badge>
              <span className={PREFIX + 'muted'}> {api?.url}</span>
            </Row>
            {api?.up === true && (
              <Row label="数据库">
                <span className={PREFIX + 'mono'}>{api.database ?? '—'}</span>
                <span className={PREFIX + 'muted'}> · {api.status ?? '—'}</span>
              </Row>
            )}
            <Row label="控制台">
              <Badge ok={cp?.up === true}>{cp?.up ? '运行中' : '未运行'}</Badge>
              <span className={PREFIX + 'muted'}> {cp?.url}</span>
            </Row>
            <div className={PREFIX + 'actions'}>
              <a className={PREFIX + 'btn'} href={cp ? cp.url : '#'} target="_blank" rel="noreferrer noopener">
                打开 Control Plane
              </a>
              <button type="button" className={PREFIX + 'btn'} onClick={load}>刷新状态</button>
            </div>
          </div>

          <div className={PREFIX + 'card'}>
            <h3 className={PREFIX + 'cardtitle'}>记忆库 <span className={PREFIX + 'muted'}>({banks.length})</span></h3>
            {banks.length === 0
              ? <div className={PREFIX + 'muted'}>没有读到记忆库。</div>
              : (
                <ul className={PREFIX + 'list'}>
                  {banks.map((bank) => (
                    <li className={PREFIX + 'item'} key={bank.id}>
                      <span className={PREFIX + 'mono'}>{bank.id}</span>
                      <span className={PREFIX + 'count'}>{bank.facts} facts</span>
                    </li>
                  ))}
                </ul>
              )}
          </div>
        </>
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
