# 管理功能实现契约

## 架构

沿用现有 Host/Client、同源 loopback 栅栏、HttpError/脱敏、请求 deadline/controller、configQueue/bankQueue 和 atomicMerge CAS。Client 不导入 Node 模块，不直接访问 Hindsight、凭据库或文件系统。

- [management-contracts.js](../lib/management-contracts.js)：纯数据字段/操作/限额，供 Host 与 Client 共用。
- [management-runtime.js](../lib/management-runtime.js)：配置来源、认证引用、实例绑定和一次性确认令牌。
- [management-service.js](../lib/management-service.js)：任务、bank 配置、别名、提示词与测试，依赖注入的 transport-free 服务。
- [transfer-service.js](../lib/transfer-service.js)：ZIP 迁移、克隆、同源下载和原始上传读取。
- [index.js](../lib/index.js)：现有请求、凭据、CAS 与生命周期接线、路由注册和二进制回传。
- [ManagementPanel.tsx](../src/client/ManagementPanel.tsx)：五分类内的六组管理控件，注入 request/upload/download 桥。

接口依据实际 Hindsight API 0.10.2 OpenAPI、公开实现与 coding-agents 0.8.1 公共产物。文档核验补充参考 [React v18 的异步效果清理](https://github.com/reactjs/react.dev/blob/v18/src/content/learn/synchronizing-with-effects.md)、[Node 22 流式背压](https://github.com/nodejs/node/blob/v22.20.0/doc/api/stream.md)和 [Hindsight 官方 bank transfer 文档](https://github.com/vectorize-io/hindsight/blob/main/skills/hindsight-docs/references/developer/api/memory-banks.md)。最新公开文档不替代部署实例的方法与 feature flags 检查。

## 同源接口

- `GET /plugins/dsh-hindsight-gui/manage?op=...&apiUrl=...&bankId=...&params=<JSON>`：只读操作。
- `POST /plugins/dsh-hindsight-gui/manage`：`{op,apiUrl,bankId?,params?,confirmationToken?}`；JSON 回复 `{op,apiUrl,bankId,data}`。
- 写入、收费、导出、下载先发送 `{op:'prepare',apiUrl,bankId?,params:{action,parameters,typedSubject,acceptRisk:true,acceptCost?}}`。目标输入为 bank ID；saveSettings 为 `SETTINGS`，收费动作必须额外确认费用。
- 确认令牌一次性、有效两分钟，绑定 action/API/资源/完整 params 和认证身份；实际动作验证并消费。目标或凭据变化、dispose 会使动作失效。
- `POST /plugins/dsh-hindsight-gui/manage/upload`：原始 ZIP；`x-hindsight-transfer` 是 URI 编码的上述元信息。上传绕过 32KiB JSON parser，但受独立 50MiB 限额、长度、SHA-256 和 ZIP magic 校验；不解压到本机。
- transferDownload 返回二进制，不把上游下载 URL/storage key/token 暴露给浏览器。500MiB 上限，Host 流式回传处理背压/关闭/abort，仅访问绑定实例的下载路径，不跟随跨源重定向。
- JSON 默认30秒；dryRun/llmTest/transfer提交120秒；下载180秒。超时结果不明需重读，不能自动重做副作用。

## 注入式 API session

`client` 包含：

- `base`：canonical API base，不代表运行中记忆适配器已采用该地址。
- `signal`：Host dispose signal。
- `capabilities`：`{apiVersion,features,operations:{[op]:{enabled,reason}}}`。
- `require(method,pathTemplate,feature?)`：实际 schema 中方法存在，且指定 feature 开启。
- `json(method,path,body?,{timeoutMs}?)`：绑定认证的相对路径 JSON 请求，错误正文不回传。
- `request(method,path,{body?,headers?,timeoutMs?}?)`：multipart/二进制 Response；同源、deadline、dispose 和目标复查。
- `assertCurrent()`：异步复核配置目标、认证和生命周期，在真实动作前必须 await。

服务工厂为 `createManagementService({HttpError,redact})` 和 `createTransferService({HttpError,redact})`，返回 `{execute(client,input)}`。服务不自行注册路由或读取配置/凭据；参数和能力仍二次校验，不能只靠 UI 门控。

## 业务语义

### 任务、bank 与模型调试

- read：stats / operations / operation / bankConfig / aliases。
- write：operationRetry / operationCancel / operationDelete、bankPatch / bankReset、aliasAdd / aliasPrimary / aliasRemove、promptPreview / dryRun / llmTest。
- bankPatch：`{updates,revision}`；revision 是原始全 overrides 的稳定 JSON SHA-256，更新前复读并比较，不一致返回409。只提交 BANK_FIELDS 白名单字段，null 是官方清除覆盖的 tombstone。未知 override 不修改，也不透传前端。
- bankReset 清除整个 bank 的全部 override，包括本页未显示的策略和 Memory Defense；不是单字段恢复。
- GET bankConfig 不受 bank_config_api 写开关限制；PATCH/DELETE 必须开启。bank_llm_health 未开启时不得做 LLM 健康测试。
- 任务只投影稳定 primitive 字段和有限摘要，去掉 task_payload/result_metadata/下载地址。type 是开放安全 ASCII 标识符，status 是封闭五状态枚举。
- bank/alias ID 支持中文，最多192 UTF-8字节，不接受控制字符、斜杠或点路径，路径参数 URL 编码。
- promptPreview 只接受 operation(retain/consolidation/reflect)和 strategy，不接受样本或 mission 覆盖；不调用 LLM。dryRun接受文本和候选提取字段，不使用已废弃 agent_name，明确提示费用。

### 迁移

- clone / transferExport / transferImport / transferDownload；使用异步 `/transfer/*` 和 `/clone`，不用旧同步 document-transfer 路径。
- clone 同时需要 document_export_api 与 document_import_api。提交 DTO 为 `{operation_id,operationId,pollBankId,status:'pending',submitted:true}`，202 不代表完成。
- 所有任务记录在 URL/源 bank；restore 的记录库必须已存在、新 target 必须不存在，本页不自动创建记录库。merge 只传 mode/document_conflict，不传 target/include 选项。
- 导出子集不含 bank 配置/历史。整库 includeData/includeBankConfig/includeHistory 可明确选择。
- 下载仅内部读取已完成导出任务的指定元数据，路径为 `/v1/default/files/download/{key}`，支持实例子路径及编码名称；存储键必须归属所选 bank。轮询 include_payload 恒 false。
- `readZipBody(req,{signal,maxBytes,timeoutMs})` 处理断流/限长/超时并清理监听/定时器，无临时文件。

## 前端状态

默认 ManagementPanel 接收 category、apiUrl、banks、request、upload、download、onChanged。

- overview：诊断/队列；memory：成本隐私/认证；security：库设置；models：提示词/干跑/健康；advanced：ZIP/克隆/别名。
- 分类隐藏而不卸载；不会因返回分类重读覆盖未保存草稿。API/bank 改变时取消旧请求并丢弃迟到结果。读失败、能力未知或正忙时禁止相关写操作。
- settings 数据包含 scope、configRevision/guiRevision、`fields:{value,configured,source}`、apiAuth、runtimeApplied/warnings。全局或 DSH 专属 patch 只提交改变字段；unset 移除文件键恢复继承，不写 null 阻断环境回退。
- 基础表单同样只提交变化意图。掩码 URL 不回写，Provider 字段局部更新保留原始地址；Host 拒绝把 `[REDACTED]` 当真实新地址保存。
- API 认证仅提供 inherit/none/reference，引用绑定当前实例，显式缺凭据不会匿名 fallback；不返回明文 token。
- 保存不保证官方 RuntimeCore 缓存已更新。关闭记忆须重启 DSH 重新初始化后核验；新会话或 API restart 不等价于适配器重新加载。
- 全局 default 与 reflect 分别使用 LLM 与 REFLECT_LLM 前缀；旧 reflect-only 文件兼容全局默认，显式保存 default 后脱钩。surveyModel 为外部 CLI runner 标识，不映射 DSH 模型目录。
- 活跃向量 Provider 保存后保留其它 Provider 的未提交草稿和提示，不能静默丢弃。

## 验证

[package.json](../package.json) 的 test 包含 Host、Client、runtime、gateway、management-service、transfer-service 六组隔离测试。所有配置、凭据和 HTTP I/O 使用模拟数据；不能将隔离通过解释为真实部署验收。

[build-ui-preview.mjs](../scripts/build-ui-preview.mjs) 构建真实客户端的合成数据预览；[check-ui-preview.mjs](../scripts/check-ui-preview.mjs) 在独立 Chromium 中检查主题、窄面板、键盘、确认门禁和管理流程；预览阻止访问真实服务。实际推理、任务修改、迁移和服务启停需要目标部署环境另行验证。
