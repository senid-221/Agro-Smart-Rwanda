// AgroSmart Rwanda — HTTP API client.
// The app is online-only: every call goes to the Node/Express backend under
// /api with a Bearer token. The backend (PostgreSQL) is the single source of truth;
// AS.db is used only as a local cache hydrated by AS.sync() at boot so the
// synchronous getters (AS.CATALOG / AS.THEME / AS.PROVIDER) keep working.
AS.API_BASE = '' // same origin; set to an absolute URL if the API is hosted elsewhere

const TOKEN_KEY = 'as_token'

AS.auth = {
  getToken: () => localStorage.getItem(TOKEN_KEY) || '',
  setToken: t => { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY) },
  clearToken: () => localStorage.removeItem(TOKEN_KEY)
}

async function http(method, path, body) {
  const url = AS.API_BASE + '/api' + path
  const headers = { 'Content-Type': 'application/json' }
  const token = AS.auth.getToken()
  if (token) headers['Authorization'] = 'Bearer ' + token
  let res
  try {
    res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined })
  } catch (e) {
    return { error: 'network', message: (e && e.message) || 'offline' }
  }
  if (res.status === 401 && !path.startsWith('/auth/')) {
    // An authenticated call was rejected: the session expired or is invalid.
    // (Auth endpoints return 401 for a wrong password and must not trigger this.)
    AS.auth.clearToken()
    localStorage.removeItem('as_user')
    if (AS.onUnauthorized) AS.onUnauthorized()
  }
  let data = null
  try { data = await res.json() } catch (e) { data = null }
  if (!res.ok) return Object.assign({ error: (data && data.error) || 'http_' + res.status }, data || {})
  return data
}

// Hydrate the local cache from the server so synchronous getters stay correct.
AS.sync = async function () {
  const boot = await http('GET', '/bootstrap')
  if (!boot || boot.error) return boot
  const db = AS.db
  const refill = (table, rows) => { db.clear(table); (rows || []).forEach(r => db.insert(table, r)) }
  refill('products', boot.products)
  refill('categories', boot.categories)
  refill('ai_qa', boot.qa)
  refill('ai_glossary', boot.glossary)
  db.clear('theme'); db.insert('theme', Object.assign({ id: 'site' }, boot.theme || {}))
  db.clear('ai_provider'); db.insert('ai_provider', Object.assign({ id: 'current' }, boot.provider || {}))
  return boot
}

AS.api = (function () {
  // '/ai/chat' is served by OpenAI on the backend when the provider is remote;
  // in builtin mode we answer locally with the on-device rules engine.
  async function post(path, body) {
    if (path === '/ai/chat') {
      const prov = (AS.PROVIDER && AS.PROVIDER.get()) || { mode: 'builtin' }
      if (prov.mode !== 'remote') {
        return AS.aiChat((body && body.message) || '', (body && body.lang) || 'rw', (body && body.ctx) || {})
      }
      const r = await http('POST', '/ai/chat', body)
      if (r && r.error) {
        return {
          intent: 'remote_error', ctx: (body && body.ctx) || {},
          text: r.message || ((body && body.lang) === 'en'
            ? 'The AI service could not be reached.'
            : 'Serivisi ya AI ntabwo yabashije kuboneka.')
        }
      }
      return r
    }
    return http('POST', path, body)
  }

  return {
    get: (path) => http('GET', path),
    put: (path, body) => http('PUT', path, body),
    post,
    del: (path, body) => http('DELETE', path, body)
  }
})()

AS.fmtRWF = n => 'RWF ' + Number(n).toLocaleString('en-GB')
