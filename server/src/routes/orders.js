const express = require('express')
const { query, parseJson } = require('../db')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

function shapeOrder(r) {
  return {
    id: 'ORD-' + String(r.id).padStart(5, '0'),
    items: parseJson(r.items, []),
    total: r.total,
    status: r.status,
    user: r.user_id,
    at: new Date(r.created_at).getTime()
  }
}

// GET /api/cart
router.get('/cart', async (req, res) => {
  const rows = await query('SELECT items FROM carts WHERE user_id = ? LIMIT 1', [req.user.id])
  res.json(rows[0] ? parseJson(rows[0].items, []) : [])
})

// PUT /api/cart
router.put('/cart', async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : []
  await query(
    `INSERT INTO carts (user_id, items) VALUES (?,?)
     ON DUPLICATE KEY UPDATE items = VALUES(items)`,
    [req.user.id, JSON.stringify(items)]
  )
  res.json({ ok: true, items })
})

// POST /api/orders
router.post('/orders', async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : []
  if (!items.length) return res.status(400).json({ error: 'empty' })
  const total = Number(req.body.total) || 0
  const result = await query(
    `INSERT INTO orders (user_id, items, total, status) VALUES (?,?,?, 'received')`,
    [req.user.id, JSON.stringify(items), total]
  )
  await query('DELETE FROM carts WHERE user_id = ?', [req.user.id])
  const rows = await query('SELECT * FROM orders WHERE id = ? LIMIT 1', [result.insertId])
  res.json(shapeOrder(rows[0]))
})

// GET /api/orders  (admin sees all, users see their own)
router.get('/orders', async (req, res) => {
  const admin = req.user.role === 'admin'
  const rows = admin
    ? await query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 200')
    : await query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 200', [req.user.id])
  res.json(rows.map(shapeOrder))
})

// POST /api/scans
router.post('/scans', async (req, res) => {
  const b = req.body || {}
  await query(
    `INSERT INTO scans (user_id, crop, disease, confidence, meta) VALUES (?,?,?,?,?)`,
    [req.user.id, b.crop || null, b.disease || null, Number(b.confidence) || null,
      JSON.stringify(b.meta || {})]
  )
  res.json({ ok: true })
})

// GET /api/scans
router.get('/scans', async (req, res) => {
  const rows = await query(
    'SELECT * FROM scans WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [req.user.id])
  res.json(rows.map(r => ({
    id: r.id, crop: r.crop, disease: r.disease, confidence: r.confidence,
    meta: parseJson(r.meta, {}), at: new Date(r.created_at).getTime()
  })))
})

module.exports = router
