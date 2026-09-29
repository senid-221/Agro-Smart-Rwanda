// Server-side research for the Crop AI Doctor.
// Loads the SAME offline knowledge files the frontend ships (diseases.js,
// crops.js, rab.js) into a VM sandbox — no data is duplicated — and turns a
// farmer's message into grounded, Rwanda-specific evidence that is injected into
// the agronomist prompt BEFORE the model answers. This is the "research first"
// step: RAB guidance + matching disease profiles + crop calendar/fertilizer.
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const config = require('./config')

let KB = null

function load() {
  if (KB) return KB
  const dataDir = path.join(config.staticDir, 'js', 'data')
  const sandbox = { window: {}, AS: {} }
  sandbox.window.AS = sandbox.AS
  sandbox.globalThis = sandbox
  vm.createContext(sandbox)
  for (const f of ['diseases.js', 'crops.js', 'rab.js']) {
    const full = path.join(dataDir, f)
    if (!fs.existsSync(full)) continue
    vm.runInContext(fs.readFileSync(full, 'utf8'), sandbox, { filename: f })
  }
  KB = {
    crops: sandbox.AS.CROPS || {},
    guides: sandbox.AS.CROP_GUIDES || [],
    diseases: sandbox.AS.DISEASES || [],
    rab: sandbox.AS.RAB || null
  }
  return KB
}

const words = s => ' ' + String(s || '').toLowerCase().replace(/[^a-z0-9']+/g, ' ') + ' '
const tokens = s => String(s || '').toLowerCase().split(/[^a-z']+/i).filter(w => w.length >= 4)

// Farmers write crop names in many forms (Kinyarwanda singular/plural, English,
// local aliases). Match any of these so research is triggered reliably.
const CROP_SYNONYMS = {
  maize: ['ibigori', 'maize', 'corn'],
  banana: ['ibitoki', 'igitoki', 'banana', 'bananas'],
  bean: ['ibishyimbo', 'beans', 'bean'],
  cassava: ['imyumbati', 'umwumbati', 'cassava', 'manioc'],
  potato: ['ibirayi', 'potato', 'potatoes', 'irish potato'],
  sweetpotato: ['ibijumba', 'ijumba', 'sweet potato', 'sweetpotato'],
  tomato: ['inyanya', 'tomato', 'tomatoes'],
  rice: ['umuceri', 'rice', 'paddy'],
  coffee: ['ikawa', 'coffee'],
  tea: ['icyayi', 'tea'],
  sorghum: ['amasaka', 'sorghum'],
  groundnut: ['ubunyobwa', 'groundnut', 'groundnuts', 'peanut', 'peanuts']
}

// Match a crop by any known name/synonym appearing in the text.
function detectCrop(text) {
  const { crops, guides } = load()
  const hay = words(text)
  const hit = names => names.filter(Boolean).some(n => hay.includes(' ' + String(n).toLowerCase() + ' '))
  // 1 — synonym map (covers plurals + English aliases)
  for (const [id, syns] of Object.entries(CROP_SYNONYMS)) {
    if (crops[id] && hit(syns)) return id
  }
  // 2 — guide/crop display names
  for (const g of guides) {
    const c = crops[g.id] || {}
    if (hit([c.en, c.rw, g.name && g.name.en, g.name && g.name.rw])) return g.id
  }
  for (const [id, c] of Object.entries(crops)) {
    if (hit([c.en, c.rw])) return id
  }
  return null
}

// Rank diseases for a crop by how many of the message's words hit their
// name/symptoms. Returns the best matches (most relevant first).
function detectDiseases(text, cropId) {
  const { diseases } = load()
  const toks = tokens(text)
  const scored = []
  for (const d of diseases) {
    if (cropId && d.crop !== cropId) continue
    const hay = words([d.name && d.name.en, d.name && d.name.rw, d.sci,
      ...(d.symptoms && d.symptoms.en) || [], ...(d.symptoms && d.symptoms.rw) || []].join(' '))
    let score = 0
    for (const w of toks) if (hay.includes(' ' + w + ' ') || hay.includes(w)) score++
    if (score > 0) scored.push({ d, score })
  }
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, 3).map(s => s.d)
}

const L = (obj, lang) => (obj ? (lang === 'en' ? (obj.en || obj.rw) : (obj.rw || obj.en)) || '' : '')
const list = (arr, lang) => (arr ? (lang === 'en' ? arr.en : arr.rw) || [] : [])

function diseaseBlock(d, lang) {
  const name = L(d.name, lang)
  const lines = [`• ${name}${d.sci ? ' (' + d.sci + ')' : ''} — severity: ${d.severity}`]
  const sym = list(d.symptoms, lang).slice(0, 4)
  if (sym.length) lines.push('  Symptoms: ' + sym.join('; '))
  if (d.cause) lines.push('  Cause: ' + L(d.cause, lang))
  const tr = list(d.treatment, lang).slice(0, 4)
  if (tr.length) lines.push('  Treatment (crop medicine): ' + tr.join('; '))
  const org = list(d.organic, lang).slice(0, 3)
  if (org.length) lines.push('  Organic/prevention: ' + org.join('; '))
  return lines.join('\n')
}

// Build the grounded research context injected into the system prompt.
// Returns { cropId, text } — text is '' when nothing relevant is found.
function research(message, lang) {
  const kb = load()
  const cropId = detectCrop(message)
  const parts = []

  if (cropId && kb.rab && kb.rab.crops && kb.rab.crops[cropId]) {
    const note = kb.rab.crops[cropId]
    parts.push('RAB (Rwanda Agriculture Board) guidance for ' + cropId + ':\n' + L(note, lang))
  }

  const guide = (kb.guides || []).find(g => g.id === cropId)
  if (guide) {
    const g = []
    if (guide.season) g.push('Season: ' + L(guide.season, lang))
    const fert = list(guide.fertilizing, lang).slice(0, 3)
    if (fert.length) g.push('Fertilizer: ' + fert.join('; '))
    const tips = list(guide.tips, lang).slice(0, 2)
    if (tips.length) g.push('Key tips: ' + tips.join('; '))
    if (g.length) parts.push('Crop calendar (' + L(guide.name, lang) + '):\n' + g.join('\n'))
  }

  const matches = detectDiseases(message, cropId)
  if (matches.length) {
    parts.push('Matching Rwanda disease profiles (most likely first):\n' +
      matches.map(d => diseaseBlock(d, lang)).join('\n\n'))
  } else if (cropId) {
    // No specific disease named — list the crop's known Rwanda diseases so the
    // agronomist can reason about likely candidates and ask targeted questions.
    const known = (kb.diseases || []).filter(d => d.crop === cropId).slice(0, 6)
    if (known.length) {
      parts.push('Known diseases/pests for ' + cropId + ' in Rwanda (ask which symptoms match):\n' +
        known.map(d => '• ' + L(d.name, lang) + ' — ' + list(d.symptoms, lang).slice(0, 2).join('; ')).join('\n'))
    }
  }

  return { cropId, text: parts.join('\n\n') }
}

module.exports = { research, detectCrop, detectDiseases, load }
