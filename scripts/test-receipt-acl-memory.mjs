/** Run the production ACL predicate on in-memory descriptors, never filesystem ACLs. */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { windowsReceiptAclScript } from '../lib/service-control.js'
if(process.platform!=='win32'){
 console.log('SKIP Windows in-memory ACL matrix on this platform.')
}else{
 const query=windowsReceiptAclScript('C:/synthetic-control/receipt.json')
 assert.ok(query.includes('GetAccessRules($true,$true'))
 assert.ok(!query.includes('$r.IsInherited'))
 const script=`
[Console]::OutputEncoding=[System.Text.UTF8Encoding]::new()
$ErrorActionPreference='Stop'
$sid=[System.Security.Principal.WindowsIdentity]::GetCurrent().User
$other=[System.Security.Principal.SecurityIdentifier]::new('S-1-1-0')
function Get-Acl {param($LiteralPath) if($LiteralPath -like '*receipt.json'){$script:file}else{$script:folder}}
function Test-Path {param($LiteralPath) $true}
$rows=@()
foreach($case in @('inherit-only','effective-write','read-only-parent','readable-secret','foreign-owner','null-dacl')) {
 $script:folder=[System.Security.AccessControl.DirectorySecurity]::new()
 $script:file=[System.Security.AccessControl.FileSecurity]::new()
 foreach($descriptor in @($script:folder,$script:file)) {
  $descriptor.SetOwner($sid)
  $descriptor.AddAccessRule([System.Security.AccessControl.FileSystemAccessRule]::new($sid,[System.Security.AccessControl.FileSystemRights]::FullControl,[System.Security.AccessControl.AccessControlType]::Allow))
 }
 switch($case) {
  'inherit-only' {$script:folder.AddAccessRule([System.Security.AccessControl.FileSystemAccessRule]::new([System.Security.Principal.SecurityIdentifier]::new('S-1-3-0'),[System.Security.AccessControl.FileSystemRights]::FullControl,([System.Security.AccessControl.InheritanceFlags]::ContainerInherit -bor [System.Security.AccessControl.InheritanceFlags]::ObjectInherit),[System.Security.AccessControl.PropagationFlags]::InheritOnly,[System.Security.AccessControl.AccessControlType]::Allow))}
  'effective-write' {$script:folder.AddAccessRule([System.Security.AccessControl.FileSystemAccessRule]::new($other,[System.Security.AccessControl.FileSystemRights]::Modify,[System.Security.AccessControl.AccessControlType]::Allow))}
  'read-only-parent' {$script:folder.AddAccessRule([System.Security.AccessControl.FileSystemAccessRule]::new($other,([System.Security.AccessControl.FileSystemRights]::ReadAndExecute -bor [System.Security.AccessControl.FileSystemRights]::Synchronize),[System.Security.AccessControl.AccessControlType]::Allow))}
  'readable-secret' {$script:file.AddAccessRule([System.Security.AccessControl.FileSystemAccessRule]::new($other,[System.Security.AccessControl.FileSystemRights]::Read,[System.Security.AccessControl.AccessControlType]::Allow))}
  'foreign-owner' {$script:folder.SetOwner($other)}
  'null-dacl' {$script:folder.SetSecurityDescriptorSddlForm('O:'+$sid.Value+'D:NO_ACCESS_CONTROL')}
 }
 $result=& { ${query} }
 $rows+=@{name=$case;private=($result|ConvertFrom-Json).private}
}
@{cases=$rows}|ConvertTo-Json -Compress -Depth 3
`
 const result=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{windowsHide:true})
 assert.ifError(result.error)
 assert.equal(result.status,0,'ACL memory query failed; stderr bytes='+result.stderr.length)
 const rows=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(result.stdout)).cases
 assert.deepEqual(rows.map(row=>[row.name,row.private]),[
  ['inherit-only',true],['effective-write',false],['read-only-parent',true],['readable-secret',false],['foreign-owner',false],['null-dacl',false],
 ])
 console.log('Windows ACL memory regressions: 6 passed; production predicate, no filesystem ACL or credential I/O.')
}
