// AgroSmart Rwanda — Scan (camera stage + result sheet), matching the UI mockup.
(function () {
const { CROPS } = AS
const { loadImageFromFile, analyzeImageElement, runDiagnosis } = AS

let stream = null
let torchOn = false

// ---- Live HUD: honest, on-device per-frame signals (no fabricated labels) ----
// We only measure vegetation coverage, brightness, sharpness and motion to guide
// the farmer to a good shot. The real leaf/branch/stem/flower + disease call is
// made once, server-side, by the vision model (one paid AI call per scan).
let hudTimer = null
let hudCanvas = null
let hudCtx = null
let prevGray = null
const HUD_W = 96, HUD_H = 72

function readHudFrame(video) {
  if (!video || !video.videoWidth || !video.videoHeight) return null
  if (!hudCanvas) {
    hudCanvas = document.createElement('canvas')
    hudCanvas.width = HUD_W; hudCanvas.height = HUD_H
    hudCtx = hudCanvas.getContext('2d', { willReadFrequently: true })
  }
  try { hudCtx.drawImage(video, 0, 0, HUD_W, HUD_H) } catch (e) { return null }
  let data
  try { data = hudCtx.getImageData(0, 0, HUD_W, HUD_H).data } catch (e) { return null }
  const n = HUD_W * HUD_H
  const gray = new Float32Array(n)
  let veg = 0, sum = 0
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    const luma = 0.299 * r + 0.587 * g + 0.114 * b
    gray[p] = luma; sum += luma
    if (g > r + 12 && g > b + 6 && g > 45) veg++
  }
  let lap = 0, lc = 0
  for (let y = 1; y < HUD_H - 1; y++) {
    for (let x = 1; x < HUD_W - 1; x++) {
      const c = gray[y * HUD_W + x]
      lap += Math.abs(4 * c - gray[(y - 1) * HUD_W + x] - gray[(y + 1) * HUD_W + x] - gray[y * HUD_W + x - 1] - gray[y * HUD_W + x + 1])
      lc++
    }
  }
  let motion = 0
  if (prevGray) { let md = 0; for (let i = 0; i < n; i++) md += Math.abs(gray[i] - prevGray[i]); motion = md / n }
  prevGray = gray
  return { vegFrac: veg / n, bright: sum / n / 255, sharpness: lap / Math.max(1, lc), motion }
}

// Downscale an <img>/<video> to a JPEG data URL small enough to POST for vision.
function elementToDataUrl(el, maxSide) {
  return new Promise((resolve, reject) => {
    try {
      let w = el.videoWidth || el.naturalWidth || el.width
      let h = el.videoHeight || el.naturalHeight || el.height
      if (!w || !h) { reject(new Error('no_size')); return }
      const scale = Math.min(1, maxSide / Math.max(w, h))
      w = Math.round(w * scale); h = Math.round(h * scale)
      const cv = document.createElement('canvas')
      cv.width = w; cv.height = h
      cv.getContext('2d').drawImage(el, 0, 0, w, h)
      resolve(cv.toDataURL('image/jpeg', 0.85))
    } catch (e) { reject(e) }
  })
}

AS.stopCamera = function () {
  if (hudTimer) { clearInterval(hudTimer); hudTimer = null }
  prevGray = null
  if (stream) {
    try { stream.getTracks().forEach(t => t.stop()) } catch (e) { /* already stopped */ }
    stream = null
  }
  torchOn = false
}

AS.renderScan = function (container, app) {
  const tr = app.t()
  const lang = app.lang || 'rw'
  const prefs = app.prefs()
  let selectedCrop = CROPS[prefs.crop] ? prefs.crop : null
  let analyzing = false
  let lastResult = null

  AS.stopCamera()

  container.innerHTML = `
    <div class="scan-stage" id="stage">
      <div class="scan-media placeholder" id="mediaSlot">${AS.icon('leaf', 64)}</div>
      <input type="file" id="fileInput" accept="image/*" class="hidden" />

      <div class="sc-top">
        <button class="sc-btn" id="closeBtn" aria-label="${AS.esc(tr('close'))}">${AS.icon('x', 21)}</button>
        <button class="sc-btn" id="flashBtn" aria-label="${AS.esc(tr('scan_flash'))}">${AS.icon('flash', 21)}</button>
      </div>

      <div class="sc-crop-row">
        <div class="sc-crop-chips" id="cropChips"></div>
      </div>

      <div class="vf-wrap">
        <div class="vf" id="vf"><i class="tl"></i><i class="tr"></i><i class="bl"></i><i class="br"></i><span class="scanline"></span></div>
        <div class="live-badge" id="liveBadge" hidden><span class="lb-dot"></span>${AS.esc(tr('scan_live'))}</div>
        <div class="scan-hud" id="scanHud" hidden>
          <div class="hud-status" id="hudStatus">${AS.esc(tr('hud_start'))}</div>
          <div class="hud-chips" id="hudChips">
            <span class="hud-chip" data-c="light"><i></i>${AS.esc(tr('hud_c_light'))}</span>
            <span class="hud-chip" data-c="plant"><i></i>${AS.esc(tr('hud_c_plant'))}</span>
            <span class="hud-chip" data-c="fill"><i></i>${AS.esc(tr('hud_c_fill'))}</span>
            <span class="hud-chip" data-c="steady"><i></i>${AS.esc(tr('hud_c_steady'))}</span>
            <span class="hud-chip" data-c="sharp"><i></i>${AS.esc(tr('hud_c_sharp'))}</span>
          </div>
          <div class="hud-bar"><span id="hudBarFill"></span></div>
        </div>
        <div class="scan-fx" id="scanFx" hidden></div>
        <button class="an-pill" id="pillBtn"><span class="dot"></span><span id="pillText">${AS.esc(tr('scan_pill_ready'))}</span></button>
        <button class="sc-sub-btn" id="galleryBtn">${AS.esc(tr('scan_gallery'))}</button>
      </div>

      <div id="sheetHost"></div>
    </div>
  `

  const $ = s => container.querySelector(s)
  const stage = $('#stage')
  const mediaSlot = $('#mediaSlot')
  const pillBtn = $('#pillBtn')
  const pillText = $('#pillText')
  const fileInput = $('#fileInput')
  const sheetHost = $('#sheetHost')

  // ---------- crop chips ----------
  const chipsWrap = $('#cropChips')
  Object.entries(CROPS).forEach(([id, c]) => {
    const chip = document.createElement('button')
    chip.className = 'sc-chip' + (id === selectedCrop ? ' active' : '')
    chip.innerHTML = (c.img ? `<img src="${c.img}" alt="">` : '') + AS.esc(c[lang])
    chip.onclick = () => {
      selectedCrop = id
      chipsWrap.querySelectorAll('.sc-chip').forEach(x => x.classList.remove('active'))
      chip.classList.add('active')
    }
    chipsWrap.appendChild(chip)
  })
  const activeChip = chipsWrap.querySelector('.sc-chip.active')
  if (activeChip) activeChip.scrollIntoView({ inline: 'center', block: 'nearest' })

  // ---------- camera ----------
  let camEl = null
  const startCamera = async function () {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      })
    } catch (e) {
      return false
    }
    const v = document.createElement('video')
    v.className = 'scan-media'
    v.autoplay = true; v.playsInline = true; v.muted = true
    v.srcObject = stream
    mediaSlot.replaceWith(v)
    camEl = v
    try { await v.play() } catch (e) { /* autoplay policy */ }
    return true
  }

  const hasLive = () => !!camEl && !!stream

  // ---------- live HUD loop ----------
  const READY_TICKS = 8          // ~1.1s of a steady, good shot before auto-capture
  const hudEl = $('#scanHud')
  const hudStatus = $('#hudStatus')
  const hudBarFill = $('#hudBarFill')
  const liveBadge = $('#liveBadge')
  const hudChips = {}
  ;['light', 'plant', 'fill', 'steady', 'sharp'].forEach(c => { hudChips[c] = hudEl.querySelector('.hud-chip[data-c="' + c + '"]') })
  let readyStreak = 0
  let autoFired = false

  const setChip = (c, on) => { const el = hudChips[c]; if (el) el.classList.toggle('on', !!on) }

  function stopHud() {
    if (hudTimer) { clearInterval(hudTimer); hudTimer = null }
    if (hudEl) hudEl.hidden = true
    if (liveBadge) liveBadge.hidden = true
  }

  function hudTick() {
    if (!hasLive() || analyzing || autoFired || !container.isConnected) { return }
    const f = readHudFrame(camEl)
    if (!f) return
    const light = f.bright >= 0.12 && f.bright <= 0.9
    const plant = f.vegFrac >= 0.12
    const fill = f.vegFrac >= 0.28
    const steady = f.motion <= 3.2
    const sharp = f.sharpness >= 4.5
    setChip('light', light); setChip('plant', plant); setChip('fill', fill)
    setChip('steady', steady); setChip('sharp', sharp)
    const ready = light && plant && fill && steady && sharp
    let msg
    if (!light) msg = f.bright < 0.12 ? tr('hud_dark') : tr('hud_bright')
    else if (!plant) msg = tr('hud_noplant')
    else if (!fill) msg = tr('hud_fill')
    else if (!steady) msg = tr('hud_steady')
    else if (!sharp) msg = tr('hud_sharp')
    else msg = tr('hud_ready')
    if (hudStatus && hudStatus.textContent !== msg) hudStatus.textContent = msg
    const done = [light, plant, fill, steady, sharp].filter(Boolean).length
    if (hudBarFill) hudBarFill.style.width = Math.round(done / 5 * 100) + '%'
    hudEl.classList.toggle('ready', ready)
    if (ready) {
      readyStreak++
      if (readyStreak >= READY_TICKS && selectedCrop) { autoFired = true; captureAndAnalyze() }
    } else {
      readyStreak = 0
    }
  }

  function startHud() {
    if (!hasLive() || hudTimer) return
    autoFired = false; readyStreak = 0; prevGray = null
    if (hudEl) hudEl.hidden = false
    if (liveBadge) liveBadge.hidden = false
    if (hudStatus) hudStatus.textContent = tr('hud_start')
    hudTimer = setInterval(hudTick, 140)
  }

  const captureAndAnalyze = async function () {
    if (analyzing) return
    if (!selectedCrop) { autoFired = false; alert(tr('scan_error_crop')); return }
    try {
      const img = await frameToImage()
      runAnalysis(img, false)
    } catch (e) {
      autoFired = false
      alert(tr('scan_error_type'))
    }
  }

  // ---------- torch ----------
  $('#flashBtn').onclick = async function () {
    if (!hasLive()) { this.classList.remove('on'); alert(tr('scan_no_torch')); return }
    const track = stream.getVideoTracks()[0]
    const caps = (track.getCapabilities && track.getCapabilities()) || {}
    if (!caps.torch) { alert(tr('scan_no_torch')); return }
    try {
      torchOn = !torchOn
      await track.applyConstraints({ advanced: [{ torch: torchOn }] })
      this.classList.toggle('on', torchOn)
    } catch (e) { alert(tr('scan_no_torch')) }
  }

  $('#closeBtn').onclick = () => { AS.stopCamera(); app.go('home') }
  $('#galleryBtn').onclick = () => fileInput.click()

  const setPill = function (txt) { pillText.textContent = txt }

  // ---------- analyze ----------
  const frameToImage = function () {
    return new Promise((resolve, reject) => {
      if (!hasLive()) { reject(new Error('no_camera')); return }
      const w = camEl.videoWidth, h = camEl.videoHeight
      if (!w || !h) { reject(new Error('no_frame')); return }
      const cv = document.createElement('canvas')
      cv.width = w; cv.height = h
      cv.getContext('2d').drawImage(camEl, 0, 0, w, h)
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = cv.toDataURL('image/jpeg', 0.92)
    })
  }

  // ONE paid AI call per scan: only when the remote provider is configured.
  // Returns the vision model's findings text, or null (on-device result still shows).
  const callAnalyze = async function (imgEl) {
    const prov = (AS.PROVIDER && AS.PROVIDER.get && AS.PROVIDER.get()) || { mode: 'builtin' }
    if (prov.mode !== 'remote') return null
    try {
      const dataUrl = await elementToDataUrl(imgEl, 1024)
      const r = await AS.api.post('/ai/analyze', { dataUrl, lang, cropHint: selectedCrop || '' })
      return (r && r.findings) ? String(r.findings) : null
    } catch (e) { return null }
  }

  const runAnalysis = async function (imgEl, isVideo) {
    if (analyzing) return
    if (!selectedCrop) { alert(tr('scan_error_crop')); return }
    analyzing = true
    stopHud()
    pillBtn.disabled = true
    setPill(tr('scan_pill_analyzing'))
    // Lottie sonar rings over the leaf; the CSS ring stays underneath as fallback.
    const fx = $('#scanFx')
    fx.innerHTML = '<div class="scan-ring"></div>'
    fx.hidden = false
    const stopFx = AS.lottie(fx.querySelector('.scan-ring'), 'lottie/scan-rings.json')
    let shown = false
    try {
      const ratios = await analyzeImageElement(imgEl, isVideo)
      // The real vision call and the on-device colour diagnosis run together.
      const [aiFindings, result] = await Promise.all([
        callAnalyze(imgEl),
        runDiagnosis(ratios, selectedCrop, { steps: tr('scan_steps_analyzing'), onStep: s => setPill(s), totalMs: 2400 })
      ])
      result.aiFindings = aiFindings
      lastResult = result
      showSheet(result)
      shown = true
    } catch (e) {
      alert(tr('scan_error_type'))
    } finally {
      stopFx()
      fx.hidden = true
      fx.innerHTML = ''
      analyzing = false
      pillBtn.disabled = false
      autoFired = false; readyStreak = 0; prevGray = null
      setPill(hasLive() ? tr('scan_pill_ready') : tr('scan_gallery'))
      // Only resume the live HUD if we did not open the result sheet.
      if (hasLive() && !shown) startHud()
    }
  }

  pillBtn.onclick = async function () {
    if (analyzing) return
    if (!selectedCrop) { alert(tr('scan_error_crop')); return }
    if (hasLive()) { autoFired = true; captureAndAnalyze(); return }
    fileInput.click()
  }

  fileInput.onchange = async function (e) {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    if (!selectedCrop) { alert(tr('scan_error_crop')); fileInput.value = ''; return }
    if (!file.type.startsWith('image/')) { alert(tr('scan_error_type')); fileInput.value = ''; return }
    try {
      const loaded = await loadImageFromFile(file)
      // Replace the placeholder/camera with the chosen photo while we analyse it.
      if (!camEl) {
        const img = new Image()
        img.className = 'scan-media'
        img.src = loaded.url
        mediaSlot.replaceWith(img)
      }
      runAnalysis(loaded.el, false)
    } catch (err) {
      alert(tr('scan_error_type'))
    }
  }

  // ---------- result sheet ----------
  const showSheet = function (result) {
    const healthy = result.healthy || !result.best
    const d = healthy ? null : result.best.disease
    const crop = CROPS[selectedCrop] || {}
    const conf = healthy ? null : result.best.confidence
    const sevCls = d ? 'sev-' + d.severity : 'sev-low'

    if (healthy) {
      app.addHistory({ diseaseId: null, confidence: null, crop: selectedCrop })
    } else {
      app.addHistory({ diseaseId: d.id, confidence: conf, crop: selectedCrop })
    }

    // Real AI vision findings (one call per scan). Falls back to a note when the
    // remote model is not configured, so we never invent an "AI" narrative.
    const aiBlock = result.aiFindings
      ? `<div class="ai-findings"><div class="af-head">${AS.esc(tr('scan_ai_findings'))}</div><div class="af-body">${AS.esc(result.aiFindings)}</div></div>`
      : `<div class="ai-note">${AS.esc(tr('scan_ai_unavailable'))}</div>`

    // Field conditions: live weather (filled async) + RAB guide rates for the crop.
    const soil = AS.soilFor(selectedCrop)
    const conditionsHtml = `
      <div class="cond-panel">
        <div class="cond-title">${AS.esc(tr('scan_conditions'))}</div>
        <div class="cond-wx" id="condWx">${AS.esc(tr('cond_wx_loading'))}</div>
        <div class="cond-risk-host" id="condRisk"></div>
        <div class="cond-soil">
          <div class="cond-row"><span>${AS.esc(tr('cond_ph'))}</span><b>${AS.esc(soil.ph.join('–'))}</b></div>
          <div class="cond-row"><span>N</span><b>${AS.esc(soil.n.v)} ${AS.esc(soil.n.u)}</b></div>
          <div class="cond-row"><span>P</span><b>${AS.esc(soil.p.v)} ${AS.esc(soil.p.u)}</b></div>
          <div class="cond-row"><span>K</span><b>${AS.esc(soil.k.v)} ${AS.esc(soil.k.u)}</b></div>
          <div class="cond-src">${AS.esc(tr('cond_guide_tag'))} · ${AS.esc(soil.src[lang])}</div>
        </div>
      </div>`

    sheetHost.innerHTML = `
      <div class="sheet" id="sheet">
        <div class="sheet-handle"></div>
        <div class="sh-head">
          <div style="min-width:0">
            <div class="sh-title">${AS.esc(healthy ? tr('result_healthy') : d.name[lang])}</div>
            ${healthy ? `<div class="sh-sci">${AS.esc(crop[lang] || '')}</div>` : `<div class="sh-sci">${AS.esc(d.sci)}</div>`}
          </div>
          ${healthy ? '' : `<span class="badge ${sevCls}">${AS.esc(tr('sev_' + d.severity))}</span>`}
        </div>
        ${healthy ? '' : `<div class="sh-conf">${AS.icon('checkc', 15)}${Math.round(conf)}% ${AS.esc(tr('result_confidence'))}</div>`}
        <div class="kv-grid">
          <div class="kv"><div class="k">${AS.esc(tr('scan_kv_crop'))}</div><div class="v">${AS.esc(crop[lang] || selectedCrop)}</div></div>
          <div class="kv"><div class="k">${AS.esc(tr('scan_kv_where'))}</div><div class="v">${AS.esc(AS.district(prefs.district)[lang])}</div></div>
          ${healthy ? '' : `<div class="kv" style="grid-column:1/-1"><div class="k">${AS.esc(tr('result_cause'))}</div><div class="v" style="font-size:12.5px;font-weight:500;color:var(--text-soft)">${AS.esc(d.cause[lang])}</div></div>`}
        </div>
        ${healthy ? `
          <div class="rec-head">${AS.icon('sprout', 18)}${AS.esc(tr('scan_rec_healthy'))}</div>
          <div class="rec-body">${AS.esc(tr('result_healthy_desc'))}</div>` : `
          <div class="rec-head">${AS.icon('sprout', 18)}${AS.esc(tr('scan_rec_action'))}</div>
          <div class="rec-body">${AS.esc((d.treatment[lang] || [])[0] || '')}</div>
          ${result.alternates && result.alternates.length ? `
            <div class="alt-title">${AS.esc(tr('result_other_possibilities'))}</div>
            ${result.alternates.map(m => `
              <button class="list-row" data-disease="${m.disease.id}">
                <span class="body"><span class="name">${AS.esc(m.disease.name[lang])}</span><span class="meta">${m.confidence}%</span></span>
                <span class="arrow">${AS.icon('arrowr', 16)}</span>
              </button>`).join('')}` : ''}`}
        ${aiBlock}
        ${conditionsHtml}
        <div class="sheet-actions">
          <button class="btn-ghost" id="saveBtn">${AS.esc(tr('scan_save'))}</button>
          <button class="btn-solid" id="planBtn">${AS.esc(healthy ? tr('result_scan_again') : tr('scan_treatment_plan'))}</button>
        </div>
        <p class="danger-note">${AS.esc(tr('result_disclaimer'))}</p>
      </div>`

    const sheet = sheetHost.querySelector('#sheet')
    sheet.querySelectorAll('[data-disease]').forEach(b => {
      b.onclick = () => { AS.stopCamera(); app.go('disease', { id: b.dataset.disease }) }
    })
    sheet.querySelector('#planBtn').onclick = () => {
      if (healthy) { AS.stopCamera(); app.go('scan'); return }
      AS.stopCamera()
      app.go('disease', { id: d.id })
    }
    const saveBtn = sheet.querySelector('#saveBtn')
    saveBtn.onclick = async function () {
      saveBtn.disabled = true
      saveBtn.textContent = tr('scan_saving')
      await AS.api.post('/scans', {
        crop: selectedCrop,
        disease: healthy ? null : d.id,
        confidence: healthy ? null : conf,
        meta: { district: prefs.district, source: hasLive() ? 'camera' : 'gallery' }
      })
      saveBtn.textContent = tr('scan_saved')
      saveBtn.style.color = 'var(--green-700)'
    }

    // The camera stays on behind the sheet; hide the viewfinder chrome so the sheet reads cleanly.
    const vf = $('#vf')
    if (vf) vf.style.opacity = '0.25'

    fillConditions()
  }

  // Fill the conditions panel with live Open-Meteo weather + deterministic risk.
  const fillConditions = async function () {
    const wxHost = sheetHost.querySelector('#condWx')
    const riskHost = sheetHost.querySelector('#condRisk')
    if (!wxHost) return
    let wx = AS.cachedWeather(prefs.district)
    try { const r = await AS.fetchWeather(prefs.district); if (r && r.wx) wx = r.wx } catch (e) { /* keep cache */ }
    if (!sheetHost.querySelector('#condWx')) return  // sheet was replaced
    if (!wx) { wxHost.textContent = tr('cond_wx_fail'); return }
    const cond = wx.cond || {}
    wxHost.innerHTML = `
      <div class="cond-row"><span>${AS.esc(tr('cond_weather'))}</span><b>${Math.round(wx.temp)}°C · ${AS.esc(cond[lang] || '')}</b></div>
      <div class="cond-row"><span>${AS.esc(tr('cond_moisture'))}</span><b>${wx.rh}%</b></div>
      <div class="cond-row"><span>${AS.esc(tr('cond_water'))}</span><b>${(wx.rainProb || []).map(p => Math.round(p) + '%').join(' · ') || '—'}</b></div>`
    if (riskHost) {
      const risks = AS.risk(wx, selectedCrop) || []
      riskHost.innerHTML = `<div class="cond-risk-label">${AS.esc(tr('cond_risk'))}</div>` + (
        risks.length
          ? risks.slice(0, 2).map(r => `<button class="cond-risk ${r.level}" ${r.diseaseId ? `data-disease="${r.diseaseId}"` : ''}><b>${AS.esc(r.title[lang])}</b><span>${AS.esc(r.body[lang])}</span></button>`).join('')
          : `<div class="cond-risk none">${AS.esc(tr('cond_risk_none'))}</div>`)
      riskHost.querySelectorAll('[data-disease]').forEach(b => {
        b.onclick = () => { AS.stopCamera(); app.go('disease', { id: b.dataset.disease }) }
      })
    }
  }

  startCamera().then(ok => {
    if (!container.isConnected) return
    if (ok) {
      setPill(tr('scan_pill_ready'))
      startHud()
    } else {
      setPill(tr('scan_gallery'))
      const hint = document.createElement('div')
      hint.style.cssText = 'position:absolute;bottom:16px;left:0;right:0;text-align:center;color:rgba(255,255,255,.6);font-size:11.5px'
      hint.textContent = tr('scan_no_camera')
      stage.appendChild(hint)
    }
  })
}
})()
