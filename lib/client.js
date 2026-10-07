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
var PREFIX = "dsh-hsp-";
var LOG_LEVELS = ["debug", "info", "warn", "error"];
var CSS = [
  "." + PREFIX + "root{box-sizing:border-box;height:100%;min-height:0;overflow:auto;",
  "display:flex;flex-direction:column;gap:16px;padding:20px 24px 36px;max-width:760px;",
  "color:var(--dsw-alias-label-primary,#1a1a1a);font-size:13px;line-height:20px;}",
  "." + PREFIX + "head{display:flex;flex-direction:column;gap:4px;}",
  "." + PREFIX + "h{margin:0;font-size:17px;line-height:24px;font-weight:600;}",
  "." + PREFIX + "sub{margin:0;color:var(--dsw-alias-label-tertiary,#8a8a8a);font-size:12.5px;}",
  "." + PREFIX + "card{border:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));",
  "border-radius:10px;padding:14px 16px;display:flex;flex-direction:column;gap:11px;}",
  "." + PREFIX + "cardtitle{margin:0;font-size:13px;font-weight:600;}",
  "." + PREFIX + "field{display:flex;align-items:flex-start;gap:12px;}",
  "." + PREFIX + "label{flex:0 0 116px;padding-top:5px;color:var(--dsw-alias-label-secondary,#555);}",
  "." + PREFIX + "control{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:6px;}",
  "." + PREFIX + "hint{color:var(--dsw-alias-label-tertiary,#8a8a8a);font-size:12px;}",
  "." + PREFIX + "input,.dsh-hsp-select{box-sizing:border-box;width:100%;height:30px;padding:0 9px;",
  "border-radius:7px;border:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.18));",
  "background:var(--dsw-alias-bg-default,transparent);color:inherit;font:inherit;font-size:13px;}",
  "." + PREFIX + "input:focus,.dsh-hsp-select:focus{outline:2px solid var(--dsw-alias-brand-primary,#3b82f6);",
  "outline-offset:1px;}",
  "." + PREFIX + "radio{display:flex;align-items:flex-start;gap:8px;cursor:pointer;}",
  "." + PREFIX + "radio input{margin-top:3px;}",
  "." + PREFIX + "row{display:flex;align-items:center;gap:10px;min-width:0;}",
  "." + PREFIX + "key{flex:0 0 92px;color:var(--dsw-alias-label-tertiary,#8a8a8a);}",
  "." + PREFIX + "val{min-width:0;overflow-wrap:anywhere;}",
  "." + PREFIX + "badge{display:inline-flex;align-items:center;gap:5px;font-size:12px;",
  "padding:1px 9px;border-radius:999px;border:.5px solid transparent;white-space:nowrap;}",
  "." + PREFIX + "ok{color:#15803d;background:rgba(21,128,61,.10);border-color:rgba(21,128,61,.25);}",
  "." + PREFIX + "bad{color:#b91c1c;background:rgba(185,28,28,.10);border-color:rgba(185,28,28,.25);}",
  "." + PREFIX + "btn{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 14px;",
  "border-radius:8px;border:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.14));",
  "background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.045));color:inherit;font:inherit;",
  "font-size:13px;cursor:pointer;text-decoration:none;}",
  "." + PREFIX + "btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-active,rgba(0,0,0,.09));}",
  "." + PREFIX + "btn:disabled{opacity:.5;cursor:default;}",
  "." + PREFIX + "actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}",
  "." + PREFIX + "notice{color:var(--dsw-alias-state-ok-primary,#15803d);font-size:12.5px;}",
  "." + PREFIX + "list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;}",
  "." + PREFIX + "item{display:flex;align-items:baseline;gap:12px;padding:6px 0;min-width:0;",
  "border-bottom:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.07));}",
  "." + PREFIX + "item:last-child{border-bottom:0;}",
  "." + PREFIX + "mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;",
  "overflow-wrap:anywhere;}",
  "." + PREFIX + "count{margin-left:auto;flex:0 0 auto;color:var(--dsw-alias-label-tertiary,#8a8a8a);font-size:12px;}",
  "." + PREFIX + "muted{color:var(--dsw-alias-label-tertiary,#8a8a8a);}",
  "." + PREFIX + "err{color:#b91c1c;}",
  "." + PREFIX + "details{border:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:10px;",
  "padding:11px 16px;font-size:12.5px;}",
  "." + PREFIX + "summary{cursor:pointer;color:var(--dsw-alias-label-secondary,#555);}"
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
function Badge(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "badge " + (props.ok ? PREFIX + "ok" : PREFIX + "bad"), children: props.children });
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
  const [modelsState, setModelsState] = (0, import_react.useState)({ loading: false, providers: [], error: null });
  const [saving, setSaving] = (0, import_react.useState)(false);
  const [notice, setNotice] = (0, import_react.useState)(null);
  const [saveError, setSaveError] = (0, import_react.useState)(null);
  const load = (0, import_react.useCallback)(() => {
    setStatus((previous) => ({ ...previous, loading: true, error: null }));
    fetch(STATUS_URL, { headers: { accept: "application/json" } }).then((response) => {
      if (!response.ok) throw new Error("HTTP " + String(response.status));
      return response.json();
    }).then((data2) => setStatus({ loading: false, data: data2, error: null })).catch((error) => setStatus({ loading: false, data: null, error: String(error?.message ?? error) }));
  }, []);
  const loadModels = (0, import_react.useCallback)(() => {
    setModelsState((prev) => ({ ...prev, loading: true, error: null }));
    fetch(MODELS_URL, { headers: { accept: "application/json" } }).then((res) => {
      if (!res.ok) throw new Error("HTTP " + String(res.status));
      return res.json();
    }).then((data2) => {
      setModelsState({
        loading: false,
        providers: Array.isArray(data2?.providers) ? data2.providers : [],
        error: null
      });
    }).catch((err) => {
      setModelsState({ loading: false, providers: [], error: String(err?.message ?? err) });
    });
  }, []);
  (0, import_react.useEffect)(() => {
    load();
  }, [load]);
  (0, import_react.useEffect)(() => {
    loadModels();
  }, [loadModels]);
  (0, import_react.useEffect)(() => {
    if (status.data) setDraft({ ...status.data.config.values });
  }, [status.data]);
  (0, import_react.useEffect)(() => {
    if (status.data?.gui) {
      setCpDraft(status.data.gui.controlPlaneUrl);
      setServerModelsDraft({ ...status.data.gui.serverModels ?? {} });
    }
  }, [status.data]);
  const dirty = (0, import_react.useMemo)(() => {
    if (!draft || !status.data) return false;
    const saved = status.data.config.values;
    if (cpDraft !== null && status.data.gui) {
      if (cpDraft !== status.data.gui.controlPlaneUrl) return true;
    }
    if (serverModelsDraft && status.data.gui) {
      const savedServer = status.data.gui.serverModels ?? {};
      const allKeys = /* @__PURE__ */ new Set([...Object.keys(serverModelsDraft), ...Object.keys(savedServer)]);
      for (const key of allKeys) {
        if ((serverModelsDraft[key] ?? "") !== (savedServer[key] ?? "")) return true;
      }
    }
    return Object.keys(draft).some((key) => draft[key] !== saved[key]);
  }, [draft, cpDraft, serverModelsDraft, status.data]);
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
  const save = (0, import_react.useCallback)(() => {
    if (!draft) return;
    setSaving(true);
    setNotice(null);
    setSaveError(null);
    const payloadBody = { ...draft };
    if (cpDraft !== null) payloadBody.controlPlaneUrl = cpDraft;
    if (serverModelsDraft !== null) payloadBody.serverModels = serverModelsDraft;
    fetch(CONFIG_URL, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(payloadBody)
    }).then(async (response) => {
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? `HTTP ${response.status}`);
      return payload;
    }).then((payload) => {
      setSaving(false);
      setStatus({ loading: false, data: payload, error: null });
      const saved = Array.isArray(payload?.saved) ? payload.saved.join("\u3001") : "";
      setNotice(saved === "" ? "\u5DF2\u4FDD\u5B58\u3002" : `\u5DF2\u4FDD\u5B58\uFF08${saved}\uFF09\u3002\u4E0B\u4E00\u8F6E\u5BF9\u8BDD\u751F\u6548\u3002`);
    }).catch((error) => {
      setSaving(false);
      setSaveError(String(error?.message ?? error));
    });
  }, [draft, cpDraft, serverModelsDraft]);
  const data = status.data;
  const api = data ? data.api : null;
  const cp = data ? data.controlPlane : null;
  const config = data ? data.config : null;
  const banks = data && Array.isArray(data.banks) ? data.banks : [];
  const extraKeys = config && Array.isArray(config.extraKeys) ? config.extraKeys : [];
  const recordMode = draft && draft.dynamicBankId === true ? "dynamic" : "fixed";
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "root", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { className: PREFIX + "h", children: "Hindsight \u8BBE\u7F6E" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: PREFIX + "sub", children: "\u5199\u5165 ~/.hindsight/coding-agent.json \u4E0E dsh-hindsight-gui.json\u3002\u4FDD\u5B58\u540E\u4E0B\u4E00\u8F6E\u5BF9\u8BDD\u751F\u6548\uFF0C\u65E0\u9700\u91CD\u542F\u3002" })
    ] }),
    status.loading && draft === null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: PREFIX + "muted", children: "\u8BFB\u53D6\u4E2D\u2026" }),
    status.error !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, { label: "\u8BFB\u53D6\u5931\u8D25", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "err", children: status.error }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: PREFIX + "actions", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: PREFIX + "btn", onClick: load, children: "\u91CD\u8BD5" }) })
    ] }),
    draft !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: PREFIX + "cardtitle", children: "\u8BB0\u5FC6" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "label", children: "\u542F\u7528" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "control", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: PREFIX + "radio", children: [
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
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: PREFIX + "radio", children: [
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
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: PREFIX + "radio", children: [
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
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "hint", children: "Hindsight API \u7684\u5730\u5740\uFF0C\u9700\u6307\u5411\u4F60\u5DF2\u90E8\u7F72\u597D\u7684\u670D\u52A1\uFF08\u5199\u5165 apiUrl\uFF09\u3002" })
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
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: PREFIX + "cardtitle", children: "\u529F\u80FD\u6A21\u578B\u8C03\u7528" }),
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
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "hint", style: { marginTop: "-4px" }, children: "\u76F4\u63A5\u4ECE\u5F53\u524D DSH \u73AF\u5883\u5DF2\u6CE8\u518C\u7684 Provider \u53D1\u73B0\u6A21\u578B\uFF0C\u652F\u6301\u4E0B\u62C9\u70B9\u9009\u6216\u624B\u52A8\u6307\u5B9A\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          ModelSelectField,
          {
            label: "\u4EE3\u7801\u5E93\u52D8\u5BDF",
            hint: "\u65B0\u4ED3\u5E93\u6216\u5927\u89C4\u6A21\u66F4\u65B0\u65F6\u8FDB\u884C\u7ED3\u6784\u52D8\u5BDF\uFF08\u5199\u5165 coding-agent.json \u7684 surveyModel\uFF09\u3002",
            defaultValue: "haiku",
            value: draft.surveyModel ?? "",
            onChange: (val) => set("surveyModel", val),
            providers: modelsState.providers
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          ModelSelectField,
          {
            label: "\u53CD\u601D\u63A8\u7406",
            hint: "hindsight_reflect \u8BB0\u5FC6\u63A8\u7406\u4E0E\u95EE\u7B54\u3002\u5EFA\u8BAE\u9009\u7528\u63A8\u7406\u548C\u957F\u4E0A\u4E0B\u6587\u80FD\u529B\u5F3A\u7684\u6A21\u578B\uFF08\u5199\u5165 serverModels.reflect\uFF09\u3002",
            defaultValue: "MiniMax-M3",
            value: serverModelsDraft.reflect ?? "",
            onChange: (val) => setServerModel("reflect", val),
            providers: modelsState.providers
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          ModelSelectField,
          {
            label: "\u4E8B\u5B9E\u63D0\u53D6",
            hint: "\u4ECE\u4F1A\u8BDD\u4E2D\u63D0\u53D6\u4E8B\u5B9E\uFF08Retain\uFF09\uFF0CToken \u6D88\u8017\u91CF\u5927\u3002\u5EFA\u8BAE\u9009\u7528\u901F\u5EA6\u5FEB\u3001\u6210\u672C\u4F4E\u4E14\u652F\u6301 JSON Schema \u7684\u6A21\u578B\uFF08\u5199\u5165 serverModels.retain\uFF09\u3002",
            defaultValue: "deepseek-flash",
            value: serverModelsDraft.retain ?? "",
            onChange: (val) => setServerModel("retain", val),
            providers: modelsState.providers
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          ModelSelectField,
          {
            label: "\u8BB0\u5FC6\u6574\u7406",
            hint: "\u540E\u53F0\u805A\u5408\u6D88\u6B67\u4E0E\u53BB\u91CD\u76F8\u4F3C\u4E8B\u5B9E\uFF08Consolidation\uFF09\u3002\u5EFA\u8BAE\u9009\u7528\u652F\u6301\u7ED3\u6784\u5316\u8F93\u51FA\u7684\u5FEB\u901F\u6A21\u578B\uFF08\u5199\u5165 serverModels.consolidation\uFF09\u3002",
            defaultValue: "deepseek-flash",
            value: serverModelsDraft.consolidation ?? "",
            onChange: (val) => setServerModel("consolidation", val),
            providers: modelsState.providers
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          ModelSelectField,
          {
            label: "\u77E5\u8BC6\u63D0\u70BC",
            hint: "\u5237\u65B0\u7ED3\u6784\u5316\u77E5\u8BC6\u5E93\u9875\u9762\uFF08Mental Model Refresh\uFF0C\u5982\u67B6\u6784\u56FE\u3001\u6982\u5FF5\u89C4\u8303\uFF09\uFF08\u5199\u5165 serverModels.mentalModel\uFF09\u3002",
            defaultValue: "deepseek-flash",
            value: serverModelsDraft.mentalModel ?? "",
            onChange: (val) => setServerModel("mentalModel", val),
            providers: modelsState.providers
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: PREFIX + "cardtitle", children: "\u5176\u4ED6" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: PREFIX + "radio", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "checkbox",
              checked: draft.autoUpdate === true,
              onChange: (event) => set("autoUpdate", event.target.checked)
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u81EA\u52A8\u66F4\u65B0\uFF08autoUpdate\uFF09" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: PREFIX + "radio", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "checkbox",
              checked: draft.codebaseSurvey === true,
              onChange: (event) => set("codebaseSurvey", event.target.checked)
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u4EE3\u7801\u5E93\u52D8\u5BDF\uFF08codebaseSurvey\uFF09" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: PREFIX + "btn", disabled: !dirty || saving, onClick: save, children: saving ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            type: "button",
            className: PREFIX + "btn",
            disabled: !dirty || saving,
            onClick: () => {
              setDraft({ ...config.values });
              if (data?.gui) {
                setCpDraft(data.gui.controlPlaneUrl);
                setServerModelsDraft({ ...data.gui.serverModels ?? {} });
              }
            },
            children: "\u653E\u5F03\u66F4\u6539"
          }
        ),
        dirty && !saving && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "muted", children: "\u6709\u672A\u4FDD\u5B58\u7684\u66F4\u6539" }),
        notice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "notice", children: notice }),
        saveError && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: PREFIX + "err", children: [
          "\u4FDD\u5B58\u5931\u8D25\uFF1A",
          saveError
        ] })
      ] })
    ] }),
    data && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: PREFIX + "cardtitle", children: "\u670D\u52A1\u72B6\u6001" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Row, { label: "API", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { ok: api?.up === true, children: api?.up ? "\u8FD0\u884C\u4E2D" : "\u672A\u8FD0\u884C" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: PREFIX + "muted", children: [
            " ",
            api?.url
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
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { ok: cp?.up === true, children: cp?.up ? "\u8FD0\u884C\u4E2D" : "\u672A\u8FD0\u884C" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: PREFIX + "muted", children: [
            " ",
            cp?.url
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "actions", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { className: PREFIX + "btn", href: cp ? cp.url : "#", target: "_blank", rel: "noreferrer noopener", children: "\u6253\u5F00 Control Plane" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: PREFIX + "btn", onClick: load, children: "\u5237\u65B0\u72B6\u6001" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PREFIX + "card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", { className: PREFIX + "cardtitle", children: [
          "\u8BB0\u5FC6\u5E93 ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: PREFIX + "muted", children: [
            "(",
            banks.length,
            ")"
          ] })
        ] }),
        banks.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: PREFIX + "muted", children: "\u6CA1\u6709\u8BFB\u5230\u8BB0\u5FC6\u5E93\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { className: PREFIX + "list", children: banks.map((bank) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { className: PREFIX + "item", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PREFIX + "mono", children: bank.id }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: PREFIX + "count", children: [
            bank.facts,
            " facts"
          ] })
        ] }, bank.id)) })
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
