(function () {
const { makeT } = AS
const {
  renderHome, renderScan, renderLearn, renderLessonDetail, renderCrops, renderCropDetail,
  renderLibrary, renderDiseaseDetail, renderFertilizer, renderFertilizerDetail,
  renderSettings, renderOnboarding, renderLogin, renderStore, renderCart, renderOrders,
  renderAssistant, renderDashboard, renderAdmin
} = AS

const state = {
  lang: localStorage.getItem('as_lang') || null,
  name: localStorage.getItem('as_name') || '',
  user: JSON.parse(localStorage.getItem('as_user') || 'null'),
  accounts: JSON.parse(localStorage.getItem('as_accounts') || '[]'),
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
  login(id, phone) {
    const acc = state.accounts.find(a =>
      a.id.toLowerCase() === id.toLowerCase() && a.phone === phone)
    if (!acc) return 'notfound'
    state.user = { id: acc.id, phone: acc.phone, role: 'user', at: Date.now() }
    localStorage.setItem('as_user', JSON.stringify(state.user))
    render()
    return null
  },
  loginAdmin(id, phone, pin) {
    if (!AS.ADMIN.check(id, phone, pin)) return 'badpin'
    state.user = { id: String(id).trim(), phone: String(phone).trim(), role: 'admin', at: Date.now() }
    localStorage.setItem('as_user', JSON.stringify(state.user))
    render()
    return null
  },
  signup(id, phone) {
    if (state.accounts.some(a => a.id.toLowerCase() === id.toLowerCase())) return 'exists'
    state.accounts.push({ id, phone, at: Date.now() })
    localStorage.setItem('as_accounts', JSON.stringify(state.accounts))
    state.user = { id, phone, role: 'user', at: Date.now() }
    localStorage.setItem('as_user', JSON.stringify(state.user))
    render()
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

render()
})()
