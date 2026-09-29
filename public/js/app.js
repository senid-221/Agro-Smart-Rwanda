(function () {
const { makeT } = AS
const {
  renderHome, renderScan, renderLearn, renderLessonDetail, renderCrops, renderCropDetail,
  renderLibrary, renderDiseaseDetail, renderFertilizer, renderFertilizerDetail,
  renderSettings, renderOnboarding, renderLogin, renderStore, renderCart, renderOrders,
  renderAssistant, renderCase, renderDashboard, renderAdmin
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
  learn: { screen: 'learn', render: c => renderLearn(c, app) },
  lesson: { screen: 'learn', render: c => renderLessonDetail(c, app, state.route.params.id) },
  crops: { screen: 'learn', render: c => renderCrops(c, app) },
  crop: { screen: 'learn', render: c => renderCropDetail(c, app, state.route.params.id) },
  library: { screen: 'library', render: c => renderLibrary(c, app) },
  disease: { screen: 'library', render: c => renderDiseaseDetail(c, app, state.route.params.id) },
  fertilizer: { screen: 'more', render: c => renderFertilizer(c, app) },
  fertDetail: { screen: 'more', render: c => renderFertilizerDetail(c, app, state.route.params.id) },
  store: { screen: 'store', render: c => renderStore(c, app) },
  cart: { screen: 'store', render: c => renderCart(c, app) },
  orders: { screen: 'store', render: c => renderOrders(c, app) },
  assistant: { screen: 'assistant', render: c => renderAssistant(c, app) },
  case: { screen: 'assistant', render: c => renderCase(c, app, state.route.params.id) },
  dashboard: { screen: 'dashboard', render: c => renderDashboard(c, app) },
  admin: { screen: 'admin', render: c => renderAdmin(c, app) },
  settings: { screen: 'more', render: c => renderSettings(c, app) }
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
  async login(id, phone, password) {
    const r = await AS.api.post('/auth/login', { nationalId: id, phone, password })
    if (r.error === 'notfound') return 'notfound'
    if (r.error === 'badpass') return 'badpass'
    if (r.error) return r.error
    return app._session(r)
  },
  async loginAdmin(id, phone, password) {
    const r = await AS.api.post('/auth/login', { nationalId: id, phone, password, admin: true })
    if (r.error === 'badpin') return 'badpin'
    if (r.error === 'notfound') return 'notfound'
    if (r.error) return r.error
    return app._session(r)
  },
  async signup(id, phone, password, name) {
    const r = await AS.api.post('/auth/signup', { nationalId: id, phone, password, name: name || '' })
    if (r.error === 'exists') return 'exists'
    if (r.error === 'weak_password') return 'weak'
    if (r.error) return r.error
    return app._session(r)
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
  tr(key) { return t()(key) }
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

function shell() {
  const el = document.getElementById('app')
  el.innerHTML = ''

  const tr = t()
  AS.THEME.apply(state.lang || 'rw', tr)
  const currentScreen = ROUTES[state.route.name]?.screen || 'home'
  const appTitle = AS.THEME.title(state.lang || 'rw', tr)
  const appSub = AS.THEME.subtitle(state.lang || 'rw', tr)
  const logo = AS.THEME_LOGO || 'img/leaf.png'

  // header
  const header = document.createElement('header')
  header.className = 'app-header'
  header.innerHTML = `
    <div class="row">
      <div>
        <h1><img class="h-ico" src="${logo}" alt=""> ${appTitle}</h1>
        <div class="sub">${appSub}</div>
      </div>
      <button class="lang-chip" id="langToggle">${state.lang === 'rw' ? 'EN' : 'RW'}</button>
    </div>`
  header.querySelector('#langToggle').onclick = () =>
    app.setLang(state.lang === 'rw' ? 'en' : 'rw')
  header.querySelector('h1').style.cursor = 'pointer'
  header.querySelector('h1').onclick = () => app.go('home')
  el.appendChild(header)

  // screen container
  const main = document.createElement('main')
  main.className = 'screen'
  el.appendChild(main)
  const route = ROUTES[state.route.name] || ROUTES.home
  route.render(main)

  // bottom nav
  const nav = document.createElement('nav')
  nav.className = 'bottom-nav'
  const items = [
    { key: 'home', icon: 'img/home.png', label: tr('nav_home') },
    { key: 'store', icon: 'img/cart.png', label: tr('nav_store') },
    { key: 'scan', icon: 'img/camera.png', label: tr('nav_scan') },
    { key: 'library', icon: 'img/leaf.png', label: tr('nav_library') },
    { key: 'more', icon: 'img/settings.png', label: tr('nav_more') }
  ]
  items.forEach(it => {
    const b = document.createElement('button')
    b.className = 'nav-item' + (currentScreen === it.key ? ' active' : '') + (it.key === 'scan' ? ' scan-btn' : '')
    b.innerHTML = `<span class="icon"><img src="${it.icon}" alt=""></span><span>${it.label}</span>`
    b.onclick = () => app.go(it.key === 'more' ? 'settings' : it.key)
    nav.appendChild(b)
  })
  el.appendChild(nav)
}

function render() {
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
