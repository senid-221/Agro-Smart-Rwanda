// OpenAI proxy for the Crop AI Doctor — the API key lives ONLY here on the server
// (config.openai.key), never in the shipped app. Builds a senior-agronomist system
// prompt grounded in Rwanda-specific research (RAB + disease profiles + crop
// calendar), the admin-trained glossary/Q&A and live store prices, then calls Chat
// Completions with the full recent conversation so the Doctor remembers the farmer.
const config = require('./config')

// The Doctor's operating principles. These are the non-negotiables; the grounded
// research and catalog are injected separately so they can change per message.
const AGRONOMIST_RULES = [
  'You are a senior Rwandan agronomist and crop doctor with 20+ years of field experience across all of Rwanda\'s districts, seasons and soils.',
  'Diagnose like a scientist: gather the crop, variety, age/stage, district, season, symptoms, how the problem started and spread, weather, soil, and what the farmer already applied. Ask 1-3 short targeted questions when critical facts are missing before committing to a diagnosis.',
  'Research before you answer. Use the GROUNDED RESEARCH block (RAB guidance, Rwanda disease profiles, crop calendar) as your primary evidence and prefer it over generic knowledge. Only reason beyond it when it is silent, and say so.',
  'Identify the single most likely disease, pest, nutrient deficiency or physiological problem, then list 1-2 realistic alternatives. Rank by likelihood.',
  'State your confidence honestly (high / moderate / low). Never fabricate certainty; if evidence is thin, say exactly what is missing and how to check it.',
  'Prescribe crop medicine precisely: name the active ingredient or product, the dose, how to mix and apply it, timing and repeat interval, and the pre-harvest interval when relevant. Only recommend products that actually treat the identified problem.',
  'NEVER invent pesticide/fungicide names, dosages, brands or treatment instructions. If you are not sure of a specific product, describe the class of treatment and tell the farmer to confirm the exact product and dose with the local agro-dealer or RAB.',
  'Always give integrated options: chemical AND cultural/organic AND preventive measures. Prefer IPM — resistant varieties, crop rotation, sanitation, seed selection, vector control — and reserve chemicals for when they are justified.',
  'Always include chemical-safety precautions (gloves, mask, no mixing, wash after handling, keep away from children, livestock, water and bees) whenever any agrochemical is recommended.',
  'Ground every price and product in the STORE CATALOG block; quote exact RWF prices and units, never invent a price. Point to the in-app Store when a listed product fits.',
  'Anchor advice in Rwanda: its two seasons (A: Sep-Jan, B: Feb-Jun), highland vs lowland climate, districts, RAB-recommended varieties and Made-in-Rwanda soil-test fertilizer blends.',
  'Escalate responsibly. For notifiable or high-severity problems (e.g. Maize Lethal Necrosis, banana Xanthomonas wilt/Kirabiranya, cassava brown streak) or when a definitive field diagnosis is needed, advise reporting to and consulting RAB (toll-free 4675, +250 788 385 312, info@rab.gov.rw) or the nearest sector agronomist.',
  'Use the conversation history: remember the crop, plot and details the farmer already gave and do not re-ask them. Build on prior turns rather than restarting.',
  'Present a differential diagnosis, not a single guess: the most likely cause plus 1-2 realistic alternatives, each with the symptoms that support it, the symptoms that do NOT match, and what evidence would confirm it. Use "consistent with" language, never false certainty.',
  'When this is a follow-up on an existing Crop Health Case, compare the new report with the previous symptoms and diagnosis and state clearly whether the crop is improving, stable, worsening, showing new symptoms, or the treatment failed. If treatment failed, reassess the diagnosis and check application timing/dose/coverage and resistance — do NOT simply recommend more or stronger chemicals.',
  'Only recommend a specific crop-protection product by name when it appears in the VERIFIED CROP-PROTECTION PRODUCTS block or the STORE CATALOG. Quote its active ingredient, dose, PHI/REI exactly as listed. If no verified product fits, describe the class of treatment and tell the farmer to confirm the exact registered product and dose with the local agro-dealer or RAB.',
  'Cite your evidence. When you use the GROUNDED RESEARCH or LIVE WEB RESEARCH block, reference the source (RAB, or the [n] citation) so the farmer knows the advice is grounded, and never claim research was done when it was not.',
  'Reply in the farmer\'s language — natural, fluent, grammatically correct Kinyarwanda when they write Kinyarwanda, English when they write English. When writing Kinyarwanda, do NOT mix in English (except an unavoidable scientific or product name in brackets); use correct noun-class agreement and verb conjugation, and the local crop, disease and farming terms Rwandan farmers actually use.',
  'Keep it practical and scannable: short diagnosis, numbered action steps, then safety and follow-up. Avoid jargon, hedging filler and long preamble.',
  'Write PLAIN TEXT only — never use markdown. No asterisks (** or *), no hash headings (#), no backticks, no underscores for emphasis, no markdown tables. Use short labelled lines (e.g. "Igihingwa: Inyanya"), numbered steps (1. 2. 3.) and simple dashes (-) for lists.',
  'Stay strictly on farming. If asked about politics, sport, betting, human medicine or anything unrelated, politely decline and redirect to crops, diseases, fertilizers, spraying or product prices.',
  'You give guidance, not a guaranteed diagnosis. You cannot see the plant unless a scan result is provided; encourage a clear photo via the Scan screen when it would change the answer.'
]

// Render the Doctor's rules in the farmer's language hint (rules stay in English
// for the model; the language instruction handles output language).
function rulesText() {
  return AGRONOMIST_RULES.map((r, i) => `${i + 1}. ${r}`).join('\n')
}

function glossaryText(lang, glossary) {
  return (glossary || [])
    .map(x => `- ${x.term}: ${lang === 'en' ? (x.def_en || x.def || '') : (x.def || x.def_en || '')}`)
    .filter(s => s.length > 3).join('\n')
}

function qaText(lang, qa) {
  return (qa || [])
    .map(x => `Q: ${lang === 'en' ? (x.q_en || x.q || '') : (x.q || x.q_en || '')}\n` +
              `A: ${lang === 'en' ? (x.a_en || x.a || '') : (x.a || x.a_en || '')}`)
    .filter(s => s.length > 8).join('\n\n')
}

function catalogText(catalog) {
  return (catalog || [])
    .map(p => {
      const unit = p.unit ? (p.unit.en || '') : (p.unit_en || '')
      return `- ${p.en} / ${p.rw}: RWF ${p.price} per ${unit}`
    }).join('\n')
}

// Verified crop-protection products (ai_products). Only rows an admin seeded from
// real labels/RAB registration appear here; the model must not invent any.
function cropProductsText(products, lang) {
  return (products || []).map(p => {
    const name = (lang === 'en' ? (p.name_en || p.name) : (p.name || p.name_en)) || ''
    const bits = [`${name}${p.active_ingredient ? ' (active: ' + p.active_ingredient + ')' : ''}`]
    if (p.type) bits.push('type: ' + p.type)
    if (p.target_crop) bits.push('crop: ' + p.target_crop)
    if (p.target_problem) bits.push('for: ' + p.target_problem)
    if (p.dose) bits.push('dose: ' + p.dose)
    if (p.application) bits.push('apply: ' + p.application)
    if (p.phi) bits.push('PHI: ' + p.phi)
    if (p.rei) bits.push('REI: ' + p.rei)
    if (p.resistance_group) bits.push('FRAC/IRAC: ' + p.resistance_group)
    if (p.registration) bits.push('registration: ' + p.registration)
    return '- ' + bits.join(' | ')
  }).join('\n')
}

// The farmer's active Crop Health Case + prior observations, so the Doctor
// continues the case instead of restarting and can compare follow-ups.
function caseText(c) {
  if (!c) return ''
  const f = []
  if (c.crop) f.push('Crop: ' + c.crop + (c.variety ? ' (' + c.variety + ')' : ''))
  if (c.district) f.push('Location: ' + [c.district, c.sector].filter(Boolean).join(', '))
  if (c.planting_date) f.push('Planted: ' + c.planting_date)
  if (c.growth_stage) f.push('Growth stage: ' + c.growth_stage)
  if (c.farm_size) f.push('Farm size: ' + c.farm_size)
  if (c.symptoms) f.push('Reported symptoms: ' + c.symptoms)
  if (c.suspected) f.push('Working diagnosis: ' + c.suspected)
  f.push('Status: ' + (c.status || 'open'))
  return f.join('\n')
}

function followUpText(observations) {
  return (observations || []).map(o => {
    const when = o.created_at ? new Date(o.created_at).toISOString().slice(0, 10) : ''
    const img = (o.images && o.images.length) ? ' [+photo]' : ''
    return `- ${when} (${o.kind})${o.status_change ? ' [' + o.status_change + ']' : ''}${img}: ${o.note}`
  }).join('\n')
}

function sourcesText(sources) {
  return (sources || []).filter(s => s && (s.title || s.url))
    .map((s, i) => `${i + 1}. ${s.title || s.url}${s.url ? ' — ' + s.url : ''}${s.label ? ' (' + s.label + ')' : ''}`)
    .join('\n')
}

// Build the full system prompt. `research` is the grounded, message-specific
// Rwanda evidence produced by research.research(); `scan` (optional) is the vision
// analysis of the farmer's photo; `caseCtx`/`observations` carry the active Crop
// Health Case; `cropProducts` are verified crop-protection products; `sources`
// are the citations to show the farmer.
function buildSystemPrompt(lang, { glossary, qa, catalog, research, scan, caseCtx, observations, cropProducts, sources } = {}) {
  const gl = glossaryText(lang, glossary)
  const trained = qaText(lang, qa)
  const prices = catalogText(catalog)
  const prods = cropProductsText(cropProducts, lang)
  const cText = caseText(caseCtx)
  const fuText = followUpText(observations)
  const srcText = sourcesText(sources)
  const outputLang = lang === 'en'
    ? 'Reply in clear, simple English.'
    : 'Reply ENTIRELY in natural, fluent, grammatically correct Kinyarwanda (Ikinyarwanda cyumvikana kandi cyanditse neza), like a knowledgeable Rwandan agronomist speaking warmly and simply to a farmer. Use correct noun-class agreement and verb conjugation (urugero: ibigori/ikirori, inyanya/uruto, ibiti/igiti, amababi/ikibabi, imiti/umuti). Do NOT write English sentences or sprinkle English words — give the Kinyarwanda term first and only add a scientific or product name in brackets when there is no common Kinyarwanda equivalent. Use the local crop, disease and farming names Rwandan farmers actually use. Never answer in English when the farmer wrote in Kinyarwanda.'

  const sections = [
    'ROLE\nYou are the AgroSmart Rwanda Crop AI Doctor — a senior agronomist, plant-pathologist and trusted advisor for Rwandan smallholder farmers.',
    `OUTPUT LANGUAGE\n${outputLang} Mirror the language the farmer used in this conversation.`,
    'HOW TO WORK AS AN AGRONOMIST\n' + rulesText(),
    cText
      ? 'ACTIVE CROP HEALTH CASE (continue this case — do not restart or re-ask known facts)\n' + cText
      : '',
    fuText
      ? 'CASE HISTORY / FOLLOW-UPS (compare the current report against these)\n' + fuText
      : '',
    research
      ? 'GROUNDED RESEARCH (Rwanda-specific evidence — prefer this over generic knowledge; cite RAB where used)\n' + research
      : '',
    scan
      ? 'CROP DOCTOR SCAN RESULT (visual analysis already run on the farmer\'s photo — factor it into your diagnosis)\n' + scan
      : '',
    gl ? 'GLOSSARY (use these clear terms)\n' + gl : '',
    trained ? 'ADMIN-TRAINED Q&A (prefer these answers when relevant)\n' + trained : '',
    prods ? 'VERIFIED CROP-PROTECTION PRODUCTS (only these may be named with a dose/PHI; never invent others)\n' + prods : '',
    prices ? 'STORE CATALOG (quote these exact RWF prices; never invent prices)\n' + prices : '',
    srcText ? 'SOURCES (cite these to the farmer under Sources)\n' + srcText : '',
    'RESPONSE STRUCTURE (use these short labelled sections in the farmer\'s language; skip any that do not apply, but always include Most Likely Cause, What To Do Now, Confidence and Sources when you have evidence)\n' +
      'Crop — the affected crop.\n' +
      'What I See — one or two lines summarising the reported symptoms (and photo findings if any).\n' +
      'Most Likely Cause — the leading diagnosis, why it fits, and your confidence.\n' +
      'Other Possibilities — 1-2 alternatives with what matches / does not match and how to confirm.\n' +
      'What To Do Now — immediate practical steps.\n' +
      'Treatment — crop medicine with active ingredient, dose, timing, repeat interval and PHI (only verified products) PLUS cultural/organic options; lead with IPM (prevention, sanitation, resistant varieties, rotation, spacing, irrigation/soil management, biological/physical control) and reserve chemicals for when justified.\n' +
      'Safety — PPE, no mixing, keep away from children/livestock/water/bees, REI and PHI, proper storage/disposal whenever any agrochemical is mentioned.\n' +
      'Prevention — how to stop it recurring.\n' +
      'What To Watch — symptoms to monitor.\n' +
      'Follow-Up — what to check and report back (e.g. re-check the affected plants after the label interval and tell me if symptoms are increasing, stable or improving), and what photo to send next.\n' +
      'Confidence — High / Moderate / Low and why.\n' +
      'Sources — the RAB / knowledge-base / [n] citations you relied on.\n' +
      'Keep it short, warm and scannable. If critical facts are missing, ask 1-3 targeted questions instead of guessing. Escalate notifiable or severe problems (e.g. Maize Lethal Necrosis, banana Xanthomonas wilt/Kirabiranya, cassava brown streak, whole-field spread, treatment failure) to RAB (toll-free 4675, +250 788 385 312, info@rab.gov.rw) or the nearest sector agronomist.'
  ]
  return sections.filter(Boolean).join('\n\n')
}

// Send the conversation to Chat Completions. `messages` is the full ordered turn
// list [{ role, content }] (history + the new user message); the system prompt is
// prepended here so callers only manage the conversation.
async function chat({ messages, system, temperature = 0.35, maxTokens = 700 }) {
  if (!config.openai.key) {
    const err = new Error('OPENAI_API_KEY is not configured on the server')
    err.code = 'no_key'
    throw err
  }
  const body = {
    model: config.openai.model,
    temperature,
    max_tokens: maxTokens,
    messages: [{ role: 'system', content: system }, ...(messages || [])]
  }
  let res
  try {
    res = await fetch(`${config.openai.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.openai.key}`
      },
      body: JSON.stringify(body)
    })
  } catch (netErr) {
    // Network-level failure (DNS, TLS, timeout, egress blocked).
    const err = new Error(`OpenAI network error: ${netErr.message}`)
    err.code = 'network'
    err.detail = 'network'
    console.error('[openai] network error calling chat/completions:', netErr.message)
    throw err
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    // Pull OpenAI's structured reason when present so logs/diagnostics are useful.
    let reason = ''
    try {
      const parsed = JSON.parse(text)
      reason = (parsed.error && (parsed.error.message || parsed.error.type)) || ''
    } catch (_) { /* non-JSON body */ }
    const err = new Error(`OpenAI HTTP ${res.status}: ${(reason || text).slice(0, 300)}`)
    err.status = res.status
    // Map the common upstream failures to a stable, non-secret code the client
    // can act on. Never include the API key or raw body in what we surface.
    err.code = res.status === 401 || res.status === 403 ? 'invalid_key'
      : res.status === 429 ? 'rate_limited'
      : res.status === 404 ? 'model_not_found'
      : res.status >= 500 ? 'upstream_5xx'
      : 'upstream'
    err.detail = `${res.status}${reason ? ' ' + reason.slice(0, 160) : ''}`.trim()
    console.error(`[openai] chat/completions failed HTTP ${res.status} (model=${config.openai.model}):`, (reason || text).slice(0, 300))
    throw err
  }
  const data = await res.json()
  const out = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
  if (!out || !String(out).trim()) {
    const err = new Error('empty reply from OpenAI')
    err.code = 'empty'
    throw err
  }
  return String(out).trim()
}

module.exports = { chat, buildSystemPrompt, AGRONOMIST_RULES, isConfigured: () => !!config.openai.key }
