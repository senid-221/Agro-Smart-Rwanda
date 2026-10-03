const express = require('express')
const { query } = require('../db')
const openai = require('../openai')
const vision = require('../vision')
const research = require('../research')
const knowledge = require('../knowledge')
const analytics = require('../analytics')
const { requireAuth } = require('../middleware/auth')
const { allProducts, providerData } = require('./catalog')

const router = express.Router()

// Upstream error detail (HTTP status + OpenAI reason) is useful for debugging but
// can contain the OpenAI project id, so only send it to clients outside production.
// It is always logged server-side regardless.
const IS_PROD = process.env.NODE_ENV === 'production'
const diagDetail = (err) => (IS_PROD ? '' : (err && err.detail) || '')

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
       SELECT kind, note, images, status_change, created_at, id
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
// Kinyarwanda sickness/pest stems matched as substrings so every conjugation is
// caught (urwaye/kirwaye/zirarwaye/bararwaye → 'rwaye'; indwara → 'ndwara').
const SICK_STEMS = ['rwaye', 'ndwara', 'onnyi', 'dukoko', 'borera', 'nyunyuka']
function looksLikeProblem(message, cropId) {
  const raw = String(message || '').toLowerCase().replace(/[^a-z']+/g, ' ')
  const hay = ' ' + raw + ' '
  if (PROBLEM_WORDS.some(w => hay.includes(' ' + w + ' '))) return true
  if (SICK_STEMS.some(s => raw.includes(s))) return true
  return cropId ? knowledge.detectDiseases(message, cropId).length > 0 : false
}

// Concrete symptom descriptors. When the farmer actually describes what they see
// (colour, spots, wilting, holes, mould, a named pest…) we have enough to reason
// about; a bare "my crop is sick" does NOT count and must be met with a photo
// request instead of a guess.
const SYMPTOM_WORDS = [
  'spot', 'spots', 'lesion', 'lesions', 'yellow', 'yellowing', 'white', 'brown',
  'black', 'grey', 'gray', 'wilt', 'wilting', 'drooping', 'curl', 'curled',
  'curling', 'hole', 'holes', 'eaten', 'chewed', 'rot', 'rotting', 'mould',
  'mold', 'powdery', 'blister', 'canker', 'dead', 'dry', 'dried', 'necrosis',
  'necrotic', 'stunted', 'frass', 'eggs', 'worm', 'worms', 'caterpillar',
  'larvae', 'aphid', 'aphids', 'whitefly', 'blight', 'rust', 'mildew', 'ooze',
  'gall', 'galls', 'swollen', 'mottled', 'streak', 'streaks', 'webbing',
  'umuhondo', 'umuhindo', 'ibara', 'amabara', 'ududomo', 'utudomo', 'ibisebe',
  'ibikomere', 'kubora', 'kunyunyuka', 'kwama', 'imyobo', 'udukoko', 'imungu',
  'ibinyugunyugu', 'ishwagara', 'urubura'
]
// True when the farmer gave a real, describable symptom (colour, spots, wilting,
// holes, mould, a named pest…) — enough to reason about without a photo first.
// Deliberately lexicon-only: knowledge.detectDiseases matches on the crop name
// alone (e.g. "inyanya" appears in a tomato disease's symptoms), so it would
// wrongly count a bare "my tomatoes are sick" as a described symptom.
function hasSpecificSymptom(message) {
  const hay = ' ' + String(message || '').toLowerCase().replace(/[^a-z']+/g, ' ') + ' '
  return SYMPTOM_WORDS.some(w => hay.includes(' ' + w + ' '))
}

// Localised display name for a crop id (used in the photo-request reply).
function cropName(cropId, lang) {
  if (!cropId) return ''
  const c = (knowledge.load().crops || {})[cropId]
  if (!c) return ''
  return (lang === 'en' ? (c.en || c.rw) : (c.rw || c.en)) || ''
}

// The deterministic "I can't see it — send a photo" reply. Returned WITHOUT
// calling the model when a farmer reports a sick plant but attached no photo and
// described no symptoms, so the Doctor never invents a diagnosis for a plant it
// has not looked at (and no paid AI call is spent).
function photoRequest(lang, cropId) {
  const name = cropName(cropId, lang)
  if (lang === 'en') {
    const crop = name || 'the plant'
    return 'Send me a clear photo of ' + crop + ' so I can see what is wrong — show the affected leaf, branch, stem or flower. Once I see it I will tell you what it is and how to treat it.\n\n' +
      'If you cannot send a photo, describe exactly what you see: which part is affected, the colour, any spots, holes, wilting or mould, how it started and how it is spreading, and your district.'
  }
  const crop = name || 'ikimera'
  return "Ohereza ifoto isobanutse y'" + crop + ' ndebe icyo kirwaye — wereke ikibabi, ishami, umuhimba cyangwa indabo byagizweho ingaruka. Nimara kuyibona nzakubwira neza icyo ari cyo n\u2019uko wabivura.\n\n' +
    'Niba udashobora kohereza ifoto, sobanura neza ibyo ubona: igice cyagizweho ingaruka, ibara, niba hari ududomo, imyobo, kunyunyuka cyangwa kubora, uko byatangiye n\u2019uko biri gukwira, n\u2019akarere uherereyemo.'
}

// Core Doctor turn: research → build prompt (case + history + research + vision)
// → call the model → persist conversation, case observation and research record.
async function doctorTurn(userId, { message, lang, ctx = {}, kind = 'report', statusChange = '' }) {
  // Evidence gate (deterministic): a farmer reporting a sick plant with no photo
  // and no described symptoms gets asked for a photo first — never a guess. An
  // open case does NOT lift the gate (the Doctor still hasn't seen the plant);
  // only an attached photo/scan result does. The gate keeps the case link so a
  // follow-up stays on its case.
  const earlyCrop = knowledge.detectCrop(message)
  const hasPhoto = !!(ctx && ctx.scan && String(ctx.scan).trim())
  if (!hasPhoto && looksLikeProblem(message, earlyCrop) && !hasSpecificSymptom(message)) {
    const ask = photoRequest(lang, earlyCrop)
    const gateCaseId = ctx.caseId || null
    await query(
      'INSERT INTO ai_messages (user_id, role, content, case_id) VALUES ($1, $2, $3, $4)',
      [userId, 'user', message, gateCaseId]
    )
    await query(
      'INSERT INTO ai_messages (user_id, role, content, case_id) VALUES ($1, $2, $3, $4)',
      [userId, 'assistant', ask, gateCaseId]
    )
    return { text: ask, caseId: gateCaseId, cropId: earlyCrop, sources: [], confidence: 'low', emergency: { emergency: false, reason: '' }, needPhoto: true }
  }

  const res = await research.research(message, lang)
  const cropId = res.cropId
  const isHealthProblem = looksLikeProblem(message, cropId)
  const caseRow = await resolveCase(userId, ctx, cropId, message, isHealthProblem)

  // Emergency Crop Alert: flag notifiable / rapidly spreading / severe problems.
  const em = analytics.emergency({ text: message, diseases: knowledge.detectDiseases(message, cropId) })

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
           emergency = $4,
           emergency_reason = $5,
           status = CASE WHEN status = 'open' THEN 'monitoring' ELSE status END
       WHERE id = $1`,
      [caseRow.id, clip(message, 1000), cropId || '', em.emergency, em.reason]
    )
  }

  // Store research provenance (evidence + sources + confidence) for audit.
  await query(
    `INSERT INTO research_records (user_id, case_id, query, crop, findings, sources, confidence)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [userId, caseRow ? caseRow.id : null, clip(message, 500), cropId || '',
      clip(res.text, MAX_FINDINGS), JSON.stringify(res.sources || []), res.confidence || '']
  )

  return { text, caseId: caseRow ? caseRow.id : null, cropId, sources: res.sources, confidence: res.confidence, emergency: em }
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
    res.json({ intent: 'remote', ctx, text: out.text, caseId: out.caseId, cropId: out.cropId, sources: out.sources, confidence: out.confidence, emergency: out.emergency })
  } catch (err) {
    console.error('[ai] upstream failure:', err.code || 'upstream', err.message)
    res.status(502).json({
      error: 'ai_unavailable', code: err.code || 'upstream', detail: diagDetail(err),
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
    const crops = knowledge.cropVocabulary()
    const { text, isPlant, cropId: rawCrop, cropConfidence } = await vision.analyze({ dataUrl, lang, cropHint, crops })
    // Not a plant: never fabricate a crop diagnosis. Tell the farmer plainly and
    // ask for a photo of the actual plant. No observation is stored on the case.
    if (!isPlant) {
      return res.json({
        findings: '',
        isPlant: false,
        cropId: null,
        message: lang === 'en'
          ? 'This photo does not show a plant or crop. Please scan the actual plant — get a clear, close photo of the affected leaf, stem or fruit so the AI can help.'
          : 'Iyi foto ntabwo irimo igihingwa cyangwa ikimera. Nyamuneka suzuma igihingwa nyirizina — fata ifoto isobanutse yegereye y\'ibabi, ishami cyangwa umusaruro byagizweho ingaruka kugira ngo AI igufashe.'
      })
    }
    // Trust ONLY the crop the model identified from the image, and only if it is
    // one the app has data for. The farmer's hint never overrides the image (that
    // is exactly the wrong-crop bug we are fixing); if the id is unknown or
    // unparseable we stay honest and return null rather than guessing.
    const cropId = knowledge.isKnownCrop(rawCrop) ? rawCrop : null
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
    res.json({ findings: text, isPlant: true, cropId, cropConfidence: cropConfidence || '' })
  } catch (err) {
    console.error('[ai/analyze] upstream failure:', err.code || 'upstream', err.message)
    res.status(502).json({
      error: 'vision_unavailable', code: err.code || 'upstream', detail: diagDetail(err),
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
    res.json({ text: out.text, caseId: c.id, sources: out.sources, confidence: out.confidence, emergency: out.emergency })
  } catch (err) {
    console.error('[ai] upstream failure:', err.code || 'upstream', err.message)
    res.status(502).json({
      error: 'ai_unavailable', code: err.code || 'upstream', detail: diagDetail(err),
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

// ---------- Case Intelligence (deterministic, KB-grounded) ----------

const addDays = n => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)

const tasksFor = caseId =>
  query(
    `SELECT id, kind, title, detail, task_date, status FROM case_tasks
     WHERE case_id = $1 ORDER BY task_date ASC NULLS LAST, id ASC`,
    [caseId]
  )

// Build a Smart Treatment Plan from the knowledge base only — never invent a
// product, dose or chemical. Returns [{ kind, title, detail, offsetDays }].
function buildPlan(cropId, symptomsText) {
  const kb = knowledge.load()
  const matches = knowledge.detectDiseases(symptomsText || '', cropId)
  const top = matches[0] || null
  const tasks = []

  if (top) {
    const treat = (top.treatment && top.treatment.en) || []
    const name = (top.name && top.name.en) || 'the suspected disease'
    treat.slice(0, 2).forEach((t, i) =>
      tasks.push({ kind: 'treatment', offsetDays: i * 3, title: 'Treat: ' + name, detail: String(t) }))
    const prev = (top.organic && top.organic.en) || (top.prevention && top.prevention.en) || []
    if (prev.length) tasks.push({ kind: 'prevent', offsetDays: 7, title: 'Prevent recurrence', detail: String(prev[0]) })
  }

  tasks.push({
    kind: 'monitor', offsetDays: 2, title: 'Scout the affected plants',
    detail: 'Check affected plants every 2-3 days and record whether symptoms are improving, stable or worsening.'
  })

  const guide = (kb.guides || []).find(g => g.id === cropId)
  const fert = guide && guide.fertilizing && guide.fertilizing.en
  if (fert && fert.length) {
    tasks.push({ kind: 'prevent', offsetDays: 5, title: 'Support crop recovery', detail: String(fert[0]) })
  }

  return tasks.sort((a, b) => a.offsetDays - b.offsetDays)
}

// GET /api/ai/cases/:id/insights — timeline + recovery + effectiveness + tasks.
router.get('/cases/:id/insights', requireAuth, async (req, res) => {
  try {
    const c = await getCase(req.user.id, req.params.id)
    if (!c) return res.status(404).json({ error: 'case_not_found' })
    const obs = await observationsFor(c.id, 100)
    const tasks = await tasksFor(c.id)
    res.json({
      case: c,
      timeline: analytics.timeline(obs),
      recovery: analytics.recoveryScore(obs),
      effectiveness: analytics.effectiveness(obs),
      emergency: { emergency: !!c.emergency, reason: c.emergency_reason || '' },
      tasks
    })
  } catch (err) {
    res.status(500).json({ error: 'insights_failed', message: err.message })
  }
})

// POST /api/ai/cases/:id/plan — (re)generate the Smart Treatment Plan.
// Clears pending tasks and inserts the freshly built plan.
router.post('/cases/:id/plan', requireAuth, async (req, res) => {
  try {
    const c = await getCase(req.user.id, req.params.id)
    if (!c) return res.status(404).json({ error: 'case_not_found' })
    await query(`DELETE FROM case_tasks WHERE case_id = $1 AND status = 'pending'`, [c.id])
    const plan = buildPlan(c.crop, c.symptoms)
    for (const t of plan) {
      await query(
        `INSERT INTO case_tasks (case_id, user_id, kind, title, detail, task_date)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [c.id, req.user.id, t.kind, clip(t.title, 200), clip(t.detail, 2000), addDays(t.offsetDays)]
      )
    }
    res.json({ ok: true, tasks: await tasksFor(c.id) })
  } catch (err) {
    res.status(500).json({ error: 'plan_failed', message: err.message })
  }
})

// POST /api/ai/cases/:id/tasks  { kind, title, detail, taskDate } — add a task.
router.post('/cases/:id/tasks', requireAuth, async (req, res) => {
  try {
    const c = await getCase(req.user.id, req.params.id)
    if (!c) return res.status(404).json({ error: 'case_not_found' })
    const b = req.body || {}
    const kind = ['treatment', 'monitor', 'prevent', 'escalate'].includes(b.kind) ? b.kind : 'monitor'
    const title = clip(b.title || '', 200)
    if (!title) return res.status(400).json({ error: 'empty_title' })
    const rows = await query(
      `INSERT INTO case_tasks (case_id, user_id, kind, title, detail, task_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [c.id, req.user.id, kind, title, clip(b.detail || '', 2000), b.taskDate || null]
    )
    res.json({ ok: true, task: rows[0] })
  } catch (err) {
    res.status(500).json({ error: 'task_failed', message: err.message })
  }
})

// POST /api/ai/tasks/:taskId  { status } — complete/skip a task. Completing a
// 'treatment' task also records a treatment observation (feeds effectiveness).
router.post('/tasks/:taskId', requireAuth, async (req, res) => {
  try {
    const status = ['pending', 'done', 'skipped'].includes(req.body.status) ? req.body.status : 'done'
    const rows = await query(
      `SELECT * FROM case_tasks WHERE id = $1 AND user_id = $2`,
      [req.params.taskId, req.user.id]
    )
    const task = rows[0]
    if (!task) return res.status(404).json({ error: 'task_not_found' })
    await query(
      `UPDATE case_tasks SET status = $2, completed_at = CASE WHEN $2='done' THEN NOW() ELSE NULL END
       WHERE id = $1`,
      [task.id, status]
    )
    if (status === 'done' && task.kind === 'treatment') {
      await query(
        `INSERT INTO case_observations (case_id, user_id, kind, note)
         VALUES ($1, $2, 'treatment', $3)`,
        [task.case_id, req.user.id, clip('Applied treatment: ' + task.title + (task.detail ? ' — ' + task.detail : ''), 2000)]
      )
    }
    res.json({ ok: true, status })
  } catch (err) {
    res.status(500).json({ error: 'task_failed', message: err.message })
  }
})

// GET /api/ai/cases/:id/report — deterministic professional farm report text.
router.get('/cases/:id/report', requireAuth, async (req, res) => {
  try {
    const c = await getCase(req.user.id, req.params.id)
    if (!c) return res.status(404).json({ error: 'case_not_found' })
    const [obs, tasks] = await Promise.all([observationsFor(c.id, 100), tasksFor(c.id)])
    const recovery = analytics.recoveryScore(obs)
    const eff = analytics.effectiveness(obs)

    const lines = []
    lines.push('CROP HEALTH REPORT')
    lines.push('Generated: ' + new Date().toISOString().slice(0, 10))
    lines.push('')
    lines.push('Case #' + c.id + ' — ' + (c.crop || 'crop'))
    if (c.variety) lines.push('Variety: ' + c.variety)
    if (c.district || c.sector) lines.push('Location: ' + [c.sector, c.district].filter(Boolean).join(', '))
    lines.push('Status: ' + c.status)
    lines.push('')
    lines.push('Reported symptoms:')
    lines.push('  ' + (c.symptoms || '(none recorded)'))
    lines.push('')
    lines.push('Recovery score: ' +
      (recovery.score == null ? 'insufficient data' : recovery.score + '/100 (' + recovery.label + ', ' + recovery.dataPoints + ' follow-up(s))'))
    lines.push('Treatment effectiveness: ' + eff.verdict)
    lines.push('  ' + eff.evidence)
    if (c.emergency) {
      lines.push('')
      lines.push('EMERGENCY ALERT: ' + (c.emergency_reason || 'serious problem detected'))
    }
    lines.push('')
    lines.push('Action plan (' + tasks.length + ' task(s)):')
    tasks.forEach(t => {
      lines.push('  [' + t.status + '] ' + (t.task_date || 'no date') + ' — ' + t.kind + ': ' + t.title)
      if (t.detail) lines.push('        ' + t.detail)
    })
    lines.push('')
    lines.push('Progress timeline:')
    analytics.timeline(obs).forEach(day => {
      lines.push('  ' + day.date + ':')
      day.events.forEach(e => lines.push('    - ' + e.kind + (e.statusChange ? ' (' + e.statusChange + ')' : '') + ': ' + (e.note || '').slice(0, 120)))
    })
    lines.push('')
    lines.push('Note: advice is grounded in RAB and verified Rwanda crop-protection knowledge. For notifiable or severe problems, contact RAB.')

    res.json({ report: lines.join('\n'), case: c, recovery, effectiveness: eff, tasks })
  } catch (err) {
    res.status(500).json({ error: 'report_failed', message: err.message })
  }
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
