# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[semantic versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
- There is no CI and no tag-driven release in this repository.
