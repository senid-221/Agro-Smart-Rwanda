(function () {
const { makeT } = AS
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

AS.renderLogin = function (container, app) {
  const draw = () => {
    const lg = app.lang || 'rw'
    const tt = makeT(lg)
    container.innerHTML = `
      <div class="login">
        <button class="corner-lang" id="langCorner">${lg === 'rw' ? 'EN' : 'RW'}</button>
        <img class="logo" src="icon.png" alt="AgroSmart Rwanda" />
        <h1>${tt('appName')}</h1>
        <p class="tagline">${tt('login_sub')}</p>
        <div class="field">
          <label for="loginId">${tt('login_id')}</label>
          <input id="loginId" autocomplete="username" placeholder="AGRO-0001" />
        </div>
        <div class="field">
          <label for="loginPhone">${tt('login_phone')}</label>
          <input id="loginPhone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="07XX XXX XXX" />
        </div>
        <div class="err" id="loginErr"></div>
        <button class="btn btn-primary" id="loginBtn">${tt('login_btn')} →</button>
      </div>`
    container.querySelector('#langCorner').onclick = () => app.setLang(lg === 'rw' ? 'en' : 'rw')
    container.querySelector('#loginBtn').onclick = () => {
      const id = container.querySelector('#loginId').value.trim()
      const phone = container.querySelector('#loginPhone').value.replace(/[\s-]/g, '')
      const err = container.querySelector('#loginErr')
      if (!id) { err.textContent = tt('login_err_id'); return }
      if (!/^(\+?250|0)7\d{8}$/.test(phone)) { err.textContent = tt('login_err_phone'); return }
      app.login(id, phone)
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
      app.setLang(lg)
      app.setName(name)
      app.go('home')
    }
  }

  draw()
}

AS.renderSettings = function (container, app) {
  const tr = app.t()

  container.innerHTML = `
    <div class="section-title">${tr('settings_title')} <img class="ico" src="img/settings.png" alt=""></div>

    <div class="setting-row">
      <div>
        <div class="label"><img class="ico" src="img/id-card.png" alt=""> ${tr('settings_account')}</div>
        <div class="desc">${esc(app.user.id)} · ${esc(app.user.phone)}</div>
      </div>
    </div>

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
  container.querySelector('#resetRow').onclick = () => {
    if (confirm('OK?')) app.clearHistory()
  }
  container.querySelector('#logoutBtn').onclick = () => app.logout()
}
})()
