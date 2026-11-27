const express = require('express')
const { query } = require('../db')
const config = require('../config')
const { signAdmin, requireAdmin, safeEqual } = require('../middleware/auth')
const { rowToRequest, eventsFor } = require('./port')

const router = express.Router()

// Allowed status transitions for the back office.
const TRANSITIONS = {
  review:   { from: ['submitted'],                    to: 'review' },
  approve:  { from: ['submitted', 'review'],          to: 'approved' },
  reject:   { from: ['submitted', 'review', 'approved'], to: 'rejected' },
  complete: { from: ['approved'],                     to: 'completed' }
}

// Porting is scheduled for the next working day.
function nextWorkingDay() {
  const d = new Date()
  do { d.setDate(d.getDate() + 1) } while (d.getDay() === 0 || d.getDay() === 6)
  return d.toISOString().slice(0, 10)
}

function adminRow(r) {
  return Object.assign(rowToRequest(r), {
    nationalId: r.national_id,
    email: r.email || ''
  })
}

// POST /api/admin/login
router.post('/login', (req, res) => {
  const email = String((req.body && req.body.email) || '').trim().toLowerCase()
  const password = String((req.body && req.body.password) || '')
  const ok = safeEqual(email, config.admin.email) && safeEqual(password, config.admin.password)
  if (!ok) return res.status(401).json({ error: 'bad_credentials' })
  res.json({
    token: signAdmin({ email: config.admin.email }),
    admin: { email: config.admin.email, name: config.admin.name }
  })
})

// GET /api/admin/me
router.get('/me', requireAdmin, (req, res) => {
  res.json({ email: req.user.email, name: config.admin.name })
})

// GET /api/admin/stats
router.get('/stats', requireAdmin, async (_req, res) => {
  const [byStatus, byOperator, totals] = await Promise.all([
    query('SELECT status, COUNT(*)::int AS n FROM port_requests GROUP BY status'),
    query('SELECT new_operator AS code, COUNT(*)::int AS n FROM port_requests GROUP BY new_operator'),
    query(`SELECT COUNT(*)::int AS total,
                  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::int AS last7
             FROM port_requests`)
  ])
  const statuses = { submitted: 0, review: 0, approved: 0, rejected: 0, completed: 0 }
  byStatus.forEach(r => { statuses[r.status] = r.n })
  res.json({
    total: totals[0].total,
    last7: totals[0].last7,
    byStatus: statuses,
    byOperator: byOperator.map(r => ({ code: r.code, count: r.n }))
  })
})

// GET /api/admin/requests?status=&q=
router.get('/requests', requireAdmin, async (req, res) => {
  const status = String(req.query.status || 'all')
  const q = String(req.query.q || '').trim()
  const params = []
  const where = []

  if (status !== 'all') {
    params.push(status)
    where.push(`status = $${params.length}`)
  }
  if (q) {
    params.push(`%${q}%`)
    where.push(`(reference ILIKE $${params.length} OR msisdn ILIKE $${params.length}
                 OR full_name ILIKE $${params.length} OR national_id ILIKE $${params.length})`)
  }

  const rows = await query(
    `SELECT * FROM port_requests ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY created_at DESC LIMIT 200`,
    params
  )
  res.json(rows.map(adminRow))
})

// GET /api/admin/requests/:id
router.get('/requests/:id', requireAdmin, async (req, res) => {
  const rows = await query('SELECT * FROM port_requests WHERE id = $1', [req.params.id])
  if (!rows[0]) return res.status(404).json({ error: 'not_found' })
  res.json(Object.assign(adminRow(rows[0]), { events: await eventsFor(rows[0].id) }))
})

// PATCH /api/admin/requests/:id  { action, note }
router.patch('/requests/:id', requireAdmin, async (req, res) => {
  const action = String((req.body && req.body.action) || '')
  const note = String((req.body && req.body.note) || '').trim().slice(0, 500)
  const rule = TRANSITIONS[action]
  if (!rule) return res.status(400).json({ error: 'bad_action' })
  if (action === 'reject' && !note) return res.status(400).json({ error: 'reason_required' })

  const rows = await query('SELECT * FROM port_requests WHERE id = $1', [req.params.id])
  const row = rows[0]
  if (!row) return res.status(404).json({ error: 'not_found' })
  if (!rule.from.includes(row.status)) return res.status(409).json({ error: 'bad_transition' })

  const fields = ['status = $1', 'reason = $2', 'updated_at = NOW()']
  const params = [rule.to, action === 'reject' ? note : '']

  if (rule.to === 'approved' && !row.scheduled_for) {
    fields.push('scheduled_for = $' + (params.length + 1))
    params.push(nextWorkingDay())
  }
  if (rule.to === 'completed') fields.push('completed_at = NOW()')

  params.push(row.id)
  const updated = await query(
    `UPDATE port_requests SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params
  )

  await query('INSERT INTO port_events (request_id, status, note) VALUES ($1,$2,$3)', [
    row.id, rule.to, note
  ])

  res.json(Object.assign(adminRow(updated[0]), { events: await eventsFor(row.id) }))
})

module.exports = router
