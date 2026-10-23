/** Offline Host regressions. All process, credential, network and write I/O is mocked. */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { EventEmitter } from 'node:events'
import { pathToFileURL } from 'node:url'
import { resolveServiceEntry } from '../lib/service-control.js'

const original = readFileSync(new URL('../lib/index.js', import.meta.url), 'utf8')
let moduleId = 0
const SECRET = 'SYNTHETIC_TEST_KEY_NOT_A_REAL_CREDENTIAL'

export async function fixture(options = {}) {
  const files = new Map()
  const configPath = '/fixture/coding-agent.json'
  const guiPath = '/fixture/gui.json'
  files.set(configPath, JSON.stringify(options.config ?? { apiUrl: 'http://127.0.0.1:8888' }))
  files.set(guiPath, JSON.stringify(options.gui ?? {}))
  const listeners = new Map()
  const identities = new Map([[123, { pid: 123, executable: '/fixture/dsh.exe', started: '2026-10-13T08:00:00Z' }]])
  const children = new Map()
  const writes = []
  const commands = []
  const controlRequests = []
  const launches = []
  const patches = []
  const routes = new Map()
  let nextPid = 400
  let failQuery = false
  let stopFailure = false
  let failSpawn = false
  let healthUp = true
  let disposed = false
  let policy = options.policy ?? { enabled: true, rules: [{ on: 'custom', action: 'block' }, { on: 'sensitive_data', action: 'block' }] }
  let beforeRead = null
  let beforeWrite = null
  const missing = () => Object.assign(new Error('mock missing file'), { code: 'ENOENT' })
  const isPython = path => String(path).replaceAll(String.fromCharCode(92), '/') === '/fixture/python.exe'
  const f = {
    process: { env: { HINDSIGHT_CONFIG: configPath, HINDSIGHT_GUI_CONFIG: guiPath, ...options.env }, platform: 'win32', pid: 123 },
    fs: {
      existsSync: path => path === '/fixture/api.exe' || isPython(path)
        || (options.entryFiles ?? []).includes(String(path).replaceAll(String.fromCharCode(92), '/')),
      openSync: () => 7, closeSync() {},
      readSync: (_fd, buffer) => { const text = Buffer.from(options.log ?? 'Error: synthetic'); text.copy(buffer); return text.length },
    },
    fsp: {
      readFile: async path => { if (beforeRead) await beforeRead(path); if (!files.has(path)) throw missing(); return files.get(path) },
      writeFile: async (path, text) => { if (beforeWrite) await beforeWrite(path); files.set(path, text); writes.push(path) },
      mkdir: async () => {},
      copyFile: async (path, target) => { if (!files.has(path)) throw missing(); files.set(target, files.get(path)) },
      rename: async (path, target) => { if (!files.has(path)) throw missing(); files.set(target, files.get(path)); files.delete(path) },
      unlink: async path => { if (!files.delete(path)) throw missing() },
      stat: async path => ({ size: Buffer.byteLength(options.log ?? 'Error: synthetic'), isFile: () => path === '/fixture/api.exe' || isPython(path) }),
    },
    serviceControl: {
      assertPrivateReceipt: async () => { if (options.unsafeReceipt) throw new Error('控制令牌记录不是私有文件；拒绝启用') },
      writePrivateReceipt: async (path,data) => f.fsp.writeFile(path,data),
      prepareServiceLaunch: async (_gui, entry, target, env) => {
        if (options.preflightFailure) throw new Error('进程内控制预检失败；检查Python、版本或HTTP扩展；未停止原服务')
        await f.serviceControl.assertPrivateReceipt()
        const effectiveEntry=resolveServiceEntry(_gui,entry,'win32')
        const control=options.cooperative ? {version:1,kind:'http',base:target.base,token:'c'.repeat(64),nonce:'a'.repeat(32)} : null
        return {command:effectiveEntry.command, entry:effectiveEntry, detached:true,
          args:['/fixture/dsh_hindsight_control.py','--port',String(target.port)],
          env:control ? {...env,DSH_HINDSIGHT_CONTROL_TOKEN:control.token,DSH_HINDSIGHT_CONTROL_NONCE:control.nonce,DSH_HINDSIGHT_CONTROL_PORT:String(target.port)} : env,control}
      },
      requestServiceControl: async (control, identity, action) => {
        controlRequests.push({ control: structuredClone(control), identity, action })
        if (options.controlFailure || options.controlMismatch) throw new Error('服务协作关闭通道不可用或身份不符；不会强制终止或重复启动')
        if (action === 'stop') {
          for (const [port, pid] of listeners) if (pid === identity.pid) listeners.delete(port)
          identities.delete(identity.pid)
        }
        return {version:1,pid:identity.pid,nonce:control.nonce,stopping:action==='stop'}
      },
    },
    spawn(command, args, spawnOptions) {
      if (command === '/fixture/api.exe' || isPython(command)) {
        const child = new EventEmitter()
        child.pid = failSpawn ? undefined : ++nextPid
        child.exitCode = null
        child.unref = () => { child.unreferenced = true }
        child.kill = () => { throw new Error('Windows direct kill must not be used') }
        launches.push({ command, args, child, options: spawnOptions })
        if (failSpawn) queueMicrotask(() => child.emit('error', new Error('synthetic spawn failure '+SECRET)))
        else {
          identities.set(child.pid, { pid: child.pid, executable: '/fixture/api.exe', started: 'identity-'+child.pid })
          listeners.set(Number(args.at(-1)), options.launcher ? child.pid + 1 : child.pid)
          if (options.descendant || options.cooperative) {
            const middle = child.pid + 1000
            const listener = child.pid + 2000
            identities.set(middle, { pid: middle, parentPid: child.pid, executable: '/fixture/python-launcher.exe', started: '2026-10-13T09:00:01Z' })
            identities.set(listener, { pid: listener, parentPid: middle, executable: '/fixture/python.exe', started: '2026-10-13T09:00:02Z' })
            identities.get(child.pid).started = '2026-10-13T09:00:00Z'
            listeners.set(Number(args.at(-1)), listener)
          }
          children.set(child.pid, child)
        }
        return child
      }
      commands.push({ command, args })
      const child = new EventEmitter()
      child.stdout = new EventEmitter()
      child.stderr = new EventEmitter()
      child.stdin = new EventEmitter()
      const record=commands.at(-1)
      child.stdin.end = input => { record.input=input; if(options.inputFailure) child.stdin.emit('error',new Error(SECRET)) }
      child.kill = () => {}
      if (options.hangQuery === command) return child // kill deliberately emits no close.
      queueMicrotask(async () => {
        if (options.beforeQuery) await options.beforeQuery(command, args)
        let text = ''
        let code = 0
        if (command === 'netstat') {
          if (failQuery) code = 1
          else text = [...listeners].map(([port,pid]) => `  TCP    127.0.0.1:${port}    0.0.0.0:0    LISTENING    ${pid}`).join('\n')
        } else if (command === 'powershell.exe') {
          if (args.includes('-Preflight')) code = options.preflightFailure ? 1 : 0
          else {
            const pid = Number(args.at(-1).match(/ProcessId = (\d+)/)?.[1])
            text = identities.has(pid) ? JSON.stringify(identities.get(pid)) : ''
          }
        } else if (command === 'taskkill') {
          assert.ok(!args.includes('/F'))
          if (stopFailure) code = 1
          else {
            const pid = Number(args.at(-1))
            for (const [port, owner] of listeners) if (owner === pid) listeners.delete(port)
            identities.delete(pid)
            children.get(pid)?.emit('exit', 0, null)
          }
        } else if (command === 'stdin-fixture') text='input accepted'
        else throw new Error('Unexpected system command: '+command)
        child.stdout.emit('data', text)
        if (command === 'taskkill' && code !== 0) {
          for (const chunk of options.stopStderr ?? []) child.stderr.emit('data', chunk)
        }
        child.emit('close', code)
      })
      return child
    },
  }
  globalThis.__hostFixture = f
  globalThis.fetch = async (url, init = {}) => {
    if (options.fetch) return options.fetch(url, init)
    if (url.endsWith('/health')) return { ok: healthUp, status: healthUp ? 200 : 503, json: async () => ({ status: 'healthy' }) }
    if (init.method === 'PATCH') {
      const body = JSON.parse(init.body)
      // Match the running API's BankConfigUpdate/OpenAPI contract: updates is
      // a required object. The former permissive flat-body mock hid HTTP 422.
      if (!body.updates || typeof body.updates !== 'object' || Array.isArray(body.updates)) {
        return { ok: false, status: 422, json: async () => ({ detail: [{ loc: ['body', 'updates'], type: 'missing' }] }) }
      }
      patches.push(body)
      policy = body.updates.memory_defense
      return { ok: true, status: 200, json: async () => ({ config: { memory_defense: policy } }) }
    }
    if (url.endsWith('/config')) return { ok: true, status: 200, json: async () => ({ config: { memory_defense: policy } }) }
    if (url.endsWith('/banks')) return { ok: true, status: 200, json: async () => ({ banks: [] }) }
    return { ok: true, status: 200, json: async () => ({}) }
  }
  // data: fixture modules have no relative base; dependencies still use injected I/O.
  let source = original.replace(/from '(\.\/[^']+)'/g, (_match, relative) =>
    `from '${new URL('../lib/' + relative.slice(2), import.meta.url).href}'`)
  const substitutions = [
    ["import { spawn } from 'node:child_process'", 'const { spawn } = globalThis.__hostFixture'],
    [`import { prepareServiceLaunch, requestServiceControl, validServiceControl, assertPrivateReceipt, writePrivateReceipt, resolveServiceEntry } from '${new URL('../lib/service-control.js', import.meta.url).href}'`,
      `const { prepareServiceLaunch, requestServiceControl, assertPrivateReceipt, writePrivateReceipt } = globalThis.__hostFixture.serviceControl; import { validServiceControl, resolveServiceEntry } from '${new URL('../lib/service-control.js', import.meta.url).href}'`],
    ["import { closeSync, existsSync, openSync, readSync } from 'node:fs'", 'const { closeSync, existsSync, openSync, readSync } = globalThis.__hostFixture.fs'],
    ["import { copyFile, mkdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises'", 'const { copyFile, mkdir, readFile, rename, stat, unlink, writeFile } = globalThis.__hostFixture.fsp'],
    ["import { homedir } from 'node:os'", "const homedir = () => '/fixture'"],
    ['const STARTUP_TIMEOUT_MS = 90_000', 'const STARTUP_TIMEOUT_MS = 5'],
  ]
  for (const [before, after] of substitutions) { assert.ok(source.includes(before), 'mock boundary changed'); source = source.replace(before, after) }
  source = 'const process = globalThis.__hostFixture.process;\n'+source+
    '\nexport { resolveServerEntry, redact, hash, stableJson, readJsonFile, atomicMerge, normalizeServerModels, normalizeProviderOverrides, normalizeServerEmbeddings, publicServerEmbeddings, normalizeServerEnv, sanitizePatch, apiTarget, buildServerEnv, createServerState, collect, runServerAction, startServer, restartServer, preflightServer, ownershipView, execCapture, ownsProcess, mergeMemoryDefense, fetchLlmModels };\n// fixture '+(++moduleId)
  const m = await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))
  const state = m.createServerState()
  const ctx = {
    get: key => key === 'credentials' ? (options.credentials ?? { resolve: async () => undefined }) : key === 'llm' ? options.llm : undefined,
    logger: { warn() {} },
    webServer: { port: 59333, register: r => { assert.ok(!routes.has(r.path)); routes.set(r.path,r.handler); return () => routes.delete(r.path) } },
    inject: (_names, callback) => callback(ctx),
    effect: callback => { const dispose = callback(); ctx.dispose = () => { disposed = true; dispose() } },
  }
  m.apply(ctx)
  const request = async (suffix, body, overrides = {}, peer = '127.0.0.1') => {
    const req = new EventEmitter()
    req.method = body === undefined ? 'GET' : 'POST'
    req.socket = { remoteAddress: peer }
    req.url = '/plugins/dsh-hindsight-gui/'+suffix
    req.headers = { host: '127.0.0.1:59333', origin: 'http://127.0.0.1:59333', ...overrides }
    req.resume = () => {}
    const res = { destroyed: false, writableEnded: false, writeHead(code) { this.code = code }, end(text) { this.body = JSON.parse(text) } }
    const handler = routes.get('/plugins/dsh-hindsight-gui/'+suffix.split('?')[0])
    assert.ok(handler)
    const pending = handler(req,res)
    if (body !== undefined) queueMicrotask(() => { req.emit('data',Buffer.from(JSON.stringify(body))); req.emit('end') })
    await pending
    return res
  }
  return { m, state, ctx, files, configPath, guiPath, listeners, identities, launches, writes, patches, commands, controlRequests, request,
    setFailQuery: value => { failQuery = value }, setStopFailure: value => { stopFailure = value }, setFailSpawn: value => { failSpawn = value },
    setHealth: value => { healthUp = value }, setBeforeRead: fn => { beforeRead = fn }, setBeforeWrite: fn => { beforeWrite = fn },
    get disposed() { return disposed }, get policy() { return policy } }
}

let passed = 0
async function test(name, fn) { await fn(); passed++; console.log('PASS '+name) }
const gui = { serverCommand: '/fixture/api.exe' }
const config = { apiUrl: 'http://127.0.0.1:8888' }

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
await test('Windows service startup hides Python without allocating a detached console', async () => {
  const f = await fixture()
  await f.m.startServer(gui, config, f.state, f.ctx)
  const launch = f.launches[0]
  assert.equal(launch.options.detached, false)
  assert.equal(launch.options.windowsHide, true)
  assert.deepEqual(launch.options.stdio, ['ignore', 7, 7])
  assert.equal(launch.child.unreferenced, true)
  assert.ok(launch.command.endsWith('python.exe'))
})
await test('uv exported launcher does not hide its installed API Python environment', async () => {
  const api = '/fixture/uv/tools/hindsight-api/Scripts/hindsight-api.exe'
  const python = '/fixture/uv/tools/hindsight-api/Scripts/python.exe'
  const f = await fixture({ env: { PATH: '/fixture/bin', APPDATA: '/fixture' },
    entryFiles: ['/fixture/bin/hindsight-api.exe', api, python] })
  const resolved = f.m.resolveServerEntry({})
  assert.equal(resolved.entry.command.replaceAll(String.fromCharCode(92), '/'), api)
  assert.equal(resolved.entry.source, 'default install location')
  const launch = resolveServiceEntry({}, resolved.entry, 'win32')
  assert.equal(launch.command.replaceAll(String.fromCharCode(92), '/'), python)
  assert.equal(f.launches.length, 0)
})
await test('custom uv tool directory is checked without invoking uv or generic Python', async () => {
  const api = '/custom/tools/hindsight-api/Scripts/hindsight-api.exe'
  const f = await fixture({ env: { UV_TOOL_DIR: '/custom/tools' },
    entryFiles: [api, '/custom/tools/hindsight-api/Scripts/python.exe'] })
  assert.equal(f.m.resolveServerEntry({}).entry.command.replaceAll(String.fromCharCode(92), '/'), api)
  assert.equal(f.commands.length, 0)
})
await test('launcher-only discovery reports missing Python and preserves explicit overrides', async () => {
  const f = await fixture({ env: { PATH: '/fixture/bin', APPDATA: '/fixture' },
    entryFiles: ['/fixture/bin/hindsight-api.exe'] })
  assert.equal(f.m.resolveServerEntry({}).entry, null)
  assert.match(f.m.resolveServerEntry({}).reason, /Python/)
  assert.equal(f.m.resolveServerEntry({ serverCommand: '/fixture/bin/hindsight-api.exe' }).entry.source, 'config')
  assert.equal(f.m.resolveServerEntry({ serverPython: '/missing/python.exe' }).entry, null)
})
await test('a complete PATH API environment retains priority over uv fallback', async () => {
  const f = await fixture({ env: { PATH: '/fixture/bin', UV_TOOL_DIR: '/custom/tools' },
    entryFiles: ['/fixture/bin/hindsight-api.exe', '/fixture/bin/python.exe',
      '/custom/tools/hindsight-api/Scripts/hindsight-api.exe', '/custom/tools/hindsight-api/Scripts/python.exe'] })
  assert.equal(f.m.resolveServerEntry({}).entry.source, 'PATH')
})
await test('URL validation, remote management fence and base-path preservation', async () => {
  const {m} = await fixture()
  assert.throws(() => m.sanitizePatch({ apiUrl:'file:///bad' }), /apiUrl/)
  assert.equal(m.apiTarget({apiUrl:'https://example.invalid/memory'}).base,'https://example.invalid/memory')
  assert.equal(m.apiTarget({apiUrl:'https://example.invalid/memory'}).local,false)
  assert.throws(() => m.apiTarget({apiUrl:'bad'}))
  assert.equal(m.apiTarget({apiUrl:'http://[::1]:8888'}).local,false)
})
await test('strict models/overrides/env validation and explicit secret semantics', async () => {
  const {m} = await fixture()
  assert.equal(m.normalizeServerModels({reflect:42}),null)
  assert.equal(m.normalizeServerEnv({NODE_OPTIONS:'--bad'}),null)
  assert.equal(m.normalizeProviderOverrides({p:{baseUrl:'https://u:p@example.invalid'}}),null)
  const existing = {p:{apiKey:SECRET,baseUrl:'https://example.invalid/v1'}}
  assert.equal(m.normalizeProviderOverrides({p:{apiKey:''}},existing).p.apiKey,SECRET)
  assert.equal(m.normalizeProviderOverrides({p:{baseUrl:''}},existing).p.apiKey,SECRET)
  assert.equal(m.normalizeProviderOverrides({p:{clearApiKey:true}},existing).p.apiKey,undefined)
  assert.equal(m.normalizeProviderOverrides({p:{apiKey:'SYNTHETIC_REPLACEMENT'}},existing).p.apiKey,'SYNTHETIC_REPLACEMENT')
})
await test('status and config-save response never echo stored credentials', async () => {
  const f = await fixture({gui:{providerOverrides:{fixture:{apiKey:SECRET}},serverEnv:{HINDSIGHT_API_LLM_API_KEY:SECRET}}})
  const res = await f.request('status')
  assert.equal(res.body.gui.providerOverrides.fixture.secretConfigured,true)
  assert.ok(!JSON.stringify(res.body).includes(SECRET))
  assert.ok(!('apiKey' in res.body.gui.providerOverrides.fixture))
  const saved = await f.request('config',{configRevision:res.body.config.revision,guiRevision:res.body.gui.revision,providerOverrides:{fixture:{apiKey:''}}})
  assert.equal(saved.code,200)
  assert.ok(!JSON.stringify(saved.body).includes(SECRET))
})
await test('credential references use host service, normalize provider ids and fail closed', async () => {
  const names=[]
  const f = await fixture({credentials:{resolve:async name => { names.push(name); return name==='FIXTURE_CN_API_KEY'?{value:SECRET,source:'file'}:undefined }}})
  const built=await f.m.buildServerEnv({serverModels:{reflect:'fixture-cn/model'},providerOverrides:{'fixture-cn':{baseUrl:'https://example.invalid/v1'}}},f.ctx)
  assert.deepEqual(names,['FIXTURE_CN_API_KEY'])
  assert.equal(built.env.HINDSIGHT_API_LLM_API_KEY,SECRET)
  const unavailable=await f.m.buildServerEnv({serverModels:{reflect:'openai/model'}},{get:()=>({resolve:async()=>{throw new Error(SECRET)}})})
  assert.equal(unavailable.resolutions[0].mode,'error')
  assert.ok(!JSON.stringify(unavailable.resolutions).includes(SECRET))
})
await test('bare model uses inherited provider and GUI overrides agree with final preview', async () => {
  const f=await fixture({env:{HINDSIGHT_API_LLM_PROVIDER:'openai',HINDSIGHT_API_LLM_API_KEY:SECRET}})
  const bare=await f.m.buildServerEnv({serverModels:{reflect:'plain-model'}},f.ctx)
  assert.equal(bare.resolutions[0].model,'plain-model')
  assert.equal(bare.resolutions[0].mode,'override')
  const built=await f.m.buildServerEnv({serverModels:{reflect:'fixture/model-a'},providerOverrides:{fixture:{baseUrl:'https://example.invalid/v1',apiKey:SECRET}},serverEnv:{HINDSIGHT_API_LLM_MODEL:'model-b'}},f.ctx)
  assert.equal(built.resolutions[0].model,built.env.HINDSIGHT_API_LLM_MODEL)
  const missing=await (await fixture()).m.buildServerEnv({serverModels:{reflect:'plain-model'}})
  assert.equal(missing.resolutions[0].mode,'error')
})
await test('foreign listener and remote URL cause no launch or termination', async () => {
  const f=await fixture()
  f.listeners.set(8888,999)
  await assert.rejects(f.m.restartServer(gui,config,f.state,f.ctx),/非本插件/)
  await assert.rejects(f.m.startServer(gui,{apiUrl:'http://example.invalid:8888'},f.state,f.ctx),/只支持连接/)
  assert.equal(f.launches.length,0)
  assert.ok(!f.commands.some(c=>c.command==='taskkill'))
})
await test('preflight errors preserve a managed running service', async () => {
  const f=await fixture()
  await f.m.startServer(gui,config,f.state,f.ctx)
  await assert.rejects(f.m.restartServer({...gui,serverModels:{reflect:'unknown/model'}},config,f.state,f.ctx),/Base URL/)
  assert.equal(f.launches.length,1)
  assert.ok(!f.commands.some(c=>c.command==='taskkill'))
})
await test('managed restart verifies identity and requests non-force termination', async () => {
  const f=await fixture()
  await f.m.startServer(gui,config,f.state,f.ctx)
  const oldPid=f.state.managedPid
  await f.m.restartServer(gui,config,f.state,f.ctx)
  assert.equal(f.launches.length,2)
  assert.notEqual(f.state.managedPid,oldPid)
  assert.deepEqual(f.commands.find(c=>c.command==='taskkill').args,['/PID',String(oldPid)])
  assert.ok(f.state.runningConfig)
})
await test('private writer input travels through stdin and EPIPE diagnostics never echo it', async () => {
  const f=await fixture()
  assert.equal(await f.m.execCapture('stdin-fixture',[],8000,{input:SECRET}),'input accepted')
  assert.equal(f.commands[0].input,SECRET)
  assert.ok(!f.commands[0].args.includes(SECRET))
  const failed=await fixture({inputFailure:true})
  await assert.rejects(failed.m.execCapture('stdin-fixture',[],8000,{input:SECRET}),error=>{assert.match(error.message,/输入通道/);assert.ok(!error.message.includes(SECRET));return true})
})
await test('Python interpreter settings validate, project safely and participate in pending restart', async () => {
  const f=await fixture()
  const before=await f.request('status')
  const invalid=await f.request('config',{serverPython:42,guiRevision:before.body.gui.revision})
  assert.equal(invalid.code,400)
  const saved=await f.request('config',{serverPython:' /fixture/python.exe ',guiRevision:before.body.gui.revision})
  assert.equal(saved.code,200)
  assert.equal(saved.body.gui.serverPython,'/fixture/python.exe')
  assert.equal(saved.body.gui.pendingRestart,true)
  assert.equal(JSON.parse(f.files.get(f.guiPath)).serverPython,'/fixture/python.exe')
  assert.equal(f.launches.length,0)
})
await test('control capability never appears in status or action responses', async () => {
  const f=await fixture({cooperative:true})
  const action=await f.m.startServer(gui,config,f.state,f.ctx)
  const token=f.state.serviceControl.token
  const status=await f.request('status')
  assert.ok(!JSON.stringify(action).includes(token))
  assert.ok(!JSON.stringify(status.body).includes(token))
  assert.ok(!JSON.stringify(status.body).includes('DSH_HINDSIGHT_CONTROL_TOKEN'))
})
await test('in-process restart verifies service identity, retains private receipt and never calls taskkill', async () => {
  const f = await fixture({cooperative:true})
  await f.m.startServer(gui,config,f.state,f.ctx)
  const originalControl = structuredClone(f.state.serviceControl)
  assert.equal(originalControl.kind,'http')
  assert.equal(originalControl.base,config.apiUrl)
  const receipt = JSON.parse(f.files.get(f.guiPath+'.server.json'))
  assert.deepEqual(receipt.serviceControl,originalControl)
  await f.m.restartServer(gui,config,f.state,f.ctx)
  assert.equal(f.launches.length,2)
  assert.equal(f.controlRequests.filter(r=>r.action==='stop').length,1)
  assert.deepEqual(f.controlRequests.find(r=>r.action==='stop').control,originalControl)
  assert.ok(!f.commands.some(c=>c.command==='taskkill'))
})
await test('Python/version/extension preflight failure preserves a running server', async () => {
  const options = {cooperative:true}
  const f = await fixture(options)
  await f.m.startServer(gui,config,f.state,f.ctx)
  const pid = f.state.managedPid
  options.preflightFailure = true
  await assert.rejects(f.m.restartServer(gui,config,f.state,f.ctx), error => {
    assert.equal(error.status,503)
    assert.match(error.message,/Python.*版本.*HTTP/)
    assert.match(error.message,/未停止原服务/)
    return true
  })
  assert.equal(f.launches.length,1)
  assert.equal(f.listeners.get(8888),pid)
  assert.ok(f.state.runningConfig)
  assert.equal(f.controlRequests.filter(r=>r.action==='stop').length,0)
  assert.ok(!f.commands.some(c=>c.command==='taskkill'))
  const fresh = await fixture({cooperative:true,preflightFailure:true})
  await assert.rejects(fresh.m.startServer(gui,config,fresh.state,fresh.ctx),/预检失败/)
  assert.equal(fresh.launches.length,0)
})
await test('cooperative receipt survives manager recovery and retains its exact shutdown channel', async () => {
  const f=await fixture({cooperative:true})
  await f.m.startServer(gui,config,f.state,f.ctx)
  const control=structuredClone(f.state.serviceControl)
  f.identities.delete(123)
  globalThis.__hostFixture.process.pid=124
  f.identities.set(124,{pid:124,executable:'/fixture/dsh.exe',started:'2026-10-13T10:00:00Z'})
  const recovered=f.m.createServerState()
  assert.equal((await f.m.ownershipView(recovered,f.m.apiTarget(config))).ownership,'managed')
  assert.deepEqual(recovered.serviceControl,control)
  await f.m.restartServer(gui,config,recovered,f.ctx)
  assert.deepEqual(f.controlRequests.find(r=>r.action==='stop').control,control)
  assert.equal(f.launches.length,2)
  assert.ok(!f.commands.some(c=>c.command==='taskkill'))
})
await test('corrupt cooperative receipt never opens a shutdown channel', async () => {
  const f=await fixture({cooperative:true})
  await f.m.startServer(gui,config,f.state,f.ctx)
  const receipt=JSON.parse(f.files.get(f.guiPath+'.server.json'))
  receipt.serviceControl.base='https://attacker.invalid'
  f.files.set(f.guiPath+'.server.json',JSON.stringify(receipt))
  const view=await f.m.ownershipView(f.m.createServerState(),f.m.apiTarget(config))
  assert.equal(view.ownership,'unknown')
  assert.equal(view.canRestart,false)
  assert.match(view.ownershipError,/协作关闭记录无效/)
  assert.equal(f.controlRequests.filter(r=>r.action==='stop').length,0)
})
await test('cooperative shutdown channel failure never falls back to kill or relaunch', async () => {
  const f = await fixture({cooperative:true})
  await f.m.startServer(gui,config,f.state,f.ctx)
  f.state.disposed = true
  f.state.controller.abort() // A disposed controller cannot issue any new shutdown request.
  await assert.rejects(f.m.restartServer(gui,config,f.state,f.ctx),/卸载/)
  assert.equal(f.launches.length,1)
  assert.ok(!f.commands.some(c=>c.command==='taskkill'))
  const options = {cooperative:true}
  const failing = await fixture(options)
  await failing.m.startServer(gui,config,failing.state,failing.ctx)
  const pid = failing.state.managedPid
  options.controlFailure = true
  await assert.rejects(failing.m.restartServer(gui,config,failing.state,failing.ctx),/通道不可用/)
  assert.equal(failing.launches.length,1)
  assert.ok(!failing.commands.some(c=>c.command==='taskkill'))
  assert.equal(failing.listeners.get(8888),pid)
})
await test('in-process shutdown rejects a reused listener identity', async () => {
  const f = await fixture({cooperative:true})
  await f.m.startServer(gui,config,f.state,f.ctx)
  f.identities.get(f.state.managedPid).started='reused-pid'
  await assert.rejects(f.m.restartServer(gui,config,f.state,f.ctx),/身份|非本插件|不属于/)
  assert.equal(f.controlRequests.filter(r=>r.action==='stop').length,0)
  assert.equal(f.launches.length,1)
  assert.ok(!f.commands.some(c=>c.command==='taskkill'))
})
await test('unprotected control receipts stop restart before any shutdown request', async () => {
  const options={cooperative:true}
  const f=await fixture(options)
  await f.m.startServer(gui,config,f.state,f.ctx)
  const pid=f.state.managedPid
  options.unsafeReceipt=true
  await assert.rejects(f.m.restartServer(gui,config,f.state,f.ctx),/私有/)
  assert.equal(f.controlRequests.filter(r=>r.action==='stop').length,0)
  assert.equal(f.listeners.get(8888),pid)
  assert.equal(f.launches.length,1)
})
await test('PID reuse, unknown process identity and listener replacement are not owned', async () => {
  const f=await fixture()
  await f.m.startServer(gui,config,f.state,f.ctx)
  f.identities.get(f.state.managedPid).started='different-start'
  await assert.rejects(f.m.restartServer(gui,config,f.state,f.ctx),/非本插件|不属于/)
  assert.ok(!f.commands.some(c=>c.command==='taskkill'))
  f.setFailQuery(true)
  const view=await f.m.ownershipView(f.state,f.m.apiTarget(config))
  assert.equal(view.ownership,'unknown')
  assert.equal(view.canRestart,false)
})
await test('port changes stop only the recorded original service', async () => {
  const f=await fixture()
  await f.m.startServer(gui,config,f.state,f.ctx)
  const oldPid=f.state.managedPid
  await f.m.restartServer(gui,{apiUrl:'http://127.0.0.1:8889'},f.state,f.ctx)
  assert.deepEqual(f.commands.find(c=>c.command==='taskkill').args,['/PID',String(oldPid)])
  assert.equal(f.listeners.has(8888),false)
  assert.equal(f.listeners.get(8889),f.state.managedPid)
})
await test('stop failure does not force-stop or spawn again', async () => {
  const f=await fixture()
  await f.m.startServer(gui,config,f.state,f.ctx)
  f.setStopFailure(true)
  await assert.rejects(f.m.restartServer(gui,config,f.state,f.ctx),/不会强制/)
  assert.equal(f.launches.length,1)
  assert.ok(f.state.runningConfig)
})
await test('stop diagnostics retain split UTF-8 stderr and redact credentials', async () => {
  const bytes = Buffer.from('错误：普通终止被拒绝。 api_key='+SECRET+'\nhttps://user:pass@example.invalid/\u001b[31m')
  const f=await fixture({stopStderr:[bytes.subarray(0,2),bytes.subarray(2)]})
  await f.m.startServer(gui,config,f.state,f.ctx)
  f.setStopFailure(true)
  await assert.rejects(f.m.restartServer(gui,config,f.state,f.ctx), error => {
    assert.equal(error.status,503)
    assert.match(error.message,/taskkill.*code 1/)
    assert.match(error.message,/普通终止被拒绝/)
    assert.match(error.message,/手动关闭/)
    assert.ok(!error.message.includes(SECRET))
    assert.ok(!error.message.includes('user:pass'))
    assert.ok(!error.message.includes('\u001b'))
    return true
  })
  assert.equal(f.launches.length,1)
  assert.ok(f.listeners.has(8888))
})
await test('stop stderr is bounded and unknown Windows encoding is not guessed', async () => {
  for (const [chunks, expected] of [
    [[], /stderr 为空/],
    [[Buffer.from([0xd6,0xd0,0xce,0xc4])], /编码未知/],
    [['x'.repeat(100000)], /已截断/],
  ]) {
    const f=await fixture({stopStderr:chunks})
    await f.m.startServer(gui,config,f.state,f.ctx)
    f.setStopFailure(true)
    await assert.rejects(f.m.restartServer(gui,config,f.state,f.ctx), error => {
      assert.match(error.message,expected)
      assert.ok(error.message.length < 4500)
      return true
    })
    assert.equal(f.launches.length,1)
  }
})
await test('asynchronous spawn error is handled without unhandled error event', async () => {
  const f=await fixture()
  f.setFailSpawn(true)
  await assert.rejects(f.m.startServer(gui,config,f.state,f.ctx))
  assert.equal(f.state.exited,true)
  assert.equal(f.state.managedPid,null)
  assert.ok(!f.state.spawnError.includes(SECRET))
})
await test('launcher PID mismatch never adopts or kills the Python listener', async () => {
  const f=await fixture({launcher:true})
  await assert.rejects(f.m.startServer(gui,config,f.state,f.ctx),/launcher/)
  assert.equal(f.launches.length,1)
  assert.equal((await f.m.ownershipView(f.state,f.m.apiTarget(config))).canRestart,false)
  assert.ok(!f.commands.some(c=>c.command==='taskkill'))
})
await test('health timeout retains live child and blocks duplicate start', async () => {
  const f=await fixture()
  f.setHealth(false)
  await assert.rejects(f.m.startServer(gui,config,f.state,f.ctx),/超时/)
  assert.equal(f.state.timedOut,true)
  assert.equal(f.state.exited,false)
  await assert.rejects(f.m.startServer(gui,config,f.state,f.ctx),/存活/)
  assert.equal(f.launches.length,1)
})
await test('verified two-level Windows launcher descendants are managed and restartable', async () => {
  const f = await fixture({descendant:true})
  await f.m.startServer(gui,config,f.state,f.ctx)
  assert.notEqual(f.state.managedPid,f.state.child.pid)
  assert.equal((await f.m.ownershipView(f.state,f.m.apiTarget(config))).ownership,'managed')
  const oldPid = f.state.managedPid
  await f.m.restartServer(gui,config,f.state,f.ctx)
  assert.deepEqual(f.commands.find(c=>c.command==='taskkill').args,['/PID',String(oldPid)])
  assert.equal(f.launches.length,2)
  const currentPid = f.state.managedPid
  f.launches[0].child.emit('exit',0,null)
  assert.equal(f.state.managedPid,currentPid,'late launcher exit cannot clear the replacement')
})
await test('a new DSH PID recovers the exact listener receipt, even after reparenting', async () => {
  const f = await fixture({descendant:true})
  await f.m.startServer(gui,config,f.state,f.ctx)
  const listener = f.state.managedPid
  const snapshot = f.state.runningConfig
  f.identities.delete(123)
  f.identities.delete(f.state.child.pid)
  f.identities.get(listener).parentPid = 1
  globalThis.__hostFixture.process.pid = 124
  f.identities.set(124,{pid:124,executable:'/fixture/dsh.exe',started:'2026-10-13T10:00:00Z'})
  const recovered = f.m.createServerState()
  const view = await f.m.ownershipView(recovered,f.m.apiTarget(config))
  assert.equal(view.ownership,'managed')
  assert.equal(view.canRestart,true)
  assert.equal(recovered.managedPid,listener)
  assert.deepEqual(recovered.runningConfig,snapshot)
  assert.ok(!JSON.stringify([...f.files.values()]).includes(SECRET))
  await f.m.restartServer(gui,config,recovered,f.ctx)
  assert.equal(f.launches.length,2)
})
await test('receipts reject reused PID, foreign listener and a still-live other manager', async () => {
  const f = await fixture()
  await f.m.startServer(gui,config,f.state,f.ctx)
  const oldPid = f.state.managedPid
  globalThis.__hostFixture.process.pid = 124
  f.identities.set(124,{pid:124,executable:'/fixture/dsh.exe',started:'2026-10-13T10:00:00Z'})
  const contested = await f.m.ownershipView(f.m.createServerState(),f.m.apiTarget(config))
  assert.equal(contested.ownership,'unknown')
  assert.match(contested.ownershipError,/另一个存活/)
  f.identities.delete(123)
  f.identities.get(oldPid).started = 'reused-pid'
  assert.equal((await f.m.ownershipView(f.m.createServerState(),f.m.apiTarget(config))).ownership,'unmanaged')
  assert.ok(!f.commands.some(c=>c.command==='taskkill'))
})
await test('query timeout settles even when kill never emits close', async () => {
  const f = await fixture({hangQuery:'netstat'})
  // Keep the test runner alive; production has the HTTP request/host event loop.
  const keepAlive = setTimeout(()=>{},100)
  try { await assert.rejects(f.m.execCapture('netstat',[],5),/超时/) }
  finally { clearTimeout(keepAlive) }
})
await test('late identity polling cannot erase a replacement launch', async () => {
  let block = null
  let entered = null
  const f = await fixture({beforeQuery:async (command,args) => {
    if (block && command === 'powershell.exe' && /ProcessId = 401/.test(args.at(-1))) {
      entered()
      await block
    }
  }})
  await f.m.startServer(gui,config,f.state,f.ctx)
  let release
  block = new Promise(resolve => { release = resolve })
  const waiting = new Promise(resolve => { entered = resolve })
  const query = f.m.ownsProcess(f.state)
  await waiting
  const replacement = {pid:999,executable:'/fixture/api.exe',started:'replacement'}
  f.state.identity = replacement
  f.state.managedPid = 999
  f.state.runningConfig = {fingerprint:'replacement'}
  release()
  assert.equal(await query,false)
  assert.equal(f.state.managedPid,999)
  assert.equal(f.state.exited,false)
  assert.equal(f.state.runningConfig.fingerprint,'replacement')
})
await test('late health confirmation retains the original launch fingerprint', async () => {
  const f = await fixture()
  f.setHealth(false)
  await assert.rejects(f.m.startServer(gui,config,f.state,f.ctx),/超时/)
  f.files.set(f.guiPath,JSON.stringify({...gui,auditLogEnabled:true}))
  f.setHealth(true)
  const status = await f.m.collect(f.ctx,f.state)
  assert.equal(status.server.runtimeConfigKnown,true)
  assert.equal(status.server.pendingRestart,true)
  assert.equal(status.server.runningConfig.auditLogEnabled,false)
})
await test('simultaneous service actions are fenced and dispose revokes ownership', async () => {
  const f=await fixture({gui})
  const running=f.m.runServerAction('start',f.state,f.ctx)
  await assert.rejects(f.m.runServerAction('start',f.state,f.ctx),/正在执行/)
  await running
  assert.equal(f.launches.length,1)
  f.state.disposed=true; f.state.controller.abort(); f.state.identity=null
  await assert.rejects(f.m.runServerAction('restart',f.state,f.ctx),/卸载/)
  const foreign=f.m.createServerState()
  assert.equal((await f.m.ownershipView(foreign,f.m.apiTarget(config))).ownership,'managed')
})
await test('corrupt config is reported and never overwritten', async () => {
  const f=await fixture()
  f.files.set(f.configPath,'{bad json')
  const status=await f.request('status')
  assert.ok(status.body.config.error)
  const saved=await f.request('config',{disabled:true,configRevision:status.body.config.revision})
  assert.equal(saved.code,409)
  assert.equal(f.files.get(f.configPath),'{bad json')
})
await test('stale revisions fail without writes; identical save does not mark pending', async () => {
  const f=await fixture({gui:{serverModels:{reflect:''}}})
  const initial=(await f.request('status')).body
  const stale=await f.request('config',{disabled:true,configRevision:'stale'})
  assert.equal(stale.code,409)
  assert.equal(f.writes.length,0)
  const same=await f.request('config',{serverModels:{reflect:''},guiRevision:initial.gui.revision})
  assert.equal(same.code,200)
  assert.equal(same.body.server.pendingRestart,false)
})
await test('effective launch fingerprint tracks pending changes without stale clear', async () => {
  const f=await fixture({gui})
  await f.m.startServer(gui,config,f.state,f.ctx)
  assert.equal((await f.m.collect(f.ctx,f.state)).server.pendingRestart,false)
  f.files.set(f.guiPath,JSON.stringify({...gui,auditLogEnabled:true}))
  assert.equal((await f.m.collect(f.ctx,f.state)).server.pendingRestart,true)
})
await test('automatic Python entry stays consistent with preview and clears pending restart', async () => {
  const f=await fixture({cooperative:true,gui})
  await f.m.startServer(gui,config,f.state,f.ctx)
  const view=await f.m.collect(f.ctx,f.state)
  assert.ok(f.state.entry.command.endsWith('python.exe'))
  assert.equal(view.server.entry.command,f.state.entry.command)
  assert.equal(view.server.pendingRestart,false)
  assert.equal(view.server.controlReady,true)
  assert.equal(f.launches[0].args[0],'/fixture/dsh_hindsight_control.py')
})
await test('healthy API with failed control handshake is not confirmed by late polling or recovery', async () => {
  const f=await fixture({cooperative:true,controlFailure:true,gui})
  await assert.rejects(f.m.startServer(gui,config,f.state,f.ctx),error=>error.status===503 && /协作控制握手失败/.test(error.message))
  assert.equal(f.state.runningConfig,null)
  assert.ok(f.files.has(f.guiPath+'.server.json'),'retain ownership evidence to prevent duplicate launch')
  const first=await f.m.collect(f.ctx,f.state)
  const recovered=(await f.request('status')).body
  for(const view of [first,recovered]){
    assert.equal(view.api.up,true)
    assert.equal(view.server.controlReady,false)
    assert.equal(view.server.runtimeConfigKnown,false)
    assert.equal(view.server.canRestart,false)
    assert.match(view.server.controlError,/协作控制握手失败/)
  }
  assert.equal(f.state.runningConfig,null)
  assert.equal(f.launches.length,1)
  assert.ok(f.controlRequests.every(request=>request.action==='identity'))
})
await test('unhealthy API remains restartable when its owned control channel is valid', async () => {
  const f=await fixture({cooperative:true,gui})
  await f.m.startServer(gui,config,f.state,f.ctx)
  f.setHealth(false)
  const status=await f.m.collect(f.ctx,f.state)
  assert.equal(status.api.up,false)
  assert.equal(status.server.controlReady,true)
  assert.equal(status.server.canRestart,true)
  assert.equal(status.server.controlError,null)
})
await test('control failure after readiness revokes restart until a fresh successful handshake', async () => {
  const options={cooperative:true,gui}
  const f=await fixture(options)
  await f.m.startServer(gui,config,f.state,f.ctx)
  options.controlFailure=true
  const failed=await f.m.collect(f.ctx,f.state)
  assert.equal(failed.server.controlReady,false)
  assert.equal(failed.server.canRestart,false)
  assert.equal(failed.server.runtimeConfigKnown,false)
  options.controlFailure=false
  const restored=await f.m.collect(f.ctx,f.state)
  assert.equal(restored.server.controlReady,true)
  assert.equal(restored.server.controlError,null)
  assert.equal(restored.server.canRestart,true)
  assert.equal(restored.server.runtimeConfigKnown,true)
  assert.equal(restored.server.pendingRestart,false)
  assert.equal(f.launches.length,1)
})
await test('external write conflicts and dispose prevent late config rename', async () => {
  const f=await fixture()
  const record=await f.m.readJsonFile(f.guiPath)
  f.setBeforeWrite(async path=>{if(path.includes('.tmp-')) f.files.set(f.guiPath,JSON.stringify({external:true}))})
  await assert.rejects(f.m.atomicMerge(f.guiPath,{autoStart:true},record,f.state),/其他操作/)
  assert.equal(JSON.parse(f.files.get(f.guiPath)).external,true)
  f.setBeforeWrite(async path=>{if(path.includes('.tmp-')) { f.state.disposed=true; f.state.controller.abort() }})
  const latest=await f.m.readJsonFile(f.guiPath)
  await assert.rejects(f.m.atomicMerge(f.guiPath,{autoStart:true},latest,f.state),/卸载/)
  assert.equal(JSON.parse(f.files.get(f.guiPath)).autoStart,undefined)
})
await test('bank policy edits preserve custom/block rules and verify persisted result', async () => {
  const f=await fixture()
  const on=await f.request('bankdefense',{bankId:'fixture-bank',apiUrl:'http://127.0.0.1:8888',enabled:true})
  assert.equal(on.code,200)
  assert.deepEqual(Object.keys(f.patches[0]),['updates'])
  assert.deepEqual(Object.keys(f.patches[0].updates),['memory_defense'])
  assert.equal(f.policy.rules.length,3)
  assert.ok(f.policy.rules.some(r=>r.action==='block'&&r.on==='sensitive_data'))
  const off=await f.request('bankdefense',{bankId:'fixture-bank',apiUrl:'http://127.0.0.1:8888',enabled:false})
  assert.equal(off.code,200)
  assert.equal(f.policy.enabled,true)
  assert.equal(f.policy.rules.length,2)
  const invalid=await f.request('bankdefense',{bankId:'fixture-bank'})
  assert.equal(invalid.code,400)
})
await test('BankConfigUpdate rejects the old flat body; nested updates enable and disable redaction', async () => {
  const originalPolicy = { enabled:false, rules:[] }
  const f = await fixture({policy:originalPolicy})
  const rejected = await globalThis.fetch('http://127.0.0.1:8888/v1/default/banks/fixture-bank/config',{
    method:'PATCH',body:JSON.stringify({memory_defense:{enabled:true,rules:[{on:'sensitive_data',action:'redact'}]}}),
  })
  assert.equal(rejected.status,422)
  assert.deepEqual((await rejected.json()).detail[0].loc,['body','updates'])
  assert.equal(f.patches.length,0,'invalid request cannot persist a policy')
  assert.deepEqual(f.policy,originalPolicy)
  const on = await f.request('bankdefense',{bankId:'fixture-bank',apiUrl:'http://127.0.0.1:8888',enabled:true})
  assert.equal(on.code,200)
  assert.deepEqual(on.body.memoryDefense,{enabled:true,rules:[{on:'sensitive_data',action:'redact'}]})
  const off = await f.request('bankdefense',{bankId:'fixture-bank',apiUrl:'http://127.0.0.1:8888',enabled:false})
  assert.equal(off.code,200)
  assert.deepEqual(off.body.memoryDefense,originalPolicy)
  assert.equal(f.patches.length,2)
})
await test('upstream 422 is reported without leaking validation inputs or pretending a policy was saved', async () => {
  let calls = 0
  const f = await fixture({fetch:async (_url,init = {}) => {
    calls++
    if (init.method === 'PATCH') return {ok:false,status:422,json:async()=>({detail:[{loc:['body','updates'],input:{private:SECRET}}]})}
    return {ok:true,status:200,json:async()=>({config:{memory_defense:{enabled:false,rules:[]}}})}
  }})
  const res = await f.request('bankdefense',{bankId:'fixture-bank',apiUrl:'http://127.0.0.1:8888',enabled:true})
  assert.equal(res.code,422)
  assert.match(res.body.error,/HTTP 422/)
  assert.ok(!JSON.stringify(res.body).includes(SECRET))
  assert.equal(calls,2,'no confirmation GET after the rejected PATCH')
})
await test('failed bank policy read forbids PATCH and errors do not expose upstream body', async () => {
  const f=await fixture({fetch:async()=>({ok:false,status:403,json:async()=>({error:SECRET})})})
  const res=await f.request('bankdefense',{bankId:'fixture-bank',apiUrl:'http://127.0.0.1:8888',enabled:true})
  assert.equal(res.code,403,'preserve the authentication failure without returning its body')
  assert.equal(f.patches.length,0)
  assert.ok(!JSON.stringify(res.body).includes(SECRET))
})
await test('bank write refuses a stale API target', async () => {
  const f=await fixture()
  const res=await f.request('bankdefense',{bankId:'fixture-bank',apiUrl:'http://127.0.0.1:9998',enabled:true})
  assert.equal(res.code,409)
  assert.equal(f.patches.length,0)
})
await test('partial model failures and bank query errors remain visible', async () => {
  const f=await fixture({llm:{listProviders:()=>[{id:'good'},{id:'bad'}],listModels:async id=>{if(id==='bad')throw new Error('synthetic unavailable');return [{id:'model'}]}},fetch:async url=>url.endsWith('/banks')?{ok:false,status:503,json:async()=>({})}:{ok:true,status:200,json:async()=>({status:'healthy'})}})
  const models=await f.m.fetchLlmModels(f.ctx)
  assert.equal(models.state,'partial')
  assert.equal(models.errors[0].provider,'bad')
  assert.ok((await f.m.collect(f.ctx)).banksError)
})
await test('CSRF/origin fence rejects foreign mutations before writes', async () => {
  const f=await fixture()
  const res=await f.request('config',{disabled:true},{origin:'https://example.invalid'})
  assert.equal(res.code,403)
  assert.equal(f.writes.length,0)
})
await test('spoofed loopback headers cannot authorize a non-loopback peer', async () => {
  const f=await fixture()
  const res=await f.request('config',{disabled:true},{},'192.0.2.10')
  assert.equal(res.code,403)
  assert.equal(f.writes.length,0)
})
await test('audit override can return to inherited environment without changing other GUI keys', async () => {
  const f=await fixture({gui:{auditLogEnabled:true,autoStart:true},env:{HINDSIGHT_API_AUDIT_LOG_ENABLED:'false'}})
  const initial=(await f.request('status')).body
  const saved=await f.request('config',{auditLogEnabled:null,guiRevision:initial.gui.revision})
  assert.equal(saved.code,200)
  assert.equal(saved.body.gui.auditLogEnabled,null)
  const settings=JSON.parse(f.files.get(f.guiPath))
  assert.equal(settings.autoStart,true)
  assert.equal(settings.auditLogEnabled,null)
  const built=await f.m.buildServerEnv(settings,f.ctx)
  assert.equal(built.env.HINDSIGHT_API_AUDIT_LOG_ENABLED,'false')
  const invalid=await f.request('config',{auditLogEnabled:'inherit',guiRevision:saved.body.gui.revision})
  assert.equal(invalid.code,400)
})
await test('saving default empty GUI settings does not request a restart', async () => {
  const f=await fixture({config:{},gui:{}})
  const initial=(await f.request('status')).body
  const res=await f.request('config',{apiUrl:'',serverModels:{reflect:''},serverCommand:'',providerOverrides:{},configRevision:initial.config.revision,guiRevision:initial.gui.revision})
  assert.equal(res.code,200)
  assert.equal(res.body.server.pendingRestart,false)
  assert.equal(JSON.parse(f.files.get(f.guiPath)).auditLogEnabled,undefined)
})
await test('startup summary does not return unknown raw log lines or credential URLs', async () => {
  const f=await fixture({log:'Error: Authorization: Bearer '+SECRET})
  const summary=await f.m.summarizeStartupFailure('/fixture/log',{HINDSIGHT_API_LLM_API_KEY:SECRET})
  assert.ok(!summary.includes(SECRET))
  assert.ok(!summary.includes('Authorization'))
  assert.ok(!f.m.redact('https://user:password@example.invalid/?token='+SECRET).includes(SECRET))
})

await test('embedding settings validate exact fields, URLs and positive dimensions', async () => {
  const {m}=await fixture()
  for(const dimensions of [0,-1,1.5,'512',NaN])assert.equal(m.normalizeServerEmbeddings({provider:'openai',dimensions}),null)
  assert.equal(m.normalizeServerEmbeddings({provider:'unknown'}),null)
  assert.equal(m.normalizeServerEmbeddings({secretConfigured:true}),null)
  assert.equal(m.normalizeServerEmbeddings({baseUrl:'https://u:p@example.invalid'}),null)
  assert.equal(m.normalizeServerEmbeddings({baseUrl:'https://example.invalid/?token=bad'}),null)
  assert.equal(m.normalizeServerEmbeddings({apiKeyEnv:'bad-name'}),null)
  assert.equal(m.normalizeServerEmbeddings({localForceCpu:'true'}),null)
  assert.equal(m.normalizeServerEmbeddings({provider:'onnx',dimensions:1024}).dimensions,1024)
})
await test('embedding inherit previews legacy env without migrating it or revealing a key', async () => {
  const legacy={HINDSIGHT_API_EMBEDDINGS_PROVIDER:'openai',HINDSIGHT_API_EMBEDDINGS_OPENAI_MODEL:'legacy-model',HINDSIGHT_API_EMBEDDINGS_OPENAI_BASE_URL:'http://127.0.0.1:1234/v1',HINDSIGHT_API_EMBEDDINGS_OPENAI_API_KEY:SECRET}
  const f=await fixture({gui:{serverEnv:legacy}})
  const saved=f.files.get(f.guiPath)
  const res=await f.request('status')
  assert.equal(res.body.gui.serverEmbeddings.provider,'')
  assert.equal(res.body.gui.serverEmbeddings.secretConfigured,false)
  assert.equal(res.body.server.embeddingPreview.provider,'openai')
  assert.equal(res.body.server.embeddingPreview.model,'legacy-model')
  assert.equal(res.body.server.embeddingPreview.source,'serverEnv')
  assert.equal(res.body.server.embeddingPreview.secretConfigured,true)
  assert.ok(!JSON.stringify(res.body).includes(SECRET))
  assert.equal(f.files.get(f.guiPath),saved)
  assert.equal(f.writes.length,0)
})
await test('embedding explicit OpenAI settings win over passthrough and use exact variables', async () => {
  const f=await fixture({credentials:{resolve:async ref=>ref==='VECTOR_KEY'?{value:SECRET}:undefined}})
  const built=await f.m.buildServerEnv({serverEnv:{HINDSIGHT_API_EMBEDDINGS_PROVIDER:'local',HINDSIGHT_API_EMBEDDINGS_OPENAI_MODEL:'old'},serverEmbeddings:{provider:'openai',model:'new',baseUrl:'https://example.invalid/embed/v1',dimensions:512,apiKeyEnv:'VECTOR_KEY'}},f.ctx)
  assert.equal(built.env.HINDSIGHT_API_EMBEDDINGS_PROVIDER,'openai')
  assert.equal(built.env.HINDSIGHT_API_EMBEDDINGS_OPENAI_MODEL,'new')
  assert.equal(built.env.HINDSIGHT_API_EMBEDDINGS_OPENAI_BASE_URL,'https://example.invalid/embed/v1')
  assert.equal(built.env.HINDSIGHT_API_EMBEDDINGS_OPENAI_DIMENSIONS,'512')
  assert.equal(built.env.HINDSIGHT_API_EMBEDDINGS_OPENAI_API_KEY,SECRET)
  assert.equal(built.embeddingPreview.model,'new')
  assert.equal(built.embeddingPreview.dimensions,512)
  assert.equal(built.embeddingPreview.source,'file')
  assert.ok(!JSON.stringify(built.embeddingPreview).includes(SECRET))
})
await test('embedding local and ONNX settings do not invent unsupported dimension variables', async () => {
  const f=await fixture()
  const local=await f.m.buildServerEnv({serverEmbeddings:{provider:'local',model:'BAAI/bge-m3',localForceCpu:true,dimensions:123}},f.ctx)
  assert.equal(local.env.HINDSIGHT_API_EMBEDDINGS_LOCAL_MODEL,'BAAI/bge-m3')
  assert.equal(local.env.HINDSIGHT_API_EMBEDDINGS_LOCAL_FORCE_CPU,'true')
  assert.equal(local.env.HINDSIGHT_API_EMBEDDINGS_LOCAL_DIMENSIONS,undefined)
  assert.equal(local.env.HINDSIGHT_API_EMBEDDINGS_LOCAL_TRUST_REMOTE_CODE,undefined)
  const onnx=await f.m.buildServerEnv({serverEmbeddings:{provider:'onnx',model:'intfloat/multilingual-e5-small',dimensions:384},serverEnv:{HINDSIGHT_API_EMBEDDINGS_ONNX_FILE:'onnx/model.onnx'}},f.ctx)
  assert.equal(onnx.env.HINDSIGHT_API_EMBEDDINGS_ONNX_MODEL_ID,'intfloat/multilingual-e5-small')
  assert.equal(onnx.env.HINDSIGHT_API_EMBEDDINGS_ONNX_DIMENSIONS,'384')
  assert.equal(onnx.env.HINDSIGHT_API_EMBEDDINGS_ONNX_FILE,'onnx/model.onnx')
})
await test('TEI config is only an endpoint; the remote service owns model and dimensions', async () => {
  const f=await fixture()
  const built=await f.m.buildServerEnv({serverEmbeddings:{provider:'tei',baseUrl:'http://127.0.0.1:8080',model:'inactive',dimensions:256}},f.ctx)
  assert.equal(built.env.HINDSIGHT_API_EMBEDDINGS_TEI_URL,'http://127.0.0.1:8080')
  assert.equal(built.env.HINDSIGHT_API_EMBEDDINGS_TEI_MODEL,undefined)
  assert.equal(built.env.HINDSIGHT_API_EMBEDDINGS_TEI_DIMENSIONS,undefined)
  assert.equal(built.embeddingPreview.model,null)
  assert.equal(built.embeddingPreview.dimensions,null)
})
await test('embedding explicit missing credential is a preflight error, never a silent fallback', async () => {
  const f=await fixture({gui:{...gui,serverEnv:{HINDSIGHT_API_EMBEDDINGS_OPENAI_API_KEY:SECRET},serverEmbeddings:{provider:'openai',apiKeyEnv:'MISSING_VECTOR_KEY'}}})
  const res=await f.request('server/start',{})
  assert.equal(res.code,400)
  assert.equal(f.launches.length,0)
  assert.ok(!JSON.stringify(res.body).includes(SECRET))
})
await test('embedding Key keep/replace/clear affects only dedicated settings', async () => {
  const f=await fixture({gui:{serverEmbeddings:{provider:'openai',apiKey:SECRET},serverEnv:{HINDSIGHT_API_EMBEDDINGS_OPENAI_API_KEY:'SYNTHETIC_LEGACY_KEY'}}})
  const initial=(await f.request('status')).body
  const coding=f.files.get(f.configPath)
  let res=await f.request('config',{guiRevision:initial.gui.revision,serverEmbeddings:{provider:'openai',apiKey:''}})
  assert.equal(res.code,200)
  assert.equal(JSON.parse(f.files.get(f.guiPath)).serverEmbeddings.apiKey,SECRET)
  assert.ok(!JSON.stringify(res.body).includes(SECRET))
  res=await f.request('config',{guiRevision:res.body.gui.revision,serverEmbeddings:{provider:'openai',apiKey:'SYNTHETIC_NEW_VECTOR_KEY'}})
  assert.equal(res.code,200)
  assert.equal(JSON.parse(f.files.get(f.guiPath)).serverEmbeddings.apiKey,'SYNTHETIC_NEW_VECTOR_KEY')
  assert.ok(!JSON.stringify(res.body).includes('SYNTHETIC_NEW_VECTOR_KEY'))
  res=await f.request('config',{guiRevision:res.body.gui.revision,serverEmbeddings:{provider:'openai',clearApiKey:true}})
  assert.equal(res.code,200)
  assert.equal(res.body.gui.serverEmbeddings.secretConfigured,false)
  assert.equal(res.body.server.embeddingPreview.secretConfigured,true)
  assert.equal(JSON.parse(f.files.get(f.guiPath)).serverEnv.HINDSIGHT_API_EMBEDDINGS_OPENAI_API_KEY,'SYNTHETIC_LEGACY_KEY')
  assert.equal(f.files.get(f.configPath),coding)
})
await test('embedding writes respect CAS and rejected values never modify files', async () => {
  const f=await fixture()
  const initial=(await f.request('status')).body
  const bad=await f.request('config',{guiRevision:initial.gui.revision,serverEmbeddings:{provider:'openai',dimensions:0}})
  assert.equal(bad.code,400)
  assert.equal(f.writes.length,0)
  const stale=await f.request('config',{guiRevision:'stale',serverEmbeddings:{provider:'local',model:'new-model'}})
  assert.equal(stale.code,409)
  assert.equal(f.writes.length,0)
})
await test('embedding launch snapshot and fingerprint distinguish running from saved settings', async () => {
  const first={...gui,serverEmbeddings:{provider:'local',model:'old-model'}}
  const f=await fixture({gui:first})
  await f.m.startServer(first,config,f.state,f.ctx)
  assert.equal(f.state.runningConfig.embeddingPreview.model,'old-model')
  f.files.set(f.guiPath,JSON.stringify({...first,serverEmbeddings:{provider:'local',model:'new-model'}}))
  const status=await f.m.collect(f.ctx,f.state)
  assert.equal(status.server.pendingRestart,true)
  assert.equal(status.server.embeddingPreview.model,'new-model')
  assert.equal(status.server.runningConfig.embeddingPreview.model,'old-model')
})
await test('embedding disabled explicit provider keeps advanced backends unchanged', async () => {
  const f=await fixture()
  const built=await f.m.buildServerEnv({serverEnv:{HINDSIGHT_API_EMBEDDINGS_PROVIDER:'cohere',HINDSIGHT_API_EMBEDDINGS_COHERE_MODEL:'custom-model'},serverEmbeddings:{provider:'',model:'inactive-model'}},f.ctx)
  assert.equal(built.env.HINDSIGHT_API_EMBEDDINGS_PROVIDER,'cohere')
  assert.equal(built.env.HINDSIGHT_API_EMBEDDINGS_COHERE_MODEL,'custom-model')
  assert.equal(built.embeddingPreview.mode,'inherit')
  assert.equal(built.embeddingPreview.provider,'cohere')
})


await test('embedding provider switch clears old backend parameters without deleting its owned key', async () => {
  const f=await fixture({gui:{serverEmbeddings:{provider:'openai',model:'cloud-model',baseUrl:'https://example.invalid/v1',dimensions:512,apiKeyEnv:'OLD_VECTOR_REF',apiKey:SECRET}}})
  const before=(await f.request('status')).body
  const res=await f.request('config',{guiRevision:before.gui.revision,serverEmbeddings:{provider:'tei',baseUrl:'http://127.0.0.1:8080'}})
  assert.equal(res.code,200)
  const stored=JSON.parse(f.files.get(f.guiPath)).serverEmbeddings
  assert.equal(stored.provider,'tei');assert.equal(stored.model,'');assert.equal(stored.dimensions,null);assert.equal(stored.apiKeyEnv,'')
  assert.equal(stored.apiKey,SECRET)
  const onnx=f.m.normalizeServerEmbeddings({provider:'onnx'},stored)
  assert.equal(onnx.model,'');assert.equal(onnx.baseUrl,'');assert.equal(onnx.dimensions,null)
  assert.ok(!JSON.stringify(res.body).includes(SECRET))
})
await test('embedding missing OpenAI key or TEI URL prevents stopping a healthy managed service', async () => {
  const f=await fixture({gui})
  await f.m.startServer(gui,config,f.state,f.ctx)
  const child=f.state.child
  for(const provider of ['openai','tei']) {
    await assert.rejects(()=>f.m.restartServer({...gui,serverEmbeddings:{provider}},config,f.state,f.ctx))
    assert.equal(f.state.child,child)
    assert.equal(f.launches.length,1)
    assert.ok(!f.commands.some(command=>command.command==='taskkill'))
  }
})
await test('embedding OpenAI key can explicitly inherit the service LLM credential', async () => {
  const f=await fixture()
  const built=await f.m.buildServerEnv({serverEnv:{HINDSIGHT_API_LLM_API_KEY:SECRET},serverEmbeddings:{provider:'openai',model:'text-embedding-3-small'}},f.ctx)
  assert.equal(built.embeddingPreview.mode,'override')
  assert.equal(built.embeddingPreview.secretConfigured,true)
  assert.equal(built.embeddingPreview.credentialSource,'继承服务端 LLM 凭据')
  assert.ok(!JSON.stringify(built.embeddingPreview).includes(SECRET))
})


await test('embedding inherited endpoint query remains unchanged while sensitive query values are redacted', async () => {
  const url='https://example.invalid/v1?api-version=2026-01-01&api_key=SYNTHETIC_QUERY_CREDENTIAL'
  const f=await fixture({gui:{serverEnv:{HINDSIGHT_API_EMBEDDINGS_PROVIDER:'openai',HINDSIGHT_API_EMBEDDINGS_OPENAI_BASE_URL:url,HINDSIGHT_API_EMBEDDINGS_OPENAI_API_KEY:SECRET}}})
  const built=await f.m.buildServerEnv(JSON.parse(f.files.get(f.guiPath)),f.ctx)
  assert.equal(built.env.HINDSIGHT_API_EMBEDDINGS_OPENAI_BASE_URL,url)
  assert.equal(built.embeddingPreview.mode,'inherit')
  const status=(await f.request('status')).body
  assert.ok(status.server.embeddingPreview.baseUrl.includes('api-version=2026-01-01'))
  assert.ok(!JSON.stringify(status).includes('SYNTHETIC_QUERY_CREDENTIAL'))
  assert.equal(f.m.normalizeServerEmbeddings({provider:'openai',baseUrl:url}),null,'dedicated form remains stricter')
})

await test('official defaults and explicit false remain truthful without unrelated-save materialization', async () => {
  const f=await fixture({config:{apiUrl:'http://127.0.0.1:8888',dynamicBankId:false}})
  const status=(await f.request('status')).body
  assert.equal(status.config.values.autoUpdate,true)
  assert.equal(status.config.values.codebaseSurvey,true)
  assert.equal(status.config.values.dynamicBankId,false)
  const saved=await f.request('config',{apiUrl:'http://127.0.0.1:8890',configRevision:status.config.revision,guiRevision:status.gui.revision})
  assert.equal(saved.code,200)
  const raw=JSON.parse(f.files.get(f.configPath))
  assert.ok(!Object.hasOwn(raw,'autoUpdate'))
  assert.ok(!Object.hasOwn(raw,'codebaseSurvey'))
  const env=await fixture({env:{HINDSIGHT_AUTO_UPDATE:'false',HINDSIGHT_CODEBASE_SURVEY:'off'}})
  const projected=(await env.request('status')).body.config.values
  assert.equal(projected.autoUpdate,false)
  assert.equal(projected.codebaseSurvey,false)
})
await test('reflect scoped overrides beat old reflect environment without polluting explicit global fallback', async () => {
  const f=await fixture({env:{HINDSIGHT_API_LLM_PROVIDER:'openai',HINDSIGHT_API_LLM_MODEL:'global-keep',HINDSIGHT_API_LLM_API_KEY:SECRET,HINDSIGHT_API_REFLECT_LLM_MODEL:'old-reflect'}})
  const built=await f.m.buildServerEnv({serverModels:{default:'',reflect:'new-reflect'}},f.ctx)
  assert.equal(built.env.HINDSIGHT_API_LLM_MODEL,'global-keep')
  assert.equal(built.env.HINDSIGHT_API_REFLECT_LLM_MODEL,'new-reflect')
  assert.equal(built.resolutions.find(row=>row.scope==='reflect').applied,true)
  const legacy=await f.m.buildServerEnv({serverModels:{reflect:'legacy-reflect'}},f.ctx)
  assert.equal(legacy.env.HINDSIGHT_API_LLM_MODEL,'legacy-reflect')
  assert.equal(legacy.env.HINDSIGHT_API_REFLECT_LLM_MODEL,'legacy-reflect')
  assert.match(legacy.resolutions.find(row=>row.scope==='default').note,/兼容旧/)
})
await test('redacted endpoint projection can never overwrite the original on partial provider edits', async () => {
  const original='https://example.invalid/api_key=SYNTHETIC_PATH_VALUE/v1'
  const f=await fixture({gui:{providerOverrides:{demo:{baseUrl:original}}}})
  const status=(await f.request('status')).body
  assert.ok(!status.gui.providerOverrides.demo.baseUrl.includes('SYNTHETIC_PATH_VALUE'))
  const saved=await f.request('config',{providerOverrides:{demo:{apiKeyEnv:'SYNTHETIC_REFERENCE'}},configRevision:status.config.revision,guiRevision:status.gui.revision})
  assert.equal(saved.code,200)
  assert.equal(JSON.parse(f.files.get(f.guiPath)).providerOverrides.demo.baseUrl,original)
  assert.equal(f.m.normalizeProviderOverrides({demo:{baseUrl:status.gui.providerOverrides.demo.baseUrl}}),null)
})
console.log(`Host offline regressions: ${passed} passed; no real service, credential, network or file-write operations.`)

}
