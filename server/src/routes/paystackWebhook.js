// Paystack webhook — the authoritative payment confirmation. Mounted PUBLIC (no
// auth) with express.raw() so we can verify the HMAC-SHA512 signature over the
// untouched body. On a verified `charge.success` we mark the matching order paid
// (idempotent). Always respond 200 quickly so Paystack does not retry.
const express = require('express')
const paystack = require('../paystack')
const { markOrderPaid } = require('../payments')

const router = express.Router()

router.post('/', async (req, res) => {
  const signature = req.get('x-paystack-signature')
  const raw = req.body // Buffer (express.raw)
  if (!paystack.verifyWebhookSignature(raw, signature)) {
    return res.status(400).send('invalid_signature')
  }

  let event
  try {
    event = JSON.parse(raw.toString('utf8'))
  } catch (e) {
    return res.status(400).send('bad_json')
  }

  try {
    if (event && event.event === 'charge.success') {
      const d = event.data || {}
      if (d.status === 'success' && d.reference) {
        await markOrderPaid(d.reference, {
          gatewayRef: d.id,
          gatewayResponse: d.gateway_response || '',
          amount: d.amount
        })
      }
    }
  } catch (e) {
    // Log but still 200: Paystack retries on non-2xx, and a DB hiccup should not
    // make it think the event was rejected. The client verify path is a backup.
    console.error('[paystack-webhook] handling failed:', e.message)
  }

  res.sendStatus(200)
})

module.exports = router
