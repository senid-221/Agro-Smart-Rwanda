// `npm run seed` — apply schema and seed catalog/theme/provider.
// Catalog rows use ON CONFLICT DO NOTHING so re-seeding never clobbers admin
// edits and NEVER removes store products. No demo accounts are created here;
// create a real administrator with `npm run create-admin` (see createAdmin.js).
const { pool, migrate, query } = require('./db')
const { loadStaticData } = require('./staticData')
const config = require('./config')

async function seedCatalog() {
  const { products, categories } = loadStaticData()

  for (let i = 0; i < categories.length; i++) {
    const c = categories[i]
    await query(
      `INSERT INTO categories (id, en, rw, emoji, hidden, sort)
       VALUES ($1,$2,$3,$4,FALSE,$5) ON CONFLICT (id) DO NOTHING`,
      [c.id, c.en || c.id, c.rw || c.en || c.id, c.emoji || '🧺', i]
    )
  }

  for (let i = 0; i < products.length; i++) {
    const p = products[i]
    const unit = p.unit || {}
    await query(
      `INSERT INTO products (id, cat, en, rw, price, unit_en, unit_rw, emoji, img, hidden, sort)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,FALSE,$10) ON CONFLICT (id) DO NOTHING`,
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
    `INSERT INTO theme (id, data) VALUES ('site', $1::jsonb) ON CONFLICT (id) DO NOTHING`,
    [JSON.stringify({ id: 'site', titleEn: '', titleRw: '', subEn: '', subRw: '', font: '', accent: '', icon: '', logo: '' })]
  )
  await query(
    `INSERT INTO provider (id, mode, model, research_online) VALUES ('current', $1, $2, FALSE)
     ON CONFLICT (id) DO NOTHING`,
    [config.openai.key ? 'remote' : 'builtin', config.openai.model]
  )
}

async function main() {
  await migrate()
  console.log('✔ schema applied (tables, functions, triggers, indexes)')
  const cat = await seedCatalog()
  console.log(`✔ catalog seeded (${cat.products} products, ${cat.categories} categories) — nothing removed`)
  await seedSingletons()
  console.log('✔ theme + provider seeded')
  console.log('→ next: create an administrator with `npm run create-admin <email> <password> [name]`')
  await pool.end()
}

module.exports = { seedCatalog, seedSingletons }

if (require.main === module) {
  main().catch(err => { console.error('seed failed:', err); process.exit(1) })
}

