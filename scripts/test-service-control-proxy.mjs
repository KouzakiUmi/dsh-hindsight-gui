/** Exercise the real Node HTTP stack; intercept Socket.connect before any network I/O. */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
const moduleUrl=new URL('../lib/service-control.js',import.meta.url).href
const code=`
import assert from 'node:assert/strict'
import net from 'node:net'
import http from 'node:http'
import {requestServiceControl} from ${JSON.stringify(moduleUrl)}
const connections=[]
let globalAgentUsed=false
const connect=net.Socket.prototype.connect
const globalConnect=http.globalAgent.createConnection
const fetch=globalThis.fetch
net.Socket.prototype.connect=function(...args){
 const first=Array.isArray(args[0])?args[0][0]:args[0]
 connections.push({host:first.host,port:Number(first.port)})
 throw new Error('SYNTHETIC_SOCKET_INTERCEPT')
}
http.globalAgent.createConnection=()=>{globalAgentUsed=true;throw new Error('GLOBAL_AGENT_MUST_NOT_BE_USED')}
globalThis.fetch=()=>{throw new Error('GLOBAL_FETCH_MUST_NOT_BE_USED')}
try {
 await assert.rejects(requestServiceControl({version:1,kind:'http',base:'http://localhost:43210',token:'c'.repeat(64),nonce:'a'.repeat(32)},{pid:42},'identity'),/不可用/)
 assert.deepEqual(connections,[{host:'127.0.0.1',port:43210}])
 assert.equal(globalAgentUsed,false)
 console.log(JSON.stringify({directIPv4:true,globalAgentUsed,realConnections:0}))
} finally {net.Socket.prototype.connect=connect;http.globalAgent.createConnection=globalConnect;globalThis.fetch=fetch}
`
const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>['SYSTEMROOT','WINDIR','PATH','TEMP','TMP','USERPROFILE','APPDATA','LOCALAPPDATA','HOME'].includes(key.toUpperCase())))
Object.assign(env,{HTTP_PROXY:'http://synthetic-proxy.invalid:43211',http_proxy:'http://synthetic-proxy.invalid:43211',HTTPS_PROXY:'',https_proxy:'',NO_PROXY:'',no_proxy:'',ALL_PROXY:'',all_proxy:''})
const proxyFlag=process.allowedNodeEnvironmentFlags.has('--use-env-proxy')?['--use-env-proxy']:[]
const result=spawnSync(process.execPath,[...proxyFlag,'--input-type=module','-e',code],{env,encoding:'utf8',timeout:10000})
assert.ifError(result.error)
assert.equal(result.status,0,result.stderr)
const proof=JSON.parse(result.stdout)
assert.equal(proof.directIPv4,true)
assert.equal(proof.realConnections,0)
console.log('PASS direct HTTP stack ignores global proxy/fetch/Agent; synthetic credentials only, zero connections'+(proxyFlag.length?' with --use-env-proxy.':'.'))
