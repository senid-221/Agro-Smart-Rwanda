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

// Strip markdown emphasis/heading/code symbols so AI replies render as clean
// plain text even if the model slips and emits ** / # / backticks.
function plainText(t) {
  return String(t == null ? '' : t)
    .replace(/\*\*/g, '')
    .replace(/__+/g, '')
    .replace(/`+/g, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\s*\*\s+/gm, '')
}

const fmtTime = at => {
  const d = at ? new Date(at) : new Date()
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
const dayKey = at => (at ? new Date(at) : new Date()).toDateString()

// WhatsApp-style bubble. Outgoing (farmer) sits right with read-receipt ticks;
// incoming (Doctor) sits left. `read` flips the ticks blue once the Doctor answers.
function waRow(m, tr) {
  const row = document.createElement('div')
  row.className = 'wa-msg ' + (m.who === 'user' ? 'out' : 'in')
  const bubble = document.createElement('div')
  bubble.className = 'wa-bubble'
  const text = document.createElement('div')
  text.className = 'wa-text'
  text.textContent = m.who === 'ai' ? plainText(m.text) : m.text
  bubble.appendChild(text)
  const meta = document.createElement('span')
  meta.className = 'wa-meta'
  meta.textContent = fmtTime(m.at)
  if (m.who === 'user') {
    const ticks = document.createElement('span')
    ticks.className = 'wa-ticks' + (m.read ? ' read' : '')
    ticks.textContent = '✓✓'
    meta.appendChild(ticks)
  }
  bubble.appendChild(meta)
  row.appendChild(bubble)
  return row
}

function waDay(label) {
  const d = document.createElement('div')
  d.className = 'wa-day'
  d.textContent = label
  return d
}

// Incoming bubble with the animated "typing" indicator: a Lottie dot-wave once
// the player has loaded, plain CSS dots until then (or if it never does).
function typingRow() {
  const row = document.createElement('div')
  row.className = 'wa-msg in'
  const bubble = document.createElement('div')
  bubble.className = 'wa-bubble'
  bubble.innerHTML = '<span class="typing"><span></span><span></span><span></span></span>'
  row.appendChild(bubble)
  row._stopLottie = AS.lottie(bubble.querySelector('.typing'), 'lottie/thinking-dots.json')
  return row
}

function killTyping(el) {
  if (!el) return
  if (el._stopLottie) el._stopLottie()
  el.remove()
}

AS.renderAssistant = function (container, app) {
  const tr = app.t()
  const lang = app.lang === 'en' ? 'en' : 'rw'
  const isRemote = !!(AS.PROVIDER && AS.PROVIDER.get && AS.PROVIDER.get().mode === 'remote')

  const rulesHtml = (AS.FARMER_RULES || [])
    .map((r, i) => `<li>${i + 1}. ${r[lang]}</li>`)
    .join('')

  container.innerHTML = `
    <div class="wa-screen">
      <div class="wa-header">
        <div class="wa-avatar">🩺</div>
        <div class="wa-head-info">
          <div class="wa-name">${tr('assistant_title')}</div>
          <div class="wa-status" id="waStatus">${tr('wa_online')}</div>
        </div>
        <div class="wa-head-actions">
          <button class="wa-head-btn" id="clearBtn" aria-label="${tr('assistant_clear')}" title="${tr('assistant_clear')}">🗑️</button>
          <button class="wa-head-btn" id="howBtn" aria-label="${tr('assistant_how')}"><img src="img/info.png" alt=""></button>
        </div>
      </div>

      <div class="card policy-card wa-drop" id="howCard" hidden>
        <div class="label" style="font-weight:700;margin-bottom:6px">${tr('assistant_how')}</div>
        <ul class="policy-list">${rulesHtml}</ul>
      </div>
      <div class="card wa-drop" id="caseBanner" hidden style="padding:8px 10px;display:flex;align-items:center;gap:8px;justify-content:space-between">
        <span id="caseText" class="progress-note" style="margin:0"></span>
        <span style="display:flex;gap:6px">
          <button class="chip" id="viewCaseBtn" style="margin:0">${tr('assistant_view_case')}</button>
          <button class="chip" id="closeCaseBtn" style="margin:0">${tr('assistant_close_case')}</button>
        </span>
      </div>

      <div class="wa-wall">
        <div class="chat-log" id="chatLog"></div>
        <div class="chip-row chat-sugg" id="suggChips"></div>
        <div class="chip-row wa-follow" id="followChips" hidden></div>
      </div>

      <div class="wa-composer">
        <textarea class="wa-input" id="chatInput" rows="1" placeholder="${tr('assistant_placeholder')}"></textarea>
        ${isRemote ? `<button class="wa-round" id="photoBtn" aria-label="${tr('assistant_photo')}" title="${tr('assistant_photo')}">📷</button>` : ''}
        <button class="wa-send" id="chatSend" aria-label="${tr('assistant_send')}">🎤</button>
      </div>
      <div class="wa-powered">Powered by IRAGUHA Vincent</div>
      ${isRemote ? `<input type="file" id="photoInput" accept="image/*" class="hidden" />` : ''}
    </div>
  `

  const log = container.querySelector('#chatLog')
  const chips = container.querySelector('#suggChips')
  const followChips = container.querySelector('#followChips')
  const input = container.querySelector('#chatInput')
  const banner = container.querySelector('#caseBanner')
  const caseText = container.querySelector('#caseText')
  const status = container.querySelector('#waStatus')
  const sendBtn = container.querySelector('#chatSend')

  // Voice conversation state: mic → speech-to-text → auto-send → spoken reply.
  let recognition = null
  let recognizing = false
  let speaking = false
  let typing = false
  let voiceMode = false

  const setStatus = () => {
    status.textContent = recognizing ? tr('wa_listening')
      : typing ? tr('wa_typing')
      : speaking ? tr('wa_speaking')
      : tr('wa_online')
  }
  const setTyping = on => { typing = on; setStatus() }
  const syncSendIcon = () => {
    if (recognizing) { sendBtn.textContent = '⏹'; sendBtn.classList.add('listening'); return }
    sendBtn.classList.remove('listening')
    sendBtn.textContent = input.value.trim() ? '➤' : '🎤'
  }
  // Grow the composer box as the farmer types multi-line messages, up to a cap.
  const autoGrow = () => {
    input.style.height = 'auto'
    input.style.height = Math.min(input.scrollHeight, 132) + 'px'
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(plainText(text))
    u.lang = lang === 'en' ? 'en-US' : 'rw-RW'
    const v = (window.speechSynthesis.getVoices() || [])
      .find(x => x.lang && x.lang.toLowerCase().startsWith(lang === 'en' ? 'en' : 'rw'))
    if (v) u.voice = v
    u.onstart = () => { speaking = true; setStatus() }
    u.onend = () => { speaking = false; setStatus() }
    u.onerror = () => { speaking = false; setStatus() }
    window.speechSynthesis.speak(u)
  }

  // Press-and-talk: capture the farmer's speech, fill the box, then send it and
  // speak the Doctor's answer so the whole exchange is talking-to-talking.
  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert(tr('voice_unsupported')); return }
    stopSpeaking()
    recognition = new SR()
    recognition.lang = lang === 'en' ? 'en-US' : 'rw-RW'
    recognition.interimResults = true
    recognition.continuous = false
    recognition.onresult = e => {
      let txt = ''
      for (let i = e.resultIndex; i < e.results.length; i++) txt += e.results[i][0].transcript
      input.value = txt
      syncSendIcon()
      autoGrow()
    }
    recognition.onend = () => {
      recognizing = false
      const t = input.value.trim()
      input.value = ''
      syncSendIcon(); autoGrow(); setStatus()
      if (t) send(t, true)
    }
    recognition.onerror = () => {
      recognizing = false
      syncSendIcon(); setStatus()
    }
    recognizing = true
    voiceMode = true
    syncSendIcon(); setStatus()
    try { recognition.start() } catch { recognizing = false; syncSendIcon(); setStatus() }
  }

  function stopListening() { if (recognition) { try { recognition.stop() } catch {} } }
  function stopSpeaking() { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); speaking = false; setStatus() }

  container.querySelector('#howBtn').onclick = () => {
    const card = container.querySelector('#howCard')
    card.hidden = !card.hidden
  }

  function drawLog() {
    AS.lottieStopAll()
    log.innerHTML = ''
    let lastDay = ''
    chatLog.forEach(m => {
      const dk = dayKey(m.at)
      if (dk !== lastDay) {
        lastDay = dk
        const d = new Date(m.at || Date.now())
        const today = new Date().toDateString()
        const yest = new Date(Date.now() - 864e5).toDateString()
        const label = dk === today ? tr('wa_today') : dk === yest ? tr('wa_yesterday')
          : d.toLocaleDateString(lang === 'rw' ? 'rw-RW' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        log.appendChild(waDay(label))
      }
      log.appendChild(waRow(m, tr))
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

  async function loadHistory() {
    const note = typingRow()
    log.appendChild(note)
    const res = await AS.api.get('/ai/history')
    killTyping(note)
    if (res && res.messages && res.messages.length) {
      chatLog = res.messages.map(m => ({ who: m.role === 'user' ? 'user' : 'ai', text: m.content, at: m.at, read: true }))
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
    stopListening(); stopSpeaking()
    await AS.api.del('/ai/history')
    chatLog = []
    chatCtx = {}
    pendingScan = ''
    drawLog()
  }

  container.querySelector('#viewCaseBtn').onclick = () => {
    if (activeCase) app.go('case', { id: activeCase.id })
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
    chatLog.push({ who: 'user', text: note, at: Date.now(), read: false })
    drawLog()
    setTyping(true)
    const typing = typingRow()
    log.appendChild(typing); log.scrollTop = log.scrollHeight
    const res = await AS.api.post('/ai/cases/' + activeCase.id + '/followup', { note, statusChange, lang: app.lang })
    killTyping(typing); setTyping(false)
    markRead()
    chatLog.push({ who: 'ai', text: (res && res.text) || '', at: Date.now() })
    drawLog()
  }

  // Once the Doctor answers, earlier farmer messages count as read (blue ticks).
  function markRead() { chatLog.forEach(m => { if (m.who === 'user') m.read = true }) }

  // Photo → vision analysis → findings bubble, fed into the next chat turn.
  async function analyzePhoto(file) {
    if (!file) return
    let dataUrl
    try { dataUrl = await fileToDataUrl(file) } catch { alert(tr('assistant_vision_error')); return }
    setTyping(true)
    const busy = typingRow()
    log.appendChild(busy); log.scrollTop = log.scrollHeight
    const res = await AS.api.post('/ai/analyze', {
      dataUrl, lang: app.lang, cropHint: (activeCase && activeCase.crop) || '', caseId: activeCase ? activeCase.id : null
    })
    killTyping(busy); setTyping(false)
    if (res && res.findings) {
      pendingScan = res.findings
      chatLog.push({ who: 'ai', text: `📷 ${tr('assistant_photo_findings')}\n${res.findings}`, at: Date.now() })
    } else {
      chatLog.push({ who: 'ai', text: tr('assistant_vision_error'), at: Date.now() })
    }
    drawLog()
  }

  if (isRemote) {
    const photoInput = container.querySelector('#photoInput')
    container.querySelector('#photoBtn').onclick = () => photoInput.click()
    photoInput.onchange = e => { analyzePhoto(e.target.files[0]); photoInput.value = '' }
  }

  async function send(text, viaVoice) {
    if (!text.trim()) return
    voiceMode = !!viaVoice
    if (!voiceMode) stopSpeaking()
    chatLog.push({ who: 'user', text, at: Date.now(), read: false })
    drawLog()
    input.value = ''
    syncSendIcon()
    autoGrow()
    setTyping(true)
    const typingRowEl = typingRow()
    log.appendChild(typingRowEl); log.scrollTop = log.scrollHeight
    const ctx = Object.assign({}, chatCtx)
    if (activeCase) ctx.caseId = activeCase.id
    if (pendingScan) ctx.scan = pendingScan
    const res = await AS.api.post('/ai/chat', { message: text, lang: app.lang, ctx })
    killTyping(typingRowEl); setTyping(false)
    chatCtx = res.ctx || chatCtx
    if (res && res.caseId && (!activeCase || activeCase.id !== res.caseId)) {
      activeCase = { id: res.caseId, crop: res.cropId || (activeCase && activeCase.crop) || '', status: 'monitoring', district: (activeCase && activeCase.district) || '' }
    }
    pendingScan = ''
    markRead()
    chatLog.push({ who: 'ai', text: res.text, at: Date.now() })
    drawLog()
    drawCase()
    if (voiceMode && res && res.text) speak(res.text)
  }

  sendBtn.onclick = () => {
    if (recognizing) { stopListening(); return }
    if (input.value.trim()) send(input.value, false)
    else startListening()
  }
  input.oninput = () => { syncSendIcon(); autoGrow() }
  syncSendIcon()
  loadHistory()
  loadCases()
}
})()
