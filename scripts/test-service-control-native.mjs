/** Opt-in native test, new bounded Python fixture only: no production API/DB/model calls. */
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { createServer, createConnection } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { requestServiceControl } from '../lib/service-control.js'

const python = process.env.DSH_TEST_PYTHON
if (!python) {
  console.log('SKIP native in-process test: set DSH_TEST_PYTHON to an existing Hindsight Python interpreter.')
} else {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-inprocess-test-'))
  const marker = join(directory, 'cleanup.txt')
  const reservation = createServer()
  reservation.listen(0, '127.0.0.1')
  await once(reservation, 'listening')
  const port = reservation.address().port
  await new Promise(resolve => reservation.close(resolve))
  const control = { version: 1, kind: 'http', base: `http://127.0.0.1:${port}`,
    token: randomBytes(32).toString('hex'), nonce: randomBytes(16).toString('hex') }
  // Never forward provider keys, DB URLs, proxies or server configuration into this fixture.
  const environment = Object.fromEntries(Object.entries(process.env).filter(([key]) =>
    ['SYSTEMROOT','WINDIR','PATH','TEMP','TMP','USERPROFILE','APPDATA','LOCALAPPDATA','HOME'].includes(key.toUpperCase())))
  Object.assign(environment, { PYTHONUTF8: '1', PYTHONDONTWRITEBYTECODE:'1', DSH_HINDSIGHT_CONTROL_TOKEN: control.token,
    DSH_HINDSIGHT_CONTROL_NONCE: control.nonce, DSH_HINDSIGHT_CONTROL_PORT: String(port) })
  const envPath=join(directory,'.env')
  const dotenv=(extension='',workers='1')=>`HINDSIGHT_API_HTTP_EXTENSION=${extension}\nHINDSIGHT_API_WORKERS=${workers}\nDSH_HINDSIGHT_CONTROL_TOKEN=ignored-dotenv-token\nDSH_HINDSIGHT_CONTROL_NONCE=ignored-dotenv-nonce\nDSH_HINDSIGHT_CONTROL_PORT=1\nHINDSIGHT_API_DATABASE_URL=postgresql://fixture.invalid/must-not-connect\n`
  const probe=(extraEnv={})=>new Promise((resolveProbe,reject)=>{
    const process=spawn(python,[fileURLToPath(new URL('../lib/python/dsh_hindsight_control.py',import.meta.url)),'--preflight'],
      {cwd:directory,env:{...environment,...extraEnv},windowsHide:true,stdio:['ignore','pipe','pipe']})
    let output='',errors=''
    process.stdout.on('data',bytes=>{output=(output+bytes.toString('utf8')).slice(-16384)})
    process.stderr.on('data',bytes=>{errors=(errors+bytes.toString('utf8')).slice(-16384)})
    process.once('error',reject)
    process.once('close',code=>resolveProbe({code,output,errors:errors.replaceAll(control.token,'[CONTROL_TOKEN]')}))
  })
  await writeFile(envPath,dotenv())
  const readyProbe=await probe()
  assert.equal(readyProbe.code,0,'bootstrap preflight failed: '+readyProbe.errors)
  assert.equal(JSON.parse(readyProbe.output).hindsight,'0.10.2')
  for(const [extension,workers] of [['unrelated.module:ExistingExtension','1'],['','4']]){
    await writeFile(envPath,dotenv(extension,workers))
    const refused=await probe()
    assert.equal(refused.code,1,'conflicting extension/workers must fail before startup')
    assert.ok(!refused.errors.includes(control.token))
  }
  await writeFile(envPath,dotenv()+'HINDSIGHT_API_LLM_PROVIDER=anthropic\n')
  const conflictingEnvironment=await probe({HINDSIGHT_API_LLM_PROVIDER:'openai'})
  assert.equal(conflictingEnvironment.code,1,'dotenv must not silently change the supplied launch settings')
  await writeFile(envPath,dotenv())
  console.log('PASS native preflight: correct interpreter, .env launch-setting conflict, HTTP extension conflict and worker fence; no memory engine created.')
  const child = spawn(python, [fileURLToPath(new URL('./fixture-inprocess-service.py', import.meta.url)),
    fileURLToPath(new URL('../lib/python/', import.meta.url)), String(port), marker],
    { cwd: directory, env: environment, windowsHide: true, stdio: ['ignore','pipe','pipe'] })
  const exited = once(child, 'exit')
  let output = ''
  let errors = ''
  child.stdout.on('data', bytes => { output = (output + bytes.toString('utf8')).slice(-16384) })
  child.stderr.on('data', bytes => { errors = (errors + bytes.toString('utf8')).slice(-16384) })
  let identity
  try {
    for (let i=0;i<450;i++) {
      identity = output.split(/\r?\n/).filter(Boolean).map(line=>{try{return JSON.parse(line)}catch{return null}}).find(row=>row?.ready)
      if (identity || child.exitCode !== null) break
      await delay(100)
    }
    assert.ok(identity, 'isolated fixture failed to start: '+JSON.stringify({exitCode:child.exitCode,signal:child.signalCode,output,errors}))
    const owned = { pid: identity.pid }
    assert.equal((await requestServiceControl(control,owned,'identity')).stopping,false)
    const headers = { 'x-dsh-control-token':control.token, 'x-dsh-control-nonce':control.nonce,
      'x-dsh-control-pid':String(owned.pid) }
    const rawStatus = headers => new Promise((resolve,reject) => {
      const socket=createConnection({host:'127.0.0.1',port})
      let response=''
      let settled=false
      const finish=(error,value)=>{if(settled)return;settled=true;socket.destroy();error?reject(error):resolve(value)}
      socket.setTimeout(5000,()=>finish(new Error('raw HTTP response timeout')))
      socket.once('error',error=>finish(error))
      socket.once('connect',()=>{
        const lines=Object.entries(headers).flatMap(([key,value])=>(Array.isArray(value)?value:[value]).map(part=>key+': '+part))
        socket.write('POST /ext/dsh-control/stop HTTP/1.1\r\n'+lines.join('\r\n')+'\r\nContent-Length: 0\r\nConnection: close\r\n\r\n')
      })
      socket.on('data',bytes=>{response+=bytes.toString('utf8');if(response.length>8192)finish(new Error('raw response budget'))})
      socket.once('end',()=>{const match=response.match(/^HTTP\/1[.]1 (\d+)/);match?finish(null,Number(match[1])):finish(new Error('invalid raw HTTP status'))})
      socket.once('close',()=>{if(!settled)finish(new Error('raw HTTP closed before response'))})
    })
    for (const [extra, status] of [
      [{ 'x-dsh-control-token':'wrong' },403], [{ origin:'http://attacker.invalid' },403],
      [{ host:'attacker.invalid' },403], [{ 'x-dsh-control-nonce':'wrong' },409],
      [{ 'x-dsh-control-pid':String(owned.pid+1) },409],
      [{ 'x-dsh-control-token':[control.token,control.token] },403],
    ]) {
      const received=await rawStatus({...headers,host:'127.0.0.1:'+port,...extra})
      assert.equal(received,status,'rejection case: '+Object.keys(extra).join(','))
    }
    await assert.rejects(requestServiceControl(control,{pid:owned.pid+1},'stop'),/不可用|身份/)
    assert.equal((await requestServiceControl(control,owned,'identity')).stopping,false)
    const abort = new AbortController(); abort.abort()
    await assert.rejects(requestServiceControl(control,owned,'stop',abort.signal),/不可用|身份/)
    assert.equal((await requestServiceControl(control,owned,'identity')).stopping,false)
    const replies=await Promise.all([requestServiceControl(control,owned,'stop'),requestServiceControl(control,owned,'stop')])
    assert.ok(replies.every(reply=>reply.stopping===true))
    const result=await Promise.race([exited,delay(10000).then(()=>{throw new Error('graceful shutdown exceeded test bound')})])
    assert.equal(result[0],0,'fixture did not exit normally: '+errors)
    assert.equal(await readFile(marker,'utf8'),'CLEANED')
    const completion=output.split(/\r?\n/).filter(Boolean).map(line=>{try{return JSON.parse(line)}catch{return null}}).find(row=>row?.exited)
    assert.deepEqual(completion,{exited:true,signals:1,expired:false})
    console.log('PASS native in-process control: authentication, host/origin fence, PID/nonce binding, cancellation, duplicate stop, one real SIGTERM, lifespan cleanup and exit 0.')
  } finally {
    if(child.exitCode===null) await Promise.race([exited,delay(30000)])
    await writeFile(join(directory,'process-outcome.json'),JSON.stringify({exitCode:child.exitCode,signal:child.signalCode,
      output:output.replaceAll(control.token,'[CONTROL_TOKEN]'),errors:errors.replaceAll(control.token,'[CONTROL_TOKEN]')},null,2))
    console.log('Isolated fixture artifacts: '+directory)
  }
}
