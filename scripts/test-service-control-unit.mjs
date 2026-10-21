/** Fully mocked protocol, interpreter and receipt-permission regressions. */
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { EventEmitter } from 'node:events'
const original=await readFile(new URL('../lib/service-control.js',import.meta.url),'utf8')
let id=0,passed=0
const control={version:1,kind:'http',base:'http://127.0.0.1:18888',token:'c'.repeat(64),nonce:'a'.repeat(32)}
const identity={pid:321}
const reply={version:1,pid:321,nonce:control.nonce,stopping:false}
const SECRET='SYNTHETIC_TEST_SECRET_NOT_A_CREDENTIAL'
async function fixture(options={}){
 const calls=[],requests=[]
 let cancelled=0,deadline,requestDestroyed=0
 const f={
  process:{platform:options.platform??'win32',getuid:()=>1000},
  existsSync:path=>path.endsWith('python.exe')&&!options.missingPython||!!options.fileExists&&path.endsWith('receipt.json'),
  mkdir:async()=>{},unlink:async()=>{},writeFile:async()=>{},
  stat:async path=>({uid:options.owner??1000,mode:path.endsWith('receipt.json')?(options.fileMode??0o600):(options.directoryMode??0o700)}),
  setTimeout:(callback,ms)=>{deadline={callback,ms};return {unref(){}}},
  clearTimeout:()=>{deadline=null},
  httpRequest:(init,onResponse)=>{
   requests.push({url:'http://'+init.headers.host+init.path,init})
   const req=new EventEmitter()
   const aborted=()=>req.emit('error',new Error(SECRET))
   init.signal.addEventListener('abort',aborted,{once:true})
   req.destroy=()=>{if(!req.destroyed){req.destroyed=true;requestDestroyed++};init.signal.removeEventListener('abort',aborted)}
   req.end=()=>queueMicrotask(()=>{
    if(init.signal.aborted||req.destroyed)return
    if(options.transportError){req.emit('error',new Error(SECRET));return}
    if(options.hang)return
    const res=new EventEmitter()
    res.statusCode=options.status??(init.method==='POST'?202:200)
    res.complete=false
    res.destroy=()=>{if(!res.destroyed){res.destroyed=true;cancelled++}}
    onResponse(res)
    const bytes=options.bytes??Buffer.from(JSON.stringify(options.reply??{...reply,stopping:init.method==='POST'}))
    res.emit('data',bytes.subarray(0,3))
    if(options.abortOnChunk)options.abortOnChunk.abort()
    if(init.signal.aborted||res.destroyed)return
    if(options.truncated){res.emit('aborted');res.emit('close');return}
    res.emit('data',bytes.subarray(3))
    if(res.destroyed)return
    res.complete=true
    res.emit('end')
   })
   return req
  },
 }
 globalThis.__serviceFixture=f
 let source=original.replace("import { existsSync } from 'node:fs'",'const {existsSync}=globalThis.__serviceFixture')
 source=source.replace("import { mkdir, stat, unlink, writeFile } from 'node:fs/promises'",'const {mkdir,stat,unlink,writeFile}=globalThis.__serviceFixture')
 source=source.replace("import { request as httpRequest } from 'node:http'",'const {httpRequest}=globalThis.__serviceFixture')
 source=source.replace("new URL('./python/dsh_hindsight_control.py', import.meta.url)",`new URL('${new URL('../lib/python/dsh_hindsight_control.py',import.meta.url).href}')`)
 source='const {process,setTimeout,clearTimeout}=globalThis.__serviceFixture;\n'+source+'\n// '+(++id)
 const m=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))
 const exec=async(command,args,timeout,extra)=>{
  calls.push({command,args,timeout,extra})
  if(options.execError)throw new Error(SECRET)
  return command==='powershell.exe'?JSON.stringify({private:!options.unsafe}):(options.probe??JSON.stringify({version:1,hindsight:'0.10.2'}))
 }
 return {m,calls,requests,exec,expire:()=>{assert.equal(deadline.ms,5000);deadline.callback()},
  get timerCleared(){return deadline===null},get cancelled(){return cancelled},get requestDestroyed(){return requestDestroyed}}
}
async function test(name,fn){await fn();passed++;console.log('PASS '+name)}
await test('control records require exact secrets and a root loopback HTTP origin',async()=>{
 const f=await fixture()
 assert.equal(f.m.validServiceControl(control),true)
 for(const bad of [null,{}, {...control,version:2},{...control,base:'https://remote.invalid'},{...control,base:'http://127.0.0.1/path'},
  {...control,base:'http://user:pass@127.0.0.1'},{...control,base:'http://127.0.0.1/?token=x'},{...control,base:'http://127.0.0.1:0'},
  {...control,token:control.token+'\n'},{...control,nonce:'short'}])assert.equal(f.m.validServiceControl(bad),false)
})
await test('launch preflights the same Python and protects receipt before generating control',async()=>{
 const f=await fixture()
 const env={SYNTHETIC_API_KEY:SECRET}
 const launch=await f.m.prepareServiceLaunch({serverPython:'/fixture/python.exe'},{command:'/fixture/cli.exe'},
  {base:control.base,port:18888},env,'/fixture/private/receipt.json',f.exec)
 assert.equal(f.calls[0].command,'/fixture/python.exe')
 assert.ok(f.calls[0].args.includes('--preflight'))
 assert.equal(f.calls[0].timeout,60000)
 assert.deepEqual(f.calls[0].extra.env,{...env,PYTHONDONTWRITEBYTECODE:'1'})
 assert.equal(f.calls[1].command,'powershell.exe')
 assert.ok(!f.calls.some(call=>/Bypass|EncodedCommand/i.test(call.args.join(' '))))
 assert.ok(f.m.validServiceControl(launch.control))
 assert.equal(launch.env.SYNTHETIC_API_KEY,SECRET)
 assert.equal(launch.env.DSH_HINDSIGHT_CONTROL_TOKEN,launch.control.token)
 assert.equal(env.DSH_HINDSIGHT_CONTROL_TOKEN,undefined)
 assert.ok(!launch.args.some(arg=>arg.includes(launch.control.token)))
})
await test('private receipt creation sends data only through stdin and uses create-new DACL',async()=>{
 const f=await fixture()
 await f.m.writePrivateReceipt('/fixture/private/receipt.json',SECRET,f.exec)
 const writer=f.calls.find(call=>call.args.join(' ').includes('FileStream'))
 assert.ok(writer)
 assert.equal(writer.extra.input,SECRET)
 assert.ok(writer.args.join(' ').includes('FileMode]::CreateNew'))
 assert.ok(writer.args.join(' ').includes('SetAccessRuleProtection($true,$false)'))
 assert.ok(!writer.args.join(' ').includes(SECRET))
 assert.ok(!writer.args.join(' ').includes('Set-Acl'))
})
await test('private writer refuses an existing record without changing its ACL or contents',async()=>{
 const f=await fixture({fileExists:true})
 await assert.rejects(f.m.writePrivateReceipt('/fixture/private/receipt.json',SECRET,f.exec),/只允许创建/)
 assert.ok(!f.calls.some(call=>call.args.join(' ').includes('FileStream')))
})
await test('missing Python never guesses a different environment',async()=>{
 const f=await fixture({missingPython:true})
 await assert.rejects(f.m.prepareServiceLaunch({}, {command:'/fixture/cli.exe'},{base:control.base,port:18888},{},'/fixture/private/receipt.json',f.exec),/Python/)
 assert.equal(f.calls.length,0)
})
for(const probe of ['not-json',JSON.stringify({version:2,hindsight:'0.10.2'}),JSON.stringify({version:1,hindsight:'0.9'})]){
 await test('incompatible preflight fails before receipt/control use',async()=>{
  const f=await fixture({probe})
  await assert.rejects(f.m.prepareServiceLaunch({}, {command:'/fixture/cli.exe'},{base:control.base,port:18888},{},'/fixture/private/receipt.json',f.exec),/预检|不兼容/)
  assert.equal(f.calls.length,1)
 })
}
await test('unsafe Windows receipt ACL rejects activation without changing permissions',async()=>{
 const f=await fixture({unsafe:true})
 await assert.rejects(f.m.assertPrivateReceipt('/fixture/private/receipt.json',f.exec),/拒绝启用.*未修改权限/)
 assert.equal(f.calls.length,1)
 assert.ok(!/Set-Acl|icacls|takeown/i.test(f.calls[0].args.join(' ')))
})
await test('unknown ACL diagnostics do not echo underlying errors',async()=>{
 const f=await fixture({execError:true})
 await assert.rejects(f.m.assertPrivateReceipt('/fixture/private/receipt.json',f.exec),error=>{assert.ok(!error.message.includes(SECRET));return true})
})
await test('POSIX receipt owner and permission checks fail closed',async()=>{
 for(const opts of [{directoryMode:0o777},{owner:999},{fileExists:true,fileMode:0o640}]){
  const f=await fixture({platform:'linux',...opts})
  await assert.rejects(f.m.assertPrivateReceipt('/fixture/private/receipt.json',f.exec),/私有|拒绝/)
  assert.equal(f.calls.length,0)
 }
 const good=await fixture({platform:'linux',fileExists:true})
 await good.m.assertPrivateReceipt('/fixture/private/receipt.json',good.exec)
})
await test('requests pin IPv4 and a one-use direct Agent, binding PID and nonce before action',async()=>{
 const f=await fixture()
 assert.deepEqual(await f.m.requestServiceControl(control,identity,'identity'),reply)
 assert.equal(f.requests[0].url,control.base+'/ext/dsh-control/identity')
 const init=f.requests[0].init
 assert.equal(init.method,'GET')
 assert.equal(init.agent,false)
 assert.equal(init.hostname,'127.0.0.1')
 assert.equal(init.family,4)
 assert.deepEqual(init.headers,{host:'127.0.0.1:18888','x-dsh-control-token':control.token,'x-dsh-control-pid':'321','x-dsh-control-nonce':control.nonce})
 await f.m.requestServiceControl(control,identity,'stop')
 assert.equal(f.requests[1].init.method,'POST')
 assert.ok(f.timerCleared)
 assert.equal(f.requestDestroyed,2)
})
await test('localhost routing keeps its Host but never resolves DNS or selects IPv6',async()=>{
 const f=await fixture()
 await f.m.requestServiceControl({...control,base:'http://localhost:18888'},identity,'identity')
 assert.equal(f.requests[0].init.hostname,'127.0.0.1')
 assert.equal(f.requests[0].init.headers.host,'localhost:18888')
})
for(const bad of [{...reply,pid:322},{...reply,nonce:'wrong'},{...reply,version:2}]){
 await test('response identity mismatch never appears successful',async()=>{
  const f=await fixture({reply:bad})
  await assert.rejects(f.m.requestServiceControl(control,identity,'stop'),/身份不符/)
  assert.equal(f.requests.length,1)
 })
}
for(const status of [302,403,500]){
 await test('HTTP denial/redirect is not retried or echoed',async()=>{
  const f=await fixture({status})
  await assert.rejects(f.m.requestServiceControl(control,identity,'stop'),/不会强制终止或重复启动/)
  assert.equal(f.requests.length,1)
  assert.equal(f.cancelled,1)
 })
}
for(const bytes of [Buffer.alloc(4097,65),Buffer.from([255]),Buffer.from('{invalid}')]){
 await test('bounded strict UTF-8 JSON response handling',async()=>{
  const f=await fixture({bytes})
  await assert.rejects(f.m.requestServiceControl(control,identity,'identity'),/不可用/)
  assert.equal(f.requestDestroyed,1)
 })
}
await test('invalid records never issue HTTP',async()=>{
 const f=await fixture()
 await assert.rejects(f.m.requestServiceControl({},identity,'stop'),/记录无效/)
 await assert.rejects(f.m.requestServiceControl(control,{pid:0},'stop'),/记录无效/)
 await assert.rejects(f.m.requestServiceControl(control,identity,'kill'),/记录无效/)
 assert.equal(f.requests.length,0)
})
await test('pre-cancelled requests never enter the transport',async()=>{
 const f=await fixture()
 const abort=new AbortController();abort.abort()
 await assert.rejects(f.m.requestServiceControl(control,identity,'stop',abort.signal),error=>{assert.ok(!error.message.includes(SECRET));return true})
 assert.equal(f.requests.length,0)
 assert.ok(f.timerCleared)
})
await test('transport errors do not leak secrets or retry',async()=>{
 const f=await fixture({transportError:true})
 await assert.rejects(f.m.requestServiceControl(control,identity,'stop'),error=>{assert.ok(!error.message.includes(SECRET));return true})
 assert.equal(f.requests.length,1)
 assert.equal(f.requestDestroyed,1)
})
await test('mid-response cancellation releases the request and deadline',async()=>{
 const abort=new AbortController()
 const f=await fixture({abortOnChunk:abort})
 await assert.rejects(f.m.requestServiceControl(control,identity,'identity',abort.signal),/不可用/)
 assert.equal(f.requestDestroyed,1)
 assert.ok(f.timerCleared)
})
await test('truncated responses are never accepted',async()=>{
 const f=await fixture({truncated:true})
 await assert.rejects(f.m.requestServiceControl(control,identity,'identity'),/不可用/)
 assert.equal(f.cancelled,1)
})
await test('five-second deadline aborts a stalled direct request without retry',async()=>{
 const f=await fixture({hang:true})
 const pending=f.m.requestServiceControl(control,identity,'identity')
 f.expire()
 await assert.rejects(pending,/不可用/)
 assert.equal(f.requests.length,1)
 assert.equal(f.requestDestroyed,1)
 assert.ok(f.timerCleared)
})
console.log(`Service control offline regressions: ${passed} passed; no real subprocess, HTTP or credential I/O.`)
