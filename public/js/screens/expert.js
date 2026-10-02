// AgroSmart Rwanda — Expert Human Assistance.
// Paid Agro AI Expert plans (Monthly 10,000 RWF / Yearly 100,000 RWF, both
// auto-renewing) with an honest side-by-side comparison. Subscribing RECORDS the
// farmer's intent and returns Mobile Money instructions — there is no live
// charging here; an admin activates the plan once payment is confirmed.
(function () {
  const esc = AS.esc

  AS.renderExpert = function (container, app) {
    const tr = app.t()
    const lang = app.lang === 'en' ? 'en' : 'rw'

    container.innerHTML = `
      <div class="ex-hero">
        <span class="ex-hero-ico">${AS.icon('star', 26)}</span>
        <span class="ex-hero-body">
          <span class="ex-hero-t">${esc(tr('ex_title'))}</span>
          <span class="ex-hero-d">${esc(tr('ex_intro'))}</span>
        </span>
      </div>
      <div id="exCurrent"></div>
      <div class="ex-plans">
        <div class="ex-plan" id="planMonthly">
          <div class="ex-plan-head"><span class="ex-plan-name">${esc(tr('ex_monthly'))}</span><span class="ex-tag">${esc(tr('ex_auto_renew'))}</span></div>
          <div class="ex-price">10,000 <small>RWF</small></div>
          <div class="ex-per">${esc(tr('ex_per_month'))}</div>
          <ul class="ex-feats">
            <li>${AS.icon('check', 14)}${esc(tr('ex_f_chat'))}</li>
            <li>${AS.icon('check', 14)}${esc(tr('ex_f_review'))}</li>
            <li>${AS.icon('check', 14)}${esc(tr('ex_f_48'))}</li>
          </ul>
          <button class="btn btn-outline ex-sub" data-plan="monthly">${esc(tr('ex_subscribe'))}</button>
        </div>
        <div class="ex-plan best" id="planYearly">
          <div class="ex-best-flag">${esc(tr('ex_best_value'))}</div>
          <div class="ex-plan-head"><span class="ex-plan-name">${esc(tr('ex_yearly'))}</span><span class="ex-tag">${esc(tr('ex_auto_renew'))}</span></div>
          <div class="ex-price">100,000 <small>RWF</small></div>
          <div class="ex-per">${esc(tr('ex_per_year'))}</div>
          <ul class="ex-feats">
            <li>${AS.icon('check', 14)}${esc(tr('ex_f_chat'))}</li>
            <li>${AS.icon('check', 14)}${esc(tr('ex_f_review'))}</li>
            <li>${AS.icon('check', 14)}${esc(tr('ex_f_24'))}</li>
            <li>${AS.icon('check', 14)}${esc(tr('ex_f_save'))}</li>
          </ul>
          <button class="btn btn-primary ex-sub" data-plan="yearly">${esc(tr('ex_subscribe'))}</button>
        </div>
      </div>

      <div class="section-title">${esc(tr('ex_compare'))}</div>
      <div class="ex-table">
        <div class="exr exr-head"><span></span><span>${esc(tr('ex_monthly'))}</span><span>${esc(tr('ex_yearly'))}</span></div>
        <div class="exr"><span>${esc(tr('ex_c_price'))}</span><span>10,000</span><span>100,000</span></div>
        <div class="exr"><span>${esc(tr('ex_c_effective'))}</span><span>10,000/${esc(tr('ex_mo'))}</span><span>8,333/${esc(tr('ex_mo'))}</span></div>
        <div class="exr"><span>${esc(tr('ex_c_response'))}</span><span>${esc(tr('ex_c_48'))}</span><span>${esc(tr('ex_c_24'))}</span></div>
        <div class="exr"><span>${esc(tr('ex_c_renew'))}</span><span>${esc(tr('yes'))}</span><span>${esc(tr('yes'))}</span></div>
        <div class="exr"><span>${esc(tr('ex_c_saving'))}</span><span>—</span><span>${esc(tr('ex_c_save20'))}</span></div>
      </div>
      <p class="danger-note">${esc(tr('ex_note'))}</p>
    `

    const currentEl = container.querySelector('#exCurrent')

    const paintCurrent = sub => {
      if (!sub) { currentEl.innerHTML = ''; return }
      const statusKey = { pending: 'ex_st_pending', active: 'ex_st_active', expired: 'ex_st_expired', cancelled: 'ex_st_cancelled' }
      currentEl.innerHTML = `
        <div class="ex-current">
          <span class="ex-cur-ico">${AS.icon('checkc', 20)}</span>
          <span class="ex-cur-body">
            <span class="ex-cur-t">${esc(tr('ex_your_plan'))}: ${esc(sub.plan === 'yearly' ? tr('ex_yearly') : tr('ex_monthly'))}</span>
            <span class="ex-cur-d">${esc(tr(statusKey[sub.status] || 'ex_st_pending'))} · ${sub.amount.toLocaleString('en-GB')} RWF</span>
          </span>
        </div>`
    }

    const showInstructions = (plan, amount, phone) => {
      const host = document.createElement('div')
      host.className = 'cm-overlay'
      host.innerHTML = `
        <div class="cm-sheet">
          <div class="cm-sheet-head"><span>${esc(tr('ex_pay_title'))}</span>
            <button class="icon-btn" id="exClose">${AS.icon('x', 20)}</button></div>
          <div class="ex-pay-amount">${amount.toLocaleString('en-GB')} <small>RWF</small></div>
          <div class="ex-pay-plan">${esc(plan === 'yearly' ? tr('ex_yearly') : tr('ex_monthly'))} · ${esc(tr('ex_auto_renew'))}</div>
          <ol class="ex-steps">
            <li>${esc(tr('ex_step1'))}</li>
            <li>${esc(tr('ex_step2'))} <b>*182*8*1#</b> (MTN) ${esc(tr('ex_or'))} <b>*505#</b> (Airtel)</li>
            <li>${esc(tr('ex_step3'))}</li>
            <li>${esc(tr('ex_step4'))}</li>
          </ol>
          <div class="ex-pay-phone">${esc(tr('ex_recorded_for'))}: <b>${esc(phone || tr('ex_no_phone'))}</b></div>
          <p class="danger-note" style="text-align:left">${esc(tr('ex_pay_note'))}</p>
          <button class="btn btn-primary" id="exDone" style="width:100%">${esc(tr('ex_done'))}</button>
        </div>`
      document.body.appendChild(host)
      const close = () => host.remove()
      host.querySelector('#exClose').onclick = close
      host.querySelector('#exDone').onclick = close
      host.onclick = e => { if (e.target === host) close() }
    }

    const subscribe = async (plan, amount) => {
      let phone = ''
      try { phone = (app.user && app.user.phone) || '' } catch (e) { phone = '' }
      if (!phone) {
        phone = window.prompt(tr('ex_ask_phone')) || ''
      }
      const r = await AS.api.post('/expert/subscribe', { plan, phone })
      if (r && r.subscription) {
        paintCurrent(r.subscription)
        showInstructions(plan, amount, r.subscription.phone)
      } else {
        alert(tr('ex_fail'))
      }
    }

    container.querySelectorAll('.ex-sub').forEach(b => {
      b.onclick = () => subscribe(b.dataset.plan, b.dataset.plan === 'yearly' ? 100000 : 10000)
    })

    AS.api.get('/expert/plans').then(r => {
      if (!container.isConnected) return
      if (r && r.subscription) paintCurrent(r.subscription)
    })
  }
})()
