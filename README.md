# dsh-hindsight-gui

为 [Hindsight](https://github.com/vectorize-io/hindsight) 记忆系统提供的 DeepSeek Harness 侧边栏设置页。

A settings page for the [Hindsight](https://github.com/vectorize-io/hindsight) memory stack in the DeepSeek Harness sidebar.

---

## 这是什么 / What this is

一个 DSH 插件：侧边栏一个图标按钮，点开是 Hindsight 记忆系统的设置页，编辑配置文件并显示实时运行状态。

A DSH plugin: one icon in the sidebar opens a settings page for the Hindsight memory system, editing its configuration and showing live status.

### 它不提供记忆功能

**本插件不提供任何 `hindsight_*` 工具。** 那些工具由官方的 [`@vectorize-io/hindsight-coding-agents`](https://www.npmjs.com/package/@vectorize-io/hindsight-coding-agents) 提供（它自带 MCP server）。

**This plugin provides no `hindsight_*` tools.** Those come from the official `@vectorize-io/hindsight-coding-agents` package, which ships its own MCP server.

本插件的定位是**记忆系统的仪表盘**：它让你在 DSH 界面里查看和调整那套系统的配置与运行状态，而不是记忆功能本身。需要同时安装官方包才能真正使用记忆。

This plugin is a **dashboard for the memory system**: it shows and adjusts that system's configuration and status. It is not the memory system. Install the official package alongside it to actually use memory.

### 你需要自己部署 Hindsight

**本插件不会安装、不会启动、也不会停止 Hindsight 服务。** 它只连接一个已经在运行的实例。所以使用顺序是：

**This plugin never installs, starts or stops a Hindsight server.** It only connects to one that is already running. The order is:

1. **先部署 Hindsight** — 按 [官方文档](https://hindsight.vectorize.io/) 自行部署（Hindsight Cloud 或自托管），确认 API 端口在监听。

   **Deploy Hindsight first**, per the upstream documentation — either Hindsight Cloud or your own server — and make sure its API port is listening.

2. **再安装这两个 DSH 包** — 官方包提供 `hindsight_*` 工具，本插件提供配置界面。两者都装才会话里才有记忆功能。

   **Then install both DSH packages** — the official package provides the `hindsight_*` tools, this one provides the settings UI. Memory only works with both.

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
| Provider 覆盖 / Provider overrides | 为非内置 Provider 填 openai 兼端点与凭据（Base URL / API Key / 环境变量名） | `providerOverrides` → `dsh-hindsight-gui.json` |
| 服务管理 / Service management | **启动服务 / 重启服务**按钮 | 动作（不写配置） |
| 服务管理 / Service management | API 未运行时自动拉起 | `autoStart` → `dsh-hindsight-gui.json` |
| 服务管理 / Service management | 启动命令覆盖（hindsight-api 完整路径，留空自动发现） | `serverCommand` → `dsh-hindsight-gui.json` |
| 安全 / Security | 审计日志开关（`HINDSIGHT_API_AUDIT_LOG_ENABLED`） | `auditLogEnabled` → `dsh-hindsight-gui.json` |
| 记忆库 / Banks | 按 bank 开关脱敏（Memory Defense：sensitive_data → redact） | bank config API（不落盘到本页文件） |
| 其他 / Other | 自动更新运行时 | `autoUpdate` → `coding-agent.json` |
| 其他 / Other | 代码库勘察 | `codebaseSurvey` → `coding-agent.json` |

### 模型选择机制 / Model selection details

- **DSH 环境模型自动发现**：页面打开或点击「刷新 DSH 模型」时，调用 `/plugins/dsh-hindsight-gui/models`，直接拉取当前 DSH 环境中已配置 Provider（如 `minimax-cn`、`kimi-coding`、`commandcode` 等）注册的可用模型列表。
- **自由切换自定义输入**：下拉列表不仅支持一键点选环境模型（格式为 `provider/model`），还支持随时切换到「自定义输入...」手动键入任意模型名（如 `deepseek-flash`）。
- **暗色主题原生适配**：下拉选择框与弹出选项遵循 `color-scheme: dark`，与 DSH 客户端深色主题完全对齐。
- **服务端各功能模型分工**：
  - **代码库勘察（Survey）**：新仓库结构与规范分析，默认 `haiku`；保存至 `coding-agent.json`，下一轮对话立即生效。
  - **反思推理（Reflect）**：响应 `hindsight_reflect` 深度记忆问答，推荐推理能力强的模型（默认 `MiniMax-M3`）。
  - **事实提取（Retain）**：高频对话事实提炼，推荐成本低、响应快且支持 JSON Schema 的模型（默认 `deepseek-flash`）。
  - **记忆整理（Consolidation）**：后台相似记忆去重聚合。
  - **知识提炼（Mental Model）**：刷新持久化知识库页面（架构图与概念规范）。
  - 服务端模型保存至 `dsh-hindsight-gui.json`；**插件在启动/重启服务时按当前设置动态构建 `HINDSIGHT_API_*_LLM_*` 环境变量**（见下文「服务管理」），不再依赖任何静态启动脚本。

### 服务管理 / Service management

插件自带服务生命周期管理，设置页就是服务运行配置的唯一真源：

- **启动 / 重启按钮**：host 半侧发现 `hindsight-api` 可执行文件（顺序：设置页 `serverCommand` 覆盖 → `PATH` → uv/pip 默认安装位置），按当前设置构建环境后以独立进程启动，并轮询 `/health` 直到就绪（90 秒超时）。重启会先终止端口上的现有监听进程（无论它由谁启动）。
- **自动启动**：勾选并保存后，打开设置页时若 API 未运行，页面会自动请求 host 拉起服务（45 秒冷却，避免反复拉起）。
- **凭据解析链**：设置页 Provider 覆盖（直接填 Key 或环境变量名）→ 环境变量 `<PROVIDER>_API_KEY` / `<PROVIDER>_TOKEN` → DSH 凭据库（`~/.dsh/.credentials.yaml`，best-effort）。**任何一环失败都会在状态区标红显示原因，绝不静默回退**。
- **Provider 覆盖**：hindsight-api 内置类型（`openai`、`anthropic`、`gemini`、`groq`、`minimax` 等）可直接用；其它 Provider（如 DSH 环境里的 `commandcode`）按 openai 兼容端点处理，需填写 Base URL。
- **生效时机**：记忆类设置下一轮对话生效；服务端设置（模型路由、审计日志、Provider 覆盖、环境变量透传）在下次启动/重启时应用。页面用 `pendingRestart` 标记跟踪这一状态，并在服务运行中时显示「立即重启生效」横幅。
- **审计日志**：`auditLogEnabled` 映射为 `HINDSIGHT_API_AUDIT_LOG_ENABLED`（部署级默认，可按 bank 在 Control Plane 覆盖）。
- **脱敏（Memory Defense）**：按 bank 通过 bank config API 写入 `memory_defense` 策略（`sensitive_data → redact`），密钥/令牌等敏感串在入库前被打码。
- **环境变量透传**：`serverEnv`（高级）可向服务进程注入任意 `HINDSIGHT_API_*` 变量（如数据库配置）；host 还会规范化 `NO_PROXY` 并设置 `PYTHONUTF8=1`。

**两个地址与模型写进不同的文件**：`apiUrl` 和 `surveyModel` 是上游集成认识的键，必须留在 `coding-agent.json`；`controlPlaneUrl` 和 `serverModels` 存入插件自有配置文件 `~/.hindsight/dsh-hindsight-gui.json` 中。

**The two addresses go to different files**: `apiUrl` is a key the upstream integration reads, so it stays in `coding-agent.json`. `controlPlaneUrl` is not a key upstream knows at all — writing it there would only pollute a file the integration maintains — so it lives in this plugin's own `~/.hindsight/dsh-hindsight-gui.json`.


### 只读展示 / Read-only display

- **服务状态** — API 是否运行、健康状态、数据库类型、Control Plane 是否可达、启动入口与最近一次启动/重启结果
- **路由解析预览** — 下次启动/重启将应用的各功能模型、凭据来源，以及解析失败的原因（标红）
- **记忆库列表** — 每个 bank 的 id、fact 数量、脱敏开关状态
- **本页不写的键** — 配置文件里本页不管理的键（如 `banks`、`paths`、`mapPathToBank`），折叠列出，保存时原样保留

### 生效时机 / When a save takes effect

记忆类设置（`disabled`、`bankId`、`surveyModel` 等）随集成每次 `loadConfig()` 重新读取，**下一轮对话**即生效，无需重启。

服务端设置（`serverModels`、`auditLogEnabled`、`providerOverrides`、`serverEnv`、`serverCommand`）塑造的是**服务进程的环境**，在下次启动/重启时应用——页面会显示「pendingRestart」提示并提供重启按钮。

Memory-side settings take effect on the next turn — the integration re-reads the config file on every `loadConfig()` call. Server-side settings shape the server process environment and apply on the next start/restart; the page tracks that with a pending-restart banner and offers the button.

---

## 设计说明 / Design notes

### 为什么页面要经过 host 转发

Hindsight API 在 `127.0.0.1:8888` 上响应时**不返回 `Access-Control-Allow-Origin` 头**（地址可用 `HINDSIGHT_API_URL` 覆盖），浏览器会拒绝来自 DSH 页面的跨域 `fetch`。所以 host 半侧是一个同源代理：页面调用 DSH web server 上的 `/plugins/dsh-hindsight-gui/status` 与 `/config`，由 host 在服务端发起 API 请求——那里不存在 CORS 限制。

The Hindsight API answers on `127.0.0.1:8888` **without an `Access-Control-Allow-Origin` header**, so a cross-origin `fetch` from the DSH page is refused by the browser. The host half is therefore a same-origin proxy: the page calls `/plugins/dsh-hindsight-gui/status` and `…/config` on the DSH web server, and the API request is made there, server-side, where CORS does not apply.

### 写入的安全性

- **键白名单** — 只有上表列出的键可以被页面写入，其余一律拒绝并回报
- **原子保存** — 写临时文件后 rename，中途崩溃不会留下半截配置
- **保留备份** — 每次保存前把原文件复制为 `.bak`
- **同源限制** — 必须是发往 DSH web server 自身端口的 loopback 同源请求；变更类请求还必须携带合法 `Origin`
- **体积限制** — 请求体上限 32 KB，10 秒超时

- **Key whitelist** — only the keys listed above are writable; the rest are rejected and reported back
- **Atomic save** — temp file plus rename, so a crash cannot leave a half-written config; the previous file is copied to `.bak`
- **Same-origin only** — loopback requests on the DSH server's own port; mutating requests must also carry a valid `Origin`
- **Size cap** — 32 KB request body, 10 s deadline

### 缺失配置时的行为

配置文件不存在或 JSON 损坏时，页面照常打开并显示默认值（`logLevel` 为 `info`、`disabled` 为 `false`、动态命名开启），不会报错。这样第一次使用不必先手工创建文件。

A missing or malformed config file does not break the page: it opens with defaults and lets you create the file by saving.

### 环境变量

| 变量 | 默认 | 作用 |
| --- | --- | --- |
| `HINDSIGHT_CONFIG` | `~/.hindsight/coding-agent.json` | 上游配置文件路径 |
| `HINDSIGHT_GUI_CONFIG` | `~/.hindsight/dsh-hindsight-gui.json` | 插件自有配置文件路径 |
| `HINDSIGHT_CP_URL` | `http://127.0.0.1:9999` | 控制台地址的**回退值**；设置页保存后以文件为准 |
| `HINDSIGHT_API_URL` | `http://127.0.0.1:8888` | 状态检查所查询的 API 地址（只读，不覆盖设置页填的 `apiUrl`） |

控制台地址的解析顺序：**设置页保存的文件值 → `HINDSIGHT_CP_URL` → 默认值**。页面会把当前值和它的来源显示出来，所以一眼能看出是自己在管还是继承了环境变量。

The Control Plane address resolves in this order: the value saved from the page, then `HINDSIGHT_CP_URL`, then the default. The page shows both the current value and where it came from.

### 控制台地址的校验

这是页面唯一接受自由文本、随后又会被 host 拿去发起请求的字段，所以写入前会校验：仅限 `http`/`https`、不含内嵌凭据、不含 query 与 fragment。`javascript:`、`file:` 之类一律拒绝并返回明确错误，且此时**两个文件都不会被写入**。

It is the only field the page accepts as free text that the host then fetches, so it is validated before anything is written: `http`/`https` only, no embedded credentials, no query or fragment. `javascript:`, `file:` and the like are rejected with an explicit error, and in that case **neither file is written**.

---

## 安装 / Installation

用 DSH Desktop 自带的 CLI 安装（不是 PATH 上的全局 `dsh` shim）：

Install with the DSH CLI that ships with your Desktop app — not a globally installed `dsh` shim:

```bash
dsh plugin --profile desktop add dsh-hindsight-gui
```

然后确认 `dsh-hindsight-gui` 在 profile 的 `dsh.profile.bundles` 列表里，**重启 DSH** 让 host 与浏览器两半重新加载。

Then make sure `dsh-hindsight-gui` is listed in the profile's `dsh.profile.bundles`, and **restart DSH** so the host and browser halves reload.

从源码安装（开发用）：`git clone` 后 `pnpm install`，再 `dsh plugin --profile desktop add file:/path/to/dsh-hindsight-gui`。

To install from source (for development): `git clone`, `pnpm install`, then `dsh plugin --profile desktop add file:/path/to/dsh-hindsight-gui`.

### 记忆功能 / Memory

记忆工具由官方包提供，与本插件并列启用：

The memory tools come from the official package, enabled alongside this plugin:

```bash
dsh plugin --profile desktop add @vectorize-io/hindsight-coding-agents
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
```

浏览器半侧打包为 CJS 模块并包进 `window.__ModuleLoader__.load({ id: … })`，`react` 保持 external（由宿主提供）。

`lib/client.js` 是**构建产物**，不要直接编辑——改 `src/client/index.tsx`。改完务必重新构建，否则页面会静默保持旧行为；`check-manifest.mjs` 会检测出产物比源码旧的情况。

`lib/client.js` is a **build artifact** — edit `src/client/index.tsx` instead. Rebuild after every change, or the page silently keeps the old behaviour; `check-manifest.mjs` detects a bundle older than its source.

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
| Environment name | 留空（此工作流没有使用 environment） |
| Allowed actions | 允许 `npm publish` |

The package already exists. Configure its Trusted Publisher for `KouzakiUmi/dsh-hindsight-gui`, workflow `publish.yml`, with no environment restriction, and allow direct `npm publish`.

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
