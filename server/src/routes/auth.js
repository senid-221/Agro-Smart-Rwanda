const express = require('express')
const bcrypt = require('bcryptjs')
const { query } = require('../db')
const { sign, requireAuth, publicUser } = require('../middleware/auth')

const router = express.Router()

const clean = s => String(s == null ? '' : s).trim()
const normPhone = s => clean(s).replace(/[\s-]/g, '')

function findByNationalId(nationalId) {
  return query('SELECT * FROM users WHERE national_id = ? LIMIT 1', [nationalId])
    .then(rows => rows[0] || null)
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const nationalId = clean(req.body.nationalId || req.body.id)
  const phone = normPhone(req.body.phone)
  const password = String(req.body.password || '')
  const name = clean(req.body.name)

  if (!nationalId) return res.status(400).json({ error: 'no_id' })
  if (!/^(\+?250|0)7\d{8}$/.test(phone)) return res.status(400).json({ error: 'bad_phone' })
  if (password.length < 4) return res.status(400).json({ error: 'weak_password' })

  const existing = await findByNationalId(nationalId)
  if (existing) return res.status(409).json({ error: 'exists' })

  const hash = await bcrypt.hash(password, 10)
  const result = await query(
    `INSERT INTO users (national_id, phone, password_hash, name, role) VALUES (?,?,?,?, 'user')`,
    [nationalId, phone, hash, name]
  )
  const row = await query('SELECT * FROM users WHERE id = ? LIMIT 1', [result.insertId])
  const user = publicUser(row[0])
  res.json({ token: sign(user && { id: result.insertId, role: 'user' }), user })
})

// POST /api/auth/login  (also used by the admin tab; admin:true requires role)
router.post('/login', async (req, res) => {
  const nationalId = clean(req.body.nationalId || req.body.id)
  const phone = normPhone(req.body.phone)
  const password = String(req.body.password || req.body.pin || '')
  const wantAdmin = !!req.body.admin

  if (!nationalId || !phone) return res.status(400).json({ error: 'missing' })

  const row = await findByNationalId(nationalId)
  if (!row || row.phone !== phone) return res.status(404).json({ error: 'notfound' })

  const ok = await bcrypt.compare(password, row.password_hash)
  if (!ok) return res.status(401).json({ error: wantAdmin ? 'badpin' : 'badpass' })
  if (wantAdmin && row.role !== 'admin') return res.status(403).json({ error: 'badpin' })

  const user = publicUser(row)
  res.json({ token: sign({ id: row.id, role: row.role }), user })
})

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  const rows = await query('SELECT * FROM users WHERE id = ? LIMIT 1', [req.user.id])
  if (!rows[0]) return res.status(404).json({ error: 'notfound' })
  res.json({ user: publicUser(rows[0]) })
})

module.exports = router
