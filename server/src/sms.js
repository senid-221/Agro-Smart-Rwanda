// Africa's Talking SMS sender (plain HTTP, no SDK dependency).
// Credentials live only in server/.env: AT_USERNAME, AT_API_KEY, optional AT_SENDER_ID.
const config = require('./config')

// Normalize a Rwandan number to the international form Africa's Talking expects (+2507XXXXXXXX).
function toInternational(phone) {
  const p = String(phone || '').replace(/[^\d+]/g, '')
  if (p.startsWith('+250')) return p
  if (p.startsWith('250')) return '+' + p
  if (p.startsWith('0')) return '+250' + p.slice(1)
  return '+250' + p
}

function isConfigured() {
  return !!(config.sms.username && config.sms.apiKey)
}

// Send an SMS. Resolves { ok:true } on success, or { ok:false, error } — never throws.
async function sendSms(phone, message) {
  if (!isConfigured()) return { ok: false, error: 'sms_unconfigured' }
  const to = toInternational(phone)
  const body = new URLSearchParams({
    username: config.sms.username,
    to,
    message
  })
  if (config.sms.senderId) body.set('from', config.sms.senderId)

  try {
    const res = await fetch(config.sms.apiUrl, {
      method: 'POST',
      headers: {
        apiKey: config.sms.apiKey,
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    })
    const data = await res.json().catch(() => null)
    const recipient = data && data.SMSMessageData && data.SMSMessageData.Recipients && data.SMSMessageData.Recipients[0]
    // statusCode 101 == success (queued/sent).
    if (res.ok && recipient && recipient.statusCode === 101) return { ok: true }
    const detail = (recipient && recipient.status) || (data && data.SMSMessageData && data.SMSMessageData.Message) || ('http_' + res.status)
    return { ok: false, error: 'sms_failed', detail }
  } catch (e) {
    return { ok: false, error: 'sms_failed', detail: (e && e.message) || 'network' }
  }
}

module.exports = { sendSms, isConfigured, toInternational }
