const express = require('express')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const { query } = require('../db')
const config = require('../config')
const { sign, requireAuth, publicUser } = require('../middleware/auth')

const router = express.Router()

const clean = s => String(s == null ? '' : s).trim()
const normPhone = s => clean(s).replace(/[\s-]/g, '')
const normEmail = s => clean(s).toLowerCase()
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// A Rwandan national ID is 16 digits; a mobile number is 07xxxxxxxx / +2507xxxxxxxx.
const NATIONAL_ID_RE = /^\d{16}$/
const PHONE_RE = /^(\+?250|0)7\d{8}$/
const PASSCODE_RE = /^\d{6}$/

// Google Identity Services verification client (lazy: the server still boots and
// email auth still works if google-auth-library is not installed yet).
let _googleClient = null
function getGoogleClient() {
  if (!_googleClient) {
    const { OAuth2Client } = require('google-auth-library')
    _googleClient = new OAuth2Client()
  }
  return _googleClient
}

async function findByEmail(email) {
  const rows = await query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email])
  return rows[0] || null
}

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

// POST /api/auth/signup  — email + password (phone optional, enables OTP reset).
router.post('/signup', async (req, res) => {
  const email = normEmail(req.body.email)
  const password = String(req.body.password || '')
  const name = clean(req.body.name)
  const phone = normPhone(req.body.phone)

  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'bad_email' })
  if (password.length < 6) return res.status(400).json({ error: 'weak_password' })
  if (phone && !/^(\+?250|0)7\d{8}$/.test(phone)) return res.status(400).json({ error: 'bad_phone' })

  const existing = await findByEmail(email)
  if (existing) return res.status(409).json({ error: 'exists' })

  const hash = await bcrypt.hash(password, 10)
  const inserted = await query(
    `INSERT INTO users (email, password_hash, name, phone, auth_provider, role)
     VALUES ($1, $2, $3, $4, 'password', 'user') RETURNING *`,
    [email, hash, name, phone || null]
  )
  const row = inserted[0]
  res.json({ token: sign({ id: row.id, role: row.role }), user: publicUser(row) })
})

// POST /api/auth/register  — National ID + mobile number + 6-digit passcode.
// This is the farmer-facing sign-up: no email is required, and the resulting
// account signs in with phone + passcode only.
router.post('/register', async (req, res) => {
  const nationalId = clean(req.body.nationalId || req.body.id)
  const phone = normPhone(req.body.phone)
  const passcode = String(req.body.passcode || req.body.pin || '')
  const name = clean(req.body.name)

  if (!NATIONAL_ID_RE.test(nationalId)) return res.status(400).json({ error: 'bad_id' })
  if (!PHONE_RE.test(phone)) return res.status(400).json({ error: 'bad_phone' })
  if (!PASSCODE_RE.test(passcode)) return res.status(400).json({ error: 'weak_password' })

  // national_id is UNIQUE in the schema.
  if (await findByNationalId(nationalId)) return res.status(409).json({ error: 'exists' })

  const hash = await bcrypt.hash(passcode, 10)
  const inserted = await query(
    `INSERT INTO users (national_id, phone, password_hash, name, auth_provider, role)
     VALUES ($1, $2, $3, $4, 'password', 'user') RETURNING *`,
    [nationalId, phone, hash, name]
  )
  const row = inserted[0]
  res.json({ token: sign({ id: row.id, role: row.role }), user: publicUser(row) })
})

// POST /api/auth/login  — email + password (primary). Legacy national ID + phone
// is still accepted so older/seeded accounts are not locked out. admin:true
// additionally requires the admin role.
router.post('/login', async (req, res) => {
  const wantAdmin = !!req.body.admin
  const password = String(req.body.password || req.body.pin || '')
  const email = normEmail(req.body.email)

  if (email) {
    const row = await findByEmail(email)
    if (!row) return res.status(404).json({ error: 'notfound' })
    // A Google-only account has no password — it must sign in with Google.
    if (!row.password_hash) return res.status(400).json({ error: 'google_only' })
    const ok = await bcrypt.compare(password, row.password_hash)
    if (!ok) return res.status(401).json({ error: wantAdmin ? 'badpin' : 'badpass' })
    if (wantAdmin && row.role !== 'admin') return res.status(403).json({ error: 'badpin' })
    return res.json({ token: sign({ id: row.id, role: row.role }), user: publicUser(row) })
  }

  const nationalId = clean(req.body.nationalId || req.body.id)
  const phone = normPhone(req.body.phone)

  // Phone + passcode: the primary login for National-ID-registered farmers.
  if (phone && !nationalId) {
    if (!PHONE_RE.test(phone)) return res.status(400).json({ error: 'bad_phone' })
    const row = await findByPhone(phone)
    if (!row) return res.status(404).json({ error: 'notfound' })
    // A Google-only account has no passcode — it must sign in with Google.
    if (!row.password_hash) return res.status(400).json({ error: 'google_only' })
    const ok = await bcrypt.compare(password, row.password_hash)
    if (!ok) return res.status(401).json({ error: wantAdmin ? 'badpin' : 'badpass' })
    if (wantAdmin && row.role !== 'admin') return res.status(403).json({ error: 'badpin' })
    return res.json({ token: sign({ id: row.id, role: row.role }), user: publicUser(row) })
  }

  if (!nationalId || !phone) return res.status(400).json({ error: 'missing' })

  const row = await findByNationalId(nationalId)
  if (!row || row.phone !== phone) return res.status(404).json({ error: 'notfound' })
  if (!row.password_hash) return res.status(401).json({ error: wantAdmin ? 'badpin' : 'badpass' })

  const ok = await bcrypt.compare(password, row.password_hash)
  if (!ok) return res.status(401).json({ error: wantAdmin ? 'badpin' : 'badpass' })
  if (wantAdmin && row.role !== 'admin') return res.status(403).json({ error: 'badpin' })

  res.json({ token: sign({ id: row.id, role: row.role }), user: publicUser(row) })
})

// GET /api/auth/config — public bootstrap info for the login screen.
// The Google client ID is a public value (it ships to the browser anyway); the
// app hides the Google button when it is blank.
router.get('/config', (_req, res) => {
  res.json({ googleClientId: config.google.clientId || '' })
})

// POST /api/auth/google  { idToken } — "Sign in with Google".
// Verifies the Google ID token, then finds/links/creates the user and issues the
// same JWT the rest of the app uses. Never trusts the client for identity.
router.post('/google', async (req, res) => {
  const idToken = String(req.body.idToken || req.body.credential || '')
  if (!idToken) return res.status(400).json({ error: 'missing' })
  if (!config.google.clientId) return res.status(503).json({ error: 'google_unconfigured' })

  let payload
  try {
    const ticket = await getGoogleClient().verifyIdToken({
      idToken, audience: config.google.clientId
    })
    payload = ticket.getPayload()
  } catch (err) {
    if (err && err.code === 'MODULE_NOT_FOUND') {
      return res.status(503).json({ error: 'google_unavailable' })
    }
    return res.status(401).json({ error: 'google_invalid' })
  }
  if (!payload || payload.email_verified === false) {
    return res.status(401).json({ error: 'google_invalid' })
  }

  const googleId = String(payload.sub || '')
  const email = normEmail(payload.email || '')
  if (!googleId || !EMAIL_RE.test(email)) return res.status(400).json({ error: 'google_no_email' })
  const name = clean(payload.name || '')
  const avatar = String(payload.picture || '')

  try {
    // 1) existing Google identity
    let rows = await query('SELECT * FROM users WHERE google_id = $1 LIMIT 1', [googleId])
    let row = rows[0]

    // 2) existing account with this (verified) email → link Google to it
    if (!row) {
      rows = await query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email])
      if (rows[0]) {
        const linked = await query(
          `UPDATE users
           SET google_id = $2,
               avatar = CASE WHEN avatar = '' THEN $3 ELSE avatar END,
               name   = CASE WHEN name   = '' THEN $4 ELSE name   END
           WHERE id = $1 RETURNING *`,
          [rows[0].id, googleId, avatar, name]
        )
        row = linked[0]
      }
    }

    // 3) brand-new Google user
    if (!row) {
      const inserted = await query(
        `INSERT INTO users (email, google_id, name, avatar, auth_provider, role)
         VALUES ($1, $2, $3, $4, 'google', 'user') RETURNING *`,
        [email, googleId, name, avatar]
      )
      row = inserted[0]
    }

    res.json({ token: sign({ id: row.id, role: row.role }), user: publicUser(row) })
  } catch (err) {
    res.status(500).json({ error: 'google_failed', message: err.message })
  }
})

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  const rows = await query('SELECT * FROM users WHERE id = $1 LIMIT 1', [req.user.id])
  if (!rows[0]) return res.status(404).json({ error: 'notfound' })
  res.json({ user: publicUser(rows[0]) })
})

// POST /api/auth/forgot  — start a reset: generate a random 6-digit OTP for the
// registered phone and return it to the app (no SMS provider; the app shows the code).
router.post('/forgot', async (req, res) => {
  const phone = normPhone(req.body.phone)
  if (!/^(\+?250|0)7\d{8}$/.test(phone)) return res.status(400).json({ error: 'bad_phone' })

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

  res.json({ sent: true, code, expiresSec: config.reset.otpTtlSec })
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
