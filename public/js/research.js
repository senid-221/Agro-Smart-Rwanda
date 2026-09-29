// AgroSmart Rwanda — live online research.
// Before answering, the assistant can look up a short, cited summary of the
// topic the farmer asked about. Only sources that allow cross-origin reads from
// a file:// or localhost page are usable client-side; the Wikipedia REST summary
// API is CORS-enabled, so we prefer Kinyarwanda (rw) and fall back to English
// (en) when the rw article is missing or empty. Anything that fails (offline,
// blocked, no article) resolves to null so the app never breaks.
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
        return { kind: 'crop', rw: c.rw || (g.name && g.name.rw), en: CROP_WIKI[g.id] || (c.en || (g.name && g.name.en)) }
      }
    }
    for (const d of (AS.DISEASES || [])) {
      const names = [d.name && d.name.en, d.name && d.name.rw].filter(Boolean)
      if (names.some(n => low.includes(String(n).toLowerCase()))) {
        return { kind: 'disease', rw: d.name && d.name.rw, en: d.name && d.name.en }
      }
    }
    return null
  }

  // Returns a short cited note in the farmer's language, or null.
  async function lookup(text, lang) {
    const topic = detectTopic(text, lang)
    if (!topic) return null
    const rwTitle = topic.kind === 'crop' ? topic.rw : topic.rw
    const found = await bilingual(rwTitle, topic.en)
    if (!found) return null
    // keep it short: first ~2 sentences / 320 chars
    let snip = found.extract
    const cut = snip.match(/^(.*?[.!?])(\s.*?[.!?])?/)
    if (cut) snip = (cut[1] + (cut[2] || '')).trim()
    if (snip.length > 340) snip = snip.slice(0, 340).replace(/\s+\S*$/, '') + '…'
    const label = lang === 'en' ? 'Online research (Wikipedia)' : 'Ubushakashatsi kuri interineti (Wikipedia)'
    return { text: '🔎 ' + label + ': ' + snip + '\n' + found.url, url: found.url, title: found.title }
  }

  return { lookup, detectTopic, summary }
})()
