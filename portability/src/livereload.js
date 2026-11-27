const fs = require('fs')
const path = require('path')

// Development-only live reload: watch the static frontend and tell connected
// preview pages to refresh. Never mounted in production.
function attachLiveReload(app) {
  const clients = new Set()

  app.get('/__reload', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    })
    res.write('retry: 1000\n\n')
    clients.add(res)
    req.on('close', () => clients.delete(res))
  })

  let timer = null
  const dir = path.join(__dirname, '..', 'public')
  try {
    fs.watch(dir, { recursive: true }, () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        for (const client of clients) client.write('data: reload\n\n')
      }, 250)
    })
  } catch (e) {
    console.warn('live reload watcher unavailable:', e.message)
  }
}

module.exports = { attachLiveReload }
