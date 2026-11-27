// Hindura — landing page: what the programme is, how it works, operators, FAQ.
(function () {
  const HD = (window.HD = window.HD || {})

  function opCard(op, t) {
    return '<button class="op-card" data-op="' + HD.esc(op.code) + '">' +
      '<span class="op-badge" style="--op:' + HD.esc(op.color) + ';--op-ink:' + HD.esc(op.ink) + '">' + HD.esc(op.short) + '</span>' +
      '<span class="op-info"><strong>' + HD.esc(op.name) + '</strong>' +
      '<span>' + HD.esc(t('operator_prefix')) + ' ' + HD.esc(op.prefixes.join(', ')) + '</span></span>' +
      '<span class="btn btn-ghost btn-sm">' + HD.esc(t('choose')) + '</span>' +
      '</button>'
  }

  function step(n, title, body) {
    return '<div class="step"><div class="step-num">' + n + '</div>' +
      '<div><h3>' + HD.esc(title) + '</h3><p>' + HD.esc(body) + '</p></div></div>'
  }

  function benefit(icon, title, body) {
    return '<div class="benefit"><div class="benefit-ico">' + HD.icon(icon, 18) + '</div>' +
      '<h3>' + HD.esc(title) + '</h3><p>' + HD.esc(body) + '</p></div>'
  }

  function faq(q, a) {
    return '<details><summary>' + HD.esc(q) + '<span class="chev">' + HD.icon('chevron', 18) + '</span></summary>' +
      '<p>' + HD.esc(a) + '</p></details>'
  }

  HD.renderHome = function (root) {
    const t = HD.app.t

    root.innerHTML =
      '<section class="hero">' +
        '<span class="hero-badge">' + HD.icon('flag', 14) + HD.esc(t('hero_badge')) + '</span>' +
        '<h1>' + HD.esc(t('hero_title_1')) + '<span class="gold">' + HD.esc(t('hero_title_2')) + '</span></h1>' +
        '<p>' + HD.esc(t('hero_sub')) + '</p>' +
        '<div class="hero-actions">' +
          '<button class="btn btn-gold" id="startBtn">' + HD.esc(t('cta_start')) + HD.icon('arrowr', 18) + '</button>' +
          '<button class="btn btn-ghost" id="trackBtn">' + HD.esc(t('cta_track')) + '</button>' +
        '</div>' +
        '<div class="hero-assure">' +
          '<span class="assure">' + HD.icon('checkc', 15) + HD.esc(t('assure_number')) + '</span>' +
          '<span class="assure">' + HD.icon('money', 15) + HD.esc(t('assure_money')) + '</span>' +
          '<span class="assure">' + HD.icon('user', 15) + HD.esc(t('assure_people')) + '</span>' +
        '</div>' +
      '</section>' +

      '<section class="section">' +
        '<div class="section-head"><h2>' + HD.esc(t('how_title')) + '</h2><p>' + HD.esc(t('how_sub')) + '</p></div>' +
        '<div class="steps">' +
          step(1, t('step1_t'), t('step1_d')) +
          step(2, t('step2_t'), t('step2_d')) +
          step(3, t('step3_t'), t('step3_d')) +
          step(4, t('step4_t'), t('step4_d')) +
        '</div>' +
      '</section>' +

      '<section class="section">' +
        '<div class="section-head"><h2>' + HD.esc(t('operators_title')) + '</h2><p>' + HD.esc(t('operators_sub')) + '</p></div>' +
        '<div class="op-grid">' + HD.operators.map(o => opCard(o, t)).join('') + '</div>' +
      '</section>' +

      '<section class="section">' +
        '<button class="news" id="newsBtn">' +
          '<span class="news-kicker">' + HD.esc(t('news_kicker')) + '</span>' +
          '<h3>' + HD.esc(t('news_title')) + '</h3>' +
          '<p>' + HD.esc(t('news_body')) + '</p>' +
          '<span class="more">' + HD.esc(t('news_cta')) + HD.icon('arrowr', 16) + '</span>' +
        '</button>' +
      '</section>' +

      '<section class="section">' +
        '<div class="section-head"><h2>' + HD.esc(t('benefits_title')) + '</h2></div>' +
        '<div class="benefits">' +
          benefit('sparkle', t('benefit_1_t'), t('benefit_1_d')) +
          benefit('chart', t('benefit_2_t'), t('benefit_2_d')) +
          benefit('money', t('benefit_3_t'), t('benefit_3_d')) +
          benefit('sim', t('benefit_4_t'), t('benefit_4_d')) +
        '</div>' +
      '</section>' +

      '<section class="section">' +
        '<div class="callout">' +
          '<div class="callout-ico">' + HD.icon('money', 22) + '</div>' +
          '<div><h3>' + HD.esc(t('mm_title')) + '</h3>' +
          '<p>' + HD.esc(t('mm_body')) + '</p>' +
          '<button class="btn btn-quiet btn-sm" id="mmBtn" style="padding-left:0">' + HD.esc(t('mm_cta')) + HD.icon('arrowr', 16) + '</button></div>' +
        '</div>' +
      '</section>' +

      '<section class="section">' +
        '<div class="section-head"><h2>' + HD.esc(t('faq_title')) + '</h2></div>' +
        '<div class="faq">' +
          faq(t('faq1_q'), t('faq1_a')) +
          faq(t('faq2_q'), t('faq2_a')) +
          faq(t('faq3_q'), t('faq3_a')) +
          faq(t('faq4_q'), t('faq4_a')) +
          faq(t('faq5_q'), t('faq5_a')) +
          faq(t('faq6_q'), t('faq6_a')) +
        '</div>' +
      '</section>' +

      '<footer class="footer">' +
        '<p>' + HD.esc(t('footer_note')) + '</p>' +
        '<p>' + HD.esc(t('footer_rights')) + '</p>' +
        '<button class="admin-link" id="adminLink">' + HD.icon('shield', 14) + HD.esc(t('footer_admin')) + '</button>' +
      '</footer>'

    root.querySelector('#startBtn').onclick = () => HD.app.go('#/port')
    root.querySelector('#mmBtn').onclick = () => HD.app.go('#/port')
    root.querySelector('#trackBtn').onclick = () => HD.app.go('#/track')
    root.querySelector('#newsBtn').onclick = () => HD.app.go('#/info')
    root.querySelector('#adminLink').onclick = () => HD.app.go('#/admin')

    root.querySelectorAll('.op-card').forEach(card => {
      card.onclick = () => {
        HD.app.state.target = card.dataset.op
        HD.app.go('#/port')
      }
    })
  }
})()
