# 技术参考 / Technical reference

> [返回 README 首页](../README.md)。本页提供完整的双语配置、设计、开发与发布说明。 [`lib/client.js`](../lib/client.js) 为构建产物，不要直接编辑；以下代码树及命令中的相对路径均以仓库根目录为基准。

为 [Hindsight](https://github.com/vectorize-io/hindsight) 记忆系统提供的 DeepSeek Harness 侧边栏设置页。

A settings page for the [Hindsight](https://github.com/vectorize-io/hindsight) memory stack in the DeepSeek Harness sidebar.

---

## 这是什么 / What this is

一个 DSH 插件：侧边栏一个图标按钮，点开是 Hindsight 记忆系统的设置页，编辑配置文件并显示实时运行状态。

A DSH plugin: one icon in the sidebar opens a settings page for the Hindsight memory system, editing its configuration and showing live status.

### 它不提供记忆功能

**本插件不提供任何 `hindsight_*` 工具。** 那些工具由官方的 [`@vectorize-io/hindsight-coding-agents`](https://www.npmjs.com/package/@vectorize-io/hindsight-coding-agents) 提供（它自带 MCP server）。

**This plugin provides no `hindsight_*` tools.** Those come from the official `@vectorize-io/hindsight-coding-agents` package, which ships its own MCP server.

本插件的定位是**记忆系统的仪表盘**：它让你在 DSH 界面里查看和调整那套系统的配置与运行状态，而不是记忆功能本身。需要记忆功能时安装官方包；本 GUI 不是其必需依赖。

This plugin is a **dashboard for the memory system**: it shows and adjusts that system's configuration and status. It is not the memory system. Install the official package for memory tools; this GUI is optional.

### 你需要自己部署 Hindsight

**本插件不会安装或部署 Hindsight。** 它可连接现有 API；对于已安装的本机 `hindsight-api`，也可由插件启动，并仅在核验启动进程链或本插件留下的持久归属记录后尝试停止/重启。远端、HTTPS、IPv6 和非根路径地址可连接并调用服务 API，但不支持本机进程管理；库策略写入仍须通过目标校验并由上游服务允许。使用顺序是：

**This plugin does not install or deploy Hindsight.** It can connect to an existing API, or launch an already-installed local `hindsight-api`. Stop/restart requires a verified launch process chain or this plugin's revalidated persistent ownership receipt; remote, HTTPS, IPv6 and non-root-path URLs remain connectable but their processes cannot be managed locally; bank-policy writes require target checks and upstream permissions. The order is:

1. **先准备 Hindsight** — 按 [官方文档](https://hindsight.vectorize.io/) 自行部署可连接的 API，或自行安装本机 `hindsight-api` 可执行文件供插件启动；插件不安装依赖。

   **Prepare Hindsight first**: deploy a connectable API yourself, or install the local `hindsight-api` executable for the plugin to launch. The plugin never installs dependencies.

2. **再安装这两个 DSH 包** — 官方包提供 `hindsight_*` 工具，本插件提供配置界面。需要界面和记忆工具时可并列安装；仅官方包提供记忆工具。

   **Then install both DSH packages** — the official package provides the `hindsight_*` tools, this one provides the settings UI. The official package supplies memory tools; this GUI is optional.

3. **最后在设置页填两个地址** — 打开侧边栏的 Hindsight 页面，填入：

   **Finally fill in the two addresses on the settings page** — open the Hindsight page in the sidebar and enter:

   | 字段 / Field | 填什么 / What to enter | 例 / Example |
   | --- | --- | --- |
   | 服务地址 / Service address | 你部署的 Hindsight **API** 地址，写入 `apiUrl` | `http://127.0.0.1:8888` |
   | 控制台地址 / Control Plane address | 你部署的 **Control Plane**（Web 控制台）地址 | `http://127.0.0.1:9999` |

   保存后状态区会显示两个服务的运行情况：API 是否健康、用的是哪个数据库、控制台是否可达，并列出已有的记忆库。地址填错时状态显示「未运行」，改回来即可。

   After saving, the status section reports whether each service is up, which database the API uses, and lists the existing banks. A wrong address shows as "not running"; correct it and the status updates.

**不填控制台地址也能用** —— 记忆只需要 API 地址。控制台是可选的 Web 管理界面，不填则保持默认 `http://127.0.0.1:9999`。

**The Control Plane address is optional** — memory only needs the API address. The Control Plane is the optional web UI; leave it unset and the default `http://127.0.0.1:9999` applies.

---

## 设置页能做什么 / What the settings page does

编辑 `~/.hindsight/coding-agent.json` 与插件自己的 `~/.hindsight/dsh-hindsight-gui.json`（路径均可用环境变量覆盖），并显示实时状态。

Edits `~/.hindsight/coding-agent.json` and this plugin's own `~/.hindsight/dsh-hindsight-gui.json` (both paths overridable by environment variable), and shows live status.

### 可编辑项 / Editable settings

| 区块 / Section | 控件 / Control | 写入的位置 / Written to |
| --- | --- | --- |
| 记忆 / Memory | 启用/关闭本 harness 的长期记忆 | `disabled` → `coding-agent.json` |
| 记忆库命名 / Bank naming | 按工作区动态命名（`harness::项目名`）或固定 bank id | `dynamicBankId`、`bankId` → `coding-agent.json` |
| 连接 / Connection | **Hindsight API 地址** | `apiUrl` → `coding-agent.json` |
| 连接 / Connection | **控制台地址（Control Plane）** | `controlPlaneUrl` → `dsh-hindsight-gui.json` |
| 连接 / Connection | 插件日志级别（debug / info / warn / error） | `logLevel` → `coding-agent.json` |
| 模型 / Models | **代码库勘察模型（Codebase Survey）** | `surveyModel` → `coding-agent.json` |
| 模型 / Models | **反思推理模型（Reflect LLM）** | `serverModels.reflect` → `dsh-hindsight-gui.json` |
| 模型 / Models | **事实提取模型（Retain LLM）** | `serverModels.retain` → `dsh-hindsight-gui.json` |
| 模型 / Models | **记忆整理模型（Consolidation LLM）** | `serverModels.consolidation` → `dsh-hindsight-gui.json` |
| 模型 / Models | **知识提炼模型（Mental Model Refresh LLM）** | `serverModels.mentalModel` → `dsh-hindsight-gui.json` |
| 模型 / Models | **向量模型（Embedding）**：后端 + 该后端的模型、端点、维度、凭据 | `serverEmbeddings` → `dsh-hindsight-gui.json` |
| Provider 覆盖 / Provider overrides | 为非内置 Provider 填 openai 兼端点与凭据（Base URL / API Key / 环境变量名） | `providerOverrides` → `dsh-hindsight-gui.json` |
| 服务管理 / Service management | **启动服务 / 重启服务**按钮 | 动作（不写配置） |
| 服务管理 / Service management | API 未运行时自动拉起 | `autoStart` → `dsh-hindsight-gui.json` |
| 服务管理 / Service management | 启动命令覆盖（hindsight-api 完整路径，留空自动发现） | `serverCommand` → `dsh-hindsight-gui.json` |
| 安全 / Security | 审计日志开关（`HINDSIGHT_API_AUDIT_LOG_ENABLED`） | `auditLogEnabled` → `dsh-hindsight-gui.json` |
| 记忆库 / Banks | 按 bank 开关脱敏（Memory Defense：sensitive_data → redact） | bank config API（不落盘到本页文件） |
| 其他 / Other | 自动更新运行时 | `autoUpdate` → `coding-agent.json` |
| 其他 / Other | 代码库勘察 | `codebaseSurvey` → `coding-agent.json` |

### 界面结构 / Page layout

设置页分成五个分类标签：**概览**、**记忆与连接**、**模型**、**安全**、**高级**。所有分类共用一个保存条。

The page is split into five categories — 概览 (overview), 记忆与连接 (memory & connection), 模型 (models), 安全 (security), 高级 (advanced) — sharing one save bar.

- **跨分类保留草稿** —— 每个分类的未保存编辑都留在页面状态里，来回切换不会丢；状态轮询也不会覆盖它们。有未保存更改时页头提示「有未保存的更改（跨分类保留）」，当前分类之外的标签后带 `·`。
- **键盘操作** —— 标签栏是标准 ARIA tabs（roving tabindex）：`←`/`→` 循环切换，`Home`/`End` 跳到首/末。
- **全局保存** —— 底部「保存」/「放弃更改」一次提交所有分类；保存结果与失败原因都在同一条上可见。保存期间若没有新输入，草稿会按服务器返回的状态重置；有新输入则保留，不会被保存响应覆盖。
- **错误与未知可见** —— 读取失败、409 冲突、维度不是正整数等错误都显式提示；解析不出来的字段显示为「未知」而不是留空。

- **Drafts survive tab switches** — each category keeps its unsaved edits in page state; switching tabs never loses them and status polling never overwrites them. With unsaved changes the header says so, and non-active dirty categories get a `·` marker.
- **Keyboard** — the tab bar is a standard ARIA tablist with roving tabindex: `←`/`→` wrap around, `Home`/`End` jump to the first/last category.
- **One global save** — the bottom 保存 / 放弃更改 bar submits every category at once and reports both the result and the failure reason. With no new input during the save, drafts reset from the server response; input typed meanwhile is kept.
- **Errors and unknowns stay visible** — read failures, 409 conflicts and non-positive-integer dimensions are reported explicitly, and unresolvable fields render as "未知" instead of blank.

### 模型选择机制 / Model selection details

- **DSH 环境模型自动发现**：页面打开或点击「刷新 DSH 模型」时，调用 `/plugins/dsh-hindsight-gui/models`，直接拉取当前 DSH 环境中已配置 Provider（如 `minimax-cn`、`kimi-coding`、`commandcode` 等）注册的可用模型列表。
- **自由切换自定义输入**：下拉列表不仅支持一键点选环境模型（格式为 `provider/model`），还支持随时切换到「自定义输入...」手动键入任意模型名（如 `deepseek-flash`）。
- **暗色主题原生适配**：下拉选择框与弹出选项遵循 `color-scheme: dark`，与 DSH 客户端深色主题完全对齐。
- **服务端各功能模型分工**：
  - **代码库勘察（Survey）**：新仓库结构与规范分析，默认 `haiku`；保存至 `coding-agent.json`，下一轮对话立即生效。
  - **反思推理（Reflect）**：响应 `hindsight_reflect` 深度记忆问答，推荐推理能力强的模型（默认继承启动环境或 Hindsight 的后端默认值）。
  - **事实提取（Retain）**：高频对话事实提炼，推荐成本低、响应快且支持 JSON Schema 的模型（默认继承启动环境或后端默认值）。
  - **记忆整理（Consolidation）**：后台相似记忆去重聚合。
  - **知识提炼（Mental Model）**：刷新持久化知识库页面（架构图与概念规范）。
  - 服务端模型保存至 `dsh-hindsight-gui.json`；**插件在启动/重启服务时按当前设置动态构建 `HINDSIGHT_API_*_LLM_*` 环境变量**（见下文「服务管理」），不再依赖任何静态启动脚本。

### 向量模型（Embedding） / Embedding model

「模型」分类里的**向量模型**卡片配置的是 Hindsight 自己的向量化后端，与 DSH 的聊天模型列表无关；它只写入插件自有文件 `~/.hindsight/dsh-hindsight-gui.json` 的 `serverEmbeddings`。

The **向量模型** card in the 模型 category configures Hindsight's own vectorization backend — it is not part of the DSH chat model list — and is written only to `serverEmbeddings` in this plugin's own `~/.hindsight/dsh-hindsight-gui.json`.

- **后端 / Backends**：`local`、`openai`（OpenAI 兼容端点，含 LM Studio）、`onnx`、`tei`。下拉里第一项「继承环境 / 既有服务配置」（留空）表示本页不接管。
- **按后端显示的字段 / Fields shown per backend**：`local` 为模型名 + 是否强制 CPU；`openai` 为模型、Base URL、维度、Key 环境变量名与 Key；`onnx` 为模型 ID + 维度；`tei` 只有服务地址，模型与维度由远端服务决定。
- **鉴权要求 / Authentication prerequisite**：所对照的 Hindsight 0.10.2 接口要求 `openai` 有非空向量 Key 或可继承的服务端 LLM Key；即使 LM Studio 端点不校验 Key，也需用户明确填写非敏感占位值，本页不会自动生成。`tei` 必须有服务地址。缺失这些前提时仍可保存草稿设置，但启动预览显示错误，预检不会停止原服务。
- **后端切换 / Provider switching**：各后端临时草稿分开保存，避免把 OpenAI 地址或模型带入 TEI/ONNX；保存仅提交当前后端。其它后端有未保存输入时会明确提示，不静默丢弃。Host 切换后端也清空无关参数，但保留专用 Key，除非用户显式清除。
- **维度 / Dimensions**：只有 `openai` 与 `onnx` 可填，且必须是正整数（留空继承既有维度配置，否则由模型或服务决定）；`local` 的维度由模型自动确定；`tei` 的维度由服务控制。非法值在写入前就被拒绝。
- **显式值优先、空字段继承 / Explicit fields win, blank fields inherit**：选定后端后，只有该后端对应且非空的字段会进入启动环境，其余继续继承既有 `serverEnv` 或宿主环境。留空后端表示继承——**本页不迁移、不覆盖旧值**，旧值只在预览里显示来源。
- **凭据 / Credentials**：本页只为 `openai` 显式设置 Key。省略或留空保留已存值；显式「清除向量 Key」（`clearApiKey`）只清掉本页这一份，运行时**仍可能继承** `HINDSIGHT_API_EMBEDDINGS_OPENAI_API_KEY` 或服务端 LLM Key。Key 环境变量名（凭据引用）复用宿主 `ctx.credentials.resolve`，顺序为：本页值 → `env:<NAME>` → `dsh-credentials:<NAME>`；预览只回报来源与 `secretConfigured`，不回传密钥。显式引用解析不到时预览直接变为错误，不会悄悄换成另一个来源。
- **启动环境 / Launch environment**：选定后端后，插件在下次启动/重启时拼装 `HINDSIGHT_API_EMBEDDINGS_PROVIDER`，以及按后端取用的 `_LOCAL_MODEL`、`_LOCAL_FORCE_CPU`、`_OPENAI_MODEL`、`_OPENAI_BASE_URL`、`_OPENAI_DIMENSIONS`、`_OPENAI_API_KEY`、`_ONNX_MODEL_ID`、`_ONNX_DIMENSIONS`、`_TEI_URL`。环境变量按 `hindsight-api` 0.10.2 的配置契约核对；其它版本须确认对应字段与运行依赖。
- **预览不是运行配置 / The preview is not the running configuration**：「已保存预览」反映的是**已保存**的设置，不是当前草稿；「当前运行」一栏只显示本插件确认过的启动快照。第三方实例的真实配置仍然未知。
- **本页不做的 / Out of scope**：不迁移或重建已有向量索引，不下载模型，不安装依赖，不开启 `trust_remote_code`，不自动发布或重启服务；现有手动服务按钮仍按进程所有权规则工作。更换向量模型或维度前请自行核对存量数据并规划迁移；启动失败时页面会提示配置的向量端点（如本地服务未运行），但不会替你改动它。

- **Backends** — `local`, `openai` (OpenAI-compatible endpoints such as LM Studio), `onnx`, `tei`. The first option, "继承环境 / 既有服务配置", leaves the provider empty and hands control back.
- **Per-backend fields** — model plus a force-CPU toggle for `local`; model, base URL, dimensions, key-env-name and key for `openai`; model id and dimensions for `onnx`; base URL only for `tei`, whose model and dimensions are decided remotely.
- **Dimensions** — only `openai` and `onnx` accept one, as an optional positive integer; `local` derives it from the model and `tei` decides it. Invalid values are rejected before anything is written.
- **Explicit wins, blank inherits** — with a provider selected, only that provider's non-empty fields enter the launch environment and the rest keep inheriting `serverEnv` or the host environment. An empty provider inherits: these settings never migrate or overwrite existing values, they only show the provider-selection source; individual blank fields may still inherit other sources.
- **Credentials** — only the `openai` key is settable here. Omitted or empty keeps the saved value; 清除向量 Key (`clearApiKey`) removes only this page's copy and an inherited `HINDSIGHT_API_EMBEDDINGS_OPENAI_API_KEY` or server LLM key can still apply. The key-env-name is a credential reference resolved through the host `ctx.credentials.resolve` service (this page → `env:<NAME>` → `dsh-credentials:<NAME>`); the preview reports the source and `secretConfigured`, never the key. An unresolvable explicit reference turns the preview into an error instead of silently using another source.
- **Preview vs. runtime** — 已保存预览 reflects the saved settings, not the current draft; 当前运行 shows only this plugin's confirmed launch snapshot, and a third-party instance stays unknown.
- **Out of scope** — no index migration or rebuild, no model download, no dependency install, no `trust_remote_code`, no automatic publishing or restart; explicit service controls still use the existing ownership checks. Changing the embedding model or dimensions is on you: check the stored data and plan the migration yourself.

### 服务管理 / Service management

插件自带受控的本机服务管理；本页保存的设置是下次插件启动的输入，不代表外部服务已经采用这些设置：

- **启动 / 重启按钮**：host 查找已安装的 `hindsight-api`（`serverCommand` → `PATH` → 常见 uv/pip 位置），启动后轮询 `/health`（90 秒启动检查窗口）。Windows uv/pip 启动器与 Python 监听进程可有不同 PID；插件沿父进程链核验到原启动器的 PID、操作系统启动时间与可执行路径，而非仅凭端口或程序名称接管。Windows 仅使用不带 `/F` 的 `taskkill /PID` 温和尝试，失败须手动关闭，没有强制回退。
- **DSH 重启后恢复管理**：插件在 GUI 配置路径后追加 `.server.json` 保存归属记录和不含密钥的启动快照。新实例重新核验服务 PID、启动时间和可执行路径；旧 DSH 仍存活时不会争抢。PID 被复用、记录损坏或无记录的外部实例不会自动接管。旧版已遗留且无记录的服务需用户手动关闭，再由新版插件首次启动生成记录；本页不自动迁移或追认它。
- **有界等待与迟到就绪**：系统查询超时直接结束等待，不依赖杀掉查询子进程后一定出现 `close`。浏览器状态请求最长等待 30 秒，启动/重启请求最长等待 180 秒（包含预检与状态汇总）；失败主动刷新，慢轮询不会被每 15 秒的新请求挤掉。超时不等于服务已退出，插件保留身份记录以防重复启动；后续状态确认健康时使用原启动快照，而不是冒称已应用新保存的配置。
- **自动启动**：开启后页面可请求 host 拉起未运行、且可管理的本机 API（45 秒冷却）；第三方实例不会被接管。
- **凭据解析链**：设置页 Provider 覆盖（Key 或环境变量名）→ 环境变量 `<PROVIDER>_API_KEY` / `<PROVIDER>_TOKEN` → `ctx.credentials.resolve` 宿主凭据服务；不直接扫描凭据 YAML。状态仅显示来源或失败原因，不返回密钥。
- **Provider 覆盖**：hindsight-api 内置类型（`openai`、`anthropic`、`gemini`、`groq`、`minimax` 等）可直接用；其它 Provider（如 DSH 环境里的 `commandcode`）按 openai 兼容端点处理，需填写 Base URL。
- **生效时机**：服务端设置下次成功启动时应用；运行配置只是本插件启动确认后的快照，不是第三方服务真实配置查询。外部实例的运行配置未知，`pendingRestart` 只对已确认的本插件实例有意义。
- **审计日志**：`auditLogEnabled` 映射为 `HINDSIGHT_API_AUDIT_LOG_ENABLED`（部署级默认，可按 bank 在 Control Plane 覆盖）。
- **脱敏（Memory Defense）**：按 bank 仅编辑本页持有的规范规则 `{on: sensitive_data, action: redact}`，保留其它更强或自定义规则；不能据此保证第三方服务原始日志或历史备份已清理。
- **环境变量透传**：`serverEnv`（配置文件高级透传；页面不直接编辑其值）仅允许 `HINDSIGHT_API_*`、`NO_PROXY`/`no_proxy`、`PYTHONUTF8` 字符串变量；页面明确设置的模型、审计和 Provider 等值优先于透传值。

**两个地址与模型写进不同的文件**：`apiUrl` 和 `surveyModel` 是上游集成认识的键，必须留在 `coding-agent.json`；`controlPlaneUrl` 和 `serverModels` 存入插件自有配置文件 `~/.hindsight/dsh-hindsight-gui.json` 中。

**The two addresses go to different files**: `apiUrl` is a key the upstream integration reads, so it stays in `coding-agent.json`. `controlPlaneUrl` is not a key upstream knows at all — writing it there would only pollute a file the integration maintains — so it lives in this plugin's own `~/.hindsight/dsh-hindsight-gui.json`.


### 只读展示 / Read-only display

- **服务状态** — API 是否运行、健康状态、数据库类型、Control Plane 是否可达、启动入口与最近一次启动/重启结果
- **向量预览** — 已保存的 `serverEmbeddings` 解析出的后端 / 模型 / 端点 / 维度 / 配置来源（`file`、`serverEnv`、`env` 或 `default`）/ 凭据来源与警告；外加「当前运行」一栏（仅本插件确认过的启动快照）
- **路由解析预览** — 下次本插件启动/重启拟应用的模型与凭据来源及失败原因；已保存 Provider Key 仅返回 `secretConfigured`，留空/省略 Key 保留原值，非空输入更换，显式 `clearApiKey` 才清除
- **记忆库列表** — 每个 bank 的 id、fact 数量、脱敏开关状态
- **本页不写的键** — 配置文件里本页不管理的键（如 `banks`、`paths`、`mapPathToBank`），折叠列出，保存时原样保留

### 生效时机 / When a save takes effect

记忆类设置（`disabled`、`bankId`、`surveyModel` 等）随集成每次 `loadConfig()` 重新读取，**下一轮对话**即生效，无需重启。

服务端设置（`serverModels`、`serverEmbeddings`、`auditLogEnabled`、`providerOverrides`、`serverEnv`、`serverCommand`）塑造的是**服务进程的环境**，在下次启动/重启时应用——页面会显示「pendingRestart」提示并提供重启按钮。向量预览同理由此产生：它显示的是已保存设置在下次启动时会解析成什么，不是草稿，也不是当前进程的真实配置。

Memory-side settings take effect on the next turn — the integration re-reads the config file on every `loadConfig()` call. Server-side settings shape the server process environment and apply on the next start/restart; the page tracks that with a pending-restart banner and offers the button. The embedding preview comes from the same mechanism: it shows what the saved settings resolve to for the next launch — not the draft, and not the live process configuration.

---

## 设计说明 / Design notes

### 为什么页面要经过 host 转发

Hindsight API 在 `127.0.0.1:8888` 上响应时**不返回 `Access-Control-Allow-Origin` 头**（地址可用 `HINDSIGHT_API_URL` 覆盖），浏览器会拒绝来自 DSH 页面的跨域 `fetch`。所以 host 半侧是一个同源代理：页面调用 DSH web server 上的 `/plugins/dsh-hindsight-gui/status` 与 `/config`，由 host 在服务端发起 API 请求——那里不存在 CORS 限制。

The Hindsight API answers on `127.0.0.1:8888` **without an `Access-Control-Allow-Origin` header**, so a cross-origin `fetch` from the DSH page is refused by the browser. The host half is therefore a same-origin proxy: the page calls `/plugins/dsh-hindsight-gui/status` and `…/config` on the DSH web server, and the API request is made there, server-side, where CORS does not apply.

### 写入的安全性

- **键白名单** — 只有上表列出的键可以被页面写入，其余一律拒绝并回报
- **单文件原子保存** — 写临时文件后 rename；两个配置文件之间不是事务，失败时可能只保存一份，响应会明确报告部分保存，须刷新核对
- **并发与损坏保护** — 保存需要两文件 revision 比对，文件损坏时拒绝覆盖；前端未保存编辑不会被轮询覆盖，错误状态可见
- **保留备份** — 写入已有文件前复制为 `.bak`；备份及第三方原始日志不属于本页脱敏清理范围
- **同源限制** — 必须是发往 DSH web server 自身端口的 loopback 同源请求；变更类请求还必须携带合法 `Origin`
- **体积限制** — 请求体上限 32 KB，10 秒超时

- **Key whitelist** — only the keys listed above are writable; the rest are rejected and reported back
- **Per-file atomic save and revision checks** — temp file plus rename and a `.bak` copy for existing files; the two files are not transactional and a partial save is reported. Corrupt files are not overwritten; refresh after a conflict. Host errors and log summaries are redacted, not third-party raw logs or historical backups.
- **Same-origin only** — loopback requests on the DSH server's own port; mutating requests must also carry a valid `Origin`
- **Size cap** — 32 KB request body, 10 s deadline

### 缺失配置时的行为

配置文件不存在时页面可显示默认值并首次保存；JSON 损坏或读取失败时会显示错误并拒绝覆盖，需先手动修复文件。

Missing config files can be created on first save. Malformed or unreadable files show an error and cannot be overwritten until repaired.

### 环境变量

| 变量 | 默认 | 作用 |
| --- | --- | --- |
| `HINDSIGHT_CONFIG` | `~/.hindsight/coding-agent.json` | 上游配置文件路径 |
| `HINDSIGHT_GUI_CONFIG` | `~/.hindsight/dsh-hindsight-gui.json` | 插件自有配置文件路径 |
| `HINDSIGHT_CP_URL` | `http://127.0.0.1:9999` | 控制台地址的**回退值**；设置页保存后以文件为准 |
| `HINDSIGHT_API_URL` | `http://127.0.0.1:8888` | 状态检查所查询的 API 地址（只读，不覆盖设置页填的 `apiUrl`） |

控制台地址的解析顺序：**设置页保存的文件值 → `HINDSIGHT_CP_URL` → 默认值**。页面会把当前值和它的来源显示出来，所以一眼能看出是自己在管还是继承了环境变量。

The Control Plane address resolves in this order: the value saved from the page, then `HINDSIGHT_CP_URL`, then the default. The page shows both the current value and where it came from.

### 地址校验

API、Control Plane 和 Provider Base URL 在保存前校验：仅限 `http`/`https`，不含内嵌凭据、query 或 fragment；保留合法的服务路径。非法地址会明确报错，不静默回退到另一实例。本机服务管理只支持根路径的 IPv4 回环 HTTP 地址。记忆库策略写入还会核对页面所指 API 地址，地址变化时返回 409，避免修改另一个实例的同名记忆库。

API, Control Plane and provider base URLs are validated before saving: HTTP(S) only, without credentials, query or fragment; valid base paths are preserved. Invalid URLs do not silently fall back to another instance. Local process management requires a root-path IPv4 loopback HTTP URL. Bank policy writes include the expected API base and reject a changed target with HTTP 409.

---

## 安装 / Installation

统一通过 `dsh plugin` 操作目标 Profile；执行前核对命令入口和 Profile，不在 Profile 内裸跑 npm/pnpm 安装。以下使用 `web` 作为示例 Profile，不代表实际安装目标。一般插件兼容性以目标实际 DSH Core 版本及其导出契约为准，CLI、npm 管理器和桌面壳版本不是通用的额外兼容门槛。

Use `dsh plugin` for the target Profile after verifying the command entry and Profile. Do not run bare npm/pnpm installs inside a Profile. Plugin compatibility is based on the actual target DSH Core contracts, not a blanket CLI, npm-manager or desktop-shell version requirement:

```bash
dsh plugin --profile web add dsh-hindsight-gui
```

然后确认 `dsh-hindsight-gui` 在 profile 的 `dsh.profile.bundles` 列表里，**重启 DSH** 让 host 与浏览器两半重新加载。

Then make sure `dsh-hindsight-gui` is listed in the profile's `dsh.profile.bundles`, and **restart DSH** so the host and browser halves reload.

从源码安装（开发用）：`git clone` 后 `pnpm install`，再 `dsh plugin --profile web add file:/path/to/dsh-hindsight-gui`。

To install from source (for development): `git clone`, `pnpm install`, then `dsh plugin --profile web add file:/path/to/dsh-hindsight-gui`.

### 记忆功能 / Memory

记忆工具由官方包提供，与本插件并列启用：

The memory tools come from the official package, enabled alongside this plugin:

```bash
dsh plugin --profile web add @vectorize-io/hindsight-coding-agents
```

### Hindsight 服务端 / Hindsight server

本插件**不负责部署 Hindsight 服务端**，详见上面的「你需要自己部署 Hindsight」。

This plugin **does not deploy a Hindsight server** — see "You need to deploy Hindsight yourself" above.

---

## 开发 / Development

```bash
pnpm install
pnpm build:client              # esbuild → lib/client.cjs → lib/client.js
node scripts/check-manifest.mjs  # 校验 manifest、命名一致性与语法
node scripts/test-host.mjs       # 离线 host 回归测试
node scripts/test-client.mjs     # 离线 client 回归测试
```

浏览器半侧打包为 CJS 模块并包进 `window.__ModuleLoader__.load({ id: … })`，`react` 保持 external（由宿主提供）。

`lib/client.js` 是**构建产物**，不要直接编辑——改 `src/client/index.tsx`。改完务必重新构建，否则页面会静默保持旧行为；`check-manifest.mjs` 会检测出产物比源码旧的情况。

客户端页面在单个组件里用 ARIA tabs 切分五个分类：每个分类的草稿各自存在组件 state 中，与「最近一次从 host 读到的基线」比较得出未保存提示（标签上的 `·`、页头与底部保存条的提示），一次保存提交所有分类。向量设置在 host 半侧分两步：`normalizeServerEmbeddings` 校验（后端白名单、字段白名单、端点、凭据引用名、正整数维度、`clearApiKey` 与 `apiKey` 互斥），`applyServerEmbeddings` 在 `serverEnv` 透传之后只叠加活跃后端的非空字段，并回报预览与警告；预览报错时启动/重启按钮保持禁用。改这两处同样要重新 `build:client` 才能在页面上看到。

`lib/client.js` is a **build artifact** — edit `src/client/index.tsx` instead. Rebuild after every change, or the page silently keeps the old behaviour; `check-manifest.mjs` detects a bundle older than its source.

The page splits into five categories with ARIA tabs inside one component: each category keeps its draft in component state and compares it against the baseline last read from the host to derive the unsaved marker (the `·`, the header hint and the save bar), and one save submits every category. Embedding settings are handled host-side in two steps — `normalizeServerEmbeddings` validates (backend whitelist, field whitelist, endpoint, credential-reference name, positive-integer dimensions, `clearApiKey` and `apiKey` mutually exclusive), and `applyServerEmbeddings` overlays only the active backend's non-empty fields after the `serverEnv` passthrough, returning the preview and its warnings; an error preview keeps start/restart disabled. Both need `build:client` before the page shows them.

```
cordis.patch.yml                自我挂载：只向 loader 插入一行
lib/index.js                    host 半侧 —— /status 与 /config 路由
lib/client.js, lib/client.cjs   构建产物（勿改）
src/client/index.tsx            浏览器半侧源码
scripts/build-client.mjs        客户端构建脚本
scripts/check-manifest.mjs      仓库一致性校验
```

---

## 发布 / Publishing

每次推送到 `main`，GitHub Actions 会检查客户端构建、manifest 和打包内容，然后通过 npm Trusted Publishing 自动发布到 `latest`。PR 只检查，不发布。

Every push to `main` builds and validates the package, then publishes it to npm with Trusted Publishing. Pull requests only run checks.

### 自动版本号 / Automatic versions

- 如果 `package.json` 的版本高于 npm 上所有稳定版本，使用该版本。例如源代码为 `1.1.0`、npm 为 `1.0.0`，首次自动发布 `1.1.0`。
- 否则在 npm 的最高稳定版本上递增 patch：`1.1.0` → `1.1.1` → `1.1.2`。
- 自动版本号只写入 CI 中的发布包，不回写仓库。需要提升 minor 或 major 时，手动调整 `package.json`。
- 已发布的同一提交重跑时跳过发布。不同发布任务共享并发组，防止同时选择相同版本。
- 仍支持 `v*` 标签发布指定版本；标签必须等于 `package.json` 的版本，且不能重复覆盖 npm 上已有的版本。

CI uses the source version when it exceeds all published stable versions; otherwise it increments the highest published patch version. It changes only the CI package, without committing version changes back. Re-running an already published commit skips publishing. Tags remain available for explicit versions.

### 一次性 npm 授权 / One-time npm authorization

包已存在于 npm。以包维护者账户打开 [包设置](https://www.npmjs.com/package/dsh-hindsight-gui/access)，在 Trusted Publisher 中选择 GitHub Actions，核对：

| 字段 | 值 |
| --- | --- |
| Organization or user | `KouzakiUmi` |
| Repository | `dsh-hindsight-gui` |
| Workflow filename | `publish.yml` |
| Environment name | 发布 job 使用 `npm`；若在 npm Trusted Publisher 限制环境，填写 `npm` 并与工作流匹配；不限制时可留空 |
| Allowed actions | 允许 `npm publish` |

The package already exists. Configure its Trusted Publisher for `KouzakiUmi/dsh-hindsight-gui`, workflow `publish.yml`, with `npm` as the environment if you enable an environment restriction (the workflow publish job uses `environment: npm`); leaving it unrestricted is also possible. Allow direct `npm publish`.

工作流使用 Node 24，并显式安装 npm 11；OIDC 发布要求 npm ≥11.5.1、Node ≥22.14.0。无需 `NPM_TOKEN` secret，也不依赖本机登录或 Windows Hello。包设置的授权字段必须与工作流匹配；已有配置过期或不匹配时，需要在 npm 端重新配置。

Trusted Publishing needs npm ≥11.5.1 and Node ≥22.14.0. The workflow uses Node 24 and explicitly installs npm 11. No npm token or local login is needed.

参考：[npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/)。

### 演练 / Dry run

在 GitHub Actions 的 Publish 工作流点击 Run workflow，保留默认 `dry-run: true`。它会检查并上传待发布 tarball，不实际发布。手动实际发布时选择 `main` 并将 `dry-run` 设为 `false`。

Run the Publish workflow with its default `dry-run: true` to validate and upload the release tarball. Select `main` and disable dry-run for a manual release.

---

## 上游 / Upstream

Hindsight 本身未被修改，来自 [vectorize-io/hindsight](https://github.com/vectorize-io/hindsight)（MIT）。本仓库是围绕它的界面集成。

Hindsight itself is unmodified and comes from [vectorize-io/hindsight](https://github.com/vectorize-io/hindsight) (MIT). This repository is a UI integration around it.

## 许可 / License

MIT

隔离视觉自验：`node scripts/build-ui-preview.mjs` 使用真实客户端组件与模拟 HTTP 数据，下载并校验固定 React 18.3.1 的 MIT 预览资源（不安装到 Profile、不下载字体或模型）。经授权可运行 `node scripts/serve-ui-preview.mjs`，仅在随机 `127.0.0.1` 端口提供该页面，验证结束后关闭；此预览不属于正式部署或真实服务验收。
