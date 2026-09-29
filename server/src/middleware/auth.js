const jwt = require('jsonwebtoken')
const config = require('../config')

function sign(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwt.secret, {
    expiresIn: config.jwt.expires
  })
}

function readToken(req) {
  const h = req.headers.authorization || ''
  if (h.startsWith('Bearer ')) return h.slice(7).trim()
  return null
}

// Attaches req.user = { id, role } when a valid token is present; never blocks.
function attach(req, _res, next) {
  const token = readToken(req)
  if (token) {
    try {
      const payload = jwt.verify(token, config.jwt.secret)
      req.user = { id: payload.sub, role: payload.role }
    } catch (e) { req.user = null }
  }
  next()
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'unauthorized' })
  next()
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'unauthorized' })
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' })
  next()
}

// The client shows users by email (falling back to national ID for legacy
// accounts); the JWT carries the row id. Google accounts include their avatar.
function publicUser(row) {
  return {
    id: row.email || row.national_id || '',
    email: row.email || '',
    phone: row.phone || '',
    role: row.role,
    name: row.name || '',
    avatar: row.avatar || '',
    provider: row.auth_provider || 'password'
  }
}

module.exports = { sign, attach, requireAuth, requireAdmin, publicUser }
