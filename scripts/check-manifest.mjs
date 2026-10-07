/**
 * Validate the package manifest and the shipped sources before a release.
 *
 * Checks the things that actually break a DSH plugin install: a name/id
 * mismatch between the manifest, the patch, the loader wrapper and the client
 * source, plus a syntax error in any shipped JavaScript.
 *
 * Run: node scripts/check-manifest.mjs
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { globSync } from 'node:fs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (relative) => readFileSync(join(root, relative), 'utf8')

const problems = []

const pkg = JSON.parse(read('package.json'))
const NAME = pkg.name
console.log(`package: ${NAME}@${pkg.version}`)

// --- manifest shape ------------------------------------------------------
if (NAME !== 'dsh-hindsight-gui') {
  problems.push(`package name is "${NAME}", expected "dsh-hindsight-gui"`)
}
if (pkg.private === true) {
  problems.push('package is still marked private: it cannot be packed for release')
}
for (const field of ['main', 'exports', 'files', 'dsh']) {
  if (pkg[field] === undefined) problems.push(`package.json is missing "${field}"`)
}
if (pkg.dsh?.bundle?.patch !== './cordis.patch.yml') {
  problems.push('dsh.bundle.patch must point at ./cordis.patch.yml')
}

// Every path named by exports / files / the bundle patch must exist.
// A `files` entry may be a directory or a glob ("lib/"), which npm expands at
// pack time rather than naming a single file -- resolve it the same way.
const referenced = new Set([
  pkg.main,
  pkg.dsh?.bundle?.patch,
  ...Object.values(pkg.exports ?? {}).flatMap((entry) =>
    typeof entry === 'string' ? [entry] : Object.values(entry)),
].filter(Boolean))

for (const relative of referenced) {
  if (!existsSync(join(root, relative))) problems.push(`referenced path does not exist: ${relative}`)
}

// Each `files` entry must match at least one shipped file.
for (const pattern of pkg.files ?? []) {
  const base = join(root, pattern.replace(/[\\/]$/, ''))
  if (pattern.includes('*')) {
    if (globSync(pattern, { cwd: root }).length === 0) {
      problems.push(`files entry matches nothing: ${pattern}`)
    }
  } else if (!existsSync(base)) {
    problems.push(`files entry does not exist: ${pattern}`)
  } else if (statSync(base).isDirectory() && readdirSync(base).length === 0) {
    problems.push(`files entry is an empty directory: ${pattern}`)
  }
}

// --- the plugin id must be identical everywhere --------------------------
const patch = read('cordis.patch.yml')
const wrapper = read('lib/client.js')
const clientSource = read('src/client/index.tsx')
const host = read('lib/index.js')

const expectations = [
  ['cordis.patch.yml', /name:\s*dsh-hindsight-gui/, 'bundle entry name'],
  ['cordis.patch.yml', /id:\s*hindsight-gui/, 'loader id'],
  ['lib/client.js', /id:\s*"dsh-hindsight-gui"/, 'module-loader wrapper id'],
  ['lib/client.js', /hindsight-gui/, 'panel id'],
  ['src/client/index.tsx', /PANEL_ID\s*=\s*'hindsight-gui'/, 'panel id constant'],
  ['src/client/index.tsx', /export const name = 'hindsight-gui'/, 'client plugin name'],
  ['src/client/index.tsx', /\/plugins\/dsh-hindsight-gui\/status/, 'status route'],
  ['src/client/index.tsx', /\/plugins\/dsh-hindsight-gui\/config/, 'config route'],
  ['lib/index.js', /export const name = 'hindsight-gui'/, 'host plugin name'],
  ['lib/index.js', /HTTP_BASE\s*=\s*'\/plugins\/dsh-hindsight-gui'/, 'host route base'],
]

for (const [file, pattern, what] of expectations) {
  if (!pattern.test(read(file))) {
    problems.push(`${file}: missing ${what}`)
  }
}

// The client and the host must agree on the route base, or the page 404s.
const clientBase = /\/plugins\/(dsh-hindsight-gui)/.exec(clientSource)?.[1]
const hostBase = /HTTP_BASE\s*=\s*'\/plugins\/([^']+)'/.exec(host)?.[1]
if (clientBase !== hostBase) {
  problems.push(`route base mismatch: client "${clientBase}" vs host "${hostBase}"`)
}

// --- the built bundle must be present and current -------------------------
// A stale lib/client.js is the failure mode this check exists to catch: the
// source is edited, the bundle is not rebuilt, and the page silently keeps
// the old behaviour in a release that looks fine.
if (wrapper.includes('dsh-hindsight-panel')) {
  problems.push('lib/client.js still references the old plugin name dsh-hindsight-panel')
}

const sourceTime = statSync(join(root, 'src', 'client', 'index.tsx')).mtimeMs
const bundleTime = statSync(join(root, 'lib', 'client.js')).mtimeMs
if (sourceTime > bundleTime) {
  problems.push('lib/client.js is older than src/client/index.tsx — run `pnpm build:client`')
}

// --- syntax check every shipped JS ---------------------------------------
for (const relative of ['lib/index.js', 'lib/client.cjs', 'scripts/build-client.mjs']) {
  try {
    execFileSync(process.execPath, ['--check', join(root, relative)], { stdio: 'ignore' })
  } catch (error) {
    problems.push(`${relative}: syntax check failed (exit code ${error.status ?? 1})`)
  }
}

// --- report ---------------------------------------------------------------
if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`)
  for (const problem of problems) console.error(`  - ${problem}`)
  process.exit(1)
}
console.log('manifest, id consistency and syntax: OK')