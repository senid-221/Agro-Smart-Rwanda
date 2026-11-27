const express = require('express')
const path = require('path')
const fs = require('fs')

const config = require('./config')
const { migrate, pool } = require('./db')
const { attach } = require('./middleware/auth')
const { attachLiveReload } = require('./livereload')
const portRoutes = require('./routes/port')
const adminRoutes = require('./routes/admin')

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '256kb' }))
app.use(attach)

// --- API ---
app.get('/api/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ ok: true }) }
  catch (e) { res.status(500).json({ ok: false, error: e.message }) }
})

app.get('/api/config', (_req, res) => {
  res.json({
    preview: config.preview,
    liveReload: config.liveReload,
    lockDays: config.rules.lockDays
  })
})

app.use('/api', portRoutes)
app.use('/api/admin', adminRoutes)

// --- Dev live reload (SSE) ---
if (config.liveReload) attachLiveReload(app)

// --- Static mobile web app ---
if (fs.existsSync(config.staticDir)) {
  app.use(express.static(config.staticDir, { extensions: ['html'], etag: false, maxAge: 0 }))
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(path.join(config.staticDir, 'index.html'))
  })
} else {
  app.get('/', (_req, res) => res.type('text/plain').send('Hindura API running. Missing ' + config.staticDir))
}

app.use('/api', (_req, res) => res.status(404).json({ error: 'not_found' }))
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'server_error' })
})

// Postgres may still be warming up when the app container starts: retry briefly.
async function prepareDatabase() {
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      await migrate()
      console.log('✔ database schema ready')
      return
    } catch (e) {
      console.warn(`database not ready (attempt ${attempt}/10): ${e.message}`)
      await new Promise(r => setTimeout(r, 2000))
    }
  }
  console.error('⚠ database unavailable — API calls will fail until Postgres is reachable')
}

async function start() {
  await prepareDatabase()
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`Hindura MNP on http://0.0.0.0:${config.port} (${config.nodeEnv})`)
    console.log(`Serving frontend from ${config.staticDir}`)
  })
}

start()
