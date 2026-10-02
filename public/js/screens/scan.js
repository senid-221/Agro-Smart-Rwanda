// AgroSmart Rwanda — Scan (camera stage + result sheet), matching the UI mockup.
(function () {
const { CROPS } = AS
const { loadImageFromFile, analyzeImageElement, runDiagnosis } = AS

let stream = null
let torchOn = false

AS.stopCamera = function () {
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

  const runAnalysis = async function (imgEl, isVideo) {
    if (analyzing) return
    if (!selectedCrop) { alert(tr('scan_error_crop')); return }
    analyzing = true
    pillBtn.disabled = true
    setPill(tr('scan_pill_analyzing'))
    // Lottie sonar rings over the leaf; the CSS ring stays underneath as fallback.
    const fx = $('#scanFx')
    fx.innerHTML = '<div class="scan-ring"></div>'
    fx.hidden = false
    const stopFx = AS.lottie(fx.querySelector('.scan-ring'), 'lottie/scan-rings.json')
    try {
      const ratios = await analyzeImageElement(imgEl, isVideo)
      const result = await runDiagnosis(ratios, selectedCrop, {
        steps: tr('scan_steps_analyzing'),
        onStep: s => setPill(s)
      })
      lastResult = result
      showSheet(result)
    } catch (e) {
      alert(tr('scan_error_type'))
    } finally {
      stopFx()
      fx.hidden = true
      fx.innerHTML = ''
      analyzing = false
      pillBtn.disabled = false
      setPill(hasLive() ? tr('scan_pill_ready') : tr('scan_gallery'))
    }
  }

  pillBtn.onclick = async function () {
    if (analyzing) return
    if (!selectedCrop) { alert(tr('scan_error_crop')); return }
    if (hasLive()) {
      try {
        const img = await frameToImage()
        runAnalysis(img, false)
      } catch (e) {
        alert(tr('scan_error_type'))
      }
      return
    }
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
  }

  startCamera().then(ok => {
    if (!container.isConnected) return
    if (ok) {
      setPill(tr('scan_pill_ready'))
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
