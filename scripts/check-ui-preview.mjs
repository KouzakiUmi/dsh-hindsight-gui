/** Browser acceptance over the existing synthetic preview, never a DSH/profile URL.
 * Run after build-client/build-ui-preview: node scripts/check-ui-preview.mjs <Chrome executable>
 * Uses a fresh temporary profile, no server or third-party test dependency.
 */
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, readFile, writeFile, mkdir, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname, resolve, basename } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { setTimeout as sleep } from 'node:timers/promises'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const chrome = process.argv[2]
assert.ok(chrome && (await stat(chrome)).isFile(), 'Pass a verified installed Chrome executable')
const preview = join(root, 'dist', 'embedding-tabs-preview.html')
await stat(preview)
const profile = await mkdtemp(join(tmpdir(), 'hindsight-ui-check-'))
const browser = spawn(chrome, ['--headless', `--user-data-dir=${profile}`, '--remote-debugging-port=0',
  '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--disable-extensions', 'about:blank'],
  { windowsHide: true, stdio: 'ignore' })
let spawnError = null
browser.on('error', error => { spawnError = error })
let ws, call, exited = false
browser.once('exit', () => { exited = true })
const errors = []
const results = []
try {
  let port
  for (let i = 0; i < 100; i++) {
    if (spawnError) throw spawnError
    if (exited) throw new Error('Isolated browser exited before DevTools became ready')
    try { port = Number((await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]); break }
    catch (error) { if (error.code !== 'ENOENT') throw error }
    await sleep(100)
  }
  assert.ok(Number.isInteger(port) && port > 0, 'Owned isolated DevTools endpoint must be ready')
  const endpoint = `http://127.0.0.1:${port}`
  const get = async path => {
    const response = await fetch(endpoint + path, { signal: AbortSignal.timeout(10000) })
    assert.equal(response.status, 200)
    return response.json()
  }
  const protocol = await get('/json/protocol')
  for (const [domain, command] of [['Page','captureScreenshot'],['Runtime','evaluate'],['Emulation','setDeviceMetricsOverride'],['Input','dispatchKeyEvent'],['Browser','close']]) {
    assert.ok(protocol.domains.find(d => d.domain === domain)?.commands.some(c => c.name === command), `${domain}.${command} is unsupported by the actual browser`)
  }
  const version = await get('/json/version')
  console.log(`Isolated visual acceptance: ${version.Browser}`)
  const targets = await get('/json/list')
  const page = targets.find(target => target.type === 'page' && target.url === 'about:blank')
  assert.ok(page, 'Use only the new browser\'s blank page')
  ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((resolveOpen, reject) => { ws.addEventListener('open', resolveOpen, { once: true }); ws.addEventListener('error', reject, { once: true }) })
  let sequence = 0
  const pending = new Map()
  ws.addEventListener('message', event => {
    const message = JSON.parse(String(event.data))
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text)
    const entry = pending.get(message.id)
    if (!entry) return
    pending.delete(message.id); clearTimeout(entry.timer)
    if (message.error) entry.reject(new Error(JSON.stringify(message.error)))
    else entry.resolve(message.result)
  })
  call = (method, params = {}) => new Promise((resolveCall, reject) => {
    const id = ++sequence
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)) }, 10000)
    pending.set(id, { resolve: resolveCall, reject, timer })
    ws.send(JSON.stringify({ id, method, params }))
  })
  const evaluate = async expression => {
    const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text)
    return result.result.value
  }
  await call('Runtime.enable'); await call('Page.enable')
  await call('Page.navigate', { url: pathToFileURL(preview).href })
  for (let i = 0; i < 100; i++) {
    if (await evaluate('document.querySelectorAll("[role=tab]").length === 5 && !!document.querySelector(".dsh-hsp-savebar")')) break
    await sleep(100)
  }
  assert.equal(await evaluate('document.querySelectorAll("[role=tab]").length'), 5)
  await sleep(150)
  const select = async id => {
    await evaluate(`document.querySelector('#dsh-hsp-tab-${id}').click()`)
    await sleep(50)
  }
  const capture = async (name, tab, width, height, dark) => {
    await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 500 })
    // Deliberately emulate dark OS preference while the host chooses light.
    await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] })
    await evaluate(`document.body.toggleAttribute('data-ds-dark-theme', ${dark}); document.querySelector('.dsh-hsp-root').scrollTop=0`)
    await select(tab)
    const layout = await evaluate(`(() => { const panel=document.querySelector('.dsh-hsp-root'); const save=document.querySelector('.dsh-hsp-savebar'); return { width:panel.clientWidth, scrollWidth:panel.scrollWidth, scheme:getComputedStyle(panel).colorScheme, saveBottom:save.getBoundingClientRect().bottom, viewport:innerHeight }; })()`)
    assert.ok(layout.scrollWidth <= layout.width + 1, `${name}: horizontal overflow ${JSON.stringify(layout)}`)
    assert.equal(layout.scheme, dark ? 'dark' : 'light', `${name}: host theme must win over OS preference`)
    assert.ok(layout.saveBottom <= layout.viewport + 1, `${name}: sticky save controls must remain reachable`)
    const image = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
    const path = join(root, 'dist', `${name}.png`)
    await writeFile(path, Buffer.from(image.data, 'base64'))
    results.push({ name, ...layout })
  }
  await capture('settings-overview-light', 'overview', 1200, 1000, false)
  await evaluate('document.querySelector("#dsh-hsp-panel-overview a").click()')
  assert.equal(await evaluate('window.__previewCalls.at(-1).method'),'BLOCKED_NAVIGATION','Preview links cannot open real loopback services')
  await select('models')
  await evaluate(`const details=document.querySelector('#dsh-hsp-panel-models details'); if(details.open)details.querySelector('summary').click()`)
  await capture('settings-models-dark', 'models', 1200, 1100, true)
  await capture('settings-security-mobile', 'security', 390, 844, false)
  // Bring the bank controls clear of sticky chrome; only the synthetic fixture is written.
  await evaluate(`document.querySelector('.dsh-hsp-root').scrollTop=240; document.querySelector('#dsh-hsp-panel-security li input[type=checkbox]').click()`)
  await sleep(100)
  assert.equal(await evaluate('document.querySelector("#dsh-hsp-panel-security li input[type=checkbox]").checked'), true, 'Synthetic redaction write confirmed in the real component')
  const mobileImage=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false})
  await writeFile(join(root,'dist','settings-security-mobile.png'),Buffer.from(mobileImage.data,'base64'))
  await evaluate(`document.querySelector('input[aria-label="搜索记忆库"]').focus()`)
  await call('Input.insertText', { text: '长名称' })
  await sleep(50)
  assert.equal(await evaluate('document.querySelectorAll("#dsh-hsp-panel-security li").length'), 1, 'Search matches the bank name')
  await select('overview')
  await evaluate(`document.querySelector('#dsh-hsp-tab-overview').focus()`)
  await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 })
  await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 })
  await sleep(50)
  assert.equal(await evaluate('document.activeElement.id'), 'dsh-hsp-tab-memory')
  assert.equal(await evaluate('document.querySelector("[role=tab][aria-selected=true]").id'), 'dsh-hsp-tab-memory')
  await call('Emulation.setDeviceMetricsOverride', { width: 1200, height: 1000, deviceScaleFactor: 1, mobile: false })
  await evaluate('document.querySelector("#preview-root").style.width="450px"')
  const columns = await evaluate('getComputedStyle(document.querySelector("#dsh-hsp-panel-memory .dsh-hsp-field")).gridTemplateColumns')
  assert.equal(columns.trim().split(/\s+/).length, 1, 'A narrow host pane stacks fields even on a wide viewport')
  await capture('settings-memory-narrow-pane', 'memory', 1200, 1000, false)
  // New management workflows use synthetic data only, through the actual request bridge.
  await evaluate('document.querySelector("#preview-root").style.width="100%"')
  const waitFor = async expression => { for (let i=0;i<80;i++) { if (await evaluate(expression)) return; await sleep(100) }; throw new Error('UI condition timed out: '+expression) }
  const setValue = async (selector, value) => {
    await evaluate(`(() => { const el=document.querySelector(${JSON.stringify(selector)}); if(!el)throw Error('Missing control'); Object.getOwnPropertyDescriptor(el.constructor.prototype,'value').set.call(el,${JSON.stringify(value)}); el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); })()`)
    await sleep(50)
  }
  const clickText = async (scope, text) => { await evaluate(`(() => { const el=[...document.querySelectorAll(${JSON.stringify(scope+' button')})].find(b=>b.textContent.includes(${JSON.stringify(text)})); if(!el||el.disabled)throw Error('Action unavailable: '+${JSON.stringify(text)}); el.click(); })()`); await sleep(60) }
  const bankId=await evaluate('state.banks[0].id')
  const confirm = async subject => {
    await waitFor('!!document.querySelector(".dsh-hsm-dialog")')
    assert.equal(await evaluate('document.querySelector(".dsh-hsm-dialog button:last-child").disabled'),true,'Blank confirmation cannot execute')
    await setValue('.dsh-hsm-dialog input[type=text]',subject)
    await evaluate('[...document.querySelectorAll(".dsh-hsm-dialog input[type=checkbox]")].forEach(el=>{if(!el.checked)el.click()})')
    await clickText('.dsh-hsm-dialog','确认')
    await waitFor('!document.querySelector(".dsh-hsm-dialog")')
  }
  const memory='.dsh-hsm-section[aria-label="记忆与隐私设置"]'
  const security='.dsh-hsm-section[aria-label="库级配置"]'
  const models='.dsh-hsm-section[aria-label="模型调试"]'
  const advanced='.dsh-hsm-section[aria-label="高级迁移与别名"]'
  await select('memory'); await waitFor('!!document.querySelector("select[aria-label=\\"API 凭据模式\\"]")')
  await setValue('select[aria-label="API 凭据模式"]','none')
  await select('overview'); await select('memory'); await sleep(100)
  assert.equal(await evaluate('document.querySelector("select[aria-label=\\"API 凭据模式\\"]").value'),'none','Management draft survives category roundtrip')
  await clickText(memory,'保存'); await confirm('SETTINGS')
  await select('security'); await setValue(security+' input[aria-label="记忆库 ID"]',bankId)
  await waitFor('!!document.querySelector("input[aria-label=\\"此记忆库审计（覆盖）\\"]")')
  await evaluate('document.querySelector("input[aria-label=\\"此记忆库审计（覆盖）\\"]").click()')
  await clickText(security,'保存'); await confirm(bankId)
  await select('models'); await setValue(models+' input[aria-label="记忆库 ID"]',bankId)
  await clickText(models,'预览'); await confirm(bankId)
  assert.equal(await evaluate('document.querySelector(".dsh-hsm-section[aria-label=\\"模型调试\\"]").textContent.includes("仅为界面预览")'),true,'Prompt preview rendered')
  await setValue('textarea[aria-label="干跑候选文本"]','Synthetic sample only')
  await clickText(models,'干跑'); await confirm(bankId)
  await select('advanced'); await setValue(advanced+' input[aria-label="记忆库 ID"]',bankId)
  await setValue('input[aria-label="新别名"]','测试别名')
  await clickText(advanced,'添加'); await confirm(bankId)
  await clickText(advanced,'提交导出'); await confirm(bankId)
  await setValue('input[aria-label="克隆目标库 ID"]','synthetic-copy')
  await clickText(advanced,'提交克隆'); await confirm(bankId)
  await setValue('input[aria-label="导入目标库 ID"]','synthetic-restore')
  await evaluate(`(() => { const dt=new DataTransfer();dt.items.add(new File([new Uint8Array([80,75,5,6,0,0,0,0])],'synthetic.zip',{type:'application/zip'}));const el=document.querySelector('input[aria-label="选择 ZIP 归档"]');el.files=dt.files;el.dispatchEvent(new Event('change',{bubbles:true})); })()`)
  await sleep(150)
  await clickText(advanced,'上传并导入'); await confirm(bankId)
  await waitFor('[...document.querySelectorAll(".dsh-hsm-section[aria-label=\\"高级迁移与别名\\"] button")].some(b=>b.textContent.includes("下载归档"))')
  await clickText(advanced,'下载归档'); await confirm(bankId)
  assert.ok(await evaluate('window.__previewCalls.some(c=>c.method==="BLOCKED_NAVIGATION" && c.path.startsWith("blob:"))'),'Synthetic download reached Blob bridge without writing a real file')
  const managementCalls=await evaluate('window.__previewCalls.filter(c=>c.path.includes("/manage")).length')
  assert.ok(managementCalls>10,'Management bridge executes all six workflow groups')
  assert.deepEqual(errors, [])
  console.log(JSON.stringify({ passed: true, results, keyboard: 'ArrowRight focus + selection verified', paneColumns: columns, managementCalls, managementWorkflows:'settings + bank config + prompt + dry-run + alias + export + clone + ZIP import; confirmations required' }, null, 2))
} finally {
  // Close only the browser we spawned, never an existing user window/profile.
  if (call && ws?.readyState === WebSocket.OPEN) await call('Browser.close').catch(error => console.warn(`Owned browser close: ${error.message}`))
  ws?.close()
  for (let i = 0; i < 50 && !exited; i++) await sleep(100)
  if (!exited) browser.kill()
  // Verify the exact fresh temporary directory before deleting our test profile.
  const target = resolve(profile)
  assert.equal(dirname(target), resolve(tmpdir()))
  assert.ok(basename(target).startsWith('hindsight-ui-check-'))
  await rm(target, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
}
