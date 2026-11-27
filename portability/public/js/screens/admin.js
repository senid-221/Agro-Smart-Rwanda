// Hindura — operator / regulator back office.
(function () {
  const HD = (window.HD = window.HD || {})

  const STATUSES = ['all', 'submitted', 'review', 'approved', 'completed', 'rejected']

  function login(root, t) {
    root.innerHTML =
      '<div class="login-wrap">' +
        '<div class="login-card card">' +
          '<div class="lock">' + HD.icon('lock', 24) + '</div>' +
          '<h1>' + HD.esc(t('admin_title')) + '</h1>' +
          '<p>' + HD.esc(t('admin_sub')) + '</p>' +
          '<div class="field"><label>' + HD.esc(t('admin_email')) + '</label>' +
            '<div class="input-wrap"><span class="i">' + HD.icon('mail', 19) + '</span>' +
            '<input id="email" type="email" autocomplete="username" placeholder="admin@hindura.rw" /></div></div>' +
          '<div class="field"><label>' + HD.esc(t('admin_password')) + '</label>' +
            '<div class="input-wrap"><span class="i">' + HD.icon('lock', 19) + '</span>' +
            '<input id="password" type="password" autocomplete="current-password" /></div></div>' +
          '<div id="err"></div>' +
          '<button class="btn btn-primary btn-block" id="loginBtn">' + HD.esc(t('admin_login')) + '</button>' +
        '</div>' +
      '</div>'

    const email = root.querySelector('#email')
    const pass = root.querySelector('#password')
    const err = root.querySelector('#err')
    const btn = root.querySelector('#loginBtn')

    async function submit() {
      err.innerHTML = ''
      btn.disabled = true
      const r = await HD.api.post('/admin/login', { email: email.value.trim(), password: pass.value })
      btn.disabled = false
      if (r.error) {
        err.innerHTML = '<div class="alert">' + HD.icon('alert', 18) + '<div>' +
          HD.esc(r.error === 'network' ? t('err_network') : t('admin_bad')) + '</div></div>'
        return
      }
      HD.token.set(r.token)
      HD.app.rerender()
    }

    btn.onclick = submit
    pass.addEventListener('keydown', e => { if (e.key === 'Enter') submit() })
    email.addEventListener('keydown', e => { if (e.key === 'Enter') pass.focus() })
  }

  function opPill(op) {
    if (!op) return ''
    return '<span class="route-op">' + HD.operatorDot(op, 10) + HD.esc(op.name) + '</span>'
  }

  function adminTimeline(r, t) {
    const evs = (r.events || []).slice().sort((a, b) => new Date(a.at) - new Date(b.at))
    if (!evs.length) return ''
    return '<ul class="timeline">' + evs.map(e =>
      '<li class="done"><span class="dot">' + HD.icon(e.status === 'rejected' ? 'x' : 'check', 14) + '</span>' +
      '<div><div class="t">' + HD.esc(t('status_' + e.status)) + '</div>' +
      '<div class="d">' + HD.esc(HD.fmtDateTime(e.at, HD.app.lang)) + '</div>' +
      (e.note ? '<div class="note">' + HD.esc(e.note) + '</div>' : '') +
      '</div></li>'
    ).join('') + '</ul>'
  }

  function statusPill(status, t) {
    return '<span class="pill ' + HD.esc(status) + '">' + HD.esc(t('status_' + status)) + '</span>'
  }

  function dashboard(root, t) {
    let filter = 'all'
    let query = ''
    let timer = null

    root.innerHTML =
      '<div class="admin-head">' +
        '<div style="flex:1;min-width:0"><h1>' + HD.esc(t('admin_title')) + '</h1>' +
        '<p>' + HD.esc(t('admin_queue_sub')) + '</p></div>' +
        '<button class="icon-btn" id="logoutBtn" aria-label="' + HD.esc(t('admin_logout')) + '">' + HD.icon('logout', 19) + '</button>' +
      '</div>' +
      '<div class="stats" id="stats">' +
        [1, 2, 3, 4, 5, 6].map(() => '<div class="skeleton" style="height:62px"></div>').join('') +
      '</div>' +
      '<div class="admin-tools">' +
        '<div class="chips" id="chips">' +
          STATUSES.map(s => '<button class="chip' + (s === 'all' ? ' on' : '') + '" data-status="' + s + '">' +
            HD.esc(s === 'all' ? t('admin_filter_all') : t('status_' + s)) + '</button>').join('') +
        '</div>' +
        '<div class="input-wrap" style="margin-bottom:4px"><span class="i">' + HD.icon('search', 19) + '</span>' +
          '<input id="search" placeholder="' + HD.esc(t('admin_search')) + '" /></div>' +
      '</div>' +
      '<div class="req-list" id="list"><div class="skeleton" style="height:88px"></div><div class="skeleton" style="height:88px;margin-top:9px"></div></div>'

    root.querySelector('#logoutBtn').onclick = () => {
      HD.token.set('')
      HD.app.rerender()
    }

    root.querySelectorAll('.chip').forEach(chip => {
      chip.onclick = () => {
        filter = chip.dataset.status
        root.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === chip))
        load()
      }
    })

    const search = root.querySelector('#search')
    search.addEventListener('input', () => {
      clearTimeout(timer)
      timer = setTimeout(() => { query = search.value.trim(); load() }, 350)
    })

    const statsEl = root.querySelector('#stats')
    const listEl = root.querySelector('#list')

    async function load() {
      const qs = '/admin/requests?status=' + encodeURIComponent(filter) +
        (query ? '&q=' + encodeURIComponent(query) : '')
      const [stats, rows] = await Promise.all([HD.api.get('/admin/stats'), HD.api.get(qs)])

      if (stats && !stats.error) {
        const tiles = [
          { cls: 'total', n: stats.total, l: t('admin_stats_total') },
          { cls: 'new', n: stats.byStatus.submitted, l: t('admin_stats_new') },
          { cls: 'review', n: stats.byStatus.review, l: t('admin_stats_review') },
          { cls: 'approved', n: stats.byStatus.approved, l: t('admin_stats_approved') },
          { cls: 'done', n: stats.byStatus.completed, l: t('admin_stats_done') },
          { cls: 'rejected', n: stats.byStatus.rejected, l: t('admin_stats_rejected') }
        ]
        statsEl.innerHTML = tiles.map(x =>
          '<div class="stat ' + x.cls + '"><div class="n">' + x.n + '</div><div class="l">' + HD.esc(x.l) + '</div></div>'
        ).join('')
      }

      if (!rows || rows.error) {
        listEl.innerHTML = '<div class="empty">' + HD.esc(t('err_generic')) + '</div>'
        return
      }
      if (!rows.length) {
        listEl.innerHTML = '<div class="empty">' + HD.esc(t('admin_empty')) + '</div>'
        return
      }

      listEl.innerHTML = rows.map(r =>
        '<button class="req" data-id="' + r.id + '">' +
          '<div class="top"><span class="ref">' + HD.esc(r.reference) + '</span><span class="spacer"></span>' + statusPill(r.status, t) + '</div>' +
          '<div class="name">' + HD.esc(r.fullName) + '</div>' +
          '<div class="route">' + opPill(r.currentOperator) + '<span class="route-arrow">' + HD.icon('arrowr', 15) + '</span>' + opPill(r.newOperator) + '</div>' +
          '<div class="meta">' + HD.esc(r.msisdn) + ' · ' + HD.esc(HD.fmtDate(r.createdAt, HD.app.lang)) + '</div>' +
        '</button>'
      ).join('')

      listEl.querySelectorAll('.req').forEach(card => {
        card.onclick = () => openSheet(Number(card.dataset.id))
      })
    }

    async function openSheet(id) {
      const r = await HD.api.get('/admin/requests/' + id)
      if (r.error) { HD.toast(t('err_generic')); return }

      const back = document.createElement('div')
      back.className = 'sheet-back'
      back.innerHTML =
        '<div class="sheet" role="dialog" aria-modal="true">' +
          '<div class="sheet-grab"></div>' +
          '<div class="sheet-head"><h2>' + HD.esc(r.reference) + '</h2>' +
            '<button class="icon-btn" id="closeSheet" aria-label="' + HD.esc(t('admin_cancel')) + '">' + HD.icon('x', 18) + '</button></div>' +
          '<div class="sheet-body">' +
            '<div class="status-hero">' +
              '<div class="top">' + statusPill(r.status, t) + '<span class="spacer"></span>' +
                '<span class="ref">' + HD.esc(HD.fmtDate(r.createdAt, HD.app.lang)) + '</span></div>' +
              '<h2>' + HD.esc(r.fullName) + '</h2>' +
              '<div class="sub">' + HD.esc(r.msisdn) + '</div>' +
              '<div class="route">' + opPill(r.currentOperator) + '<span class="route-arrow">' + HD.icon('arrowr', 17) + '</span>' + opPill(r.newOperator) + '</div>' +
            '</div>' +
            '<div class="card"><div class="detail-grid">' +
              '<div><div class="k">' + HD.esc(t('admin_nid')) + '</div><div class="v mono">' + HD.esc(r.nationalId) + '</div></div>' +
              '<div><div class="k">' + HD.esc(t('admin_email_label')) + '</div><div class="v">' + HD.esc(r.email || '—') + '</div></div>' +
              '<div><div class="k">' + HD.esc(t('detail_mm')) + '</div><div class="v">' + HD.esc(r.portMobileMoney ? t('sum_mm_yes') : t('sum_mm_no')) + '</div></div>' +
              '<div><div class="k">' + HD.esc(t('detail_scheduled')) + '</div><div class="v">' + HD.esc(r.scheduledFor ? HD.fmtDate(r.scheduledFor, HD.app.lang) : '—') + '</div></div>' +
            '</div></div>' +
            (r.reason ? '<div class="alert">' + HD.icon('alert', 18) + '<div>' + HD.esc(r.reason) + '</div></div>' : '') +
            '<div class="card"><h3 class="card-title" style="font-size:15px">' + HD.esc(t('timeline')) + '</h3>' + adminTimeline(r, t) + '</div>' +
            actions(r, t) +
          '</div>' +
        '</div>'

      document.body.appendChild(back)

      const close = () => back.remove()
      back.querySelector('#closeSheet').onclick = close
      back.addEventListener('click', e => { if (e.target === back) close() })
      const onEsc = e => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onEsc) } }
      document.addEventListener('keydown', onEsc)

      back.querySelectorAll('[data-action]').forEach(btn => {
        btn.onclick = async () => {
          const action = btn.dataset.action
          const noteEl = back.querySelector('#note')
          const note = noteEl ? noteEl.value.trim() : ''
          if (action === 'reject' && !note) {
            HD.toast(t('admin_reason'))
            if (noteEl) noteEl.focus()
            return
          }
          back.querySelectorAll('[data-action]').forEach(b => { b.disabled = true })
          const res = await HD.api.patch('/admin/requests/' + r.id, { action, note })
          if (res.error) {
            back.querySelectorAll('[data-action]').forEach(b => { b.disabled = false })
            HD.toast(t('err_generic'))
            return
          }
          HD.toast(t('admin_updated'))
          close()
          load()
        }
      })
    }

    function actions(r, t) {
      const can = {
        review: r.status === 'submitted',
        approve: r.status === 'submitted' || r.status === 'review',
        reject: r.status === 'submitted' || r.status === 'review' || r.status === 'approved',
        complete: r.status === 'approved'
      }
      if (!can.review && !can.approve && !can.reject && !can.complete) return ''
      return '<div class="action-group">' +
        '<div class="field" style="margin-bottom:10px"><label>' + HD.esc(t('admin_note')) + '</label>' +
          '<textarea class="input" id="note" placeholder="' + HD.esc(t('admin_reason')) + '"></textarea></div>' +
        '<div class="sheet-actions">' +
          (can.approve ? '<button class="btn btn-primary" data-action="approve">' + HD.icon('checkc', 18) + HD.esc(t('admin_act_approve')) + '</button>' : '') +
          (can.complete ? '<button class="btn btn-primary" data-action="complete">' + HD.icon('check', 18) + HD.esc(t('admin_act_complete')) + '</button>' : '') +
          (can.review ? '<button class="btn btn-ghost" data-action="review">' + HD.icon('clock', 18) + HD.esc(t('admin_act_review')) + '</button>' : '') +
          (can.reject ? '<button class="btn btn-danger" data-action="reject">' + HD.icon('x', 18) + HD.esc(t('admin_act_reject')) + '</button>' : '') +
        '</div>' +
      '</div>'
    }

    load()
  }

  HD.renderAdmin = function (root) {
    const t = HD.app.t
    if (!HD.token.get()) return login(root, t)
    dashboard(root, t)
  }
})()
