// `npm run seed` — apply schema, seed catalog/theme/provider and ensure an admin.
// Catalog rows use INSERT IGNORE so re-seeding never clobbers admin edits.
const bcrypt = require('bcryptjs')
const { pool, migrate, query } = require('./db')
const { loadStaticData } = require('./staticData')
const config = require('./config')

async function seedCatalog() {
  const { products, categories } = loadStaticData()

  for (let i = 0; i < categories.length; i++) {
    const c = categories[i]
    await query(
      `INSERT IGNORE INTO categories (id, en, rw, emoji, hidden, sort) VALUES (?,?,?,?,0,?)`,
      [c.id, c.en || c.id, c.rw || c.en || c.id, c.emoji || '🧺', i]
    )
  }

  for (let i = 0; i < products.length; i++) {
    const p = products[i]
    const unit = p.unit || {}
    await query(
      `INSERT IGNORE INTO products (id, cat, en, rw, price, unit_en, unit_rw, emoji, img, hidden, sort)
       VALUES (?,?,?,?,?,?,?,?,?,0,?)`,
      [
        p.id, p.cat || 'seeds', p.en || p.id, p.rw || p.en || p.id,
        Number(p.price) || 0, unit.en || 'piece', unit.rw || 'igikoresho 1',
        p.emoji || '', p.img || '', i
      ]
    )
  }
  return { products: products.length, categories: categories.length }
}

async function seedSingletons() {
  await query(
    `INSERT IGNORE INTO theme (id, data) VALUES ('site', ?)`,
    [JSON.stringify({ id: 'site', titleEn: '', titleRw: '', subEn: '', subRw: '', font: '', accent: '', icon: '', logo: '' })]
  )
  await query(
    `INSERT IGNORE INTO provider (id, mode, model, research_online) VALUES ('current', ?, ?, 0)`,
    [config.openai.key ? 'remote' : 'builtin', config.openai.model]
  )
}

async function seedAdmin() {
  const admins = await query(`SELECT id FROM users WHERE role='admin' LIMIT 1`)
  if (admins.length) return { created: false }
  const a = config.seedAdmin
  const hash = await bcrypt.hash(a.password, 10)
  await query(
    `INSERT INTO users (national_id, phone, password_hash, name, role) VALUES (?,?,?,?, 'admin')
     ON DUPLICATE KEY UPDATE role='admin', password_hash=VALUES(password_hash)`,
    [a.nationalId, a.phone, hash, a.name]
  )
  return { created: true, nationalId: a.nationalId }
}

async function main() {
  await migrate()
  console.log('✔ schema applied')
  const cat = await seedCatalog()
  console.log(`✔ catalog seeded (${cat.products} products, ${cat.categories} categories)`)
  await seedSingletons()
  console.log('✔ theme + provider seeded')
  const admin = await seedAdmin()
  console.log(admin.created
    ? `✔ admin created (national ID ${admin.nationalId}) — set ADMIN_PASSWORD in .env`
    : '✔ admin already exists (left untouched)')
  await pool.end()
}

main().catch(err => { console.error('seed failed:', err); process.exit(1) })
