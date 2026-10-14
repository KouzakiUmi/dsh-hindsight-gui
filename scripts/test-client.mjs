// 离线组件测试：把 src/client/index.tsx 用 esbuild 编成 CJS（write:false 纯内存，
// 不触碰 lib/ 与文件系统），在 node:vm 里用假 React hooks 引擎渲染 PanelPage，
// 以假 fetch 驱动，验证状态轮询/baseline/CAS/服务门控等契约行为。
// 用法：node scripts/test-client.mjs
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// ---------------------------------------------------------------------------
// 1. 编译 src → CJS 字符串（write:false，outputFiles 取文本）
// ---------------------------------------------------------------------------
const { outputFiles } = await build({
  entryPoints: [join(root, 'src', 'client', 'index.tsx')],
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  jsx: 'automatic',
  external: ['react', 'react/jsx-runtime'],
  logLevel: 'silent',
  target: ['es2022'],
  write: false,
})
const bundle = outputFiles[0].text

// ---------------------------------------------------------------------------
// 2. 假 React hooks 引擎（只实现本组件用到的 hooks）
// ---------------------------------------------------------------------------
const FRAGMENT = Symbol.for('react.fragment')

function depsEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false
  return a.every((x, i) => Object.is(x, b[i]))
}

function createHarness() {
  const instances = new Set()
  const dirtyQueue = new Set()
  let current = null
  let flushing = false

  function renderInstance(instance) {
    instance.cursor = 0
    instance.pendingEffects = {}
    const prevChildMap = instance.childMap
    instance.childMap = new Map()
    current = instance
    let out
    try {
      out = instance.type(instance.props)
    } finally {
      current = null
    }
    instance.childList = normalize(out, instance, '', prevChildMap)
    // 清理不再出现的子组件
    for (const [key, child] of prevChildMap) {
      if (!instance.childMap.has(key)) unmount(child)
    }
    // effects：按真实 hook 索引迭代（effect 索引前面还有 state/ref 等 hooks，
    // 绝不假设从 0 连续）；deps 变化才重跑
    const indices = new Set()
    for (let i = 0; i < instance.effects.length; i++) indices.add(i)
    for (const k of Object.keys(instance.pendingEffects)) indices.add(Number(k))
    const nextEffects = instance.effects.slice()
    for (const i of [...indices].sort((a, b) => a - b)) {
      const old = instance.effects[i]
      const pending = instance.pendingEffects[i]
      if (!pending) {
        if (old && old.cleanup) old.cleanup()
        nextEffects[i] = undefined
        continue
      }
      if (old && depsEqual(old.deps, pending.deps)) {
        nextEffects[i] = old
        continue
      }
      if (old && old.cleanup) old.cleanup()
      const cleanup = pending.fn()
      nextEffects[i] = { deps: pending.deps, cleanup: typeof cleanup === 'function' ? cleanup : undefined }
    }
    instance.effects = nextEffects
  }

  function normalize(node, parent, keyPath, prevChildMap) {
    if (node === null || node === undefined || node === true || node === false) return []
    if (typeof node === 'string' || typeof node === 'number') return [{ kind: 'text', text: String(node) }]
    if (Array.isArray(node)) return node.flatMap((n, i) => normalize(n, parent, keyPath + '.' + i, prevChildMap))
    if (node.kind === 'fragment') return normalize(node.children, parent, keyPath + '.f', prevChildMap)
    if (typeof node.type === 'function') {
      const key = keyPath + '#' + (node.type.name || 'anon')
      // 从上一轮的 childMap 复用实例，保住 hooks/effects 状态
      let child = prevChildMap.get(key)
      if (child) {
        child.props = node.props || {}
        renderInstance(child)
      } else {
        child = { type: node.type, props: node.props || {}, hooks: [], cursor: 0, effects: [], pendingEffects: {}, childMap: new Map(), childList: [], parent }
        renderInstance(child)
      }
      parent.childMap.set(key, child)
      instances.add(child)
      return [{ kind: 'component', instance: child }]
    }
    const host = { kind: 'host', tag: node.type, props: node.props || {}, children: normalize(node.props ? node.props.children : undefined, parent, keyPath + '.h', prevChildMap) }
    if (typeof host.props.ref === 'function') host.props.ref({ focus() { fakeDocument.activeId = host.props.id } })
    return [host]
  }

  function unmount(instance) {
    instances.delete(instance)
    for (const effect of instance.effects) {
      if (effect && effect.cleanup) effect.cleanup()
    }
    for (const child of instance.childMap.values()) unmount(child)
    instance.childMap.clear()
    instance.childList = []
  }

  const React = {
    useState(init) {
      const inst = current
      const idx = inst.cursor++
      if (inst.hooks[idx] === undefined) inst.hooks[idx] = { value: typeof init === 'function' ? init() : init }
      const hook = inst.hooks[idx]
      const setValue = (v) => {
        const next = typeof v === 'function' ? v(hook.value) : v
        if (!Object.is(next, hook.value)) {
          hook.value = next
          dirtyQueue.add(inst)
        }
      }
      return [hook.value, setValue]
    },
    useRef(init) {
      const inst = current
      const idx = inst.cursor++
      if (inst.hooks[idx] === undefined) inst.hooks[idx] = { current: init }
      return inst.hooks[idx]
    },
    useMemo(fn, deps) {
      const inst = current
      const idx = inst.cursor++
      const h = inst.hooks[idx]
      if (h === undefined || !depsEqual(h.deps, deps)) {
        const value = fn()
        inst.hooks[idx] = { deps, value }
        return value
      }
      return h.value
    },
    useCallback(fn, deps) {
      const inst = current
      const idx = inst.cursor++
      const h = inst.hooks[idx]
      if (h === undefined || !depsEqual(h.deps, deps)) inst.hooks[idx] = { deps, value: fn }
      return inst.hooks[idx].value
    },
    useEffect(fn, deps) {
      const inst = current
      const idx = inst.cursor++
      inst.pendingEffects[idx] = { fn, deps }
    },
  }

  const jsxRuntime = {
    Fragment: FRAGMENT,
    jsx(type, props) { return typeof type === 'symbol' ? { kind: 'fragment', children: props ? props.children : undefined } : { type, props } },
    jsxs(type, props) { return jsxRuntime.jsx(type, props) },
  }

  return {
    React,
    jsxRuntime,
    mount(type, props) {
      const inst = { type, props, hooks: [], cursor: 0, effects: [], pendingEffects: {}, childMap: new Map(), childList: [], parent: null }
      instances.add(inst)
      renderInstance(inst)
      this.flush()
      return inst
    },
    flush() {
      if (flushing) return
      flushing = true
      try {
        let guard = 0
        while (dirtyQueue.size > 0 && guard++ < 500) {
          const batch = [...dirtyQueue]
          dirtyQueue.clear()
          for (const inst of batch) {
            if (instances.has(inst)) renderInstance(inst)
          }
        }
        if (dirtyQueue.size > 0) throw new Error('test renderer did not settle')
      } finally {
        flushing = false
      }
    },
    async settle() {
      // Drain the whole microtask queue, including Promise.race/finally chains,
      // rather than assuming each request has at most eight continuations.
      for (let i = 0; i < 2; i++) {
        await new Promise(resolve => setImmediate(resolve))
        this.flush()
      }
    },
    unmount(inst) { unmount(inst) },
  }
}

// ---------------------------------------------------------------------------
// 3. 查询/事件辅助
// ---------------------------------------------------------------------------
function hostNodes(root, includeHidden = false) {
  const out = []
  const rec = (nodes) => {
    for (const n of nodes ?? []) {
      if (n.kind === 'host') {
        if (n.props.hidden && !includeHidden) continue
        out.push(n)
        rec(n.tag === 'details' && !n.props.open && !includeHidden
          ? n.children.filter((child) => child.kind === 'host' && child.tag === 'summary')
          : n.children)
      } else if (n.kind === 'component') rec(n.instance.childList)
    }
  }
  rec(root.childList)
  return out
}

function textOfNode(node) {
  const acc = []
  const rec = (n) => {
    if (!n) return
    if (Array.isArray(n)) return n.forEach(rec)
    if (n.kind === 'text') acc.push(n.text)
    else if (n.kind === 'host' && !n.props.hidden) rec(n.tag === 'details' && !n.props.open
      ? n.children.filter((child) => child.kind === 'host' && child.tag === 'summary')
      : n.children)
    else if (n.kind === 'component') rec(n.instance.childList)
  }
  rec(node)
  return acc.join('')
}

function pageText(root) { return textOfNode(root.childList) }

function buttonByText(root, text) {
  return hostNodes(root).find((n) => n.tag === 'button' && textOfNode(n).includes(text))
}

function inputs(root, type) {
  return hostNodes(root).filter((n) => n.tag === 'input' && (type === undefined || n.props.type === type))
}

function apiUrlInput(root) {
  return inputs(root, 'text').find((n) => n.props.placeholder === 'http://localhost:8888')
}

function defenseToggle(root) {
  const label = hostNodes(root).find((n) => n.tag === 'label' && textOfNode(n).includes('脱敏'))
  return label ? label.children.find((n) => n.kind === 'host' && n.tag === 'input') : undefined
}

function click(node) { assert.ok(node, 'expected a visible clickable element'); node.props.onClick({ preventDefault() {}, target: {} }) }
function detailsBySummary(root, title) {
  return hostNodes(root).find((n) => n.tag === 'details' && n.children.some((child) =>
    child.kind === 'host' && child.tag === 'summary' && textOfNode(child).includes(title)))
}
function toggleDetails(harness, root, title) {
  const details = detailsBySummary(root, title)
  assert.ok(details, `details ${title} exists`)
  const initial = details.props.open === true
  click(details.children.find((child) => child.kind === 'host' && child.tag === 'summary'))
  harness.flush()
  assert.equal(detailsBySummary(root, title).props.open, !initial, `${title} toggled`)
}
function switchTab(harness, root, name) {
  const tab = hostNodes(root).find((n) => n.props.role === 'tab' && textOfNode(n).startsWith(name))
  assert.ok(tab, `tab ${name} exists`)
  click(tab)
  harness.flush()
  assert.equal(tabByName(root, name).props['aria-selected'], true, `tab ${name} selected`)
}
function tabByName(root, name) {
  return hostNodes(root).find((n) => n.props.role === 'tab' && textOfNode(n).startsWith(name))
}
function change(node, value) { node.props.onChange({ target: { value } }) }
function check(node, checked) { node.props.onChange({ target: { checked } }) }

// ---------------------------------------------------------------------------
// 4. fetch mock
// ---------------------------------------------------------------------------
function createFetchMock() {
  const calls = []
  const pending = []
  const fn = (url, opts = {}) => {
    const call = { url: String(url), method: opts.method ?? 'GET', headers: opts.headers ?? {}, body: opts.body }
    calls.push(call)
    return new Promise((resolve, reject) => pending.push({ call, resolve, reject }))
  }
  fn.calls = calls
  fn.pendingCount = () => pending.length
  fn.respond = async (matcher, { status = 200, payload }) => {
    const match = typeof matcher === 'function' ? matcher : (url) => url.includes(matcher)
    const idx = pending.findIndex((p) => match(p.call.url, p.call))
    if (idx === -1) throw new Error('no pending fetch matching ' + String(matcher))
    const [p] = pending.splice(idx, 1)
    p.resolve({ ok: status >= 200 && status < 300, status, json: async () => payload })
    await Promise.resolve()
  }
  fn.count = (substr) => calls.filter((c) => c.url.includes(substr)).length
  fn.last = (substr) => [...calls].reverse().find((c) => c.url.includes(substr))
  return fn
}

// ---------------------------------------------------------------------------
// 5. 宿主环境：VM sandbox
// ---------------------------------------------------------------------------
const fakeDocument = {
  visibilityState: 'visible',
  querySelector: () => null,
  getElementById: () => null,
  createElement: () => ({ dataset: {}, style: {} }),
  head: { appendChild() {} },
}

function loadModule(harness, fetchMock, clock = {}) {
  const sandbox = {
    console, fetch: fetchMock, document: fakeDocument, AbortController, TextEncoder, TextDecoder, Blob, File, crypto: globalThis.crypto,
    setTimeout, clearTimeout, setInterval, clearInterval, ...clock,
    Date, URL, Promise, JSON, Math, Object, Array, Set, Map, Symbol, String, Number, Boolean,
    Error, TypeError, RangeError, RegExp, Reflect, Proxy,
    encodeURIComponent, decodeURIComponent, parseInt, parseFloat, isNaN, NaN,
  }
  sandbox.globalThis = sandbox
  vm.createContext(sandbox)
  const wrapped = '(function(require, module, exports) {\n' + bundle + '\n})'
  const script = new vm.Script(wrapped, { filename: 'client.cjs' })
  const mod = { exports: {} }
  const fakeRequire = (id) => {
    if (id === 'react') return harness.React
    if (id === 'react/jsx-runtime') return harness.jsxRuntime
    throw new Error('unexpected require: ' + id)
  }
  script.runInContext(sandbox)(fakeRequire, mod, mod.exports)
  return mod.exports
}

// ---------------------------------------------------------------------------
// 6. 测试设施
// ---------------------------------------------------------------------------
function baseStatus(over = {}) {
  const status = {
    api: { url: 'http://127.0.0.1:8888', up: true, state: 'ok', status: 'ready', database: 'postgres', error: null },
    controlPlane: { url: 'http://127.0.0.1:9999', up: true },
    config: {
      path: '/c/config.json', exists: true, revision: 'cfg-rev-1', error: null,
      values: { disabled: false, apiUrl: 'http://127.0.0.1:8888', logLevel: 'info', autoUpdate: true, codebaseSurvey: false, surveyModel: '', bankId: '', dynamicBankId: true },
      extraKeys: [],
    },
    gui: {
      path: '/c/gui.json', controlPlaneUrl: 'http://127.0.0.1:9999', source: 'file', revision: 'gui-rev-1',
      serverModels: {}, auditLogEnabled: false, autoStart: false, serverCommand: '',
      providerOverrides: {}, serverEnv: [], pendingRestart: false,
      serverEmbeddings: { provider: '', model: '', baseUrl: '', dimensions: null, apiKeyEnv: '', localForceCpu: null, secretConfigured: false },
    },
    server: {
      port: 8888, up: true, ownership: 'managed', canStart: false, canRestart: true, operation: null,
      entry: { command: 'hindsight-api', source: 'PATH' }, managedPid: 1234, startedAt: '2026-10-12T00:00:00Z',
      lastAction: null, autoStart: false, pendingRestart: false, auditLogEnabled: false,
      runtimeConfigKnown: true,
      embeddingPreview: { provider: 'local', model: 'legacy-model', baseUrl: null, dimensions: null, credentialSource: null, secretConfigured: false, source: 'serverEnv', mode: 'inherit', note: '旧配置继承预览', warnings: [] },
      runningConfig: { fingerprint: 'fp-1', startedAt: '2026-10-12T00:00:00Z', resolutions: [], auditLogEnabled: false },
      resolutions: [],
    },
    banks: [],
    banksError: null,
  }
  return Object.assign(status, over)
}

async function mountPage(fetchMock, { status, models, tab = '记忆与连接', clock } = {}) {
  const harness = createHarness()
  const mod = loadModule(harness, fetchMock, clock)
  let Page = null
  const ctx = {
    slots: {
      inject(_slot, fn) { fn() },
      register(reg, component) { if (reg && reg.name === 'main') Page = component; return () => {} },
    },
  }
  mod.apply(ctx)
  assert.ok(typeof Page === 'function', 'page component captured')
  const root = harness.mount(Page, {})
  if (status) await fetchMock.respond('/status', { payload: status })
  if (models) await fetchMock.respond('/models', { payload: models })
  await harness.settle()
  switchTab(harness, root, tab)
  return { harness, root, mod }
}

const MODELS_OK = { providers: [{ id: 'deepseek', name: 'DeepSeek', models: [{ id: 'deepseek-chat' }] }], errors: [], state: 'ok', sampledAt: '2026-10-12T17:00:00Z' }

function fakeClock() {
  let id = 0
  const timeouts = new Map()
  const intervals = new Map()
  return {
    setTimeout(fn, ms) { const key = ++id; timeouts.set(key, { fn, ms }); return key },
    clearTimeout(key) { timeouts.delete(key) },
    setInterval(fn, ms) { const key = ++id; intervals.set(key, { fn, ms }); return key },
    clearInterval(key) { intervals.delete(key) },
    expire(ms) {
      for (const [key, timer] of [...timeouts]) if (timer.ms === ms) { timeouts.delete(key); timer.fn() }
    },
    poll() { for (const timer of intervals.values()) timer.fn() },
    pending() { return timeouts.size + intervals.size },
  }
}

// ---------------------------------------------------------------------------
// 7. 用例
// ---------------------------------------------------------------------------
const tests = []
function test(name, fn) { tests.push([name, fn]) }

test('15秒轮询不覆盖 dirty 草稿；discard 回到最新服务器状态', async () => {
  const fetchMock = createFetchMock()
  const { harness, root } = await mountPage(fetchMock, { status: baseStatus(), models: MODELS_OK })

  change(apiUrlInput(root), 'http://127.0.0.1:7777')
  harness.flush()
  assert.ok(pageText(root).includes('有未保存的更改'), 'dirty hint shown')

  // 模拟一次轮询：服务器上的值变了
  switchTab(harness, root, '概览')
  click(buttonByText(root, '刷新状态'))
  const statusB = baseStatus()
  statusB.config.values.apiUrl = 'http://127.0.0.1:8888'
  statusB.config.revision = 'cfg-rev-2'
  statusB.controlPlane.url = 'http://127.0.0.1:9998'
  await fetchMock.respond('/status', { payload: statusB })
  await harness.settle()

  switchTab(harness, root, '记忆与连接')
  assert.equal(apiUrlInput(root).props.value, 'http://127.0.0.1:7777', 'draft survives the poll')
  assert.ok(pageText(root).includes('有未保存的更改'), 'still dirty after poll')

  click(buttonByText(root, '放弃更改'))
  harness.flush()
  assert.equal(apiUrlInput(root).props.value, 'http://127.0.0.1:8888', 'discard resets to newest server state')
  assert.ok(!pageText(root).includes('有未保存的更改'), 'clean after discard')
})

test('保存成功重设 baseline；保存期间的新输入不丢失且保持 dirty', async () => {
  const fetchMock = createFetchMock()
  const { harness, root } = await mountPage(fetchMock, { status: baseStatus(), models: MODELS_OK })

  change(apiUrlInput(root), 'http://127.0.0.1:7001')
  harness.flush()
  click(buttonByText(root, '保存'))
  harness.flush()
  const configCall = fetchMock.last('/config')
  assert.equal(configCall.method, 'POST')
  assert.equal(JSON.parse(configCall.body).apiUrl, 'http://127.0.0.1:7001')

  // 保存尚未返回时继续编辑
  change(apiUrlInput(root), 'http://127.0.0.1:7002')
  harness.flush()

  const saved = baseStatus()
  saved.config.values.apiUrl = 'http://127.0.0.1:7001'
  saved.config.revision = 'cfg-rev-2'
  await fetchMock.respond('/config', { payload: Object.assign(saved, { saved: ['apiUrl'] }) })
  await harness.settle()

  assert.ok(pageText(root).includes('已保存'), 'save notice shown')
  assert.equal(apiUrlInput(root).props.value, 'http://127.0.0.1:7002', 'in-flight edit kept')
  assert.ok(pageText(root).includes('有未保存的更改'), 'in-flight edit still dirty vs new baseline')

  click(buttonByText(root, '保存'))
  harness.flush()
  const second = baseStatus()
  second.config.values.apiUrl = 'http://127.0.0.1:7002'
  await fetchMock.respond('/config', { payload: Object.assign(second, { saved: ['apiUrl'] }) })
  await harness.settle()
  assert.ok(!pageText(root).includes('有未保存的更改'), 'clean after second save')
})

test('保存发送 configRevision/guiRevision；409 冲突不丢草稿且提示需显式 discard', async () => {
  const fetchMock = createFetchMock()
  const { harness, root } = await mountPage(fetchMock, { status: baseStatus(), models: MODELS_OK })

  change(apiUrlInput(root), 'http://127.0.0.1:7777')
  harness.flush()
  click(buttonByText(root, '保存'))
  harness.flush()
  const body = JSON.parse(fetchMock.last('/config').body)
  assert.equal(body.configRevision, 'cfg-rev-1')
  assert.equal(body.guiRevision, 'gui-rev-1')

  await fetchMock.respond('/config', { status: 409, payload: { error: 'config revision conflict' } })
  await harness.settle()
  assert.ok(pageText(root).includes('409'), '409 surfaced')
  assert.ok(pageText(root).includes('已全部保留'), 'drafts declared kept')
  assert.ok(pageText(root).includes('放弃更改'), 'points at explicit discard to reload the baseline')
  assert.equal(apiUrlInput(root).props.value, 'http://127.0.0.1:7777', 'draft intact after 409')
  assert.ok(pageText(root).includes('有未保存的更改'), 'still dirty after 409')
})

test('保存成功使在途 status 轮询失效，迟到的 poll 不覆盖保存结果', async () => {
  const fetchMock = createFetchMock()
  const { harness, root } = await mountPage(fetchMock, { status: baseStatus(), models: MODELS_OK })

  change(apiUrlInput(root), 'http://127.0.0.1:7001')
  harness.flush()
  click(buttonByText(root, '保存'))
  harness.flush()
  // 保存尚未返回时又触发一次轮询
  switchTab(harness, root, '概览')
  click(buttonByText(root, '刷新状态'))
  harness.flush()

  const saved = baseStatus()
  saved.config.values.apiUrl = 'http://127.0.0.1:7001'
  saved.config.revision = 'cfg-rev-2'
  await fetchMock.respond('/config', { payload: Object.assign(saved, { saved: ['apiUrl'] }) })
  await harness.settle()
  switchTab(harness, root, '记忆与连接')
  assert.equal(apiUrlInput(root).props.value, 'http://127.0.0.1:7001', 'saved value shown')
  assert.ok(!pageText(root).includes('有未保存的更改'), 'clean after save')

  // 迟到的轮询携带保存前的旧数据：必须被丢弃
  const stale = baseStatus()
  stale.config.values.apiUrl = 'http://127.0.0.1:8888'
  await fetchMock.respond('/status', { payload: stale })
  await harness.settle()
  assert.equal(apiUrlInput(root).props.value, 'http://127.0.0.1:7001', 'late poll ignored after save')
  assert.ok(!pageText(root).includes('有未保存的更改'), 'still clean after late poll')
})

test('providerOverrides：空 apiKey=保留，非空=替换，clearApiKey=true 清除；secretConfigured 仅展示', async () => {
  const fetchMock = createFetchMock()
  const status = baseStatus()
  status.gui.providerOverrides = { demo: { provider: 'demo', baseUrl: 'https://api.demo.dev/v1', apiKeyEnv: '', secretConfigured: true } }
  const { harness, root } = await mountPage(fetchMock, { status, models: MODELS_OK, tab: '模型' })
  assert.equal(detailsBySummary(root, 'Provider 覆盖').props.open, false, 'override editor starts closed')
  assert.equal(inputs(root, 'password').find((input) => input.props.placeholder === '已保存 Key（输入以替换）'), undefined, 'closed editor is not queryable')
  toggleDetails(harness, root, 'Provider 覆盖')

  const password = inputs(root, 'password').find((input) => input.props.placeholder === '已保存 Key（输入以替换）')
  assert.equal(password.props.value, '', 'no stored key material in the draft')
  assert.ok(pageText(root).includes('已配置 Key'), 'secretConfigured badge shown')

  change(password, 'sk-new-key')
  harness.flush()
  assert.ok(pageText(root).includes('有未保存的更改'), 'typing a key is dirty')
  click(buttonByText(root, '保存'))
  harness.flush()
  let body = JSON.parse(fetchMock.last('/config').body)
  assert.equal(body.providerOverrides.demo.apiKey, 'sk-new-key', 'non-empty key replaces')
  assert.ok(!('clearApiKey' in body.providerOverrides.demo), 'no clear flag on replace')

  const saved = baseStatus()
  saved.gui.providerOverrides = { demo: { provider: 'demo', baseUrl: 'https://api.demo.dev/v1', apiKeyEnv: '', secretConfigured: true } }
  saved.config.revision = 'cfg-rev-2'
  await fetchMock.respond('/config', { payload: Object.assign(saved, { saved: ['providerOverrides'] }) })
  await harness.settle()
  assert.equal(inputs(root, 'password').find((input) => input.props.placeholder === '已保存 Key（输入以替换）').props.value, '', 'draft key cleared after save (host never echoes it)')
  assert.ok(!pageText(root).includes('有未保存的更改'), 'submitted key no longer keeps the page dirty')

  click(buttonByText(root, '清除已存 Key'))
  harness.flush()
  assert.ok(pageText(root).includes('将清除已保存的 Key'), 'clear intent shown')
  click(buttonByText(root, '保存'))
  harness.flush()
  body = JSON.parse(fetchMock.last('/config').body)
  assert.equal(body.providerOverrides.demo.clearApiKey, true, 'clearApiKey sent')
  assert.ok(!('apiKey' in body.providerOverrides.demo), 'no apiKey alongside clear')
})

test('bankdefense：读取失败=unknown 且禁止写入；API 地址变更重置 cache；POST 不带 action', async () => {
  const fetchMock = createFetchMock()
  const status = baseStatus()
  status.banks = [{ id: 'bank-a', name: 'A', facts: 3, updatedAt: null }]
  const { harness, root } = await mountPage(fetchMock, { status, models: MODELS_OK, tab: '安全' })

  await fetchMock.respond('/bankdefense', { status: 500, payload: { error: 'boom' } })
  await harness.settle()
  assert.ok(pageText(root).includes('策略未知'), 'unknown policy shown')
  assert.ok(pageText(root).includes('boom'), 'read error shown')
  assert.equal(defenseToggle(root).props.disabled, true, 'toggle disabled when policy unknown')

  // API 地址变更 → cache 重置 → 重新读取
  const statusB = baseStatus()
  statusB.api.url = 'http://127.0.0.1:8899'
  statusB.banks = [{ id: 'bank-a', name: 'A', facts: 3, updatedAt: null }]
  switchTab(harness, root, '概览')
  click(buttonByText(root, '刷新状态'))
  await fetchMock.respond('/status', { payload: statusB })
  await harness.settle()
  switchTab(harness, root, '安全')
  assert.ok(fetchMock.count('/bankdefense') >= 2, 'policy re-read after API base change')
  assert.ok(fetchMock.last('/bankdefense').url.includes('apiUrl='), 'GET carries the API base for host check')
  await fetchMock.respond('/bankdefense', { payload: { bank: 'bank-a', memoryDefense: { enabled: true, rules: [{ on: 'sensitive_data', action: 'redact' }] } } })
  await harness.settle()
  const enabled = defenseToggle(root)
  assert.equal(enabled.props.disabled, false, 'toggle enabled after successful read')
  assert.equal(enabled.props.checked, true, 'policy applied')

  check(enabled, false)
  harness.flush()
  const postCall = fetchMock.last('/bankdefense')
  assert.equal(postCall.method, 'POST')
  const postBody = JSON.parse(postCall.body)
  assert.equal(postBody.bankId, 'bank-a')
  assert.equal(postBody.enabled, false)
  assert.equal(postBody.apiUrl, 'http://127.0.0.1:8899', 'POST carries the API base for host CAS')
  assert.ok(!('action' in postBody), 'no action field — host reads current policy')
  await fetchMock.respond('/bankdefense', { payload: { bank: 'bank-a', memoryDefense: { enabled: false, rules: [] } } })
  await harness.settle()
  assert.equal(defenseToggle(root).props.checked, false, 'toggle off applied')
})

test('bankdefense：HTTP 422 显示失败并恢复原开关，不冒称已保存', async () => {
  const fetchMock = createFetchMock()
  const status = baseStatus()
  status.banks = [{ id:'bank-a', name:'A', facts:0, updatedAt:null }]
  const { harness, root } = await mountPage(fetchMock,{status,models:MODELS_OK,tab:'安全'})
  await fetchMock.respond('/bankdefense',{payload:{bank:'bank-a',memoryDefense:{enabled:false,rules:[]}}})
  await harness.settle()
  check(defenseToggle(root),true)
  harness.flush()
  await fetchMock.respond('/bankdefense',{status:422,payload:{error:'Hindsight 请求失败（HTTP 422）；上游错误正文不回传以避免泄露凭据'}})
  await harness.settle()
  assert.equal(defenseToggle(root).props.checked,false,'restore the last confirmed policy')
  assert.equal(defenseToggle(root).props.disabled,false,'failed write does not leave loading stuck')
  assert.ok(pageText(root).includes('HTTP 422'))
  harness.unmount(root)
  await harness.settle()
})

test('bankdefense canonical 判定：strong block 不算 enabled', async () => {
  const fetchMock = createFetchMock()
  const status = baseStatus()
  status.banks = [{ id: 'bank-strong', name: 'S', facts: 1, updatedAt: null }]
  const { harness, root } = await mountPage(fetchMock, { status, models: MODELS_OK, tab: '安全' })

  await fetchMock.respond('/bankdefense', {
    payload: { bank: 'bank-strong', memoryDefense: { enabled: true, rules: [{ on: 'sensitive_data', action: 'block', severity: 'strict' }] } },
  })
  await harness.settle()
  const toggle = defenseToggle(root)
  assert.equal(toggle.props.disabled, false, 'readable policy is toggleable')
  assert.equal(toggle.props.checked, false, 'strong block policy does not count as the simple redact rule')

  check(toggle, true)
  harness.flush()
  await fetchMock.respond('/bankdefense', {
    payload: { bank: 'bank-strong', memoryDefense: { enabled: true, rules: [{ on: 'sensitive_data', action: 'redact' }] } },
  })
  await harness.settle()
  assert.equal(defenseToggle(root).props.checked, true, 'canonical redact rule counts as enabled')
})

test('bankdefense：API 切换后旧基地的迟到响应不落新 cache', async () => {
  const fetchMock = createFetchMock()
  const status = baseStatus()
  status.banks = [{ id: 'bank-c', name: 'C', facts: 2, updatedAt: null }]
  const { harness, root } = await mountPage(fetchMock, { status, models: MODELS_OK, tab: '安全' })
  // 第一个 GET（旧基地 8888）仍在途

  const statusB = baseStatus()
  statusB.api.url = 'http://127.0.0.1:8899'
  statusB.banks = [{ id: 'bank-c', name: 'C', facts: 2, updatedAt: null }]
  switchTab(harness, root, '概览')
  click(buttonByText(root, '刷新状态'))
  await fetchMock.respond('/status', { payload: statusB })
  await harness.settle()
  switchTab(harness, root, '安全')
  assert.ok(fetchMock.pendingCount() >= 1, 'second GET issued for the new base')

  // 旧基地的响应晚到：必须被代次守卫丢弃（不得写进新 cache）
  await fetchMock.respond('/bankdefense', {
    payload: { bank: 'bank-c', memoryDefense: { enabled: true, rules: [{ on: 'sensitive_data', action: 'redact' }] } },
  })
  await harness.settle()
  assert.equal(defenseToggle(root).props.disabled, true, 'stale response dropped — still loading')

  await fetchMock.respond('/bankdefense', {
    payload: { bank: 'bank-c', memoryDefense: { enabled: false, rules: [] } },
  })
  await harness.settle()
  const toggle = defenseToggle(root)
  assert.equal(toggle.props.disabled, false, 'new-base response applied')
  assert.equal(toggle.props.checked, false, 'new-base policy value used')
})

test('模型发现：error/partial 明确展示，空列表不当成功', async () => {
  const fetchMock = createFetchMock()
  const { harness, root } = await mountPage(fetchMock, {
    status: baseStatus(), tab: '模型',
    models: { providers: [], errors: [{ provider: 'deepseek', error: 'timeout' }], state: 'error', sampledAt: null },
  })
  assert.ok(pageText(root).includes('无法获取 DSH 模型列表'), 'model discovery error shown')
  assert.ok(pageText(root).includes('timeout'), 'underlying error visible')

  click(buttonByText(root, '刷新 DSH 模型'))
  await fetchMock.respond('/models', {
    payload: { providers: [{ id: 'ok', name: 'OK', models: [{ id: 'm1' }] }], errors: [{ provider: 'deepseek', error: 'timeout' }], state: 'partial', sampledAt: '2026-10-12T17:05:00Z' },
  })
  await harness.settle()
  assert.ok(pageText(root).includes('部分 Provider 模型获取失败'), 'partial failure shown')
  assert.ok(pageText(root).includes('采样于 2026-10-12T17:05:00Z'), 'sampledAt shown')
})

test('服务门控：unmanaged 禁重启；operation 期间按钮禁用；legacy host 默认禁重启；runningConfig 展示', async () => {
  const status = baseStatus()
  status.server.ownership = 'unmanaged'
  status.server.canStart = false
  status.server.canRestart = false
  status.server.pendingRestart = true
  status.server.runtimeConfigKnown = false
  const first = await mountPage(createFetchMock(), { status, models: MODELS_OK, tab: '概览' })
  assert.equal(buttonByText(first.root, '立即重启生效').props.disabled, true, 'pending banner obeys ownership fence too')
  assert.ok(pageText(first.root).includes('当前实例配置未知'), 'pending restart never claims an unmanaged instance runs old config')

  const restartBtn = buttonByText(first.root, '重启服务')
  assert.equal(restartBtn.props.disabled, true, 'restart disabled for unmanaged')
  assert.equal(buttonByText(first.root, '启动服务').props.disabled, true, 'start disabled when canStart false')
  assert.ok(pageText(first.root).includes('外部进程'), 'ownership shown')

  const opStatus = baseStatus()
  opStatus.server.ownership = 'managed'
  opStatus.server.canRestart = true
  opStatus.server.operation = 'restart'
  const second = await mountPage(createFetchMock(), { status: opStatus, models: MODELS_OK, tab: '概览' })
  assert.equal(buttonByText(second.root, '重启中…').props.disabled, true, 'button disabled while host operation in flight')
  assert.ok(!pageText(second.root).includes('fp-1'), 'technical snapshot is collapsed initially')
  toggleDetails(second.harness,second.root,'启动与运行详情')
  assert.ok(pageText(second.root).includes('运行中配置') && pageText(second.root).includes('fp-1'), 'runningConfig available when expanded')

  // 旧 host：没有 ownership/can* 契约，重启一律默认拒绝（可能是别人的进程）
  const legacy = baseStatus()
  delete legacy.server.ownership
  delete legacy.server.canStart
  delete legacy.server.canRestart
  delete legacy.server.operation
  const third = await mountPage(createFetchMock(), { status: legacy, models: MODELS_OK, tab: '概览' })
  assert.equal(buttonByText(third.root, '重启服务').props.disabled, true, 'legacy host: restart denied by default')
  assert.equal(buttonByText(third.root, '启动服务').props.disabled, true, 'legacy host: start denied while API up')
})

test('auto-start：仅本机、无 inflight、非 unknown 且 host 确认端口空闲时才启动', async () => {
  // 情形1：health 探针失败但 host 确认端口无监听（ownership stopped + canStart）→ 自动启动
  const s1 = baseStatus()
  s1.api.up = false
  s1.api.state = 'error'
  s1.api.error = 'health probe failed'
  s1.server.ownership = 'stopped'
  s1.server.canStart = true
  s1.server.canRestart = false
  s1.server.runningConfig = null
  s1.gui.autoStart = true
  const f1 = createFetchMock()
  const m1 = await mountPage(f1, { status: s1, models: MODELS_OK })
  await m1.harness.settle()
  assert.equal(f1.count('/server/start'), 1, 'probe failure but port confirmed free → auto-start fires')

  // 情形2：非 loopback → 不启动
  const s2 = baseStatus()
  s2.api.url = 'http://10.0.0.5:8888'
  s2.api.up = false
  s2.api.state = 'ok'
  s2.server.ownership = 'stopped'
  s2.server.canStart = true
  s2.gui.autoStart = true
  const f2 = createFetchMock()
  const m2 = await mountPage(f2, { status: s2, models: MODELS_OK })
  await m2.harness.settle()
  assert.equal(f2.count('/server/start'), 0, 'no auto-start for remote target')

  // 情形3：状态 unknown → 不启动
  const s3 = baseStatus()
  s3.api.up = false
  s3.api.state = 'unknown'
  s3.server.ownership = 'stopped'
  s3.server.canStart = true
  s3.gui.autoStart = true
  const f3 = createFetchMock()
  const m3 = await mountPage(f3, { status: s3, models: MODELS_OK })
  await m3.harness.settle()
  assert.equal(f3.count('/server/start'), 0, 'no auto-start when state is unknown')

  // 情形4：host 已有 operation inflight → 不重复启动
  const s4 = baseStatus()
  s4.api.up = false
  s4.api.state = 'ok'
  s4.server.ownership = 'stopped'
  s4.server.canStart = true
  s4.server.operation = 'start'
  s4.gui.autoStart = true
  const f4 = createFetchMock()
  const m4 = await mountPage(f4, { status: s4, models: MODELS_OK })
  await m4.harness.settle()
  assert.equal(f4.count('/server/start'), 0, 'no duplicate start while operation inflight')

  // 情形5：旧 host 兼容——API 未运行时维持原有自动启动行为
  const s5 = baseStatus()
  s5.api.up = false
  delete s5.server.ownership
  delete s5.server.canStart
  s5.gui.autoStart = true
  const f5 = createFetchMock()
  const m5 = await mountPage(f5, { status: s5, models: MODELS_OK })
  await m5.harness.settle()
  assert.equal(f5.count('/server/start'), 1, 'legacy host keeps old auto-start when API down')

  // 情形6：旧 host + API 运行中 → 不启动
  const s6 = baseStatus()
  delete s6.server.ownership
  s6.gui.autoStart = true
  const f6 = createFetchMock()
  const m6 = await mountPage(f6, { status: s6, models: MODELS_OK })
  await m6.harness.settle()
  assert.equal(f6.count('/server/start'), 0, 'legacy host: no auto-start while API up')
})

test('启动请求永久挂起也会超时收尾；刷新失败不把旧 operation 显示成无限启动', async () => {
  const fetchMock = createFetchMock()
  const clock = fakeClock()
  const stopped = baseStatus()
  Object.assign(stopped.server, { ownership: 'stopped', canStart: true, canRestart: false, runningConfig: null })
  stopped.api.up = false
  const { harness, root } = await mountPage(fetchMock, { status: stopped, models: MODELS_OK, tab: '概览', clock })
  click(buttonByText(root, '启动服务'))
  await harness.settle()
  assert.ok(buttonByText(root, '启动中…'))
  click(buttonByText(root, '刷新状态'))
  const starting = baseStatus()
  Object.assign(starting.server, { operation: 'start', canRestart: false, canStart: false })
  await fetchMock.respond('/status', { payload: starting })
  await harness.settle()
  clock.expire(180000) // fetch ignores AbortSignal entirely: the race must still settle.
  await harness.settle()
  assert.ok(pageText(root).includes('请求超时或已取消'))
  await fetchMock.respond('/status', { status: 503, payload: { error: 'host unavailable' } })
  await harness.settle()
  assert.equal(buttonByText(root, '启动中…'), undefined)
  assert.equal(buttonByText(root, '启动服务').props.disabled, true, 'unknown state cannot authorize another launch')
  await fetchMock.respond('/server/start', { payload: { ok: true, status: baseStatus() } })
  await harness.settle()
  assert.ok(!pageText(root).includes('服务已启动。'), 'late timed-out response cannot claim success')
  harness.unmount(root)
  await harness.settle()
  assert.equal(clock.pending(), 0)
})

test('慢轮询不会每15秒被新 generation 饿死；卸载取消所有受控请求', async () => {
  const fetchMock = createFetchMock()
  const clock = fakeClock()
  const { harness, root } = await mountPage(fetchMock, { status: baseStatus(), models: MODELS_OK, tab: '概览', clock })
  clock.poll()
  clock.poll()
  clock.poll()
  assert.equal(fetchMock.count('/status'), 2, 'only one in-flight poll')
  const changed = baseStatus()
  changed.server.operation = 'start'
  await fetchMock.respond('/status', { payload: changed })
  await harness.settle()
  assert.ok(buttonByText(root, '启动中…'), 'slow but current response is applied')
  clock.poll()
  assert.equal(fetchMock.count('/status'), 3, 'poll resumes after settlement')
  harness.unmount(root)
  await harness.settle()
  assert.equal(clock.pending(), 0, 'unmount clears request deadlines and polling')
})

test('自动启动完成后迟到轮询不能恢复启动中；自动启动失败主动刷新状态', async () => {
  const fetchMock = createFetchMock()
  const clock = fakeClock()
  const stopped = baseStatus()
  Object.assign(stopped.server, { ownership: 'stopped', canStart: true, canRestart: false, runningConfig: null })
  stopped.gui.autoStart = true
  stopped.api.up = false
  const { harness, root } = await mountPage(fetchMock, { status: stopped, models: MODELS_OK, tab: '概览', clock })
  clock.poll()
  await fetchMock.respond('/server/start', { payload: { ok: true, status: baseStatus() } })
  await harness.settle()
  const stale = baseStatus()
  stale.server.operation = 'start'
  await fetchMock.respond('/status', { payload: stale })
  await harness.settle()
  assert.equal(buttonByText(root, '启动中…'), undefined)
  harness.unmount(root)
  await harness.settle()
  assert.equal(clock.pending(), 0)

  const failed = createFetchMock()
  const secondClock = fakeClock()
  const second = await mountPage(failed, { status: stopped, models: MODELS_OK, tab: '概览', clock: secondClock })
  await failed.respond('/server/start', { status: 502, payload: { error: 'synthetic failure' } })
  await second.harness.settle()
  assert.equal(failed.count('/status'), 2, 'failure explicitly refreshes, without waiting for next poll')
  second.harness.unmount(second.root)
  await second.harness.settle()
  assert.equal(secondClock.pending(), 0)
})

test('dirty 时服务操作先保存再执行', async () => {
  const fetchMock = createFetchMock()
  const status = baseStatus()
  status.server.canRestart = true
  const { harness, root } = await mountPage(fetchMock, { status, models: MODELS_OK })

  change(apiUrlInput(root), 'http://127.0.0.1:7777')
  harness.flush()
  switchTab(harness, root, '概览')
  click(buttonByText(root, '重启服务'))
  harness.flush()
  assert.equal(fetchMock.count('/config'), 1, 'save issued first')
  assert.equal(fetchMock.count('/server/restart'), 0, 'restart waits for save')

  const saved = baseStatus()
  saved.config.values.apiUrl = 'http://127.0.0.1:7777'
  await fetchMock.respond('/config', { payload: Object.assign(saved, { saved: ['apiUrl'] }) })
  await harness.settle()
  assert.equal(fetchMock.count('/server/restart'), 1, 'restart follows successful save')

  const restarted = baseStatus()
  restarted.config.values.apiUrl = 'http://127.0.0.1:7777'
  await fetchMock.respond('/server/restart', { payload: { ok: true, status: restarted } })
  await harness.settle()
  assert.ok(pageText(root).includes('已按当前设置重启服务'), 'restart message shown')
})

test('保存期间又有新编辑时服务操作中止，不用旧配置执行', async () => {
  const fetchMock = createFetchMock()
  const status = baseStatus()
  status.server.canRestart = true
  const { harness, root } = await mountPage(fetchMock, { status, models: MODELS_OK })

  change(apiUrlInput(root), 'http://127.0.0.1:7777')
  harness.flush()
  switchTab(harness, root, '概览')
  click(buttonByText(root, '重启服务'))
  harness.flush()
  assert.equal(fetchMock.count('/config'), 1, 'save issued first')

  // 保存尚未返回时切回另一个分类继续编辑
  switchTab(harness, root, '记忆与连接')
  change(apiUrlInput(root), 'http://127.0.0.1:7778')
  harness.flush()

  const saved = baseStatus()
  saved.config.values.apiUrl = 'http://127.0.0.1:7777'
  await fetchMock.respond('/config', { payload: Object.assign(saved, { saved: ['apiUrl'] }) })
  await harness.settle()
  assert.equal(fetchMock.count('/server/restart'), 0, 'restart NOT run against stale saved config')
  switchTab(harness, root, '概览')
  assert.ok(pageText(root).includes('操作未执行'), 'abort message shown')
  switchTab(harness, root, '记忆与连接')
  assert.equal(apiUrlInput(root).props.value, 'http://127.0.0.1:7778', 'newest input kept')
  assert.ok(pageText(root).includes('有未保存的更改'), 'newest edit still dirty')
})

test('裸模型 ID 保持可见，不被不存在的下拉选项吞掉', async () => {
  const mock=createFetchMock(), status=baseStatus()
  status.gui.serverModels.reflect='deepseek-chat'
  const {harness,root}=await mountPage(mock,{status,models:MODELS_OK,tab:'模型'})
  const custom=inputs(root,'text').find(n=>n.props['aria-label']==='反思推理 自定义模型')
  assert.equal(custom.props.value,'deepseek-chat')
  harness.unmount(root); await harness.settle()
})

test('模型发现超时结束 loading；保存超时保留草稿且不能重复并发提交', async () => {
  const mock=createFetchMock(), clock=fakeClock()
  const {harness,root}=await mountPage(mock,{status:baseStatus(),tab:'模型',clock})
  clock.expire(30000); await harness.settle()
  assert.ok(pageText(root).includes('请求超时'))
  assert.equal(buttonByText(root,'刷新 DSH 模型').props.disabled,false)
  switchTab(harness,root,'记忆与连接')
  change(apiUrlInput(root),'http://127.0.0.1:7777'); harness.flush()
  const saveButton=buttonByText(root,'保存')
  click(saveButton); click(saveButton)
  assert.equal(mock.count('/config'),1,'synchronous save fence prevents duplicate requests')
  clock.expire(30000); await harness.settle()
  assert.equal(apiUrlInput(root).props.value,'http://127.0.0.1:7777')
  assert.ok(pageText(root).includes('结果尚未确认'))
  assert.equal(buttonByText(root,'保存').props.disabled,false)
  harness.unmount(root); await harness.settle(); assert.equal(clock.pending(),0)
})

test('缺失 Provider 列表不能冒称模型发现成功', async () => {
  const mock=createFetchMock()
  const {harness,root}=await mountPage(mock,{status:baseStatus(),models:{},tab:'模型'})
  assert.ok(pageText(root).includes('模型响应缺少 Provider 列表'))
  assert.ok(pageText(root).includes('无法获取 DSH 模型列表'))
  harness.unmount(root); await harness.settle()
})

test('无效保存响应不重设草稿与基线', async () => {
  const mock=createFetchMock()
  const {harness,root}=await mountPage(mock,{status:baseStatus(),models:MODELS_OK})
  change(apiUrlInput(root),'http://127.0.0.1:7777'); harness.flush()
  click(buttonByText(root,'保存'))
  await mock.respond('/config',{payload:{}}); await harness.settle()
  assert.equal(apiUrlInput(root).props.value,'http://127.0.0.1:7777')
  assert.ok(pageText(root).includes('配置响应格式无效'))
  assert.ok(pageText(root).includes('有未保存的更改'))
  harness.unmount(root); await harness.settle()
})

test('脱敏读取超时后可重读；搜索与未知事实数不会误导', async () => {
  const mock=createFetchMock(), clock=fakeClock(), status=baseStatus()
  status.banks=[{id:'bank-a',name:'检索测试',facts:null}]
  const {harness,root}=await mountPage(mock,{status,models:MODELS_OK,tab:'安全',clock})
  clock.expire(15000); await harness.settle()
  assert.equal(defenseToggle(root).props.disabled,true)
  assert.ok(pageText(root).includes('事实数未知'))
  assert.ok(!pageText(root).includes('null facts'))
  // Drop the late timed-out response, then deliver the explicit read-only retry.
  await mock.respond('/bankdefense',{payload:{bank:'bank-a',memoryDefense:null}}); await harness.settle()
  click(buttonByText(root,'重读策略'))
  assert.equal(mock.last('/bankdefense').method,'GET')
  await mock.respond('/bankdefense',{payload:{bank:'bank-a',memoryDefense:{enabled:true,rules:[{on:'sensitive_data',action:'redact'}]}}}); await harness.settle()
  assert.equal(defenseToggle(root).props.checked,true)
  const search=inputs(root,'search')[0]
  change(search,'不存在'); harness.flush(); assert.ok(pageText(root).includes('没有匹配'))
  change(inputs(root,'search')[0],'检索'); harness.flush(); assert.ok(defenseToggle(root))
  harness.unmount(root); await harness.settle(); assert.equal(clock.pending(),0)
})

test('脱敏写入超时需重读，不能用未知结果再次写入', async () => {
  const mock=createFetchMock(), clock=fakeClock(), status=baseStatus()
  status.banks=[{id:'bank-a',name:'A',facts:0}]
  const {harness,root}=await mountPage(mock,{status,models:MODELS_OK,tab:'安全',clock})
  await mock.respond('/bankdefense',{payload:{bank:'bank-a',memoryDefense:null}}); await harness.settle()
  check(defenseToggle(root),true); harness.flush()
  clock.expire(30000); await harness.settle()
  assert.equal(defenseToggle(root).props.disabled,true)
  assert.ok(pageText(root).includes('结果尚未确认'))
  await mock.respond('/bankdefense',{payload:{bank:'bank-a',memoryDefense:{enabled:true,rules:[{on:'sensitive_data',action:'redact'}]}}}); await harness.settle()
  assert.equal(defenseToggle(root).props.checked,false,'late POST cannot claim confirmation')
  click(buttonByText(root,'重读策略'))
  await mock.respond('/bankdefense',{payload:{bank:'bank-a',memoryDefense:{enabled:true,rules:[{on:'sensitive_data',action:'redact'}]}}}); await harness.settle()
  assert.equal(defenseToggle(root).props.checked,true)
  assert.equal(defenseToggle(root).props.disabled,false)
  harness.unmount(root); await harness.settle(); assert.equal(clock.pending(),0)
})

test('缺失策略字段是未知，不是脱敏关闭；显式空策略可确认关闭', async () => {
  const mock=createFetchMock(), status=baseStatus()
  status.banks=[{id:'bank-a',name:'A',facts:0}]
  const {harness,root}=await mountPage(mock,{status,models:MODELS_OK,tab:'安全'})
  await mock.respond('/bankdefense',{payload:{bank:'bank-a'}}); await harness.settle()
  assert.equal(defenseToggle(root).props.disabled,true)
  assert.ok(pageText(root).includes('缺少 memoryDefense'))
  click(buttonByText(root,'重读策略'))
  await mock.respond('/bankdefense',{payload:{bank:'bank-a',memoryDefense:null}}); await harness.settle()
  assert.equal(defenseToggle(root).props.disabled,false)
  harness.unmount(root); await harness.settle()
})

test('审计三态可返回继承；仅实际修改的分类带草稿标记', async () => {
  const mock=createFetchMock(), status=baseStatus()
  status.gui.auditLogEnabled=true
  const {harness,root}=await mountPage(mock,{status,models:MODELS_OK,tab:'安全'})
  const audit=hostNodes(root).find(n=>n.tag==='select'&&n.props['aria-label']==='审计日志')
  change(audit,''); harness.flush()
  assert.equal(textOfNode(tabByName(root,'安全')),'安全 ·')
  assert.equal(textOfNode(tabByName(root,'模型')),'模型')
  assert.equal(textOfNode(tabByName(root,'概览')),'概览')
  click(buttonByText(root,'保存'))
  assert.equal(JSON.parse(mock.last('/config').body).auditLogEnabled,null)
  const saved=baseStatus(); saved.gui.auditLogEnabled=null
  await mock.respond('/config',{payload:{...saved,saved:['auditLogEnabled']}}); await harness.settle()
  assert.equal(textOfNode(tabByName(root,'安全')),'安全')
  harness.unmount(root); await harness.settle()
})

test('失败重试和刷新期间也遵守启动门禁，预检失败不冒称归属未知', async () => {
  const mock=createFetchMock(), status=baseStatus()
  Object.assign(status.server,{ownership:'stopped',canStart:true,canRestart:false})
  status.api.up=false
  const {harness,root}=await mountPage(mock,{status,models:MODELS_OK,tab:'概览'})
  click(buttonByText(root,'启动服务'))
  await mock.respond('/server/start',{status:502,payload:{error:'synthetic launch failure'}}); await harness.settle()
  assert.equal(buttonByText(root,'重试启动').props.disabled,true,'refresh in flight cannot authorize retry')
  const managed=baseStatus(); managed.server.canRestart=false; managed.server.previewError='synthetic invalid configuration'
  await mock.respond('/status',{payload:managed}); await harness.settle()
  assert.equal(buttonByText(root,'重试启动').props.disabled,true)
  assert.ok(pageText(root).includes('启动预检未通过'))
  assert.ok(!pageText(root).includes('服务归属未知'))
  harness.unmount(root); await harness.settle()
})

test('auditLogEnabled=null（继承）时保存其它字段不夹带 false', async () => {
  const fetchMock = createFetchMock()
  const status = baseStatus()
  status.gui.auditLogEnabled = null
  const { harness, root } = await mountPage(fetchMock, { status, models: MODELS_OK })

  change(apiUrlInput(root), 'http://127.0.0.1:7777')
  harness.flush()
  click(buttonByText(root, '保存'))
  harness.flush()
  const body = JSON.parse(fetchMock.last('/config').body)
  assert.ok(!('auditLogEnabled' in body), 'inherited audit flag omitted from payload')

  const saved = baseStatus()
  saved.gui.auditLogEnabled = null
  saved.config.values.apiUrl = 'http://127.0.0.1:7777'
  await fetchMock.respond('/config', { payload: Object.assign(saved, { saved: ['apiUrl'] }) })
  await harness.settle()
  assert.ok(!pageText(root).includes('有未保存的更改'), 'clean after save with inherited audit')
})

test('迟到响应不覆盖新响应；卸载后不再动作', async () => {
  const fetchMock = createFetchMock()
  const { harness, root } = await mountPage(fetchMock, { status: baseStatus(), models: MODELS_OK, tab: '概览' })
  assert.ok(pageText(root).includes('http://127.0.0.1:9999'))

  click(buttonByText(root, '刷新状态'))
  harness.flush()
  click(buttonByText(root, '刷新状态'))
  harness.flush()
  assert.equal(fetchMock.pendingCount(), 2, 'two status requests in flight')

  // 先返回较旧那一次（乱序到达）：必须被代次守卫丢弃
  const late = baseStatus()
  late.controlPlane.url = 'http://127.0.0.1:9990'
  await fetchMock.respond('/status', { payload: late })
  await harness.settle()
  assert.ok(!pageText(root).includes('http://127.0.0.1:9990'), 'stale response ignored')
  assert.ok(pageText(root).includes('http://127.0.0.1:9999'), 'previous state kept')

  const fresh = baseStatus()
  fresh.controlPlane.url = 'http://127.0.0.1:9991'
  await fetchMock.respond('/status', { payload: fresh })
  await harness.settle()
  assert.ok(pageText(root).includes('http://127.0.0.1:9991'), 'newest response applied')

  // 卸载后：迟到的响应不得触发任何更新，也不得抛错
  click(buttonByText(root, '刷新状态'))
  harness.flush()
  harness.unmount(root)
  const orphan = baseStatus()
  orphan.controlPlane.url = 'http://127.0.0.1:9993'
  await fetchMock.respond('/status', { payload: orphan })
  await harness.settle()
})

test('五个分类具备 ARIA、键盘循环与 roving tabindex，切换不丢跨分类草稿', async () => {
  const fetchMock = createFetchMock()
  const { harness, root } = await mountPage(fetchMock, { status: baseStatus(), models: MODELS_OK })
  assert.equal(hostNodes(root).filter((n) => n.props.role === 'tablist').length, 1)
  assert.equal(hostNodes(root).filter((n) => n.props.role === 'tab').length, 5)
  change(apiUrlInput(root), 'http://localhost:7788')
  harness.flush()
  switchTab(harness, root, '模型')
  assert.equal(apiUrlInput(root), undefined, 'hidden panel fields are not queryable')
  assert.equal(hostNodes(root).filter((n) => n.props.role === 'tabpanel').length, 1, 'only one panel is visible')
  assert.equal(hostNodes(root, true).filter((n) => n.props.role === 'tabpanel').length, 5, 'all panels remain mounted')
  assert.ok(pageText(root).includes('有未保存的更改'), 'global toolbar retains dirty hint')
  const modelsTab = tabByName(root, '模型')
  assert.equal(modelsTab.props.tabIndex, 0)
  assert.equal(modelsTab.props['aria-controls'], 'dsh-hsp-panel-models')
  let prevented = false
  modelsTab.props.onKeyDown({ key: 'End', preventDefault() { prevented = true } })
  harness.flush()
  assert.equal(prevented, true)
  assert.equal(tabByName(root, '高级').props['aria-selected'], true)
  assert.equal(fakeDocument.activeId, 'dsh-hsp-tab-advanced')
  tabByName(root, '高级').props.onKeyDown({ key: 'ArrowRight', preventDefault() {} })
  harness.flush()
  assert.equal(tabByName(root, '概览').props['aria-selected'], true, 'ArrowRight wraps')
  tabByName(root, '概览').props.onKeyDown({ key: 'ArrowLeft', preventDefault() {} })
  harness.flush()
  assert.equal(tabByName(root, '高级').props['aria-selected'], true, 'ArrowLeft wraps')
  tabByName(root, '高级').props.onKeyDown({ key: 'Home', preventDefault() {} })
  harness.flush()
  assert.equal(tabByName(root, '概览').props['aria-selected'], true)
  switchTab(harness, root, '记忆与连接')
  assert.equal(apiUrlInput(root).props.value, 'http://localhost:7788', 'cross-tab draft survives')
})

test('向量配置按 provider 发送活跃字段；无关保存不覆盖继承 serverEnv', async () => {
  const fetchMock = createFetchMock()
  const { harness, root } = await mountPage(fetchMock, { status: baseStatus(), models: MODELS_OK, tab: '模型' })
  assert.ok(pageText(root).includes('旧配置继承预览'))
  switchTab(harness, root, '记忆与连接')
  change(apiUrlInput(root), 'http://localhost:7777')
  harness.flush()
  click(buttonByText(root, '保存'))
  assert.equal('serverEmbeddings' in JSON.parse(fetchMock.last('/config').body), false, 'unrelated save omits embedding override')
  const saved = baseStatus()
  saved.config.values.apiUrl = 'http://localhost:7777'
  await fetchMock.respond('/config', { payload: { ...saved, saved: ['apiUrl'] } })
  await harness.settle()
  switchTab(harness, root, '模型')
  const provider = hostNodes(root).find((n) => n.tag === 'select' && n.children.some((child) => child.kind === 'host' && child.props.value === 'tei'))
  change(provider, 'onnx')
  harness.flush()
  change(inputs(root, 'text').find((n) => n.props.placeholder === 'ONNX 模型 ID'), 'repo/model-id')
  change(inputs(root, 'number')[0], '768')
  harness.flush()
  click(buttonByText(root, '保存'))
  const body = JSON.parse(fetchMock.last('/config').body)
  assert.deepEqual(JSON.parse(JSON.stringify(body.serverEmbeddings)), { provider: 'onnx', model: 'repo/model-id', dimensions: 768 })
  assert.equal(body.configRevision, 'cfg-rev-1')
  assert.equal(body.guiRevision, 'gui-rev-1')
  assert.ok(!('serverEnv' in body.serverEmbeddings), 'never overwrite legacy env')
})

test('向量 Key 只发替换或清除意图；保存完成清理已提交 Key，保存中新输入保留', async () => {
  const fetchMock = createFetchMock()
  const status = baseStatus()
  status.gui.serverEmbeddings = { provider: 'openai', model: 'old-model', baseUrl: 'http://localhost:1234/v1', dimensions: null, apiKeyEnv: '', localForceCpu: null, secretConfigured: true }
  const { harness, root } = await mountPage(fetchMock, { status, models: MODELS_OK, tab: '模型' })
  const password = () => inputs(root, 'password').find((n) => n.props.placeholder === '向量 Key（留空保留已存值）')
  assert.equal(password().props.value, '')
  assert.ok(pageText(root).includes('已配置本页 Key'))
  assert.ok(pageText(root).includes('本地免鉴权端点也需由您明确填写非敏感占位值'), 'OpenAI compatible endpoints need an explicit nonempty Key')
  assert.ok(pageText(root).includes('本页不会自动生成'), 'no dummy Key is generated')
  change(inputs(root, 'text').find((n) => n.props.placeholder === '向量模型名称'), 'new-model')
  harness.flush()
  click(buttonByText(root, '保存'))
  let body = JSON.parse(fetchMock.last('/config').body)
  assert.equal(body.serverEmbeddings.model, 'new-model')
  assert.equal('apiKey' in body.serverEmbeddings, false, 'empty key means keep')
  const saved = baseStatus()
  saved.gui.serverEmbeddings = { ...status.gui.serverEmbeddings, model: 'new-model' }
  await fetchMock.respond('/config', { payload: { ...saved, saved: ['serverEmbeddings'] } })
  await harness.settle()
  change(password(), 'example-key-not-real')
  harness.flush()
  click(buttonByText(root, '保存'))
  body = JSON.parse(fetchMock.last('/config').body)
  assert.equal(body.serverEmbeddings.apiKey, 'example-key-not-real')
  assert.equal('secretConfigured' in body.serverEmbeddings, false)
  change(password(), 'newer-unsaved-example')
  harness.flush()
  await fetchMock.respond('/config', { payload: { ...saved, saved: ['serverEmbeddings'] } })
  await harness.settle()
  assert.equal(password().props.value, 'newer-unsaved-example', 'new input retained')
  assert.ok(pageText(root).includes('有未保存的更改'))
  click(buttonByText(root, '放弃更改'))
  harness.flush()
  assert.equal(password().props.value, '')
  click(buttonByText(root, '清除向量 Key'))
  harness.flush()
  click(buttonByText(root, '保存'))
  body = JSON.parse(fetchMock.last('/config').body)
  assert.equal(body.serverEmbeddings.clearApiKey, true)
  assert.equal('apiKey' in body.serverEmbeddings, false)
})

test('tei 仅发 baseUrl，local 三态保留；维度拒绝非正整数', async () => {
  const fetchMock = createFetchMock()
  const { harness, root } = await mountPage(fetchMock, { status: baseStatus(), models: MODELS_OK, tab: '模型' })
  const provider = () => hostNodes(root).find((n) => n.tag === 'select' && n.children.some((child) => child.kind === 'host' && child.props.value === 'tei'))
  change(provider(), 'onnx'); harness.flush()
  change(inputs(root, 'number')[0], '1.5'); harness.flush()
  click(buttonByText(root, '保存')); harness.flush()
  assert.equal(fetchMock.count('/config'), 0)
  assert.ok(pageText(root).includes('向量维度必须是正整数'))
  change(provider(), 'local'); harness.flush()
  const cpuSelect = hostNodes(root).find((n) => n.tag === 'select' && n.children.some((child) => child.kind === 'host' && textOfNode(child) === '默认（不指定）'))
  assert.equal(cpuSelect.props.value, '', 'local CPU unset state')
  change(cpuSelect, 'false'); harness.flush()
  assert.equal(hostNodes(root).find((n) => n.tag === 'select' && n.children.some((child) => child.kind === 'host' && textOfNode(child) === '默认（不指定）')).props.value, 'false')
  change(provider(), 'tei'); harness.flush()
  change(inputs(root, 'text').find((n) => n.props.placeholder === 'TEI 服务地址'), 'http://localhost:8080'); harness.flush()
  click(buttonByText(root, '保存'))
  assert.deepEqual(JSON.parse(JSON.stringify(JSON.parse(fetchMock.last('/config').body).serverEmbeddings)), { provider: 'tei', baseUrl: 'http://localhost:8080' })
})

test('向量 Provider 分别缓存草稿：OpenAI 参数不串到 TEI/ONNX，切回原草稿', async () => {
  const status = baseStatus()
  status.gui.serverEmbeddings = {
    provider: 'openai', model: 'openai-original', baseUrl: 'https://openai.invalid/v1',
    dimensions: 1536, apiKeyEnv: 'EXAMPLE_KEY_ENV', localForceCpu: null, secretConfigured: false,
  }
  const fetchMock = createFetchMock()
  const { harness, root } = await mountPage(fetchMock, { status, models: MODELS_OK, tab: '模型' })
  const provider = () => hostNodes(root).find((n) => n.tag === 'select'
    && n.children.some((child) => child.kind === 'host' && child.props.value === 'tei'))
  const field = (placeholder) => inputs(root).find((n) => n.props.placeholder === placeholder)
  change(field('向量模型名称'), 'openai-unsaved')
  change(field('兼容 OpenAI 的 API 地址'), 'https://draft.invalid/v1')
  change(inputs(root, 'number')[0], '2048')
  harness.flush()
  change(provider(), 'tei'); harness.flush()
  assert.equal(field('TEI 服务地址').props.value, '', 'TEI never inherits OpenAI URL')
  assert.equal(field('向量模型名称'), undefined, 'TEI has no model field')
  change(field('TEI 服务地址'), 'http://localhost:8080'); harness.flush()
  change(provider(), 'onnx'); harness.flush()
  assert.equal(field('ONNX 模型 ID').props.value, '', 'ONNX never inherits OpenAI model')
  assert.equal(inputs(root, 'number')[0].props.value, '', 'ONNX never inherits OpenAI dimensions')
  change(field('ONNX 模型 ID'), 'custom-onnx'); harness.flush()
  change(provider(), 'tei'); harness.flush()
  assert.equal(field('TEI 服务地址').props.value, 'http://localhost:8080', 'TEI draft restored')
  change(provider(), 'openai'); harness.flush()
  assert.equal(field('向量模型名称').props.value, 'openai-unsaved', 'OpenAI model restored')
  assert.equal(field('兼容 OpenAI 的 API 地址').props.value, 'https://draft.invalid/v1', 'OpenAI URL restored')
  assert.equal(inputs(root, 'number')[0].props.value, '2048', 'OpenAI dimensions restored')
  click(buttonByText(root, '放弃更改')); harness.flush()
  change(provider(), 'tei'); harness.flush()
  assert.equal(field('TEI 服务地址').props.value, '', 'discard retires inactive TEI draft')
  change(provider(), 'openai'); harness.flush()
  assert.equal(field('向量模型名称').props.value, 'openai-original', 'discard restores saved baseline')
  assert.ok(!pageText(root).includes('有未保存的更改'))
})

test('非活跃 Provider 草稿跨轮询保留，不能被无关保存静默丢弃', async () => {
  const fetchMock = createFetchMock()
  const { harness, root } = await mountPage(fetchMock, { status: baseStatus(), models: MODELS_OK, tab: '模型' })
  const provider = () => hostNodes(root).find((n) => n.tag === 'select'
    && n.children.some((child) => child.kind === 'host' && child.props.value === 'tei'))
  change(provider(), 'tei'); harness.flush()
  change(inputs(root, 'text').find((n) => n.props.placeholder === 'TEI 服务地址'), 'http://localhost:8090'); harness.flush()
  change(provider(), ''); harness.flush()
  assert.ok(pageText(root).includes('有未保存的更改'), 'inactive draft still counts as unsaved')
  switchTab(harness, root, '概览')
  click(buttonByText(root, '刷新状态'))
  await fetchMock.respond('/status', { payload: baseStatus() })
  await harness.settle()
  switchTab(harness, root, '模型')
  click(buttonByText(root, '保存')); harness.flush()
  assert.equal(fetchMock.count('/config'), 0, 'cannot silently discard inactive edited provider on unrelated save')
  assert.ok(pageText(root).includes('请切回对应 Provider 保存'))
  change(provider(), 'tei'); harness.flush()
  assert.equal(inputs(root, 'text').find((n) => n.props.placeholder === 'TEI 服务地址').props.value, 'http://localhost:8090', 'draft survives status poll')
})

test('向量预览继承凭据不冒充本页存储，保存期间切换 Provider 不重复提交 Key', async () => {
  const fetchMock = createFetchMock()
  const status = baseStatus()
  status.gui.serverEmbeddings = {
    provider: 'openai', model: 'saved-openai', baseUrl: 'http://localhost:1234/v1',
    dimensions: null, apiKeyEnv: '', localForceCpu: null, secretConfigured: false,
  }
  status.server.embeddingPreview = {
    provider: 'openai', model: 'saved-openai', baseUrl: 'http://localhost:1234/v1',
    dimensions: null, credentialSource: 'serverEnv', secretConfigured: true,
    source: 'serverEnv', mode: 'inherit', note: '环境继承', warnings: [],
  }
  const { harness, root } = await mountPage(fetchMock, { status, models: MODELS_OK, tab: '模型' })
  assert.ok(pageText(root).includes('下次启动凭据已配置（未验证有效性）'))
  assert.ok(!pageText(root).includes('已配置本页 Key'), 'preview inherited secret is not the stored-page flag')
  const provider = () => hostNodes(root).find((n) => n.tag === 'select'
    && n.children.some((child) => child.kind === 'host' && child.props.value === 'tei'))
  const password = () => inputs(root, 'password').find((n) => n.props.placeholder === '向量 Key（留空保留已存值）')
  change(password(), 'example-submitted-key'); harness.flush()
  click(buttonByText(root, '保存'))
  assert.equal(JSON.parse(fetchMock.last('/config').body).serverEmbeddings.apiKey, 'example-submitted-key')
  change(provider(), 'tei'); harness.flush()
  const saved = baseStatus()
  saved.gui.serverEmbeddings = { ...status.gui.serverEmbeddings, secretConfigured: true }
  await fetchMock.respond('/config', { payload: { ...saved, saved: ['serverEmbeddings'] } })
  await harness.settle()
  change(provider(), 'openai'); harness.flush()
  assert.equal(password().props.value, '', 'submitted key retired from inactive provider cache')
  assert.ok(pageText(root).includes('已配置本页 Key'), 'stored flag comes from returned gui value')
  assert.equal(buttonByText(root, '保存').props.disabled, true, 'clean draft cannot resubmit saved Key')
  assert.equal(fetchMock.count('/config'), 1, 'no duplicate submission after switching back')
  change(provider(), 'tei'); harness.flush()
  change(inputs(root, 'text').find((n) => n.props.placeholder === 'TEI 服务地址'), 'http://localhost:8080')
  harness.flush()
  click(buttonByText(root, '保存'))
  const body = JSON.parse(fetchMock.last('/config').body)
  assert.deepEqual(JSON.parse(JSON.stringify(body.serverEmbeddings)), { provider: 'tei', baseUrl: 'http://localhost:8080' })
  const savedTei = baseStatus()
  savedTei.gui.serverEmbeddings = { ...baseStatus().gui.serverEmbeddings, provider: 'tei', baseUrl: 'http://localhost:8080', secretConfigured: true }
  await fetchMock.respond('/config', { payload: { ...savedTei, saved: ['serverEmbeddings'] } })
  await harness.settle()
  change(provider(), 'openai'); harness.flush()
  assert.equal(password().props.value, '', 'new baseline never rehydrates submitted Key')
  assert.equal(inputs(root, 'text').find((n) => n.props.placeholder === '向量模型名称').props.value, '', 'save resets former provider draft cache')
})

test('聊天模型与 Provider 覆盖折叠不卸载草稿或已输入 Key', async () => {
  const status = baseStatus()
  status.gui.providerOverrides = { demo: { provider: 'demo', baseUrl: '', apiKeyEnv: '', secretConfigured: true } }
  const fetchMock = createFetchMock()
  const { harness, root } = await mountPage(fetchMock, { status, models: MODELS_OK, tab: '模型' })
  assert.equal(detailsBySummary(root, '功能模型调用').props.open, true, 'chat route card starts expanded')
  assert.equal(detailsBySummary(root, 'Provider 覆盖').props.open, false, 'overrides start collapsed')
  const chatSelect = () => inputs(root, 'text').find(n => n.props['aria-label'] === '勘察 CLI 模型标识')
  assert.ok(chatSelect())
  change(chatSelect(), 'sonnet'); harness.flush()
  toggleDetails(harness, root, '功能模型调用')
  assert.equal(chatSelect(), undefined, 'collapsed chat field is not visible')
  toggleDetails(harness, root, '功能模型调用')
  assert.equal(chatSelect().props.value, 'sonnet', 'external CLI identifier survives collapse without DSH catalog mapping')
  toggleDetails(harness, root, 'Provider 覆盖')
  const password = () => inputs(root, 'password').find((n) => n.props.placeholder === '已保存 Key（输入以替换）')
  change(password(), 'example-unsaved-override-key'); harness.flush()
  toggleDetails(harness, root, 'Provider 覆盖')
  assert.equal(password(), undefined, 'closed override field is not visible')
  assert.ok(pageText(root).includes('有未保存的更改'), 'sticky toolbar still signals hidden edits')
  toggleDetails(harness, root, 'Provider 覆盖')
  assert.equal(password().props.value, 'example-unsaved-override-key', 'unsaved Key survives collapse')
  click(buttonByText(root, '保存'))
  const body = JSON.parse(fetchMock.last('/config').body)
  assert.equal(body.providerOverrides.demo.apiKey, 'example-unsaved-override-key')
  assert.equal(body.surveyModel, 'sonnet')
})

test('向量迁移风险只显示一次，鉴权和依赖警告仍然可见', async () => {
  const status = baseStatus()
  status.server.embeddingPreview.warnings = [
    '更换向量模型可能需要重建或迁移已有向量',
    '变更维度需重新索引向量数据',
    'API Key 环境变量缺失',
    '本地依赖尚未准备',
  ]
  const { root } = await mountPage(createFetchMock(), { status, models: MODELS_OK, tab: '模型' })
  const text = pageText(root)
  assert.ok(text.includes('更换向量模型或维度可能需要重建/迁移已有向量'), 'mandatory migration notice shown')
  assert.ok(!text.includes('更换向量模型可能需要重建或迁移已有向量'))
  assert.ok(!text.includes('变更维度需重新索引向量数据'))
  assert.ok(text.includes('API Key 环境变量缺失'), 'authentication warning remains')
  assert.ok(text.includes('本地依赖尚未准备'), 'dependency warning remains')
})

// ---------------------------------------------------------------------------
// 8. 运行
// ---------------------------------------------------------------------------
let passed = 0

test('真实 Host 状态投影与客户端 CAS 向量保存契约联调（全 IO 隔离）', async () => {
  const {fixture}=await import('./test-host.mjs')
  const legacy={HINDSIGHT_API_EMBEDDINGS_PROVIDER:'openai',HINDSIGHT_API_EMBEDDINGS_OPENAI_MODEL:'legacy-vector',HINDSIGHT_API_EMBEDDINGS_OPENAI_BASE_URL:'http://127.0.0.1:1234/v1',HINDSIGHT_API_EMBEDDINGS_OPENAI_API_KEY:'SYNTHETIC_CONTRACT_KEY'}
  const host=await fixture({gui:{autoStart:false,serverEnv:legacy}})
  const status=(await host.request('status')).body
  assert.ok(!JSON.stringify(status).includes('SYNTHETIC_CONTRACT_KEY'))
  const fetchMock=createFetchMock()
  const {harness,root}=await mountPage(fetchMock,{status,models:MODELS_OK,tab:'模型'})
  assert.ok(pageText(root).includes('legacy-vector'))
  const provider=hostNodes(root).find(n=>n.tag==='select'&&n.children.some(child=>child.kind==='host'&&child.props.value==='tei'))
  change(provider,'openai');harness.flush()
  change(inputs(root,'text').find(n=>n.props.placeholder==='向量模型名称'),'new-vector')
  change(inputs(root,'number')[0],'512');harness.flush()
  click(buttonByText(root,'保存'));harness.flush()
  const submitted=JSON.parse(fetchMock.last('/config').body)
  const saved=await host.request('config',submitted)
  assert.equal(saved.code,200)
  assert.ok(saved.body.saved.includes('serverEmbeddings'))
  await fetchMock.respond('/config',{status:saved.code,payload:saved.body});await harness.settle()
  assert.equal(inputs(root,'text').find(n=>n.props.placeholder==='向量模型名称').props.value,'new-vector')
  assert.ok(pageText(root).includes('512'))
  assert.ok(!pageText(root).includes('有未保存的更改'))
  assert.deepEqual(JSON.parse(host.files.get(host.guiPath)).serverEnv,legacy)
  assert.equal(saved.body.server.embeddingPreview.model,'new-vector')
  assert.equal(saved.body.server.embeddingPreview.dimensions,512)
  assert.equal(saved.body.gui.serverEmbeddings.secretConfigured,false)
  assert.equal(saved.body.server.embeddingPreview.secretConfigured,true)
  assert.ok(!JSON.stringify(saved.body).includes('SYNTHETIC_CONTRACT_KEY'))
})

test('保存仅发送变化意图，默认值和掩码URL不夹带回写', async () => {
  const status=baseStatus()
  status.gui.providerOverrides={demo:{baseUrl:'https://example.invalid/api_key=[REDACTED]',apiKeyEnv:'',secretConfigured:true}}
  const fetchMock=createFetchMock()
  const {harness,root}=await mountPage(fetchMock,{status,models:MODELS_OK,tab:'记忆与连接'})
  const level=hostNodes(root).find(n=>n.tag==='select'&&n.children.some(c=>c.kind==='host'&&c.props.value==='warn'))
  change(level,'warn'); harness.flush()
  click(buttonByText(root,'保存'))
  const body=JSON.parse(fetchMock.last('/config').body)
  assert.deepEqual(Object.keys(body).sort(),['configRevision','guiRevision','logLevel'].sort())
  assert.equal(body.logLevel,'warn')
  const saved=baseStatus();saved.config.values.logLevel='warn'
  await fetchMock.respond('/config',{payload:{...saved,saved:['logLevel']}});await harness.settle()
  assert.ok(!pageText(root).includes('下一轮对话生效'))
  assert.ok(pageText(root).includes('已有工作区可能需要重启DSH'))
})
test('活跃向量已保存仍保留其它Provider未提交草稿', async () => {
  const fetchMock=createFetchMock()
  const {harness,root}=await mountPage(fetchMock,{status:baseStatus(),models:MODELS_OK,tab:'模型'})
  const provider=()=>hostNodes(root).find(n=>n.tag==='select'&&n.children.some(c=>c.kind==='host'&&c.props.value==='tei'))
  change(provider(),'tei');harness.flush()
  change(inputs(root,'text').find(n=>n.props.placeholder==='TEI 服务地址'),'http://localhost:8090');harness.flush()
  change(provider(),'onnx');harness.flush()
  change(inputs(root,'text').find(n=>n.props.placeholder==='ONNX 模型 ID'),'active-onnx');harness.flush()
  click(buttonByText(root,'保存'))
  const body=JSON.parse(fetchMock.last('/config').body)
  assert.equal(body.serverEmbeddings.provider,'onnx')
  const saved=baseStatus();saved.gui.serverEmbeddings={...saved.gui.serverEmbeddings,provider:'onnx',model:'active-onnx'}
  await fetchMock.respond('/config',{payload:{...saved,saved:['serverEmbeddings']}});await harness.settle()
  assert.ok(pageText(root).includes('其它向量Provider草稿已保留'))
  assert.ok(pageText(root).includes('有未保存的更改'))
  change(provider(),'tei');harness.flush()
  assert.equal(inputs(root,'text').find(n=>n.props.placeholder==='TEI 服务地址').props.value,'http://localhost:8090')
})

let failed = 0
for (const [name, fn] of tests) {
  try {
    await fn()
    passed++
    console.log('ok   - ' + name)
  } catch (error) {
    failed++
    console.error('FAIL - ' + name)
    console.error(error)
  }
}
console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
