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
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
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
function isMigrationWarning(warning) {
  return typeof warning === "string" && /重建|迁移|重新索引|re-?index|rebuild|migrat/i.test(warning) && /向量|索引|维度|模型|vector|embedding|index|dimension|model/i.test(warning);
}
var CSS = [
  /* ---- shell: fluid, no fixed width ------------------------------------- */
  "." + PREFIX + "root{box-sizing:border-box;height:100%;min-height:0;overflow:auto;",
  "display:flex;flex-direction:column;gap:14px;padding:18px 22px 44px;width:100%;isolation:isolate;",
  "color:var(--dsw-alias-label-primary,#1a1a1a);font-size:13px;line-height:20px;color-scheme:light dark;}",
  "." + PREFIX + "head{display:flex;flex-direction:column;gap:4px;}",
  "." + PREFIX + "h{margin:0;font-size:18px;line-height:26px;font-weight:650;}",
  "." + PREFIX + "sub{margin:0;color:var(--dsw-alias-label-tertiary,#8a8a8a);font-size:12.5px;}",
  /* ---- cards ------------------------------------------------------------ */
  "." + PREFIX + "card{border:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));",
  "border-radius:12px;padding:15px 18px;display:flex;flex-direction:column;gap:12px;",
  "background:var(--dsw-alias-bg-layer-1,transparent);min-width:0;}",
  "." + PREFIX + "cardhead{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;}",
  "." + PREFIX + "cardtitle{margin:0;font-size:13.5px;font-weight:650;}",
  /* ---- fields: two-column grid that collapses on narrow panels ---------- */
  "." + PREFIX + "field{display:grid;grid-template-columns:128px minmax(0,1fr);gap:6px 12px;align-items:start;}",
  "@media (max-width:680px){." + PREFIX + "field{grid-template-columns:minmax(0,1fr);}}",
  "." + PREFIX + "label{padding-top:5px;color:var(--dsw-alias-label-secondary,#555);}",
  "." + PREFIX + "control{min-width:0;display:flex;flex-direction:column;gap:6px;}",
  "." + PREFIX + "hint{color:var(--dsw-alias-label-tertiary,#8a8a8a);font-size:12px;}",
  /* ---- inputs ----------------------------------------------------------- */
  "." + PREFIX + "input,." + PREFIX + "select{box-sizing:border-box;width:100%;height:30px;padding:0 9px;",
  "border-radius:8px;border:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.18));",
  "background-color:var(--dsw-alias-bg-layer-1,var(--dsw-alias-bg-base,#fff));color:var(--dsw-alias-label-primary,inherit);",
  "font:inherit;font-size:13px;color-scheme:light dark;}",
  "." + PREFIX + "select option,." + PREFIX + "select optgroup{background-color:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#1a1a1a);}",
  "." + PREFIX + "input:focus,." + PREFIX + "select:focus{outline:2px solid var(--dsw-alias-brand-primary,#3b82f6);outline-offset:1px;}",
  "." + PREFIX + "check{display:flex;align-items:flex-start;gap:8px;cursor:pointer;}",
  "." + PREFIX + "check input{margin-top:3px;accent-color:var(--dsw-alias-brand-primary,#3b82f6);}",
  /* ---- buttons ---------------------------------------------------------- */
  "." + PREFIX + "btn{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 14px;",
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
  "." + PREFIX + "item{display:flex;align-items:center;gap:12px;padding:7px 0;min-width:0;",
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
  "@media (prefers-color-scheme:dark){",
  " ." + PREFIX + "root{color-scheme:dark;}",
  " ." + PREFIX + "tabs{background:var(--dsw-alias-bg-layer-1,var(--dsw-alias-bg-base,#212123));border-color:var(--dsw-alias-border-l3,rgba(255,255,255,.12));}",
  " ." + PREFIX + "input,." + PREFIX + "select{color-scheme:dark;background-color:var(--dsw-alias-bg-layer-2,#212123);color:var(--dsw-alias-label-primary,#f9fafb);border-color:var(--dsw-alias-border-l3,rgba(255,255,255,.18));}",
  " ." + PREFIX + "select option,." + PREFIX + "select optgroup{background-color:var(--dsw-alias-bg-layer-2,#212123);color:var(--dsw-alias-label-primary,#f9fafb);}",
  " ." + PREFIX + "card{border-color:var(--dsw-alias-border-l3,rgba(255,255,255,.12));background-color:var(--dsw-alias-bg-layer-1,rgba(255,255,255,.02));}",
  " ." + PREFIX + "btn{border-color:var(--dsw-alias-border-l3,rgba(255,255,255,.14));background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06));}",
  " ." + PREFIX + "ok{color:#4ade80;background:rgba(74,222,128,.10);border-color:rgba(74,222,128,.3);}",
  " ." + PREFIX + "bad{color:#fca5a5;background:rgba(248,113,113,.10);border-color:rgba(248,113,113,.3);}",
  " ." + PREFIX + "warn{color:#fbbf24;background:rgba(251,191,36,.10);border-color:rgba(251,191,36,.3);}",
  " ." + PREFIX + "banner{color:#fbbf24;background:rgba(251,191,36,.08);border-color:rgba(251,191,36,.3);}",
  " ." + PREFIX + "errbanner{color:#f87171;background:rgba(220,38,38,.14);border-color:rgba(220,38,38,.4);}",
  "}"
].join("");
function ensureStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-plugin-css="' + PANEL_ID + '"]') !== null) return;
  const tag = document.createElement("style");
  tag.dataset.plugin = PANEL_ID;
  tag.dataset.pluginCss = PANEL_ID;
  tag.textContent = CSS;
  document.head.appendChild(tag);
}
function PanelIcon(props) {
  const size = typeof props.size === "number" ? props.size : 18;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
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
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 5v14" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 8.5A3 3 0 0 0 6.5 9.8 3 3 0 0 0 7 15.4 2.6 2.6 0 0 0 12 17" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 8.5A3 3 0 0 1 17.5 9.8 3 3 0 0 1 17 15.4 2.6 2.6 0 0 1 12 17" })
      ]
    }
  );
}
function Pill(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: PREFIX + "pill " + PREFIX + (props.tone ?? "bad"), children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "dot" }),
    props.children
  ] });
}
function Row(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "row", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "key", children: props.label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "val", children: props.children })
  ] });
}
function ModelSelectField(props) {
  const { label, hint, value, defaultValue = "", onChange, providers } = props;
  const allKnownRoutes = (0, import_react.useMemo)(() => {
    const set = /* @__PURE__ */ new Set();
    for (const p of providers) {
      if (!Array.isArray(p.models)) continue;
      for (const m of p.models) {
        set.add(`${p.id}/${m.id}`);
        set.add(m.id);
      }
    }
    return set;
  }, [providers]);
  const [customMode, setCustomMode] = (0, import_react.useState)(false);
  const isCustom = customMode || value !== "" && !allKnownRoutes.has(value);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "field", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "label", children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "control", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: "8px", alignItems: "center" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "select",
          {
            className: PREFIX + "select",
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
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "", children: defaultValue ? `\u9ED8\u8BA4 (${defaultValue})` : "\u672A\u6307\u5B9A\uFF08\u8DDF\u968F\u7CFB\u7EDF\u9ED8\u8BA4\uFF09" }),
              providers.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("optgroup", { label: p.name || p.id, children: (p.models || []).map((m) => {
                const routeKey = `${p.id}/${m.id}`;
                return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", { value: routeKey, children: [
                  m.name || m.id,
                  " (",
                  p.id,
                  "/",
                  m.id,
                  ")"
                ] }, routeKey);
              }) }, p.id)),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "__custom__", children: "\u81EA\u5B9A\u4E49\u8F93\u5165..." })
            ]
          }
        ),
        isCustom && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            type: "button",
            className: PREFIX + "btn",
            style: { padding: "0 8px", fontSize: "12px" },
            onClick: () => {
              setCustomMode(false);
              onChange("");
            },
            title: "\u5207\u6362\u56DE\u9009\u62E9\u5217\u8868",
            children: "\u5217\u8868"
          }
        )
      ] }),
      isCustom && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "input",
        {
          className: PREFIX + "input",
          type: "text",
          value,
          placeholder: "\u4F8B\u5982 deepseek-flash \u6216 provider/model",
          onChange: (e) => onChange(e.target.value)
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "hint", children: hint })
    ] })
  ] });
}
function PanelPage() {
  const [status, setStatus] = (0, import_react.useState)({ loading: true, data: null, error: null });
  const [draft, setDraft] = (0, import_react.useState)(null);
  const [cpDraft, setCpDraft] = (0, import_react.useState)(null);
  const [serverModelsDraft, setServerModelsDraft] = (0, import_react.useState)({});
  const [auditDraft, setAuditDraft] = (0, import_react.useState)(null);
  const [autoStartDraft, setAutoStartDraft] = (0, import_react.useState)(false);
  const [serverCommandDraft, setServerCommandDraft] = (0, import_react.useState)("");
  const [overridesDraft, setOverridesDraft] = (0, import_react.useState)({});
  const [embeddingsDraft, setEmbeddingsDraft] = (0, import_react.useState)({ ...EMPTY_EMBEDDINGS, apiKey: "", clearApiKey: false });
  const embeddingsCacheRef = (0, import_react.useRef)({});
  const [activeTab, setActiveTab] = (0, import_react.useState)("overview");
  const [chatExpanded, setChatExpanded] = (0, import_react.useState)(true);
  const [overridesExpanded, setOverridesExpanded] = (0, import_react.useState)(false);
  const tabRefs = (0, import_react.useRef)({});
  const [modelsState, setModelsState] = (0, import_react.useState)({ loading: false, providers: [], errors: [], state: null, sampledAt: null, error: null });
  const [saving, setSaving] = (0, import_react.useState)(false);
  const [notice, setNotice] = (0, import_react.useState)(null);
  const [saveError, setSaveError] = (0, import_react.useState)(null);
  const [serverBusy, setServerBusy] = (0, import_react.useState)(null);
  const [serverMessage, setServerMessage] = (0, import_react.useState)(null);
  const [serverError, setServerError] = (0, import_react.useState)(null);
  const [defense, setDefense] = (0, import_react.useState)({});
  const baselineRef = (0, import_react.useRef)(null);
  const [, setBaselineEpoch] = (0, import_react.useState)(0);
  const dirtyRef = (0, import_react.useRef)(false);
  const defenseRef = (0, import_react.useRef)({});
  const apiBaseRef = (0, import_react.useRef)(null);
  const defenseGenRef = (0, import_react.useRef)(0);
  const statusGenRef = (0, import_react.useRef)(0);
  const modelsGenRef = (0, import_react.useRef)(0);
  const mountedRef = (0, import_react.useRef)(true);
  const autoStartCooldownRef = (0, import_react.useRef)(0);
  const autoStartFailuresRef = (0, import_react.useRef)(0);
  const AUTO_START_MAX_FAILURES = 2;
  const load = (0, import_react.useCallback)(() => {
    const generation = ++statusGenRef.current;
    setStatus((previous) => ({ ...previous, loading: true, error: null }));
    fetch(STATUS_URL, { headers: { accept: "application/json" } }).then((response) => {
      if (!response.ok) throw new Error("HTTP " + String(response.status));
      return response.json();
    }).then((data2) => {
      if (!mountedRef.current || generation !== statusGenRef.current) return;
      setStatus({ loading: false, data: data2, error: null });
    }).catch((error) => {
      if (!mountedRef.current || generation !== statusGenRef.current) return;
      setStatus((previous) => ({ loading: false, data: previous.data, error: String(error?.message ?? error) }));
    });
  }, []);
  const loadModels = (0, import_react.useCallback)(() => {
    const generation = ++modelsGenRef.current;
    setModelsState((prev) => ({ ...prev, loading: true, error: null }));
    fetch(MODELS_URL, { headers: { accept: "application/json" } }).then((res) => {
      if (!res.ok) throw new Error("HTTP " + String(res.status));
      return res.json();
    }).then((data2) => {
      if (!mountedRef.current || generation !== modelsGenRef.current) return;
      setModelsState({
        loading: false,
        providers: Array.isArray(data2?.providers) ? data2.providers : [],
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
  (0, import_react.useEffect)(() => {
    load();
  }, [load]);
  (0, import_react.useEffect)(() => {
    loadModels();
  }, [loadModels]);
  (0, import_react.useEffect)(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  (0, import_react.useEffect)(() => {
    const timer = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      load();
    }, 15e3);
    return () => clearInterval(timer);
  }, [load]);
  const toOverrideDraft = (0, import_react.useCallback)((entry) => ({
    baseUrl: typeof entry?.baseUrl === "string" ? entry.baseUrl : "",
    apiKeyEnv: typeof entry?.apiKeyEnv === "string" ? entry.apiKeyEnv : "",
    apiKey: "",
    clearApiKey: false,
    // Display-only mirror of the host flag; it is never sent back.
    secretConfigured: entry?.secretConfigured === true
  }), []);
  const toEmbeddingsDraft = (0, import_react.useCallback)((entry) => ({
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
  const snapshotBaseline = (0, import_react.useCallback)((data2) => {
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
      providerOverrides: overrides,
      serverEmbeddings: toEmbeddingsDraft(data2?.gui?.serverEmbeddings ?? EMPTY_EMBEDDINGS),
      configRevision: data2?.config?.revision ?? null,
      guiRevision: data2?.gui?.revision ?? null
    };
    setBaselineEpoch((epoch) => epoch + 1);
  }, [toOverrideDraft, toEmbeddingsDraft]);
  const resetDrafts = (0, import_react.useCallback)((data2) => {
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
  const liveRef = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    dirtyRef.current = dirty;
    liveRef.current = { draft, cpDraft, serverModelsDraft, auditDraft, autoStartDraft, serverCommandDraft, overridesDraft, embeddingsDraft };
  });
  (0, import_react.useEffect)(() => {
    const data2 = status.data;
    if (!data2) return;
    if (baselineRef.current !== null && dirtyRef.current) return;
    snapshotBaseline(data2);
    resetDrafts(data2);
  }, [status.data, snapshotBaseline, resetDrafts]);
  const apiBase = status.data?.api?.url ?? null;
  (0, import_react.useEffect)(() => {
    if (apiBaseRef.current === apiBase) return;
    apiBaseRef.current = apiBase;
    defenseGenRef.current += 1;
    setDefense({});
  }, [apiBase]);
  (0, import_react.useEffect)(() => {
    defenseRef.current = defense;
  }, [defense]);
  const banks = status.data && Array.isArray(status.data.banks) ? status.data.banks : [];
  (0, import_react.useEffect)(() => {
    for (const bank of banks) {
      if (defense[bank.id] !== void 0) continue;
      const generation = defenseGenRef.current;
      setDefense((prev) => ({ ...prev, [bank.id]: { loading: true, unknown: false, enabled: false, action: null, error: null } }));
      const query = `bank=${encodeURIComponent(bank.id)}${apiBase ? `&apiUrl=${encodeURIComponent(apiBase)}` : ""}`;
      fetch(`${BANKDEFENSE_URL}?${query}`, { headers: { accept: "application/json" } }).then(async (res) => {
        const payload = await res.json().catch(() => null);
        if (!res.ok) throw new Error(payload?.error ?? "HTTP " + String(res.status));
        if (payload === null) throw new Error("\u9632\u62A4\u7B56\u7565\u54CD\u5E94\u683C\u5F0F\u65E0\u6548");
        return payload;
      }).then((data2) => {
        if (!mountedRef.current || generation !== defenseGenRef.current) return;
        setDefense((prev) => ({
          ...prev,
          [bank.id]: {
            loading: false,
            unknown: false,
            enabled: data2?.memoryDefense?.enabled === true && hasSimpleRedactRule(data2?.memoryDefense?.rules),
            action: null,
            error: null
          }
        }));
      }).catch((err) => {
        if (!mountedRef.current || generation !== defenseGenRef.current) return;
        setDefense((prev) => ({ ...prev, [bank.id]: { loading: false, unknown: true, enabled: false, action: null, error: String(err?.message ?? err) } }));
      });
    }
  }, [banks.map((b) => b.id).join("|"), defense]);
  (0, import_react.useEffect)(() => {
    const data2 = status.data;
    const gui = data2?.gui;
    const api2 = data2?.api;
    const srv = data2?.server;
    if (!data2 || status.error !== null) return;
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
    fetch(SERVER_START_URL, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: "{}"
    }).then(async (res) => {
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.error ?? `HTTP ${res.status}`);
      return payload;
    }).then((payload) => {
      if (!mountedRef.current) return;
      autoStartFailuresRef.current = 0;
      setStatus({ loading: false, data: payload.status, error: null });
      setServerError(null);
      setServerMessage(payload.alreadyRunning === true ? "\u670D\u52A1\u5DF2\u5728\u8FD0\u884C\u3002" : "\u5DF2\u81EA\u52A8\u542F\u52A8 Hindsight \u670D\u52A1\u3002");
    }).catch((error) => {
      if (!mountedRef.current) return;
      autoStartFailuresRef.current += 1;
      const stopped = autoStartFailuresRef.current >= AUTO_START_MAX_FAILURES;
      setServerError(
        "\u81EA\u52A8\u542F\u52A8\u5931\u8D25\uFF1A" + String(error?.message ?? error) + (stopped ? " \u5DF2\u505C\u6B62\u81EA\u52A8\u91CD\u8BD5\uFF0C\u8BF7\u5904\u7406\u95EE\u9898\u540E\u624B\u52A8\u542F\u52A8\u3002" : " \u7A0D\u540E\u5C06\u81EA\u52A8\u91CD\u8BD5\u3002")
      );
    }).finally(() => {
      if (mountedRef.current) setServerBusy(null);
    });
  }, [status.data, status.error, serverBusy]);
  const set = (0, import_react.useCallback)((key, value) => {
    setDraft((previous) => previous === null ? previous : { ...previous, [key]: value });
    setNotice(null);
    setSaveError(null);
  }, []);
  const setCp = (0, import_react.useCallback)((value) => {
    setCpDraft(value);
    setNotice(null);
    setSaveError(null);
  }, []);
  const setServerModel = (0, import_react.useCallback)((scope, val) => {
    setServerModelsDraft((prev) => ({ ...prev, [scope]: val }));
    setNotice(null);
    setSaveError(null);
  }, []);
  const setOverride = (0, import_react.useCallback)((provider, field, value) => {
    setOverridesDraft((prev) => {
      const current = { ...prev[provider] ?? { baseUrl: "", apiKeyEnv: "", apiKey: "", clearApiKey: false } };
      if (field === "apiKey") {
        current.apiKey = value;
        if (value !== "") current.clearApiKey = false;
      } else if (field === "clearApiKey") {
        current.clearApiKey = value === true;
        if (value === true) current.apiKey = "";
      } else {
        current[field] = value;
      }
      return { ...prev, [provider]: current };
    });
    setNotice(null);
    setSaveError(null);
  }, []);
  const setEmbeddings = (0, import_react.useCallback)((field, value) => {
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
  const save = (0, import_react.useCallback)(() => {
    if (!draft) return Promise.resolve(false);
    const base = baselineRef.current;
    const submitted = { ...liveRef.current, embeddingsCache: embeddingsCacheRef.current };
    setSaving(true);
    setNotice(null);
    setSaveError(null);
    const payloadBody = { ...draft };
    if (cpDraft !== null) payloadBody.controlPlaneUrl = cpDraft;
    payloadBody.serverModels = serverModelsDraft;
    if (typeof auditDraft === "boolean") payloadBody.auditLogEnabled = auditDraft;
    payloadBody.autoStart = autoStartDraft;
    payloadBody.serverCommand = serverCommandDraft;
    const overridesPayload = {};
    for (const [provider, entry] of Object.entries(overridesDraft)) {
      const normalized = {
        baseUrl: entry.baseUrl ?? "",
        apiKeyEnv: entry.apiKeyEnv ?? ""
      };
      if (entry.clearApiKey === true) normalized.clearApiKey = true;
      else if ((entry.apiKey ?? "") !== "") normalized.apiKey = entry.apiKey;
      overridesPayload[provider] = normalized;
    }
    payloadBody.providerOverrides = overridesPayload;
    const embBase = base?.serverEmbeddings ?? EMPTY_EMBEDDINGS;
    const embFields = embeddingsDraft.provider === "openai" ? ["model", "baseUrl", "dimensions", "apiKeyEnv"] : embeddingsDraft.provider === "onnx" ? ["model", "dimensions"] : embeddingsDraft.provider === "local" ? ["model", "localForceCpu"] : embeddingsDraft.provider === "tei" ? ["baseUrl"] : [];
    const embChanged = embeddingsDraft.provider !== embBase.provider || embFields.some((field) => String(embeddingsDraft[field] ?? "") !== String(embBase[field] ?? "")) || embeddingsDraft.provider === "openai" && (embeddingsDraft.apiKey !== "" || embeddingsDraft.clearApiKey && embBase.secretConfigured);
    if (inactiveEmbeddingsDirty && !embChanged) {
      setSaving(false);
      setSaveError("\u5176\u5B83\u5411\u91CF Provider \u6709\u672A\u63D0\u4EA4\u7684\u8349\u7A3F\uFF0C\u8BF7\u5207\u56DE\u5BF9\u5E94 Provider \u4FDD\u5B58\uFF0C\u6216\u653E\u5F03\u66F4\u6539\u3002");
      return Promise.resolve(false);
    }
    if (embChanged) {
      const dimensions = embeddingsDraft.dimensions;
      if (embFields.includes("dimensions") && dimensions !== null && dimensions !== "" && (!Number.isSafeInteger(Number(dimensions)) || Number(dimensions) <= 0)) {
        setSaving(false);
        setSaveError("\u5411\u91CF\u7EF4\u5EA6\u5FC5\u987B\u662F\u6B63\u6574\u6570\u6216\u7559\u7A7A\u3002");
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
    return fetch(CONFIG_URL, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(payloadBody)
    }).then(async (response) => {
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const failure = new Error(payload?.error ?? `HTTP ${response.status}`);
        failure.status = response.status;
        throw failure;
      }
      return payload;
    }).then((payload) => {
      if (!mountedRef.current) return false;
      setSaving(false);
      statusGenRef.current += 1;
      setStatus({ loading: false, data: payload, error: null });
      snapshotBaseline(payload);
      const live = liveRef.current ?? {};
      const unchanged = live.draft === submitted.draft && live.cpDraft === submitted.cpDraft && live.serverModelsDraft === submitted.serverModelsDraft && live.auditDraft === submitted.auditDraft && live.autoStartDraft === submitted.autoStartDraft && live.serverCommandDraft === submitted.serverCommandDraft && live.overridesDraft === submitted.overridesDraft && live.embeddingsDraft === submitted.embeddingsDraft && embeddingsCacheRef.current === submitted.embeddingsCache;
      let result;
      if (unchanged) {
        resetDrafts(payload);
        result = "clean";
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
      const saved = Array.isArray(payload?.saved) ? payload.saved.join("\u3001") : "";
      const serverSide = payload?.server?.pendingRestart === true;
      setNotice(saved === "" ? "\u5DF2\u4FDD\u5B58\u3002" : `\u5DF2\u4FDD\u5B58\uFF08${saved}\uFF09\u3002${serverSide ? "\u670D\u52A1\u7AEF\u8BBE\u7F6E\u5C06\u5728\u91CD\u542F\u670D\u52A1\u540E\u751F\u6548\u3002" : "\u4E0B\u4E00\u8F6E\u5BF9\u8BDD\u751F\u6548\u3002"}`);
      return result;
    }).catch((error) => {
      if (!mountedRef.current) return false;
      setSaving(false);
      if (error?.status === 409) {
        setSaveError("\u4FDD\u5B58\u88AB\u62D2\u7EDD\uFF1A\u914D\u7F6E\u5DF2\u5728\u5176\u5B83\u5730\u65B9\u4FEE\u6539\uFF08409 \u51B2\u7A81\uFF09\u3002\u60A8\u7684\u66F4\u6539\u5DF2\u5168\u90E8\u4FDD\u7559\u3002\u6CE8\u610F\uFF1A\u672C\u5730\u57FA\u7EBF\u4ECD\u662F\u65E7\u7248\u672C\uFF0C\u76F4\u63A5\u91CD\u8BD5\u4F1A\u7EE7\u7EED\u51B2\u7A81\u2014\u2014\u8BF7\u5148\u300C\u653E\u5F03\u66F4\u6539\u300D\u8F7D\u5165\u6700\u65B0\u57FA\u7EBF\uFF08\u5F53\u524D\u7F16\u8F91\u5C06\u88AB\u4E22\u5F03\uFF09\uFF0C\u4E4B\u540E\u518D\u91CD\u65B0\u7F16\u8F91\u4FDD\u5B58\u3002");
      } else {
        setSaveError(String(error?.message ?? error));
      }
      return false;
    });
  }, [draft, cpDraft, serverModelsDraft, auditDraft, autoStartDraft, serverCommandDraft, overridesDraft, embeddingsDraft, inactiveEmbeddingsDirty, snapshotBaseline, resetDrafts, toOverrideDraft, toEmbeddingsDraft]);
  const discard = (0, import_react.useCallback)(() => {
    const data2 = status.data;
    if (!data2) return;
    snapshotBaseline(data2);
    resetDrafts(data2);
    setNotice(null);
    setSaveError(null);
  }, [status.data, snapshotBaseline, resetDrafts]);
  const serverAction = (0, import_react.useCallback)((action) => {
    const run = () => {
      setServerBusy(action);
      setServerMessage(null);
      setServerError(null);
      fetch(action === "restart" ? SERVER_RESTART_URL : SERVER_START_URL, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: "{}"
      }).then(async (res) => {
        const payload = await res.json().catch(() => null);
        if (!res.ok) throw new Error(payload?.error ?? `HTTP ${res.status}`);
        return payload;
      }).then((payload) => {
        if (!mountedRef.current) return;
        autoStartFailuresRef.current = 0;
        statusGenRef.current += 1;
        setStatus({ loading: false, data: payload.status, error: null });
        setServerMessage(action === "restart" ? "\u5DF2\u6309\u5F53\u524D\u8BBE\u7F6E\u91CD\u542F\u670D\u52A1\u3002" : payload.alreadyRunning === true ? "\u670D\u52A1\u5DF2\u5728\u8FD0\u884C\u3002" : "\u670D\u52A1\u5DF2\u542F\u52A8\u3002");
      }).catch((error) => {
        if (!mountedRef.current) return;
        setServerError((action === "restart" ? "\u91CD\u542F\u5931\u8D25\uFF1A" : "\u542F\u52A8\u5931\u8D25\uFF1A") + String(error?.message ?? error));
        load();
      }).finally(() => {
        if (mountedRef.current) setServerBusy(null);
      });
    };
    if (dirtyRef.current) {
      setServerMessage("\u68C0\u6D4B\u5230\u672A\u4FDD\u5B58\u7684\u66F4\u6539\uFF0C\u6B63\u5728\u5148\u4FDD\u5B58\u2026");
      save().then((result) => {
        if (!mountedRef.current) return;
        if (result === "clean") run();
        else if (result === "edited") setServerError("\u64CD\u4F5C\u672A\u6267\u884C\uFF1A\u4FDD\u5B58\u671F\u95F4\u53C8\u51FA\u73B0\u4E86\u65B0\u7684\u672A\u4FDD\u5B58\u66F4\u6539\uFF0C\u8BF7\u786E\u8BA4\u4FDD\u5B58\u6216\u653E\u5F03\u540E\u518D\u6267\u884C\u3002");
        else setServerError("\u64CD\u4F5C\u672A\u6267\u884C\uFF1A\u8BF7\u5148\u89E3\u51B3\u4FDD\u5B58\u5931\u8D25\u7684\u95EE\u9898\u3002");
      });
      return;
    }
    run();
  }, [load, save]);
  const toggleDefense = (0, import_react.useCallback)((bankId, enabled) => {
    const previous = defenseRef.current[bankId] ?? null;
    const generation = defenseGenRef.current;
    setDefense((prev) => ({ ...prev, [bankId]: { ...prev[bankId] ?? { unknown: false, enabled: !enabled }, loading: true, error: null } }));
    fetch(BANKDEFENSE_URL, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ bankId, enabled, apiUrl: apiBaseRef.current ?? "" })
    }).then(async (res) => {
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.error ?? `HTTP ${res.status}`);
      return payload;
    }).then((payload) => {
      if (!mountedRef.current || generation !== defenseGenRef.current) return;
      setDefense((prev) => ({
        ...prev,
        [bankId]: {
          loading: false,
          unknown: false,
          enabled: payload?.memoryDefense?.enabled === true && hasSimpleRedactRule(payload?.memoryDefense?.rules),
          action: null,
          error: null
        }
      }));
    }).catch((error) => {
      if (!mountedRef.current || generation !== defenseGenRef.current) return;
      const message = String(error?.message ?? error);
      setDefense((prev) => ({
        ...prev,
        [bankId]: previous ? { ...previous, loading: false, error: message } : { loading: false, unknown: true, enabled: false, action: null, error: message }
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
  const canStartNow = legacyHost ? api?.up !== true : server?.canStart === true;
  const canRestartNow = legacyHost ? false : server?.canRestart === true;
  const operationInFlight = serverBusy !== null || server !== null && server.operation != null;
  const overrideProviders = (0, import_react.useMemo)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "root", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { className: PREFIX + "h", children: "Hindsight" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: PREFIX + "sub", children: "\u8BB0\u5FC6\u8BBE\u7F6E\u4E0B\u4E00\u8F6E\u5BF9\u8BDD\u751F\u6548\uFF1B\u670D\u52A1\u7AEF\u8BBE\u7F6E\u4EC5\u5728\u4E0B\u6B21\u542F\u52A8/\u91CD\u542F\u65F6\u5E94\u7528\uFF0C\u4E0D\u4F1A\u81EA\u52A8\u91CD\u542F\u3002" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, { tone: api?.up === true ? "ok" : api?.state === "unknown" ? "warn" : "bad", children: [
          "API ",
          api?.up === true ? "\u8FD0\u884C\u4E2D" : api?.state === "unknown" ? "\u72B6\u6001\u672A\u77E5" : "\u672A\u8FD0\u884C"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, { tone: cp?.up === true ? "ok" : "warn", children: [
          "\u63A7\u5236\u53F0 ",
          cp?.up === true ? "\u53EF\u7528" : "\u4E0D\u53EF\u7528"
        ] }),
        server?.pendingRestart === true && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, { tone: "warn", children: "\u5F85\u4E0B\u6B21\u542F\u52A8\u5E94\u7528" }),
        dirty && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "muted", children: "\u6709\u672A\u4FDD\u5B58\u7684\u66F4\u6539\uFF08\u8DE8\u5206\u7C7B\u4FDD\u7559\uFF09" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: PREFIX + "tabs", role: "tablist", "aria-label": "Hindsight \u8BBE\u7F6E\u5206\u7C7B", children: TABS.map((tab, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
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
          tab.label,
          dirty && activeTab !== tab.id ? " \xB7" : ""
        ]
      },
      tab.id
    )) }),
    status.loading && draft === null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: PREFIX + "muted", children: "\u8BFB\u53D6\u4E2D\u2026" }),
    status.error !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, { label: "\u8BFB\u53D6\u5931\u8D25", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "err", children: status.error }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: PREFIX + "actions", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: PREFIX + "btn", onClick: load, children: "\u91CD\u8BD5" }) })
    ] }),
    (config?.error || data?.gui?.error) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: PREFIX + "errbanner", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
      "\u914D\u7F6E\u8BFB\u53D6\u5931\u8D25\uFF1A",
      config?.error ?? data?.gui?.error,
      "\u3002\u4E0D\u4F1A\u8986\u76D6\u635F\u574F\u6216\u4E0D\u53EF\u8BFB\u7684\u6587\u4EF6\uFF0C\u8BF7\u5148\u5728\u672C\u673A\u4FEE\u590D\u3002"
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", { id: "dsh-hsp-panel-overview", role: "tabpanel", "aria-labelledby": "dsh-hsp-tab-overview", hidden: activeTab !== "overview", className: PREFIX + "tabpanel", children: server && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "cardhead", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: PREFIX + "cardtitle", children: "\u670D\u52A1\u7BA1\u7406" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "actions", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: PREFIX + "btn", disabled: operationInFlight || !canStartNow, onClick: () => serverAction("start"), children: server.operation === "start" || serverBusy === "start" ? "\u542F\u52A8\u4E2D\u2026" : "\u542F\u52A8\u670D\u52A1" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: PREFIX + "btn " + PREFIX + "btnprimary", disabled: operationInFlight || !canRestartNow, onClick: () => serverAction("restart"), children: server.operation === "restart" || serverBusy === "restart" ? "\u91CD\u542F\u4E2D\u2026" : "\u91CD\u542F\u670D\u52A1" })
        ] })
      ] }),
      server.ownership !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, { label: "\u5F52\u5C5E", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, { tone: server.ownership === "managed" ? "ok" : "warn", children: server.ownership === "managed" ? "\u6258\u7BA1\uFF08\u672C\u63D2\u4EF6\u542F\u52A8\uFF09" : server.ownership === "unmanaged" ? "\u5916\u90E8\u8FDB\u7A0B" : server.ownership === "stopped" ? "\u672A\u8FD0\u884C" : "\u672A\u77E5" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Row, { label: "API", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, { tone: api?.up === true ? "ok" : api?.state === "unknown" ? "warn" : "bad", children: api?.up === true ? "\u8FD0\u884C\u4E2D" : api?.state === "unknown" ? "\u72B6\u6001\u672A\u77E5" : "\u672A\u8FD0\u884C" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: PREFIX + "muted", children: [
          " ",
          api?.url
        ] }),
        api?.state === "error" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: PREFIX + "err", children: [
          " ",
          api.error
        ] })
      ] }),
      api?.up === true && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Row, { label: "\u6570\u636E\u5E93", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "mono", children: api.database ?? "\u2014" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: PREFIX + "muted", children: [
          " \xB7 ",
          api.status ?? "\u2014"
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Row, { label: "\u63A7\u5236\u53F0", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, { tone: cp?.up === true ? "ok" : "bad", children: cp?.up === true ? "\u8FD0\u884C\u4E2D" : "\u672A\u8FD0\u884C" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: PREFIX + "muted", children: [
          " ",
          cp?.url
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, { label: "\u542F\u52A8\u5165\u53E3", children: server.entry ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: PREFIX + "mono", children: [
        server.entry.command,
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: PREFIX + "muted", children: [
          "\uFF08",
          server.entry.source,
          "\uFF09"
        ] })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "err", children: server.entryReason ?? "\u672A\u627E\u5230" }) }),
      server.lastAction && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, { label: "\u6700\u8FD1\u64CD\u4F5C", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: server.lastAction.ok === true ? PREFIX + "good" : PREFIX + "err", children: [
        server.lastAction.action === "restart" ? "\u91CD\u542F" : "\u542F\u52A8",
        " \xB7 ",
        server.lastAction.detail ?? ""
      ] }) }),
      server.previewError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: PREFIX + "errbanner", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
        "\u542F\u52A8\u914D\u7F6E\u89E3\u6790\u5931\u8D25\uFF1A",
        server.previewError
      ] }) }),
      server.ownershipError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: PREFIX + "errbanner", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
        "\u670D\u52A1\u8EAB\u4EFD\u65E0\u6CD5\u6838\u9A8C\uFF1A",
        server.ownershipError
      ] }) }),
      server.runningConfig && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Row, { label: "\u8FD0\u884C\u4E2D\u914D\u7F6E", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "mono", children: server.runningConfig.fingerprint ?? "\u2014" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: PREFIX + "muted", children: [
          " ",
          "\xB7 \u542F\u52A8\u4E8E ",
          server.runningConfig.startedAt ?? "\u2014",
          server.runningConfig.auditLogEnabled === true ? " \xB7 \u5BA1\u8BA1\u65E5\u5FD7\u5F00" : server.runningConfig.auditLogEnabled === false ? " \xB7 \u5BA1\u8BA1\u65E5\u5FD7\u5173" : ""
        ] })
      ] }),
      api?.up === true && server.runtimeConfigKnown === false && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "hint", children: "\u8FD0\u884C\u4E2D\u670D\u52A1\u7684\u5B9E\u9645\u914D\u7F6E\u65E0\u6CD5\u786E\u8BA4\uFF08\u53EF\u80FD\u7531\u5916\u90E8\u542F\u52A8\uFF09\uFF1B\u300C\u4E0B\u6B21\u542F\u52A8\u5C06\u5E94\u7528\u300D\u4EC5\u53CD\u6620\u672C\u9875\u4FDD\u5B58\u7684\u503C\u3002" }),
      !canRestartNow && !legacyHost && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "hint", children: ownership === "unmanaged" ? "\u7AEF\u53E3\u7531\u5916\u90E8\u8FDB\u7A0B\u5360\u7528\uFF1A\u672C\u63D2\u4EF6\u65E0\u6CD5\u91CD\u542F\u5B83\uFF0C\u53EA\u80FD\u7B49\u5F85\u5176\u9000\u51FA\u540E\u518D\u542F\u52A8\u6258\u7BA1\u5B9E\u4F8B\u3002" : ownership === "stopped" ? "\u670D\u52A1\u672A\u8FD0\u884C\uFF1A\u91CD\u542F\u4E0D\u53EF\u7528\uFF0C\u8BF7\u4F7F\u7528\u300C\u542F\u52A8\u670D\u52A1\u300D\u3002" : "\u670D\u52A1\u5F52\u5C5E\u672A\u77E5\uFF1A\u4E3A\u907F\u514D\u8BEF\u4F24\u5176\u5B83\u8FDB\u7A0B\uFF0C\u91CD\u542F\u4E0D\u53EF\u7528\u3002" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "label", children: "\u81EA\u52A8\u542F\u52A8" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "control", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: PREFIX + "check", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                type: "checkbox",
                checked: autoStartDraft,
                onChange: (event) => setAutoStartDraft(event.target.checked)
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "API \u672A\u8FD0\u884C\u65F6\uFF0C\u6253\u5F00\u672C\u9875\u81EA\u52A8\u62C9\u8D77\u670D\u52A1\uFF08\u4FDD\u5B58\u540E\u751F\u6548\uFF09" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "hint", children: "\u7531\u63D2\u4EF6\u6309\u4E0B\u65B9\u300C\u529F\u80FD\u6A21\u578B\u8C03\u7528\u300D\u7B49\u8BBE\u7F6E\u52A8\u6001\u6784\u5EFA\u73AF\u5883\u5E76\u542F\u52A8\uFF0C\u65E0\u9700\u7CFB\u7EDF\u542F\u52A8\u811A\u672C\u3002" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "label", children: "\u542F\u52A8\u547D\u4EE4\u8986\u76D6" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "control", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              className: PREFIX + "input",
              type: "text",
              value: serverCommandDraft,
              placeholder: "\u7559\u7A7A = \u81EA\u52A8\u53D1\u73B0\uFF08PATH \u2192 uv/pip \u9ED8\u8BA4\u5B89\u88C5\u4F4D\u7F6E\uFF09",
              onChange: (event) => setServerCommandDraft(event.target.value)
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "hint", children: "hindsight-api \u53EF\u6267\u884C\u6587\u4EF6\u7684\u5B8C\u6574\u8DEF\u5F84\uFF1B\u4EC5\u5F53\u81EA\u52A8\u53D1\u73B0\u5931\u8D25\u65F6\u9700\u8981\u586B\u5199\u3002" })
        ] })
      ] }),
      server.pendingRestart === true && api?.up === true && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "banner", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: server.runtimeConfigKnown === true ? "\u670D\u52A1\u7AEF\u8BBE\u7F6E\u5DF2\u4FEE\u6539\uFF0C\u5DF2\u786E\u8BA4\u7684\u542F\u52A8\u914D\u7F6E\u4E0E\u4FDD\u5B58\u503C\u4E0D\u540C\u3002" : "\u670D\u52A1\u7AEF\u8BBE\u7F6E\u5DF2\u4FDD\u5B58\uFF1B\u5F53\u524D\u5B9E\u4F8B\u914D\u7F6E\u672A\u77E5\uFF0C\u65E0\u6CD5\u786E\u8BA4\u662F\u5426\u5DF2\u751F\u6548\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: PREFIX + "btn", disabled: operationInFlight || !canRestartNow, onClick: () => serverAction("restart"), children: "\u7ACB\u5373\u91CD\u542F\u751F\u6548" })
      ] }),
      Array.isArray(server.resolutions) && server.resolutions.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "control", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "hint", children: "\u4E0B\u6B21\u542F\u52A8/\u91CD\u542F\u5C06\u5E94\u7528\uFF1A" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { className: PREFIX + "list", children: server.resolutions.map((res) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { className: PREFIX + "item", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "muted", style: { flex: "0 0 64px" }, children: SERVER_SCOPES.find((s) => s.key === res.scope)?.label ?? res.scope }),
          res.mode === "error" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: PREFIX + "err", style: { minWidth: 0 }, children: [
            res.spec,
            " \u2014 ",
            res.note
          ] }) : res.mode === "default" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "muted", children: res.note }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { minWidth: 0 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "mono", children: res.spec }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: PREFIX + "muted", children: [
              " \xB7 \u51ED\u636E ",
              res.credentialSource,
              res.baseUrl ? ` \xB7 ${res.baseUrl}` : ""
            ] })
          ] })
        ] }, res.scope)) })
      ] }),
      serverError && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "errbanner", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: serverError }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            type: "button",
            className: PREFIX + "btn",
            disabled: serverBusy !== null,
            onClick: () => {
              setServerError(null);
              serverAction("start");
            },
            children: "\u91CD\u8BD5\u542F\u52A8"
          }
        )
      ] }),
      serverMessage && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: PREFIX + "notice", children: serverMessage }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { className: PREFIX + "btn", href: cp ? cp.url : "#", target: "_blank", rel: "noreferrer noopener", children: "\u6253\u5F00 Control Plane" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: PREFIX + "btn", onClick: load, children: "\u5237\u65B0\u72B6\u6001" })
      ] })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", { id: "dsh-hsp-panel-memory", role: "tabpanel", "aria-labelledby": "dsh-hsp-tab-memory", hidden: activeTab !== "memory", className: PREFIX + "tabpanel", children: draft !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: PREFIX + "cardtitle", children: "\u8BB0\u5FC6" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "label", children: "\u542F\u7528" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "control", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: PREFIX + "check", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "input",
                {
                  type: "checkbox",
                  checked: draft.disabled !== true,
                  onChange: (event) => set("disabled", !event.target.checked)
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u5728\u8FD9\u4E2A harness \u4E0A\u542F\u7528\u957F\u671F\u8BB0\u5FC6" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "hint", children: "\u5173\u95ED\u540E\u4E0D\u53EC\u56DE\u3001\u4E0D\u5199\u56DE\u3001\u4E0D\u6CE8\u518C hindsight_* \u5DE5\u5177\uFF08\u5199\u5165 disabled\uFF09\u3002" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "label", children: "\u8BB0\u5FC6\u5E93\u547D\u540D" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "control", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: PREFIX + "check", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "input",
                {
                  type: "radio",
                  name: "bankmode",
                  checked: recordMode === "dynamic",
                  onChange: () => set("dynamicBankId", true)
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                "\u6309\u5DE5\u4F5C\u533A\u52A8\u6001\u547D\u540D ",
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "muted", children: "(harness::\u9879\u76EE\u540D\uFF0C\u4F8B\u5982 coding-agent::DSH)" })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: PREFIX + "check", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "input",
                {
                  type: "radio",
                  name: "bankmode",
                  checked: recordMode === "fixed",
                  onChange: () => set("dynamicBankId", false)
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u56FA\u5B9A\u540D\u5B57" })
            ] }),
            recordMode === "fixed" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                className: PREFIX + "input",
                type: "text",
                value: draft.bankId ?? "",
                placeholder: "my-memory-bank",
                onChange: (event) => set("bankId", event.target.value)
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: PREFIX + "cardtitle", children: "\u8FDE\u63A5" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "label", children: "\u670D\u52A1\u5730\u5740" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "control", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                className: PREFIX + "input",
                type: "text",
                value: draft.apiUrl ?? "",
                placeholder: "http://localhost:8888",
                onChange: (event) => set("apiUrl", event.target.value)
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "hint", children: "Hindsight API \u7684\u5730\u5740\u3002\u542F\u52A8/\u91CD\u542F\u670D\u52A1\u65F6\u6309\u6B64\u7AEF\u53E3\u76D1\u542C\uFF08\u5199\u5165 apiUrl\uFF09\u3002" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "label", children: "\u63A7\u5236\u53F0\u5730\u5740" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "control", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                className: PREFIX + "input",
                type: "text",
                value: cpDraft ?? "",
                placeholder: "http://127.0.0.1:9999",
                onChange: (event) => setCp(event.target.value)
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: PREFIX + "hint", children: [
              "Hindsight Control Plane \u7684\u5730\u5740\uFF08Web \u63A7\u5236\u53F0\uFF09\u3002\u4EC5\u63A5\u53D7 http/https\uFF0C\u4E0D\u542B\u8DEF\u5F84\u53C2\u6570\u3002",
              data?.gui?.source === "env" && " \u5F53\u524D\u53D6\u81EA\u73AF\u5883\u53D8\u91CF HINDSIGHT_CP_URL\uFF0C\u4FDD\u5B58\u540E\u6539\u7531\u672C\u9875\u7BA1\u7406\u3002",
              data?.gui?.source === "default" && " \u5F53\u524D\u4E3A\u9ED8\u8BA4\u503C\uFF0C\u4FDD\u5B58\u540E\u6539\u7531\u672C\u9875\u7BA1\u7406\u3002"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "label", children: "\u65E5\u5FD7\u7EA7\u522B" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "control", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "select",
              {
                className: PREFIX + "select",
                value: draft.logLevel ?? "info",
                onChange: (event) => set("logLevel", event.target.value),
                children: LOG_LEVELS.map((level) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: level, children: level }, level))
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "hint", children: "\u5199\u5165 ~/.hindsight/coding-agents-logs/plugin.log \u7684\u8BE6\u7EC6\u7A0B\u5EA6\u3002" })
          ] })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", { id: "dsh-hsp-panel-models", role: "tabpanel", "aria-labelledby": "dsh-hsp-tab-models", hidden: activeTab !== "models", className: PREFIX + "tabpanel", children: draft !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: PREFIX + "card", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", { className: PREFIX + "fold", open: chatExpanded, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", { onClick: (event) => {
          event.preventDefault();
          setChatExpanded((value) => !value);
        }, children: "\u529F\u80FD\u6A21\u578B\u8C03\u7528" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "foldbody", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "cardhead", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "hint", children: "DSH \u804A\u5929\u6A21\u578B\u8DEF\u7531" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "button",
              {
                type: "button",
                className: PREFIX + "btn",
                style: { height: "24px", padding: "0 8px", fontSize: "11.5px" },
                onClick: loadModels,
                disabled: modelsState.loading,
                children: modelsState.loading ? "\u83B7\u53D6\u6A21\u578B\u4E2D\u2026" : "\u5237\u65B0 DSH \u6A21\u578B"
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "hint", style: { marginTop: "-4px" }, children: "\u4ECE\u5F53\u524D DSH \u73AF\u5883\u5DF2\u6CE8\u518C\u7684 Provider \u53D1\u73B0\u6A21\u578B\uFF0C\u652F\u6301\u4E0B\u62C9\u70B9\u9009\u6216\u624B\u52A8\u6307\u5B9A\uFF1B\u4FDD\u5B58\u540E\u91CD\u542F\u670D\u52A1\u751F\u6548\u3002" }),
          (modelsState.state === "error" || modelsState.state === "unavailable") && !modelsState.loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: PREFIX + "errbanner", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
            "\u65E0\u6CD5\u83B7\u53D6 DSH \u6A21\u578B\u5217\u8868\uFF1A",
            modelsState.error ?? (modelsState.errors.map((entry) => entry.error).join("\uFF1B") || "\u670D\u52A1\u4E0D\u53EF\u7528"),
            modelsState.sampledAt ? `\uFF08\u91C7\u6837\u4E8E ${modelsState.sampledAt}\uFF09` : ""
          ] }) }),
          modelsState.state === "partial" && modelsState.errors.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: PREFIX + "banner", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
            "\u90E8\u5206 Provider \u6A21\u578B\u83B7\u53D6\u5931\u8D25\uFF1A",
            modelsState.errors.map((e) => `${e.provider ?? "\u672A\u77E5 Provider"}\uFF1A${e.error}`).join("\uFF1B"),
            modelsState.sampledAt ? `\uFF08\u91C7\u6837\u4E8E ${modelsState.sampledAt}\uFF09` : ""
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            ModelSelectField,
            {
              label: "\u4EE3\u7801\u5E93\u52D8\u5BDF",
              hint: "\u65B0\u4ED3\u5E93\u6216\u5927\u89C4\u6A21\u66F4\u65B0\u65F6\u8FDB\u884C\u7ED3\u6784\u52D8\u5BDF\uFF08\u5199\u5165 coding-agent.json \u7684 surveyModel\uFF0C\u4E0B\u4E00\u8F6E\u5BF9\u8BDD\u751F\u6548\uFF09\u3002",
              defaultValue: "haiku",
              value: draft.surveyModel ?? "",
              onChange: (val) => set("surveyModel", val),
              providers: modelsState.providers
            }
          ),
          SERVER_SCOPES.map((scope) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            ModelSelectField,
            {
              label: scope.label,
              hint: scope.hint + `\uFF08\u5199\u5165 serverModels.${scope.key}\uFF09`,
              defaultValue: "\u7EE7\u627F\u542F\u52A8\u73AF\u5883/\u540E\u7AEF\u9ED8\u8BA4\uFF0C\u578B\u53F7\u672A\u786E\u8BA4",
              value: serverModelsDraft[scope.key] ?? "",
              onChange: (val) => setServerModel(scope.key, val),
              providers: modelsState.providers
            },
            scope.key
          ))
        ] })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: PREFIX + "cardtitle", children: "\u5411\u91CF\u6A21\u578B" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "hint", children: "\u6B64\u5904\u662F Hindsight \u5411\u91CF\u5316\u4E13\u7528\u6A21\u578B\uFF0C\u4E0D\u5C5E\u4E8E DSH \u804A\u5929\u6A21\u578B\u5217\u8868\u3002\u9884\u89C8\u53CD\u6620\u5DF2\u4FDD\u5B58\u8BBE\u7F6E\u800C\u975E\u5F53\u524D\u8349\u7A3F\uFF1B\u6240\u6709\u4FDD\u5B58\u4EC5\u5F71\u54CD\u4E0B\u6B21\u542F\u52A8\u3002\u672C\u9875\u4E0D\u4F1A\u8FC1\u79FB\u7D22\u5F15\u3001\u4E0B\u8F7D\u6A21\u578B\u6216\u91CD\u542F\u670D\u52A1\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: PREFIX + "banner", children: "\u66F4\u6362\u5411\u91CF\u6A21\u578B\u6216\u7EF4\u5EA6\u53EF\u80FD\u9700\u8981\u91CD\u5EFA/\u8FC1\u79FB\u5DF2\u6709\u5411\u91CF\uFF0C\u64CD\u4F5C\u524D\u8BF7\u81EA\u884C\u6838\u5BF9\u5B58\u91CF\u6570\u636E\u3002" }),
        embeddingPreview ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, { label: "\u5DF2\u4FDD\u5B58\u9884\u89C8", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: embeddingPreview.mode === "error" ? PREFIX + "err" : PREFIX + "mono", children: [
            embeddingPreview.mode === "error" ? "\u914D\u7F6E\u9519\u8BEF" : embeddingPreview.provider ?? "\u672A\u77E5 Provider",
            embeddingPreview.model ? ` \xB7 ${embeddingPreview.model}` : "",
            embeddingPreview.baseUrl ? ` \xB7 ${embeddingPreview.baseUrl}` : "",
            embeddingPreview.dimensions != null ? ` \xB7 ${embeddingPreview.dimensions} \u7EF4` : ""
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Row, { label: "\u914D\u7F6E\u6765\u6E90", children: [
            embeddingPreview.source ?? "\u672A\u77E5",
            " \xB7 ",
            embeddingPreview.mode ?? "\u672A\u77E5",
            " \xB7 \u51ED\u636E\u6765\u6E90 ",
            embeddingPreview.credentialSource ?? "\u672A\u77E5",
            " \xB7 ",
            embeddingPreview.secretConfigured ? "\u4E0B\u6B21\u542F\u52A8\u51ED\u636E\u5DF2\u914D\u7F6E\uFF08\u672A\u9A8C\u8BC1\u6709\u6548\u6027\uFF09" : "\u4E0B\u6B21\u542F\u52A8\u51ED\u636E\u672A\u786E\u8BA4\u914D\u7F6E"
          ] }),
          embeddingPreview.note && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "hint", children: embeddingPreview.note }),
          Array.isArray(embeddingPreview.warnings) && embeddingPreview.warnings.filter((warning) => !isMigrationWarning(warning)).map((warning, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: PREFIX + "banner", children: warning }, i))
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: PREFIX + "banner", children: "\u4E0B\u6B21\u542F\u52A8\u5411\u91CF\u914D\u7F6E\u672A\u77E5\uFF0C\u65E0\u6CD5\u786E\u8BA4\u5DF2\u4FDD\u5B58\u8BBE\u7F6E\u7684\u89E3\u6790\u7ED3\u679C\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, { label: "\u5F53\u524D\u8FD0\u884C", children: runningEmbedding ? `${runningEmbedding.provider ?? "\u672A\u77E5"}${runningEmbedding.model ? ` \xB7 ${runningEmbedding.model}` : ""}\uFF08\u672C\u63D2\u4EF6\u786E\u8BA4\u7684\u542F\u52A8\u5FEB\u7167\uFF09` : "\u672A\u77E5\uFF08\u65E0\u672C\u63D2\u4EF6\u786E\u8BA4\u7684\u542F\u52A8\u5FEB\u7167\uFF1B\u4E0D\u80FD\u63A8\u65AD\u6B63\u5728\u4F7F\u7528\u4E0B\u6B21\u542F\u52A8\u914D\u7F6E\uFF09" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "label", children: "Provider" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "control", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "select",
              {
                className: PREFIX + "select",
                value: embeddingsDraft.provider,
                onChange: (event) => setEmbeddings("provider", event.target.value),
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "", children: "\u7EE7\u627F\u73AF\u5883 / \u65E2\u6709\u670D\u52A1\u914D\u7F6E" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "local", children: "local\uFF08\u672C\u5730\uFF09" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "openai", children: "openai\uFF08\u542B LM Studio / OpenAI \u517C\u5BB9\uFF09" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "onnx", children: "onnx" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "tei", children: "tei\uFF08\u8FDC\u7AEF\u63A8\u7406\u670D\u52A1\uFF09" }),
                  !["", "local", "openai", "onnx", "tei"].includes(embeddingsDraft.provider) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", { value: embeddingsDraft.provider, children: [
                    "\u672A\u77E5 Provider\uFF1A",
                    embeddingsDraft.provider
                  ] })
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "hint", children: "\u7559\u7A7A\u4FDD\u6301\u7EE7\u627F\uFF1B\u4E0D\u4F1A\u81EA\u52A8\u8FC1\u79FB\u65E7 serverEnv\uFF0C\u65E2\u6709\u503C\u4EC5\u5728\u4E0B\u6B21\u542F\u52A8\u9884\u89C8\u4E2D\u663E\u793A\u3002" })
          ] })
        ] }),
        ["local", "openai", "onnx"].includes(embeddingsDraft.provider) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "label", children: embeddingsDraft.provider === "onnx" ? "ONNX \u6A21\u578B ID" : "\u6A21\u578B" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "control", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                className: PREFIX + "input",
                type: "text",
                value: embeddingsDraft.model,
                placeholder: embeddingsDraft.provider === "onnx" ? "ONNX \u6A21\u578B ID" : "\u5411\u91CF\u6A21\u578B\u540D\u79F0",
                onChange: (event) => setEmbeddings("model", event.target.value)
              }
            ),
            embeddingsDraft.provider !== "openai" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "hint", children: "\u672C\u5730\u4F9D\u8D56\u53CA\u6A21\u578B\u9700\u81EA\u884C\u51C6\u5907\uFF1B\u4E0D\u4F1A\u81EA\u52A8\u5B89\u88C5\u6216\u4FE1\u4EFB\u8FDC\u7AEF\u4EE3\u7801\u3002" })
          ] })
        ] }),
        ["openai", "tei"].includes(embeddingsDraft.provider) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "label", children: "Base URL" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "control", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                className: PREFIX + "input",
                type: "text",
                value: embeddingsDraft.baseUrl,
                placeholder: embeddingsDraft.provider === "tei" ? "TEI \u670D\u52A1\u5730\u5740" : "\u517C\u5BB9 OpenAI \u7684 API \u5730\u5740",
                onChange: (event) => setEmbeddings("baseUrl", event.target.value)
              }
            ),
            embeddingsDraft.provider === "tei" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "hint", children: "TEI \u6A21\u578B\u7531\u8FDC\u7AEF\u670D\u52A1\u51B3\u5B9A\uFF0C\u672C\u9875\u4E0D\u53D1\u9001\u6A21\u578B\u5B57\u6BB5\u3002" })
          ] })
        ] }),
        ["openai", "onnx"].includes(embeddingsDraft.provider) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "label", children: "\u7EF4\u5EA6\uFF08\u53EF\u9009\uFF09" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "control", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                className: PREFIX + "input",
                type: "number",
                min: "1",
                step: "1",
                value: embeddingsDraft.dimensions ?? "",
                onChange: (event) => setEmbeddings("dimensions", event.target.value)
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "hint", children: "\u7559\u7A7A\u7EE7\u627F\u65E2\u6709\u7EF4\u5EA6\u914D\u7F6E\uFF0C\u5426\u5219\u7531\u6A21\u578B/\u670D\u52A1\u51B3\u5B9A\uFF1B\u8BBE\u7F6E\u540E\u9700\u6838\u5BF9\u73B0\u6709\u5411\u91CF\u7D22\u5F15\u3002" })
          ] })
        ] }),
        embeddingsDraft.provider === "local" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "label", children: "\u5F3A\u5236 CPU" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: PREFIX + "control", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "select",
            {
              className: PREFIX + "select",
              value: embeddingsDraft.localForceCpu === null ? "" : String(embeddingsDraft.localForceCpu),
              onChange: (event) => setEmbeddings("localForceCpu", event.target.value === "" ? null : event.target.value === "true"),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "", children: "\u9ED8\u8BA4\uFF08\u4E0D\u6307\u5B9A\uFF09" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "true", children: "\u662F" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "false", children: "\u5426" })
              ]
            }
          ) })
        ] }),
        embeddingsDraft.provider === "openai" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "label", children: "Key \u73AF\u5883\u53D8\u91CF" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: PREFIX + "control", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                className: PREFIX + "input",
                type: "text",
                value: embeddingsDraft.apiKeyEnv,
                placeholder: "API Key \u73AF\u5883\u53D8\u91CF\u540D",
                onChange: (event) => setEmbeddings("apiKeyEnv", event.target.value)
              }
            ) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "label", children: "\u66FF\u6362\u5BC6\u94A5" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "control", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "input",
                {
                  className: PREFIX + "input",
                  type: "password",
                  value: embeddingsDraft.apiKey,
                  placeholder: "\u5411\u91CF Key\uFF08\u7559\u7A7A\u4FDD\u7559\u5DF2\u5B58\u503C\uFF09",
                  onChange: (event) => setEmbeddings("apiKey", event.target.value)
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "hint", children: "\u6B64 Hindsight \u7248\u672C\u9700\u8981\u975E\u7A7A Key\uFF1B\u672C\u5730\u514D\u9274\u6743\u7AEF\u70B9\u4E5F\u9700\u7531\u60A8\u660E\u786E\u586B\u5199\u975E\u654F\u611F\u5360\u4F4D\u503C\uFF0C\u6216\u7EE7\u627F\u5DF2\u6709 Key\u3002\u672C\u9875\u4E0D\u4F1A\u81EA\u52A8\u751F\u6210\u3002" }),
              embeddingsDraft.secretConfigured && (embeddingsDraft.clearApiKey ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "hint", children: "\u5C06\u6E05\u9664\u672C\u9875\u5DF2\u4FDD\u5B58 Key\uFF1B\u73AF\u5883\u51ED\u636E\u4ECD\u53EF\u80FD\u88AB\u7EE7\u627F\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "actions", children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "hint", children: "\u5DF2\u914D\u7F6E\u672C\u9875 Key\uFF08\u4E0D\u663E\u793A\u5185\u5BB9\uFF09" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: PREFIX + "btn", onClick: () => setEmbeddings("clearApiKey", true), children: "\u6E05\u9664\u5411\u91CF Key" })
              ] }))
            ] })
          ] })
        ] }),
        embeddingsDraft.provider && !["local", "openai", "onnx", "tei"].includes(embeddingsDraft.provider) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: PREFIX + "errbanner", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u672A\u77E5\u5411\u91CF Provider\uFF1A\u4E0D\u80FD\u63A8\u65AD\u5176\u914D\u7F6E\u6216\u751F\u6548\u72B6\u6001\uFF0C\u8BF7\u5207\u6362\u5230\u53D7\u652F\u6301\u7684\u7C7B\u578B\u3002" }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: PREFIX + "card", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", { className: PREFIX + "fold", open: overridesExpanded, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", { onClick: (event) => {
          event.preventDefault();
          setOverridesExpanded((value) => !value);
        }, children: "Provider \u8986\u76D6" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "foldbody", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "hint", children: "\u4E3A\u975E\u5185\u7F6E Provider \u586B\u5199 openai \u517C\u5BB9\u7AEF\u70B9\u4E0E\u51ED\u636E\uFF1B\u7559\u7A7A\u8868\u793A\u7528\u73AF\u5883\u53D8\u91CF\uFF08<PROVIDER>_API_KEY\uFF09\u6216 DSH \u51ED\u636E\u5E93\u3002" }),
          overrideProviders.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: PREFIX + "muted", children: "\u6682\u65E0\u9700\u8981\u8986\u76D6\u7684 Provider\u3002" }),
          overrideProviders.map((provider) => {
            const entry = overridesDraft[provider] ?? { baseUrl: "", apiKeyEnv: "", apiKey: "", clearApiKey: false };
            const secretConfigured = data?.gui?.providerOverrides?.[provider]?.secretConfigured === true;
            return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "field", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "label mono", children: provider }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "control", children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "input",
                  {
                    className: PREFIX + "input",
                    type: "text",
                    value: entry.baseUrl ?? "",
                    placeholder: "Base URL\uFF08openai \u517C\u5BB9\u7AEF\u70B9\uFF0C\u4F8B\u5982 https://api.example.com/v1\uFF09",
                    onChange: (event) => setOverride(provider, "baseUrl", event.target.value)
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: "8px" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "input",
                    {
                      className: PREFIX + "input",
                      type: "text",
                      value: entry.apiKeyEnv ?? "",
                      placeholder: "API Key \u73AF\u5883\u53D8\u91CF\u540D",
                      onChange: (event) => setOverride(provider, "apiKeyEnv", event.target.value)
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "input",
                    {
                      className: PREFIX + "input",
                      type: "password",
                      value: entry.apiKey ?? "",
                      placeholder: secretConfigured && entry.clearApiKey !== true ? "\u5DF2\u4FDD\u5B58 Key\uFF08\u8F93\u5165\u4EE5\u66FF\u6362\uFF09" : "\u6216\u76F4\u63A5\u586B Key",
                      onChange: (event) => setOverride(provider, "apiKey", event.target.value)
                    }
                  )
                ] }),
                secretConfigured && (entry.clearApiKey === true ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "muted", children: "\u5C06\u6E05\u9664\u5DF2\u4FDD\u5B58\u7684 Key\uFF08\u4FDD\u5B58\u540E\u751F\u6548\uFF09\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "actions", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: PREFIX + "pill " + PREFIX + "ok", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "dot" }),
                    "\u5DF2\u914D\u7F6E Key"
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "button",
                    {
                      type: "button",
                      className: PREFIX + "btn",
                      style: { height: "24px", padding: "0 8px", fontSize: "12px" },
                      onClick: () => setOverride(provider, "clearApiKey", true),
                      children: "\u6E05\u9664\u5DF2\u5B58 Key"
                    }
                  )
                ] }))
              ] })
            ] }, provider);
          })
        ] })
      ] }) })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { id: "dsh-hsp-panel-security", role: "tabpanel", "aria-labelledby": "dsh-hsp-tab-security", hidden: activeTab !== "security", className: PREFIX + "tabpanel", children: [
      draft !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: PREFIX + "cardtitle", children: "\u5B89\u5168" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "label", children: "\u5BA1\u8BA1\u65E5\u5FD7" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "control", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: PREFIX + "check", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "input",
                {
                  type: "checkbox",
                  checked: auditDraft === true,
                  onChange: (event) => setAuditDraft(event.target.checked)
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u8BB0\u5F55\u529F\u80FD\u8C03\u7528\u5BA1\u8BA1\uFF08HINDSIGHT_API_AUDIT_LOG_ENABLED\uFF09" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "hint", children: "\u670D\u52A1\u7AEF\u90E8\u7F72\u7EA7\u5F00\u5173\uFF0C\u91CD\u542F\u670D\u52A1\u540E\u751F\u6548\uFF1B\u4E5F\u53EF\u6309 bank \u5728 Control Plane \u4E2D\u5355\u72EC\u8986\u76D6\u3002" })
          ] })
        ] })
      ] }) }),
      data && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", { className: PREFIX + "cardtitle", children: [
          "\u8BB0\u5FC6\u5E93 ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: PREFIX + "muted", children: [
            "(",
            banks.length,
            ")"
          ] })
        ] }),
        data.banksError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: PREFIX + "errbanner", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
          "\u65E0\u6CD5\u8BFB\u53D6\u8BB0\u5FC6\u5E93\u5217\u8868\uFF1A",
          data.banksError
        ] }) }) : banks.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: PREFIX + "muted", children: "\u6CA1\u6709\u8BFB\u5230\u8BB0\u5FC6\u5E93\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { className: PREFIX + "list", children: banks.map((bank) => {
          const state = defense[bank.id] ?? { loading: true, enabled: false };
          return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { className: PREFIX + "item", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "mono", style: { minWidth: 0 }, children: bank.id }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: PREFIX + "count", children: [
              bank.facts,
              " facts"
            ] }),
            state.unknown === true && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "warn", style: { flex: "1 1 100%", order: 3 }, children: "\u7B56\u7565\u672A\u77E5" }),
            state.error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "err", style: { flex: "1 1 100%", order: 3 }, children: state.error }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: PREFIX + "check", style: { flex: "0 0 auto" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "input",
                {
                  type: "checkbox",
                  disabled: state.loading === true || state.unknown === true || api?.up !== true,
                  checked: state.enabled === true,
                  onChange: (event) => toggleDefense(bank.id, event.target.checked)
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "muted", style: { fontSize: "12px" }, children: "\u8131\u654F" })
            ] })
          ] }, bank.id);
        }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "hint", children: "\u300C\u8131\u654F\u300D\u4E3A\u8BE5\u8BB0\u5FC6\u5E93\u5F00\u542F Memory Defense\uFF08sensitive_data \u2192 redact\uFF09\uFF1A\u5BC6\u94A5\u3001\u4EE4\u724C\u7B49\u654F\u611F\u4E32\u5728\u5165\u5E93\u524D\u88AB\u6253\u7801\u3002" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { id: "dsh-hsp-panel-advanced", role: "tabpanel", "aria-labelledby": "dsh-hsp-tab-advanced", hidden: activeTab !== "advanced", className: PREFIX + "tabpanel", children: [
      draft !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", { className: PREFIX + "details", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", { children: "\u5176\u4ED6\u63D2\u4EF6\u9009\u9879" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "control", style: { marginTop: "10px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: PREFIX + "check", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: draft.autoUpdate === true, onChange: (event) => set("autoUpdate", event.target.checked) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u81EA\u52A8\u66F4\u65B0\uFF08autoUpdate\uFF09" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: PREFIX + "check", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: draft.codebaseSurvey === true, onChange: (event) => set("codebaseSurvey", event.target.checked) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u4EE3\u7801\u5E93\u52D8\u5BDF\uFF08codebaseSurvey\uFF09" })
          ] })
        ] })
      ] }),
      extraKeys.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", { className: PREFIX + "details", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("summary", { children: [
          "\u914D\u7F6E\u6587\u4EF6\u91CC\u8FD8\u6709 ",
          extraKeys.length,
          " \u4E2A\u672C\u9875\u4E0D\u6539\u5199\u7684\u952E\uFF08\u4FDD\u5B58\u65F6\u4F1A\u539F\u6837\u4FDD\u7559\uFF09"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: PREFIX + "mono", style: { marginTop: "8px" }, children: extraKeys.join("\u3001") })
      ] })
    ] }),
    draft !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "savebar", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: PREFIX + "btn " + PREFIX + "btnprimary", disabled: !dirty || saving, onClick: save, children: saving ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: PREFIX + "btn", disabled: !dirty || saving, onClick: discard, children: "\u653E\u5F03\u66F4\u6539" }),
      dirty && !saving && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "muted", children: "\u6709\u672A\u4FDD\u5B58\u7684\u66F4\u6539\uFF08\u6240\u6709\u5206\u7C7B\uFF09" }),
      notice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "notice", children: notice }),
      saveError && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: PREFIX + "err", children: [
        "\u4FDD\u5B58\u5931\u8D25\uFF1A",
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
