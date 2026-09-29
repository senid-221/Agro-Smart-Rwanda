// Minimal dependency-free static server for local browser verification.
const http = require('http')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..', 'public')
const PORT = process.env.PORT || 5178
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.gif': 'image/gif'
}

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0])
  if (urlPath === '/') urlPath = '/index.html'
  const filePath = path.join(ROOT, urlPath)
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA-ish fallback for extensionless routes
      fs.readFile(path.join(ROOT, 'index.html'), (e2, html) => {
        if (e2) { res.writeHead(404); res.end('Not found'); return }
        res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(html)
      })
      return
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream' })
    res.end(data)
  })
}).listen(PORT, () => console.log('serving ' + ROOT + ' on http://localhost:' + PORT))
