const express = require('express')
const { query } = require('../db')
const openai = require('../openai')
const { requireAuth } = require('../middleware/auth')
const { allProducts, providerData } = require('./catalog')

const router = express.Router()

// POST /api/ai/chat  { message, lang, ctx }
router.post('/chat', requireAuth, async (req, res) => {
  const message = String(req.body.message || '')
  const lang = req.body.lang === 'en' ? 'en' : 'rw'
  const ctx = req.body.ctx || {}

  const provider = await providerData()
  if (!openai.isConfigured() || provider.mode !== 'remote') {
    return res.status(503).json({
      error: 'ai_unconfigured',
      message: lang === 'en'
        ? 'The AI service is not configured on the server yet.'
        : 'Serivisi ya AI ntabwo iragenwa kuri seriveri.'
    })
  }

  const [glossary, qa, products] = await Promise.all([
    query('SELECT * FROM ai_glossary'),
    query('SELECT * FROM ai_qa'),
    allProducts()
  ])
  const system = openai.buildSystemPrompt(lang, glossary, qa, products.filter(p => !p.hidden))

  try {
    const text = await openai.chat({ message, lang, system })
    res.json({ intent: 'remote', ctx, text })
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
