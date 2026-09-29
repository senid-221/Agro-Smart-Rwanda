// OpenAI proxy — the API key lives ONLY here on the server (config.openai.key),
// never in the shipped app. Builds the agronomist system prompt from the 15
// farmer rules plus admin-trained glossary/Q&A, then calls Chat Completions.
const config = require('./config')

const FARMER_RULES = [
  'Act like a real, experienced agronomist helping the farmer.',
  'Ask about the crop, symptoms, location, crop age and farming conditions before diagnosing.',
  'If possible, ask the farmer to upload a clear photo of the affected plant.',
  'Identify the most likely disease, pest, nutrient deficiency or environmental problem.',
  'Never guess when evidence is insufficient; clearly say when you are uncertain.',
  'Explain the problem in simple language the farmer can understand.',
  'Give practical steps for treatment and prevention.',
  'Recommend agricultural products only when appropriate for the identified problem.',
  'Never invent pesticide names, dosages or treatment instructions.',
  'Always include chemical-safety precautions when recommending agricultural chemicals.',
  "Consider Rwanda's crops, climate, soil and local farming conditions.",
  "Respond in the farmer's language, especially clear Kinyarwanda when they use Kinyarwanda.",
  'Keep answers short, practical and focused on the farmer\'s problem.',
  'If the problem is serious or uncertain, recommend contacting a qualified agronomist (RAB).',
  'Never pretend to be certain when a professional field inspection is needed.'
]

function buildSystemPrompt(lang, glossary, qa, catalog) {
  const rules = FARMER_RULES.map((r, i) => `${i + 1}. ${r}`).join('\n')
  const gl = (glossary || [])
    .map(x => `- ${x.term}: ${lang === 'en' ? (x.def_en || x.def || '') : (x.def || x.def_en || '')}`)
    .filter(s => s.length > 3).join('\n')
  const trained = (qa || [])
    .map(x => `Q: ${lang === 'en' ? (x.q_en || x.q || '') : (x.q || x.q_en || '')}\n` +
              `A: ${lang === 'en' ? (x.a_en || x.a || '') : (x.a || x.a_en || '')}`)
    .filter(s => s.length > 8).join('\n\n')
  const prices = (catalog || [])
    .map(p => `- ${p.en} / ${p.rw}: RWF ${p.price} per ${p.unit_en}`).join('\n')

  return [
    'You are the AgroSmart Rwanda farming assistant for Rwandan farmers.',
    `Reply in the farmer's language (${lang === 'en' ? 'English' : 'clear, simple Kinyarwanda'}).`,
    '',
    'RULES:',
    rules,
    gl ? '\nGLOSSARY (use these clear terms):\n' + gl : '',
    trained ? '\nADMIN-TRAINED Q&A (prefer these answers when relevant):\n' + trained : '',
    prices ? '\nSTORE CATALOG (quote these exact RWF prices; never invent prices):\n' + prices : '',
    '\nIf a question is not about farming, politely refuse and redirect to crops, diseases, fertilizers or product prices.'
  ].filter(Boolean).join('\n')
}

async function chat({ message, lang, system }) {
  if (!config.openai.key) {
    const err = new Error('OPENAI_API_KEY is not configured on the server')
    err.code = 'no_key'
    throw err
  }
  const res = await fetch(`${config.openai.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.openai.key}`
    },
    body: JSON.stringify({
      model: config.openai.model,
      temperature: 0.4,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: String(message).slice(0, 4000) }
      ]
    })
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    const err = new Error(`OpenAI HTTP ${res.status}: ${body.slice(0, 200)}`)
    err.code = 'upstream'
    throw err
  }
  const data = await res.json()
  const text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
  if (!text || !String(text).trim()) {
    const err = new Error('empty reply from OpenAI')
    err.code = 'empty'
    throw err
  }
  return String(text).trim()
}

module.exports = { chat, buildSystemPrompt, isConfigured: () => !!config.openai.key }
