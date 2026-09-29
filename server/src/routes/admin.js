const express = require('express')
const bcrypt = require('bcryptjs')
const { query, parseJson, rowToProduct, rowToCategory } = require('../db')
const { requireAdmin } = require('../middleware/auth')
const config = require('../config')

const router = express.Router()
router.use(requireAdmin)

const clean = s => String(s == null ? '' : s).trim()
const normPhone = s => clean(s).replace(/[\s-]/g, '')

// GET /api/admin/state
router.get('/state', async (_req, res) => {
  const [products, categories, themeRows, qa, glossary, provRows, adminRows] = await Promise.all([
    query('SELECT * FROM products ORDER BY sort ASC, id ASC'),
    query('SELECT * FROM categories ORDER BY sort ASC, id ASC'),
    query("SELECT data FROM theme WHERE id='site' LIMIT 1"),
    query('SELECT * FROM ai_qa'),
    query('SELECT * FROM ai_glossary'),
    query("SELECT * FROM provider WHERE id='current' LIMIT 1"),
    query("SELECT * FROM users WHERE role='admin' ORDER BY id ASC LIMIT 1")
  ])
  const p = provRows[0] || {}
  const a = adminRows[0] || {}
  res.json({
    products: products.map(rowToProduct),
    categories: categories.map(rowToCategory),
    theme: themeRows[0] ? parseJson(themeRows[0].data, { id: 'site' }) : { id: 'site' },
    qa: qa.map(r => ({ id: r.id, q: r.q, a: r.a, qEn: r.q_en, aEn: r.a_en })),
    glossary: glossary.map(r => ({ id: r.id, term: r.term, def: r.def, defEn: r.def_en })),
    // apiKey is NEVER sent to the client — it lives in the server environment.
    provider: {
      id: 'current', mode: p.mode || 'builtin', name: 'OpenAI (server)',
      model: p.model || config.openai.model, apiUrl: '', apiKey: '',
      requireRemote: true, researchOnline: !!p.research_online
    },
    admin: { adminId: a.national_id || '', phone: a.phone || '', name: a.name || '' }
  })
})

// ---- products ----
router.post('/product/save', async (req, res) => {
  const p = req.body.product || {}
  if (!p.id) return res.status(400).json({ error: 'no_id' })
  const unit = p.unit || {}
  const rows = await query(
    `INSERT INTO products (id, cat, en, rw, price, unit_en, unit_rw, emoji, img, hidden, sort)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (id) DO UPDATE SET
       cat=EXCLUDED.cat, en=EXCLUDED.en, rw=EXCLUDED.rw, price=EXCLUDED.price,
       unit_en=EXCLUDED.unit_en, unit_rw=EXCLUDED.unit_rw, emoji=EXCLUDED.emoji,
       img=EXCLUDED.img, hidden=EXCLUDED.hidden
     RETURNING *`,
    [clean(p.id), p.cat || 'seeds', clean(p.en), clean(p.rw), Number(p.price) || 0,
      unit.en || 'piece', unit.rw || 'igikoresho 1', p.emoji || '', p.img || '',
      !!p.hidden, 0]
  )
  res.json(rowToProduct(rows[0]))
})
router.post('/product/delete', async (req, res) => {
  await query('DELETE FROM products WHERE id=$1', [clean(req.body.id)])
  res.json({ ok: true })
})

// ---- categories ----
router.post('/category/save', async (req, res) => {
  const c = req.body.category || {}
  if (!c.id) return res.status(400).json({ error: 'no_id' })
  const rows = await query(
    `INSERT INTO categories (id, en, rw, emoji, hidden, sort) VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (id) DO UPDATE SET en=EXCLUDED.en, rw=EXCLUDED.rw, emoji=EXCLUDED.emoji, hidden=EXCLUDED.hidden
     RETURNING *`,
    [clean(c.id), clean(c.en), clean(c.rw), c.emoji || '🧺', !!c.hidden, 0]
  )
  res.json(rowToCategory(rows[0]))
})
router.post('/category/delete', async (req, res) => {
  await query('DELETE FROM categories WHERE id=$1', [clean(req.body.id)])
  res.json({ ok: true })
})

// ---- theme ----
router.post('/theme/save', async (req, res) => {
  const t = req.body.theme || {}
  await query(
    `INSERT INTO theme (id, data) VALUES ('site', $1::jsonb)
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
    [JSON.stringify({
      id: 'site', titleEn: t.titleEn || '', titleRw: t.titleRw || '',
      subEn: t.subEn || '', subRw: t.subRw || '', font: t.font || '',
      accent: t.accent || '', icon: t.icon || '', logo: t.logo || ''
    })]
  )
  res.json({ ok: true })
})

// ---- AI training: Q&A ----
const newId = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
router.post('/qa/save', async (req, res) => {
  const r = req.body.item || {}
  const id = clean(r.id) || newId('qa_')
  await query(
    `INSERT INTO ai_qa (id, q, a, q_en, a_en) VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (id) DO UPDATE SET q=EXCLUDED.q, a=EXCLUDED.a, q_en=EXCLUDED.q_en, a_en=EXCLUDED.a_en`,
    [id, r.q || '', r.a || '', r.qEn || '', r.aEn || '']
  )
  res.json({ id, ...r })
})
router.post('/qa/delete', async (req, res) => {
  await query('DELETE FROM ai_qa WHERE id=$1', [clean(req.body.id)]); res.json({ ok: true })
})

// ---- AI training: glossary ----
router.post('/glossary/save', async (req, res) => {
  const r = req.body.item || {}
  const id = clean(r.id) || newId('gl_')
  await query(
    `INSERT INTO ai_glossary (id, term, def, def_en) VALUES ($1,$2,$3,$4)
     ON CONFLICT (id) DO UPDATE SET term=EXCLUDED.term, def=EXCLUDED.def, def_en=EXCLUDED.def_en`,
    [id, r.term || '', r.def || '', r.defEn || '']
  )
  res.json({ id, ...r })
})
router.post('/glossary/delete', async (req, res) => {
  await query('DELETE FROM ai_glossary WHERE id=$1', [clean(req.body.id)]); res.json({ ok: true })
})

// ---- AI provider (mode/model/research only; the key is server-side) ----
router.post('/provider/save', async (req, res) => {
  const p = req.body.provider || {}
  const mode = p.mode === 'builtin' ? 'builtin' : 'remote'
  await query(
    `INSERT INTO provider (id, mode, model, research_online) VALUES ('current', $1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET mode=EXCLUDED.mode, model=EXCLUDED.model, research_online=EXCLUDED.research_online`,
    [mode, clean(p.model) || config.openai.model, !!p.researchOnline]
  )
  res.json({ ok: true })
})

// ---- admin account credentials ----
router.post('/account/save', async (req, res) => {
  const a = req.body.admin || {}
  const rows = await query("SELECT * FROM users WHERE role='admin' ORDER BY id ASC LIMIT 1")
  if (!rows[0]) return res.status(404).json({ error: 'no_admin' })
  const admin = rows[0]

  const nationalId = clean(a.adminId) || admin.national_id
  const phone = normPhone(a.phone) || admin.phone
  const name = clean(a.name) || admin.name
  const password = a.password != null && String(a.password).length >= 4 ? String(a.password) : null

  if (password) {
    const hash = await bcrypt.hash(password, 10)
    await query('UPDATE users SET national_id=$1, phone=$2, name=$3, password_hash=$4 WHERE id=$5',
      [nationalId, phone, name, hash, admin.id])
  } else {
    await query('UPDATE users SET national_id=$1, phone=$2, name=$3 WHERE id=$4',
      [nationalId, phone, name, admin.id])
  }
  res.json({ ok: true, admin: { adminId: nationalId, phone, name } })
})

module.exports = router
