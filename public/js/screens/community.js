// AgroSmart Rwanda — Community farmer Q&A board.
// Real posts and replies from the database. Nothing is fabricated: an empty
// board shows an honest empty state and invites the first question.
(function () {
  const esc = AS.esc

  AS.renderCommunity = function (container, app) {
    const tr = app.t()
    const lang = app.lang === 'en' ? 'en' : 'rw'
    const prefs = app.prefs()

    container.innerHTML = `
      <div class="cm-new">
        <button class="btn btn-primary" id="askBtn">${AS.icon('plus', 17)} ${esc(tr('cm_ask'))}</button>
      </div>
      <div id="cmList"><div class="empty-state" style="padding:40px"><span class="emoji">⏳</span>${esc(tr('cm_loading'))}</div></div>
    `

    const listEl = container.querySelector('#cmList')

    const ago = ts => AS.ago(lang, ts)
    const districtLabel = id => { const d = id && AS.district(id); return d ? d[lang] : (id || '') }
    const cropLabel = id => (AS.CROPS[id] || {})[lang] || id || ''

    const draw = posts => {
      if (!container.isConnected) return
      if (!posts.length) {
        listEl.innerHTML = `<div class="card empty-state"><span class="emoji">🌾</span>${esc(tr('cm_empty'))}</div>`
        return
      }
      listEl.innerHTML = posts.map(p => `
        <button class="cm-post" data-id="${p.id}">
          <span class="cm-top">
            <span class="cm-title">${esc(p.title)}</span>
            ${p.status === 'answered' ? `<span class="cm-badge ans">${esc(tr('cm_answered'))}</span>` : `<span class="cm-badge">${esc(tr('cm_open'))}</span>`}
          </span>
          <span class="cm-body">${esc(p.body.slice(0, 140))}${p.body.length > 140 ? '…' : ''}</span>
          <span class="cm-meta">
            <span class="cm-who">${esc(p.author)}</span>
            ${p.crop ? `<span class="cm-chip">${esc(cropLabel(p.crop))}</span>` : ''}
            ${p.district ? `<span class="cm-chip">${esc(districtLabel(p.district))}</span>` : ''}
            <span class="cm-replies">${AS.icon('chat', 13)}${p.replies}</span>
            <span class="cm-when">${esc(ago(p.at))}</span>
          </span>
        </button>`).join('')
      listEl.querySelectorAll('[data-id]').forEach(b => {
        b.onclick = () => openPost(Number(b.dataset.id))
      })
    }

    const load = async () => {
      const r = await AS.api.get('/community')
      if (!container.isConnected) return
      if (r && !r.error && r.posts) draw(r.posts)
      else listEl.innerHTML = `<div class="card empty-state"><span class="emoji">⚠️</span>${esc(tr('cm_fail'))}</div>`
    }

    // ---- compose a new post (modal sheet) ----
    const openComposer = () => {
      const host = document.createElement('div')
      host.className = 'cm-overlay'
      host.innerHTML = `
        <div class="cm-sheet">
          <div class="cm-sheet-head">
            <span>${esc(tr('cm_ask'))}</span>
            <button class="icon-btn" id="cmClose">${AS.icon('x', 20)}</button>
          </div>
          <input class="cm-input" id="cmTitle" maxlength="160" placeholder="${esc(tr('cm_title_ph'))}">
          <textarea class="cm-input cm-area" id="cmBody" maxlength="4000" placeholder="${esc(tr('cm_body_ph'))}"></textarea>
          <button class="btn btn-primary" id="cmSend" style="width:100%">${esc(tr('cm_post'))}</button>
        </div>`
      document.body.appendChild(host)
      const close = () => host.remove()
      host.querySelector('#cmClose').onclick = close
      host.onclick = e => { if (e.target === host) close() }
      host.querySelector('#cmSend').onclick = async () => {
        const title = host.querySelector('#cmTitle').value.trim()
        const body = host.querySelector('#cmBody').value.trim()
        const btn = host.querySelector('#cmSend')
        if (!title || !body) { btn.textContent = tr('cm_need_both'); return }
        btn.disabled = true; btn.textContent = tr('cm_sending')
        const r = await AS.api.post('/community', { title, body, crop: prefs.crop, district: prefs.district })
        close()
        load()
      }
    }

    // ---- open one post with replies ----
    const openPost = async (id) => {
      const host = document.createElement('div')
      host.className = 'cm-overlay'
      host.innerHTML = `<div class="cm-sheet cm-sheet-wide"><div class="empty-state" style="padding:40px"><span class="emoji">⏳</span>${esc(tr('cm_loading'))}</div></div>`
      document.body.appendChild(host)
      const close = () => host.remove()
      host.onclick = e => { if (e.target === host) close() }

      const r = await AS.api.get('/community/' + id)
      if (!host.isConnected) return
      if (!r || r.error || !r.post) { host.querySelector('.cm-sheet').innerHTML = `<div class="empty-state"><span class="emoji">⚠️</span>${esc(tr('cm_fail'))}</div>`; return }
      const p = r.post
      const replies = r.replies || []
      const sheet = host.querySelector('.cm-sheet')
      sheet.innerHTML = `
        <div class="cm-sheet-head">
          <span>${esc(tr('cm_thread'))}</span>
          <button class="icon-btn" id="cmClose">${AS.icon('x', 20)}</button>
        </div>
        <div class="cm-thread-post">
          <div class="cm-title" style="font-size:16px">${esc(p.title)}</div>
          <div class="cm-thread-body">${esc(p.body)}</div>
          <div class="cm-meta">
            <span class="cm-who">${esc(p.author)}</span>
            ${p.crop ? `<span class="cm-chip">${esc(cropLabel(p.crop))}</span>` : ''}
            <span class="cm-when">${esc(ago(p.at))}</span>
          </div>
        </div>
        <div class="cm-replies-head">${esc(tr('cm_replies'))} (${replies.length})</div>
        <div class="cm-reply-list">
          ${replies.length ? replies.map(rp => `
            <div class="cm-reply">
              <div class="cm-reply-top"><b>${esc(rp.author)}</b><span>${esc(ago(rp.at))}</span></div>
              <div class="cm-reply-body">${esc(rp.body)}</div>
            </div>`).join('') : `<div class="cm-noreplies">${esc(tr('cm_no_replies'))}</div>`}
        </div>
        <div class="cm-reply-box">
          <textarea class="cm-input cm-area" id="rpBody" maxlength="4000" placeholder="${esc(tr('cm_reply_ph'))}"></textarea>
          <button class="btn btn-primary" id="rpSend" style="width:100%">${esc(tr('cm_reply_send'))}</button>
        </div>`
      sheet.querySelector('#cmClose').onclick = close
      sheet.querySelector('#rpSend').onclick = async () => {
        const body = sheet.querySelector('#rpBody').value.trim()
        const btn = sheet.querySelector('#rpSend')
        if (!body) { btn.textContent = tr('cm_need_reply'); return }
        btn.disabled = true; btn.textContent = tr('cm_sending')
        await AS.api.post('/community/' + id + '/replies', { body })
        close()
        openPost(id)
        load()
      }
    }

    container.querySelector('#askBtn').onclick = openComposer
    load()
  }
})()
