// Agronomist War Room.
//
// Staff agronomists (role 'agronomist', promoted by an admin) convene in a LIVE
// meeting over one real Crop Health Case to study a disease problem together.
// The AI contributes ON DEMAND (an "Ask AI" tap = one grounded call), informed by
// the case, its history, Rwanda research, verified crop-protection products and —
// the point of the room — the questions farmers have actually been asking the AI.
//
// "Live" is polling, not websockets: Neon serverless Postgres is connection-poor
// and no socket layer exists. Each open room polls ?since=<lastId> every few
// seconds and beats a presence heartbeat; the UI self-clears on navigation.
//
// Honesty rules inherited from the Doctor: never invent a product, dose,
// registration or source; every trend number is a real aggregate over
// ai_messages / crop_cases — never a hallucinated statistic.
const express = require('express')
const { query } = require('../db')
const openai = require('../openai')
const research = require('../research')
const knowledge = require('../knowledge')
const { requireAgronomist } = require('../middleware/auth')
const { allProducts, providerData } = require('./catalog')

const router = express.Router()
router.use(requireAgronomist)

const clip = (s, n) => { const t = String(s == null ? '' : s).trim(); return t.length > n ? t.slice(0, n) : t }
const ONLINE_MS = 30000 // a participant is "online" if seen within the last 30s

// Localised crop label for a crop id (falls back to the raw id).
function cropLabel(cropId) {
  if (!cropId) return ''
  const c = (knowledge.load().crops || {})[cropId]
  if (!c) return cropId
  return c.en || c.rw || cropId
}

// Verified crop-protection products relevant to a crop (same rule as the Doctor:
// only admin-seeded rows; the AI may not name anything else).
function cropProducts(cropId) {
  if (!cropId) return Promise.resolve([])
  return query(
    `SELECT * FROM ai_products
     WHERE target_crop = '' OR target_crop ILIKE $1
     ORDER BY verified_at DESC NULLS LAST, id ASC LIMIT 8`,
    ['%' + cropId + '%']
  )
}

// ---- Farmer-question trends (deterministic, real aggregates only) ----
// Symptom lexicon reused to count what farmers describe most. Kept small; only
// words that survive a >=2 threshold are reported so we never imply a pattern
// from a single mention.
const TREND_SYMPTOMS = [
  'yellow', 'spots', 'wilt', 'rot', 'holes', 'mould', 'mold', 'curl', 'dry',
  'dying', 'stunted', 'worm', 'aphid', 'whitefly', 'blight', 'rust', 'mildew',
  'necrosis', 'lesion', 'brown', 'black', 'umuhondo', 'ududomo', 'ibara',
  'kubora', 'kunyunyuka', 'kwama', 'imungu', 'udukoko', 'ibisebe', 'kubora'
]

async function farmerTrends() {
  const [tot, last30, topCrops, openCases, emergencies, recentQ] = await Promise.all([
    query("SELECT COUNT(*)::int AS n FROM ai_messages WHERE role='user'"),
    query("SELECT COUNT(*)::int AS n FROM ai_messages WHERE role='user' AND created_at >= NOW() - INTERVAL '30 days'"),
    query(
      `SELECT crop, COUNT(*)::int AS n FROM crop_cases
       WHERE crop <> '' AND status IN ('open','monitoring')
       GROUP BY crop ORDER BY n DESC, crop ASC LIMIT 6`
    ),
    query("SELECT COUNT(*)::int AS n FROM crop_cases WHERE status IN ('open','monitoring')"),
    query(
      `SELECT crop, emergency_reason FROM crop_cases
       WHERE emergency = TRUE ORDER BY updated_at DESC LIMIT 5`
    ),
    query("SELECT content FROM ai_messages WHERE role='user' ORDER BY created_at DESC LIMIT 400")
  ])

  // Count symptom-word frequency over the most recent farmer questions.
  const counts = new Map()
  for (const r of recentQ) {
    const hay = ' ' + String(r.content || '').toLowerCase().replace(/[^a-z']+/g, ' ') + ' '
    for (const w of TREND_SYMPTOMS) {
      if (hay.includes(' ' + w + ' ') || hay.includes(w)) counts.set(w, (counts.get(w) || 0) + 1)
    }
  }
  const topSymptoms = [...counts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word, count]) => ({ word, count }))

  return {
    totalQuestions: tot[0] ? tot[0].n : 0,
    questions30d: last30[0] ? last30[0].n : 0,
    openCases: openCases[0] ? openCases[0].n : 0,
    topCrops: topCrops.map(r => ({ crop: r.crop, label: cropLabel(r.crop), count: r.n })),
    topSymptoms,
    emergencies: emergencies.map(r => ({ crop: cropLabel(r.crop), reason: r.emergency_reason || '' }))
  }
}

// ---- shapes ----
function shapeMessage(r, viewerId) {
  return {
    id: r.id,
    kind: r.kind,
    author: r.kind === 'ai' ? 'War Room AI' : (r.author || ''),
    body: r.body,
    sources: r.sources || [],
    at: new Date(r.created_at).getTime(),
    mine: !!viewerId && r.author_id === viewerId
  }
}

function shapeParticipant(p) {
  return {
    userId: p.user_id,
    name: p.name || '',
    avatar: p.avatar || '',
    role: p.p_role || 'agronomist',
    online: (Date.now() - new Date(p.last_seen).getTime()) < ONLINE_MS,
    lastSeen: new Date(p.last_seen).getTime()
  }
}

// Ensure the current agronomist is a participant (auto-join on open) and beat
// their presence heartbeat. Idempotent upsert.
async function touchParticipant(meetingId, userId, role) {
  await query(
    `INSERT INTO meeting_participants (meeting_id, user_id, role, last_seen)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (meeting_id, user_id) DO UPDATE SET last_seen = NOW()`,
    [meetingId, userId, role === 'admin' ? 'admin' : 'agronomist']
  )
}

async function participantsOf(meetingId) {
  return query(
    `SELECT mp.user_id, mp.last_seen, mp.role AS p_role, u.name, u.avatar
     FROM meeting_participants mp JOIN users u ON u.id = mp.user_id
     WHERE mp.meeting_id = $1 ORDER BY mp.joined_at ASC`,
    [meetingId]
  )
}

async function getMeeting(id) {
  const rows = await query(
    `SELECT m.*, c.crop AS case_crop, c.symptoms, c.suspected, c.status AS case_status,
            c.district, c.sector, c.emergency
     FROM meetings m JOIN crop_cases c ON c.id = m.case_id
     WHERE m.id = $1`,
    [id]
  )
  return rows[0] || null
}

async function shapeMeeting(m, viewerId) {
  const parts = await participantsOf(m.id)
  const lastMsg = await query(
    'SELECT * FROM meeting_messages WHERE meeting_id = $1 ORDER BY id DESC LIMIT 1', [m.id]
  )
  const cnt = await query(
    'SELECT COUNT(*)::int AS n FROM meeting_messages WHERE meeting_id = $1', [m.id]
  )
  return {
    id: m.id,
    caseId: m.case_id,
    title: m.title,
    crop: m.crop,
    cropLabel: cropLabel(m.crop),
    status: m.status,
    createdAt: new Date(m.created_at).getTime(),
    updatedAt: new Date(m.updated_at).getTime(),
    participants: parts.map(shapeParticipant),
    online: parts.filter(p => (Date.now() - new Date(p.last_seen).getTime()) < ONLINE_MS).length,
    messageCount: cnt[0] ? cnt[0].n : 0,
    lastMessage: lastMsg[0] ? shapeMessage(lastMsg[0], viewerId) : null,
    case: {
      crop: cropLabel(m.crop || m.case_crop),
      symptoms: m.symptoms || '',
      suspected: m.suspected || '',
      status: m.case_status || '',
      location: [m.district, m.sector].filter(Boolean).join(', '),
      emergency: !!m.emergency
    }
  }
}

// ---------- Agronomist dashboard ----------

// GET /api/meetings  — list rooms (open first, then recently updated).
router.get('/', async (req, res) => {
  try {
    const rows = await query(
      `SELECT m.*, c.symptoms, c.suspected, c.status AS case_status, c.district, c.sector,
              c.emergency, c.crop AS case_crop
       FROM meetings m JOIN crop_cases c ON c.id = m.case_id
       ORDER BY (m.status = 'open') DESC, m.updated_at DESC LIMIT 50`
    )
    const meetings = []
    for (const m of rows) meetings.push(await shapeMeeting(m, req.user.id))
    res.json({ meetings })
  } catch (err) {
    console.error('[meetings] list failed:', err.message)
    res.status(500).json({ error: 'list_failed', message: err.message })
  }
})

// GET /api/meetings/dashboard  — trends + my rooms + open action items.
router.get('/dashboard', async (_req, res) => {
  try {
    const trends = await farmerTrends()
    const rooms = await query(
      `SELECT m.*, c.symptoms, c.suspected, c.status AS case_status, c.district, c.sector,
              c.emergency, c.crop AS case_crop
       FROM meetings m JOIN crop_cases c ON c.id = m.case_id
       ORDER BY (m.status = 'open') DESC, m.updated_at DESC LIMIT 20`
    )
    const meetings = []
    for (const m of rooms) meetings.push(await shapeMeeting(m, _req.user.id))
    const actionItems = await query(
      `SELECT ct.id, ct.case_id, ct.kind, ct.title, ct.detail, ct.task_date, m.title AS meeting_title
       FROM case_tasks ct JOIN meetings m ON m.case_id = ct.case_id
       WHERE ct.status = 'pending'
       ORDER BY ct.task_date ASC NULLS LAST, ct.id ASC LIMIT 20`
    )
    res.json({
      trends,
      meetings,
      actionItems: actionItems.map(t => ({
        id: t.id, caseId: t.case_id, kind: t.kind, title: t.title, detail: t.detail,
        meeting: t.meeting_title,
        date: t.task_date ? new Date(t.task_date).toISOString().slice(0, 10) : ''
      }))
    })
  } catch (err) {
    console.error('[meetings] dashboard failed:', err.message)
    res.status(500).json({ error: 'dashboard_failed', message: err.message })
  }
})

// GET /api/meetings/cases  — real open/monitoring cases a room can be started from.
router.get('/cases', async (_req, res) => {
  try {
    const rows = await query(
      `SELECT id, crop, symptoms, suspected, status, district, emergency, updated_at
       FROM crop_cases WHERE status IN ('open','monitoring')
       ORDER BY emergency DESC, updated_at DESC LIMIT 50`
    )
    res.json({
      cases: rows.map(r => ({
        id: r.id, crop: r.crop, cropLabel: cropLabel(r.crop),
        symptoms: r.symptoms || '', suspected: r.suspected || '',
        status: r.status, district: r.district || '', emergency: !!r.emergency,
        updatedAt: new Date(r.updated_at).getTime()
      }))
    })
  } catch (err) {
    res.status(500).json({ error: 'cases_failed', message: err.message })
  }
})

// POST /api/meetings  { caseId, title? }  — convene a War Room over a real case.
router.post('/', async (req, res) => {
  const caseId = Number(req.body.caseId)
  if (!caseId) return res.status(400).json({ error: 'no_case' })
  try {
    const cases = await query('SELECT * FROM crop_cases WHERE id = $1', [caseId])
    const c = cases[0]
    if (!c) return res.status(404).json({ error: 'case_not_found' })

    // Reuse an existing open room for this case rather than duplicating it.
    const existing = await query(
      "SELECT * FROM meetings WHERE case_id = $1 AND status = 'open' ORDER BY updated_at DESC LIMIT 1",
      [caseId]
    )
    if (existing[0]) {
      await touchParticipant(existing[0].id, req.user.id, req.user.role)
      const m = await getMeeting(existing[0].id)
      return res.json({ meeting: await shapeMeeting(m, req.user.id), reused: true })
    }

    const me = await query('SELECT name FROM users WHERE id = $1', [req.user.id])
    const title = clip(req.body.title, 160) ||
      `War Room — ${cropLabel(c.crop) || 'crop case'} #${c.id}`

    const created = await query(
      `INSERT INTO meetings (case_id, created_by, title, crop)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [caseId, req.user.id, title, c.crop || '']
    )
    const meeting = created[0]
    await touchParticipant(meeting.id, req.user.id, req.user.role)
    const author = clip((me[0] && me[0].name) || 'Agronomist', 120)
    await query(
      `INSERT INTO meeting_messages (meeting_id, author_id, author, kind, body)
       VALUES ($1, NULL, '', 'system', $2)`,
      [meeting.id, `Meeting opened by ${author}.`]
    )
    const m = await getMeeting(meeting.id)
    res.json({ meeting: await shapeMeeting(m, req.user.id), reused: false })
  } catch (err) {
    console.error('[meetings] create failed:', err.message)
    res.status(500).json({ error: 'create_failed', message: err.message })
  }
})

// GET /api/meetings/:id  — room detail: case header, participants, recent thread.
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id)
  try {
    const m = await getMeeting(id)
    if (!m) return res.status(404).json({ error: 'meeting_not_found' })
    await touchParticipant(id, req.user.id, req.user.role)
    const msgs = await query(
      `SELECT * FROM meeting_messages WHERE meeting_id = $1 ORDER BY id ASC LIMIT 200`, [id]
    )
    const meeting = await shapeMeeting(await getMeeting(id), req.user.id)
    res.json({ meeting, messages: msgs.map(r => shapeMessage(r, req.user.id)) })
  } catch (err) {
    res.status(500).json({ error: 'detail_failed', message: err.message })
  }
})

// GET /api/meetings/:id/messages?since=<id>  — poll for new messages + presence.
router.get('/:id/messages', async (req, res) => {
  const id = Number(req.params.id)
  const since = Number(req.query.since || 0)
  try {
    const m = await getMeeting(id)
    if (!m) return res.status(404).json({ error: 'meeting_not_found' })
    await touchParticipant(id, req.user.id, req.user.role)
    const msgs = await query(
      `SELECT * FROM meeting_messages WHERE meeting_id = $1 AND id > $2 ORDER BY id ASC LIMIT 100`,
      [id, since]
    )
    const parts = await participantsOf(id)
    res.json({
      messages: msgs.map(r => shapeMessage(r, req.user.id)),
      participants: parts.map(shapeParticipant),
      status: m.status
    })
  } catch (err) {
    res.status(500).json({ error: 'poll_failed', message: err.message })
  }
})

// POST /api/meetings/:id/presence  — heartbeat (also refreshes participant list).
router.post('/:id/presence', async (req, res) => {
  const id = Number(req.params.id)
  try {
    const m = await getMeeting(id)
    if (!m) return res.status(404).json({ error: 'meeting_not_found' })
    await touchParticipant(id, req.user.id, req.user.role)
    const parts = await participantsOf(id)
    res.json({ participants: parts.map(shapeParticipant), status: m.status })
  } catch (err) {
    res.status(500).json({ error: 'presence_failed', message: err.message })
  }
})

// POST /api/meetings/:id/messages  { body }  — an agronomist posts to the room.
router.post('/:id/messages', async (req, res) => {
  const id = Number(req.params.id)
  const body = clip(req.body.body, 4000)
  if (!body) return res.status(400).json({ error: 'empty' })
  try {
    const m = await getMeeting(id)
    if (!m) return res.status(404).json({ error: 'meeting_not_found' })
    if (m.status !== 'open') return res.status(409).json({ error: 'closed' })
    const me = await query('SELECT name FROM users WHERE id = $1', [req.user.id])
    const author = clip((me[0] && me[0].name) || 'Agronomist', 120)
    await touchParticipant(id, req.user.id, req.user.role)
    const rows = await query(
      `INSERT INTO meeting_messages (meeting_id, author_id, author, kind, body)
       VALUES ($1, $2, $3, 'message', $4) RETURNING *`,
      [id, req.user.id, author, body]
    )
    await query('UPDATE meetings SET updated_at = NOW() WHERE id = $1', [id])
    res.json({ message: shapeMessage(rows[0], req.user.id) })
  } catch (err) {
    console.error('[meetings] post failed:', err.message)
    res.status(500).json({ error: 'post_failed', message: err.message })
  }
})

// POST /api/meetings/:id/ask-ai  { question?, lang }
// One grounded AI contribution per tap. Assembles the case + history + research +
// verified products + farmer trends + transcript, then stores the reply as an
// 'ai' message in the room.
router.post('/:id/ask-ai', async (req, res) => {
  const id = Number(req.params.id)
  const lang = req.body.lang === 'en' ? 'en' : 'rw'
  const question = clip(req.body.question, 1000)
  try {
    const m = await getMeeting(id)
    if (!m) return res.status(404).json({ error: 'meeting_not_found' })
    if (m.status !== 'open') return res.status(409).json({ error: 'closed' })

    const provider = await providerData()
    if (!openai.isConfigured() || provider.mode !== 'remote') {
      return res.status(503).json({
        error: 'ai_unconfigured',
        message: lang === 'en'
          ? 'The AI service is not configured on the server yet.'
          : 'Serivisi ya AI ntabwo iragenwa kuri seriveri.'
      })
    }

    const cropId = m.crop || m.case_crop || ''
    const researchQuery = [question, m.symptoms, cropLabel(cropId)].filter(Boolean).join(' ')
    const [res, glossary, catalog, prods, trends, obsRows, txRows, caseRows] = await Promise.all([
      research.research(researchQuery, lang),
      query('SELECT * FROM ai_glossary'),
      allProducts(),
      cropProducts(cropId),
      farmerTrends(),
      query(
        `SELECT kind, note, images, status_change, created_at FROM case_observations
         WHERE case_id = $1 ORDER BY created_at ASC LIMIT 20`, [m.case_id]
      ),
      query(
        `SELECT author, kind, body FROM meeting_messages
         WHERE meeting_id = $1 ORDER BY id DESC LIMIT 30`, [id]
      ),
      query('SELECT * FROM crop_cases WHERE id = $1', [m.case_id])
    ])

    const system = openai.buildWarRoomPrompt(lang, {
      caseCtx: caseRows[0] || m,
      observations: obsRows,
      research: res.text,
      cropProducts: prods,
      catalog: (catalog || []).filter(p => !p.hidden),
      trends,
      transcript: txRows.slice().reverse().map(r => ({ kind: r.kind, author: r.author, body: r.body })),
      question,
      sources: res.sources
    })

    const text = await openai.chat({
      messages: [{ role: 'user', content: question || 'Give the War Room a focused situation brief and recommended next moves for this case.' }],
      system, temperature: 0.3, maxTokens: 900
    })

    const rows = await query(
      `INSERT INTO meeting_messages (meeting_id, author_id, author, kind, body, sources)
       VALUES ($1, NULL, 'War Room AI', 'ai', $2, $3) RETURNING *`,
      [id, text, JSON.stringify(res.sources || [])]
    )
    await query('UPDATE meetings SET updated_at = NOW() WHERE id = $1', [id])

    // Persist research provenance for audit (mirrors the Doctor path).
    await query(
      `INSERT INTO research_records (user_id, case_id, query, crop, findings, sources, confidence)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [req.user.id, m.case_id, clip(researchQuery, 500), cropId,
        clip(res.text, 6000), JSON.stringify(res.sources || []), res.confidence || '']
    )

    res.json({ message: shapeMessage(rows[0], req.user.id) })
  } catch (err) {
    console.error('[meetings] ask-ai failed:', err.code || 'upstream', err.message)
    res.status(502).json({
      error: 'ai_unavailable', code: err.code || 'upstream',
      message: lang === 'en'
        ? 'The War Room AI could not be reached. Please try again.'
        : 'AI y\'icyumba cy\'inama ntabwo yabashije kuboneka. Ongera ugerageze.'
    })
  }
})

// POST /api/meetings/:id/status  { status: 'open'|'closed' }
router.post('/:id/status', async (req, res) => {
  const id = Number(req.params.id)
  const status = String(req.body.status || '')
  if (!['open', 'closed'].includes(status)) return res.status(400).json({ error: 'bad_status' })
  try {
    const m = await getMeeting(id)
    if (!m) return res.status(404).json({ error: 'meeting_not_found' })
    await query('UPDATE meetings SET status = $2, updated_at = NOW() WHERE id = $1', [id, status])
    const me = await query('SELECT name FROM users WHERE id = $1', [req.user.id])
    const author = clip((me[0] && me[0].name) || 'Agronomist', 120)
    await query(
      `INSERT INTO meeting_messages (meeting_id, author_id, author, kind, body)
       VALUES ($1, NULL, '', 'system', $2)`,
      [id, status === 'closed' ? `Meeting closed by ${author}.` : `Meeting reopened by ${author}.`]
    )
    res.json({ ok: true, status })
  } catch (err) {
    res.status(500).json({ error: 'status_failed', message: err.message })
  }
})

module.exports = router
