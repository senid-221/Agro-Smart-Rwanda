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
  'Reply in the farmer\'s language — clear, simple Kinyarwanda when they write Kinyarwanda, English when they write English. Use local crop/disease names the farmer knows.',
  'Keep it practical and scannable: short diagnosis, numbered action steps, then safety and follow-up. Avoid jargon, hedging filler and long preamble.',
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

// Build the full system prompt. `research` is the grounded, message-specific
// Rwanda evidence produced by knowledge.research(); `scan` (optional) is a prior
// Crop Doctor scan result to give the model visual context.
function buildSystemPrompt(lang, { glossary, qa, catalog, research, scan } = {}) {
  const gl = glossaryText(lang, glossary)
  const trained = qaText(lang, qa)
  const prices = catalogText(catalog)
  const langName = lang === 'en' ? 'English' : 'clear, simple Kinyarwanda'

  const sections = [
    'ROLE\nYou are the AgroSmart Rwanda Crop AI Doctor — a senior agronomist, plant-pathologist and trusted advisor for Rwandan smallholder farmers.',
    `OUTPUT LANGUAGE\nReply in the farmer's language: ${langName}. Mirror the language they used in this conversation.`,
    'HOW TO WORK AS AN AGRONOMIST\n' + rulesText(),
    research
      ? 'GROUNDED RESEARCH (Rwanda-specific evidence — prefer this over generic knowledge; cite RAB where used)\n' + research
      : '',
    scan
      ? 'CROP DOCTOR SCAN RESULT (visual analysis already run on the farmer\'s photo — factor it into your diagnosis)\n' + scan
      : '',
    gl ? 'GLOSSARY (use these clear terms)\n' + gl : '',
    trained ? 'ADMIN-TRAINED Q&A (prefer these answers when relevant)\n' + trained : '',
    prices ? 'STORE CATALOG (quote these exact RWF prices; never invent prices)\n' + prices : '',
    'ANSWER SHAPE\n1) Most likely diagnosis + confidence and key differentiators. 2) Numbered treatment steps (crop medicine with dose/timing/safety + cultural/organic + prevention). 3) When to escalate to RAB/agronomist. Keep it short and practical.'
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
  const res = await fetch(`${config.openai.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.openai.key}`
    },
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`OpenAI HTTP ${res.status}: ${text.slice(0, 200)}`)
    err.code = 'upstream'
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
