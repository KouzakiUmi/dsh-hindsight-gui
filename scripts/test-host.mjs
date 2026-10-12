/** Offline Host regressions. All process, credential, network and write I/O is mocked. */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { EventEmitter } from 'node:events'

const original = readFileSync(new URL('../lib/index.js', import.meta.url), 'utf8')
let moduleId = 0
const SECRET = 'SYNTHETIC_TEST_KEY_NOT_A_REAL_CREDENTIAL'

async function fixture(options = {}) {
  const files = new Map()
  const configPath = '/fixture/coding-agent.json'
  const guiPath = '/fixture/gui.json'
  files.set(configPath, JSON.stringify(options.config ?? { apiUrl: 'http://127.0.0.1:8888' }))
  files.set(guiPath, JSON.stringify(options.gui ?? {}))
  const listeners = new Map()
  const identities = new Map()
  const children = new Map()
  const writes = []
  const commands = []
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
  const f = {
    process: { env: { HINDSIGHT_CONFIG: configPath, HINDSIGHT_GUI_CONFIG: guiPath, ...options.env }, platform: 'win32', pid: 123 },
    fs: {
      existsSync: path => path === '/fixture/api.exe',
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
      stat: async path => ({ size: Buffer.byteLength(options.log ?? 'Error: synthetic'), isFile: () => path === '/fixture/api.exe' }),
    },
    spawn(command, args) {
      if (command === '/fixture/api.exe') {
        const child = new EventEmitter()
        child.pid = failSpawn ? undefined : ++nextPid
        child.exitCode = null
        child.unref = () => {}
        child.kill = () => { throw new Error('Windows direct kill must not be used') }
        launches.push({ command, args, child })
        if (failSpawn) queueMicrotask(() => child.emit('error', new Error('synthetic spawn failure '+SECRET)))
        else {
          identities.set(child.pid, { pid: child.pid, executable: '/fixture/api.exe', started: 'identity-'+child.pid })
          listeners.set(Number(args.at(-1)), options.launcher ? child.pid + 1 : child.pid)
          children.set(child.pid, child)
        }
        return child
      }
      commands.push({ command, args })
      const child = new EventEmitter()
      child.stdout = new EventEmitter()
      child.kill = () => {}
      queueMicrotask(() => {
        let text = ''
        let code = 0
        if (command === 'netstat') {
          if (failQuery) code = 1
          else text = [...listeners].map(([port,pid]) => `  TCP    127.0.0.1:${port}    0.0.0.0:0    LISTENING    ${pid}`).join('\n')
        } else if (command === 'powershell.exe') {
          const pid = Number(args.at(-1).match(/ProcessId = (\d+)/)?.[1])
          text = identities.has(pid) ? JSON.stringify(identities.get(pid)) : ''
        } else if (command === 'taskkill') {
          assert.ok(!args.includes('/F'))
          if (stopFailure) code = 1
          else {
            const pid = Number(args.at(-1))
            for (const [port, owner] of listeners) if (owner === pid) listeners.delete(port)
            identities.delete(pid)
            children.get(pid)?.emit('exit', 0, null)
          }
        } else throw new Error('Unexpected system command: '+command)
        child.stdout.emit('data', text)
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
      patches.push(body)
      policy = body.memory_defense
      return { ok: true, status: 200, json: async () => ({ config: { memory_defense: policy } }) }
    }
    if (url.endsWith('/config')) return { ok: true, status: 200, json: async () => ({ config: { memory_defense: policy } }) }
    if (url.endsWith('/banks')) return { ok: true, status: 200, json: async () => ({ banks: [] }) }
    return { ok: true, status: 200, json: async () => ({}) }
  }
  let source = original
  const substitutions = [
    ["import { spawn } from 'node:child_process'", 'const { spawn } = globalThis.__hostFixture'],
    ["import { closeSync, existsSync, openSync, readSync } from 'node:fs'", 'const { closeSync, existsSync, openSync, readSync } = globalThis.__hostFixture.fs'],
    ["import { copyFile, mkdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises'", 'const { copyFile, mkdir, readFile, rename, stat, unlink, writeFile } = globalThis.__hostFixture.fsp'],
    ["import { homedir } from 'node:os'", "const homedir = () => '/fixture'"],
    ['const STARTUP_TIMEOUT_MS = 90_000', 'const STARTUP_TIMEOUT_MS = 5'],
  ]
  for (const [before, after] of substitutions) { assert.ok(source.includes(before), 'mock boundary changed'); source = source.replace(before, after) }
  source = 'const process = globalThis.__hostFixture.process;\n'+source+
    '\nexport { redact, hash, stableJson, readJsonFile, atomicMerge, normalizeServerModels, normalizeProviderOverrides, normalizeServerEnv, sanitizePatch, apiTarget, buildServerEnv, createServerState, collect, runServerAction, startServer, restartServer, preflightServer, ownershipView, mergeMemoryDefense, fetchLlmModels };\n// fixture '+(++moduleId)
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
  return { m, state, ctx, files, configPath, guiPath, listeners, identities, launches, writes, patches, commands, request,
    setFailQuery: value => { failQuery = value }, setStopFailure: value => { stopFailure = value }, setFailSpawn: value => { failSpawn = value },
    setHealth: value => { healthUp = value }, setBeforeRead: fn => { beforeRead = fn }, setBeforeWrite: fn => { beforeWrite = fn },
    get disposed() { return disposed }, get policy() { return policy } }
}

let passed = 0
async function test(name, fn) { await fn(); passed++; console.log('PASS '+name) }
const gui = { serverCommand: '/fixture/api.exe' }
const config = { apiUrl: 'http://127.0.0.1:8888' }

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
await test('PID reuse, unknown process identity and listener replacement are not owned', async () => {
  const f=await fixture()
  await f.m.startServer(gui,config,f.state,f.ctx)
  f.identities.get(f.state.managedPid).started='different-start'
  await assert.rejects(f.m.restartServer(gui,config,f.state,f.ctx),/不属于/)
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
await test('simultaneous service actions are fenced and dispose revokes ownership', async () => {
  const f=await fixture({gui})
  const running=f.m.runServerAction('start',f.state,f.ctx)
  await assert.rejects(f.m.runServerAction('start',f.state,f.ctx),/正在执行/)
  await running
  assert.equal(f.launches.length,1)
  f.state.disposed=true; f.state.controller.abort(); f.state.identity=null
  await assert.rejects(f.m.runServerAction('restart',f.state,f.ctx),/卸载/)
  const foreign=f.m.createServerState()
  assert.equal((await f.m.ownershipView(foreign,f.m.apiTarget(config))).ownership,'unmanaged')
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
  assert.equal(f.policy.rules.length,3)
  assert.ok(f.policy.rules.some(r=>r.action==='block'&&r.on==='sensitive_data'))
  const off=await f.request('bankdefense',{bankId:'fixture-bank',apiUrl:'http://127.0.0.1:8888',enabled:false})
  assert.equal(off.code,200)
  assert.equal(f.policy.enabled,true)
  assert.equal(f.policy.rules.length,2)
  const invalid=await f.request('bankdefense',{bankId:'fixture-bank'})
  assert.equal(invalid.code,400)
})
await test('failed bank policy read forbids PATCH and errors do not expose upstream body', async () => {
  const f=await fixture({fetch:async()=>({ok:false,status:403,json:async()=>({error:SECRET})})})
  const res=await f.request('bankdefense',{bankId:'fixture-bank',apiUrl:'http://127.0.0.1:8888',enabled:true})
  assert.equal(res.code,500)
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
console.log(`Host offline regressions: ${passed} passed; no real service, credential, network or file-write operations.`)
