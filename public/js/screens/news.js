// AgroSmart Rwanda — News.
// Live agriculture news searched from the web (Tavily) + a short AI briefing
// (OpenAI) that tells the farmer what the headlines mean for them. Nothing
// here is static or demo — every open fetches real, recent stories.
(function () {
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

  function fmtDate(iso, lang) {
    if (!iso) return ''
    const d = new Date(iso)
    if (isNaN(d)) return ''
    return d.toLocaleDateString(lang === 'rw' ? 'fr-RW' : 'en-GB', { day: 'numeric', month: 'short' })
  }

  AS.renderNews = function (container, app) {
    const tr = app.t()
    const lang = app.lang === 'en' ? 'en' : 'rw'

    container.innerHTML = `
      <div class="top-bar">
        <div style="min-width:0">
          <div class="tb-sub">${esc(tr('news_sub'))}</div>
          <div class="tb-title">${esc(tr('news_title'))}</div>
        </div>
        <div class="tb-right">
          <button class="lang-pill" id="langToggle">${lang === 'rw' ? 'EN' : 'RW'}</button>
          <button class="icon-btn" id="refreshBtn" aria-label="${esc(tr('news_refresh'))}">${AS.icon('refresh', 21)}</button>
        </div>
      </div>

      <div id="newsBody">
        <div class="empty-state" style="padding:24px"><span class="emoji">⏳</span>${esc(tr('news_loading'))}</div>
      </div>
    `

    container.querySelector('#langToggle').onclick = () => app.setLang(lang === 'rw' ? 'en' : 'rw')
    const body = container.querySelector('#newsBody')

    async function load(force) {
      const refreshBtn = container.querySelector('#refreshBtn')
      if (refreshBtn) refreshBtn.disabled = true
      body.innerHTML = `<div class="empty-state" style="padding:24px"><span class="emoji">⏳</span>${esc(tr('news_loading'))}</div>`
      const r = await AS.api.get('/news?lang=' + lang + (force ? '&_=' + Date.now() : ''))
      if (!container.isConnected) return
      if (!r || r.error) {
        body.innerHTML = `<div class="empty-state" style="padding:24px"><span class="emoji">📡</span>${esc(tr('news_fail'))}</div>`
        if (refreshBtn) refreshBtn.disabled = false
        return
      }
      const articles = r.articles || []
      if (!articles.length) {
        body.innerHTML = `<div class="empty-state" style="padding:24px"><span class="emoji">📰</span>${esc(tr('news_empty'))}</div>`
        if (refreshBtn) refreshBtn.disabled = false
        return
      }
      const briefing = r.briefing
        ? `<div class="news-brief"><span class="nb-ico">${AS.icon('sparkle', 18)}</span><span class="nb-body"><span class="nb-title">${esc(tr('news_brief_title'))}</span><span class="nb-text">${esc(r.briefing)}</span></span></div>`
        : ''
      const cards = articles.map(a => `
        <a class="news-card" href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">
          <span class="nc-title">${esc(a.title)}</span>
          <span class="nc-snippet">${esc(a.snippet)}</span>
          <span class="nc-meta">${esc(a.source)}${a.date ? ' · ' + esc(fmtDate(a.date, lang)) : ''}</span>
        </a>`).join('')
      body.innerHTML = `
        ${briefing}
        <div class="sec-head"><span class="sec-title">${esc(tr('news_latest'))}</span>
          <span class="tb-sub">${esc(tr('news_searched_live'))}</span></div>
        <div class="news-list">${cards}</div>
        <p class="danger-note">${esc(tr('news_source'))}</p>
      `
      if (refreshBtn) refreshBtn.disabled = false
    }

    load(false)
    container.querySelector('#refreshBtn').onclick = () => load(true)
  }
})()
