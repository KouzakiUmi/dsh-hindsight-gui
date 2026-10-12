/** User-authorized, loopback-only isolated preview; exposes no directory listing. */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const target = join(root, 'dist', 'embedding-tabs-preview.html')
// The only permitted document is our synthetic preview; never read profile files.
await readFile(target) // fail before listening if the build is unavailable
const server = createServer(async (req, res) => {
  const path = new URL(req.url ?? '/', 'http://127.0.0.1').pathname
  if (req.method !== 'GET' || path !== '/') {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
    res.end('isolated preview only')
    return
  }
  try {
    const html = await readFile(target)
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' })
    res.end(html)
  } catch {
    res.writeHead(503, { 'content-type': 'text/plain; charset=utf-8' })
    res.end('preview build unavailable')
  }
})
server.listen(0, '127.0.0.1', () => {
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Preview listener address unavailable')
  console.log(JSON.stringify({ url: `http://127.0.0.1:${address.port}/`, isolated: true, syntheticData: true }))
})
process.on('SIGTERM', () => server.close(() => process.exit(0)))
process.on('SIGINT', () => server.close(() => process.exit(0)))
