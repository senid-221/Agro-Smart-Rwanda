(function () {
const { CROPS } = AS
const { loadImageFromFile, analyzeImageElement, runDiagnosis } = AS

let media = null // { file, url, isVideo }

AS.renderScan = function (container, app) {
  const tr = app.t()
  const lang = app.lang

  container.innerHTML = `
    <div class="section-title">${tr('scan_title')} 🩺</div>

    <div id="pickSection">
      <div class="dropzone" id="dropzone">
        <span class="emoji">📸</span>
        <span class="hint">${tr('scan_step1')}</span>
        <span class="sub">${tr('scan_step1_hint')}</span>
      </div>
      <div class="grid-2" style="margin-top:10px">
        <button class="btn btn-outline" id="pickPhoto">🖼️ ${tr('scan_photo')}</button>
        <button class="btn btn-outline" id="pickVideo">🎬 ${tr('scan_video')}</button>
      </div>
      <input type="file" id="fileInput" accept="image/*" class="hidden" />
      <input type="file" id="videoInput" accept="video/*" class="hidden" />

      <div id="previewWrap" class="hidden" style="margin-top:14px">
        <div class="media-preview" id="mediaPreview">
          <button class="remove-btn" id="removeMedia">✕</button>
        </div>
      </div>

      <div class="select-group">
        <label>${tr('scan_step2')}</label>
        <p class="progress-note">${tr('scan_step2_hint')}</p>
        <div class="chip-row" id="cropChips"></div>
      </div>

      <button class="btn btn-primary" id="analyzeBtn" disabled style="margin-top:18px">
        🔬 ${tr('scan_start')}
      </button>
      <p class="danger-note">${tr('result_disclaimer')}</p>
    </div>

    <div id="analyzeSection" class="hidden">
      <div class="analyzing">
        <div class="scan-ring"></div>
        <div class="title" style="font-weight:700;color:var(--green-900)">${tr('scan_analyzing')}</div>
        <div class="step" id="analyzeStep"></div>
        <div class="media-preview" id="analyzePreview" style="margin-top:16px"></div>
      </div>
    </div>

    <div id="resultSection" class="hidden"></div>
  `

  const $ = s => container.querySelector(s)
  const fileInput = $('#fileInput')
  const videoInput = $('#videoInput')
  const dropzone = $('#dropzone')
  const analyzeBtn = $('#analyzeBtn')
  const chipsWrap = $('#cropChips')
  let selectedCrop = null

  // crop chips
  Object.entries(CROPS).forEach(([id, c]) => {
    const chip = document.createElement('button')
    chip.className = 'chip'
    chip.textContent = `${c.emoji} ${c[lang]}`
    chip.onclick = () => {
      selectedCrop = id
      chipsWrap.querySelectorAll('.chip').forEach(x => x.classList.remove('active'))
      chip.classList.add('active')
      updateBtn()
    }
    chipsWrap.appendChild(chip)
  })

  function updateBtn() {
    analyzeBtn.disabled = !(media && selectedCrop)
  }

  function showPreview() {
    const wrap = $('#previewWrap')
    const box = $('#mediaPreview')
    box.querySelectorAll('img,video').forEach(n => n.remove())
    if (media.isVideo) {
      const v = document.createElement('video')
      v.src = media.url; v.controls = true; v.playsInline = true; v.muted = true
      box.insertBefore(v, box.firstChild)
    } else {
      const img = document.createElement('img')
      img.src = media.url; img.alt = ''
      box.insertBefore(img, box.firstChild)
    }
    wrap.classList.remove('hidden')
    dropzone.classList.add('hidden')
    $('#pickPhoto').disabled = true
    $('#pickVideo').disabled = true
    updateBtn()
  }

  async function setFile(file) {
    if (!file) return
    const ok = file.type.startsWith('image/') || file.type.startsWith('video/')
    if (!ok) { alert(tr('scan_error_type')); return }
    try {
      if (media) URL.revokeObjectURL(media.url)
      media = { file, url: null, isVideo: file.type.startsWith('video/') }
      const loaded = await loadImageFromFile(file)
      media.url = loaded.url
      media.el = loaded.el
      showPreview()
    } catch {
      alert(tr('scan_error_type'))
    }
  }

  $('#pickPhoto').onclick = () => fileInput.click()
  $('#pickVideo').onclick = () => videoInput.click()
  dropzone.onclick = () => fileInput.click()
  fileInput.onchange = e => setFile(e.target.files[0])
  videoInput.onchange = e => setFile(e.target.files[0])

  $('#removeMedia').onclick = () => {
    if (media) URL.revokeObjectURL(media.url)
    media = null
    fileInput.value = ''
    videoInput.value = ''
    $('#previewWrap').classList.add('hidden')
    dropzone.classList.remove('hidden')
    $('#pickPhoto').disabled = false
    $('#pickVideo').disabled = false
    updateBtn()
  }

  analyzeBtn.onclick = async () => {
    if (!media) { alert(tr('scan_error_type')); return }
    if (!selectedCrop) { alert(tr('scan_error_crop')); return }

    $('#pickSection').classList.add('hidden')
    $('#analyzeSection').classList.remove('hidden')

    // show the media being analyzed
    const pv = $('#analyzePreview')
    if (media.isVideo) {
      const v = document.createElement('video')
      v.src = media.url; v.muted = true; v.playsInline = true; v.autoplay = true; v.loop = true
      pv.appendChild(v)
      v.play().catch(() => {})
    } else {
      const img = document.createElement('img')
      img.src = media.url; img.alt = ''
      pv.appendChild(img)
    }

    try {
      const ratios = await analyzeImageElement(media.el, media.isVideo)
      const steps = tr('scan_steps_analyzing')
      const result = await runDiagnosis(ratios, selectedCrop, {
        steps,
        onStep: s => { $('#analyzeStep').textContent = s }
      })
      showResult(result)
    } catch {
      alert(tr('scan_error_type'))
      $('#analyzeSection').classList.add('hidden')
      $('#pickSection').classList.remove('hidden')
    }
  }

  function showResult(result) {
    $('#analyzeSection').classList.add('hidden')
    const rs = $('#resultSection')
    rs.classList.remove('hidden')

    const sev = s => `<span class="badge sev-${s}">${tr('sev_' + s)}</span>`

    if (result.healthy || !result.best) {
      rs.innerHTML = `
        <div class="result-header">
          <span class="emoji">✅</span>
          <h2 style="color:var(--green-700)">${tr('result_healthy')}</h2>
        </div>
        <div class="card"><p>${tr('result_healthy_desc')}</p></div>
        <button class="btn btn-primary" id="againBtn" style="margin-top:16px">📷 ${tr('result_scan_again')}</button>
        <p class="danger-note">${tr('result_disclaimer')}</p>`
      rs.querySelector('#againBtn').onclick = () => app.go('scan')
      app.addHistory({ diseaseId: null, confidence: null })
      window.scrollTo(0, 0)
      return
    }

    const d = result.best.disease
    const crop = CROPS[d.crop]
    const list = arr => `<ul>${arr.map(x => `<li>${x}</li>`).join('')}</ul>`

    app.addHistory({ diseaseId: d.id, confidence: result.best.confidence })

    rs.innerHTML = `
      <div class="result-header">
        <span class="emoji">${crop.emoji}</span>
        <h2 style="color:var(--green-900);font-size:19px">${d.name[lang]}</h2>
        <div class="progress-note" style="font-style:italic">${d.sci}</div>
        <div style="margin-top:8px">${sev(d.severity)}</div>
        <div class="confidence-bar"><div class="confidence-fill" style="width:0%"></div></div>
        <div class="progress-note" style="margin-top:4px">${tr('result_confidence')}: <b>${result.best.confidence}%</b></div>
      </div>

      <div class="card result-block">
        <h3>🔎 ${tr('result_symptoms')}</h3>
        ${list(d.symptoms[lang])}
      </div>

      <div class="card result-block treatment-card">
        <h3>💊 ${tr('result_treatment')}</h3>
        ${list(d.treatment[lang])}
      </div>

      <div class="card result-block">
        <h3>🌿 ${tr('result_organic')}</h3>
        ${list(d.organic[lang])}
      </div>

      <div class="card result-block warning-card">
        <h3>🛡️ ${tr('result_prevention')}</h3>
        ${list(d.prevention[lang])}
      </div>

      <div class="card result-block">
        <h3>🧬 ${tr('result_cause')}</h3>
        <p>${d.cause[lang]}</p>
      </div>

      ${result.alternates.length ? `
      <div class="section-title">${tr('result_other_possibilities')}</div>
      ${result.alternates.map(m => `
        <button class="list-row" data-disease="${m.disease.id}">
          <span class="emoji">${CROPS[m.disease.crop].emoji}</span>
          <span class="body">
            <span class="name">${m.disease.name[lang]}</span>
            <span class="meta">${m.confidence}%</span>
          </span>
          <span class="arrow">›</span>
        </button>`).join('')}` : ''}

      <div class="grid-2" style="margin-top:16px">
        <button class="btn btn-outline" id="againBtn">📷 ${tr('result_scan_again')}</button>
        <button class="btn btn-gold" id="detailsBtn">📖 ${tr('result_view_details')}</button>
      </div>
      <p class="danger-note">${tr('result_disclaimer')}</p>`

    requestAnimationFrame(() => {
      const fill = rs.querySelector('.confidence-fill')
      if (fill) fill.style.width = result.best.confidence + '%'
    })
    rs.querySelector('#againBtn').onclick = () => { media = null; app.go('scan') }
    rs.querySelector('#detailsBtn').onclick = () => app.go('disease', { id: d.id })
    rs.querySelectorAll('[data-disease]').forEach(b =>
      (b.onclick = () => app.go('disease', { id: b.dataset.disease })))
    window.scrollTo(0, 0)
  }
}
})()
