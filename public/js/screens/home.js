(function () {
const { diseaseById, CROPS } = AS

const TIPS = {
  en: [
    'Scout your fields twice a week — early detection saves the harvest.',
    'Plant certified seed only: it is the cheapest insurance against disease.',
    'Sterilise machetes with bleach between banana mats to stop Kirabiranya (BXW).',
    'Spray potato late blight every 5-7 days during the rainy season — never wait for symptoms.',
    'Dry maize to 13% moisture and store in hermetic (PICS) bags — no weevils, no chemicals.',
    'Rotate maize with beans: beans add free nitrogen back into the soil.',
    'Remove the banana male bud by hand weekly — the #1 defence against BXW.',
    'Apply fertiliser 5-7 cm from the stem and cover it — uncovered urea evaporates.',
    'Whitefly nets over tomato nurseries stop TYLCV before it starts.',
    'Grade your harvest before selling — graded maize fetches 15-25% more.'
  ],
  rw: [
    'Genzura imirima kabiri mu cyumweru — kubona indwara hakiri kare kizarokora isarura.',
    'Tera imbuto zemewe gusa: ni ubwishingizi buhendutse ku ndwara.',
    'Sukura ibyuma na javel hagati y\'ibiti by\'ibitoki kugira ngo uhagarike Kirabiranya.',
    'Tera imiti y\'ikiyongoyongo cy\'ibirayi buri minsi 5-7 mu gihe cy\'imvura — ntukagire icyo utegereza.',
    'Muza ibigori ku buhehere bwa 13% ubike mu mifuka ya PICS — nta binyugunyugu, nta miti.',
    'Simbuza ibigori n\'ibishyimbo: ibishyimbo byongera azote ku buntu mu butaka.',
    'Kuraho indabyo y\'ingabo y\'igitoki n\'intoki buri cyumweru — ubwirinzi bwa mbere bwa BXW.',
    'Shyira ifumbire cm 5-7 uvuye ku giti uyishingire — urea itapfutse irahinduka umwuka.',
    'Imiyoboro ya whitefly ku biti by\'inyanya ihagarika TYLCV itaraba.',
    'Tondeka umusaruro mbere yo kugurisha — ibigori bitondetswe bibona 15-25% by\'inyongera.'
  ]
}

AS.renderHome = function (container, app) {
  const tr = app.t()
  const lang = app.lang
  const name = (app.name || '').trim()
  const greeting = name ? tr('home_greeting').replace('{name}', name) : tr('home_greeting_generic')
  const dayIndex = new Date().getDate() % TIPS[lang].length

  container.innerHTML = `
    <button class="scan-hero" id="scanHero">
      <img class="hero-ico" src="img/camera.png" alt="">
      <span>
        <span class="title">${tr('home_scan_title')}</span>
        <span class="desc">${tr('home_scan_desc')}</span>
      </span>
    </button>

    <div class="section-title">${greeting} 👋</div>
    <div class="grid-2">
      <button class="feature-card" data-go="learn">
        <img class="fico" src="img/book.png" alt="">
        <span class="label">${tr('home_feature_learn')}</span>
        <span class="desc">${tr('home_feature_learn_d')}</span>
      </button>
      <button class="feature-card" data-go="crops">
        <img class="fico round" src="img/crops/maize.png" alt="">
        <span class="label">${tr('home_feature_crops')}</span>
        <span class="desc">${tr('home_feature_crops_d')}</span>
      </button>
      <button class="feature-card" data-go="fertilizer">
        <img class="fico" src="img/chemistry.png" alt="">
        <span class="label">${tr('home_feature_fert')}</span>
        <span class="desc">${tr('home_feature_fert_d')}</span>
      </button>
      <button class="feature-card" data-go="library">
        <img class="fico" src="img/leaf.png" alt="">
        <span class="label">${tr('home_feature_diseases')}</span>
        <span class="desc">${tr('home_feature_diseases_d')}</span>
      </button>
      <button class="feature-card" data-go="store">
        <img class="fico" src="img/cart.png" alt="">
        <span class="label">${tr('home_feature_store')}</span>
        <span class="desc">${tr('home_feature_store_d')}</span>
      </button>
      <button class="feature-card" data-go="assistant">
        <img class="fico" src="img/chat.png" alt="">
        <span class="label">${tr('home_feature_ai')}</span>
        <span class="desc">${tr('home_feature_ai_d')}</span>
      </button>
    </div>

    <div class="tip-card"><b>💡 ${tr('home_tip')}:</b> ${TIPS[lang][dayIndex]}</div>

    <div class="section-title">${tr('home_history')}</div>
    <div id="historyList"></div>
    <p class="progress-note" style="margin-top:14px;text-align:center">📴 ${tr('home_offline')}</p>
  `

  container.querySelector('#scanHero').onclick = () => app.go('scan')
  container.querySelectorAll('[data-go]').forEach(b => (b.onclick = () => app.go(b.dataset.go)))

  const list = container.querySelector('#historyList')
  if (!app.history.length) {
    list.innerHTML = `<div class="empty-state"><span class="emoji">🌾</span>${tr('home_no_history')}</div>`
  } else {
    app.history.forEach(item => {
      const row = document.createElement('button')
      row.className = 'list-row history-item'
      const d = diseaseById(item.diseaseId)
      const date = new Date(item.at).toLocaleDateString(lang === 'rw' ? 'rw-RW' : 'en-GB', { day: 'numeric', month: 'short' })
      if (d) {
        row.innerHTML = `
          <img class="thumb" src="${CROPS[d.crop].img}" alt="">
          <span class="body">
            <span class="name">${d.name[lang]}</span>
            <span class="meta">${item.confidence}% · ${date}</span>
          </span>
          <span class="arrow">›</span>`
        row.onclick = () => app.go('disease', { id: d.id })
      } else {
        row.innerHTML = `
          <span class="emoji">✅</span>
          <span class="body">
            <span class="name">${tr('result_healthy')}</span>
            <span class="meta">${date}</span>
          </span>`
      }
      list.appendChild(row)
    })
  }
}
})()
