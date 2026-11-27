const express = require('express')
const { query } = require('../db')
const config = require('../config')
const {
  OPERATORS, byCode, normalizeMsisdn, operatorFor,
  formatMsisdn, maskMsisdn, newReference, REFERENCE_RE
} = require('../operators')

const router = express.Router()

const ACTIVE_STATUSES = "('submitted','review','approved')"
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function publicOperator(o) {
  return o ? { code: o.code, name: o.name, short: o.short, color: o.color, ink: o.ink, prefixes: o.prefixes } : null
}

function rowToRequest(r) {
  return {
    id: r.id,
    reference: r.reference,
    msisdn: r.msisdn,
    currentOperator: publicOperator(byCode(r.current_operator)),
    newOperator: publicOperator(byCode(r.new_operator)),
    fullName: r.full_name,
    portMobileMoney: r.port_mobile_money,
    status: r.status,
    reason: r.reason || '',
    scheduledFor: r.scheduled_for ? new Date(r.scheduled_for).toISOString().slice(0, 10) : null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    completedAt: r.completed_at
  }
}

// Public view: the tracking page never exposes the national ID.
function publicRequest(r, events) {
  return Object.assign(rowToRequest(r), {
    msisdn: maskMsisdn(r.msisdn),
    events: events || []
  })
}

async function activeFor(msisdn) {
  const rows = await query(
    `SELECT reference, status FROM port_requests
      WHERE msisdn = $1 AND status IN ${ACTIVE_STATUSES}
      ORDER BY id DESC LIMIT 1`,
    [msisdn]
  )
  return rows[0] || null
}

async function lockedFor(msisdn) {
  const rows = await query(
    `SELECT reference, completed_at FROM port_requests
      WHERE msisdn = $1 AND status = 'completed'
        AND completed_at > NOW() - ($2 || ' days')::interval
      ORDER BY completed_at DESC LIMIT 1`,
    [msisdn, config.rules.lockDays]
  )
  return rows[0] || null
}

async function eventsFor(requestId) {
  const rows = await query(
    'SELECT status, note, created_at FROM port_events WHERE request_id = $1 ORDER BY id ASC',
    [requestId]
  )
  return rows.map(r => ({ status: r.status, note: r.note || '', at: r.created_at }))
}

// GET /api/operators — directory used by the wizard and the landing page.
router.get('/operators', (_req, res) => res.json(OPERATORS.map(publicOperator)))

// POST /api/port/check — is this number valid, where does it live, can it move?
router.post('/port/check', async (req, res) => {
  const msisdn = normalizeMsisdn(req.body && req.body.msisdn)
  if (!msisdn) return res.status(400).json({ error: 'bad_number' })

  const operator = operatorFor(msisdn)
  const base = { msisdn, display: formatMsisdn(msisdn), operator: publicOperator(operator) }
  if (!operator) return res.json(Object.assign(base, { eligible: false, reason: 'unknown_prefix' }))

  const active = await activeFor(msisdn)
  if (active) return res.json(Object.assign(base, { eligible: false, reason: 'pending', reference: active.reference }))

  const locked = await lockedFor(msisdn)
  if (locked) return res.json(Object.assign(base, { eligible: false, reason: 'locked' }))

  res.json(Object.assign(base, { eligible: true }))
})

// POST /api/port/requests — submit a port request.
router.post('/port/requests', async (req, res) => {
  const body = req.body || {}
  const msisdn = normalizeMsisdn(body.msisdn)
  if (!msisdn) return res.status(400).json({ error: 'bad_number' })

  const current = operatorFor(msisdn)
  if (!current) return res.status(400).json({ error: 'unknown_prefix' })

  const newOperator = byCode(String(body.newOperator || '').toUpperCase())
  if (!newOperator) return res.status(400).json({ error: 'bad_operator' })
  if (newOperator.code === current.code) return res.status(400).json({ error: 'same_operator' })

  const fullName = String(body.fullName || '').trim().replace(/\s+/g, ' ')
  if (fullName.length < 3 || fullName.length > 140) return res.status(400).json({ error: 'bad_name' })

  const nationalId = String(body.nationalId || '').replace(/\s/g, '')
  if (!/^\d{16}$/.test(nationalId)) return res.status(400).json({ error: 'bad_national_id' })

  const email = String(body.email || '').trim()
  if (email && !EMAIL_RE.test(email)) return res.status(400).json({ error: 'bad_email' })

  const active = await activeFor(msisdn)
  if (active) return res.status(409).json({ error: 'pending', reference: active.reference })
  const locked = await lockedFor(msisdn)
  if (locked) return res.status(409).json({ error: 'locked' })

  const portMobileMoney = body.portMobileMoney !== false

  let inserted = null
  for (let attempt = 0; attempt < 5 && !inserted; attempt++) {
    try {
      const rows = await query(
        `INSERT INTO port_requests
           (reference, msisdn, current_operator, new_operator, national_id, full_name, email, port_mobile_money)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING *`,
        [newReference(), msisdn, current.code, newOperator.code, nationalId, fullName, email, portMobileMoney]
      )
      inserted = rows[0]
    } catch (e) {
      // Reference collision (unique index) — generate another one.
      if (e.code !== '23505') throw e
    }
  }
  if (!inserted) return res.status(500).json({ error: 'reference_error' })

  await query('INSERT INTO port_events (request_id, status, note) VALUES ($1,$2,$3)', [
    inserted.id, 'submitted', ''
  ])

  res.status(201).json(publicRequest(inserted, await eventsFor(inserted.id)))
})

// GET /api/port/requests/:reference — public tracking.
router.get('/port/requests/:reference', async (req, res) => {
  const reference = String(req.params.reference || '').toUpperCase()
  if (!REFERENCE_RE.test(reference)) return res.status(400).json({ error: 'bad_reference' })

  const rows = await query('SELECT * FROM port_requests WHERE reference = $1', [reference])
  if (!rows[0]) return res.status(404).json({ error: 'not_found' })
  res.json(publicRequest(rows[0], await eventsFor(rows[0].id)))
})

// GET /api/port/lookup?msisdn= — latest request for a number (reference + status only).
router.get('/port/lookup', async (req, res) => {
  const msisdn = normalizeMsisdn(req.query.msisdn)
  if (!msisdn) return res.status(400).json({ error: 'bad_number' })

  const rows = await query(
    'SELECT reference, status, created_at FROM port_requests WHERE msisdn = $1 ORDER BY id DESC LIMIT 1',
    [msisdn]
  )
  if (!rows[0]) return res.status(404).json({ error: 'not_found' })
  res.json({ reference: rows[0].reference, status: rows[0].status, createdAt: rows[0].created_at })
})

module.exports = router
module.exports.rowToRequest = rowToRequest
module.exports.publicRequest = publicRequest
module.exports.eventsFor = eventsFor
