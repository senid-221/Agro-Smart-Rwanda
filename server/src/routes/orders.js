const express = require('express')
const crypto = require('crypto')
const config = require('../config')
const paystack = require('../paystack')
const { markOrderPaid, markOrderFailed } = require('../payments')
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
    at: new Date(r.created_at).getTime(),
    reference: r.reference || '',
    paymentStatus: r.payment_status || 'unpaid',
    amountPaid: r.amount_paid == null ? null : r.amount_paid,
    paidAt: r.paid_at ? new Date(r.paid_at).getTime() : null
  }
}

// A unique, URL-safe payment reference for one order attempt.
function newReference(orderId) {
  return `AGRO-${orderId}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
}

// Paystack requires a customer email. Prefer the account's real email; for
// phone/national-ID-only farmers, derive a stable placeholder so the charge can
// still be created (it is only a customer identifier, not a delivery address).
async function customerEmail(userId, reference) {
  const u = (await query('SELECT email, phone, national_id FROM users WHERE id = $1', [userId]))[0] || {}
  if (u.email) return u.email
  const local = String(u.phone || u.national_id || ('user' + userId)).replace(/[^a-z0-9]/gi, '')
  return `${local || reference}@orders.agrosmart.rw`
}


// GET /api/cart
router.get('/cart', async (req, res) => {
  const rows = await query('SELECT items FROM carts WHERE user_id = $1 LIMIT 1', [req.user.id])
  res.json(rows[0] ? parseJson(rows[0].items, []) : [])
})

// PUT /api/cart
router.put('/cart', async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : []
  await query(
    `INSERT INTO carts (user_id, items, updated_at) VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (user_id) DO UPDATE SET items = EXCLUDED.items, updated_at = NOW()`,
    [req.user.id, JSON.stringify(items)]
  )
  res.json({ ok: true, items })
})

// POST /api/orders
// When Paystack is configured this creates a `pending` order and returns a hosted
// checkout URL (real MTN MoMo / Airtel Money / card charge). The order only becomes
// `received` / `paid` after Paystack confirms the charge (webhook or verify). When
// Paystack is NOT configured it falls back to the honest record-intent behaviour
// (status `received`, no charge) — it never pretends a payment happened.
router.post('/orders', async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : []
  if (!items.length) return res.status(400).json({ error: 'empty' })
  const total = Math.round(Number(req.body.total) || 0)
  const charging = paystack.isConfigured() && total > 0

  const inserted = await query(
    `INSERT INTO orders (user_id, items, total, status, payment_status, gateway)
     VALUES ($1, $2::jsonb, $3, $4, $5, $6) RETURNING *`,
    [req.user.id, JSON.stringify(items), total,
      charging ? 'pending' : 'received',
      charging ? 'unpaid' : 'unpaid',
      charging ? 'paystack' : null]
  )
  const order = inserted[0]
  await query('DELETE FROM carts WHERE user_id = $1', [req.user.id])

  if (!charging) {
    return res.json({ ...shapeOrder(order), payment: { configured: false } })
  }

  const reference = newReference(order.id)
  await query('UPDATE orders SET reference = $2 WHERE id = $1', [order.id, reference])
  order.reference = reference

  try {
    const email = await customerEmail(req.user.id, reference)
    const init = await paystack.initialize({
      email,
      amount: total,
      reference,
      callbackUrl: config.paystack.publicUrl.replace(/\/$/, '') + '/',
      metadata: { order_id: order.id, user_id: req.user.id, reference }
    })
    if (!init || !init.authorization_url) throw new Error('no authorization_url from Paystack')
    return res.json({
      ...shapeOrder(order),
      payment: {
        configured: true,
        provider: 'paystack',
        authorizationUrl: init.authorization_url,
        accessCode: init.access_code || '',
        reference
      }
    })
  } catch (e) {
    await markOrderFailed(reference)
    return res.status(502).json({ error: 'payment_init_failed', message: e.message })
  }
})

// POST /api/payments/verify  { reference }
// Client-side confirmation after Paystack redirects the customer back. Asks Paystack
// for the authoritative status and records it. The webhook is the primary path; this
// is the backup for users who return before the webhook lands.
router.post('/payments/verify', async (req, res) => {
  const reference = String((req.body && req.body.reference) || '').trim()
  if (!reference) return res.status(400).json({ error: 'no_reference' })
  if (!paystack.isConfigured()) return res.json({ status: 'not_configured' })

  const rows = await query('SELECT * FROM orders WHERE reference = $1 AND user_id = $2 LIMIT 1', [reference, req.user.id])
  const order = rows[0]
  if (!order) return res.status(404).json({ error: 'not_found' })

  let tx
  try {
    tx = await paystack.verify(reference)
  } catch (e) {
    return res.status(502).json({ error: 'verify_failed', message: e.message })
  }

  const status = (tx && tx.status) || 'failed'
  if (status === 'success') {
    await markOrderPaid(reference, { gatewayRef: tx.id, gatewayResponse: tx.gateway_response || '', amount: tx.amount })
  } else {
    await markOrderFailed(reference)
  }
  const fresh = (await query('SELECT * FROM orders WHERE id = $1', [order.id]))[0]
  res.json({ status, order: shapeOrder(fresh), amount: tx && tx.amount, currency: tx && tx.currency })
})


// GET /api/orders  (admin sees all, users see their own)
router.get('/orders', async (req, res) => {
  const rows = req.user.role === 'admin'
    ? await query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 200')
    : await query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 200', [req.user.id])
  res.json(rows.map(shapeOrder))
})

// POST /api/scans
router.post('/scans', async (req, res) => {
  const b = req.body || {}
  await query(
    `INSERT INTO scans (user_id, crop, disease, confidence, meta)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [req.user.id, b.crop || null, b.disease || null, Number(b.confidence) || null,
      JSON.stringify(b.meta || {})]
  )
  res.json({ ok: true })
})

// GET /api/scans
router.get('/scans', async (req, res) => {
  const rows = await query(
    'SELECT * FROM scans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [req.user.id])
  res.json(rows.map(r => ({
    id: r.id, crop: r.crop, disease: r.disease, confidence: r.confidence,
    meta: parseJson(r.meta, {}), at: new Date(r.created_at).getTime()
  })))
})

module.exports = router
