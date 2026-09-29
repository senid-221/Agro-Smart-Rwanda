(function () {
let chatLog = []
let chatCtx = {}

AS.renderAssistant = function (container, app) {
  const tr = app.t()
  const lang = app.lang === 'en' ? 'en' : 'rw'

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
    <div class="card policy-card" id="howCard" hidden>
      <div class="label" style="font-weight:700;margin-bottom:6px">${tr('assistant_how')}</div>
      <ul class="policy-list">${rulesHtml}</ul>
    </div>
    <div class="chat-log" id="chatLog"></div>
    <div class="chip-row" id="suggChips"></div>
    <div class="chat-input-row">
      <input class="store-search" id="chatInput" placeholder="${tr('assistant_placeholder')}" />
      <button class="btn btn-primary chat-send" id="chatSend">→</button>
    </div>
  `

  const log = container.querySelector('#chatLog')
  const chips = container.querySelector('#suggChips')
  const input = container.querySelector('#chatInput')

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
  }

  ;[tr('ai_sugg1'), tr('ai_sugg2'), tr('ai_sugg3')].forEach(s => {
    const c = document.createElement('button')
    c.className = 'chip'
    c.textContent = s
    c.onclick = () => send(s)
    chips.appendChild(c)
  })

  // Restore the Doctor's memory of this farmer from the server on open.
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

  container.querySelector('#clearBtn').onclick = async () => {
    await AS.api.del('/ai/history')
    chatLog = []
    chatCtx = {}
    drawLog()
  }

  async function send(text) {
    if (!text.trim()) return
    chatLog.push({ who: 'user', text })
    drawLog()
    input.value = ''
    const typing = document.createElement('div')
    typing.className = 'bubble ai'
    typing.textContent = '…'
    log.appendChild(typing)
    log.scrollTop = log.scrollHeight
    const res = await AS.api.post('/ai/chat', { message: text, lang: app.lang, ctx: chatCtx })
    typing.remove()
    chatCtx = res.ctx || chatCtx
    chatLog.push({ who: 'ai', text: res.text })
    drawLog()
  }

  container.querySelector('#chatSend').onclick = () => send(input.value)
  input.onkeydown = e => { if (e.key === 'Enter') send(input.value) }
  loadHistory()
}
})()
