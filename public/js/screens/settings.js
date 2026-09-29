(function () {
const { makeT } = AS
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

AS.renderLogin = function (container, app) {
  let mode = 'login'
  const draft = { id: '', phone: '', pin: '' }

  const draw = () => {
    const lg = app.lang || 'rw'
    const tt = makeT(lg)
    const signup = mode === 'signup'
    const admin = mode === 'admin'
    const subKey = admin ? 'auth_admin_sub' : signup ? 'auth_signup_sub' : 'login_sub'
    const btnKey = admin ? 'auth_admin_btn' : signup ? 'auth_signup_btn' : 'login_btn'
    const hintKey = admin ? 'auth_hint_admin' : signup ? 'auth_hint_signup' : 'auth_hint_login'
    container.innerHTML = `
      <div class="login">
        <button class="corner-lang" id="langCorner">${lg === 'rw' ? 'EN' : 'RW'}</button>
        <img class="logo" src="icon.png" alt="AgroSmart Rwanda" />
        <h1>${tt('appName')}</h1>
        <p class="tagline">${tt(subKey)}</p>
        <div class="auth-tabs">
          <button class="auth-tab ${mode === 'login' ? 'active' : ''}" id="tabLogin">${tt('auth_tab_login')}</button>
          <button class="auth-tab ${signup ? 'active' : ''}" id="tabSignup">${tt('auth_tab_signup')}</button>
          <button class="auth-tab ${admin ? 'active' : ''}" id="tabAdmin">${tt('auth_tab_admin')}</button>
        </div>
        <div class="auth-card">
          <div class="field">
            <img class="f-ico" src="img/id-card.png" alt="">
            <input id="loginId" autocomplete="username" placeholder="${tt('login_id')}" value="${esc(draft.id)}" />
          </div>
          <div class="field">
            <img class="f-ico" src="img/phone.png" alt="">
            <input id="loginPhone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="${tt('login_phone')}" value="${esc(draft.phone)}" />
          </div>
          ${admin ? `<div class="field">
            <img class="f-ico" src="img/settings.png" alt="">
            <input id="loginPin" type="password" inputmode="numeric" autocomplete="off" placeholder="${tt('login_pin')}" value="${esc(draft.pin)}" />
          </div>` : ''}
          <div class="err" id="loginErr"></div>
          <button class="btn btn-primary" id="loginBtn">${tt(btnKey)} →</button>
          <p class="auth-hint">${tt(hintKey)}</p>
        </div>
      </div>`

    const readDraft = () => {
      draft.id = container.querySelector('#loginId').value
      draft.phone = container.querySelector('#loginPhone').value
      const pinEl = container.querySelector('#loginPin')
      if (pinEl) draft.pin = pinEl.value
    }
    const setMode = m => { if (mode !== m) { readDraft(); mode = m; draw() } }
    container.querySelector('#langCorner').onclick = () => { readDraft(); app.setLang(lg === 'rw' ? 'en' : 'rw') }
    container.querySelector('#tabLogin').onclick = () => setMode('login')
    container.querySelector('#tabSignup').onclick = () => setMode('signup')
    container.querySelector('#tabAdmin').onclick = () => setMode('admin')
    container.querySelector('#loginBtn').onclick = () => {
      const id = container.querySelector('#loginId').value.trim()
      const phone = container.querySelector('#loginPhone').value.replace(/[\s-]/g, '')
      const err = container.querySelector('#loginErr')
      if (!id) { err.textContent = tt('login_err_id'); return }
      if (!/^(\+?250|0)7\d{8}$/.test(phone)) { err.textContent = tt('login_err_phone'); return }
      if (admin) {
        const pin = container.querySelector('#loginPin').value.trim()
        if (!pin) { err.textContent = tt('login_err_pin'); return }
        const problem = app.loginAdmin(id, phone, pin)
        if (problem === 'badpin') err.textContent = tt('auth_err_badpin')
        return
      }
      const problem = signup ? app.signup(id, phone) : app.login(id, phone)
      if (problem === 'notfound') err.textContent = tt('auth_err_notfound')
      if (problem === 'exists') err.textContent = tt('auth_err_exists')
    }
  }

  draw()
}

AS.renderOnboarding = function (container, app) {
  let lg = app.lang || 'rw'
  let typed = app.name || ''

  const draw = () => {
    const tt = makeT(lg)
    container.innerHTML = `
    <div class="onboarding">
      <button class="corner-lang" id="langCorner">${lg === 'rw' ? 'EN' : 'RW'}</button>
      <img class="logo" src="icon.png" alt="AgroSmart Rwanda" />
      <h1>${tt('appName')}</h1>
      <p class="tagline">${tt('tagline')}</p>
      <input class="name-input" id="nameInput" placeholder="${tt('your_name')}" value="${esc(typed)}" autocomplete="given-name" />
      <div class="onb-features">
        <div class="onb-feature"><span class="emoji"><img class="onb-ico" src="img/camera.png" alt=""></span><span><span class="t">${tt('onb_f1_t')}</span><br><span class="d">${tt('onb_f1_d')}</span></span></div>
        <div class="onb-feature"><span class="emoji">🌍</span><span><span class="t">${tt('onb_f2_t')}</span><br><span class="d">${tt('onb_f2_d')}</span></span></div>
        <div class="onb-feature"><span class="emoji"><img class="onb-ico" src="img/book.png" alt=""></span><span><span class="t">${tt('onb_f3_t')}</span><br><span class="d">${tt('onb_f3_d')}</span></span></div>
      </div>
      <button class="btn btn-primary" id="startBtn">${tt('onb_start')} →</button>
    </div>`
    container.querySelector('#langCorner').onclick = () => {
      typed = container.querySelector('#nameInput').value
      lg = lg === 'rw' ? 'en' : 'rw'
      draw()
    }
    container.querySelector('#startBtn').onclick = () => {
      const name = (container.querySelector('#nameInput').value || '').trim()
      app.setOnboarded()
      app.setLang(lg)
      app.setName(name)
      app.go('home')
    }
  }

  draw()
}

AS.renderSettings = function (container, app) {
  const tr = app.t()
  const isAdmin = app.user && app.user.role === 'admin'

  container.innerHTML = `
    <div class="section-title">${tr('settings_title')} <img class="ico" src="img/settings.png" alt=""></div>

    <div class="setting-row">
      <div>
        <div class="label"><img class="ico" src="img/id-card.png" alt=""> ${tr('settings_account')}</div>
        <div class="desc">${esc(app.user.id)} · ${esc(app.user.phone)}${isAdmin ? ' · ' + tr('admin_role') : ''}</div>
      </div>
    </div>

    <div class="setting-row" id="dashRow" style="cursor:pointer">
      <div>
        <div class="label"><img class="ico" src="img/home.png" alt=""> ${tr('dash_title')}</div>
        <div class="desc">${tr('dash_desc')}</div>
      </div>
      <span class="arrow">›</span>
    </div>

    ${isAdmin ? `<div class="setting-row" id="adminRow" style="cursor:pointer">
      <div>
        <div class="label"><img class="ico" src="img/settings.png" alt=""> ${tr('admin_title')}</div>
        <div class="desc">${tr('admin_desc')}</div>
      </div>
      <span class="arrow">›</span>
    </div>` : ''}

    <div class="setting-row">
      <div>
        <div class="label"><img class="ico" src="img/user.png" alt=""> ${tr('your_name')}</div>
        <div class="desc">${tr('settings_name_desc')}</div>
      </div>
      <input class="name-input" id="nameInput" value="${esc(app.name || '')}" placeholder="${tr('your_name')}" />
    </div>

    <div class="setting-row" id="installRow" style="cursor:pointer">
      <div>
        <div class="label"><img class="ico" src="img/download.png" alt=""> ${tr('settings_install')}</div>
        <div class="desc">${AS.isInstalled() ? tr('settings_installed') : tr('settings_install_desc')}</div>
      </div>
      <span class="arrow">›</span>
    </div>

    <div class="setting-row" id="moreRow" style="cursor:pointer">
      <div>
        <div class="label"><img class="ico" src="img/chemistry.png" alt=""> ${tr('fert_title')}</div>
        <div class="desc">${tr('fert_sub')}</div>
      </div>
      <span class="arrow">›</span>
    </div>

    <div class="setting-row" id="ordersRow" style="cursor:pointer">
      <div>
        <div class="label"><img class="ico" src="img/cart.png" alt=""> ${tr('store_orders')}</div>
        <div class="desc">${tr('orders_desc')}</div>
      </div>
      <span class="arrow">›</span>
    </div>

    <div class="setting-row" id="resetRow" style="cursor:pointer">
      <div>
        <div class="label"><img class="ico" src="img/trash.png" alt=""> ${tr('settings_reset')}</div>
      </div>
      <span class="arrow">›</span>
    </div>

    <button class="btn btn-outline" id="logoutBtn" style="margin-top:14px">
      <img class="btn-ico" src="img/logout.png" alt=""> ${tr('settings_logout')}
    </button>

    <div class="card" style="margin-top:16px">
      <div class="label" style="font-weight:700;margin-bottom:6px"><img class="ico" src="img/info.png" alt=""> ${tr('settings_about')}</div>
      <p style="font-size:13px;color:var(--text-soft)">${tr('settings_about_text')}</p>
      <p class="progress-note" style="margin-top:6px">${tr('credits')}</p>
    </div>
    <p class="progress-note" style="text-align:center;margin-top:14px">🌿 ${tr('appName')} · ${tr('settings_version')}</p>
  `

  const nameInput = container.querySelector('#nameInput')
  nameInput.onchange = () => app.setName(nameInput.value.trim())
  container.querySelector('#dashRow').onclick = () => app.go('dashboard')
  if (isAdmin) container.querySelector('#adminRow').onclick = () => app.go('admin')
  container.querySelector('#installRow').onclick = async () => {
    const ev = window.__installEvent
    if (ev) {
      ev.prompt()
      await ev.userChoice
      window.__installEvent = null
      app.go('settings')
      return
    }
    if (AS.isInstalled()) return
    const existing = container.querySelector('#installHelp')
    if (existing) { existing.remove(); return }
    const help = document.createElement('div')
    help.id = 'installHelp'
    help.className = 'tip-card'
    help.innerHTML = `<b>${tr('install_help_t')}</b><br>${tr('install_help_android')}<br>${tr('install_help_ios')}<br><span class="progress-note">${tr('install_help_note')}</span>`
    container.querySelector('#installRow').after(help)
  }
  container.querySelector('#moreRow').onclick = () => app.go('fertilizer')
  container.querySelector('#ordersRow').onclick = () => app.go('orders')
  container.querySelector('#resetRow').onclick = () => {
    if (confirm('OK?')) app.clearHistory()
  }
  container.querySelector('#logoutBtn').onclick = () => app.logout()
}
})()
