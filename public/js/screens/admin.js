// AgroSmart Rwanda — Admin dashboard.
// Full control panel: products & categories CRUD, site appearance
// (fonts/titles/subtitles/icons/accent), AI Doctor Kinyarwanda training
// (Q&A + glossary) and the AI provider/model configuration.
// Gated to users with role === 'admin' (see app.js loginAdmin).
(function () {
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

function fileToDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result)
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

AS.renderAdmin = function (container, app) {
  const tr = app.t()
  const lang = app.lang

  if (!app.user || app.user.role !== 'admin') {
    container.innerHTML = `<div class="empty-state"><span class="emoji">🔒</span>${tr('admin_denied')}</div>`
    return
  }

  let panel = 'menu'
  let state = null // cached /admin/state

  const load = () => AS.api.get('/admin/state').then(s => { state = s })

  const shell = () => {
    container.innerHTML = `
      <div class="admin-head">
        <button class="btn btn-outline sm" id="backBtn">← ${tr('admin_back')}</button>
        <div class="section-title" style="margin:0">${panel === 'menu' ? tr('admin_title') : tr('admin_' + panel)}</div>
      </div>
      <div id="adminBody"></div>`
    container.querySelector('#backBtn').onclick = () => {
      if (panel === 'menu') app.go('settings')
      else { panel = 'menu'; draw() }
    }
    renderPanel()
  }

  const draw = () => { shell() }

  const go = p => { panel = p; draw() }

  function renderPanel() {
    const body = container.querySelector('#adminBody')
    if (panel === 'menu') return renderMenu(body)
    if (panel === 'products') return renderProducts(body)
    if (panel === 'categories') return renderCategories(body)
    if (panel === 'appearance') return renderAppearance(body)
    if (panel === 'ai') return renderAI(body)
    if (panel === 'provider') return renderProvider(body)
  }

  // ---------- menu ----------
  function renderMenu(body) {
    const cards = [
      ['products', 'img/cart.png', 'admin_products_d'],
      ['categories', 'img/leaf.png', 'admin_categories_d'],
      ['appearance', 'img/settings.png', 'admin_appearance_d'],
      ['ai', 'img/chat.png', 'admin_ai_d'],
      ['provider', 'img/chemistry.png', 'admin_provider_d']
    ]
    body.innerHTML = `<div class="grid-2">` + cards.map(([k, ico, d]) => `
      <button class="feature-card" data-panel="${k}">
        <img class="fico" src="${ico}" alt="">
        <span class="label">${tr('admin_' + k)}</span>
        <span class="desc">${tr(d)}</span>
      </button>`).join('') + `</div>`
    body.querySelectorAll('[data-panel]').forEach(b => (b.onclick = () => go(b.dataset.panel)))
  }

  // ---------- products ----------
  function renderProducts(body) {
    const cats = AS.CATALOG.categories()
    body.innerHTML = `
      <button class="btn btn-primary sm" id="addP">+ ${tr('admin_add_product')}</button>
      <div id="pForm"></div>
      <div class="section-title">${tr('admin_products_list')}</div>
      <div id="pList"></div>`

    const list = body.querySelector('#pList')
    const all = AS.CATALOG.products()
    const customIds = new Set((state.products || []).map(p => p.id))
    all.forEach(p => {
      const row = document.createElement('div')
      row.className = 'list-row'
      const thumb = p.img
        ? `<img class="thumb" src="${esc(p.img)}" alt="">`
        : `<img class="thumb" src="img/products/${esc(p.id)}.png" alt="" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'emoji',textContent:'${p.emoji || '🧺'}'}))">`
      row.innerHTML = `${thumb}
        <span class="body"><span class="name">${esc(p[lang] || p.en)}</span>
        <span class="meta">${AS.fmtRWF(p.price)} · ${esc(p.cat)}${customIds.has(p.id) ? ' · ✏️' : ''}</span></span>`
      const actions = document.createElement('span')
      actions.className = 'row-actions'
      const edit = document.createElement('button'); edit.className = 'mini-btn'; edit.textContent = tr('admin_edit')
      edit.onclick = () => productForm(p)
      actions.appendChild(edit)
      if (customIds.has(p.id)) {
        const del = document.createElement('button'); del.className = 'mini-btn danger'; del.textContent = tr('admin_delete')
        del.onclick = async () => { await AS.api.post('/admin/product/delete', { id: p.id }); await load(); draw() }
        actions.appendChild(del)
      }
      row.appendChild(actions)
      list.appendChild(row)
    })

    body.querySelector('#addP').onclick = () => productForm(null)

    function productForm(p) {
      const isNew = !p
      const f = p ? Object.assign({}, p) : { id: '', cat: 'seeds', en: '', rw: '', price: 0, unit: { en: 'piece', rw: 'igikoresho 1' }, emoji: '', img: '' }
      const wrap = body.querySelector('#pForm')
      wrap.innerHTML = `
        <div class="card form">
          <div class="form-title">${isNew ? tr('admin_add_product') : tr('admin_edit')}: ${esc(f.id)}</div>
          <label>${tr('admin_id')}<input id="f_id" value="${esc(f.id)}" ${isNew ? '' : 'disabled'} placeholder="e.g. seed-maize-2"></label>
          <label>${tr('admin_cat')}<select id="f_cat">${cats.map(c => `<option value="${esc(c.id)}" ${c.id === f.cat ? 'selected' : ''}>${esc(c[lang] || c.en)}</option>`).join('')}</select></label>
          <label>${tr('admin_name_en')}<input id="f_en" value="${esc(f.en)}"></label>
          <label>${tr('admin_name_rw')}<input id="f_rw" value="${esc(f.rw)}"></label>
          <label>${tr('admin_price')}<input id="f_price" type="number" value="${esc(f.price)}"></label>
          <div class="two">
            <label>${tr('admin_unit_en')}<input id="f_uen" value="${esc(f.unit.en)}"></label>
            <label>${tr('admin_unit_rw')}<input id="f_urw" value="${esc(f.unit.rw)}"></label>
          </div>
          <label>${tr('admin_emoji')}<input id="f_emoji" value="${esc(f.emoji)}" placeholder="🌽"></label>
          <label>${tr('admin_photo')}<input id="f_img" type="file" accept="image/*"></label>
          <div class="img-prev">${f.img ? `<img src="${esc(f.img)}" alt="">` : ''}</div>
          <div class="form-row">
            <button class="btn btn-primary sm" id="f_save">${tr('admin_save')}</button>
            <button class="btn btn-outline sm" id="f_cancel">${tr('admin_cancel')}</button>
          </div>
          <div class="err" id="f_err"></div>
        </div>`
      const imgInput = wrap.querySelector('#f_img')
      imgInput.onchange = async () => {
        const file = imgInput.files && imgInput.files[0]
        if (!file) return
        f.img = await fileToDataURL(file)
        wrap.querySelector('.img-prev').innerHTML = `<img src="${esc(f.img)}" alt="">`
      }
      wrap.querySelector('#f_cancel').onclick = () => { wrap.innerHTML = '' }
      wrap.querySelector('#f_save').onclick = async () => {
        const id = wrap.querySelector('#f_id').value.trim()
        const err = wrap.querySelector('#f_err')
        if (!id) { err.textContent = tr('admin_err_id'); return }
        const product = {
          id, cat: wrap.querySelector('#f_cat').value,
          en: wrap.querySelector('#f_en').value.trim(),
          rw: wrap.querySelector('#f_rw').value.trim(),
          price: Number(wrap.querySelector('#f_price').value) || 0,
          unit: { en: wrap.querySelector('#f_uen').value.trim(), rw: wrap.querySelector('#f_urw').value.trim() },
          emoji: wrap.querySelector('#f_emoji').value.trim(),
          img: f.img || ''
        }
        await AS.api.post('/admin/product/save', { product })
        await load(); draw()
      }
      wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }

  // ---------- categories ----------
  function renderCategories(body) {
    body.innerHTML = `
      <button class="btn btn-primary sm" id="addC">+ ${tr('admin_add_cat')}</button>
      <div id="cForm"></div>
      <div class="section-title">${tr('admin_cat_list')}</div>
      <div id="cList"></div>`
    const list = body.querySelector('#cList')
    const customIds = new Set((state.categories || []).map(c => c.id))
    AS.CATALOG.categories().forEach(c => {
      const row = document.createElement('div')
      row.className = 'list-row'
      row.innerHTML = `<span class="emoji">${esc(c.emoji || '🧺')}</span>
        <span class="body"><span class="name">${esc(c[lang] || c.en)}</span>
        <span class="meta">${esc(c.id)}${customIds.has(c.id) ? ' · ✏️' : ''}</span></span>`
      const actions = document.createElement('span'); actions.className = 'row-actions'
      const edit = document.createElement('button'); edit.className = 'mini-btn'; edit.textContent = tr('admin_edit')
      edit.onclick = () => catForm(c); actions.appendChild(edit)
      if (customIds.has(c.id)) {
        const del = document.createElement('button'); del.className = 'mini-btn danger'; del.textContent = tr('admin_delete')
        del.onclick = async () => { await AS.api.post('/admin/category/delete', { id: c.id }); await load(); draw() }
        actions.appendChild(del)
      }
      row.appendChild(actions); list.appendChild(row)
    })
    body.querySelector('#addC').onclick = () => catForm(null)

    function catForm(c) {
      const isNew = !c
      const f = c ? Object.assign({}, c) : { id: '', emoji: '🧺', en: '', rw: '' }
      const wrap = body.querySelector('#cForm')
      wrap.innerHTML = `
        <div class="card form">
          <div class="form-title">${isNew ? tr('admin_add_cat') : tr('admin_edit')}</div>
          <label>${tr('admin_id')}<input id="c_id" value="${esc(f.id)}" ${isNew ? '' : 'disabled'} placeholder="e.g. dairy"></label>
          <label>${tr('admin_emoji')}<input id="c_emoji" value="${esc(f.emoji)}"></label>
          <label>${tr('admin_name_en')}<input id="c_en" value="${esc(f.en)}"></label>
          <label>${tr('admin_name_rw')}<input id="c_rw" value="${esc(f.rw)}"></label>
          <div class="form-row">
            <button class="btn btn-primary sm" id="c_save">${tr('admin_save')}</button>
            <button class="btn btn-outline sm" id="c_cancel">${tr('admin_cancel')}</button>
          </div>
        </div>`
      wrap.querySelector('#c_cancel').onclick = () => { wrap.innerHTML = '' }
      wrap.querySelector('#c_save').onclick = async () => {
        const id = wrap.querySelector('#c_id').value.trim()
        if (!id) return
        await AS.api.post('/admin/category/save', {
          category: {
            id, emoji: wrap.querySelector('#c_emoji').value.trim(),
            en: wrap.querySelector('#c_en').value.trim(), rw: wrap.querySelector('#c_rw').value.trim()
          }
        })
        await load(); draw()
      }
    }
  }

  // ---------- appearance ----------
  function renderAppearance(body) {
    const t = state.theme || {}
    body.innerHTML = `
      <div class="card form">
        <div class="form-title">${tr('admin_appearance')}</div>
        <div class="two">
          <label>${tr('admin_title_en')}<input id="t_titleEn" value="${esc(t.titleEn)}"></label>
          <label>${tr('admin_title_rw')}<input id="t_titleRw" value="${esc(t.titleRw)}"></label>
        </div>
        <div class="two">
          <label>${tr('admin_sub_en')}<input id="t_subEn" value="${esc(t.subEn)}"></label>
          <label>${tr('admin_sub_rw')}<input id="t_subRw" value="${esc(t.subRw)}"></label>
        </div>
        <label>${tr('admin_font')}
          <select id="t_font">
            <option value="">${tr('admin_font_default')}</option>
            ${['Georgia, serif', 'Verdana, sans-serif', "'Trebuchet MS', sans-serif", "'Courier New', monospace", 'system-ui, sans-serif', "'Times New Roman', serif"]
              .map(f => `<option value="${esc(f)}" ${t.font === f ? 'selected' : ''}>${esc(f)}</option>`).join('')}
          </select>
        </label>
        <label>${tr('admin_accent')}<input id="t_accent" type="color" value="${esc(t.accent || '#1b5e20')}"></label>
        <label>${tr('admin_icon')} (favicon)<input id="t_icon" type="file" accept="image/*"></label>
        <label>${tr('admin_logo')}<input id="t_logo" type="file" accept="image/*"></label>
        <div class="img-prev">${t.icon ? `<img src="${esc(t.icon)}" alt="">` : ''}${t.logo ? `<img src="${esc(t.logo)}" alt="">` : ''}</div>
        <div class="form-row">
          <button class="btn btn-primary sm" id="t_save">${tr('admin_save')}</button>
          <button class="btn btn-outline sm" id="t_reset">${tr('admin_reset_theme')}</button>
        </div>
        <div class="progress-note" id="t_note"></div>
      </div>`
    let icon = t.icon || '', logo = t.logo || ''
    body.querySelector('#t_icon').onchange = async e => {
      const f = e.target.files && e.target.files[0]; if (!f) return
      icon = await fileToDataURL(f); refreshPrev()
    }
    body.querySelector('#t_logo').onchange = async e => {
      const f = e.target.files && e.target.files[0]; if (!f) return
      logo = await fileToDataURL(f); refreshPrev()
    }
    function refreshPrev() {
      body.querySelector('.img-prev').innerHTML =
        (icon ? `<img src="${esc(icon)}" alt="">` : '') + (logo ? `<img src="${esc(logo)}" alt="">` : '')
    }
    body.querySelector('#t_reset').onclick = async () => {
      await AS.api.post('/admin/theme/save', { theme: { titleEn: '', titleRw: '', subEn: '', subRw: '', font: '', accent: '', icon: '', logo: '' } })
      app.applyTheme(); await load(); draw()
    }
    body.querySelector('#t_save').onclick = async () => {
      const theme = {
        titleEn: body.querySelector('#t_titleEn').value,
        titleRw: body.querySelector('#t_titleRw').value,
        subEn: body.querySelector('#t_subEn').value,
        subRw: body.querySelector('#t_subRw').value,
        font: body.querySelector('#t_font').value,
        accent: body.querySelector('#t_accent').value,
        icon, logo
      }
      await AS.api.post('/admin/theme/save', { theme })
      app.applyTheme()
      body.querySelector('#t_note').textContent = tr('admin_saved')
      await load()
    }
  }

  // ---------- AI doctor training ----------
  function renderAI(body) {
    body.innerHTML = `
      <div class="tabs">
        <button class="tab active" data-t="qa">${tr('admin_qa')}</button>
        <button class="tab" data-t="gl">${tr('admin_glossary')}</button>
      </div>
      <div id="aiPane"></div>`
    let sub = 'qa'
    body.querySelectorAll('[data-t]').forEach(b => (b.onclick = () => {
      sub = b.dataset.t
      body.querySelectorAll('[data-t]').forEach(x => x.classList.toggle('active', x === b))
      pane()
    }))
    pane()

    function pane() {
      const p = body.querySelector('#aiPane')
      if (sub === 'qa') return qaPane(p)
      return glossPane(p)
    }

    function qaPane(p) {
      p.innerHTML = `
        <p class="progress-note">${tr('admin_qa_hint')}</p>
        <button class="btn btn-primary sm" id="addQ">+ ${tr('admin_add_qa')}</button>
        <div id="qForm"></div>
        <div id="qList"></div>`
      const list = p.querySelector('#qList')
      ;(state.qa || []).forEach(x => {
        const row = document.createElement('div'); row.className = 'list-row qa-row'
        row.innerHTML = `<span class="body"><span class="name">${esc(x.q)}</span><span class="meta">${esc(x.a)}</span></span>`
        const act = document.createElement('span'); act.className = 'row-actions'
        const e = document.createElement('button'); e.className = 'mini-btn'; e.textContent = tr('admin_edit'); e.onclick = () => qForm(x); act.appendChild(e)
        const d = document.createElement('button'); d.className = 'mini-btn danger'; d.textContent = tr('admin_delete')
        d.onclick = async () => { await AS.api.post('/admin/qa/delete', { id: x.id }); await load(); draw() }; act.appendChild(d)
        row.appendChild(act); list.appendChild(row)
      })
      p.querySelector('#addQ').onclick = () => qForm(null)
      function qForm(x) {
        const f = x || { q: '', a: '', qEn: '', aEn: '' }
        const w = p.querySelector('#qForm')
        w.innerHTML = `<div class="card form">
          <label>${tr('admin_q_rw')}<input id="q_q" value="${esc(f.q)}"></label>
          <label>${tr('admin_a_rw')}<textarea id="q_a" rows="3">${esc(f.a)}</textarea></label>
          <label>${tr('admin_q_en')}<input id="q_qen" value="${esc(f.qEn)}"></label>
          <label>${tr('admin_a_en')}<textarea id="q_aen" rows="2">${esc(f.aEn)}</textarea></label>
          <div class="form-row">
            <button class="btn btn-primary sm" id="q_save">${tr('admin_save')}</button>
            <button class="btn btn-outline sm" id="q_cancel">${tr('admin_cancel')}</button>
          </div></div>`
        w.querySelector('#q_cancel').onclick = () => { w.innerHTML = '' }
        w.querySelector('#q_save').onclick = async () => {
          await AS.api.post('/admin/qa/save', { item: { id: f.id, q: w.querySelector('#q_q').value, a: w.querySelector('#q_a').value, qEn: w.querySelector('#q_qen').value, aEn: w.querySelector('#q_aen').value } })
          await load(); draw()
        }
      }
    }

    function glossPane(p) {
      p.innerHTML = `
        <p class="progress-note">${tr('admin_gloss_hint')}</p>
        <button class="btn btn-primary sm" id="addG">+ ${tr('admin_add_gloss')}</button>
        <div id="gForm"></div>
        <div id="gList"></div>`
      const list = p.querySelector('#gList')
      ;(state.glossary || []).forEach(x => {
        const row = document.createElement('div'); row.className = 'list-row qa-row'
        row.innerHTML = `<span class="body"><span class="name">${esc(x.term)}</span><span class="meta">${esc(x.def)}</span></span>`
        const act = document.createElement('span'); act.className = 'row-actions'
        const e = document.createElement('button'); e.className = 'mini-btn'; e.textContent = tr('admin_edit'); e.onclick = () => gForm(x); act.appendChild(e)
        const d = document.createElement('button'); d.className = 'mini-btn danger'; d.textContent = tr('admin_delete')
        d.onclick = async () => { await AS.api.post('/admin/glossary/delete', { id: x.id }); await load(); draw() }; act.appendChild(d)
        row.appendChild(act); list.appendChild(row)
      })
      p.querySelector('#addG').onclick = () => gForm(null)
      function gForm(x) {
        const f = x || { term: '', def: '', defEn: '' }
        const w = p.querySelector('#gForm')
        w.innerHTML = `<div class="card form">
          <label>${tr('admin_term')}<input id="g_term" value="${esc(f.term)}"></label>
          <label>${tr('admin_def_rw')}<textarea id="g_def" rows="2">${esc(f.def)}</textarea></label>
          <label>${tr('admin_def_en')}<textarea id="g_defen" rows="2">${esc(f.defEn)}</textarea></label>
          <div class="form-row">
            <button class="btn btn-primary sm" id="g_save">${tr('admin_save')}</button>
            <button class="btn btn-outline sm" id="g_cancel">${tr('admin_cancel')}</button>
          </div></div>`
        w.querySelector('#g_cancel').onclick = () => { w.innerHTML = '' }
        w.querySelector('#g_save').onclick = async () => {
          await AS.api.post('/admin/glossary/save', { item: { id: f.id, term: w.querySelector('#g_term').value, def: w.querySelector('#g_def').value, defEn: w.querySelector('#g_defen').value } })
          await load(); draw()
        }
      }
    }
  }

  // ---------- provider ----------
  function renderProvider(body) {
    const p = state.provider || {}
    body.innerHTML = `
      <div class="card form">
        <div class="form-title">${tr('admin_provider')}</div>
        <label>${tr('admin_mode')}
          <select id="pv_mode">
            <option value="builtin" ${p.mode !== 'remote' ? 'selected' : ''}>${tr('admin_mode_builtin')}</option>
            <option value="remote" ${p.mode === 'remote' ? 'selected' : ''}>${tr('admin_mode_remote')}</option>
          </select>
        </label>
        <label>${tr('admin_provider_name')}<input id="pv_name" value="${esc(p.name)}"></label>
        <label>${tr('admin_model')}<input id="pv_model" value="${esc(p.model)}" placeholder="gpt-4o-mini / llama-3 ..."></label>
        <label>${tr('admin_api_url')}<input id="pv_url" value="${esc(p.apiUrl)}" placeholder="https://api.openai.com/v1/chat/completions"></label>
        <label>${tr('admin_api_key')}<input id="pv_key" type="password" value="${esc(p.apiKey)}"></label>
        <label class="check"><input id="pv_req" type="checkbox" ${p.requireRemote ? 'checked' : ''}> ${tr('admin_require_remote')}</label>
        <label class="check"><input id="pv_res" type="checkbox" ${p.researchOnline ? 'checked' : ''}> ${tr('admin_research_online')}</label>
        <p class="progress-note">${tr('admin_research_hint')}</p>
        <p class="progress-note">${tr('admin_provider_hint')}</p>
        <div class="form-row">
          <button class="btn btn-primary sm" id="pv_save">${tr('admin_save')}</button>
          <button class="btn btn-outline sm" id="pv_test">${tr('admin_test')}</button>
        </div>
        <div class="progress-note" id="pv_note"></div>
      </div>`
    const note = body.querySelector('#pv_note')
    body.querySelector('#pv_save').onclick = async () => {
      await AS.api.post('/admin/provider/save', {
        provider: {
          mode: body.querySelector('#pv_mode').value,
          name: body.querySelector('#pv_name').value,
          model: body.querySelector('#pv_model').value,
          apiUrl: body.querySelector('#pv_url').value.trim(),
          apiKey: body.querySelector('#pv_key').value,
          requireRemote: body.querySelector('#pv_req').checked,
          researchOnline: body.querySelector('#pv_res').checked
        }
      })
      await load()
      note.textContent = tr('admin_saved')
    }
    body.querySelector('#pv_test').onclick = async () => {
      note.textContent = tr('admin_testing')
      const res = await AS.aiChat(lang === 'rw' ? 'Muraho' : 'Hello', lang, {})
      note.textContent = (res && res.text ? '✓ ' : '✗ ') + (res && res.intent ? res.intent : 'error') + ': ' + (res && res.text ? res.text.slice(0, 80) : '')
    }
  }

  load().then(draw)
}
})()
