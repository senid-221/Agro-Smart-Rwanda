const express = require('express')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const { query } = require('../db')
const config = require('../config')
const { sendSms, isConfigured } = require('../sms')
const { sign, requireAuth, publicUser } = require('../middleware/auth')

const router = express.Router()

const clean = s => String(s == null ? '' : s).trim()
const normPhone = s => clean(s).replace(/[\s-]/g, '')

async function findByNationalId(nationalId) {
  const rows = await query('SELECT * FROM users WHERE national_id = $1 LIMIT 1', [nationalId])
  return rows[0] || null
}

// Phone is not guaranteed unique; prefer the most recently created account.
async function findByPhone(phone) {
  const rows = await query(
    'SELECT * FROM users WHERE phone = $1 ORDER BY created_at DESC, id DESC LIMIT 1',
    [phone]
  )
  return rows[0] || null
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
  const inserted = await query(
    `INSERT INTO users (national_id, phone, password_hash, name, role)
     VALUES ($1, $2, $3, $4, 'user') RETURNING *`,
    [nationalId, phone, hash, name]
  )
  const row = inserted[0]
  const user = publicUser(row)
  res.json({ token: sign({ id: row.id, role: row.role }), user })
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
  const rows = await query('SELECT * FROM users WHERE id = $1 LIMIT 1', [req.user.id])
  if (!rows[0]) return res.status(404).json({ error: 'notfound' })
  res.json({ user: publicUser(rows[0]) })
})

// POST /api/auth/forgot  — start a reset: send a 6-digit OTP by SMS to the registered phone.
router.post('/forgot', async (req, res) => {
  const phone = normPhone(req.body.phone)
  if (!/^(\+?250|0)7\d{8}$/.test(phone)) return res.status(400).json({ error: 'bad_phone' })
  if (!isConfigured()) return res.status(503).json({ error: 'sms_unconfigured' })

  const user = await findByPhone(phone)
  if (!user) return res.status(404).json({ error: 'notfound' })

  // Resend cooldown: block if a code was issued very recently.
  const recent = await query(
    `SELECT created_at FROM password_resets
     WHERE user_id = $1 AND consumed = FALSE
     ORDER BY created_at DESC LIMIT 1`,
    [user.id]
  )
  if (recent[0]) {
    const ageSec = (Date.now() - new Date(recent[0].created_at).getTime()) / 1000
    if (ageSec < config.reset.resendCooldownSec) {
      const retry = Math.ceil(config.reset.resendCooldownSec - ageSec)
      return res.status(429).json({ error: 'too_soon', retrySec: retry })
    }
  }

  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0')
  const hash = await bcrypt.hash(code, 10)
  const expires = new Date(Date.now() + config.reset.otpTtlSec * 1000)

  // Invalidate any previous open codes for this user, then store the new one.
  await query('UPDATE password_resets SET consumed = TRUE WHERE user_id = $1 AND consumed = FALSE', [user.id])
  await query(
    `INSERT INTO password_resets (user_id, phone, code_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [user.id, phone, hash, expires]
  )

  const msg = `AgroSmart Rwanda: your password reset code is ${code}. It expires in ${Math.round(config.reset.otpTtlSec / 60)} minutes. Do not share it.`
  const sent = await sendSms(phone, msg)
  if (!sent.ok) return res.status(502).json({ error: sent.error || 'sms_failed' })

  res.json({ sent: true, expiresSec: config.reset.otpTtlSec })
})

// POST /api/auth/verify-otp  — confirm the code; returns a short-lived reset token.
router.post('/verify-otp', async (req, res) => {
  const phone = normPhone(req.body.phone)
  const code = clean(req.body.code)
  if (!phone || !code) return res.status(400).json({ error: 'missing' })

  const rows = await query(
    `SELECT * FROM password_resets
     WHERE phone = $1 AND consumed = FALSE
     ORDER BY created_at DESC LIMIT 1`,
    [phone]
  )
  const reset = rows[0]
  if (!reset) return res.status(400).json({ error: 'otp_expired' })
  if (new Date(reset.expires_at).getTime() < Date.now()) {
    await query('UPDATE password_resets SET consumed = TRUE WHERE id = $1', [reset.id])
    return res.status(400).json({ error: 'otp_expired' })
  }
  if (reset.attempts >= config.reset.otpMaxAttempts) {
    await query('UPDATE password_resets SET consumed = TRUE WHERE id = $1', [reset.id])
    return res.status(400).json({ error: 'otp_expired' })
  }

  const ok = await bcrypt.compare(code, reset.code_hash)
  if (!ok) {
    const attempts = reset.attempts + 1
    const exhausted = attempts >= config.reset.otpMaxAttempts
    await query('UPDATE password_resets SET attempts = $1, consumed = $2 WHERE id = $3',
      [attempts, exhausted, reset.id])
    if (exhausted) return res.status(400).json({ error: 'otp_expired' })
    return res.status(400).json({ error: 'otp_wrong', remaining: config.reset.otpMaxAttempts - attempts })
  }

  await query('UPDATE password_resets SET consumed = TRUE WHERE id = $1', [reset.id])
  const token = jwt.sign({ sub: reset.user_id, purpose: 'reset' }, config.jwt.secret, {
    expiresIn: config.reset.tokenTtlSec
  })
  res.json({ ok: true, token })
})

// POST /api/auth/reset  — set a new 6-digit password using the reset token.
router.post('/reset', async (req, res) => {
  const token = clean(req.body.token)
  const password = String(req.body.password || '')
  if (!token) return res.status(400).json({ error: 'missing' })
  if (!/^\d{6}$/.test(password)) return res.status(400).json({ error: 'weak_password' })

  let payload
  try {
    payload = jwt.verify(token, config.jwt.secret)
  } catch (e) {
    return res.status(400).json({ error: 'token_expired' })
  }
  if (payload.purpose !== 'reset') return res.status(400).json({ error: 'token_expired' })

  const hash = await bcrypt.hash(password, 10)
  const updated = await query('UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING *', [hash, payload.sub])
  if (!updated[0]) return res.status(404).json({ error: 'notfound' })

  // A reset invalidates any other open codes for the account.
  await query('UPDATE password_resets SET consumed = TRUE WHERE user_id = $1 AND consumed = FALSE', [payload.sub])
  res.json({ ok: true })
})

module.exports = router
