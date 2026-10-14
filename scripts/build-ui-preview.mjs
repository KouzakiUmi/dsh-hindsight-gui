/** Isolated browser preview of the real client bundle with synthetic HTTP data.
 * Downloads pinned MIT React UMD assets for this preview only; verifies npm integrity.
 * No profile reads, installation, server startup, provider calls or real config writes.
 */
import { createHash } from 'node:crypto'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { gunzipSync } from 'node:zlib'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BANK_FIELDS, MEMORY_FIELDS, READ_OPERATIONS, WRITE_OPERATIONS } from '../lib/management-contracts.js'
import { createPreviewManagement } from './ui-management-fixture.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
async function get(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) })
  if (!response.ok) throw new Error(`Preview asset HTTP ${response.status}`)
  return response
}
function untar(buffer, path) {
  for (let offset = 0; offset + 512 <= buffer.length;) {
    const header = buffer.subarray(offset, offset + 512)
    const name = header.subarray(0, 100).toString().replace(/\0.*$/, '')
    if (!name) break
    const size = parseInt(header.subarray(124, 136).toString().replace(/\0.*$/, '').trim(), 8)
    if (!Number.isSafeInteger(size) || size < 0) throw new Error('Invalid npm archive')
    const body = buffer.subarray(offset + 512, offset + 512 + size)
    if (name === path) return body.toString('utf8')
    offset += 512 + Math.ceil(size / 512) * 512
  }
  throw new Error(`Pinned preview asset missing: ${path}`)
}
async function reactAsset(name, filename) {
  const metadata = await (await get(`https://registry.npmjs.org/${name}/18.3.1`)).json()
  const data = Buffer.from(await (await get(metadata.dist.tarball)).arrayBuffer())
  const expected = metadata.dist.integrity
  const actual = 'sha512-' + createHash('sha512').update(data).digest('base64')
  if (actual !== expected) throw new Error('Pinned preview asset integrity mismatch')
  const tar = gunzipSync(data)
  return { script: untar(tar, `package/umd/${filename}`), license: untar(tar, 'package/LICENSE') }
}
const [react, reactDom, client] = await Promise.all([
  reactAsset('react', 'react.production.min.js'),
  reactAsset('react-dom', 'react-dom.production.min.js'),
  readFile(join(root, 'lib', 'client.js'), 'utf8'),
])
const initial = {
  management: { protocolVersion: 1 },
  sampledAt: new Date().toISOString(),
  api: { url: 'http://127.0.0.1:8888', up: true, state: 'ok', status: 'healthy', database: '模拟 PostgreSQL', error: null },
  controlPlane: { url: 'http://127.0.0.1:9999', up: true },
  config: { path: '~/.hindsight/coding-agent.json', exists: true, error: null, revision: 'preview-config-1', extraKeys: [],
    values: { disabled: false, apiUrl: 'http://127.0.0.1:8888', logLevel: 'info', autoUpdate: false, codebaseSurvey: false, surveyModel: '', bankId: '', dynamicBankId: true } },
  gui: { path: '~/.hindsight/dsh-hindsight-gui.json', revision: 'preview-gui-1', error: null,
    controlPlaneUrl: 'http://127.0.0.1:9999', source: 'file', serverModels: {}, auditLogEnabled: null,
    autoStart: false, serverCommand: '', providerOverrides: {}, serverEnv: [], pendingRestart: false,
    serverEmbeddings: { provider: 'openai', model: 'BAAI/bge-m3', baseUrl: 'http://127.0.0.1:1234/v1', dimensions: 1024, apiKeyEnv: 'EXAMPLE_VECTOR_KEY', localForceCpu: null, secretConfigured: false } },
  server: { port: 8888, up: true, ownership: 'unmanaged', canStart: false, canRestart: false, operation: null,
    entry: null, entryReason: '离线预览不启动进程', managedPid: null, startedAt: null, lastAction: null,
    autoStart: false, pendingRestart: false, previewError: null, runtimeConfigKnown: false, runningConfig: null,
    resolutions: ['reflect', 'retain', 'consolidation', 'mentalModel'].map(scope => ({ scope, spec: '', applied: false, mode: 'default', note: '未指定，继承启动环境或后端默认值' })),
    embeddingPreview: { provider: 'openai', model: 'BAAI/bge-m3', baseUrl: 'http://127.0.0.1:1234/v1', dimensions: 1024,
      credentialSource: '模拟环境引用（非真实凭据）', secretConfigured: true, source: 'file', mode: 'override',
      note: '下次本插件启动时应用；此页面使用模拟状态，不连接真实服务。',
      warnings: ['更换向量模型或维度可能需要重建/迁移已有向量索引，本页不会执行迁移。'] } },
  banks: [
    { id: 'preview-bank', name: '界面与交互测试', facts: 128, updatedAt: null },
    { id: 'coding-agent::very-long-project-name-for-narrow-panel-validation', name: '长名称项目 · 仅用于窄屏换行验证', facts: null, updatedAt: null },
  ], banksError: null,
}
const setup = `
let state=${JSON.stringify(initial)};
window.__previewCalls=[];
const bankPolicies=new Map();
const managementPreview=(${createPreviewManagement.toString()})(state,${JSON.stringify(BANK_FIELDS)},${JSON.stringify(MEMORY_FIELDS)},${JSON.stringify([...READ_OPERATIONS,...WRITE_OPERATIONS])});
window.fetch=async (url,init={})=>{
  const path=String(url); window.__previewCalls.push({path,method:init.method||'GET'});
  let payload;
  if(path.includes('/manage')) return managementPreview(path,init);
  if(path.endsWith('/status')) payload=state;
  else if(path.endsWith('/models')) payload={providers:[{id:'demo',name:'示例路由（非真实服务）',models:[{id:'sample',name:'示例对话模型'}]}],errors:[],state:'ok',sampledAt:state.sampledAt};
  else if(path.includes('/bankdefense')) {
    const body=JSON.parse(init.body||'{}');
    const bank=init.method==='POST'?body.bankId:new URL(path,'http://preview.invalid').searchParams.get('bank');
    if(init.method==='POST') bankPolicies.set(bank,{enabled:body.enabled===true,rules:body.enabled?[{on:'sensitive_data',action:'redact'}]:[]});
    payload={bank,memoryDefense:bankPolicies.get(bank)||{enabled:false,rules:[]}};
  }
  else if(path.endsWith('/config')) {
    const body=JSON.parse(init.body||'{}');
    Object.assign(state.config.values,Object.fromEntries(Object.entries(body).filter(([key])=>key in state.config.values)));
    for(const key of ['controlPlaneUrl','serverModels','auditLogEnabled','autoStart','serverCommand']) if(key in body) state.gui[key]=body[key];
    if(body.serverEmbeddings) {
      const next={...state.gui.serverEmbeddings,...body.serverEmbeddings};
      next.secretConfigured=body.serverEmbeddings.clearApiKey?false:!!body.serverEmbeddings.apiKey||state.gui.serverEmbeddings.secretConfigured;
      delete next.apiKey; delete next.clearApiKey; state.gui.serverEmbeddings=next;
      state.server.embeddingPreview={...state.server.embeddingPreview,...next,mode:next.provider?'override':'inherit'};
      state.server.pendingRestart=true;
    }
    state.gui.revision='preview-gui-'+Date.now(); state.config.revision='preview-config-'+Date.now();
    payload={...state,saved:Object.keys(body).filter(key=>!key.endsWith('Revision')),rejected:[]};
  } else return {ok:false,status:409,json:async()=>({error:'离线预览禁止启动/重启进程或访问外部端点'})};
  return {ok:true,status:200,json:async()=>JSON.parse(JSON.stringify(payload))};
};
// The preview's Control Plane link must not navigate to a real loopback service.
document.addEventListener('click',event=>{
  const anchor=event.target instanceof Element?event.target.closest('a'):null;
  if(anchor){event.preventDefault();window.__previewCalls.push({path:anchor.href,method:'BLOCKED_NAVIGATION'});}
});
const jsx=(type,props,key)=>React.createElement(type,key===undefined?props:{...props,key});
window.__ModuleLoader__={load({factory}){
  const client=factory(id=>id==='react'?React:id==='react/jsx-runtime'?{jsx,jsxs:jsx,Fragment:React.Fragment}:(()=>{throw new Error('Unexpected preview dependency '+id)})());
  client.apply({slots:{inject(_name,register){register()},register(meta,component){
    if(meta.name==='main')ReactDOM.createRoot(document.getElementById('preview-root')).render(React.createElement(component));
    return ()=>{};
  }}});
}};
`
const scripts = [react.script, reactDom.script, setup, client].map(script => `<script>${script.replace(/<\/script/gi, '<\\/script')}</script>`).join('\n')
const license = [react.license, reactDom.license].join('\n').replace(/-->/g, '-- >')
const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hindsight 设置页｜隔离预览</title><link rel="icon" href="data:,"><style>
*{box-sizing:border-box}html,body{margin:0;height:100%;font-family:system-ui,sans-serif;background:#f6f7f9;color:#222}body{display:flex;flex-direction:column}#preview-banner{padding:8px 18px;background:#e8eef9;border-bottom:1px solid #cbd5e1;font-size:12px;flex:0 0 auto}#preview-root{flex:1;min-height:0;max-width:1120px;width:100%;margin:0 auto;background:white;--dsw-alias-bg-base:#fff;--dsw-alias-bg-layer-1:#fff;--dsw-alias-bg-layer-2:#f3f4f6;--dsw-alias-label-primary:#1a1a1a;--dsw-alias-label-secondary:#555;--dsw-alias-label-tertiary:#666;--dsw-alias-border-l2:rgba(0,0,0,.12);--dsw-alias-brand-primary:#3b82f6}
body[data-ds-dark-theme]{background:#131517;color:#f4f4f5}body[data-ds-dark-theme] #preview-banner{background:#1e293b;border-color:#334155}body[data-ds-dark-theme] #preview-root{background:#181a1d;--dsw-alias-bg-base:#181a1d;--dsw-alias-bg-layer-1:#1e2125;--dsw-alias-bg-layer-2:#272b30;--dsw-alias-label-primary:#f4f4f5;--dsw-alias-label-secondary:#c5c7cc;--dsw-alias-label-tertiary:#a1a5ae;--dsw-alias-border-l2:rgba(255,255,255,.14);--dsw-alias-border-l3:rgba(255,255,255,.18)}
</style></head><body><div id="preview-banner">隔离 UI 预览 · 真实客户端组件＋模拟数据 · 不连接或改写任何实际服务</div><main id="preview-root"></main>${scripts}<!-- ${license} --></body></html>`
await mkdir(join(root, 'dist'), { recursive: true })
const target = join(root, 'dist', 'embedding-tabs-preview.html')
await writeFile(target, html, 'utf8')
console.log(`Isolated preview: ${target} (React 18.3.1, npm-integrity-verified assets, synthetic fetch only)`)
