/** Official Hindsight HTTP extension, not an OS process-termination proxy. */
import { randomBytes } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, stat, unlink, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { request as httpRequest } from 'node:http'

export function validServiceControl(control) {
  if (control?.version !== 1 || control.kind !== 'http' || typeof control.token !== 'string'
    || !/^[a-f0-9]{64}$/.test(control.token) || control.token.length !== 64
    || typeof control.nonce !== 'string' || !/^[a-f0-9]{32}$/.test(control.nonce) || control.nonce.length !== 32
    || typeof control.base !== 'string') return false
  try {
    const url = new URL(control.base)
    return url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname)
      && url.port !== '0' && url.pathname === '/' && !url.username && !url.password && !url.search && !url.hash
      && [url.origin, url.origin + '/'].includes(control.base)
  } catch { return false }
}

/** Pure script generation also permits ACL regression tests without filesystem changes. */
export function windowsReceiptAclScript(path, requirePrivateFile = true) {
  const parent = dirname(resolve(path))
  const quote = value => "'" + value.replaceAll("'", "''") + "'"
  return `[Console]::OutputEncoding=[System.Text.UTF8Encoding]::new()
$ErrorActionPreference='Stop'
$allowed=@([System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value,'S-1-5-18','S-1-5-32-544')
$ok=$true
$readOnly=[long]([System.Security.AccessControl.FileSystemRights]::ReadAndExecute -bor [System.Security.AccessControl.FileSystemRights]::Synchronize)
foreach($p in @(${quote(parent)},${quote(path)})) {
  if(Test-Path -LiteralPath $p) {
    $acl=Get-Acl -LiteralPath $p
    if($allowed -notcontains $acl.GetOwner([System.Security.Principal.SecurityIdentifier]).Value){$ok=$false}
    foreach($r in $acl.GetAccessRules($true,$true,[System.Security.Principal.SecurityIdentifier])) {
      # InheritOnly does not authorize access to this object. New secret files block inheritance.
      if($r.InheritanceFlags -ne [System.Security.AccessControl.InheritanceFlags]::None -and ($r.PropagationFlags -band [System.Security.AccessControl.PropagationFlags]::InheritOnly) -ne 0){continue}
      if($r.AccessControlType -eq 'Allow' -and $allowed -notcontains $r.IdentityReference.Value -and (([long]$r.FileSystemRights -band (-bnot $(if($p -eq ${quote(parent)}){$readOnly}else{${requirePrivateFile ? '0' : '$readOnly'}}))) -ne 0)){$ok=$false}
    }
  }
}
@{private=$ok}|ConvertTo-Json -Compress`
}

/** Refuse unsafe storage; never repair ACLs or broaden trust as a side effect. */
export async function assertPrivateReceipt(path, execCapture, { requirePrivateFile = true } = {}) {
  const parent = dirname(resolve(path))
  await mkdir(parent, { recursive: true, mode: 0o700 })
  if (process.platform === 'win32') {
    const script = windowsReceiptAclScript(path, requirePrivateFile)
    let result
    try { result = JSON.parse(await execCapture('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script])) }
    catch { throw new Error('无法核验控制令牌记录的私有权限；不会启动或停止服务') }
    if (result.private !== true) throw new Error('控制令牌记录或目录可被其他账户访问；拒绝启用，未修改权限')
  } else {
    const folder = await stat(parent)
    if (folder.uid !== process.getuid() || (folder.mode & 0o022)) throw new Error('控制记录目录不是私有可写目录；拒绝启用')
    if (existsSync(path)) {
      const file = await stat(path)
      if (file.uid !== process.getuid() || (file.mode & (requirePrivateFile ? 0o077 : 0o022))) throw new Error('控制令牌记录不是私有文件；拒绝启用')
    }
  }
}

/** Create a new file with its final DACL BEFORE any secret bytes are written. */
export async function writePrivateReceipt(path, data, execCapture) {
  await assertPrivateReceipt(path, execCapture, { requirePrivateFile: false })
  if (existsSync(path)) throw new Error('只允许创建新的控制记录；不会修改旧文件权限')
  if (process.platform !== 'win32') {
    await writeFile(path, data, { flag: 'wx', mode: 0o600 })
    return
  }
  const literal = "'" + resolve(path).replaceAll("'", "''") + "'"
  // .NET Framework-only overload, verified against WinPS 5.1 and Microsoft docs.
  // Not Set-Acl: no existing object or directory is modified.
  const script = `[Console]::InputEncoding=[System.Text.UTF8Encoding]::new(); [Console]::OutputEncoding=[System.Text.UTF8Encoding]::new(); $ErrorActionPreference='Stop'; $bytes=[System.Text.Encoding]::UTF8.GetBytes([Console]::In.ReadToEnd()); $user=[System.Security.Principal.WindowsIdentity]::GetCurrent().User; $security=[System.Security.AccessControl.FileSecurity]::new(); $security.SetOwner($user); $security.SetAccessRuleProtection($true,$false); foreach($sid in @($user,[System.Security.Principal.SecurityIdentifier]::new('S-1-5-18'),[System.Security.Principal.SecurityIdentifier]::new('S-1-5-32-544'))){$security.AddAccessRule([System.Security.AccessControl.FileSystemAccessRule]::new($sid,[System.Security.AccessControl.FileSystemRights]::FullControl,[System.Security.AccessControl.AccessControlType]::Allow))}; $stream=[System.IO.FileStream]::new(${literal},[System.IO.FileMode]::CreateNew,[System.Security.AccessControl.FileSystemRights]::Write,[System.IO.FileShare]::None,4096,[System.IO.FileOptions]::None,$security); try{$stream.Write($bytes,0,$bytes.Length);$stream.Flush()}finally{$stream.Dispose()}`
  await execCapture('powershell.exe', ['-NoProfile','-NonInteractive','-Command',script], 8000, { input: data })
  await assertPrivateReceipt(path, execCapture)
}

export async function verifyReceiptCreation(path, execCapture) {
  await assertPrivateReceipt(path, execCapture, { requirePrivateFile: false })
  const prefix = resolve(path) + '.private-probe-'
  const temporary = prefix + randomBytes(16).toString('hex')
  if (!temporary.startsWith(prefix) || dirname(temporary) !== dirname(resolve(path))) throw new Error('控制记录探针路径无效')
  let created = false
  try {
    await writePrivateReceipt(temporary, '{}', execCapture)
    created = true
  } finally {
    if (created) await unlink(temporary)
  }
}

export function resolveServiceEntry(gui, entry, platform = process.platform) {
  if (!entry?.command) return null
  const explicit = typeof gui.serverPython === 'string' ? gui.serverPython.trim() : ''
  return { command: explicit || join(dirname(entry.command), platform === 'win32' ? 'python.exe' : 'python'),
    source: explicit ? 'config Python' : 'adjacent Python' }
}

export async function prepareServiceLaunch(gui, entry, target, env, recordPath, execCapture) {
  if (!Number.isInteger(target.port) || target.port < 1 || target.port > 65535) throw new Error('服务端口必须是1到65535的整数；未停止原服务')
  const launchEntry = resolveServiceEntry(gui, entry)
  const python = launchEntry?.command
  if (!existsSync(python)) throw new Error('无法确认 Hindsight 的 Python 环境；请填写已安装 hindsight-api 的 Python 解释器完整路径，不会猜测其它环境')
  const bootstrap = fileURLToPath(new URL('./python/dsh_hindsight_control.py', import.meta.url))
  const runtimeEnv = { ...env, PYTHONDONTWRITEBYTECODE: '1' }
  let probe
  try { probe = JSON.parse(await execCapture(python, [bootstrap, '--preflight'], 60_000, { env: runtimeEnv })) }
  catch { throw new Error('进程内控制预检失败；请检查 Python 环境、Hindsight 0.10.2、单 worker、HTTP 扩展及 .env 启动变量冲突；未停止原服务') }
  if (probe.version !== 1 || probe.hindsight !== '0.10.2') throw new Error('Python 环境返回不兼容的控制协议；未停止原服务')
  await verifyReceiptCreation(recordPath, execCapture)
  const control = { version: 1, kind: 'http', base: target.base,
    token: randomBytes(32).toString('hex'), nonce: randomBytes(16).toString('hex') }
  if (!validServiceControl(control)) throw new Error('仅支持本机根路径 HTTP 控制服务')
  return { command: python, args: [bootstrap, '--port', String(target.port)], detached: true, control,
    entry: launchEntry,
    env: { ...runtimeEnv, DSH_HINDSIGHT_CONTROL_TOKEN: control.token, DSH_HINDSIGHT_CONTROL_NONCE: control.nonce,
      DSH_HINDSIGHT_CONTROL_PORT: String(target.port) } }
}

export async function requestServiceControl(control, identity, action, signal) {
  if (!validServiceControl(control) || !Number.isInteger(identity?.pid) || identity.pid <= 0
    || !['identity', 'stop'].includes(action)) throw new Error('服务控制记录无效；拒绝操作')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5000)
  timer.unref?.()
  let request, response
  try {
    if (signal?.aborted) throw new Error('cancelled')
    const url = new URL(control.base)
    return await new Promise((resolveReply, reject) => {
      let settled = false
      const finish = (error, body) => {
        if (settled) return
        settled = true
        if (error) reject(error)
        else resolveReply(body)
      }
      // A one-use Agent does not inherit global proxy settings/dispatchers.
      // Pin the socket to IPv4 loopback; the original Host still binds the route.
      request = httpRequest({ hostname: '127.0.0.1', family: 4, port: Number(url.port || 80),
        path: `/ext/dsh-control/${action}`, agent: false,
        method: action === 'stop' ? 'POST' : 'GET',
        headers: { host: url.host, 'x-dsh-control-token': control.token,
          'x-dsh-control-pid': String(identity.pid), 'x-dsh-control-nonce': control.nonce },
        signal: signal ? AbortSignal.any([signal, controller.signal]) : controller.signal,
      }, res => {
        response = res
        const chunks = []
        let bytes = 0
        res.once('error', error => finish(error))
        res.once('aborted', () => finish(new Error('response aborted')))
        res.once('close', () => { if (!res.complete) finish(new Error('response incomplete')) })
        if (res.statusCode !== (action === 'stop' ? 202 : 200)) { finish(new Error('response status')); return }
        res.on('data', chunk => {
          if (settled) return
          bytes += chunk.length
          if (bytes > 4096) { finish(new Error('response budget')); res.destroy(); return }
          chunks.push(Buffer.from(chunk))
        })
        res.once('end', () => {
          if (settled) return
          try {
            if (!res.complete) throw new Error('response incomplete')
            const body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)))
            if (body.version !== 1 || body.pid !== identity.pid || body.nonce !== control.nonce
              || typeof body.stopping !== 'boolean' || (action === 'stop' && !body.stopping)) throw new Error('response identity')
            finish(null, body)
          } catch (error) { finish(error) }
        })
      })
      request.once('error', error => finish(error))
      request.once('close', () => { if (!settled) finish(new Error('request closed')) })
      request.end()
    })
  } catch {
    throw new Error('服务协作关闭通道不可用或身份不符；不会强制终止或重复启动')
  } finally {
    clearTimeout(timer)
    response?.destroy()
    request?.destroy()
  }
}
