import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { join, extname, normalize } from 'node:path'

const ROOT = join(import.meta.dirname, 'public')
const PORT = process.env.PORT || 8080

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`)
    let path = normalize(decodeURIComponent(url.pathname))
    if (path.endsWith('/') || path === '.') path += 'index.html'
    const file = join(ROOT, path)
    if (!file.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return }
    const data = await readFile(file).catch(() => null)
    if (!data) {
      // SPA fallback
      const index = await readFile(join(ROOT, 'index.html'))
      res.writeHead(200, { 'Content-Type': MIME['.html'] })
      res.end(index)
      return
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' })
    res.end(data)
  } catch (e) {
    res.writeHead(500); res.end('Server error')
  }
}).listen(PORT, () => console.log(`AgroSmart Rwanda running at http://localhost:${PORT}`))
