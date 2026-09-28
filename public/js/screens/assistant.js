(function () {
let chatLog = []

AS.renderAssistant = function (container, app) {
  const tr = app.t()

  container.innerHTML = `
    <div class="store-head">
      <div class="section-title" style="margin:0">${tr('assistant_title')} 🤖</div>
      <button class="cart-btn" id="howBtn" aria-label="${tr('assistant_how')}"><img src="img/info.png" alt=""></button>
    </div>
    <p class="progress-note" style="margin:2px 0 10px">${tr('assistant_sub')}</p>
    <div class="card policy-card" id="howCard" hidden>
      <div class="label" style="font-weight:700;margin-bottom:6px">${tr('assistant_how')}</div>
      <ul class="policy-list">
        <li>${tr('ai_how_1')}</li>
        <li>${tr('ai_how_2')}</li>
        <li>${tr('ai_how_3')}</li>
        <li>${tr('ai_how_4')}</li>
        <li>${tr('ai_how_5')}</li>
      </ul>
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
    const res = await AS.api.post('/ai/chat', { message: text, lang: app.lang })
    typing.remove()
    chatLog.push({ who: 'ai', text: res.text })
    drawLog()
  }

  container.querySelector('#chatSend').onclick = () => send(input.value)
  input.onkeydown = e => { if (e.key === 'Enter') send(input.value) }
  drawLog()
}
})()
