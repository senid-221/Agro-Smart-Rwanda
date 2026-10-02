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

const VISION_INSTRUCTIONS = [
  'You are a plant pathologist examining a crop photo for a Rwandan smallholder farmer.',
  'FIRST LINE MUST be exactly one of: "SUBJECT: PLANT" (the photo shows a plant, crop, leaf, seedling, flower, fruit, or plant part) or "SUBJECT: NOT_PLANT" (the photo shows no plant — e.g. a person, animal, building, vehicle, tool alone, document, food dish, or is blank/unusable). Nothing else on that first line.',
  'If SUBJECT: NOT_PLANT, on the next line briefly say in the reply language what the photo actually shows, then STOP — do not attempt any crop or disease analysis.',
  'If SUBJECT: PLANT, continue with your findings below.',
  'Report ONLY what is visible. Do not prescribe treatment, products or doses.',
  'Describe: the crop (if identifiable) and plant part shown; lesion shape, size and colour; pattern and distribution on the leaf/plant; any insects, eggs, webbing or frass; fungal signs (mould, powder, rust pustules, sooty growth); wilting, necrosis, chlorosis, stunting or deformation; nutrient-deficiency patterns.',
  'Give a ranked visual impression (most to least likely) of what the signs suggest, using "consistent with" language — never a definitive diagnosis from an image alone.',
  'If the image is blurry, too dark, too far away, or does not clearly show the affected part, SAY SO plainly and state what a better photo would need. Do not pretend to identify a disease from an unusable image.',
  'Be concise: short labelled lines, no preamble.'
].join('\n')

// Splits the model reply into { isPlant, text }. The first line carries the
// SUBJECT verdict; the rest is the findings block returned to the agronomist.
function parseSubject(raw) {
  const lines = String(raw || '').split(/\r?\n/)
  const first = (lines[0] || '').trim().toUpperCase()
  const isPlant = !/SUBJECT:\s*NOT_?PLANT/.test(first) && !/NOT_PLANT/.test(first)
  // Drop the verdict line so the findings block stays clean for the prompt.
  const body = (/SUBJECT:/.test(first) ? lines.slice(1) : lines).join('\n').trim()
  return { isPlant, text: body || String(raw || '').trim() }
}

// dataUrl: a full "data:image/...;base64,...." string from the client.
// Returns { text } with the visual-findings block, or throws when unconfigured.
async function analyze({ dataUrl, lang, cropHint }) {
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
    `Analyse this crop photo and report visual findings in ${langName}.` +
    (cropHint ? ` The farmer says the crop is: ${cropHint}.` : '')

  const body = {
    model: config.openai.visionModel,
    temperature: 0.2,
    max_tokens: 500,
    messages: [
      { role: 'system', content: VISION_INSTRUCTIONS },
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
  return { text: parsed.text, isPlant: parsed.isPlant, raw: text.trim() }
}

module.exports = { analyze, parseSubject, isConfigured: () => !!config.openai.key }
