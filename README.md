<div align="center">

<img src="https://raw.githubusercontent.com/KouzakiUmi/dsh-hindsight-gui/main/assets/banner.svg" width="100%" alt="Hindsight 设置页：在 DeepSeek Harness 中管理记忆连接、模型、向量后端与安全选项的首页插画">

# Hindsight 设置页

**把记忆系统的连接、模型与运行状态，放进 DeepSeek Harness 的侧边栏。**

`dsh-hindsight-gui` 是 Hindsight 的配置与状态界面；记忆工具由官方集成提供，不由本插件实现。

A settings dashboard for Hindsight in DeepSeek Harness—not a memory engine.

[![npm](https://img.shields.io/npm/v/dsh-hindsight-gui?label=npm)](https://www.npmjs.com/package/dsh-hindsight-gui)
[![CI](https://github.com/KouzakiUmi/dsh-hindsight-gui/actions/workflows/publish.yml/badge.svg)](https://github.com/KouzakiUmi/dsh-hindsight-gui/actions/workflows/publish.yml)
[![MIT](https://img.shields.io/badge/license-MIT-68786a)](LICENSE)

[快速开始](#快速开始) · [界面预览](#五个分类一处管理) · [能力边界](#能力与安全边界) · [技术参考](https://github.com/KouzakiUmi/dsh-hindsight-gui/blob/main/docs/technical-reference.md)

</div>

## 为什么需要它

| 遇到的问题 | 这个界面做什么 |
| --- | --- |
| 记忆服务是否健康、控制台是否可达，得在多个窗口间核对 | 同一设置页按分类展示 API、Control Plane、数据库与记忆库状态 |
| 连接地址、bank 命名、不同用途的模型分散在配置中 | 按分类编辑，并在一个保存条中提交；跨分类切换保留草稿 |
| 更改向量后端后，难分清「保存了」与「正在运行」 | 区分**已保存的下次启动预览**与**本插件确认的运行快照** |
| 要调整服务却不想误停别人的进程 | 保留启动／重启按钮，但重启仅针对核验过的本插件直接子进程 |

## 五个分类，一处管理

**概览**查看服务、归属与启动预览，**记忆与连接**管理 API 地址和 bank，**模型**配置聊天／服务功能模型及向量后端，**安全**查看记忆库并设置审计与按 bank 脱敏，**高级**处理其它选项。五个 ARIA 标签支持方向键、`Home`、`End`；未保存草稿跨分类保留，轮询不会盖掉输入。

<img src="https://raw.githubusercontent.com/KouzakiUmi/dsh-hindsight-gui/main/assets/screenshots/settings-light.png" width="100%" alt="浅色主题设置页；真实 React 组件隔离渲染，显示模拟数据，不是真实服务截图">

<sub>浅色界面：真实 React 18 组件在隔离页面中渲染，HTTP 数据为模拟值；不是生产 DSH 或真实 Hindsight 服务的截图。</sub>

<details>
<summary>查看深色主题</summary>

<img src="https://raw.githubusercontent.com/KouzakiUmi/dsh-hindsight-gui/main/assets/screenshots/settings-dark.png" width="100%" alt="深色主题设置页；隔离渲染与模拟 HTTP 数据">

</details>

<details>
<summary>查看窄屏布局</summary>

<img src="https://raw.githubusercontent.com/KouzakiUmi/dsh-hindsight-gui/main/assets/screenshots/settings-mobile.png" width="100%" alt="窄屏设置页；隔离渲染与模拟 HTTP 数据">

</details>

### 向量配置，按后端显示

| 后端 | 本页可指定 | 需要自行准备 |
| --- | --- | --- |
| `local` | 模型、是否强制 CPU | 本地依赖和模型 |
| `openai` | OpenAI 兼容模型、Base URL、可选维度与凭据引用／Key | 可用端点；非空 Key 或可继承的服务端 LLM Key；本地免鉴权端点也需明确填写占位值 |
| `onnx` | 模型 ID、可选维度 | 本地依赖和模型 |
| `tei` | 远端服务地址 | TEI 服务；模型与维度由远端决定 |

不选后端表示继承既有服务配置。`openai` / `onnx` 的维度留空时，**先继承已有维度**；没有已有值再由后端、模型或服务决定。切换后端不自动迁移索引；修改前请核对存量向量数据。`serverEnv` 是配置文件级高级透传，**不是界面里的可编辑控件**。详细字段与凭据解析见[技术参考](https://github.com/KouzakiUmi/dsh-hindsight-gui/blob/main/docs/technical-reference.md)。

### 从修改到生效，四种状态别混淆

1. **正在编辑**：切换五个分类时输入仍留在草稿；基础配置用底部保存，新增管理卡片使用各自的保存与确认流程。
2. **已经保存**：两份配置分别按字段写入。`apiUrl` 与 `surveyModel` 等在上游 `coding-agent.json`；服务模型、向量、控制台地址在本插件 `dsh-hindsight-gui.json`。
3. **下次启动预览**：向量卡片显示基于已保存值解析的后端、模型、维度、配置和凭据来源；它**不是当前草稿**，也不保证外部服务采用了这些值。
4. **当前运行快照**：只有本插件成功启动且确认过的服务才有快照。外部服务即使健康，也不推断其内部配置。

保存失败、配置读取失败、409 冲突及非法维度会显式提示。两个文件逐个保存，不是跨文件事务；遇到部分保存提示时请刷新后核对，不要按「保存成功」猜测另一份文件已经写入。

### 连接与本机管理的区别

| 目标 | 状态读取 | 本机启动／重启 |
| --- | --- | --- |
| 既有 Hindsight API | 支持连接和健康查询 | 第三方进程不可被本插件接管或停止 |
| 本插件启动的本机 API | 支持 | 仅在进程身份和目标均核验通过时可重启 |
| 远端、HTTPS、IPv6 或非根路径 URL | 可连接并查询；库策略写入须满足目标校验及上游权限 | 不提供本机进程管理 |

**启动服务**按钮查找已安装的 `hindsight-api` 并做健康检查；**重启服务**按钮先预检再对经核验的直接子进程操作。向量预览或模型凭据解析错误时，按钮可能保持禁用。功能不等于部署器，也不负责下载模型、重建向量索引或开启 `trust_remote_code`。

## 快速开始

1. **准备服务**：按 [Hindsight 官方文档](https://hindsight.vectorize.io/) 自行部署可连接的 API；如需用本页的本机启动按钮，自行安装 `hindsight-api` 可执行文件。本插件不安装或部署服务与模型。
2. **安装两个职责不同的 DSH 包**：官方 `@vectorize-io/hindsight-coding-agents` 提供 `hindsight_*` 工具和 MCP server；`dsh-hindsight-gui` 提供设置界面。只需要记忆功能时，GUI 并非官方集成的必需依赖。

```console
dsh plugin --profile web add @vectorize-io/hindsight-coding-agents
dsh plugin --profile web add dsh-hindsight-gui
```

这里的 `web` **仅为示例 Profile**。请先核对实际目标与 CLI 入口；Desktop 应使用目标桌面壳提供的 **DSH Desktop CLI**，而不是用普通独立公共/Core CLI 管理其 Profile。安装不等于启用：核对 bundle 列表，按目标部署方式重新加载或重启 Host 与 Client；不要在 Profile 里裸跑 npm/pnpm。

3. **打开侧边栏 Hindsight 页面**：填写 Hindsight **API 地址**（例如 `http://127.0.0.1:8888`）；Control Plane 是可选的管理界面（默认 `http://127.0.0.1:9999`）。保存后查看健康状态和 bank 列表。安装目标、服务版本与可用功能须以你的实际环境核实。

## 管理功能

- **诊断与认证**：分别显示存活、就绪、API 版本和部署 feature flags；API token 仅在 Host 使用，支持继承、无认证及环境/DSH 凭据引用。凭据引用绑定当前实例，不能跨实例转发。
- **任务队列**：按状态/类型分页，查看进度和受控失败摘要；重试、取消、删除先确认，不自动重放未知结果。
- **库设置**：编辑 missions、提取策略、entity labels、预算、disposition 和检索开关；区分继承/覆盖，以 revision 检查并发。全库重置会清除所有 overrides，包括未展示的策略与 Memory Defense。
- **隐私与成本**：全局或 DSH 专属作用域配置自动注入、会话保留、Git 入库、播种、opt-in 路径、勘察预算和知识页刷新；只提交改变的字段，返回继承会移除文件键而非写入 null。
- **模型调试**：提示词组成预览不调用 LLM；干跑提取、LLM 健康测试明确提示费用且按部署能力开放。代码库勘察使用外部 CLI 模型标识，不套用 DSH 模型目录。
- **ZIP 迁移与别名**：异步导出、restore/merge 导入、克隆及别名管理。202 只代表提交，任务记录在源/URL bank。restore 必须已有记录库且新目标不存在；本页不自动创建记录库。上传上限 50MiB、下载代理上限 500MiB，同源下载不转发跨源签名地址。

写入、收费、备份及下载使用同一个确认对话框：输入目标、勾选风险/费用，Host 再验证绑定 API/资源/参数的两分钟一次性令牌、同源与实际接口能力。能力关闭或未知时禁用相关动作。全局默认 LLM 与 reflect 独立；旧 reflect-only 配置保留兼容全局默认，显式保存 default 后脱钩。

## 能力与安全边界

- **不是记忆引擎**：本插件不提供 `hindsight_*` 工具，也不部署 Hindsight。与官方集成配合使用时，它负责配置和状态，记忆读写由官方包及 Hindsight 服务承担。
- **保存不等于运行**：官方 0.8.1 DSH 适配器缓存工作区配置，保存后是否应用未确认；已有工作区可能需重启 DSH 重新初始化。关闭记忆后也须核验实际停止召回/写回，单独新建会话或重启 API 不保证清除适配器缓存；服务端模型、向量配置、审计等仅在下次**受控启动／重启**时应用，不会因保存自动重启服务。手动启动／重启按钮仍存在，且遵守所有权与预检门禁；远端、HTTPS、IPv6、非根路径服务可连接，但不由本机进程管理；这不等于把其库配置 API 限定为只读。
- **不会任意终止 PID**：只尝试停止经启动进程链或持久归属记录核验的本插件服务，检查 PID／启动时间／可执行路径；支持 Windows 启动器与监听进程不同 PID，以及 DSH 重启后的重新核验。端口占用不授予终止权限，旧 DSH 仍存活时不争抢接管。Windows 仅尝试非强制停止，失败时需手动处理，不以强制结束兜底。旧版遗留且无归属记录的服务不自动追认；外部实例的真实运行配置未知。
- **凭据和数据边界**：凭据不会在预览中回传明文，但配置文件不是加密保险箱；显式清除本页 Key 也不保证继承环境中的 Key 消失。按 bank 脱敏不能替第三方清理原始日志或历史备份。保存采用键白名单、revision 冲突检查和逐文件原子写入；两个文件**不是一个事务**。

## 测试与兼容性

项目包含 Host / Client 离线回归与前后端契约测试，覆盖向量参数映射、凭据投影、修订冲突、草稿保护和进程归属。界面的浅色／深色、窄屏与键盘操作使用真实 React 组件和模拟 HTTP 数据进行隔离验证。

这些测试不替代具体部署的运行验收。请核对目标 DSH Core 的导出契约，以及 Hindsight 服务版本和所选向量后端的依赖；详细验证与开发方法见[技术参考](https://github.com/KouzakiUmi/dsh-hindsight-gui/blob/main/docs/technical-reference.md)。

### 遇到状态与预期不一致？

- 「API 未运行」：先核对 API 地址及服务自身健康端点；不要把 Control Plane 不可达误判为记忆 API 必然不可用。
- 「待下次启动应用」：它说明保存值与已确认的启动快照不同；对第三方实例，插件不能确认其实际运行配置。
- 「维度未知」：不要据此填写猜测值，先确认既有索引和后端模型；空值可能继续继承旧配置。
- 「无法重启」：检查目标是否本插件当前生命周期所持有的直接子进程；即使端口上有服务也不能据此强制结束。

## 进一步了解

| 文档 | 内容 |
| --- | --- |
| [技术参考](https://github.com/KouzakiUmi/dsh-hindsight-gui/blob/main/docs/technical-reference.md) | 配置字段、写入边界、服务管理、开发与发布流程 |
| [源码：Host](https://github.com/KouzakiUmi/dsh-hindsight-gui/blob/main/lib/index.js) / [Client](https://github.com/KouzakiUmi/dsh-hindsight-gui/blob/main/src/client/index.tsx) | 实际接口及界面实现；[client.js](https://github.com/KouzakiUmi/dsh-hindsight-gui/blob/main/lib/client.js) 是构建产物 |
| [Hindsight 官方](https://github.com/vectorize-io/hindsight) | 上游记忆系统与部署说明 |

[MIT License](LICENSE) · [报告问题](https://github.com/KouzakiUmi/dsh-hindsight-gui/issues)
