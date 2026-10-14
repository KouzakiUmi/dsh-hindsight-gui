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
import ManagementPanel from './ManagementPanel'
import { MANAGEMENT_URL, UPLOAD_URL, READ_OPERATIONS, DOWNLOAD_LIMIT } from '../../lib/management-contracts.js'

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
const TABS = [
  { id: 'overview', label: '概览' },
  { id: 'memory', label: '记忆与连接' },
  { id: 'models', label: '模型' },
  { id: 'security', label: '安全' },
  { id: 'advanced', label: '高级' },
]
const EMPTY_EMBEDDINGS = { provider: '', model: '', baseUrl: '', dimensions: null, apiKeyEnv: '', localForceCpu: null, secretConfigured: false }

/** Server model scopes, with the labels and hints shown on the page. */
const SERVER_SCOPES = [
  { key: 'default', label: '全局默认 LLM', hint: '未配置独立作用域时的回退模型；与反思推理分开。旧reflect-only配置兼容为此默认值，显式保存后脱钩。' },
  { key: 'reflect', label: '反思推理', hint: 'hindsight_reflect 记忆推理与问答。建议选用推理和长上下文能力强的模型。' },
  { key: 'retain', label: '事实提取', hint: '从会话中提取事实（Retain），Token 消耗量大。建议速度快、成本低且支持 JSON Schema 的模型。' },
  { key: 'consolidation', label: '记忆整理', hint: '后台聚合消歧与去重相似事实（Consolidation）。建议支持结构化输出的快速模型。' },
  { key: 'mentalModel', label: '知识提炼', hint: '刷新结构化知识库页面（Mental Model Refresh，如架构图、概念规范）。' },
]

/** Only loopback targets may be auto-started — never touch a remote deployment. */
function isLoopbackUrl(url) {
  if (typeof url !== 'string' || url === '') return false
  try {
    const host = new URL(url).hostname.toLowerCase()
    return host === 'localhost'
      || host === '::1'
      || host === '0:0:0:0:0:0:0:1'
      || /^127(?:\.\d{1,3}){3}$/.test(host)
  } catch {
    return false
  }
}

/**
 * The canonical simple redact rule this page manages. Richer policies (e.g. a
 * strong block rule with extra fields) are preserved server-side and must not
 * count as "enabled" for this toggle.
 */
function hasSimpleRedactRule(rules) {
  return Array.isArray(rules) && rules.some((rule) =>
    rule !== null && typeof rule === 'object'
    && rule.on === 'sensitive_data'
    && rule.action === 'redact'
    && Object.keys(rule).length === 2)
}

function defenseEnabled(payload) {
  if (!('memoryDefense' in payload)) throw new Error('防护策略响应缺少 memoryDefense，状态未知。')
  const policy = payload.memoryDefense
  if (policy !== null && (typeof policy !== 'object' || Array.isArray(policy) || !Array.isArray(policy.rules ?? []))) {
    throw new Error('防护策略响应格式无效，状态未知。')
  }
  return policy?.enabled === true && hasSimpleRedactRule(policy.rules)
}

// The always-visible migration notice below covers these warnings once; do not
// hide independent credential, dependency or configuration errors from Host.
function isMigrationWarning(warning) {
  return typeof warning === 'string'
    && /重建|迁移|重新索引|re-?index|rebuild|migrat/i.test(warning)
    && /向量|索引|维度|模型|vector|embedding|index|dimension|model/i.test(warning)
}

const CSS = [
  /* ---- shell: fluid, no fixed width ------------------------------------- */
  '.' + PREFIX + 'root{box-sizing:border-box;height:100%;min-height:0;overflow:auto;',
  'display:flex;flex-direction:column;gap:18px;padding:24px 24px 36px;width:100%;isolation:isolate;container:hindsight-settings / inline-size;',
  'color:var(--dsw-alias-label-primary,#1a1a1a);font:inherit;font-size:13px;line-height:21px;color-scheme:light;}',
  '.' + PREFIX + 'head{display:flex;flex-direction:column;gap:12px;}',
  '.' + PREFIX + 'h{margin:0;font-size:24px;line-height:32px;font-weight:650;letter-spacing:-.4px;}',
  '.' + PREFIX + 'sub{margin:0;color:var(--dsw-alias-label-tertiary,#8a8a8a);font-size:12.5px;}',
  /* ---- cards ------------------------------------------------------------ */
  '.' + PREFIX + 'card{border:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));',
  'border-radius:14px;padding:20px;display:flex;flex-direction:column;gap:16px;',
  'background:var(--dsw-alias-bg-layer-1,transparent);min-width:0;}',
  '.' + PREFIX + 'cardhead{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;}',
  '.' + PREFIX + 'cardtitle{margin:0;font-size:15px;line-height:24px;font-weight:650;}',
  /* ---- fields: two-column grid that collapses on narrow panels ---------- */
  '.' + PREFIX + 'field{display:grid;grid-template-columns:128px minmax(0,1fr);gap:6px 12px;align-items:start;}',
  '@media (max-width:680px){.' + PREFIX + 'field{grid-template-columns:minmax(0,1fr);}}',
  '.' + PREFIX + 'label{padding-top:5px;color:var(--dsw-alias-label-secondary,#555);}',
  '.' + PREFIX + 'control{min-width:0;display:flex;flex-direction:column;gap:6px;}',
  '.' + PREFIX + 'hint{color:var(--dsw-alias-label-tertiary,#8a8a8a);font-size:12px;}',
  /* ---- inputs ----------------------------------------------------------- */
  '.' + PREFIX + 'input,.' + PREFIX + 'select{box-sizing:border-box;width:100%;height:36px;padding:0 11px;',
  'border-radius:8px;border:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.18));',
  'background-color:var(--dsw-alias-bg-layer-1,var(--dsw-alias-bg-base,#fff));color:var(--dsw-alias-label-primary,inherit);',
  'font:inherit;font-size:13px;color-scheme:light dark;}',
  '.' + PREFIX + 'select option,.' + PREFIX + 'select optgroup{background-color:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#1a1a1a);}',
  '.' + PREFIX + 'input:focus,.' + PREFIX + 'select:focus{outline:2px solid var(--dsw-alias-brand-primary,#3b82f6);outline-offset:1px;}',
  '.' + PREFIX + 'check{display:flex;align-items:flex-start;gap:8px;cursor:pointer;}',
  '.' + PREFIX + 'check input{margin-top:3px;accent-color:var(--dsw-alias-brand-primary,#3b82f6);}',
  /* ---- buttons ---------------------------------------------------------- */
  '.' + PREFIX + 'btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:34px;padding:6px 14px;',
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
  '.' + PREFIX + 'errbanner{display:flex;align-items:flex-start;gap:10px;flex-wrap:wrap;padding:9px 12px;',
  'border-radius:9px;font-size:12.5px;border:.5px solid rgba(220,38,38,.35);background:rgba(220,38,38,.10);color:#b91c1c;}',
  '.' + PREFIX + 'errbanner>span{min-width:0;overflow-wrap:anywhere;flex:1 1 auto;}',
  '.' + PREFIX + 'list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;}',
  '.' + PREFIX + 'item{display:flex;align-items:center;flex-wrap:wrap;gap:10px;padding:12px 0;min-width:0;',
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
  '.' + PREFIX + 'tabs{position:sticky;top:0;z-index:2;display:flex;gap:4px;overflow-x:auto;flex:0 0 auto;',
  'border-bottom:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));background:var(--dsw-alias-bg-layer-1,var(--dsw-alias-bg-base,#fff));}',
  '.' + PREFIX + 'fold{min-width:0;}',
  '.' + PREFIX + 'fold>summary{cursor:pointer;font-size:13.5px;font-weight:650;}',
  '.' + PREFIX + 'foldbody{display:flex;flex-direction:column;gap:12px;margin-top:12px;}',
  '.' + PREFIX + 'tab{flex:0 0 auto;border:0;border-bottom:2px solid transparent;padding:9px 13px;background:transparent;color:var(--dsw-alias-label-secondary,#555);font:inherit;cursor:pointer;white-space:nowrap;}',
  '.' + PREFIX + 'tab[aria-selected="true"]{color:var(--dsw-alias-brand-primary,#3b82f6);border-bottom-color:currentColor;font-weight:650;}',
  '.' + PREFIX + 'tab:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#3b82f6);outline-offset:-2px;}',
  '.' + PREFIX + 'tabpanel{display:flex;flex-direction:column;gap:14px;min-width:0;}',
  '.' + PREFIX + 'tabpanel[hidden]{display:none;}',
  '.' + PREFIX + 'savebar{position:sticky;bottom:0;z-index:1;display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:10px 12px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:10px;background:var(--dsw-alias-bg-layer-1,var(--dsw-alias-bg-base,#fff));}',
  /* ---- hierarchy and panel-width responsiveness ------------------------- */
  '.' + PREFIX + 'headrow{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;}',
  '.' + PREFIX + 'brand{display:flex;align-items:center;gap:12px;min-width:0;}',
  '.' + PREFIX + 'mark{display:grid;place-items:center;width:42px;height:42px;flex:0 0 auto;border-radius:12px;color:var(--dsw-alias-brand-primary,#3b82f6);background:var(--dsw-alias-bg-layer-2,rgba(59,130,246,.08));}',
  '.' + PREFIX + 'eyebrow{font-size:11px;font-weight:650;letter-spacing:1px;color:var(--dsw-alias-label-tertiary,#666);}',
  '.' + PREFIX + 'intro{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;}',
  '.' + PREFIX + 'intro h3{margin:0;font-size:16px;line-height:25px;}',
  '.' + PREFIX + 'intro p{margin:3px 0 0;color:var(--dsw-alias-label-tertiary,#666);font-size:12px;}',
  '.' + PREFIX + 'badge{display:inline-flex;padding:2px 8px;border-radius:6px;font-size:11px;color:var(--dsw-alias-label-secondary,#555);background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.04));}',
  '.' + PREFIX + 'tabs{padding:4px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:11px;gap:4px;}',
  '.' + PREFIX + 'tab{border:0;border-radius:7px;padding:8px 14px;}',
  '.' + PREFIX + 'tab[aria-selected="true"]{background:var(--dsw-alias-bg-layer-2,rgba(59,130,246,.08));border:0;}',
  '.' + PREFIX + 'btn:focus-visible,.' + PREFIX + 'fold>summary:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#3b82f6);outline-offset:3px;}',
  '.' + PREFIX + 'row{display:grid;grid-template-columns:96px minmax(0,1fr);align-items:start;}',
  '.' + PREFIX + 'val{display:flex;align-items:baseline;gap:5px;flex-wrap:wrap;}',
  '.' + PREFIX + 'preview{padding:14px;border-radius:10px;background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.035));display:flex;flex-direction:column;gap:10px;min-width:0;}',
  '.' + PREFIX + 'pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}',
  '.' + PREFIX + 'bankmeta{display:flex;flex:1 1 160px;flex-direction:column;gap:3px;min-width:0;overflow-wrap:anywhere;}',
  '.' + PREFIX + 'banktitle{font-weight:600;}',
  '.' + PREFIX + 'bankerror{flex:1 1 100%;display:flex;align-items:center;gap:10px;flex-wrap:wrap;}',
  '.' + PREFIX + 'savebar{margin-top:auto;box-shadow:0 -4px 16px rgba(0,0,0,.04);}',
  '.' + PREFIX + 'savestate{flex:1 1 180px;font-size:12px;min-width:0;}',
  '@container hindsight-settings (max-width:620px){.' + PREFIX + 'field{grid-template-columns:minmax(0,1fr);gap:4px;}.' + PREFIX + 'pair{grid-template-columns:minmax(0,1fr);}.' + PREFIX + 'card{padding:15px;}.' + PREFIX + 'row{grid-template-columns:76px minmax(0,1fr);}.' + PREFIX + 'tab{padding:8px 10px;}.' + PREFIX + 'count{margin-left:0;}}',
  '@media(max-width:480px){.' + PREFIX + 'root{padding:16px 12px 24px;}.' + PREFIX + 'headrow{gap:10px;}.' + PREFIX + 'savebar{gap:8px;}.' + PREFIX + 'bankmeta{flex-basis:100%;}}',
  /* ---- dark theme -------------------------------------------------------- */
  'body[data-ds-dark-theme] .' + PREFIX + 'root{color-scheme:dark;}',
  'body[data-ds-dark-theme] .' + PREFIX + 'tabs{background:var(--dsw-alias-bg-layer-1,var(--dsw-alias-bg-base,#212123));border-color:var(--dsw-alias-border-l3,rgba(255,255,255,.12));}',
  'body[data-ds-dark-theme] .' + PREFIX + 'card{border-color:var(--dsw-alias-border-l3,rgba(255,255,255,.12));background-color:var(--dsw-alias-bg-layer-1,rgba(255,255,255,.02));}',
  'body[data-ds-dark-theme] .' + PREFIX + 'input,body[data-ds-dark-theme] .' + PREFIX + 'select{color-scheme:dark;background-color:var(--dsw-alias-bg-layer-2,#212123);color:var(--dsw-alias-label-primary,#f9fafb);border-color:var(--dsw-alias-border-l3,rgba(255,255,255,.18));}',
  'body[data-ds-dark-theme] .' + PREFIX + 'select option,body[data-ds-dark-theme] .' + PREFIX + 'select optgroup{background-color:var(--dsw-alias-bg-layer-2,#212123);color:var(--dsw-alias-label-primary,#f9fafb);}',
  'body[data-ds-dark-theme] .' + PREFIX + 'btn{border-color:var(--dsw-alias-border-l3,rgba(255,255,255,.14));background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06));}',
  'body[data-ds-dark-theme] .' + PREFIX + 'btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-active,rgba(255,255,255,.12));}',
  'body[data-ds-dark-theme] .' + PREFIX + 'item{border-bottom-color:var(--dsw-alias-border-l3,rgba(255,255,255,.07));}',
  'body[data-ds-dark-theme] .' + PREFIX + 'details{border-color:var(--dsw-alias-border-l3,rgba(255,255,255,.12));}',
  'body[data-ds-dark-theme] .' + PREFIX + 'ok{color:#4ade80;background:rgba(74,222,128,.10);border-color:rgba(74,222,128,.3);}',
  'body[data-ds-dark-theme] .' + PREFIX + 'bad{color:#fca5a5;background:rgba(248,113,113,.10);border-color:rgba(248,113,113,.3);}',
  'body[data-ds-dark-theme] .' + PREFIX + 'warn{color:#fbbf24;background:rgba(251,191,36,.10);border-color:rgba(251,191,36,.3);}',
  'body[data-ds-dark-theme] .' + PREFIX + 'banner{color:#fbbf24;background:rgba(251,191,36,.08);border-color:rgba(251,191,36,.3);}',
  'body[data-ds-dark-theme] .' + PREFIX + 'errbanner{color:#f87171;background:rgba(220,38,38,.14);border-color:rgba(220,38,38,.4);}',
  'body[data-ds-dark-theme] .' + PREFIX + 'err{color:#fca5a5;}',
  'body[data-ds-dark-theme] .' + PREFIX + 'good{color:#4ade80;}',
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
        set.add(`${p.id}/${m.id}`) // Bare ids have no matching option: keep them visible as custom input.
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
            aria-label={label}
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
            aria-label={`${label} 自定义模型`}
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

/** Bound both fetch and body parsing; abort/unmount must settle even if transport stalls. */
function requestJson(url, init, timeoutMs, requests, timeoutMessage = '请求超时或已取消，请刷新后确认最新状态。', responseMode = 'json') {
  const controller = new AbortController()
  requests.add(controller)
  const externalSignal = init?.signal
  const externalAbort = () => controller.abort()
  let timer
  const cancelled = new Promise((_, reject) => {
    controller.signal.addEventListener('abort', () => reject(new Error(timeoutMessage)), { once: true })
    timer = setTimeout(() => controller.abort(), timeoutMs)
  })
  externalSignal?.addEventListener('abort', externalAbort, { once: true })
  if (externalSignal?.aborted) controller.abort()
  const response = fetch(url, { ...init, signal: controller.signal }).then(async (res) => {
    if (responseMode === 'blob' && res.ok) {
      const declared = Number(res.headers?.get?.('content-length'))
      if (Number.isFinite(declared) && declared > DOWNLOAD_LIMIT) throw new Error('导出超过500MiB下载上限')
      const blob = await res.blob()
      if (blob.size > DOWNLOAD_LIMIT) throw new Error('导出超过500MiB下载上限')
      return blob
    }
    const payload = await res.json().catch(() => null)
    if (!res.ok) {
      const failure = new Error(payload?.error ?? `HTTP ${res.status}`)
      failure.status = res.status
      throw failure
    }
    if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('响应格式无效')
    return payload
  })
  return Promise.race([response, cancelled]).finally(() => {
    clearTimeout(timer)
    externalSignal?.removeEventListener('abort', externalAbort)
    requests.delete(controller)
  })
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
  // Override drafts never carry the stored key: `apiKey` holds only what the
  // user just typed (empty = keep the stored key), `clearApiKey` asks to wipe.
  const [overridesDraft, setOverridesDraft] = useState({})
  const [embeddingsDraft, setEmbeddingsDraft] = useState({ ...EMPTY_EMBEDDINGS, apiKey: '', clearApiKey: false })
  // Each provider owns its own unsubmitted form; switching must not carry an
  // OpenAI URL/model/dimensions into a different backend. Never cache a stored key.
  const embeddingsCacheRef = useRef({})
  const [activeTab, setActiveTab] = useState('overview')
  const [chatExpanded, setChatExpanded] = useState(true)
  const [overridesExpanded, setOverridesExpanded] = useState(false)
  const [serviceDetailsExpanded, setServiceDetailsExpanded] = useState(false)
  const [launchExpanded, setLaunchExpanded] = useState(false)
  const [bankSearch, setBankSearch] = useState('')
  const savingRef = useRef(false)
  const tabRefs = useRef({})
  // Model discovery carries its own state machine: ok / partial / error /
  // unavailable — an empty provider list is NOT success when state says error.
  const [modelsState, setModelsState] = useState({ loading: false, providers: [], errors: [], state: null, sampledAt: null, error: null })
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [serverBusy, setServerBusy] = useState(null) // 'start' | 'restart' | null
  const [serverMessage, setServerMessage] = useState(null)
  // Start/restart failures go here (prominent banner) instead of the plain
  // notice line, so a failed launch is something the user can act on.
  const [serverError, setServerError] = useState(null)
  const [defense, setDefense] = useState({})

  /**
   * CAS baseline: the snapshot of server state the current drafts were seeded
   * from. `dirty` compares against this (not the latest poll), so the 15s
   * refresh never disturbs an in-progress edit; a successful save and a manual
   * discard reset it explicitly. Also carries the SHA256 revisions the save
   * sends for optimistic-concurrency checking.
   */
  const baselineRef = useRef(null)
  /**
   * Bumped every time the baseline is re-snapshotted. The ref alone would not
   * retrigger the `dirty` memo (its deps are the drafts), leaving stale dirty
   * state after a save — this epoch is a real dep so dirty recomputes.
   */
  const [, setBaselineEpoch] = useState(0)
  /** Mirror of `dirty` so effects/handlers can read it without re-running per keystroke. */
  const dirtyRef = useRef(false)
  /** Mirror of `defense` so toggle handlers can restore the pre-click entry. */
  const defenseRef = useRef({})
  /** Last seen API base; when it changes the cached per-bank policies are stale. */
  const apiBaseRef = useRef(null)
  /** Bumped on API-base change; a defense response from an older base is dropped. */
  const defenseGenRef = useRef(0)
  /** Generation counters: a slow/late response must never overwrite a newer one. */
  const statusGenRef = useRef(0)
  const statusInFlightRef = useRef(null)
  const requestsRef = useRef(new Set())
  const managementRequest = useCallback((input, options = {}) => {
    const readOnly = READ_OPERATIONS.includes(input.op)
    const query = readOnly ? new URLSearchParams({ op: input.op, apiUrl: input.apiUrl, ...(input.bankId ? { bankId: input.bankId } : {}), params: JSON.stringify(input.params ?? {}) }) : null
    return requestJson(query ? `${MANAGEMENT_URL}?${query}` : MANAGEMENT_URL, {
      method: readOnly ? 'GET' : 'POST', signal: options.signal,
      headers: { accept: 'application/json', ...(readOnly ? {} : { 'content-type': 'application/json' }) },
      ...(readOnly ? {} : { body: JSON.stringify(input) }),
    }, options.timeoutMs ?? 30000, requestsRef.current, '管理请求等待结束，结果可能未知；请重读，不自动重复操作。')
  }, [])
  const managementUpload = useCallback((input, file, options = {}) => requestJson(UPLOAD_URL, {
    method: 'POST', signal: options.signal,
    headers: { accept: 'application/json', 'content-type': 'application/zip', 'x-hindsight-transfer': encodeURIComponent(JSON.stringify(input)) },
    body: file,
  }, options.timeoutMs ?? 120000, requestsRef.current, '导入等待结束，提交结果可能未知；请查询任务，不重复导入。'), [])
  const managementDownload = useCallback(async (input, options = {}) => {
    const blob = await requestJson(MANAGEMENT_URL, { method: 'POST', signal: options.signal,
      headers: { accept: 'application/zip', 'content-type': 'application/json' }, body: JSON.stringify(input),
    }, options.timeoutMs ?? 180000, requestsRef.current, '下载等待结束或已取消。', 'blob')
    if (options.signal?.aborted) throw new Error('下载已取消')
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    try { anchor.href = url; anchor.download = 'hindsight-bank.zip'; document.body.appendChild(anchor); anchor.click() }
    finally { anchor.remove(); URL.revokeObjectURL(url) }
  }, [])
  const modelsGenRef = useRef(0)
  /** Flipped on unmount; every async continuation bails out afterwards. */
  const mountedRef = useRef(true)

  /** Cooldown ref so a down API with auto-start on does not spawn-storm. */
  const autoStartCooldownRef = useRef(0)
  /** Consecutive auto-start failures; past AUTO_START_MAX_FAILURES the page stops retrying on its own. */
  const autoStartFailuresRef = useRef(0)
  const AUTO_START_MAX_FAILURES = 2

  const load = useCallback(() => {
    const generation = ++statusGenRef.current
    statusInFlightRef.current = generation
    setStatus((previous) => ({ ...previous, loading: true, error: null }))
    requestJson(STATUS_URL, { headers: { accept: 'application/json' } }, 30000, requestsRef.current)
      .then((data) => {
        if (!mountedRef.current || generation !== statusGenRef.current) return
        if (!data?.config?.values || !data?.gui || !data?.api) throw new Error('状态响应格式无效，请重试。')
        setStatus({ loading: false, data, error: null })
      })
      .catch((error) => {
        if (!mountedRef.current || generation !== statusGenRef.current) return
        setStatus((previous) => ({ loading: false, data: previous.data, error: String(error?.message ?? error) }))
      })
      .finally(() => { if (statusInFlightRef.current === generation) statusInFlightRef.current = null })
  }, [])

  const loadModels = useCallback(() => {
    const generation = ++modelsGenRef.current
    setModelsState((prev) => ({ ...prev, loading: true, error: null }))
    requestJson(MODELS_URL, { headers: { accept: 'application/json' } }, 30000, requestsRef.current)
      .then((data) => {
        if (!mountedRef.current || generation !== modelsGenRef.current) return
        if (!Array.isArray(data?.providers)) throw new Error('模型响应缺少 Provider 列表，无法确认发现结果。')
        setModelsState({
          loading: false,
          providers: data.providers,
          errors: Array.isArray(data?.errors) ? data.errors : [],
          // Older hosts answer with bare `{ providers }` — that is a real list.
          state: typeof data?.state === 'string' ? data.state : 'ok',
          sampledAt: typeof data?.sampledAt === 'string' ? data.sampledAt : null,
          error: null,
        })
      })
      .catch((err) => {
        if (!mountedRef.current || generation !== modelsGenRef.current) return
        setModelsState({ loading: false, providers: [], errors: [], state: 'error', sampledAt: null, error: String(err?.message ?? err) })
      })
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadModels() }, [loadModels])

  /** Unmount guard: async continuations check this before touching any state. */
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      for (const controller of requestsRef.current) controller.abort()
    }
  }, [])

  /** Poll status while the page is open and visible. */
  useEffect(() => {
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
      // A slow status query must finish instead of being superseded every 15s.
      if (statusInFlightRef.current !== null) return
      load()
    }, 15000)
    return () => clearInterval(timer)
  }, [load])

  /**
   * Normalise a providerOverrides entry to the draft shape. The stored key is
   * never kept: the host contract only returns `secretConfigured`, and in a
   * draft a non-empty `apiKey` means "replace" while empty means "keep".
   */
  const toOverrideDraft = useCallback((entry) => ({
    baseUrl: typeof entry?.baseUrl === 'string' ? entry.baseUrl : '',
    apiKeyEnv: typeof entry?.apiKeyEnv === 'string' ? entry.apiKeyEnv : '',
    apiKey: '',
    clearApiKey: false,
    // Display-only mirror of the host flag; it is never sent back.
    secretConfigured: entry?.secretConfigured === true,
  }), [])

  const toEmbeddingsDraft = useCallback((entry) => ({
    provider: entry?.provider ?? '',
    model: entry?.model ?? '',
    baseUrl: entry?.baseUrl ?? '',
    dimensions: entry?.dimensions ?? null,
    apiKeyEnv: entry?.apiKeyEnv ?? '',
    localForceCpu: entry?.localForceCpu ?? null,
    secretConfigured: entry?.secretConfigured === true,
    apiKey: '',
    clearApiKey: false,
  }), [])

  /** Snapshot the server state the drafts were seeded from (the CAS baseline). */
  const snapshotBaseline = useCallback((data) => {
    const overrides = {}
    const saved = data?.gui?.providerOverrides
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      for (const [id, entry] of Object.entries(saved)) overrides[id] = toOverrideDraft(entry)
    }
    baselineRef.current = {
      configValues: { ...(data?.config?.values ?? {}) },
      controlPlaneUrl: data?.gui?.controlPlaneUrl ?? '',
      serverModels: { ...(data?.gui?.serverModels ?? {}) },
      auditLogEnabled: data?.gui?.auditLogEnabled ?? null,
      autoStart: data?.gui?.autoStart === true,
      serverCommand: data?.gui?.serverCommand ?? '',
      providerOverrides: overrides,
      serverEmbeddings: toEmbeddingsDraft(data?.gui?.serverEmbeddings ?? EMPTY_EMBEDDINGS),
      configRevision: data?.config?.revision ?? null,
      guiRevision: data?.gui?.revision ?? null,
    }
    setBaselineEpoch((epoch) => epoch + 1)
  }, [toOverrideDraft, toEmbeddingsDraft])

  /** Reset every draft from a status document. */
  const resetDrafts = useCallback((data) => {
    const overrides = {}
    const saved = data?.gui?.providerOverrides
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      for (const [id, entry] of Object.entries(saved)) overrides[id] = toOverrideDraft(entry)
    }
    setDraft({ ...(data?.config?.values ?? {}) })
    setCpDraft(data?.gui?.controlPlaneUrl ?? '')
    setServerModelsDraft({ ...(data?.gui?.serverModels ?? {}) })
    setAuditDraft(data?.gui?.auditLogEnabled ?? null)
    setAutoStartDraft(data?.gui?.autoStart === true)
    setServerCommandDraft(data?.gui?.serverCommand ?? '')
    setOverridesDraft(overrides)
    const embedding = toEmbeddingsDraft(data?.gui?.serverEmbeddings ?? EMPTY_EMBEDDINGS)
    embeddingsCacheRef.current = { [embedding.provider]: embedding }
    setEmbeddingsDraft(embedding)
  }, [toOverrideDraft, toEmbeddingsDraft])

  const inactiveEmbeddingsDirty = (() => {
    const base = baselineRef.current?.serverEmbeddings
    if (!base) return false
    return Object.entries(embeddingsCacheRef.current).some(([provider, entry]) => {
      if (provider === embeddingsDraft.provider) return false
      const original = provider === base.provider ? base : toEmbeddingsDraft({ provider })
      const fields = provider === 'openai' ? ['model', 'baseUrl', 'dimensions', 'apiKeyEnv']
        : provider === 'onnx' ? ['model', 'dimensions']
          : provider === 'local' ? ['model', 'localForceCpu']
            : provider === 'tei' ? ['baseUrl'] : []
      return fields.some((field) => String(entry[field] ?? '') !== String(original[field] ?? ''))
        || (provider === 'openai' && (entry.apiKey !== '' || (entry.clearApiKey && base.secretConfigured)))
    })
  })()

  const dirty = (() => {
    const base = baselineRef.current
    if (!draft || !base) return false
    if (cpDraft !== null && cpDraft !== base.controlPlaneUrl) return true
    const allKeys = new Set([...Object.keys(serverModelsDraft), ...Object.keys(base.serverModels)])
    for (const key of allKeys) {
      if ((serverModelsDraft[key] ?? '') !== (base.serverModels[key] ?? '')) return true
    }
    if ((auditDraft ?? null) !== base.auditLogEnabled) return true
    if (autoStartDraft !== base.autoStart) return true
    if ((serverCommandDraft ?? '') !== base.serverCommand) return true
    const emb = base.serverEmbeddings
    if (embeddingsDraft.provider !== emb.provider) return true
    const activeFields = embeddingsDraft.provider === 'openai' ? ['model', 'baseUrl', 'dimensions', 'apiKeyEnv']
      : embeddingsDraft.provider === 'onnx' ? ['model', 'dimensions']
        : embeddingsDraft.provider === 'local' ? ['model', 'localForceCpu']
          : embeddingsDraft.provider === 'tei' ? ['baseUrl'] : []
    for (const field of activeFields) {
      if (String(embeddingsDraft[field] ?? '') !== String(emb[field] ?? '')) return true
    }
    if (embeddingsDraft.provider === 'openai') {
      if (embeddingsDraft.apiKey !== '') return true
      if (embeddingsDraft.clearApiKey && emb.secretConfigured) return true
    }
    if (inactiveEmbeddingsDirty) return true
    const overrideKeys = new Set([...Object.keys(overridesDraft), ...Object.keys(base.providerOverrides)])
    for (const key of overrideKeys) {
      const a = overridesDraft[key] ?? {}
      const b = base.providerOverrides[key] ?? {}
      if ((a.baseUrl ?? '') !== (b.baseUrl ?? '')) return true
      if ((a.apiKeyEnv ?? '') !== (b.apiKeyEnv ?? '')) return true
      if ((a.apiKey ?? '') !== '') return true
      if (a.clearApiKey === true && b.secretConfigured === true) return true
    }
    return Object.keys(draft).some((key) => draft[key] !== base.configValues[key])
  })()

  /** Keep the dirty flag and a live-draft mirror in refs for async continuations. */
  const liveRef = useRef(null)
  useEffect(() => {
    dirtyRef.current = dirty
    liveRef.current = { draft, cpDraft, serverModelsDraft, auditDraft, autoStartDraft, serverCommandDraft, overridesDraft, embeddingsDraft }
  })

  /**
   * Seed drafts from the loaded values — but never over unsaved edits: the 15s
   * poll refreshes the displayed status while a dirty draft stays untouched.
   */
  useEffect(() => {
    const data = status.data
    if (!data) return
    if (baselineRef.current !== null && dirtyRef.current) return
    snapshotBaseline(data)
    resetDrafts(data)
  }, [status.data, snapshotBaseline, resetDrafts])

  /** The API target changed (edited & saved elsewhere): cached bank policies belong to the old server. */
  const apiBase = status.data?.api?.url ?? null
  useEffect(() => {
    if (apiBaseRef.current === apiBase) return
    apiBaseRef.current = apiBase
    defenseGenRef.current += 1
    setDefense({})
  }, [apiBase])

  /** Mirror `defense` for event handlers. */
  useEffect(() => { defenseRef.current = defense }, [defense])

  /** Initial reads and explicit read-only retry share the same target/generation fence. */
  const readDefense = useCallback((bankId) => {
    const generation = defenseGenRef.current
    const base = apiBaseRef.current
    setDefense((prev) => ({ ...prev, [bankId]: { ...prev[bankId], loading: true, unknown: true, error: null } }))
    const query = `bank=${encodeURIComponent(bankId)}${base ? `&apiUrl=${encodeURIComponent(base)}` : ''}`
    requestJson(`${BANKDEFENSE_URL}?${query}`, { headers: { accept: 'application/json' } }, 15000, requestsRef.current)
      .then((payload) => {
        if (!mountedRef.current || generation !== defenseGenRef.current) return
        const enabled = defenseEnabled(payload)
        setDefense((prev) => ({ ...prev, [bankId]: { loading: false, unknown: false, enabled, action: null, error: null } }))
      })
      .catch((error) => {
        if (!mountedRef.current || generation !== defenseGenRef.current) return
        setDefense((prev) => ({ ...prev, [bankId]: { ...prev[bankId], loading: false, unknown: true, error: String(error?.message ?? error) } }))
      })
  }, [])
  const banks = status.data && Array.isArray(status.data.banks) ? status.data.banks : []
  useEffect(() => {
    for (const bank of banks) if (defense[bank.id] === undefined) readDefense(bank.id)
  }, [banks.map((b) => b.id).join('|'), defense, readDefense])

  /**
   * Auto-start: when the option is on and nothing listens on the port, ask the
   * host to launch it. Never fire when the status request itself failed or the
   * API state is 'unknown' — a blind launch would hide the real problem; a
   * failed health probe alone is fine as long as the host confirmed the port
   * is free (ownership 'stopped' + canStart). Rate-limited so a failing start
   * cannot spawn-storm.
   */
  useEffect(() => {
    const data = status.data
    const gui = data?.gui
    const api = data?.api
    const srv = data?.server
    if (!data || status.loading || status.error !== null) return
    if (api?.up === true) autoStartFailuresRef.current = 0 // Service confirmed up: allow fresh retries.
    if (api?.state === 'unknown') return
    if (gui?.autoStart !== true) return
    if (!isLoopbackUrl(api?.url)) return
    if (serverBusy !== null) return
    if (srv && srv.ownership !== undefined) {
      // New contract: only the host's verdict (port free + allowed + idle).
      if (srv.ownership !== 'stopped' || srv.canStart !== true || srv.operation != null) return
    } else if (api?.up !== false) {
      return // Legacy host: keep the old behaviour (only when the API is down).
    }
    if (autoStartFailuresRef.current >= AUTO_START_MAX_FAILURES) return // Wait for the user, not another loop.
    if (Date.now() < autoStartCooldownRef.current) return
    autoStartCooldownRef.current = Date.now() + 45000
    setServerBusy('start')
    requestJson(SERVER_START_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: '{}',
    }, 180000, requestsRef.current, '请求超时或已取消；服务可能仍在启动，请刷新状态确认，勿重复启动。')
      .then((payload) => {
        if (!mountedRef.current) return
        autoStartFailuresRef.current = 0
        statusGenRef.current += 1
        if (!payload?.status?.config?.values || !payload?.status?.gui || !payload?.status?.api) throw new Error('服务响应格式无效：启动结果尚未确认，请刷新状态。')
        setStatus({ loading: false, data: payload.status, error: null })
        setServerError(null)
        setServerMessage(payload.alreadyRunning === true ? '服务已在运行。' : '已自动启动 Hindsight 服务。')
      })
      .catch((error) => {
        if (!mountedRef.current) return
        autoStartFailuresRef.current += 1
        const stopped = autoStartFailuresRef.current >= AUTO_START_MAX_FAILURES
        setServerError(
          '自动启动失败：' + String(error?.message ?? error)
          + (stopped ? ' 已停止自动重试，请处理问题后手动启动。' : ' 稍后将自动重试。'),
        )
        load()
      })
      .finally(() => { if (mountedRef.current) setServerBusy(null) })
  }, [status.data, status.error, status.loading, serverBusy, load])

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
    setOverridesDraft((prev) => {
      const current = { ...(prev[provider] ?? { baseUrl: '', apiKeyEnv: '', apiKey: '', clearApiKey: false }) }
      if (field === 'apiKey') {
        // Typing a fresh key cancels a pending clear and means "replace".
        current.apiKey = value
        if (value !== '') current.clearApiKey = false
      } else if (field === 'clearApiKey') {
        current.clearApiKey = value === true
        if (value === true) current.apiKey = ''
      } else {
        current[field] = value
      }
      return { ...prev, [provider]: current }
    })
    setNotice(null)
    setSaveError(null)
  }, [])

  const setEmbeddings = useCallback((field, value) => {
    if (field === 'provider') {
      if (value === embeddingsDraft.provider) return
      const cache = { ...embeddingsCacheRef.current, [embeddingsDraft.provider]: embeddingsDraft }
      const saved = baselineRef.current?.serverEmbeddings
      const next = cache[value] ?? toEmbeddingsDraft(
        saved?.provider === value ? saved : { provider: value, secretConfigured: saved?.secretConfigured === true },
      )
      embeddingsCacheRef.current = cache
      setEmbeddingsDraft(next)
    } else {
      setEmbeddingsDraft((prev) => ({
        ...prev, [field]: value,
        ...(field === 'apiKey' && value !== '' ? { clearApiKey: false } : {}),
        ...(field === 'clearApiKey' && value === true ? { apiKey: '' } : {}),
      }))
    }
    setNotice(null)
    setSaveError(null)
  }, [embeddingsDraft, toEmbeddingsDraft])

  const save = useCallback(() => {
    if (!draft || savingRef.current) return Promise.resolve(false)
    const base = baselineRef.current
    // Snapshot of exactly what is being submitted, so the response can tell
    // "no edits during flight" apart from "new edits arrived mid-flight".
    const submitted = { ...liveRef.current, embeddingsCache: embeddingsCacheRef.current }
    setSaving(true)
    setNotice(null)
    setSaveError(null)
    // Submit intent, not the display projection: omitted/inherited/masked values stay untouched.
    const payloadBody = {}
    for (const [key, value] of Object.entries(draft)) {
      if (value !== base?.configValues?.[key]) payloadBody[key] = value
    }
    if (cpDraft !== null && cpDraft !== base?.controlPlaneUrl) payloadBody.controlPlaneUrl = cpDraft
    if (JSON.stringify(serverModelsDraft) !== JSON.stringify(base?.serverModels ?? {})) payloadBody.serverModels = serverModelsDraft
    // Omit unchanged inheritance. Send null only when explicitly returning
    // from an on/off override to the inherited launch environment.
    if (auditDraft !== base?.auditLogEnabled) payloadBody.auditLogEnabled = auditDraft
    if (autoStartDraft !== base?.autoStart) payloadBody.autoStart = autoStartDraft
    if (serverCommandDraft !== base?.serverCommand) payloadBody.serverCommand = serverCommandDraft
    // Per-entry key semantics from the host contract: an omitted or empty
    // apiKey keeps the stored key, a non-empty one replaces it, and
    // clearApiKey:true wipes it. `secretConfigured` is display-only and never
    // sent back.
    const overridesPayload = {}
    for (const [provider, entry] of Object.entries(overridesDraft)) {
      const original = base?.providerOverrides?.[provider] ?? {}
      const normalized = {}
      if ((entry.baseUrl ?? '') !== (original.baseUrl ?? '')) normalized.baseUrl = entry.baseUrl ?? ''
      if ((entry.apiKeyEnv ?? '') !== (original.apiKeyEnv ?? '')) normalized.apiKeyEnv = entry.apiKeyEnv ?? ''
      if (entry.clearApiKey === true) normalized.clearApiKey = true
      else if ((entry.apiKey ?? '') !== '') normalized.apiKey = entry.apiKey
      if (Object.keys(normalized).length) overridesPayload[provider] = normalized
    }
    if (Object.keys(overridesPayload).length) payloadBody.providerOverrides = overridesPayload
    const embBase = base?.serverEmbeddings ?? EMPTY_EMBEDDINGS
    const embFields = embeddingsDraft.provider === 'openai' ? ['model', 'baseUrl', 'dimensions', 'apiKeyEnv']
      : embeddingsDraft.provider === 'onnx' ? ['model', 'dimensions']
        : embeddingsDraft.provider === 'local' ? ['model', 'localForceCpu']
          : embeddingsDraft.provider === 'tei' ? ['baseUrl'] : []
    const embChanged = embeddingsDraft.provider !== embBase.provider
      || embFields.some((field) => String(embeddingsDraft[field] ?? '') !== String(embBase[field] ?? ''))
      || (embeddingsDraft.provider === 'openai'
        && (embeddingsDraft.apiKey !== '' || (embeddingsDraft.clearApiKey && embBase.secretConfigured)))
    if (inactiveEmbeddingsDirty && !embChanged) {
      setSaving(false)
      setSaveError('其它向量 Provider 有未提交的草稿，请切回对应 Provider 保存，或放弃更改。')
      return Promise.resolve(false)
    }
    if (embChanged) {
      const dimensions = embeddingsDraft.dimensions
      if (embFields.includes('dimensions') && dimensions !== null && dimensions !== ''
        && (!Number.isSafeInteger(Number(dimensions)) || Number(dimensions) <= 0)) {
        setSaving(false)
        setSaveError('向量维度必须是正整数或留空。')
        return Promise.resolve(false)
      }
      const settings = { provider: embeddingsDraft.provider }
      for (const field of embFields) settings[field] = field === 'dimensions'
        ? (dimensions === null || dimensions === '' ? null : Number(dimensions)) : embeddingsDraft[field]
      if (embeddingsDraft.provider === 'openai') {
        if (embeddingsDraft.clearApiKey) settings.clearApiKey = true
        else if (embeddingsDraft.apiKey !== '') settings.apiKey = embeddingsDraft.apiKey
      }
      payloadBody.serverEmbeddings = settings
    }
    // Optimistic concurrency: the host compares these SHA256 revisions against
    // its stored state and rejects with 409 when the file changed underneath.
    payloadBody.configRevision = base?.configRevision ?? null
    payloadBody.guiRevision = base?.guiRevision ?? null
    savingRef.current = true
    return requestJson(CONFIG_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(payloadBody),
    }, 30000, requestsRef.current, '保存请求超时或已取消：结果尚未确认，更改已保留。请刷新核对，勿直接重复提交。')
      .then((payload) => {
        if (!mountedRef.current) return false
        if (!payload?.config?.values || !payload?.gui || !payload?.api) throw new Error('配置响应格式无效：保存结果尚未确认，请刷新核对。')
        setSaving(false)
        // An in-flight status poll started before the save must not overwrite
        // the save result when it arrives late.
        statusGenRef.current += 1
        setStatus({ loading: false, data: payload, error: null })
        // Explicit baseline reset: what the server just stored is the new
        // reference point; the epoch bump retriggers `dirty` against it.
        snapshotBaseline(payload)
        const live = liveRef.current ?? {}
        const unchanged = live.draft === submitted.draft
          && live.cpDraft === submitted.cpDraft
          && live.serverModelsDraft === submitted.serverModelsDraft
          && live.auditDraft === submitted.auditDraft
          && live.autoStartDraft === submitted.autoStartDraft
          && live.serverCommandDraft === submitted.serverCommandDraft
          && live.overridesDraft === submitted.overridesDraft
          && live.embeddingsDraft === submitted.embeddingsDraft
          && embeddingsCacheRef.current === submitted.embeddingsCache
        let result
        if (unchanged) {
          // Nothing typed while saving: reset every draft from the saved state.
          const inactive = Object.fromEntries(Object.entries(submitted.embeddingsCache ?? {}).filter(([provider]) => provider !== submitted.embeddingsDraft?.provider))
          resetDrafts(payload)
          // A single-backend save cannot submit other providers; keep their drafts explicitly.
          if (inactiveEmbeddingsDirty) embeddingsCacheRef.current = { ...inactive, ...embeddingsCacheRef.current }
          result = inactiveEmbeddingsDirty ? 'edited' : 'clean'
        } else {
          // New input arrived mid-flight: keep it, but retire the submitted key
          // material — an override entry untouched since submit gets a fresh
          // draft (empty apiKey / no clear flag) built from the saved state.
          setOverridesDraft((prev) => {
            const next = {}
            const saved = payload?.gui?.providerOverrides
            for (const [id, entry] of Object.entries(prev)) {
              next[id] = entry === submitted.overridesDraft?.[id] ? toOverrideDraft(saved?.[id]) : entry
            }
            return next
          })
          const savedEmbedding = toEmbeddingsDraft(payload?.gui?.serverEmbeddings ?? EMPTY_EMBEDDINGS)
          const submittedProvider = submitted.embeddingsDraft?.provider
          const cache = { ...embeddingsCacheRef.current }
          if (cache[submittedProvider] === submitted.embeddingsDraft) {
            // A provider switch put the submitted draft (possibly containing a
            // fresh Key) in the cache. Retire only that exact snapshot; newer
            // input for the same provider must survive the in-flight save.
            cache[submittedProvider] = savedEmbedding.provider === submittedProvider
              ? savedEmbedding
              : toEmbeddingsDraft({ provider: submittedProvider, secretConfigured: savedEmbedding.secretConfigured })
          }
          embeddingsCacheRef.current = cache
          setEmbeddingsDraft((prev) => prev === submitted.embeddingsDraft ? savedEmbedding : prev)
          result = 'edited'
        }
        const saved = Array.isArray(payload?.saved) ? payload.saved.join('、') : ''
        const serverSide = payload?.server?.pendingRestart === true
        setNotice(saved === ''
          ? '已保存。'
          : `已保存（${saved}）。${serverSide ? '服务设置需重启受控API；这不会重置DSH记忆适配器。' : '运行是否应用未确认；已有工作区可能需要重启DSH。'}${inactiveEmbeddingsDirty ? '其它向量Provider草稿已保留，尚未提交。' : ''}`)
        return result
      })
      .catch((error) => {
        if (!mountedRef.current) return false
        setSaving(false)
        if (error?.status === 409) {
          // Conflict: the drafts stay untouched, and so does the OLD baseline
          // (its revision no longer matches the server, so a blind retry keeps
          // failing) — reloading the baseline requires an explicit discard.
          setSaveError('保存被拒绝：配置已在其它地方修改（409 冲突）。您的更改已全部保留。注意：本地基线仍是旧版本，直接重试会继续冲突——请先「放弃更改」载入最新基线（当前编辑将被丢弃），之后再重新编辑保存。')
        } else {
          setSaveError(String(error?.message ?? error))
        }
        return false
      })
      .finally(() => { savingRef.current = false; if (mountedRef.current) setSaving(false) })
  }, [draft, cpDraft, serverModelsDraft, auditDraft, autoStartDraft, serverCommandDraft, overridesDraft, embeddingsDraft, inactiveEmbeddingsDirty, snapshotBaseline, resetDrafts, toOverrideDraft, toEmbeddingsDraft])

  const discard = useCallback(() => {
    const data = status.data
    if (!data) return
    // Manual discard resets both drafts and baseline to the last server state.
    snapshotBaseline(data)
    resetDrafts(data)
    setNotice(null)
    setSaveError(null)
  }, [status.data, snapshotBaseline, resetDrafts])

  const serverAction = useCallback((action) => {
    if (status.loading || status.error !== null || serverBusy !== null || savingRef.current) return
    const run = () => {
      setServerBusy(action)
      setServerMessage(null)
      setServerError(null)
      requestJson(action === 'restart' ? SERVER_RESTART_URL : SERVER_START_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: '{}',
      }, 180000, requestsRef.current, '请求超时或已取消；服务可能仍在启动，请刷新状态确认，勿重复启动。')
        .then((payload) => {
          if (!mountedRef.current) return
          autoStartFailuresRef.current = 0
          statusGenRef.current += 1
          if (!payload?.status?.config?.values || !payload?.status?.gui || !payload?.status?.api) throw new Error('服务响应格式无效：启动结果尚未确认，请刷新状态。')
        setStatus({ loading: false, data: payload.status, error: null })
          setServerMessage(action === 'restart' ? '已按当前设置重启服务。' : (payload.alreadyRunning === true ? '服务已在运行。' : '服务已启动。'))
        })
        .catch((error) => {
          if (!mountedRef.current) return
          setServerError((action === 'restart' ? '重启失败：' : '启动失败：') + String(error?.message ?? error))
          load()
        })
        .finally(() => { if (mountedRef.current) setServerBusy(null) })
    }
    // Acting with unsaved edits would silently launch the OLD configuration:
    // persist the draft first, then run against what was actually saved.
    if (dirtyRef.current) {
      setServerMessage('检测到未保存的更改，正在先保存…')
      save().then((result) => {
        if (!mountedRef.current) return
        if (result === 'clean') run()
        else if (result === 'edited') setServerError('操作未执行：保存期间又出现了新的未保存更改，请确认保存或放弃后再执行。')
        else setServerError('操作未执行：请先解决保存失败的问题。')
      })
      return
    }
    run()
  }, [load, save, serverBusy, status.loading, status.error])

  const toggleDefense = useCallback((bankId, enabled) => {
    const previous = defenseRef.current[bankId] ?? null
    const generation = defenseGenRef.current
    setDefense((prev) => ({ ...prev, [bankId]: { ...(prev[bankId] ?? { unknown: false, enabled: !enabled }), loading: true, error: null } }))
    // No `action` in the body: the host reads the current policy server-side
    // and only flips this bank's own sensitive_data rule, keeping other rules.
    // `apiUrl` is the CAS anchor: the host rejects with 409 if the configured
    // API moved between page load and this click.
    requestJson(BANKDEFENSE_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ bankId, enabled, apiUrl: apiBaseRef.current ?? '' }),
    }, 30000, requestsRef.current, '脱敏写入超时或已取消：结果尚未确认，请重读策略后再操作。')
      .then((payload) => {
        if (!mountedRef.current || generation !== defenseGenRef.current) return
        const confirmedEnabled = defenseEnabled(payload)
        setDefense((prev) => ({
          ...prev,
          [bankId]: {
            loading: false,
            unknown: false,
            enabled: confirmedEnabled,
            action: null,
            error: null,
          },
        }))
      })
      .catch((error) => {
        if (!mountedRef.current || generation !== defenseGenRef.current) return
        const message = String(error?.message ?? error)
        const uncertain = error.status === undefined || error.status >= 500
        // A rejected write restores the confirmed state; transport/confirmation
        // failure must be re-read because the server may already have applied it.
        setDefense((prev) => ({
          ...prev,
          [bankId]: previous
            ? { ...previous, loading: false, unknown: previous.unknown === true || uncertain, error: message }
            : { loading: false, unknown: true, enabled: false, action: null, error: message },
        }))
      })
  }, [])

  const data = status.data
  const api = data ? data.api : null
  const cp = data ? data.controlPlane : null
  const config = data ? data.config : null
  const server = data ? data.server : null
  const extraKeys = config && Array.isArray(config.extraKeys) ? config.extraKeys : []
  const recordMode = draft && (draft.dynamicBankId === true) ? 'dynamic' : 'fixed'
  // Service-action gating per the host contract. Hosts predating it have no
  // `ownership`/`can*` fields — for them keep the old permissive behaviour.
  const ownership = server ? server.ownership : undefined
  const legacyHost = server !== null && ownership === undefined
  const canStartNow = !status.loading && status.error === null && (legacyHost ? api?.up !== true : server?.canStart === true)
  // A restart kills whatever listens on the port; without the host's ownership
  // verdict (legacy host) that could be someone else's process — default deny.
  const canRestartNow = !status.loading && status.error === null && !legacyHost && server?.canRestart === true
  const operationInFlight = saving || serverBusy !== null || (server !== null && server.operation != null)

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

  const embeddingPreview = server?.embeddingPreview
  const runningEmbedding = server?.runningConfig?.embeddingPreview
  const visibleBanks = banks.filter((bank) => `${bank.id} ${bank.name ?? ''}`.toLowerCase().includes(bankSearch.trim().toLowerCase()))
  const dirtyFor = (tab) => {
    const base = baselineRef.current
    if (!dirty || !base || !draft) return false
    const changed = (keys) => keys.some((key) => draft[key] !== base.configValues[key])
    if (tab === 'overview') return autoStartDraft !== base.autoStart || serverCommandDraft !== base.serverCommand
    if (tab === 'memory') return changed(['disabled', 'apiUrl', 'logLevel', 'bankId', 'dynamicBankId']) || cpDraft !== base.controlPlaneUrl
    if (tab === 'security') return auditDraft !== base.auditLogEnabled
    if (tab === 'advanced') return changed(['autoUpdate', 'codebaseSurvey'])
    return changed(['surveyModel']) || JSON.stringify(serverModelsDraft) !== JSON.stringify(base.serverModels)
      || JSON.stringify(overridesDraft) !== JSON.stringify(base.providerOverrides)
      || JSON.stringify(embeddingsDraft) !== JSON.stringify(base.serverEmbeddings) || inactiveEmbeddingsDirty
  }
  const tabDescription = {
    overview: '查看连接与服务归属；仅在满足身份核验条件时启动或重启。',
    memory: '管理记忆开关、记忆库命名与连接地址。',
    models: '区分 DSH 功能模型与 Hindsight 向量后端，保存后按生效时机应用。',
    security: '审计设置在服务重启后应用；记忆库脱敏开关即时写入。',
    advanced: '调整插件选项，查看本页不会改写的其它配置键。',
  }
  const apiLabel = !api || status.error !== null || api.state === 'unknown' ? '状态未知' : api.up ? '运行中' : '未运行'
  const restartReason = status.loading ? '正在刷新状态，请等待核验完成后再操作。'
    : status.error !== null ? '状态读取失败：请先刷新核对，不使用旧状态授权操作。'
    : operationInFlight ? '服务操作正在执行，请等待完成后再操作。'
      : saving ? '配置正在保存，请等待保存完成。'
        : ownership === 'managed' ? '启动预检未通过，请检查配置错误和凭据解析提示。'
          : ownership === 'unmanaged' ? '端口由外部进程占用：本插件无法重启它，只能等待其退出后再启动托管实例。'
            : ownership === 'stopped' ? '服务未运行：重启不可用，请使用「启动服务」。'
              : '服务归属未知：为避免误伤其它进程，重启不可用。'
  const selectTab = (id) => setActiveTab(id)
  const tabKeyDown = (event, index) => {
    let next = index
    if (event.key === 'ArrowRight') next = (index + 1) % TABS.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = TABS.length - 1
    else return
    event.preventDefault()
    selectTab(TABS[next].id)
    tabRefs.current[TABS[next].id]?.focus()
  }

  return (
    <div className={PREFIX + 'root'}>
      <div className={PREFIX + 'head'}>
        <div className={PREFIX + 'headrow'}>
          <div className={PREFIX + 'brand'}>
            <span className={PREFIX + 'mark'}><PanelIcon size={25} /></span>
            <div><div className={PREFIX + 'eyebrow'}>MEMORY SETTINGS</div><h2 className={PREFIX + 'h'}>Hindsight</h2></div>
          </div>
          <div className={PREFIX + 'actions'}>
            <Pill tone={apiLabel === '运行中' ? 'ok' : apiLabel === '状态未知' ? 'warn' : 'bad'}>API {apiLabel}</Pill>
            <Pill tone={cp?.up === true && status.error === null ? 'ok' : 'warn'}>控制台 {!cp || status.error !== null ? '状态未知' : cp.up ? '可用' : '不可用'}</Pill>
            {server?.pendingRestart === true && <Pill tone="warn">待下次启动应用</Pill>}
          </div>
        </div>
        <p className={PREFIX + 'sub'}>保存不等于运行应用：已有工作区可能需重启DSH；API服务设置仅在下次受控启动/重启应用，不会自动重启。</p>
      </div>
      <div className={PREFIX + 'tabs'} role="tablist" aria-label="Hindsight 设置分类">
        {TABS.map((tab, index) => <button key={tab.id} type="button" role="tab"
          id={'dsh-hsp-tab-' + tab.id} aria-controls={'dsh-hsp-panel-' + tab.id}
          aria-selected={activeTab === tab.id} tabIndex={activeTab === tab.id ? 0 : -1}
          ref={(element) => { tabRefs.current[tab.id] = element }}
          className={PREFIX + 'tab'} onClick={() => selectTab(tab.id)}
          onKeyDown={(event) => tabKeyDown(event, index)}>
          {tab.label}{dirtyFor(tab.id) ? ' ·' : ''}
        </button>)}
      </div>

      <div className={PREFIX + 'intro'}>
        <div><h3>{TABS.find((tab) => tab.id === activeTab)?.label}</h3><p>{tabDescription[activeTab]}</p></div>
        <span className={PREFIX + 'badge'}>{status.loading ? '正在刷新状态' : data?.sampledAt ? `状态采样 ${new Date(data.sampledAt).toLocaleTimeString()}` : '等待状态采样'}</span>
      </div>
      {status.loading && draft === null && <div className={PREFIX + 'muted'} role="status">读取中…</div>}

      {status.error !== null && (
        <div className={PREFIX + 'card'}>
          <Row label="读取失败"><span className={PREFIX + 'err'}>{status.error}</span></Row>
          <div className={PREFIX + 'actions'}>
            <button type="button" className={PREFIX + 'btn'} onClick={load}>重试</button>
          </div>
        </div>
      )}

      {(config?.error || data?.gui?.error) && (
        <div className={PREFIX + 'errbanner'}>
          <span>配置读取失败：{config?.error ?? data?.gui?.error}。不会覆盖损坏或不可读的文件，请先在本机修复。</span>
        </div>
      )}

      <section id="dsh-hsp-panel-overview" role="tabpanel" aria-labelledby="dsh-hsp-tab-overview" hidden={activeTab !== 'overview'} className={PREFIX + 'tabpanel'}>
      {/* ---- service management ------------------------------------------ */}
      {server && (
        <div className={PREFIX + 'card'}>
          <div className={PREFIX + 'cardhead'}>
            <h3 className={PREFIX + 'cardtitle'}>服务管理</h3>
            <div className={PREFIX + 'actions'}>
              <button type="button" className={PREFIX + 'btn'} disabled={operationInFlight || !canStartNow} onClick={() => serverAction('start')}>
                {serverBusy === 'start' || (status.error === null && server.operation === 'start') ? '启动中…' : '启动服务'}
              </button>
              <button type="button" className={PREFIX + 'btn ' + PREFIX + 'btnprimary'} disabled={operationInFlight || !canRestartNow} onClick={() => serverAction('restart')}>
                {serverBusy === 'restart' || (status.error === null && server.operation === 'restart') ? '重启中…' : '重启服务'}
              </button>
            </div>
          </div>

          {server.ownership !== undefined && (
            <Row label="归属">
              <Pill tone={server.ownership === 'managed' ? 'ok' : 'warn'}>
                {server.ownership === 'managed' ? '托管（本插件启动）'
                  : server.ownership === 'unmanaged' ? '外部进程'
                    : server.ownership === 'stopped' ? '未运行' : '未知'}
              </Pill>
            </Row>
          )}

          <Row label="API">
            <Pill tone={api?.up === true ? 'ok' : api?.state === 'unknown' ? 'warn' : 'bad'}>
              {api?.up === true ? '运行中' : api?.state === 'unknown' ? '状态未知' : '未运行'}
            </Pill>
            <span className={PREFIX + 'muted'}> {api?.url}</span>
            {api?.state === 'error' && <span className={PREFIX + 'err'}> {api.error}</span>}
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
          {server.lastAction && (
            <Row label="最近操作">
              <span className={server.lastAction.ok === true ? PREFIX + 'good' : PREFIX + 'err'}>
                {server.lastAction.action === 'restart' ? '重启' : '启动'} · {server.lastAction.detail ?? ''}
              </span>
            </Row>
          )}

          {server.previewError && <div className={PREFIX + 'errbanner'}><span>启动配置解析失败：{server.previewError}</span></div>}
          {server.ownershipError && <div className={PREFIX + 'errbanner'}><span>服务身份无法核验：{server.ownershipError}</span></div>}

          <details className={PREFIX + 'details'} open={serviceDetailsExpanded}>
            <summary onClick={(event) => { event.preventDefault(); setServiceDetailsExpanded((value) => !value) }}>启动与运行详情</summary>
            <div className={PREFIX + 'foldbody'}>
              <Row label="启动入口">{server.entry
                ? <span className={PREFIX + 'mono'}>{server.entry.command}<span className={PREFIX + 'muted'}>（{server.entry.source}）</span></span>
                : <span className={PREFIX + 'err'}>{server.entryReason ?? '未找到'}</span>}</Row>
              <Row label="监听 PID">{server.managedPid ?? '未确认'} · 端口 {server.port ?? '未知'}</Row>
              {server.runningConfig && <Row label="运行中配置">
                <span className={PREFIX + 'mono'}>{server.runningConfig.fingerprint ?? '—'}</span>
                <span className={PREFIX + 'muted'}>启动于 {server.runningConfig.startedAt ?? '—'}
                  {server.runningConfig.auditLogEnabled === true ? ' · 审计日志开' : server.runningConfig.auditLogEnabled === false ? ' · 审计日志关' : ''}
                </span>
              </Row>}
            </div>
          </details>
          {api?.up === true && server.runtimeConfigKnown === false && (
            <span className={PREFIX + 'hint'}>
              运行中服务的实际配置无法确认（可能由外部启动）；「下次启动将应用」仅反映本页保存的值。
            </span>
          )}
          {(!canRestartNow || operationInFlight) && !legacyHost && <span className={PREFIX + 'hint'}>{restartReason}</span>}
          {Array.isArray(server.resolutions) && server.resolutions.some((res) => res.mode === 'error') && <div className={PREFIX + 'errbanner'} role="alert">
            <span>启动预检失败：{server.resolutions.filter((res) => res.mode === 'error').map((res) => `${res.scope}: ${res.note}`).join('；')}</span>
          </div>}

          {server.pendingRestart === true && api?.up === true && <div className={PREFIX + 'banner'}>
            <span>{server.runtimeConfigKnown === true ? '服务端设置已修改，已确认的启动配置与保存值不同。' : '服务端设置已保存；当前实例配置未知，无法确认是否已生效。'}</span>
            <button type="button" className={PREFIX + 'btn'} disabled={operationInFlight || !canRestartNow} onClick={() => serverAction('restart')}>立即重启生效</button>
          </div>}
          <details className={PREFIX + 'details'} open={launchExpanded}>
          <summary onClick={(event) => { event.preventDefault(); setLaunchExpanded((value) => !value) }}>启动选项与下次配置</summary>
          <div className={PREFIX + 'foldbody'}>
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
              <input className={PREFIX + 'input'} type="text" aria-label="服务启动命令覆盖" value={serverCommandDraft}
                placeholder="留空 = 自动发现（PATH → uv/pip 默认安装位置）"
                onChange={(event) => setServerCommandDraft(event.target.value)} />
              <span className={PREFIX + 'hint'}>hindsight-api 可执行文件的完整路径；仅当自动发现失败时需要填写。</span>
            </div>
          </div>


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

          </div></details>
          {serverError && (
            <div className={PREFIX + 'errbanner'} role="alert">
              <span>{serverError}</span>
              <button
                type="button"
                className={PREFIX + 'btn'}
                disabled={operationInFlight || !canStartNow}
                onClick={() => { setServerError(null); serverAction('start') }}
              >
                重试启动
              </button>
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

      </section>
      <section id="dsh-hsp-panel-memory" role="tabpanel" aria-labelledby="dsh-hsp-tab-memory" hidden={activeTab !== 'memory'} className={PREFIX + 'tabpanel'}>
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
                  关闭会保存 disabled；已缓存的工作区可能仍召回、写回或保留工具，需重启DSH重新初始化后核验。仅新建同一工作区会话或重启API不保证生效。
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
                  <input className={PREFIX + 'input'} type="text" aria-label="固定记忆库名称" value={draft.bankId ?? ''}
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
                <input className={PREFIX + 'input'} type="text" aria-label="Hindsight API 服务地址" value={draft.apiUrl ?? ''}
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
                <input className={PREFIX + 'input'} type="text" aria-label="Control Plane 控制台地址" value={cpDraft ?? ''}
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
                <select className={PREFIX + 'select'} aria-label="日志级别" value={draft.logLevel ?? 'info'}
                  onChange={(event) => set('logLevel', event.target.value)}>
                  {LOG_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
                </select>
                <span className={PREFIX + 'hint'}>写入 ~/.hindsight/coding-agents-logs/plugin.log 的详细程度。</span>
              </div>
            </div>
          </div>

        </>
      )}
      </section>
      <section id="dsh-hsp-panel-models" role="tabpanel" aria-labelledby="dsh-hsp-tab-models" hidden={activeTab !== 'models'} className={PREFIX + 'tabpanel'}>
      {draft !== null && (
        <>
          <div className={PREFIX + 'card'}>
            <details className={PREFIX + 'fold'} open={chatExpanded}>
              <summary onClick={(event) => { event.preventDefault(); setChatExpanded((value) => !value) }}>功能模型调用</summary>
            <div className={PREFIX + 'foldbody'}>
            <div className={PREFIX + 'cardhead'}>
              <span className={PREFIX + 'hint'}>DSH 聊天模型路由</span>
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

            {(modelsState.state === 'error' || modelsState.state === 'unavailable') && !modelsState.loading && (
              <div className={PREFIX + 'errbanner'}>
                <span>
                  无法获取 DSH 模型列表：{modelsState.error ?? (modelsState.errors.map((entry) => entry.error).join('；') || '服务不可用')}
                  {modelsState.sampledAt ? `（采样于 ${modelsState.sampledAt}）` : ''}
                </span>
              </div>
            )}
            {modelsState.state === 'partial' && modelsState.errors.length > 0 && (
              <div className={PREFIX + 'banner'}>
                <span>部分 Provider 模型获取失败：{modelsState.errors.map((e) => `${e.provider ?? '未知 Provider'}：${e.error}`).join('；')}{modelsState.sampledAt ? `（采样于 ${modelsState.sampledAt}）` : ''}</span>
              </div>
            )}

            <Row label="代码库勘察（外部 CLI）">
              <input className={PREFIX + 'input'} type="text" aria-label="勘察 CLI 模型标识" placeholder="留空继承默认 haiku"
                value={draft.surveyModel ?? ''} onChange={(event) => set('surveyModel', event.target.value)} />
              <span className={PREFIX + 'hint'}>surveyModel 是外部 runner 的模型标识，不是 DSH Provider/Model 目录。官方适配器探测 Claude、Codex、Antigravity、OpenCode 等 CLI；模型参数支持取决于所选 runner。勘察需要已安装且已认证的 CLI，可能产生费用；本页不安装、探测或执行它们。已有工作区保存后可能需重启DSH。</span>
            </Row>

            {SERVER_SCOPES.map((scope) => (
              <ModelSelectField
                key={scope.key}
                label={scope.label}
                hint={scope.hint + `（写入 serverModels.${scope.key}）`}
                defaultValue="继承启动环境/后端默认，型号未确认"
                value={serverModelsDraft[scope.key] ?? ''}
                onChange={(val) => setServerModel(scope.key, val)}
                providers={modelsState.providers}
              />
            ))}
            </div>
            </details>
          </div>

          <div className={PREFIX + 'card'}>
            <h3 className={PREFIX + 'cardtitle'}>向量模型</h3>
            <span className={PREFIX + 'hint'}>此处是 Hindsight 向量化专用模型，不属于 DSH 聊天模型列表。预览反映已保存设置而非当前草稿；所有保存仅影响下次启动。本页不会迁移索引、下载模型或重启服务。</span>
            <div className={PREFIX + 'banner'}>更换向量模型或维度可能需要重建/迁移已有向量，操作前请自行核对存量数据。</div>
            <div className={PREFIX + 'preview'}>
            {embeddingPreview ? <>
              <Row label="已保存预览">
                <span className={embeddingPreview.mode === 'error' ? PREFIX + 'err' : PREFIX + 'mono'}>
                  {embeddingPreview.mode === 'error' ? '配置错误' : embeddingPreview.provider ?? '未知 Provider'}
                  {embeddingPreview.model ? ` · ${embeddingPreview.model}` : ''}
                  {embeddingPreview.baseUrl ? ` · ${embeddingPreview.baseUrl}` : ''}
                  {embeddingPreview.dimensions != null ? ` · ${embeddingPreview.dimensions} 维` : ''}
                </span>
              </Row>
              <Row label="配置来源">{embeddingPreview.source ?? '未知'} · {embeddingPreview.mode ?? '未知'} · 凭据来源 {embeddingPreview.credentialSource ?? '未知'} · {embeddingPreview.secretConfigured ? '下次启动凭据已配置（未验证有效性）' : '下次启动凭据未确认配置'}</Row>
              {embeddingPreview.note && <span className={PREFIX + 'hint'}>{embeddingPreview.note}</span>}
              {Array.isArray(embeddingPreview.warnings) && embeddingPreview.warnings
                .filter((warning) => !isMigrationWarning(warning))
                .map((warning, i) => <div key={i} className={PREFIX + 'banner'}>{warning}</div>)}
            </> : <div className={PREFIX + 'banner'}>下次启动向量配置未知，无法确认已保存设置的解析结果。</div>}
            <Row label="当前运行">{runningEmbedding
              ? `${runningEmbedding.provider ?? '未知'}${runningEmbedding.model ? ` · ${runningEmbedding.model}` : ''}（本插件确认的启动快照）`
              : '未知（无本插件确认的启动快照；不能推断正在使用下次启动配置）'}</Row>
            </div>
            <div className={PREFIX + 'field'}>
              <span className={PREFIX + 'label'}>Provider</span>
              <div className={PREFIX + 'control'}><select className={PREFIX + 'select'} aria-label="向量 Provider" value={embeddingsDraft.provider}
                onChange={(event) => setEmbeddings('provider', event.target.value)}>
                <option value="">继承环境 / 既有服务配置</option>
                <option value="local">local（本地）</option>
                <option value="openai">openai（含 LM Studio / OpenAI 兼容）</option>
                <option value="onnx">onnx</option>
                <option value="tei">tei（远端推理服务）</option>
                {!['', 'local', 'openai', 'onnx', 'tei'].includes(embeddingsDraft.provider) &&
                  <option value={embeddingsDraft.provider}>未知 Provider：{embeddingsDraft.provider}</option>}
              </select><span className={PREFIX + 'hint'}>留空保持继承；不会自动迁移旧 serverEnv，既有值仅在下次启动预览中显示。</span></div>
            </div>
            {['local', 'openai', 'onnx'].includes(embeddingsDraft.provider) && <div className={PREFIX + 'field'}>
              <span className={PREFIX + 'label'}>{embeddingsDraft.provider === 'onnx' ? 'ONNX 模型 ID' : '模型'}</span>
              <div className={PREFIX + 'control'}><input className={PREFIX + 'input'} type="text" aria-label="向量模型" value={embeddingsDraft.model}
                placeholder={embeddingsDraft.provider === 'onnx' ? 'ONNX 模型 ID' : '向量模型名称'}
                onChange={(event) => setEmbeddings('model', event.target.value)} />
                {embeddingsDraft.provider !== 'openai' && <span className={PREFIX + 'hint'}>本地依赖及模型需自行准备；不会自动安装或信任远端代码。</span>}
              </div>
            </div>}
            {['openai', 'tei'].includes(embeddingsDraft.provider) && <div className={PREFIX + 'field'}>
              <span className={PREFIX + 'label'}>Base URL</span>
              <div className={PREFIX + 'control'}><input className={PREFIX + 'input'} type="text" aria-label="向量 Base URL" value={embeddingsDraft.baseUrl}
                placeholder={embeddingsDraft.provider === 'tei' ? 'TEI 服务地址' : '兼容 OpenAI 的 API 地址'}
                onChange={(event) => setEmbeddings('baseUrl', event.target.value)} />
                {embeddingsDraft.provider === 'tei' && <span className={PREFIX + 'hint'}>TEI 模型由远端服务决定，本页不发送模型字段。</span>}
              </div>
            </div>}
            {['openai', 'onnx'].includes(embeddingsDraft.provider) && <div className={PREFIX + 'field'}>
              <span className={PREFIX + 'label'}>维度（可选）</span>
              <div className={PREFIX + 'control'}><input className={PREFIX + 'input'} type="number" aria-label="向量维度" min="1" step="1"
                value={embeddingsDraft.dimensions ?? ''} onChange={(event) => setEmbeddings('dimensions', event.target.value)} />
                <span className={PREFIX + 'hint'}>留空继承既有维度配置，否则由模型/服务决定；设置后需核对现有向量索引。</span>
              </div>
            </div>}
            {embeddingsDraft.provider === 'local' && <div className={PREFIX + 'field'}>
              <span className={PREFIX + 'label'}>强制 CPU</span>
              <div className={PREFIX + 'control'}><select className={PREFIX + 'select'} aria-label="向量模型强制 CPU"
                value={embeddingsDraft.localForceCpu === null ? '' : String(embeddingsDraft.localForceCpu)}
                onChange={(event) => setEmbeddings('localForceCpu', event.target.value === '' ? null : event.target.value === 'true')}>
                <option value="">默认（不指定）</option><option value="true">是</option><option value="false">否</option>
              </select></div>
            </div>}
            {embeddingsDraft.provider === 'openai' && <>
              <div className={PREFIX + 'field'}><span className={PREFIX + 'label'}>Key 环境变量</span>
                <div className={PREFIX + 'control'}><input className={PREFIX + 'input'} type="text" aria-label="向量 Key 环境变量" value={embeddingsDraft.apiKeyEnv}
                  placeholder="API Key 环境变量名" onChange={(event) => setEmbeddings('apiKeyEnv', event.target.value)} /></div>
              </div>
              <div className={PREFIX + 'field'}><span className={PREFIX + 'label'}>替换密钥</span>
                <div className={PREFIX + 'control'}><input className={PREFIX + 'input'} type="password" aria-label="向量替换密钥" autoComplete="new-password" value={embeddingsDraft.apiKey}
                  placeholder="向量 Key（留空保留已存值）" onChange={(event) => setEmbeddings('apiKey', event.target.value)} />
                  <span className={PREFIX + 'hint'}>此 Hindsight 版本需要非空 Key；本地免鉴权端点也需由您明确填写非敏感占位值，或继承已有 Key。本页不会自动生成。</span>
                  {embeddingsDraft.secretConfigured && (embeddingsDraft.clearApiKey
                    ? <span className={PREFIX + 'hint'}>将清除本页已保存 Key；环境凭据仍可能被继承。</span>
                    : <div className={PREFIX + 'actions'}><span className={PREFIX + 'hint'}>已配置本页 Key（不显示内容）</span>
                        <button type="button" className={PREFIX + 'btn'} onClick={() => setEmbeddings('clearApiKey', true)}>清除向量 Key</button>
                      </div>)}
                </div>
              </div>
            </>}
            {embeddingsDraft.provider && !['local', 'openai', 'onnx', 'tei'].includes(embeddingsDraft.provider) &&
              <div className={PREFIX + 'errbanner'}><span>未知向量 Provider：不能推断其配置或生效状态，请切换到受支持的类型。</span></div>}
          </div>

          <div className={PREFIX + 'card'}>
            <details className={PREFIX + 'fold'} open={overridesExpanded}>
              <summary onClick={(event) => { event.preventDefault(); setOverridesExpanded((value) => !value) }}>Provider 覆盖</summary>
            <div className={PREFIX + 'foldbody'}>
            <span className={PREFIX + 'hint'}>
              为非内置 Provider 填写 openai 兼容端点与凭据；留空表示用环境变量（&lt;PROVIDER&gt;_API_KEY）或 DSH 凭据库。
            </span>
            {overrideProviders.length === 0 && <div className={PREFIX + 'muted'}>暂无需要覆盖的 Provider。</div>}
            {overrideProviders.map((provider) => {
              const entry = overridesDraft[provider] ?? { baseUrl: '', apiKeyEnv: '', apiKey: '', clearApiKey: false }
              const secretConfigured = data?.gui?.providerOverrides?.[provider]?.secretConfigured === true
              return (
                <div className={PREFIX + 'field'} key={provider}>
                  <span className={PREFIX + 'label ' + PREFIX + 'mono'}>{provider}</span>
                  <div className={PREFIX + 'control'}>
                    <input className={PREFIX + 'input'} type="text" aria-label={`${provider} Base URL`} value={entry.baseUrl ?? ''}
                      placeholder="Base URL（openai 兼容端点，例如 https://api.example.com/v1）"
                      onChange={(event) => setOverride(provider, 'baseUrl', event.target.value)} />
                    <div className={PREFIX + 'pair'}>
                      <input className={PREFIX + 'input'} type="text" aria-label={`${provider} Key 环境变量`} value={entry.apiKeyEnv ?? ''}
                        placeholder="API Key 环境变量名"
                        onChange={(event) => setOverride(provider, 'apiKeyEnv', event.target.value)} />
                      <input className={PREFIX + 'input'} type="password" aria-label={`${provider} 替换密钥`} autoComplete="new-password" value={entry.apiKey ?? ''}
                        placeholder={secretConfigured && entry.clearApiKey !== true ? '已保存 Key（输入以替换）' : '或直接填 Key'}
                        onChange={(event) => setOverride(provider, 'apiKey', event.target.value)} />
                    </div>
                    {secretConfigured && (
                      entry.clearApiKey === true
                        ? <span className={PREFIX + 'muted'}>将清除已保存的 Key（保存后生效）。</span>
                        : (
                          <div className={PREFIX + 'actions'}>
                            <span className={PREFIX + 'pill ' + PREFIX + 'ok'}><span className={PREFIX + 'dot'} />已配置 Key</span>
                            <button type="button" className={PREFIX + 'btn'}
                              style={{ height: '24px', padding: '0 8px', fontSize: '12px' }}
                              onClick={() => setOverride(provider, 'clearApiKey', true)}>
                              清除已存 Key
                            </button>
                          </div>
                        )
                    )}
                  </div>
                </div>
              )
            })}
            </div>
            </details>
          </div>

        </>
      )}
      </section>
      <section id="dsh-hsp-panel-security" role="tabpanel" aria-labelledby="dsh-hsp-tab-security" hidden={activeTab !== 'security'} className={PREFIX + 'tabpanel'}>
      {draft !== null && (
        <>
          <div className={PREFIX + 'card'}>
            <h3 className={PREFIX + 'cardtitle'}>安全</h3>
            <div className={PREFIX + 'field'}>
              <span className={PREFIX + 'label'}>审计日志</span>
              <div className={PREFIX + 'control'}>
                <select className={PREFIX + 'select'} aria-label="审计日志" value={auditDraft === null ? '' : String(auditDraft)}
                  onChange={(event) => { setAuditDraft(event.target.value === '' ? null : event.target.value === 'true'); setNotice(null); setSaveError(null) }}>
                  <option value="">继承启动环境</option><option value="true">开启审计日志</option><option value="false">关闭审计日志</option>
                </select>
                <span className={PREFIX + 'hint'}>
                  服务端部署级开关，重启服务后生效；也可按 bank 在 Control Plane 中单独覆盖。
                </span>
              </div>
            </div>
          </div>


        </>
      )}

      {data && (
        <div className={PREFIX + 'card'}>
          <div className={PREFIX + 'cardhead'}><h3 className={PREFIX + 'cardtitle'}>记忆库 <span className={PREFIX + 'muted'}>({banks.length})</span></h3><span className={PREFIX + 'badge'}>开关即时写入</span></div>
          <input className={PREFIX + 'input'} type="search" aria-label="搜索记忆库" placeholder="按名称或 ID 搜索记忆库" value={bankSearch} onChange={(event) => setBankSearch(event.target.value)} />
          {data.banksError ? (
            <div className={PREFIX + 'errbanner'} role="alert"><span>无法读取记忆库列表：{data.banksError}</span></div>
          ) : banks.length === 0 ? <div className={PREFIX + 'muted'}>没有读到记忆库。</div>
            : visibleBanks.length === 0 ? <div className={PREFIX + 'muted'}>没有匹配的记忆库。</div> : (
              <ul className={PREFIX + 'list'}>
                {visibleBanks.map((bank) => {
                  const state = defense[bank.id] ?? { loading: true, enabled: false }
                  return (
                    <li className={PREFIX + 'item'} key={bank.id}>
                      <div className={PREFIX + 'bankmeta'}><span className={PREFIX + 'banktitle'}>{bank.name || bank.id}</span><span className={PREFIX + 'mono ' + PREFIX + 'muted'}>{bank.id}</span></div>
                      <span className={PREFIX + 'count'}>{typeof bank.facts === 'number' ? `${bank.facts} 条事实` : '事实数未知'}</span>
                      <span className={PREFIX + 'badge'}>{state.loading ? '处理中…' : state.unknown ? '策略未知' : state.enabled ? '脱敏已开启' : '标准脱敏未开启'}</span>
                      <label className={PREFIX + 'check'} style={{ flex: '0 0 auto' }}>
                        <input type="checkbox" aria-label={`${bank.name || bank.id} 脱敏`} disabled={state.loading === true || state.unknown === true || api?.up !== true || status.error !== null}
                          checked={state.enabled === true}
                          onChange={(event) => toggleDefense(bank.id, event.target.checked)} />
                        <span className={PREFIX + 'muted'} style={{ fontSize: '12px' }}>脱敏</span>
                      </label>
                      {state.error && <div className={PREFIX + 'bankerror'}><span className={PREFIX + 'err'} role="alert">{state.error}</span>
                        <button type="button" className={PREFIX + 'btn'} disabled={state.loading === true} onClick={() => readDefense(bank.id)}>重读策略</button>
                      </div>}
                    </li>
                  )
                })}
              </ul>
            )}
          <span className={PREFIX + 'hint'}>「脱敏」管理 sensitive_data → redact 标准规则，保留其它更强或自定义策略。开关直接写入当前记忆库，不需要点击下方保存。</span>
        </div>
      )}

      </section>
      <section id="dsh-hsp-panel-advanced" role="tabpanel" aria-labelledby="dsh-hsp-tab-advanced" hidden={activeTab !== 'advanced'} className={PREFIX + 'tabpanel'}>
        {draft !== null && <details className={PREFIX + 'details'}>
          <summary>其他插件选项</summary>
          <div className={PREFIX + 'control'} style={{ marginTop: '10px' }}>
            <label className={PREFIX + 'check'}>
              <input type="checkbox" checked={draft.autoUpdate === true} onChange={(event) => set('autoUpdate', event.target.checked)} />
              <span>自动更新（autoUpdate）</span>
            </label>
            <label className={PREFIX + 'check'}>
              <input type="checkbox" checked={draft.codebaseSurvey === true} onChange={(event) => set('codebaseSurvey', event.target.checked)} />
              <span>代码库勘察（codebaseSurvey）</span>
            </label>
          </div>
        </details>}
      {extraKeys.length > 0 && (
        <details className={PREFIX + 'details'}>
          <summary>配置文件里还有 {extraKeys.length} 个本页不改写的键（保存时会原样保留）</summary>
          <div className={PREFIX + 'mono'} style={{ marginTop: '8px' }}>{extraKeys.join('、')}</div>
        </details>
      )}
      </section>
      {data?.management?.protocolVersion === 1 && api?.url && <ManagementPanel category={activeTab} apiUrl={api.url} banks={data.banks ?? []}
        request={managementRequest} upload={managementUpload} download={managementDownload} onChanged={load} />}
      {draft !== null && <div className={PREFIX + 'savebar'}>
        <div className={PREFIX + 'savestate'} role="status">{saving ? '正在保存全部分类的更改…' : dirty ? '有未保存的更改（跨分类保留）' : '当前表单与已保存设置一致'}</div>
        <button type="button" className={PREFIX + 'btn ' + PREFIX + 'btnprimary'} disabled={!dirty || saving} onClick={save}>
          {saving ? '保存中…' : '保存'}
        </button>
        <button type="button" className={PREFIX + 'btn'} disabled={!dirty || saving} onClick={discard}>放弃更改</button>
        {notice && <span className={PREFIX + 'notice'} role="status" style={{ flexBasis: '100%' }}>{notice}</span>}
        {saveError && <span className={PREFIX + 'err'} role="alert" style={{ flexBasis: '100%' }}>保存失败：{saveError}</span>}
      </div>}
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
