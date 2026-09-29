// Create or promote a real administrator. No demo/default credentials.
// Usage:  npm run create-admin -- <nationalId> <phone> <password> [name]
// Falls back to ADMIN_* environment variables when args are omitted.
const bcrypt = require('bcryptjs')
const { pool, migrate, query } = require('./db')
const config = require('./config')

const DEMO_IDS = ['1199080000000000']

async function main() {
  const [nationalId, phone, password, name] = process.argv.slice(2)
  const id = (nationalId || config.seedAdmin.nationalId || '').trim()
  const ph = (phone || config.seedAdmin.phone || '').replace(/[\s-]/g, '')
  const pw = password || config.seedAdmin.password || ''
  const nm = (name || config.seedAdmin.name || 'Admin').trim()

  if (!id || !ph || !pw) {
    console.error('Usage: npm run create-admin -- <nationalId> <phone> <password> [name]')
    console.error('   (or set ADMIN_NATIONAL_ID / ADMIN_PHONE / ADMIN_PASSWORD in .env)')
    process.exit(1)
  }
  if (!/^(\+?250|0)7\d{8}$/.test(ph)) {
    console.error('✖ invalid phone — use a Rwandan mobile, e.g. 0788123456')
    process.exit(1)
  }
  if (String(pw).length < 8) {
    console.error('✖ password too short — use at least 8 characters for an admin')
    process.exit(1)
  }
  if (DEMO_IDS.includes(id)) {
    console.error('✖ that national ID is the old demo account — choose a real one')
    process.exit(1)
  }

  await migrate()
  const hash = await bcrypt.hash(String(pw), 10)
  await query(
    `INSERT INTO users (national_id, phone, password_hash, name, role)
     VALUES ($1,$2,$3,$4,'admin')
     ON CONFLICT (national_id) DO UPDATE SET
       role='admin', phone=EXCLUDED.phone, name=EXCLUDED.name, password_hash=EXCLUDED.password_hash`,
    [id, ph, hash, nm]
  )
  console.log(`✔ administrator ready — national ID ${id}, phone ${ph}`)
  await pool.end()
}

main().catch(err => { console.error('create-admin failed:', err.message); process.exit(1) })
