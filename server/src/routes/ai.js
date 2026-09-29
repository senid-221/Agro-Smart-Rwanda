const express = require('express')
const { query } = require('../db')
const openai = require('../openai')
const knowledge = require('../knowledge')
const { requireAuth } = require('../middleware/auth')
const { allProducts, providerData } = require('./catalog')

const router = express.Router()

// How much of the farmer's conversation we feed back to the model each turn.
const HISTORY_TURNS = 20

// Most recent N messages for a user, returned oldest-first so they can be sent to
// the model as a coherent transcript.
async function recentHistory(userId, limit = HISTORY_TURNS) {
  const rows = await query(
    `SELECT role, content FROM (
       SELECT role, content, created_at
       FROM ai_messages
       WHERE user_id = $1
       ORDER BY created_at DESC, id DESC
       LIMIT $2
     ) t ORDER BY created_at ASC, id ASC`,
    [userId, limit]
  )
  return rows.map(r => ({ role: r.role, content: r.content }))
}

// GET /api/ai/history — restore the Doctor conversation when the farmer reopens it.
router.get('/history', requireAuth, async (req, res) => {
  try {
    const rows = await query(
      `SELECT role, content, created_at
       FROM ai_messages WHERE user_id = $1
       ORDER BY created_at ASC, id ASC`,
      [req.user.id]
    )
    res.json({ messages: rows.map(r => ({ role: r.role, content: r.content, at: r.created_at })) })
  } catch (err) {
    res.status(500).json({ error: 'history_failed', message: err.message })
  }
})

// DELETE /api/ai/history — "Clear conversation": forget everything for this farmer.
router.delete('/history', requireAuth, async (req, res) => {
  try {
    await query('DELETE FROM ai_messages WHERE user_id = $1', [req.user.id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'history_failed', message: err.message })
  }
})

// POST /api/ai/chat  { message, lang, ctx }
router.post('/chat', requireAuth, async (req, res) => {
  const message = String(req.body.message || '').trim()
  const lang = req.body.lang === 'en' ? 'en' : 'rw'
  const ctx = req.body.ctx || {}

  if (!message) {
    return res.status(400).json({ error: 'empty_message', text: '' })
  }

  const provider = await providerData()
  if (!openai.isConfigured() || provider.mode !== 'remote') {
    return res.status(503).json({
      error: 'ai_unconfigured',
      message: lang === 'en'
        ? 'The AI service is not configured on the server yet.'
        : 'Serivisi ya AI ntabwo iragenwa kuri seriveri.'
    })
  }

  try {
    // Research the farmer's question against the Rwanda knowledge base first, so
    // the model answers from grounded RAB / disease / crop-calendar evidence.
    const research = knowledge.research(message, lang)
    const scan = ctx && ctx.scan ? String(ctx.scan) : ''

    const [glossary, qa, products, history] = await Promise.all([
      query('SELECT * FROM ai_glossary'),
      query('SELECT * FROM ai_qa'),
      allProducts(),
      recentHistory(req.user.id)
    ])

    const system = openai.buildSystemPrompt(lang, {
      glossary,
      qa,
      catalog: products.filter(p => !p.hidden),
      research: research.text,
      scan
    })

    const messages = [...history, { role: 'user', content: message }]

    // Persist the farmer's turn now, so a failed reply still keeps context.
    await query(
      'INSERT INTO ai_messages (user_id, role, content) VALUES ($1, $2, $3)',
      [req.user.id, 'user', message]
    )

    const text = await openai.chat({ messages, system })

    await query(
      'INSERT INTO ai_messages (user_id, role, content) VALUES ($1, $2, $3)',
      [req.user.id, 'assistant', text]
    )

    res.json({ intent: 'remote', ctx, cropId: research.cropId || null, text })
  } catch (err) {
    res.status(502).json({
      error: 'ai_unavailable',
      code: err.code || 'upstream',
      message: lang === 'en'
        ? 'The AI service could not be reached. Please try again.'
        : 'Serivisi ya AI ntabwo yabashije kuboneka. Ongera ugerageze.'
    })
  }
})

module.exports = router
