(function () {
const { DISEASES, CROPS, diseaseById } = AS

AS.renderLibrary = function (container, app) {
  const tr = app.t()
  const lang = app.lang
  let filter = 'all'
  let query = ''

  container.innerHTML = `
    <div class="section-title">${tr('library_title')} 🦠</div>
    <p class="progress-note" style="margin-bottom:12px">${tr('library_sub')}</p>
    <input class="search-box" id="search" placeholder="${tr('library_search')}" />
    <div class="chip-row" id="cropFilter" style="margin-bottom:14px"></div>
    <div id="diseaseList"></div>
  `

  const chips = container.querySelector('#cropFilter')
  const list = container.querySelector('#diseaseList')

  const mkChip = (id, label) => {
    const c = document.createElement('button')
    c.className = 'chip' + (filter === id ? ' active' : '')
    c.textContent = label
    c.onclick = () => { filter = id; renderChips(); renderList() }
    return c
  }

  function renderChips() {
    chips.innerHTML = ''
    chips.appendChild(mkChip('all', tr('library_all')))
    Object.entries(CROPS).forEach(([id, c]) => {
      if (DISEASES.some(d => d.crop === id)) {
        chips.appendChild(mkChip(id, `${c.emoji} ${c[lang]}`))
      }
    })
  }

  function renderList() {
    list.innerHTML = ''
    const q = query.trim().toLowerCase()
    const items = DISEASES.filter(d =>
      (filter === 'all' || d.crop === filter) &&
      (!q || d.name.en.toLowerCase().includes(q) || d.name.rw.toLowerCase().includes(q) ||
       CROPS[d.crop].en.toLowerCase().includes(q) || CROPS[d.crop].rw.toLowerCase().includes(q))
    )
    if (!items.length) {
      list.innerHTML = `<div class="empty-state"><span class="emoji">🤔</span>${tr('library_empty')}</div>`
      return
    }
    items.forEach(d => {
      const row = document.createElement('button')
      row.className = 'list-row'
      row.innerHTML = `
        <span class="emoji">${CROPS[d.crop].emoji}</span>
        <span class="body">
          <span class="name">${d.name[lang]}</span>
          <span class="meta">${CROPS[d.crop][lang]} · <span class="badge sev-${d.severity}">${tr('sev_' + d.severity)}</span></span>
        </span>
        <span class="arrow">›</span>`
      row.onclick = () => app.go('disease', { id: d.id })
      list.appendChild(row)
    })
  }

  container.querySelector('#search').oninput = e => { query = e.target.value; renderList() }
  renderChips()
  renderList()
}

AS.renderDiseaseDetail = function (container, app, id) {
  const tr = app.t()
  const lang = app.lang
  const d = diseaseById(id)
  if (!d) { app.go('library'); return }
  const crop = CROPS[d.crop]

  const back = document.createElement('button')
  back.className = 'back-btn'
  back.textContent = tr('back')
  back.onclick = () => app.go('library')
  container.appendChild(back)

  container.insertAdjacentHTML('beforeend', `
    <div class="detail-hero">
      <span class="emoji">${crop.emoji}</span>
      <h2>${d.name[lang]}</h2>
      <div class="sci">${d.sci}</div>
      <div style="margin-top:8px"><span class="badge sev-${d.severity}">${tr('sev_' + d.severity)}</span>
      <span class="badge gold">${crop[lang]}</span></div>
    </div>
    <div class="card result-block"><h3>🔎 ${tr('result_symptoms')}</h3>
      <ul>${d.symptoms[lang].map(x => `<li>${x}</li>`).join('')}</ul></div>
    <div class="card result-block"><h3>🧬 ${tr('result_cause')}</h3><p>${d.cause[lang]}</p></div>
    <div class="card result-block treatment-card"><h3>💊 ${tr('result_treatment')}</h3>
      <ul>${d.treatment[lang].map(x => `<li>${x}</li>`).join('')}</ul></div>
    <div class="card result-block"><h3>🌿 ${tr('result_organic')}</h3>
      <ul>${d.organic[lang].map(x => `<li>${x}</li>`).join('')}</ul></div>
    <div class="card result-block warning-card"><h3>🛡️ ${tr('result_prevention')}</h3>
      <ul>${d.prevention[lang].map(x => `<li>${x}</li>`).join('')}</ul></div>
    <button class="btn btn-primary" id="scanBtn" style="margin-top:16px">📷 ${tr('scan_title')}</button>
    <p class="danger-note">${tr('result_disclaimer')}</p>
  `)
  container.querySelector('#scanBtn').onclick = () => app.go('scan')
}
})()
