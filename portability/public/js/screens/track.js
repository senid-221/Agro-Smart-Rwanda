// Hindura — public tracking by code or phone number.
(function () {
  const HD = (window.HD = window.HD || {})

  function opPill(op) {
    if (!op) return ''
    return '<span class="route-op">' + HD.operatorDot(op, 10) + HD.esc(op.name) + '</span>'
  }

  function timeline(r, t) {
    const evs = r.events || []
    const byStatus = {}
    evs.forEach(e => { if (!byStatus[e.status]) byStatus[e.status] = e })
    const order = ['submitted', 'review', 'approved', 'completed']

    let items
    if (r.status === 'rejected') {
      items = ['submitted']
      if (byStatus.review) items.push('review')
      items.push('rejected')
    } else {
      items = order.slice()
    }

    const curIdx = items.indexOf(r.status)

    return '<ul class="timeline">' + items.map((s, i) => {
      const ev = byStatus[s]
      let cls = ''
      if (curIdx === -1) cls = ev ? 'done' : ''
      else if (i < curIdx) cls = ev ? 'done' : 'skipped'
      else if (i === curIdx) cls = s === 'completed' ? 'done' : 'now'
      const glyph = cls === 'done' ? 'check' : (s === 'rejected' ? 'x' : 'clock')
      return '<li class="' + cls + '">' +
        '<span class="dot">' + HD.icon(glyph, 14) + '</span>' +
        '<div><div class="t">' + HD.esc(t('status_' + s)) + '</div>' +
        (ev ? '<div class="d">' + HD.esc(HD.fmtDateTime(ev.at, HD.app.lang)) + '</div>' : '') +
        (ev && ev.note ? '<div class="note">' + HD.esc(ev.note) + '</div>' : '') +
        '</div></li>'
    }).join('') + '</ul>'
  }

  function resultCard(r, t, fromPhone) {
    const created = HD.fmtDate(r.createdAt, HD.app.lang)
    return (fromPhone ? '<p class="small muted" style="margin:0 0 8px">' + HD.esc(t('track_by_phone')) + '</p>' : '') +
      '<div class="status-hero">' +
        '<div class="top">' +
          '<span class="pill ' + HD.esc(r.status) + '">' + HD.esc(t('status_' + r.status)) + '</span>' +
          '<span class="spacer"></span>' +
          '<span class="ref">' + HD.esc(r.reference) + '</span>' +
        '</div>' +
        '<h2>' + HD.esc(r.fullName) + '</h2>' +
        '<div class="sub">' + HD.esc(r.msisdn) + '</div>' +
        '<div class="route">' + opPill(r.currentOperator) + '<span class="route-arrow">' + HD.icon('arrowr', 17) + '</span>' + opPill(r.newOperator) + '</div>' +
      '</div>' +
      (r.status === 'rejected' && r.reason
        ? '<div class="alert">' + HD.icon('alert', 18) + '<div><strong>' + HD.esc(t('detail_reason')) + ':</strong> ' + HD.esc(r.reason) + '</div></div>'
        : '') +
      '<div class="card"><h3 class="card-title" style="font-size:15px">' + HD.esc(t('timeline')) + '</h3>' + timeline(r, t) + '</div>' +
      '<div class="card"><div class="detail-grid">' +
        '<div><div class="k">' + HD.esc(t('detail_from')) + '</div><div class="v">' + HD.esc(r.currentOperator ? r.currentOperator.name : '') + '</div></div>' +
        '<div><div class="k">' + HD.esc(t('detail_to')) + '</div><div class="v">' + HD.esc(r.newOperator ? r.newOperator.name : '') + '</div></div>' +
        '<div><div class="k">' + HD.esc(t('detail_created')) + '</div><div class="v">' + HD.esc(created) + '</div></div>' +
        '<div><div class="k">' + HD.esc(t('detail_mm')) + '</div><div class="v">' + HD.esc(r.portMobileMoney ? t('sum_mm_yes') : t('sum_mm_no')) + '</div></div>' +
        (r.scheduledFor ? '<div><div class="k">' + HD.esc(t('detail_scheduled')) + '</div><div class="v">' + HD.esc(HD.fmtDate(r.scheduledFor, HD.app.lang)) + '</div></div>' : '') +
        (r.completedAt ? '<div><div class="k">' + HD.esc(t('detail_completed')) + '</div><div class="v">' + HD.esc(HD.fmtDate(r.completedAt, HD.app.lang)) + '</div></div>' : '') +
      '</div></div>' +
      '<p class="small muted center" style="margin-top:16px">' + HD.esc(t('track_help')) + '</p>'
  }

  HD.renderTrack = function (root, param) {
    const t = HD.app.t

    root.innerHTML =
      '<div class="wizard">' +
        '<div class="section-head" style="padding:0;margin-bottom:16px">' +
          '<h1 style="font-size:24px;letter-spacing:-.02em;margin:0 0 5px">' + HD.esc(t('track_title')) + '</h1>' +
          '<p>' + HD.esc(t('track_sub')) + '</p>' +
        '</div>' +
        '<div class="field"><label>' + HD.esc(t('track_label')) + '</label>' +
          '<div class="input-wrap"><span class="i">' + HD.icon('search', 19) + '</span>' +
          '<input id="q" placeholder="' + HD.esc(t('track_ph')) + '" value="' + HD.esc(param || '') + '" autocapitalize="characters" /></div></div>' +
        '<button class="btn btn-primary btn-block" id="goBtn">' + HD.icon('search', 18) + HD.esc(t('track_btn')) + '</button>' +
        '<div id="out" style="margin-top:20px"></div>' +
      '</div>'

    const input = root.querySelector('#q')
    const out = root.querySelector('#out')
    const btn = root.querySelector('#goBtn')

    async function load(q) {
      const query = String(q || '').trim()
      if (!query) return
      out.innerHTML = '<div class="skeleton"></div>'
      btn.disabled = true

      let reference = query.toUpperCase()
      let fromPhone = false

      if (!/^MNP-[A-Z2-9]{6}$/.test(reference)) {
        const digits = query.replace(/\D/g, '')
        if (digits.length < 9) {
          out.innerHTML = '<div class="alert">' + HD.icon('alert', 18) + '<div>' + HD.esc(t('err_bad_number')) + '</div></div>'
          btn.disabled = false
          return
        }
        const found = await HD.api.get('/port/lookup?msisdn=' + encodeURIComponent(query))
        if (found.error === 'not_found') {
          out.innerHTML = '<div class="empty">' + HD.esc(t('track_notfound')) + '</div>'
          btn.disabled = false
          return
        }
        if (found.error) {
          out.innerHTML = '<div class="alert">' + HD.icon('alert', 18) + '<div>' + HD.esc(found.error === 'network' ? t('err_network') : t('err_bad_number')) + '</div></div>'
          btn.disabled = false
          return
        }
        reference = found.reference
        fromPhone = true
      }

      const r = await HD.api.get('/port/requests/' + encodeURIComponent(reference))
      btn.disabled = false
      if (r.error === 'not_found') {
        out.innerHTML = '<div class="empty">' + HD.esc(t('track_notfound')) + '</div>'
        return
      }
      if (r.error) {
        out.innerHTML = '<div class="alert">' + HD.icon('alert', 18) + '<div>' + HD.esc(r.error === 'network' ? t('err_network') : t('err_generic')) + '</div></div>'
        return
      }
      out.innerHTML = resultCard(r, t, fromPhone)
    }

    btn.onclick = () => load(input.value)
    input.addEventListener('keydown', e => { if (e.key === 'Enter') load(input.value) })
    if (param) load(param)
  }
})()
