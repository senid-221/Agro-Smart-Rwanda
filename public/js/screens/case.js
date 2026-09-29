// AgroSmart Rwanda — Case Intelligence screen.
// One place per Crop Health Case: Emergency Alert, Crop Recovery Score,
// Treatment Effectiveness, Disease Timeline, the Smart Treatment Planner and
// the AI Farm Report. All metrics come from the deterministic server analytics
// (never invented); advice stays grounded in RAB / verified knowledge.
(function () {
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

AS.renderCase = function (container, app, caseId) {
  const tr = app.t()
  const lang = app.lang === 'en' ? 'en' : 'rw'

  if (!caseId) {
    container.innerHTML = `<div class="empty-state"><span class="emoji">🌾</span>${tr('case_missing')}</div>`
    return
  }

  container.innerHTML = `
    <div class="admin-head">
      <button class="btn btn-outline sm" id="backBtn">← ${tr('case_back')}</button>
      <div class="section-title" style="margin:0">${tr('case_title')}</div>
    </div>
    <div id="caseBody"><div class="empty-state"><span class="emoji">⏳</span>${tr('case_loading')}</div></div>`

  container.querySelector('#backBtn').onclick = () => app.go('assistant')

  const body = container.querySelector('#caseBody')

  const KIND_ICON = { treatment: '💊', monitor: '👀', prevent: '🛡️', escalate: '🚨', report: '📝', followup: '🔁', image: '📷', outcome: '✅' }

  function gauge(score, label) {
    if (score == null) {
      return `<div class="case-gauge" style="background:conic-gradient(var(--border) 0 100%)">
        <div class="gauge-hole"><span class="gauge-n">—</span><span class="gauge-l">${tr('case_no_data')}</span></div></div>`
    }
    const color = score >= 70 ? 'var(--green-700)' : score >= 45 ? 'var(--orange)' : 'var(--red)'
    return `<div class="case-gauge" style="background:conic-gradient(${color} ${score * 3.6}deg, var(--border) 0)">
      <div class="gauge-hole"><span class="gauge-n" style="color:${color}">${score}</span><span class="gauge-l">${tr('case_score_' + label)}</span></div></div>`
  }

  function draw(d) {
    const c = d.case || {}
    const rec = d.recovery || {}
    const eff = d.effectiveness || {}
    const tasks = d.tasks || []
    const tl = d.timeline || []

    const bits = [c.crop, c.variety, [c.sector, c.district].filter(Boolean).join(', ')].filter(Boolean)

    body.innerHTML = `
      ${d.emergency && d.emergency.emergency ? `
        <div class="alert-banner">🚨 <b>${tr('case_emergency')}</b><br><span>${esc(d.emergency.reason || '')}</span></div>` : ''}

      <div class="card">
        <div class="section-title" style="margin:0 0 6px">${tr('case_case')} #${c.id} — ${esc(c.crop || '')}</div>
        <div class="progress-note">${esc(bits.join(' · '))} · ${esc(c.status || '')}</div>
        <div style="margin-top:8px">${esc(c.symptoms || '')}</div>
      </div>

      <div class="card ci-grid">
        <div>
          ${gauge(rec.score, rec.label)}
          <div class="progress-note" style="text-align:center;margin-top:4px">${rec.dataPoints || 0} ${tr('case_datapoints')}</div>
        </div>
        <div>
          <div class="ci-l">${tr('case_effectiveness')}</div>
          <div class="badge ${eff.verdict === 'working' ? 'sev-low' : eff.verdict === 'not-working' ? 'sev-high' : 'sev-medium'}">${tr('case_verdict_' + (eff.verdict || 'unclear'))}</div>
          <div class="progress-note" style="margin-top:8px">${esc(eff.evidence || '')}</div>
        </div>
      </div>

      <div class="section-title">${tr('case_plan')}
        <button class="btn btn-outline sm" id="genPlan" style="float:right">${tr('case_gen_plan')}</button>
      </div>
      <div id="taskList"></div>
      <button class="btn btn-outline sm" id="addTask" style="margin-top:8px">+ ${tr('case_add_task')}</button>
      <div id="taskForm"></div>

      <div class="section-title">${tr('case_report')}</div>
      <button class="btn btn-primary sm" id="genReport">${tr('case_gen_report')}</button>
      <div id="reportBox"></div>

      <div class="section-title">${tr('case_timeline')}</div>
      <div id="timeline"></div>`

    // ---- tasks (Smart Treatment Planner) ----
    const tl0 = body.querySelector('#taskList')
    if (!tasks.length) {
      tl0.innerHTML = `<div class="empty-state" style="padding:16px"><span class="emoji">🗒️</span>${tr('case_no_tasks')}</div>`
    } else {
      tasks.forEach(t => {
        const row = document.createElement('div')
        row.className = 'task-row' + (t.status === 'done' ? ' done' : '')
        row.innerHTML = `
          <button class="task-check" data-id="${t.id}" data-status="${esc(t.status)}">${t.status === 'done' ? '✓' : ''}</button>
          <span class="task-body">
            <span class="task-title">${KIND_ICON[t.kind] || '•'} ${esc(t.title)}</span>
            <span class="task-meta">${esc(t.task_date || '')} · ${esc(tr('case_kind_' + t.kind) === 'case_kind_' + t.kind ? t.kind : tr('case_kind_' + t.kind))}</span>
            ${t.detail ? `<span class="task-detail">${esc(t.detail)}</span>` : ''}
          </span>`
        tl0.appendChild(row)
      })
      tl0.querySelectorAll('.task-check').forEach(btn => {
        btn.onclick = async () => {
          const next = btn.dataset.status === 'done' ? 'pending' : 'done'
          await AS.api.post('/ai/tasks/' + btn.dataset.id, { status: next })
          reload()
        }
      })
    }

    body.querySelector('#genPlan').onclick = async () => {
      await AS.api.post('/ai/cases/' + caseId + '/plan', {})
      reload()
    }

    body.querySelector('#addTask').onclick = () => {
      const w = body.querySelector('#taskForm')
      if (w.innerHTML) { w.innerHTML = ''; return }
      w.innerHTML = `<div class="card form">
        <label>${tr('case_task_title')}<input id="nt_title"></label>
        <label>${tr('case_task_kind')}<select id="nt_kind">
          <option value="treatment">${tr('case_kind_treatment')}</option>
          <option value="monitor">${tr('case_kind_monitor')}</option>
          <option value="prevent">${tr('case_kind_prevent')}</option>
          <option value="escalate">${tr('case_kind_escalate')}</option>
        </select></label>
        <label>${tr('case_task_date')}<input id="nt_date" type="date"></label>
        <label>${tr('case_task_detail')}<textarea id="nt_detail" rows="2"></textarea></label>
        <div class="form-row">
          <button class="btn btn-primary sm" id="nt_save">${tr('case_save')}</button>
          <button class="btn btn-outline sm" id="nt_cancel">${tr('case_cancel')}</button>
        </div></div>`
      w.querySelector('#nt_cancel').onclick = () => { w.innerHTML = '' }
      w.querySelector('#nt_save').onclick = async () => {
        const title = w.querySelector('#nt_title').value.trim()
        if (!title) return
        await AS.api.post('/ai/cases/' + caseId + '/tasks', {
          title, kind: w.querySelector('#nt_kind').value,
          taskDate: w.querySelector('#nt_date').value || null,
          detail: w.querySelector('#nt_detail').value.trim()
        })
        w.innerHTML = ''
        reload()
      }
    }

    // ---- report ----
    body.querySelector('#genReport').onclick = async () => {
      const box = body.querySelector('#reportBox')
      box.innerHTML = `<div class="empty-state" style="padding:16px">⏳</div>`
      const r = await AS.api.get('/ai/cases/' + caseId + '/report')
      if (r && r.report) {
        box.innerHTML = `<pre class="report-pre">${esc(r.report)}</pre>
          <button class="btn btn-outline sm" id="copyReport" style="margin-top:8px">${tr('case_copy')}</button>`
        box.querySelector('#copyReport').onclick = () => {
          navigator.clipboard && navigator.clipboard.writeText(r.report)
          box.querySelector('#copyReport').textContent = tr('case_copied')
        }
      } else {
        box.innerHTML = `<div class="empty-state" style="padding:16px">${tr('case_report_err')}</div>`
      }
    }

    // ---- timeline ----
    const tlEl = body.querySelector('#timeline')
    if (!tl.length) {
      tlEl.innerHTML = `<div class="empty-state" style="padding:16px">${tr('case_no_timeline')}</div>`
    } else {
      tl.forEach(day => {
        const wrap = document.createElement('div')
        wrap.className = 'tl-day'
        wrap.innerHTML = `<div class="tl-date">${esc(day.date)}</div>`
        day.events.forEach(e => {
          const ev = document.createElement('div')
          ev.className = 'tl-event'
          ev.innerHTML = `<span class="tl-ico">${KIND_ICON[e.kind] || '•'}</span>
            <span class="tl-body"><span class="tl-note">${esc(e.note)}</span>
            ${e.statusChange ? `<span class="tl-tag">${esc(tr('assistant_' + (e.statusChange === 'worsening' ? 'worse' : e.statusChange)) )}</span>` : ''}
            ${e.hasImage ? '<span class="tl-tag">📷</span>' : ''}</span>`
          wrap.appendChild(ev)
        })
        tlEl.appendChild(wrap)
      })
    }
  }

  async function reload() {
    const d = await AS.api.get('/ai/cases/' + caseId + '/insights')
    if (!d || d.error) {
      body.innerHTML = `<div class="empty-state"><span class="emoji">⚠️</span>${tr('case_missing')}</div>`
      return
    }
    draw(d)
  }

  reload()
}
})()
