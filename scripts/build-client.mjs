// 用 esbuild 构建 client（CJS bundle，react external），
// 再包进 window.__ModuleLoader__.load wrapper（照 dsh-model-refresh 的产物形态）。
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const lib = dirname(fileURLToPath(import.meta.url))
const root = join(lib, '..')
const cjs = join(root, 'lib', 'client.cjs')
const out = join(root, 'lib', 'client.js')
const entry = join(root, 'src', 'client', 'index.tsx')

let built = false
try {
  const { build } = await import('esbuild')
  await build({
    entryPoints: [entry],
    outfile: cjs,
    bundle: true,
    format: 'cjs',
    platform: 'browser',
    jsx: 'automatic',
    external: ['react', 'react/jsx-runtime'],
    logLevel: 'info',
    target: ['es2022'],
  })
  built = true
} catch (err) {
  // Under the Windows sandbox, node-to-binary IPC pipe may fail with EPERM.
  // Fall back to invoking the esbuild CLI directly with stdio: 'inherit'.
  const esbuildBin = join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'esbuild.cmd' : 'esbuild')
  const cliArgs = [
    entry,
    '--bundle',
    '--format=cjs',
    '--platform=browser',
    '--jsx=automatic',
    '--external:react',
    '--external:react/jsx-runtime',
    '--target=es2022',
    `--outfile=${cjs}`,
  ]
  const proc = process.platform === 'win32'
    ? spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/c', esbuildBin, ...cliArgs], { stdio: 'inherit' })
    : spawnSync(esbuildBin, cliArgs, { stdio: 'inherit' })
  if (proc.status !== 0) {
    throw new Error(`esbuild CLI failed with status ${proc.status}`)
  }
  built = true
}

const source = readFileSync(cjs, 'utf8')
writeFileSync(out, `window.__ModuleLoader__.load({
	id: "dsh-hindsight-gui",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
${source}
		return module.exports;
	}
});
`)
console.log(`wrapped: ${out}`)
