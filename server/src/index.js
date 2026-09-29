const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')

const config = require('./config')
const { migrate, pool } = require('./db')
const { attach } = require('./middleware/auth')

const authRoutes = require('./routes/auth')
const catalogRoutes = require('./routes/catalog')
const ordersRoutes = require('./routes/orders')
const aiRoutes = require('./routes/ai')
const adminRoutes = require('./routes/admin')

const app = express()

app.use(cors(config.corsOrigin ? { origin: config.corsOrigin, credentials: true } : {}))
app.use(express.json({ limit: '8mb' }))
app.use(attach)

// --- API ---
app.get('/api/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ ok: true }) }
  catch (e) { res.status(500).json({ ok: false, error: e.message }) }
})
app.use('/api/auth', authRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api', catalogRoutes)
app.use('/api', ordersRoutes)

// --- Static frontend ---
if (fs.existsSync(config.staticDir)) {
  app.use(express.static(config.staticDir, { extensions: ['html'] }))
  // SPA fallback (anything not /api and not a real file)
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(path.join(config.staticDir, 'index.html'))
  })
} else {
  app.get('/', (_req, res) => res.type('text/plain').send('AgroSmart API running. STATIC_DIR not found: ' + config.staticDir))
}

// 404 for unknown API paths
app.use('/api', (_req, res) => res.status(404).json({ error: 'not_found' }))

// error handler
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'server_error', message: err.message })
})

async function start() {
  try {
    await migrate()
    console.log('✔ database schema ready')
  } catch (e) {
    console.error('⚠ could not reach MySQL — start it and check .env. Error:', e.message)
  }
  app.listen(config.port, () => {
    console.log(`AgroSmart Rwanda backend on http://localhost:${config.port} (${config.nodeEnv})`)
    console.log(`Serving frontend from ${config.staticDir}`)
  })
}

start()
