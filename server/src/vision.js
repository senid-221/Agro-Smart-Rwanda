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
    '3. Only THEN describe the health findings for that crop.',
    '',
    'OUTPUT FORMAT — the first two lines are machine-read and must be exact:',
    'LINE 1: either "SUBJECT: PLANT" or "SUBJECT: NOT_PLANT".',
    '  - Use PLANT if the photo shows ANY plant or crop or a part of one (leaf, stem, flower, fruit, seedling, tree, weed, grass), even if it is not one of the catalog crops and even if it looks healthy. Only use NOT_PLANT when there is genuinely NO plant material (e.g. only a person, animal, building, vehicle, tool, document, a cooked food dish, or a blank/unusable frame). When in doubt about a green/leafy subject, choose PLANT.',
    'LINE 2 (only if PLANT): "CROP: <id> (confidence: high|medium|low)" where <id> is EXACTLY one id from the catalog below, or "unknown" if the plant is clearly not any catalog crop. Do not invent ids.',
    'Then, from LINE 3 onward, write the findings.',
    '',
    'CROP CATALOG (choose the closest id by what you SEE):',
    cropLines || '(no catalog available — use CROP: unknown)',
    '',
    'IMPORTANT about the farmer\'s suggested crop: it is only a HINT and is frequently WRONG or missing. Trust the IMAGE over the hint. If the hint disagrees with what you see, output the id you actually see and note the mismatch in one short line. Never force your answer to match a wrong hint.',
    '',
    'FINDINGS (only what is visible — do NOT prescribe treatment, products or doses):',
    '- State the crop id you identified and the plant part shown.',
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

// Splits the model reply into { isPlant, cropId, cropConfidence, text }.
// Line 1 carries the SUBJECT verdict, line 2 the CROP id; both are stripped so
// the findings block stays clean for the agronomist prompt.
function parseSubject(raw) {
  const lines = String(raw || '').split(/\r?\n/)
  const first = (lines[0] || '').trim().toUpperCase()
  const isPlant = !/SUBJECT:\s*NOT_?PLANT/.test(first) && !/NOT_PLANT/.test(first)

  let cropId = null
  let cropConfidence = ''
  const kept = []
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i]
    const up = ln.trim().toUpperCase()
    if (i === 0 && /SUBJECT:/.test(up)) continue
    const cm = ln.match(/^\s*CROP:\s*([a-z0-9_]+)\s*(?:\(\s*confidence:\s*([a-z]+)\s*\))?/i)
    if (cm && i <= 2) {
      const id = String(cm[1] || '').toLowerCase()
      cropId = id && id !== 'unknown' ? id : null
      cropConfidence = cm[2] ? String(cm[2]).toLowerCase() : ''
      continue
    }
    kept.push(ln)
  }
  const body = kept.join('\n').trim()
  return { isPlant, cropId, cropConfidence, text: body || String(raw || '').trim() }
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
    cropId: parsed.cropId, cropConfidence: parsed.cropConfidence, raw: text.trim()
  }
}

module.exports = { analyze, parseSubject, isConfigured: () => !!config.openai.key }
