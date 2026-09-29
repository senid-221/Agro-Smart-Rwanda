const express = require('express')
const { query } = require('../db')
const openai = require('../openai')
const vision = require('../vision')
const research = require('../research')
const knowledge = require('../knowledge')
const { requireAuth } = require('../middleware/auth')
const { allProducts, providerData } = require('./catalog')

const router = express.Router()

// How much of the farmer's conversation we feed back to the model each turn.
const HISTORY_TURNS = 20
const MAX_FINDINGS = 6000

const clip = (s, n) => String(s || '').slice(0, n)

// Most recent N messages for a user, oldest-first, as a model transcript.
async function recentHistory(userId, limit = HISTORY_TURNS) {
  const rows = await query(
    `SELECT role, content FROM (
       SELECT role, content, created_at, id
       FROM ai_messages WHERE user_id = $1
       ORDER BY created_at DESC, id DESC LIMIT $2
     ) t ORDER BY created_at ASC, id ASC`,
    [userId, limit]
  )
  return rows.map(r => ({ role: r.role, content: r.content }))
}

const getCase = (userId, id) =>
  query('SELECT * FROM crop_cases WHERE id = $1 AND user_id = $2', [id, userId]).then(r => r[0] || null)

async function observationsFor(caseId, limit = 12) {
  if (!caseId) return []
  const rows = await query(
    `SELECT kind, note, images, status_change, created_at FROM (
       SELECT kind, note, images, status_change, created_at
       FROM case_observations WHERE case_id = $1
       ORDER BY created_at DESC, id DESC LIMIT $2
     ) t ORDER BY created_at ASC, id ASC`,
    [caseId, limit]
  )
  return rows
}

// Verified crop-protection products relevant to this crop (may be empty — the
// model is forbidden from naming products that are not listed here or in store).
async function cropProducts(cropId) {
  if (!cropId) return []
  return query(
    `SELECT * FROM ai_products
     WHERE target_crop = '' OR target_crop ILIKE $1
     ORDER BY verified_at DESC NULLS LAST, id ASC LIMIT 8`,
    ['%' + cropId + '%']
  )
}

// Resolve the case for this turn: an explicit ctx.caseId, else reuse the most
// recent open case for a detected crop when the message is a health problem,
// else create one. Price/what-is questions do not spawn cases.
async function resolveCase(userId, ctx, cropId, message, isHealthProblem) {
  if (ctx.caseId) {
    const c = await getCase(userId, ctx.caseId)
    if (c) return c
  }
  if (!cropId || !isHealthProblem) return null
  const existing = await query(
    `SELECT * FROM crop_cases
     WHERE user_id = $1 AND crop = $2 AND status IN ('open','monitoring')
     ORDER BY updated_at DESC LIMIT 1`,
    [userId, cropId]
  )
  if (existing[0]) return existing[0]
  const created = await query(
    `INSERT INTO crop_cases (user_id, crop, symptoms, status)
     VALUES ($1, $2, $3, 'open') RETURNING *`,
    [userId, cropId, clip(message, 1000)]
  )
  return created[0] || null
}

// Detect a crop-health problem (vs. a price/general question) from KB disease
// matches or common symptom words in Kinyarwanda/English.
const PROBLEM_WORDS = [
  'indwara', 'urwaye', 'kirwaye', 'ikirungu', 'ibibabi', 'amababi', 'umuhondo',
  'ibara', 'amadobi', 'kunyunyuka', 'gukakara', 'kuma', 'ibyonnyi', 'udukoko',
  'igisambo', 'kubora', 'rot', 'disease', 'sick', 'dying', 'spots', 'spot',
  'yellow', 'wilt', 'wilting', 'blight', 'pest', 'insect', 'insects', 'fungus',
  'mould', 'mold', 'lesion', 'necrosis', 'stunted', 'aphid', 'worm', 'rust'
]
function looksLikeProblem(message, cropId) {
  const hay = ' ' + String(message || '').toLowerCase().replace(/[^a-z']+/g, ' ') + ' '
  if (PROBLEM_WORDS.some(w => hay.includes(' ' + w + ' '))) return true
  return cropId ? knowledge.detectDiseases(message, cropId).length > 0 : false
}

// Core Doctor turn: research → build prompt (case + history + research + vision)
// → call the model → persist conversation, case observation and research record.
async function doctorTurn(userId, { message, lang, ctx = {}, kind = 'report', statusChange = '' }) {
  const res = await research.research(message, lang)
  const cropId = res.cropId
  const isHealthProblem = looksLikeProblem(message, cropId)
  const caseRow = await resolveCase(userId, ctx, cropId, message, isHealthProblem)

  const scan = ctx.scan ? String(ctx.scan) : ''

  const [glossary, qa, products, prods, history, observations] = await Promise.all([
    query('SELECT * FROM ai_glossary'),
    query('SELECT * FROM ai_qa'),
    allProducts(),
    cropProducts(cropId),
    recentHistory(userId),
    observationsFor(caseRow && caseRow.id)
  ])

  const system = openai.buildSystemPrompt(lang, {
    glossary,
    qa,
    catalog: products.filter(p => !p.hidden),
    research: res.text,
    scan,
    caseCtx: caseRow,
    observations,
    cropProducts: prods,
    sources: res.sources
  })

  const messages = [...history, { role: 'user', content: message }]

  // Persist the farmer's turn first so a failed reply still keeps context.
  await query(
    'INSERT INTO ai_messages (user_id, role, content, case_id) VALUES ($1, $2, $3, $4)',
    [userId, 'user', message, caseRow ? caseRow.id : null]
  )

  const text = await openai.chat({ messages, system })

  await query(
    'INSERT INTO ai_messages (user_id, role, content, case_id) VALUES ($1, $2, $3, $4)',
    [userId, 'assistant', text, caseRow ? caseRow.id : null]
  )

  if (caseRow) {
    await query(
      `INSERT INTO case_observations (case_id, user_id, kind, note, images, status_change)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [caseRow.id, userId, kind, clip(message, 2000), JSON.stringify(scan ? [{ findings: clip(scan, 1500) }] : []), statusChange]
    )
    await query(
      `UPDATE crop_cases
       SET symptoms = $2,
           crop = COALESCE(NULLIF(crop, ''), $3),
           status = CASE WHEN status = 'open' THEN 'monitoring' ELSE status END
       WHERE id = $1`,
      [caseRow.id, clip(message, 1000), cropId || '']
    )
  }

  // Store research provenance (evidence + sources + confidence) for audit.
  await query(
    `INSERT INTO research_records (user_id, case_id, query, crop, findings, sources, confidence)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [userId, caseRow ? caseRow.id : null, clip(message, 500), cropId || '',
      clip(res.text, MAX_FINDINGS), JSON.stringify(res.sources || []), res.confidence || '']
  )

  return { text, caseId: caseRow ? caseRow.id : null, cropId, sources: res.sources, confidence: res.confidence }
}

async function aiAvailable(lang) {
  const provider = await providerData()
  if (!openai.isConfigured() || provider.mode !== 'remote') {
    return {
      error: 'ai_unconfigured',
      message: lang === 'en'
        ? 'The AI service is not configured on the server yet.'
        : 'Serivisi ya AI ntabwo iragenwa kuri seriveri.'
    }
  }
  return null
}

// POST /api/ai/chat  { message, lang, ctx }
router.post('/chat', requireAuth, async (req, res) => {
  const message = String(req.body.message || '').trim()
  const lang = req.body.lang === 'en' ? 'en' : 'rw'
  const ctx = req.body.ctx || {}
  if (!message) return res.status(400).json({ error: 'empty_message', text: '' })

  const blocked = await aiAvailable(lang)
  if (blocked) return res.status(503).json(blocked)

  try {
    const out = await doctorTurn(req.user.id, { message, lang, ctx })
    res.json({ intent: 'remote', ctx, text: out.text, caseId: out.caseId, cropId: out.cropId, sources: out.sources, confidence: out.confidence })
  } catch (err) {
    res.status(502).json({
      error: 'ai_unavailable', code: err.code || 'upstream',
      message: lang === 'en'
        ? 'The AI service could not be reached. Please try again.'
        : 'Serivisi ya AI ntabwo yabashije kuboneka. Ongera ugerageze.'
    })
  }
})

// POST /api/ai/analyze  { dataUrl, lang, cropHint, caseId }
// Runs vision analysis on a crop photo. Returns findings the client feeds back
// into /chat (ctx.scan) and stores as an image observation on the case.
router.post('/analyze', requireAuth, async (req, res) => {
  const lang = req.body.lang === 'en' ? 'en' : 'rw'
  const dataUrl = String(req.body.dataUrl || '')
  const cropHint = String(req.body.cropHint || '')
  const caseId = req.body.caseId ? Number(req.body.caseId) : null

  const blocked = await aiAvailable(lang)
  if (blocked) return res.status(503).json(blocked)

  try {
    const { text } = await vision.analyze({ dataUrl, lang, cropHint })
    if (caseId) {
      const c = await getCase(req.user.id, caseId)
      if (c) {
        await query(
          `INSERT INTO case_observations (case_id, user_id, kind, note, images)
           VALUES ($1, $2, 'image', $3, $4)`,
          [c.id, req.user.id, clip(text, 1500), JSON.stringify([{ findings: clip(text, 1500) }])]
        )
      }
    }
    res.json({ findings: text })
  } catch (err) {
    res.status(502).json({
      error: 'vision_unavailable', code: err.code || 'upstream',
      message: lang === 'en'
        ? 'The photo could not be analysed right now. Please try again or describe the symptoms.'
        : 'Ifoto ntibashije gusesengurwa ubu. Ongera ugerageze cyangwa usobanure ibimenyetso.'
    })
  }
})

// GET /api/ai/cases — the farmer's Crop Health Cases (most recent first).
router.get('/cases', requireAuth, async (req, res) => {
  try {
    const rows = await query(
      `SELECT id, crop, variety, district, sector, symptoms, suspected, status, updated_at
       FROM crop_cases WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 50`,
      [req.user.id]
    )
    res.json({ cases: rows })
  } catch (err) {
    res.status(500).json({ error: 'cases_failed', message: err.message })
  }
})

// GET /api/ai/cases/:id — one case with its observation timeline.
router.get('/cases/:id', requireAuth, async (req, res) => {
  try {
    const c = await getCase(req.user.id, req.params.id)
    if (!c) return res.status(404).json({ error: 'case_not_found' })
    const obs = await query(
      `SELECT kind, note, status_change, created_at
       FROM case_observations WHERE case_id = $1 ORDER BY created_at ASC, id ASC`,
      [c.id]
    )
    res.json({ case: c, observations: obs })
  } catch (err) {
    res.status(500).json({ error: 'case_failed', message: err.message })
  }
})

// POST /api/ai/cases/:id/followup  { note, statusChange, lang }
// Records a follow-up and asks the Doctor to compare it with the case so far.
router.post('/cases/:id/followup', requireAuth, async (req, res) => {
  const lang = req.body.lang === 'en' ? 'en' : 'rw'
  const note = String(req.body.note || '').trim()
  const statusChange = String(req.body.statusChange || '')
  if (!note) return res.status(400).json({ error: 'empty_message', text: '' })

  const c = await getCase(req.user.id, req.params.id)
  if (!c) return res.status(404).json({ error: 'case_not_found' })

  const blocked = await aiAvailable(lang)
  if (blocked) return res.status(503).json(blocked)

  try {
    const out = await doctorTurn(req.user.id, {
      message: note, lang, ctx: { caseId: c.id }, kind: 'followup', statusChange
    })
    res.json({ text: out.text, caseId: c.id, sources: out.sources, confidence: out.confidence })
  } catch (err) {
    res.status(502).json({
      error: 'ai_unavailable', code: err.code || 'upstream',
      message: lang === 'en'
        ? 'The AI service could not be reached. Please try again.'
        : 'Serivisi ya AI ntabwo yabashije kuboneka. Ongera ugerageze.'
    })
  }
})

// POST /api/ai/cases/:id/status  { status }  — resolve/close a case.
router.post('/cases/:id/status', requireAuth, async (req, res) => {
  const status = String(req.body.status || '')
  if (!['open', 'monitoring', 'resolved', 'closed'].includes(status)) {
    return res.status(400).json({ error: 'bad_status' })
  }
  const c = await getCase(req.user.id, req.params.id)
  if (!c) return res.status(404).json({ error: 'case_not_found' })
  await query('UPDATE crop_cases SET status = $2 WHERE id = $1', [c.id, status])
  res.json({ ok: true, status })
})

// GET /api/ai/history — restore the Doctor conversation when the farmer reopens it.
router.get('/history', requireAuth, async (req, res) => {
  try {
    const rows = await query(
      `SELECT role, content, case_id, created_at
       FROM ai_messages WHERE user_id = $1 ORDER BY created_at ASC, id ASC`,
      [req.user.id]
    )
    res.json({ messages: rows.map(r => ({ role: r.role, content: r.content, caseId: r.case_id, at: r.created_at })) })
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

module.exports = router
