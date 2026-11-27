// Hindura — explainer for the Cabinet-approved programme.
(function () {
  const HD = (window.HD = window.HD || {})

  HD.renderInfo = function (root) {
    const t = HD.app.t

    root.innerHTML =
      '<div class="wizard">' +
        '<span class="hero-badge" style="background:var(--blue-bg);color:var(--brand);border-color:#d5e5fa">' +
          HD.icon('flag', 14) + HD.esc(t('info_kicker')) +
        '</span>' +
        '<h1 style="font-size:26px;line-height:1.15;letter-spacing:-.03em;margin:14px 0 12px">' + HD.esc(t('info_title')) + '</h1>' +
        '<div class="card"><p class="card-body">' + HD.esc(t('info_p1')) + '</p></div>' +
        '<div class="card"><p class="card-body">' + HD.esc(t('info_p2')) + '</p></div>' +
        '<div class="card"><p class="card-body">' + HD.esc(t('info_p3')) + '</p></div>' +

        '<div class="callout" style="margin-top:12px">' +
          '<div class="callout-ico">' + HD.icon('money', 22) + '</div>' +
          '<div><h3>' + HD.esc(t('info_mm_title')) + '</h3><p style="margin-bottom:0">' + HD.esc(t('info_mm_p')) + '</p></div>' +
        '</div>' +

        '<div class="card" style="margin-top:12px">' +
          '<h3 class="card-title">' + HD.esc(t('info_goal_title')) + '</h3>' +
          '<ul class="next-list" style="margin:12px 0 0">' +
            '<li><span class="n">1</span><span>' + HD.esc(t('info_goal_1')) + '</span></li>' +
            '<li><span class="n">2</span><span>' + HD.esc(t('info_goal_2')) + '</span></li>' +
            '<li><span class="n">3</span><span>' + HD.esc(t('info_goal_3')) + '</span></li>' +
          '</ul>' +
        '</div>' +

        '<figure style="margin:16px 0 0;padding:20px;border-radius:var(--radius);background:linear-gradient(145deg,#071b33,#0b4fa8);color:#fff">' +
          '<p style="margin:0 0 10px;font-size:15px;line-height:1.6;font-weight:600">' + HD.esc(t('info_quote')) + '</p>' +
          '<figcaption style="font-size:11.5px;color:#c9dcf3">' + HD.esc(t('info_quote_src')) + '</figcaption>' +
        '</figure>' +

        '<div class="card" style="margin-top:16px;text-align:center">' +
          '<h3 class="card-title">' + HD.esc(t('info_cta_title')) + '</h3>' +
          '<p class="card-body" style="margin-bottom:14px">' + HD.esc(t('info_cta_body')) + '</p>' +
          '<button class="btn btn-primary btn-block" id="startBtn">' + HD.esc(t('cta_start')) + HD.icon('arrowr', 18) + '</button>' +
        '</div>' +
      '</div>'

    root.querySelector('#startBtn').onclick = () => HD.app.go('#/port')
  }
})()
