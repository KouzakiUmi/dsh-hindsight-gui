# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[semantic versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Replace the unreleased PowerShell console supervisor with an official Hindsight HTTP extension for in-process graceful shutdown. Fence requests by loopback, Host/Origin, a dedicated random capability, PID and launch nonce; raise SIGTERM once inside Python, never externally force-kill or broadcast.
- Add an explicit Hindsight Python interpreter setting with CAS and draft protection. Preflight Hindsight 0.10.2, one worker, the existing HTTP extension slot and private receipt creation before stopping a service; respect entrypoint `.env` loading, reject overrides of supplied launch variables, and prevent replacement of host-generated control credentials.
- Persist recovery capabilities only in protected ownership receipts: Windows applies a current-user/SYSTEM/Administrators DACL at new-file creation, while POSIX uses exclusive `0600` creation. Secrets travel through stdin, not arguments; directory and old configuration ACLs are not changed.
- Add offline and opt-in native regressions for authenticated identity/stop, cancellation, bounded responses, `.env` precedence, extension conflicts, one real in-process SIGTERM, lifespan cleanup and private file creation. Native tests use disposable ASGI fixtures without MemoryEngine, database or model calls; production Hindsight restart/deployment is not part of this validation.

### Fixed

- Share effective Python entry resolution between launch fingerprints and status previews so automatic discovery does not leave an unchanged service permanently pending restart.
- Require the control identity handshake for startup, late readiness, manager recovery and restart eligibility; distinguish a healthy API with unavailable control from a health timeout, retaining ownership evidence without confirming readiness.
- Ignore genuinely inherit-only ACL rules when assessing the current object, while still rejecting effective foreign writes, readable secret files and null DACLs.
- Send control headers through one-use direct IPv4 HTTP connections, isolated from global fetch/Agent/proxy configuration; retain cancellation, strict bounded responses and no-redirect/no-retry behavior.
- Add real-Node zero-connection proxy regression and Windows in-memory ACL matrices alongside Host/client failure-path regressions.
- Stop client builds on access/IPC policy refusals instead of retrying through the legacy CLI fallback.

## [1.4.0] - 2026-10-14

### Added

- Add a feature-gated management surface: deployment diagnostics and bound API credential references; operation paging/details/retry/cancel/delete; revision-checked bank overrides and inheritance; global/DSH memory privacy and cost settings; prompt preview, charged extraction dry-run and optional LLM health checks; asynchronous ZIP export/import/clone and aliases.
- Require typed-resource/risk/cost confirmation and a Host-issued two-minute one-use intent token for management mutations, charged calls, backups and downloads. Enforce actual OpenAPI methods, deployment flags, same-origin loopback and target/credential continuity.
- Bound ZIP upload to 50MiB with SHA-256/magic validation; bound same-origin streamed export download to 500MiB. Report 202 as submitted and poll against the URL/source bank. Never automatically replay an ambiguous mutation.

### Fixed

- Stop claiming cached memory configuration is applied on the next turn or that saving disabled immediately stops an existing workspace. Surface the official adapter's reinitialization requirement; API restart is not DSH adapter restart.
- Align autoUpdate/codebaseSurvey defaults and explicit dynamicBankId=false with the official contract; submit only changed base/GUI fields, so unrelated saves do not materialize inherited values or overwrite masked endpoint projections.
- Separate global default LLM and reflect scoped environment variables. Preserve legacy reflect-only global intent until a default key is explicit, while reflect still replaces old scoped settings.
- Preserve inactive embedding drafts after an active backend save; keep an explicit unsaved indicator. Treat surveyModel as an external runner identifier, not a DSH provider/model choice.

- Wrap bank Memory Defense PATCH requests in the required `updates` object (`{updates: {memory_defense: policy}}`). The previous flat request omitted the running API's required BankConfigUpdate field and failed with HTTP 422.
- Make the offline bank-config mock enforce the real request envelope. Cover rejection of the old flat body, enabling/disabling redaction, preservation of stronger/custom rules, confidential upstream validation inputs, and client rollback after HTTP 422.
- Bound model discovery, configuration saves and Memory Defense reads/writes; preserve drafts after ambiguous saves, require policy re-reads after ambiguous writes, and expose an explicit read-only retry. Reject incomplete successful responses instead of pretending settings or policies were confirmed.
- Preserve bare model IDs as visible custom input, fence concurrent saves, apply ownership/preflight gates to failed-start retries, and avoid authorizing service actions from a status query still in flight.
- Distinguish inherited audit settings from explicit on/off; allow an explicit `null` override to return to the launch environment.

### Changed

- Retain five categories and the shared save bar while adding a compact status header, category descriptions, collapsible launch details/options, clearer saved/runtime previews, per-category dirty markers, named controls and error/status announcements.
- Add bank name/ID search, readable unknown fact counts, immediate-write guidance and wrapping policy-error rows. Adapt fields to the actual host pane width, not only the viewport; host theme selection overrides OS dark preference.
- Extend the existing synthetic preview and add a dependency-free isolated Chromium acceptance script for screenshots, keyboard focus, bank search, synthetic policy writes, sticky save controls and narrow-pane/theme checks. No live DSH/profile or bank configuration is used.

### Tests

- 189 offline regressions pass (53 Host, 40 Client, 12 management runtime, 7 route gateway, 44 management service, 33 transfer). Build, manifest/syntax and diff checks pass.
- Isolated Chromium 154 verifies light/dark theme, 390px viewport, 450px host pane, keyboard focus, mandatory confirmations, synthetic settings/bank updates, prompt/dry-run, aliases, ZIP import, clone, async export polling and Blob download. These results do not claim live model inference, migration or process-management acceptance.

## [1.3.1] - 2026-10-13

### Fixed

- Verify Windows uv/pip launcher ancestry instead of requiring the listening Python process to have the direct launcher's PID. Unrelated listeners are still never adopted or terminated.
- Persist a credential-free ownership receipt and launch snapshot beside the GUI configuration. After DSH restarts, revalidate the service PID, OS start time and executable path before restoring management; do not contest another live DSH manager or trust a reused PID. Legacy services without a receipt require a manual shutdown and a fresh plugin launch.
- Settle system-command timeouts without waiting indefinitely for a `close` event after termination. Bound browser status requests to 30 seconds and service-action requests to 180 seconds, refresh after failures, and prevent overlapping slow polls or late responses from restoring a stale “启动中” state.
- Preserve service identity after health-check timeout and confirm late readiness against the original launch configuration. Late identity queries and launcher exit events cannot erase a replacement process; serialize ownership-receipt writes.

### Tests

- 47 offline Host and 28 offline Client regressions pass, including a two-level Windows launcher chain, recovery under a different DSH PID, PID reuse, live-manager contention, hanging queries/requests, late responses and disposal. The client bundle and manifest/syntax checks pass; this does not replace live deployment acceptance.

## [1.3.0] - 2026-10-12

### Added

- **Dedicated embedding settings (`serverEmbeddings`)** — a new 向量模型 card in the 模型 category configures Hindsight's vectorization backend independently of the DSH chat model list. Backends: `local`, `openai` (OpenAI-compatible endpoints such as LM Studio), `onnx`, `tei`. Fields are per-backend — model plus a force-CPU toggle (`local`), model / base URL / dimensions / key-env-name / key (`openai`), model id plus dimensions (`onnx`), base URL only (`tei`) — and are stored only in this plugin's own `~/.hindsight/dsh-hindsight-gui.json`.
- **Dimensions where the backend accepts them** — `openai` and `onnx` take an optional positive integer (empty inherits an existing dimension setting before deferring to the model or service); `local` derives it from the model and `tei` decides it remotely. Non-integer or non-positive values are rejected before anything is written.
- **Inheritance instead of migration** — an empty provider keeps inheriting the existing `serverEnv` and host-environment `HINDSIGHT_API_EMBEDDINGS_*` values, and the preview reports the provider-selection source (`file` / `serverEnv` / `env` / `default`). These settings never migrate, copy or overwrite existing values; with a provider selected, only that provider's fields are applied, non-empty ones win and blank ones still inherit.
- **Embedding resolution preview** — `/status` reports provider, model, endpoint, dimensions, credential source (`secretConfigured` only, never the key) and errors for missing required keys/TEI addresses, plus local-runtime and migration warnings. It reflects the SAVED settings, not the current draft and not the running configuration; the separate 当前运行 row shows only this plugin's confirmed launch snapshot, and third-party instances stay unknown.
- **Tabbed settings page** — five categories (概览 / 记忆与连接 / 模型 / 安全 / 高级) with a standard ARIA tablist and roving tabindex, `ArrowLeft`/`ArrowRight` (wrapping) plus `Home`/`End`, a `·` marker on dirty non-active categories, drafts retained across categories, and one global 保存 / 放弃更改 bar that submits every category at once.

### Changed

- **Embedding credentials reuse the host credential seam** — the key-env-name is a credential reference resolved through `ctx.credentials.resolve` in the existing order 本页值 → `env:<NAME>` → `dsh-credentials:<NAME>`. Omitted or empty keys keep the saved value, and explicit `clearApiKey` removes only this page's copy — an inherited `HINDSIGHT_API_EMBEDDINGS_OPENAI_API_KEY` or the server LLM key can still apply. An unresolvable explicit reference becomes a visible error instead of silently falling back to another source.
- Malformed embedding fields, unsupported dedicated backends, invalid endpoints/reference names and non-positive-integer dimensions are rejected with HTTP 400 without writes. Unresolved explicit references and missing required keys/TEI addresses instead produce an error preview; start/restart preflight refuses them before stopping a healthy managed service.
- Refresh the project homepage with an original workflow banner, labeled component previews and a separate technical reference.
- Keep per-provider temporary drafts separate, reset unrelated fields on backend switches, and retire submitted keys from cached drafts. Chat routing is collapsible, Provider overrides are collapsed by default, the tab bar stays within its own scroll container, and duplicate migration warnings are removed.
- **Failed launches name the embedding endpoint** — when the service exits during start-up initialization, the page points at the configured embedding endpoint (for example a local service that is not running) instead of only the exit code.

### Scope

- Changing the embedding model or dimensions may require rebuilding or migrating existing vector indexes. This page does not migrate indexes, download models, install dependencies, enable `trust_remote_code`, publish or automatically restart anything; existing explicit service controls retain their ownership gates.
- The `HINDSIGHT_API_EMBEDDINGS_*` names were checked against the locally installed `hindsight-api` 0.10.2; that is a snapshot of this machine's install, not a compatibility claim for other or future versions.

### Tests

- Offline Host/client regressions cover the embedding mapping, CAS, credential projection, provider-switch isolation and the actual Host-to-client save contract. Browser layout/keyboard verification uses the real client with synthetic data; it is not live-service validation.

## [1.2.4] - 2026-10-12

### Changed

- Restrict service management to a verified direct child of the current Cordis effect (PID, OS start time and executable path); port ownership alone never authorizes termination. A reload may leave an old server running, but the new instance treats it as unmanaged. Windows shutdown only attempts non-force `taskkill /PID`; failure requires manual shutdown.
- Preserve read-only connections to remote, HTTPS, IPv6 and non-root-path API addresses, without offering local process management for them. Show running configuration only as a confirmed plugin launch snapshot, not as an inspection of external instances.
- Resolve credentials via the host `ctx.credentials.resolve` service instead of reading credential YAML directly. Expose `secretConfigured` rather than saved API keys; omitted/empty keys retain the existing value, and explicit `clearApiKey` removes it.
- Limit `serverEnv` to `HINDSIGHT_API_*`, `NO_PROXY`/`no_proxy` and `PYTHONUTF8`; explicit GUI settings take precedence. Bank Defense edits only the canonical `sensitive_data`/`redact` rule and preserves stronger or custom rules.

### Fixed

- Reject stale revisions and damaged configuration instead of silently overwriting; explain that two per-file atomic saves are not a cross-file transaction and may partially complete. Protect unsaved client edits from status refreshes and expose error states.
- Redact host errors and log summaries; this does not clean third-party raw service logs or historical backups. Serialize server actions and cancel pending operations on dispose.

### Tests

- Add offline `node scripts/test-host.mjs` and `node scripts/test-client.mjs` regression scripts, wired to `npm test` and the CI verification job. Fixtures do not constitute live-service validation.

## [1.2.3] - 2026-10-11

### Fixed

- **NO_PROXY IPv6 form crashed hindsight-api at startup** — httpx brackets IPv6 hosts itself when parsing NO_PROXY entries (`all://[::1]`), so entries must be BARE `::1`. The plugin appended bare `::1` (correct) but preserved an inherited bracketed `[::1]` entry verbatim; that entry fails `ipaddress.IPv6Address`, falls through to the wildcard mount `all://*[::1]`, and raises `httpx.InvalidURL: Invalid port: ':1]'` during OpenAI client construction. Inherited bracketed entries are now normalised to bare form.

## [1.2.2] - 2026-10-11

### Fixed

- **Credential store lookup missed indented entries** — this machine's `~/.dsh/.credentials.yaml` keeps plain credential refs under a top-level `refs:` block at two-space indent (`  NAME: value`), which neither the column-0 flat form nor the `records:` block parser matched. Every provider whose key lived only in the store resolved as "not found", which in turn left hindsight-api without `HINDSIGHT_API_*_LLM_API_KEY` and crashed it at startup (`LLM API key is required`). The resolver now falls back to an indented `NAME: value` scalar under any top-level block.

## [1.2.1] - 2026-10-11

### Fixed

- **Host half failed to mount on DSH 0.2.1-alpha.2** — the new `dsh-host-webserver` rejects a duplicate `(kind, path)` route registration instead of silently overwriting, and `bankdefense` registered the same exact path twice (once for GET, once for POST). The throw failed the plugin's fiber, so every route — including `/status` — went missing and the page showed nothing. GET and POST now dispatch inside one registered handler.

## [1.2.0] - 2026-10-11

### Added

- **Service management** — the plugin can now start and restart the Hindsight API process itself: it discovers the `hindsight-api` executable (settings override → `PATH` → common uv/pip install locations), builds the process environment dynamically from the settings saved on the page, spawns it detached with output logged to `~/.hindsight/dsh-hindsight-gui-server.log`, and polls `/health` until ready (90 s timeout). Restart stops whatever listens on the API port first, whether this plugin launched it or not.
- **Auto-start option** — when enabled and the API is down, opening the settings page asks the host to launch the service (45 s cooldown).
- **Audit log toggle** — `auditLogEnabled` maps to `HINDSIGHT_API_AUDIT_LOG_ENABLED` on the next start/restart.
- **Per-bank redaction (Memory Defense)** — a toggle per bank writes `memory_defense: {enabled, rules: [{on: sensitive_data, action: redact}]}` through the bank config API (`PATCH /v1/default/banks/{bank_id}/config`), so secrets and tokens are scrubbed before they enter memory.
- **Provider overrides** — per-provider Base URL / API Key / key-env-name overrides for providers hindsight-api does not natively know (launched as openai-compatible endpoints).
- **Credential resolution chain with visible failures** — GUI override → environment variables (`<PROVIDER>_API_KEY` / `<PROVIDER>_TOKEN`) → DSH credential store (best-effort). A scope whose credential cannot be resolved is shown in red with the reason on the status card; the server falls back to its own defaults for that scope, never silently.
- **Pending-restart tracking** — server-affecting saves set a `pendingRestart` flag; the page shows a banner with a restart button while the running process still uses the old configuration.
- **Advanced env passthrough** — `serverEnv` injects arbitrary `HINDSIGHT_API_*` variables into the server process; the host also normalises `NO_PROXY` and sets `PYTHONUTF8=1`.
- **New host routes** — `POST /plugins/dsh-hindsight-gui/server/start`, `POST …/server/restart`, `GET/POST …/bankdefense`.

### Changed

- **UI redesigned** — fluid full-width layout (the fixed 760 px cap is gone), responsive two-column fields that collapse on narrow panels, status pills with dots, a service-management card with resolution preview, and per-bank redaction toggles.
- Server-side model routing no longer depends on an external launcher script (`start-server.py`): the plugin builds `HINDSIGHT_API_*_LLM_*` itself from `serverModels` at every start/restart, so what the page configures is what the server runs with.

### Fixed

- **DSH 0.2.1-alpha.2 compatibility** — dropped `@deepseek-ai/dsh-client-runtime` from `dsh.client.inject`; that package no longer exists in the new Core (split into `dsh-client-modules` / `dsh-client-ui-renderer` / `dsh-cordis-client-runner`), and the stale inject made the client bundle fail to load entirely (sidebar icon and page disappeared).
- **Model discovery against the new Core** — `LlmRuntime` is now a `@Remote` Typert service exposed as `ctx.remote.llm` rather than a bare Cordis service. The `/models` route probes both shapes so the provider list populates again instead of silently returning empty.
- **Fence diagnostics** — every 403 from the host routes now logs the exact rejection reason (non-loopback host, port mismatch, cross-origin `Origin`, `sec-fetch-site`) through `webCtx.logger.warn`, instead of leaving the page to guess.

## [1.1.0] - 2026-10-07

### Added

- **Function model selection** — configure models for codebase survey (`surveyModel` in `coding-agent.json`) and Hindsight internal scopes (`serverModels.reflect`, `retain`, `consolidation`, `mentalModel` in `dsh-hindsight-gui.json`).
- **DSH environment models discovery** — dynamically list models registered by host providers via `GET /plugins/dsh-hindsight-gui/models` with fallback to custom input.
- **Dark theme support for dropdowns** — match DSH dark palette for `<select>`, `<option>` and `<optgroup>` with `color-scheme: dark`.

## [1.0.0] - 2026-10-06

### Added

- **DSH settings page** — a sidebar button and a settings page for the Hindsight stack:
  memory enable/disable, per-repo vs. fixed bank naming, API URL, log level,
  `autoUpdate`, `codebaseSurvey`, live API/Control Plane status and bank list.
- **Host routes** — `GET /plugins/dsh-hindsight-gui/status` and
  `POST /plugins/dsh-hindsight-gui/config`. The browser half cannot call the Hindsight API
  directly (no `Access-Control-Allow-Origin` on `127.0.0.1:8888`), so the host is a
  same-origin proxy. Writes are whitelisted, same-origin-loopback only, bounded to
  32 KB, and atomic (temp file + rename with the previous file kept as `.bak`);
  non-owned config keys are preserved verbatim.
- **Graceful first run** — a missing or malformed config file does not break the
  page: it opens with defaults and lets the first save create the file.
- **Environment overrides** — `HINDSIGHT_CONFIG`, `HINDSIGHT_GUI_CONFIG`,
  `HINDSIGHT_CP_URL`, `HINDSIGHT_API_URL`.
- **Control Plane address is editable** — the page now has a field for the
  Control Plane (web console) address, with a status badge and an "open" link
  driven by it. It is stored in this plugin's own
  `~/.hindsight/dsh-hindsight-gui.json` rather than in `coding-agent.json`,
  because upstream has no key for it and would treat a foreign key as
  configuration it owns. Resolution order is saved file → `HINDSIGHT_CP_URL` →
  default, and the page shows which source is in force. The address is
  validated (http/https only, no credentials, query or fragment) before either
  file is written, so a bad value leaves both untouched.
- **`scripts/check-manifest.mjs`** — cross-checks the manifest, the Cordis patch,
  the loader wrapper id and the client/host route bases, and reports a bundle that
  is older than its source.

### Changed

- Renamed from `dsh-hindsight-panel` to **`dsh-hindsight-gui`**: package name, Cordis
  plugin id, route prefix, module-loader wrapper id, sidebar/page slot id, and CSS
  prefix.
- Normalized the user-visible name from `HindSight` to the official `Hindsight`.
- The README is bilingual and documents the feature set in full.

### Scope

- This repository is **the plugin only**. It does not deploy a Hindsight server:
  the user deploys one themselves, then fills the API address and (optionally)
  the Control Plane address into the settings page.
- `hindsight_*` tools are not part of this package — they come from the official
  `@vectorize-io/hindsight-coding-agents`, which ships its own MCP server. Install
  both.
- The package is published to npm as `dsh-hindsight-gui`. Releases are cut by
  pushing a `v*` tag, which runs `.github/workflows/publish.yml`. Publication uses
  npm Trusted Publishing (OIDC), so no long-lived token is stored in the
  repository.
