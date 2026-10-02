(function () {
const { LESSONS, LESSON_CATEGORIES } = AS
const { CROP_GUIDES, CROPS } = AS

function backBtn(app, route, label) {
  const b = document.createElement('button')
  b.className = 'back-btn'
  b.textContent = label
  b.onclick = () => app.go(route)
  return b
}

AS.renderLearn = function (container, app) {
  const tr = app.t()
  const lang = app.lang

  container.innerHTML = `
    <p class="progress-note" style="margin-bottom:14px">${tr('learn_sub')}</p>
    <button class="list-row" id="cropsRow">
      <span class="emoji"><img class="fico round" src="img/crops/maize.png" alt=""></span>
      <span class="body">
        <span class="name">${tr('crops_title')}</span>
        <span class="meta">${tr('crops_sub')}</span>
      </span>
      <span class="arrow">›</span>
    </button>
    <div style="height:14px"></div>
  `
  container.querySelector('#cropsRow').onclick = () => app.go('crops')

  LESSONS.forEach(l => {
    const cat = LESSON_CATEGORIES[l.category]
    const row = document.createElement('button')
    row.className = 'list-row'
    row.innerHTML = `
      <span class="emoji">${l.emoji}</span>
      <span class="body">
        <span class="name">${l.title[lang]}</span>
        <span class="meta">${cat[lang]} · ⏱ ${l.minutes} ${tr('learn_minutes')}</span>
      </span>
      <span class="arrow">›</span>`
    row.onclick = () => app.go('lesson', { id: l.id })
    container.appendChild(row)
  })
}

AS.renderLessonDetail = function (container, app, id) {
  const tr = app.t()
  const lang = app.lang
  const lesson = LESSONS.find(l => l.id === id)
  if (!lesson) { app.go('learn'); return }

  container.appendChild(backBtn(app, 'learn', tr('back')))
  container.insertAdjacentHTML('beforeend', `
    <div class="detail-hero">
      <span class="emoji">${lesson.emoji}</span>
      <h2>${lesson.title[lang]}</h2>
      <div class="sci">⏱ ${lesson.minutes} ${tr('learn_minutes')}</div>
    </div>
    <div class="lesson-body" id="body"></div>
  `)
  const body = container.querySelector('#body')
  lesson.body[lang].forEach(sec => {
    if (sec.steps) {
      body.insertAdjacentHTML('beforeend', `<h4>${sec.h}</h4><ol class="step-list">${sec.items.map(i => `<li>${i}</li>`).join('')}</ol>`)
    } else {
      body.insertAdjacentHTML('beforeend', `<h4>${sec.h}</h4><p>${sec.p}</p>`)
    }
  })
}

AS.renderCrops = function (container, app) {
  const tr = app.t()
  const lang = app.lang

  container.appendChild(backBtn(app, 'learn', tr('back')))
  container.insertAdjacentHTML('beforeend', `
    <p class="progress-note" style="margin:0 0 14px">${tr('crops_sub')}</p>
  `)

  CROP_GUIDES.forEach(c => {
    const row = document.createElement('button')
    row.className = 'list-row'
    row.innerHTML = `
      <span class="emoji"><img class="thumb" src="${CROPS[c.id].img}" alt=""></span>
      <span class="body">
        <span class="name">${c.name[lang]}</span>
        <span class="meta">${tr('crop_regions')}: ${c.regions[lang].split(',')[0]}…</span>
      </span>
      <span class="arrow">›</span>`
    row.onclick = () => app.go('crop', { id: c.id })
    container.appendChild(row)
  })
}

AS.renderCropDetail = function (container, app, id) {
  const tr = app.t()
  const lang = app.lang
  const crop = CROP_GUIDES.find(c => c.id === id)
  if (!crop) { app.go('crops'); return }

  container.appendChild(backBtn(app, 'crops', tr('back')))
  container.insertAdjacentHTML('beforeend', `
    <div class="detail-hero">
      <span class="emoji"><img class="hero-crop" src="${CROPS[crop.id].img}" alt=""></span>
      <h2>${crop.name[lang]}</h2>
      <div class="sci">📍 ${crop.regions[lang]}</div>
    </div>
    ${crop.overview ? `<div class="card result-block"><h3>🌿 ${tr('crop_overview')}</h3><p>${crop.overview[lang]}</p></div>` : ''}
    <div class="card result-block"><h3>📅 ${tr('crop_season')}</h3><p>${crop.season[lang]}</p></div>
    <div class="card result-block"><h3>🌱 ${tr('crop_planting')}</h3><ul>${crop.planting[lang].map(x => `<li>${x}</li>`).join('')}</ul></div>
    <div class="card result-block"><h3>🧪 ${tr('crop_fertilizing')}</h3><ul>${crop.fertilizing[lang].map(x => `<li>${x}</li>`).join('')}</ul></div>
    <div class="card result-block"><h3>🧺 ${tr('crop_harvesting')}</h3><ul>${crop.harvesting[lang].map(x => `<li>${x}</li>`).join('')}</ul></div>
    <div class="card result-block warning-card"><h3>💡 ${tr('crop_tips')}</h3><ul>${crop.tips[lang].map(x => `<li>${x}</li>`).join('')}</ul></div>
  `)
}
})()
