import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const stable = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/
const compare = (a, b) => {
  const left = a.split('.').map(Number)
  const right = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if (left[i] !== right[i]) return left[i] - right[i]
  }
  return 0
}

export function planRelease(sourceVersion, versions, sha, ref = '') {
  if (!stable.test(sourceVersion)) throw new Error('Automatic releases require a stable x.y.z source version')
  if (!sha) throw new Error('A commit SHA is required')
  const tag = ref.startsWith('refs/tags/') ? ref.slice('refs/tags/'.length) : null
  if (tag && tag !== `v${sourceVersion}`) throw new Error(`Tag ${tag} does not match package version ${sourceVersion}`)
  if (tag && versions[sourceVersion]) {
    if (versions[sourceVersion].gitHead !== sha) throw new Error(`${sourceVersion} already exists for a different commit`)
    return { version: sourceVersion, publish: false }
  }
  const released = Object.keys(versions).filter(version => stable.test(version)).sort(compare)
  if (!tag) {
    const previous = released.findLast(version => versions[version].gitHead === sha)
    if (previous) return { version: previous, publish: false }
  }
  const highest = released.at(-1)
  let version = sourceVersion
  if (!tag && highest && compare(sourceVersion, highest) <= 0) {
    const parts = highest.split('.').map(Number)
    parts[2]++
    version = parts.join('.')
  }
  if (tag && highest && compare(sourceVersion, highest) <= 0) {
    throw new Error(`Tag version must be higher than the published version ${highest}`)
  }
  return { version, publish: true }
}

async function main() {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
  const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(pkg.name)}`, {
    headers: { accept: 'application/json' }, signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok && response.status !== 404) throw new Error(`Registry lookup failed: HTTP ${response.status}`)
  const metadata = response.status === 404 ? {} : await response.json()
  const plan = planRelease(pkg.version, metadata.versions ?? {}, process.env.GITHUB_SHA, process.env.GITHUB_REF)
  console.log(`${plan.publish ? 'Prepare' : 'Already published'} ${pkg.name}@${plan.version}`)
  if (plan.publish) {
    pkg.version = plan.version
    pkg.gitHead = process.env.GITHUB_SHA
    writeFileSync('package.json', `${JSON.stringify(pkg, null, 2)}\n`)
  }
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `version=${plan.version}\nshould_publish=${plan.publish}\n`)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main()
