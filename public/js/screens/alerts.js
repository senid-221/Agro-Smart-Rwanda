// AgroSmart Rwanda — Alerts.
// Built only from real inputs: live weather rules, the farmer's own cases and scans.
(function () {
const { CROPS } = AS

AS.renderAlerts = function (container, app) {
  const tr = app.t()
  const lang = app.lang || 'rw'
  const prefs = app.prefs()
  const district = AS.district(prefs.district)
  const cached = AS.cachedWeather(prefs.district)

  container.innerHTML = `
    <div class="top-bar">
      <div style="min-width:0">
        <div class="tb-sub">${AS.esc(tr('al_sub'))}</div>
        <div class="tb-title">${AS.esc(tr('nav_alerts'))}</div>
      </div>
      <div class="tb-right">
        <button class="lang-pill" id="langToggle">${lang === 'rw' ? 'EN' : 'RW'}</button>
        <button class="icon-btn" id="prefBtn" aria-label="${AS.esc(tr('al_prefs'))}">${AS.icon('pin', 21)}</button>
      </div>
    </div>

    <div class="sec-head"><span class="sec-title">${AS.esc(tr('al_weather'))}</span>
      <span class="tb-sub">${AS.esc(district[lang])}</span></div>
    <div id="wxAlerts"></div>

    <div class="sec-head"><span class="sec-title">${AS.esc(tr('al_cases'))}</span></div>
    <div id="caseAlerts"></div>

    <div class="sec-head"><span class="sec-title">${AS.esc(tr('al_followup'))}</span></div>
    <div id="scanAlerts"></div>
  `

  container.querySelector('#langToggle').onclick = () => app.setLang(lang === 'rw' ? 'en' : 'rw')
  container.querySelector('#prefBtn').onclick = () => app.go('settings')

  const wxEl = container.querySelector('#wxAlerts')
  const caseEl = container.querySelector('#caseAlerts')
  const scanEl = container.querySelector('#scanAlerts')
  let counted = 0

  const card = function (o) {
    const b = document.createElement('button')
    b.className = 'al-card ' + (o.level === 'high' ? 'bad' : o.level === 'medium' ? 'warn' : '')
    b.innerHTML =
      `<span class="al-ico">${AS.icon(o.icon || 'leaf', 19)}</span>` +
      `<span class="al-body"><span class="al-title">${AS.esc(o.title)}</span>` +
      `<span class="al-text">${AS.esc(o.text)}</span>` +
      (o.meta ? `<span class="al-meta">${AS.esc(o.meta)}</span>` : '') +
      `</span><span class="arrow">${AS.icon('arrowr', 16)}</span>`
    b.onclick = o.onclick || function () { app.go('alerts') }
    return b
  }

  const paintWx = function (wx) {
    if (!container.isConnected) return
    wxEl.innerHTML = ''
    if (!wx) {
      wxEl.appendChild(card({
        level: 'low', icon: 'info',
        title: tr('home_weather_fail'),
        text: tr('al_weather_offline'),
        onclick: () => AS.fetchWeather(prefs.district).then(r => paintWx(r.wx)).catch(() => {})
      }))
      return
    }
    const risks = AS.risk(wx, prefs.crop)
    risks.forEach(function (r) {
      if (r.level !== 'low') counted++
      wxEl.appendChild(card({
        level: r.level, icon: r.level === 'low' ? 'checkc' : 'warn',
        title: r.title[lang] || r.title.en,
        text: r.body[lang] || r.body.en,
        meta: tr('al_now') + ' · ' + wx.temp + '°C / ' + wx.rh + '%',
        onclick: r.diseaseId ? () => app.go('disease', { id: r.diseaseId }) : () => app.go('dashboard')
      }))
    })
    app.setAlertCount(counted)
  }

  if (cached) paintWx(cached)
  AS.fetchWeather(prefs.district).then(r => paintWx(r.wx)).catch(() => { if (!cached) paintWx(null) })

  Promise.all([AS.api.get('/ai/cases'), AS.api.get('/scans')]).then(([casesR, scansR]) => {
    if (!container.isConnected) return
    const cases = (casesR && !casesR.error && casesR.cases) ? casesR.cases : []
    const scans = (scansR && !scansR.error && Array.isArray(scansR)) ? scansR : []
    const open = cases.filter(c => c.status === 'open' || c.status === 'monitoring')

    if (!open.length) {
      caseEl.appendChild(card({
        level: 'low', icon: 'checkc', title: tr('al_no_cases'), text: tr('al_no_cases_d'),
        onclick: () => app.go('assistant')
      }))
    } else {
      open.slice(0, 6).forEach(function (c) {
        counted++
        const crop = CROPS[c.crop] || {}
        const d = AS.disease(c.suspected)
        caseEl.appendChild(card({
          level: c.status === 'open' ? 'high' : 'medium',
          icon: 'activity',
          title: d ? d.name[lang] : (crop[lang] || c.crop),
          text: tr('al_case_' + c.status) + ' · ' + (c.symptoms ? String(c.symptoms).slice(0, 90) : ''),
          meta: AS.ago(lang, new Date(c.updated_at).getTime()) + ' · ' + (c.district || district[lang]),
          onclick: () => app.go('case', { id: c.id })
        }))
      })
    }

    const sick = scans.filter(s => s.disease).slice(0, 4)
    if (!sick.length) {
      scanEl.appendChild(card({
        level: 'low', icon: 'scan', title: tr('al_no_scans'), text: tr('al_no_scans_d'),
        onclick: () => app.go('scan')
      }))
    } else {
      sick.forEach(function (s) {
        const d = AS.disease(s.disease)
        if (!d) return
        const days = Math.floor((Date.now() - s.at) / 86400000)
        scanEl.appendChild(card({
          level: d.severity === 'high' ? 'medium' : 'low',
          icon: 'leaf',
          title: d.name[lang],
          text: days >= 5 ? tr('al_follow_late') : tr('al_follow_soon'),
          meta: new Date(s.at).toLocaleDateString(lang === 'rw' ? 'fr-RW' : 'en-GB', { day: 'numeric', month: 'short' }) +
            ' · ' + Math.round(s.confidence) + '% · ' + (cropLabel(s.crop, d.crop)),
          onclick: () => app.go('disease', { id: d.id })
        }))
      })
    }
    app.setAlertCount(counted)
  })

  function cropLabel(a, b) {
    const id = a || b
    return (CROPS[id] || {})[lang] || id || ''
  }
}
})()
