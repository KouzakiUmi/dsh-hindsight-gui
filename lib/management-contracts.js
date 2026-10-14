/** Pure shared management contract: no Node, transport or credentials. */
export const MANAGEMENT_URL = '/plugins/dsh-hindsight-gui/manage'
export const UPLOAD_URL = '/plugins/dsh-hindsight-gui/manage/upload'
export const READ_OPERATIONS = ['diagnostics', 'settings', 'stats', 'operations', 'operation', 'bankConfig', 'aliases']
export const WRITE_OPERATIONS = ['saveSettings', 'bankPatch', 'bankReset', 'operationRetry', 'operationCancel', 'operationDelete', 'aliasAdd', 'aliasPrimary', 'aliasRemove', 'promptPreview', 'dryRun', 'llmTest', 'transferExport', 'transferImport', 'clone', 'transferDownload']
export const COST_OPERATIONS = ['operationRetry', 'dryRun', 'llmTest', 'transferImport', 'clone']
export const UPLOAD_LIMIT = 50 * 1024 * 1024
export const DOWNLOAD_LIMIT = 500 * 1024 * 1024
export const BANK_FIELDS = {
  retain_mission: { label: '提取任务说明', kind: 'text' },
  reflect_mission: { label: '反思任务说明', kind: 'text' },
  observations_mission: { label: '观察任务说明', kind: 'text' },
  retain_extraction_mode: { label: '提取模式', kind: 'choice', choices: ['concise', 'verbose', 'custom', 'verbatim', 'chunks'] },
  retain_custom_instructions: { label: '自定义提取指令', kind: 'text' },
  retain_default_strategy: { label: '默认提取策略', kind: 'text' },
  retain_strategies: { label: '提取策略 JSON', kind: 'json' },
  consolidation_strategies: { label: '整理策略 JSON', kind: 'json' },
  entity_labels: { label: '实体标签 JSON', kind: 'json' },
  entities_allow_free_form: { label: '允许自由实体标签', kind: 'boolean' },
  enable_auto_consolidation: { label: '自动整理', kind: 'boolean' },
  enable_observations: { label: '观察', kind: 'boolean' },
  enable_text_search: { label: '文本检索', kind: 'boolean' },
  enable_graph_retrieval: { label: '图检索', kind: 'boolean' },
  enable_temporal_retrieval: { label: '时间检索', kind: 'boolean' },
  enable_reranking: { label: '重排序', kind: 'boolean' },
  audit_log_enabled: { label: '此记忆库审计', kind: 'boolean' },
  recall_budget_min: { label: '检索预算下限', kind: 'integer', min: 1 },
  recall_budget_max: { label: '检索预算上限', kind: 'integer', min: 1 },
  retain_chunk_size: { label: '提取分块大小', kind: 'integer', min: 1 },
  disposition_skepticism: { label: '怀疑度', kind: 'integer', min: 1, max: 5 },
  disposition_literalism: { label: '字面倾向', kind: 'integer', min: 1, max: 5 },
  disposition_empathy: { label: '共情度', kind: 'integer', min: 1, max: 5 },
}
export const MEMORY_FIELDS = {
  autoInject: { label: '自动注入方式', kind: 'choice', choices: ['reflect', 'recall', 'pages', 'none'], default: 'reflect' },
  retainSessions: { label: '写回会话', kind: 'boolean', default: true },
  gitIngest: { label: 'Git 入库内容', kind: 'choice', choices: ['message', 'full', 'none'], default: 'message' },
  autoSeed: { label: '首次 Git 播种', kind: 'boolean', default: true },
  seedLimit: { label: '首次播种提交数', kind: 'integer', min: 1, default: 300 },
  optInOnly: { label: '仅获准目录启用', kind: 'boolean', default: false },
  optInPaths: { label: '获准目录（每行一个）', kind: 'lines', default: [] },
  surveyBudgetUsd: { label: '勘察预算（USD）', kind: 'number', min: 0.01, default: 2 },
  surveyRefreshCommits: { label: '勘察刷新提交阈值', kind: 'integer', min: 0, default: 20 },
  pageTriggerType: { label: '新知识页刷新方式', kind: 'choice', choices: ['manual', 'auto-refresh', 'cron'], default: 'cron' },
  pageTriggerCron: { label: '新知识页 Cron（支持 H）', kind: 'text', default: 'H * * * *' },
  pageSearchLimit: { label: '知识页搜索上限', kind: 'integer', min: 1, default: 10 },
  reflectTimeoutMs: { label: '自动反思超时（ms）', kind: 'integer', min: 1, default: 20000 },
  reflectToolTimeoutMs: { label: '工具反思超时（ms）', kind: 'integer', min: 1, default: 330000 },
}
