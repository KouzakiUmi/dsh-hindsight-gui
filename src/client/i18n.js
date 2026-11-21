/**
 * i18n.js — locale plumbing for the Hindsight settings panel.
 *
 * The source strings in this plugin are written in Chinese; `t()` and `tf()`
 * look them up in the English catalogue and return either the translation or,
 * when the interface language is Chinese, the original string. Chinese is the
 * fallback for every miss, so a missing entry degrades to readable text rather
 * than to a placeholder key.
 *
 * The choice is persisted in `localStorage` (`dsh-hindsight-gui.locale`) and is
 * read once per module load. Without a stored choice the browser language
 * decides: any `zh*` locale stays Chinese, everything else starts in English.
 * `useLocale()` subscribes a component to later changes, so the language
 * selector re-renders the whole page without remounting it (mounting again
 * would drop the unsaved drafts the page deliberately keeps).
 *
 * Deliberately absent: a message registry keyed by ids. Every visible string is
 * its own key, which keeps `text === key` greppable and lets callers translate
 * server-provided Chinese text with the same lookup.
 */

import { useEffect, useState } from 'react'
import { EN } from './locales/en.js'

export const LOCALES = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
]

const STORAGE_KEY = 'dsh-hindsight-gui.locale'
const SUPPORTED = LOCALES.map((entry) => entry.value)
const listeners = new Set()

/** The resolved locale, or null until `getLocale()` first runs. */
let current = null

function normalize(value) {
  if (typeof value !== 'string') return null
  const lower = value.toLowerCase()
  if (lower === 'zh' || lower.startsWith('zh-') || lower.startsWith('zh_')) return 'zh'
  if (lower === 'en' || lower.startsWith('en-') || lower.startsWith('en_')) return 'en'
  return null
}

function safeStorage() {
  try {
    if (typeof window !== 'undefined' && window !== null && window.localStorage) return window.localStorage
  } catch {
    // Storage can be missing or blocked (privacy modes, sandboxed hosts).
  }
  return null
}

function storedLocale() {
  const store = safeStorage()
  if (!store) return null
  try {
    const value = store.getItem(STORAGE_KEY)
    return SUPPORTED.includes(value) ? value : null
  } catch {
    return null
  }
}

function browserLocale() {
  if (typeof navigator === 'undefined' || navigator === null) return null
  const languages = Array.isArray(navigator.languages) && navigator.languages.length > 0
    ? navigator.languages
    : [navigator.language]
  for (const language of languages) {
    const normalized = normalize(language)
    if (normalized) return normalized === 'zh' ? 'zh' : 'en'
    // An unrelated browser language cannot read Chinese: start in English.
    if (typeof language === 'string' && language !== '') return 'en'
  }
  return null
}

/** Current interface language: a stored choice first, then the browser, then Chinese. */
export function getLocale() {
  if (current === null) current = storedLocale() ?? browserLocale() ?? 'zh'
  return current
}

/** Switch the interface language, persist it and notify subscribed components. */
export function setLocale(next) {
  const normalized = normalize(next) ?? (SUPPORTED.includes(next) ? next : null)
  if (normalized === null || normalized === getLocale()) return getLocale()
  current = normalized
  const store = safeStorage()
  if (store) {
    try {
      store.setItem(STORAGE_KEY, normalized)
    } catch {
      // Persisting is a convenience: an unusable store must not break the page.
    }
  }
  for (const listener of [...listeners]) {
    try {
      listener()
    } catch {
      // A failing subscriber must not stop the others from updating.
    }
  }
  return current
}

/**
 * Subscribe to locale changes.
 * @param listener - called after every successful `setLocale`.
 * @returns an unsubscribe function, suitable as an effect cleanup.
 */
export function subscribeLocale(listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** React hook: the current locale, re-rendering the caller when it changes. */
export function useLocale() {
  const [locale, setLocal] = useState(getLocale)
  useEffect(() => subscribeLocale(() => setLocal(getLocale())), [])
  return locale
}

function substitute(text, values) {
  if (values === undefined || values.length === 0) return text
  return text.replace(/\{(\d+)\}/g, (match, index) => {
    const value = values[Number(index)]
    return value === undefined || value === null ? match : String(value)
  })
}

/**
 * Translate one string, substituting `{0}`, `{1}`… when values are given.
 * @param text - the Chinese source string, which doubles as the catalogue key.
 * @param values - optional interpolation values.
 * @returns the string in the active locale.
 */
export function t(text, ...values) {
  if (typeof text !== 'string') return text
  const source = getLocale() === 'en' ? EN[text] ?? text : text
  return substitute(source, values)
}

/**
 * Translate a formatted template. Same as `t()`, but takes the values as an
 * array so generated call sites can pass a spread list.
 * @param pattern - template with `{0}`, `{1}`… placeholders.
 * @param values - interpolation values, in placeholder order.
 * @returns the pattern in the active locale with the placeholders filled.
 */
export function tf(pattern, values) {
  if (typeof pattern !== 'string') return pattern
  const source = getLocale() === 'en' ? EN[pattern] ?? pattern : pattern
  return substitute(source, Array.isArray(values) ? values : [])
}
