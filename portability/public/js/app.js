// Hindura — hash router, shell (app bar + tab bar) and boot.
(function () {
  const HD = window.HD
  const state = {
    lang: localStorage.getItem('hd_lang') || 'rw',
    target: '' // operator preselected from the landing page
  }
  let t = HD.makeT(state.lang)

  const SCREENS = {
    home: HD.renderHome,
    port: HD.renderPort,
    track: HD.renderTrack,
    info: HD.renderInfo,
    admin: HD.renderAdmin
  }

  const app = (HD.app = {
    state,
    get lang() { return state.lang },
    get t() { return t },
    setLang(lang) {
      state.lang = lang
      localStorage.setItem('hd_lang', lang)
      document.documentElement.lang = lang
      t = HD.makeT(lang)
      render()
    },
    go(hash) {
      if (location.hash === hash) render()
      else location.hash = hash
    },
    rerender() { render() }
  })

  HD.onUnauthorized = () => render()

  function parseHash() {
    const raw = (location.hash || '#/').replace(/^#\/?/, '')
    const parts = raw.split('/')
    const name = parts[0] || 'home'
    return {
      name: SCREENS[name] ? name : 'home',
      param: decodeURIComponent(parts.slice(1).join('/') || '')
    }
  }

  function tabbar(active) {
    const items = [
      { key: 'home', route: '#/', icon: 'home', label: t('nav_home') },
      { key: 'track', route: '#/track', icon: 'search', label: t('nav_track') },
      { key: 'port', route: '#/port', icon: 'swap', label: t('nav_port'), fab: true },
      { key: 'info', route: '#/info', icon: 'info', label: t('nav_info') },
      { key: 'admin', route: '#/admin', icon: 'shield', label: t('nav_admin') }
    ]
    const nav = document.createElement('nav')
    nav.className = 'tabbar'
    nav.innerHTML = items.map(it => {
      const on = active === it.key
      if (it.fab) {
        return '<button class="tab tab-fab' + (on ? ' active' : '') + '" data-route="' + it.route + '" aria-label="' + HD.esc(it.label) + '">' +
          '<span class="fab">' + HD.icon(it.icon, 24) + '</span><span>' + HD.esc(it.label) + '</span></button>'
      }
      return '<button class="tab' + (on ? ' active' : '') + '" data-route="' + it.route + '" aria-label="' + HD.esc(it.label) + '">' +
        '<span class="t-ico">' + HD.icon(it.icon, 22) + '</span><span>' + HD.esc(it.label) + '</span></button>'
    }).join('')
    nav.querySelectorAll('.tab').forEach(btn => {
      btn.onclick = () => app.go(btn.dataset.route)
    })
    return nav
  }

  function render() {
    const route = parseHash()
    const el = document.getElementById('app')
    el.innerHTML = ''

    const bar = document.createElement('header')
    bar.className = 'appbar'
    bar.innerHTML =
      '<div class="brand" id="brandHome" role="button" tabindex="0">' +
        '<span class="brand-mark">' + HD.icon('swap', 22) + '</span>' +
        '<div style="min-width:0"><div class="brand-name">' + HD.esc(t('appName')) + '</div>' +
        '<div class="brand-sub">' + HD.esc(t('brandSub')) + '</div></div>' +
      '</div>' +
      '<div class="appbar-actions">' +
        '<button class="lang-pill" id="langBtn">' + (state.lang === 'rw' ? 'EN' : 'RW') + '</button>' +
        '<button class="icon-btn" id="adminBtn" aria-label="' + HD.esc(t('nav_admin')) + '">' + HD.icon('shield', 19) + '</button>' +
      '</div>'
    el.appendChild(bar)

    const view = document.createElement('main')
    view.className = 'view' + (route.name === 'admin' ? ' no-tabs' : '')
    el.appendChild(view)

    ;(SCREENS[route.name] || SCREENS.home)(view, route.param)

    if (route.name !== 'admin') el.appendChild(tabbar(route.name))

    bar.querySelector('#langBtn').onclick = () => app.setLang(state.lang === 'rw' ? 'en' : 'rw')
    bar.querySelector('#adminBtn').onclick = () => app.go('#/admin')
    const brand = bar.querySelector('#brandHome')
    brand.onclick = () => app.go('#/')
    brand.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') app.go('#/') })

    window.scrollTo(0, 0)
  }

  window.addEventListener('hashchange', render)

  async function boot() {
    await HD.loadOperators()
    if (!location.hash) history.replaceState(null, '', '#/')
    render()
  }

  boot()
})()
