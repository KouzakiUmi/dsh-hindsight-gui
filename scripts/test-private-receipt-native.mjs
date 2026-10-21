/** Opt-in: create/verify only NEW control-record probes, never change an old ACL. */
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { readFile, unlink } from 'node:fs/promises'
import { join, resolve, dirname } from 'node:path'
import { randomBytes } from 'node:crypto'
import { assertPrivateReceipt, writePrivateReceipt, verifyReceiptCreation } from '../lib/service-control.js'
const directory=process.env.DSH_TEST_RECEIPT_DIR
if(!directory){console.log('SKIP private receipt native test: set DSH_TEST_RECEIPT_DIR to an existing safe directory.')}
else{
 const root=resolve(directory)
 const prefix=join(root,'.dsh-private-control-probe-')
 const path=prefix+randomBytes(16).toString('hex')+'.json'
 assert.equal(dirname(path),root)
 assert.ok(path.startsWith(prefix))
 const execute=(command,args,timeout=8000,options={})=>new Promise((resolveResult,reject)=>{
  const child=spawn(command,args,{windowsHide:true,stdio:[options.input===undefined?'ignore':'pipe','pipe','pipe']})
  const output=[]
  child.stdout.on('data',bytes=>output.push(bytes))
  child.stderr.on('data',()=>{}) // Native error text is deliberately not returned.
  child.once('error',()=>reject(new Error('private-file helper could not start')))
  child.stdin?.on('error',()=>reject(new Error('private-file input failed')))
  if(options.input!==undefined)child.stdin.end(options.input,'utf8')
  child.once('close',code=>code===0?resolveResult(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(output))):reject(new Error('private-file helper exit '+code)))
 })
 const sample=JSON.stringify({probe:'temporary control record',unicode:'私有记录'})
 let created=false
 try{
  await assertPrivateReceipt(path,execute,{requirePrivateFile:false})
  await verifyReceiptCreation(path,execute)
  await writePrivateReceipt(path,sample,execute)
  created=true
  await assertPrivateReceipt(path,execute)
  assert.equal(await readFile(path,'utf8'),sample)
  await assert.rejects(writePrivateReceipt(path,'must not overwrite',execute),/只允许创建/)
  assert.equal(await readFile(path,'utf8'),sample)
  console.log('PASS native private receipt: creation-time protected DACL, UTF-8 round-trip, ACL verification and existing-file refusal; no directory or old-file ACL changed.')
 }finally{
  if(created){assert.equal(dirname(resolve(path)),root);assert.ok(resolve(path).startsWith(prefix));await unlink(path)}
 }
}
