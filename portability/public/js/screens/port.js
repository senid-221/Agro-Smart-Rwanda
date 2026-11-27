// Hindura — the four-step switch wizard.
(function () {
  const HD = (window.HD = window.HD || {})

  function errText(t, code, extra) {
    switch (code) {
      case 'bad_number': return t('err_bad_number')
      case 'unknown_prefix': return t('err_unknown_prefix')
      case 'pending': return t('err_pending', { ref: (extra && extra.reference) || '' })
      case 'locked': return t('err_locked')
      case 'same_operator': return t('err_same')
      case 'bad_name': return t('err_name')
      case 'bad_national_id': return t('err_nid')
      case 'bad_email': return t('err_email')
      case 'network': return t('err_network')
      default: return t('err_generic')
    }
  }

  function detectLocal(raw) {
    const n = String(raw || '').replace(/\D/g, '')
    const local = n.length === 12 && n.startsWith('250') ? '0' + n.slice(3)
      : n.length === 9 && n.startsWith('7') ? '0' + n : n
    if (!/^07\d{8}$/.test(local)) return null
    const prefix = local.slice(0, 3)
    return HD.operators.find(o => o.prefixes.indexOf(prefix) !== -1) || null
  }

  HD.renderPort = function (root) {
    const t = HD.app.t
    const target = HD.app.state.target || ''
    HD.app.state.target = ''

    const st = {
      step: 1,
      msisdn: '',
      display: '',
      current: null,
      newOperator: target,
      fullName: '',
      nationalId: '',
      email: '',
      portMobileMoney: true,
      terms: false,
      busy: false,
      error: '',
      pendingRef: '',
      result: null
    }

    const wrap = document.createElement('div')
    wrap.className = 'wizard'
    root.appendChild(wrap)

    function header() {
      return '<div class="wizard-head">' +
        '<div class="wizard-top">' +
          '<button class="back-btn" id="backBtn"' + (st.step === 1 ? ' disabled' : '') + ' aria-label="' + HD.esc(t('back')) + '">' + HD.icon('arrowl', 18) + '</button>' +
          '<h1>' + HD.esc(t('port_title')) + '</h1>' +
        '</div>' +
        '<div class="wizard-step">' + HD.esc(t('port_step', { n: st.step })) + '</div>' +
        '<div class="progress">' +
          [1, 2, 3, 4].map(i => '<span class="' + (i <= st.step ? 'on' : '') + '"></span>').join('') +
        '</div>' +
      '</div>'
    }

    function draw() {
      if (st.result) return drawSuccess()
      wrap.innerHTML = header() + '<div id="stepBody"></div>'
      wrap.querySelector('#backBtn').onclick = () => {
        if (st.busy || st.step === 1) return
        st.step -= 1
        st.error = ''
        draw()
      }
      const body = wrap.querySelector('#stepBody')
      if (st.step === 1) stepOne(body)
      else if (st.step === 2) stepTwo(body)
      else if (st.step === 3) stepThree(body)
      else stepFour(body)
    }

    // --- Step 1: the number -------------------------------------------------
    function stepOne(body) {
      body.innerHTML =
        '<div class="section-head" style="padding:0;margin-bottom:16px">' +
          '<h2 style="font-size:19px">' + HD.esc(t('port_step1_title')) + '</h2>' +
          '<p>' + HD.esc(t('step1_d')) + '</p>' +
        '</div>' +
        '<div class="field">' +
          '<label>' + HD.esc(t('port_phone_label')) + '</label>' +
          '<div class="input-wrap' + (st.error ? ' bad' : '') + '">' +
            '<span class="i">' + HD.icon('phone', 20) + '</span>' +
            '<input id="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="' + HD.esc(t('port_phone_ph')) + '" value="' + HD.esc(st.msisdn) + '" />' +
          '</div>' +
        '</div>' +
        '<div id="detectBox"></div>' +
        (st.error ? '<div class="alert">' + HD.icon('alert', 18) + '<div>' + HD.esc(st.error) + '</div></div>' : '') +
        (st.pendingRef ? '<button class="btn btn-ghost btn-block" id="trackPending" style="margin-bottom:12px">' + HD.esc(t('track_cta')) + '</button>' : '') +
        '<button class="btn btn-primary btn-block" id="nextBtn"' + (st.busy ? ' disabled' : '') + '>' +
          HD.esc(st.busy ? t('port_checking') : t('port_continue')) + HD.icon('arrowr', 18) +
        '</button>'

      const input = body.querySelector('#phone')
      const box = body.querySelector('#detectBox')

      const paintDetect = () => {
        const op = detectLocal(input.value)
        if (!op) { box.innerHTML = ''; return }
        box.innerHTML = '<div class="detected"><span class="op-badge" style="--op:' + HD.esc(op.color) + ';--op-ink:' + HD.esc(op.ink) + '">' + HD.esc(op.short) + '</span>' +
          '<div><div class="lbl">' + HD.esc(t('detected')) + '</div><div class="val">' + HD.esc(op.name) + '</div></div></div>'
      }
      input.addEventListener('input', paintDetect)
      input.addEventListener('keydown', e => { if (e.key === 'Enter') go() })
      paintDetect()

      if (st.pendingRef) {
        body.querySelector('#trackPending').onclick = () => HD.app.go('#/track/' + st.pendingRef)
      }

      body.querySelector('#nextBtn').onclick = go

      async function go() {
        const raw = input.value.trim()
        if (String(raw).replace(/\D/g, '').length < 9) {
          st.error = t('err_bad_number'); st.pendingRef = ''
          draw(); return
        }
        st.busy = true; st.error = ''; st.pendingRef = ''
        draw()
        const r = await HD.api.post('/port/check', { msisdn: raw })
        st.busy = false
        if (r.error) {
          st.error = errText(t, r.error, r)
          if (r.error === 'pending') st.pendingRef = r.reference || ''
          draw(); return
        }
        if (!r.eligible) {
          st.error = errText(t, r.reason, r)
          if (r.reason === 'pending') st.pendingRef = r.reference || ''
          draw(); return
        }
        st.msisdn = r.msisdn
        st.display = r.display
        st.current = r.operator
        st.step = 2
        draw()
      }
    }

    // --- Step 2: destination operator --------------------------------------
    function stepTwo(body) {
      const choices = HD.operators.filter(o => o.code !== (st.current && st.current.code))
      body.innerHTML =
        '<div class="section-head" style="padding:0;margin-bottom:16px">' +
          '<h2 style="font-size:19px">' + HD.esc(t('step2_title')) + '</h2>' +
          '<p>' + HD.esc(t('step2_sub', { name: st.current ? st.current.name : '' })) + '</p>' +
        '</div>' +
        '<div class="op-grid">' + choices.map(o =>
          '<button class="op-card" data-op="' + HD.esc(o.code) + '" style="' + (st.newOperator === o.code ? 'border-color:var(--brand-2);box-shadow:0 0 0 4px rgba(10,132,224,.12)' : '') + '">' +
            '<span class="op-badge" style="--op:' + HD.esc(o.color) + ';--op-ink:' + HD.esc(o.ink) + '">' + HD.esc(o.short) + '</span>' +
            '<span class="op-info"><strong>' + HD.esc(o.name) + '</strong>' +
            '<span>' + HD.esc(t('operator_prefix')) + ' ' + HD.esc(o.prefixes.join(', ')) + '</span></span>' +
            (st.newOperator === o.code ? HD.icon('checkc', 22) : HD.icon('arrowr', 18)) +
          '</button>'
        ).join('') + '</div>' +
        '<div style="margin-top:18px">' +
          '<button class="btn btn-primary btn-block" id="nextBtn"' + (st.newOperator ? '' : ' disabled') + '>' + HD.esc(t('port_continue')) + HD.icon('arrowr', 18) + '</button>' +
        '</div>'

      body.querySelectorAll('.op-card').forEach(card => {
        card.onclick = () => { st.newOperator = card.dataset.op; draw() }
      })
      body.querySelector('#nextBtn').onclick = () => {
        if (!st.newOperator) return
        st.step = 3
        draw()
      }
    }

    // --- Step 3: applicant details ----------------------------------------
    function stepThree(body) {
      body.innerHTML =
        '<div class="section-head" style="padding:0;margin-bottom:16px">' +
          '<h2 style="font-size:19px">' + HD.esc(t('step3_title')) + '</h2>' +
          '<p>' + HD.esc(t('step3_sub')) + '</p>' +
        '</div>' +
        '<div class="field"><label>' + HD.esc(t('label_name')) + '</label>' +
          '<div class="input-wrap"><span class="i">' + HD.icon('user', 19) + '</span>' +
          '<input id="fName" autocomplete="name" placeholder="' + HD.esc(t('ph_name')) + '" value="' + HD.esc(st.fullName) + '" /></div></div>' +
        '<div class="field"><label>' + HD.esc(t('label_nid')) + '<span class="opt">' + HD.esc(t('nid_hint')) + '</span></label>' +
          '<div class="input-wrap"><span class="i">' + HD.icon('idcard', 19) + '</span>' +
          '<input id="fNid" inputmode="numeric" maxlength="16" placeholder="' + HD.esc(t('ph_nid')) + '" value="' + HD.esc(st.nationalId) + '" /></div></div>' +
        '<div class="field"><label>' + HD.esc(t('label_email')) + '<span class="opt">' + HD.esc(t('optional')) + '</span></label>' +
          '<div class="input-wrap"><span class="i">' + HD.icon('mail', 19) + '</span>' +
          '<input id="fEmail" type="email" inputmode="email" autocomplete="email" placeholder="' + HD.esc(t('ph_email')) + '" value="' + HD.esc(st.email) + '" /></div></div>' +
        '<label class="check' + (st.portMobileMoney ? ' on' : '') + '" id="mmCheck" style="margin-bottom:16px">' +
          '<input type="checkbox" id="mmBox"' + (st.portMobileMoney ? ' checked' : '') + ' />' +
          '<span class="txt">' + HD.esc(t('label_mm')) + '<small>' + HD.esc(t('mm_hint')) + '</small></span>' +
        '</label>' +
        (st.error ? '<div class="alert">' + HD.icon('alert', 18) + '<div>' + HD.esc(st.error) + '</div></div>' : '') +
        '<button class="btn btn-primary btn-block" id="nextBtn">' + HD.esc(t('port_continue')) + HD.icon('arrowr', 18) + '</button>'

      const mm = body.querySelector('#mmBox')
      mm.addEventListener('change', () => {
        st.portMobileMoney = mm.checked
        body.querySelector('#mmCheck').classList.toggle('on', mm.checked)
      })

      body.querySelector('#nextBtn').onclick = () => {
        st.fullName = body.querySelector('#fName').value.trim()
        st.nationalId = body.querySelector('#fNid').value.replace(/\D/g, '')
        st.email = body.querySelector('#fEmail').value.trim()

        if (st.fullName.length < 3) { st.error = t('err_name'); draw(); return }
        if (!/^\d{16}$/.test(st.nationalId)) { st.error = t('err_nid'); draw(); return }
        if (st.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(st.email)) { st.error = t('err_email'); draw(); return }
        st.error = ''
        st.step = 4
        draw()
      }
    }

    // --- Step 4: review + submit ------------------------------------------
    function stepFour(body) {
      const dest = HD.operators.find(o => o.code === st.newOperator) || {}
      body.innerHTML =
        '<div class="section-head" style="padding:0;margin-bottom:16px">' +
          '<h2 style="font-size:19px">' + HD.esc(t('step4_title')) + '</h2>' +
          '<p>' + HD.esc(t('step4_sub')) + '</p>' +
        '</div>' +
        '<div class="summary" style="margin-bottom:16px">' +
          '<div class="summary-row"><span class="k">' + HD.esc(t('sum_number')) + '</span><span class="v">' + HD.esc(st.display || st.msisdn) + '</span></div>' +
          '<div class="summary-row"><span class="k">' + HD.esc(t('sum_from')) + '</span><span class="v">' + HD.esc(st.current ? st.current.name : '') + '</span></div>' +
          '<div class="summary-row"><span class="k">' + HD.esc(t('sum_to')) + '</span><span class="v" style="color:var(--brand)">' + HD.esc(dest.name || '') + '</span></div>' +
          '<div class="summary-row"><span class="k">' + HD.esc(t('sum_name')) + '</span><span class="v">' + HD.esc(st.fullName) + '</span></div>' +
          '<div class="summary-row"><span class="k">' + HD.esc(t('sum_nid')) + '</span><span class="v mono">' + HD.esc(st.nationalId) + '</span></div>' +
          '<div class="summary-row"><span class="k">' + HD.esc(t('sum_mm')) + '</span><span class="v">' + HD.esc(st.portMobileMoney ? t('sum_mm_yes') : t('sum_mm_no')) + '</span></div>' +
        '</div>' +
        '<label class="check' + (st.terms ? ' on' : '') + '" id="termsCheck" style="margin-bottom:16px">' +
          '<input type="checkbox" id="termsBox"' + (st.terms ? ' checked' : '') + ' />' +
          '<span class="txt">' + HD.esc(t('terms')) + '</span>' +
        '</label>' +
        (st.error ? '<div class="alert">' + HD.icon('alert', 18) + '<div>' + HD.esc(st.error) + '</div></div>' : '') +
        '<button class="btn btn-primary btn-block" id="submitBtn"' + (st.terms && !st.busy ? '' : ' disabled') + '>' +
          HD.esc(st.busy ? t('submitting') : t('submit')) + HD.icon('send', 17) +
        '</button>'

      const terms = body.querySelector('#termsBox')
      terms.addEventListener('change', () => {
        st.terms = terms.checked
        body.querySelector('#termsCheck').classList.toggle('on', terms.checked)
        body.querySelector('#submitBtn').disabled = !terms.checked || st.busy
      })

      body.querySelector('#submitBtn').onclick = async () => {
        if (!st.terms || st.busy) return
        st.busy = true; st.error = ''
        draw()
        const r = await HD.api.post('/port/requests', {
          msisdn: st.msisdn,
          newOperator: st.newOperator,
          fullName: st.fullName,
          nationalId: st.nationalId,
          email: st.email,
          portMobileMoney: st.portMobileMoney
        })
        st.busy = false
        if (r.error) {
          st.error = errText(t, r.error, r)
          if (r.error === 'pending') st.pendingRef = r.reference || ''
          draw(); return
        }
        st.result = r
        draw()
      }
    }

    // --- Success -----------------------------------------------------------
    function drawSuccess() {
      const r = st.result
      wrap.innerHTML =
        '<div class="success">' +
          '<div class="success-ring">' + HD.icon('check', 38) + '</div>' +
          '<h1>' + HD.esc(t('success_title')) + '</h1>' +
          '<p>' + HD.esc(t('success_sub')) + '</p>' +
          '<div class="ref-box">' +
            '<span class="code" id="refCode">' + HD.esc(r.reference) + '</span>' +
            '<button class="btn btn-ghost btn-sm" id="copyBtn">' + HD.icon('copy', 16) + HD.esc(t('success_copy')) + '</button>' +
          '</div>' +
          '<div class="card" style="text-align:left">' +
            '<h3 class="card-title" style="font-size:15px">' + HD.esc(t('success_next')) + '</h3>' +
            '<ul class="next-list" style="margin-top:12px;margin-bottom:0">' +
              '<li><span class="n">1</span><span>' + HD.esc(t('success_next_1')) + '</span></li>' +
              '<li><span class="n">2</span><span>' + HD.esc(t('success_next_2')) + '</span></li>' +
              '<li><span class="n">3</span><span>' + HD.esc(t('success_next_3')) + '</span></li>' +
            '</ul>' +
          '</div>' +
          '<div class="btn-row" style="margin-top:18px">' +
            '<button class="btn btn-primary" id="trackBtn">' + HD.esc(t('track_cta')) + '</button>' +
            '<button class="btn btn-ghost" id="homeBtn">' + HD.esc(t('home_cta')) + '</button>' +
          '</div>' +
        '</div>'

      wrap.querySelector('#copyBtn').onclick = async () => {
        const ok = await HD.copy(r.reference)
        if (ok) HD.toast(t('success_copied'))
      }
      wrap.querySelector('#trackBtn').onclick = () => HD.app.go('#/track/' + r.reference)
      wrap.querySelector('#homeBtn').onclick = () => HD.app.go('#/')
    }

    draw()
  }
})()
