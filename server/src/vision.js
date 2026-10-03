// Vision analysis for the Crop AI Doctor.
//
// Sends a farmer's crop photo to a vision-capable model and returns a concise,
// structured VISUAL FINDINGS block (crop, plant part, lesion shape/colour/
// pattern/distribution, insects, fungal signs, wilting/necrosis, deficiency
// patterns) plus an honest quality/confidence note. This block is fed to the main
// agronomist prompt as the `scan` context — the vision model does NOT prescribe
// treatment, it only reports what is visible, so the agronomist reasoning, the
// grounded research and the case history stay in control of the diagnosis.
const config = require('./config')

// Build the system prompt. `cropLines` is the app's real crop catalog rendered
// as "id — English / Kinyarwanda (aliases)". The model MUST pick one of these ids
// (or 'unknown'), so a scan maps to the exact crop keys the KB/RAB/soil data use.
function buildInstructions(cropLines) {
  return [
    'You are an expert plant pathologist and crop identification specialist examining a photo for a Rwandan smallholder farmer. You are as capable as a top-tier vision model: look carefully at what is ACTUALLY in the image before you say anything.',
    '',
    'WORK IN THIS ORDER — do not skip steps:',
    '1. LOOK at the whole image first. Decide if any plant/crop/leaf/stem/seedling/flower/fruit/plant part is present.',
    '2. IDENTIFY the crop from what you see (leaf shape, venation, stem, flower/fruit, growth habit). Use the catalog below.',
    '3. IDENTIFY which plant PART is the main subject of the photo (see PART list).',
    '4. Only THEN describe the health findings for that crop and part.',
    '',
    'OUTPUT FORMAT — your reply MUST begin with these three lines exactly, each on its own line, with NO labels, NO numbering, and NO extra words before them. Do not write the words "LINE 1", "LINE 2" or "LINE 3".',
    '  First line:  SUBJECT: PLANT   (or)   SUBJECT: NOT_PLANT',
    '  Second line: CROP: <id> (confidence: high|medium|low)',
    '  Third line:  PART: <part> (confidence: high|medium|low)',
    'Example of a correct opening:',
    'SUBJECT: PLANT',
    'CROP: maize (confidence: high)',
    'PART: leaf (confidence: high)',
    '(then your findings from the next line onward)',
    '',
    'SUBJECT rule: use PLANT if the photo shows ANY plant or crop or a part of one (leaf, stem, flower, fruit, seedling, tree, weed, grass), even if it is not one of the catalog crops and even if it looks healthy. Only use NOT_PLANT when there is genuinely NO plant material (e.g. only a person, animal, building, vehicle, tool, document, a cooked food dish, or a blank/unusable frame). When in doubt about a green/leafy subject, choose PLANT. If NOT_PLANT, say briefly what the photo shows and stop (omit the CROP and PART lines).',
    'CROP rule: <id> MUST be EXACTLY one id from the catalog below, or "unknown" if the plant is clearly not any catalog crop. Never invent ids.',
    'PART rule: <part> MUST be EXACTLY one of: seed (imbuto), seedling (ingemwe/umukeke), root (imizi), stem (ishami/umuti), leaf (ikibabi), flower (ururabo), fruit (urumbuto/umusaruro), whole_plant (ikimera cyose), other. Pick the part that is the MAIN subject of the photo; if several parts are equally shown, use whole_plant.',
    '',
    'CROP CATALOG (choose the closest id by what you SEE):',
    cropLines || '(no catalog available — use CROP: unknown)',
    '',
    'IMPORTANT about the farmer\'s suggested crop: it is only a HINT and is frequently WRONG or missing. Trust the IMAGE over the hint. If the hint disagrees with what you see, output the id you actually see and note the mismatch in one short line. Never force your answer to match a wrong hint.',
    '',
    'FINDINGS (from the fourth line onward; only what is visible — do NOT prescribe treatment, products or doses):',
    '- State the crop id and the plant part you identified.',
    '- Describe lesion shape, size and colour; pattern and distribution on the leaf/plant; any insects, eggs, webbing or frass; fungal signs (mould, powder, rust pustules, sooty growth); wilting, necrosis, chlorosis, stunting or deformation; nutrient-deficiency patterns.',
    '- Give a ranked visual impression (most to least likely) using "consistent with" language — never a definitive diagnosis from an image alone.',
    '- If the image is blurry, too dark, too far away, or does not clearly show the affected part, SAY SO plainly and state what a better photo would need. Do not pretend to identify a disease from an unusable image.',
    'Be concise: short labelled lines, no preamble.'
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

// The plant parts the model may name (controlled set). Anything else is dropped.
const PARTS = ['seed', 'seedling', 'root', 'stem', 'leaf', 'flower', 'fruit', 'whole_plant', 'other']

// Splits the model reply into { isPlant, cropId, cropConfidence, part, text }.
// The SUBJECT/CROP/PART header lines are stripped so the findings block stays
// clean. Robust to the model prefixing noise (e.g. "LINE 2: CROP: maize"): the
// headers are matched case-sensitively within the first few lines, so prose like
// "- Identified crop: maize" is NOT mistaken for a header.
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

// dataUrl: a full "data:image/...;base64,...." string from the client.
// crops: the controlled crop catalog (knowledge.cropVocabulary()).
// Returns { text, isPlant, cropId, cropConfidence }, or throws when unconfigured.
async function analyze({ dataUrl, lang, cropHint, crops }) {
  if (!config.openai.key) {
    const err = new Error('OPENAI_API_KEY is not configured on the server')
    err.code = 'no_key'
    throw err
  }
  if (!dataUrl || !/^data:image\//.test(dataUrl)) {
    const err = new Error('a valid image data URL is required')
    err.code = 'bad_image'
    throw err
  }

  const langName = lang === 'en' ? 'English' : 'Kinyarwanda'
  const userText =
    `Look at this photo, identify the crop from the catalog, then report visual findings in ${langName}.` +
    (cropHint ? ` Farmer's hint (may be wrong — trust the image): ${cropHint}.` : ' No crop hint was given — identify it yourself.')

  const body = {
    model: config.openai.visionModel,
    temperature: 0.2,
    max_tokens: 600,
    messages: [
      { role: 'system', content: buildInstructions(renderCropLines(crops)) },
      {
        role: 'user',
        content: [
          { type: 'text', text: userText },
          { type: 'image_url', image_url: { url: dataUrl } }
        ]
      }
    ]
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
    const t = await res.text().catch(() => '')
    const err = new Error(`OpenAI vision HTTP ${res.status}: ${t.slice(0, 200)}`)
    err.code = 'upstream'
    throw err
  }
  const data = await res.json()
  const out = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
  const text = typeof out === 'string' ? out : JSON.stringify(out || '')
  if (!text.trim()) {
    const err = new Error('empty reply from vision model')
    err.code = 'empty'
    throw err
  }
  const parsed = parseSubject(text)
  return {
    text: parsed.text, isPlant: parsed.isPlant,
    cropId: parsed.cropId, cropConfidence: parsed.cropConfidence,
    part: parsed.part, raw: text.trim()
  }
}

module.exports = { analyze, parseSubject, PARTS, isConfigured: () => !!config.openai.key }
