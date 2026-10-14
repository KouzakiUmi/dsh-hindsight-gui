/** Browser-only synthetic management API. Used by the isolated preview, never production. */
export function createPreviewManagement(state, bankDefinitions, memoryDefinitions, operations) {
  const tickets = new Map()
  const jobs = new Map()
  let sequence = 0
  const settings = { scope: 'dsh', configRevision: 'preview-memory-1', guiRevision: 'preview-auth-1', runtimeApplied: 'unknown',
    fields: Object.fromEntries(Object.entries(memoryDefinitions).map(([key, spec]) => [key, { value: spec.default ?? '', configured: false, source: 'builtin:0.8.1' }])),
    apiAuth: { mode: 'inherit', reference: '', boundBase: state.api.url, configured: false, source: 'none' },
    warnings: ['模拟设置，只在浏览器内存中保存；未修改任何真实文件。'] }
  const bankConfig = { config: {}, overrides: {}, fields: {}, revision: 'preview-bank-1' }
  for (const [key, spec] of Object.entries(bankDefinitions)) {
    const value = spec.kind === 'boolean' ? true : spec.kind === 'integer' ? spec.min ?? 1 : spec.kind === 'choice' ? spec.choices[0] : spec.kind === 'json' ? (key === 'entity_labels' ? [] : {}) : ''
    bankConfig.config[key] = value
    bankConfig.fields[key] = { ...spec, value, hasOverride: false, overrideValue: null }
  }
  const capabilities = Object.fromEntries(operations.map(op => [op, { enabled: op !== 'llmTest', reason: op === 'llmTest' ? '模拟部署未开启 bank_llm_health' : null }]))
  const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value
  const identity = input => JSON.stringify(stable({ op: input.op, apiUrl: input.apiUrl, bankId: input.bankId ?? null, params: input.params ?? {} }))
  const json = (data, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => JSON.parse(JSON.stringify(data)) })
  const fail = message => json({ error: message }, 409)
  return async (path, init = {}) => {
    const url = new URL(path, 'http://preview.invalid')
    let input
    if (url.pathname.endsWith('/upload')) {
      input = JSON.parse(decodeURIComponent(init.headers['x-hindsight-transfer']))
    } else if (init.method === 'POST') input = JSON.parse(init.body)
    else input = { op: url.searchParams.get('op'), apiUrl: url.searchParams.get('apiUrl'), bankId: url.searchParams.get('bankId'), params: JSON.parse(url.searchParams.get('params') || '{}') }
    const p = input.params ?? {}
    let data
    if (input.op === 'prepare') {
      const expected = p.action === 'saveSettings' ? 'SETTINGS' : input.bankId
      if (p.typedSubject !== expected || p.acceptRisk !== true) return fail('模拟确认信息不完整')
      const confirmationToken = 'preview-confirm-'+(++sequence)
      tickets.set(confirmationToken, identity({ ...input, op: p.action, params: p.parameters }))
      data = { confirmationToken, action: p.action, expiresAt: new Date(Date.now()+120000).toISOString() }
    } else {
      if (init.method === 'POST') {
        if (tickets.get(input.confirmationToken) !== identity(input)) return fail('模拟确认票据与目标/参数不一致')
        tickets.delete(input.confirmationToken)
      }
      switch (input.op) {
        case 'diagnostics': data = { pluginVersion: 'preview-source', apiVersion: '0.10.2', features: { bank_config_api: true, bank_llm_health: false, document_export_api: true, document_import_api: true }, operations: capabilities,
          liveness: { state: 'ok', status: 'alive' }, readiness: { state: 'ok', status: 'healthy' }, auth: settings.apiAuth,
          memory: { runtimeApplied: 'unknown', source: '模拟配置候选值' }, warnings: ['此处为真实组件的模拟数据，不代表真实部署验证。'] }; break
        case 'settings': data = { ...settings, scope: p.scope ?? 'dsh' }; break
        case 'saveSettings':
          for (const [key, value] of Object.entries(p.patch ?? {})) settings.fields[key] = { value, configured: true, source: p.scope === 'global' ? 'file:global' : 'file:harnesses.dsh' }
          for (const key of p.unset ?? []) settings.fields[key] = { value: memoryDefinitions[key].default ?? '', configured: false, source: 'builtin:0.8.1' }
          if (p.apiAuth) settings.apiAuth = { ...settings.apiAuth, ...p.apiAuth, configured: p.apiAuth.mode === 'reference', source: p.apiAuth.mode === 'reference' ? '模拟引用（没有真实凭据）' : 'none' }
          settings.configRevision = 'preview-memory-'+(++sequence); settings.guiRevision = 'preview-auth-'+sequence
          data = { ...settings, scope: p.scope ?? 'dsh', saved: ['模拟设置'] }; break
        case 'stats': data = { total_nodes: 128, total_documents: 18, pending_operations: 2, failed_operations: 1, nodes_by_type: { world: 90, observation: 38 } }; break
        case 'operations': {
          const entries = [{ id: 'preview-failed-task', operation_id: 'preview-failed-task', task_type: 'retain', status: 'failed', created_at: '2026-10-13T10:00:00Z', error_message: '模拟参数错误；不是实际失败记录', progress: null },
            { id: 'preview-running-task', operation_id: 'preview-running-task', task_type: 'consolidation', status: 'processing', created_at: '2026-10-13T11:00:00Z', error_message: null, progress: { stage: 'consolidating', processed: 2, total: 5 } }]
          const filtered = entries.filter(row => (!p.status || row.status === p.status) && (!p.type || row.task_type === p.type))
          data = { bank_id: input.bankId, total: filtered.length, limit: p.limit ?? 20, offset: p.offset ?? 0, operations: filtered }; break
        }
        case 'operation': {
          const job = jobs.get(p.operationId)
          if (job) { job.polls++; data = { operation_id: p.operationId, status: job.polls > 1 ? 'completed' : 'processing', operation_type: job.type, progress: { stage: '模拟处理', processed: Math.min(job.polls, 2), total: 2 }, error_message: null } }
          else data = { operation_id: p.operationId, status: 'failed', operation_type: 'retain', error_message: '模拟失败详情', progress: null }
          break
        }
        case 'operationRetry': case 'operationCancel': case 'operationDelete': data = { success: true, operation_id: p.operationId, message: '模拟动作已受理' }; break
        case 'bankConfig': data = bankConfig; break
        case 'bankPatch':
          for (const [key, value] of Object.entries(p.updates ?? {})) {
            if (value === null) delete bankConfig.overrides[key]; else bankConfig.overrides[key] = value
            bankConfig.config[key] = value ?? (bankDefinitions[key].kind === 'boolean' ? true : '')
            bankConfig.fields[key] = { ...bankConfig.fields[key], value: bankConfig.config[key], hasOverride: value !== null, overrideValue: value }
          }
          bankConfig.revision = 'preview-bank-'+(++sequence); data = bankConfig; break
        case 'bankReset': bankConfig.overrides = {}; for (const field of Object.values(bankConfig.fields)) field.hasOverride = false; bankConfig.revision = 'preview-bank-'+(++sequence); data = bankConfig; break
        case 'aliases': data = { bank_id: input.bankId, aliases: [{ alias: '示例别名', primary: true }] }; break
        case 'aliasAdd': case 'aliasPrimary': case 'aliasRemove': data = { bank_id: input.bankId, aliases: input.op === 'aliasRemove' ? [] : [{ alias: p.alias, primary: p.primary === true }] }; break
        case 'promptPreview': data = { messages: [{ role: 'system', blocks: [{ name: '模拟说明', content: '仅为界面预览。', text: '仅为界面预览。', editable: false }] }], strategies: ['default'], strategy: p.strategy ?? null, run_settings: [], skipped_reason: null }; break
        case 'dryRun': data = { facts: [{ text: '这是模拟提取事实，不会调用模型或写入记忆库。', fact_type: 'world', entities: [] }], chunks: [{ content: p.content ?? '' }], usage: { input_tokens: 0, output_tokens: 0, total_tokens: 0 } }; break
        case 'llmTest': return fail('模拟部署未开启LLM健康测试')
        case 'clone': case 'transferExport': case 'transferImport': {
          const operationId = 'preview-transfer-'+(++sequence); jobs.set(operationId, { type: input.op, polls: 0 })
          data = { operation_id: operationId, operationId, pollBankId: input.bankId, status: 'pending', submitted: true }; break
        }
        case 'transferDownload': {
          const blob = new Blob([new Uint8Array([0x50,0x4b,0x05,0x06,0,0,0,0])], { type: 'application/zip' })
          return { ok: true, status: 200, headers: { get: name => name === 'content-length' ? String(blob.size) : 'application/zip' }, blob: async () => blob }
        }
        default: return fail('模拟管理动作尚未提供')
      }
    }
    return json({ op: input.op, apiUrl: input.apiUrl, bankId: input.bankId ?? null, data })
  }
}
