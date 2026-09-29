(function () {
let chatLog = []
let chatCtx = {}
let activeCase = null
let pendingScan = ''

// Downscale a picked photo to a JPEG data URL small enough to POST (<=8MB body).
function fileToDataUrl(file, maxSide = 1280) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      try {
        let { width: w, height: h } = img
        const scale = Math.min(1, maxSide / Math.max(w, h))
        w = Math.round(w * scale); h = Math.round(h * scale)
        const cv = document.createElement('canvas')
        cv.width = w; cv.height = h
        cv.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(cv.toDataURL('image/jpeg', 0.82))
      } catch (e) { reject(e) } finally { URL.revokeObjectURL(url) }
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad image')) }
    img.src = url
  })
}

AS.renderAssistant = function (container, app) {
  const tr = app.t()
  const lang = app.lang === 'en' ? 'en' : 'rw'
  const isRemote = !!(AS.PROVIDER && AS.PROVIDER.get && AS.PROVIDER.get().mode === 'remote')

  const rulesHtml = (AS.FARMER_RULES || [])
    .map((r, i) => `<li>${i + 1}. ${r[lang]}</li>`)
    .join('')

  container.innerHTML = `
    <div class="store-head">
      <div class="section-title" style="margin:0">${tr('assistant_title')} 🩺</div>
      <div style="display:flex;gap:6px">
        <button class="cart-btn" id="clearBtn" aria-label="${tr('assistant_clear')}" title="${tr('assistant_clear')}">🗑️</button>
        <button class="cart-btn" id="howBtn" aria-label="${tr('assistant_how')}"><img src="img/info.png" alt=""></button>
      </div>
    </div>
    <p class="progress-note" style="margin:2px 0 10px">${tr('assistant_sub')}</p>

    <div class="card" id="caseBanner" hidden style="padding:8px 10px;margin-bottom:8px;display:flex;align-items:center;gap:8px;justify-content:space-between">
      <span id="caseText" class="progress-note" style="margin:0"></span>
      <button class="chip" id="closeCaseBtn" style="margin:0">${tr('assistant_close_case')}</button>
    </div>

    <div class="card policy-card" id="howCard" hidden>
      <div class="label" style="font-weight:700;margin-bottom:6px">${tr('assistant_how')}</div>
      <ul class="policy-list">${rulesHtml}</ul>
    </div>

    <div class="chat-log" id="chatLog"></div>
    <div class="chip-row" id="suggChips"></div>
    <div class="chip-row" id="followChips" hidden></div>

    <div class="chat-input-row">
      ${isRemote ? `<button class="btn btn-outline chat-send" id="photoBtn" aria-label="${tr('assistant_photo')}" title="${tr('assistant_photo')}">📷</button>` : ''}
      <input class="store-search" id="chatInput" placeholder="${tr('assistant_placeholder')}" />
      <button class="btn btn-primary chat-send" id="chatSend">→</button>
    </div>
    ${isRemote ? `<input type="file" id="photoInput" accept="image/*" class="hidden" />` : ''}
  `

  const log = container.querySelector('#chatLog')
  const chips = container.querySelector('#suggChips')
  const followChips = container.querySelector('#followChips')
  const input = container.querySelector('#chatInput')
  const banner = container.querySelector('#caseBanner')
  const caseText = container.querySelector('#caseText')

  container.querySelector('#howBtn').onclick = () => {
    const card = container.querySelector('#howCard')
    card.hidden = !card.hidden
  }

  function drawLog() {
    log.innerHTML = ''
    chatLog.forEach(m => {
      const b = document.createElement('div')
      b.className = 'bubble ' + m.who
      b.textContent = m.text
      log.appendChild(b)
    })
    log.scrollTop = log.scrollHeight
    chips.style.display = chatLog.length ? 'none' : ''
    drawFollowUps()
  }

  function drawCase() {
    if (activeCase) {
      const bits = [activeCase.crop, activeCase.district, activeCase.status].filter(Boolean)
      caseText.textContent = `${tr('assistant_case')}: ` + bits.join(' · ')
      banner.hidden = false
      banner.style.display = 'flex'
    } else {
      banner.hidden = true
      banner.style.display = 'none'
    }
  }

  // Follow-up affordances appear only once a case is active (Doctor gave advice).
  function drawFollowUps() {
    followChips.innerHTML = ''
    if (!isRemote || !activeCase) { followChips.hidden = true; return }
    followChips.hidden = false
    const label = document.createElement('span')
    label.className = 'progress-note'
    label.textContent = tr('assistant_followup')
    followChips.appendChild(label)
    ;[['improving', tr('assistant_improving')], ['stable', tr('assistant_stable')], ['worsening', tr('assistant_worse')]]
      .forEach(([val, txt]) => {
        const c = document.createElement('button')
        c.className = 'chip'
        c.textContent = txt
        c.onclick = () => followUp(val, txt)
        followChips.appendChild(c)
      })
  }

  ;[tr('ai_sugg1'), tr('ai_sugg2'), tr('ai_sugg3')].forEach(s => {
    const c = document.createElement('button')
    c.className = 'chip'
    c.textContent = s
    c.onclick = () => send(s)
    chips.appendChild(c)
  })

  async function loadHistory() {
    const note = document.createElement('div')
    note.className = 'bubble ai'
    note.textContent = tr('assistant_loading')
    log.appendChild(note)
    const res = await AS.api.get('/ai/history')
    note.remove()
    if (res && res.messages && res.messages.length) {
      chatLog = res.messages.map(m => ({ who: m.role === 'user' ? 'user' : 'ai', text: m.content }))
    }
    drawLog()
  }

  async function loadCases() {
    if (!isRemote) return
    const res = await AS.api.get('/ai/cases')
    if (res && res.cases && res.cases.length) {
      activeCase = res.cases.find(c => c.status === 'open' || c.status === 'monitoring') || null
    }
    drawCase()
    drawFollowUps()
  }

  container.querySelector('#clearBtn').onclick = async () => {
    await AS.api.del('/ai/history')
    chatLog = []
    chatCtx = {}
    pendingScan = ''
    drawLog()
  }

  container.querySelector('#closeCaseBtn').onclick = async () => {
    if (!activeCase) return
    await AS.api.post('/ai/cases/' + activeCase.id + '/status', { status: 'resolved' })
    activeCase = null
    drawCase()
    drawFollowUps()
  }

  async function followUp(statusChange, label) {
    if (!activeCase) return
    const note = `${tr('assistant_followup')} ${label}`
    chatLog.push({ who: 'user', text: note })
    drawLog()
    const typing = document.createElement('div')
    typing.className = 'bubble ai'; typing.textContent = '…'
    log.appendChild(typing); log.scrollTop = log.scrollHeight
    const res = await AS.api.post('/ai/cases/' + activeCase.id + '/followup', { note, statusChange, lang: app.lang })
    typing.remove()
    chatLog.push({ who: 'ai', text: (res && res.text) || '' })
    drawLog()
  }

  // Photo → vision analysis → findings bubble, fed into the next chat turn.
  async function analyzePhoto(file) {
    if (!file) return
    let dataUrl
    try { dataUrl = await fileToDataUrl(file) } catch { alert(tr('assistant_vision_error')); return }
    const busy = document.createElement('div')
    busy.className = 'bubble ai'; busy.textContent = tr('assistant_analyzing')
    log.appendChild(busy); log.scrollTop = log.scrollHeight
    const res = await AS.api.post('/ai/analyze', {
      dataUrl, lang: app.lang, cropHint: (activeCase && activeCase.crop) || '', caseId: activeCase ? activeCase.id : null
    })
    busy.remove()
    if (res && res.findings) {
      pendingScan = res.findings
      chatLog.push({ who: 'ai', text: `📷 ${tr('assistant_photo_findings')}\n${res.findings}` })
    } else {
      chatLog.push({ who: 'ai', text: tr('assistant_vision_error') })
    }
    drawLog()
  }

  if (isRemote) {
    const photoInput = container.querySelector('#photoInput')
    container.querySelector('#photoBtn').onclick = () => photoInput.click()
    photoInput.onchange = e => { analyzePhoto(e.target.files[0]); photoInput.value = '' }
  }

  async function send(text) {
    if (!text.trim()) return
    chatLog.push({ who: 'user', text })
    drawLog()
    input.value = ''
    const typing = document.createElement('div')
    typing.className = 'bubble ai'; typing.textContent = '…'
    log.appendChild(typing); log.scrollTop = log.scrollHeight
    const ctx = Object.assign({}, chatCtx)
    if (activeCase) ctx.caseId = activeCase.id
    if (pendingScan) ctx.scan = pendingScan
    const res = await AS.api.post('/ai/chat', { message: text, lang: app.lang, ctx })
    typing.remove()
    chatCtx = res.ctx || chatCtx
    if (res && res.caseId && (!activeCase || activeCase.id !== res.caseId)) {
      activeCase = { id: res.caseId, crop: res.cropId || (activeCase && activeCase.crop) || '', status: 'monitoring', district: (activeCase && activeCase.district) || '' }
    }
    pendingScan = ''
    chatLog.push({ who: 'ai', text: res.text })
    drawLog()
    drawCase()
  }

  container.querySelector('#chatSend').onclick = () => send(input.value)
  input.onkeydown = e => { if (e.key === 'Enter') send(input.value) }
  loadHistory()
  loadCases()
}
})()
