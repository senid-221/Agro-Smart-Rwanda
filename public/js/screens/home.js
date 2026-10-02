(function () {
const { CROPS } = AS

const TIPS = {
  en: [
    'Scout your fields twice a week — early detection saves the harvest.',
    'Plant certified seed only: it is the cheapest insurance against disease.',
    'Sterilise machetes with bleach between banana mats to stop Kirabiranya (BXW).',
    'Spray potato late blight every 5-7 days during the rainy season — never wait for symptoms.',
    'Dry maize to 13% moisture and store in hermetic (PICS) bags — no weevils, no chemicals.',
    'Rotate maize with beans: beans add free nitrogen back into the soil.',
    'Remove the banana male bud by hand weekly — the #1 defence against BXW.',
    'Apply fertiliser 5-7 cm from the stem and cover it — uncovered urea evaporates.',
    'Whitefly nets over tomato nurseries stop TYLCV before it starts.',
    'Grade your harvest before selling — graded maize fetches 15-25% more.'
  ],
  rw: [
    'Genzura imirima kabiri mu cyumweru — kubona indwara hakiri kare kizarokora isarura.',
    'Tera imbuto zemewe gusa: ni ubwishingizi buhendutse ku ndwara.',
    'Sukura ibyuma na javel hagati y\'ibiti by\'ibitoki kugira ngo uhagarike Kirabiranya.',
    'Tera imiti y\'ikiyongoyongo cy\'ibirayi buri minsi 5-7 mu gihe cy\'imvura — ntukagire icyo utegereza.',
    'Muza ibigori ku buhehere bwa 13% ubike mu mifuka ya PICS — nta binyugunyugu, nta miti.',
    'Simbuza ibigori n\'ibishyimbo: ibishyimbo byongera azote ku buntu mu butaka.',
    'Kuraho indabyo y\'ingabo y\'igitoki n\'intoki buri cyumweru — ubwirinzi bwa mbere bwa BXW.',
    'Shyira ifumbire cm 5-7 uvuye ku giti uyishingire — urea itapfutse irahinduka umwuka.',
    'Imiyoboro ya whitefly ku biti by\'inyanya ihagarika TYLCV itaraba.',
    'Tondeka umusaruro mbere yo kugurisha — ibigori bitondetswe bibona 15-25% by\'inyongera.'
  ]
}

AS.renderHome = function (container, app) {
  const tr = app.t()
  const lang = app.lang || 'rw'
  const prefs = app.prefs()
  const district = AS.district(prefs.district)
  const soil = AS.soilFor(prefs.crop)
  const cropMeta = CROPS[prefs.crop] || {}
  const cropName = cropMeta[lang] || prefs.crop
  const cached = AS.cachedWeather(prefs.district)
  const hour = new Date().getHours()
  const greetKey = hour < 12 ? 'greet_morning' : hour < 17 ? 'greet_afternoon' : 'greet_evening'
  const first = (app.name || '').trim().split(/\s+/)[0]
  const dayIndex = new Date().getDate() % TIPS[lang === 'rw' ? 'rw' : 'en'].length

  const humTag = function (wx) {
    if (!wx) return { txt: tr('home_weather_loading'), cls: '' }
    if (wx.rh >= 85) return { txt: tr('tag_wet'), cls: 'warn' }
    if (wx.rh < 40) return { txt: tr('tag_dry'), cls: 'warn' }
    return { txt: tr('tag_normal'), cls: '' }
  }
  const tempTag = function (wx) {
    if (!wx) return { txt: '—', cls: '' }
    const band = AS.tempBand(wx.temp, prefs.crop)
    if (band === 'high') return { txt: tr('tag_hot'), cls: 'warn' }
    if (band === 'low') return { txt: tr('tag_cool'), cls: 'warn' }
    return { txt: tr('tag_normal'), cls: '' }
  }

  container.innerHTML = `
    <div class="top-bar">
      <div style="min-width:0">
        <div class="tb-date">${AS.esc(AS.dateLabel(lang))}</div>
        <div class="tb-title">${AS.esc(tr(greetKey))}${first ? ', ' + AS.esc(first) : ''}</div>
      </div>
      <div class="tb-right">
        <button class="lang-pill" id="langToggle">${lang === 'rw' ? 'EN' : 'RW'}</button>
        <button class="avatar-btn" id="avatarBtn" aria-label="${AS.esc(tr('nav_settings'))}">${AS.icon('user', 22)}</button>
      </div>
    </div>

    <button class="hero-weather" id="wxCard">
      <span class="hw-main">
        <span class="hw-loc">${AS.icon('pin', 13)}<span id="wxLoc">${AS.esc(district[lang])}</span></span>
        <span class="hw-temp" id="wxTemp">${cached ? cached.temp + '°C' : '—'}</span>
        <span class="hw-cond" id="wxCond">${cached ? AS.esc(cached.cond[lang]) : AS.esc(tr('home_weather_loading'))}</span>
      </span>
      <span class="hw-side">
        <span class="hw-row">${AS.icon('drop', 14)}<span id="wxRh">${cached ? cached.rh + '%' : '—'}</span></span>
        <span class="hw-row">${AS.icon('wind', 14)}<span id="wxWind">${cached ? cached.wind + ' m/s' : '—'}</span></span>
        <span class="hw-row">${AS.icon('rain', 14)}<span id="wxRain">${cached && cached.rainProb && cached.rainProb[0] != null ? cached.rainProb[0] + '%' : '—'}</span></span>
      </span>
    </button>

    <div class="sec-head">
      <span class="sec-title">${AS.esc(tr('home_tools'))}</span>
    </div>
    <p class="tools-sub">${AS.esc(tr('home_tools_d'))}</p>
    <div class="tools-grid">
      <button class="tool-card" data-go="assistant">
        <span class="tc-ico doctor">${AS.icon('chat', 22)}</span>
        <span class="tc-body"><span class="tc-title">${AS.esc(tr('tool_doctor'))}</span><span class="tc-desc">${AS.esc(tr('tool_doctor_d'))}</span></span>
      </button>
      <button class="tool-card" data-go="scan">
        <span class="tc-ico scan">${AS.icon('scan', 22)}</span>
        <span class="tc-body"><span class="tc-title">${AS.esc(tr('tool_scan'))}</span><span class="tc-desc">${AS.esc(tr('tool_scan_d'))}</span></span>
      </button>
      <button class="tool-card" data-go="weather">
        <span class="tc-ico wx">${AS.icon('cloud', 22)}</span>
        <span class="tc-body"><span class="tc-title">${AS.esc(tr('tool_weather'))}</span><span class="tc-desc">${AS.esc(tr('tool_weather_d'))}</span></span>
      </button>
      <button class="tool-card" data-go="community">
        <span class="tc-ico community">${AS.icon('user', 22)}</span>
        <span class="tc-body"><span class="tc-title">${AS.esc(tr('tool_community'))}</span><span class="tc-desc">${AS.esc(tr('tool_community_d'))}</span></span>
      </button>
      <button class="tool-card" data-go="map">
        <span class="tc-ico wx">${AS.icon('map', 22)}</span>
        <span class="tc-body"><span class="tc-title">${AS.esc(tr('tool_map'))}</span><span class="tc-desc">${AS.esc(tr('tool_map_d'))}</span></span>
      </button>
    </div>

    <div class="sec-head">
      <span class="sec-title">${AS.esc(tr('home_soil_status'))}</span>
      <button class="sec-link" id="soilLink">${AS.esc(tr('home_detailed_report'))}</button>
    </div>
    <div class="stat-grid2">
      <div class="stat2">
        <span class="s2-label">${AS.icon('drop', 12)}${AS.esc(tr('home_humidity'))}</span>
        <span class="s2-value" id="sHumVal">${cached ? cached.rh + '%' : '—'}</span>
        <span class="tag ${humTag(cached).cls}" id="sHumTag">${AS.esc(humTag(cached).txt)}</span>
      </div>
      <div class="stat2">
        <span class="s2-label">${AS.icon('flask', 12)}${AS.esc(tr('home_ph'))}</span>
        <span class="s2-value">${soil.ph[0].toFixed(1)}–${soil.ph[1].toFixed(1)}</span>
        <span class="tag">${AS.esc(tr('tag_target'))}</span>
      </div>
      <div class="stat2">
        <span class="s2-label">${AS.icon('sprout', 12)}${AS.esc(tr('home_nitrogen'))}</span>
        <span class="s2-value">${AS.esc(soil.n.v)}<small style="font-size:11px;font-weight:600;color:var(--text-soft);margin-left:3px">${AS.esc(soil.n.u)}</small></span>
        <span class="tag ${soil.n.v === '—' ? 'warn' : ''}">${AS.esc(tr('tag_guide'))}</span>
      </div>
      <div class="stat2">
        <span class="s2-label">${AS.icon('thermo', 12)}${AS.esc(tr('home_temp'))}</span>
        <span class="s2-value" id="sTempVal">${cached ? cached.temp + '°C' : '—'}</span>
        <span class="tag ${tempTag(cached).cls}" id="sTempTag">${AS.esc(tempTag(cached).txt)}</span>
      </div>
    </div>

    <button class="insight-card" id="insightCard">
      <span class="ic-ico">${AS.icon('sparkle', 19)}</span>
      <span class="ic-wrap">
        <span class="ic-head"><span class="ic-title">${AS.esc(tr('home_ai_insight'))}</span><span class="badge-new">${AS.esc(tr('new_badge'))}</span></span>
        <span class="ic-body" id="insBody">${AS.esc(tr('home_insight_loading'))}</span>
      </span>
    </button>

    <div class="sec-head">
      <span class="sec-title">${AS.esc(tr('home_crop_health'))}</span>
      <button class="sec-link" id="viewAll">${AS.esc(tr('view_all'))}</button>
    </div>
    <div id="cropRows"></div>

    <div class="sec-head"><span class="sec-title">${AS.esc(tr('home_quick'))}</span></div>
    <div class="grid-2">
      <button class="feature-card" data-go="learn">
        <span class="fico-wrap">${AS.icon('book', 20)}</span>
        <span class="label">${AS.esc(tr('home_feature_learn'))}</span>
        <span class="desc">${AS.esc(tr('home_feature_learn_d'))}</span>
      </button>
      <button class="feature-card" data-go="crops">
        <span class="fico-wrap">${AS.icon('leaf', 20)}</span>
        <span class="label">${AS.esc(tr('home_feature_crops'))}</span>
        <span class="desc">${AS.esc(tr('home_feature_crops_d'))}</span>
      </button>
      <button class="feature-card" data-go="fertilizer">
        <span class="fico-wrap">${AS.icon('flask', 20)}</span>
        <span class="label">${AS.esc(tr('home_feature_fert'))}</span>
        <span class="desc">${AS.esc(tr('home_feature_fert_d'))}</span>
      </button>
      <button class="feature-card" data-go="library">
        <span class="fico-wrap">${AS.icon('shield', 20)}</span>
        <span class="label">${AS.esc(tr('home_feature_diseases'))}</span>
        <span class="desc">${AS.esc(tr('home_feature_diseases_d'))}</span>
      </button>
      <button class="feature-card" data-go="store">
        <span class="fico-wrap">${AS.icon('cart', 20)}</span>
        <span class="label">${AS.esc(tr('home_feature_store'))}</span>
        <span class="desc">${AS.esc(tr('home_feature_store_d'))}</span>
      </button>
      <button class="feature-card" data-go="assistant">
        <span class="fico-wrap">${AS.icon('chat', 20)}</span>
        <span class="label">${AS.esc(tr('home_feature_ai'))}</span>
        <span class="desc">${AS.esc(tr('home_feature_ai_d'))}</span>
      </button>
    </div>

    <div class="sec-head">
      <span class="sec-title">${AS.esc(tr('home_discover'))}</span>
    </div>
    <div class="discover">
      <button class="disc-card" data-go="scan">
        <span class="dc-ico">${AS.icon('scan', 20)}</span>
        <span class="dc-body"><span class="dc-t">${AS.esc(tr('discover_scan_t'))}</span><span class="dc-d">${AS.esc(tr('discover_scan_d'))}</span></span>
      </button>
      <button class="disc-card" data-go="assistant">
        <span class="dc-ico">${AS.icon('chat', 20)}</span>
        <span class="dc-body"><span class="dc-t">${AS.esc(tr('discover_chat_t'))}</span><span class="dc-d">${AS.esc(tr('discover_chat_d'))}</span></span>
      </button>
      <button class="disc-card" data-go="weather">
        <span class="dc-ico">${AS.icon('pin', 20)}</span>
        <span class="dc-body"><span class="dc-t">${AS.esc(tr('discover_gps_t'))}</span><span class="dc-d">${AS.esc(tr('discover_gps_d'))}</span></span>
      </button>
      <button class="disc-card" data-go="expert">
        <span class="dc-ico">${AS.icon('star', 20)}</span>
        <span class="dc-body"><span class="dc-t">${AS.esc(tr('discover_expert_t'))}</span><span class="dc-d">${AS.esc(tr('discover_expert_d'))}</span></span>
      </button>
    </div>

    <div class="banner">
      <div class="bn-track" id="bnTrack">
        <div class="bn-slide tip-card"><b>${AS.esc(tr('home_tip'))}:</b> ${AS.esc(TIPS[lang === 'rw' ? 'rw' : 'en'][dayIndex])}</div>
        <button class="bn-slide bn-go" data-go="scan">
          <span class="bg-ico">${AS.icon('scan', 20)}</span>
          <span class="bg-body">
            <span class="bg-title">${AS.esc(tr('home_scan_title'))}</span>
            <span class="bg-text">${AS.esc(tr('home_scan_desc'))}</span>
          </span>
          <span class="bg-arrow">${AS.icon('arrowr', 18)}</span>
        </button>
        <button class="bn-slide bn-go dark" data-go="assistant">
          <span class="bg-ico">${AS.icon('chat', 20)}</span>
          <span class="bg-body">
            <span class="bg-title">${AS.esc(tr('home_feature_ai'))}</span>
            <span class="bg-text">${AS.esc(tr('home_feature_ai_d'))}</span>
          </span>
          <span class="bg-arrow">${AS.icon('arrowr', 18)}</span>
        </button>
        <button class="bn-slide bn-go" data-go="alerts">
          <span class="bg-ico">${AS.icon('bell', 20)}</span>
          <span class="bg-body">
            <span class="bg-title">${AS.esc(tr('nav_alerts'))}</span>
            <span class="bg-text">${AS.esc(tr('al_weather'))}</span>
          </span>
          <span class="bg-arrow">${AS.icon('arrowr', 18)}</span>
        </button>
      </div>
      <div class="bn-dots" id="bnDots"><i class="on"></i><i></i><i></i><i></i></div>
    </div>
    <p class="danger-note">${AS.esc(tr('home_source_note')).replace('{crop}', AS.esc(cropName))}</p>
  `

  container.querySelector('#langToggle').onclick = () => app.setLang(lang === 'rw' ? 'en' : 'rw')
  container.querySelector('#avatarBtn').onclick = () => app.go('settings')
  container.querySelector('#wxCard').onclick = () => app.go('weather')
  container.querySelector('#soilLink').onclick = () => app.go('dashboard')
  container.querySelector('#viewAll').onclick = () => app.go('dashboard')
  container.querySelector('#insightCard').onclick = () => app.go('assistant')
  container.querySelectorAll('[data-go]').forEach(b => (b.onclick = () => app.go(b.dataset.go)))

  // ---- sliding banner ----
  const track = container.querySelector('#bnTrack')
  const dots = Array.from(container.querySelectorAll('#bnDots i'))
  let slide = 0
  let swiped = false
  const show = function (i) {
    slide = (i + dots.length) % dots.length
    track.style.transform = 'translateX(' + (-slide * 100) + '%)'
    dots.forEach((d, n) => d.classList.toggle('on', n === slide))
  }
  const timer = setInterval(function () {
    if (!container.isConnected) return clearInterval(timer)
    show(slide + 1)
  }, 5200)
  let downX = null
  track.addEventListener('pointerdown', e => { downX = e.clientX }, { passive: true })
  track.addEventListener('pointerup', e => {
    if (downX == null) return
    const dx = e.clientX - downX
    downX = null
    if (Math.abs(dx) < 40) return
    swiped = true
    show(dx < 0 ? slide + 1 : slide - 1)
  }, { passive: true })
  // A swipe ends on the same button it started on — swallow that click.
  track.querySelectorAll('.bn-go').forEach(function (b) {
    b.onclick = function () {
      if (swiped) { swiped = false; return }
      app.go(b.dataset.go)
    }
  })

  // ---- live weather (Open-Meteo) ----
  const paintWx = function (wx) {
    if (!container.isConnected) return
    const set = (id, v) => { const e = container.querySelector('#' + id); if (e) e.textContent = v }
    set('wxTemp', wx.temp + '°C')
    set('wxCond', wx.cond[lang])
    set('wxRh', wx.rh + '%')
    set('wxWind', wx.wind + ' m/s')
    set('wxRain', (wx.rainProb && wx.rainProb[0] != null) ? wx.rainProb[0] + '%' : '—')
    set('sHumVal', wx.rh + '%')
    set('sTempVal', wx.temp + '°C')
    const ht = humTag(wx)
    const tt = tempTag(wx)
    const h = container.querySelector('#sHumTag')
    const t2 = container.querySelector('#sTempTag')
    if (h) { h.textContent = ht.txt; h.className = 'tag ' + ht.cls }
    if (t2) { t2.textContent = tt.txt; t2.className = 'tag ' + tt.cls }
  }

  const paintInsight = function (wx, lastScan) {
    if (!container.isConnected) return
    const el = container.querySelector('#insBody')
    if (!el) return
    const ins = AS.insight(wx, prefs.crop, lastScan, lang)
    el.textContent = ins.body[lang] || ins.body.en
  }

  // ---- crop health rows from real cases + real scans ----
  const rowsEl = container.querySelector('#cropRows')
  const statusKey = { open: 'cs_open', monitoring: 'cs_monitoring', resolved: 'cs_resolved', closed: 'cs_closed' }

  const cropRow = function (o) {
    const b = document.createElement('button')
    b.className = 'crop-row'
    const img = o.img
      ? `<span class="cr-ico"><img src="${o.img}" alt=""></span>`
      : `<span class="cr-ico"><span style="font-size:20px">${o.emoji || '🌿'}</span></span>`
    b.innerHTML = img +
      `<span class="cr-body"><span class="cr-name">${AS.esc(o.name)}</span><span class="cr-sub">${AS.esc(o.sub)}</span></span>` +
      (o.pct != null ? AS.ring(o.pct, 42) : (o.badge ? `<span class="badge ${o.badgeCls}">${AS.esc(o.badge)}</span>` : ''))
    b.onclick = o.onclick
    return b
  }

  const loadHealth = async function () {
    const [casesR, scansR] = await Promise.all([
      AS.api.get('/ai/cases'), AS.api.get('/scans')
    ])
    if (!container.isConnected) return
    const cases = (casesR && !casesR.error && casesR.cases) ? casesR.cases.slice(0, 4) : []
    const scans = (scansR && !scansR.error) ? scansR.slice(0, 3) : []

    rowsEl.innerHTML = ''
    if (!cases.length && !scans.length) {
      const local = (app.history || []).slice(0, 3)
      if (local.length) {
        local.forEach(function (item) {
          const d = AS.disease(item.diseaseId)
          rowsEl.appendChild(cropRow({
            img: d ? (CROPS[d.crop] || {}).img : '',
            emoji: d ? (CROPS[d.crop] || {}).emoji : '✅',
            name: d ? d.name[lang] : tr('result_healthy'),
            sub: d ? AS.district(prefs.district)[lang] + ' · ' + AS.ago(lang, item.at) : AS.ago(lang, item.at),
            pct: d ? item.confidence : null,
            badge: d ? tr('sev_' + d.severity) : null,
            badgeCls: d ? 'sev-' + d.severity : null,
            onclick: function () { if (d) app.go('disease', { id: d.id }) }
          }))
        })
      } else {
        rowsEl.innerHTML = `<div class="card empty-state"><span class="emoji">🌿</span>${AS.esc(tr('home_no_crops'))}</div>`
      }
      return
    }

    for (const c of cases) {
      const crop = CROPS[c.crop] || {}
      const d = AS.disease(c.suspected)
      let pct = null
      const ins = await AS.api.get('/ai/cases/' + c.id + '/insights')
      if (ins && !ins.error && ins.recovery) pct = ins.recovery.score
      rowsEl.appendChild(cropRow({
        img: crop.img, emoji: crop.emoji,
        name: d ? d.name[lang] : (c.suspected ? AS.esc(c.suspected) : (crop[lang] || c.crop)),
        sub: tr(statusKey[c.status] || 'cs_open') + ' · ' + (c.district || district[lang]),
        pct: pct,
        badge: pct == null ? tr(statusKey[c.status] || 'cs_open') : null,
        badgeCls: 'sev-low',
        onclick: function () { app.go('case', { id: c.id }) }
      }))
    }

    for (const s of scans) {
      const d = AS.disease(s.disease)
      const crop = CROPS[s.crop] || (d ? CROPS[d.crop] : null) || {}
      rowsEl.appendChild(cropRow({
        img: crop.img, emoji: crop.emoji,
        name: d ? d.name[lang] : (s.disease ? AS.esc(s.disease) : tr('result_healthy')),
        sub: new Date(s.at).toLocaleDateString(lang === 'rw' ? 'fr-RW' : 'en-GB', { day: 'numeric', month: 'short' }) +
          ' · ' + Math.round(s.confidence) + '%',
        pct: s.confidence ? Math.round(s.confidence) : null,
        onclick: function () { if (d) app.go('disease', { id: d.id }); else app.go('library') }
      }))
    }

    const lastScan = scans.find(s => s.disease && s.confidence)
    paintInsight(cached || null, lastScan)
  }

  if (cached) paintInsight(cached, null)
  loadHealth()

  AS.fetchWeather(prefs.district).then(function (r) {
    if (!container.isConnected) return
    paintWx(r.wx)
    paintInsight(r.wx, null)
    AS.fetchWeather.__last = r.wx
  }).catch(function () {
    if (!container.isConnected) return
    const el = container.querySelector('#wxCond')
    if (el && !cached) el.textContent = tr('home_weather_fail')
    paintInsight(null, null)
  })
}
})()
