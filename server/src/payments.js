// Shared payment bookkeeping for store orders. Both the Paystack webhook (the
// authoritative confirmation) and the client's post-redirect verify call funnel
// through markOrderPaid(), which is idempotent so a duplicate webhook or a
// double verify never double-counts. An order only becomes 'received' / 'paid'
// here — never on the client's say-so.
const { query } = require('./db')

async function markOrderPaid(reference, info = {}) {
  if (!reference) return null
  const rows = await query('SELECT id, payment_status FROM orders WHERE reference = $1 LIMIT 1', [reference])
  const order = rows[0]
  if (!order) return null
  if (order.payment_status === 'paid') return order // already confirmed — idempotent
  await query(
    `UPDATE orders
        SET status = 'received',
            payment_status = 'paid',
            paid_at = NOW(),
            gateway = COALESCE(gateway, 'paystack'),
            gateway_ref = $2,
            gateway_response = $3,
            amount_paid = $4
      WHERE id = $1`,
    [
      order.id,
      info.gatewayRef ? String(info.gatewayRef).slice(0, 64) : null,
      info.gatewayResponse ? String(info.gatewayResponse).slice(0, 255) : null,
      Number.isFinite(Number(info.amount)) ? Math.round(Number(info.amount)) : null
    ]
  )
  return order
}

// Mark an order's payment as failed (used when a verify comes back unsuccessful).
// Never overwrites a paid order.
async function markOrderFailed(reference) {
  if (!reference) return null
  const rows = await query('SELECT id, payment_status FROM orders WHERE reference = $1 LIMIT 1', [reference])
  const order = rows[0]
  if (!order || order.payment_status === 'paid') return order
  await query(`UPDATE orders SET payment_status = 'failed' WHERE id = $1`, [order.id])
  return order
}

module.exports = { markOrderPaid, markOrderFailed }
