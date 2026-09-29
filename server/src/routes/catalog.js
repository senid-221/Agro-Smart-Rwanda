const express = require('express')
const { query, parseJson, rowToProduct, rowToCategory } = require('../db')

const router = express.Router()

async function allProducts() {
  const rows = await query('SELECT * FROM products ORDER BY sort ASC, id ASC')
  return rows.map(rowToProduct)
}
async function allCategories() {
  const rows = await query('SELECT * FROM categories ORDER BY sort ASC, id ASC')
  return rows.map(rowToCategory)
}
async function themeData() {
  const rows = await query("SELECT data FROM theme WHERE id='site' LIMIT 1")
  return rows[0] ? parseJson(rows[0].data, { id: 'site' }) : { id: 'site' }
}
async function providerData() {
  const rows = await query("SELECT * FROM provider WHERE id='current' LIMIT 1")
  const r = rows[0] || {}
  return {
    id: 'current',
    mode: r.mode || 'builtin',
    model: r.model || '',
    researchOnline: !!r.research_online
  }
}

// GET /api/products?cat=&q=  (visible only)
router.get('/products', async (req, res) => {
  let list = (await allProducts()).filter(p => !p.hidden)
  const { cat, q } = req.query
  if (cat && cat !== 'all') list = list.filter(p => p.cat === cat)
  if (q) {
    const s = String(q).toLowerCase()
    list = list.filter(p => (p.en || '').toLowerCase().includes(s) || (p.rw || '').toLowerCase().includes(s))
  }
  res.json(list)
})

// GET /api/categories  (visible only)
router.get('/categories', async (_req, res) => {
  res.json((await allCategories()).filter(c => !c.hidden))
})

// GET /api/theme  (public; needed to paint the shell)
router.get('/theme', async (_req, res) => res.json(await themeData()))

// GET /api/bootstrap  — hydrates the client cache in one round-trip.
// Returns the FULL catalog (incl. hidden) so admin screens and the storefront
// stay consistent with the server as the single source of truth.
router.get('/bootstrap', async (_req, res) => {
  const [products, categories, theme, provider, qa, glossary] = await Promise.all([
    allProducts(),
    allCategories(),
    themeData(),
    providerData(),
    query('SELECT * FROM ai_qa'),
    query('SELECT * FROM ai_glossary')
  ])
  res.json({
    products,
    categories,
    theme,
    provider,
    qa: qa.map(r => ({ id: r.id, q: r.q, a: r.a, qEn: r.q_en, aEn: r.a_en })),
    glossary: glossary.map(r => ({ id: r.id, term: r.term, def: r.def, defEn: r.def_en }))
  })
})

module.exports = router
module.exports.allProducts = allProducts
module.exports.allCategories = allCategories
module.exports.providerData = providerData
