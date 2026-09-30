(function () {
const catEmoji = id => ((AS.CATALOG ? AS.CATALOG.categories() : AS.PRODUCT_CATEGORIES).find(c => c.id === id) || {}).emoji || '🧺'

// WhatsApp number that receives "Order Now" requests (international format, no +).
const WHATSAPP_ORDER = '250726969060'

function waOrderLink(p, lang) {
  const msg = lang === 'en'
    ? `Hello AgroSmart! I would like to order:\nProduct: ${p.en}\nPrice: RWF ${p.price} per ${p.unit.en}\nPlease confirm availability and delivery.`
    : `Muraho AgroSmart! Ndashaka gutumiza:\nIgicuruzwa: ${p.rw}\nIgiciro: RWF ${p.price} kuri ${p.unit.rw}\nMunyemerere mbone iboneka n'uburyo bwo kugezaho.`
  return `https://wa.me/${WHATSAPP_ORDER}?text=${encodeURIComponent(msg)}`
}

// Product photo: an admin-uploaded image (p.img, path or dataURL) wins, then the
// generated photo at img/products/<id>.png; the emoji stays as an automatic
// fallback for items whose photo has not been generated yet.
function prodThumb(p, small) {
  const emoji = p.emoji || catEmoji(p.cat)
  const src = p.img || ('img/products/' + p.id + '.png')
  return `<span class="prod-thumb${small ? ' small' : ''}">` +
    `<span class="prod-emoji">${emoji}</span>` +
    `<img src="${src}" alt="" loading="lazy" onerror="this.remove()">` +
    `</span>`
}

async function cartCount() {
  const items = await AS.api.get('/cart')
  return items.reduce((n, i) => n + i.qty, 0)
}

AS.renderStore = function (container, app) {
  const tr = app.t()
  const lang = app.lang
  let cat = 'all'
  let q = ''

  container.innerHTML = `
    <div id="storeListWrap">
      <div class="store-head">
        <div class="section-title" style="margin:0">${tr('store_title')}</div>
        <button class="cart-btn" id="cartBtn" aria-label="${tr('store_cart')}">
          <img src="img/cart.png" alt=""><span class="cart-badge" id="cartBadge">0</span>
        </button>
      </div>
      <p class="progress-note" style="margin:6px 0 12px">${tr('store_sub')}</p>
      <input class="store-search" id="storeSearch" placeholder="🔍 ${tr('store_search')}" />
      <div class="chip-row store-chips" id="storeChips"></div>
      <div class="prod-grid" id="prodGrid"></div>
    </div>
    <div id="prodDetail" hidden></div>
  `

  const badge = container.querySelector('#cartBadge')
  const refreshBadge = async () => { badge.textContent = await cartCount() }
  refreshBadge()

  const listWrap = container.querySelector('#storeListWrap')
  const detail = container.querySelector('#prodDetail')
  const chips = container.querySelector('#storeChips')
  const grid = container.querySelector('#prodGrid')

  function renderChips() {
    chips.innerHTML = ''
    const mk = (id, label) => {
      const c = document.createElement('button')
      c.className = 'chip' + (cat === id ? ' active' : '')
      c.textContent = label
      c.onclick = () => { cat = id; renderChips(); renderGrid() }
      chips.appendChild(c)
    }
    mk('all', tr('store_all'))
    AS.PRODUCT_CATEGORIES.forEach(c => mk(c.id, `${c.emoji} ${c[lang]}`))
  }

  async function renderGrid() {
    grid.innerHTML = '<div class="progress-note" style="grid-column:1/-1">…</div>'
    const list = await AS.api.get('/products?cat=' + cat + '&q=' + encodeURIComponent(q))
    grid.innerHTML = ''
    if (!list.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><span class="emoji">🤔</span>${tr('library_empty')}</div>`
      return
    }
    list.forEach(p => {
      const card = document.createElement('div')
      card.className = 'prod-card'
      card.setAttribute('role', 'button')
      card.setAttribute('tabindex', '0')
      card.innerHTML = `
        ${prodThumb(p)}
        <span class="prod-name">${p[lang]}</span>
        <span class="prod-price">${AS.fmtRWF(p.price)}</span>
        <span class="prod-unit">${p.unit[lang]}</span>
        <span class="prod-add" title="${tr('store_add')}">+</span>`
      card.onclick = () => showDetail(p)
      card.onkeydown = e => { if (e.key === 'Enter') showDetail(p) }
      card.querySelector('.prod-add').onclick = e => {
        e.stopPropagation()
        addToCart(p.id, card)
      }
      grid.appendChild(card)
    })
  }

  async function addToCart(id, card) {
    const items = await AS.api.get('/cart')
    const line = items.find(i => i.id === id)
    if (line) line.qty += 1
    else items.push({ id, qty: 1 })
    await AS.api.put('/cart', { items })
    if (card) {
      card.classList.add('added')
      setTimeout(() => card.classList.remove('added'), 500)
    }
    refreshBadge()
  }

  // Tapping a product opens its detail first, with an "Order Now" WhatsApp CTA.
  function showDetail(p) {
    if (!p) return
    const c = (AS.CATALOG ? AS.CATALOG.categories() : AS.PRODUCT_CATEGORIES).find(x => x.id === p.cat) || {}
    detail.innerHTML = `
      <button class="btn btn-outline" id="detailBack" style="margin-bottom:10px">← ${tr('store_back')}</button>
      <div class="card" style="padding:16px;text-align:center">
        <div style="display:flex;justify-content:center">${prodThumb(p)}</div>
        <div class="section-title" style="margin:10px 0 2px">${p[lang]}</div>
        <div class="progress-note">${c[lang] || p.cat}</div>
        <div class="prod-price" style="font-size:20px;margin-top:8px">${AS.fmtRWF(p.price)}</div>
        <div class="progress-note">${tr('store_per')} ${p.unit[lang]}</div>
        <a class="btn btn-primary" id="waOrder" style="display:block;width:100%;margin-top:14px;text-decoration:none"
           href="${waOrderLink(p, lang)}" target="_blank" rel="noopener">💬 ${tr('store_order_now')}</a>
        <button class="btn btn-outline" id="detailAdd" style="width:100%;margin-top:8px">+ ${tr('store_add')}</button>
      </div>
    `
    listWrap.hidden = true
    detail.hidden = false
    window.scrollTo(0, 0)
    detail.querySelector('#detailBack').onclick = () => {
      detail.hidden = true
      listWrap.hidden = false
    }
    detail.querySelector('#detailAdd').onclick = () => addToCart(p.id)
  }

  let deb
  container.querySelector('#storeSearch').oninput = e => {
    q = e.target.value.trim()
    clearTimeout(deb)
    deb = setTimeout(renderGrid, 250)
  }
  container.querySelector('#cartBtn').onclick = () => app.go('cart')
  renderChips()
  renderGrid()
}

AS.renderCart = function (container, app) {
  const tr = app.t()
  const lang = app.lang

  const draw = async () => {
    const items = await AS.api.get('/cart')
    const rows = items.map(i => ({ ...i, p: AS.PRODUCTS.find(p => p.id === i.id) })).filter(r => r.p)
    const total = rows.reduce((s, r) => s + r.p.price * r.qty, 0)

    container.innerHTML = `
      <div class="section-title">${tr('store_cart')} 🧺</div>
      <div id="cartList"></div>
      ${rows.length ? `
        <div class="cart-total"><span>${tr('store_total')}</span><b>${AS.fmtRWF(total)}</b></div>
        <button class="btn btn-primary" id="checkoutBtn">${tr('store_checkout')} →</button>` : ''}
    `

    const list = container.querySelector('#cartList')
    if (!rows.length) {
      list.innerHTML = `<div class="empty-state"><span class="emoji">🧺</span>${tr('store_cart_empty')}</div>
        <button class="btn btn-outline" id="toStore" style="margin-top:10px">${tr('nav_store')} →</button>`
      container.querySelector('#toStore').onclick = () => app.go('store')
      return
    }

    rows.forEach(r => {
      const row = document.createElement('div')
      row.className = 'cart-row'
      row.innerHTML = `
        ${prodThumb(r.p, true)}
        <span class="body">
          <span class="name">${r.p[lang]}</span>
          <span class="meta">${AS.fmtRWF(r.p.price)} / ${r.p.unit[lang]}</span>
        </span>
        <span class="qty-box">
          <button class="qty-btn" data-d="-1">−</button>
          <b>${r.qty}</b>
          <button class="qty-btn" data-d="1">+</button>
        </span>
        <b class="line-total">${AS.fmtRWF(r.p.price * r.qty)}</b>`
      row.querySelectorAll('.qty-btn').forEach(b => (b.onclick = async () => {
        const items = await AS.api.get('/cart')
        const line = items.find(i => i.id === r.id)
        if (!line) return
        line.qty += Number(b.dataset.d)
        const next = items.filter(i => i.qty > 0)
        await AS.api.put('/cart', { items: next })
        draw()
      }))
      list.appendChild(row)
    })

    container.querySelector('#checkoutBtn').onclick = async () => {
      const btn = container.querySelector('#checkoutBtn')
      btn.disabled = true
      const order = await AS.api.post('/orders', { items: rows.map(r => ({ id: r.id, qty: r.qty })), total, user: app.user ? app.user.id : null })
      container.innerHTML = `
        <div class="empty-state">
          <span class="emoji">✅</span>
          <b>${tr('store_order_ok')}</b>
          <p class="progress-note" style="margin-top:6px">${order.id}</p>
          <button class="btn btn-outline" id="seeOrders" style="margin-top:12px">${tr('store_orders')}</button>
          <button class="btn btn-primary" id="backStore" style="margin-top:8px">${tr('nav_store')} →</button>
        </div>`
      container.querySelector('#seeOrders').onclick = () => app.go('orders')
      container.querySelector('#backStore').onclick = () => app.go('store')
    }
  }

  draw()
}

AS.renderOrders = function (container, app) {
  const tr = app.t()
  const lang = app.lang

  const draw = async () => {
    const orders = await AS.api.get('/orders')
    container.innerHTML = `<div class="section-title">${tr('store_orders')} 📦</div><div id="orderList"></div>`
    const list = container.querySelector('#orderList')
    if (!orders.length) {
      list.innerHTML = `<div class="empty-state"><span class="emoji">📦</span>${tr('orders_empty')}</div>`
      return
    }
    orders.forEach(o => {
      const date = new Date(o.at).toLocaleDateString(lang === 'rw' ? 'rw-RW' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      const names = o.items.map(i => {
        const p = AS.PRODUCTS.find(x => x.id === i.id)
        return p ? `${p[lang]} ×${i.qty}` : i.id
      }).join(', ')
      const row = document.createElement('div')
      row.className = 'list-row order-row'
      row.innerHTML = `
        <span class="emoji">📦</span>
        <span class="body">
          <span class="name">${As_ordLabel(o, tr)} · ${AS.fmtRWF(o.total)}</span>
          <span class="meta">${date} · ${names}</span>
        </span>
        <span class="badge sev-low">${tr('order_' + o.status) || o.status}</span>`
      list.appendChild(row)
    })
  }
  draw()
}

function As_ordLabel(o, tr) { return tr('order_ref') + ' ' + o.id.slice(-4).toUpperCase() }
})()
