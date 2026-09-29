// Remove the old prototype demo account(s) and their data. Store products,
// categories, theme and AI training are NEVER touched.
// Usage:  npm run remove-demo            (removes the known demo national ID)
//         npm run remove-demo -- <id> …  (remove specific national IDs)
const { pool, migrate, query } = require('./db')

const DEFAULT_DEMO_IDS = ['1199080000000000']

async function main() {
  const ids = process.argv.slice(2).filter(Boolean)
  const targets = ids.length ? ids : DEFAULT_DEMO_IDS

  await migrate()
  const rows = await query(
    `SELECT id, national_id, phone, role FROM users WHERE national_id = ANY($1::varchar[])`,
    [targets]
  )
  if (!rows.length) {
    console.log('✔ no demo accounts found — nothing to remove')
    await pool.end()
    return
  }
  const userIds = rows.map(r => r.id)
  await query('DELETE FROM carts  WHERE user_id = ANY($1::int[])', [userIds])
  await query('DELETE FROM scans  WHERE user_id = ANY($1::int[])', [userIds])
  await query('DELETE FROM orders WHERE user_id = ANY($1::int[])', [userIds])
  await query('DELETE FROM users  WHERE id      = ANY($1::int[])', [userIds])

  rows.forEach(r => console.log(`✔ removed ${r.role} account ${r.national_id} (${r.phone})`))
  console.log(`✔ ${rows.length} demo account(s) deleted — store catalog untouched`)
  await pool.end()
}

main().catch(err => { console.error('remove-demo failed:', err.message); process.exit(1) })
