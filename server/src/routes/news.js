// Live agriculture news for Rwandan farmers.
//
// Real, searched news — never static. The Tavily "news" topic search fetches
// recent Rwanda / East-Africa agriculture stories (RAB, Minagri, weather, pests,
// prices, seasons). When OpenAI is configured, the top stories are analysed
// into a short, plain-text briefing in the farmer's language so they get the
// "what it means for me" alongside the headlines. Results are cached briefly
// so opening the screen a few times in a row does not re-query the providers.
const express = require('express')
const config = require('../config')
const { chat } = require('../openai')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

// In-memory cache (per language). TTL in ms; refreshed on first request after expiry.
const TTL = 30 * 60 * 1000
const cache = new Map() // lang -> { at, articles, briefing }

function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch (e) { return String(url || '') }
}

async function tavilyNews(query, maxResults) {
  if (!config.research.enabled) return []
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 10000)
  try {
    const res = await fetch(`${config.research.baseUrl.replace(/\/$/, '')}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: config.research.apiKey,
        query,
        topic: 'news',
        days: 7,
        max_results: maxResults,
        search_depth: 'basic',
        include_answer: false,
        include_raw_content: false
      }),
      signal: ctrl.signal
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.results || [])
      .filter(r => r && r.url && r.title)
      .map(r => ({
        title: String(r.title).trim(),
        url: r.url,
        source: hostOf(r.url),
        snippet: String(r.content || '').replace(/\s+/g, ' ').trim().slice(0, 280),
        date: r.published_date || ''
      }))
  } catch (e) {
    return []
  } finally {
    clearTimeout(timer)
  }
}

// One concise AI briefing from the top headlines, in the farmer's language.
async function analyse(articles, lang) {
  if (!config.openai.key || !articles.length) return null
  const top = articles.slice(0, 6)
  const list = top.map((a, i) => `${i + 1}. ${a.title} (${a.source})`).join('\n')
  const system =
    'You are a senior Rwandan agriculture journalist. Read the latest farming news headlines below and write ONE short briefing (2-4 sentences, plain text, no markdown, no bullet symbols) that tells a Rwandan farmer the most important developments and what they mean for their crops, planting, weather, pests or prices. Be concrete and honest; do not invent facts beyond the headlines. ' +
    (lang === 'en'
      ? 'Write in clear English.'
      : 'Andika mu Kinyarwanda cyiza, kimeze neza, nta magambo y\'Icyongereza yongeranyijemo.')
  try {
    return await chat({
      system,
      messages: [{ role: 'user', content: list }],
      temperature: 0.4,
      maxTokens: 220
    })
  } catch (e) {
    return null
  }
}

router.get('/', requireAuth, async (req, res) => {
  const lang = req.query.lang === 'en' ? 'en' : 'rw'
  const now = Date.now()
  const hit = cache.get(lang)
  if (hit && now - hit.at < TTL) {
    return res.json({ articles: hit.articles, briefing: hit.briefing, cached: true })
  }
  const query = 'Rwanda agriculture farming crops weather RAB Minagri harvest pests prices'
  const articles = await tavilyNews(query, 8)
  const briefing = await analyse(articles, lang)
  cache.set(lang, { at: now, articles, briefing })
  res.json({ articles, briefing, cached: false, enabled: config.research.enabled })
})

module.exports = router
