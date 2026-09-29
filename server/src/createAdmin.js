// Create or promote a real administrator. No demo/default credentials.
// Usage:  npm run create-admin -- <email> <password> [name]
// Falls back to ADMIN_* environment variables when args are omitted.
const bcrypt = require('bcryptjs')
const { pool, migrate, query } = require('./db')
const config = require('./config')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function main() {
  const [email, password, name] = process.argv.slice(2)
  const em = (email || config.seedAdmin.email || '').trim().toLowerCase()
  const pw = password || config.seedAdmin.password || ''
  const nm = (name || config.seedAdmin.name || 'Admin').trim()

  if (!em || !pw) {
    console.error('Usage: npm run create-admin -- <email> <password> [name]')
    console.error('   (or set ADMIN_EMAIL / ADMIN_PASSWORD in .env)')
    process.exit(1)
  }
  if (!EMAIL_RE.test(em)) {
    console.error('✖ invalid email address')
    process.exit(1)
  }
  if (String(pw).length < 8) {
    console.error('✖ password too short — use at least 8 characters for an admin')
    process.exit(1)
  }

  await migrate()
  const hash = await bcrypt.hash(String(pw), 10)
  await query(
    `INSERT INTO users (email, password_hash, name, role, auth_provider)
     VALUES ($1, $2, $3, 'admin', 'password')
     ON CONFLICT (email) DO UPDATE SET
       role = 'admin',
       name = COALESCE(NULLIF(EXCLUDED.name, ''), users.name),
       password_hash = EXCLUDED.password_hash`,
    [em, hash, nm]
  )
  console.log(`✔ administrator ready — email ${em}`)
  await pool.end()
}

main().catch(err => { console.error('create-admin failed:', err.message); process.exit(1) })
