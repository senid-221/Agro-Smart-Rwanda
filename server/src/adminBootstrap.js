const bcrypt = require('bcryptjs')
const { query } = require('./db')
const config = require('./config')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Create (or promote) the administrator from ADMIN_EMAIL + ADMIN_PASSWORD.
// Idempotent and safe on every boot: on conflict it only promotes the role and
// fills a blank name — it never overwrites an existing password_hash, so an
// admin who changed their password in-app is not reset by a redeploy.
// Returns the admin email when one was ensured, or null when env is not set.
async function ensureAdminFromEnv() {
  const em = (config.seedAdmin.email || '').trim().toLowerCase()
  const pw = config.seedAdmin.password || ''
  if (!em || !pw) return null
  if (!EMAIL_RE.test(em)) throw new Error('ADMIN_EMAIL is not a valid email address')
  if (String(pw).length < 8) throw new Error('ADMIN_PASSWORD must be at least 8 characters')

  const nm = (config.seedAdmin.name || 'Admin').trim()
  const hash = await bcrypt.hash(String(pw), 10)
  await query(
    `INSERT INTO users (email, password_hash, name, role, auth_provider)
     VALUES ($1, $2, $3, 'admin', 'password')
     ON CONFLICT (email) DO UPDATE SET
       role = 'admin',
       name = COALESCE(NULLIF(EXCLUDED.name, ''), users.name)`,
    [em, hash, nm]
  )
  return em
}

module.exports = { ensureAdminFromEnv }
