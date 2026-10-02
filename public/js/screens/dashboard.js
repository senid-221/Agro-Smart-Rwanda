// AgroSmart Rwanda — Field Analytics.
// Everything on this screen is computed from the farmer's own real records
// (scans, cases, orders) and live weather — no invented numbers.
(function () {
const { CROPS } = AS

AS.renderDashboard = function (container, app) {
  const tr = app.t()
  const lang = app.lang || 'rw'
  const prefs = app.prefs()
  const district = AS.district(prefs.district)
  const soil = AS.soilFor(prefs.crop)
  const cropName = (CROPS[prefs.crop] || {})[lang] || prefs.crop
  const cached = AS.cachedWeather(prefs.district)

  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    days.push(d)
  }
  container.innerHTML = `
    <div class="top-bar">
      <div style="min-width:0">
        <div class="tb-sub">${AS.esc(tr('an_sub'))}</div>
        <div class="tb-title">${AS.esc(tr('an_title'))}</div>
      </div>
      <div class="tb-right">
        <button class="lang-pill" id="langToggle">${lang === 'rw' ? 'EN' : 'RW'}</button>
        <button class="icon-btn" id="bellBtn" aria-label="${AS.esc(tr('nav_alerts'))}">${AS.icon('bell', 21)}</button>
      </div>
    </div>

    <div class="chart-card">
      <div class="gc-head">
        <span class="gc-title">${AS.esc(tr('an_growth'))}</span>
        <span class="gc-delta" id="gcDelta">—</span>
      </div>
      <div class="gc-sub">
        <span>${AS.esc(tr('an_last7'))}</span>
        <span>${AS.esc(tr('an_vs_prev'))}</span>
      </div>
      <div class="gc-chart" id="gcChart"></div>
      <div class="gc-x" id="gcX">${days.map(d => `<span>${AS.dayName(lang, d)}</span>`).join('')}</div>
      <div class="soil-note" id="gcNote">${AS.esc(tr('an_growth_note'))}</div>
    </div>

    <div class="risk-card" id="riskCard">
      <div class="rk-head">
        <span class="rk-title">${AS.icon('warn', 16)}<span id="rkTitle">${AS.esc(tr('an_risk_loading'))}</span></span>
        <span class="tag warn" id="rkTag">—</span>
      </div>
      <div class="rk-body" id="rkBody"></div>
      <button class="rk-link" id="rkLink">${AS.esc(tr('an_view_alerts'))}${AS.icon('arrowr', 14)}</button>
    </div>

    <div class="soil-card">
      <div class="soil-head">
        <span class="gc-title">${AS.esc(tr('an_soil'))}</span>
        <span class="badge sev-low">${AS.esc(cropName)}</span>
      </div>
      <div class="soil-3">
        <div class="npk">
          <span class="npk-letter">N</span>
          <span class="npk-val">${AS.esc(soil.n.v)}<small>${AS.esc(soil.n.u)}</small></span>
          <span class="npk-tag">${AS.esc(tr('an_nitrogen'))}</span>
        </div>
        <div class="npk">
          <span class="npk-letter p">P</span>
          <span class="npk-val">${AS.esc(soil.p.v)}<small>${AS.esc(soil.p.u)}</small></span>
          <span class="npk-tag">${AS.esc(tr('an_phosphorus'))}</span>
        </div>
        <div class="npk">
          <span class="npk-letter">K</span>
          <span class="npk-val">${AS.esc(soil.k.v)}<small>${AS.esc(soil.k.u)}</small></span>
          <span class="npk-tag">${AS.esc(tr('an_potassium'))}</span>
        </div>
      </div>
      <div class="soil-note">${AS.esc(soil.src[lang] || soil.src.en)} · ${AS.esc(tr('an_soil_note')).replace('{ph}', soil.ph[0].toFixed(1) + '–' + soil.ph[1].toFixed(1))}</div>
    </div>

    <button class="insight-card" id="insightCard">
      <span class="ic-ico">${AS.icon('sparkle', 19)}</span>
      <span class="ic-wrap">
        <span class="ic-head"><span class="ic-title">${AS.esc(tr('home_ai_insight'))}</span><span class="badge-new">${AS.esc(tr('new_badge'))}</span></span>
        <span class="ic-body" id="insBody">${AS.esc(tr('home_insight_loading'))}</span>
      </span>
    </button>

    <div class="sec-head">
      <span class="sec-title">${AS.esc(tr('an_cases'))}</span>
      <button class="sec-link" id="casesLink">${AS.esc(tr('an_open_ai'))}</button>
    </div>
    <div id="caseList"></div>

    <div class="sec-head"><span class="sec-title">${AS.esc(tr('dash_recent'))}</span></div>
    <div id="scanList"></div>

    <div class="sec-head"><span class="sec-title">${AS.esc(tr('an_activity'))}</span></div>
    <div class="stat-grid">
      <div class="stat-card"><span class="stat-n" id="stScans">0</span><span class="stat-l">${AS.esc(tr('dash_scans'))}</span></div>
      <div class="stat-card"><span class="stat-n" id="stOrders">0</span><span class="stat-l">${AS.esc(tr('dash_orders'))}</span></div>
      <div class="stat-card"><span class="stat-n" id="stCart">0</span><span class="stat-l">${AS.esc(tr('dash_cart'))}</span></div>
    </div>
    <div class="grid-2" style="margin-top:12px">
      <button class="feature-card" data-go="orders">
        <span class="fico-wrap">${AS.icon('cart', 20)}</span>
        <span class="label">${AS.esc(tr('dash_myorders'))}</span>
        <span class="desc">${AS.esc(tr('dash_store_d'))}</span>
      </button>
      <button class="feature-card" data-go="scan">
        <span class="fico-wrap">${AS.icon('scan', 20)}</span>
        <span class="label">${AS.esc(tr('dash_scan'))}</span>
        <span class="desc">${AS.esc(tr('dash_scan_d'))}</span>
      </button>
    </div>
  `

  container.querySelector('#langToggle').onclick = () => app.setLang(lang === 'rw' ? 'en' : 'rw')
  container.querySelector('#bellBtn').onclick = () => app.go('alerts')
  container.querySelector('#insightCard').onclick = () => app.go('assistant')
  container.querySelector('#casesLink').onclick = () => app.go('assistant')
  container.querySelectorAll('[data-go]').forEach(b => (b.onclick = () => app.go(b.dataset.go)))

  // ---------- scan activity chart (real counts) ----------
  const paintChart = function (scans) {
    if (!container.isConnected) return
    const inRange = function (from, to) {
      return scans.filter(s => s.at >= from && s.at < to)
    }
    const counts = days.map(function (d) {
      const next = new Date(d); next.setDate(next.getDate() + 1)
      return inRange(d.getTime(), next.getTime()).length
    })
    const cur = counts.reduce((a, b) => a + b, 0)
    const prevFrom = days[0].getTime() - 7 * 86400000
    const prev = inRange(prevFrom, days[0].getTime()).length
    const pct = prev > 0 ? Math.round((cur - prev) / prev * 100) : (cur > 0 ? 100 : 0)

    const dEl = container.querySelector('#gcDelta')
    dEl.textContent = (pct >= 0 ? '+' : '') + pct + '%'
    dEl.style.color = pct < 0 ? 'var(--orange-deep)' : 'var(--green-700)'

    // Flat zero data draws a meaningless line — say so instead.
    const chartEl = container.querySelector('#gcChart')
    if (cur === 0 && prev === 0) {
      chartEl.innerHTML = `<div class="empty-state" style="padding:18px 6px"><span class="emoji">📈</span>${AS.esc(tr('an_no_scans'))}</div>`
    } else {
      chartEl.innerHTML = AS.lineChart(counts, { w: 300, h: 110 })
    }
    const set = function (id, v) { const e = container.querySelector('#' + id); if (e) e.textContent = v }
    set('stScans', String(scans.length))
    set('gcNote', tr('an_growth_note') + ' · ' + cur + ' / ' + prev)
  }

  // ---------- pest risk (real weather rules) ----------
  const paintRisk = function (wx) {
    if (!container.isConnected) return
    const risks = AS.risk(wx, prefs.crop)
    const top = risks[0] || { level: 'low', title: { en: 'Conditions are calm', rw: 'Ibihe bimeze neza' }, body: { en: 'No weather risk right now.', rw: 'Nta kibazo cy\'ibihe ubu.' }, diseaseId: null }
    const lvl = { high: tr('an_risk_high'), medium: tr('an_risk_medium'), low: tr('an_risk_low') }[top.level] || '—'
    const titleEl = container.querySelector('#rkTitle')
    const tagEl = container.querySelector('#rkTag')
    const bodyEl = container.querySelector('#rkBody')
    const linkEl = container.querySelector('#rkLink')
    const card = container.querySelector('#riskCard')
    titleEl.textContent = top.title[lang] || top.title.en
    tagEl.textContent = lvl
    tagEl.className = 'tag ' + (top.level === 'high' ? 'bad' : top.level === 'medium' ? 'warn' : '')
    bodyEl.textContent = top.body[lang] || top.body.en
    card.style.borderLeftColor = top.level === 'high' ? 'var(--red)' : 'var(--orange)'
    if (top.diseaseId) {
      linkEl.innerHTML = AS.esc(tr('an_view_guide')) + AS.icon('arrowr', 14)
      linkEl.onclick = () => app.go('disease', { id: top.diseaseId })
    } else {
      linkEl.innerHTML = AS.esc(tr('an_view_alerts')) + AS.icon('arrowr', 14)
      linkEl.onclick = () => app.go('alerts')
    }
    const ins = AS.insight(wx, prefs.crop, null, lang)
    const insEl = container.querySelector('#insBody')
    if (insEl) insEl.textContent = ins.body[lang] || ins.body.en
  }

  if (cached) paintRisk(cached)
  AS.fetchWeather(prefs.district).then(r => {
    if (container.isConnected) paintRisk(r.wx)
  }).catch(() => {
    if (!container.isConnected) return
    const t2 = container.querySelector('#rkTitle')
    if (t2 && !cached) t2.textContent = tr('home_weather_fail')
  })

  // ---------- cases ----------
  const statusKey = { open: 'cs_open', monitoring: 'cs_monitoring', resolved: 'cs_resolved', closed: 'cs_closed' }
  const caseList = container.querySelector('#caseList')
  const scanList = container.querySelector('#scanList')

  Promise.all([AS.api.get('/ai/cases'), AS.api.get('/scans'), AS.api.get('/cart'), AS.api.get('/orders')])
    .then(([casesR, scansR, cart, orders]) => {
      if (!container.isConnected) return

      const cases = (casesR && !casesR.error && casesR.cases) ? casesR.cases : []
      const scans = (scansR && !scansR.error && Array.isArray(scansR)) ? scansR : []
      container.querySelector('#stCart').textContent = String((cart || []).length)
      container.querySelector('#stOrders').textContent = String((orders || []).length)
      paintChart(scans)

      if (!cases.length) {
        caseList.innerHTML = `<div class="card empty-state"><span class="emoji">🌱</span>${AS.esc(tr('an_no_cases'))}</div>`
      } else {
        cases.slice(0, 8).forEach(c => {
          const crop = CROPS[c.crop] || {}
          const d = AS.disease(c.suspected)
          const row = document.createElement('button')
          row.className = 'list-row'
          row.innerHTML =
            (crop.img ? `<img class="thumb" src="${crop.img}" alt="">` : `<span class="emoji">${crop.emoji || '🌿'}</span>`) +
            `<span class="body"><span class="name">${AS.esc(d ? d.name[lang] : (crop[lang] || c.crop))}</span>` +
            `<span class="meta">${AS.esc(tr(statusKey[c.status] || 'cs_open'))} · ${AS.esc(c.district || district[lang])} · ${AS.ago(lang, new Date(c.updated_at).getTime())}</span></span>` +
            `<span class="badge sev-${c.status === 'resolved' || c.status === 'closed' ? 'low' : 'medium'}">${AS.esc(tr(statusKey[c.status] || 'cs_open'))}</span>`
          row.onclick = () => app.go('case', { id: c.id })
          caseList.appendChild(row)
        })
      }

      const local = (app.history || [])
      if (!scans.length && !local.length) {
        scanList.innerHTML = `<div class="card empty-state"><span class="emoji">📷</span>${AS.esc(tr('dash_no_scans'))}</div>`
      } else {
        const rows = scans.length ? scans.slice(0, 5) : local.slice(0, 5).map(h => ({
          disease: h.diseaseId, confidence: h.confidence, at: h.at, crop: (AS.disease(h.diseaseId) || {}).crop
        }))
        rows.forEach(s => {
          const d = AS.disease(s.disease)
          const crop = CROPS[s.crop] || (d ? CROPS[d.crop] : null) || {}
          const row = document.createElement('button')
          row.className = 'list-row'
          row.innerHTML =
            (crop.img ? `<img class="thumb" src="${crop.img}" alt="">` : `<span class="emoji">${crop.emoji || '✅'}</span>`) +
            `<span class="body"><span class="name">${AS.esc(d ? d.name[lang] : tr('result_healthy'))}</span>` +
            `<span class="meta">${new Date(s.at).toLocaleDateString(lang === 'rw' ? 'fr-RW' : 'en-GB', { day: 'numeric', month: 'short' })}${s.confidence ? ' · ' + Math.round(s.confidence) + '%' : ''}</span></span>` +
            (d ? `<span class="badge sev-${d.severity}">${AS.esc(tr('sev_' + d.severity))}</span>` : '')
          row.onclick = () => { if (d) app.go('disease', { id: d.id }); else app.go('library') }
          scanList.appendChild(row)
        })
      }
    })
}
})()
