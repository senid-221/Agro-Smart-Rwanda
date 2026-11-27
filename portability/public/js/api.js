// Hindura — HTTP client for the Express API (same origin, Bearer token for staff).
(function () {
  const HD = (window.HD = window.HD || {})
  const TOKEN_KEY = 'hd_admin_token'

  HD.token = {
    get: () => localStorage.getItem(TOKEN_KEY) || '',
    set: t => { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY) }
  }

  async function http(method, path, body) {
    const headers = { 'Content-Type': 'application/json' }
    const token = HD.token.get()
    if (token) headers.Authorization = 'Bearer ' + token

    let res
    try {
      res = await fetch('/api' + path, {
        method, headers, body: body ? JSON.stringify(body) : undefined
      })
    } catch (e) {
      return { error: 'network' }
    }

    let data = null
    try { data = await res.json() } catch (e) { data = null }

    if (res.status === 401 && path.startsWith('/admin/') && path !== '/admin/login') {
      HD.token.set('')
      if (HD.onUnauthorized) HD.onUnauthorized()
    }
    if (!res.ok) return Object.assign({ error: (data && data.error) || 'http_' + res.status }, data || {})
    return data
  }

  HD.api = {
    get: path => http('GET', path),
    post: (path, body) => http('POST', path, body),
    patch: (path, body) => http('PATCH', path, body)
  }

  // Hydrated from /api/operators at boot; this fallback keeps the landing page
  // usable if that first request fails.
  HD.operators = [
    { code: 'MTN', name: 'MTN Rwanda', short: 'MTN', prefixes: ['078', '079'], color: '#FFCB05', ink: '#141414' },
    { code: 'AIRTEL', name: 'Airtel Rwanda', short: 'Airtel', prefixes: ['072', '073'], color: '#E40000', ink: '#FFFFFF' }
  ]
  HD.loadOperators = async function () {
    const rows = await HD.api.get('/operators')
    if (Array.isArray(rows) && rows.length) HD.operators = rows
    return HD.operators
  }
})()
