// AgroSmart Rwanda — backend API layer.
// Runs fully offline against AS.db so the app works from file:// and without
// internet. Point AS.API_BASE at a real server URL later and the same
// api.get/api.post calls can be switched to fetch() without touching screens.
AS.API_BASE = null

AS.api = (function () {
  const wait = () => new Promise(r => setTimeout(r, 100 + Math.random() * 150))

  const cartRow = () => AS.db.find('carts', 'current') || AS.db.insert('carts', { id: 'current', items: [] })

  const routes = {
    'GET /products': q => {
      let list = AS.PRODUCTS.slice()
      if (q.cat && q.cat !== 'all') list = list.filter(p => p.cat === q.cat)
      if (q.q) {
        const s = q.q.toLowerCase()
        list = list.filter(p => p.en.toLowerCase().includes(s) || p.rw.toLowerCase().includes(s))
      }
      return list
    },
    'GET /categories': () => AS.PRODUCT_CATEGORIES,
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
    'POST /ai/chat': (q, body) => AS.aiReply(body.message || '', body.lang || 'rw')
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
