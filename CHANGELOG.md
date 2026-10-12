# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[semantic versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
