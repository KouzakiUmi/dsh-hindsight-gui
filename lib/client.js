window.__ModuleLoader__.load({
	id: "dsh-hindsight-gui",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.tsx
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject,
  name: () => name
});
module.exports = __toCommonJS(index_exports);
var import_react3 = require("react");

// src/client/i18n.js
var import_react = require("react");

// src/client/locales/en.js
var EN = {
  "\u6982\u89C8": "Overview",
  "\u8BB0\u5FC6\u4E0E\u8FDE\u63A5": "Memory & connection",
  "\u6A21\u578B": "Models",
  "\u5B89\u5168": "Security",
  "\u9AD8\u7EA7": "Advanced",
  "\u5168\u5C40\u9ED8\u8BA4 LLM": "Global default LLM",
  "\u672A\u914D\u7F6E\u72EC\u7ACB\u4F5C\u7528\u57DF\u65F6\u7684\u56DE\u9000\u6A21\u578B\uFF1B\u4E0E\u53CD\u601D\u63A8\u7406\u5206\u5F00\u3002\u65E7reflect-only\u914D\u7F6E\u517C\u5BB9\u4E3A\u6B64\u9ED8\u8BA4\u503C\uFF0C\u663E\u5F0F\u4FDD\u5B58\u540E\u8131\u94A9\u3002": "Fallback model when no dedicated scope is configured; kept separate from reflection reasoning. Legacy reflect-only configurations map to this default and detach once saved explicitly.",
  "\u53CD\u601D\u63A8\u7406": "Reflection reasoning",
  "hindsight_reflect \u8BB0\u5FC6\u63A8\u7406\u4E0E\u95EE\u7B54\u3002\u5EFA\u8BAE\u9009\u7528\u63A8\u7406\u548C\u957F\u4E0A\u4E0B\u6587\u80FD\u529B\u5F3A\u7684\u6A21\u578B\u3002": "hindsight_reflect memory reasoning and Q&A. Prefer a model with strong reasoning and long-context capability.",
  "\u4E8B\u5B9E\u63D0\u53D6": "Fact extraction",
  "\u4ECE\u4F1A\u8BDD\u4E2D\u63D0\u53D6\u4E8B\u5B9E\uFF08Retain\uFF09\uFF0CToken \u6D88\u8017\u91CF\u5927\u3002\u5EFA\u8BAE\u901F\u5EA6\u5FEB\u3001\u6210\u672C\u4F4E\u4E14\u652F\u6301 JSON Schema \u7684\u6A21\u578B\u3002": "Extracts facts from conversations (Retain) and consumes a lot of tokens. Prefer a fast, low-cost model that supports JSON Schema.",
  "\u8BB0\u5FC6\u6574\u7406": "Memory consolidation",
  "\u540E\u53F0\u805A\u5408\u6D88\u6B67\u4E0E\u53BB\u91CD\u76F8\u4F3C\u4E8B\u5B9E\uFF08Consolidation\uFF09\u3002\u5EFA\u8BAE\u652F\u6301\u7ED3\u6784\u5316\u8F93\u51FA\u7684\u5FEB\u901F\u6A21\u578B\u3002": "Merges, disambiguates and de-duplicates similar facts in the background (Consolidation). Prefer a fast model with structured output.",
  "\u77E5\u8BC6\u63D0\u70BC": "Mental model refresh",
  "\u5237\u65B0\u7ED3\u6784\u5316\u77E5\u8BC6\u5E93\u9875\u9762\uFF08Mental Model Refresh\uFF0C\u5982\u67B6\u6784\u56FE\u3001\u6982\u5FF5\u89C4\u8303\uFF09\u3002": "Refreshes the structured knowledge pages (Mental Model Refresh, e.g. architecture diagrams and concept specs).",
  "\u9632\u62A4\u7B56\u7565\u54CD\u5E94\u7F3A\u5C11 memoryDefense\uFF0C\u72B6\u6001\u672A\u77E5\u3002": "The defense policy response has no memoryDefense; state unknown.",
  "\u9632\u62A4\u7B56\u7565\u54CD\u5E94\u683C\u5F0F\u65E0\u6548\uFF0C\u72B6\u6001\u672A\u77E5\u3002": "The defense policy response is malformed; state unknown.",
  "\u9ED8\u8BA4 ({0})": "Default ({0})",
  "\u672A\u6307\u5B9A\uFF08\u8DDF\u968F\u7CFB\u7EDF\u9ED8\u8BA4\uFF09": "Not set (follow the system default)",
  "\u81EA\u5B9A\u4E49\u8F93\u5165...": "Custom input...",
  "\u5207\u6362\u56DE\u9009\u62E9\u5217\u8868": "Switch back to the list",
  "\u5217\u8868": "List",
  "{0} \u81EA\u5B9A\u4E49\u6A21\u578B": "Custom model for {0}",
  "\u4F8B\u5982 deepseek-flash \u6216 provider/model": "e.g. deepseek-flash or provider/model",
  "\u8BF7\u6C42\u8D85\u65F6\u6216\u5DF2\u53D6\u6D88\uFF0C\u8BF7\u5237\u65B0\u540E\u786E\u8BA4\u6700\u65B0\u72B6\u6001\u3002": "The request timed out or was cancelled; refresh to confirm the latest state.",
  "\u5BFC\u51FA\u8D85\u8FC7500MiB\u4E0B\u8F7D\u4E0A\u9650": "The export exceeds the 500MiB download limit",
  "\u54CD\u5E94\u683C\u5F0F\u65E0\u6548": "Invalid response format",
  "\u7BA1\u7406\u8BF7\u6C42\u7B49\u5F85\u7ED3\u675F\uFF0C\u7ED3\u679C\u53EF\u80FD\u672A\u77E5\uFF1B\u8BF7\u91CD\u8BFB\uFF0C\u4E0D\u81EA\u52A8\u91CD\u590D\u64CD\u4F5C\u3002": "The wait for the management request ended and the outcome may be unknown; read again instead of repeating the operation.",
  "\u5BFC\u5165\u7B49\u5F85\u7ED3\u675F\uFF0C\u63D0\u4EA4\u7ED3\u679C\u53EF\u80FD\u672A\u77E5\uFF1B\u8BF7\u67E5\u8BE2\u4EFB\u52A1\uFF0C\u4E0D\u91CD\u590D\u5BFC\u5165\u3002": "The wait ended and the submission may be unknown; check the operation instead of importing again.",
  "\u4E0B\u8F7D\u7B49\u5F85\u7ED3\u675F\u6216\u5DF2\u53D6\u6D88\u3002": "The download wait ended or was cancelled.",
  "\u4E0B\u8F7D\u5DF2\u53D6\u6D88": "Download cancelled",
  "\u72B6\u6001\u54CD\u5E94\u683C\u5F0F\u65E0\u6548\uFF0C\u8BF7\u91CD\u8BD5\u3002": "The status response is malformed; try again.",
  "\u6A21\u578B\u54CD\u5E94\u7F3A\u5C11 Provider \u5217\u8868\uFF0C\u65E0\u6CD5\u786E\u8BA4\u53D1\u73B0\u7ED3\u679C\u3002": "The model response has no provider list, so discovery cannot be confirmed.",
  "\u8BF7\u6C42\u8D85\u65F6\u6216\u5DF2\u53D6\u6D88\uFF1B\u670D\u52A1\u53EF\u80FD\u4ECD\u5728\u542F\u52A8\uFF0C\u8BF7\u5237\u65B0\u72B6\u6001\u786E\u8BA4\uFF0C\u52FF\u91CD\u590D\u542F\u52A8\u3002": "The request timed out or was cancelled; the service may still be starting. Refresh the status instead of starting it again.",
  "\u670D\u52A1\u54CD\u5E94\u683C\u5F0F\u65E0\u6548\uFF1A\u542F\u52A8\u7ED3\u679C\u5C1A\u672A\u786E\u8BA4\uFF0C\u8BF7\u5237\u65B0\u72B6\u6001\u3002": "The service response is malformed: the start result is unconfirmed. Refresh the status.",
  "\u670D\u52A1\u5DF2\u5728\u8FD0\u884C\u3002": "The service is already running.",
  "\u5DF2\u81EA\u52A8\u542F\u52A8 Hindsight \u670D\u52A1\u3002": "Hindsight was started automatically.",
  "\u81EA\u52A8\u542F\u52A8\u5931\u8D25\uFF1A": "Auto-start failed:",
  " \u5DF2\u505C\u6B62\u81EA\u52A8\u91CD\u8BD5\uFF0C\u8BF7\u5904\u7406\u95EE\u9898\u540E\u624B\u52A8\u542F\u52A8\u3002": " Stopped automatic retries; fix the problem and start it manually.",
  " \u7A0D\u540E\u5C06\u81EA\u52A8\u91CD\u8BD5\u3002": " It will retry automatically later.",
  "\u5176\u5B83\u5411\u91CF Provider \u6709\u672A\u63D0\u4EA4\u7684\u8349\u7A3F\uFF0C\u8BF7\u5207\u56DE\u5BF9\u5E94 Provider \u4FDD\u5B58\uFF0C\u6216\u653E\u5F03\u66F4\u6539\u3002": "Another embedding provider has uncommitted drafts. Switch back to that provider to save, or discard the changes.",
  "\u5411\u91CF\u7EF4\u5EA6\u5FC5\u987B\u662F\u6B63\u6574\u6570\u6216\u7559\u7A7A\u3002": "Embedding dimensions must be a positive integer or left empty.",
  "\u4FDD\u5B58\u8BF7\u6C42\u8D85\u65F6\u6216\u5DF2\u53D6\u6D88\uFF1A\u7ED3\u679C\u5C1A\u672A\u786E\u8BA4\uFF0C\u66F4\u6539\u5DF2\u4FDD\u7559\u3002\u8BF7\u5237\u65B0\u6838\u5BF9\uFF0C\u52FF\u76F4\u63A5\u91CD\u590D\u63D0\u4EA4\u3002": "The save request timed out or was cancelled: the result is unconfirmed and your changes were kept. Refresh to verify instead of submitting again.",
  "\u914D\u7F6E\u54CD\u5E94\u683C\u5F0F\u65E0\u6548\uFF1A\u4FDD\u5B58\u7ED3\u679C\u5C1A\u672A\u786E\u8BA4\uFF0C\u8BF7\u5237\u65B0\u6838\u5BF9\u3002": "The config response is malformed: the save result is unconfirmed. Refresh to verify.",
  "\u3001": ", ",
  "\u5DF2\u4FDD\u5B58\u3002": "Saved.",
  "\u5DF2\u4FDD\u5B58\uFF08{0}\uFF09\u3002{1}{2}": "Saved ({0}). {1}{2}",
  "\u670D\u52A1\u8BBE\u7F6E\u9700\u91CD\u542F\u53D7\u63A7API\uFF1B\u8FD9\u4E0D\u4F1A\u91CD\u7F6EDSH\u8BB0\u5FC6\u9002\u914D\u5668\u3002": "The server-side settings apply on a controlled API restart; this does not reset the DSH memory adapter.",
  "\u8FD0\u884C\u662F\u5426\u5E94\u7528\u672A\u786E\u8BA4\uFF1B\u5DF2\u6709\u5DE5\u4F5C\u533A\u53EF\u80FD\u9700\u8981\u91CD\u542FDSH\u3002": "Whether the running instance applied them is unconfirmed; existing workspaces may need a DSH restart.",
  "\u5176\u5B83\u5411\u91CFProvider\u8349\u7A3F\u5DF2\u4FDD\u7559\uFF0C\u5C1A\u672A\u63D0\u4EA4\u3002": "Other embedding provider drafts were kept and not submitted.",
  "\u4FDD\u5B58\u88AB\u62D2\u7EDD\uFF1A\u914D\u7F6E\u5DF2\u5728\u5176\u5B83\u5730\u65B9\u4FEE\u6539\uFF08409 \u51B2\u7A81\uFF09\u3002\u60A8\u7684\u66F4\u6539\u5DF2\u5168\u90E8\u4FDD\u7559\u3002\u6CE8\u610F\uFF1A\u672C\u5730\u57FA\u7EBF\u4ECD\u662F\u65E7\u7248\u672C\uFF0C\u76F4\u63A5\u91CD\u8BD5\u4F1A\u7EE7\u7EED\u51B2\u7A81\u2014\u2014\u8BF7\u5148\u300C\u653E\u5F03\u66F4\u6539\u300D\u8F7D\u5165\u6700\u65B0\u57FA\u7EBF\uFF08\u5F53\u524D\u7F16\u8F91\u5C06\u88AB\u4E22\u5F03\uFF09\uFF0C\u4E4B\u540E\u518D\u91CD\u65B0\u7F16\u8F91\u4FDD\u5B58\u3002": "Save rejected: the configuration changed elsewhere (409 conflict). All your changes were kept. Note: the local baseline is still the old revision, so retrying directly will conflict again \u2014 use Discard changes first to load the latest baseline (current edits are lost), then edit and save again.",
  "\u5DF2\u6309\u5F53\u524D\u8BBE\u7F6E\u91CD\u542F\u670D\u52A1\u3002": "The service was restarted with the current settings.",
  "\u670D\u52A1\u5DF2\u542F\u52A8\u3002": "The service was started.",
  "\u91CD\u542F\u5931\u8D25\uFF1A": "Restart failed:",
  "\u542F\u52A8\u5931\u8D25\uFF1A": "Start failed:",
  "\u68C0\u6D4B\u5230\u672A\u4FDD\u5B58\u7684\u66F4\u6539\uFF0C\u6B63\u5728\u5148\u4FDD\u5B58\u2026": "Unsaved changes detected; saving first\u2026",
  "\u64CD\u4F5C\u672A\u6267\u884C\uFF1A\u4FDD\u5B58\u671F\u95F4\u53C8\u51FA\u73B0\u4E86\u65B0\u7684\u672A\u4FDD\u5B58\u66F4\u6539\uFF0C\u8BF7\u786E\u8BA4\u4FDD\u5B58\u6216\u653E\u5F03\u540E\u518D\u6267\u884C\u3002": "Operation not executed: new unsaved changes appeared while saving. Save or discard them, then try again.",
  "\u64CD\u4F5C\u672A\u6267\u884C\uFF1A\u8BF7\u5148\u89E3\u51B3\u4FDD\u5B58\u5931\u8D25\u7684\u95EE\u9898\u3002": "Operation not executed: resolve the save failure first.",
  "\u8131\u654F\u5199\u5165\u8D85\u65F6\u6216\u5DF2\u53D6\u6D88\uFF1A\u7ED3\u679C\u5C1A\u672A\u786E\u8BA4\uFF0C\u8BF7\u91CD\u8BFB\u7B56\u7565\u540E\u518D\u64CD\u4F5C\u3002": "The redaction write timed out or was cancelled: the result is unconfirmed. Re-read the policy before acting.",
  "\u67E5\u770B\u8FDE\u63A5\u4E0E\u670D\u52A1\u5F52\u5C5E\uFF1B\u4EC5\u5728\u6EE1\u8DB3\u8EAB\u4EFD\u6838\u9A8C\u6761\u4EF6\u65F6\u542F\u52A8\u6216\u91CD\u542F\u3002": "Connection and service ownership; start or restart only when the identity checks pass.",
  "\u7BA1\u7406\u8BB0\u5FC6\u5F00\u5173\u3001\u8BB0\u5FC6\u5E93\u547D\u540D\u4E0E\u8FDE\u63A5\u5730\u5740\u3002": "Memory toggle, bank naming and connection address.",
  "\u533A\u5206 DSH \u529F\u80FD\u6A21\u578B\u4E0E Hindsight \u5411\u91CF\u540E\u7AEF\uFF0C\u4FDD\u5B58\u540E\u6309\u751F\u6548\u65F6\u673A\u5E94\u7528\u3002": "Separates DSH chat models from the Hindsight embedding backend; saved values apply according to when they take effect.",
  "\u5BA1\u8BA1\u8BBE\u7F6E\u5728\u670D\u52A1\u91CD\u542F\u540E\u5E94\u7528\uFF1B\u8BB0\u5FC6\u5E93\u8131\u654F\u5F00\u5173\u5373\u65F6\u5199\u5165\u3002": "Audit settings apply after a service restart; bank redaction toggles write immediately.",
  "\u8C03\u6574\u63D2\u4EF6\u9009\u9879\uFF0C\u67E5\u770B\u672C\u9875\u4E0D\u4F1A\u6539\u5199\u7684\u5176\u5B83\u914D\u7F6E\u952E\u3002": "Adjust plugin options and inspect other config keys this page does not rewrite.",
  "\u6B63\u5728\u5237\u65B0\u72B6\u6001\uFF0C\u8BF7\u7B49\u5F85\u6838\u9A8C\u5B8C\u6210\u540E\u518D\u64CD\u4F5C\u3002": "Refreshing the status; wait for verification to finish.",
  "\u72B6\u6001\u8BFB\u53D6\u5931\u8D25\uFF1A\u8BF7\u5148\u5237\u65B0\u6838\u5BF9\uFF0C\u4E0D\u4F7F\u7528\u65E7\u72B6\u6001\u6388\u6743\u64CD\u4F5C\u3002": "Status read failed: refresh and verify first; old state does not authorize actions.",
  "\u670D\u52A1\u64CD\u4F5C\u6B63\u5728\u6267\u884C\uFF0C\u8BF7\u7B49\u5F85\u5B8C\u6210\u540E\u518D\u64CD\u4F5C\u3002": "A service operation is running; wait for it to finish.",
  "\u914D\u7F6E\u6B63\u5728\u4FDD\u5B58\uFF0C\u8BF7\u7B49\u5F85\u4FDD\u5B58\u5B8C\u6210\u3002": "The configuration is being saved; wait for it to finish.",
  "\u542F\u52A8\u9884\u68C0\u672A\u901A\u8FC7\uFF0C\u8BF7\u68C0\u67E5\u914D\u7F6E\u9519\u8BEF\u548C\u51ED\u636E\u89E3\u6790\u63D0\u793A\u3002": "Start preflight failed; check the configuration errors and credential resolution notes.",
  "\u7AEF\u53E3\u7531\u5916\u90E8\u8FDB\u7A0B\u5360\u7528\uFF1A\u672C\u63D2\u4EF6\u65E0\u6CD5\u91CD\u542F\u5B83\uFF0C\u53EA\u80FD\u7B49\u5F85\u5176\u9000\u51FA\u540E\u518D\u542F\u52A8\u6258\u7BA1\u5B9E\u4F8B\u3002": "The port is held by an external process: this plugin cannot restart it and can only wait for it to exit before starting a managed instance.",
  "\u670D\u52A1\u672A\u8FD0\u884C\uFF1A\u91CD\u542F\u4E0D\u53EF\u7528\uFF0C\u8BF7\u4F7F\u7528\u300C\u542F\u52A8\u670D\u52A1\u300D\u3002": "The service is not running: restart is unavailable; use Start service.",
  "\u670D\u52A1\u5F52\u5C5E\u672A\u77E5\uFF1A\u4E3A\u907F\u514D\u8BEF\u4F24\u5176\u5B83\u8FDB\u7A0B\uFF0C\u91CD\u542F\u4E0D\u53EF\u7528\u3002": "Service ownership unknown: restart is unavailable so other processes are not disturbed.",
  "\u8FD0\u884C\u4E2D": "Running",
  "\u72B6\u6001\u672A\u77E5": "Unknown",
  "\u672A\u8FD0\u884C": "Not running",
  "\u63A7\u5236\u53F0": "Control Plane",
  "\u53EF\u7528": "Reachable",
  "\u4E0D\u53EF\u7528": "Unreachable",
  "\u5F85\u4E0B\u6B21\u542F\u52A8\u5E94\u7528": "Applies on next start",
  "\u754C\u9762\u8BED\u8A00": "Interface language",
  "\u4FDD\u5B58\u4E0D\u7B49\u4E8E\u8FD0\u884C\u5E94\u7528\uFF1A\u5DF2\u6709\u5DE5\u4F5C\u533A\u53EF\u80FD\u9700\u91CD\u542FDSH\uFF1BAPI\u670D\u52A1\u8BBE\u7F6E\u4EC5\u5728\u4E0B\u6B21\u53D7\u63A7\u542F\u52A8/\u91CD\u542F\u5E94\u7528\uFF0C\u4E0D\u4F1A\u81EA\u52A8\u91CD\u542F\u3002": "Saving is not applying: existing workspaces may need a DSH restart, and API server settings apply only on the next controlled start/restart. The service is never restarted automatically.",
  "Hindsight \u8BBE\u7F6E\u5206\u7C7B": "Hindsight settings sections",
  "\u6B63\u5728\u5237\u65B0\u72B6\u6001": "Refreshing status",
  "\u72B6\u6001\u91C7\u6837 {0}": "Status sampled {0}",
  "\u7B49\u5F85\u72B6\u6001\u91C7\u6837": "Waiting for a status sample",
  "\u8BFB\u53D6\u4E2D\u2026": "Loading\u2026",
  "\u8BFB\u53D6\u5931\u8D25": "Read failed",
  "\u91CD\u8BD5": "Retry",
  "\u914D\u7F6E\u8BFB\u53D6\u5931\u8D25\uFF1A": "Config read failed:",
  "\u3002\u4E0D\u4F1A\u8986\u76D6\u635F\u574F\u6216\u4E0D\u53EF\u8BFB\u7684\u6587\u4EF6\uFF0C\u8BF7\u5148\u5728\u672C\u673A\u4FEE\u590D\u3002": ". Corrupt or unreadable files are never overwritten; repair them locally first.",
  "\u670D\u52A1\u7BA1\u7406": "Service management",
  "\u542F\u52A8\u4E2D\u2026": "Starting\u2026",
  "\u542F\u52A8\u670D\u52A1": "Start service",
  "\u91CD\u542F\u4E2D\u2026": "Restarting\u2026",
  "\u91CD\u542F\u670D\u52A1": "Restart service",
  "\u534F\u4F5C\u63A7\u5236\u4E0D\u53EF\u7528\uFF1A": "Control channel unavailable:",
  "\u5F52\u5C5E": "Ownership",
  "\u6258\u7BA1\uFF08\u672C\u63D2\u4EF6\u542F\u52A8\uFF09": "Managed (started by this plugin)",
  "\u5916\u90E8\u8FDB\u7A0B": "External process",
  "\u672A\u77E5": "Unknown",
  "\u6570\u636E\u5E93": "Database",
  "\u2014": "\u2014",
  "\u6700\u8FD1\u64CD\u4F5C": "Last action",
  "\u91CD\u542F": "Restart",
  "\u542F\u52A8": "Start",
  "\u542F\u52A8\u914D\u7F6E\u89E3\u6790\u5931\u8D25\uFF1A": "Launch config failed to resolve:",
  "\u670D\u52A1\u8EAB\u4EFD\u65E0\u6CD5\u6838\u9A8C\uFF1A": "Service identity could not be verified:",
  "\u542F\u52A8\u4E0E\u8FD0\u884C\u8BE6\u60C5": "Launch and runtime details",
  "\u542F\u52A8\u5165\u53E3": "Launch entry",
  "\u672A\u627E\u5230": "Not found",
  "\u76D1\u542C PID": "Listening PID",
  "\u672A\u786E\u8BA4": "Unconfirmed",
  "\xB7 \u7AEF\u53E3": "\xB7 port",
  "\u8FD0\u884C\u4E2D\u914D\u7F6E": "Running configuration",
  "\u542F\u52A8\u4E8E": "Started at",
  " \xB7 \u5BA1\u8BA1\u65E5\u5FD7\u5F00": " \xB7 audit log on",
  " \xB7 \u5BA1\u8BA1\u65E5\u5FD7\u5173": " \xB7 audit log off",
  "\u8FD0\u884C\u4E2D\u670D\u52A1\u7684\u5B9E\u9645\u914D\u7F6E\u65E0\u6CD5\u786E\u8BA4\uFF08\u53EF\u80FD\u7531\u5916\u90E8\u542F\u52A8\uFF09\uFF1B\u300C\u4E0B\u6B21\u542F\u52A8\u5C06\u5E94\u7528\u300D\u4EC5\u53CD\u6620\u672C\u9875\u4FDD\u5B58\u7684\u503C\u3002": 'The actual configuration of the running service cannot be confirmed (it may have been started externally); "applies on next start" only reflects values saved on this page.',
  "\u542F\u52A8\u9884\u68C0\u5931\u8D25\uFF1A": "Start preflight failed:",
  "\uFF1B": "; ",
  "\u670D\u52A1\u7AEF\u8BBE\u7F6E\u5DF2\u4FEE\u6539\uFF0C\u5DF2\u786E\u8BA4\u7684\u542F\u52A8\u914D\u7F6E\u4E0E\u4FDD\u5B58\u503C\u4E0D\u540C\u3002": "Server-side settings changed: the confirmed launch configuration differs from the saved values.",
  "\u670D\u52A1\u7AEF\u8BBE\u7F6E\u5DF2\u4FDD\u5B58\uFF1B\u5F53\u524D\u5B9E\u4F8B\u914D\u7F6E\u672A\u77E5\uFF0C\u65E0\u6CD5\u786E\u8BA4\u662F\u5426\u5DF2\u751F\u6548\u3002": "Server-side settings saved; the running instance is unknown, so it is not confirmed to be in effect.",
  "\u7ACB\u5373\u91CD\u542F\u751F\u6548": "Restart now to apply",
  "\u542F\u52A8\u9009\u9879\u4E0E\u4E0B\u6B21\u914D\u7F6E": "Launch options and next configuration",
  "\u81EA\u52A8\u542F\u52A8": "Auto-start",
  "API \u672A\u8FD0\u884C\u65F6\uFF0C\u6253\u5F00\u672C\u9875\u81EA\u52A8\u62C9\u8D77\u670D\u52A1\uFF08\u4FDD\u5B58\u540E\u751F\u6548\uFF09": "When the API is down, opening this page starts the service automatically (after saving)",
  "\u7531\u63D2\u4EF6\u6309\u4E0B\u65B9\u300C\u529F\u80FD\u6A21\u578B\u8C03\u7528\u300D\u7B49\u8BBE\u7F6E\u52A8\u6001\u6784\u5EFA\u73AF\u5883\u5E76\u542F\u52A8\uFF0C\u65E0\u9700\u7CFB\u7EDF\u542F\u52A8\u811A\u672C\u3002": "The plugin builds the environment from settings such as the model routing below and starts the service; no system start script is needed.",
  "\u542F\u52A8\u547D\u4EE4\u8986\u76D6": "Launch command override",
  "\u670D\u52A1\u542F\u52A8\u547D\u4EE4\u8986\u76D6": "Service launch command override",
  "\u7559\u7A7A = \u81EA\u52A8\u53D1\u73B0\uFF08PATH \u2192 uv/pip \u9ED8\u8BA4\u5B89\u88C5\u4F4D\u7F6E\uFF09": "Empty = auto-discover (PATH \u2192 uv/pip default locations)",
  "\u7528\u4E8E\u5B9A\u4F4D\u76F8\u90BB\u7684 Python \u73AF\u5883\uFF1B\u586B\u5199\u4E0B\u65B9\u89E3\u91CA\u5668\u540E\u4F18\u5148\u4F7F\u7528\u89E3\u91CA\u5668\uFF0C\u4E0D\u518D\u901A\u8FC7\u6B64\u547D\u4EE4\u542F\u52A8\u3002": "Used to locate an adjacent Python environment; once an interpreter is set below it takes priority and this command is no longer used.",
  "Hindsight Python \u73AF\u5883": "Hindsight Python environment",
  "Hindsight Python \u89E3\u91CA\u5668": "Hindsight Python interpreter",
  "\u5DF2\u5B89\u88C5 hindsight-api \u7684 Python \u89E3\u91CA\u5668\u5B8C\u6574\u8DEF\u5F84": "Full path to a Python interpreter with hindsight-api installed",
  "\u7559\u7A7A\u4EC5\u5C1D\u8BD5\u542F\u52A8\u5165\u53E3\u65C1\u7684 python\uFF1B\u65E0\u6CD5\u786E\u8BA4\u65F6\u62D2\u7EDD\u542F\u52A8\uFF0C\u4E0D\u731C\u6D4B\u5176\u5B83\u73AF\u5883\u3002\u5F53\u524D\u534F\u4F5C\u5173\u95ED\u9002\u914D Hindsight 0.10.2\u3001\u5355 worker\uFF1B\u5DF2\u6709 HTTP \u6269\u5C55\u65F6\u4E0D\u4F1A\u8986\u76D6\u3002": "When empty, only the python next to the launch entry is tried, and the start is refused rather than guessed. The control shutdown currently targets Hindsight 0.10.2 with a single worker and never overwrites an existing HTTP extension.",
  "\u4E0B\u6B21\u542F\u52A8/\u91CD\u542F\u5C06\u5E94\u7528\uFF1A": "Applied on the next start/restart:",
  "\xB7 \u51ED\u636E": "\xB7 credential",
  "\u91CD\u8BD5\u542F\u52A8": "Retry start",
  "\u6253\u5F00 Control Plane": "Open Control Plane",
  "\u5237\u65B0\u72B6\u6001": "Refresh status",
  "\u8BB0\u5FC6": "Memory",
  "\u542F\u7528": "On",
  "\u5728\u8FD9\u4E2A harness \u4E0A\u542F\u7528\u957F\u671F\u8BB0\u5FC6": "Enable long-term memory in this harness",
  "\u5173\u95ED\u4F1A\u4FDD\u5B58 disabled\uFF1B\u5DF2\u7F13\u5B58\u7684\u5DE5\u4F5C\u533A\u53EF\u80FD\u4ECD\u53EC\u56DE\u3001\u5199\u56DE\u6216\u4FDD\u7559\u5DE5\u5177\uFF0C\u9700\u91CD\u542FDSH\u91CD\u65B0\u521D\u59CB\u5316\u540E\u6838\u9A8C\u3002\u4EC5\u65B0\u5EFA\u540C\u4E00\u5DE5\u4F5C\u533A\u4F1A\u8BDD\u6216\u91CD\u542FAPI\u4E0D\u4FDD\u8BC1\u751F\u6548\u3002": "Turning it off saves disabled; a cached workspace may still recall, write back or keep the tools, so verify after restarting DSH to reinitialize. Starting another session in the same workspace or restarting the API alone is not guaranteed to take effect.",
  "\u8BB0\u5FC6\u5E93\u547D\u540D": "Memory bank naming",
  "\u6309\u5DE5\u4F5C\u533A\u52A8\u6001\u547D\u540D": "Name per workspace",
  "(harness::\u9879\u76EE\u540D\uFF0C\u4F8B\u5982 coding-agent::DSH)": "(harness::project, e.g. coding-agent::DSH)",
  "\u56FA\u5B9A\u540D\u5B57": "Fixed name",
  "\u56FA\u5B9A\u8BB0\u5FC6\u5E93\u540D\u79F0": "Fixed memory bank name",
  "\u8FDE\u63A5": "Connection",
  "\u670D\u52A1\u5730\u5740": "Service address",
  "Hindsight API \u670D\u52A1\u5730\u5740": "Hindsight API address",
  "Hindsight API \u7684\u5730\u5740\u3002\u542F\u52A8/\u91CD\u542F\u670D\u52A1\u65F6\u6309\u6B64\u7AEF\u53E3\u76D1\u542C\uFF08\u5199\u5165 apiUrl\uFF09\u3002": "Address of the Hindsight API. The service listens on this port when it is started or restarted (writes apiUrl).",
  "\u63A7\u5236\u53F0\u5730\u5740": "Control Plane address",
  "Control Plane \u63A7\u5236\u53F0\u5730\u5740": "Control Plane console address",
  "Hindsight Control Plane \u7684\u5730\u5740\uFF08Web \u63A7\u5236\u53F0\uFF09\u3002\u4EC5\u63A5\u53D7 http/https\uFF0C\u4E0D\u542B\u8DEF\u5F84\u53C2\u6570\u3002": "Address of the Hindsight Control Plane (web console). Only http/https without path parameters is accepted.",
  " \u5F53\u524D\u53D6\u81EA\u73AF\u5883\u53D8\u91CF HINDSIGHT_CP_URL\uFF0C\u4FDD\u5B58\u540E\u6539\u7531\u672C\u9875\u7BA1\u7406\u3002": " Currently taken from HINDSIGHT_CP_URL; once saved it is managed from this page.",
  " \u5F53\u524D\u4E3A\u9ED8\u8BA4\u503C\uFF0C\u4FDD\u5B58\u540E\u6539\u7531\u672C\u9875\u7BA1\u7406\u3002": " Currently the default; once saved it is managed from this page.",
  "\u65E5\u5FD7\u7EA7\u522B": "Log level",
  "\u5199\u5165 ~/.hindsight/coding-agents-logs/plugin.log \u7684\u8BE6\u7EC6\u7A0B\u5EA6\u3002": "Verbosity written to ~/.hindsight/coding-agents-logs/plugin.log.",
  "\u529F\u80FD\u6A21\u578B\u8C03\u7528": "Model routing",
  "DSH \u804A\u5929\u6A21\u578B\u8DEF\u7531": "DSH chat model routing",
  "\u83B7\u53D6\u6A21\u578B\u4E2D\u2026": "Discovering models\u2026",
  "\u5237\u65B0 DSH \u6A21\u578B": "Refresh DSH models",
  "\u4ECE\u5F53\u524D DSH \u73AF\u5883\u5DF2\u6CE8\u518C\u7684 Provider \u53D1\u73B0\u6A21\u578B\uFF0C\u652F\u6301\u4E0B\u62C9\u70B9\u9009\u6216\u624B\u52A8\u6307\u5B9A\uFF1B\u4FDD\u5B58\u540E\u91CD\u542F\u670D\u52A1\u751F\u6548\u3002": "Discovers models from the providers registered in this DSH environment; pick one from the list or type it manually. Takes effect after saving and restarting the service.",
  "\u65E0\u6CD5\u83B7\u53D6 DSH \u6A21\u578B\u5217\u8868\uFF1A": "Could not read the DSH model list:",
  "\u670D\u52A1\u4E0D\u53EF\u7528": "Service unavailable",
  "\uFF08\u91C7\u6837\u4E8E {0}\uFF09": "(sampled {0})",
  "\u90E8\u5206 Provider \u6A21\u578B\u83B7\u53D6\u5931\u8D25\uFF1A": "Some providers failed to list models:",
  "\u672A\u77E5 Provider": "unknown provider",
  "\u4EE3\u7801\u5E93\u52D8\u5BDF\uFF08\u5916\u90E8 CLI\uFF09": "Codebase survey (external CLI)",
  "\u52D8\u5BDF CLI \u6A21\u578B\u6807\u8BC6": "Survey CLI model id",
  "\u7559\u7A7A\u7EE7\u627F\u9ED8\u8BA4 haiku": "Empty inherits the default haiku",
  "surveyModel \u662F\u5916\u90E8 runner \u7684\u6A21\u578B\u6807\u8BC6\uFF0C\u4E0D\u662F DSH Provider/Model \u76EE\u5F55\u3002\u5B98\u65B9\u9002\u914D\u5668\u63A2\u6D4B Claude\u3001Codex\u3001Antigravity\u3001OpenCode \u7B49 CLI\uFF1B\u6A21\u578B\u53C2\u6570\u652F\u6301\u53D6\u51B3\u4E8E\u6240\u9009 runner\u3002\u52D8\u5BDF\u9700\u8981\u5DF2\u5B89\u88C5\u4E14\u5DF2\u8BA4\u8BC1\u7684 CLI\uFF0C\u53EF\u80FD\u4EA7\u751F\u8D39\u7528\uFF1B\u672C\u9875\u4E0D\u5B89\u88C5\u3001\u63A2\u6D4B\u6216\u6267\u884C\u5B83\u4EEC\u3002\u5DF2\u6709\u5DE5\u4F5C\u533A\u4FDD\u5B58\u540E\u53EF\u80FD\u9700\u91CD\u542FDSH\u3002": "surveyModel is an external runner model id, not a DSH provider/model route. The official adapter probes CLIs such as Claude, Codex, Antigravity and OpenCode, and model-argument support depends on the chosen runner. Surveys need an installed, authenticated CLI and may cost money; this page never installs, probes or runs them. Existing workspaces may need a DSH restart after saving.",
  "\uFF08\u5199\u5165 serverModels.{0}\uFF09": "(written to serverModels.{0})",
  "\u7EE7\u627F\u542F\u52A8\u73AF\u5883/\u540E\u7AEF\u9ED8\u8BA4\uFF0C\u578B\u53F7\u672A\u786E\u8BA4": "Inherit the launch environment or backend default; model unconfirmed",
  "\u5411\u91CF\u6A21\u578B": "Embedding model",
  "\u6B64\u5904\u662F Hindsight \u5411\u91CF\u5316\u4E13\u7528\u6A21\u578B\uFF0C\u4E0D\u5C5E\u4E8E DSH \u804A\u5929\u6A21\u578B\u5217\u8868\u3002\u9884\u89C8\u53CD\u6620\u5DF2\u4FDD\u5B58\u8BBE\u7F6E\u800C\u975E\u5F53\u524D\u8349\u7A3F\uFF1B\u6240\u6709\u4FDD\u5B58\u4EC5\u5F71\u54CD\u4E0B\u6B21\u542F\u52A8\u3002\u672C\u9875\u4E0D\u4F1A\u8FC1\u79FB\u7D22\u5F15\u3001\u4E0B\u8F7D\u6A21\u578B\u6216\u91CD\u542F\u670D\u52A1\u3002": "This is the Hindsight embedding model and is not part of the DSH chat model list. The preview reflects saved settings rather than the current draft, and every save only affects the next start. This page never migrates indexes, downloads models or restarts the service.",
  "\u66F4\u6362\u5411\u91CF\u6A21\u578B\u6216\u7EF4\u5EA6\u53EF\u80FD\u9700\u8981\u91CD\u5EFA/\u8FC1\u79FB\u5DF2\u6709\u5411\u91CF\uFF0C\u64CD\u4F5C\u524D\u8BF7\u81EA\u884C\u6838\u5BF9\u5B58\u91CF\u6570\u636E\u3002": "Changing the embedding model or dimensions may require rebuilding or migrating existing vectors; check the stored data before changing anything.",
  "\u5DF2\u4FDD\u5B58\u9884\u89C8": "Saved preview",
  "\u914D\u7F6E\u9519\u8BEF": "Configuration error",
  " \xB7 {0} \u7EF4": " \xB7 {0}-dim",
  "\u914D\u7F6E\u6765\u6E90": "Config source",
  "\xB7 \u51ED\u636E\u6765\u6E90": "\xB7 credential source",
  "\u4E0B\u6B21\u542F\u52A8\u51ED\u636E\u5DF2\u914D\u7F6E\uFF08\u672A\u9A8C\u8BC1\u6709\u6548\u6027\uFF09": "Credentials configured for the next start (validity not verified)",
  "\u4E0B\u6B21\u542F\u52A8\u51ED\u636E\u672A\u786E\u8BA4\u914D\u7F6E": "Credentials for the next start not confirmed",
  "\u4E0B\u6B21\u542F\u52A8\u5411\u91CF\u914D\u7F6E\u672A\u77E5\uFF0C\u65E0\u6CD5\u786E\u8BA4\u5DF2\u4FDD\u5B58\u8BBE\u7F6E\u7684\u89E3\u6790\u7ED3\u679C\u3002": "The embedding configuration for the next start is unknown, so the saved values cannot be resolved.",
  "\u5F53\u524D\u8FD0\u884C": "Currently running",
  "{0}{1}\uFF08\u672C\u63D2\u4EF6\u786E\u8BA4\u7684\u542F\u52A8\u5FEB\u7167\uFF09": "{0}{1} (launch snapshot confirmed by this plugin)",
  "\u672A\u77E5\uFF08\u65E0\u672C\u63D2\u4EF6\u786E\u8BA4\u7684\u542F\u52A8\u5FEB\u7167\uFF1B\u4E0D\u80FD\u63A8\u65AD\u6B63\u5728\u4F7F\u7528\u4E0B\u6B21\u542F\u52A8\u914D\u7F6E\uFF09": "Unknown (no launch snapshot confirmed by this plugin; the next-start configuration cannot be assumed to be in use)",
  "\u5411\u91CF Provider": "Embedding provider",
  "\u7EE7\u627F\u73AF\u5883 / \u65E2\u6709\u670D\u52A1\u914D\u7F6E": "Inherit the environment / existing service config",
  "local\uFF08\u672C\u5730\uFF09": "local (on this machine)",
  "openai\uFF08\u542B LM Studio / OpenAI \u517C\u5BB9\uFF09": "openai (including LM Studio / OpenAI-compatible)",
  "tei\uFF08\u8FDC\u7AEF\u63A8\u7406\u670D\u52A1\uFF09": "tei (remote inference service)",
  "\u672A\u77E5 Provider\uFF1A": "Unknown provider:",
  "\u7559\u7A7A\u4FDD\u6301\u7EE7\u627F\uFF1B\u4E0D\u4F1A\u81EA\u52A8\u8FC1\u79FB\u65E7 serverEnv\uFF0C\u65E2\u6709\u503C\u4EC5\u5728\u4E0B\u6B21\u542F\u52A8\u9884\u89C8\u4E2D\u663E\u793A\u3002": "Empty keeps inheritance; old serverEnv is never migrated automatically and existing values only appear in the next-start preview.",
  "ONNX \u6A21\u578B ID": "ONNX model ID",
  "\u5411\u91CF\u6A21\u578B\u540D\u79F0": "Embedding model name",
  "\u672C\u5730\u4F9D\u8D56\u53CA\u6A21\u578B\u9700\u81EA\u884C\u51C6\u5907\uFF1B\u4E0D\u4F1A\u81EA\u52A8\u5B89\u88C5\u6216\u4FE1\u4EFB\u8FDC\u7AEF\u4EE3\u7801\u3002": "Local dependencies and models must be provided; nothing is installed and remote code is never trusted automatically.",
  "\u5411\u91CF Base URL": "Embedding base URL",
  "TEI \u670D\u52A1\u5730\u5740": "TEI service address",
  "\u517C\u5BB9 OpenAI \u7684 API \u5730\u5740": "OpenAI-compatible API address",
  "TEI \u6A21\u578B\u7531\u8FDC\u7AEF\u670D\u52A1\u51B3\u5B9A\uFF0C\u672C\u9875\u4E0D\u53D1\u9001\u6A21\u578B\u5B57\u6BB5\u3002": "The TEI model is decided by the remote service; this page sends no model field.",
  "\u7EF4\u5EA6\uFF08\u53EF\u9009\uFF09": "Dimensions (optional)",
  "\u5411\u91CF\u7EF4\u5EA6": "Embedding dimensions",
  "\u7559\u7A7A\u7EE7\u627F\u65E2\u6709\u7EF4\u5EA6\u914D\u7F6E\uFF0C\u5426\u5219\u7531\u6A21\u578B/\u670D\u52A1\u51B3\u5B9A\uFF1B\u8BBE\u7F6E\u540E\u9700\u6838\u5BF9\u73B0\u6709\u5411\u91CF\u7D22\u5F15\u3002": "Empty inherits the existing dimensions, otherwise the model or service decides; after setting them, check the existing vector index.",
  "\u5F3A\u5236 CPU": "Force CPU",
  "\u5411\u91CF\u6A21\u578B\u5F3A\u5236 CPU": "Force CPU for the embedding model",
  "\u9ED8\u8BA4\uFF08\u4E0D\u6307\u5B9A\uFF09": "Default (unset)",
  "\u662F": "Yes",
  "\u5426": "No",
  "Key \u73AF\u5883\u53D8\u91CF": "Key environment variable",
  "\u5411\u91CF Key \u73AF\u5883\u53D8\u91CF": "Embedding key environment variable",
  "API Key \u73AF\u5883\u53D8\u91CF\u540D": "API key environment variable name",
  "\u66FF\u6362\u5BC6\u94A5": "Replace secret",
  "\u5411\u91CF\u66FF\u6362\u5BC6\u94A5": "Replace embedding secret",
  "\u5411\u91CF Key\uFF08\u7559\u7A7A\u4FDD\u7559\u5DF2\u5B58\u503C\uFF09": "Embedding key (empty keeps the stored value)",
  "\u6B64 Hindsight \u7248\u672C\u9700\u8981\u975E\u7A7A Key\uFF1B\u672C\u5730\u514D\u9274\u6743\u7AEF\u70B9\u4E5F\u9700\u7531\u60A8\u660E\u786E\u586B\u5199\u975E\u654F\u611F\u5360\u4F4D\u503C\uFF0C\u6216\u7EE7\u627F\u5DF2\u6709 Key\u3002\u672C\u9875\u4E0D\u4F1A\u81EA\u52A8\u751F\u6210\u3002": "This Hindsight version requires a non-empty key; for local endpoints without authentication you still have to enter a non-sensitive placeholder or inherit an existing key. This page never generates one.",
  "\u5C06\u6E05\u9664\u672C\u9875\u5DF2\u4FDD\u5B58 Key\uFF1B\u73AF\u5883\u51ED\u636E\u4ECD\u53EF\u80FD\u88AB\u7EE7\u627F\u3002": "This clears the key saved on this page; credentials from the environment may still be inherited.",
  "\u5DF2\u914D\u7F6E\u672C\u9875 Key\uFF08\u4E0D\u663E\u793A\u5185\u5BB9\uFF09": "Key configured on this page (value not shown)",
  "\u6E05\u9664\u5411\u91CF Key": "Clear embedding key",
  "\u672A\u77E5\u5411\u91CF Provider\uFF1A\u4E0D\u80FD\u63A8\u65AD\u5176\u914D\u7F6E\u6216\u751F\u6548\u72B6\u6001\uFF0C\u8BF7\u5207\u6362\u5230\u53D7\u652F\u6301\u7684\u7C7B\u578B\u3002": "Unknown embedding provider: its configuration and state cannot be inferred; switch to a supported type.",
  "Provider \u8986\u76D6": "Provider overrides",
  "\u4E3A\u975E\u5185\u7F6E Provider \u586B\u5199 openai \u517C\u5BB9\u7AEF\u70B9\u4E0E\u51ED\u636E\uFF1B\u7559\u7A7A\u8868\u793A\u7528\u73AF\u5883\u53D8\u91CF\uFF08<PROVIDER>_API_KEY\uFF09\u6216 DSH \u51ED\u636E\u5E93\u3002": "Fill in an OpenAI-compatible endpoint and credentials for providers that are not built in; empty means the environment variable (<PROVIDER>_API_KEY) or the DSH credential store is used.",
  "\u6682\u65E0\u9700\u8981\u8986\u76D6\u7684 Provider\u3002": "No providers need an override.",
  "Base URL\uFF08openai \u517C\u5BB9\u7AEF\u70B9\uFF0C\u4F8B\u5982 https://api.example.com/v1\uFF09": "Base URL (OpenAI-compatible endpoint, e.g. https://api.example.com/v1)",
  "{0} Key \u73AF\u5883\u53D8\u91CF": "{0} key environment variable",
  "{0} \u66FF\u6362\u5BC6\u94A5": "Replace the {0} secret",
  "\u5DF2\u4FDD\u5B58 Key\uFF08\u8F93\u5165\u4EE5\u66FF\u6362\uFF09": "Key stored (type to replace)",
  "\u6216\u76F4\u63A5\u586B Key": "or enter the key directly",
  "\u5C06\u6E05\u9664\u5DF2\u4FDD\u5B58\u7684 Key\uFF08\u4FDD\u5B58\u540E\u751F\u6548\uFF09\u3002": "Clears the stored key (after saving).",
  "\u5DF2\u914D\u7F6E Key": "Key configured",
  "\u6E05\u9664\u5DF2\u5B58 Key": "Clear the stored key",
  "\u5BA1\u8BA1\u65E5\u5FD7": "Audit log",
  "\u7EE7\u627F\u542F\u52A8\u73AF\u5883": "Inherit the launch environment",
  "\u5F00\u542F\u5BA1\u8BA1\u65E5\u5FD7": "Enable the audit log",
  "\u5173\u95ED\u5BA1\u8BA1\u65E5\u5FD7": "Disable the audit log",
  "\u670D\u52A1\u7AEF\u90E8\u7F72\u7EA7\u5F00\u5173\uFF0C\u91CD\u542F\u670D\u52A1\u540E\u751F\u6548\uFF1B\u4E5F\u53EF\u6309 bank \u5728 Control Plane \u4E2D\u5355\u72EC\u8986\u76D6\u3002": "A deployment-level switch that applies after a service restart; individual banks can also override it in the Control Plane.",
  "\u8BB0\u5FC6\u5E93": "Memory bank",
  "\u5F00\u5173\u5373\u65F6\u5199\u5165": "Toggles write immediately",
  "\u641C\u7D22\u8BB0\u5FC6\u5E93": "Search memory banks",
  "\u6309\u540D\u79F0\u6216 ID \u641C\u7D22\u8BB0\u5FC6\u5E93": "Search memory banks by name or id",
  "\u65E0\u6CD5\u8BFB\u53D6\u8BB0\u5FC6\u5E93\u5217\u8868\uFF1A": "Could not read the bank list:",
  "\u6CA1\u6709\u8BFB\u5230\u8BB0\u5FC6\u5E93\u3002": "No memory banks found.",
  "\u6CA1\u6709\u5339\u914D\u7684\u8BB0\u5FC6\u5E93\u3002": "No matching memory banks.",
  "{0} \u6761\u4E8B\u5B9E": "{0} facts",
  "\u4E8B\u5B9E\u6570\u672A\u77E5": "Fact count unknown",
  "\u5904\u7406\u4E2D\u2026": "Working\u2026",
  "\u7B56\u7565\u672A\u77E5": "Policy unknown",
  "\u8131\u654F\u5DF2\u5F00\u542F": "Redaction on",
  "\u6807\u51C6\u8131\u654F\u672A\u5F00\u542F": "Standard redaction off",
  "{0} \u8131\u654F": "Redaction for {0}",
  "\u8131\u654F": "Redaction",
  "\u91CD\u8BFB\u7B56\u7565": "Re-read policy",
  "\u300C\u8131\u654F\u300D\u7BA1\u7406 sensitive_data \u2192 redact \u6807\u51C6\u89C4\u5219\uFF0C\u4FDD\u7559\u5176\u5B83\u66F4\u5F3A\u6216\u81EA\u5B9A\u4E49\u7B56\u7565\u3002\u5F00\u5173\u76F4\u63A5\u5199\u5165\u5F53\u524D\u8BB0\u5FC6\u5E93\uFF0C\u4E0D\u9700\u8981\u70B9\u51FB\u4E0B\u65B9\u4FDD\u5B58\u3002": "Redaction manages the standard sensitive_data \u2192 redact rule and leaves stronger or custom policies alone. The toggle writes straight to the current bank and needs no save below.",
  "\u5176\u4ED6\u63D2\u4EF6\u9009\u9879": "Other plugin options",
  "\u81EA\u52A8\u66F4\u65B0\uFF08autoUpdate\uFF09": "Auto-update (autoUpdate)",
  "\u4EE3\u7801\u5E93\u52D8\u5BDF\uFF08codebaseSurvey\uFF09": "Codebase survey (codebaseSurvey)",
  "\u914D\u7F6E\u6587\u4EF6\u91CC\u8FD8\u6709 {0} \u4E2A\u672C\u9875\u4E0D\u6539\u5199\u7684\u952E\uFF08\u4FDD\u5B58\u65F6\u4F1A\u539F\u6837\u4FDD\u7559\uFF09": "{0} more config keys are not rewritten by this page (kept as-is when saving)",
  "\u6B63\u5728\u4FDD\u5B58\u5168\u90E8\u5206\u7C7B\u7684\u66F4\u6539\u2026": "Saving changes across all sections\u2026",
  "\u6709\u672A\u4FDD\u5B58\u7684\u66F4\u6539\uFF08\u8DE8\u5206\u7C7B\u4FDD\u7559\uFF09": "Unsaved changes (kept across sections)",
  "\u5F53\u524D\u8868\u5355\u4E0E\u5DF2\u4FDD\u5B58\u8BBE\u7F6E\u4E00\u81F4": "The form matches the saved settings",
  "\u4FDD\u5B58\u4E2D\u2026": "Saving\u2026",
  "\u4FDD\u5B58": "Save",
  "\u653E\u5F03\u66F4\u6539": "Discard changes",
  "\u4FDD\u5B58\u5931\u8D25\uFF1A": "Save failed:",
  "\u54CD\u5E94\u5DF2\u8FC7\u671F\uFF08\u76EE\u6807\u5DF2\u53D8\u66F4\u6216\u9762\u677F\u5DF2\u5378\u8F7D\uFF09\uFF0C\u5DF2\u4E22\u5F03\u3002": "The response is stale (target changed or panel unmounted) and was discarded.",
  "\u2026": "\u2026",
  "\u522B\u540D\u4E0D\u80FD\u4E3A\u7A7A\u3002": "An alias cannot be empty.",
  "\u522B\u540D\u8D85\u8FC7 192 \u5B57\u8282\uFF08UTF-8\uFF09\u4E0A\u9650\u3002": "The alias exceeds the 192-byte (UTF-8) limit.",
  "\u522B\u540D\u4E0D\u80FD\u5305\u542B\u63A7\u5236\u5B57\u7B26\u3002": "The alias cannot contain control characters.",
  "\u522B\u540D\u4E0D\u80FD\u5305\u542B\u659C\u6760\u6216\u53CD\u659C\u6760\u3002": "The alias cannot contain slashes or backslashes.",
  "\u522B\u540D\u4E0D\u80FD\u662F\u8DEF\u5F84\u7247\u6BB5\u3002": "The alias cannot be a path segment.",
  "\u5FC5\u987B\u662F\u6574\u6570": "Must be an integer",
  "\u4E0D\u80FD\u5C0F\u4E8E {0}": "Must be at least {0}",
  "\u4E0D\u80FD\u5927\u4E8E {0}": "Must be at most {0}",
  "\u5FC5\u987B\u662F\u6570\u5B57": "Must be a number",
  "JSON \u89E3\u6790\u5931\u8D25\uFF1A": "JSON parse failed:",
  "\u5FC5\u987B\u662F {0} \u4E4B\u4E00": "Must be one of {0}",
  "\u54CD\u5E94\u4E0E\u8BF7\u6C42\u76EE\u6807\u4E0D\u4E00\u81F4\uFF0C\u5DF2\u4E22\u5F03\u3002": "The response does not match the request target and was discarded.",
  "\u5F85\u5904\u7406": "Pending",
  "\u8FDB\u884C\u4E2D": "Running",
  "\u5DF2\u5B8C\u6210": "Completed",
  "\u5931\u8D25": "Failed",
  "\u5DF2\u53D6\u6D88": "Cancelled",
  "\u5BBF\u4E3B\u5C1A\u672A\u63D0\u4F9B\u8BB0\u5FC6\u5E93\u5217\u8868\uFF0C\u53EF\u624B\u52A8\u8F93\u5165 ID\u3002": "The host provides no bank list; type the id manually.",
  "\u8BB0\u5FC6\u5E93 ID": "Memory bank id",
  "\u8F93\u5165\u6216\u9009\u62E9\u8BB0\u5FC6\u5E93 ID": "Type or pick a memory bank id",
  "\uFF08{0} \u6761\u4E8B\u5B9E\uFF09": "({0} facts)",
  "\u9636\u6BB5\uFF1A": "Stage:",
  "\uFF1B\u5DF2\u5904\u7406 {0}{1}": "; processed {0}{1}",
  "\uFF1B\u5FEB\u7167\u65F6\u95F4 ": "; snapshot time ",
  "\uFF0C": ", ",
  "\u64CD\u4F5C\u5DF2\u53D6\u6D88\u3002\u82E5\u5B9E\u9645\u7ED3\u679C\u672A\u77E5\uFF0C\u8BF7\u5237\u65B0\u5BF9\u5E94\u5217\u8868\u6838\u5B9E\u72B6\u6001\uFF1B\u4E0D\u4F1A\u81EA\u52A8\u91CD\u8BD5\u3002": "Operation cancelled. If the actual outcome is unknown, refresh the relevant list to verify; nothing is retried automatically.",
  "\u51BB\u7ED3\u53C2\u6570\u5FEB\u7167\uFF08prepare \u4E0E\u6267\u884C\u4E4B\u95F4\u4E0D\u53EF\u53D8\uFF09": "Frozen parameter snapshot (immutable between prepare and execute)",
  "\u8F93\u5165\u300C{0}\u300D\u786E\u8BA4": 'Type "{0}" to confirm',
  "\u8F93\u5165 {0} \u4EE5\u786E\u8BA4\u64CD\u4F5C\u76EE\u6807": "Type {0} to confirm the operation target",
  "\u6211\u5DF2\u77E5\u6653\u4E0A\u8FF0\u98CE\u9669\u4E0E\u5F71\u54CD\u3002": "I understand the risks and effects above.",
  "\u6211\u5DF2\u77E5\u6653\u8BE5\u64CD\u4F5C\u53EF\u80FD\u4EA7\u751F LLM \u8C03\u7528\u8D39\u7528\u3002": "I understand this operation may incur LLM charges.",
  "\u53D6\u6D88": "Cancel",
  "\u6267\u884C\u4E2D\u2026": "Executing\u2026",
  "\u786E\u8BA4\u6267\u884C": "Confirm and execute",
  "\u5F00\u542F": "On",
  "\u5173\u95ED": "Off",
  "\u6587\u6863\u6570": "Documents",
  "\u8BB0\u5FC6\u8282\u70B9\u6570": "Memory nodes",
  "\u94FE\u63A5\u6570": "Links",
  "\u5F85\u5904\u7406\u4EFB\u52A1": "Pending operations",
  "\u5931\u8D25\u4EFB\u52A1": "Failed operations",
  "\u4E0A\u6B21\u6574\u7406\u65F6\u95F4": "Last consolidation",
  "\u4E0A\u6B21\u5199\u5165\u65F6\u95F4": "Last memory write",
  "\u91CD\u8BD5\u4EFB\u52A1": "Retry operation",
  "\u53D6\u6D88\u4EFB\u52A1": "Cancel operation",
  "\u5220\u9664\u4EFB\u52A1\u8BB0\u5F55": "Delete operation record",
  "\u5C06\u91CD\u65B0\u6267\u884C\u8BE5\u4EFB\u52A1\uFF0C\u53EF\u80FD\u518D\u6B21\u4EA7\u751F LLM \u8C03\u7528\u4E0E\u8D39\u7528\u3002": "The operation runs again and may incur LLM calls and charges a second time.",
  "\u5C06\u8BF7\u6C42\u53D6\u6D88\u8BE5\u4EFB\u52A1\uFF1B\u5DF2\u5F00\u59CB\u6267\u884C\u7684\u90E8\u5206\u65E0\u6CD5\u56DE\u6EDA\u3002": "Cancellation is requested; work already started cannot be rolled back.",
  "\u5C06\u6C38\u4E45\u5220\u9664\u8BE5\u4EFB\u52A1\u8BB0\u5F55\uFF08\u4E0D\u5F71\u54CD\u5DF2\u5199\u5165\u7684\u8BB0\u5FC6\u6570\u636E\uFF09\uFF0C\u4E0D\u53EF\u6062\u590D\u3002": "The operation record is deleted permanently (memory already written is unaffected); this cannot be undone.",
  "\u4EFB\u52A1 ID": "Operation ID",
  "\u8BCA\u65AD\u4FE1\u606F": "Diagnostics",
  "\u5237\u65B0\u8BCA\u65AD": "Refresh diagnostics",
  "\u8BCA\u65AD\u8BFB\u53D6\u5931\u8D25\uFF1A": "Diagnostics read failed:",
  "\u5C1A\u672A\u8BFB\u53D6\u8BCA\u65AD\u4FE1\u606F\u3002": "Diagnostics have not been read yet.",
  "\u63D2\u4EF6\u7248\u672C": "Plugin version",
  "API \u7248\u672C": "API version",
  "\u5B58\u6D3B\u72B6\u6001": "Liveness",
  "\u5C31\u7EEA\u72B6\u6001": "Readiness",
  "\u8BA4\u8BC1": "Authentication",
  "\u8BB0\u5FC6\u540E\u7AEF": "Memory backend",
  "\u670D\u52A1\u7AEF\u7279\u6027": "Server features",
  "\uFF08\u5173\uFF09": " (off)",
  "\u670D\u52A1\u7AEF\u7279\u6027\uFF1A\u672A\u77E5": "Server features: unknown",
  "\u8BB0\u5FC6\u5E93\u7EDF\u8BA1": "Bank statistics",
  "\u5237\u65B0\u7EDF\u8BA1": "Refresh statistics",
  "\u7EDF\u8BA1\u8BFB\u53D6\u5931\u8D25\uFF1A": "Statistics read failed:",
  "\u5171 {0} \u7C7B": "{0} categories",
  "\u4EFB\u52A1\u961F\u5217": "Operation queue",
  "\u6BCF 15 \u79D2\u81EA\u52A8\u5237\u65B0": "Refreshes every 15 seconds",
  "\u67E5\u8BE2": "Query",
  "\u7B5B\u9009": "Filter",
  "\u6309\u72B6\u6001\u7B5B\u9009": "Filter by status",
  "\u5168\u90E8\u72B6\u6001": "All statuses",
  "\u6309\u4EFB\u52A1\u7C7B\u578B\u7B5B\u9009": "Filter by operation type",
  "\u4EFB\u52A1\u7C7B\u578B\uFF08\u5982 retain\uFF09": "Operation type (e.g. retain)",
  "\u4E0D\u542B\u7236\u4EFB\u52A1": "Exclude parent operations",
  "\u7B5B\u9009\u5728\u70B9\u51FB\u300C\u67E5\u8BE2\u300D\u540E\u751F\u6548\u3002": "Filters apply after clicking Query.",
  "\u961F\u5217\u8BFB\u53D6\u5931\u8D25\uFF1A": "Queue read failed:",
  "\u6CA1\u6709\u7B26\u5408\u6761\u4EF6\u7684\u4EFB\u52A1\u3002": "No operations match.",
  "\u4EFB\u52A1": "Operation",
  "\u7C7B\u578B": "Type",
  "\u72B6\u6001": "Status",
  "\u521B\u5EFA\u65F6\u95F4": "Created",
  "\u9519\u8BEF": "Error",
  "\u64CD\u4F5C": "Actions",
  "\u6536\u8D77": "Collapse",
  "\u8BE6\u60C5": "Details",
  "\u4EC5\u5931\u8D25\u4EFB\u52A1\u53EF\u91CD\u8BD5": "Only failed operations can be retried",
  "\u4EC5\u5F85\u5904\u7406/\u8FDB\u884C\u4E2D\u4EFB\u52A1\u53EF\u53D6\u6D88": "Only pending or running operations can be cancelled",
  "\u4EFB\u52A1\u672A\u7ED3\u675F\uFF0C\u4E0D\u80FD\u5220\u9664": "A running operation cannot be deleted",
  "\u5220\u9664": "Delete",
  "\u8BFB\u53D6\u8BE6\u60C5\u2026": "Loading details\u2026",
  "\u5F00\u59CB\u65F6\u95F4": "Started",
  "\u5B8C\u6210\u65F6\u95F4": "Completed",
  "\u91CD\u8BD5\u6B21\u6570": "Retries",
  "\uFF1B\u4E0B\u6B21\u91CD\u8BD5 ": "; next retry ",
  "\u9519\u8BEF\u4FE1\u606F": "Error message",
  "\u9009\u62E9\u8BB0\u5FC6\u5E93\u540E\u70B9\u51FB\u300C\u67E5\u8BE2\u300D\u3002": "Pick a memory bank, then click Query.",
  "\u4E0A\u4E00\u9875": "Previous",
  "\u7B2C {0}\u2013{1} \u6761": "Items {0}\u2013{1}",
  "\uFF0C\u5171 {0} \u6761": ", {0} total",
  "\u4E0B\u4E00\u9875": "Next",
  "\u8BBE\u7F6E\u8BFB\u53D6\u7ED3\u679C\u683C\u5F0F\u4E0D\u7B26\u5408\u9884\u671F\u3002": "The settings response is malformed.",
  "\uFF1A": ": ",
  "API \u51ED\u636E\uFF1Areference \u6A21\u5F0F\u4E0B\u5FC5\u987B\u586B\u5199\u51ED\u636E\u5F15\u7528\u540D": "API credentials: reference mode requires a credential reference name",
  "\u8BF7\u5148\u4FEE\u6B63\uFF1A": "Fix these first:",
  "\u4FDD\u5B58\u8BB0\u5FC6\u4E0E\u9690\u79C1\u8BBE\u7F6E": "Save memory and privacy settings",
  "\u8BB0\u5FC6\u884C\u4E3A\u5199\u5165\u5B98\u65B9\u96C6\u6210\u7684\u914D\u7F6E\u4F5C\u7528\u57DF\uFF0C\u8BA4\u8BC1\u5F15\u7528\u5199\u5165\u672C\u63D2\u4EF6\u914D\u7F6E\u3002\u5DF2\u6709\u5DE5\u4F5C\u533A\u7F13\u5B58\u53EF\u80FD\u9700\u91CD\u65B0\u521D\u59CB\u5316\uFF1B\u4FDD\u5B58\u4E0D\u4FDD\u8BC1\u4E0B\u4E00\u8F6E\u751F\u6548\uFF0C\u4E5F\u4E0D\u4F1A\u81EA\u52A8\u91CD\u542F\u3002\u672A\u53D8\u66F4\u5B57\u6BB5\u4E0D\u63D0\u4EA4\u3002": "Memory behaviour is written to the official integration's config scope and the auth reference to this plugin's config. Cached workspaces may need reinitialization; a save is not guaranteed to apply on the next turn and never restarts anything automatically. Unchanged fields are not submitted.",
  "\u4F5C\u7528\u57DF": "Scope",
  "\u4FEE\u6539\u5B57\u6BB5": "Changed fields",
  " \u4E2A": " items",
  "\u6062\u590D\u7EE7\u627F": "Back to inherit",
  "API \u51ED\u636E\u53D8\u66F4": "API credential change",
  "\u8BBE\u7F6E\u5DF2\u4FDD\u5B58\u3002": "Settings saved.",
  "\u8BB0\u5FC6\u4E0E\u9690\u79C1\u8BBE\u7F6E": "Memory and privacy settings",
  "\u914D\u7F6E\u4F5C\u7528\u57DF": "Config scope",
  "\u672C\u63D2\u4EF6\uFF08dsh\uFF09": "This plugin (dsh)",
  "\u5168\u5C40\uFF08global\uFF09": "Global (global)",
  "\u91CD\u65B0\u8BFB\u53D6": "Reload",
  "\u8FD0\u884C\u4E2D\u8FDB\u7A0B\u662F\u5426\u5DF2\u5E94\u7528\u8FD9\u4E9B\u8BBE\u7F6E\uFF1A\u672A\u77E5\uFF08\u91CD\u542F\u540E\u751F\u6548\uFF09\u3002": "Whether the running process applied these settings: unknown (they apply after a restart).",
  "\uFF08\u8986\u76D6\u751F\u6548\u503C\uFF09": " (override effective value)",
  "\u8986\u76D6\u751F\u6548\u503C\uFF08\u53D6\u6D88\u52FE\u9009\u5219\u6062\u590D\u7EE7\u627F\uFF09": "Override the effective value (unchecking restores inheritance)",
  "\u5F53\u524D\u751F\u6548\uFF1A": "Effective now:",
  "\uFF08\u6765\u6E90\uFF1A": " (source: ",
  "\uFF09": ")",
  "API \u51ED\u636E\u5F15\u7528": "API credential reference",
  "\u5BC6\u94A5\u672C\u4F53\u6C38\u4E0D\u663E\u793A\u3001\u4E5F\u4E0D\u5728\u6B64\u7F16\u8F91\uFF1B\u6B64\u5904\u4EC5\u914D\u7F6E\u51ED\u636E\u5F15\u7528\u6A21\u5F0F\u4E0E\u5F15\u7528\u540D\u3002": "The secret itself is never shown or edited here; this section only sets the credential reference mode and name.",
  "\u5F53\u524D\u6A21\u5F0F": "Current mode",
  "\u5F53\u524D\u5F15\u7528": "Current reference",
  "\u7ED1\u5B9A Base": "Bound base",
  "\u6765\u6E90": "Source",
  "\uFF08\u5DF2\u914D\u7F6E\uFF09": " (configured)",
  "\u51ED\u636E\u72B6\u6001\u672A\u77E5\u3002": "Credential state unknown.",
  "\u8BFB\u53D6\u8BBE\u7F6E\u540E\u663E\u793A\u3002": "Shown after the settings are read.",
  "\u51ED\u636E\u6A21\u5F0F": "Credential mode",
  "API \u51ED\u636E\u6A21\u5F0F": "API credential mode",
  "\u7EE7\u627F\uFF08\u6CBF\u7528\u5BBF\u4E3B\u914D\u7F6E\uFF09": "Inherit (use the host configuration)",
  "\u4E0D\u643A\u5E26\u51ED\u636E": "No credentials",
  "\u51ED\u636E\u5F15\u7528": "Credential reference",
  "\u5F15\u7528\u540D": "Reference name",
  "\u5BBF\u4E3B\u51ED\u636E\u5B58\u50A8\u4E2D\u7684\u5F15\u7528\u540D\uFF0C\u4E0D\u662F\u5BC6\u94A5\u672C\u8EAB\u3002": "The reference name in the host credential store, not the secret itself.",
  "API \u51ED\u636E\u5F15\u7528\u540D": "API credential reference name",
  "\u5C1A\u672A\u8BFB\u53D6\u8BBE\u7F6E": "Settings not read yet",
  "\u6709\u672A\u4FDD\u5B58\u7684\u66F4\u6539": "Unsaved changes",
  "\u4E0E\u5DF2\u4FDD\u5B58\u8BBE\u7F6E\u4E00\u81F4": "Matches the saved settings",
  "\u4FDD\u5B58\u8BBE\u7F6E": "Save settings",
  "\u5207\u6362\u4F5C\u7528\u57DF": "Switch scope",
  "\u5F53\u524D\u4F5C\u7528\u57DF\u6709\u672A\u4FDD\u5B58\u7684\u8349\u7A3F\u3002\u5207\u6362\u5230\u300C": 'The current scope has unsaved drafts. Switching to "',
  "\u300D\u5C06\u4E22\u5F03\u8FD9\u4E9B\u8349\u7A3F\u3002": '" discards them.',
  "\u7EE7\u7EED\u7F16\u8F91\uFF08\u4E0D\u5207\u6362\uFF09": "Keep editing (do not switch)",
  "\u653E\u5F03\u8349\u7A3F\u5E76\u5207\u6362": "Discard drafts and switch",
  "\u5E93\u914D\u7F6E\u8BFB\u53D6\u7ED3\u679C\u683C\u5F0F\u4E0D\u7B26\u5408\u9884\u671F\u3002": "The bank config response is malformed.",
  "\u4FDD\u5B58\u5E93\u7EA7\u914D\u7F6E\u8986\u76D6": "Save bank-level config overrides",
  "\u5C06\u6309\u5B57\u6BB5\u66F4\u65B0\u8BE5\u8BB0\u5FC6\u5E93\u7684\u914D\u7F6E\u8986\u76D6\uFF08null \u8868\u793A\u6062\u590D\u7EE7\u627F\uFF09\u3002\u57FA\u4E8E\u8BFB\u53D6\u65F6\u7684 revision \u505A\u4E50\u89C2\u5E76\u53D1\u6821\u9A8C\uFF1B\u82E5\u914D\u7F6E\u5DF2\u88AB\u4ED6\u4EBA\u4FEE\u6539\u5C06\u8FD4\u56DE 409\uFF0C\u9700\u8981\u91CD\u65B0\u8BFB\u53D6\u540E\u518D\u63D0\u4EA4\u3002": "Fields are updated individually for this bank's overrides (null restores inheritance). Optimistic concurrency compares the revision read earlier; if someone else changed the config the request returns 409 and must be re-read before submitting again.",
  "\u53D8\u66F4\u5B57\u6BB5": "Changed fields",
  "\u5E93\u7EA7\u914D\u7F6E\u5DF2\u4FDD\u5B58\u3002": "Bank-level config saved.",
  "\u91CD\u7F6E\u8BE5\u5E93\u5168\u90E8\u8986\u76D6": "Reset all overrides for this bank",
  "\u786E\u8BA4\u91CD\u7F6E": "Confirm reset",
  "\u5C06\u5220\u9664\u6B64\u5E93\u7684\u5168\u90E8\u914D\u7F6E\u8986\u76D6\uFF0C\u5305\u62EC\u672C\u9875\u672A\u5C55\u793A\u7684\u7B56\u7565\u4E0E Memory Defense\uFF1B\u6240\u6709\u5B57\u6BB5\u6062\u590D\u7EE7\u627F\u5168\u5C40/\u9ED8\u8BA4\u8BBE\u7F6E\u3002\u4E0D\u5220\u9664\u8BB0\u5FC6\u6B63\u6587\uFF0C\u4F46\u53EF\u80FD\u964D\u4F4E\u9632\u62A4\u6216\u6539\u53D8\u540E\u7EED\u884C\u4E3A\u3002\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002": "All config overrides for this bank are deleted, including policies and Memory Defense not shown on this page; every field falls back to the global/default setting. Memory content is not deleted, but protection may weaken or later behaviour may change. This cannot be undone.",
  "\u5F53\u524D\u8986\u76D6\u6570": "Current overrides",
  "\u8BE5\u5E93\u7684\u5168\u90E8\u8986\u76D6\u5DF2\u91CD\u7F6E\u3002": "All overrides for this bank were reset.",
  "\u5E93\u7EA7\u914D\u7F6E\uFF08\u6309\u5B57\u6BB5\u4FDD\u5B58\uFF09": "Bank-level config (saved per field)",
  "\u91CD\u7F6E\u5168\u90E8\u8986\u76D6\u2026": "Reset all overrides\u2026",
  "\u8BF7\u5148\u9009\u62E9\u8BB0\u5FC6\u5E93\u3002": "Pick a memory bank first.",
  "\uFF08\u8986\u76D6\uFF09": " (override)",
  "\u8986\u76D6\uFF08\u53D6\u6D88\u5219\u6062\u590D\u7EE7\u627F\uFF09": "Override (unchecking restores inheritance)",
  "\u5DF2\u8986\u76D6": "Overridden",
  "\u7EE7\u627F": "Inherited",
  "\u751F\u6548\u503C\uFF1A": "Effective value:",
  "\uFF08\u670D\u52A1\u7AEF\u6807\u8BB0\u4E3A\u4E0D\u53EF\u7F16\u8F91\uFF09": " (marked read-only by the server)",
  "\u6709 {0} \u4E2A\u5B57\u6BB5\u5F85\u4FDD\u5B58": "{0} fields to save",
  "\u4E0E\u670D\u52A1\u7AEF\u914D\u7F6E\u4E00\u81F4": "Matches the server configuration",
  "\u4FDD\u5B58\u53D8\u66F4\u5B57\u6BB5": "Save changed fields",
  "\u63D0\u53D6\u4EFB\u52A1\u8BF4\u660E": "Retain mission",
  "\u63D0\u53D6\u6A21\u5F0F": "Extraction mode",
  "\u81EA\u5B9A\u4E49\u63D0\u53D6\u6307\u4EE4": "Custom extraction instructions",
  "\u63D0\u53D6\u5206\u5757\u5927\u5C0F": "Retain chunk size",
  "\u5141\u8BB8\u81EA\u7531\u5B9E\u4F53\u6807\u7B7E": "Allow free-form entity labels",
  "\u8F93\u51FA\u8BED\u8A00": "Output language",
  "\u7279\u6027\u672A\u77E5\uFF1A\u8BF7\u5148\u5728\u300C\u8BCA\u65AD\u300D\u5206\u7C7B\u6210\u529F\u52A0\u8F7D\u8BCA\u65AD\u4FE1\u606F": 'Features unknown: load diagnostics successfully in the "Diagnostics" section first',
  "\u670D\u52A1\u7AEF\u672A\u542F\u7528 bank_llm_health \u7279\u6027": "The server did not enable the bank_llm_health feature",
  "\u9884\u89C8\u63D0\u793A\u8BCD": "Preview prompt",
  "\u8BFB\u53D6\u8BE5\u64CD\u4F5C\u5F53\u524D\u751F\u6548\u7684\u63D0\u793A\u8BCD\u7EC4\u6210\uFF08\u4E0D\u8C03\u7528 LLM\u3001\u4E0D\u4EA7\u751F\u8D39\u7528\uFF09\u3002": "Read the prompt composition currently in effect for this operation (no LLM call, no charges).",
  "\u5019\u9009\u6587\u672C\u4E0D\u80FD\u4E3A\u7A7A\u3002": "Candidate text cannot be empty.",
  "\u5E72\u8DD1\u63D0\u53D6\uFF08\u8C03\u7528 LLM\uFF09": "Dry-run extraction (calls the LLM)",
  "\u5C06\u7528\u5019\u9009\u6587\u672C\u8C03\u7528\u4E00\u6B21\u771F\u5B9E LLM \u63D0\u53D6\uFF08\u4E0D\u5199\u5165\u8BB0\u5FC6\u5E93\uFF09\uFF0C\u4F1A\u4EA7\u751F LLM \u8C03\u7528\u8D39\u7528\u3002": "One real LLM extraction runs on the candidate text (nothing is written to the bank) and incurs LLM charges.",
  "\u6587\u672C\u957F\u5EA6": "Text length",
  "{0} \u4E2A\u5B57\u7B26": "{0} characters",
  "\u5019\u9009\u5B57\u6BB5\u8986\u76D6": "Candidate field overrides",
  "LLM \u8FDE\u901A\u6027\u68C0\u6D4B": "LLM connectivity check",
  "\u5C06\u5BF9 retain / consolidation / reflect \u4E09\u4E2A\u64CD\u4F5C\u5404\u53D1\u8D77\u4E00\u6B21\u771F\u5B9E LLM \u63A2\u6D4B\u8C03\u7528\uFF0C\u4F1A\u4EA7\u751F\u5C11\u91CF LLM \u8C03\u7528\u8D39\u7528\u3002\u7ED3\u679C\u53EA\u5305\u542B\u72B6\u6001\uFF0C\u4E0D\u66B4\u9732 provider/\u6A21\u578B/\u7AEF\u70B9\u3002": "One real LLM probe is sent for each of retain, consolidation and reflect, incurring small LLM charges. The result contains status only and exposes no provider, model or endpoint.",
  "\u6A21\u578B\u8C03\u8BD5\u76EE\u6807": "Model debugging target",
  "\u63D0\u793A\u8BCD\u9884\u89C8": "Prompt preview",
  "\u9884\u89C8": "Preview",
  "\u9884\u89C8\u64CD\u4F5C": "Preview operation",
  "retain\uFF08\u63D0\u53D6\uFF09": "retain (extraction)",
  "consolidation\uFF08\u6574\u7406\uFF09": "consolidation (merge)",
  "reflect\uFF08\u53CD\u601D\uFF09": "reflect (reflection)",
  "\u7B56\u7565\u540D\uFF08\u53EF\u9009\uFF09": "Policy name (optional)",
  "\u8BE5\u64CD\u4F5C\u5F53\u524D\u88AB\u8DF3\u8FC7\uFF1A": "This operation is currently skipped:",
  "\u53EF\u7528\u7B56\u7565\uFF1A": "Available policies:",
  "\uFF1B\u5F53\u524D\uFF1A": "; current:",
  "\u672A\u77E5\u89D2\u8272": "unknown role",
  "\u505C\u7528": "Inactive",
  "\u53EF\u8986\u76D6": "Overridable",
  "\uFF08\u7A7A\u5757\uFF09": "(empty block)",
  "\u54CD\u5E94\u4E2D\u6CA1\u6709 messages\u3002": "The response has no messages.",
  "\u8FD0\u884C\u8BBE\u7F6E": "Runtime setting",
  "\u751F\u6548\u503C": "Effective value",
  "\uFF08\u672A\u8BBE\u7F6E\uFF09": "(not set)",
  "\u54CD\u5E94 schema\uFF1A": "Response schema:",
  "\u5B58\u5728\uFF08": "present (",
  " \u4E2A\u9876\u5C42\u952E\uFF09": " top-level keys)",
  "\u65E0": "None",
  "\u9009\u62E9\u64CD\u4F5C\u540E\u70B9\u51FB\u300C\u9884\u89C8\u300D\u3002": "Pick an operation, then click Preview.",
  "\u5E72\u8DD1\u63D0\u53D6\uFF08\u5019\u9009\u5B57\u6BB5 + \u8D39\u7528\u786E\u8BA4\uFF09": "Dry-run extraction (candidate fields + cost confirmation)",
  "\u5E72\u8DD1": "Dry run",
  "\u5019\u9009\u6587\u672C": "Candidate text",
  "\u5E72\u8DD1\u5019\u9009\u6587\u672C": "Dry-run candidate text",
  "\u8981\u7528 LLM \u8BD5\u63D0\u53D6\u7684\u6587\u672C\uFF08\u4E0D\u4F1A\u5199\u5165\u8BB0\u5FC6\u5E93\uFF09": "Text to trial-extract with the LLM (nothing is written to the bank)",
  "\u4E0A\u4E0B\u6587\uFF08\u53EF\u9009\uFF09": "Context (optional)",
  "\u5E72\u8DD1\u4E0A\u4E0B\u6587": "Dry-run context",
  "\u7B56\u7565\uFF08\u53EF\u9009\uFF09": "Policy (optional)",
  "\u5E72\u8DD1\u7B56\u7565\u540D": "Dry-run policy name",
  "\uFF08\u672C\u6B21\u8986\u76D6\uFF09": " (overridden here)",
  "\u672C\u6B21\u8986\u76D6": "Override here",
  "Token \u7528\u91CF\uFF1A\u8F93\u5165 {0}\uFF0C\u8F93\u51FA {1}\uFF0C\u603B\u8BA1 {2}": "Tokens: input {0}, output {1}, total {2}",
  "\uFF0C\u7F13\u5B58 {0}": ", cached {0}",
  "\u63D0\u53D6\u5230 {0} \u6761\u5019\u9009\u4E8B\u5B9E\uFF08{1} \u4E2A\u5206\u5757\uFF09\uFF0C\u672A\u5199\u5165\u8BB0\u5FC6\u5E93\u3002": "Extracted {0} candidate facts ({1} chunks); nothing was written to the bank.",
  "\u5B9E\u4F53\uFF1A": "Entities:",
  "\u68C0\u6D4B": "Check",
  "\uFF0C\u68C0\u6D4B\u4E0D\u53EF\u7528\u3002": ", the check is unavailable.",
  "\u7ED3\u679C": "Result",
  "\u5EF6\u8FDF": "Latency",
  "\u8FDE\u901A": "Reachable",
  "\u72B6\u6001\u6682\u65F6\u672A\u77E5\uFF1A": "Status temporarily unknown:",
  "\uFF08\u7EE7\u7EED\u8F6E\u8BE2\uFF0C\u4E0D\u81EA\u52A8\u91CD\u505A\uFF09": " (still polling; nothing is redone automatically)",
  "\u6DFB\u52A0\u522B\u540D": "Add alias",
  "\u8BBE\u4E3A\u4E3B\u663E\u522B\u540D": "Make primary alias",
  "\u53D6\u6D88\u4E3B\u663E\u522B\u540D": "Clear primary alias",
  "\u79FB\u9664\u522B\u540D": "Remove alias",
  "\u5C06\u79FB\u9664\u8BE5\u522B\u540D\uFF1B\u5F15\u7528\u65E7\u522B\u540D\u7684\u8BF7\u6C42\u5C06\u4E0D\u518D\u8DEF\u7531\u5230\u8BE5\u5E93\u3002": "The alias is removed; requests that reference it no longer route to this bank.",
  "\u5C06\u66F4\u65B0\u8BE5\u8BB0\u5FC6\u5E93\u7684\u522B\u540D\u8DEF\u7531\u3002": "The alias routing for this bank is updated.",
  "\u522B\u540D": "Alias",
  "\u5BFC\u51FA\u8BB0\u5FC6\u5E93\uFF08\u5F02\u6B65\uFF09": "Export memory bank (async)",
  "\u5C06\u63D0\u4EA4\u4E00\u6B21\u5F02\u6B65\u5BFC\u51FA\uFF0C\u4EA7\u51FA ZIP \u5F52\u6863\u3002202 \u4EC5\u4EE3\u8868\u5DF2\u53D7\u7406\uFF1A\u4EFB\u52A1\u5B8C\u6210\u540E\u624D\u80FD\u4E0B\u8F7D\u3002\u5D4C\u5165\u5411\u91CF\u4E0E\u5185\u90E8 ID \u4E0D\u4F1A\u968F\u5F52\u6863\u5BFC\u51FA\u3002": "An asynchronous export is submitted and produces a ZIP archive. 202 only means accepted: the archive can be downloaded once the operation finishes. Embedding vectors and internal ids are not exported.",
  "\u5BFC\u51FA": "Export",
  "\u6587\u4EF6\u8D85\u8FC7 {0} \u4E0A\u4F20\u4E0A\u9650\u3002": "The file exceeds the {0} upload limit.",
  "\u6587\u4EF6\u8FC7\u5C0F\uFF0C\u4E0D\u662F\u6709\u6548\u7684 ZIP \u5F52\u6863\u3002": "The file is too small to be a valid ZIP archive.",
  "\u6587\u4EF6\u4E0D\u662F ZIP \u5F52\u6863\uFF08\u7F3A\u5C11 PK \u6587\u4EF6\u5934\uFF09\u3002": "The file is not a ZIP archive (missing the PK header).",
  "\u5F53\u524D\u73AF\u5883\u65E0\u6CD5\u8BA1\u7B97 SHA-256 \u6307\u7EB9\uFF08\u9700\u8981\u5B89\u5168\u4E0A\u4E0B\u6587\uFF09\uFF0C\u65E0\u6CD5\u4E0A\u4F20\u3002": "This environment cannot compute a SHA-256 fingerprint (a secure context is required), so uploading is unavailable.",
  "\u8BFB\u53D6\u6587\u4EF6\u5931\u8D25\uFF1A": "Could not read the file:",
  "\u8BF7\u5148\u9009\u62E9\u6709\u6548\u7684 ZIP \u5F52\u6863\u3002": "Pick a valid ZIP archive first.",
  "restore \u6A21\u5F0F\u5FC5\u987B\u586B\u5199\u76EE\u6807\u8BB0\u5FC6\u5E93 ID\u3002": "restore mode requires a target memory bank id.",
  "\u5BFC\u5165 ZIP \u5F52\u6863\uFF08\u5F02\u6B65\uFF09": "Import ZIP archive (async)",
  "\u5C06\u4E0A\u4F20\u5F52\u6863\u5E76\u63D0\u4EA4\u5F02\u6B65\u5BFC\u5165\u3002\u4E8B\u5B9E\u4F1A\u4EE5\u76EE\u6807\u5E93\u7684\u5D4C\u5165\u6A21\u578B\u91CD\u65B0\u5D4C\u5165\u5E76\u91CD\u65B0\u89E3\u6790\u5B9E\u4F53\uFF1B\u4E0D\u8C03\u7528 LLM \u63D0\u53D6\u3001\u4E0D\u865A\u6784\u65B0\u4E8B\u5B9E\u3002202 \u4EC5\u4EE3\u8868\u5DF2\u53D7\u7406\u3002\u6587\u4EF6\u5927\u5C0F\u4E0E SHA-256 \u6307\u7EB9\u5DF2\u7ED1\u5B9A\u8FDB\u786E\u8BA4\u4EE4\u724C\u3002": "The archive is uploaded and an asynchronous import is submitted. Facts are re-embedded with the target bank's embedding model and entities are re-parsed; no LLM extraction runs and no facts are invented. 202 only means accepted. The file size and the SHA-256 fingerprint are bound into the confirmation token.",
  "\u4EFB\u52A1\u6240\u5C5E\u5E93": "Bank of the operation",
  "\u6587\u4EF6": "File",
  "\u6A21\u5F0F": "Mode",
  "merge\uFF08\u51B2\u7A81\uFF1A": "merge (conflicts:",
  "\u5BFC\u5165": "Import",
  "\u76EE\u6807\u8BB0\u5FC6\u5E93 ID \u4E0D\u80FD\u4E3A\u7A7A\u3002": "The target memory bank id cannot be empty.",
  "\u76EE\u6807\u8BB0\u5FC6\u5E93 ID \u4E0D\u80FD\u4E0E\u6E90\u5E93\u76F8\u540C\u3002": "The target memory bank id cannot equal the source bank.",
  "\u514B\u9686\u8BB0\u5FC6\u5E93\uFF08\u5F02\u6B65\uFF09": "Clone memory bank (async)",
  "\u5C06\u628A\u8BE5\u5E93\u590D\u5236\u4E3A\u4E00\u4E2A\u65B0\u5E93\uFF08\u4E0D\u91CD\u65B0\u63D0\u53D6\u3001\u4E0D\u8C03\u7528 LLM\uFF0C\u4E8B\u5B9E\u91CD\u65B0\u5D4C\u5165\u5E76\u91CD\u65B0\u89E3\u6790\u5B9E\u4F53\uFF09\u3002": "The bank is copied into a new bank (no re-extraction, no LLM calls; facts are re-embedded and entities re-parsed).",
  "\u6CE8\u610F\uFF1A\u968F\u914D\u7F6E\u4E00\u5E76\u590D\u5236\u7684 webhook \u4F1A\u6307\u5411\u6E90\u5E93\u7684 webhook \u7AEF\u70B9\u3002": "Note: webhooks copied with the configuration still point at the source bank's endpoints.",
  "\u6E90\u5E93": "Source bank",
  "\u76EE\u6807\u5E93": "Target bank",
  "\u514B\u9686\u5230 {0}": "Clone into {0}",
  "\u4E0B\u8F7D\u5BFC\u51FA\u5F52\u6863": "Download the export archive",
  "\u5C06\u901A\u8FC7\u540C\u6E90\u6865\u63A5\u4E0B\u8F7D\u8BE5\u5BFC\u51FA\u4EFB\u52A1\u4EA7\u51FA\u7684 ZIP \u5F52\u6863\uFF08\u4E0A\u9650 ": "The ZIP archive produced by this export is downloaded through the same-origin bridge (limit ",
  "\uFF09\uFF1B\u4E0A\u6E38\u4E0B\u8F7D\u5730\u5740\u4E0E\u51ED\u636E\u4E0D\u4F1A\u66B4\u9732\u5230\u9875\u9762\u3002": "); upstream download addresses and credentials are never exposed to the page.",
  "\u786E\u8BA4\u4E0B\u8F7D": "Confirm download",
  "\u53D6\u6D88\u5F02\u6B65\u4EFB\u52A1": "Cancel the async operation",
  "\u5C06\u8BF7\u6C42\u53D6\u6D88\u8BE5\u5F02\u6B65\u4EFB\u52A1\uFF1B\u5DF2\u5F00\u59CB\u6267\u884C\u7684\u90E8\u5206\u65E0\u6CD5\u56DE\u6EDA\u3002": "Cancellation is requested for this async operation; work already started cannot be rolled back.",
  "\u514B\u9686\u9700\u8981\u5BFC\u51FA\u80FD\u529B\uFF1A": "Cloning requires export capability:",
  "\u514B\u9686\u9700\u8981\u5BFC\u5165\u80FD\u529B\uFF1A": "Cloning requires import capability:",
  "\u9AD8\u7EA7\u64CD\u4F5C\u76EE\u6807": "Advanced operation target",
  "\u5237\u65B0\u522B\u540D": "Refresh aliases",
  "\u522B\u540D\u8BFB\u53D6\u5931\u8D25\uFF1A": "Alias read failed:",
  "\u8BE5\u5E93\u6682\u65E0\u522B\u540D\u3002": "This bank has no aliases.",
  "\u4E3B\u663E": "Primary",
  "\u666E\u901A": "Regular",
  "\u53D6\u6D88\u4E3B\u663E": "Clear primary",
  "\u8BBE\u4E3A\u4E3B\u663E": "Make primary",
  "\u79FB\u9664": "Remove",
  "\u9009\u62E9\u8BB0\u5FC6\u5E93\u540E\u81EA\u52A8\u8BFB\u53D6\u522B\u540D\u3002": "Aliases load automatically once a memory bank is selected.",
  "\u65B0\u589E\u522B\u540D": "New alias",
  "\u65B0\u522B\u540D": "New alias",
  "UTF-8 \u540D\u79F0\uFF08\u53EF\u4E2D\u6587\uFF09": "UTF-8 name (Chinese is fine)",
  "\u540C\u65F6\u8BBE\u4E3A\u4E3B\u663E": "Also make it primary",
  "\u6DFB\u52A0\u2026": "Add\u2026",
  "\u2264192 \u5B57\u8282\uFF08UTF-8\uFF09\uFF0C\u4E0D\u542B\u63A7\u5236\u5B57\u7B26\u4E0E\u659C\u6760\uFF0C\u4E0D\u80FD\u662F\u8DEF\u5F84\u7247\u6BB5\u3002": "\u2264192 bytes (UTF-8), no control characters or slashes, and not a path segment.",
  "\u5BFC\u51FA\uFF08\u5F02\u6B65 ZIP\uFF09": "Export (async ZIP)",
  "\u63D0\u4EA4\u5BFC\u51FA\u2026": "Submit export\u2026",
  "\u5305\u542B\u6570\u636E\uFF08\u6587\u6863/\u4E8B\u5B9E/\u89C2\u5BDF/\u9644\u4EF6/\u64CD\u4F5C\u65E5\u5FD7\uFF09": "Include data (documents/facts/observations/attachments/operation log)",
  "\u5305\u542B\u5E93\u914D\u7F6E": "Include bank config",
  "\u5305\u542B\u5386\u53F2\uFF08audit_log / llm_requests\uFF09": "Include history (audit_log / llm_requests)",
  "\u5BFC\u5165\uFF08ZIP \u4E0A\u4F20\uFF09": "Import (ZIP upload)",
  "\u4E0A\u4F20\u5E76\u5BFC\u5165\u2026": "Upload and import\u2026",
  "\u5BFC\u5165\uFF08\u542B restore\uFF09\u8981\u6C42\u4EFB\u52A1\u8BB0\u5F55\u5E93\u5DF2\u5B58\u5728\uFF1Arestore \u7684 URL \u8BB0\u5F55\u5E93\u5FC5\u987B\u5DF2\u5B58\u5728\u3001\u76EE\u6807\u5E93\u5FC5\u987B\u4E0D\u5B58\u5728\uFF0C\u670D\u52A1\u7AEF\u4E0D\u4F1A\u81EA\u52A8\u521B\u5EFA\u8BB0\u5F55\u5E93\u3002 \u5F53\u524D\u6CA1\u6709\u53EF\u7528\u8BB0\u5FC6\u5E93\u65F6\uFF0C\u8BF7\u5148\u901A\u8FC7\u5B98\u65B9\u5165\u53E3\u521B\u5EFA\u4E00\u4E2A\u5E93\uFF0C\u518D\u56DE\u5230\u6B64\u5904\u5BFC\u5165\u3002": "Import (including restore) requires the operation-record bank to exist: for restore the URL record bank must already exist while the target bank must not, because the server never creates the record bank. If no memory bank is available, create one through the official entry point and come back here.",
  "restore\uFF08\u6062\u590D\u5230\u65B0\u5E93\uFF09": "restore (into a new bank)",
  "merge\uFF08\u5408\u5E76\u8FDB\u6240\u9009\u5E93\uFF09": "merge (into the selected bank)",
  "\u76EE\u6807\u5E93 ID": "Target bank id",
  "restore \u4F1A\u5728\u8BE5 ID \u4E0B\u521B\u5EFA\u65B0\u5E93\uFF1B\u4E0D\u80FD\u662F\u5DF2\u5B58\u5728\u7684\u5E93\u3002": "restore creates a new bank under this id; it must not already exist.",
  "\u5BFC\u5165\u76EE\u6807\u5E93 ID": "Import target bank id",
  "\u5305\u542B\u6570\u636E": "Include data",
  "\u5305\u542B\u5386\u53F2": "Include history",
  "\u51B2\u7A81\u5904\u7406": "Conflict handling",
  "\u6587\u6863\u51B2\u7A81\u5904\u7406": "Document conflict handling",
  "skip\uFF08\u8DF3\u8FC7\u5DF2\u5B58\u5728\u6587\u6863\uFF09": "skip (skip existing documents)",
  "replace\uFF08\u66FF\u6362\u5DF2\u5B58\u5728\u6587\u6863\uFF09": "replace (replace existing documents)",
  "new-id\uFF08\u4EE5\u65B0 ID \u5BFC\u5165\uFF09": "new-id (import with new ids)",
  "ZIP \u5F52\u6863": "ZIP archive",
  "\uFF1B\u6D4F\u89C8\u5668\u672C\u5730\u6821\u9A8C\u6587\u4EF6\u5934\u5E76\u8BA1\u7B97 SHA-256\uFF0C\u6307\u7EB9\u968F\u786E\u8BA4\u4EE4\u724C\u7ED1\u5B9A\u3002": "; the browser checks the file header and computes SHA-256 locally, and the fingerprint is bound to the confirmation token.",
  "\u9009\u62E9 ZIP \u5F52\u6863": "Choose a ZIP archive",
  "\u6B63\u5728\u8BA1\u7B97 SHA-256 \u6307\u7EB9\u2026": "Computing the SHA-256 fingerprint\u2026",
  "\u5DF2\u5C31\u7EEA\uFF1A{0}\uFF08{1}\uFF09\uFF0CSHA-256 {2}\u2026": "Ready: {0} ({1}), SHA-256 {2}\u2026",
  "\u514B\u9686\uFF08\u5F02\u6B65\uFF09": "Clone (async)",
  "\u63D0\u4EA4\u514B\u9686\u2026": "Submit clone\u2026",
  "\u5728\u8BE5 ID \u4E0B\u521B\u5EFA\u6E90\u5E93\u7684\u526F\u672C\uFF1B\u4E0D\u80FD\u662F\u5DF2\u5B58\u5728\u7684\u5E93\u3002": "Creates a copy of the source bank under this id; it must not already exist.",
  "\u514B\u9686\u76EE\u6807\u5E93 ID": "Clone target bank id",
  "\u5305\u542B\u5E93\u914D\u7F6E\uFF08\u542B webhook\uFF09": "Include bank config (with webhooks)",
  "\u5DF2\u63D0\u4EA4\u7684\u5F02\u6B65\u4EFB\u52A1": "Submitted async operations",
  "\u672C\u4F1A\u8BDD\u5C1A\u672A\u63D0\u4EA4\u5BFC\u51FA/\u5BFC\u5165/\u514B\u9686\u4EFB\u52A1\u3002202 \u53D7\u7406\u7684\u4EFB\u52A1\u4F1A\u51FA\u73B0\u5728\u8FD9\u91CC\u5E76\u81EA\u52A8\u8F6E\u8BE2\u5230\u7EC8\u6001\u3002": "No export, import or clone has been submitted in this session. Operations accepted with 202 appear here and are polled to their final state.",
  "\u5E93\uFF1A": "Bank:",
  "\u4E0B\u8F7D\u5F52\u6863\u2026": "Download archive\u2026",
  "\u53D6\u6D88\u4EFB\u52A1\u2026": "Cancel operation\u2026",
  "\u4EFB\u52A1\u5DF2\u5B8C\u6210\u3002": "Operation completed.",
  "\u80FD\u529B\u672A\u77E5\uFF1A\u8BF7\u5148\u5728\u300C\u8BCA\u65AD\u300D\u5206\u7C7B\u6210\u529F\u52A0\u8F7D\u8BCA\u65AD\u4FE1\u606F": 'Capability unknown: load diagnostics successfully in the "Diagnostics" section first',
  "\u670D\u52A1\u7AEF\u672A\u58F0\u660E\u8BE5\u80FD\u529B": "The server did not declare this capability",
  "API \u76EE\u6807\u5DF2\u53D8\u66F4\uFF0C\u672C\u6B21\u786E\u8BA4\u5DF2\u4F5C\u5E9F\uFF0C\u8BF7\u91CD\u65B0\u53D1\u8D77\u64CD\u4F5C\u3002": "The API target changed, so this confirmation is void; start the operation again.",
  "\u6B63\u5728\u8BF7\u6C42\u786E\u8BA4\u4EE4\u724C\u2026": "Requesting the confirmation token\u2026",
  "\u786E\u8BA4\u4EE4\u724C\u54CD\u5E94\u4E0E\u76EE\u6807\u4E0D\u4E00\u81F4\uFF0C\u64CD\u4F5C\u5DF2\u4E2D\u6B62\u3002": "The confirmation token does not match the target; the operation was aborted.",
  "\u5BBF\u4E3B\u672A\u8FD4\u56DE\u6709\u6548\u7684\u786E\u8BA4\u4EE4\u724C\uFF0C\u64CD\u4F5C\u672A\u6267\u884C\u3002": "The host returned no valid confirmation token; nothing was executed.",
  "\u6B63\u5728\u4E0B\u8F7D\u2026": "Downloading\u2026",
  "\u6B63\u5728\u4E0A\u4F20\u2026": "Uploading\u2026",
  "\u6B63\u5728\u6267\u884C\u2026": "Executing\u2026",
  "\u8BCA\u65AD\u4E0E\u4EFB\u52A1\u961F\u5217": "Diagnostics and operation queue",
  "\u5E93\u7EA7\u914D\u7F6E": "Bank-level config",
  "\u6A21\u578B\u8C03\u8BD5": "Model debugging",
  "\u9AD8\u7EA7\u8FC1\u79FB\u4E0E\u522B\u540D": "Advanced migration and aliases",
  "\u53CD\u601D\u4EFB\u52A1\u8BF4\u660E": "Reflect mission",
  "\u89C2\u5BDF\u4EFB\u52A1\u8BF4\u660E": "Observations mission",
  "\u9ED8\u8BA4\u63D0\u53D6\u7B56\u7565": "Default retain policy",
  "\u63D0\u53D6\u7B56\u7565 JSON": "Retain policies JSON",
  "\u6574\u7406\u7B56\u7565 JSON": "Consolidation policies JSON",
  "\u5B9E\u4F53\u6807\u7B7E JSON": "Entity labels JSON",
  "\u81EA\u52A8\u6574\u7406": "Auto consolidation",
  "\u89C2\u5BDF": "Observations",
  "\u6587\u672C\u68C0\u7D22": "Text search",
  "\u56FE\u68C0\u7D22": "Graph retrieval",
  "\u65F6\u95F4\u68C0\u7D22": "Temporal retrieval",
  "\u91CD\u6392\u5E8F": "Reranking",
  "\u6B64\u8BB0\u5FC6\u5E93\u5BA1\u8BA1": "Audit this bank",
  "\u68C0\u7D22\u9884\u7B97\u4E0B\u9650": "Recall budget minimum",
  "\u68C0\u7D22\u9884\u7B97\u4E0A\u9650": "Recall budget maximum",
  "\u6000\u7591\u5EA6": "Skepticism",
  "\u5B57\u9762\u503E\u5411": "Literalism",
  "\u5171\u60C5\u5EA6": "Empathy",
  "\u81EA\u52A8\u6CE8\u5165\u65B9\u5F0F": "Auto-inject mode",
  "\u5199\u56DE\u4F1A\u8BDD": "Write back sessions",
  "Git \u5165\u5E93\u5185\u5BB9": "Git ingest content",
  "\u9996\u6B21 Git \u64AD\u79CD": "First Git seeding",
  "\u9996\u6B21\u64AD\u79CD\u63D0\u4EA4\u6570": "First seeding commit count",
  "\u4EC5\u83B7\u51C6\u76EE\u5F55\u542F\u7528": "Only in allowed directories",
  "\u83B7\u51C6\u76EE\u5F55\uFF08\u6BCF\u884C\u4E00\u4E2A\uFF09": "Allowed directories (one per line)",
  "\u52D8\u5BDF\u9884\u7B97\uFF08USD\uFF09": "Survey budget (USD)",
  "\u52D8\u5BDF\u5237\u65B0\u63D0\u4EA4\u9608\u503C": "Survey refresh commit threshold",
  "\u65B0\u77E5\u8BC6\u9875\u5237\u65B0\u65B9\u5F0F": "New knowledge page refresh",
  "\u65B0\u77E5\u8BC6\u9875 Cron\uFF08\u652F\u6301 H\uFF09": "New knowledge page cron (supports H)",
  "\u77E5\u8BC6\u9875\u641C\u7D22\u4E0A\u9650": "Knowledge page search limit",
  "\u81EA\u52A8\u53CD\u601D\u8D85\u65F6\uFF08ms\uFF09": "Auto reflection timeout (ms)",
  "\u5DE5\u5177\u53CD\u601D\u8D85\u65F6\uFF08ms\uFF09": "Tool reflection timeout (ms)"
};

// src/client/i18n.js
var LOCALES = [
  { value: "zh", label: "\u4E2D\u6587" },
  { value: "en", label: "English" }
];
var STORAGE_KEY = "dsh-hindsight-gui.locale";
var SUPPORTED = LOCALES.map((entry) => entry.value);
var listeners = /* @__PURE__ */ new Set();
var current = null;
function normalize(value) {
  if (typeof value !== "string") return null;
  const lower = value.toLowerCase();
  if (lower === "zh" || lower.startsWith("zh-") || lower.startsWith("zh_")) return "zh";
  if (lower === "en" || lower.startsWith("en-") || lower.startsWith("en_")) return "en";
  return null;
}
function safeStorage() {
  try {
    if (typeof window !== "undefined" && window !== null && window.localStorage) return window.localStorage;
  } catch {
  }
  return null;
}
function storedLocale() {
  const store = safeStorage();
  if (!store) return null;
  try {
    const value = store.getItem(STORAGE_KEY);
    return SUPPORTED.includes(value) ? value : null;
  } catch {
    return null;
  }
}
function browserLocale() {
  if (typeof navigator === "undefined" || navigator === null) return null;
  const languages = Array.isArray(navigator.languages) && navigator.languages.length > 0 ? navigator.languages : [navigator.language];
  for (const language of languages) {
    const normalized = normalize(language);
    if (normalized) return normalized === "zh" ? "zh" : "en";
    if (typeof language === "string" && language !== "") return "en";
  }
  return null;
}
function getLocale() {
  if (current === null) current = storedLocale() ?? browserLocale() ?? "zh";
  return current;
}
function setLocale(next) {
  const normalized = normalize(next) ?? (SUPPORTED.includes(next) ? next : null);
  if (normalized === null || normalized === getLocale()) return getLocale();
  current = normalized;
  const store = safeStorage();
  if (store) {
    try {
      store.setItem(STORAGE_KEY, normalized);
    } catch {
    }
  }
  for (const listener of [...listeners]) {
    try {
      listener();
    } catch {
    }
  }
  return current;
}
function subscribeLocale(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
function useLocale() {
  const [locale, setLocal] = (0, import_react.useState)(getLocale);
  (0, import_react.useEffect)(() => subscribeLocale(() => setLocal(getLocale())), []);
  return locale;
}
function substitute(text, values) {
  if (values === void 0 || values.length === 0) return text;
  return text.replace(/\{(\d+)\}/g, (match, index) => {
    const value = values[Number(index)];
    return value === void 0 || value === null ? match : String(value);
  });
}
function t(text, ...values) {
  if (typeof text !== "string") return text;
  const source = getLocale() === "en" ? EN[text] ?? text : text;
  return substitute(source, values);
}
function tf(pattern, values) {
  if (typeof pattern !== "string") return pattern;
  const source = getLocale() === "en" ? EN[pattern] ?? pattern : pattern;
  return substitute(source, Array.isArray(values) ? values : []);
}

// src/client/ManagementPanel.tsx
var import_react2 = require("react");

// lib/management-contracts.js
var MANAGEMENT_URL = "/plugins/dsh-hindsight-gui/manage";
var UPLOAD_URL = "/plugins/dsh-hindsight-gui/manage/upload";
var READ_OPERATIONS = ["diagnostics", "settings", "stats", "operations", "operation", "bankConfig", "aliases"];
var COST_OPERATIONS = ["operationRetry", "dryRun", "llmTest", "transferImport", "clone"];
var UPLOAD_LIMIT = 50 * 1024 * 1024;
var DOWNLOAD_LIMIT = 500 * 1024 * 1024;
var BANK_FIELDS = {
  retain_mission: { label: "\u63D0\u53D6\u4EFB\u52A1\u8BF4\u660E", kind: "text" },
  reflect_mission: { label: "\u53CD\u601D\u4EFB\u52A1\u8BF4\u660E", kind: "text" },
  observations_mission: { label: "\u89C2\u5BDF\u4EFB\u52A1\u8BF4\u660E", kind: "text" },
  retain_extraction_mode: { label: "\u63D0\u53D6\u6A21\u5F0F", kind: "choice", choices: ["concise", "verbose", "custom", "verbatim", "chunks"] },
  retain_custom_instructions: { label: "\u81EA\u5B9A\u4E49\u63D0\u53D6\u6307\u4EE4", kind: "text" },
  retain_default_strategy: { label: "\u9ED8\u8BA4\u63D0\u53D6\u7B56\u7565", kind: "text" },
  retain_strategies: { label: "\u63D0\u53D6\u7B56\u7565 JSON", kind: "json" },
  consolidation_strategies: { label: "\u6574\u7406\u7B56\u7565 JSON", kind: "json" },
  entity_labels: { label: "\u5B9E\u4F53\u6807\u7B7E JSON", kind: "json" },
  entities_allow_free_form: { label: "\u5141\u8BB8\u81EA\u7531\u5B9E\u4F53\u6807\u7B7E", kind: "boolean" },
  enable_auto_consolidation: { label: "\u81EA\u52A8\u6574\u7406", kind: "boolean" },
  enable_observations: { label: "\u89C2\u5BDF", kind: "boolean" },
  enable_text_search: { label: "\u6587\u672C\u68C0\u7D22", kind: "boolean" },
  enable_graph_retrieval: { label: "\u56FE\u68C0\u7D22", kind: "boolean" },
  enable_temporal_retrieval: { label: "\u65F6\u95F4\u68C0\u7D22", kind: "boolean" },
  enable_reranking: { label: "\u91CD\u6392\u5E8F", kind: "boolean" },
  audit_log_enabled: { label: "\u6B64\u8BB0\u5FC6\u5E93\u5BA1\u8BA1", kind: "boolean" },
  recall_budget_min: { label: "\u68C0\u7D22\u9884\u7B97\u4E0B\u9650", kind: "integer", min: 1 },
  recall_budget_max: { label: "\u68C0\u7D22\u9884\u7B97\u4E0A\u9650", kind: "integer", min: 1 },
  retain_chunk_size: { label: "\u63D0\u53D6\u5206\u5757\u5927\u5C0F", kind: "integer", min: 1 },
  disposition_skepticism: { label: "\u6000\u7591\u5EA6", kind: "integer", min: 1, max: 5 },
  disposition_literalism: { label: "\u5B57\u9762\u503E\u5411", kind: "integer", min: 1, max: 5 },
  disposition_empathy: { label: "\u5171\u60C5\u5EA6", kind: "integer", min: 1, max: 5 }
};
var MEMORY_FIELDS = {
  autoInject: { label: "\u81EA\u52A8\u6CE8\u5165\u65B9\u5F0F", kind: "choice", choices: ["reflect", "recall", "pages", "none"], default: "reflect" },
  retainSessions: { label: "\u5199\u56DE\u4F1A\u8BDD", kind: "boolean", default: true },
  gitIngest: { label: "Git \u5165\u5E93\u5185\u5BB9", kind: "choice", choices: ["message", "full", "none"], default: "message" },
  autoSeed: { label: "\u9996\u6B21 Git \u64AD\u79CD", kind: "boolean", default: true },
  seedLimit: { label: "\u9996\u6B21\u64AD\u79CD\u63D0\u4EA4\u6570", kind: "integer", min: 1, default: 300 },
  optInOnly: { label: "\u4EC5\u83B7\u51C6\u76EE\u5F55\u542F\u7528", kind: "boolean", default: false },
  optInPaths: { label: "\u83B7\u51C6\u76EE\u5F55\uFF08\u6BCF\u884C\u4E00\u4E2A\uFF09", kind: "lines", default: [] },
  surveyBudgetUsd: { label: "\u52D8\u5BDF\u9884\u7B97\uFF08USD\uFF09", kind: "number", min: 0.01, default: 2 },
  surveyRefreshCommits: { label: "\u52D8\u5BDF\u5237\u65B0\u63D0\u4EA4\u9608\u503C", kind: "integer", min: 0, default: 20 },
  pageTriggerType: { label: "\u65B0\u77E5\u8BC6\u9875\u5237\u65B0\u65B9\u5F0F", kind: "choice", choices: ["manual", "auto-refresh", "cron"], default: "cron" },
  pageTriggerCron: { label: "\u65B0\u77E5\u8BC6\u9875 Cron\uFF08\u652F\u6301 H\uFF09", kind: "text", default: "H * * * *" },
  pageSearchLimit: { label: "\u77E5\u8BC6\u9875\u641C\u7D22\u4E0A\u9650", kind: "integer", min: 1, default: 10 },
  reflectTimeoutMs: { label: "\u81EA\u52A8\u53CD\u601D\u8D85\u65F6\uFF08ms\uFF09", kind: "integer", min: 1, default: 2e4 },
  reflectToolTimeoutMs: { label: "\u5DE5\u5177\u53CD\u601D\u8D85\u65F6\uFF08ms\uFF09", kind: "integer", min: 1, default: 33e4 }
};

// src/client/ManagementPanel.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var P = "dsh-hsm-";
var READ_TIMEOUT = 3e4;
var SLOW_TIMEOUT = 12e4;
var DOWNLOAD_TIMEOUT = 18e4;
var POLL_MS = 3e3;
var QUEUE_PAGE = 20;
var CSS = [
  "." + P + "root{display:flex;flex-direction:column;gap:18px;width:100%;min-width:0;box-sizing:border-box;",
  "color:var(--dsw-alias-label-primary,#1a1a1a);font:inherit;font-size:13px;line-height:21px;color-scheme:light;}",
  "." + P + "root *{box-sizing:border-box;}",
  "." + P + "section{display:flex;flex-direction:column;gap:18px;min-width:0;}",
  "." + P + "section[hidden]{display:none;}",
  "." + P + "card{border:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:14px;padding:20px;",
  "display:flex;flex-direction:column;gap:14px;background:var(--dsw-alias-bg-layer-1,transparent);min-width:0;}",
  "." + P + "cardhead{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;}",
  "." + P + "cardtitle{margin:0;font-size:15px;line-height:24px;font-weight:650;}",
  "." + P + "field{display:grid;grid-template-columns:140px minmax(0,1fr);gap:6px 12px;align-items:start;}",
  "@media (max-width:680px){." + P + "field{grid-template-columns:minmax(0,1fr);}}",
  "." + P + "label{padding-top:5px;color:var(--dsw-alias-label-secondary,#555);}",
  "." + P + "control{min-width:0;display:flex;flex-direction:column;gap:6px;}",
  "." + P + "hint{color:var(--dsw-alias-label-tertiary,#8a8a8a);font-size:12px;}",
  "." + P + "muted{color:var(--dsw-alias-label-tertiary,#8a8a8a);}",
  "." + P + "input,." + P + "select{box-sizing:border-box;width:100%;height:36px;padding:0 11px;border-radius:8px;",
  "border:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.18));",
  "background-color:var(--dsw-alias-bg-layer-1,var(--dsw-alias-bg-base,#fff));color:var(--dsw-alias-label-primary,inherit);",
  "font:inherit;font-size:13px;color-scheme:light dark;}",
  "." + P + "select option{background-color:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#1a1a1a);}",
  "." + P + "textarea{box-sizing:border-box;width:100%;min-height:72px;padding:8px 11px;border-radius:8px;",
  "border:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.18));",
  "background-color:var(--dsw-alias-bg-layer-1,var(--dsw-alias-bg-base,#fff));color:var(--dsw-alias-label-primary,inherit);",
  "font:inherit;font-size:12.5px;line-height:18px;resize:vertical;color-scheme:light dark;}",
  "." + P + "input:focus,." + P + "select:focus,." + P + "textarea:focus{outline:2px solid var(--dsw-alias-brand-primary,#3b82f6);outline-offset:1px;}",
  "." + P + "input:disabled,." + P + "select:disabled,." + P + "textarea:disabled{opacity:.55;}",
  "." + P + "check{display:flex;align-items:flex-start;gap:8px;cursor:pointer;}",
  "." + P + "check input{margin-top:3px;accent-color:var(--dsw-alias-brand-primary,#3b82f6);}",
  "." + P + "btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:34px;padding:6px 14px;",
  "border-radius:8px;border:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.14));",
  "background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.045));color:inherit;font:inherit;font-size:13px;",
  "cursor:pointer;white-space:nowrap;}",
  "." + P + "btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-active,rgba(0,0,0,.09));}",
  "." + P + "btn:disabled{opacity:.5;cursor:default;}",
  "." + P + "btnprimary{background:var(--dsw-alias-brand-primary,#3b82f6);border-color:transparent;color:#fff;}",
  "." + P + "btnprimary:hover:not(:disabled){background:var(--dsw-alias-brand-primary-hover,#2563eb);}",
  "." + P + "btndanger{border-color:rgba(220,38,38,.45);color:var(--dsw-alias-status-error,#b91c1c);background:transparent;}",
  "." + P + "btndanger:hover:not(:disabled){background:rgba(220,38,38,.08);}",
  "." + P + "pill{display:inline-flex;align-items:center;gap:6px;font-size:12px;padding:2px 10px;border-radius:999px;",
  "border:.5px solid transparent;white-space:nowrap;}",
  "." + P + "pill-ok{color:var(--dsw-alias-status-success,#15803d);background:rgba(22,163,74,.1);border-color:rgba(22,163,74,.3);}",
  "." + P + "pill-bad{color:var(--dsw-alias-status-error,#b91c1c);background:rgba(220,38,38,.08);border-color:rgba(220,38,38,.3);}",
  "." + P + "pill-warn{color:var(--dsw-alias-status-warning,#a16207);background:rgba(202,138,4,.1);border-color:rgba(202,138,4,.3);}",
  "." + P + "pill-mute{color:var(--dsw-alias-label-tertiary,#6b7280);background:rgba(107,114,128,.1);border-color:rgba(107,114,128,.25);}",
  "." + P + "errbanner{display:flex;gap:8px;padding:10px 12px;border-radius:8px;background:rgba(220,38,38,.07);",
  "border:.5px solid rgba(220,38,38,.3);color:var(--dsw-alias-status-error,#b91c1c);}",
  "." + P + "notice{padding:8px 12px;border-radius:8px;background:rgba(22,163,74,.08);",
  "border:.5px solid rgba(22,163,74,.3);color:var(--dsw-alias-status-success,#15803d);}",
  "." + P + "actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center;}",
  "." + P + "table{width:100%;border-collapse:collapse;font-size:12.5px;}",
  "." + P + "table th{text-align:left;padding:6px 8px;color:var(--dsw-alias-label-tertiary,#8a8a8a);font-weight:600;",
  "border-bottom:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));}",
  "." + P + "table td{padding:8px;border-bottom:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));vertical-align:top;word-break:break-word;}",
  "." + P + "mono{font-family:ui-monospace,Consolas,Menlo,monospace;font-size:12px;word-break:break-all;}",
  "." + P + "kv{display:grid;grid-template-columns:180px minmax(0,1fr);gap:4px 12px;font-size:12.5px;margin:0;}",
  "@media (max-width:680px){." + P + "kv{grid-template-columns:minmax(0,1fr);}}",
  "." + P + "kv dt{color:var(--dsw-alias-label-tertiary,#8a8a8a);margin:0;}",
  "." + P + "kv dd{margin:0;min-width:0;word-break:break-word;}",
  "." + P + "overlay{position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.4);",
  "display:flex;align-items:center;justify-content:center;padding:24px;}",
  "." + P + "dialog{background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#1a1a1a);",
  "border-radius:14px;border:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));width:100%;max-width:560px;",
  "max-height:82vh;overflow:auto;padding:20px;display:flex;flex-direction:column;gap:12px;color-scheme:light;}",
  "." + P + "dlgtitle{margin:0;font-size:16px;font-weight:650;}",
  "." + P + "risk{padding:10px 12px;border-radius:8px;background:rgba(202,138,4,.08);border:.5px solid rgba(202,138,4,.3);}",
  "." + P + "pre{margin:0;padding:10px 12px;border-radius:8px;background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.04));",
  "font-family:ui-monospace,Consolas,Menlo,monospace;font-size:11.5px;line-height:16px;white-space:pre-wrap;",
  "word-break:break-word;max-height:220px;overflow:auto;}",
  "." + P + "progress{height:6px;border-radius:3px;background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.08));",
  "overflow:hidden;min-width:120px;}",
  "." + P + "progressbar{height:100%;background:var(--dsw-alias-brand-primary,#3b82f6);}",
  "." + P + "rowactions{display:flex;gap:6px;flex-wrap:wrap;}",
  "." + P + "block{border:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:8px;",
  "padding:10px 12px;display:flex;flex-direction:column;gap:6px;}",
  "." + P + "blockoff{opacity:.55;}"
];
var cssReady = false;
function ensureMgmtStyles() {
  if (cssReady || typeof document === "undefined") return;
  cssReady = true;
  if (document.getElementById(P + "styles")) return;
  const style = document.createElement("style");
  style.id = P + "styles";
  style.textContent = CSS.join("\n");
  document.head.appendChild(style);
}
var encoder = new TextEncoder();
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function errText(err) {
  if (err instanceof Error && err.message) return err.message;
  return String(err);
}
function staleError() {
  const err = new Error(t("\u54CD\u5E94\u5DF2\u8FC7\u671F\uFF08\u76EE\u6807\u5DF2\u53D8\u66F4\u6216\u9762\u677F\u5DF2\u5378\u8F7D\uFF09\uFF0C\u5DF2\u4E22\u5F03\u3002"));
  err.stale = true;
  return err;
}
function isCancel(err) {
  return !!err && (err.stale === true || err.name === "AbortError");
}
function fmtTime(value) {
  if (typeof value !== "string" || !value) return "\u2014";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
function fmtBytes(n) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "\u2014";
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / 1024 / 1024).toFixed(1) + " MB";
}
function shortId(id) {
  return typeof id === "string" && id.length > 12 ? id.slice(0, 8) + "\u2026" : String(id ?? "");
}
function aliasProblem(alias) {
  const text = alias.trim();
  if (!text) return t("\u522B\u540D\u4E0D\u80FD\u4E3A\u7A7A\u3002");
  if (encoder.encode(text).length > 192) return t("\u522B\u540D\u8D85\u8FC7 192 \u5B57\u8282\uFF08UTF-8\uFF09\u4E0A\u9650\u3002");
  if (/[\x00-\x1f\x7f]/.test(text)) return t("\u522B\u540D\u4E0D\u80FD\u5305\u542B\u63A7\u5236\u5B57\u7B26\u3002");
  if (/[\\/]/.test(text)) return t("\u522B\u540D\u4E0D\u80FD\u5305\u542B\u659C\u6760\u6216\u53CD\u659C\u6760\u3002");
  if (text === "." || text === "..") return t("\u522B\u540D\u4E0D\u80FD\u662F\u8DEF\u5F84\u7247\u6BB5\u3002");
  return null;
}
function valueToText(kind, value) {
  if (kind === "boolean") return value === true ? "true" : "false";
  if (kind === "json") {
    try {
      return JSON.stringify(value ?? null, null, 2);
    } catch (err) {
      return String(value ?? "");
    }
  }
  if (kind === "lines") return Array.isArray(value) ? value.join("\n") : value == null ? "" : String(value);
  return value == null ? "" : String(value);
}
function textToValue(kind, text, meta) {
  if (kind === "boolean") return { ok: true, value: text === "true" };
  if (kind === "integer") {
    if (!/^-?\d+$/.test(text.trim())) return { ok: false, error: t("\u5FC5\u987B\u662F\u6574\u6570") };
    const n = parseInt(text.trim(), 10);
    if (meta && typeof meta.min === "number" && n < meta.min) return { ok: false, error: tf("\u4E0D\u80FD\u5C0F\u4E8E {0}", [meta.min]) };
    if (meta && typeof meta.max === "number" && n > meta.max) return { ok: false, error: tf("\u4E0D\u80FD\u5927\u4E8E {0}", [meta.max]) };
    return { ok: true, value: n };
  }
  if (kind === "number") {
    const n = parseFloat(text.trim());
    if (!Number.isFinite(n)) return { ok: false, error: t("\u5FC5\u987B\u662F\u6570\u5B57") };
    if (meta && typeof meta.min === "number" && n < meta.min) return { ok: false, error: tf("\u4E0D\u80FD\u5C0F\u4E8E {0}", [meta.min]) };
    if (meta && typeof meta.max === "number" && n > meta.max) return { ok: false, error: tf("\u4E0D\u80FD\u5927\u4E8E {0}", [meta.max]) };
    return { ok: true, value: n };
  }
  if (kind === "json") {
    try {
      return { ok: true, value: JSON.parse(text) };
    } catch (err) {
      return { ok: false, error: t("JSON \u89E3\u6790\u5931\u8D25\uFF1A") + errText(err) };
    }
  }
  if (kind === "lines") {
    return { ok: true, value: text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0) };
  }
  if (kind === "choice" && meta && Array.isArray(meta.choices) && !meta.choices.includes(text)) {
    return { ok: false, error: tf("\u5FC5\u987B\u662F {0} \u4E4B\u4E00", [meta.choices.join(" / ")]) };
  }
  return { ok: true, value: text };
}
function verifyEcho(input, res) {
  if (!isRecord(res) || res.op !== input.op || res.apiUrl !== input.apiUrl) {
    throw new Error(t("\u54CD\u5E94\u4E0E\u8BF7\u6C42\u76EE\u6807\u4E0D\u4E00\u81F4\uFF0C\u5DF2\u4E22\u5F03\u3002"));
  }
  if (input.bankId !== void 0 && res.bankId !== input.bankId) {
    throw new Error(t("\u54CD\u5E94\u4E0E\u8BF7\u6C42\u76EE\u6807\u4E0D\u4E00\u81F4\uFF0C\u5DF2\u4E22\u5F03\u3002"));
  }
}
function useChannel(request, targetKey) {
  const genRef = (0, import_react2.useRef)(0);
  const mountedRef = (0, import_react2.useRef)(true);
  const ctrlsRef = (0, import_react2.useRef)(/* @__PURE__ */ new Set());
  (0, import_react2.useEffect)(() => {
    genRef.current += 1;
    const ctrls = ctrlsRef.current;
    for (const controller of ctrls) controller.abort();
    ctrls.clear();
  }, [targetKey]);
  (0, import_react2.useEffect)(() => () => {
    mountedRef.current = false;
    const ctrls = ctrlsRef.current;
    for (const controller of ctrls) controller.abort();
    ctrls.clear();
  }, []);
  return (0, import_react2.useCallback)(async (input, timeoutMs) => {
    const gen = genRef.current;
    const controller = new AbortController();
    ctrlsRef.current.add(controller);
    try {
      const res = await request(input, { signal: controller.signal, timeoutMs: timeoutMs ?? READ_TIMEOUT });
      if (!mountedRef.current || gen !== genRef.current) throw staleError();
      verifyEcho(input, res);
      return res;
    } finally {
      ctrlsRef.current.delete(controller);
    }
  }, [request]);
}
function MgmtPill({ tone, children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: P + "pill " + P + "pill-" + (tone || "mute"), children });
}
var OP_STATUS = {
  pending: ["\u5F85\u5904\u7406", "warn"],
  processing: ["\u8FDB\u884C\u4E2D", "warn"],
  completed: ["\u5DF2\u5B8C\u6210", "ok"],
  failed: ["\u5931\u8D25", "bad"],
  cancelled: ["\u5DF2\u53D6\u6D88", "mute"]
};
function OpPill({ status }) {
  const entry = OP_STATUS[status] || [t("\u672A\u77E5"), "mute"];
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MgmtPill, { tone: entry[1], children: t(entry[0]) });
}
function Field({ label, hint, children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "field", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "label", children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "control", children: [
      children,
      hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "hint", children: hint }) : null
    ] })
  ] });
}
var pickerSeq = 0;
var BANK_ID_STORAGE_KEY = "dsh-hindsight-gui.bankId";
var BANK_ID_SYNC_EVENT = "dsh-hindsight-gui:bank-id";
function readStoredBankId() {
  try {
    return window.localStorage.getItem(BANK_ID_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}
function usePersistedBankId() {
  const [bankId, setBankId] = (0, import_react2.useState)(readStoredBankId);
  (0, import_react2.useEffect)(() => {
    const sync = () => setBankId(readStoredBankId());
    try {
      window.addEventListener("storage", sync);
      window.addEventListener(BANK_ID_SYNC_EVENT, sync);
      return () => {
        window.removeEventListener("storage", sync);
        window.removeEventListener(BANK_ID_SYNC_EVENT, sync);
      };
    } catch {
      return void 0;
    }
  }, []);
  const persist = (0, import_react2.useCallback)((next) => {
    setBankId(next);
    try {
      if (next) window.localStorage.setItem(BANK_ID_STORAGE_KEY, next);
      else window.localStorage.removeItem(BANK_ID_STORAGE_KEY);
    } catch {
    }
    try {
      window.dispatchEvent(new Event(BANK_ID_SYNC_EVENT));
    } catch {
    }
  }, []);
  return [bankId, persist];
}
function BankPicker({ banks, value, onChange, label }) {
  const [listId] = (0, import_react2.useState)(() => P + "banks-" + ++pickerSeq);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    Field,
    {
      label: label || t("\u8BB0\u5FC6\u5E93"),
      hint: banks.length === 0 ? t("\u5BBF\u4E3B\u5C1A\u672A\u63D0\u4F9B\u8BB0\u5FC6\u5E93\u5217\u8868\uFF0C\u53EF\u624B\u52A8\u8F93\u5165 ID\u3002") : void 0,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            className: P + "input",
            type: "text",
            list: listId,
            "aria-label": label || t("\u8BB0\u5FC6\u5E93 ID"),
            placeholder: t("\u8F93\u5165\u6216\u9009\u62E9\u8BB0\u5FC6\u5E93 ID"),
            value,
            onChange: (event) => onChange(event.target.value.trim())
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("datalist", { id: listId, children: banks.map((bank) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: bank.id, children: (bank.name || bank.id) + (typeof bank.facts === "number" ? tf("\uFF08{0} \u6761\u4E8B\u5B9E\uFF09", [bank.facts]) : "") }, bank.id)) })
      ]
    }
  );
}
function OpProgress({ progress }) {
  if (!isRecord(progress)) return null;
  const processed = typeof progress.processed === "number" ? progress.processed : null;
  const total = typeof progress.total === "number" && progress.total > 0 ? progress.total : null;
  const percent = processed !== null && total !== null ? Math.min(100, Math.round(processed / total * 100)) : null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "control", role: "status", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "muted", children: [
      t("\u9636\u6BB5\uFF1A"),
      progress.stage || "\u2014",
      processed !== null ? tf("\uFF1B\u5DF2\u5904\u7406 {0}{1}", [processed, total !== null ? " / " + total : ""]) : "",
      t("\uFF1B\u5FEB\u7167\u65F6\u95F4 "),
      fmtTime(progress.at)
    ] }),
    percent !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "progress", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "progressbar", style: { width: percent + "%" } }) }) : null,
    isRecord(progress.detail) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "muted", children: Object.entries(progress.detail).map(([k, v]) => k + "=" + v).join("\uFF0C") }) : null
  ] });
}
function ConfirmDialog({ spec, onClose, onExecute }) {
  const [typed, setTyped] = (0, import_react2.useState)("");
  const [riskOk, setRiskOk] = (0, import_react2.useState)(false);
  const [costOk, setCostOk] = (0, import_react2.useState)(false);
  const [busy, setBusy] = (0, import_react2.useState)(false);
  const [phase, setPhase] = (0, import_react2.useState)("");
  const [error, setError] = (0, import_react2.useState)(null);
  const busyRef = (0, import_react2.useRef)(false);
  busyRef.current = busy;
  (0, import_react2.useEffect)(() => {
    const onKey = (event) => {
      if (event.key === "Escape" && !busyRef.current) onClose(false, null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const needCost = spec.cost === true;
  const ready = typed === spec.typedSubject && riskOk && (!needCost || costOk) && !busy;
  const doConfirm = async () => {
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      const res = await onExecute(spec, setPhase);
      onClose(true, res);
    } catch (err) {
      if (isCancel(err)) {
        setError(t("\u64CD\u4F5C\u5DF2\u53D6\u6D88\u3002\u82E5\u5B9E\u9645\u7ED3\u679C\u672A\u77E5\uFF0C\u8BF7\u5237\u65B0\u5BF9\u5E94\u5217\u8868\u6838\u5B9E\u72B6\u6001\uFF1B\u4E0D\u4F1A\u81EA\u52A8\u91CD\u8BD5\u3002"));
      } else {
        setError(errText(err));
      }
      setBusy(false);
      setPhase("");
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "overlay", onMouseDown: () => {
    if (!busy) onClose(false, null);
  }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "div",
    {
      className: P + "dialog",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": spec.title,
      onMouseDown: (event) => event.stopPropagation(),
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: P + "dlgtitle", children: spec.title }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", { className: P + "kv", children: spec.summary.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "contents" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: row.label }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { className: P + "mono", children: row.value })
        ] }, row.label)) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "risk", children: spec.riskNote }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", { children: t("\u51BB\u7ED3\u53C2\u6570\u5FEB\u7167\uFF08prepare \u4E0E\u6267\u884C\u4E4B\u95F4\u4E0D\u53EF\u53D8\uFF09") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", { className: P + "pre", children: JSON.stringify(spec.params || {}, null, 2) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: tf("\u8F93\u5165\u300C{0}\u300D\u786E\u8BA4", [spec.typedSubject]), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            className: P + "input",
            type: "text",
            autoFocus: true,
            value: typed,
            disabled: busy,
            "aria-label": tf("\u8F93\u5165 {0} \u4EE5\u786E\u8BA4\u64CD\u4F5C\u76EE\u6807", [spec.typedSubject]),
            onChange: (event) => setTyped(event.target.value)
          }
        ) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: P + "check", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "checkbox",
              checked: riskOk,
              disabled: busy,
              onChange: (event) => setRiskOk(event.target.checked)
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("\u6211\u5DF2\u77E5\u6653\u4E0A\u8FF0\u98CE\u9669\u4E0E\u5F71\u54CD\u3002") })
        ] }),
        needCost ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: P + "check", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "checkbox",
              checked: costOk,
              disabled: busy,
              onChange: (event) => setCostOk(event.target.checked)
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("\u6211\u5DF2\u77E5\u6653\u8BE5\u64CD\u4F5C\u53EF\u80FD\u4EA7\u751F LLM \u8C03\u7528\u8D39\u7528\u3002") })
        ] }) : null,
        error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "errbanner", role: "alert", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: error }) }) : null,
        busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "muted", role: "status", children: phase || t("\u5904\u7406\u4E2D\u2026") }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "actions", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: P + "btn", disabled: busy, onClick: () => onClose(false, null), children: t("\u53D6\u6D88") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: P + "btn " + P + "btnprimary", disabled: !ready, onClick: doConfirm, children: busy ? t("\u6267\u884C\u4E2D\u2026") : spec.confirmLabel || t("\u786E\u8BA4\u6267\u884C") })
        ] })
      ]
    }
  ) });
}
function KindEditor({ meta, value, disabled, ariaLabel, onChange }) {
  if (meta.kind === "boolean") {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "select",
      {
        className: P + "select",
        value,
        disabled,
        "aria-label": ariaLabel,
        onChange: (event) => onChange(event.target.value),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "true", children: t("\u5F00\u542F") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "false", children: t("\u5173\u95ED") })
        ]
      }
    );
  }
  if (meta.kind === "choice") {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "select",
      {
        className: P + "select",
        value,
        disabled,
        "aria-label": ariaLabel,
        onChange: (event) => onChange(event.target.value),
        children: (meta.choices || []).map((choice) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: choice, children: choice }, choice))
      }
    );
  }
  if (meta.kind === "json" || meta.kind === "lines") {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "textarea",
      {
        className: P + "textarea",
        value,
        disabled,
        "aria-label": ariaLabel,
        onChange: (event) => onChange(event.target.value)
      }
    );
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "input",
    {
      className: P + "input",
      type: meta.kind === "integer" || meta.kind === "number" ? "number" : "text",
      value,
      disabled,
      "aria-label": ariaLabel,
      onChange: (event) => onChange(event.target.value)
    }
  );
}
var STAT_LABELS = {
  total_documents: "\u6587\u6863\u6570",
  total_nodes: "\u8BB0\u5FC6\u8282\u70B9\u6570",
  total_links: "\u94FE\u63A5\u6570",
  pending_operations: "\u5F85\u5904\u7406\u4EFB\u52A1",
  failed_operations: "\u5931\u8D25\u4EFB\u52A1",
  last_consolidated_at: "\u4E0A\u6B21\u6574\u7406\u65F6\u95F4",
  last_memory_write_at: "\u4E0A\u6B21\u5199\u5165\u65F6\u95F4"
};
function OverviewSection({ active, apiUrl, banks, request, cap, diag, reloadDiag, openConfirm }) {
  const [bankId, setBankId] = usePersistedBankId();
  const call = useChannel(request, apiUrl + "|" + bankId);
  const [stats, setStats] = (0, import_react2.useState)({ loading: false, error: null, data: null });
  const [statusFilter, setStatusFilter] = (0, import_react2.useState)("");
  const [typeFilter, setTypeFilter] = (0, import_react2.useState)("");
  const [excludeParents, setExcludeParents] = (0, import_react2.useState)(true);
  const [offset, setOffset] = (0, import_react2.useState)(0);
  const [queue, setQueue] = (0, import_react2.useState)({ loading: false, error: null, items: null, total: null });
  const [autoRefresh, setAutoRefresh] = (0, import_react2.useState)(false);
  const [detailId, setDetailId] = (0, import_react2.useState)(null);
  const [detail, setDetail] = (0, import_react2.useState)({ loading: false, error: null, data: null });
  const loadStats = (0, import_react2.useCallback)(async () => {
    if (!bankId) return;
    setStats((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await call({ op: "stats", apiUrl, bankId });
      setStats({ loading: false, error: null, data: isRecord(res.data) ? res.data : {} });
    } catch (err) {
      if (isCancel(err)) return;
      setStats((prev) => ({ ...prev, loading: false, error: errText(err) }));
    }
  }, [call, apiUrl, bankId]);
  const loadQueue = (0, import_react2.useCallback)(async (nextOffset) => {
    if (!bankId) return;
    setQueue((prev) => ({ ...prev, loading: true, error: null }));
    const params = { limit: QUEUE_PAGE, offset: nextOffset, excludeParents };
    if (statusFilter) params.status = statusFilter;
    if (typeFilter.trim()) params.type = typeFilter.trim();
    try {
      const res = await call({ op: "operations", apiUrl, bankId, params });
      const data = isRecord(res.data) ? res.data : {};
      setQueue({
        loading: false,
        error: null,
        items: Array.isArray(data.items) ? data.items : [],
        total: typeof data.total === "number" ? data.total : null
      });
    } catch (err) {
      if (isCancel(err)) return;
      setQueue((prev) => ({ ...prev, loading: false, error: errText(err) }));
    }
  }, [call, apiUrl, bankId, statusFilter, typeFilter, excludeParents]);
  const loadDetail = (0, import_react2.useCallback)(async (operationId) => {
    setDetail({ loading: true, error: null, data: null });
    try {
      const res = await call({ op: "operation", apiUrl, bankId, params: { operationId } });
      setDetail({ loading: false, error: null, data: isRecord(res.data) ? res.data : {} });
    } catch (err) {
      if (isCancel(err)) return;
      setDetail({ loading: false, error: errText(err), data: null });
    }
  }, [call, apiUrl, bankId]);
  (0, import_react2.useEffect)(() => {
    if (active && bankId) {
      loadQueue(offset);
      loadStats();
    }
  }, [active, bankId]);
  (0, import_react2.useEffect)(() => {
    if (!active || !autoRefresh || !bankId) return void 0;
    const timer = setInterval(() => {
      loadQueue(offset);
    }, 15e3);
    return () => clearInterval(timer);
  }, [active, autoRefresh, bankId, loadQueue, offset]);
  const confirmRowAction = (row, action) => {
    const opName = action === "retry" ? "operationRetry" : action === "cancel" ? "operationCancel" : "operationDelete";
    const titles = { retry: t("\u91CD\u8BD5\u4EFB\u52A1"), cancel: t("\u53D6\u6D88\u4EFB\u52A1"), delete: t("\u5220\u9664\u4EFB\u52A1\u8BB0\u5F55") };
    const risks = {
      retry: t("\u5C06\u91CD\u65B0\u6267\u884C\u8BE5\u4EFB\u52A1\uFF0C\u53EF\u80FD\u518D\u6B21\u4EA7\u751F LLM \u8C03\u7528\u4E0E\u8D39\u7528\u3002"),
      cancel: t("\u5C06\u8BF7\u6C42\u53D6\u6D88\u8BE5\u4EFB\u52A1\uFF1B\u5DF2\u5F00\u59CB\u6267\u884C\u7684\u90E8\u5206\u65E0\u6CD5\u56DE\u6EDA\u3002"),
      delete: t("\u5C06\u6C38\u4E45\u5220\u9664\u8BE5\u4EFB\u52A1\u8BB0\u5F55\uFF08\u4E0D\u5F71\u54CD\u5DF2\u5199\u5165\u7684\u8BB0\u5FC6\u6570\u636E\uFF09\uFF0C\u4E0D\u53EF\u6062\u590D\u3002")
    };
    openConfirm({
      title: titles[action],
      op: opName,
      cost: COST_OPERATIONS.includes(opName),
      apiUrl,
      bankId,
      typedSubject: bankId,
      riskNote: risks[action],
      params: { operationId: row.operation_id },
      transport: "request",
      timeoutMs: READ_TIMEOUT,
      summary: [
        { label: "API", value: apiUrl },
        { label: t("\u8BB0\u5FC6\u5E93"), value: bankId },
        { label: t("\u4EFB\u52A1 ID"), value: row.operation_id }
      ],
      onDone: () => {
        loadQueue(offset);
        if (detailId === row.operation_id) loadDetail(row.operation_id);
      }
    });
  };
  const diagData = diag.data;
  const features = diagData && isRecord(diagData.features) ? diagData.features : null;
  const warnings = diagData && Array.isArray(diagData.warnings) ? diagData.warnings : [];
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "cardhead", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: P + "cardtitle", children: t("\u8BCA\u65AD\u4FE1\u606F") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: P + "btn", disabled: diag.loading, onClick: reloadDiag, children: diag.loading ? t("\u8BFB\u53D6\u4E2D\u2026") : t("\u5237\u65B0\u8BCA\u65AD") })
      ] }),
      diag.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "errbanner", role: "alert", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
        t("\u8BCA\u65AD\u8BFB\u53D6\u5931\u8D25\uFF1A"),
        diag.error
      ] }) }) : null,
      !diagData && !diag.loading && !diag.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "muted", role: "status", children: t("\u5C1A\u672A\u8BFB\u53D6\u8BCA\u65AD\u4FE1\u606F\u3002") }) : null,
      diag.loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "muted", role: "status", children: t("\u8BFB\u53D6\u4E2D\u2026") }) : null,
      diagData ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", { className: P + "kv", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "contents" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: t("\u63D2\u4EF6\u7248\u672C") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: diagData.pluginVersion ?? t("\u672A\u77E5") })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "contents" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: t("API \u7248\u672C") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: diagData.apiVersion ?? t("\u672A\u77E5") })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "contents" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: t("\u5B58\u6D3B\u72B6\u6001") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: typeof diagData.liveness === "string" ? diagData.liveness : t("\u672A\u77E5") })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "contents" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: t("\u5C31\u7EEA\u72B6\u6001") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: typeof diagData.readiness === "string" ? diagData.readiness : t("\u672A\u77E5") })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "contents" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: t("\u8BA4\u8BC1") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: diagData.auth == null ? t("\u672A\u77E5") : typeof diagData.auth === "string" ? diagData.auth : JSON.stringify(diagData.auth) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "contents" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: t("\u8BB0\u5FC6\u540E\u7AEF") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: diagData.memory == null ? t("\u672A\u77E5") : typeof diagData.memory === "string" ? diagData.memory : JSON.stringify(diagData.memory) })
          ] })
        ] }),
        features ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "actions", "aria-label": t("\u670D\u52A1\u7AEF\u7279\u6027"), children: Object.entries(features).map(([key, value]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(MgmtPill, { tone: value === true ? "ok" : "mute", children: [
          key,
          value === true ? "" : t("\uFF08\u5173\uFF09")
        ] }, key)) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "muted", children: t("\u670D\u52A1\u7AEF\u7279\u6027\uFF1A\u672A\u77E5") }),
        warnings.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "control", children: warnings.map((warning, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "risk", children: String(warning) }, index)) }) : null
      ] }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "cardhead", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: P + "cardtitle", children: t("\u8BB0\u5FC6\u5E93\u7EDF\u8BA1") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: P + "btn", disabled: !bankId || stats.loading, onClick: loadStats, children: stats.loading ? t("\u8BFB\u53D6\u4E2D\u2026") : t("\u5237\u65B0\u7EDF\u8BA1") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BankPicker, { banks, value: bankId, onChange: setBankId }),
      stats.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "errbanner", role: "alert", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
        t("\u7EDF\u8BA1\u8BFB\u53D6\u5931\u8D25\uFF1A"),
        stats.error
      ] }) }) : null,
      stats.data ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", { className: P + "kv", children: Object.entries(stats.data).filter(([key]) => key !== "bank_id").map(([key, value]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "contents" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: t(STAT_LABELS[key] || key) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: value == null ? "\u2014" : typeof value === "number" || typeof value === "boolean" ? String(value) : typeof value === "string" ? key.endsWith("_at") ? fmtTime(value) : value : tf("\u5171 {0} \u7C7B", [Object.keys(value).length]) })
      ] }, key)) }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "cardhead", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: P + "cardtitle", children: t("\u4EFB\u52A1\u961F\u5217") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "actions", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: P + "check", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: autoRefresh, onChange: (event) => setAutoRefresh(event.target.checked) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("\u6BCF 15 \u79D2\u81EA\u52A8\u5237\u65B0") })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              type: "button",
              className: P + "btn",
              disabled: !bankId || queue.loading,
              onClick: () => {
                setOffset(0);
                loadQueue(0);
              },
              children: queue.loading ? t("\u8BFB\u53D6\u4E2D\u2026") : t("\u67E5\u8BE2")
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "label", children: t("\u7B5B\u9009") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "control", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "actions", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "select",
              {
                className: P + "select",
                style: { width: "auto" },
                "aria-label": t("\u6309\u72B6\u6001\u7B5B\u9009"),
                value: statusFilter,
                onChange: (event) => setStatusFilter(event.target.value),
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "", children: t("\u5168\u90E8\u72B6\u6001") }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "pending", children: t("\u5F85\u5904\u7406") }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "processing", children: t("\u8FDB\u884C\u4E2D") }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "completed", children: t("\u5DF2\u5B8C\u6210") }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "failed", children: t("\u5931\u8D25") }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "cancelled", children: t("\u5DF2\u53D6\u6D88") })
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                className: P + "input",
                style: { width: "180px" },
                type: "text",
                "aria-label": t("\u6309\u4EFB\u52A1\u7C7B\u578B\u7B5B\u9009"),
                placeholder: t("\u4EFB\u52A1\u7C7B\u578B\uFF08\u5982 retain\uFF09"),
                value: typeFilter,
                onChange: (event) => setTypeFilter(event.target.value)
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: P + "check", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "input",
                {
                  type: "checkbox",
                  checked: excludeParents,
                  onChange: (event) => setExcludeParents(event.target.checked)
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("\u4E0D\u542B\u7236\u4EFB\u52A1") })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "hint", children: t("\u7B5B\u9009\u5728\u70B9\u51FB\u300C\u67E5\u8BE2\u300D\u540E\u751F\u6548\u3002") })
        ] })
      ] }),
      queue.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "errbanner", role: "alert", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
        t("\u961F\u5217\u8BFB\u53D6\u5931\u8D25\uFF1A"),
        queue.error
      ] }) }) : null,
      queue.items ? queue.items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "muted", children: t("\u6CA1\u6709\u7B26\u5408\u6761\u4EF6\u7684\u4EFB\u52A1\u3002") }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", { className: P + "table", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: t("\u4EFB\u52A1") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: t("\u7C7B\u578B") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: t("\u72B6\u6001") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: t("\u521B\u5EFA\u65F6\u95F4") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: t("\u9519\u8BEF") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: t("\u64CD\u4F5C") })
        ] }) }),
        queue.items.map((row) => {
          const id = typeof row.operation_id === "string" ? row.operation_id : "";
          const status = typeof row.status === "string" ? row.status : "";
          const retryCap = cap("operationRetry");
          const cancelCap = cap("operationCancel");
          const deleteCap = cap("operationDelete");
          return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: P + "mono", title: id, children: shortId(id) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: row.task_type ?? "\u2014" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OpPill, { status }) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: fmtTime(row.created_at) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: typeof row.error_message === "string" && row.error_message ? row.error_message.length > 60 ? row.error_message.slice(0, 60) + "\u2026" : row.error_message : "\u2014" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "rowactions", children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: P + "btn", onClick: () => {
                  if (detailId === id) {
                    setDetailId(null);
                  } else {
                    setDetailId(id);
                    loadDetail(id);
                  }
                }, children: detailId === id ? t("\u6536\u8D77") : t("\u8BE6\u60C5") }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "button",
                  {
                    type: "button",
                    className: P + "btn",
                    disabled: status !== "failed" || !retryCap.ok,
                    title: status !== "failed" ? t("\u4EC5\u5931\u8D25\u4EFB\u52A1\u53EF\u91CD\u8BD5") : retryCap.reason || "",
                    onClick: () => confirmRowAction(row, "retry"),
                    children: t("\u91CD\u8BD5")
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "button",
                  {
                    type: "button",
                    className: P + "btn",
                    disabled: status !== "pending" && status !== "processing" || !cancelCap.ok,
                    title: status !== "pending" && status !== "processing" ? t("\u4EC5\u5F85\u5904\u7406/\u8FDB\u884C\u4E2D\u4EFB\u52A1\u53EF\u53D6\u6D88") : cancelCap.reason || "",
                    onClick: () => confirmRowAction(row, "cancel"),
                    children: t("\u53D6\u6D88")
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "button",
                  {
                    type: "button",
                    className: P + "btn " + P + "btndanger",
                    disabled: status === "pending" || status === "processing" || !deleteCap.ok,
                    title: status === "pending" || status === "processing" ? t("\u4EFB\u52A1\u672A\u7ED3\u675F\uFF0C\u4E0D\u80FD\u5220\u9664") : deleteCap.reason || "",
                    onClick: () => confirmRowAction(row, "delete"),
                    children: t("\u5220\u9664")
                  }
                )
              ] }) })
            ] }),
            detailId === id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", { colSpan: 6, children: [
              detail.loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "muted", role: "status", children: t("\u8BFB\u53D6\u8BE6\u60C5\u2026") }) : null,
              detail.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "errbanner", role: "alert", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: detail.error }) }) : null,
              detail.data ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "control", children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", { className: P + "kv", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "contents" }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: t("\u4EFB\u52A1 ID") }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { className: P + "mono", children: detail.data.operation_id ?? id })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "contents" }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: t("\u72B6\u6001") }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OpPill, { status: detail.data.status }) })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "contents" }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: t("\u7C7B\u578B") }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: detail.data.task_type ?? "\u2014" })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "contents" }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: t("\u521B\u5EFA\u65F6\u95F4") }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: fmtTime(detail.data.created_at) })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "contents" }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: t("\u5F00\u59CB\u65F6\u95F4") }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: fmtTime(detail.data.started_at) })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "contents" }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: t("\u5B8C\u6210\u65F6\u95F4") }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: fmtTime(detail.data.completed_at) })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "contents" }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: t("\u91CD\u8BD5\u6B21\u6570") }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: [
                      detail.data.retry_count ?? 0,
                      detail.data.next_retry_at ? t("\uFF1B\u4E0B\u6B21\u91CD\u8BD5 ") + fmtTime(detail.data.next_retry_at) : ""
                    ] })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "contents" }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: t("\u9519\u8BEF\u4FE1\u606F") }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: detail.data.error_message || "\u2014" })
                  ] })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OpProgress, { progress: detail.data.progress })
              ] }) : null
            ] }) }) : null
          ] }, id || JSON.stringify(row));
        })
      ] }) : !queue.loading && !queue.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "muted", children: t("\u9009\u62E9\u8BB0\u5FC6\u5E93\u540E\u70B9\u51FB\u300C\u67E5\u8BE2\u300D\u3002") }) : null,
      queue.items && queue.items.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            type: "button",
            className: P + "btn",
            disabled: offset === 0 || queue.loading,
            onClick: () => {
              const next = Math.max(0, offset - QUEUE_PAGE);
              setOffset(next);
              loadQueue(next);
            },
            children: t("\u4E0A\u4E00\u9875")
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: P + "muted", children: [
          tf("\u7B2C {0}\u2013{1} \u6761", [offset + 1, offset + queue.items.length]),
          queue.total !== null ? tf("\uFF0C\u5171 {0} \u6761", [queue.total]) : ""
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            type: "button",
            className: P + "btn",
            disabled: queue.loading || queue.total !== null && offset + queue.items.length >= queue.total || queue.items.length < QUEUE_PAGE,
            onClick: () => {
              const next = offset + QUEUE_PAGE;
              setOffset(next);
              loadQueue(next);
            },
            children: t("\u4E0B\u4E00\u9875")
          }
        )
      ] }) : null
    ] })
  ] });
}
function buildMemoryBaseline(data) {
  const values = {};
  for (const [key, meta] of Object.entries(MEMORY_FIELDS)) {
    const entry = isRecord(data.fields) ? data.fields[key] : void 0;
    const overridden = !!(entry && entry.configured === true && typeof entry.source === "string" && entry.source !== "default");
    const value = entry && "value" in entry ? entry.value : meta.default;
    values[key] = { set: overridden, text: valueToText(meta.kind, value) };
  }
  const apiAuth = isRecord(data.apiAuth) ? data.apiAuth : {};
  return {
    values,
    apiAuth: {
      mode: typeof apiAuth.mode === "string" ? apiAuth.mode : "inherit",
      reference: typeof apiAuth.reference === "string" ? apiAuth.reference : ""
    }
  };
}
function diffMemory(baseline, draft) {
  const changedKeys = [];
  const unsetKeys = [];
  for (const key of Object.keys(MEMORY_FIELDS)) {
    const b = baseline.values[key];
    const d = draft.values[key];
    if (!b || !d) continue;
    if (b.set !== d.set) {
      if (d.set) changedKeys.push(key);
      else unsetKeys.push(key);
    } else if (d.set && b.text !== d.text) {
      changedKeys.push(key);
    }
  }
  const authChanged = baseline.apiAuth.mode !== draft.apiAuth.mode || draft.apiAuth.mode === "reference" && baseline.apiAuth.reference !== draft.apiAuth.reference;
  return { changedKeys, unsetKeys, authChanged };
}
function MemorySection({ active, apiUrl, request, cap, openConfirm }) {
  const [scope, setScope] = (0, import_react2.useState)("dsh");
  const call = useChannel(request, apiUrl + "|" + scope);
  const [read, setRead] = (0, import_react2.useState)(null);
  const [baseline, setBaseline] = (0, import_react2.useState)(null);
  const [draft, setDraft] = (0, import_react2.useState)(null);
  const [loading, setLoading] = (0, import_react2.useState)(false);
  const [error, setError] = (0, import_react2.useState)(null);
  const [notice, setNotice] = (0, import_react2.useState)(null);
  const [scopePrompt, setScopePrompt] = (0, import_react2.useState)(null);
  const load = (0, import_react2.useCallback)(async (targetScope) => {
    setLoading(true);
    setError(null);
    try {
      const res = await call({ op: "settings", apiUrl, params: { scope: targetScope } });
      const data = isRecord(res.data) ? res.data : null;
      if (!data || !isRecord(data.fields)) throw new Error(t("\u8BBE\u7F6E\u8BFB\u53D6\u7ED3\u679C\u683C\u5F0F\u4E0D\u7B26\u5408\u9884\u671F\u3002"));
      const base = buildMemoryBaseline(data);
      setRead(data);
      setBaseline(base);
      setDraft(JSON.parse(JSON.stringify(base)));
    } catch (err) {
      if (isCancel(err)) return;
      setError(errText(err));
      setRead(null);
      setBaseline(null);
      setDraft(null);
    } finally {
      setLoading(false);
    }
  }, [call, apiUrl]);
  const loadedScopeRef = (0, import_react2.useRef)(null);
  (0, import_react2.useEffect)(() => {
    const identity = apiUrl + "|" + scope;
    if (!active || loadedScopeRef.current === identity) return;
    loadedScopeRef.current = identity;
    load(scope);
  }, [active, scope, apiUrl, load]);
  const dirty = baseline && draft ? diffMemory(baseline, draft) : null;
  const isDirty = !!dirty && (dirty.changedKeys.length > 0 || dirty.unsetKeys.length > 0 || dirty.authChanged);
  const saveCap = cap("saveSettings");
  const onScopeSelect = (next) => {
    if (next === scope) return;
    if (isDirty) setScopePrompt(next);
    else setScope(next);
  };
  const setValue = (key, patch) => {
    setDraft((prev) => prev ? { ...prev, values: { ...prev.values, [key]: { ...prev.values[key], ...patch } } } : prev);
  };
  const save = () => {
    if (!read || !baseline || !draft || !dirty) return;
    const problems = [];
    const patch = {};
    for (const key of dirty.changedKeys) {
      const meta = MEMORY_FIELDS[key];
      const result = textToValue(meta.kind, draft.values[key].text, meta);
      if (!result.ok) problems.push(t(meta.label) + t("\uFF1A") + result.error);
      else patch[key] = result.value;
    }
    if (dirty.authChanged && draft.apiAuth.mode === "reference" && !draft.apiAuth.reference.trim()) {
      problems.push(t("API \u51ED\u636E\uFF1Areference \u6A21\u5F0F\u4E0B\u5FC5\u987B\u586B\u5199\u51ED\u636E\u5F15\u7528\u540D"));
    }
    if (problems.length > 0) {
      setError(t("\u8BF7\u5148\u4FEE\u6B63\uFF1A") + problems.join("\uFF1B"));
      return;
    }
    const params = {
      scope,
      patch,
      unset: dirty.unsetKeys,
      configRevision: read.configRevision ?? null,
      guiRevision: read.guiRevision ?? null
    };
    if (dirty.authChanged) {
      params.apiAuth = { mode: draft.apiAuth.mode };
      if (draft.apiAuth.mode === "reference") params.apiAuth.reference = draft.apiAuth.reference.trim();
    }
    openConfirm({
      title: t("\u4FDD\u5B58\u8BB0\u5FC6\u4E0E\u9690\u79C1\u8BBE\u7F6E"),
      op: "saveSettings",
      cost: COST_OPERATIONS.includes("saveSettings"),
      apiUrl,
      typedSubject: "SETTINGS",
      riskNote: t("\u8BB0\u5FC6\u884C\u4E3A\u5199\u5165\u5B98\u65B9\u96C6\u6210\u7684\u914D\u7F6E\u4F5C\u7528\u57DF\uFF0C\u8BA4\u8BC1\u5F15\u7528\u5199\u5165\u672C\u63D2\u4EF6\u914D\u7F6E\u3002\u5DF2\u6709\u5DE5\u4F5C\u533A\u7F13\u5B58\u53EF\u80FD\u9700\u91CD\u65B0\u521D\u59CB\u5316\uFF1B\u4FDD\u5B58\u4E0D\u4FDD\u8BC1\u4E0B\u4E00\u8F6E\u751F\u6548\uFF0C\u4E5F\u4E0D\u4F1A\u81EA\u52A8\u91CD\u542F\u3002\u672A\u53D8\u66F4\u5B57\u6BB5\u4E0D\u63D0\u4EA4\u3002"),
      params,
      transport: "request",
      timeoutMs: READ_TIMEOUT,
      summary: [
        { label: t("\u4F5C\u7528\u57DF"), value: scope },
        { label: t("\u4FEE\u6539\u5B57\u6BB5"), value: String(dirty.changedKeys.length) + t(" \u4E2A") },
        { label: t("\u6062\u590D\u7EE7\u627F"), value: String(dirty.unsetKeys.length) + t(" \u4E2A") },
        { label: t("API \u51ED\u636E\u53D8\u66F4"), value: dirty.authChanged ? t("\u662F") : t("\u5426") }
      ],
      onDone: () => {
        setNotice(t("\u8BBE\u7F6E\u5DF2\u4FDD\u5B58\u3002"));
        load(scope);
      }
    });
  };
  const apiAuth = read && isRecord(read.apiAuth) ? read.apiAuth : null;
  const warnings = read && Array.isArray(read.warnings) ? read.warnings : [];
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "cardhead", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: P + "cardtitle", children: t("\u8BB0\u5FC6\u4E0E\u9690\u79C1\u8BBE\u7F6E") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "actions", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "select",
            {
              className: P + "select",
              style: { width: "auto" },
              "aria-label": t("\u914D\u7F6E\u4F5C\u7528\u57DF"),
              value: scope,
              onChange: (event) => onScopeSelect(event.target.value),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "dsh", children: t("\u672C\u63D2\u4EF6\uFF08dsh\uFF09") }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "global", children: t("\u5168\u5C40\uFF08global\uFF09") })
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: P + "btn", disabled: loading, onClick: () => load(scope), children: loading ? t("\u8BFB\u53D6\u4E2D\u2026") : t("\u91CD\u65B0\u8BFB\u53D6") })
        ] })
      ] }),
      error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "errbanner", role: "alert", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: error }) }) : null,
      notice ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "notice", role: "status", children: notice }) : null,
      loading && !read ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "muted", role: "status", children: t("\u8BFB\u53D6\u4E2D\u2026") }) : null,
      read && draft ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        read.runtimeApplied === "unknown" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "hint", children: t("\u8FD0\u884C\u4E2D\u8FDB\u7A0B\u662F\u5426\u5DF2\u5E94\u7528\u8FD9\u4E9B\u8BBE\u7F6E\uFF1A\u672A\u77E5\uFF08\u91CD\u542F\u540E\u751F\u6548\uFF09\u3002") }) : null,
        warnings.map((warning, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "risk", children: String(warning) }, index)),
        Object.entries(MEMORY_FIELDS).map(([key, meta]) => {
          const entry = isRecord(read.fields) ? read.fields[key] : void 0;
          const cell = draft.values[key];
          const source = entry && typeof entry.source === "string" ? entry.source : null;
          return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "label", children: t(meta.label) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "control", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: P + "check", children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "input",
                  {
                    type: "checkbox",
                    checked: cell.set,
                    "aria-label": t(meta.label) + t("\uFF08\u8986\u76D6\u751F\u6548\u503C\uFF09"),
                    onChange: (event) => setValue(key, { set: event.target.checked })
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("\u8986\u76D6\u751F\u6548\u503C\uFF08\u53D6\u6D88\u52FE\u9009\u5219\u6062\u590D\u7EE7\u627F\uFF09") })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                KindEditor,
                {
                  meta,
                  value: cell.text,
                  disabled: !cell.set,
                  ariaLabel: t(meta.label),
                  onChange: (text) => setValue(key, { text })
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "hint", children: [
                t("\u5F53\u524D\u751F\u6548\uFF1A"),
                valueToText(meta.kind, entry && "value" in entry ? entry.value : meta.default),
                source ? t("\uFF08\u6765\u6E90\uFF1A") + source + "\uFF09" : ""
              ] })
            ] })
          ] }, key);
        })
      ] }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "cardhead", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: P + "cardtitle", children: t("API \u51ED\u636E\u5F15\u7528") }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "hint", children: t("\u5BC6\u94A5\u672C\u4F53\u6C38\u4E0D\u663E\u793A\u3001\u4E5F\u4E0D\u5728\u6B64\u7F16\u8F91\uFF1B\u6B64\u5904\u4EC5\u914D\u7F6E\u51ED\u636E\u5F15\u7528\u6A21\u5F0F\u4E0E\u5F15\u7528\u540D\u3002") }),
      apiAuth ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", { className: P + "kv", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "contents" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: t("\u5F53\u524D\u6A21\u5F0F") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: apiAuth.mode ?? t("\u672A\u77E5") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "contents" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: t("\u5F53\u524D\u5F15\u7528") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { className: P + "mono", children: apiAuth.reference || "\u2014" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "contents" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: t("\u7ED1\u5B9A Base") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { className: P + "mono", children: apiAuth.boundBase || "\u2014" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "contents" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: t("\u6765\u6E90") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: [
            apiAuth.source ?? t("\u672A\u77E5"),
            apiAuth.configured === true ? t("\uFF08\u5DF2\u914D\u7F6E\uFF09") : ""
          ] })
        ] })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "muted", children: read ? t("\u51ED\u636E\u72B6\u6001\u672A\u77E5\u3002") : t("\u8BFB\u53D6\u8BBE\u7F6E\u540E\u663E\u793A\u3002") }),
      read && draft ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t("\u51ED\u636E\u6A21\u5F0F"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "select",
          {
            className: P + "select",
            "aria-label": t("API \u51ED\u636E\u6A21\u5F0F"),
            value: draft.apiAuth.mode,
            onChange: (event) => setDraft((prev) => prev ? {
              ...prev,
              apiAuth: { ...prev.apiAuth, mode: event.target.value }
            } : prev),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "inherit", children: t("\u7EE7\u627F\uFF08\u6CBF\u7528\u5BBF\u4E3B\u914D\u7F6E\uFF09") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "none", children: t("\u4E0D\u643A\u5E26\u51ED\u636E") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "reference", children: t("\u51ED\u636E\u5F15\u7528") })
            ]
          }
        ) }),
        draft.apiAuth.mode === "reference" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t("\u5F15\u7528\u540D"), hint: t("\u5BBF\u4E3B\u51ED\u636E\u5B58\u50A8\u4E2D\u7684\u5F15\u7528\u540D\uFF0C\u4E0D\u662F\u5BC6\u94A5\u672C\u8EAB\u3002"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            className: P + "input",
            type: "text",
            "aria-label": t("API \u51ED\u636E\u5F15\u7528\u540D"),
            value: draft.apiAuth.reference,
            onChange: (event) => setDraft((prev) => prev ? {
              ...prev,
              apiAuth: { ...prev.apiAuth, reference: event.target.value }
            } : prev)
          }
        ) }) : null
      ] }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: P + "muted", role: "status", children: !read ? t("\u5C1A\u672A\u8BFB\u53D6\u8BBE\u7F6E") : isDirty ? t("\u6709\u672A\u4FDD\u5B58\u7684\u66F4\u6539") : t("\u4E0E\u5DF2\u4FDD\u5B58\u8BBE\u7F6E\u4E00\u81F4") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            type: "button",
            className: P + "btn " + P + "btnprimary",
            disabled: !read || !isDirty || loading || !saveCap.ok,
            title: !saveCap.ok ? saveCap.reason || "" : "",
            onClick: save,
            children: t("\u4FDD\u5B58\u8BBE\u7F6E")
          }
        )
      ] })
    ] }),
    scopePrompt ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "overlay", onMouseDown: () => setScopePrompt(null), children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        className: P + "dialog",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": t("\u5207\u6362\u4F5C\u7528\u57DF"),
        onMouseDown: (event) => event.stopPropagation(),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: P + "dlgtitle", children: t("\u5207\u6362\u4F5C\u7528\u57DF") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "risk", children: [
            t("\u5F53\u524D\u4F5C\u7528\u57DF\u6709\u672A\u4FDD\u5B58\u7684\u8349\u7A3F\u3002\u5207\u6362\u5230\u300C"),
            scopePrompt,
            t("\u300D\u5C06\u4E22\u5F03\u8FD9\u4E9B\u8349\u7A3F\u3002")
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "actions", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: P + "btn", autoFocus: true, onClick: () => setScopePrompt(null), children: t("\u7EE7\u7EED\u7F16\u8F91\uFF08\u4E0D\u5207\u6362\uFF09") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "button",
              {
                type: "button",
                className: P + "btn " + P + "btndanger",
                onClick: () => {
                  setScope(scopePrompt);
                  setScopePrompt(null);
                  setNotice(null);
                },
                children: t("\u653E\u5F03\u8349\u7A3F\u5E76\u5207\u6362")
              }
            )
          ] })
        ]
      }
    ) }) : null
  ] });
}
function countOverrides(read) {
  if (!isRecord(read)) return 0;
  if (isRecord(read.fields)) {
    return Object.values(read.fields).filter((f) => isRecord(f) && f.hasOverride === true).length;
  }
  if (isRecord(read.overrides)) return Object.keys(read.overrides).length;
  return 0;
}
function bankFieldInfo(read, key) {
  const fields = isRecord(read) && isRecord(read.fields) ? read.fields : null;
  const finfo = fields && isRecord(fields[key]) ? fields[key] : null;
  if (finfo) {
    return {
      overridden: finfo.hasOverride === true,
      resolved: "value" in finfo ? finfo.value : void 0,
      editable: finfo.editable !== false
    };
  }
  const overrides = isRecord(read) && isRecord(read.overrides) ? read.overrides : null;
  const config = isRecord(read) && isRecord(read.config) ? read.config : null;
  return {
    overridden: overrides ? Object.prototype.hasOwnProperty.call(overrides, key) : false,
    resolved: config ? config[key] : void 0,
    editable: true
  };
}
function SecuritySection({ active, apiUrl, banks, request, cap, openConfirm }) {
  const [bankId, setBankId] = usePersistedBankId();
  const call = useChannel(request, apiUrl + "|" + bankId);
  const [read, setRead] = (0, import_react2.useState)(null);
  const [baseline, setBaseline] = (0, import_react2.useState)(null);
  const [draft, setDraft] = (0, import_react2.useState)(null);
  const [loading, setLoading] = (0, import_react2.useState)(false);
  const [error, setError] = (0, import_react2.useState)(null);
  const [notice, setNotice] = (0, import_react2.useState)(null);
  const load = (0, import_react2.useCallback)(async () => {
    if (!bankId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await call({ op: "bankConfig", apiUrl, bankId });
      const data = isRecord(res.data) ? res.data : null;
      if (!data) throw new Error(t("\u5E93\u914D\u7F6E\u8BFB\u53D6\u7ED3\u679C\u683C\u5F0F\u4E0D\u7B26\u5408\u9884\u671F\u3002"));
      const hasFields = isRecord(data.fields);
      const hasLegacy = isRecord(data.config) && isRecord(data.overrides);
      if (!hasFields && !hasLegacy) throw new Error(t("\u5E93\u914D\u7F6E\u8BFB\u53D6\u7ED3\u679C\u683C\u5F0F\u4E0D\u7B26\u5408\u9884\u671F\u3002"));
      const base = {};
      for (const [key, meta] of Object.entries(BANK_FIELDS)) {
        if (hasFields && isRecord(data.fields[key])) {
          const finfo = data.fields[key];
          const overridden = finfo.hasOverride === true;
          base[key] = {
            set: overridden,
            text: valueToText(meta.kind, overridden ? finfo.overrideValue : finfo.value)
          };
        } else if (hasLegacy) {
          const overridden = Object.prototype.hasOwnProperty.call(data.overrides, key);
          base[key] = {
            set: overridden,
            text: valueToText(meta.kind, overridden ? data.overrides[key] : data.config[key])
          };
        } else {
          base[key] = { set: false, text: valueToText(meta.kind, meta.default) };
        }
      }
      setRead(data);
      setBaseline(base);
      setDraft(JSON.parse(JSON.stringify(base)));
    } catch (err) {
      if (isCancel(err)) return;
      setError(errText(err));
      setRead(null);
      setBaseline(null);
      setDraft(null);
    } finally {
      setLoading(false);
    }
  }, [call, apiUrl, bankId]);
  const loadedBankRef = (0, import_react2.useRef)(null);
  (0, import_react2.useEffect)(() => {
    const identity = apiUrl + "|" + bankId;
    if (!active || !bankId || loadedBankRef.current === identity) return;
    loadedBankRef.current = identity;
    load();
  }, [active, bankId, apiUrl, load]);
  const changedKeys = baseline && draft ? Object.keys(BANK_FIELDS).filter((key) => {
    const b = baseline[key];
    const d = draft[key];
    return !!b && !!d && (b.set !== d.set || d.set && b.text !== d.text);
  }) : [];
  const isDirty = changedKeys.length > 0;
  const patchCap = cap("bankPatch");
  const resetCap = cap("bankReset");
  const setValue = (key, patchPart) => {
    setDraft((prev) => prev ? { ...prev, [key]: { ...prev[key], ...patchPart } } : prev);
  };
  const save = () => {
    if (!read || !draft) return;
    const problems = [];
    const updates = {};
    for (const key of changedKeys) {
      const meta = BANK_FIELDS[key];
      const cell = draft[key];
      if (!cell.set) {
        updates[key] = null;
        continue;
      }
      const result = textToValue(meta.kind, cell.text, meta);
      if (!result.ok) problems.push(t(meta.label) + t("\uFF1A") + result.error);
      else updates[key] = result.value;
    }
    if (problems.length > 0) {
      setError(t("\u8BF7\u5148\u4FEE\u6B63\uFF1A") + problems.join("\uFF1B"));
      return;
    }
    openConfirm({
      title: t("\u4FDD\u5B58\u5E93\u7EA7\u914D\u7F6E\u8986\u76D6"),
      op: "bankPatch",
      cost: COST_OPERATIONS.includes("bankPatch"),
      apiUrl,
      bankId,
      typedSubject: bankId,
      riskNote: t("\u5C06\u6309\u5B57\u6BB5\u66F4\u65B0\u8BE5\u8BB0\u5FC6\u5E93\u7684\u914D\u7F6E\u8986\u76D6\uFF08null \u8868\u793A\u6062\u590D\u7EE7\u627F\uFF09\u3002\u57FA\u4E8E\u8BFB\u53D6\u65F6\u7684 revision \u505A\u4E50\u89C2\u5E76\u53D1\u6821\u9A8C\uFF1B\u82E5\u914D\u7F6E\u5DF2\u88AB\u4ED6\u4EBA\u4FEE\u6539\u5C06\u8FD4\u56DE 409\uFF0C\u9700\u8981\u91CD\u65B0\u8BFB\u53D6\u540E\u518D\u63D0\u4EA4\u3002"),
      params: { updates, revision: read.revision ?? null },
      transport: "request",
      timeoutMs: READ_TIMEOUT,
      summary: [
        { label: "API", value: apiUrl },
        { label: t("\u8BB0\u5FC6\u5E93"), value: bankId },
        { label: t("\u53D8\u66F4\u5B57\u6BB5"), value: changedKeys.map((key) => t(BANK_FIELDS[key].label)).join(t("\u3001")) }
      ],
      onDone: () => {
        setNotice(t("\u5E93\u7EA7\u914D\u7F6E\u5DF2\u4FDD\u5B58\u3002"));
        load();
      }
    });
  };
  const resetAll = () => {
    openConfirm({
      title: t("\u91CD\u7F6E\u8BE5\u5E93\u5168\u90E8\u8986\u76D6"),
      op: "bankReset",
      cost: COST_OPERATIONS.includes("bankReset"),
      apiUrl,
      bankId,
      typedSubject: bankId,
      confirmLabel: t("\u786E\u8BA4\u91CD\u7F6E"),
      riskNote: t("\u5C06\u5220\u9664\u6B64\u5E93\u7684\u5168\u90E8\u914D\u7F6E\u8986\u76D6\uFF0C\u5305\u62EC\u672C\u9875\u672A\u5C55\u793A\u7684\u7B56\u7565\u4E0E Memory Defense\uFF1B\u6240\u6709\u5B57\u6BB5\u6062\u590D\u7EE7\u627F\u5168\u5C40/\u9ED8\u8BA4\u8BBE\u7F6E\u3002\u4E0D\u5220\u9664\u8BB0\u5FC6\u6B63\u6587\uFF0C\u4F46\u53EF\u80FD\u964D\u4F4E\u9632\u62A4\u6216\u6539\u53D8\u540E\u7EED\u884C\u4E3A\u3002\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002"),
      params: {},
      transport: "request",
      timeoutMs: READ_TIMEOUT,
      summary: [
        { label: "API", value: apiUrl },
        { label: t("\u8BB0\u5FC6\u5E93"), value: bankId },
        { label: t("\u5F53\u524D\u8986\u76D6\u6570"), value: String(countOverrides(read)) }
      ],
      onDone: () => {
        setNotice(t("\u8BE5\u5E93\u7684\u5168\u90E8\u8986\u76D6\u5DF2\u91CD\u7F6E\u3002"));
        load();
      }
    });
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "card", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "cardhead", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: P + "cardtitle", children: t("\u5E93\u7EA7\u914D\u7F6E\uFF08\u6309\u5B57\u6BB5\u4FDD\u5B58\uFF09") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: P + "btn", disabled: !bankId || loading, onClick: load, children: loading ? t("\u8BFB\u53D6\u4E2D\u2026") : t("\u91CD\u65B0\u8BFB\u53D6") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            type: "button",
            className: P + "btn " + P + "btndanger",
            disabled: !read || loading || !resetCap.ok,
            title: !resetCap.ok ? resetCap.reason || "" : "",
            onClick: resetAll,
            children: t("\u91CD\u7F6E\u5168\u90E8\u8986\u76D6\u2026")
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BankPicker, { banks, value: bankId, onChange: (next) => {
      setBankId(next);
      setNotice(null);
    } }),
    error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "errbanner", role: "alert", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: error }) }) : null,
    notice ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "notice", role: "status", children: notice }) : null,
    loading && !read ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "muted", role: "status", children: t("\u8BFB\u53D6\u4E2D\u2026") }) : null,
    !bankId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "muted", children: t("\u8BF7\u5148\u9009\u62E9\u8BB0\u5FC6\u5E93\u3002") }) : null,
    read && draft ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      Object.entries(BANK_FIELDS).map(([key, meta]) => {
        const cell = draft[key];
        const info = bankFieldInfo(read, key);
        const editable = info.editable;
        const overridden = info.overridden;
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "label", children: t(meta.label) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "control", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: P + "check", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "input",
                {
                  type: "checkbox",
                  checked: cell.set,
                  disabled: !editable,
                  "aria-label": t(meta.label) + t("\uFF08\u8986\u76D6\uFF09"),
                  onChange: (event) => setValue(key, { set: event.target.checked })
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("\u8986\u76D6\uFF08\u53D6\u6D88\u5219\u6062\u590D\u7EE7\u627F\uFF09") }),
              overridden ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MgmtPill, { tone: "warn", children: t("\u5DF2\u8986\u76D6") }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MgmtPill, { tone: "mute", children: t("\u7EE7\u627F") })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              KindEditor,
              {
                meta,
                value: cell.text,
                disabled: !cell.set || !editable,
                ariaLabel: t(meta.label),
                onChange: (text) => setValue(key, { text })
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "hint", children: [
              t("\u751F\u6548\u503C\uFF1A"),
              valueToText(meta.kind, info.resolved) || "\u2014",
              !editable ? t("\uFF08\u670D\u52A1\u7AEF\u6807\u8BB0\u4E3A\u4E0D\u53EF\u7F16\u8F91\uFF09") : ""
            ] })
          ] })
        ] }, key);
      }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: P + "muted", role: "status", children: isDirty ? tf("\u6709 {0} \u4E2A\u5B57\u6BB5\u5F85\u4FDD\u5B58", [changedKeys.length]) : t("\u4E0E\u670D\u52A1\u7AEF\u914D\u7F6E\u4E00\u81F4") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            type: "button",
            className: P + "btn " + P + "btnprimary",
            disabled: !isDirty || loading || !patchCap.ok,
            title: !patchCap.ok ? patchCap.reason || "" : "",
            onClick: save,
            children: t("\u4FDD\u5B58\u53D8\u66F4\u5B57\u6BB5")
          }
        )
      ] })
    ] }) : null
  ] });
}
var DRYRUN_FIELDS = {
  retain_mission: { label: "\u63D0\u53D6\u4EFB\u52A1\u8BF4\u660E", kind: "text" },
  retain_extraction_mode: { label: "\u63D0\u53D6\u6A21\u5F0F", kind: "choice", choices: ["concise", "verbose", "custom", "verbatim", "chunks"] },
  retain_custom_instructions: { label: "\u81EA\u5B9A\u4E49\u63D0\u53D6\u6307\u4EE4", kind: "text" },
  retain_chunk_size: { label: "\u63D0\u53D6\u5206\u5757\u5927\u5C0F", kind: "integer", min: 1 },
  entities_allow_free_form: { label: "\u5141\u8BB8\u81EA\u7531\u5B9E\u4F53\u6807\u7B7E", kind: "boolean" },
  llm_output_language: { label: "\u8F93\u51FA\u8BED\u8A00", kind: "text" }
};
function ModelsSection({ active, apiUrl, banks, request, cap, features, openConfirm }) {
  const [bankId, setBankId] = usePersistedBankId();
  const [pvOperation, setPvOperation] = (0, import_react2.useState)("retain");
  const [pvStrategy, setPvStrategy] = (0, import_react2.useState)("");
  const [pvResult, setPvResult] = (0, import_react2.useState)(null);
  const [drContent, setDrContent] = (0, import_react2.useState)("");
  const [drContext, setDrContext] = (0, import_react2.useState)("");
  const [drStrategy, setDrStrategy] = (0, import_react2.useState)("");
  const [drOverrides, setDrOverrides] = (0, import_react2.useState)(() => {
    const init = {};
    for (const [key, meta] of Object.entries(DRYRUN_FIELDS)) {
      init[key] = { set: false, text: meta.kind === "boolean" ? "true" : "" };
    }
    return init;
  });
  const [drResult, setDrResult] = (0, import_react2.useState)(null);
  const [drError, setDrError] = (0, import_react2.useState)(null);
  const [lhResult, setLhResult] = (0, import_react2.useState)(null);
  (0, import_react2.useEffect)(() => {
    setPvResult(null);
    setDrResult(null);
    setLhResult(null);
    setDrError(null);
  }, [apiUrl, bankId]);
  const previewCap = cap("promptPreview");
  const dryRunCap = cap("dryRun");
  const llmCap = cap("llmTest");
  const healthFeature = features && features.bank_llm_health === true;
  const healthReason = !features ? t("\u7279\u6027\u672A\u77E5\uFF1A\u8BF7\u5148\u5728\u300C\u8BCA\u65AD\u300D\u5206\u7C7B\u6210\u529F\u52A0\u8F7D\u8BCA\u65AD\u4FE1\u606F") : healthFeature ? null : t("\u670D\u52A1\u7AEF\u672A\u542F\u7528 bank_llm_health \u7279\u6027");
  const runPreview = () => {
    const params = { operation: pvOperation };
    if (pvStrategy.trim()) params.strategy = pvStrategy.trim();
    openConfirm({
      title: t("\u9884\u89C8\u63D0\u793A\u8BCD"),
      op: "promptPreview",
      cost: COST_OPERATIONS.includes("promptPreview"),
      apiUrl,
      bankId,
      typedSubject: bankId,
      riskNote: t("\u8BFB\u53D6\u8BE5\u64CD\u4F5C\u5F53\u524D\u751F\u6548\u7684\u63D0\u793A\u8BCD\u7EC4\u6210\uFF08\u4E0D\u8C03\u7528 LLM\u3001\u4E0D\u4EA7\u751F\u8D39\u7528\uFF09\u3002"),
      params,
      transport: "request",
      timeoutMs: READ_TIMEOUT,
      summary: [
        { label: "API", value: apiUrl },
        { label: t("\u8BB0\u5FC6\u5E93"), value: bankId },
        { label: t("\u64CD\u4F5C"), value: pvOperation }
      ],
      onDone: (res) => {
        setPvResult(res && isRecord(res.data) ? res.data : null);
      }
    });
  };
  const runDryRun = () => {
    if (!drContent.trim()) {
      setDrError(t("\u5019\u9009\u6587\u672C\u4E0D\u80FD\u4E3A\u7A7A\u3002"));
      return;
    }
    const overrides = {};
    const problems = [];
    for (const [key, cell] of Object.entries(drOverrides)) {
      if (!cell.set) continue;
      const meta = DRYRUN_FIELDS[key];
      const result = textToValue(meta.kind, cell.text, meta);
      if (!result.ok) problems.push(t(meta.label) + t("\uFF1A") + result.error);
      else overrides[key] = result.value;
    }
    if (problems.length > 0) {
      setDrError(t("\u8BF7\u5148\u4FEE\u6B63\uFF1A") + problems.join("\uFF1B"));
      return;
    }
    setDrError(null);
    const params = { content: drContent };
    if (drContext.trim()) params.context = drContext.trim();
    if (drStrategy.trim()) params.strategy = drStrategy.trim();
    if (Object.keys(overrides).length > 0) params.overrides = overrides;
    openConfirm({
      title: t("\u5E72\u8DD1\u63D0\u53D6\uFF08\u8C03\u7528 LLM\uFF09"),
      op: "dryRun",
      cost: COST_OPERATIONS.includes("dryRun"),
      apiUrl,
      bankId,
      typedSubject: bankId,
      riskNote: t("\u5C06\u7528\u5019\u9009\u6587\u672C\u8C03\u7528\u4E00\u6B21\u771F\u5B9E LLM \u63D0\u53D6\uFF08\u4E0D\u5199\u5165\u8BB0\u5FC6\u5E93\uFF09\uFF0C\u4F1A\u4EA7\u751F LLM \u8C03\u7528\u8D39\u7528\u3002"),
      params,
      transport: "request",
      timeoutMs: SLOW_TIMEOUT,
      summary: [
        { label: "API", value: apiUrl },
        { label: t("\u8BB0\u5FC6\u5E93"), value: bankId },
        { label: t("\u6587\u672C\u957F\u5EA6"), value: tf("{0} \u4E2A\u5B57\u7B26", [drContent.length]) },
        { label: t("\u5019\u9009\u5B57\u6BB5\u8986\u76D6"), value: String(Object.keys(overrides).length) + t(" \u4E2A") }
      ],
      onDone: (res) => {
        setDrResult(res && isRecord(res.data) ? res.data : null);
      }
    });
  };
  const runHealth = () => {
    openConfirm({
      title: t("LLM \u8FDE\u901A\u6027\u68C0\u6D4B"),
      op: "llmTest",
      cost: COST_OPERATIONS.includes("llmTest"),
      apiUrl,
      bankId,
      typedSubject: bankId,
      riskNote: t("\u5C06\u5BF9 retain / consolidation / reflect \u4E09\u4E2A\u64CD\u4F5C\u5404\u53D1\u8D77\u4E00\u6B21\u771F\u5B9E LLM \u63A2\u6D4B\u8C03\u7528\uFF0C\u4F1A\u4EA7\u751F\u5C11\u91CF LLM \u8C03\u7528\u8D39\u7528\u3002\u7ED3\u679C\u53EA\u5305\u542B\u72B6\u6001\uFF0C\u4E0D\u66B4\u9732 provider/\u6A21\u578B/\u7AEF\u70B9\u3002"),
      params: {},
      transport: "request",
      timeoutMs: SLOW_TIMEOUT,
      summary: [
        { label: "API", value: apiUrl },
        { label: t("\u8BB0\u5FC6\u5E93"), value: bankId }
      ],
      onDone: (res) => {
        setLhResult(res && isRecord(res.data) ? res.data : null);
      }
    });
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "cardhead", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: P + "cardtitle", children: t("\u6A21\u578B\u8C03\u8BD5\u76EE\u6807") }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BankPicker, { banks, value: bankId, onChange: setBankId })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "cardhead", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: P + "cardtitle", children: t("\u63D0\u793A\u8BCD\u9884\u89C8") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            type: "button",
            className: P + "btn",
            disabled: !bankId || !previewCap.ok,
            title: !previewCap.ok ? previewCap.reason || "" : "",
            onClick: runPreview,
            children: t("\u9884\u89C8")
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "select",
          {
            className: P + "select",
            style: { width: "auto" },
            "aria-label": t("\u9884\u89C8\u64CD\u4F5C"),
            value: pvOperation,
            onChange: (event) => setPvOperation(event.target.value),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "retain", children: t("retain\uFF08\u63D0\u53D6\uFF09") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "consolidation", children: t("consolidation\uFF08\u6574\u7406\uFF09") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "reflect", children: t("reflect\uFF08\u53CD\u601D\uFF09") })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            className: P + "input",
            style: { width: "220px" },
            type: "text",
            "aria-label": t("\u7B56\u7565\u540D\uFF08\u53EF\u9009\uFF09"),
            placeholder: t("\u7B56\u7565\u540D\uFF08\u53EF\u9009\uFF09"),
            value: pvStrategy,
            onChange: (event) => setPvStrategy(event.target.value)
          }
        )
      ] }),
      pvResult ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "control", children: [
        typeof pvResult.skipped_reason === "string" && pvResult.skipped_reason ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "risk", children: [
          t("\u8BE5\u64CD\u4F5C\u5F53\u524D\u88AB\u8DF3\u8FC7\uFF1A"),
          pvResult.skipped_reason
        ] }) : null,
        Array.isArray(pvResult.strategies) && pvResult.strategies.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "hint", children: [
          t("\u53EF\u7528\u7B56\u7565\uFF1A"),
          pvResult.strategies.join(t("\u3001")),
          pvResult.strategy ? t("\uFF1B\u5F53\u524D\uFF1A") + pvResult.strategy : ""
        ] }) : null,
        Array.isArray(pvResult.messages) ? pvResult.messages.map((message, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "block", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MgmtPill, { tone: message.role === "system" ? "warn" : "ok", children: message.role || t("\u672A\u77E5\u89D2\u8272") }) }),
          Array.isArray(message.blocks) ? message.blocks.map((block, blockIndex) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "block" + (block.active === false ? " " + P + "blockoff" : ""), children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "actions", children: [
              block.heading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: block.heading }) : null,
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MgmtPill, { tone: block.active === false ? "mute" : "ok", children: block.active === false ? t("\u505C\u7528") : t("\u542F\u7528") }),
              block.source ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MgmtPill, { tone: "mute", children: block.source }) : null,
              block.field ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: P + "mono", children: block.field }) : null,
              block.editable === true ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MgmtPill, { tone: "warn", children: t("\u53EF\u8986\u76D6") }) : null
            ] }),
            block.text ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", { className: P + "pre", children: block.text }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "muted", children: t("\uFF08\u7A7A\u5757\uFF09") })
          ] }, blockIndex)) : null
        ] }, index)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "muted", children: t("\u54CD\u5E94\u4E2D\u6CA1\u6709 messages\u3002") }),
        Array.isArray(pvResult.run_settings) && pvResult.run_settings.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", { className: P + "table", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: t("\u8FD0\u884C\u8BBE\u7F6E") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: t("\u751F\u6548\u503C") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: t("\u7C7B\u578B") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: t("\u53EF\u8986\u76D6") })
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: pvResult.run_settings.map((setting, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: P + "mono", children: setting.field }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: setting.value == null ? t("\uFF08\u672A\u8BBE\u7F6E\uFF09") : setting.value }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: setting.kind }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: setting.editable === true ? t("\u662F") : t("\u5426") })
          ] }, index)) })
        ] }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "hint", children: [
          t("\u54CD\u5E94 schema\uFF1A"),
          isRecord(pvResult.response_schema) ? t("\u5B58\u5728\uFF08") + Object.keys(pvResult.response_schema).length + t(" \u4E2A\u9876\u5C42\u952E\uFF09") : t("\u65E0")
        ] })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "muted", children: t("\u9009\u62E9\u64CD\u4F5C\u540E\u70B9\u51FB\u300C\u9884\u89C8\u300D\u3002") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "cardhead", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: P + "cardtitle", children: t("\u5E72\u8DD1\u63D0\u53D6\uFF08\u5019\u9009\u5B57\u6BB5 + \u8D39\u7528\u786E\u8BA4\uFF09") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            type: "button",
            className: P + "btn",
            disabled: !bankId || !dryRunCap.ok || !drContent.trim(),
            title: !dryRunCap.ok ? dryRunCap.reason || "" : "",
            onClick: runDryRun,
            children: t("\u5E72\u8DD1")
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t("\u5019\u9009\u6587\u672C"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "textarea",
        {
          className: P + "textarea",
          "aria-label": t("\u5E72\u8DD1\u5019\u9009\u6587\u672C"),
          rows: 5,
          placeholder: t("\u8981\u7528 LLM \u8BD5\u63D0\u53D6\u7684\u6587\u672C\uFF08\u4E0D\u4F1A\u5199\u5165\u8BB0\u5FC6\u5E93\uFF09"),
          value: drContent,
          onChange: (event) => setDrContent(event.target.value)
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t("\u4E0A\u4E0B\u6587\uFF08\u53EF\u9009\uFF09"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "input",
        {
          className: P + "input",
          type: "text",
          "aria-label": t("\u5E72\u8DD1\u4E0A\u4E0B\u6587"),
          value: drContext,
          onChange: (event) => setDrContext(event.target.value)
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t("\u7B56\u7565\uFF08\u53EF\u9009\uFF09"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "input",
        {
          className: P + "input",
          type: "text",
          "aria-label": t("\u5E72\u8DD1\u7B56\u7565\u540D"),
          value: drStrategy,
          onChange: (event) => setDrStrategy(event.target.value)
        }
      ) }),
      Object.entries(DRYRUN_FIELDS).map(([key, meta]) => {
        const cell = drOverrides[key];
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "label", children: t(meta.label) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "control", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: P + "check", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "input",
                {
                  type: "checkbox",
                  checked: cell.set,
                  "aria-label": t(meta.label) + t("\uFF08\u672C\u6B21\u8986\u76D6\uFF09"),
                  onChange: (event) => setDrOverrides((prev) => ({ ...prev, [key]: { ...prev[key], set: event.target.checked } }))
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("\u672C\u6B21\u8986\u76D6") })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              KindEditor,
              {
                meta,
                value: cell.text,
                disabled: !cell.set,
                ariaLabel: t(meta.label),
                onChange: (text) => setDrOverrides((prev) => ({ ...prev, [key]: { ...prev[key], text } }))
              }
            )
          ] })
        ] }, key);
      }),
      drError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "errbanner", role: "alert", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: drError }) }) : null,
      drResult ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "control", children: [
        isRecord(drResult.usage) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "notice", role: "status", children: [
          tf("Token \u7528\u91CF\uFF1A\u8F93\u5165 {0}\uFF0C\u8F93\u51FA {1}\uFF0C\u603B\u8BA1 {2}", [drResult.usage.input_tokens ?? "\u2014", drResult.usage.output_tokens ?? "\u2014", drResult.usage.total_tokens ?? "\u2014"]),
          typeof drResult.usage.cached_tokens === "number" ? tf("\uFF0C\u7F13\u5B58 {0}", [drResult.usage.cached_tokens]) : ""
        ] }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "hint", children: tf("\u63D0\u53D6\u5230 {0} \u6761\u5019\u9009\u4E8B\u5B9E\uFF08{1} \u4E2A\u5206\u5757\uFF09\uFF0C\u672A\u5199\u5165\u8BB0\u5FC6\u5E93\u3002", [Array.isArray(drResult.facts) ? drResult.facts.length : 0, Array.isArray(drResult.chunks) ? drResult.chunks.length : 0]) }),
        Array.isArray(drResult.facts) ? drResult.facts.map((fact, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "block", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: fact.text }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "actions", children: [
            fact.fact_type ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MgmtPill, { tone: "mute", children: fact.fact_type }) : null,
            Array.isArray(fact.entities) && fact.entities.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: P + "muted", children: [
              t("\u5B9E\u4F53\uFF1A"),
              fact.entities.join(t("\u3001"))
            ] }) : null
          ] })
        ] }, index)) : null
      ] }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "cardhead", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: P + "cardtitle", children: t("LLM \u8FDE\u901A\u6027\u68C0\u6D4B") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            type: "button",
            className: P + "btn",
            disabled: !bankId || !healthFeature || !llmCap.ok,
            title: healthReason || (!llmCap.ok ? llmCap.reason || "" : ""),
            onClick: runHealth,
            children: t("\u68C0\u6D4B")
          }
        )
      ] }),
      healthReason ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "muted", children: [
        healthReason,
        t("\uFF0C\u68C0\u6D4B\u4E0D\u53EF\u7528\u3002")
      ] }) : null,
      lhResult && Array.isArray(lhResult.operations) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", { className: P + "table", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: t("\u64CD\u4F5C") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: t("\u7ED3\u679C") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: t("\u72B6\u6001") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: t("\u5EF6\u8FDF") })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: lhResult.operations.map((entry, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: P + "mono", children: entry.operation }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MgmtPill, { tone: entry.ok === true ? "ok" : "bad", children: entry.ok === true ? t("\u8FDE\u901A") : t("\u5931\u8D25") }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: entry.status }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: typeof entry.latency_ms === "number" ? Math.round(entry.latency_ms) + " ms" : "\u2014" })
        ] }, index)) })
      ] }) : null
    ] })
  ] });
}
function submittedOperationId(res) {
  if (!isRecord(res) || !isRecord(res.data)) return null;
  if (typeof res.data.operation_id === "string" && res.data.operation_id) return res.data.operation_id;
  if (typeof res.data.operationId === "string" && res.data.operationId) return res.data.operationId;
  return null;
}
function AdvancedSection({ active, apiUrl, banks, request, cap, openConfirm }) {
  const [bankId, setBankId] = usePersistedBankId();
  const call = useChannel(request, apiUrl + "|" + bankId);
  const [aliases, setAliases] = (0, import_react2.useState)({ loading: false, error: null, list: null });
  const [newAlias, setNewAlias] = (0, import_react2.useState)("");
  const [newPrimary, setNewPrimary] = (0, import_react2.useState)(false);
  const [aliasError, setAliasError] = (0, import_react2.useState)(null);
  const [exIncludeData, setExIncludeData] = (0, import_react2.useState)(true);
  const [exIncludeConfig, setExIncludeConfig] = (0, import_react2.useState)(true);
  const [exIncludeHistory, setExIncludeHistory] = (0, import_react2.useState)(false);
  const [imMode, setImMode] = (0, import_react2.useState)("restore");
  const [imTarget, setImTarget] = (0, import_react2.useState)("");
  const [imConflict, setImConflict] = (0, import_react2.useState)("skip");
  const [imIncludeData, setImIncludeData] = (0, import_react2.useState)(true);
  const [imIncludeConfig, setImIncludeConfig] = (0, import_react2.useState)(true);
  const [imIncludeHistory, setImIncludeHistory] = (0, import_react2.useState)(false);
  const [fileInfo, setFileInfo] = (0, import_react2.useState)(null);
  const [hashing, setHashing] = (0, import_react2.useState)(false);
  const [importError, setImportError] = (0, import_react2.useState)(null);
  const [clTarget, setClTarget] = (0, import_react2.useState)("");
  const [clIncludeData, setClIncludeData] = (0, import_react2.useState)(true);
  const [clIncludeConfig, setClIncludeConfig] = (0, import_react2.useState)(true);
  const [clIncludeHistory, setClIncludeHistory] = (0, import_react2.useState)(false);
  const [cloneError, setCloneError] = (0, import_react2.useState)(null);
  const [tracked, setTracked] = (0, import_react2.useState)([]);
  const trackedRef = (0, import_react2.useRef)([]);
  trackedRef.current = tracked;
  const loadAliases = (0, import_react2.useCallback)(async () => {
    if (!bankId) return;
    setAliases((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await call({ op: "aliases", apiUrl, bankId });
      const data = isRecord(res.data) ? res.data : {};
      setAliases({ loading: false, error: null, list: Array.isArray(data.aliases) ? data.aliases : [] });
    } catch (err) {
      if (isCancel(err)) return;
      setAliases((prev) => ({ ...prev, loading: false, error: errText(err) }));
    }
  }, [call, apiUrl, bankId]);
  (0, import_react2.useEffect)(() => {
    if (active && bankId) loadAliases();
  }, [active, bankId, apiUrl]);
  (0, import_react2.useEffect)(() => {
    setTracked([]);
    setFileInfo(null);
    setImportError(null);
    setCloneError(null);
  }, [apiUrl]);
  (0, import_react2.useEffect)(() => {
    const timer = setInterval(async () => {
      const pending = trackedRef.current.filter((op) => op.status === "pending" || op.status === "processing");
      for (const op of pending) {
        try {
          const res = await call({ op: "operation", apiUrl, bankId: op.bankId, params: { operationId: op.id } });
          const data = isRecord(res.data) ? res.data : {};
          setTracked((prev) => prev.map((item) => item.id === op.id ? {
            ...item,
            status: typeof data.status === "string" ? data.status : "unknown",
            progress: isRecord(data.progress) ? data.progress : null,
            error: typeof data.error_message === "string" && data.error_message ? data.error_message : null,
            pollError: null
          } : item));
        } catch (err) {
          if (isCancel(err)) continue;
          setTracked((prev) => prev.map((item) => item.id === op.id ? { ...item, pollError: t("\u72B6\u6001\u6682\u65F6\u672A\u77E5\uFF1A") + errText(err) + t("\uFF08\u7EE7\u7EED\u8F6E\u8BE2\uFF0C\u4E0D\u81EA\u52A8\u91CD\u505A\uFF09") } : item));
        }
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [call, apiUrl]);
  const addTracked = (kind, id, label) => {
    setTracked((prev) => [...prev, {
      id,
      bankId,
      kind,
      label,
      status: "pending",
      progress: null,
      error: null,
      pollError: null
    }]);
  };
  const aliasAction = (action, alias, primary) => {
    const opName = action === "add" ? "aliasAdd" : action === "primary" ? "aliasPrimary" : "aliasRemove";
    const titles = { add: t("\u6DFB\u52A0\u522B\u540D"), primary: primary ? t("\u8BBE\u4E3A\u4E3B\u663E\u522B\u540D") : t("\u53D6\u6D88\u4E3B\u663E\u522B\u540D"), remove: t("\u79FB\u9664\u522B\u540D") };
    const params = action === "add" ? { alias, primary } : action === "primary" ? { alias, primary } : { alias };
    openConfirm({
      title: titles[action],
      op: opName,
      cost: COST_OPERATIONS.includes(opName),
      apiUrl,
      bankId,
      typedSubject: bankId,
      riskNote: action === "remove" ? t("\u5C06\u79FB\u9664\u8BE5\u522B\u540D\uFF1B\u5F15\u7528\u65E7\u522B\u540D\u7684\u8BF7\u6C42\u5C06\u4E0D\u518D\u8DEF\u7531\u5230\u8BE5\u5E93\u3002") : t("\u5C06\u66F4\u65B0\u8BE5\u8BB0\u5FC6\u5E93\u7684\u522B\u540D\u8DEF\u7531\u3002"),
      params,
      transport: "request",
      timeoutMs: READ_TIMEOUT,
      summary: [
        { label: "API", value: apiUrl },
        { label: t("\u8BB0\u5FC6\u5E93"), value: bankId },
        { label: t("\u522B\u540D"), value: alias }
      ],
      onDone: () => {
        setNewAlias("");
        setNewPrimary(false);
        loadAliases();
      }
    });
  };
  const submitAlias = () => {
    const problem = aliasProblem(newAlias);
    if (problem) {
      setAliasError(problem);
      return;
    }
    setAliasError(null);
    aliasAction("add", newAlias.trim(), newPrimary);
  };
  const submitExport = () => {
    openConfirm({
      title: t("\u5BFC\u51FA\u8BB0\u5FC6\u5E93\uFF08\u5F02\u6B65\uFF09"),
      op: "transferExport",
      cost: COST_OPERATIONS.includes("transferExport"),
      apiUrl,
      bankId,
      typedSubject: bankId,
      riskNote: t("\u5C06\u63D0\u4EA4\u4E00\u6B21\u5F02\u6B65\u5BFC\u51FA\uFF0C\u4EA7\u51FA ZIP \u5F52\u6863\u3002202 \u4EC5\u4EE3\u8868\u5DF2\u53D7\u7406\uFF1A\u4EFB\u52A1\u5B8C\u6210\u540E\u624D\u80FD\u4E0B\u8F7D\u3002\u5D4C\u5165\u5411\u91CF\u4E0E\u5185\u90E8 ID \u4E0D\u4F1A\u968F\u5F52\u6863\u5BFC\u51FA\u3002"),
      params: { includeData: exIncludeData, includeBankConfig: exIncludeConfig, includeHistory: exIncludeHistory },
      transport: "request",
      timeoutMs: SLOW_TIMEOUT,
      summary: [
        { label: "API", value: apiUrl },
        { label: t("\u8BB0\u5FC6\u5E93"), value: bankId }
      ],
      onDone: (res) => {
        const id = submittedOperationId(res);
        if (id) addTracked("export", id, t("\u5BFC\u51FA"));
      }
    });
  };
  const onFilePicked = async (event) => {
    const file = event.target.files && event.target.files[0];
    setImportError(null);
    setFileInfo(null);
    if (!file) return;
    if (file.size > UPLOAD_LIMIT) {
      setImportError(tf("\u6587\u4EF6\u8D85\u8FC7 {0} \u4E0A\u4F20\u4E0A\u9650\u3002", [fmtBytes(UPLOAD_LIMIT)]));
      return;
    }
    if (file.size < 4) {
      setImportError(t("\u6587\u4EF6\u8FC7\u5C0F\uFF0C\u4E0D\u662F\u6709\u6548\u7684 ZIP \u5F52\u6863\u3002"));
      return;
    }
    try {
      const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
      const isZip = head[0] === 80 && head[1] === 75 && (head[2] === 3 && head[3] === 4 || head[2] === 5 && head[3] === 6);
      if (!isZip) {
        setImportError(t("\u6587\u4EF6\u4E0D\u662F ZIP \u5F52\u6863\uFF08\u7F3A\u5C11 PK \u6587\u4EF6\u5934\uFF09\u3002"));
        return;
      }
      if (typeof crypto === "undefined" || !crypto.subtle) {
        setImportError(t("\u5F53\u524D\u73AF\u5883\u65E0\u6CD5\u8BA1\u7B97 SHA-256 \u6307\u7EB9\uFF08\u9700\u8981\u5B89\u5168\u4E0A\u4E0B\u6587\uFF09\uFF0C\u65E0\u6CD5\u4E0A\u4F20\u3002"));
        return;
      }
      setHashing(true);
      const buffer = await file.arrayBuffer();
      const digest = await crypto.subtle.digest("SHA-256", buffer);
      const sha256 = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
      setFileInfo({ file, size: file.size, sha256 });
    } catch (err) {
      setImportError(t("\u8BFB\u53D6\u6587\u4EF6\u5931\u8D25\uFF1A") + errText(err));
    } finally {
      setHashing(false);
    }
  };
  const submitImport = () => {
    if (!fileInfo) {
      setImportError(t("\u8BF7\u5148\u9009\u62E9\u6709\u6548\u7684 ZIP \u5F52\u6863\u3002"));
      return;
    }
    if (imMode === "restore" && !imTarget.trim()) {
      setImportError(t("restore \u6A21\u5F0F\u5FC5\u987B\u586B\u5199\u76EE\u6807\u8BB0\u5FC6\u5E93 ID\u3002"));
      return;
    }
    setImportError(null);
    const params = {
      mode: imMode,
      fileSize: fileInfo.size,
      fileSha256: fileInfo.sha256
    };
    if (imMode === "restore") {
      params.targetBankId = imTarget.trim();
      params.includeData = imIncludeData;
      params.includeBankConfig = imIncludeConfig;
      params.includeHistory = imIncludeHistory;
    } else {
      params.documentConflict = imConflict;
    }
    openConfirm({
      title: t("\u5BFC\u5165 ZIP \u5F52\u6863\uFF08\u5F02\u6B65\uFF09"),
      op: "transferImport",
      cost: COST_OPERATIONS.includes("transferImport"),
      apiUrl,
      bankId,
      typedSubject: bankId,
      riskNote: t("\u5C06\u4E0A\u4F20\u5F52\u6863\u5E76\u63D0\u4EA4\u5F02\u6B65\u5BFC\u5165\u3002\u4E8B\u5B9E\u4F1A\u4EE5\u76EE\u6807\u5E93\u7684\u5D4C\u5165\u6A21\u578B\u91CD\u65B0\u5D4C\u5165\u5E76\u91CD\u65B0\u89E3\u6790\u5B9E\u4F53\uFF1B\u4E0D\u8C03\u7528 LLM \u63D0\u53D6\u3001\u4E0D\u865A\u6784\u65B0\u4E8B\u5B9E\u3002202 \u4EC5\u4EE3\u8868\u5DF2\u53D7\u7406\u3002\u6587\u4EF6\u5927\u5C0F\u4E0E SHA-256 \u6307\u7EB9\u5DF2\u7ED1\u5B9A\u8FDB\u786E\u8BA4\u4EE4\u724C\u3002"),
      params,
      transport: "upload",
      file: fileInfo.file,
      timeoutMs: SLOW_TIMEOUT,
      summary: [
        { label: "API", value: apiUrl },
        { label: t("\u4EFB\u52A1\u6240\u5C5E\u5E93"), value: bankId },
        { label: t("\u6587\u4EF6"), value: fileInfo.file.name + " (" + fmtBytes(fileInfo.size) + ")" },
        { label: "SHA-256", value: fileInfo.sha256.slice(0, 16) + "\u2026" },
        { label: t("\u6A21\u5F0F"), value: imMode === "restore" ? "restore \u2192 " + imTarget.trim() : t("merge\uFF08\u51B2\u7A81\uFF1A") + imConflict + "\uFF09" }
      ],
      onDone: (res) => {
        const id = submittedOperationId(res);
        if (id) addTracked("import", id, t("\u5BFC\u5165"));
        setFileInfo(null);
      }
    });
  };
  const submitClone = () => {
    if (!clTarget.trim()) {
      setCloneError(t("\u76EE\u6807\u8BB0\u5FC6\u5E93 ID \u4E0D\u80FD\u4E3A\u7A7A\u3002"));
      return;
    }
    if (clTarget.trim() === bankId) {
      setCloneError(t("\u76EE\u6807\u8BB0\u5FC6\u5E93 ID \u4E0D\u80FD\u4E0E\u6E90\u5E93\u76F8\u540C\u3002"));
      return;
    }
    setCloneError(null);
    openConfirm({
      title: t("\u514B\u9686\u8BB0\u5FC6\u5E93\uFF08\u5F02\u6B65\uFF09"),
      op: "clone",
      cost: COST_OPERATIONS.includes("clone"),
      apiUrl,
      bankId,
      typedSubject: bankId,
      riskNote: t("\u5C06\u628A\u8BE5\u5E93\u590D\u5236\u4E3A\u4E00\u4E2A\u65B0\u5E93\uFF08\u4E0D\u91CD\u65B0\u63D0\u53D6\u3001\u4E0D\u8C03\u7528 LLM\uFF0C\u4E8B\u5B9E\u91CD\u65B0\u5D4C\u5165\u5E76\u91CD\u65B0\u89E3\u6790\u5B9E\u4F53\uFF09\u3002") + (clIncludeConfig ? t("\u6CE8\u610F\uFF1A\u968F\u914D\u7F6E\u4E00\u5E76\u590D\u5236\u7684 webhook \u4F1A\u6307\u5411\u6E90\u5E93\u7684 webhook \u7AEF\u70B9\u3002") : ""),
      params: {
        targetBankId: clTarget.trim(),
        includeData: clIncludeData,
        includeBankConfig: clIncludeConfig,
        includeHistory: clIncludeHistory
      },
      transport: "request",
      timeoutMs: SLOW_TIMEOUT,
      summary: [
        { label: "API", value: apiUrl },
        { label: t("\u6E90\u5E93"), value: bankId },
        { label: t("\u76EE\u6807\u5E93"), value: clTarget.trim() }
      ],
      onDone: (res) => {
        const id = submittedOperationId(res);
        if (id) addTracked("clone", id, tf("\u514B\u9686\u5230 {0}", [clTarget.trim()]));
      }
    });
  };
  const downloadExport = (op) => {
    openConfirm({
      title: t("\u4E0B\u8F7D\u5BFC\u51FA\u5F52\u6863"),
      op: "transferDownload",
      cost: COST_OPERATIONS.includes("transferDownload"),
      apiUrl,
      bankId: op.bankId,
      typedSubject: op.bankId,
      riskNote: t("\u5C06\u901A\u8FC7\u540C\u6E90\u6865\u63A5\u4E0B\u8F7D\u8BE5\u5BFC\u51FA\u4EFB\u52A1\u4EA7\u51FA\u7684 ZIP \u5F52\u6863\uFF08\u4E0A\u9650 ") + fmtBytes(DOWNLOAD_LIMIT) + t("\uFF09\uFF1B\u4E0A\u6E38\u4E0B\u8F7D\u5730\u5740\u4E0E\u51ED\u636E\u4E0D\u4F1A\u66B4\u9732\u5230\u9875\u9762\u3002"),
      params: { operationId: op.id },
      transport: "download",
      timeoutMs: DOWNLOAD_TIMEOUT,
      confirmLabel: t("\u786E\u8BA4\u4E0B\u8F7D"),
      summary: [
        { label: "API", value: apiUrl },
        { label: t("\u8BB0\u5FC6\u5E93"), value: op.bankId },
        { label: t("\u4EFB\u52A1 ID"), value: op.id }
      ],
      onDone: () => void 0
    });
  };
  const cancelTracked = (op) => {
    openConfirm({
      title: t("\u53D6\u6D88\u5F02\u6B65\u4EFB\u52A1"),
      op: "operationCancel",
      cost: COST_OPERATIONS.includes("operationCancel"),
      apiUrl,
      bankId: op.bankId,
      typedSubject: op.bankId,
      riskNote: t("\u5C06\u8BF7\u6C42\u53D6\u6D88\u8BE5\u5F02\u6B65\u4EFB\u52A1\uFF1B\u5DF2\u5F00\u59CB\u6267\u884C\u7684\u90E8\u5206\u65E0\u6CD5\u56DE\u6EDA\u3002"),
      params: { operationId: op.id },
      transport: "request",
      timeoutMs: READ_TIMEOUT,
      summary: [
        { label: "API", value: apiUrl },
        { label: t("\u8BB0\u5FC6\u5E93"), value: op.bankId },
        { label: t("\u4EFB\u52A1 ID"), value: op.id }
      ],
      onDone: () => void 0
    });
  };
  const exportCap = cap("transferExport");
  const importCap = cap("transferImport");
  const cloneBaseCap = cap("clone");
  const cloneCap = !cloneBaseCap.ok ? cloneBaseCap : !exportCap.ok ? { ok: false, reason: t("\u514B\u9686\u9700\u8981\u5BFC\u51FA\u80FD\u529B\uFF1A") + (exportCap.reason || t("\u4E0D\u53EF\u7528")) } : !importCap.ok ? { ok: false, reason: t("\u514B\u9686\u9700\u8981\u5BFC\u5165\u80FD\u529B\uFF1A") + (importCap.reason || t("\u4E0D\u53EF\u7528")) } : cloneBaseCap;
  const downloadCap = cap("transferDownload");
  const cancelCap = cap("operationCancel");
  const aliasAddCap = cap("aliasAdd");
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "cardhead", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: P + "cardtitle", children: t("\u9AD8\u7EA7\u64CD\u4F5C\u76EE\u6807") }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BankPicker, { banks, value: bankId, onChange: setBankId })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "cardhead", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: P + "cardtitle", children: t("\u522B\u540D") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: P + "btn", disabled: !bankId || aliases.loading, onClick: loadAliases, children: aliases.loading ? t("\u8BFB\u53D6\u4E2D\u2026") : t("\u5237\u65B0\u522B\u540D") })
      ] }),
      aliases.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "errbanner", role: "alert", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
        t("\u522B\u540D\u8BFB\u53D6\u5931\u8D25\uFF1A"),
        aliases.error
      ] }) }) : null,
      aliases.list ? aliases.list.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "muted", children: t("\u8BE5\u5E93\u6682\u65E0\u522B\u540D\u3002") }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", { className: P + "table", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: t("\u522B\u540D") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: t("\u4E3B\u663E") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: t("\u64CD\u4F5C") })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: aliases.list.map((entry, index) => {
          const name2 = typeof entry.alias === "string" ? entry.alias : String(entry.alias ?? "");
          const primary = entry.primary === true;
          const primaryCap = cap("aliasPrimary");
          const removeCap = cap("aliasRemove");
          return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: name2 }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: primary ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MgmtPill, { tone: "ok", children: t("\u4E3B\u663E") }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MgmtPill, { tone: "mute", children: t("\u666E\u901A") }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "rowactions", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "button",
                {
                  type: "button",
                  className: P + "btn",
                  disabled: !primaryCap.ok,
                  title: !primaryCap.ok ? primaryCap.reason || "" : "",
                  onClick: () => aliasAction("primary", name2, !primary),
                  children: primary ? t("\u53D6\u6D88\u4E3B\u663E") : t("\u8BBE\u4E3A\u4E3B\u663E")
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "button",
                {
                  type: "button",
                  className: P + "btn " + P + "btndanger",
                  disabled: !removeCap.ok,
                  title: !removeCap.ok ? removeCap.reason || "" : "",
                  onClick: () => aliasAction("remove", name2),
                  children: t("\u79FB\u9664")
                }
              )
            ] }) })
          ] }, name2 || index);
        }) })
      ] }) : !aliases.loading && !aliases.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "muted", children: t("\u9009\u62E9\u8BB0\u5FC6\u5E93\u540E\u81EA\u52A8\u8BFB\u53D6\u522B\u540D\u3002") }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "label", children: t("\u65B0\u589E\u522B\u540D") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "control", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "actions", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                className: P + "input",
                style: { width: "260px" },
                type: "text",
                "aria-label": t("\u65B0\u522B\u540D"),
                placeholder: t("UTF-8 \u540D\u79F0\uFF08\u53EF\u4E2D\u6587\uFF09"),
                value: newAlias,
                onChange: (event) => {
                  setNewAlias(event.target.value);
                  setAliasError(null);
                }
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: P + "check", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: newPrimary, onChange: (event) => setNewPrimary(event.target.checked) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("\u540C\u65F6\u8BBE\u4E3A\u4E3B\u663E") })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "button",
              {
                type: "button",
                className: P + "btn",
                disabled: !bankId || !newAlias.trim() || !aliasAddCap.ok,
                title: !aliasAddCap.ok ? aliasAddCap.reason || "" : "",
                onClick: submitAlias,
                children: t("\u6DFB\u52A0\u2026")
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "hint", children: t("\u2264192 \u5B57\u8282\uFF08UTF-8\uFF09\uFF0C\u4E0D\u542B\u63A7\u5236\u5B57\u7B26\u4E0E\u659C\u6760\uFF0C\u4E0D\u80FD\u662F\u8DEF\u5F84\u7247\u6BB5\u3002") }),
          aliasError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "errbanner", role: "alert", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: aliasError }) }) : null
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "cardhead", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: P + "cardtitle", children: t("\u5BFC\u51FA\uFF08\u5F02\u6B65 ZIP\uFF09") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            type: "button",
            className: P + "btn",
            disabled: !bankId || !exportCap.ok,
            title: !exportCap.ok ? exportCap.reason || "" : "",
            onClick: submitExport,
            children: t("\u63D0\u4EA4\u5BFC\u51FA\u2026")
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: P + "check", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: exIncludeData, onChange: (event) => setExIncludeData(event.target.checked) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("\u5305\u542B\u6570\u636E\uFF08\u6587\u6863/\u4E8B\u5B9E/\u89C2\u5BDF/\u9644\u4EF6/\u64CD\u4F5C\u65E5\u5FD7\uFF09") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: P + "check", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: exIncludeConfig, onChange: (event) => setExIncludeConfig(event.target.checked) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("\u5305\u542B\u5E93\u914D\u7F6E") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: P + "check", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: exIncludeHistory, onChange: (event) => setExIncludeHistory(event.target.checked) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("\u5305\u542B\u5386\u53F2\uFF08audit_log / llm_requests\uFF09") })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "cardhead", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: P + "cardtitle", children: t("\u5BFC\u5165\uFF08ZIP \u4E0A\u4F20\uFF09") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            type: "button",
            className: P + "btn",
            disabled: !bankId || !fileInfo || hashing || !importCap.ok,
            title: !importCap.ok ? importCap.reason || "" : "",
            onClick: submitImport,
            children: t("\u4E0A\u4F20\u5E76\u5BFC\u5165\u2026")
          }
        )
      ] }),
      !bankId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "hint", children: t("\u5BFC\u5165\uFF08\u542B restore\uFF09\u8981\u6C42\u4EFB\u52A1\u8BB0\u5F55\u5E93\u5DF2\u5B58\u5728\uFF1Arestore \u7684 URL \u8BB0\u5F55\u5E93\u5FC5\u987B\u5DF2\u5B58\u5728\u3001\u76EE\u6807\u5E93\u5FC5\u987B\u4E0D\u5B58\u5728\uFF0C\u670D\u52A1\u7AEF\u4E0D\u4F1A\u81EA\u52A8\u521B\u5EFA\u8BB0\u5F55\u5E93\u3002 \u5F53\u524D\u6CA1\u6709\u53EF\u7528\u8BB0\u5FC6\u5E93\u65F6\uFF0C\u8BF7\u5148\u901A\u8FC7\u5B98\u65B9\u5165\u53E3\u521B\u5EFA\u4E00\u4E2A\u5E93\uFF0C\u518D\u56DE\u5230\u6B64\u5904\u5BFC\u5165\u3002") }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: P + "check", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "radio", name: P + "immode", checked: imMode === "restore", onChange: () => setImMode("restore") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("restore\uFF08\u6062\u590D\u5230\u65B0\u5E93\uFF09") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: P + "check", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "radio", name: P + "immode", checked: imMode === "merge", onChange: () => setImMode("merge") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("merge\uFF08\u5408\u5E76\u8FDB\u6240\u9009\u5E93\uFF09") })
        ] })
      ] }),
      imMode === "restore" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t("\u76EE\u6807\u5E93 ID"), hint: t("restore \u4F1A\u5728\u8BE5 ID \u4E0B\u521B\u5EFA\u65B0\u5E93\uFF1B\u4E0D\u80FD\u662F\u5DF2\u5B58\u5728\u7684\u5E93\u3002"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            className: P + "input",
            type: "text",
            "aria-label": t("\u5BFC\u5165\u76EE\u6807\u5E93 ID"),
            value: imTarget,
            onChange: (event) => setImTarget(event.target.value)
          }
        ) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "actions", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: P + "check", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: imIncludeData, onChange: (event) => setImIncludeData(event.target.checked) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("\u5305\u542B\u6570\u636E") })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: P + "check", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: imIncludeConfig, onChange: (event) => setImIncludeConfig(event.target.checked) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("\u5305\u542B\u5E93\u914D\u7F6E") })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: P + "check", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: imIncludeHistory, onChange: (event) => setImIncludeHistory(event.target.checked) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("\u5305\u542B\u5386\u53F2") })
          ] })
        ] })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t("\u51B2\u7A81\u5904\u7406"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "select",
        {
          className: P + "select",
          "aria-label": t("\u6587\u6863\u51B2\u7A81\u5904\u7406"),
          value: imConflict,
          onChange: (event) => setImConflict(event.target.value),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "skip", children: t("skip\uFF08\u8DF3\u8FC7\u5DF2\u5B58\u5728\u6587\u6863\uFF09") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "replace", children: t("replace\uFF08\u66FF\u6362\u5DF2\u5B58\u5728\u6587\u6863\uFF09") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "new-id", children: t("new-id\uFF08\u4EE5\u65B0 ID \u5BFC\u5165\uFF09") })
          ]
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t("ZIP \u5F52\u6863"), hint: "\u2264" + fmtBytes(UPLOAD_LIMIT) + t("\uFF1B\u6D4F\u89C8\u5668\u672C\u5730\u6821\u9A8C\u6587\u4EF6\u5934\u5E76\u8BA1\u7B97 SHA-256\uFF0C\u6307\u7EB9\u968F\u786E\u8BA4\u4EE4\u724C\u7ED1\u5B9A\u3002"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "input",
        {
          className: P + "input",
          type: "file",
          accept: ".zip,application/zip",
          "aria-label": t("\u9009\u62E9 ZIP \u5F52\u6863"),
          onChange: onFilePicked
        }
      ) }),
      hashing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "muted", role: "status", children: t("\u6B63\u5728\u8BA1\u7B97 SHA-256 \u6307\u7EB9\u2026") }) : null,
      fileInfo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "notice", role: "status", children: tf("\u5DF2\u5C31\u7EEA\uFF1A{0}\uFF08{1}\uFF09\uFF0CSHA-256 {2}\u2026", [fileInfo.file.name, fmtBytes(fileInfo.size), fileInfo.sha256.slice(0, 16)]) }) : null,
      importError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "errbanner", role: "alert", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: importError }) }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "cardhead", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: P + "cardtitle", children: t("\u514B\u9686\uFF08\u5F02\u6B65\uFF09") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            type: "button",
            className: P + "btn",
            disabled: !bankId || !clTarget.trim() || !cloneCap.ok,
            title: !cloneCap.ok ? cloneCap.reason || "" : "",
            onClick: submitClone,
            children: t("\u63D0\u4EA4\u514B\u9686\u2026")
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t("\u76EE\u6807\u5E93 ID"), hint: t("\u5728\u8BE5 ID \u4E0B\u521B\u5EFA\u6E90\u5E93\u7684\u526F\u672C\uFF1B\u4E0D\u80FD\u662F\u5DF2\u5B58\u5728\u7684\u5E93\u3002"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "input",
        {
          className: P + "input",
          type: "text",
          "aria-label": t("\u514B\u9686\u76EE\u6807\u5E93 ID"),
          value: clTarget,
          onChange: (event) => {
            setClTarget(event.target.value);
            setCloneError(null);
          }
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: P + "check", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: clIncludeData, onChange: (event) => setClIncludeData(event.target.checked) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("\u5305\u542B\u6570\u636E") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: P + "check", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: clIncludeConfig, onChange: (event) => setClIncludeConfig(event.target.checked) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("\u5305\u542B\u5E93\u914D\u7F6E\uFF08\u542B webhook\uFF09") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: P + "check", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: clIncludeHistory, onChange: (event) => setClIncludeHistory(event.target.checked) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("\u5305\u542B\u5386\u53F2") })
        ] })
      ] }),
      cloneError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "errbanner", role: "alert", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: cloneError }) }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "cardhead", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: P + "cardtitle", children: t("\u5DF2\u63D0\u4EA4\u7684\u5F02\u6B65\u4EFB\u52A1") }) }),
      tracked.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "muted", children: t("\u672C\u4F1A\u8BDD\u5C1A\u672A\u63D0\u4EA4\u5BFC\u51FA/\u5BFC\u5165/\u514B\u9686\u4EFB\u52A1\u3002202 \u53D7\u7406\u7684\u4EFB\u52A1\u4F1A\u51FA\u73B0\u5728\u8FD9\u91CC\u5E76\u81EA\u52A8\u8F6E\u8BE2\u5230\u7EC8\u6001\u3002") }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "control", children: tracked.map((op) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "block", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "actions", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MgmtPill, { tone: "mute", children: op.label }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OpPill, { status: op.status }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: P + "mono", title: op.id, children: shortId(op.id) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: P + "muted", children: [
            t("\u5E93\uFF1A"),
            op.bankId
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OpProgress, { progress: op.progress }),
        op.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "errbanner", role: "alert", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: op.error }) }) : null,
        op.pollError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: P + "risk", children: op.pollError }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "rowactions", children: [
          op.kind === "export" && op.status === "completed" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              type: "button",
              className: P + "btn " + P + "btnprimary",
              disabled: !downloadCap.ok,
              title: !downloadCap.ok ? downloadCap.reason || "" : "",
              onClick: () => downloadExport(op),
              children: t("\u4E0B\u8F7D\u5F52\u6863\u2026")
            }
          ) : null,
          op.status === "pending" || op.status === "processing" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              type: "button",
              className: P + "btn",
              disabled: !cancelCap.ok,
              title: !cancelCap.ok ? cancelCap.reason || "" : "",
              onClick: () => cancelTracked(op),
              children: t("\u53D6\u6D88\u4EFB\u52A1\u2026")
            }
          ) : null,
          op.status === "completed" && op.kind !== "export" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: P + "muted", role: "status", children: t("\u4EFB\u52A1\u5DF2\u5B8C\u6210\u3002") }) : null
        ] })
      ] }, op.id)) })
    ] })
  ] });
}
function ManagementPanel(props) {
  ensureMgmtStyles();
  const { category, apiUrl, banks, request, upload, download, onChanged } = props;
  const bankList = Array.isArray(banks) ? banks : [];
  const diagCall = useChannel(request, apiUrl);
  const [diag, setDiag] = (0, import_react2.useState)({ loading: false, error: null, data: null });
  const loadDiag = (0, import_react2.useCallback)(async () => {
    setDiag((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await diagCall({ op: "diagnostics", apiUrl });
      setDiag({ loading: false, error: null, data: isRecord(res.data) ? res.data : null });
    } catch (err) {
      if (isCancel(err)) return;
      setDiag((prev) => ({ ...prev, loading: false, error: errText(err) }));
    }
  }, [diagCall, apiUrl]);
  (0, import_react2.useEffect)(() => {
    setDiag({ loading: false, error: null, data: null });
    loadDiag();
  }, [loadDiag]);
  const diagOps = diag.data && isRecord(diag.data.operations) ? diag.data.operations : null;
  const features = diag.data && isRecord(diag.data.features) ? diag.data.features : null;
  const cap = (0, import_react2.useCallback)((op) => {
    if (!diagOps) return { ok: false, reason: t("\u80FD\u529B\u672A\u77E5\uFF1A\u8BF7\u5148\u5728\u300C\u8BCA\u65AD\u300D\u5206\u7C7B\u6210\u529F\u52A0\u8F7D\u8BCA\u65AD\u4FE1\u606F") };
    const entry = diagOps[op];
    if (!isRecord(entry) || entry.enabled !== true) {
      const reason = isRecord(entry) && typeof entry.reason === "string" && entry.reason ? entry.reason : t("\u670D\u52A1\u7AEF\u672A\u58F0\u660E\u8BE5\u80FD\u529B");
      return { ok: false, reason };
    }
    return { ok: true, reason: null };
  }, [diagOps]);
  const [confirmSpec, setConfirmSpec] = (0, import_react2.useState)(null);
  const openConfirm = (0, import_react2.useCallback)((spec) => setConfirmSpec(spec), []);
  const apiUrlRef = (0, import_react2.useRef)(apiUrl);
  apiUrlRef.current = apiUrl;
  const execCtrlsRef = (0, import_react2.useRef)(/* @__PURE__ */ new Set());
  (0, import_react2.useEffect)(() => () => {
    const ctrls = execCtrlsRef.current;
    for (const controller of ctrls) controller.abort();
    ctrls.clear();
  }, []);
  (0, import_react2.useEffect)(() => {
    const ctrls = execCtrlsRef.current;
    for (const controller of ctrls) controller.abort();
    ctrls.clear();
    setConfirmSpec(null);
  }, [apiUrl]);
  const executeConfirmed = (0, import_react2.useCallback)(async (spec, setPhase) => {
    if (spec.apiUrl !== apiUrlRef.current) {
      throw new Error(t("API \u76EE\u6807\u5DF2\u53D8\u66F4\uFF0C\u672C\u6B21\u786E\u8BA4\u5DF2\u4F5C\u5E9F\uFF0C\u8BF7\u91CD\u65B0\u53D1\u8D77\u64CD\u4F5C\u3002"));
    }
    const controller = new AbortController();
    execCtrlsRef.current.add(controller);
    try {
      setPhase(t("\u6B63\u5728\u8BF7\u6C42\u786E\u8BA4\u4EE4\u724C\u2026"));
      const prepInput = { op: "prepare", apiUrl: spec.apiUrl, params: {
        action: spec.op,
        parameters: spec.params || {},
        typedSubject: spec.typedSubject,
        acceptRisk: true
      } };
      if (spec.bankId) prepInput.bankId = spec.bankId;
      if (spec.cost === true) prepInput.params.acceptCost = true;
      const prep = await request(prepInput, { signal: controller.signal, timeoutMs: READ_TIMEOUT });
      if (!isRecord(prep) || typeof prep.apiUrl === "string" && prep.apiUrl !== spec.apiUrl) {
        throw new Error(t("\u786E\u8BA4\u4EE4\u724C\u54CD\u5E94\u4E0E\u76EE\u6807\u4E0D\u4E00\u81F4\uFF0C\u64CD\u4F5C\u5DF2\u4E2D\u6B62\u3002"));
      }
      const token = isRecord(prep.data) && typeof prep.data.confirmationToken === "string" && prep.data.confirmationToken.length > 0 ? prep.data.confirmationToken : null;
      if (!token) throw new Error(t("\u5BBF\u4E3B\u672A\u8FD4\u56DE\u6709\u6548\u7684\u786E\u8BA4\u4EE4\u724C\uFF0C\u64CD\u4F5C\u672A\u6267\u884C\u3002"));
      setPhase(spec.transport === "download" ? t("\u6B63\u5728\u4E0B\u8F7D\u2026") : spec.transport === "upload" ? t("\u6B63\u5728\u4E0A\u4F20\u2026") : t("\u6B63\u5728\u6267\u884C\u2026"));
      const input = { op: spec.op, apiUrl: spec.apiUrl, params: spec.params || {}, confirmationToken: token };
      if (spec.bankId) input.bankId = spec.bankId;
      const options = { signal: controller.signal, timeoutMs: spec.timeoutMs || READ_TIMEOUT };
      if (spec.transport === "upload") {
        const res2 = await upload(input, spec.file, options);
        verifyEcho(input, res2);
        return res2;
      }
      if (spec.transport === "download") {
        await download(input, options);
        return null;
      }
      const res = await request(input, options);
      verifyEcho(input, res);
      return res;
    } finally {
      execCtrlsRef.current.delete(controller);
    }
  }, [request, upload, download]);
  const handleDialogClose = (success, res) => {
    const spec = confirmSpec;
    setConfirmSpec(null);
    if (success && spec) {
      if (typeof onChanged === "function") onChanged();
      if (typeof spec.onDone === "function") spec.onDone(res);
    }
  };
  const common = { apiUrl, banks: bankList, request, cap, openConfirm };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: P + "root", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", { className: P + "section", hidden: category !== "overview", "aria-label": t("\u8BCA\u65AD\u4E0E\u4EFB\u52A1\u961F\u5217"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OverviewSection, { ...common, active: category === "overview", diag, reloadDiag: loadDiag }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", { className: P + "section", hidden: category !== "memory", "aria-label": t("\u8BB0\u5FC6\u4E0E\u9690\u79C1\u8BBE\u7F6E"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MemorySection, { ...common, active: category === "memory" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", { className: P + "section", hidden: category !== "security", "aria-label": t("\u5E93\u7EA7\u914D\u7F6E"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SecuritySection, { ...common, active: category === "security" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", { className: P + "section", hidden: category !== "models", "aria-label": t("\u6A21\u578B\u8C03\u8BD5"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModelsSection, { ...common, active: category === "models", features }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", { className: P + "section", hidden: category !== "advanced", "aria-label": t("\u9AD8\u7EA7\u8FC1\u79FB\u4E0E\u522B\u540D"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdvancedSection, { ...common, active: category === "advanced" }) }),
    confirmSpec ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmDialog, { spec: confirmSpec, onClose: handleDialogClose, onExecute: executeConfirmed }) : null
  ] });
}

// src/client/index.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var PANEL_ID = "hindsight-gui";
var STATUS_URL = "/plugins/dsh-hindsight-gui/status";
var CONFIG_URL = "/plugins/dsh-hindsight-gui/config";
var MODELS_URL = "/plugins/dsh-hindsight-gui/models";
var SERVER_START_URL = "/plugins/dsh-hindsight-gui/server/start";
var SERVER_RESTART_URL = "/plugins/dsh-hindsight-gui/server/restart";
var BANKDEFENSE_URL = "/plugins/dsh-hindsight-gui/bankdefense";
var PREFIX = "dsh-hsp-";
var LOG_LEVELS = ["debug", "info", "warn", "error"];
var TABS = [
  { id: "overview", label: "\u6982\u89C8" },
  { id: "memory", label: "\u8BB0\u5FC6\u4E0E\u8FDE\u63A5" },
  { id: "models", label: "\u6A21\u578B" },
  { id: "security", label: "\u5B89\u5168" },
  { id: "advanced", label: "\u9AD8\u7EA7" }
];
var EMPTY_EMBEDDINGS = { provider: "", model: "", baseUrl: "", dimensions: null, apiKeyEnv: "", localForceCpu: null, secretConfigured: false };
var SERVER_SCOPES = [
  { key: "default", label: "\u5168\u5C40\u9ED8\u8BA4 LLM", hint: "\u672A\u914D\u7F6E\u72EC\u7ACB\u4F5C\u7528\u57DF\u65F6\u7684\u56DE\u9000\u6A21\u578B\uFF1B\u4E0E\u53CD\u601D\u63A8\u7406\u5206\u5F00\u3002\u65E7reflect-only\u914D\u7F6E\u517C\u5BB9\u4E3A\u6B64\u9ED8\u8BA4\u503C\uFF0C\u663E\u5F0F\u4FDD\u5B58\u540E\u8131\u94A9\u3002" },
  { key: "reflect", label: "\u53CD\u601D\u63A8\u7406", hint: "hindsight_reflect \u8BB0\u5FC6\u63A8\u7406\u4E0E\u95EE\u7B54\u3002\u5EFA\u8BAE\u9009\u7528\u63A8\u7406\u548C\u957F\u4E0A\u4E0B\u6587\u80FD\u529B\u5F3A\u7684\u6A21\u578B\u3002" },
  { key: "retain", label: "\u4E8B\u5B9E\u63D0\u53D6", hint: "\u4ECE\u4F1A\u8BDD\u4E2D\u63D0\u53D6\u4E8B\u5B9E\uFF08Retain\uFF09\uFF0CToken \u6D88\u8017\u91CF\u5927\u3002\u5EFA\u8BAE\u901F\u5EA6\u5FEB\u3001\u6210\u672C\u4F4E\u4E14\u652F\u6301 JSON Schema \u7684\u6A21\u578B\u3002" },
  { key: "consolidation", label: "\u8BB0\u5FC6\u6574\u7406", hint: "\u540E\u53F0\u805A\u5408\u6D88\u6B67\u4E0E\u53BB\u91CD\u76F8\u4F3C\u4E8B\u5B9E\uFF08Consolidation\uFF09\u3002\u5EFA\u8BAE\u652F\u6301\u7ED3\u6784\u5316\u8F93\u51FA\u7684\u5FEB\u901F\u6A21\u578B\u3002" },
  { key: "mentalModel", label: "\u77E5\u8BC6\u63D0\u70BC", hint: "\u5237\u65B0\u7ED3\u6784\u5316\u77E5\u8BC6\u5E93\u9875\u9762\uFF08Mental Model Refresh\uFF0C\u5982\u67B6\u6784\u56FE\u3001\u6982\u5FF5\u89C4\u8303\uFF09\u3002" }
];
function isLoopbackUrl(url) {
  if (typeof url !== "string" || url === "") return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "localhost" || host === "::1" || host === "0:0:0:0:0:0:0:1" || /^127(?:\.\d{1,3}){3}$/.test(host);
  } catch {
    return false;
  }
}
function hasSimpleRedactRule(rules) {
  return Array.isArray(rules) && rules.some((rule) => rule !== null && typeof rule === "object" && rule.on === "sensitive_data" && rule.action === "redact" && Object.keys(rule).length === 2);
}
function defenseEnabled(payload) {
  if (!("memoryDefense" in payload)) throw new Error(t("\u9632\u62A4\u7B56\u7565\u54CD\u5E94\u7F3A\u5C11 memoryDefense\uFF0C\u72B6\u6001\u672A\u77E5\u3002"));
  const policy = payload.memoryDefense;
  if (policy !== null && (typeof policy !== "object" || Array.isArray(policy) || !Array.isArray(policy.rules ?? []))) {
    throw new Error(t("\u9632\u62A4\u7B56\u7565\u54CD\u5E94\u683C\u5F0F\u65E0\u6548\uFF0C\u72B6\u6001\u672A\u77E5\u3002"));
  }
  return policy?.enabled === true && hasSimpleRedactRule(policy.rules);
}
function isMigrationWarning(warning) {
  return typeof warning === "string" && /重建|迁移|重新索引|re-?index|rebuild|migrat/i.test(warning) && /向量|索引|维度|模型|vector|embedding|index|dimension|model/i.test(warning);
}
var CSS2 = [
  /* ---- shell: fluid, no fixed width ------------------------------------- */
  "." + PREFIX + "root{box-sizing:border-box;height:100%;min-height:0;overflow:auto;",
  "display:flex;flex-direction:column;gap:18px;padding:24px 24px 36px;width:100%;isolation:isolate;container:hindsight-settings / inline-size;",
  "color:var(--dsw-alias-label-primary,#1a1a1a);font:inherit;font-size:13px;line-height:21px;color-scheme:light;}",
  "." + PREFIX + "head{display:flex;flex-direction:column;gap:12px;}",
  "." + PREFIX + "h{margin:0;font-size:24px;line-height:32px;font-weight:650;letter-spacing:-.4px;}",
  "." + PREFIX + "sub{margin:0;color:var(--dsw-alias-label-tertiary,#8a8a8a);font-size:12.5px;}",
  /* ---- cards ------------------------------------------------------------ */
  "." + PREFIX + "card{border:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));",
  "border-radius:14px;padding:20px;display:flex;flex-direction:column;gap:16px;",
  "background:var(--dsw-alias-bg-layer-1,transparent);min-width:0;}",
  "." + PREFIX + "cardhead{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;}",
  "." + PREFIX + "cardtitle{margin:0;font-size:15px;line-height:24px;font-weight:650;}",
  /* ---- fields: two-column grid that collapses on narrow panels ---------- */
  "." + PREFIX + "field{display:grid;grid-template-columns:128px minmax(0,1fr);gap:6px 12px;align-items:start;}",
  "@media (max-width:680px){." + PREFIX + "field{grid-template-columns:minmax(0,1fr);}}",
  "." + PREFIX + "label{padding-top:5px;color:var(--dsw-alias-label-secondary,#555);}",
  "." + PREFIX + "control{min-width:0;display:flex;flex-direction:column;gap:6px;}",
  "." + PREFIX + "hint{color:var(--dsw-alias-label-tertiary,#8a8a8a);font-size:12px;}",
  /* ---- inputs ----------------------------------------------------------- */
  "." + PREFIX + "input,." + PREFIX + "select{box-sizing:border-box;width:100%;height:36px;padding:0 11px;",
  "border-radius:8px;border:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.18));",
  "background-color:var(--dsw-alias-bg-layer-1,var(--dsw-alias-bg-base,#fff));color:var(--dsw-alias-label-primary,inherit);",
  "font:inherit;font-size:13px;color-scheme:light dark;}",
  "." + PREFIX + "select option,." + PREFIX + "select optgroup{background-color:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#1a1a1a);}",
  "." + PREFIX + "input:focus,." + PREFIX + "select:focus{outline:2px solid var(--dsw-alias-brand-primary,#3b82f6);outline-offset:1px;}",
  "." + PREFIX + "check{display:flex;align-items:flex-start;gap:8px;cursor:pointer;}",
  "." + PREFIX + "check input{margin-top:3px;accent-color:var(--dsw-alias-brand-primary,#3b82f6);}",
  /* ---- buttons ---------------------------------------------------------- */
  "." + PREFIX + "btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:34px;padding:6px 14px;",
  "border-radius:8px;border:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.14));",
  "background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.045));color:inherit;font:inherit;",
  "font-size:13px;cursor:pointer;text-decoration:none;white-space:nowrap;}",
  "." + PREFIX + "btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-active,rgba(0,0,0,.09));}",
  "." + PREFIX + "btn:disabled{opacity:.5;cursor:default;}",
  "." + PREFIX + "btnprimary{background:var(--dsw-alias-brand-primary,#3b82f6);border-color:transparent;",
  "color:#fff;}",
  "." + PREFIX + "btnprimary:hover:not(:disabled){background:var(--dsw-alias-brand-primary-hover,#2563eb);}",
  /* ---- status pills and rows -------------------------------------------- */
  "." + PREFIX + "pill{display:inline-flex;align-items:center;gap:6px;font-size:12px;",
  "padding:2px 10px;border-radius:999px;border:.5px solid transparent;white-space:nowrap;}",
  "." + PREFIX + "ok{color:#15803d;background:rgba(21,128,61,.10);border-color:rgba(21,128,61,.25);}",
  "." + PREFIX + "bad{color:#b91c1c;background:rgba(185,28,28,.10);border-color:rgba(185,28,28,.25);}",
  "." + PREFIX + "warn{color:#92400e;background:rgba(217,119,6,.12);border-color:rgba(217,119,6,.3);}",
  "." + PREFIX + "dot{width:8px;height:8px;border-radius:50%;background:currentColor;flex:0 0 auto;}",
  "." + PREFIX + "row{display:flex;align-items:baseline;gap:10px;min-width:0;}",
  "." + PREFIX + "key{flex:0 0 92px;color:var(--dsw-alias-label-tertiary,#8a8a8a);}",
  "." + PREFIX + "val{min-width:0;overflow-wrap:anywhere;}",
  /* ---- banners, lists, misc --------------------------------------------- */
  "." + PREFIX + "banner{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:9px 12px;",
  "border-radius:9px;font-size:12.5px;border:.5px solid rgba(217,119,6,.3);background:rgba(217,119,6,.10);color:#92400e;}",
  "." + PREFIX + "errbanner{display:flex;align-items:flex-start;gap:10px;flex-wrap:wrap;padding:9px 12px;",
  "border-radius:9px;font-size:12.5px;border:.5px solid rgba(220,38,38,.35);background:rgba(220,38,38,.10);color:#b91c1c;}",
  "." + PREFIX + "errbanner>span{min-width:0;overflow-wrap:anywhere;flex:1 1 auto;}",
  "." + PREFIX + "list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;}",
  "." + PREFIX + "item{display:flex;align-items:center;flex-wrap:wrap;gap:10px;padding:12px 0;min-width:0;",
  "border-bottom:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.07));}",
  "." + PREFIX + "item:last-child{border-bottom:0;}",
  "." + PREFIX + "mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;overflow-wrap:anywhere;}",
  "." + PREFIX + "count{margin-left:auto;flex:0 0 auto;color:var(--dsw-alias-label-tertiary,#8a8a8a);font-size:12px;}",
  "." + PREFIX + "muted{color:var(--dsw-alias-label-tertiary,#8a8a8a);}",
  "." + PREFIX + "err{color:#b91c1c;}",
  "." + PREFIX + "good{color:#15803d;}",
  "." + PREFIX + "actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}",
  "." + PREFIX + "notice{color:var(--dsw-alias-state-ok-primary,#15803d);font-size:12.5px;}",
  "." + PREFIX + "details{border:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:10px;",
  "padding:11px 16px;font-size:12.5px;}",
  "." + PREFIX + "summary{cursor:pointer;color:var(--dsw-alias-label-secondary,#555);}",
  "." + PREFIX + "tabs{position:sticky;top:0;z-index:2;display:flex;gap:4px;overflow-x:auto;flex:0 0 auto;",
  "border-bottom:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));background:var(--dsw-alias-bg-layer-1,var(--dsw-alias-bg-base,#fff));}",
  "." + PREFIX + "fold{min-width:0;}",
  "." + PREFIX + "fold>summary{cursor:pointer;font-size:13.5px;font-weight:650;}",
  "." + PREFIX + "foldbody{display:flex;flex-direction:column;gap:12px;margin-top:12px;}",
  "." + PREFIX + "tab{flex:0 0 auto;border:0;border-bottom:2px solid transparent;padding:9px 13px;background:transparent;color:var(--dsw-alias-label-secondary,#555);font:inherit;cursor:pointer;white-space:nowrap;}",
  "." + PREFIX + 'tab[aria-selected="true"]{color:var(--dsw-alias-brand-primary,#3b82f6);border-bottom-color:currentColor;font-weight:650;}',
  "." + PREFIX + "tab:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#3b82f6);outline-offset:-2px;}",
  "." + PREFIX + "tabpanel{display:flex;flex-direction:column;gap:14px;min-width:0;}",
  "." + PREFIX + "tabpanel[hidden]{display:none;}",
  "." + PREFIX + "savebar{position:sticky;bottom:0;z-index:1;display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:10px 12px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:10px;background:var(--dsw-alias-bg-layer-1,var(--dsw-alias-bg-base,#fff));}",
  /* ---- hierarchy and panel-width responsiveness ------------------------- */
  "." + PREFIX + "headrow{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;}",
  "." + PREFIX + "brand{display:flex;align-items:center;gap:12px;min-width:0;}",
  "." + PREFIX + "mark{display:grid;place-items:center;width:42px;height:42px;flex:0 0 auto;border-radius:12px;color:var(--dsw-alias-brand-primary,#3b82f6);background:var(--dsw-alias-bg-layer-2,rgba(59,130,246,.08));}",
  "." + PREFIX + "eyebrow{font-size:11px;font-weight:650;letter-spacing:1px;color:var(--dsw-alias-label-tertiary,#666);}",
  "." + PREFIX + "intro{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;}",
  "." + PREFIX + "intro h3{margin:0;font-size:16px;line-height:25px;}",
  "." + PREFIX + "intro p{margin:3px 0 0;color:var(--dsw-alias-label-tertiary,#666);font-size:12px;}",
  "." + PREFIX + "badge{display:inline-flex;padding:2px 8px;border-radius:6px;font-size:11px;color:var(--dsw-alias-label-secondary,#555);background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.04));}",
  "." + PREFIX + "tabs{padding:4px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:11px;gap:4px;}",
  "." + PREFIX + "tab{border:0;border-radius:7px;padding:8px 14px;}",
  "." + PREFIX + 'tab[aria-selected="true"]{background:var(--dsw-alias-bg-layer-2,rgba(59,130,246,.08));border:0;}',
  "." + PREFIX + "btn:focus-visible,." + PREFIX + "fold>summary:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#3b82f6);outline-offset:3px;}",
  "." + PREFIX + "row{display:grid;grid-template-columns:96px minmax(0,1fr);align-items:start;}",
  "." + PREFIX + "val{display:flex;align-items:baseline;gap:5px;flex-wrap:wrap;}",
  "." + PREFIX + "preview{padding:14px;border-radius:10px;background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.035));display:flex;flex-direction:column;gap:10px;min-width:0;}",
  "." + PREFIX + "pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}",
  "." + PREFIX + "bankmeta{display:flex;flex:1 1 160px;flex-direction:column;gap:3px;min-width:0;overflow-wrap:anywhere;}",
  "." + PREFIX + "banktitle{font-weight:600;}",
  "." + PREFIX + "bankerror{flex:1 1 100%;display:flex;align-items:center;gap:10px;flex-wrap:wrap;}",
  "." + PREFIX + "lang{width:auto;flex:0 0 auto;height:30px;font-size:12px;padding:0 8px;}",
  "." + PREFIX + "savebar{margin-top:auto;box-shadow:0 -4px 16px rgba(0,0,0,.04);}",
  "." + PREFIX + "savestate{flex:1 1 180px;font-size:12px;min-width:0;}",
  "@container hindsight-settings (max-width:620px){." + PREFIX + "field{grid-template-columns:minmax(0,1fr);gap:4px;}." + PREFIX + "pair{grid-template-columns:minmax(0,1fr);}." + PREFIX + "card{padding:15px;}." + PREFIX + "row{grid-template-columns:76px minmax(0,1fr);}." + PREFIX + "tab{padding:8px 10px;}." + PREFIX + "count{margin-left:0;}}",
  "@media(max-width:480px){." + PREFIX + "root{padding:16px 12px 24px;}." + PREFIX + "headrow{gap:10px;}." + PREFIX + "savebar{gap:8px;}." + PREFIX + "bankmeta{flex-basis:100%;}}",
  /* ---- dark theme -------------------------------------------------------- */
  "body[data-ds-dark-theme] ." + PREFIX + "root{color-scheme:dark;}",
  "body[data-ds-dark-theme] ." + PREFIX + "tabs{background:var(--dsw-alias-bg-layer-1,var(--dsw-alias-bg-base,#212123));border-color:var(--dsw-alias-border-l3,rgba(255,255,255,.12));}",
  "body[data-ds-dark-theme] ." + PREFIX + "card{border-color:var(--dsw-alias-border-l3,rgba(255,255,255,.12));background-color:var(--dsw-alias-bg-layer-1,rgba(255,255,255,.02));}",
  "body[data-ds-dark-theme] ." + PREFIX + "input,body[data-ds-dark-theme] ." + PREFIX + "select{color-scheme:dark;background-color:var(--dsw-alias-bg-layer-2,#212123);color:var(--dsw-alias-label-primary,#f9fafb);border-color:var(--dsw-alias-border-l3,rgba(255,255,255,.18));}",
  "body[data-ds-dark-theme] ." + PREFIX + "select option,body[data-ds-dark-theme] ." + PREFIX + "select optgroup{background-color:var(--dsw-alias-bg-layer-2,#212123);color:var(--dsw-alias-label-primary,#f9fafb);}",
  "body[data-ds-dark-theme] ." + PREFIX + "btn{border-color:var(--dsw-alias-border-l3,rgba(255,255,255,.14));background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06));}",
  "body[data-ds-dark-theme] ." + PREFIX + "btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-active,rgba(255,255,255,.12));}",
  "body[data-ds-dark-theme] ." + PREFIX + "item{border-bottom-color:var(--dsw-alias-border-l3,rgba(255,255,255,.07));}",
  "body[data-ds-dark-theme] ." + PREFIX + "details{border-color:var(--dsw-alias-border-l3,rgba(255,255,255,.12));}",
  "body[data-ds-dark-theme] ." + PREFIX + "ok{color:#4ade80;background:rgba(74,222,128,.10);border-color:rgba(74,222,128,.3);}",
  "body[data-ds-dark-theme] ." + PREFIX + "bad{color:#fca5a5;background:rgba(248,113,113,.10);border-color:rgba(248,113,113,.3);}",
  "body[data-ds-dark-theme] ." + PREFIX + "warn{color:#fbbf24;background:rgba(251,191,36,.10);border-color:rgba(251,191,36,.3);}",
  "body[data-ds-dark-theme] ." + PREFIX + "banner{color:#fbbf24;background:rgba(251,191,36,.08);border-color:rgba(251,191,36,.3);}",
  "body[data-ds-dark-theme] ." + PREFIX + "errbanner{color:#f87171;background:rgba(220,38,38,.14);border-color:rgba(220,38,38,.4);}",
  "body[data-ds-dark-theme] ." + PREFIX + "err{color:#fca5a5;}",
  "body[data-ds-dark-theme] ." + PREFIX + "good{color:#4ade80;}"
].join("");
function ensureStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-plugin-css="' + PANEL_ID + '"]') !== null) return;
  const tag = document.createElement("style");
  tag.dataset.plugin = PANEL_ID;
  tag.dataset.pluginCss = PANEL_ID;
  tag.textContent = CSS2;
  document.head.appendChild(tag);
}
function PanelIcon(props) {
  const size = typeof props.size === "number" ? props.size : 18;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.7,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": true,
      focusable: "false",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M12 5v14" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M12 8.5A3 3 0 0 0 6.5 9.8 3 3 0 0 0 7 15.4 2.6 2.6 0 0 0 12 17" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M12 8.5A3 3 0 0 1 17.5 9.8 3 3 0 0 1 17 15.4 2.6 2.6 0 0 1 12 17" })
      ]
    }
  );
}
function Pill(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: PREFIX + "pill " + PREFIX + (props.tone ?? "bad"), children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "dot" }),
    props.children
  ] });
}
function Row(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "row", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "key", children: props.label }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "val", children: props.children })
  ] });
}
function ModelSelectField(props) {
  const { label, hint, value, defaultValue = "", onChange, providers } = props;
  const allKnownRoutes = (0, import_react3.useMemo)(() => {
    const set = /* @__PURE__ */ new Set();
    for (const p of providers) {
      if (!Array.isArray(p.models)) continue;
      for (const m of p.models) {
        set.add(`${p.id}/${m.id}`);
      }
    }
    return set;
  }, [providers]);
  const [customMode, setCustomMode] = (0, import_react3.useState)(false);
  const isCustom = customMode || value !== "" && !allKnownRoutes.has(value);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "field", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "label", children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "control", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", gap: "8px", alignItems: "center" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
          "select",
          {
            className: PREFIX + "select",
            "aria-label": label,
            value: isCustom ? "__custom__" : value,
            onChange: (e) => {
              const selected = e.target.value;
              if (selected === "__custom__") {
                setCustomMode(true);
              } else {
                setCustomMode(false);
                onChange(selected);
              }
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "", children: defaultValue ? tf("\u9ED8\u8BA4 ({0})", [defaultValue]) : t("\u672A\u6307\u5B9A\uFF08\u8DDF\u968F\u7CFB\u7EDF\u9ED8\u8BA4\uFF09") }),
              providers.map((p) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("optgroup", { label: p.name || p.id, children: (p.models || []).map((m) => {
                const routeKey = `${p.id}/${m.id}`;
                return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("option", { value: routeKey, children: [
                  m.name || m.id,
                  " (",
                  p.id,
                  "/",
                  m.id,
                  ")"
                ] }, routeKey);
              }) }, p.id)),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "__custom__", children: t("\u81EA\u5B9A\u4E49\u8F93\u5165...") })
            ]
          }
        ),
        isCustom && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "button",
          {
            type: "button",
            className: PREFIX + "btn",
            style: { padding: "0 8px", fontSize: "12px" },
            onClick: () => {
              setCustomMode(false);
              onChange("");
            },
            title: t("\u5207\u6362\u56DE\u9009\u62E9\u5217\u8868"),
            children: t("\u5217\u8868")
          }
        )
      ] }),
      isCustom && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "input",
        {
          className: PREFIX + "input",
          type: "text",
          "aria-label": tf("{0} \u81EA\u5B9A\u4E49\u6A21\u578B", [label]),
          value,
          placeholder: t("\u4F8B\u5982 deepseek-flash \u6216 provider/model"),
          onChange: (e) => onChange(e.target.value)
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "hint", children: hint })
    ] })
  ] });
}
function requestJson(url, init, timeoutMs, requests, timeoutMessage = t("\u8BF7\u6C42\u8D85\u65F6\u6216\u5DF2\u53D6\u6D88\uFF0C\u8BF7\u5237\u65B0\u540E\u786E\u8BA4\u6700\u65B0\u72B6\u6001\u3002"), responseMode = "json") {
  const controller = new AbortController();
  requests.add(controller);
  const externalSignal = init?.signal;
  const externalAbort = () => controller.abort();
  let timer;
  const cancelled = new Promise((_, reject) => {
    controller.signal.addEventListener("abort", () => reject(new Error(timeoutMessage)), { once: true });
    timer = setTimeout(() => controller.abort(), timeoutMs);
  });
  externalSignal?.addEventListener("abort", externalAbort, { once: true });
  if (externalSignal?.aborted) controller.abort();
  const response = fetch(url, { ...init, signal: controller.signal }).then(async (res) => {
    if (responseMode === "blob" && res.ok) {
      const declared = Number(res.headers?.get?.("content-length"));
      if (Number.isFinite(declared) && declared > DOWNLOAD_LIMIT) throw new Error(t("\u5BFC\u51FA\u8D85\u8FC7500MiB\u4E0B\u8F7D\u4E0A\u9650"));
      const blob = await res.blob();
      if (blob.size > DOWNLOAD_LIMIT) throw new Error(t("\u5BFC\u51FA\u8D85\u8FC7500MiB\u4E0B\u8F7D\u4E0A\u9650"));
      return blob;
    }
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      const failure = new Error(payload?.error ?? `HTTP ${res.status}`);
      failure.status = res.status;
      throw failure;
    }
    if (payload === null || typeof payload !== "object" || Array.isArray(payload)) throw new Error(t("\u54CD\u5E94\u683C\u5F0F\u65E0\u6548"));
    return payload;
  });
  return Promise.race([response, cancelled]).finally(() => {
    clearTimeout(timer);
    externalSignal?.removeEventListener("abort", externalAbort);
    requests.delete(controller);
  });
}
function PanelPage() {
  const locale = useLocale();
  const [status, setStatus] = (0, import_react3.useState)({ loading: true, data: null, error: null });
  const [draft, setDraft] = (0, import_react3.useState)(null);
  const [cpDraft, setCpDraft] = (0, import_react3.useState)(null);
  const [serverModelsDraft, setServerModelsDraft] = (0, import_react3.useState)({});
  const [auditDraft, setAuditDraft] = (0, import_react3.useState)(null);
  const [autoStartDraft, setAutoStartDraft] = (0, import_react3.useState)(false);
  const [serverCommandDraft, setServerCommandDraft] = (0, import_react3.useState)("");
  const [serverPythonDraft, setServerPythonDraft] = (0, import_react3.useState)("");
  const [overridesDraft, setOverridesDraft] = (0, import_react3.useState)({});
  const [embeddingsDraft, setEmbeddingsDraft] = (0, import_react3.useState)({ ...EMPTY_EMBEDDINGS, apiKey: "", clearApiKey: false });
  const embeddingsCacheRef = (0, import_react3.useRef)({});
  const [activeTab, setActiveTab] = (0, import_react3.useState)("overview");
  const [chatExpanded, setChatExpanded] = (0, import_react3.useState)(true);
  const [overridesExpanded, setOverridesExpanded] = (0, import_react3.useState)(false);
  const [serviceDetailsExpanded, setServiceDetailsExpanded] = (0, import_react3.useState)(false);
  const [launchExpanded, setLaunchExpanded] = (0, import_react3.useState)(false);
  const [bankSearch, setBankSearch] = (0, import_react3.useState)("");
  const savingRef = (0, import_react3.useRef)(false);
  const tabRefs = (0, import_react3.useRef)({});
  const [modelsState, setModelsState] = (0, import_react3.useState)({ loading: false, providers: [], errors: [], state: null, sampledAt: null, error: null });
  const [saving, setSaving] = (0, import_react3.useState)(false);
  const [notice, setNotice] = (0, import_react3.useState)(null);
  const [saveError, setSaveError] = (0, import_react3.useState)(null);
  const [serverBusy, setServerBusy] = (0, import_react3.useState)(null);
  const [serverMessage, setServerMessage] = (0, import_react3.useState)(null);
  const [serverError, setServerError] = (0, import_react3.useState)(null);
  const [defense, setDefense] = (0, import_react3.useState)({});
  const baselineRef = (0, import_react3.useRef)(null);
  const [, setBaselineEpoch] = (0, import_react3.useState)(0);
  const dirtyRef = (0, import_react3.useRef)(false);
  const defenseRef = (0, import_react3.useRef)({});
  const apiBaseRef = (0, import_react3.useRef)(null);
  const defenseGenRef = (0, import_react3.useRef)(0);
  const statusGenRef = (0, import_react3.useRef)(0);
  const statusInFlightRef = (0, import_react3.useRef)(null);
  const requestsRef = (0, import_react3.useRef)(/* @__PURE__ */ new Set());
  const managementRequest = (0, import_react3.useCallback)((input, options = {}) => {
    const readOnly = READ_OPERATIONS.includes(input.op);
    const query = readOnly ? new URLSearchParams({ op: input.op, apiUrl: input.apiUrl, ...input.bankId ? { bankId: input.bankId } : {}, params: JSON.stringify(input.params ?? {}) }) : null;
    return requestJson(query ? `${MANAGEMENT_URL}?${query}` : MANAGEMENT_URL, {
      method: readOnly ? "GET" : "POST",
      signal: options.signal,
      headers: { accept: "application/json", ...readOnly ? {} : { "content-type": "application/json" } },
      ...readOnly ? {} : { body: JSON.stringify(input) }
    }, options.timeoutMs ?? 3e4, requestsRef.current, t("\u7BA1\u7406\u8BF7\u6C42\u7B49\u5F85\u7ED3\u675F\uFF0C\u7ED3\u679C\u53EF\u80FD\u672A\u77E5\uFF1B\u8BF7\u91CD\u8BFB\uFF0C\u4E0D\u81EA\u52A8\u91CD\u590D\u64CD\u4F5C\u3002"));
  }, []);
  const managementUpload = (0, import_react3.useCallback)((input, file, options = {}) => requestJson(UPLOAD_URL, {
    method: "POST",
    signal: options.signal,
    headers: { accept: "application/json", "content-type": "application/zip", "x-hindsight-transfer": encodeURIComponent(JSON.stringify(input)) },
    body: file
  }, options.timeoutMs ?? 12e4, requestsRef.current, t("\u5BFC\u5165\u7B49\u5F85\u7ED3\u675F\uFF0C\u63D0\u4EA4\u7ED3\u679C\u53EF\u80FD\u672A\u77E5\uFF1B\u8BF7\u67E5\u8BE2\u4EFB\u52A1\uFF0C\u4E0D\u91CD\u590D\u5BFC\u5165\u3002")), []);
  const managementDownload = (0, import_react3.useCallback)(async (input, options = {}) => {
    const blob = await requestJson(MANAGEMENT_URL, {
      method: "POST",
      signal: options.signal,
      headers: { accept: "application/zip", "content-type": "application/json" },
      body: JSON.stringify(input)
    }, options.timeoutMs ?? 18e4, requestsRef.current, t("\u4E0B\u8F7D\u7B49\u5F85\u7ED3\u675F\u6216\u5DF2\u53D6\u6D88\u3002"), "blob");
    if (options.signal?.aborted) throw new Error(t("\u4E0B\u8F7D\u5DF2\u53D6\u6D88"));
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    try {
      anchor.href = url;
      anchor.download = "hindsight-bank.zip";
      document.body.appendChild(anchor);
      anchor.click();
    } finally {
      anchor.remove();
      URL.revokeObjectURL(url);
    }
  }, []);
  const modelsGenRef = (0, import_react3.useRef)(0);
  const mountedRef = (0, import_react3.useRef)(true);
  const autoStartCooldownRef = (0, import_react3.useRef)(0);
  const autoStartFailuresRef = (0, import_react3.useRef)(0);
  const AUTO_START_MAX_FAILURES = 2;
  const load = (0, import_react3.useCallback)(() => {
    const generation = ++statusGenRef.current;
    statusInFlightRef.current = generation;
    setStatus((previous) => ({ ...previous, loading: true, error: null }));
    requestJson(STATUS_URL, { headers: { accept: "application/json" } }, 3e4, requestsRef.current).then((data2) => {
      if (!mountedRef.current || generation !== statusGenRef.current) return;
      if (!data2?.config?.values || !data2?.gui || !data2?.api) throw new Error(t("\u72B6\u6001\u54CD\u5E94\u683C\u5F0F\u65E0\u6548\uFF0C\u8BF7\u91CD\u8BD5\u3002"));
      setStatus({ loading: false, data: data2, error: null });
    }).catch((error) => {
      if (!mountedRef.current || generation !== statusGenRef.current) return;
      setStatus((previous) => ({ loading: false, data: previous.data, error: String(error?.message ?? error) }));
    }).finally(() => {
      if (statusInFlightRef.current === generation) statusInFlightRef.current = null;
    });
  }, []);
  const loadModels = (0, import_react3.useCallback)(() => {
    const generation = ++modelsGenRef.current;
    setModelsState((prev) => ({ ...prev, loading: true, error: null }));
    requestJson(MODELS_URL, { headers: { accept: "application/json" } }, 3e4, requestsRef.current).then((data2) => {
      if (!mountedRef.current || generation !== modelsGenRef.current) return;
      if (!Array.isArray(data2?.providers)) throw new Error(t("\u6A21\u578B\u54CD\u5E94\u7F3A\u5C11 Provider \u5217\u8868\uFF0C\u65E0\u6CD5\u786E\u8BA4\u53D1\u73B0\u7ED3\u679C\u3002"));
      setModelsState({
        loading: false,
        providers: data2.providers,
        errors: Array.isArray(data2?.errors) ? data2.errors : [],
        // Older hosts answer with bare `{ providers }` — that is a real list.
        state: typeof data2?.state === "string" ? data2.state : "ok",
        sampledAt: typeof data2?.sampledAt === "string" ? data2.sampledAt : null,
        error: null
      });
    }).catch((err) => {
      if (!mountedRef.current || generation !== modelsGenRef.current) return;
      setModelsState({ loading: false, providers: [], errors: [], state: "error", sampledAt: null, error: String(err?.message ?? err) });
    });
  }, []);
  (0, import_react3.useEffect)(() => {
    load();
  }, [load]);
  (0, import_react3.useEffect)(() => {
    loadModels();
  }, [loadModels]);
  (0, import_react3.useEffect)(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      for (const controller of requestsRef.current) controller.abort();
    };
  }, []);
  (0, import_react3.useEffect)(() => {
    const timer = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      if (statusInFlightRef.current !== null) return;
      load();
    }, 15e3);
    return () => clearInterval(timer);
  }, [load]);
  const toOverrideDraft = (0, import_react3.useCallback)((entry) => ({
    baseUrl: typeof entry?.baseUrl === "string" ? entry.baseUrl : "",
    apiKeyEnv: typeof entry?.apiKeyEnv === "string" ? entry.apiKeyEnv : "",
    apiKey: "",
    clearApiKey: false,
    // Display-only mirror of the host flag; it is never sent back.
    secretConfigured: entry?.secretConfigured === true
  }), []);
  const toEmbeddingsDraft = (0, import_react3.useCallback)((entry) => ({
    provider: entry?.provider ?? "",
    model: entry?.model ?? "",
    baseUrl: entry?.baseUrl ?? "",
    dimensions: entry?.dimensions ?? null,
    apiKeyEnv: entry?.apiKeyEnv ?? "",
    localForceCpu: entry?.localForceCpu ?? null,
    secretConfigured: entry?.secretConfigured === true,
    apiKey: "",
    clearApiKey: false
  }), []);
  const snapshotBaseline = (0, import_react3.useCallback)((data2) => {
    const overrides = {};
    const saved = data2?.gui?.providerOverrides;
    if (saved && typeof saved === "object" && !Array.isArray(saved)) {
      for (const [id, entry] of Object.entries(saved)) overrides[id] = toOverrideDraft(entry);
    }
    baselineRef.current = {
      configValues: { ...data2?.config?.values ?? {} },
      controlPlaneUrl: data2?.gui?.controlPlaneUrl ?? "",
      serverModels: { ...data2?.gui?.serverModels ?? {} },
      auditLogEnabled: data2?.gui?.auditLogEnabled ?? null,
      autoStart: data2?.gui?.autoStart === true,
      serverCommand: data2?.gui?.serverCommand ?? "",
      serverPython: data2?.gui?.serverPython ?? "",
      providerOverrides: overrides,
      serverEmbeddings: toEmbeddingsDraft(data2?.gui?.serverEmbeddings ?? EMPTY_EMBEDDINGS),
      configRevision: data2?.config?.revision ?? null,
      guiRevision: data2?.gui?.revision ?? null
    };
    setBaselineEpoch((epoch) => epoch + 1);
  }, [toOverrideDraft, toEmbeddingsDraft]);
  const resetDrafts = (0, import_react3.useCallback)((data2) => {
    const overrides = {};
    const saved = data2?.gui?.providerOverrides;
    if (saved && typeof saved === "object" && !Array.isArray(saved)) {
      for (const [id, entry] of Object.entries(saved)) overrides[id] = toOverrideDraft(entry);
    }
    setDraft({ ...data2?.config?.values ?? {} });
    setCpDraft(data2?.gui?.controlPlaneUrl ?? "");
    setServerModelsDraft({ ...data2?.gui?.serverModels ?? {} });
    setAuditDraft(data2?.gui?.auditLogEnabled ?? null);
    setAutoStartDraft(data2?.gui?.autoStart === true);
    setServerCommandDraft(data2?.gui?.serverCommand ?? "");
    setServerPythonDraft(data2?.gui?.serverPython ?? "");
    setOverridesDraft(overrides);
    const embedding = toEmbeddingsDraft(data2?.gui?.serverEmbeddings ?? EMPTY_EMBEDDINGS);
    embeddingsCacheRef.current = { [embedding.provider]: embedding };
    setEmbeddingsDraft(embedding);
  }, [toOverrideDraft, toEmbeddingsDraft]);
  const inactiveEmbeddingsDirty = (() => {
    const base = baselineRef.current?.serverEmbeddings;
    if (!base) return false;
    return Object.entries(embeddingsCacheRef.current).some(([provider, entry]) => {
      if (provider === embeddingsDraft.provider) return false;
      const original = provider === base.provider ? base : toEmbeddingsDraft({ provider });
      const fields = provider === "openai" ? ["model", "baseUrl", "dimensions", "apiKeyEnv"] : provider === "onnx" ? ["model", "dimensions"] : provider === "local" ? ["model", "localForceCpu"] : provider === "tei" ? ["baseUrl"] : [];
      return fields.some((field) => String(entry[field] ?? "") !== String(original[field] ?? "")) || provider === "openai" && (entry.apiKey !== "" || entry.clearApiKey && base.secretConfigured);
    });
  })();
  const dirty = (() => {
    const base = baselineRef.current;
    if (!draft || !base) return false;
    if (cpDraft !== null && cpDraft !== base.controlPlaneUrl) return true;
    const allKeys = /* @__PURE__ */ new Set([...Object.keys(serverModelsDraft), ...Object.keys(base.serverModels)]);
    for (const key of allKeys) {
      if ((serverModelsDraft[key] ?? "") !== (base.serverModels[key] ?? "")) return true;
    }
    if ((auditDraft ?? null) !== base.auditLogEnabled) return true;
    if (autoStartDraft !== base.autoStart) return true;
    if ((serverCommandDraft ?? "") !== base.serverCommand) return true;
    if ((serverPythonDraft ?? "") !== base.serverPython) return true;
    const emb = base.serverEmbeddings;
    if (embeddingsDraft.provider !== emb.provider) return true;
    const activeFields = embeddingsDraft.provider === "openai" ? ["model", "baseUrl", "dimensions", "apiKeyEnv"] : embeddingsDraft.provider === "onnx" ? ["model", "dimensions"] : embeddingsDraft.provider === "local" ? ["model", "localForceCpu"] : embeddingsDraft.provider === "tei" ? ["baseUrl"] : [];
    for (const field of activeFields) {
      if (String(embeddingsDraft[field] ?? "") !== String(emb[field] ?? "")) return true;
    }
    if (embeddingsDraft.provider === "openai") {
      if (embeddingsDraft.apiKey !== "") return true;
      if (embeddingsDraft.clearApiKey && emb.secretConfigured) return true;
    }
    if (inactiveEmbeddingsDirty) return true;
    const overrideKeys = /* @__PURE__ */ new Set([...Object.keys(overridesDraft), ...Object.keys(base.providerOverrides)]);
    for (const key of overrideKeys) {
      const a = overridesDraft[key] ?? {};
      const b = base.providerOverrides[key] ?? {};
      if ((a.baseUrl ?? "") !== (b.baseUrl ?? "")) return true;
      if ((a.apiKeyEnv ?? "") !== (b.apiKeyEnv ?? "")) return true;
      if ((a.apiKey ?? "") !== "") return true;
      if (a.clearApiKey === true && b.secretConfigured === true) return true;
    }
    return Object.keys(draft).some((key) => draft[key] !== base.configValues[key]);
  })();
  const liveRef = (0, import_react3.useRef)(null);
  (0, import_react3.useEffect)(() => {
    dirtyRef.current = dirty;
    liveRef.current = { draft, cpDraft, serverModelsDraft, auditDraft, autoStartDraft, serverCommandDraft, serverPythonDraft, overridesDraft, embeddingsDraft };
  });
  (0, import_react3.useEffect)(() => {
    const data2 = status.data;
    if (!data2) return;
    if (baselineRef.current !== null && dirtyRef.current) return;
    snapshotBaseline(data2);
    resetDrafts(data2);
  }, [status.data, snapshotBaseline, resetDrafts]);
  const apiBase = status.data?.api?.url ?? null;
  (0, import_react3.useEffect)(() => {
    if (apiBaseRef.current === apiBase) return;
    apiBaseRef.current = apiBase;
    defenseGenRef.current += 1;
    setDefense({});
  }, [apiBase]);
  (0, import_react3.useEffect)(() => {
    defenseRef.current = defense;
  }, [defense]);
  const readDefense = (0, import_react3.useCallback)((bankId) => {
    const generation = defenseGenRef.current;
    const base = apiBaseRef.current;
    setDefense((prev) => ({ ...prev, [bankId]: { ...prev[bankId], loading: true, unknown: true, error: null } }));
    const query = `bank=${encodeURIComponent(bankId)}${base ? `&apiUrl=${encodeURIComponent(base)}` : ""}`;
    requestJson(`${BANKDEFENSE_URL}?${query}`, { headers: { accept: "application/json" } }, 15e3, requestsRef.current).then((payload) => {
      if (!mountedRef.current || generation !== defenseGenRef.current) return;
      const enabled = defenseEnabled(payload);
      setDefense((prev) => ({ ...prev, [bankId]: { loading: false, unknown: false, enabled, action: null, error: null } }));
    }).catch((error) => {
      if (!mountedRef.current || generation !== defenseGenRef.current) return;
      setDefense((prev) => ({ ...prev, [bankId]: { ...prev[bankId], loading: false, unknown: true, error: String(error?.message ?? error) } }));
    });
  }, []);
  const banks = status.data && Array.isArray(status.data.banks) ? status.data.banks : [];
  (0, import_react3.useEffect)(() => {
    for (const bank of banks) if (defense[bank.id] === void 0) readDefense(bank.id);
  }, [banks.map((b) => b.id).join("|"), defense, readDefense]);
  (0, import_react3.useEffect)(() => {
    const data2 = status.data;
    const gui = data2?.gui;
    const api2 = data2?.api;
    const srv = data2?.server;
    if (!data2 || status.loading || status.error !== null) return;
    if (api2?.up === true) autoStartFailuresRef.current = 0;
    if (api2?.state === "unknown") return;
    if (gui?.autoStart !== true) return;
    if (!isLoopbackUrl(api2?.url)) return;
    if (serverBusy !== null) return;
    if (srv && srv.ownership !== void 0) {
      if (srv.ownership !== "stopped" || srv.canStart !== true || srv.operation != null) return;
    } else if (api2?.up !== false) {
      return;
    }
    if (autoStartFailuresRef.current >= AUTO_START_MAX_FAILURES) return;
    if (Date.now() < autoStartCooldownRef.current) return;
    autoStartCooldownRef.current = Date.now() + 45e3;
    setServerBusy("start");
    requestJson(SERVER_START_URL, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: "{}"
    }, 3e5, requestsRef.current, t("\u8BF7\u6C42\u8D85\u65F6\u6216\u5DF2\u53D6\u6D88\uFF1B\u670D\u52A1\u53EF\u80FD\u4ECD\u5728\u542F\u52A8\uFF0C\u8BF7\u5237\u65B0\u72B6\u6001\u786E\u8BA4\uFF0C\u52FF\u91CD\u590D\u542F\u52A8\u3002")).then((payload) => {
      if (!mountedRef.current) return;
      autoStartFailuresRef.current = 0;
      statusGenRef.current += 1;
      if (!payload?.status?.config?.values || !payload?.status?.gui || !payload?.status?.api) throw new Error(t("\u670D\u52A1\u54CD\u5E94\u683C\u5F0F\u65E0\u6548\uFF1A\u542F\u52A8\u7ED3\u679C\u5C1A\u672A\u786E\u8BA4\uFF0C\u8BF7\u5237\u65B0\u72B6\u6001\u3002"));
      setStatus({ loading: false, data: payload.status, error: null });
      setServerError(null);
      setServerMessage(payload.alreadyRunning === true ? t("\u670D\u52A1\u5DF2\u5728\u8FD0\u884C\u3002") : t("\u5DF2\u81EA\u52A8\u542F\u52A8 Hindsight \u670D\u52A1\u3002"));
    }).catch((error) => {
      if (!mountedRef.current) return;
      autoStartFailuresRef.current += 1;
      const stopped = autoStartFailuresRef.current >= AUTO_START_MAX_FAILURES;
      setServerError(
        t("\u81EA\u52A8\u542F\u52A8\u5931\u8D25\uFF1A") + String(error?.message ?? error) + (stopped ? t(" \u5DF2\u505C\u6B62\u81EA\u52A8\u91CD\u8BD5\uFF0C\u8BF7\u5904\u7406\u95EE\u9898\u540E\u624B\u52A8\u542F\u52A8\u3002") : t(" \u7A0D\u540E\u5C06\u81EA\u52A8\u91CD\u8BD5\u3002"))
      );
      load();
    }).finally(() => {
      if (mountedRef.current) setServerBusy(null);
    });
  }, [status.data, status.error, status.loading, serverBusy, load]);
  const set = (0, import_react3.useCallback)((key, value) => {
    setDraft((previous) => previous === null ? previous : { ...previous, [key]: value });
    setNotice(null);
    setSaveError(null);
  }, []);
  const setCp = (0, import_react3.useCallback)((value) => {
    setCpDraft(value);
    setNotice(null);
    setSaveError(null);
  }, []);
  const setServerModel = (0, import_react3.useCallback)((scope, val) => {
    setServerModelsDraft((prev) => ({ ...prev, [scope]: val }));
    setNotice(null);
    setSaveError(null);
  }, []);
  const setOverride = (0, import_react3.useCallback)((provider, field, value) => {
    setOverridesDraft((prev) => {
      const current2 = { ...prev[provider] ?? { baseUrl: "", apiKeyEnv: "", apiKey: "", clearApiKey: false } };
      if (field === "apiKey") {
        current2.apiKey = value;
        if (value !== "") current2.clearApiKey = false;
      } else if (field === "clearApiKey") {
        current2.clearApiKey = value === true;
        if (value === true) current2.apiKey = "";
      } else {
        current2[field] = value;
      }
      return { ...prev, [provider]: current2 };
    });
    setNotice(null);
    setSaveError(null);
  }, []);
  const setEmbeddings = (0, import_react3.useCallback)((field, value) => {
    if (field === "provider") {
      if (value === embeddingsDraft.provider) return;
      const cache = { ...embeddingsCacheRef.current, [embeddingsDraft.provider]: embeddingsDraft };
      const saved = baselineRef.current?.serverEmbeddings;
      const next = cache[value] ?? toEmbeddingsDraft(
        saved?.provider === value ? saved : { provider: value, secretConfigured: saved?.secretConfigured === true }
      );
      embeddingsCacheRef.current = cache;
      setEmbeddingsDraft(next);
    } else {
      setEmbeddingsDraft((prev) => ({
        ...prev,
        [field]: value,
        ...field === "apiKey" && value !== "" ? { clearApiKey: false } : {},
        ...field === "clearApiKey" && value === true ? { apiKey: "" } : {}
      }));
    }
    setNotice(null);
    setSaveError(null);
  }, [embeddingsDraft, toEmbeddingsDraft]);
  const save = (0, import_react3.useCallback)(() => {
    if (!draft || savingRef.current) return Promise.resolve(false);
    const base = baselineRef.current;
    const submitted = { ...liveRef.current, embeddingsCache: embeddingsCacheRef.current };
    setSaving(true);
    setNotice(null);
    setSaveError(null);
    const payloadBody = {};
    for (const [key, value] of Object.entries(draft)) {
      if (value !== base?.configValues?.[key]) payloadBody[key] = value;
    }
    if (cpDraft !== null && cpDraft !== base?.controlPlaneUrl) payloadBody.controlPlaneUrl = cpDraft;
    if (JSON.stringify(serverModelsDraft) !== JSON.stringify(base?.serverModels ?? {})) payloadBody.serverModels = serverModelsDraft;
    if (auditDraft !== base?.auditLogEnabled) payloadBody.auditLogEnabled = auditDraft;
    if (autoStartDraft !== base?.autoStart) payloadBody.autoStart = autoStartDraft;
    if (serverCommandDraft !== base?.serverCommand) payloadBody.serverCommand = serverCommandDraft;
    if (serverPythonDraft !== base?.serverPython) payloadBody.serverPython = serverPythonDraft;
    const overridesPayload = {};
    for (const [provider, entry] of Object.entries(overridesDraft)) {
      const original = base?.providerOverrides?.[provider] ?? {};
      const normalized = {};
      if ((entry.baseUrl ?? "") !== (original.baseUrl ?? "")) normalized.baseUrl = entry.baseUrl ?? "";
      if ((entry.apiKeyEnv ?? "") !== (original.apiKeyEnv ?? "")) normalized.apiKeyEnv = entry.apiKeyEnv ?? "";
      if (entry.clearApiKey === true) normalized.clearApiKey = true;
      else if ((entry.apiKey ?? "") !== "") normalized.apiKey = entry.apiKey;
      if (Object.keys(normalized).length) overridesPayload[provider] = normalized;
    }
    if (Object.keys(overridesPayload).length) payloadBody.providerOverrides = overridesPayload;
    const embBase = base?.serverEmbeddings ?? EMPTY_EMBEDDINGS;
    const embFields = embeddingsDraft.provider === "openai" ? ["model", "baseUrl", "dimensions", "apiKeyEnv"] : embeddingsDraft.provider === "onnx" ? ["model", "dimensions"] : embeddingsDraft.provider === "local" ? ["model", "localForceCpu"] : embeddingsDraft.provider === "tei" ? ["baseUrl"] : [];
    const embChanged = embeddingsDraft.provider !== embBase.provider || embFields.some((field) => String(embeddingsDraft[field] ?? "") !== String(embBase[field] ?? "")) || embeddingsDraft.provider === "openai" && (embeddingsDraft.apiKey !== "" || embeddingsDraft.clearApiKey && embBase.secretConfigured);
    if (inactiveEmbeddingsDirty && !embChanged) {
      setSaving(false);
      setSaveError(t("\u5176\u5B83\u5411\u91CF Provider \u6709\u672A\u63D0\u4EA4\u7684\u8349\u7A3F\uFF0C\u8BF7\u5207\u56DE\u5BF9\u5E94 Provider \u4FDD\u5B58\uFF0C\u6216\u653E\u5F03\u66F4\u6539\u3002"));
      return Promise.resolve(false);
    }
    if (embChanged) {
      const dimensions = embeddingsDraft.dimensions;
      if (embFields.includes("dimensions") && dimensions !== null && dimensions !== "" && (!Number.isSafeInteger(Number(dimensions)) || Number(dimensions) <= 0)) {
        setSaving(false);
        setSaveError(t("\u5411\u91CF\u7EF4\u5EA6\u5FC5\u987B\u662F\u6B63\u6574\u6570\u6216\u7559\u7A7A\u3002"));
        return Promise.resolve(false);
      }
      const settings = { provider: embeddingsDraft.provider };
      for (const field of embFields) settings[field] = field === "dimensions" ? dimensions === null || dimensions === "" ? null : Number(dimensions) : embeddingsDraft[field];
      if (embeddingsDraft.provider === "openai") {
        if (embeddingsDraft.clearApiKey) settings.clearApiKey = true;
        else if (embeddingsDraft.apiKey !== "") settings.apiKey = embeddingsDraft.apiKey;
      }
      payloadBody.serverEmbeddings = settings;
    }
    payloadBody.configRevision = base?.configRevision ?? null;
    payloadBody.guiRevision = base?.guiRevision ?? null;
    savingRef.current = true;
    return requestJson(CONFIG_URL, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(payloadBody)
    }, 3e4, requestsRef.current, t("\u4FDD\u5B58\u8BF7\u6C42\u8D85\u65F6\u6216\u5DF2\u53D6\u6D88\uFF1A\u7ED3\u679C\u5C1A\u672A\u786E\u8BA4\uFF0C\u66F4\u6539\u5DF2\u4FDD\u7559\u3002\u8BF7\u5237\u65B0\u6838\u5BF9\uFF0C\u52FF\u76F4\u63A5\u91CD\u590D\u63D0\u4EA4\u3002")).then((payload) => {
      if (!mountedRef.current) return false;
      if (!payload?.config?.values || !payload?.gui || !payload?.api) throw new Error(t("\u914D\u7F6E\u54CD\u5E94\u683C\u5F0F\u65E0\u6548\uFF1A\u4FDD\u5B58\u7ED3\u679C\u5C1A\u672A\u786E\u8BA4\uFF0C\u8BF7\u5237\u65B0\u6838\u5BF9\u3002"));
      setSaving(false);
      statusGenRef.current += 1;
      setStatus({ loading: false, data: payload, error: null });
      snapshotBaseline(payload);
      const live = liveRef.current ?? {};
      const unchanged = live.draft === submitted.draft && live.cpDraft === submitted.cpDraft && live.serverModelsDraft === submitted.serverModelsDraft && live.auditDraft === submitted.auditDraft && live.autoStartDraft === submitted.autoStartDraft && live.serverCommandDraft === submitted.serverCommandDraft && live.serverPythonDraft === submitted.serverPythonDraft && live.overridesDraft === submitted.overridesDraft && live.embeddingsDraft === submitted.embeddingsDraft && embeddingsCacheRef.current === submitted.embeddingsCache;
      let result;
      if (unchanged) {
        const inactive = Object.fromEntries(Object.entries(submitted.embeddingsCache ?? {}).filter(([provider]) => provider !== submitted.embeddingsDraft?.provider));
        resetDrafts(payload);
        if (inactiveEmbeddingsDirty) embeddingsCacheRef.current = { ...inactive, ...embeddingsCacheRef.current };
        result = inactiveEmbeddingsDirty ? "edited" : "clean";
      } else {
        setOverridesDraft((prev) => {
          const next = {};
          const saved2 = payload?.gui?.providerOverrides;
          for (const [id, entry] of Object.entries(prev)) {
            next[id] = entry === submitted.overridesDraft?.[id] ? toOverrideDraft(saved2?.[id]) : entry;
          }
          return next;
        });
        const savedEmbedding = toEmbeddingsDraft(payload?.gui?.serverEmbeddings ?? EMPTY_EMBEDDINGS);
        const submittedProvider = submitted.embeddingsDraft?.provider;
        const cache = { ...embeddingsCacheRef.current };
        if (cache[submittedProvider] === submitted.embeddingsDraft) {
          cache[submittedProvider] = savedEmbedding.provider === submittedProvider ? savedEmbedding : toEmbeddingsDraft({ provider: submittedProvider, secretConfigured: savedEmbedding.secretConfigured });
        }
        embeddingsCacheRef.current = cache;
        setEmbeddingsDraft((prev) => prev === submitted.embeddingsDraft ? savedEmbedding : prev);
        result = "edited";
      }
      const saved = Array.isArray(payload?.saved) ? payload.saved.join(t("\u3001")) : "";
      const serverSide = payload?.server?.pendingRestart === true;
      setNotice(saved === "" ? t("\u5DF2\u4FDD\u5B58\u3002") : tf("\u5DF2\u4FDD\u5B58\uFF08{0}\uFF09\u3002{1}{2}", [saved, serverSide ? t("\u670D\u52A1\u8BBE\u7F6E\u9700\u91CD\u542F\u53D7\u63A7API\uFF1B\u8FD9\u4E0D\u4F1A\u91CD\u7F6EDSH\u8BB0\u5FC6\u9002\u914D\u5668\u3002") : t("\u8FD0\u884C\u662F\u5426\u5E94\u7528\u672A\u786E\u8BA4\uFF1B\u5DF2\u6709\u5DE5\u4F5C\u533A\u53EF\u80FD\u9700\u8981\u91CD\u542FDSH\u3002"), inactiveEmbeddingsDirty ? t("\u5176\u5B83\u5411\u91CFProvider\u8349\u7A3F\u5DF2\u4FDD\u7559\uFF0C\u5C1A\u672A\u63D0\u4EA4\u3002") : ""]));
      return result;
    }).catch((error) => {
      if (!mountedRef.current) return false;
      setSaving(false);
      if (error?.status === 409) {
        setSaveError(t("\u4FDD\u5B58\u88AB\u62D2\u7EDD\uFF1A\u914D\u7F6E\u5DF2\u5728\u5176\u5B83\u5730\u65B9\u4FEE\u6539\uFF08409 \u51B2\u7A81\uFF09\u3002\u60A8\u7684\u66F4\u6539\u5DF2\u5168\u90E8\u4FDD\u7559\u3002\u6CE8\u610F\uFF1A\u672C\u5730\u57FA\u7EBF\u4ECD\u662F\u65E7\u7248\u672C\uFF0C\u76F4\u63A5\u91CD\u8BD5\u4F1A\u7EE7\u7EED\u51B2\u7A81\u2014\u2014\u8BF7\u5148\u300C\u653E\u5F03\u66F4\u6539\u300D\u8F7D\u5165\u6700\u65B0\u57FA\u7EBF\uFF08\u5F53\u524D\u7F16\u8F91\u5C06\u88AB\u4E22\u5F03\uFF09\uFF0C\u4E4B\u540E\u518D\u91CD\u65B0\u7F16\u8F91\u4FDD\u5B58\u3002"));
      } else {
        setSaveError(String(error?.message ?? error));
      }
      return false;
    }).finally(() => {
      savingRef.current = false;
      if (mountedRef.current) setSaving(false);
    });
  }, [draft, cpDraft, serverModelsDraft, auditDraft, autoStartDraft, serverCommandDraft, serverPythonDraft, overridesDraft, embeddingsDraft, inactiveEmbeddingsDirty, snapshotBaseline, resetDrafts, toOverrideDraft, toEmbeddingsDraft]);
  const discard = (0, import_react3.useCallback)(() => {
    const data2 = status.data;
    if (!data2) return;
    snapshotBaseline(data2);
    resetDrafts(data2);
    setNotice(null);
    setSaveError(null);
  }, [status.data, snapshotBaseline, resetDrafts]);
  const serverAction = (0, import_react3.useCallback)((action) => {
    if (status.loading || status.error !== null || serverBusy !== null || savingRef.current) return;
    const run = () => {
      setServerBusy(action);
      setServerMessage(null);
      setServerError(null);
      requestJson(action === "restart" ? SERVER_RESTART_URL : SERVER_START_URL, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: "{}"
      }, 3e5, requestsRef.current, t("\u8BF7\u6C42\u8D85\u65F6\u6216\u5DF2\u53D6\u6D88\uFF1B\u670D\u52A1\u53EF\u80FD\u4ECD\u5728\u542F\u52A8\uFF0C\u8BF7\u5237\u65B0\u72B6\u6001\u786E\u8BA4\uFF0C\u52FF\u91CD\u590D\u542F\u52A8\u3002")).then((payload) => {
        if (!mountedRef.current) return;
        autoStartFailuresRef.current = 0;
        statusGenRef.current += 1;
        if (!payload?.status?.config?.values || !payload?.status?.gui || !payload?.status?.api) throw new Error(t("\u670D\u52A1\u54CD\u5E94\u683C\u5F0F\u65E0\u6548\uFF1A\u542F\u52A8\u7ED3\u679C\u5C1A\u672A\u786E\u8BA4\uFF0C\u8BF7\u5237\u65B0\u72B6\u6001\u3002"));
        setStatus({ loading: false, data: payload.status, error: null });
        setServerMessage(action === "restart" ? t("\u5DF2\u6309\u5F53\u524D\u8BBE\u7F6E\u91CD\u542F\u670D\u52A1\u3002") : payload.alreadyRunning === true ? t("\u670D\u52A1\u5DF2\u5728\u8FD0\u884C\u3002") : t("\u670D\u52A1\u5DF2\u542F\u52A8\u3002"));
      }).catch((error) => {
        if (!mountedRef.current) return;
        setServerError((action === "restart" ? t("\u91CD\u542F\u5931\u8D25\uFF1A") : t("\u542F\u52A8\u5931\u8D25\uFF1A")) + String(error?.message ?? error));
        load();
      }).finally(() => {
        if (mountedRef.current) setServerBusy(null);
      });
    };
    if (dirtyRef.current) {
      setServerMessage(t("\u68C0\u6D4B\u5230\u672A\u4FDD\u5B58\u7684\u66F4\u6539\uFF0C\u6B63\u5728\u5148\u4FDD\u5B58\u2026"));
      save().then((result) => {
        if (!mountedRef.current) return;
        if (result === "clean") run();
        else if (result === "edited") setServerError(t("\u64CD\u4F5C\u672A\u6267\u884C\uFF1A\u4FDD\u5B58\u671F\u95F4\u53C8\u51FA\u73B0\u4E86\u65B0\u7684\u672A\u4FDD\u5B58\u66F4\u6539\uFF0C\u8BF7\u786E\u8BA4\u4FDD\u5B58\u6216\u653E\u5F03\u540E\u518D\u6267\u884C\u3002"));
        else setServerError(t("\u64CD\u4F5C\u672A\u6267\u884C\uFF1A\u8BF7\u5148\u89E3\u51B3\u4FDD\u5B58\u5931\u8D25\u7684\u95EE\u9898\u3002"));
      });
      return;
    }
    run();
  }, [load, save, serverBusy, status.loading, status.error]);
  const toggleDefense = (0, import_react3.useCallback)((bankId, enabled) => {
    const previous = defenseRef.current[bankId] ?? null;
    const generation = defenseGenRef.current;
    setDefense((prev) => ({ ...prev, [bankId]: { ...prev[bankId] ?? { unknown: false, enabled: !enabled }, loading: true, error: null } }));
    requestJson(BANKDEFENSE_URL, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ bankId, enabled, apiUrl: apiBaseRef.current ?? "" })
    }, 3e4, requestsRef.current, t("\u8131\u654F\u5199\u5165\u8D85\u65F6\u6216\u5DF2\u53D6\u6D88\uFF1A\u7ED3\u679C\u5C1A\u672A\u786E\u8BA4\uFF0C\u8BF7\u91CD\u8BFB\u7B56\u7565\u540E\u518D\u64CD\u4F5C\u3002")).then((payload) => {
      if (!mountedRef.current || generation !== defenseGenRef.current) return;
      const confirmedEnabled = defenseEnabled(payload);
      setDefense((prev) => ({
        ...prev,
        [bankId]: {
          loading: false,
          unknown: false,
          enabled: confirmedEnabled,
          action: null,
          error: null
        }
      }));
    }).catch((error) => {
      if (!mountedRef.current || generation !== defenseGenRef.current) return;
      const message = String(error?.message ?? error);
      const uncertain = error.status === void 0 || error.status >= 500;
      setDefense((prev) => ({
        ...prev,
        [bankId]: previous ? { ...previous, loading: false, unknown: previous.unknown === true || uncertain, error: message } : { loading: false, unknown: true, enabled: false, action: null, error: message }
      }));
    });
  }, []);
  const data = status.data;
  const api = data ? data.api : null;
  const cp = data ? data.controlPlane : null;
  const config = data ? data.config : null;
  const server = data ? data.server : null;
  const extraKeys = config && Array.isArray(config.extraKeys) ? config.extraKeys : [];
  const recordMode = draft && draft.dynamicBankId === true ? "dynamic" : "fixed";
  const ownership = server ? server.ownership : void 0;
  const legacyHost = server !== null && ownership === void 0;
  const canStartNow = !status.loading && status.error === null && (legacyHost ? api?.up !== true : server?.canStart === true);
  const canRestartNow = !status.loading && status.error === null && !legacyHost && server?.canRestart === true && server?.controlReady !== false;
  const operationInFlight = saving || serverBusy !== null || server !== null && server.operation != null;
  const overrideProviders = (0, import_react3.useMemo)(() => {
    const ids = [];
    const seen = /* @__PURE__ */ new Set();
    const push = (id) => {
      if (id && !seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    };
    for (const p of modelsState.providers) push(p.id);
    for (const value of Object.values(serverModelsDraft)) {
      const spec = typeof value === "string" ? value : "";
      const slash = spec.indexOf("/");
      push(slash > 0 ? spec.slice(0, slash).toLowerCase() : "");
    }
    for (const id of Object.keys(overridesDraft)) push(id);
    return ids;
  }, [modelsState.providers, serverModelsDraft, overridesDraft]);
  const embeddingPreview = server?.embeddingPreview;
  const runningEmbedding = server?.runningConfig?.embeddingPreview;
  const visibleBanks = banks.filter((bank) => `${bank.id} ${bank.name ?? ""}`.toLowerCase().includes(bankSearch.trim().toLowerCase()));
  const dirtyFor = (tab) => {
    const base = baselineRef.current;
    if (!dirty || !base || !draft) return false;
    const changed = (keys) => keys.some((key) => draft[key] !== base.configValues[key]);
    if (tab === "overview") return autoStartDraft !== base.autoStart || serverCommandDraft !== base.serverCommand || serverPythonDraft !== base.serverPython;
    if (tab === "memory") return changed(["disabled", "apiUrl", "logLevel", "bankId", "dynamicBankId"]) || cpDraft !== base.controlPlaneUrl;
    if (tab === "security") return auditDraft !== base.auditLogEnabled;
    if (tab === "advanced") return changed(["autoUpdate", "codebaseSurvey"]);
    return changed(["surveyModel"]) || JSON.stringify(serverModelsDraft) !== JSON.stringify(base.serverModels) || JSON.stringify(overridesDraft) !== JSON.stringify(base.providerOverrides) || JSON.stringify(embeddingsDraft) !== JSON.stringify(base.serverEmbeddings) || inactiveEmbeddingsDirty;
  };
  const tabDescription = {
    overview: t("\u67E5\u770B\u8FDE\u63A5\u4E0E\u670D\u52A1\u5F52\u5C5E\uFF1B\u4EC5\u5728\u6EE1\u8DB3\u8EAB\u4EFD\u6838\u9A8C\u6761\u4EF6\u65F6\u542F\u52A8\u6216\u91CD\u542F\u3002"),
    memory: t("\u7BA1\u7406\u8BB0\u5FC6\u5F00\u5173\u3001\u8BB0\u5FC6\u5E93\u547D\u540D\u4E0E\u8FDE\u63A5\u5730\u5740\u3002"),
    models: t("\u533A\u5206 DSH \u529F\u80FD\u6A21\u578B\u4E0E Hindsight \u5411\u91CF\u540E\u7AEF\uFF0C\u4FDD\u5B58\u540E\u6309\u751F\u6548\u65F6\u673A\u5E94\u7528\u3002"),
    security: t("\u5BA1\u8BA1\u8BBE\u7F6E\u5728\u670D\u52A1\u91CD\u542F\u540E\u5E94\u7528\uFF1B\u8BB0\u5FC6\u5E93\u8131\u654F\u5F00\u5173\u5373\u65F6\u5199\u5165\u3002"),
    advanced: t("\u8C03\u6574\u63D2\u4EF6\u9009\u9879\uFF0C\u67E5\u770B\u672C\u9875\u4E0D\u4F1A\u6539\u5199\u7684\u5176\u5B83\u914D\u7F6E\u952E\u3002")
  };
  const apiLabel = !api || status.error !== null || api.state === "unknown" ? "unknown" : api.up ? "up" : "down";
  const restartReason = status.loading ? t("\u6B63\u5728\u5237\u65B0\u72B6\u6001\uFF0C\u8BF7\u7B49\u5F85\u6838\u9A8C\u5B8C\u6210\u540E\u518D\u64CD\u4F5C\u3002") : status.error !== null ? t("\u72B6\u6001\u8BFB\u53D6\u5931\u8D25\uFF1A\u8BF7\u5148\u5237\u65B0\u6838\u5BF9\uFF0C\u4E0D\u4F7F\u7528\u65E7\u72B6\u6001\u6388\u6743\u64CD\u4F5C\u3002") : operationInFlight ? t("\u670D\u52A1\u64CD\u4F5C\u6B63\u5728\u6267\u884C\uFF0C\u8BF7\u7B49\u5F85\u5B8C\u6210\u540E\u518D\u64CD\u4F5C\u3002") : saving ? t("\u914D\u7F6E\u6B63\u5728\u4FDD\u5B58\uFF0C\u8BF7\u7B49\u5F85\u4FDD\u5B58\u5B8C\u6210\u3002") : ownership === "managed" ? t("\u542F\u52A8\u9884\u68C0\u672A\u901A\u8FC7\uFF0C\u8BF7\u68C0\u67E5\u914D\u7F6E\u9519\u8BEF\u548C\u51ED\u636E\u89E3\u6790\u63D0\u793A\u3002") : ownership === "unmanaged" ? t("\u7AEF\u53E3\u7531\u5916\u90E8\u8FDB\u7A0B\u5360\u7528\uFF1A\u672C\u63D2\u4EF6\u65E0\u6CD5\u91CD\u542F\u5B83\uFF0C\u53EA\u80FD\u7B49\u5F85\u5176\u9000\u51FA\u540E\u518D\u542F\u52A8\u6258\u7BA1\u5B9E\u4F8B\u3002") : ownership === "stopped" ? t("\u670D\u52A1\u672A\u8FD0\u884C\uFF1A\u91CD\u542F\u4E0D\u53EF\u7528\uFF0C\u8BF7\u4F7F\u7528\u300C\u542F\u52A8\u670D\u52A1\u300D\u3002") : t("\u670D\u52A1\u5F52\u5C5E\u672A\u77E5\uFF1A\u4E3A\u907F\u514D\u8BEF\u4F24\u5176\u5B83\u8FDB\u7A0B\uFF0C\u91CD\u542F\u4E0D\u53EF\u7528\u3002");
  const selectTab = (id) => setActiveTab(id);
  const tabKeyDown = (event, index) => {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % TABS.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + TABS.length) % TABS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = TABS.length - 1;
    else return;
    event.preventDefault();
    selectTab(TABS[next].id);
    tabRefs.current[TABS[next].id]?.focus();
  };
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "root", lang: locale === "en" ? "en" : "zh-CN", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "headrow", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "brand", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "mark", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PanelIcon, { size: 25 }) }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: PREFIX + "eyebrow", children: "MEMORY SETTINGS" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { className: PREFIX + "h", children: "Hindsight" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "actions", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(Pill, { tone: apiLabel === "up" ? "ok" : apiLabel === "unknown" ? "warn" : "bad", children: [
            "API ",
            apiLabel === "up" ? t("\u8FD0\u884C\u4E2D") : apiLabel === "unknown" ? t("\u72B6\u6001\u672A\u77E5") : t("\u672A\u8FD0\u884C")
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(Pill, { tone: cp?.up === true && status.error === null ? "ok" : "warn", children: [
            t("\u63A7\u5236\u53F0"),
            " ",
            !cp || status.error !== null ? t("\u72B6\u6001\u672A\u77E5") : cp.up ? t("\u53EF\u7528") : t("\u4E0D\u53EF\u7528")
          ] }),
          server?.pendingRestart === true && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Pill, { tone: "warn", children: t("\u5F85\u4E0B\u6B21\u542F\u52A8\u5E94\u7528") }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "select",
            {
              className: PREFIX + "select " + PREFIX + "lang",
              value: locale,
              "aria-label": t("\u754C\u9762\u8BED\u8A00"),
              title: t("\u754C\u9762\u8BED\u8A00"),
              onChange: (event) => setLocale(event.target.value),
              children: LOCALES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: item.value, children: item.label }, item.value))
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: PREFIX + "sub", children: t("\u4FDD\u5B58\u4E0D\u7B49\u4E8E\u8FD0\u884C\u5E94\u7528\uFF1A\u5DF2\u6709\u5DE5\u4F5C\u533A\u53EF\u80FD\u9700\u91CD\u542FDSH\uFF1BAPI\u670D\u52A1\u8BBE\u7F6E\u4EC5\u5728\u4E0B\u6B21\u53D7\u63A7\u542F\u52A8/\u91CD\u542F\u5E94\u7528\uFF0C\u4E0D\u4F1A\u81EA\u52A8\u91CD\u542F\u3002") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: PREFIX + "tabs", role: "tablist", "aria-label": t("Hindsight \u8BBE\u7F6E\u5206\u7C7B"), children: TABS.map((tab, index) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
      "button",
      {
        type: "button",
        role: "tab",
        id: "dsh-hsp-tab-" + tab.id,
        "aria-controls": "dsh-hsp-panel-" + tab.id,
        "aria-selected": activeTab === tab.id,
        tabIndex: activeTab === tab.id ? 0 : -1,
        ref: (element) => {
          tabRefs.current[tab.id] = element;
        },
        className: PREFIX + "tab",
        onClick: () => selectTab(tab.id),
        onKeyDown: (event) => tabKeyDown(event, index),
        children: [
          t(tab.label),
          dirtyFor(tab.id) ? " \xB7" : ""
        ]
      },
      tab.id
    )) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "intro", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: t(TABS.find((tab) => tab.id === activeTab)?.label) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: tabDescription[activeTab] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "badge", children: status.loading ? t("\u6B63\u5728\u5237\u65B0\u72B6\u6001") : data?.sampledAt ? tf("\u72B6\u6001\u91C7\u6837 {0}", [new Date(data.sampledAt).toLocaleTimeString()]) : t("\u7B49\u5F85\u72B6\u6001\u91C7\u6837") })
    ] }),
    status.loading && draft === null && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: PREFIX + "muted", role: "status", children: t("\u8BFB\u53D6\u4E2D\u2026") }),
    status.error !== null && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Row, { label: t("\u8BFB\u53D6\u5931\u8D25"), children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "err", children: status.error }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: PREFIX + "actions", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: PREFIX + "btn", onClick: load, children: t("\u91CD\u8BD5") }) })
    ] }),
    (config?.error || data?.gui?.error) && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: PREFIX + "errbanner", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
      t("\u914D\u7F6E\u8BFB\u53D6\u5931\u8D25\uFF1A"),
      config?.error ?? data?.gui?.error,
      t("\u3002\u4E0D\u4F1A\u8986\u76D6\u635F\u574F\u6216\u4E0D\u53EF\u8BFB\u7684\u6587\u4EF6\uFF0C\u8BF7\u5148\u5728\u672C\u673A\u4FEE\u590D\u3002")
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("section", { id: "dsh-hsp-panel-overview", role: "tabpanel", "aria-labelledby": "dsh-hsp-tab-overview", hidden: activeTab !== "overview", className: PREFIX + "tabpanel", children: server && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "cardhead", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { className: PREFIX + "cardtitle", children: t("\u670D\u52A1\u7BA1\u7406") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "actions", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: PREFIX + "btn", disabled: operationInFlight || !canStartNow, onClick: () => serverAction("start"), children: serverBusy === "start" || status.error === null && server.operation === "start" ? t("\u542F\u52A8\u4E2D\u2026") : t("\u542F\u52A8\u670D\u52A1") }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: PREFIX + "btn " + PREFIX + "btnprimary", disabled: operationInFlight || !canRestartNow, onClick: () => serverAction("restart"), children: serverBusy === "restart" || status.error === null && server.operation === "restart" ? t("\u91CD\u542F\u4E2D\u2026") : t("\u91CD\u542F\u670D\u52A1") })
        ] })
      ] }),
      server.controlError && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: PREFIX + "errbanner", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
        t("\u534F\u4F5C\u63A7\u5236\u4E0D\u53EF\u7528\uFF1A"),
        server.controlError
      ] }) }),
      server.ownership !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Row, { label: t("\u5F52\u5C5E"), children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Pill, { tone: server.ownership === "managed" ? "ok" : "warn", children: server.ownership === "managed" ? t("\u6258\u7BA1\uFF08\u672C\u63D2\u4EF6\u542F\u52A8\uFF09") : server.ownership === "unmanaged" ? t("\u5916\u90E8\u8FDB\u7A0B") : server.ownership === "stopped" ? t("\u672A\u8FD0\u884C") : t("\u672A\u77E5") }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(Row, { label: "API", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Pill, { tone: api?.up === true ? "ok" : api?.state === "unknown" ? "warn" : "bad", children: api?.up === true ? t("\u8FD0\u884C\u4E2D") : api?.state === "unknown" ? t("\u72B6\u6001\u672A\u77E5") : t("\u672A\u8FD0\u884C") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: PREFIX + "muted", children: [
          " ",
          api?.url
        ] }),
        api?.state === "error" && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: PREFIX + "err", children: [
          " ",
          api.error
        ] })
      ] }),
      api?.up === true && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(Row, { label: t("\u6570\u636E\u5E93"), children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "mono", children: api.database ?? "\u2014" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: PREFIX + "muted", children: [
          " \xB7 ",
          api.status ?? "\u2014"
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(Row, { label: t("\u63A7\u5236\u53F0"), children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Pill, { tone: cp?.up === true ? "ok" : "bad", children: cp?.up === true ? t("\u8FD0\u884C\u4E2D") : t("\u672A\u8FD0\u884C") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: PREFIX + "muted", children: [
          " ",
          cp?.url
        ] })
      ] }),
      server.lastAction && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Row, { label: t("\u6700\u8FD1\u64CD\u4F5C"), children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: server.lastAction.ok === true ? PREFIX + "good" : PREFIX + "err", children: [
        server.lastAction.action === "restart" ? t("\u91CD\u542F") : t("\u542F\u52A8"),
        " \xB7 ",
        server.lastAction.detail ?? ""
      ] }) }),
      server.previewError && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: PREFIX + "errbanner", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
        t("\u542F\u52A8\u914D\u7F6E\u89E3\u6790\u5931\u8D25\uFF1A"),
        server.previewError
      ] }) }),
      server.ownershipError && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: PREFIX + "errbanner", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
        t("\u670D\u52A1\u8EAB\u4EFD\u65E0\u6CD5\u6838\u9A8C\uFF1A"),
        server.ownershipError
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("details", { className: PREFIX + "details", open: serviceDetailsExpanded, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("summary", { onClick: (event) => {
          event.preventDefault();
          setServiceDetailsExpanded((value) => !value);
        }, children: t("\u542F\u52A8\u4E0E\u8FD0\u884C\u8BE6\u60C5") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "foldbody", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Row, { label: t("\u542F\u52A8\u5165\u53E3"), children: server.entry ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: PREFIX + "mono", children: [
            server.entry.command,
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: PREFIX + "muted", children: [
              "\uFF08",
              server.entry.source,
              "\uFF09"
            ] })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "err", children: server.entryReason ?? t("\u672A\u627E\u5230") }) }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(Row, { label: t("\u76D1\u542C PID"), children: [
            server.managedPid ?? t("\u672A\u786E\u8BA4"),
            " ",
            t("\xB7 \u7AEF\u53E3"),
            " ",
            server.port ?? t("\u672A\u77E5")
          ] }),
          server.runningConfig && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(Row, { label: t("\u8FD0\u884C\u4E2D\u914D\u7F6E"), children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "mono", children: server.runningConfig.fingerprint ?? "\u2014" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: PREFIX + "muted", children: [
              t("\u542F\u52A8\u4E8E"),
              " ",
              server.runningConfig.startedAt ?? "\u2014",
              server.runningConfig.auditLogEnabled === true ? t(" \xB7 \u5BA1\u8BA1\u65E5\u5FD7\u5F00") : server.runningConfig.auditLogEnabled === false ? t(" \xB7 \u5BA1\u8BA1\u65E5\u5FD7\u5173") : ""
            ] })
          ] })
        ] })
      ] }),
      api?.up === true && server.runtimeConfigKnown === false && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "hint", children: t("\u8FD0\u884C\u4E2D\u670D\u52A1\u7684\u5B9E\u9645\u914D\u7F6E\u65E0\u6CD5\u786E\u8BA4\uFF08\u53EF\u80FD\u7531\u5916\u90E8\u542F\u52A8\uFF09\uFF1B\u300C\u4E0B\u6B21\u542F\u52A8\u5C06\u5E94\u7528\u300D\u4EC5\u53CD\u6620\u672C\u9875\u4FDD\u5B58\u7684\u503C\u3002") }),
      (!canRestartNow || operationInFlight) && !legacyHost && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "hint", children: restartReason }),
      Array.isArray(server.resolutions) && server.resolutions.some((res) => res.mode === "error") && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: PREFIX + "errbanner", role: "alert", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
        t("\u542F\u52A8\u9884\u68C0\u5931\u8D25\uFF1A"),
        server.resolutions.filter((res) => res.mode === "error").map((res) => `${res.scope}: ${res.note}`).join("\uFF1B")
      ] }) }),
      server.pendingRestart === true && api?.up === true && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "banner", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: server.runtimeConfigKnown === true ? t("\u670D\u52A1\u7AEF\u8BBE\u7F6E\u5DF2\u4FEE\u6539\uFF0C\u5DF2\u786E\u8BA4\u7684\u542F\u52A8\u914D\u7F6E\u4E0E\u4FDD\u5B58\u503C\u4E0D\u540C\u3002") : t("\u670D\u52A1\u7AEF\u8BBE\u7F6E\u5DF2\u4FDD\u5B58\uFF1B\u5F53\u524D\u5B9E\u4F8B\u914D\u7F6E\u672A\u77E5\uFF0C\u65E0\u6CD5\u786E\u8BA4\u662F\u5426\u5DF2\u751F\u6548\u3002") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: PREFIX + "btn", disabled: operationInFlight || !canRestartNow, onClick: () => serverAction("restart"), children: t("\u7ACB\u5373\u91CD\u542F\u751F\u6548") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("details", { className: PREFIX + "details", open: launchExpanded, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("summary", { onClick: (event) => {
          event.preventDefault();
          setLaunchExpanded((value) => !value);
        }, children: t("\u542F\u52A8\u9009\u9879\u4E0E\u4E0B\u6B21\u914D\u7F6E") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "foldbody", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "label", children: t("\u81EA\u52A8\u542F\u52A8") }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "control", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: PREFIX + "check", children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                  "input",
                  {
                    type: "checkbox",
                    checked: autoStartDraft,
                    onChange: (event) => setAutoStartDraft(event.target.checked)
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: t("API \u672A\u8FD0\u884C\u65F6\uFF0C\u6253\u5F00\u672C\u9875\u81EA\u52A8\u62C9\u8D77\u670D\u52A1\uFF08\u4FDD\u5B58\u540E\u751F\u6548\uFF09") })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "hint", children: t("\u7531\u63D2\u4EF6\u6309\u4E0B\u65B9\u300C\u529F\u80FD\u6A21\u578B\u8C03\u7528\u300D\u7B49\u8BBE\u7F6E\u52A8\u6001\u6784\u5EFA\u73AF\u5883\u5E76\u542F\u52A8\uFF0C\u65E0\u9700\u7CFB\u7EDF\u542F\u52A8\u811A\u672C\u3002") })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "label", children: t("\u542F\u52A8\u547D\u4EE4\u8986\u76D6") }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "control", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "input",
                {
                  className: PREFIX + "input",
                  type: "text",
                  "aria-label": t("\u670D\u52A1\u542F\u52A8\u547D\u4EE4\u8986\u76D6"),
                  value: serverCommandDraft,
                  placeholder: t("\u7559\u7A7A = \u81EA\u52A8\u53D1\u73B0\uFF08PATH \u2192 uv/pip \u9ED8\u8BA4\u5B89\u88C5\u4F4D\u7F6E\uFF09"),
                  onChange: (event) => setServerCommandDraft(event.target.value)
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "hint", children: t("\u7528\u4E8E\u5B9A\u4F4D\u76F8\u90BB\u7684 Python \u73AF\u5883\uFF1B\u586B\u5199\u4E0B\u65B9\u89E3\u91CA\u5668\u540E\u4F18\u5148\u4F7F\u7528\u89E3\u91CA\u5668\uFF0C\u4E0D\u518D\u901A\u8FC7\u6B64\u547D\u4EE4\u542F\u52A8\u3002") })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "label", children: t("Hindsight Python \u73AF\u5883") }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "control", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "input",
                {
                  className: PREFIX + "input",
                  type: "text",
                  "aria-label": t("Hindsight Python \u89E3\u91CA\u5668"),
                  value: serverPythonDraft,
                  placeholder: t("\u5DF2\u5B89\u88C5 hindsight-api \u7684 Python \u89E3\u91CA\u5668\u5B8C\u6574\u8DEF\u5F84"),
                  onChange: (event) => setServerPythonDraft(event.target.value)
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "hint", children: t("\u7559\u7A7A\u4EC5\u5C1D\u8BD5\u542F\u52A8\u5165\u53E3\u65C1\u7684 python\uFF1B\u65E0\u6CD5\u786E\u8BA4\u65F6\u62D2\u7EDD\u542F\u52A8\uFF0C\u4E0D\u731C\u6D4B\u5176\u5B83\u73AF\u5883\u3002\u5F53\u524D\u534F\u4F5C\u5173\u95ED\u9002\u914D Hindsight 0.10.2\u3001\u5355 worker\uFF1B\u5DF2\u6709 HTTP \u6269\u5C55\u65F6\u4E0D\u4F1A\u8986\u76D6\u3002") })
            ] })
          ] }),
          Array.isArray(server.resolutions) && server.resolutions.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "control", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "hint", children: t("\u4E0B\u6B21\u542F\u52A8/\u91CD\u542F\u5C06\u5E94\u7528\uFF1A") }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ul", { className: PREFIX + "list", children: server.resolutions.map((res) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { className: PREFIX + "item", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "muted", style: { flex: "0 0 64px" }, children: t(SERVER_SCOPES.find((s) => s.key === res.scope)?.label) ?? res.scope }),
              res.mode === "error" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: PREFIX + "err", style: { minWidth: 0 }, children: [
                res.spec,
                " \u2014 ",
                res.note
              ] }) : res.mode === "default" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "muted", children: res.note }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { style: { minWidth: 0 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "mono", children: res.spec }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: PREFIX + "muted", children: [
                  " ",
                  t("\xB7 \u51ED\u636E"),
                  " ",
                  res.credentialSource,
                  res.baseUrl ? ` \xB7 ${res.baseUrl}` : ""
                ] })
              ] })
            ] }, res.scope)) })
          ] })
        ] })
      ] }),
      serverError && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "errbanner", role: "alert", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: serverError }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "button",
          {
            type: "button",
            className: PREFIX + "btn",
            disabled: operationInFlight || !canStartNow,
            onClick: () => {
              setServerError(null);
              serverAction("start");
            },
            children: t("\u91CD\u8BD5\u542F\u52A8")
          }
        )
      ] }),
      serverMessage && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: PREFIX + "notice", children: serverMessage }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("a", { className: PREFIX + "btn", href: cp ? cp.url : "#", target: "_blank", rel: "noreferrer noopener", children: t("\u6253\u5F00 Control Plane") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: PREFIX + "btn", onClick: load, children: t("\u5237\u65B0\u72B6\u6001") })
      ] })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("section", { id: "dsh-hsp-panel-memory", role: "tabpanel", "aria-labelledby": "dsh-hsp-tab-memory", hidden: activeTab !== "memory", className: PREFIX + "tabpanel", children: draft !== null && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { className: PREFIX + "cardtitle", children: t("\u8BB0\u5FC6") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "label", children: t("\u542F\u7528") }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "control", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: PREFIX + "check", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "input",
                {
                  type: "checkbox",
                  checked: draft.disabled !== true,
                  onChange: (event) => set("disabled", !event.target.checked)
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: t("\u5728\u8FD9\u4E2A harness \u4E0A\u542F\u7528\u957F\u671F\u8BB0\u5FC6") })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "hint", children: t("\u5173\u95ED\u4F1A\u4FDD\u5B58 disabled\uFF1B\u5DF2\u7F13\u5B58\u7684\u5DE5\u4F5C\u533A\u53EF\u80FD\u4ECD\u53EC\u56DE\u3001\u5199\u56DE\u6216\u4FDD\u7559\u5DE5\u5177\uFF0C\u9700\u91CD\u542FDSH\u91CD\u65B0\u521D\u59CB\u5316\u540E\u6838\u9A8C\u3002\u4EC5\u65B0\u5EFA\u540C\u4E00\u5DE5\u4F5C\u533A\u4F1A\u8BDD\u6216\u91CD\u542FAPI\u4E0D\u4FDD\u8BC1\u751F\u6548\u3002") })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "label", children: t("\u8BB0\u5FC6\u5E93\u547D\u540D") }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "control", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: PREFIX + "check", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "input",
                {
                  type: "radio",
                  name: "bankmode",
                  checked: recordMode === "dynamic",
                  onChange: () => set("dynamicBankId", true)
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
                t("\u6309\u5DE5\u4F5C\u533A\u52A8\u6001\u547D\u540D"),
                " ",
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "muted", children: t("(harness::\u9879\u76EE\u540D\uFF0C\u4F8B\u5982 coding-agent::DSH)") })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: PREFIX + "check", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "input",
                {
                  type: "radio",
                  name: "bankmode",
                  checked: recordMode === "fixed",
                  onChange: () => set("dynamicBankId", false)
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: t("\u56FA\u5B9A\u540D\u5B57") })
            ] }),
            recordMode === "fixed" && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "input",
              {
                className: PREFIX + "input",
                type: "text",
                "aria-label": t("\u56FA\u5B9A\u8BB0\u5FC6\u5E93\u540D\u79F0"),
                value: draft.bankId ?? "",
                placeholder: "my-memory-bank",
                onChange: (event) => set("bankId", event.target.value)
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { className: PREFIX + "cardtitle", children: t("\u8FDE\u63A5") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "label", children: t("\u670D\u52A1\u5730\u5740") }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "control", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "input",
              {
                className: PREFIX + "input",
                type: "text",
                "aria-label": t("Hindsight API \u670D\u52A1\u5730\u5740"),
                value: draft.apiUrl ?? "",
                placeholder: "http://localhost:8888",
                onChange: (event) => set("apiUrl", event.target.value)
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "hint", children: t("Hindsight API \u7684\u5730\u5740\u3002\u542F\u52A8/\u91CD\u542F\u670D\u52A1\u65F6\u6309\u6B64\u7AEF\u53E3\u76D1\u542C\uFF08\u5199\u5165 apiUrl\uFF09\u3002") })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "label", children: t("\u63A7\u5236\u53F0\u5730\u5740") }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "control", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "input",
              {
                className: PREFIX + "input",
                type: "text",
                "aria-label": t("Control Plane \u63A7\u5236\u53F0\u5730\u5740"),
                value: cpDraft ?? "",
                placeholder: "http://127.0.0.1:9999",
                onChange: (event) => setCp(event.target.value)
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: PREFIX + "hint", children: [
              t("Hindsight Control Plane \u7684\u5730\u5740\uFF08Web \u63A7\u5236\u53F0\uFF09\u3002\u4EC5\u63A5\u53D7 http/https\uFF0C\u4E0D\u542B\u8DEF\u5F84\u53C2\u6570\u3002"),
              data?.gui?.source === "env" && t(" \u5F53\u524D\u53D6\u81EA\u73AF\u5883\u53D8\u91CF HINDSIGHT_CP_URL\uFF0C\u4FDD\u5B58\u540E\u6539\u7531\u672C\u9875\u7BA1\u7406\u3002"),
              data?.gui?.source === "default" && t(" \u5F53\u524D\u4E3A\u9ED8\u8BA4\u503C\uFF0C\u4FDD\u5B58\u540E\u6539\u7531\u672C\u9875\u7BA1\u7406\u3002")
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "label", children: t("\u65E5\u5FD7\u7EA7\u522B") }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "control", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "select",
              {
                className: PREFIX + "select",
                "aria-label": t("\u65E5\u5FD7\u7EA7\u522B"),
                value: draft.logLevel ?? "info",
                onChange: (event) => set("logLevel", event.target.value),
                children: LOG_LEVELS.map((level) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: level, children: level }, level))
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "hint", children: t("\u5199\u5165 ~/.hindsight/coding-agents-logs/plugin.log \u7684\u8BE6\u7EC6\u7A0B\u5EA6\u3002") })
          ] })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("section", { id: "dsh-hsp-panel-models", role: "tabpanel", "aria-labelledby": "dsh-hsp-tab-models", hidden: activeTab !== "models", className: PREFIX + "tabpanel", children: draft !== null && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: PREFIX + "card", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("details", { className: PREFIX + "fold", open: chatExpanded, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("summary", { onClick: (event) => {
          event.preventDefault();
          setChatExpanded((value) => !value);
        }, children: t("\u529F\u80FD\u6A21\u578B\u8C03\u7528") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "foldbody", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "cardhead", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "hint", children: t("DSH \u804A\u5929\u6A21\u578B\u8DEF\u7531") }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "button",
              {
                type: "button",
                className: PREFIX + "btn",
                style: { height: "24px", padding: "0 8px", fontSize: "11.5px" },
                onClick: loadModels,
                disabled: modelsState.loading,
                children: modelsState.loading ? t("\u83B7\u53D6\u6A21\u578B\u4E2D\u2026") : t("\u5237\u65B0 DSH \u6A21\u578B")
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "hint", style: { marginTop: "-4px" }, children: t("\u4ECE\u5F53\u524D DSH \u73AF\u5883\u5DF2\u6CE8\u518C\u7684 Provider \u53D1\u73B0\u6A21\u578B\uFF0C\u652F\u6301\u4E0B\u62C9\u70B9\u9009\u6216\u624B\u52A8\u6307\u5B9A\uFF1B\u4FDD\u5B58\u540E\u91CD\u542F\u670D\u52A1\u751F\u6548\u3002") }),
          (modelsState.state === "error" || modelsState.state === "unavailable") && !modelsState.loading && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: PREFIX + "errbanner", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
            t("\u65E0\u6CD5\u83B7\u53D6 DSH \u6A21\u578B\u5217\u8868\uFF1A"),
            modelsState.error ?? (modelsState.errors.map((entry) => entry.error).join("\uFF1B") || t("\u670D\u52A1\u4E0D\u53EF\u7528")),
            modelsState.sampledAt ? tf("\uFF08\u91C7\u6837\u4E8E {0}\uFF09", [modelsState.sampledAt]) : ""
          ] }) }),
          modelsState.state === "partial" && modelsState.errors.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: PREFIX + "banner", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
            t("\u90E8\u5206 Provider \u6A21\u578B\u83B7\u53D6\u5931\u8D25\uFF1A"),
            modelsState.errors.map((e) => `${e.provider ?? t("\u672A\u77E5 Provider")}\uFF1A${e.error}`).join("\uFF1B"),
            modelsState.sampledAt ? tf("\uFF08\u91C7\u6837\u4E8E {0}\uFF09", [modelsState.sampledAt]) : ""
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(Row, { label: t("\u4EE3\u7801\u5E93\u52D8\u5BDF\uFF08\u5916\u90E8 CLI\uFF09"), children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "input",
              {
                className: PREFIX + "input",
                type: "text",
                "aria-label": t("\u52D8\u5BDF CLI \u6A21\u578B\u6807\u8BC6"),
                placeholder: t("\u7559\u7A7A\u7EE7\u627F\u9ED8\u8BA4 haiku"),
                value: draft.surveyModel ?? "",
                onChange: (event) => set("surveyModel", event.target.value)
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "hint", children: t("surveyModel \u662F\u5916\u90E8 runner \u7684\u6A21\u578B\u6807\u8BC6\uFF0C\u4E0D\u662F DSH Provider/Model \u76EE\u5F55\u3002\u5B98\u65B9\u9002\u914D\u5668\u63A2\u6D4B Claude\u3001Codex\u3001Antigravity\u3001OpenCode \u7B49 CLI\uFF1B\u6A21\u578B\u53C2\u6570\u652F\u6301\u53D6\u51B3\u4E8E\u6240\u9009 runner\u3002\u52D8\u5BDF\u9700\u8981\u5DF2\u5B89\u88C5\u4E14\u5DF2\u8BA4\u8BC1\u7684 CLI\uFF0C\u53EF\u80FD\u4EA7\u751F\u8D39\u7528\uFF1B\u672C\u9875\u4E0D\u5B89\u88C5\u3001\u63A2\u6D4B\u6216\u6267\u884C\u5B83\u4EEC\u3002\u5DF2\u6709\u5DE5\u4F5C\u533A\u4FDD\u5B58\u540E\u53EF\u80FD\u9700\u91CD\u542FDSH\u3002") })
          ] }),
          SERVER_SCOPES.map((scope) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            ModelSelectField,
            {
              label: t(scope.label),
              hint: t(scope.hint) + tf("\uFF08\u5199\u5165 serverModels.{0}\uFF09", [scope.key]),
              defaultValue: t("\u7EE7\u627F\u542F\u52A8\u73AF\u5883/\u540E\u7AEF\u9ED8\u8BA4\uFF0C\u578B\u53F7\u672A\u786E\u8BA4"),
              value: serverModelsDraft[scope.key] ?? "",
              onChange: (val) => setServerModel(scope.key, val),
              providers: modelsState.providers
            },
            scope.key
          ))
        ] })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { className: PREFIX + "cardtitle", children: t("\u5411\u91CF\u6A21\u578B") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "hint", children: t("\u6B64\u5904\u662F Hindsight \u5411\u91CF\u5316\u4E13\u7528\u6A21\u578B\uFF0C\u4E0D\u5C5E\u4E8E DSH \u804A\u5929\u6A21\u578B\u5217\u8868\u3002\u9884\u89C8\u53CD\u6620\u5DF2\u4FDD\u5B58\u8BBE\u7F6E\u800C\u975E\u5F53\u524D\u8349\u7A3F\uFF1B\u6240\u6709\u4FDD\u5B58\u4EC5\u5F71\u54CD\u4E0B\u6B21\u542F\u52A8\u3002\u672C\u9875\u4E0D\u4F1A\u8FC1\u79FB\u7D22\u5F15\u3001\u4E0B\u8F7D\u6A21\u578B\u6216\u91CD\u542F\u670D\u52A1\u3002") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: PREFIX + "banner", children: t("\u66F4\u6362\u5411\u91CF\u6A21\u578B\u6216\u7EF4\u5EA6\u53EF\u80FD\u9700\u8981\u91CD\u5EFA/\u8FC1\u79FB\u5DF2\u6709\u5411\u91CF\uFF0C\u64CD\u4F5C\u524D\u8BF7\u81EA\u884C\u6838\u5BF9\u5B58\u91CF\u6570\u636E\u3002") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "preview", children: [
          embeddingPreview ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Row, { label: t("\u5DF2\u4FDD\u5B58\u9884\u89C8"), children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: embeddingPreview.mode === "error" ? PREFIX + "err" : PREFIX + "mono", children: [
              embeddingPreview.mode === "error" ? t("\u914D\u7F6E\u9519\u8BEF") : embeddingPreview.provider ?? t("\u672A\u77E5 Provider"),
              embeddingPreview.model ? ` \xB7 ${embeddingPreview.model}` : "",
              embeddingPreview.baseUrl ? ` \xB7 ${embeddingPreview.baseUrl}` : "",
              embeddingPreview.dimensions != null ? tf(" \xB7 {0} \u7EF4", [embeddingPreview.dimensions]) : ""
            ] }) }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(Row, { label: t("\u914D\u7F6E\u6765\u6E90"), children: [
              embeddingPreview.source ?? t("\u672A\u77E5"),
              " \xB7 ",
              embeddingPreview.mode ?? t("\u672A\u77E5"),
              " ",
              t("\xB7 \u51ED\u636E\u6765\u6E90"),
              " ",
              embeddingPreview.credentialSource ?? t("\u672A\u77E5"),
              " \xB7 ",
              embeddingPreview.secretConfigured ? t("\u4E0B\u6B21\u542F\u52A8\u51ED\u636E\u5DF2\u914D\u7F6E\uFF08\u672A\u9A8C\u8BC1\u6709\u6548\u6027\uFF09") : t("\u4E0B\u6B21\u542F\u52A8\u51ED\u636E\u672A\u786E\u8BA4\u914D\u7F6E")
            ] }),
            embeddingPreview.note && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "hint", children: embeddingPreview.note }),
            Array.isArray(embeddingPreview.warnings) && embeddingPreview.warnings.filter((warning) => !isMigrationWarning(warning)).map((warning, i) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: PREFIX + "banner", children: warning }, i))
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: PREFIX + "banner", children: t("\u4E0B\u6B21\u542F\u52A8\u5411\u91CF\u914D\u7F6E\u672A\u77E5\uFF0C\u65E0\u6CD5\u786E\u8BA4\u5DF2\u4FDD\u5B58\u8BBE\u7F6E\u7684\u89E3\u6790\u7ED3\u679C\u3002") }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Row, { label: t("\u5F53\u524D\u8FD0\u884C"), children: runningEmbedding ? tf("{0}{1}\uFF08\u672C\u63D2\u4EF6\u786E\u8BA4\u7684\u542F\u52A8\u5FEB\u7167\uFF09", [runningEmbedding.provider ?? "\u672A\u77E5", runningEmbedding.model ? ` \xB7 ${runningEmbedding.model}` : ""]) : t("\u672A\u77E5\uFF08\u65E0\u672C\u63D2\u4EF6\u786E\u8BA4\u7684\u542F\u52A8\u5FEB\u7167\uFF1B\u4E0D\u80FD\u63A8\u65AD\u6B63\u5728\u4F7F\u7528\u4E0B\u6B21\u542F\u52A8\u914D\u7F6E\uFF09") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "label", children: "Provider" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "control", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
              "select",
              {
                className: PREFIX + "select",
                "aria-label": t("\u5411\u91CF Provider"),
                value: embeddingsDraft.provider,
                onChange: (event) => setEmbeddings("provider", event.target.value),
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "", children: t("\u7EE7\u627F\u73AF\u5883 / \u65E2\u6709\u670D\u52A1\u914D\u7F6E") }),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "local", children: t("local\uFF08\u672C\u5730\uFF09") }),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "openai", children: t("openai\uFF08\u542B LM Studio / OpenAI \u517C\u5BB9\uFF09") }),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "onnx", children: "onnx" }),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "tei", children: t("tei\uFF08\u8FDC\u7AEF\u63A8\u7406\u670D\u52A1\uFF09") }),
                  !["", "local", "openai", "onnx", "tei"].includes(embeddingsDraft.provider) && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("option", { value: embeddingsDraft.provider, children: [
                    t("\u672A\u77E5 Provider\uFF1A"),
                    embeddingsDraft.provider
                  ] })
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "hint", children: t("\u7559\u7A7A\u4FDD\u6301\u7EE7\u627F\uFF1B\u4E0D\u4F1A\u81EA\u52A8\u8FC1\u79FB\u65E7 serverEnv\uFF0C\u65E2\u6709\u503C\u4EC5\u5728\u4E0B\u6B21\u542F\u52A8\u9884\u89C8\u4E2D\u663E\u793A\u3002") })
          ] })
        ] }),
        ["local", "openai", "onnx"].includes(embeddingsDraft.provider) && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "label", children: embeddingsDraft.provider === "onnx" ? t("ONNX \u6A21\u578B ID") : t("\u5411\u91CF\u6A21\u578B") }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "control", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "input",
              {
                className: PREFIX + "input",
                type: "text",
                "aria-label": t("\u5411\u91CF\u6A21\u578B"),
                value: embeddingsDraft.model,
                placeholder: embeddingsDraft.provider === "onnx" ? t("ONNX \u6A21\u578B ID") : t("\u5411\u91CF\u6A21\u578B\u540D\u79F0"),
                onChange: (event) => setEmbeddings("model", event.target.value)
              }
            ),
            embeddingsDraft.provider !== "openai" && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "hint", children: t("\u672C\u5730\u4F9D\u8D56\u53CA\u6A21\u578B\u9700\u81EA\u884C\u51C6\u5907\uFF1B\u4E0D\u4F1A\u81EA\u52A8\u5B89\u88C5\u6216\u4FE1\u4EFB\u8FDC\u7AEF\u4EE3\u7801\u3002") })
          ] })
        ] }),
        ["openai", "tei"].includes(embeddingsDraft.provider) && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "label", children: "Base URL" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "control", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "input",
              {
                className: PREFIX + "input",
                type: "text",
                "aria-label": t("\u5411\u91CF Base URL"),
                value: embeddingsDraft.baseUrl,
                placeholder: embeddingsDraft.provider === "tei" ? t("TEI \u670D\u52A1\u5730\u5740") : t("\u517C\u5BB9 OpenAI \u7684 API \u5730\u5740"),
                onChange: (event) => setEmbeddings("baseUrl", event.target.value)
              }
            ),
            embeddingsDraft.provider === "tei" && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "hint", children: t("TEI \u6A21\u578B\u7531\u8FDC\u7AEF\u670D\u52A1\u51B3\u5B9A\uFF0C\u672C\u9875\u4E0D\u53D1\u9001\u6A21\u578B\u5B57\u6BB5\u3002") })
          ] })
        ] }),
        ["openai", "onnx"].includes(embeddingsDraft.provider) && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "label", children: t("\u7EF4\u5EA6\uFF08\u53EF\u9009\uFF09") }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "control", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "input",
              {
                className: PREFIX + "input",
                type: "number",
                "aria-label": t("\u5411\u91CF\u7EF4\u5EA6"),
                min: "1",
                step: "1",
                value: embeddingsDraft.dimensions ?? "",
                onChange: (event) => setEmbeddings("dimensions", event.target.value)
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "hint", children: t("\u7559\u7A7A\u7EE7\u627F\u65E2\u6709\u7EF4\u5EA6\u914D\u7F6E\uFF0C\u5426\u5219\u7531\u6A21\u578B/\u670D\u52A1\u51B3\u5B9A\uFF1B\u8BBE\u7F6E\u540E\u9700\u6838\u5BF9\u73B0\u6709\u5411\u91CF\u7D22\u5F15\u3002") })
          ] })
        ] }),
        embeddingsDraft.provider === "local" && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "label", children: t("\u5F3A\u5236 CPU") }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: PREFIX + "control", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
            "select",
            {
              className: PREFIX + "select",
              "aria-label": t("\u5411\u91CF\u6A21\u578B\u5F3A\u5236 CPU"),
              value: embeddingsDraft.localForceCpu === null ? "" : String(embeddingsDraft.localForceCpu),
              onChange: (event) => setEmbeddings("localForceCpu", event.target.value === "" ? null : event.target.value === "true"),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "", children: t("\u9ED8\u8BA4\uFF08\u4E0D\u6307\u5B9A\uFF09") }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "true", children: t("\u662F") }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "false", children: t("\u5426") })
              ]
            }
          ) })
        ] }),
        embeddingsDraft.provider === "openai" && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "label", children: t("Key \u73AF\u5883\u53D8\u91CF") }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: PREFIX + "control", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "input",
              {
                className: PREFIX + "input",
                type: "text",
                "aria-label": t("\u5411\u91CF Key \u73AF\u5883\u53D8\u91CF"),
                value: embeddingsDraft.apiKeyEnv,
                placeholder: t("API Key \u73AF\u5883\u53D8\u91CF\u540D"),
                onChange: (event) => setEmbeddings("apiKeyEnv", event.target.value)
              }
            ) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "label", children: t("\u66FF\u6362\u5BC6\u94A5") }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "control", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "input",
                {
                  className: PREFIX + "input",
                  type: "password",
                  "aria-label": t("\u5411\u91CF\u66FF\u6362\u5BC6\u94A5"),
                  autoComplete: "new-password",
                  value: embeddingsDraft.apiKey,
                  placeholder: t("\u5411\u91CF Key\uFF08\u7559\u7A7A\u4FDD\u7559\u5DF2\u5B58\u503C\uFF09"),
                  onChange: (event) => setEmbeddings("apiKey", event.target.value)
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "hint", children: t("\u6B64 Hindsight \u7248\u672C\u9700\u8981\u975E\u7A7A Key\uFF1B\u672C\u5730\u514D\u9274\u6743\u7AEF\u70B9\u4E5F\u9700\u7531\u60A8\u660E\u786E\u586B\u5199\u975E\u654F\u611F\u5360\u4F4D\u503C\uFF0C\u6216\u7EE7\u627F\u5DF2\u6709 Key\u3002\u672C\u9875\u4E0D\u4F1A\u81EA\u52A8\u751F\u6210\u3002") }),
              embeddingsDraft.secretConfigured && (embeddingsDraft.clearApiKey ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "hint", children: t("\u5C06\u6E05\u9664\u672C\u9875\u5DF2\u4FDD\u5B58 Key\uFF1B\u73AF\u5883\u51ED\u636E\u4ECD\u53EF\u80FD\u88AB\u7EE7\u627F\u3002") }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "actions", children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "hint", children: t("\u5DF2\u914D\u7F6E\u672C\u9875 Key\uFF08\u4E0D\u663E\u793A\u5185\u5BB9\uFF09") }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: PREFIX + "btn", onClick: () => setEmbeddings("clearApiKey", true), children: t("\u6E05\u9664\u5411\u91CF Key") })
              ] }))
            ] })
          ] })
        ] }),
        embeddingsDraft.provider && !["local", "openai", "onnx", "tei"].includes(embeddingsDraft.provider) && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: PREFIX + "errbanner", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: t("\u672A\u77E5\u5411\u91CF Provider\uFF1A\u4E0D\u80FD\u63A8\u65AD\u5176\u914D\u7F6E\u6216\u751F\u6548\u72B6\u6001\uFF0C\u8BF7\u5207\u6362\u5230\u53D7\u652F\u6301\u7684\u7C7B\u578B\u3002") }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: PREFIX + "card", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("details", { className: PREFIX + "fold", open: overridesExpanded, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("summary", { onClick: (event) => {
          event.preventDefault();
          setOverridesExpanded((value) => !value);
        }, children: t("Provider \u8986\u76D6") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "foldbody", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "hint", children: t("\u4E3A\u975E\u5185\u7F6E Provider \u586B\u5199 openai \u517C\u5BB9\u7AEF\u70B9\u4E0E\u51ED\u636E\uFF1B\u7559\u7A7A\u8868\u793A\u7528\u73AF\u5883\u53D8\u91CF\uFF08<PROVIDER>_API_KEY\uFF09\u6216 DSH \u51ED\u636E\u5E93\u3002") }),
          overrideProviders.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: PREFIX + "muted", children: t("\u6682\u65E0\u9700\u8981\u8986\u76D6\u7684 Provider\u3002") }),
          overrideProviders.map((provider) => {
            const entry = overridesDraft[provider] ?? { baseUrl: "", apiKeyEnv: "", apiKey: "", clearApiKey: false };
            const secretConfigured = data?.gui?.providerOverrides?.[provider]?.secretConfigured === true;
            return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "field", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "label " + PREFIX + "mono", children: provider }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "control", children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                  "input",
                  {
                    className: PREFIX + "input",
                    type: "text",
                    "aria-label": `${provider} Base URL`,
                    value: entry.baseUrl ?? "",
                    placeholder: t("Base URL\uFF08openai \u517C\u5BB9\u7AEF\u70B9\uFF0C\u4F8B\u5982 https://api.example.com/v1\uFF09"),
                    onChange: (event) => setOverride(provider, "baseUrl", event.target.value)
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "pair", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                    "input",
                    {
                      className: PREFIX + "input",
                      type: "text",
                      "aria-label": tf("{0} Key \u73AF\u5883\u53D8\u91CF", [provider]),
                      value: entry.apiKeyEnv ?? "",
                      placeholder: t("API Key \u73AF\u5883\u53D8\u91CF\u540D"),
                      onChange: (event) => setOverride(provider, "apiKeyEnv", event.target.value)
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                    "input",
                    {
                      className: PREFIX + "input",
                      type: "password",
                      "aria-label": tf("{0} \u66FF\u6362\u5BC6\u94A5", [provider]),
                      autoComplete: "new-password",
                      value: entry.apiKey ?? "",
                      placeholder: secretConfigured && entry.clearApiKey !== true ? t("\u5DF2\u4FDD\u5B58 Key\uFF08\u8F93\u5165\u4EE5\u66FF\u6362\uFF09") : t("\u6216\u76F4\u63A5\u586B Key"),
                      onChange: (event) => setOverride(provider, "apiKey", event.target.value)
                    }
                  )
                ] }),
                secretConfigured && (entry.clearApiKey === true ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "muted", children: t("\u5C06\u6E05\u9664\u5DF2\u4FDD\u5B58\u7684 Key\uFF08\u4FDD\u5B58\u540E\u751F\u6548\uFF09\u3002") }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "actions", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: PREFIX + "pill " + PREFIX + "ok", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "dot" }),
                    t("\u5DF2\u914D\u7F6E Key")
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                    "button",
                    {
                      type: "button",
                      className: PREFIX + "btn",
                      style: { height: "24px", padding: "0 8px", fontSize: "12px" },
                      onClick: () => setOverride(provider, "clearApiKey", true),
                      children: t("\u6E05\u9664\u5DF2\u5B58 Key")
                    }
                  )
                ] }))
              ] })
            ] }, provider);
          })
        ] })
      ] }) })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { id: "dsh-hsp-panel-security", role: "tabpanel", "aria-labelledby": "dsh-hsp-tab-security", hidden: activeTab !== "security", className: PREFIX + "tabpanel", children: [
      draft !== null && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_jsx_runtime2.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { className: PREFIX + "cardtitle", children: t("\u5B89\u5168") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "label", children: t("\u5BA1\u8BA1\u65E5\u5FD7") }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "control", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
              "select",
              {
                className: PREFIX + "select",
                "aria-label": t("\u5BA1\u8BA1\u65E5\u5FD7"),
                value: auditDraft === null ? "" : String(auditDraft),
                onChange: (event) => {
                  setAuditDraft(event.target.value === "" ? null : event.target.value === "true");
                  setNotice(null);
                  setSaveError(null);
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "", children: t("\u7EE7\u627F\u542F\u52A8\u73AF\u5883") }),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "true", children: t("\u5F00\u542F\u5BA1\u8BA1\u65E5\u5FD7") }),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "false", children: t("\u5173\u95ED\u5BA1\u8BA1\u65E5\u5FD7") })
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "hint", children: t("\u670D\u52A1\u7AEF\u90E8\u7F72\u7EA7\u5F00\u5173\uFF0C\u91CD\u542F\u670D\u52A1\u540E\u751F\u6548\uFF1B\u4E5F\u53EF\u6309 bank \u5728 Control Plane \u4E2D\u5355\u72EC\u8986\u76D6\u3002") })
          ] })
        ] })
      ] }) }),
      data && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "cardhead", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("h3", { className: PREFIX + "cardtitle", children: [
            t("\u8BB0\u5FC6\u5E93"),
            " ",
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: PREFIX + "muted", children: [
              "(",
              banks.length,
              ")"
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "badge", children: t("\u5F00\u5173\u5373\u65F6\u5199\u5165") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { className: PREFIX + "input", type: "search", "aria-label": t("\u641C\u7D22\u8BB0\u5FC6\u5E93"), placeholder: t("\u6309\u540D\u79F0\u6216 ID \u641C\u7D22\u8BB0\u5FC6\u5E93"), value: bankSearch, onChange: (event) => setBankSearch(event.target.value) }),
        data.banksError ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: PREFIX + "errbanner", role: "alert", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
          t("\u65E0\u6CD5\u8BFB\u53D6\u8BB0\u5FC6\u5E93\u5217\u8868\uFF1A"),
          data.banksError
        ] }) }) : banks.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: PREFIX + "muted", children: t("\u6CA1\u6709\u8BFB\u5230\u8BB0\u5FC6\u5E93\u3002") }) : visibleBanks.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: PREFIX + "muted", children: t("\u6CA1\u6709\u5339\u914D\u7684\u8BB0\u5FC6\u5E93\u3002") }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ul", { className: PREFIX + "list", children: visibleBanks.map((bank) => {
          const state = defense[bank.id] ?? { loading: true, enabled: false };
          return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { className: PREFIX + "item", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "bankmeta", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "banktitle", children: bank.name || bank.id }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "mono " + PREFIX + "muted", children: bank.id })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "count", children: typeof bank.facts === "number" ? tf("{0} \u6761\u4E8B\u5B9E", [bank.facts]) : t("\u4E8B\u5B9E\u6570\u672A\u77E5") }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "badge", children: state.loading ? t("\u5904\u7406\u4E2D\u2026") : state.unknown ? t("\u7B56\u7565\u672A\u77E5") : state.enabled ? t("\u8131\u654F\u5DF2\u5F00\u542F") : t("\u6807\u51C6\u8131\u654F\u672A\u5F00\u542F") }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: PREFIX + "check", style: { flex: "0 0 auto" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "input",
                {
                  type: "checkbox",
                  "aria-label": tf("{0} \u8131\u654F", [bank.name || bank.id]),
                  disabled: state.loading === true || state.unknown === true || api?.up !== true || status.error !== null,
                  checked: state.enabled === true,
                  onChange: (event) => toggleDefense(bank.id, event.target.checked)
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "muted", style: { fontSize: "12px" }, children: t("\u8131\u654F") })
            ] }),
            state.error && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "bankerror", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "err", role: "alert", children: state.error }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: PREFIX + "btn", disabled: state.loading === true, onClick: () => readDefense(bank.id), children: t("\u91CD\u8BFB\u7B56\u7565") })
            ] })
          ] }, bank.id);
        }) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "hint", children: t("\u300C\u8131\u654F\u300D\u7BA1\u7406 sensitive_data \u2192 redact \u6807\u51C6\u89C4\u5219\uFF0C\u4FDD\u7559\u5176\u5B83\u66F4\u5F3A\u6216\u81EA\u5B9A\u4E49\u7B56\u7565\u3002\u5F00\u5173\u76F4\u63A5\u5199\u5165\u5F53\u524D\u8BB0\u5FC6\u5E93\uFF0C\u4E0D\u9700\u8981\u70B9\u51FB\u4E0B\u65B9\u4FDD\u5B58\u3002") })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { id: "dsh-hsp-panel-advanced", role: "tabpanel", "aria-labelledby": "dsh-hsp-tab-advanced", hidden: activeTab !== "advanced", className: PREFIX + "tabpanel", children: [
      draft !== null && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("details", { className: PREFIX + "details", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("summary", { children: t("\u5176\u4ED6\u63D2\u4EF6\u9009\u9879") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "control", style: { marginTop: "10px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: PREFIX + "check", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { type: "checkbox", checked: draft.autoUpdate === true, onChange: (event) => set("autoUpdate", event.target.checked) }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: t("\u81EA\u52A8\u66F4\u65B0\uFF08autoUpdate\uFF09") })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: PREFIX + "check", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { type: "checkbox", checked: draft.codebaseSurvey === true, onChange: (event) => set("codebaseSurvey", event.target.checked) }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: t("\u4EE3\u7801\u5E93\u52D8\u5BDF\uFF08codebaseSurvey\uFF09") })
          ] })
        ] })
      ] }),
      extraKeys.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("details", { className: PREFIX + "details", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("summary", { children: tf("\u914D\u7F6E\u6587\u4EF6\u91CC\u8FD8\u6709 {0} \u4E2A\u672C\u9875\u4E0D\u6539\u5199\u7684\u952E\uFF08\u4FDD\u5B58\u65F6\u4F1A\u539F\u6837\u4FDD\u7559\uFF09", [extraKeys.length]) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: PREFIX + "mono", style: { marginTop: "8px" }, children: extraKeys.join("\u3001") })
      ] })
    ] }),
    data?.management?.protocolVersion === 1 && api?.url && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      ManagementPanel,
      {
        category: activeTab,
        apiUrl: api.url,
        banks: data.banks ?? [],
        request: managementRequest,
        upload: managementUpload,
        download: managementDownload,
        onChanged: load
      }
    ),
    draft !== null && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: PREFIX + "savebar", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: PREFIX + "savestate", role: "status", children: saving ? t("\u6B63\u5728\u4FDD\u5B58\u5168\u90E8\u5206\u7C7B\u7684\u66F4\u6539\u2026") : dirty ? t("\u6709\u672A\u4FDD\u5B58\u7684\u66F4\u6539\uFF08\u8DE8\u5206\u7C7B\u4FDD\u7559\uFF09") : t("\u5F53\u524D\u8868\u5355\u4E0E\u5DF2\u4FDD\u5B58\u8BBE\u7F6E\u4E00\u81F4") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: PREFIX + "btn " + PREFIX + "btnprimary", disabled: !dirty || saving, onClick: save, children: saving ? t("\u4FDD\u5B58\u4E2D\u2026") : t("\u4FDD\u5B58") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: PREFIX + "btn", disabled: !dirty || saving, onClick: discard, children: t("\u653E\u5F03\u66F4\u6539") }),
      notice && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: PREFIX + "notice", role: "status", style: { flexBasis: "100%" }, children: notice }),
      saveError && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: PREFIX + "err", role: "alert", style: { flexBasis: "100%" }, children: [
        t("\u4FDD\u5B58\u5931\u8D25\uFF1A"),
        saveError
      ] })
    ] })
  ] });
}
var name = "hindsight-gui";
var inject = ["slots"];
function apply(ctx) {
  ensureStyles();
  ctx.slots.inject("main", () => ctx.slots.register({
    name: "main",
    key: PANEL_ID
  }, PanelPage));
  ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({
    name: "sidebar.panellist",
    id: PANEL_ID,
    order: 40,
    label: "Hindsight"
  }, PanelIcon));
}

		return module.exports;
	}
});
