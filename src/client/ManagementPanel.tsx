/**
 * ManagementPanel.tsx — Hindsight 管理面板（诊断/任务队列、记忆与隐私设置、库级配置、
 * 模型调试、高级迁移与别名）。
 *
 * 契约要点（docs/management-implementation.md + lib/management-contracts.js）：
 * - 只使用 props 注入的同源 request/upload/download 桥接；不直连远端 API、不引入 Node 依赖。
 * - 写/收费/导出/下载一律走统一自定义确认对话框：先 POST prepare 取一次性确认令牌，
 *   再以冻结的参数快照执行实际操作；prepare 与执行之间参数不可变；不缓存令牌、不自动重试。
 * - 202 仅代表已受理：导出/导入/克隆提交后轮询 operation 读取直至终态才算完成。
 * - 能力未知一律禁用动作；apiUrl / 记忆库目标切换使旧响应作废并中止在途请求；
 *   草稿随分类切换保留（隐藏不卸载），轮询不覆盖脏草稿。
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BANK_FIELDS,
  COST_OPERATIONS,
  DOWNLOAD_LIMIT,
  MEMORY_FIELDS,
  UPLOAD_LIMIT,
} from '../../lib/management-contracts.js'

const P = 'dsh-hsm-'
const READ_TIMEOUT = 30000
const SLOW_TIMEOUT = 120000
const DOWNLOAD_TIMEOUT = 180000
const POLL_MS = 3000
const QUEUE_PAGE = 20

const CSS = [
  '.' + P + 'root{display:flex;flex-direction:column;gap:18px;width:100%;min-width:0;box-sizing:border-box;',
  'color:var(--dsw-alias-label-primary,#1a1a1a);font:inherit;font-size:13px;line-height:21px;color-scheme:light;}',
  '.' + P + 'root *{box-sizing:border-box;}',
  '.' + P + 'section{display:flex;flex-direction:column;gap:18px;min-width:0;}',
  '.' + P + 'section[hidden]{display:none;}',
  '.' + P + 'card{border:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:14px;padding:20px;',
  'display:flex;flex-direction:column;gap:14px;background:var(--dsw-alias-bg-layer-1,transparent);min-width:0;}',
  '.' + P + 'cardhead{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;}',
  '.' + P + 'cardtitle{margin:0;font-size:15px;line-height:24px;font-weight:650;}',
  '.' + P + 'field{display:grid;grid-template-columns:140px minmax(0,1fr);gap:6px 12px;align-items:start;}',
  '@media (max-width:680px){.' + P + 'field{grid-template-columns:minmax(0,1fr);}}',
  '.' + P + 'label{padding-top:5px;color:var(--dsw-alias-label-secondary,#555);}',
  '.' + P + 'control{min-width:0;display:flex;flex-direction:column;gap:6px;}',
  '.' + P + 'hint{color:var(--dsw-alias-label-tertiary,#8a8a8a);font-size:12px;}',
  '.' + P + 'muted{color:var(--dsw-alias-label-tertiary,#8a8a8a);}',
  '.' + P + 'input,.' + P + 'select{box-sizing:border-box;width:100%;height:36px;padding:0 11px;border-radius:8px;',
  'border:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.18));',
  'background-color:var(--dsw-alias-bg-layer-1,var(--dsw-alias-bg-base,#fff));color:var(--dsw-alias-label-primary,inherit);',
  'font:inherit;font-size:13px;color-scheme:light dark;}',
  '.' + P + 'select option{background-color:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#1a1a1a);}',
  '.' + P + 'textarea{box-sizing:border-box;width:100%;min-height:72px;padding:8px 11px;border-radius:8px;',
  'border:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.18));',
  'background-color:var(--dsw-alias-bg-layer-1,var(--dsw-alias-bg-base,#fff));color:var(--dsw-alias-label-primary,inherit);',
  'font:inherit;font-size:12.5px;line-height:18px;resize:vertical;color-scheme:light dark;}',
  '.' + P + 'input:focus,.' + P + 'select:focus,.' + P + 'textarea:focus{outline:2px solid var(--dsw-alias-brand-primary,#3b82f6);outline-offset:1px;}',
  '.' + P + 'input:disabled,.' + P + 'select:disabled,.' + P + 'textarea:disabled{opacity:.55;}',
  '.' + P + 'check{display:flex;align-items:flex-start;gap:8px;cursor:pointer;}',
  '.' + P + 'check input{margin-top:3px;accent-color:var(--dsw-alias-brand-primary,#3b82f6);}',
  '.' + P + 'btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:34px;padding:6px 14px;',
  'border-radius:8px;border:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.14));',
  'background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.045));color:inherit;font:inherit;font-size:13px;',
  'cursor:pointer;white-space:nowrap;}',
  '.' + P + 'btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-active,rgba(0,0,0,.09));}',
  '.' + P + 'btn:disabled{opacity:.5;cursor:default;}',
  '.' + P + 'btnprimary{background:var(--dsw-alias-brand-primary,#3b82f6);border-color:transparent;color:#fff;}',
  '.' + P + 'btnprimary:hover:not(:disabled){background:var(--dsw-alias-brand-primary-hover,#2563eb);}',
  '.' + P + 'btndanger{border-color:rgba(220,38,38,.45);color:var(--dsw-alias-status-error,#b91c1c);background:transparent;}',
  '.' + P + 'btndanger:hover:not(:disabled){background:rgba(220,38,38,.08);}',
  '.' + P + 'pill{display:inline-flex;align-items:center;gap:6px;font-size:12px;padding:2px 10px;border-radius:999px;',
  'border:.5px solid transparent;white-space:nowrap;}',
  '.' + P + 'pill-ok{color:var(--dsw-alias-status-success,#15803d);background:rgba(22,163,74,.1);border-color:rgba(22,163,74,.3);}',
  '.' + P + 'pill-bad{color:var(--dsw-alias-status-error,#b91c1c);background:rgba(220,38,38,.08);border-color:rgba(220,38,38,.3);}',
  '.' + P + 'pill-warn{color:var(--dsw-alias-status-warning,#a16207);background:rgba(202,138,4,.1);border-color:rgba(202,138,4,.3);}',
  '.' + P + 'pill-mute{color:var(--dsw-alias-label-tertiary,#6b7280);background:rgba(107,114,128,.1);border-color:rgba(107,114,128,.25);}',
  '.' + P + 'errbanner{display:flex;gap:8px;padding:10px 12px;border-radius:8px;background:rgba(220,38,38,.07);',
  'border:.5px solid rgba(220,38,38,.3);color:var(--dsw-alias-status-error,#b91c1c);}',
  '.' + P + 'notice{padding:8px 12px;border-radius:8px;background:rgba(22,163,74,.08);',
  'border:.5px solid rgba(22,163,74,.3);color:var(--dsw-alias-status-success,#15803d);}',
  '.' + P + 'actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center;}',
  '.' + P + 'table{width:100%;border-collapse:collapse;font-size:12.5px;}',
  '.' + P + 'table th{text-align:left;padding:6px 8px;color:var(--dsw-alias-label-tertiary,#8a8a8a);font-weight:600;',
  'border-bottom:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));}',
  '.' + P + 'table td{padding:8px;border-bottom:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));vertical-align:top;word-break:break-word;}',
  '.' + P + 'mono{font-family:ui-monospace,Consolas,Menlo,monospace;font-size:12px;word-break:break-all;}',
  '.' + P + 'kv{display:grid;grid-template-columns:180px minmax(0,1fr);gap:4px 12px;font-size:12.5px;margin:0;}',
  '@media (max-width:680px){.' + P + 'kv{grid-template-columns:minmax(0,1fr);}}',
  '.' + P + 'kv dt{color:var(--dsw-alias-label-tertiary,#8a8a8a);margin:0;}',
  '.' + P + 'kv dd{margin:0;min-width:0;word-break:break-word;}',
  '.' + P + 'overlay{position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.4);',
  'display:flex;align-items:center;justify-content:center;padding:24px;}',
  '.' + P + 'dialog{background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#1a1a1a);',
  'border-radius:14px;border:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));width:100%;max-width:560px;',
  'max-height:82vh;overflow:auto;padding:20px;display:flex;flex-direction:column;gap:12px;color-scheme:light;}',
  '.' + P + 'dlgtitle{margin:0;font-size:16px;font-weight:650;}',
  '.' + P + 'risk{padding:10px 12px;border-radius:8px;background:rgba(202,138,4,.08);border:.5px solid rgba(202,138,4,.3);}',
  '.' + P + 'pre{margin:0;padding:10px 12px;border-radius:8px;background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.04));',
  'font-family:ui-monospace,Consolas,Menlo,monospace;font-size:11.5px;line-height:16px;white-space:pre-wrap;',
  'word-break:break-word;max-height:220px;overflow:auto;}',
  '.' + P + 'progress{height:6px;border-radius:3px;background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.08));',
  'overflow:hidden;min-width:120px;}',
  '.' + P + 'progressbar{height:100%;background:var(--dsw-alias-brand-primary,#3b82f6);}',
  '.' + P + 'rowactions{display:flex;gap:6px;flex-wrap:wrap;}',
  '.' + P + 'block{border:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:8px;',
  'padding:10px 12px;display:flex;flex-direction:column;gap:6px;}',
  '.' + P + 'blockoff{opacity:.55;}',
]

let cssReady = false

/** Inject the management-panel stylesheet once (shares the host theme variables). */
function ensureMgmtStyles() {
  if (cssReady || typeof document === 'undefined') return
  cssReady = true
  if (document.getElementById(P + 'styles')) return
  const style = document.createElement('style')
  style.id = P + 'styles'
  style.textContent = CSS.join('\n')
  document.head.appendChild(style)
}

const encoder = new TextEncoder()

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function errText(err) {
  if (err instanceof Error && err.message) return err.message
  return String(err)
}

function staleError() {
  const err = new Error('响应已过期（目标已变更或面板已卸载），已丢弃。')
  err.stale = true
  return err
}

function isCancel(err) {
  return !!err && (err.stale === true || err.name === 'AbortError')
}

function fmtTime(value) {
  if (typeof value !== 'string' || !value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function fmtBytes(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '—'
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  return (n / 1024 / 1024).toFixed(1) + ' MB'
}

function shortId(id) {
  return typeof id === 'string' && id.length > 12 ? id.slice(0, 8) + '…' : String(id ?? '')
}

/** Client-side alias validation (host re-validates authoritatively). */
function aliasProblem(alias) {
  const text = alias.trim()
  if (!text) return '别名不能为空。'
  if (encoder.encode(text).length > 192) return '别名超过 192 字节（UTF-8）上限。'
  if (/[\x00-\x1f\x7f]/.test(text)) return '别名不能包含控制字符。'
  if (/[\\/]/.test(text)) return '别名不能包含斜杠或反斜杠。'
  if (text === '.' || text === '..') return '别名不能是路径片段。'
  return null
}

/** Render a whitelist value into editable text. */
function valueToText(kind, value) {
  if (kind === 'boolean') return value === true ? 'true' : 'false'
  if (kind === 'json') {
    try {
      return JSON.stringify(value ?? null, null, 2)
    } catch (err) {
      return String(value ?? '')
    }
  }
  if (kind === 'lines') return Array.isArray(value) ? value.join('\n') : value == null ? '' : String(value)
  return value == null ? '' : String(value)
}

/** Parse edited text back into a typed value; returns { ok, value } or { ok:false, error }. */
function textToValue(kind, text, meta) {
  if (kind === 'boolean') return { ok: true, value: text === 'true' }
  if (kind === 'integer') {
    if (!/^-?\d+$/.test(text.trim())) return { ok: false, error: '必须是整数' }
    const n = parseInt(text.trim(), 10)
    if (meta && typeof meta.min === 'number' && n < meta.min) return { ok: false, error: '不能小于 ' + meta.min }
    if (meta && typeof meta.max === 'number' && n > meta.max) return { ok: false, error: '不能大于 ' + meta.max }
    return { ok: true, value: n }
  }
  if (kind === 'number') {
    const n = parseFloat(text.trim())
    if (!Number.isFinite(n)) return { ok: false, error: '必须是数字' }
    if (meta && typeof meta.min === 'number' && n < meta.min) return { ok: false, error: '不能小于 ' + meta.min }
    if (meta && typeof meta.max === 'number' && n > meta.max) return { ok: false, error: '不能大于 ' + meta.max }
    return { ok: true, value: n }
  }
  if (kind === 'json') {
    try {
      return { ok: true, value: JSON.parse(text) }
    } catch (err) {
      return { ok: false, error: 'JSON 解析失败：' + errText(err) }
    }
  }
  if (kind === 'lines') {
    return { ok: true, value: text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0) }
  }
  if (kind === 'choice' && meta && Array.isArray(meta.choices) && !meta.choices.includes(text)) {
    return { ok: false, error: '必须是 ' + meta.choices.join(' / ') + ' 之一' }
  }
  return { ok: true, value: text }
}

/** Verify the response echoes the exact request target; mismatched responses are discarded. */
function verifyEcho(input, res) {
  if (!isRecord(res) || res.op !== input.op || res.apiUrl !== input.apiUrl) {
    throw new Error('响应与请求目标不一致，已丢弃。')
  }
  if (input.bankId !== undefined && res.bankId !== input.bankId) {
    throw new Error('响应与请求目标不一致，已丢弃。')
  }
}

/**
 * Per-section request channel: cancels in-flight requests and drops stale responses
 * whenever the target key (apiUrl / bank scope) changes or the panel unmounts.
 */
function useChannel(request, targetKey) {
  const genRef = useRef(0)
  const mountedRef = useRef(true)
  const ctrlsRef = useRef(new Set())
  useEffect(() => {
    genRef.current += 1
    const ctrls = ctrlsRef.current
    for (const controller of ctrls) controller.abort()
    ctrls.clear()
  }, [targetKey])
  useEffect(() => () => {
    mountedRef.current = false
    const ctrls = ctrlsRef.current
    for (const controller of ctrls) controller.abort()
    ctrls.clear()
  }, [])
  return useCallback(async (input, timeoutMs) => {
    const gen = genRef.current
    const controller = new AbortController()
    ctrlsRef.current.add(controller)
    try {
      const res = await request(input, { signal: controller.signal, timeoutMs: timeoutMs ?? READ_TIMEOUT })
      if (!mountedRef.current || gen !== genRef.current) throw staleError()
      verifyEcho(input, res)
      return res
    } finally {
      ctrlsRef.current.delete(controller)
    }
  }, [request])
}

function MgmtPill({ tone, children }) {
  return <span className={P + 'pill ' + P + 'pill-' + (tone || 'mute')}>{children}</span>
}

const OP_STATUS = {
  pending: ['待处理', 'warn'],
  processing: ['进行中', 'warn'],
  completed: ['已完成', 'ok'],
  failed: ['失败', 'bad'],
  cancelled: ['已取消', 'mute'],
}

function OpPill({ status }) {
  const entry = OP_STATUS[status] || ['未知', 'mute']
  return <MgmtPill tone={entry[1]}>{entry[0]}</MgmtPill>
}

function Field({ label, hint, children }) {
  return (
    <div className={P + 'field'}>
      <div className={P + 'label'}>{label}</div>
      <div className={P + 'control'}>
        {children}
        {hint ? <div className={P + 'hint'}>{hint}</div> : null}
      </div>
    </div>
  )
}

let pickerSeq = 0

/** Bank picker: datalist suggestions from the host-provided list, free text allowed. */
function BankPicker({ banks, value, onChange, label }) {
  const [listId] = useState(() => P + 'banks-' + (++pickerSeq))
  return (
    <Field label={label || '记忆库'}
      hint={banks.length === 0 ? '宿主尚未提供记忆库列表，可手动输入 ID。' : undefined}>
      <input className={P + 'input'} type="text" list={listId} aria-label={label || '记忆库 ID'}
        placeholder="输入或选择记忆库 ID" value={value} onChange={(event) => onChange(event.target.value.trim())} />
      <datalist id={listId}>
        {banks.map((bank) => (
          <option key={bank.id} value={bank.id}>
            {(bank.name || bank.id) + (typeof bank.facts === 'number' ? '（' + bank.facts + ' 条事实）' : '')}
          </option>
        ))}
      </datalist>
    </Field>
  )
}

function OpProgress({ progress }) {
  if (!isRecord(progress)) return null
  const processed = typeof progress.processed === 'number' ? progress.processed : null
  const total = typeof progress.total === 'number' && progress.total > 0 ? progress.total : null
  const percent = processed !== null && total !== null ? Math.min(100, Math.round((processed / total) * 100)) : null
  return (
    <div className={P + 'control'} role="status">
      <div className={P + 'muted'}>
        阶段：{progress.stage || '—'}
        {processed !== null ? '；已处理 ' + processed + (total !== null ? ' / ' + total : '') : ''}
        {'；快照时间 '}{fmtTime(progress.at)}
      </div>
      {percent !== null ? (
        <div className={P + 'progress'}><div className={P + 'progressbar'} style={{ width: percent + '%' }} /></div>
      ) : null}
      {isRecord(progress.detail) ? (
        <div className={P + 'muted'}>{Object.entries(progress.detail).map(([k, v]) => k + '=' + v).join('，')}</div>
      ) : null}
    </div>
  )
}

/**
 * Unified confirmation dialog for every write / cost / export / download operation.
 * Never window.confirm: typed subject + risk checkbox (+ cost checkbox for paid ops),
 * then prepare → one-time token → execute with the frozen params snapshot.
 */
function ConfirmDialog({ spec, onClose, onExecute }) {
  const [typed, setTyped] = useState('')
  const [riskOk, setRiskOk] = useState(false)
  const [costOk, setCostOk] = useState(false)
  const [busy, setBusy] = useState(false)
  const [phase, setPhase] = useState('')
  const [error, setError] = useState(null)
  const busyRef = useRef(false)
  busyRef.current = busy
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape' && !busyRef.current) onClose(false, null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  const needCost = spec.cost === true
  const ready = typed === spec.typedSubject && riskOk && (!needCost || costOk) && !busy
  const doConfirm = async () => {
    if (!ready) return
    setBusy(true)
    setError(null)
    try {
      const res = await onExecute(spec, setPhase)
      onClose(true, res)
    } catch (err) {
      if (isCancel(err)) {
        setError('操作已取消。若实际结果未知，请刷新对应列表核实状态；不会自动重试。')
      } else {
        setError(errText(err))
      }
      setBusy(false)
      setPhase('')
    }
  }
  return (
    <div className={P + 'overlay'} onMouseDown={() => { if (!busy) onClose(false, null) }}>
      <div className={P + 'dialog'} role="dialog" aria-modal="true" aria-label={spec.title}
        onMouseDown={(event) => event.stopPropagation()}>
        <h3 className={P + 'dlgtitle'}>{spec.title}</h3>
        <dl className={P + 'kv'}>
          {spec.summary.map((row) => (
            <div key={row.label} style={{ display: 'contents' }}>
              <dt>{row.label}</dt>
              <dd className={P + 'mono'}>{row.value}</dd>
            </div>
          ))}
        </dl>
        <div className={P + 'risk'}>{spec.riskNote}</div>
        <details>
          <summary>冻结参数快照（prepare 与执行之间不可变）</summary>
          <pre className={P + 'pre'}>{JSON.stringify(spec.params || {}, null, 2)}</pre>
        </details>
        <Field label={'输入「' + spec.typedSubject + '」确认'}>
          <input className={P + 'input'} type="text" autoFocus value={typed} disabled={busy}
            aria-label={'输入 ' + spec.typedSubject + ' 以确认操作目标'}
            onChange={(event) => setTyped(event.target.value)} />
        </Field>
        <label className={P + 'check'}>
          <input type="checkbox" checked={riskOk} disabled={busy}
            onChange={(event) => setRiskOk(event.target.checked)} />
          <span>我已知晓上述风险与影响。</span>
        </label>
        {needCost ? (
          <label className={P + 'check'}>
            <input type="checkbox" checked={costOk} disabled={busy}
              onChange={(event) => setCostOk(event.target.checked)} />
            <span>我已知晓该操作可能产生 LLM 调用费用。</span>
          </label>
        ) : null}
        {error ? <div className={P + 'errbanner'} role="alert"><span>{error}</span></div> : null}
        {busy ? <div className={P + 'muted'} role="status">{phase || '处理中…'}</div> : null}
        <div className={P + 'actions'}>
          <button type="button" className={P + 'btn'} disabled={busy} onClick={() => onClose(false, null)}>取消</button>
          <button type="button" className={P + 'btn ' + P + 'btnprimary'} disabled={!ready} onClick={doConfirm}>
            {busy ? '执行中…' : (spec.confirmLabel || '确认执行')}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Typed value editor by whitelist field kind. */
function KindEditor({ meta, value, disabled, ariaLabel, onChange }) {
  if (meta.kind === 'boolean') {
    return (
      <select className={P + 'select'} value={value} disabled={disabled} aria-label={ariaLabel}
        onChange={(event) => onChange(event.target.value)}>
        <option value="true">开启</option>
        <option value="false">关闭</option>
      </select>
    )
  }
  if (meta.kind === 'choice') {
    return (
      <select className={P + 'select'} value={value} disabled={disabled} aria-label={ariaLabel}
        onChange={(event) => onChange(event.target.value)}>
        {(meta.choices || []).map((choice) => <option key={choice} value={choice}>{choice}</option>)}
      </select>
    )
  }
  if (meta.kind === 'json' || meta.kind === 'lines') {
    return (
      <textarea className={P + 'textarea'} value={value} disabled={disabled} aria-label={ariaLabel}
        onChange={(event) => onChange(event.target.value)} />
    )
  }
  return (
    <input className={P + 'input'} type={meta.kind === 'integer' || meta.kind === 'number' ? 'number' : 'text'}
      value={value} disabled={disabled} aria-label={ariaLabel}
      onChange={(event) => onChange(event.target.value)} />
  )
}

/* ------------------------------------------------------------------ *
 * overview：诊断 + 任务队列
 * ------------------------------------------------------------------ */

const STAT_LABELS = {
  total_documents: '文档数',
  total_nodes: '记忆节点数',
  total_links: '链接数',
  pending_operations: '待处理任务',
  failed_operations: '失败任务',
  last_consolidated_at: '上次整理时间',
  last_memory_write_at: '上次写入时间',
}

function OverviewSection({ active, apiUrl, banks, request, cap, diag, reloadDiag, openConfirm }) {
  const [bankId, setBankId] = useState('')
  const call = useChannel(request, apiUrl + '|' + bankId)
  const [stats, setStats] = useState({ loading: false, error: null, data: null })
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [excludeParents, setExcludeParents] = useState(true)
  const [offset, setOffset] = useState(0)
  const [queue, setQueue] = useState({ loading: false, error: null, items: null, total: null })
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [detailId, setDetailId] = useState(null)
  const [detail, setDetail] = useState({ loading: false, error: null, data: null })

  const loadStats = useCallback(async () => {
    if (!bankId) return
    setStats((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const res = await call({ op: 'stats', apiUrl, bankId })
      setStats({ loading: false, error: null, data: isRecord(res.data) ? res.data : {} })
    } catch (err) {
      if (isCancel(err)) return
      setStats((prev) => ({ ...prev, loading: false, error: errText(err) }))
    }
  }, [call, apiUrl, bankId])

  const loadQueue = useCallback(async (nextOffset) => {
    if (!bankId) return
    setQueue((prev) => ({ ...prev, loading: true, error: null }))
    const params = { limit: QUEUE_PAGE, offset: nextOffset, excludeParents }
    if (statusFilter) params.status = statusFilter
    if (typeFilter.trim()) params.type = typeFilter.trim()
    try {
      const res = await call({ op: 'operations', apiUrl, bankId, params })
      const data = isRecord(res.data) ? res.data : {}
      setQueue({
        loading: false,
        error: null,
        items: Array.isArray(data.items) ? data.items : [],
        total: typeof data.total === 'number' ? data.total : null,
      })
    } catch (err) {
      if (isCancel(err)) return
      setQueue((prev) => ({ ...prev, loading: false, error: errText(err) }))
    }
  }, [call, apiUrl, bankId, statusFilter, typeFilter, excludeParents])

  const loadDetail = useCallback(async (operationId) => {
    setDetail({ loading: true, error: null, data: null })
    try {
      const res = await call({ op: 'operation', apiUrl, bankId, params: { operationId } })
      setDetail({ loading: false, error: null, data: isRecord(res.data) ? res.data : {} })
    } catch (err) {
      if (isCancel(err)) return
      setDetail({ loading: false, error: errText(err), data: null })
    }
  }, [call, apiUrl, bankId])

  // Auto-load queue+stats when the category becomes active with a bank chosen.
  useEffect(() => {
    if (active && bankId) {
      loadQueue(offset)
      loadStats()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, bankId])

  useEffect(() => {
    if (!active || !autoRefresh || !bankId) return undefined
    const timer = setInterval(() => { loadQueue(offset) }, 15000)
    return () => clearInterval(timer)
  }, [active, autoRefresh, bankId, loadQueue, offset])

  const confirmRowAction = (row, action) => {
    const opName = action === 'retry' ? 'operationRetry' : action === 'cancel' ? 'operationCancel' : 'operationDelete'
    const titles = { retry: '重试任务', cancel: '取消任务', delete: '删除任务记录' }
    const risks = {
      retry: '将重新执行该任务，可能再次产生 LLM 调用与费用。',
      cancel: '将请求取消该任务；已开始执行的部分无法回滚。',
      delete: '将永久删除该任务记录（不影响已写入的记忆数据），不可恢复。',
    }
    openConfirm({
      title: titles[action],
      op: opName,
      cost: COST_OPERATIONS.includes(opName),
      apiUrl,
      bankId,
      typedSubject: bankId,
      riskNote: risks[action],
      params: { operationId: row.operation_id },
      transport: 'request',
      timeoutMs: READ_TIMEOUT,
      summary: [
        { label: 'API', value: apiUrl },
        { label: '记忆库', value: bankId },
        { label: '任务 ID', value: row.operation_id },
      ],
      onDone: () => {
        loadQueue(offset)
        if (detailId === row.operation_id) loadDetail(row.operation_id)
      },
    })
  }

  const diagData = diag.data
  const features = diagData && isRecord(diagData.features) ? diagData.features : null
  const warnings = diagData && Array.isArray(diagData.warnings) ? diagData.warnings : []

  return (
    <>
      <div className={P + 'card'}>
        <div className={P + 'cardhead'}>
          <h3 className={P + 'cardtitle'}>诊断信息</h3>
          <button type="button" className={P + 'btn'} disabled={diag.loading} onClick={reloadDiag}>
            {diag.loading ? '读取中…' : '刷新诊断'}
          </button>
        </div>
        {diag.error ? <div className={P + 'errbanner'} role="alert"><span>诊断读取失败：{diag.error}</span></div> : null}
        {!diagData && !diag.loading && !diag.error ? <div className={P + 'muted'} role="status">尚未读取诊断信息。</div> : null}
        {diag.loading ? <div className={P + 'muted'} role="status">读取中…</div> : null}
        {diagData ? (
          <>
            <dl className={P + 'kv'}>
              <div style={{ display: 'contents' }}><dt>插件版本</dt><dd>{diagData.pluginVersion ?? '未知'}</dd></div>
              <div style={{ display: 'contents' }}><dt>API 版本</dt><dd>{diagData.apiVersion ?? '未知'}</dd></div>
              <div style={{ display: 'contents' }}><dt>存活状态</dt><dd>{typeof diagData.liveness === 'string' ? diagData.liveness : '未知'}</dd></div>
              <div style={{ display: 'contents' }}><dt>就绪状态</dt><dd>{typeof diagData.readiness === 'string' ? diagData.readiness : '未知'}</dd></div>
              <div style={{ display: 'contents' }}><dt>认证</dt><dd>{diagData.auth == null ? '未知' : (typeof diagData.auth === 'string' ? diagData.auth : JSON.stringify(diagData.auth))}</dd></div>
              <div style={{ display: 'contents' }}><dt>记忆后端</dt><dd>{diagData.memory == null ? '未知' : (typeof diagData.memory === 'string' ? diagData.memory : JSON.stringify(diagData.memory))}</dd></div>
            </dl>
            {features ? (
              <div className={P + 'actions'} aria-label="服务端特性">
                {Object.entries(features).map(([key, value]) => (
                  <MgmtPill key={key} tone={value === true ? 'ok' : 'mute'}>{key}{value === true ? '' : '（关）'}</MgmtPill>
                ))}
              </div>
            ) : <div className={P + 'muted'}>服务端特性：未知</div>}
            {warnings.length > 0 ? (
              <div className={P + 'control'}>
                {warnings.map((warning, index) => (
                  <div key={index} className={P + 'risk'}>{String(warning)}</div>
                ))}
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      <div className={P + 'card'}>
        <div className={P + 'cardhead'}>
          <h3 className={P + 'cardtitle'}>记忆库统计</h3>
          <button type="button" className={P + 'btn'} disabled={!bankId || stats.loading} onClick={loadStats}>
            {stats.loading ? '读取中…' : '刷新统计'}
          </button>
        </div>
        <BankPicker banks={banks} value={bankId} onChange={setBankId} />
        {stats.error ? <div className={P + 'errbanner'} role="alert"><span>统计读取失败：{stats.error}</span></div> : null}
        {stats.data ? (
          <dl className={P + 'kv'}>
            {Object.entries(stats.data).filter(([key]) => key !== 'bank_id').map(([key, value]) => (
              <div key={key} style={{ display: 'contents' }}>
                <dt>{STAT_LABELS[key] || key}</dt>
                <dd>
                  {value == null ? '—'
                    : typeof value === 'number' || typeof value === 'boolean' ? String(value)
                    : typeof value === 'string' ? (key.endsWith('_at') ? fmtTime(value) : value)
                    : '共 ' + Object.keys(value).length + ' 类'}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>

      <div className={P + 'card'}>
        <div className={P + 'cardhead'}>
          <h3 className={P + 'cardtitle'}>任务队列</h3>
          <div className={P + 'actions'}>
            <label className={P + 'check'}>
              <input type="checkbox" checked={autoRefresh} onChange={(event) => setAutoRefresh(event.target.checked)} />
              <span>每 15 秒自动刷新</span>
            </label>
            <button type="button" className={P + 'btn'} disabled={!bankId || queue.loading}
              onClick={() => { setOffset(0); loadQueue(0) }}>
              {queue.loading ? '读取中…' : '查询'}
            </button>
          </div>
        </div>
        <div className={P + 'field'}>
          <div className={P + 'label'}>筛选</div>
          <div className={P + 'control'}>
            <div className={P + 'actions'}>
              <select className={P + 'select'} style={{ width: 'auto' }} aria-label="按状态筛选"
                value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">全部状态</option>
                <option value="pending">待处理</option>
                <option value="processing">进行中</option>
                <option value="completed">已完成</option>
                <option value="failed">失败</option>
                <option value="cancelled">已取消</option>
              </select>
              <input className={P + 'input'} style={{ width: '180px' }} type="text" aria-label="按任务类型筛选"
                placeholder="任务类型（如 retain）" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} />
              <label className={P + 'check'}>
                <input type="checkbox" checked={excludeParents}
                  onChange={(event) => setExcludeParents(event.target.checked)} />
                <span>不含父任务</span>
              </label>
            </div>
            <div className={P + 'hint'}>筛选在点击「查询」后生效。</div>
          </div>
        </div>
        {queue.error ? <div className={P + 'errbanner'} role="alert"><span>队列读取失败：{queue.error}</span></div> : null}
        {queue.items ? (
          queue.items.length === 0 ? <div className={P + 'muted'}>没有符合条件的任务。</div> : (
            <table className={P + 'table'}>
              <thead>
                <tr><th>任务</th><th>类型</th><th>状态</th><th>创建时间</th><th>错误</th><th>操作</th></tr>
              </thead>
              {queue.items.map((row) => {
                const id = typeof row.operation_id === 'string' ? row.operation_id : ''
                const status = typeof row.status === 'string' ? row.status : ''
                const retryCap = cap('operationRetry')
                const cancelCap = cap('operationCancel')
                const deleteCap = cap('operationDelete')
                return (
                  <tbody key={id || JSON.stringify(row)}>
                    <tr>
                      <td className={P + 'mono'} title={id}>{shortId(id)}</td>
                      <td>{row.task_type ?? '—'}</td>
                      <td><OpPill status={status} /></td>
                      <td>{fmtTime(row.created_at)}</td>
                      <td>{typeof row.error_message === 'string' && row.error_message
                        ? (row.error_message.length > 60 ? row.error_message.slice(0, 60) + '…' : row.error_message)
                        : '—'}</td>
                      <td>
                        <div className={P + 'rowactions'}>
                          <button type="button" className={P + 'btn'} onClick={() => {
                            if (detailId === id) { setDetailId(null) } else { setDetailId(id); loadDetail(id) }
                          }}>{detailId === id ? '收起' : '详情'}</button>
                          <button type="button" className={P + 'btn'}
                            disabled={status !== 'failed' || !retryCap.ok}
                            title={status !== 'failed' ? '仅失败任务可重试' : (retryCap.reason || '')}
                            onClick={() => confirmRowAction(row, 'retry')}>重试</button>
                          <button type="button" className={P + 'btn'}
                            disabled={(status !== 'pending' && status !== 'processing') || !cancelCap.ok}
                            title={(status !== 'pending' && status !== 'processing') ? '仅待处理/进行中任务可取消' : (cancelCap.reason || '')}
                            onClick={() => confirmRowAction(row, 'cancel')}>取消</button>
                          <button type="button" className={P + 'btn ' + P + 'btndanger'}
                            disabled={(status === 'pending' || status === 'processing') || !deleteCap.ok}
                            title={(status === 'pending' || status === 'processing') ? '任务未结束，不能删除' : (deleteCap.reason || '')}
                            onClick={() => confirmRowAction(row, 'delete')}>删除</button>
                        </div>
                      </td>
                    </tr>
                    {detailId === id ? (
                      <tr>
                        <td colSpan={6}>
                          {detail.loading ? <div className={P + 'muted'} role="status">读取详情…</div> : null}
                          {detail.error ? <div className={P + 'errbanner'} role="alert"><span>{detail.error}</span></div> : null}
                          {detail.data ? (
                            <div className={P + 'control'}>
                              <dl className={P + 'kv'}>
                                <div style={{ display: 'contents' }}><dt>任务 ID</dt><dd className={P + 'mono'}>{detail.data.operation_id ?? id}</dd></div>
                                <div style={{ display: 'contents' }}><dt>状态</dt><dd><OpPill status={detail.data.status} /></dd></div>
                                <div style={{ display: 'contents' }}><dt>类型</dt><dd>{detail.data.task_type ?? '—'}</dd></div>
                                <div style={{ display: 'contents' }}><dt>创建时间</dt><dd>{fmtTime(detail.data.created_at)}</dd></div>
                                <div style={{ display: 'contents' }}><dt>开始时间</dt><dd>{fmtTime(detail.data.started_at)}</dd></div>
                                <div style={{ display: 'contents' }}><dt>完成时间</dt><dd>{fmtTime(detail.data.completed_at)}</dd></div>
                                <div style={{ display: 'contents' }}><dt>重试次数</dt><dd>{detail.data.retry_count ?? 0}{detail.data.next_retry_at ? '；下次重试 ' + fmtTime(detail.data.next_retry_at) : ''}</dd></div>
                                <div style={{ display: 'contents' }}><dt>错误信息</dt><dd>{detail.data.error_message || '—'}</dd></div>
                              </dl>
                              <OpProgress progress={detail.data.progress} />
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                )
              })}
            </table>
          )
        ) : (!queue.loading && !queue.error ? <div className={P + 'muted'}>选择记忆库后点击「查询」。</div> : null)}
        {queue.items && queue.items.length > 0 ? (
          <div className={P + 'actions'}>
            <button type="button" className={P + 'btn'} disabled={offset === 0 || queue.loading}
              onClick={() => { const next = Math.max(0, offset - QUEUE_PAGE); setOffset(next); loadQueue(next) }}>上一页</button>
            <span className={P + 'muted'}>
              第 {offset + 1}–{offset + queue.items.length} 条{queue.total !== null ? ' / 共 ' + queue.total + ' 条' : ''}
            </span>
            <button type="button" className={P + 'btn'}
              disabled={queue.loading || (queue.total !== null && offset + queue.items.length >= queue.total) || queue.items.length < QUEUE_PAGE}
              onClick={() => { const next = offset + QUEUE_PAGE; setOffset(next); loadQueue(next) }}>下一页</button>
          </div>
        ) : null}
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ *
 * memory：记忆与隐私设置 + API 凭据引用
 * ------------------------------------------------------------------ */

function buildMemoryBaseline(data) {
  const values = {}
  for (const [key, meta] of Object.entries(MEMORY_FIELDS)) {
    const entry = isRecord(data.fields) ? data.fields[key] : undefined
    const overridden = !!(entry && entry.configured === true && typeof entry.source === 'string' && entry.source !== 'default')
    const value = entry && 'value' in entry ? entry.value : meta.default
    values[key] = { set: overridden, text: valueToText(meta.kind, value) }
  }
  const apiAuth = isRecord(data.apiAuth) ? data.apiAuth : {}
  return {
    values,
    apiAuth: {
      mode: typeof apiAuth.mode === 'string' ? apiAuth.mode : 'inherit',
      reference: typeof apiAuth.reference === 'string' ? apiAuth.reference : '',
    },
  }
}

function diffMemory(baseline, draft) {  const changedKeys = []
  const unsetKeys = []
  for (const key of Object.keys(MEMORY_FIELDS)) {
    const b = baseline.values[key]
    const d = draft.values[key]
    if (!b || !d) continue
    if (b.set !== d.set) {
      if (d.set) changedKeys.push(key)
      else unsetKeys.push(key)
    } else if (d.set && b.text !== d.text) {
      changedKeys.push(key)
    }
  }
  const authChanged = baseline.apiAuth.mode !== draft.apiAuth.mode
    || (draft.apiAuth.mode === 'reference' && baseline.apiAuth.reference !== draft.apiAuth.reference)
  return { changedKeys, unsetKeys, authChanged }
}

function MemorySection({ active, apiUrl, request, cap, openConfirm }) {
  const [scope, setScope] = useState('dsh')
  const call = useChannel(request, apiUrl + '|' + scope)
  const [read, setRead] = useState(null)
  const [baseline, setBaseline] = useState(null)
  const [draft, setDraft] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [scopePrompt, setScopePrompt] = useState(null)

  const load = useCallback(async (targetScope) => {
    setLoading(true)
    setError(null)
    try {
      const res = await call({ op: 'settings', apiUrl, params: { scope: targetScope } })
      const data = isRecord(res.data) ? res.data : null
      if (!data || !isRecord(data.fields)) throw new Error('设置读取结果格式不符合预期。')
      const base = buildMemoryBaseline(data)
      setRead(data)
      setBaseline(base)
      setDraft(JSON.parse(JSON.stringify(base)))
    } catch (err) {
      if (isCancel(err)) return
      setError(errText(err))
      setRead(null)
      setBaseline(null)
      setDraft(null)
    } finally {
      setLoading(false)
    }
  }, [call, apiUrl])

  const loadedScopeRef = useRef(null)
  useEffect(() => {
    const identity = apiUrl + '|' + scope
    if (!active || loadedScopeRef.current === identity) return
    loadedScopeRef.current = identity
    load(scope)
  }, [active, scope, apiUrl, load])

  const dirty = baseline && draft ? diffMemory(baseline, draft) : null
  const isDirty = !!dirty && (dirty.changedKeys.length > 0 || dirty.unsetKeys.length > 0 || dirty.authChanged)
  const saveCap = cap('saveSettings')

  const onScopeSelect = (next) => {
    if (next === scope) return
    if (isDirty) setScopePrompt(next)
    else setScope(next)
  }

  const setValue = (key, patch) => {
    setDraft((prev) => prev ? { ...prev, values: { ...prev.values, [key]: { ...prev.values[key], ...patch } } } : prev)
  }

  const save = () => {
    if (!read || !baseline || !draft || !dirty) return
    const problems = []
    const patch = {}
    for (const key of dirty.changedKeys) {
      const meta = MEMORY_FIELDS[key]
      const result = textToValue(meta.kind, draft.values[key].text, meta)
      if (!result.ok) problems.push(meta.label + '：' + result.error)
      else patch[key] = result.value
    }
    if (dirty.authChanged && draft.apiAuth.mode === 'reference' && !draft.apiAuth.reference.trim()) {
      problems.push('API 凭据：reference 模式下必须填写凭据引用名')
    }
    if (problems.length > 0) {
      setError('请先修正：' + problems.join('；'))
      return
    }
    const params = {
      scope,
      patch,
      unset: dirty.unsetKeys,
      configRevision: read.configRevision ?? null,
      guiRevision: read.guiRevision ?? null,
    }
    if (dirty.authChanged) {
      params.apiAuth = { mode: draft.apiAuth.mode }
      if (draft.apiAuth.mode === 'reference') params.apiAuth.reference = draft.apiAuth.reference.trim()
    }
    openConfirm({
      title: '保存记忆与隐私设置',
      op: 'saveSettings',
      cost: COST_OPERATIONS.includes('saveSettings'),
      apiUrl,
      typedSubject: 'SETTINGS',
      riskNote: '记忆行为写入官方集成的配置作用域，认证引用写入本插件配置。已有工作区缓存可能需重新初始化；保存不保证下一轮生效，也不会自动重启。未变更字段不提交。',
      params,
      transport: 'request',
      timeoutMs: READ_TIMEOUT,
      summary: [
        { label: '作用域', value: scope },
        { label: '修改字段', value: String(dirty.changedKeys.length) + ' 个' },
        { label: '恢复继承', value: String(dirty.unsetKeys.length) + ' 个' },
        { label: 'API 凭据变更', value: dirty.authChanged ? '是' : '否' },
      ],
      onDone: () => { setNotice('设置已保存。'); load(scope) },
    })
  }

  const apiAuth = read && isRecord(read.apiAuth) ? read.apiAuth : null
  const warnings = read && Array.isArray(read.warnings) ? read.warnings : []

  return (
    <>
      <div className={P + 'card'}>
        <div className={P + 'cardhead'}>
          <h3 className={P + 'cardtitle'}>记忆与隐私设置</h3>
          <div className={P + 'actions'}>
            <select className={P + 'select'} style={{ width: 'auto' }} aria-label="配置作用域"
              value={scope} onChange={(event) => onScopeSelect(event.target.value)}>
              <option value="dsh">本插件（dsh）</option>
              <option value="global">全局（global）</option>
            </select>
            <button type="button" className={P + 'btn'} disabled={loading} onClick={() => load(scope)}>
              {loading ? '读取中…' : '重新读取'}
            </button>
          </div>
        </div>
        {error ? <div className={P + 'errbanner'} role="alert"><span>{error}</span></div> : null}
        {notice ? <div className={P + 'notice'} role="status">{notice}</div> : null}
        {loading && !read ? <div className={P + 'muted'} role="status">读取中…</div> : null}
        {read && draft ? (
          <>
            {read.runtimeApplied === 'unknown' ? (
              <div className={P + 'hint'}>运行中进程是否已应用这些设置：未知（重启后生效）。</div>
            ) : null}
            {warnings.map((warning, index) => <div key={index} className={P + 'risk'}>{String(warning)}</div>)}
            {Object.entries(MEMORY_FIELDS).map(([key, meta]) => {
              const entry = isRecord(read.fields) ? read.fields[key] : undefined
              const cell = draft.values[key]
              const source = entry && typeof entry.source === 'string' ? entry.source : null
              return (
                <div key={key} className={P + 'field'}>
                  <div className={P + 'label'}>{meta.label}</div>
                  <div className={P + 'control'}>
                    <label className={P + 'check'}>
                      <input type="checkbox" checked={cell.set}
                        aria-label={meta.label + '（覆盖生效值）'}
                        onChange={(event) => setValue(key, { set: event.target.checked })} />
                      <span>覆盖生效值（取消勾选则恢复继承）</span>
                    </label>
                    <KindEditor meta={meta} value={cell.text} disabled={!cell.set}
                      ariaLabel={meta.label} onChange={(text) => setValue(key, { text })} />
                    <div className={P + 'hint'}>
                      当前生效：{valueToText(meta.kind, entry && 'value' in entry ? entry.value : meta.default)}
                      {source ? '（来源：' + source + '）' : ''}
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        ) : null}
      </div>

      <div className={P + 'card'}>
        <div className={P + 'cardhead'}>
          <h3 className={P + 'cardtitle'}>API 凭据引用</h3>
        </div>
        <div className={P + 'hint'}>密钥本体永不显示、也不在此编辑；此处仅配置凭据引用模式与引用名。</div>
        {apiAuth ? (
          <dl className={P + 'kv'}>
            <div style={{ display: 'contents' }}><dt>当前模式</dt><dd>{apiAuth.mode ?? '未知'}</dd></div>
            <div style={{ display: 'contents' }}><dt>当前引用</dt><dd className={P + 'mono'}>{apiAuth.reference || '—'}</dd></div>
            <div style={{ display: 'contents' }}><dt>绑定 Base</dt><dd className={P + 'mono'}>{apiAuth.boundBase || '—'}</dd></div>
            <div style={{ display: 'contents' }}><dt>来源</dt><dd>{apiAuth.source ?? '未知'}{apiAuth.configured === true ? '（已配置）' : ''}</dd></div>
          </dl>
        ) : <div className={P + 'muted'}>{read ? '凭据状态未知。' : '读取设置后显示。'}</div>}
        {read && draft ? (
          <>
            <Field label="凭据模式">
              <select className={P + 'select'} aria-label="API 凭据模式" value={draft.apiAuth.mode}
                onChange={(event) => setDraft((prev) => prev ? {
                  ...prev,
                  apiAuth: { ...prev.apiAuth, mode: event.target.value },
                } : prev)}>
                <option value="inherit">继承（沿用宿主配置）</option>
                <option value="none">不携带凭据</option>
                <option value="reference">凭据引用</option>
              </select>
            </Field>
            {draft.apiAuth.mode === 'reference' ? (
              <Field label="引用名" hint="宿主凭据存储中的引用名，不是密钥本身。">
                <input className={P + 'input'} type="text" aria-label="API 凭据引用名"
                  value={draft.apiAuth.reference}
                  onChange={(event) => setDraft((prev) => prev ? {
                    ...prev,
                    apiAuth: { ...prev.apiAuth, reference: event.target.value },
                  } : prev)} />
              </Field>
            ) : null}
          </>
        ) : null}
        <div className={P + 'actions'}>
          <span className={P + 'muted'} role="status">
            {!read ? '尚未读取设置' : isDirty ? '有未保存的更改' : '与已保存设置一致'}
          </span>
          <button type="button" className={P + 'btn ' + P + 'btnprimary'}
            disabled={!read || !isDirty || loading || !saveCap.ok}
            title={!saveCap.ok ? (saveCap.reason || '') : ''}
            onClick={save}>保存设置</button>
        </div>
      </div>

      {scopePrompt ? (
        <div className={P + 'overlay'} onMouseDown={() => setScopePrompt(null)}>
          <div className={P + 'dialog'} role="dialog" aria-modal="true" aria-label="切换作用域"
            onMouseDown={(event) => event.stopPropagation()}>
            <h3 className={P + 'dlgtitle'}>切换作用域</h3>
            <div className={P + 'risk'}>当前作用域有未保存的草稿。切换到「{scopePrompt}」将丢弃这些草稿。</div>
            <div className={P + 'actions'}>
              <button type="button" className={P + 'btn'} autoFocus onClick={() => setScopePrompt(null)}>继续编辑（不切换）</button>
              <button type="button" className={P + 'btn ' + P + 'btndanger'}
                onClick={() => { setScope(scopePrompt); setScopePrompt(null); setNotice(null) }}>放弃草稿并切换</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

/* ------------------------------------------------------------------ *
 * security：库级配置（resolved/overrides + 按字段保存 + 全量重置）
 * ------------------------------------------------------------------ */

/** 统计当前覆盖数（兼容 fields 形状与旧的 config/overrides 形状）。 */
function countOverrides(read) {
  if (!isRecord(read)) return 0
  if (isRecord(read.fields)) {
    return Object.values(read.fields).filter((f) => isRecord(f) && f.hasOverride === true).length
  }
  if (isRecord(read.overrides)) return Object.keys(read.overrides).length
  return 0
}

/** 从 bankConfig 读取结果中取某个键的展示状态（覆盖标记 / 生效值 / 可编辑性）。 */
function bankFieldInfo(read, key) {
  const fields = isRecord(read) && isRecord(read.fields) ? read.fields : null
  const finfo = fields && isRecord(fields[key]) ? fields[key] : null
  if (finfo) {
    return {
      overridden: finfo.hasOverride === true,
      resolved: 'value' in finfo ? finfo.value : undefined,
      editable: finfo.editable !== false,
    }
  }
  const overrides = isRecord(read) && isRecord(read.overrides) ? read.overrides : null
  const config = isRecord(read) && isRecord(read.config) ? read.config : null
  return {
    overridden: overrides ? Object.prototype.hasOwnProperty.call(overrides, key) : false,
    resolved: config ? config[key] : undefined,
    editable: true,
  }
}

function SecuritySection({ active, apiUrl, banks, request, cap, openConfirm }) {
  const [bankId, setBankId] = useState('')
  const call = useChannel(request, apiUrl + '|' + bankId)
  const [read, setRead] = useState(null)
  const [baseline, setBaseline] = useState(null)
  const [draft, setDraft] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  const load = useCallback(async () => {
    if (!bankId) return
    setLoading(true)
    setError(null)
    try {
      const res = await call({ op: 'bankConfig', apiUrl, bankId })
      const data = isRecord(res.data) ? res.data : null
      if (!data) throw new Error('库配置读取结果格式不符合预期。')
      // 集成形状：fields[key] = { label, kind, choices, min, max, value, hasOverride, overrideValue }；
      // 兼容旧的 { config, overrides } 形状。fields 中白名单之外的键由后端保留，这里不展示。
      const hasFields = isRecord(data.fields)
      const hasLegacy = isRecord(data.config) && isRecord(data.overrides)
      if (!hasFields && !hasLegacy) throw new Error('库配置读取结果格式不符合预期。')
      const base = {}
      for (const [key, meta] of Object.entries(BANK_FIELDS)) {
        if (hasFields && isRecord(data.fields[key])) {
          const finfo = data.fields[key]
          const overridden = finfo.hasOverride === true
          base[key] = {
            set: overridden,
            text: valueToText(meta.kind, overridden ? finfo.overrideValue : finfo.value),
          }
        } else if (hasLegacy) {
          const overridden = Object.prototype.hasOwnProperty.call(data.overrides, key)
          base[key] = {
            set: overridden,
            text: valueToText(meta.kind, overridden ? data.overrides[key] : data.config[key]),
          }
        } else {
          base[key] = { set: false, text: valueToText(meta.kind, meta.default) }
        }
      }
      setRead(data)
      setBaseline(base)
      setDraft(JSON.parse(JSON.stringify(base)))
    } catch (err) {
      if (isCancel(err)) return
      setError(errText(err))
      setRead(null)
      setBaseline(null)
      setDraft(null)
    } finally {
      setLoading(false)
    }
  }, [call, apiUrl, bankId])

  const loadedBankRef = useRef(null)
  useEffect(() => {
    const identity = apiUrl + '|' + bankId
    if (!active || !bankId || loadedBankRef.current === identity) return
    loadedBankRef.current = identity
    load()
  }, [active, bankId, apiUrl, load])

  const changedKeys = baseline && draft
    ? Object.keys(BANK_FIELDS).filter((key) => {
      const b = baseline[key]
      const d = draft[key]
      return !!b && !!d && (b.set !== d.set || (d.set && b.text !== d.text))
    })
    : []
  const isDirty = changedKeys.length > 0
  const patchCap = cap('bankPatch')
  const resetCap = cap('bankReset')

  const setValue = (key, patchPart) => {
    setDraft((prev) => prev ? { ...prev, [key]: { ...prev[key], ...patchPart } } : prev)
  }

  const save = () => {
    if (!read || !draft) return
    const problems = []
    const updates = {}
    for (const key of changedKeys) {
      const meta = BANK_FIELDS[key]
      const cell = draft[key]
      if (!cell.set) {
        updates[key] = null
        continue
      }
      const result = textToValue(meta.kind, cell.text, meta)
      if (!result.ok) problems.push(meta.label + '：' + result.error)
      else updates[key] = result.value
    }
    if (problems.length > 0) {
      setError('请先修正：' + problems.join('；'))
      return
    }
    openConfirm({
      title: '保存库级配置覆盖',
      op: 'bankPatch',
      cost: COST_OPERATIONS.includes('bankPatch'),
      apiUrl,
      bankId,
      typedSubject: bankId,
      riskNote: '将按字段更新该记忆库的配置覆盖（null 表示恢复继承）。基于读取时的 revision 做乐观并发校验；若配置已被他人修改将返回 409，需要重新读取后再提交。',
      params: { updates, revision: read.revision ?? null },
      transport: 'request',
      timeoutMs: READ_TIMEOUT,
      summary: [
        { label: 'API', value: apiUrl },
        { label: '记忆库', value: bankId },
        { label: '变更字段', value: changedKeys.map((key) => BANK_FIELDS[key].label).join('、') },
      ],
      onDone: () => { setNotice('库级配置已保存。'); load() },
    })
  }

  const resetAll = () => {
    openConfirm({
      title: '重置该库全部覆盖',
      op: 'bankReset',
      cost: COST_OPERATIONS.includes('bankReset'),
      apiUrl,
      bankId,
      typedSubject: bankId,
      confirmLabel: '确认重置',
      riskNote: '将删除此库的全部配置覆盖，包括本页未展示的策略与 Memory Defense；所有字段恢复继承全局/默认设置。不删除记忆正文，但可能降低防护或改变后续行为。此操作不可撤销。',
      params: {},
      transport: 'request',
      timeoutMs: READ_TIMEOUT,
      summary: [
        { label: 'API', value: apiUrl },
        { label: '记忆库', value: bankId },
        { label: '当前覆盖数', value: String(countOverrides(read)) },
      ],
      onDone: () => { setNotice('该库的全部覆盖已重置。'); load() },
    })
  }

  return (
    <div className={P + 'card'}>
      <div className={P + 'cardhead'}>
        <h3 className={P + 'cardtitle'}>库级配置（按字段保存）</h3>
        <div className={P + 'actions'}>
          <button type="button" className={P + 'btn'} disabled={!bankId || loading} onClick={load}>
            {loading ? '读取中…' : '重新读取'}
          </button>
          <button type="button" className={P + 'btn ' + P + 'btndanger'}
            disabled={!read || loading || !resetCap.ok}
            title={!resetCap.ok ? (resetCap.reason || '') : ''}
            onClick={resetAll}>重置全部覆盖…</button>
        </div>
      </div>
      <BankPicker banks={banks} value={bankId} onChange={(next) => { setBankId(next); setNotice(null) }} />
      {error ? <div className={P + 'errbanner'} role="alert"><span>{error}</span></div> : null}
      {notice ? <div className={P + 'notice'} role="status">{notice}</div> : null}
      {loading && !read ? <div className={P + 'muted'} role="status">读取中…</div> : null}
      {!bankId ? <div className={P + 'muted'}>请先选择记忆库。</div> : null}
      {read && draft ? (
        <>
          {Object.entries(BANK_FIELDS).map(([key, meta]) => {
            const cell = draft[key]
            const info = bankFieldInfo(read, key)
            const editable = info.editable
            const overridden = info.overridden
            return (
              <div key={key} className={P + 'field'}>
                <div className={P + 'label'}>{meta.label}</div>
                <div className={P + 'control'}>
                  <label className={P + 'check'}>
                    <input type="checkbox" checked={cell.set} disabled={!editable}
                      aria-label={meta.label + '（覆盖）'}
                      onChange={(event) => setValue(key, { set: event.target.checked })} />
                    <span>覆盖（取消则恢复继承）</span>
                    {overridden ? <MgmtPill tone="warn">已覆盖</MgmtPill> : <MgmtPill tone="mute">继承</MgmtPill>}
                  </label>
                  <KindEditor meta={meta} value={cell.text} disabled={!cell.set || !editable}
                    ariaLabel={meta.label} onChange={(text) => setValue(key, { text })} />
                  <div className={P + 'hint'}>
                    生效值：{valueToText(meta.kind, info.resolved) || '—'}
                    {!editable ? '（服务端标记为不可编辑）' : ''}
                  </div>
                </div>
              </div>
            )
          })}
          <div className={P + 'actions'}>
            <span className={P + 'muted'} role="status">
              {isDirty ? '有 ' + changedKeys.length + ' 个字段待保存' : '与服务端配置一致'}
            </span>
            <button type="button" className={P + 'btn ' + P + 'btnprimary'}
              disabled={!isDirty || loading || !patchCap.ok}
              title={!patchCap.ok ? (patchCap.reason || '') : ''}
              onClick={save}>保存变更字段</button>
          </div>
        </>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * models：提示词预览 / 干跑提取 / LLM 健康
 * ------------------------------------------------------------------ */

const DRYRUN_FIELDS = {
  retain_mission: { label: '提取任务说明', kind: 'text' },
  retain_extraction_mode: { label: '提取模式', kind: 'choice', choices: ['concise', 'verbose', 'custom', 'verbatim', 'chunks'] },
  retain_custom_instructions: { label: '自定义提取指令', kind: 'text' },
  retain_chunk_size: { label: '提取分块大小', kind: 'integer', min: 1 },
  entities_allow_free_form: { label: '允许自由实体标签', kind: 'boolean' },
  llm_output_language: { label: '输出语言', kind: 'text' },
}

function ModelsSection({ active, apiUrl, banks, request, cap, features, openConfirm }) {
  const [bankId, setBankId] = useState('')
  // prompt preview
  const [pvOperation, setPvOperation] = useState('retain')
  const [pvStrategy, setPvStrategy] = useState('')
  const [pvResult, setPvResult] = useState(null)
  // dry run
  const [drContent, setDrContent] = useState('')
  const [drContext, setDrContext] = useState('')
  const [drStrategy, setDrStrategy] = useState('')
  const [drOverrides, setDrOverrides] = useState(() => {
    const init = {}
    for (const [key, meta] of Object.entries(DRYRUN_FIELDS)) {
      init[key] = { set: false, text: meta.kind === 'boolean' ? 'true' : '' }
    }
    return init
  })
  const [drResult, setDrResult] = useState(null)
  const [drError, setDrError] = useState(null)
  // llm health
  const [lhResult, setLhResult] = useState(null)

  useEffect(() => {
    setPvResult(null)
    setDrResult(null)
    setLhResult(null)
    setDrError(null)
  }, [apiUrl, bankId])

  const previewCap = cap('promptPreview')
  const dryRunCap = cap('dryRun')
  const llmCap = cap('llmTest')
  const healthFeature = features && features.bank_llm_health === true
  const healthReason = !features ? '特性未知：请先在「诊断」分类成功加载诊断信息'
    : healthFeature ? null : '服务端未启用 bank_llm_health 特性'

  const runPreview = () => {
    const params = { operation: pvOperation }
    if (pvStrategy.trim()) params.strategy = pvStrategy.trim()
    openConfirm({
      title: '预览提示词',
      op: 'promptPreview',
      cost: COST_OPERATIONS.includes('promptPreview'),
      apiUrl,
      bankId,
      typedSubject: bankId,
      riskNote: '读取该操作当前生效的提示词组成（不调用 LLM、不产生费用）。',
      params,
      transport: 'request',
      timeoutMs: READ_TIMEOUT,
      summary: [
        { label: 'API', value: apiUrl },
        { label: '记忆库', value: bankId },
        { label: '操作', value: pvOperation },
      ],
      onDone: (res) => { setPvResult(res && isRecord(res.data) ? res.data : null) },
    })
  }

  const runDryRun = () => {
    if (!drContent.trim()) {
      setDrError('候选文本不能为空。')
      return
    }
    const overrides = {}
    const problems = []
    for (const [key, cell] of Object.entries(drOverrides)) {
      if (!cell.set) continue
      const meta = DRYRUN_FIELDS[key]
      const result = textToValue(meta.kind, cell.text, meta)
      if (!result.ok) problems.push(meta.label + '：' + result.error)
      else overrides[key] = result.value
    }
    if (problems.length > 0) {
      setDrError('请先修正：' + problems.join('；'))
      return
    }
    setDrError(null)
    const params = { content: drContent }
    if (drContext.trim()) params.context = drContext.trim()
    if (drStrategy.trim()) params.strategy = drStrategy.trim()
    if (Object.keys(overrides).length > 0) params.overrides = overrides
    openConfirm({
      title: '干跑提取（调用 LLM）',
      op: 'dryRun',
      cost: COST_OPERATIONS.includes('dryRun'),
      apiUrl,
      bankId,
      typedSubject: bankId,
      riskNote: '将用候选文本调用一次真实 LLM 提取（不写入记忆库），会产生 LLM 调用费用。',
      params,
      transport: 'request',
      timeoutMs: SLOW_TIMEOUT,
      summary: [
        { label: 'API', value: apiUrl },
        { label: '记忆库', value: bankId },
        { label: '文本长度', value: String(drContent.length) + ' 字符' },
        { label: '候选字段覆盖', value: String(Object.keys(overrides).length) + ' 个' },
      ],
      onDone: (res) => { setDrResult(res && isRecord(res.data) ? res.data : null) },
    })
  }

  const runHealth = () => {
    openConfirm({
      title: 'LLM 连通性检测',
      op: 'llmTest',
      cost: COST_OPERATIONS.includes('llmTest'),
      apiUrl,
      bankId,
      typedSubject: bankId,
      riskNote: '将对 retain / consolidation / reflect 三个操作各发起一次真实 LLM 探测调用，会产生少量 LLM 调用费用。结果只包含状态，不暴露 provider/模型/端点。',
      params: {},
      transport: 'request',
      timeoutMs: SLOW_TIMEOUT,
      summary: [
        { label: 'API', value: apiUrl },
        { label: '记忆库', value: bankId },
      ],
      onDone: (res) => { setLhResult(res && isRecord(res.data) ? res.data : null) },
    })
  }

  return (
    <>
      <div className={P + 'card'}>
        <div className={P + 'cardhead'}>
          <h3 className={P + 'cardtitle'}>模型调试目标</h3>
        </div>
        <BankPicker banks={banks} value={bankId} onChange={setBankId} />
      </div>

      <div className={P + 'card'}>
        <div className={P + 'cardhead'}>
          <h3 className={P + 'cardtitle'}>提示词预览</h3>
          <button type="button" className={P + 'btn'} disabled={!bankId || !previewCap.ok}
            title={!previewCap.ok ? (previewCap.reason || '') : ''}
            onClick={runPreview}>预览</button>
        </div>
        <div className={P + 'actions'}>
          <select className={P + 'select'} style={{ width: 'auto' }} aria-label="预览操作"
            value={pvOperation} onChange={(event) => setPvOperation(event.target.value)}>
            <option value="retain">retain（提取）</option>
            <option value="consolidation">consolidation（整理）</option>
            <option value="reflect">reflect（反思）</option>
          </select>
          <input className={P + 'input'} style={{ width: '220px' }} type="text" aria-label="策略名（可选）"
            placeholder="策略名（可选）" value={pvStrategy} onChange={(event) => setPvStrategy(event.target.value)} />
        </div>
        {pvResult ? (
          <div className={P + 'control'}>
            {typeof pvResult.skipped_reason === 'string' && pvResult.skipped_reason ? (
              <div className={P + 'risk'}>该操作当前被跳过：{pvResult.skipped_reason}</div>
            ) : null}
            {Array.isArray(pvResult.strategies) && pvResult.strategies.length > 0 ? (
              <div className={P + 'hint'}>可用策略：{pvResult.strategies.join('、')}{pvResult.strategy ? '；当前：' + pvResult.strategy : ''}</div>
            ) : null}
            {Array.isArray(pvResult.messages) ? pvResult.messages.map((message, index) => (
              <div key={index} className={P + 'block'}>
                <div><MgmtPill tone={message.role === 'system' ? 'warn' : 'ok'}>{message.role || '未知角色'}</MgmtPill></div>
                {Array.isArray(message.blocks) ? message.blocks.map((block, blockIndex) => (
                  <div key={blockIndex} className={P + 'block' + (block.active === false ? ' ' + P + 'blockoff' : '')}>
                    <div className={P + 'actions'}>
                      {block.heading ? <strong>{block.heading}</strong> : null}
                      <MgmtPill tone={block.active === false ? 'mute' : 'ok'}>{block.active === false ? '停用' : '启用'}</MgmtPill>
                      {block.source ? <MgmtPill tone="mute">{block.source}</MgmtPill> : null}
                      {block.field ? <span className={P + 'mono'}>{block.field}</span> : null}
                      {block.editable === true ? <MgmtPill tone="warn">可覆盖</MgmtPill> : null}
                    </div>
                    {block.text ? <pre className={P + 'pre'}>{block.text}</pre> : <div className={P + 'muted'}>（空块）</div>}
                  </div>
                )) : null}
              </div>
            )) : <div className={P + 'muted'}>响应中没有 messages。</div>}
            {Array.isArray(pvResult.run_settings) && pvResult.run_settings.length > 0 ? (
              <table className={P + 'table'}>
                <thead><tr><th>运行设置</th><th>生效值</th><th>类型</th><th>可覆盖</th></tr></thead>
                <tbody>
                  {pvResult.run_settings.map((setting, index) => (
                    <tr key={index}>
                      <td className={P + 'mono'}>{setting.field}</td>
                      <td>{setting.value == null ? '（未设置）' : setting.value}</td>
                      <td>{setting.kind}</td>
                      <td>{setting.editable === true ? '是' : '否'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
            <div className={P + 'hint'}>
              响应 schema：{isRecord(pvResult.response_schema) ? '存在（' + Object.keys(pvResult.response_schema).length + ' 个顶层键）' : '无'}
            </div>
          </div>
        ) : <div className={P + 'muted'}>选择操作后点击「预览」。</div>}
      </div>

      <div className={P + 'card'}>
        <div className={P + 'cardhead'}>
          <h3 className={P + 'cardtitle'}>干跑提取（候选字段 + 费用确认）</h3>
          <button type="button" className={P + 'btn'} disabled={!bankId || !dryRunCap.ok || !drContent.trim()}
            title={!dryRunCap.ok ? (dryRunCap.reason || '') : ''}
            onClick={runDryRun}>干跑</button>
        </div>
        <Field label="候选文本">
          <textarea className={P + 'textarea'} aria-label="干跑候选文本" rows={5}
            placeholder="要用 LLM 试提取的文本（不会写入记忆库）" value={drContent}
            onChange={(event) => setDrContent(event.target.value)} />
        </Field>
        <Field label="上下文（可选）">
          <input className={P + 'input'} type="text" aria-label="干跑上下文" value={drContext}
            onChange={(event) => setDrContext(event.target.value)} />
        </Field>
        <Field label="策略（可选）">
          <input className={P + 'input'} type="text" aria-label="干跑策略名" value={drStrategy}
            onChange={(event) => setDrStrategy(event.target.value)} />
        </Field>
        {Object.entries(DRYRUN_FIELDS).map(([key, meta]) => {
          const cell = drOverrides[key]
          return (
            <div key={key} className={P + 'field'}>
              <div className={P + 'label'}>{meta.label}</div>
              <div className={P + 'control'}>
                <label className={P + 'check'}>
                  <input type="checkbox" checked={cell.set} aria-label={meta.label + '（本次覆盖）'}
                    onChange={(event) => setDrOverrides((prev) => ({ ...prev, [key]: { ...prev[key], set: event.target.checked } }))} />
                  <span>本次覆盖</span>
                </label>
                <KindEditor meta={meta} value={cell.text} disabled={!cell.set} ariaLabel={meta.label}
                  onChange={(text) => setDrOverrides((prev) => ({ ...prev, [key]: { ...prev[key], text } }))} />
              </div>
            </div>
          )
        })}
        {drError ? <div className={P + 'errbanner'} role="alert"><span>{drError}</span></div> : null}
        {drResult ? (
          <div className={P + 'control'}>
            {isRecord(drResult.usage) ? (
              <div className={P + 'notice'} role="status">
                Token 用量：输入 {drResult.usage.input_tokens ?? '—'}，输出 {drResult.usage.output_tokens ?? '—'}，
                总计 {drResult.usage.total_tokens ?? '—'}
                {typeof drResult.usage.cached_tokens === 'number' ? '，缓存 ' + drResult.usage.cached_tokens : ''}
              </div>
            ) : null}
            <div className={P + 'hint'}>
              提取到 {Array.isArray(drResult.facts) ? drResult.facts.length : 0} 条候选事实
              （{Array.isArray(drResult.chunks) ? drResult.chunks.length : 0} 个分块），未写入记忆库。
            </div>
            {Array.isArray(drResult.facts) ? drResult.facts.map((fact, index) => (
              <div key={index} className={P + 'block'}>
                <div>{fact.text}</div>
                <div className={P + 'actions'}>
                  {fact.fact_type ? <MgmtPill tone="mute">{fact.fact_type}</MgmtPill> : null}
                  {Array.isArray(fact.entities) && fact.entities.length > 0 ? (
                    <span className={P + 'muted'}>实体：{fact.entities.join('、')}</span>
                  ) : null}
                </div>
              </div>
            )) : null}
          </div>
        ) : null}
      </div>

      <div className={P + 'card'}>
        <div className={P + 'cardhead'}>
          <h3 className={P + 'cardtitle'}>LLM 连通性检测</h3>
          <button type="button" className={P + 'btn'}
            disabled={!bankId || !healthFeature || !llmCap.ok}
            title={healthReason || (!llmCap.ok ? (llmCap.reason || '') : '')}
            onClick={runHealth}>检测</button>
        </div>
        {healthReason ? <div className={P + 'muted'}>{healthReason}，检测不可用。</div> : null}
        {lhResult && Array.isArray(lhResult.operations) ? (
          <table className={P + 'table'}>
            <thead><tr><th>操作</th><th>结果</th><th>状态</th><th>延迟</th></tr></thead>
            <tbody>
              {lhResult.operations.map((entry, index) => (
                <tr key={index}>
                  <td className={P + 'mono'}>{entry.operation}</td>
                  <td><MgmtPill tone={entry.ok === true ? 'ok' : 'bad'}>{entry.ok === true ? '连通' : '失败'}</MgmtPill></td>
                  <td>{entry.status}</td>
                  <td>{typeof entry.latency_ms === 'number' ? Math.round(entry.latency_ms) + ' ms' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ *
 * advanced：别名 / 导出 / 导入（ZIP 上传）/ 克隆 / 下载
 * ------------------------------------------------------------------ */

/** 迁移提交响应的 operation id：DTO 同时提供 operation_id / operationId。 */
function submittedOperationId(res) {
  if (!isRecord(res) || !isRecord(res.data)) return null
  if (typeof res.data.operation_id === 'string' && res.data.operation_id) return res.data.operation_id
  if (typeof res.data.operationId === 'string' && res.data.operationId) return res.data.operationId
  return null
}

function AdvancedSection({ active, apiUrl, banks, request, cap, openConfirm }) {
  const [bankId, setBankId] = useState('')
  const call = useChannel(request, apiUrl + '|' + bankId)
  // aliases
  const [aliases, setAliases] = useState({ loading: false, error: null, list: null })
  const [newAlias, setNewAlias] = useState('')
  const [newPrimary, setNewPrimary] = useState(false)
  const [aliasError, setAliasError] = useState(null)
  // transfer forms
  const [exIncludeData, setExIncludeData] = useState(true)
  const [exIncludeConfig, setExIncludeConfig] = useState(true)
  const [exIncludeHistory, setExIncludeHistory] = useState(false)
  const [imMode, setImMode] = useState('restore')
  const [imTarget, setImTarget] = useState('')
  const [imConflict, setImConflict] = useState('skip')
  const [imIncludeData, setImIncludeData] = useState(true)
  const [imIncludeConfig, setImIncludeConfig] = useState(true)
  const [imIncludeHistory, setImIncludeHistory] = useState(false)
  const [fileInfo, setFileInfo] = useState(null)
  const [hashing, setHashing] = useState(false)
  const [importError, setImportError] = useState(null)
  const [clTarget, setClTarget] = useState('')
  const [clIncludeData, setClIncludeData] = useState(true)
  const [clIncludeConfig, setClIncludeConfig] = useState(true)
  const [clIncludeHistory, setClIncludeHistory] = useState(false)
  const [cloneError, setCloneError] = useState(null)
  // tracked async operations (202 → poll until terminal)
  const [tracked, setTracked] = useState([])
  const trackedRef = useRef([])
  trackedRef.current = tracked

  const loadAliases = useCallback(async () => {
    if (!bankId) return
    setAliases((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const res = await call({ op: 'aliases', apiUrl, bankId })
      const data = isRecord(res.data) ? res.data : {}
      setAliases({ loading: false, error: null, list: Array.isArray(data.aliases) ? data.aliases : [] })
    } catch (err) {
      if (isCancel(err)) return
      setAliases((prev) => ({ ...prev, loading: false, error: errText(err) }))
    }
  }, [call, apiUrl, bankId])

  useEffect(() => {
    if (active && bankId) loadAliases()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, bankId, apiUrl])

  useEffect(() => {
    setTracked([])
    setFileInfo(null)
    setImportError(null)
    setCloneError(null)
  }, [apiUrl])

  // Poll submitted async operations until terminal state (reads only; never re-issues writes).
  useEffect(() => {
    const timer = setInterval(async () => {
      const pending = trackedRef.current.filter((op) => op.status === 'pending' || op.status === 'processing')
      for (const op of pending) {
        try {
          const res = await call({ op: 'operation', apiUrl, bankId: op.bankId, params: { operationId: op.id } })
          const data = isRecord(res.data) ? res.data : {}
          setTracked((prev) => prev.map((item) => item.id === op.id ? {
            ...item,
            status: typeof data.status === 'string' ? data.status : 'unknown',
            progress: isRecord(data.progress) ? data.progress : null,
            error: typeof data.error_message === 'string' && data.error_message ? data.error_message : null,
            pollError: null,
          } : item))
        } catch (err) {
          if (isCancel(err)) continue
          setTracked((prev) => prev.map((item) => item.id === op.id
            ? { ...item, pollError: '状态暂时未知：' + errText(err) + '（继续轮询，不自动重做）' }
            : item))
        }
      }
    }, POLL_MS)
    return () => clearInterval(timer)
  }, [call, apiUrl])

  const addTracked = (kind, id, label) => {
    setTracked((prev) => [...prev, {
      id, bankId, kind, label, status: 'pending', progress: null, error: null, pollError: null,
    }])
  }

  const aliasAction = (action, alias, primary) => {
    const opName = action === 'add' ? 'aliasAdd' : action === 'primary' ? 'aliasPrimary' : 'aliasRemove'
    const titles = { add: '添加别名', primary: primary ? '设为主显别名' : '取消主显别名', remove: '移除别名' }
    const params = action === 'add' ? { alias, primary } : action === 'primary' ? { alias, primary } : { alias }
    openConfirm({
      title: titles[action],
      op: opName,
      cost: COST_OPERATIONS.includes(opName),
      apiUrl,
      bankId,
      typedSubject: bankId,
      riskNote: action === 'remove' ? '将移除该别名；引用旧别名的请求将不再路由到该库。' : '将更新该记忆库的别名路由。',
      params,
      transport: 'request',
      timeoutMs: READ_TIMEOUT,
      summary: [
        { label: 'API', value: apiUrl },
        { label: '记忆库', value: bankId },
        { label: '别名', value: alias },
      ],
      onDone: () => { setNewAlias(''); setNewPrimary(false); loadAliases() },
    })
  }

  const submitAlias = () => {
    const problem = aliasProblem(newAlias)
    if (problem) { setAliasError(problem); return }
    setAliasError(null)
    aliasAction('add', newAlias.trim(), newPrimary)
  }

  const submitExport = () => {
    openConfirm({
      title: '导出记忆库（异步）',
      op: 'transferExport',
      cost: COST_OPERATIONS.includes('transferExport'),
      apiUrl,
      bankId,
      typedSubject: bankId,
      riskNote: '将提交一次异步导出，产出 ZIP 归档。202 仅代表已受理：任务完成后才能下载。嵌入向量与内部 ID 不会随归档导出。',
      params: { includeData: exIncludeData, includeBankConfig: exIncludeConfig, includeHistory: exIncludeHistory },
      transport: 'request',
      timeoutMs: SLOW_TIMEOUT,
      summary: [
        { label: 'API', value: apiUrl },
        { label: '记忆库', value: bankId },
      ],
      onDone: (res) => {
        const id = submittedOperationId(res)
        if (id) addTracked('export', id, '导出')
      },
    })
  }

  const onFilePicked = async (event) => {
    const file = event.target.files && event.target.files[0]
    setImportError(null)
    setFileInfo(null)
    if (!file) return
    if (file.size > UPLOAD_LIMIT) {
      setImportError('文件超过 ' + fmtBytes(UPLOAD_LIMIT) + ' 上传上限。')
      return
    }
    if (file.size < 4) {
      setImportError('文件过小，不是有效的 ZIP 归档。')
      return
    }
    try {
      const head = new Uint8Array(await file.slice(0, 4).arrayBuffer())
      const isZip = head[0] === 0x50 && head[1] === 0x4b
        && ((head[2] === 0x03 && head[3] === 0x04) || (head[2] === 0x05 && head[3] === 0x06))
      if (!isZip) {
        setImportError('文件不是 ZIP 归档（缺少 PK 文件头）。')
        return
      }
      if (typeof crypto === 'undefined' || !crypto.subtle) {
        setImportError('当前环境无法计算 SHA-256 指纹（需要安全上下文），无法上传。')
        return
      }
      setHashing(true)
      const buffer = await file.arrayBuffer()
      const digest = await crypto.subtle.digest('SHA-256', buffer)
      const sha256 = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('')
      setFileInfo({ file, size: file.size, sha256 })
    } catch (err) {
      setImportError('读取文件失败：' + errText(err))
    } finally {
      setHashing(false)
    }
  }

  const submitImport = () => {
    if (!fileInfo) {
      setImportError('请先选择有效的 ZIP 归档。')
      return
    }
    if (imMode === 'restore' && !imTarget.trim()) {
      setImportError('restore 模式必须填写目标记忆库 ID。')
      return
    }
    setImportError(null)
    const params = {
      mode: imMode,
      fileSize: fileInfo.size,
      fileSha256: fileInfo.sha256,
    }
    if (imMode === 'restore') {
      params.targetBankId = imTarget.trim()
      params.includeData = imIncludeData
      params.includeBankConfig = imIncludeConfig
      params.includeHistory = imIncludeHistory
    } else {
      params.documentConflict = imConflict
    }
    openConfirm({
      title: '导入 ZIP 归档（异步）',
      op: 'transferImport',
      cost: COST_OPERATIONS.includes('transferImport'),
      apiUrl,
      bankId,
      typedSubject: bankId,
      riskNote: '将上传归档并提交异步导入。事实会以目标库的嵌入模型重新嵌入并重新解析实体；不调用 LLM 提取、不虚构新事实。202 仅代表已受理。文件大小与 SHA-256 指纹已绑定进确认令牌。',
      params,
      transport: 'upload',
      file: fileInfo.file,
      timeoutMs: SLOW_TIMEOUT,
      summary: [
        { label: 'API', value: apiUrl },
        { label: '任务所属库', value: bankId },
        { label: '文件', value: fileInfo.file.name + '（' + fmtBytes(fileInfo.size) + '）' },
        { label: 'SHA-256', value: fileInfo.sha256.slice(0, 16) + '…' },
        { label: '模式', value: imMode === 'restore' ? 'restore → ' + imTarget.trim() : 'merge（冲突：' + imConflict + '）' },
      ],
      onDone: (res) => {
        const id = submittedOperationId(res)
        if (id) addTracked('import', id, '导入')
        setFileInfo(null)
      },
    })
  }

  const submitClone = () => {
    if (!clTarget.trim()) {
      setCloneError('目标记忆库 ID 不能为空。')
      return
    }
    if (clTarget.trim() === bankId) {
      setCloneError('目标记忆库 ID 不能与源库相同。')
      return
    }
    setCloneError(null)
    openConfirm({
      title: '克隆记忆库（异步）',
      op: 'clone',
      cost: COST_OPERATIONS.includes('clone'),
      apiUrl,
      bankId,
      typedSubject: bankId,
      riskNote: '将把该库复制为一个新库（不重新提取、不调用 LLM，事实重新嵌入并重新解析实体）。'
        + (clIncludeConfig ? '注意：随配置一并复制的 webhook 会指向源库的 webhook 端点。' : ''),
      params: {
        targetBankId: clTarget.trim(),
        includeData: clIncludeData,
        includeBankConfig: clIncludeConfig,
        includeHistory: clIncludeHistory,
      },
      transport: 'request',
      timeoutMs: SLOW_TIMEOUT,
      summary: [
        { label: 'API', value: apiUrl },
        { label: '源库', value: bankId },
        { label: '目标库', value: clTarget.trim() },
      ],
      onDone: (res) => {
        const id = submittedOperationId(res)
        if (id) addTracked('clone', id, '克隆到 ' + clTarget.trim())
      },
    })
  }

  const downloadExport = (op) => {
    openConfirm({
      title: '下载导出归档',
      op: 'transferDownload',
      cost: COST_OPERATIONS.includes('transferDownload'),
      apiUrl,
      bankId: op.bankId,
      typedSubject: op.bankId,
      riskNote: '将通过同源桥接下载该导出任务产出的 ZIP 归档（上限 ' + fmtBytes(DOWNLOAD_LIMIT) + '）；上游下载地址与凭据不会暴露到页面。',
      params: { operationId: op.id },
      transport: 'download',
      timeoutMs: DOWNLOAD_TIMEOUT,
      confirmLabel: '确认下载',
      summary: [
        { label: 'API', value: apiUrl },
        { label: '记忆库', value: op.bankId },
        { label: '任务 ID', value: op.id },
      ],
      onDone: () => undefined,
    })
  }

  const cancelTracked = (op) => {
    openConfirm({
      title: '取消异步任务',
      op: 'operationCancel',
      cost: COST_OPERATIONS.includes('operationCancel'),
      apiUrl,
      bankId: op.bankId,
      typedSubject: op.bankId,
      riskNote: '将请求取消该异步任务；已开始执行的部分无法回滚。',
      params: { operationId: op.id },
      transport: 'request',
      timeoutMs: READ_TIMEOUT,
      summary: [
        { label: 'API', value: apiUrl },
        { label: '记忆库', value: op.bankId },
        { label: '任务 ID', value: op.id },
      ],
      onDone: () => undefined,
    })
  }

  const exportCap = cap('transferExport')
  const importCap = cap('transferImport')
  const cloneBaseCap = cap('clone')
  // 克隆走导出+导入管道：需要 clone 自身能力与 transferExport/transferImport 双特性同时可用。
  const cloneCap = !cloneBaseCap.ok ? cloneBaseCap
    : !exportCap.ok ? { ok: false, reason: '克隆需要导出能力：' + (exportCap.reason || '不可用') }
    : !importCap.ok ? { ok: false, reason: '克隆需要导入能力：' + (importCap.reason || '不可用') }
    : cloneBaseCap
  const downloadCap = cap('transferDownload')
  const cancelCap = cap('operationCancel')
  const aliasAddCap = cap('aliasAdd')

  return (
    <>
      <div className={P + 'card'}>
        <div className={P + 'cardhead'}>
          <h3 className={P + 'cardtitle'}>高级操作目标</h3>
        </div>
        <BankPicker banks={banks} value={bankId} onChange={setBankId} />
      </div>

      <div className={P + 'card'}>
        <div className={P + 'cardhead'}>
          <h3 className={P + 'cardtitle'}>别名</h3>
          <button type="button" className={P + 'btn'} disabled={!bankId || aliases.loading} onClick={loadAliases}>
            {aliases.loading ? '读取中…' : '刷新别名'}
          </button>
        </div>
        {aliases.error ? <div className={P + 'errbanner'} role="alert"><span>别名读取失败：{aliases.error}</span></div> : null}
        {aliases.list ? (
          aliases.list.length === 0 ? <div className={P + 'muted'}>该库暂无别名。</div> : (
            <table className={P + 'table'}>
              <thead><tr><th>别名</th><th>主显</th><th>操作</th></tr></thead>
              <tbody>
                {aliases.list.map((entry, index) => {
                  const name = typeof entry.alias === 'string' ? entry.alias : String(entry.alias ?? '')
                  const primary = entry.primary === true
                  const primaryCap = cap('aliasPrimary')
                  const removeCap = cap('aliasRemove')
                  return (
                    <tr key={name || index}>
                      <td>{name}</td>
                      <td>{primary ? <MgmtPill tone="ok">主显</MgmtPill> : <MgmtPill tone="mute">普通</MgmtPill>}</td>
                      <td>
                        <div className={P + 'rowactions'}>
                          <button type="button" className={P + 'btn'} disabled={!primaryCap.ok}
                            title={!primaryCap.ok ? (primaryCap.reason || '') : ''}
                            onClick={() => aliasAction('primary', name, !primary)}>
                            {primary ? '取消主显' : '设为主显'}
                          </button>
                          <button type="button" className={P + 'btn ' + P + 'btndanger'} disabled={!removeCap.ok}
                            title={!removeCap.ok ? (removeCap.reason || '') : ''}
                            onClick={() => aliasAction('remove', name)}>移除</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )
        ) : (!aliases.loading && !aliases.error ? <div className={P + 'muted'}>选择记忆库后自动读取别名。</div> : null)}
        <div className={P + 'field'}>
          <div className={P + 'label'}>新增别名</div>
          <div className={P + 'control'}>
            <div className={P + 'actions'}>
              <input className={P + 'input'} style={{ width: '260px' }} type="text" aria-label="新别名"
                placeholder="UTF-8 名称（可中文）" value={newAlias}
                onChange={(event) => { setNewAlias(event.target.value); setAliasError(null) }} />
              <label className={P + 'check'}>
                <input type="checkbox" checked={newPrimary} onChange={(event) => setNewPrimary(event.target.checked)} />
                <span>同时设为主显</span>
              </label>
              <button type="button" className={P + 'btn'} disabled={!bankId || !newAlias.trim() || !aliasAddCap.ok}
                title={!aliasAddCap.ok ? (aliasAddCap.reason || '') : ''}
                onClick={submitAlias}>添加…</button>
            </div>
            <div className={P + 'hint'}>≤192 字节（UTF-8），不含控制字符与斜杠，不能是路径片段。</div>
            {aliasError ? <div className={P + 'errbanner'} role="alert"><span>{aliasError}</span></div> : null}
          </div>
        </div>
      </div>

      <div className={P + 'card'}>
        <div className={P + 'cardhead'}>
          <h3 className={P + 'cardtitle'}>导出（异步 ZIP）</h3>
          <button type="button" className={P + 'btn'} disabled={!bankId || !exportCap.ok}
            title={!exportCap.ok ? (exportCap.reason || '') : ''}
            onClick={submitExport}>提交导出…</button>
        </div>
        <div className={P + 'actions'}>
          <label className={P + 'check'}>
            <input type="checkbox" checked={exIncludeData} onChange={(event) => setExIncludeData(event.target.checked)} />
            <span>包含数据（文档/事实/观察/附件/操作日志）</span>
          </label>
          <label className={P + 'check'}>
            <input type="checkbox" checked={exIncludeConfig} onChange={(event) => setExIncludeConfig(event.target.checked)} />
            <span>包含库配置</span>
          </label>
          <label className={P + 'check'}>
            <input type="checkbox" checked={exIncludeHistory} onChange={(event) => setExIncludeHistory(event.target.checked)} />
            <span>包含历史（audit_log / llm_requests）</span>
          </label>
        </div>
      </div>

      <div className={P + 'card'}>
        <div className={P + 'cardhead'}>
          <h3 className={P + 'cardtitle'}>导入（ZIP 上传）</h3>
          <button type="button" className={P + 'btn'}
            disabled={!bankId || !fileInfo || hashing || !importCap.ok}
            title={!importCap.ok ? (importCap.reason || '') : ''}
            onClick={submitImport}>上传并导入…</button>
        </div>
        {!bankId ? (
          <div className={P + 'hint'}>
            导入（含 restore）要求任务记录库已存在：restore 的 URL 记录库必须已存在、目标库必须不存在，服务端不会自动创建记录库。
            当前没有可用记忆库时，请先通过官方入口创建一个库，再回到此处导入。
          </div>
        ) : null}
        <div className={P + 'actions'}>
          <label className={P + 'check'}>
            <input type="radio" name={P + 'immode'} checked={imMode === 'restore'} onChange={() => setImMode('restore')} />
            <span>restore（恢复到新库）</span>
          </label>
          <label className={P + 'check'}>
            <input type="radio" name={P + 'immode'} checked={imMode === 'merge'} onChange={() => setImMode('merge')} />
            <span>merge（合并进所选库）</span>
          </label>
        </div>
        {imMode === 'restore' ? (
          <>
            <Field label="目标库 ID" hint="restore 会在该 ID 下创建新库；不能是已存在的库。">
              <input className={P + 'input'} type="text" aria-label="导入目标库 ID" value={imTarget}
                onChange={(event) => setImTarget(event.target.value)} />
            </Field>
            <div className={P + 'actions'}>
              <label className={P + 'check'}>
                <input type="checkbox" checked={imIncludeData} onChange={(event) => setImIncludeData(event.target.checked)} />
                <span>包含数据</span>
              </label>
              <label className={P + 'check'}>
                <input type="checkbox" checked={imIncludeConfig} onChange={(event) => setImIncludeConfig(event.target.checked)} />
                <span>包含库配置</span>
              </label>
              <label className={P + 'check'}>
                <input type="checkbox" checked={imIncludeHistory} onChange={(event) => setImIncludeHistory(event.target.checked)} />
                <span>包含历史</span>
              </label>
            </div>
          </>
        ) : (
          <Field label="冲突处理">
            <select className={P + 'select'} aria-label="文档冲突处理" value={imConflict}
              onChange={(event) => setImConflict(event.target.value)}>
              <option value="skip">skip（跳过已存在文档）</option>
              <option value="replace">replace（替换已存在文档）</option>
              <option value="new-id">new-id（以新 ID 导入）</option>
            </select>
          </Field>
        )}
        <Field label="ZIP 归档" hint={'≤' + fmtBytes(UPLOAD_LIMIT) + '；浏览器本地校验文件头并计算 SHA-256，指纹随确认令牌绑定。'}>
          <input className={P + 'input'} type="file" accept=".zip,application/zip" aria-label="选择 ZIP 归档"
            onChange={onFilePicked} />
        </Field>
        {hashing ? <div className={P + 'muted'} role="status">正在计算 SHA-256 指纹…</div> : null}
        {fileInfo ? (
          <div className={P + 'notice'} role="status">
            已就绪：{fileInfo.file.name}（{fmtBytes(fileInfo.size)}），SHA-256 {fileInfo.sha256.slice(0, 16)}…
          </div>
        ) : null}
        {importError ? <div className={P + 'errbanner'} role="alert"><span>{importError}</span></div> : null}
      </div>

      <div className={P + 'card'}>
        <div className={P + 'cardhead'}>
          <h3 className={P + 'cardtitle'}>克隆（异步）</h3>
          <button type="button" className={P + 'btn'} disabled={!bankId || !clTarget.trim() || !cloneCap.ok}
            title={!cloneCap.ok ? (cloneCap.reason || '') : ''}
            onClick={submitClone}>提交克隆…</button>
        </div>
        <Field label="目标库 ID" hint="在该 ID 下创建源库的副本；不能是已存在的库。">
          <input className={P + 'input'} type="text" aria-label="克隆目标库 ID" value={clTarget}
            onChange={(event) => { setClTarget(event.target.value); setCloneError(null) }} />
        </Field>
        <div className={P + 'actions'}>
          <label className={P + 'check'}>
            <input type="checkbox" checked={clIncludeData} onChange={(event) => setClIncludeData(event.target.checked)} />
            <span>包含数据</span>
          </label>
          <label className={P + 'check'}>
            <input type="checkbox" checked={clIncludeConfig} onChange={(event) => setClIncludeConfig(event.target.checked)} />
            <span>包含库配置（含 webhook）</span>
          </label>
          <label className={P + 'check'}>
            <input type="checkbox" checked={clIncludeHistory} onChange={(event) => setClIncludeHistory(event.target.checked)} />
            <span>包含历史</span>
          </label>
        </div>
        {cloneError ? <div className={P + 'errbanner'} role="alert"><span>{cloneError}</span></div> : null}
      </div>

      <div className={P + 'card'}>
        <div className={P + 'cardhead'}>
          <h3 className={P + 'cardtitle'}>已提交的异步任务</h3>
        </div>
        {tracked.length === 0 ? <div className={P + 'muted'}>本会话尚未提交导出/导入/克隆任务。202 受理的任务会出现在这里并自动轮询到终态。</div> : (
          <div className={P + 'control'}>
            {tracked.map((op) => (
              <div key={op.id} className={P + 'block'}>
                <div className={P + 'actions'}>
                  <MgmtPill tone="mute">{op.label}</MgmtPill>
                  <OpPill status={op.status} />
                  <span className={P + 'mono'} title={op.id}>{shortId(op.id)}</span>
                  <span className={P + 'muted'}>库：{op.bankId}</span>
                </div>
                <OpProgress progress={op.progress} />
                {op.error ? <div className={P + 'errbanner'} role="alert"><span>{op.error}</span></div> : null}
                {op.pollError ? <div className={P + 'risk'}>{op.pollError}</div> : null}
                <div className={P + 'rowactions'}>
                  {op.kind === 'export' && op.status === 'completed' ? (
                    <button type="button" className={P + 'btn ' + P + 'btnprimary'} disabled={!downloadCap.ok}
                      title={!downloadCap.ok ? (downloadCap.reason || '') : ''}
                      onClick={() => downloadExport(op)}>下载归档…</button>
                  ) : null}
                  {op.status === 'pending' || op.status === 'processing' ? (
                    <button type="button" className={P + 'btn'} disabled={!cancelCap.ok}
                      title={!cancelCap.ok ? (cancelCap.reason || '') : ''}
                      onClick={() => cancelTracked(op)}>取消任务…</button>
                  ) : null}
                  {op.status === 'completed' && op.kind !== 'export' ? (
                    <span className={P + 'muted'} role="status">任务已完成。</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ *
 * 面板主体
 * ------------------------------------------------------------------ */

/**
 * 管理面板。props 契约见 docs/management-implementation.md：
 * { category, apiUrl, banks, request, upload, download, onChanged }。
 */
export default function ManagementPanel(props) {
  ensureMgmtStyles()
  const { category, apiUrl, banks, request, upload, download, onChanged } = props
  const bankList = Array.isArray(banks) ? banks : []

  /* ---- diagnostics（能力发现的唯一来源） ---- */
  const diagCall = useChannel(request, apiUrl)
  const [diag, setDiag] = useState({ loading: false, error: null, data: null })
  const loadDiag = useCallback(async () => {
    setDiag((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const res = await diagCall({ op: 'diagnostics', apiUrl })
      setDiag({ loading: false, error: null, data: isRecord(res.data) ? res.data : null })
    } catch (err) {
      if (isCancel(err)) return
      setDiag((prev) => ({ ...prev, loading: false, error: errText(err) }))
    }
  }, [diagCall, apiUrl])
  useEffect(() => {
    setDiag({ loading: false, error: null, data: null })
    loadDiag()
  }, [loadDiag])

  const diagOps = diag.data && isRecord(diag.data.operations) ? diag.data.operations : null
  const features = diag.data && isRecord(diag.data.features) ? diag.data.features : null
  /** 能力未知一律禁用动作。 */
  const cap = useCallback((op) => {
    if (!diagOps) return { ok: false, reason: '能力未知：请先在「诊断」分类成功加载诊断信息' }
    const entry = diagOps[op]
    if (!isRecord(entry) || entry.enabled !== true) {
      const reason = isRecord(entry) && typeof entry.reason === 'string' && entry.reason
        ? entry.reason
        : '服务端未声明该能力'
      return { ok: false, reason }
    }
    return { ok: true, reason: null }
  }, [diagOps])

  /* ---- 统一确认对话框：prepare → 一次性令牌 → 冻结快照执行 ---- */
  const [confirmSpec, setConfirmSpec] = useState(null)
  const openConfirm = useCallback((spec) => setConfirmSpec(spec), [])
  const apiUrlRef = useRef(apiUrl)
  apiUrlRef.current = apiUrl
  const execCtrlsRef = useRef(new Set())
  useEffect(() => () => {
    const ctrls = execCtrlsRef.current
    for (const controller of ctrls) controller.abort()
    ctrls.clear()
  }, [])
  useEffect(() => {
    // API 目标切换：中止在途确认执行并关闭对话框（令牌随目标作废）。
    const ctrls = execCtrlsRef.current
    for (const controller of ctrls) controller.abort()
    ctrls.clear()
    setConfirmSpec(null)
  }, [apiUrl])

  const executeConfirmed = useCallback(async (spec, setPhase) => {
    if (spec.apiUrl !== apiUrlRef.current) {
      throw new Error('API 目标已变更，本次确认已作废，请重新发起操作。')
    }
    const controller = new AbortController()
    execCtrlsRef.current.add(controller)
    try {
      setPhase('正在请求确认令牌…')
      const prepInput = { op: 'prepare', apiUrl: spec.apiUrl, params: {
        action: spec.op,
        parameters: spec.params || {},
        typedSubject: spec.typedSubject,
        acceptRisk: true,
      } }
      if (spec.bankId) prepInput.bankId = spec.bankId
      if (spec.cost === true) prepInput.params.acceptCost = true
      const prep = await request(prepInput, { signal: controller.signal, timeoutMs: READ_TIMEOUT })
      if (!isRecord(prep) || (typeof prep.apiUrl === 'string' && prep.apiUrl !== spec.apiUrl)) {
        throw new Error('确认令牌响应与目标不一致，操作已中止。')
      }
      const token = isRecord(prep.data) && typeof prep.data.confirmationToken === 'string'
        && prep.data.confirmationToken.length > 0 ? prep.data.confirmationToken : null
      if (!token) throw new Error('宿主未返回有效的确认令牌，操作未执行。')
      setPhase(spec.transport === 'download' ? '正在下载…' : spec.transport === 'upload' ? '正在上传…' : '正在执行…')
      const input = { op: spec.op, apiUrl: spec.apiUrl, params: spec.params || {}, confirmationToken: token }
      if (spec.bankId) input.bankId = spec.bankId
      const options = { signal: controller.signal, timeoutMs: spec.timeoutMs || READ_TIMEOUT }
      if (spec.transport === 'upload') {
        const res = await upload(input, spec.file, options)
        verifyEcho(input, res)
        return res
      }
      if (spec.transport === 'download') {
        await download(input, options)
        return null
      }
      const res = await request(input, options)
      verifyEcho(input, res)
      return res
    } finally {
      execCtrlsRef.current.delete(controller)
    }
  }, [request, upload, download])

  const handleDialogClose = (success, res) => {
    const spec = confirmSpec
    setConfirmSpec(null)
    if (success && spec) {
      if (typeof onChanged === 'function') onChanged()
      if (typeof spec.onDone === 'function') spec.onDone(res)
    }
  }

  const common = { apiUrl, banks: bankList, request, cap, openConfirm }

  return (
    <div className={P + 'root'}>
      <section className={P + 'section'} hidden={category !== 'overview'} aria-label="诊断与任务队列">
        <OverviewSection {...common} active={category === 'overview'} diag={diag} reloadDiag={loadDiag} />
      </section>
      <section className={P + 'section'} hidden={category !== 'memory'} aria-label="记忆与隐私设置">
        <MemorySection {...common} active={category === 'memory'} />
      </section>
      <section className={P + 'section'} hidden={category !== 'security'} aria-label="库级配置">
        <SecuritySection {...common} active={category === 'security'} />
      </section>
      <section className={P + 'section'} hidden={category !== 'models'} aria-label="模型调试">
        <ModelsSection {...common} active={category === 'models'} features={features} />
      </section>
      <section className={P + 'section'} hidden={category !== 'advanced'} aria-label="高级迁移与别名">
        <AdvancedSection {...common} active={category === 'advanced'} />
      </section>
      {confirmSpec ? (
        <ConfirmDialog spec={confirmSpec} onClose={handleDialogClose} onExecute={executeConfirmed} />
      ) : null}
    </div>
  )
}
