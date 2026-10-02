(function () {
const { makeT } = AS
const {
  renderHome, renderScan, renderLearn, renderLessonDetail, renderCrops, renderCropDetail,
  renderLibrary, renderDiseaseDetail, renderFertilizer, renderFertilizerDetail,
  renderSettings, renderOnboarding, renderLogin, renderStore, renderCart, renderOrders,
  renderAssistant, renderCase, renderDashboard, renderAdmin, renderAlerts, renderWeather,
  renderCommunity, renderExpert, renderMap
} = AS

const state = {
  lang: localStorage.getItem('as_lang') || null,
  name: localStorage.getItem('as_name') || '',
  user: JSON.parse(localStorage.getItem('as_user') || 'null'),
  onboarded: localStorage.getItem('as_onboarded') === '1' || !!localStorage.getItem('as_name'),
  route: { name: 'home' },
  history: JSON.parse(localStorage.getItem('as_history') || '[]'),
  deferredInstall: null
}

const t = () => makeT(state.lang)

const ROUTES = {
  home: { screen: 'home', render: c => renderHome(c, app) },
  scan: { screen: 'scan', render: c => renderScan(c, app) },
  alerts: { screen: 'alerts', render: c => renderAlerts(c, app) },
  learn: { screen: 'learn', render: c => renderLearn(c, app) },
  lesson: { screen: 'learn', render: c => renderLessonDetail(c, app, state.route.params.id) },
  crops: { screen: 'learn', render: c => renderCrops(c, app) },
  crop: { screen: 'learn', render: c => renderCropDetail(c, app, state.route.params.id) },
  library: { screen: 'library', render: c => renderLibrary(c, app) },
  disease: { screen: 'library', render: c => renderDiseaseDetail(c, app, state.route.params.id) },
  fertilizer: { screen: 'learn', render: c => renderFertilizer(c, app) },
  fertDetail: { screen: 'learn', render: c => renderFertilizerDetail(c, app, state.route.params.id) },
  store: { screen: 'store', render: c => renderStore(c, app) },
  cart: { screen: 'store', render: c => renderCart(c, app) },
  orders: { screen: 'store', render: c => renderOrders(c, app) },
  assistant: { screen: 'assistant', render: c => renderAssistant(c, app) },
  case: { screen: 'assistant', render: c => renderCase(c, app, state.route.params.id) },
  dashboard: { screen: 'analytics', render: c => renderDashboard(c, app) },
  weather: { screen: 'weather', render: c => renderWeather(c, app) },
  map: { screen: 'map', render: c => renderMap(c, app) },
  community: { screen: 'community', render: c => renderCommunity(c, app) },
  expert: { screen: 'expert', render: c => renderExpert(c, app) },
  admin: { screen: 'admin', render: c => renderAdmin(c, app) },
  settings: { screen: 'settings', render: c => renderSettings(c, app) }
}

// Screens that draw their own header exactly as in the design mockup
// (assistant/case keep the chat header, admin keeps its panel header).
const OWN_CHROME = { home: 1, analytics: 1, alerts: 1, scan: 1, assistant: 1, admin: 1 }
// Tab-bar label + icon per screen group.
const TAB_FOR = { home: 'home', analytics: 'analytics', alerts: 'alerts', settings: 'settings' }
// Title for the generic header, per route (falls back to the screen group title).
const ROUTE_TITLE = {
  learn: 'nav_learn', lesson: 'nav_learn', crops: 'crops_title', crop: 'crops_title',
  library: 'library_title', disease: 'nav_library',
  fertilizer: 'fert_title', fertDetail: 'fert_title',
  store: 'store_title', cart: 'store_cart', orders: 'store_orders',
  weather: 'wx_title',
  map: 'map_title',
  community: 'cm_title', expert: 'ex_title',
  settings: 'nav_settings'
}

const app = {
  t,
  get lang() { return state.lang },
  get name() { return state.name },
  get user() { return state.user },
  get route() { return state.route },
  get history() { return state.history },
  go(name, params = {}) {
    state.route = { name, params }
    window.scrollTo(0, 0)
    render()
  },
  setLang(lang) {
    state.lang = lang
    localStorage.setItem('as_lang', lang)
    document.documentElement.lang = lang
    render()
  },
  setName(name) {
    state.name = name
    if (name) localStorage.setItem('as_name', name)
    else localStorage.removeItem('as_name')
    render()
  },
  async _session(r) {
    AS.auth.setToken(r.token)
    state.user = r.user
    localStorage.setItem('as_user', JSON.stringify(r.user))
    if (r.user && r.user.name) {
      state.name = r.user.name
      localStorage.setItem('as_name', r.user.name)
    }
    await AS.sync()
    render()
    return null
  },
  // Email + password login. Returns null on success or an error key string.
  async login(email, password) {
    const r = await AS.api.post('/auth/login', { email, password })
    if (r.error === 'notfound') return 'notfound'
    if (r.error === 'badpass') return 'badpass'
    if (r.error === 'google_only') return 'google_only'
    if (r.error) return r.error
    return app._session(r)
  },
  // Phone + 6-digit passcode login (National-ID-registered farmers).
  async loginPhone(phone, passcode) {
    const r = await AS.api.post('/auth/login', { phone, passcode })
    if (r.error === 'notfound') return 'notfound'
    if (r.error === 'badpass') return 'badpass'
    if (r.error === 'google_only') return 'google_only'
    if (r.error === 'bad_phone') return 'bad_phone'
    if (r.error) return r.error
    return app._session(r)
  },
  // National ID + mobile + 6-digit passcode registration.
  async register(nationalId, phone, passcode, name) {
    const r = await AS.api.post('/auth/register', { nationalId, phone, passcode, name: name || '' })
    if (r.error === 'exists') return 'exists_id'
    if (r.error === 'bad_id') return 'bad_id'
    if (r.error === 'bad_phone') return 'bad_phone'
    if (r.error === 'weak_password') return 'weak'
    if (r.error) return r.error
    return app._session(r)
  },
  // Admin tab: email + password, requires the admin role.
  async loginAdmin(email, password) {
    const r = await AS.api.post('/auth/login', { email, password, admin: true })
    if (r.error === 'badpin') return 'badpin'
    if (r.error === 'notfound') return 'notfound'
    if (r.error) return r.error
    return app._session(r)
  },
  // Email + password registration (phone optional; enables OTP reset).
  async signup(email, password, name, phone) {
    const r = await AS.api.post('/auth/signup', { email, password, name: name || '', phone: phone || '' })
    if (r.error === 'exists') return 'exists'
    if (r.error === 'weak_password') return 'weak'
    if (r.error === 'bad_email') return 'bad_email'
    if (r.error === 'bad_phone') return 'bad_phone'
    if (r.error) return r.error
    return app._session(r)
  },
  // "Sign in with Google": send the Google ID token; the server verifies it and
  // returns our JWT. Returns null on success or an error key string.
  async loginGoogle(idToken) {
    const r = await AS.api.post('/auth/google', { idToken })
    if (r.error) return r.error
    return app._session(r)
  },
  // Public bootstrap config for the login screen (e.g. the Google client ID).
  async authConfig() {
    const r = await AS.api.get('/auth/config')
    return (r && !r.error) ? r : {}
  },
  // Forgot-password flow. forgotPassword returns { code } on success or { error }.
  async forgotPassword(phone) {
    const r = await AS.api.post('/auth/forgot', { phone })
    if (r.error === 'network') return { error: 'network' }
    if (r.error === 'notfound') return { error: 'notfound' }
    if (r.error === 'too_soon') return { error: 'too_soon' }
    if (r.error) return { error: r.error }
    return { code: r.code }
  },
  async verifyOtp(phone, code) {
    const r = await AS.api.post('/auth/verify-otp', { phone, code })
    if (r.error === 'network') return { error: 'network' }
    if (r.error === 'otp_wrong') return { error: 'otp_wrong' }
    if (r.error === 'otp_expired') return { error: 'otp_expired' }
    if (r.error) return { error: r.error }
    return { token: r.token }
  },
  async resetPassword(token, password) {
    const r = await AS.api.post('/auth/reset', { token, password })
    if (r.error === 'network') return 'network'
    if (r.error === 'weak_password') return 'six'
    if (r.error === 'token_expired') return 'expired'
    if (r.error) return r.error
    return null
  },
  applyTheme() {
    if (AS.THEME && AS.THEME.apply) AS.THEME.apply(state.lang || 'rw', t())
  },
  setOnboarded() {
    state.onboarded = true
    localStorage.setItem('as_onboarded', '1')
  },
  logout() {
    state.user = null
    localStorage.removeItem('as_user')
    if (AS.auth && AS.auth.clearToken) AS.auth.clearToken()
    render()
  },
  addHistory(entry) {
    state.history.unshift({ ...entry, at: Date.now() })
    state.history = state.history.slice(0, 8)
    localStorage.setItem('as_history', JSON.stringify(state.history))
  },
  clearHistory() {
    state.history = []
    localStorage.removeItem('as_history')
    render()
  },
  tr(key) { return t()(key) },
  // Farmer's district + focus crop drive the weather, soil and alert logic.
  prefs() { return AS.prefs() },
  setPrefs(patch) { AS.savePrefs(patch); render() },
  setAlertCount(n) {
    const v = Number(n) || 0
    localStorage.setItem('as_alert_count', String(v))
    return v
  }
}

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault()
  state.deferredInstall = e
  window.__installEvent = e
})

window.addEventListener('appinstalled', () => {
  state.deferredInstall = null
  window.__installEvent = null
  state.installed = true
})

AS.isInstalled = () =>
  state.installed === true ||
  window.matchMedia('(display-mode: standalone)').matches ||
  window.matchMedia('(display-mode: minimal-ui)').matches ||
  window.navigator.standalone === true

function tabbar(tr, screen) {
  const nav = document.createElement('nav')
  nav.className = 'tabbar'
  const active = TAB_FOR[screen] || null
  const badge = Number(localStorage.getItem('as_alert_count') || 0)
  const items = [
    { key: 'home', route: 'home', icon: 'home', label: tr('nav_home') },
    { key: 'analytics', route: 'dashboard', icon: 'chart', label: tr('nav_analytics') },
    { key: 'scan', route: 'scan', icon: 'scan', label: tr('nav_scan'), fab: true },
    { key: 'alerts', route: 'alerts', icon: 'bell', label: tr('nav_alerts'), badge: badge },
    { key: 'settings', route: 'settings', icon: 'gear', label: tr('nav_settings') }
  ]
  items.forEach(it => {
    const b = document.createElement('button')
    b.className = 'tab' + (active === it.key ? ' active' : '') + (it.fab ? ' tab-center' : '')
    b.setAttribute('aria-label', it.label)
    if (it.fab) {
      b.innerHTML = `<span class="fab">${AS.icon(it.icon, 25)}</span><span>${AS.esc(it.label)}</span>`
    } else {
      b.innerHTML = `<span class="t-ico">${AS.icon(it.icon, 23)}${it.badge ? '<i class="dot"></i>' : ''}</span><span>${AS.esc(it.label)}</span>`
    }
    b.onclick = () => app.go(it.route)
    nav.appendChild(b)
  })
  return nav
}

function shell() {
  const el = document.getElementById('app')
  el.innerHTML = ''

  const tr = t()
  const lang = state.lang || 'rw'
  AS.THEME.apply(lang, tr)

  const route = ROUTES[state.route.name] || ROUTES.home
  const screen = route.screen

  const main = document.createElement('main')
  main.className = 'screen' + (screen === 'scan' ? ' bare' : '')
  el.appendChild(main)

  // The generic header lives outside the route container: screens assign
  // container.innerHTML (sometimes again after an async fetch), which would wipe it.
  if (!OWN_CHROME[screen]) {
    const bar = document.createElement('div')
    bar.className = 'top-bar'
    bar.innerHTML = `
      <div style="min-width:0">
        <div class="tb-sub">${AS.esc(AS.THEME.subtitle(lang, tr))}</div>
        <div class="tb-title">${AS.esc(tr(ROUTE_TITLE[state.route.name] || 'appName'))}</div>
      </div>
      <div class="tb-right">
        <button class="lang-pill" id="langToggle">${lang === 'rw' ? 'EN' : 'RW'}</button>
        <button class="icon-btn" id="bellBtn" aria-label="${AS.esc(tr('nav_alerts'))}">${AS.icon('bell', 21)}</button>
      </div>`
    bar.querySelector('#langToggle').onclick = () => app.setLang(lang === 'rw' ? 'en' : 'rw')
    bar.querySelector('#bellBtn').onclick = () => app.go('alerts')
    main.appendChild(bar)
  }

  const body = document.createElement('div')
  body.className = 'route'
  main.appendChild(body)

  route.render(body)

  if (screen !== 'scan') el.appendChild(tabbar(tr, screen))
}

function render() {
  if (AS.stopCamera) AS.stopCamera()
  if (AS.lottieStopAll) AS.lottieStopAll()
  if (!state.user) {
    const el = document.getElementById('app')
    el.innerHTML = ''
    const main = document.createElement('main')
    main.className = 'screen'
    el.appendChild(main)
    renderLogin(main, app)
    return
  }
  if (!state.onboarded) {
    const el = document.getElementById('app')
    el.innerHTML = ''
    const main = document.createElement('main')
    main.className = 'screen'
    el.appendChild(main)
    renderOnboarding(main, app)
    return
  }
  shell()
}

AS.onUnauthorized = () => {
  state.user = null
  localStorage.removeItem('as_user')
  render()
}

async function boot() {
  // Online-only: if we have a session, refresh the server-backed cache first.
  if (state.user && AS.auth.getToken()) {
    const r = await AS.sync()
    if (r && r.error === 'network') {
      // keep the cached session but flag the connection problem
      state.offline = true
    }
  }
  render()
}

boot()
})()
