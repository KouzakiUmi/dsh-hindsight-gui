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
| 其他 / Other | 自动更新运行时 | `autoUpdate` → `coding-agent.json` |
| 其他 / Other | 代码库勘察 | `codebaseSurvey` → `coding-agent.json` |

**两个地址写进不同的文件**：`apiUrl` 是上游集成认识的键，必须留在 `coding-agent.json`；`controlPlaneUrl` 上游根本不认识，放进去只会污染那个由集成维护的文件，所以存在插件自己的 `~/.hindsight/dsh-hindsight-gui.json` 里（路径可用 `HINDSIGHT_GUI_CONFIG` 覆盖）。

**The two addresses go to different files**: `apiUrl` is a key the upstream integration reads, so it stays in `coding-agent.json`. `controlPlaneUrl` is not a key upstream knows at all — writing it there would only pollute a file the integration maintains — so it lives in this plugin's own `~/.hindsight/dsh-hindsight-gui.json`.


### 只读展示 / Read-only display

- **服务状态** — API 是否运行、健康状态、数据库类型、Control Plane 是否可达
- **记忆库列表** — 每个 bank 的 id、fact 数量
- **本页不写的键** — 配置文件里本页不管理的键（如 `banks`、`paths`、`mapPathToBank`），折叠列出，保存时原样保留

### 保存立即生效，无需重启

Hindsight 集成在每次 `loadConfig()` 调用时都重新读取配置文件，因此保存后的改动在**下一轮对话**就生效，不需要重启 DSH。

Saving takes effect on the next turn — no restart. The Hindsight integration re-reads the config file on every `loadConfig()` call.

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

发布到 npm 的包名是 **`dsh-hindsight-gui`**，推 `v*` tag 触发：

The npm package is **`dsh-hindsight-gui`**. Releases are cut by pushing a `v*` tag:

```bash
# 先把版本号写进 package.json，并更新 CHANGELOG，然后
git tag v1.0.0 && git push origin v1.0.0
```

`.github/workflows/publish.yml` 会：校验 tag 与 `package.json` 版本一致 → 确认 `lib/client.js` 可从源码复现 → 跑 `check-manifest.mjs` → 打包并检查 tarball 内容（缺文件、混入 `src/` 或 `node_modules` 都会失败）→ 发布。

### 鉴权：npm Trusted Publishing（OIDC）

**工作流不保存任何长期 token。** 发布 job 只要 `id-token: write` 权限，npm 通过 GitHub 的 OIDC 身份令牌换取一次性凭据。因此仓库里没有可泄露的密钥，也不需要 `NPM_TOKEN` secret。

**No long-lived token is stored anywhere.** The publish job needs only `id-token: write`; npm exchanges GitHub's OIDC identity token for a short-lived credential. There is no `NPM_TOKEN` secret to leak.

一次性前置配置（**只能在 npmjs.com 网页完成，CLI 无法代替**）：

One-time setup (this can only be done on npmjs.com, no CLI equivalent):

1. 先在 npmjs.com **创建包** `dsh-hindsight-gui`（首次发布必须先建包）
2. 打开该包 → **Settings → Trusted Publisher → GitHub Actions**
3. 填入：

   | 字段 | 值 |
   | --- | --- |
   | Organization or user | `KouzakiUmi` |
   | Repository | `dsh-hindsight-gui` |
   | Workflow filename | `publish.yml` |

`Workflow filename` 必须与 `.github/workflows/` 下的文件名逐字一致，否则 OIDC 会被 npm 拒绝。

`Workflow filename` must match the file in `.github/workflows/` exactly, or npm rejects the OIDC token.

### 演练

不消耗发布额度、也不真正发布的检查：

A run that publishes nothing and uses no quota:

```bash
# GitHub Actions 页面手动触发，dry-run 默认开启
# 或本地等价物：
npm publish --dry-run
```

发布 job 绑在名为 `npm` 的 environment 上，可在 **Settings → Environments → npm** 里加保护规则（required reviewers 等），把发布审批与构建分开。

The publish job is bound to an environment named `npm`; add protection rules (required reviewers) there to separate publishing approval from the build.

---

## 上游 / Upstream

Hindsight 本身未被修改，来自 [vectorize-io/hindsight](https://github.com/vectorize-io/hindsight)（MIT）。本仓库是围绕它的界面集成。

Hindsight itself is unmodified and comes from [vectorize-io/hindsight](https://github.com/vectorize-io/hindsight) (MIT). This repository is a UI integration around it.

## 许可 / License

MIT
