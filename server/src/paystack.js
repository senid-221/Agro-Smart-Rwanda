// Paystack client — the secret key lives ONLY here on the server (config.paystack),
// never in the shipped app. Used to collect real RWF for store orders via MTN MoMo /
// Airtel Money / card. RWF is a zero-decimal currency on Paystack, so `amount` is the
// whole-RWF integer (NOT multiplied by 100). The same secret key signs the inbound
// webhook (HMAC-SHA512 of the raw request body), verified with verifyWebhookSignature().
const crypto = require('crypto')
const config = require('./config')

function isConfigured() {
  return !!config.paystack.secretKey
}

async function call(path, { method = 'GET', body } = {}) {
  if (!isConfigured()) {
    const err = new Error('PAYSTACK_SECRET_KEY is not configured on the server')
    err.code = 'no_key'
    throw err
  }
  const res = await fetch(config.paystack.baseUrl + path, {
    method,
    headers: {
      'Authorization': `Bearer ${config.paystack.secretKey}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  })
  const data = await res.json().catch(() => null)
  // Paystack returns { status: true|false, message, data } for every call.
  if (!res.ok || !data || data.status === false) {
    const err = new Error((data && data.message) || `Paystack HTTP ${res.status}`)
    err.status = res.status
    err.code = 'paystack'
    err.detail = data ? JSON.stringify(data).slice(0, 300) : ''
    console.error(`[paystack] ${method} ${path} failed (${res.status}):`, err.message)
    throw err
  }
  return data.data
}

// Start a charge. Returns { authorization_url, access_code, reference }.
// Redirect the customer to authorization_url to complete the payment.
async function initialize({ email, amount, reference, callbackUrl, metadata, channels }) {
  const body = {
    email,
    amount: Math.round(Number(amount)), // whole RWF
    currency: config.paystack.currency,
    reference,
    callback_url: callbackUrl
  }
  if (metadata) body.metadata = metadata
  const ch = (channels && channels.length ? channels : config.paystack.channels)
  if (ch && ch.length) body.channels = ch
  return call('/transaction/initialize', { method: 'POST', body })
}

// Authoritative check of a transaction by our reference. Returns the Paystack
// transaction object ({ status, amount, currency, reference, gateway_response, ... }).
async function verify(reference) {
  return call('/transaction/verify/' + encodeURIComponent(reference))
}

// Verify the x-paystack-signature header (HMAC-SHA512 of the RAW body, hex) using
// the secret key. rawBody must be the untouched request body (Buffer or string).
function verifyWebhookSignature(rawBody, signature) {
  if (!isConfigured() || !signature) return false
  const expected = crypto
    .createHmac('sha512', config.paystack.secretKey)
    .update(rawBody)
    .digest('hex')
  const a = Buffer.from(String(signature))
  const b = Buffer.from(expected)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

module.exports = { isConfigured, initialize, verify, verifyWebhookSignature }
