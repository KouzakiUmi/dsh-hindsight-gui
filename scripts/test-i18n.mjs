/**
 * i18n catalogue guard.
 *
 * The panel renders Chinese source strings through `t()`/`tf()`; this test keeps
 * `src/client/locales/en.js` honest without a browser:
 *
 * 1. catalogue sanity — no empty values, no Chinese left in an English value,
 *    matching `{0}`, `{1}`… placeholders;
 * 2. coverage — the client bundle (with the i18n module kept external, so the
 *    catalogue itself is not part of the scan) must not contain Chinese text
 *    that the catalogue does not know about, which is what an unwritten `t()`
 *    around a new string looks like.
 *
 * Server-provided text is rendered verbatim, so the plugin's `lib/` strings are
 * out of scope here.
 */
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { EN } from '../src/client/locales/en.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const HAN = /[\u2e80-\u9fff\u3000-\u303f\uff00-\uffef]+/g

let failures = 0
function test(name, fn) {
  try {
    fn()
    console.log('ok   - ' + name)
  } catch (error) {
    failures++
    console.error('FAIL - ' + name)
    console.error(error)
  }
}

const entries = Object.entries(EN)

test('catalogue has no empty or Chinese-valued entries', () => {
  assert.ok(entries.length > 500, 'catalogue should cover the whole panel')
  for (const [key, value] of entries) {
    assert.equal(typeof value, 'string', `${JSON.stringify(key)} has no translation`)
    assert.notEqual(value.trim(), '', `${JSON.stringify(key)} is empty`)
    assert.ok(!HAN.test(value), `${JSON.stringify(key)} still contains Chinese: ${value}`)
  }
})

test('placeholders survive translation', () => {
  for (const [key, value] of entries) {
    const expected = [...key.matchAll(/\{(\d+)\}/g)].map((match) => Number(match[1]))
    const actual = [...value.matchAll(/\{(\d+)\}/g)].map((match) => Number(match[1]))
    assert.deepEqual(actual, expected, `${JSON.stringify(key)} → ${JSON.stringify(value)} changes placeholders`)
  }
})

const bundle = await build({
  entryPoints: [join(root, 'src', 'client', 'index.tsx')],
  bundle: true,
  write: false,
  format: 'esm',
  logLevel: 'silent',
  external: ['react', 'react/jsx-runtime', './i18n'],
})

// Chinese words the client only ever matches against host warnings
// (isMigrationWarning); they are patterns, never rendered.
const PATTERN_WORDS = ['重建', '迁移', '重新索引']

test('every Chinese string in the client bundle is a catalogue key', () => {
  const source = bundle.outputFiles[0].text
  const keys = entries.map(([key]) => key)
  const unknown = []
  for (const match of source.matchAll(HAN)) {
    const run = match[0]
    if (PATTERN_WORDS.some((word) => word.includes(run))) continue
    if (!keys.some((key) => key.includes(run))) unknown.push(run)
  }
  assert.deepEqual([...new Set(unknown)], [], 'wrap these strings in t() and add them to the catalogue')
})

console.log(`\n${failures === 0 ? 'i18n catalogue ok' : failures + ' failed'}`)
process.exit(failures === 0 ? 0 : 1)
