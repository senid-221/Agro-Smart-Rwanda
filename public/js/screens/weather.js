// AgroSmart Rwanda — Weather screen.
// Live Open-Meteo conditions + a real 3-day forecast (iteganyagihe) for any Rwanda
// district, resolved to the farmer's region from the phone's live GPS when they
// allow it. Everything shown is measured weather — nothing is invented.
(function () {
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

  AS.renderWeather = function (container, app) {
    const tr = app.t()
    const lang = app.lang === 'en' ? 'en' : 'rw'
    let prefs = app.prefs()
    let current = prefs.district

    // Provinces -> districts for the region picker.
    const provs = {}
    AS.RW_DISTRICTS.forEach(d => { (provs[d.prov] = provs[d.prov] || []).push(d) })
    const regionOptions = Object.keys(provs).map(p =>
      '<optgroup label="' + esc(p) + '">' +
      provs[p].map(d => '<option value="' + d.id + '"' + (d.id === current ? ' selected' : '') + '>' + esc(d[lang]) + '</option>').join('') +
      '</optgroup>').join('')

    container.innerHTML = `
      <div class="card wx-gps">
        <span class="wx-gps-ico">${AS.icon('pin', 20)}</span>
        <span class="wx-gps-body">
          <span class="wx-gps-loc" id="wxLoc">${esc(AS.district(current)[lang])}</span>
          <span class="wx-gps-sub" id="wxGpsSub">${prefs.gps ? esc(tr('wx_gps_on')) : esc(tr('wx_gps_hint'))}</span>
        </span>
        <button class="btn btn-outline sm" id="gpsBtn">${esc(tr('wx_use_gps'))}</button>
      </div>

      <label class="wx-region">
        <span>${esc(tr('wx_region'))}</span>
        <select id="regionSel">${regionOptions}</select>
      </label>

      <div class="wx-now" id="wxNow">
        <div class="empty-state" style="padding:20px"><span class="emoji">⏳</span>${esc(tr('wx_loading'))}</div>
      </div>

      <div class="section-title">${esc(tr('wx_forecast'))}</div>
      <div class="wx-days" id="wxDays"></div>

      <div class="section-title">${esc(tr('wx_risk'))}</div>
      <div id="wxRisk"></div>

      <p class="danger-note">${esc(tr('wx_source'))}</p>
    `

    const dayLabel = (dateStr, i) => {
      if (i === 0) return tr('wx_today')
      if (i === 1) return tr('wx_tomorrow')
      const d = new Date(dateStr + 'T00:00:00')
      return d.toLocaleDateString(lang === 'rw' ? 'fr-RW' : 'en-GB', { weekday: 'short' })
    }

    const paintNow = wx => {
      const el = container.querySelector('#wxNow')
      if (!el) return
      el.innerHTML = `
        <div class="wxn-top">
          <span class="wxn-ico">${AS.icon(wx.cond.ico, 40)}</span>
          <span class="wxn-temp">${wx.temp}°C</span>
          <span class="wxn-cond">${esc(wx.cond[lang])}</span>
        </div>
        <div class="wxn-grid">
          <span class="wxn-cell">${AS.icon('thermo', 14)}<b>${esc(tr('wx_feels'))}</b><i>${wx.feels}°C</i></span>
          <span class="wxn-cell">${AS.icon('drop', 14)}<b>${esc(tr('wx_hum'))}</b><i>${wx.rh}%</i></span>
          <span class="wxn-cell">${AS.icon('wind', 14)}<b>${esc(tr('wx_wind'))}</b><i>${wx.wind} m/s</i></span>
          <span class="wxn-cell">${AS.icon('rain', 14)}<b>${esc(tr('wx_rain'))}</b><i>${wx.rainProb && wx.rainProb[0] != null ? wx.rainProb[0] + '%' : '—'}</i></span>
        </div>`
    }

    const paintDays = wx => {
      const el = container.querySelector('#wxDays')
      if (!el) return
      const days = (wx && wx.days) || []
      if (!days.length) { el.innerHTML = ''; return }
      el.innerHTML = days.map((d, i) => `
        <div class="wx-day">
          <span class="wd-day">${esc(dayLabel(d.date, i))}</span>
          <span class="wd-ico">${AS.icon(d.cond.ico, 22)}</span>
          <span class="wd-cond">${esc(d.cond[lang])}</span>
          <span class="wd-temp"><b>${d.tmax}°</b><i>${d.tmin}°</i></span>
          <span class="wd-rain">${AS.icon('rain', 12)}${d.rain == null ? '—' : d.rain + '%'}</span>
        </div>`).join('')
    }

    const paintRisk = wx => {
      const el = container.querySelector('#wxRisk')
      if (!el) return
      const risks = AS.risk(wx, prefs.crop)
      if (!risks.length) {
        el.innerHTML = `<div class="card empty-state" style="padding:16px"><span class="emoji">🌤️</span>${esc(tr('wx_no_risk'))}</div>`
        return
      }
      el.innerHTML = '<div class="cond-risk-host">' + risks.map(r => `
        <button class="cond-risk ${r.level}" data-d="${esc(r.diseaseId || '')}">
          <b>${esc(r.title[lang])} · ${esc(tr('risk_' + r.level))}</b><span>${esc(r.body[lang])}</span>
        </button>`).join('') + '</div>'
      el.querySelectorAll('[data-d]').forEach(b => {
        b.onclick = () => { if (b.dataset.d) app.go('disease', { id: b.dataset.d }) }
      })
    }

    const load = async districtId => {
      current = districtId
      prefs = app.prefs()
      const locEl = container.querySelector('#wxLoc')
      if (locEl) locEl.textContent = AS.district(districtId)[lang]
      const nowEl = container.querySelector('#wxNow')
      if (nowEl) nowEl.innerHTML = `<div class="empty-state" style="padding:20px"><span class="emoji">⏳</span>${esc(tr('wx_loading'))}</div>`
      try {
        const r = await AS.fetchWeather(districtId)
        if (!container.isConnected) return
        paintNow(r.wx)
        paintDays(r.wx)
        paintRisk(r.wx)
      } catch (e) {
        if (!container.isConnected) return
        if (nowEl) nowEl.innerHTML = `<div class="empty-state" style="padding:20px"><span class="emoji">⚠️</span>${esc(tr('wx_fail'))}</div>`
        const dEl = container.querySelector('#wxDays'); if (dEl) dEl.innerHTML = ''
        paintRisk(null)
      }
    }

    container.querySelector('#regionSel').onchange = e => load(e.target.value)

    container.querySelector('#gpsBtn').onclick = async () => {
      const sub = container.querySelector('#wxGpsSub')
      if (sub) sub.textContent = tr('wx_loading')
      const loc = await AS.useGpsDistrict()
      if (!container.isConnected) return
      if (loc) {
        if (sub) sub.textContent = tr('wx_gps_on')
        const sel = container.querySelector('#regionSel')
        if (sel) sel.value = loc.district.id
        load(loc.district.id)
      } else {
        if (sub) sub.textContent = tr('wx_gps_fail')
      }
    }

    load(current)
  }
})()
