// AgroSmart Rwanda — user (farmer) dashboard.
// Shows the farmer's own activity: scans, orders, cart, quick actions.
(function () {
const { diseaseById, CROPS } = AS

AS.renderDashboard = function (container, app) {
  const tr = app.t()
  const lang = app.lang
  const name = (app.name || '').trim()
  const hello = name ? tr('home_greeting').replace('{name}', name) : tr('home_greeting_generic')

  container.innerHTML = `
    <div class="section-title">${tr('dash_title')}</div>
    <p class="progress-note" style="margin:6px 0 12px">${hello} 👋</p>

    <div class="stat-grid">
      <div class="stat-card"><span class="stat-n" id="stScans">0</span><span class="stat-l">${tr('dash_scans')}</span></div>
      <div class="stat-card"><span class="stat-n" id="stOrders">0</span><span class="stat-l">${tr('dash_orders')}</span></div>
      <div class="stat-card"><span class="stat-n" id="stCart">0</span><span class="stat-l">${tr('dash_cart')}</span></div>
    </div>

    <div class="section-title">${tr('dash_quick')}</div>
    <div class="grid-2">
      <button class="feature-card" data-go="scan">
        <img class="fico" src="img/camera.png" alt="">
        <span class="label">${tr('dash_scan')}</span>
        <span class="desc">${tr('dash_scan_d')}</span>
      </button>
      <button class="feature-card" data-go="assistant">
        <img class="fico" src="img/chat.png" alt="">
        <span class="label">${tr('dash_ai')}</span>
        <span class="desc">${tr('dash_ai_d')}</span>
      </button>
      <button class="feature-card" data-go="store">
        <img class="fico" src="img/cart.png" alt="">
        <span class="label">${tr('dash_store')}</span>
        <span class="desc">${tr('dash_store_d')}</span>
      </button>
      <button class="feature-card" data-go="learn">
        <img class="fico" src="img/book.png" alt="">
        <span class="label">${tr('dash_learn')}</span>
        <span class="desc">${tr('dash_learn_d')}</span>
      </button>
    </div>

    <div class="section-title">${tr('dash_recent')}</div>
    <div id="recentList"></div>

    <div class="section-title">${tr('dash_myorders')}</div>
    <div id="orderList"></div>
  `

  container.querySelectorAll('[data-go]').forEach(b => (b.onclick = () => app.go(b.dataset.go)))

  // stats + recent activity
  const hist = app.history || []
  container.querySelector('#stScans').textContent = String(hist.length)

  const recent = container.querySelector('#recentList')
  if (!hist.length) {
    recent.innerHTML = `<div class="empty-state"><span class="emoji">🌾</span>${tr('dash_no_scans')}</div>`
  } else {
    hist.slice(0, 5).forEach(item => {
      const row = document.createElement('button')
      row.className = 'list-row history-item'
      const d = diseaseById(item.diseaseId)
      const date = new Date(item.at).toLocaleDateString(lang === 'rw' ? 'rw-RW' : 'en-GB', { day: 'numeric', month: 'short' })
      if (d) {
        row.innerHTML = `
          <img class="thumb" src="${CROPS[d.crop].img}" alt="">
          <span class="body"><span class="name">${d.name[lang]}</span><span class="meta">${item.confidence}% · ${date}</span></span>
          <span class="arrow">›</span>`
        row.onclick = () => app.go('disease', { id: d.id })
      } else {
        row.innerHTML = `
          <span class="emoji">✅</span>
          <span class="body"><span class="name">${tr('result_healthy')}</span><span class="meta">${date}</span></span>`
      }
      recent.appendChild(row)
    })
  }

  // cart + orders (async)
  const ordersEl = container.querySelector('#orderList')
  Promise.all([AS.api.get('/cart'), AS.api.get('/orders')]).then(([cart, orders]) => {
    container.querySelector('#stCart').textContent = String((cart || []).length)
    const list = (orders || []).slice()
    container.querySelector('#stOrders').textContent = String(list.length)
    if (!list.length) {
      ordersEl.innerHTML = `<div class="empty-state"><span class="emoji">🧺</span>${tr('orders_empty')}</div>`
      return
    }
    list.slice(0, 5).forEach(o => {
      const row = document.createElement('button')
      row.className = 'list-row'
      const date = new Date(o.at).toLocaleDateString(lang === 'rw' ? 'rw-RW' : 'en-GB', { day: 'numeric', month: 'short' })
      const n = (o.items || []).length
      row.innerHTML = `
        <span class="emoji">📦</span>
        <span class="body"><span class="name">${n} ${tr('orders_items')}</span><span class="meta">${AS.fmtRWF(o.total || 0)} · ${date}</span></span>
        <span class="arrow">›</span>`
      row.onclick = () => app.go('orders')
      ordersEl.appendChild(row)
    })
  })
}
})()
