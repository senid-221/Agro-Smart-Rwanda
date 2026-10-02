// Community Q&A + Expert Human Assistance subscriptions.
//
// Community: real farmer posts and replies stored in Postgres — no fabricated
// content. Anyone signed in can read; posting/replying requires auth. Admins can
// hide posts/replies (soft moderation).
//
// Subscriptions: we RECORD the farmer's intent to subscribe to a paid Agro AI
// Expert plan and return Mobile Money instructions. There is NO live charging —
// the row stays `pending` until an admin activates it after payment is received.
const express = require('express')
const { query } = require('../db')
const { requireAuth, requireAdmin } = require('../middleware/auth')

const router = express.Router()

const PLAN_AMOUNT = { monthly: 10000, yearly: 100000 }

function clip(s, n) { const t = String(s == null ? '' : s).trim(); return t.length > n ? t.slice(0, n) : t }

function shapePost(r) {
  return {
    id: r.id, author: r.author, district: r.district, title: r.title, body: r.body,
    crop: r.crop || '', status: r.status, replies: Number(r.reply_count || 0),
    mine: false, at: new Date(r.created_at).getTime()
  }
}
function shapeReply(r) {
  return { id: r.id, author: r.author, body: r.body, helpful: Number(r.helpful || 0), at: new Date(r.created_at).getTime() }
}

// GET /api/community  — latest visible posts with reply counts.
router.get('/community', requireAuth, async (req, res) => {
  const rows = await query(
    `SELECT p.*, (SELECT COUNT(*) FROM community_replies r WHERE r.post_id = p.id AND NOT r.hidden) AS reply_count
       FROM community_posts p WHERE NOT p.hidden ORDER BY p.created_at DESC LIMIT 100`)
  res.json({ posts: rows.map(r => { const p = shapePost(r); p.mine = r.user_id === req.user.id; return p }) })
})

// POST /api/community  { title, body, crop }
router.post('/community', requireAuth, async (req, res) => {
  const title = clip(req.body.title, 160)
  const body = clip(req.body.body, 4000)
  if (!title || !body) return res.status(400).json({ error: 'missing' })
  const me = await query('SELECT name, phone FROM users WHERE id = $1', [req.user.id])
  const author = clip((me[0] && me[0].name) || 'Farmer', 120)
  const district = clip(req.body.district, 60)
  const crop = clip(req.body.crop, 32)
  const inserted = await query(
    `INSERT INTO community_posts (user_id, author, district, title, body, crop)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [req.user.id, author, district, title, body, crop])
  const p = shapePost(inserted[0]); p.mine = true; p.author = author
  res.json({ post: p })
})

// GET /api/community/:id  — one post + its replies.
router.get('/community/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id)
  const posts = await query('SELECT * FROM community_posts WHERE id = $1 AND NOT hidden', [id])
  if (!posts.length) return res.status(404).json({ error: 'notfound' })
  const replies = await query(
    'SELECT * FROM community_replies WHERE post_id = $1 AND NOT hidden ORDER BY created_at ASC LIMIT 200', [id])
  const p = shapePost(posts[0]); p.mine = posts[0].user_id === req.user.id
  res.json({ post: p, replies: replies.map(shapeReply) })
})

// POST /api/community/:id/replies  { body }
router.post('/community/:id/replies', requireAuth, async (req, res) => {
  const id = Number(req.params.id)
  const body = clip(req.body.body, 4000)
  if (!body) return res.status(400).json({ error: 'missing' })
  const posts = await query('SELECT id FROM community_posts WHERE id = $1 AND NOT hidden', [id])
  if (!posts.length) return res.status(404).json({ error: 'notfound' })
  const me = await query('SELECT name FROM users WHERE id = $1', [req.user.id])
  const author = clip((me[0] && me[0].name) || 'Farmer', 120)
  const inserted = await query(
    `INSERT INTO community_replies (post_id, user_id, author, body)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [id, req.user.id, author, body])
  await query(
    `UPDATE community_posts SET status = 'answered' WHERE id = $1 AND status = 'open'`, [id])
  res.json({ reply: shapeReply(inserted[0]) })
})

// Admin soft-moderation.
router.delete('/community/:id', requireAdmin, async (req, res) => {
  await query('UPDATE community_posts SET hidden = TRUE WHERE id = $1', [Number(req.params.id)])
  res.json({ ok: true })
})
router.delete('/community/reply/:id', requireAdmin, async (req, res) => {
  await query('UPDATE community_replies SET hidden = TRUE WHERE id = $1', [Number(req.params.id)])
  res.json({ ok: true })
})

// ---------- Expert Human Assistance subscriptions ----------

// GET /api/expert/plans  — the two published plans + this user's current intent.
router.get('/expert/plans', requireAuth, async (req, res) => {
  const rows = await query(
    `SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`, [req.user.id])
  const sub = rows[0] ? {
    id: rows[0].id, plan: rows[0].plan, amount: rows[0].amount, currency: rows[0].currency,
    status: rows[0].status, phone: rows[0].phone, at: new Date(rows[0].created_at).getTime()
  } : null
  res.json({
    plans: [
      { id: 'monthly', amount: 10000, currency: 'RWF', period: 'monthly', autoRenew: true },
      { id: 'yearly', amount: 100000, currency: 'RWF', period: 'yearly', autoRenew: true }
    ],
    subscription: sub
  })
})

// POST /api/expert/subscribe  { plan: 'monthly'|'yearly', phone }
// Records intent only. Returns Mobile Money instructions — no live charge.
router.post('/expert/subscribe', requireAuth, async (req, res) => {
  const plan = req.body.plan === 'yearly' ? 'yearly' : 'monthly'
  const amount = PLAN_AMOUNT[plan]
  const phone = clip(req.body.phone, 20)
  const inserted = await query(
    `INSERT INTO subscriptions (user_id, plan, amount, currency, status, phone)
     VALUES ($1, $2, $3, 'RWF', 'pending', $4) RETURNING *`,
    [req.user.id, plan, amount, phone])
  res.json({
    ok: true,
    subscription: {
      id: inserted[0].id, plan, amount, currency: 'RWF', status: 'pending', phone,
      at: new Date(inserted[0].created_at).getTime()
    }
  })
})

// Admin: activate a pending subscription once payment is confirmed.
router.post('/expert/subscriptions/:id/activate', requireAdmin, async (req, res) => {
  const rows = await query(
    `UPDATE subscriptions SET status = 'active', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [Number(req.params.id)])
  if (!rows.length) return res.status(404).json({ error: 'notfound' })
  res.json({ ok: true, status: rows[0].status })
})

module.exports = router
