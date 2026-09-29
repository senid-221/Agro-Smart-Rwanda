// AgroSmart Rwanda — backend API layer.
// Runs fully offline against AS.db so the app works from file:// and without
// internet. Point AS.API_BASE at a real server URL later and the same
// api.get/api.post calls can be switched to fetch() without touching screens.
AS.API_BASE = null

AS.api = (function () {
  const wait = () => new Promise(r => setTimeout(r, 100 + Math.random() * 150))

  const cartRow = () => AS.db.find('carts', 'current') || AS.db.insert('carts', { id: 'current', items: [] })

  // upsert a row into a db table by id (keeps the admin-supplied id)
  const upsert = (table, id, patch) => {
    const rec = AS.db.find(table, id)
    if (rec) return AS.db.update(table, id, patch)
    return AS.db.insert(table, Object.assign({ id }, patch))
  }

  const routes = {
    'GET /products': q => {
      let list = AS.CATALOG.products()
      if (q.cat && q.cat !== 'all') list = list.filter(p => p.cat === q.cat)
      if (q.q) {
        const s = q.q.toLowerCase()
        list = list.filter(p => (p.en || '').toLowerCase().includes(s) || (p.rw || '').toLowerCase().includes(s))
      }
      return list
    },
    'GET /categories': () => AS.CATALOG.categories(),
    'GET /cart': () => cartRow().items,
    'PUT /cart': (q, body) => AS.db.update('carts', 'current', { items: body.items || [] }) || cartRow(),
    'POST /orders': (q, body) => {
      const items = body.items || []
      if (!items.length) return { error: 'empty' }
      const order = AS.db.insert('orders', {
        items,
        total: body.total || 0,
        user: body.user || null,
        status: 'received'
      })
      AS.db.update('carts', 'current', { items: [] })
      return order
    },
    'GET /orders': () => AS.db.all('orders'),
    'POST /ai/chat': (q, body) => AS.aiChat(body.message || '', body.lang || 'rw', body.ctx || {}),

    // ---------- admin: read full customization state ----------
    'GET /admin/state': () => ({
      products: AS.db.all('products'),
      categories: AS.db.all('categories'),
      theme: AS.THEME.get(),
      qa: AS.db.all('ai_qa'),
      glossary: AS.db.all('ai_glossary'),
      provider: AS.PROVIDER.get(),
      admin: AS.ADMIN.get()
    }),

    // ---------- admin: products ----------
    'POST /admin/product/save': (q, body) => {
      const p = body.product || {}
      if (!p.id) return { error: 'no_id' }
      const rec = upsert('products', String(p.id).trim(), {
        cat: p.cat || 'seeds', en: p.en || '', rw: p.rw || '',
        price: Number(p.price) || 0,
        unit: { en: (p.unit && p.unit.en) || 'piece', rw: (p.unit && p.unit.rw) || 'igikoresho 1' },
        emoji: p.emoji || '', img: p.img || '', hidden: !!p.hidden
      })
      return rec
    },
    'POST /admin/product/delete': (q, body) => { AS.db.remove('products', body.id); return { ok: true } },

    // ---------- admin: categories ----------
    'POST /admin/category/save': (q, body) => {
      const c = body.category || {}
      if (!c.id) return { error: 'no_id' }
      return upsert('categories', String(c.id).trim(), {
        emoji: c.emoji || '🧺', en: c.en || '', rw: c.rw || '', hidden: !!c.hidden
      })
    },
    'POST /admin/category/delete': (q, body) => { AS.db.remove('categories', body.id); return { ok: true } },

    // ---------- admin: theme / appearance ----------
    'POST /admin/theme/save': (q, body) => AS.THEME.set(body.theme || {}),

    // ---------- admin: AI Kinyarwanda training ----------
    'POST /admin/qa/save': (q, body) => {
      const r = body.item || {}
      const id = r.id || 'qa_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
      return upsert('ai_qa', id, {
        q: r.q || '', a: r.a || '', qEn: r.qEn || '', aEn: r.aEn || ''
      })
    },
    'POST /admin/qa/delete': (q, body) => { AS.db.remove('ai_qa', body.id); return { ok: true } },
    'POST /admin/glossary/save': (q, body) => {
      const r = body.item || {}
      const id = r.id || 'gl_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
      return upsert('ai_glossary', id, {
        term: r.term || '', def: r.def || '', defEn: r.defEn || ''
      })
    },
    'POST /admin/glossary/delete': (q, body) => { AS.db.remove('ai_glossary', body.id); return { ok: true } },

    // ---------- admin: AI provider ----------
    'POST /admin/provider/save': (q, body) => AS.PROVIDER.set(body.provider || {}),

    // ---------- admin: account credentials ----------
    'POST /admin/account/save': (q, body) => {
      const a = body.admin || {}
      const patch = {}
      if (a.adminId != null) patch.adminId = String(a.adminId)
      if (a.phone != null) patch.phone = String(a.phone)
      if (a.pin != null) patch.pin = String(a.pin)
      if (a.name != null) patch.name = String(a.name)
      return AS.ADMIN.set(patch)
    },

    // ---------- admin: check credentials ----------
    'POST /admin/login': (q, body) => ({ ok: AS.ADMIN.check(body.id || '', body.phone || '', body.pin || '') })
  }

  async function call(method, path, body) {
    await wait()
    const [pathname, search] = path.split('?')
    const q = {}
    if (search) search.split('&').forEach(kv => { const [k, v] = kv.split('='); q[decodeURIComponent(k)] = decodeURIComponent(v || '') })
    const handler = routes[method + ' ' + pathname]
    if (!handler) return { error: 'not_found', path }
    return handler(q, body || {})
  }

  return {
    get: (path) => call('GET', path),
    put: (path, body) => call('PUT', path, body),
    post: (path, body) => call('POST', path, body)
  }
})()

AS.fmtRWF = n => 'RWF ' + Number(n).toLocaleString('en-GB')
