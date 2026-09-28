(function () {
const { makeT } = AS
const {
  renderHome, renderScan, renderLearn, renderLessonDetail, renderCrops, renderCropDetail,
  renderLibrary, renderDiseaseDetail, renderFertilizer, renderFertilizerDetail,
  renderSettings, renderOnboarding
} = AS

const state = {
  lang: localStorage.getItem('as_lang') || null,
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
  settings: { screen: 'more', render: c => renderSettings(c, app) }
}

const app = {
  t,
  get lang() { return state.lang },
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

function shell() {
  const el = document.getElementById('app')
  el.innerHTML = ''

  const tr = t()
  const currentScreen = ROUTES[state.route.name]?.screen || 'home'

  // header
  const header = document.createElement('header')
  header.className = 'app-header'
  header.innerHTML = `
    <div class="row">
      <div>
        <h1>🌿 ${tr('appName')}</h1>
        <div class="sub">${tr('tagline')}</div>
      </div>
      <button class="lang-chip" id="langToggle">${state.lang === 'rw' ? '🇬🇧 EN' : '🇷🇼 RW'}</button>
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
    { key: 'home', icon: '🏠', label: tr('nav_home') },
    { key: 'learn', icon: '📖', label: tr('nav_learn') },
    { key: 'scan', icon: '📷', label: tr('nav_scan') },
    { key: 'library', icon: '🦠', label: tr('nav_library') },
    { key: 'more', icon: '⚙️', label: tr('nav_more') }
  ]
  items.forEach(it => {
    const b = document.createElement('button')
    b.className = 'nav-item' + (currentScreen === it.key ? ' active' : '') + (it.key === 'scan' ? ' scan-btn' : '')
    b.innerHTML = `<span class="icon">${it.icon}</span><span>${it.label}</span>`
    b.onclick = () => app.go(it.key === 'more' ? 'settings' : it.key)
    nav.appendChild(b)
  })
  el.appendChild(nav)
}

function render() {
  if (!state.lang) {
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
