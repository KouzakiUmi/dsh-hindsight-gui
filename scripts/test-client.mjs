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
    return [{ kind: 'host', tag: node.type, props: node.props || {}, children: normalize(node.props ? node.props.children : undefined, parent, keyPath + '.h', prevChildMap) }]
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
      for (let i = 0; i < 8; i++) {
        await Promise.resolve()
        this.flush()
      }
    },
    unmount(inst) { unmount(inst) },
  }
}

// ---------------------------------------------------------------------------
// 3. 查询/事件辅助
// ---------------------------------------------------------------------------
function hostNodes(root) {
  const out = []
  const rec = (nodes) => {
    for (const n of nodes ?? []) {
      if (n.kind === 'host') { out.push(n); rec(n.children) } else if (n.kind === 'component') rec(n.instance.childList)
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
    else if (n.kind === 'host') rec(n.children)
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

function click(node) { node.props.onClick({ preventDefault() {}, target: {} }) }
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
  createElement: () => ({ dataset: {}, style: {} }),
  head: { appendChild() {} },
}

function loadModule(harness, fetchMock) {
  const sandbox = {
    console, fetch: fetchMock, document: fakeDocument,
    setTimeout, clearTimeout, setInterval, clearInterval,
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
    },
    server: {
      port: 8888, up: true, ownership: 'managed', canStart: false, canRestart: true, operation: null,
      entry: { command: 'hindsight-api', source: 'PATH' }, managedPid: 1234, startedAt: '2026-10-12T00:00:00Z',
      lastAction: null, autoStart: false, pendingRestart: false, auditLogEnabled: false,
      runtimeConfigKnown: true,
      runningConfig: { fingerprint: 'fp-1', startedAt: '2026-10-12T00:00:00Z', resolutions: [], auditLogEnabled: false },
      resolutions: [],
    },
    banks: [],
    banksError: null,
  }
  return Object.assign(status, over)
}

async function mountPage(fetchMock, { status, models } = {}) {
  const harness = createHarness()
  const mod = loadModule(harness, fetchMock)
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
  return { harness, root, mod }
}

const MODELS_OK = { providers: [{ id: 'deepseek', name: 'DeepSeek', models: [{ id: 'deepseek-chat' }] }], errors: [], state: 'ok', sampledAt: '2026-10-12T17:00:00Z' }

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
  click(buttonByText(root, '刷新状态'))
  const statusB = baseStatus()
  statusB.config.values.apiUrl = 'http://127.0.0.1:8888'
  statusB.config.revision = 'cfg-rev-2'
  statusB.controlPlane.url = 'http://127.0.0.1:9998'
  await fetchMock.respond('/status', { payload: statusB })
  await harness.settle()

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
  click(buttonByText(root, '刷新状态'))
  harness.flush()

  const saved = baseStatus()
  saved.config.values.apiUrl = 'http://127.0.0.1:7001'
  saved.config.revision = 'cfg-rev-2'
  await fetchMock.respond('/config', { payload: Object.assign(saved, { saved: ['apiUrl'] }) })
  await harness.settle()
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
  const { harness, root } = await mountPage(fetchMock, { status, models: MODELS_OK })

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
  const { harness, root } = await mountPage(fetchMock, { status, models: MODELS_OK })

  await fetchMock.respond('/bankdefense', { status: 500, payload: { error: 'boom' } })
  await harness.settle()
  assert.ok(pageText(root).includes('策略未知'), 'unknown policy shown')
  assert.ok(pageText(root).includes('boom'), 'read error shown')
  assert.equal(defenseToggle(root).props.disabled, true, 'toggle disabled when policy unknown')

  // API 地址变更 → cache 重置 → 重新读取
  const statusB = baseStatus()
  statusB.api.url = 'http://127.0.0.1:8899'
  statusB.banks = [{ id: 'bank-a', name: 'A', facts: 3, updatedAt: null }]
  click(buttonByText(root, '刷新状态'))
  await fetchMock.respond('/status', { payload: statusB })
  await harness.settle()
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

test('bankdefense canonical 判定：strong block 不算 enabled', async () => {
  const fetchMock = createFetchMock()
  const status = baseStatus()
  status.banks = [{ id: 'bank-strong', name: 'S', facts: 1, updatedAt: null }]
  const { harness, root } = await mountPage(fetchMock, { status, models: MODELS_OK })

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
  const { harness, root } = await mountPage(fetchMock, { status, models: MODELS_OK })
  // 第一个 GET（旧基地 8888）仍在途

  const statusB = baseStatus()
  statusB.api.url = 'http://127.0.0.1:8899'
  statusB.banks = [{ id: 'bank-c', name: 'C', facts: 2, updatedAt: null }]
  click(buttonByText(root, '刷新状态'))
  await fetchMock.respond('/status', { payload: statusB })
  await harness.settle()
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
    status: baseStatus(),
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
  const first = await mountPage(createFetchMock(), { status, models: MODELS_OK })
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
  const second = await mountPage(createFetchMock(), { status: opStatus, models: MODELS_OK })
  assert.equal(buttonByText(second.root, '重启中…').props.disabled, true, 'button disabled while host operation in flight')
  assert.ok(pageText(second.root).includes('运行中配置') && pageText(second.root).includes('fp-1'), 'runningConfig shown')

  // 旧 host：没有 ownership/can* 契约，重启一律默认拒绝（可能是别人的进程）
  const legacy = baseStatus()
  delete legacy.server.ownership
  delete legacy.server.canStart
  delete legacy.server.canRestart
  delete legacy.server.operation
  const third = await mountPage(createFetchMock(), { status: legacy, models: MODELS_OK })
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

test('dirty 时服务操作先保存再执行', async () => {
  const fetchMock = createFetchMock()
  const status = baseStatus()
  status.server.canRestart = true
  const { harness, root } = await mountPage(fetchMock, { status, models: MODELS_OK })

  change(apiUrlInput(root), 'http://127.0.0.1:7777')
  harness.flush()
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
  click(buttonByText(root, '重启服务'))
  harness.flush()
  assert.equal(fetchMock.count('/config'), 1, 'save issued first')

  // 保存尚未返回时又改了别的字段
  change(apiUrlInput(root), 'http://127.0.0.1:7778')
  harness.flush()

  const saved = baseStatus()
  saved.config.values.apiUrl = 'http://127.0.0.1:7777'
  await fetchMock.respond('/config', { payload: Object.assign(saved, { saved: ['apiUrl'] }) })
  await harness.settle()
  assert.equal(fetchMock.count('/server/restart'), 0, 'restart NOT run against stale saved config')
  assert.ok(pageText(root).includes('操作未执行'), 'abort message shown')
  assert.equal(apiUrlInput(root).props.value, 'http://127.0.0.1:7778', 'newest input kept')
  assert.ok(pageText(root).includes('有未保存的更改'), 'newest edit still dirty')
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
  const { harness, root } = await mountPage(fetchMock, { status: baseStatus(), models: MODELS_OK })
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

// ---------------------------------------------------------------------------
// 8. 运行
// ---------------------------------------------------------------------------
let passed = 0
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
