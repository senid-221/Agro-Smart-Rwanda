// AgroSmart Rwanda — Agronomist War Room.
//
// Two screens for staff agronomists (role 'agronomist', promoted by an admin):
//   • AS.renderAgronomist — a personal dashboard: what farmers are asking the AI
//     (real aggregates), the agronomist's meetings and open action items.
//   • AS.renderMeeting    — the LIVE shared room over one real Crop Health Case:
//     a polling message thread, presence dots, a composer and an on-demand
//     "Ask AI" button that drops one grounded contribution into the thread.
//
// Nothing is fabricated: trends come from the server's deterministic aggregates,
// the AI never invents a product/dose/source, and an empty state says so plainly.
// "Live" is polling (Neon serverless is connection-poor; no socket layer exists):
// every few seconds we fetch ?since=<lastId> and beat a presence heartbeat. The
// interval self-clears the moment the screen is navigated away from.
(function () {
  const esc = AS.esc

  // Strip any stray markdown the model emits so room text renders as plain text.
  function plain(t) {
    return String(t == null ? '' : t)
      .replace(/\*\*/g, '').replace(/__+/g, '').replace(/`+/g, '')
      .replace(/^#{1,6}\s*/gm, '').replace(/^\s*\*\s+/gm, '')
  }
  const fmtTime = at => new Date(at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  // ================= Dashboard =================
  AS.renderAgronomist = function (container, app) {
    const tr = app.t()
    const lang = app.lang === 'en' ? 'en' : 'rw'
    const ago = ts => AS.ago(lang, ts)

    const role = app.user && app.user.role
    if (role !== 'agronomist' && role !== 'admin') {
      container.innerHTML = `<div class="empty-state"><span class="emoji">🔒</span>${esc(tr('agro_denied'))}</div>`
      return
    }

    container.innerHTML = `
      <div class="agro-new">
        <button class="btn btn-primary" id="agroNew">${AS.icon('plus', 17)} ${esc(tr('agro_new_room'))}</button>
      </div>
      <div id="agroBody"><div class="empty-state" style="padding:40px"><span class="emoji">⏳</span></div></div>`

    const bodyEl = container.querySelector('#agroBody')

    container.querySelector('#agroNew').onclick = () => openCasePicker()

    // Modal: pick a real open/monitoring case to convene a War Room over.
    async function openCasePicker() {
      const host = document.createElement('div')
      host.className = 'cm-overlay'
      host.innerHTML = `<div class="cm-sheet cm-sheet-wide"><div class="empty-state" style="padding:40px"><span class="emoji">⏳</span></div></div>`
      document.body.appendChild(host)
      const close = () => host.remove()
      host.onclick = e => { if (e.target === host) close() }

      const r = await AS.api.get('/meetings/cases')
      if (!host.isConnected) return
      const sheet = host.querySelector('.cm-sheet')
      const cases = (r && r.cases) || []
      sheet.innerHTML = `
        <div class="cm-sheet-head">
          <span>${esc(tr('agro_pick_case'))}</span>
          <button class="icon-btn" id="cpClose">${AS.icon('x', 20)}</button>
        </div>
        ${cases.length ? `<div class="cp-list">${cases.map(c => `
          <button class="list-row cp-row" data-id="${c.id}">
            <div class="body">
              <div class="name">${esc(c.cropLabel || c.crop || ('Case #' + c.id))}
                ${c.emergency ? `<span class="badge sev-high">${esc(tr('agro_emergency'))}</span>` : ''}
              </div>
              <div class="meta">${esc((c.symptoms || '').slice(0, 90) || (c.suspected || ''))}</div>
              <div class="meta">${esc([c.district, ago(c.updatedAt)].filter(Boolean).join(' · '))}</div>
            </div>
            <span class="arrow">›</span>
          </button>`).join('')}</div>`
          : `<div class="empty-state"><span class="emoji">🌾</span>${esc(tr('agro_no_cases'))}</div>`}`
      sheet.querySelector('#cpClose').onclick = close
      sheet.querySelectorAll('[data-id]').forEach(b => {
        b.onclick = async () => {
          b.classList.add('busy')
          const res = await AS.api.post('/meetings', { caseId: Number(b.dataset.id) })
          close()
          if (res && !res.error && res.meeting) app.go('meeting', { id: res.meeting.id })
        }
      })
    }

    async function load() {
      const r = await AS.api.get('/meetings/dashboard')
      if (!container.isConnected) return
      if (!r || r.error) {
        bodyEl.innerHTML = `<div class="card empty-state"><span class="emoji">⚠️</span>${esc(r && r.message ? r.message : tr('agro_fail'))}</div>`
        return
      }
      draw(r)
    }

    function draw(d) {
      const t = d.trends || {}
      const meetings = d.meetings || []
      const actions = d.actionItems || []

      const stat = (n, label) => `<div class="stat-card"><span class="stat-n">${esc(String(n == null ? 0 : n))}</span><span class="stat-l">${esc(label)}</span></div>`
      const chipCount = (label, n) => `<span class="chip" style="margin:0">${esc(label)} <b>${n}</b></span>`

      bodyEl.innerHTML = `
        <div class="section-title">${esc(tr('agro_trends_title'))}</div>
        <div class="stat-grid">
          ${stat(t.totalQuestions, tr('agro_total_q'))}
          ${stat(t.questions30d, tr('agro_q30'))}
          ${stat(t.openCases, tr('agro_open_cases'))}
        </div>
        ${(t.topCrops && t.topCrops.length) ? `
          <div class="card agro-panel">
            <div class="agro-sub">${esc(tr('agro_top_crops'))}</div>
            <div class="chip-row">${t.topCrops.map(c => chipCount(c.label || c.crop, c.count)).join('')}</div>
          </div>` : ''}
        ${(t.topSymptoms && t.topSymptoms.length) ? `
          <div class="card agro-panel">
            <div class="agro-sub">${esc(tr('agro_top_symptoms'))}</div>
            <div class="chip-row">${t.topSymptoms.map(s => chipCount(s.word, s.count)).join('')}</div>
          </div>` : ''}
        ${(t.emergencies && t.emergencies.length) ? `
          <div class="card agro-panel">
            <div class="agro-sub">${esc(tr('agro_emergencies'))}</div>
            ${t.emergencies.map(e => `<div class="agro-emg"><span class="badge sev-high">!</span> ${esc(e.crop || '')} — ${esc(e.reason || '')}</div>`).join('')}
          </div>` : ''}

        <div class="sec-head"><div class="section-title">${esc(tr('agro_my_meetings'))}</div></div>
        ${meetings.length ? meetings.map(m => `
          <div class="list-row mtg-row" data-id="${m.id}">
            <div class="body">
              <div class="name">${esc(m.title)}
                ${m.status === 'open'
                  ? `<span class="live-badge"><span class="lb-dot"></span>${esc(tr('agro_live'))}</span>`
                  : `<span class="badge">${esc(tr('agro_closed'))}</span>`}
              </div>
              <div class="meta">${esc(m.cropLabel || '')} · ${m.online} ${esc(tr('mtg_online_now'))} · ${m.messageCount} ${esc(tr('mtg_msgs'))}</div>
            </div>
            <span class="arrow">›</span>
          </div>`).join('')
          : `<div class="card empty-state"><span class="emoji">📋</span>${esc(tr('agro_no_meetings'))}</div>`}

        ${actions.length ? `
          <div class="sec-head"><div class="section-title">${esc(tr('agro_action_items'))}</div></div>
          ${actions.map(a => `
            <div class="list-row">
              <div class="body">
                <div class="name">${esc(a.title)}</div>
                <div class="meta">${esc((a.detail || '').slice(0, 120))}</div>
                <div class="meta">${esc([a.meeting, a.date].filter(Boolean).join(' · '))}</div>
              </div>
            </div>`).join('')}` : ''}`

      bodyEl.querySelectorAll('[data-id].mtg-row').forEach(b => {
        b.onclick = () => app.go('meeting', { id: Number(b.dataset.id) })
      })
    }

    load()
  }

  // ================= Live meeting room =================
  AS.renderMeeting = function (container, app, id) {
    const tr = app.t()
    const lang = app.lang === 'en' ? 'en' : 'rw'

    const role = app.user && app.user.role
    if (role !== 'agronomist' && role !== 'admin') {
      container.innerHTML = `<div class="empty-state"><span class="emoji">🔒</span>${esc(tr('agro_denied'))}</div>`
      return
    }

    let meeting = null
    let lastId = 0
    let closed = false
    let timer = null
    let asking = false

    container.innerHTML = `
      <div class="wa-screen">
        <div class="wa-header">
          <button class="wa-head-btn" id="mtgBack" aria-label="${esc(tr('back'))}">←</button>
          <div class="wa-head-info">
            <div class="wa-name" id="mtgName">${esc(tr('mtg_title'))}</div>
            <div class="wa-status" id="mtgStatus">…</div>
          </div>
          <div class="wa-head-actions">
            <button class="wa-head-btn" id="mtgCloseRoom" title="${esc(tr('mtg_close'))}">⏻</button>
          </div>
        </div>
        <div class="card mtg-case" id="mtgCase" hidden></div>
        <div class="mtg-presence" id="mtgPresence"></div>
        <div class="wa-wall">
          <div class="chat-log" id="mtgLog"></div>
        </div>
        <div class="wa-composer mtg-composer">
          <button class="wa-round mtg-ai" id="mtgAsk" title="${esc(tr('mtg_ask_ai'))}">🤖</button>
          <textarea class="wa-input" id="mtgInput" rows="1" placeholder="${esc(tr('mtg_placeholder'))}"></textarea>
          <button class="wa-send" id="mtgSend" aria-label="${esc(tr('mtg_send'))}">➤</button>
        </div>
      </div>`

    const log = container.querySelector('#mtgLog')
    const input = container.querySelector('#mtgInput')
    const sendBtn = container.querySelector('#mtgSend')
    const askBtn = container.querySelector('#mtgAsk')
    const statusEl = container.querySelector('#mtgStatus')
    const nameEl = container.querySelector('#mtgName')
    const caseEl = container.querySelector('#mtgCase')
    const presenceEl = container.querySelector('#mtgPresence')

    container.querySelector('#mtgBack').onclick = () => app.go('agronomist')

    const autoGrow = () => { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 132) + 'px' }
    input.addEventListener('input', autoGrow)
    input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend() } })

    function scrollBottom() { log.scrollTop = log.scrollHeight }

    function row(m) {
      if (m.kind === 'system') {
        const d = document.createElement('div')
        d.className = 'mtg-system'
        d.textContent = m.body
        return d
      }
      const wrap = document.createElement('div')
      wrap.className = 'wa-msg ' + (m.kind === 'ai' ? 'in mtg-ai-row' : (m.mine ? 'out' : 'in'))
      const bubble = document.createElement('div')
      bubble.className = 'wa-bubble'
      if (m.kind !== 'ai' && !m.mine) {
        const who = document.createElement('div')
        who.className = 'mtg-author'
        who.textContent = m.author || tr('role_agronomist')
        bubble.appendChild(who)
      }
      if (m.kind === 'ai') {
        const who = document.createElement('div')
        who.className = 'mtg-author mtg-ai-author'
        who.textContent = '🤖 ' + tr('mtg_ai_name')
        bubble.appendChild(who)
      }
      const text = document.createElement('div')
      text.className = 'wa-text'
      text.textContent = m.kind === 'ai' ? plain(m.body) : m.body
      bubble.appendChild(text)
      if (m.kind === 'ai' && Array.isArray(m.sources) && m.sources.length) {
        const src = document.createElement('div')
        src.className = 'mtg-sources'
        src.textContent = tr('mtg_sources') + ': ' + m.sources.map(s => s.title || s.url).filter(Boolean).slice(0, 4).join(' · ')
        bubble.appendChild(src)
      }
      const meta = document.createElement('span')
      meta.className = 'wa-meta'
      meta.textContent = fmtTime(m.at)
      bubble.appendChild(meta)
      wrap.appendChild(bubble)
      return wrap
    }

    function typingRow() {
      const wrap = document.createElement('div')
      wrap.className = 'wa-msg in mtg-ai-row'
      const bubble = document.createElement('div')
      bubble.className = 'wa-bubble'
      bubble.innerHTML = '<span class="typing"><span></span><span></span><span></span></span>'
      wrap.appendChild(bubble)
      return wrap
    }

    function drawCase() {
      if (!meeting || !meeting.case) { caseEl.hidden = true; return }
      const c = meeting.case
      caseEl.hidden = false
      caseEl.innerHTML = `
        <div class="mtg-case-top">
          <b>${esc(c.crop || '')}</b>
          ${c.emergency ? `<span class="badge sev-high">${esc(tr('agro_emergency'))}</span>` : ''}
          <span class="badge ${c.status === 'resolved' ? 'sev-low' : 'gold'}">${esc(c.status || '')}</span>
        </div>
        ${c.symptoms ? `<div class="mtg-case-line">${esc(c.symptoms.slice(0, 160))}</div>` : ''}
        ${c.suspected ? `<div class="mtg-case-line"><span>${esc(tr('mtg_suspected'))}:</span> ${esc(c.suspected)}</div>` : ''}
        ${c.location ? `<div class="mtg-case-line">${AS.icon('pin', 13)} ${esc(c.location)}</div>` : ''}`
    }

    function drawPresence(parts) {
      if (!parts || !parts.length) { presenceEl.innerHTML = ''; return }
      presenceEl.innerHTML = parts.map(p => `
        <span class="mtg-who ${p.online ? 'on' : ''}">
          <span class="mtg-dot"></span>${esc(p.name || tr('role_agronomist'))}
        </span>`).join('')
    }

    function setChrome() {
      if (!meeting) return
      nameEl.textContent = meeting.title || tr('mtg_title')
      statusEl.innerHTML = closed
        ? esc(tr('mtg_closed'))
        : `<span class="live-badge"><span class="lb-dot"></span>${esc(tr('agro_live'))}</span>`
      input.disabled = closed
      sendBtn.disabled = closed
      askBtn.disabled = closed
      const closeBtn = container.querySelector('#mtgCloseRoom')
      closeBtn.textContent = closed ? '↺' : '⏻'
      closeBtn.title = closed ? tr('mtg_reopen') : tr('mtg_close')
    }

    container.querySelector('#mtgCloseRoom').onclick = async () => {
      const next = closed ? 'open' : 'closed'
      const r = await AS.api.post('/meetings/' + id + '/status', { status: next })
      if (r && r.ok) { closed = next === 'closed'; setChrome() }
    }

    async function doSend() {
      const body = input.value.trim()
      if (!body || closed) return
      input.value = ''; autoGrow()
      // Optimistic echo; the poll reconciles it with the server row.
      const pending = row({ kind: 'message', mine: true, body, at: Date.now() })
      pending.classList.add('pending')
      log.appendChild(pending); scrollBottom()
      const r = await AS.api.post('/meetings/' + id + '/messages', { body })
      if (r && !r.error && r.message && r.message.id) { pending.remove(); appendMessages([r.message]) }
      else { pending.classList.remove('pending'); }
    }
    sendBtn.onclick = doSend

    async function askAI() {
      if (closed || asking) return
      const question = input.value.trim()
      asking = true
      askBtn.disabled = true
      askBtn.classList.add('busy')
      const t = typingRow()
      log.appendChild(t); scrollBottom()
      const r = await AS.api.post('/meetings/' + id + '/ask-ai', { question, lang })
      t.remove()
      asking = false
      askBtn.classList.remove('busy')
      askBtn.disabled = closed
      if (r && !r.error && r.message && r.message.id) {
        input.value = ''; autoGrow()
        appendMessages([r.message])
      } else {
        const err = document.createElement('div')
        err.className = 'mtg-system mtg-error'
        err.textContent = (r && r.message) || tr('mtg_ai_error')
        log.appendChild(err); scrollBottom()
      }
    }
    askBtn.onclick = askAI

    function appendMessages(msgs) {
      if (!msgs || !msgs.length) return
      let added = false
      msgs.forEach(m => {
        if (m.id <= lastId) return
        lastId = m.id
        log.appendChild(row(m))
        added = true
      })
      if (added) scrollBottom()
    }

    async function open() {
      const r = await AS.api.get('/meetings/' + id)
      if (!container.isConnected) return
      if (!r || !r.meeting) {
        container.innerHTML = `<div class="empty-state"><span class="emoji">⚠️</span>${esc(tr('agro_fail'))}</div>`
        return
      }
      meeting = r.meeting
      closed = meeting.status === 'closed'
      drawCase(); setChrome(); drawPresence(meeting.participants)
      log.innerHTML = ''
      lastId = 0
      appendMessages(r.messages || [])
      startPolling()
    }

    function startPolling() {
      stopPolling()
      timer = setInterval(async () => {
        if (!container.isConnected) return stopPolling()
        try {
          const r = await AS.api.get('/meetings/' + id + '/messages?since=' + lastId)
          if (!container.isConnected) return stopPolling()
          if (!r) return
          if (r.status && (r.status === 'closed') !== closed) { closed = r.status === 'closed'; setChrome() }
          appendMessages(r.messages)
          if (r.participants) drawPresence(r.participants)
        } catch (e) { /* transient poll error — next tick retries */ }
      }, 4000)
    }
    function stopPolling() { if (timer) { clearInterval(timer); timer = null } }

    open()
  }
})()
