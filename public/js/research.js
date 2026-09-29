// AgroSmart Rwanda — research sources for the AI.
// Before answering, the assistant can attach a short, cited note about the
// topic the farmer asked about. Two sources are combined:
//   1. RAB (rab.gov.rw) — baked into data/rab.js, OFFLINE and always available,
//      because RAB pages cannot be fetched from the browser (CORS).
//   2. Wikipedia — fetched live only when online; the REST summary API is
//      CORS-enabled, so we prefer a substantial Kinyarwanda (rw) article and
//      fall back to the richer English (en) one.
// Anything that fails (offline, blocked, no article) resolves to null so the
// app never breaks and still works from a double-clicked index.html.
window.AS = window.AS || {}

AS.research = (function () {
  // crop id -> Wikipedia article title (en). rw titles are resolved separately.
  const CROP_WIKI = {
    maize: 'Maize', bean: 'Common bean', banana: 'Banana', cassava: 'Cassava',
    potato: 'Potato', tomato: 'Tomato', rice: 'Rice', coffee: 'Coffee',
    tea: 'Tea', sorghum: 'Sorghum', groundnut: 'Peanut', sweetpotato: 'Sweet potato'
  }

  function wikiUrl(lang, title) {
    return 'https://' + lang + '.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title)
  }

  async function summary(lang, title) {
    try {
      const res = await fetch(wikiUrl(lang, title), { headers: { 'Accept': 'application/json' } })
      if (!res.ok) return null
      const data = await res.json()
      const extract = String(data.extract || '').trim()
      if (!extract || data.type === 'disambiguation') return null
      const url = (data.content_urls && data.content_urls.desktop && data.content_urls.desktop.page) ||
        ('https://' + lang + '.wikipedia.org/wiki/' + encodeURIComponent(data.title || title))
      return { lang, title: data.title || title, extract, url }
    } catch (e) { return null }
  }

  // prefer a substantial Kinyarwanda article; fall back to the richer English one
  async function bilingual(rwTitle, enTitle) {
    if (rwTitle) { const rw = await summary('rw', rwTitle); if (rw && rw.extract.length >= 120) return rw }
    if (enTitle) { const en = await summary('en', enTitle); if (en) return en }
    if (rwTitle) { const rw = await summary('rw', rwTitle); if (rw) return rw }
    return null
  }

  // Find the best topic in the farmer's message: a known crop first, then a
  // disease name, so the research snippet matches what they asked about.
  function detectTopic(text, lang) {
    const low = ' ' + String(text).toLowerCase() + ' '
    const crops = AS.CROPS || {}
    const guides = AS.CROP_GUIDES || []
    for (const g of guides) {
      const c = crops[g.id] || {}
      const names = [c.en, c.rw, g.name && g.name.en, g.name && g.name.rw].filter(Boolean)
      if (names.some(n => low.includes(String(n).toLowerCase()))) {
        return { kind: 'crop', id: g.id, rw: c.rw || (g.name && g.name.rw), en: CROP_WIKI[g.id] || (c.en || (g.name && g.name.en)) }
      }
    }
    for (const d of (AS.DISEASES || [])) {
      const names = [d.name && d.name.en, d.name && d.name.rw].filter(Boolean)
      if (names.some(n => low.includes(String(n).toLowerCase()))) {
        return { kind: 'disease', id: d.crop, rw: d.name && d.name.rw, en: d.name && d.name.en }
      }
    }
    return null
  }

  // Build the research note. RAB is an OFFLINE, always-available source (baked
  // into data/rab.js); Wikipedia is fetched only when online. Both are cited.
  // Returns { text, url, title } or null when nothing relevant is found.
  async function lookup(text, lang) {
    const topic = detectTopic(text, lang)
    if (!topic) return null

    const parts = []
    // 1 — RAB (offline)
    if (AS.RAB && topic.id) {
      const rab = AS.RAB.cropNote(topic.id, lang)
      if (rab) parts.push(rab)
    }
    // 2 — Wikipedia (online, best-effort)
    const found = await bilingual(topic.rw, topic.en)
    if (found) {
      let snip = found.extract
      const cut = snip.match(/^(.*?[.!?])(\s.*?[.!?])?/)
      if (cut) snip = (cut[1] + (cut[2] || '')).trim()
      if (snip.length > 340) snip = snip.slice(0, 340).replace(/\s+\S*$/, '') + '…'
      const label = lang === 'en' ? 'Wikipedia' : 'Wikipedia'
      parts.push({ text: '🔎 ' + label + ': ' + snip + '\n' + found.url, url: found.url, title: found.title })
    }

    if (!parts.length) return null
    const primary = parts[0]
    return {
      text: parts.map(p => p.text).join('\n\n'),
      url: primary.url,
      title: primary.title
    }
  }

  return { lookup, detectTopic, summary }
})()
