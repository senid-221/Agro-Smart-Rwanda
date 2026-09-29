// Crop AI Doctor research engine.
//
// Grounded, Rwanda-first evidence assembly. The offline knowledge base (RAB
// guidance + Rwanda disease profiles + crop calendar, loaded by knowledge.js) is
// ALWAYS the primary source. When a web-search provider is configured
// (config.research.apiKey), it is queried too and its results are ranked by
// source authority before being added, so reputable Rwanda / scientific sources
// outrank random blogs. Sources are returned with the text so they can be cited
// to the farmer and stored in research_records — we never fabricate a source.
const config = require('./config')
const knowledge = require('./knowledge')

// Rank a source by authority (section 21 of the spec). Lower = more trusted.
const AUTHORITY = [
  { rank: 1, label: 'Rwanda government / RAB', test: h => /(^|\.)(gov\.rw)$/.test(h) || /rab\.gov\.rw|minagri/.test(h) },
  { rank: 2, label: 'Intl research (CGIAR/IITA/CABI/FAO)', test: h => /(cgiar|iita|cabi|fao|plantwise|bioversity|icipe|cirad)\.org/.test(h) },
  { rank: 3, label: 'University / peer-reviewed', test: h => /(\.edu$|\.ac\.rw$|doi\.org|sciencedirect|springer|wiley|mdpi|nature\.com|tandfonline|acs\.org)/.test(h) },
  { rank: 4, label: 'Extension / development org', test: h => /(\.org$|usaid|worldbank|giz|ifad|oneacfund)/.test(h) },
  { rank: 5, label: 'Manufacturer / product label', test: h => /(syngenta|bayer|basf|corteva|ukenya|agro)/.test(h) },
  { rank: 6, label: 'General agriculture site', test: () => true }
]

function rankSource(url) {
  let host = ''
  try { host = new URL(url).hostname.replace(/^www\./, '') } catch (e) { host = String(url || '') }
  const hit = AUTHORITY.find(a => a.test(host))
  return { rank: hit ? hit.rank : 6, label: hit ? hit.label : 'General web', host }
}

// Query the configured web search provider. Returns [] when unconfigured or on
// any failure — research must degrade to KB-only, never throw into the chat path.
async function webSearch(query, maxResults) {
  if (!config.research.enabled) return []
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 8000)
  try {
    const res = await fetch(`${config.research.baseUrl.replace(/\/$/, '')}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: config.research.apiKey,
        query,
        max_results: maxResults,
        search_depth: 'basic',
        include_answer: false
      }),
      signal: ctrl.signal
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.results || []).map(r => ({
      title: r.title || '',
      url: r.url || '',
      snippet: (r.content || '').slice(0, 400)
    })).filter(r => r.url)
  } catch (e) {
    return []
  } finally {
    clearTimeout(timer)
  }
}

// Build a Rwanda-focused search query from the crop + the farmer's words.
function buildQuery(message, cropId) {
  const crop = cropId ? cropId : 'crop'
  return `${crop} disease pest symptoms treatment Rwanda RAB ${message}`.replace(/\s+/g, ' ').trim().slice(0, 200)
}

// Heuristic confidence from evidence strength (the model also states its own).
function assessConfidence(cropId, diseaseMatches, webHits) {
  if (cropId && diseaseMatches.length >= 1 && webHits.length >= 1) return 'high'
  if (cropId && diseaseMatches.length >= 1) return 'moderate'
  if (cropId) return 'low'
  return 'low'
}

// Main entry. Returns:
//   { cropId, text, sources, confidence }
// `text` is the grounded evidence block injected into the system prompt (KB
// first, then cited web findings). `sources` is the citation list to show/store.
async function research(message, lang) {
  const kb = knowledge.research(message, lang)          // { cropId, text } from offline KB
  const cropId = kb.cropId
  const matches = knowledge.detectDiseases(message, cropId)

  const sources = []
  if (cropId || matches.length) {
    sources.push({
      title: 'Rwanda Agriculture Board (RAB) guidance + AgroSmart Rwanda disease knowledge base',
      url: '', rank: 1, label: 'Rwanda government / RAB', host: 'offline-kb'
    })
  }

  let webText = ''
  let webHits = []
  if (config.research.enabled) {
    const raw = await webSearch(buildQuery(message, cropId), config.research.maxResults)
    webHits = raw
      .map(r => Object.assign({}, r, rankSource(r.url)))
      .sort((a, b) => a.rank - b.rank)
      .slice(0, config.research.maxResults)
    if (webHits.length) {
      webText = webHits.map((r, i) => {
        sources.push({ title: r.title, url: r.url, rank: r.rank, label: r.label, host: r.host })
        const n = sources.length
        return `[${n}] ${r.title} (${r.label}) — ${r.snippet}\n    ${r.url}`
      }).join('\n')
    }
  }

  const parts = []
  if (kb.text) parts.push(kb.text)
  if (webText) {
    parts.push('LIVE WEB RESEARCH (ranked by source authority; cite by [n]; prefer Rwanda/scientific sources)\n' + webText)
  }

  return {
    cropId,
    text: parts.join('\n\n'),
    sources,
    confidence: assessConfidence(cropId, matches, webHits)
  }
}

module.exports = { research, rankSource, webSearch }
