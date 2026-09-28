(function () {
const { makeT } = AS

AS.renderOnboarding = function (container, app) {
  let chosen = app.lang || 'rw'

  const draw = () => {
    const tt = makeT(chosen)
    container.innerHTML = `
      <div class="onboarding">
        <img class="logo" src="icon.png" alt="AgroSmart Rwanda" />
        <h1>${tt('appName')}</h1>
        <p class="tagline">${tt('tagline')}</p>
        <div class="lang-picker">
          <button class="lang-option ${chosen === 'rw' ? 'active' : ''}" data-lang="rw">Ikinyarwanda</button>
          <button class="lang-option ${chosen === 'en' ? 'active' : ''}" data-lang="en">English</button>
        </div>
        <div class="onb-features">
          <div class="onb-feature"><span class="emoji">📷</span><span><span class="t">${tt('onb_f1_t')}</span><br><span class="d">${tt('onb_f1_d')}</span></span></div>
          <div class="onb-feature"><span class="emoji">🌍</span><span><span class="t">${tt('onb_f2_t')}</span><br><span class="d">${tt('onb_f2_d')}</span></span></div>
          <div class="onb-feature"><span class="emoji">📖</span><span><span class="t">${tt('onb_f3_t')}</span><br><span class="d">${tt('onb_f3_d')}</span></span></div>
        </div>
        <button class="btn btn-primary" id="startBtn">${tt('onb_start')} →</button>
      </div>`
    container.querySelectorAll('[data-lang]').forEach(b => {
      b.onclick = () => {
        chosen = b.dataset.lang
        app.setLang(chosen) // re-renders onboarding in chosen language until Start
      }
    })
    container.querySelector('#startBtn').onclick = () => {
      app.setLang(chosen)
      app.go('home')
    }
  }

  draw()
}

AS.renderSettings = function (container, app) {
  const tr = app.t()
  const lang = app.lang

  container.innerHTML = `
    <div class="section-title">${tr('settings_title')} ⚙️</div>

    <div class="setting-row">
      <div>
        <div class="label">🌐 ${tr('settings_lang')}</div>
        <div class="desc">${tr('settings_lang_desc')}</div>
      </div>
      <div class="chip-row" style="flex-wrap:nowrap">
        <button class="chip ${lang === 'rw' ? 'active' : ''}" data-l="rw">RW</button>
        <button class="chip ${lang === 'en' ? 'active' : ''}" data-l="en">EN</button>
      </div>
    </div>

    <div class="setting-row" id="installRow" style="cursor:pointer">
      <div>
        <div class="label">📲 ${tr('settings_install')}</div>
        <div class="desc">${window.__installEvent ? tr('settings_install_desc') : tr('settings_installed')}</div>
      </div>
      <span class="arrow">›</span>
    </div>

    <div class="setting-row" id="moreRow" style="cursor:pointer">
      <div>
        <div class="label">🧪 ${tr('fert_title')}</div>
        <div class="desc">${tr('fert_sub')}</div>
      </div>
      <span class="arrow">›</span>
    </div>

    <div class="setting-row" id="resetRow" style="cursor:pointer">
      <div>
        <div class="label">🗑️ ${tr('settings_reset')}</div>
      </div>
      <span class="arrow">›</span>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="label" style="font-weight:700;margin-bottom:6px">ℹ️ ${tr('settings_about')}</div>
      <p style="font-size:13px;color:var(--text-soft)">${tr('settings_about_text')}</p>
    </div>
    <p class="progress-note" style="text-align:center;margin-top:14px">🌿 ${tr('appName')} · ${tr('settings_version')}</p>
  `

  container.querySelectorAll('[data-l]').forEach(b => (b.onclick = () => app.setLang(b.dataset.l)))
  container.querySelector('#installRow').onclick = async () => {
    const ev = window.__installEvent
    if (ev) { ev.prompt(); await ev.userChoice; window.__installEvent = null; app.go('settings') }
  }
  container.querySelector('#moreRow').onclick = () => app.go('fertilizer')
  container.querySelector('#resetRow').onclick = () => {
    if (confirm('OK?')) app.clearHistory()
  }
}
})()
