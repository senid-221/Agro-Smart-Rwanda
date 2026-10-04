// Vision analysis for the AI Crop Scanner (the Crop AI Doctor's eyes).
//
// Sends one or more of a farmer's plant photos to a vision-capable model and asks
// for a STRICT JSON object: a universal plant identification (ANY plant, not just
// the app's catalog crops), an image-quality verdict, a health/disease assessment
// with a ranked differential and honest confidence, pest detection, IPM-first
// treatment guidance, prevention, care for healthy plants, chemical-safety notes
// and limitations. The model reports what it SEES and gives general, class-level
// treatment guidance only — it NEVER names a specific product, brand, active
// ingredient, dose or PHI (those come only from the verified-products gate in the
// agronomist chat), so the no-fabrication doctrine holds.
//
// The result is normalised into a stable shape the client can rely on, and also
// exposes the legacy { text, isPlant, cropId, cropConfidence, part } fields so the
// existing scan sheet and assistant chat keep working unchanged.
const config = require('./config')

// The plant parts the model may name (controlled set). Anything else is dropped.
const PARTS = ['seed', 'seedling', 'root', 'stem', 'leaf', 'flower', 'fruit', 'whole_plant', 'other']
// Broad plant categories so ANY species can be classified, not just catalog crops.
const CATEGORIES = ['cereal', 'legume', 'vegetable', 'fruit', 'tree', 'flower', 'herb', 'weed', 'medicinal', 'ornamental', 'tuber', 'seedling', 'other']
// Cause categories for a diagnosis.
const CAUSES = ['fungal', 'bacterial', 'viral', 'nematode', 'environmental', 'nutritional', 'pest', 'physiological', 'unknown']
const STATUS = ['healthy', 'problem', 'unknown']
const SEVERITY = ['none', 'low', 'moderate', 'high', 'critical']
const QUALITY_ISSUES = ['blurry', 'dark', 'low_resolution', 'too_far', 'obscured', 'no_plant']
const CONF_WORDS = ['high', 'moderate', 'low']

// Build the system prompt. `cropLines` is the app's real crop catalog rendered as
// "id — English / Kinyarwanda (aliases)". The model may identify ANY plant it sees,
// but when the plant IS one of these catalog crops it must also set plant.cropId to
// that exact id so the scan maps to the keys the KB/RAB/soil data use.
function buildInstructions(cropLines, langName) {
  return [
    'You are an expert botanist, plant pathologist and crop-protection specialist examining photo(s) for a Rwandan smallholder farmer. You are as capable as a top-tier vision model. Look carefully at what is ACTUALLY in the image before you conclude anything, and never invent facts.',
    '',
    'WORK IN THIS ORDER:',
    '1. CHECK IMAGE QUALITY first. If the photo is blurry, too dark, very low resolution, the plant is too far away, partly hidden, or there is no plant at all, say so — set imageQuality.sufficient=false, list the issues, give short retake advice, and DO NOT give a confident diagnosis.',
    '2. IDENTIFY THE PLANT from what you see (leaf shape, venation, stem, flower/fruit, growth habit). You may identify ANY plant — crops, vegetables, fruits, trees, flowers, herbs, weeds, medicinal, ornamental, seedlings or wild/unknown plants. Give its common name (in ' + langName + '), scientific name, and a broad category.',
    '3. MAP TO THE CATALOG: if the plant is clearly one of the catalog crops below, set plant.cropId to that EXACT id; otherwise set plant.cropId to null. Never invent a catalog id.',
    '4. IDENTIFY THE PLANT PART that is the main subject (see part list).',
    '5. ASSESS HEALTH: is it healthy, is a problem visible, or unknown? Then give a ranked differential diagnosis with honest confidence, visible symptoms, pests, and IPM-first treatment guidance.',
    '',
    'THE FARMER\'S SUGGESTED CROP (if any) is only a HINT and is frequently WRONG or missing. Trust the IMAGE over the hint. Never force your answer to match a wrong hint.',
    '',
    'CROP CATALOG (use these ids for plant.cropId ONLY when the plant clearly matches; otherwise null):',
    cropLines || '(no catalog available — always use plant.cropId: null)',
    '',
    'HARD SAFETY RULES (non-negotiable):',
    '- NEVER invent or guess a product name, brand, active ingredient, dose, concentration, PHI/REI interval or registration number. Treatment must be GENERAL cultural / mechanical / biological / IPM practices, or a treatment CLASS (e.g. "a registered copper-based fungicide") with an explicit instruction to confirm the exact product, dose and pre-harvest interval with the local agro-dealer or RAB.',
    '- Order treatment by preference: cultural -> mechanical/physical -> biological -> IPM -> chemical (only when justified).',
    '- Never claim certainty. confidence numbers must be integers BELOW 100 and reflect real uncertainty; use "consistent with / likely / possible" language. Never write "100%" or "confirmed".',
    '- If visual evidence is insufficient, lower confidence, say what is missing, and put it in diagnosis.distinguishingInfo and warnings.',
    '- For serious, rapidly spreading or notifiable problems, add a warning to consult RAB or a professional agronomist.',
    '',
    'OUTPUT: reply with ONE valid JSON object ONLY — no markdown fences, no commentary, no text before or after. All human-readable strings (names, symptoms, advice, summary, treatment, warnings) MUST be written in ' + langName + '. Use this exact shape:',
    '{',
    '  "isPlant": true,',
    '  "imageQuality": { "sufficient": true, "issues": [], "advice": "" },',
    '  "plant": { "name": "", "scientificName": "", "category": "other", "cropId": null, "part": "leaf", "confidence": "moderate" },',
    '  "health": { "status": "unknown", "severity": "none" },',
    '  "diagnosis": {',
    '    "primary": { "name": "", "scientificName": "", "cause": "unknown", "confidence": 0 },',
    '    "alternatives": [ { "name": "", "cause": "unknown", "confidence": 0 } ],',
    '    "symptoms": [],',
    '    "distinguishingInfo": ""',
    '  },',
    '  "pest": { "detected": false, "name": "", "scientificName": "", "damage": "", "confidence": "low" },',
    '  "treatment": { "immediate": [], "shortTerm": [], "longTerm": [] },',
    '  "prevention": [],',
    '  "care": { "watering": "", "sunlight": "", "soil": "", "fertilization": "", "spacing": "", "pruning": "", "growthStage": "", "pestMonitoring": "", "harvest": "" },',
    '  "chemicalSafety": [],',
    '  "warnings": [],',
    '  "summary": ""',
    '}',
    '',
    'FIELD RULES:',
    '- isPlant: true if ANY plant/plant part is present (even healthy, even a weed or non-catalog plant); false only when there is genuinely no plant material (person, animal, building, tool, cooked food, blank frame). When in doubt about a green/leafy subject, use true.',
    '- imageQuality.issues: any of blurry, dark, low_resolution, too_far, obscured, no_plant. advice: one short sentence on how to retake (only when sufficient=false).',
    '- plant.category: one of ' + CATEGORIES.join(', ') + '. plant.part: one of ' + PARTS.join(', ') + '. plant.confidence: high|moderate|low (for the IDENTIFICATION).',
    '- health.status: healthy|problem|unknown. health.severity: none|low|moderate|high|critical.',
    '- diagnosis.primary.cause and alternatives[].cause: one of ' + CAUSES.join(', ') + '. confidence: integer 0-99. List 1-3 realistic alternatives ranked by likelihood; do not force a single answer. symptoms: short strings describing ONLY what you can see. distinguishingInfo: what extra evidence would separate the top possibilities.',
    '- pest.detected: true only if you actually see a pest or clear pest damage; describe it, do not guess.',
    '- treatment/prevention/chemicalSafety: arrays of short, GENERAL, safe action strings (IPM-first; no product names or doses). chemicalSafety: PPE, no mixing, keep away from children/livestock/water/bees, observe pre-harvest interval, seek professional advice — only when a chemical class is mentioned.',
    '- care: fill ONLY when health.status is "healthy" (or no problem is found); keep each field short and practical; leave "" for anything you cannot infer. Do not overwhelm.',
    '- When health.status is "healthy", leave diagnosis.primary.name "" and confidence 0, and focus on care.',
    '- summary: 2-4 plain sentences in ' + langName + ' that a farmer can read aloud — what the plant is, what you see, the most likely cause and the first thing to do. This is the text shown to the farmer.',
    '- If isPlant is false OR imageQuality.sufficient is false, keep the diagnosis minimal/empty, set health.status "unknown", and rely on summary + imageQuality.advice + warnings to tell the farmer what to do next.'
  ].join('\n')
}

// Render the crop catalog for the prompt: "maize — Maize / Ibigori (ibigori, corn)".
function renderCropLines(crops) {
  return (crops || [])
    .map(c => {
      const names = [c.en, c.rw].filter(Boolean).join(' / ')
      const al = (c.aliases || []).filter(a => a && a.toLowerCase() !== String(c.en || '').toLowerCase()).slice(0, 4)
      return `- ${c.id} — ${names}${al.length ? ' (' + al.join(', ') + ')' : ''}`
    })
    .join('\n')
}

// ---- tolerant helpers -------------------------------------------------------
const str = x => String(x == null ? '' : x).trim()
const lower = x => String(x == null ? '' : x).trim().toLowerCase()

function arr(x) {
  if (Array.isArray(x)) return x.map(v => (typeof v === 'string' ? str(v) : str(v && (v.name || v.text || v.detail)))).filter(Boolean)
  const s = str(x)
  return s ? [s] : []
}
const oneOf = (x, set, def) => { const v = lower(x); return set.includes(v) ? v : def }
function intConf(x) {
  const n = Math.round(Number(x))
  if (!Number.isFinite(n)) return null
  return Math.max(0, Math.min(99, n)) // never 100 — we never claim certainty
}
// Deterministic confidence band from a 0-99 integer (spec: High 80+, Moderate 50-79, Low <50).
const band = n => (n == null ? '' : (n >= 80 ? 'high' : n >= 50 ? 'moderate' : 'low'))

// Pull the first JSON object out of a model reply, tolerating ```json fences and
// any stray prose the model may wrap around it.
function extractJson(raw) {
  let s = String(raw || '').trim()
  if (!s) return null
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) s = fence[1].trim()
  try { return JSON.parse(s) } catch (_) { /* fall through to brace-scan */ }
  const start = s.indexOf('{')
  const end = s.lastIndexOf('}')
  if (start >= 0 && end > start) {
    try { return JSON.parse(s.slice(start, end + 1)) } catch (_) { /* give up */ }
  }
  return null
}

// Coerce whatever the model returned into the stable shape the client expects.
// Every key is always present so the frontend never has to null-check deeply.
function normalizeResult(obj, lang) {
  const o = obj && typeof obj === 'object' ? obj : {}
  const q = o.imageQuality && typeof o.imageQuality === 'object' ? o.imageQuality : {}
  const p = o.plant && typeof o.plant === 'object' ? o.plant : {}
  const h = o.health && typeof o.health === 'object' ? o.health : {}
  const d = o.diagnosis && typeof o.diagnosis === 'object' ? o.diagnosis : {}
  const pr = d.primary && typeof d.primary === 'object' ? d.primary : {}
  const pe = o.pest && typeof o.pest === 'object' ? o.pest : {}
  const t = o.treatment && typeof o.treatment === 'object' ? o.treatment : {}
  const care = o.care && typeof o.care === 'object' ? o.care : {}

  const isPlant = o.isPlant === undefined ? true : !!o.isPlant
  const issues = arr(q.issues).map(lower).filter(x => QUALITY_ISSUES.includes(x))
  const sufficient = q.sufficient === undefined ? true : !!q.sufficient

  const part = oneOf(p.part, PARTS, '') || null
  const cropIdRaw = lower(p.cropId)
  const cropId = cropIdRaw && cropIdRaw !== 'null' && cropIdRaw !== 'unknown' ? cropIdRaw : null
  const idConf = oneOf(p.confidence, CONF_WORDS, '')

  const primaryConf = intConf(pr.confidence)
  const alternatives = (Array.isArray(d.alternatives) ? d.alternatives : [])
    .map(a => (a && typeof a === 'object' ? a : { name: a }))
    .map(a => ({ name: str(a.name), cause: oneOf(a.cause, CAUSES, 'unknown'), confidence: intConf(a.confidence) }))
    .filter(a => a.name)
    .slice(0, 4)

  // Overall confidence band: from the primary diagnosis when there is a problem,
  // otherwise from the identification confidence word.
  let confidence = oneOf(o.confidence, CONF_WORDS, '')
  if (!confidence) confidence = primaryConf != null ? band(primaryConf) : (idConf || 'low')

  const structured = {
    isPlant,
    imageQuality: { sufficient, issues, advice: str(q.advice) },
    plant: {
      name: str(p.name), scientificName: str(p.scientificName),
      category: oneOf(p.category, CATEGORIES, 'other'),
      cropId, part, confidence: idConf || confidence || 'low'
    },
    health: { status: oneOf(h.status, STATUS, 'unknown'), severity: oneOf(h.severity, SEVERITY, 'none') },
    diagnosis: {
      primary: {
        name: str(pr.name), scientificName: str(pr.scientificName),
        cause: oneOf(pr.cause, CAUSES, 'unknown'), confidence: primaryConf
      },
      alternatives,
      symptoms: arr(d.symptoms).slice(0, 10),
      distinguishingInfo: str(d.distinguishingInfo)
    },
    pest: {
      detected: !!pe.detected, name: str(pe.name), scientificName: str(pe.scientificName),
      damage: str(pe.damage), confidence: oneOf(pe.confidence, CONF_WORDS, 'low')
    },
    treatment: {
      immediate: arr(t.immediate).slice(0, 6),
      shortTerm: arr(t.shortTerm).slice(0, 6),
      longTerm: arr(t.longTerm).slice(0, 6)
    },
    prevention: arr(o.prevention).slice(0, 6),
    care: {
      watering: str(care.watering), sunlight: str(care.sunlight), soil: str(care.soil),
      fertilization: str(care.fertilization), spacing: str(care.spacing), pruning: str(care.pruning),
      growthStage: str(care.growthStage), pestMonitoring: str(care.pestMonitoring), harvest: str(care.harvest)
    },
    chemicalSafety: arr(o.chemicalSafety).slice(0, 6),
    warnings: arr(o.warnings).slice(0, 6),
    confidence,
    summary: str(o.summary)
  }

  // A readable findings block for the legacy `text`/`findings` field and for the
  // chat's ctx.scan. Prefer the model's summary; compose a fallback if missing.
  let text = structured.summary
  if (!text) {
    const bits = []
    if (structured.plant.name) bits.push(structured.plant.name)
    if (structured.diagnosis.primary.name) bits.push(structured.diagnosis.primary.name)
    if (structured.diagnosis.symptoms.length) bits.push(structured.diagnosis.symptoms.join('; '))
    text = bits.join(' — ')
  }
  return { structured, text }
}

// Legacy header-line parser (SUBJECT/CROP/PART). Kept exported for backward
// compatibility with any caller/test that still imports it; the new JSON path
// does not use it.
function parseSubject(raw) {
  const lines = String(raw || '').split(/\r?\n/)
  let isPlant = true
  let cropId = null
  let cropConfidence = ''
  let part = null
  const kept = []
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i]
    if (i < 3 && /SUBJECT:/i.test(ln)) { isPlant = !/NOT[_ ]?PLANT/i.test(ln); continue }
    if (i < 5) {
      const cm = ln.match(/CROP:\s*([A-Za-z0-9_]+)\s*(?:\(\s*confidence:\s*([A-Za-z]+)\s*\))?/)
      if (cm) {
        const id = String(cm[1] || '').toLowerCase()
        if (id && id !== 'unknown') { cropId = id; cropConfidence = cm[2] ? String(cm[2]).toLowerCase() : '' }
        continue
      }
      const pm = ln.match(/PART:\s*([A-Za-z0-9_]+)/)
      if (pm) {
        const p = String(pm[1] || '').toLowerCase()
        if (PARTS.includes(p)) part = p
        continue
      }
    }
    kept.push(ln)
  }
  const body = kept.join('\n').trim()
  return { isPlant, cropId, cropConfidence, part, text: body || String(raw || '').trim() }
}

// Accepts { dataUrl } (single) or { dataUrls: [...] } (multi-image), plus
// { lang, cropHint, crops }. Returns the normalised structured result and the
// legacy fields, or throws when unconfigured / no valid image.
async function analyze({ dataUrl, dataUrls, lang, cropHint, crops }) {
  if (!config.openai.key) {
    const err = new Error('OPENAI_API_KEY is not configured on the server')
    err.code = 'no_key'
    throw err
  }
  // Normalise to a list of valid image data URLs (multi-image support without
  // breaking the single-image callers). Cap at 4 images to bound cost/latency.
  const images = (Array.isArray(dataUrls) && dataUrls.length ? dataUrls : [dataUrl])
    .map(u => str(u))
    .filter(u => /^data:image\//.test(u))
    .slice(0, 4)
  if (!images.length) {
    const err = new Error('a valid image data URL is required')
    err.code = 'bad_image'
    throw err
  }

  const langName = lang === 'en' ? 'English' : 'Kinyarwanda'
  const userText =
    (images.length > 1
      ? `These ${images.length} photos are of the SAME plant (whole plant, affected part, pest, etc.). Combine the evidence and analyse them together.`
      : 'Analyse this plant photo.') +
    ` Identify the plant, assess its health and reply with the JSON object only, in ${langName}.` +
    (cropHint ? ` Farmer's hint (may be wrong — trust the image): ${cropHint}.` : ' No crop hint was given — identify it yourself.')

  const content = [{ type: 'text', text: userText }]
  for (const url of images) content.push({ type: 'image_url', image_url: { url } })

  const messages = [
    { role: 'system', content: buildInstructions(renderCropLines(crops), langName) },
    { role: 'user', content }
  ]
  const base = { model: config.openai.visionModel, temperature: 0.2, max_tokens: 1800, messages }
  const post = (b) => fetch(`${config.openai.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.openai.key}` },
    body: JSON.stringify(b)
  })

  // Ask for strict JSON. If the provider/proxy rejects response_format (some do),
  // retry once without it and fall back to the JSON-only instruction + tolerant
  // parser, so a proxy quirk can never take down every scan.
  let res = await post(Object.assign({ response_format: { type: 'json_object' } }, base))
  if (res.status === 400) {
    const t400 = await res.text().catch(() => '')
    if (/response_format|json_object/i.test(t400)) {
      res = await post(base)
    } else {
      const err = new Error(`OpenAI vision HTTP 400: ${t400.slice(0, 200)}`)
      err.code = 'upstream'
      throw err
    }
  }
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    const err = new Error(`OpenAI vision HTTP ${res.status}: ${t.slice(0, 200)}`)
    err.code = 'upstream'
    throw err
  }
  const data = await res.json()
  const out = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
  const raw = typeof out === 'string' ? out : JSON.stringify(out || '')
  if (!raw.trim()) {
    const err = new Error('empty reply from vision model')
    err.code = 'empty'
    throw err
  }

  const obj = extractJson(raw)
  if (!obj) {
    // The model ignored the JSON instruction. Stay honest: treat the raw text as
    // the summary, assume a plant, and let the client show the findings.
    const fallback = normalizeResult({ isPlant: true, summary: raw.trim() }, lang)
    return {
      text: fallback.text, isPlant: true, cropId: null, cropConfidence: '', part: null,
      structured: fallback.structured, raw: raw.trim()
    }
  }

  const { structured, text } = normalizeResult(obj, lang)
  return {
    text,
    isPlant: structured.isPlant,
    cropId: structured.plant.cropId,
    cropConfidence: structured.plant.confidence,
    part: structured.plant.part,
    structured,
    raw: raw.trim()
  }
}

module.exports = {
  analyze, parseSubject, extractJson, normalizeResult,
  PARTS, CATEGORIES, CAUSES, STATUS, SEVERITY, QUALITY_ISSUES,
  isConfigured: () => !!config.openai.key
}
