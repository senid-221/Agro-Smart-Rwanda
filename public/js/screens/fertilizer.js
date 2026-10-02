(function () {
const { FERTILIZERS, SOIL_TIPS } = AS

AS.renderFertilizer = function (container, app) {
  const tr = app.t()
  const lang = app.lang

  container.innerHTML = `
    <p class="progress-note" style="margin-bottom:14px">${tr('fert_sub')}</p>
  `

  FERTILIZERS.forEach(f => {
    const row = document.createElement('button')
    row.className = 'list-row'
    row.innerHTML = `
      <span class="emoji">${f.emoji}</span>
      <span class="body">
        <span class="name">${f.name[lang]}</span>
        <span class="meta">${f.type[lang]}</span>
      </span>
      <span class="arrow">›</span>`
    row.onclick = () => app.go('fertDetail', { id: f.id })
    container.appendChild(row)
  })

  container.insertAdjacentHTML('beforeend', `
    <div class="section-title">${tr('fert_soil_tips')} ⛰️</div>
    <div class="card"><ul>${SOIL_TIPS[lang].map(x => `<li style="margin-bottom:6px;font-size:13.5px">${x}</li>`).join('')}</ul></div>
  `)
}

AS.renderFertilizerDetail = function (container, app, id) {
  const tr = app.t()
  const lang = app.lang
  const f = FERTILIZERS.find(x => x.id === id)
  if (!f) { app.go('fertilizer'); return }

  const back = document.createElement('button')
  back.className = 'back-btn'
  back.textContent = tr('back')
  back.onclick = () => app.go('fertilizer')
  container.appendChild(back)

  container.insertAdjacentHTML('beforeend', `
    <div class="detail-hero">
      <span class="emoji">${f.emoji}</span>
      <h2>${f.name[lang]}</h2>
      <div class="sci">${f.type[lang]}</div>
    </div>
    <div class="card result-block"><h3>🎯 ${tr('fert_uses')}</h3><p>${f.uses[lang]}</p></div>
    <div class="card result-block treatment-card"><h3>📏 ${tr('fert_dosage')}</h3>
      <ul>${f.dosage[lang].map(x => `<li>${x}</li>`).join('')}</ul></div>
    <div class="card result-block warning-card"><h3>⚠️ ${tr('fert_cautions')}</h3>
      <ul>${f.cautions[lang].map(x => `<li>${x}</li>`).join('')}</ul></div>
  `)
}
})()
