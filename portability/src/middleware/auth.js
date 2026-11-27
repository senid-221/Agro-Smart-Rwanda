const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const config = require('../config')

function signAdmin(admin) {
  return jwt.sign({ sub: 'admin', role: 'admin', email: admin.email }, config.jwt.secret, {
    expiresIn: config.jwt.expires
  })
}

function readToken(req) {
  const h = req.headers.authorization || ''
  return h.startsWith('Bearer ') ? h.slice(7).trim() : null
}

// Attaches req.user = { role, email } when a valid token is present; never blocks.
function attach(req, _res, next) {
  const token = readToken(req)
  if (token) {
    try {
      const payload = jwt.verify(token, config.jwt.secret)
      req.user = { role: payload.role, email: payload.email || '' }
    } catch (e) { req.user = null }
  }
  next()
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'unauthorized' })
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' })
  next()
}

// Constant-time comparison of two secrets (hashing first equalises lengths).
function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a || '')).digest()
  const hb = crypto.createHash('sha256').update(String(b || '')).digest()
  return crypto.timingSafeEqual(ha, hb)
}

module.exports = { signAdmin, attach, requireAdmin, safeEqual }
