// AgroSmart Rwanda — inline SVG icon set + small render helpers.
// No image files needed; every icon inherits `currentColor`.
(function () {
  const AS = (window.AS = window.AS || {})

  const P = {
    home: '<path d="M3.5 10.5 12 3.8l8.5 6.7V20a1 1 0 0 1-1 1h-4.6v-5.6H9.1V21H4.5a1 1 0 0 1-1-1z"/>',
    chart: '<path d="M4 20V10M9.7 20V4.5M15.3 20v-7M21 20V7"/>',
    bell: '<path d="M18 8.5a6 6 0 1 0-12 0c0 6-2.2 7.5-2.2 7.5h16.4S18 14.5 18 8.5"/><path d="M13.7 20a2 2 0 0 1-3.4 0"/>',
    gear: '<circle cx="12" cy="12" r="3.1"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
    scan: '<path d="M3.5 8V5.5A2 2 0 0 1 5.5 3.5H8M16 3.5h2.5a2 2 0 0 1 2 2V8M20.5 16v2.5a2 2 0 0 1-2 2H16M8 20.5H5.5a2 2 0 0 1-2-2V16"/><path d="M3.5 12h17"/>',
    drop: '<path d="M12 3.2s6 6.3 6 10.2a6 6 0 0 1-12 0c0-3.9 6-10.2 6-10.2z"/>',
    activity: '<path d="M22 12h-4l-3 8-6-16-3 8H2"/>',
    flask: '<path d="M9 3h6M10 3v5.5L4.8 18a2 2 0 0 0 1.7 3h11a2 2 0 0 0 1.7-3L14 8.5V3"/><path d="M7.5 14.5h9"/>',
    thermo: '<path d="M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0z"/>',
    pin: '<path d="M20 10.3c0 5.7-8 12-8 12s-8-6.3-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="2.8"/>',
    wind: '<path d="M9.6 4.8A3 3 0 1 1 12 10H3M15.5 8A3 3 0 1 1 18 13.2H3M17.6 17.2A2.6 2.6 0 1 0 19.8 19H3"/>',
    sparkle: '<path d="M12 3.2 13.9 9l5.8 1.9-5.8 1.9L12 18.6 10.1 12.8 4.3 10.9 10.1 9z"/><path d="M18.8 3.2v3.2M20.4 4.8h-3.2"/>',
    warn: '<path d="M10.3 3.9 1.9 18.3A2 2 0 0 0 3.6 21.3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9.5v4.2M12 17.4h.01"/>',
    sprout: '<path d="M12 21v-8"/><path d="M12 13C12 9 9 7 4.5 7 4.5 11 7.5 13 12 13zM12 13c0-3.4 2.6-5.2 6.5-5.2C18.5 11 15.9 13 12 13z"/>',
    check: '<path d="M20 6.5 9.5 17.5 4 12"/>',
    checkc: '<circle cx="12" cy="12" r="9"/><path d="M16.2 9.4 10.6 15 7.8 12.2"/>',
    arrowr: '<path d="M5 12h13M12.5 5.5 19 12l-6.5 6.5"/>',
    arrowl: '<path d="M19 12H6M11.5 5.5 5 12l6.5 6.5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    flash: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    dots: '<circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/>',
    book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v16H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v4H6.5A2.5 2.5 0 0 1 4 20.5z"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 7H6"/>',
    chat: '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.7 9.7 0 0 1-3.4-.6L3 21l1.7-4.4a8.3 8.3 0 0 1-1.2-4.1A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4z"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 4 13c0-6 5-9 16-9 0 8-3.6 13-9 13z"/><path d="M4.5 20.5C7 16 11 13.5 16 12"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    cal: '<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    camera: '<path d="M21 8.5h-3.2l-1.6-2.4H7.8L6.2 8.5H3a1.5 1.5 0 0 0-1.5 1.5v8A1.5 1.5 0 0 0 3 19.5h18a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 21 8.5z"/><circle cx="12" cy="13.5" r="3.4"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="m21 15.5-5-5L5 20"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.3l3.4 2"/>',
    sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 1.8v2.4M12 19.8v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M1.8 12h2.4M19.8 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7"/>',
    cloud: '<path d="M17.6 19H6.8A4.3 4.3 0 0 1 6.3 10.5a6 6 0 0 1 11.6 1.6A3.7 3.7 0 0 1 17.6 19z"/>',
    rain: '<path d="M17.6 16.5H6.8A4.3 4.3 0 0 1 6.3 8a6 6 0 0 1 11.6 1.6 3.7 3.7 0 0 1-.3 6.9z"/><path d="M8.5 19.5 7.5 22M12.5 19.5 11.5 22M16.5 19.5 15.5 22"/>',
    shield: '<path d="M12 21.5s7.5-3.6 7.5-9.4V5.3L12 2.5 4.5 5.3v6.8c0 5.8 7.5 9.4 7.5 9.4z"/><path d="m9.2 11.8 2.1 2.1 3.8-3.9"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    edit: '<path d="M11 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-6"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/>',
    trash: '<path d="M3.5 6h17M8.5 6V4h7v2M18.5 6l-1 14h-11l-1-14"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="0.6"/>',
    map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
    layers: '<path d="m12 2.5 9 5-9 5-9-5z"/><path d="m3 12.5 9 5 9-5M3 17l9 5 9-5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8h.01"/>',
    mic: '<rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
    send: '<path d="M21.5 2.5 2.5 10l7.5 3 3 7.5z"/><path d="M21.5 2.5 10 13"/>',
    star: '<path d="m12 3 2.7 5.7 6.3.8-4.6 4.4 1.2 6.2L12 17.1 6.4 20.1l1.2-6.2L3 9.5l6.3-.8z"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/>',
    refresh: '<path d="M20.5 12a8.5 8.5 0 1 1-2.5-6M18 3.5V7h-3.5"/>'
  }

  AS.ICONS = P

  AS.icon = function (name, size, extraClass) {
    const d = P[name] || P.info
    const s = size || 20
    return '<svg class="ico-i ' + (extraClass || '') + '" width="' + s + '" height="' + s +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'
  }

  // Circular progress ring (used by Crop Health rows).
  AS.ring = function (pct, size) {
    const s = size || 42
    const r = (s - 6) / 2
    const c = 2 * Math.PI * r
    const p = Math.max(0, Math.min(100, Number(pct) || 0))
    const off = c * (1 - p / 100)
    const color = p >= 70 ? '#2e7d32' : p >= 45 ? '#e0862f' : '#c62828'
    return '<div class="ring" style="width:' + s + 'px;height:' + s + 'px">' +
      '<svg width="' + s + '" height="' + s + '">' +
      '<circle cx="' + s / 2 + '" cy="' + s / 2 + '" r="' + r + '" fill="none" stroke="#e4f2e5" stroke-width="5"/>' +
      '<circle cx="' + s / 2 + '" cy="' + s / 2 + '" r="' + r + '" fill="none" stroke="' + color +
      '" stroke-width="5" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) +
      '" stroke-dashoffset="' + off.toFixed(1) + '"/>' +
      '</svg><span class="ring-n">' + Math.round(p) + '%</span></div>'
  }

  // Line chart with area fill + dots (Analytics "Growth Progress").
  // pts = [{v:0..100}] — real values, already normalised by the caller.
  AS.lineChart = function (values, opts) {
    const o = opts || {}
    const W = o.w || 300
    const H = o.h || 110
    const pad = 8
    const n = values.length
    const lo = Math.min.apply(null, values)
    const hi = Math.max.apply(null, values)
    const span = (hi - lo) || 1
    const x = function (i) { return pad + (W - pad * 2) * (n === 1 ? 0.5 : i / (n - 1)) }
    const y = function (v) { return H - pad - (H - pad * 2) * ((v - lo) / span) }
    const line = values.map(function (v, i) {
      return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)
    }).join(' ')
    const area = line + ' L' + x(n - 1).toFixed(1) + ' ' + H + ' L' + x(0).toFixed(1) + ' ' + H + ' Z'
    const dots = values.map(function (v, i) {
      return '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="3" fill="#fff" stroke="#2e7d32" stroke-width="2"/>'
    }).join('')
    const grid = [0.25, 0.5, 0.75].map(function (f) {
      const gy = (H * f).toFixed(1)
      return '<line x1="0" y1="' + gy + '" x2="' + W + '" y2="' + gy + '" stroke="#dfe7dc" stroke-width="1"/>'
    }).join('')
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '" preserveAspectRatio="none" style="display:block">' +
      '<defs><linearGradient id="gca" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#4c9a4e" stop-opacity="0.28"/>' +
      '<stop offset="100%" stop-color="#4c9a4e" stop-opacity="0.02"/>' +
      '</linearGradient></defs>' +
      grid +
      '<path d="' + area + '" fill="url(#gca)"/>' +
      '<path d="' + line + '" fill="none" stroke="#2e7d32" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      dots + '</svg>'
  }

  AS.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    })
  }

  // Kinyarwanda has no browser locale, so format the date ourselves.
  const RW_DAYS = ['Ku cyumweru', 'Kuwa mbere', 'Kuwa kabiri', 'Kuwa gatatu', 'Kuwa kane', 'Kuwa gatanu', 'Kuwa gatandatu']
  const RW_MONTHS = ['Mutarama', 'Gashyantare', 'Werurwe', 'Mata', 'Gicurasi', 'Kamena',
    'Nyakanga', 'Kanama', 'Nzeri', 'Ukwakira', 'Ugushyingo', 'Ukuboza']
  const EN_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const RW_DAYS_S = ['Cyu', 'Mbe', 'Kab', 'Gtu', 'Kan', 'Gtn', 'Gtd']
  const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  AS.dateLabel = function (lang, date) {
    const d = date || new Date()
    if (lang === 'rw') return RW_DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + RW_MONTHS[d.getMonth()]
    return EN_DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + EN_MONTHS[d.getMonth()]
  }

  AS.dayName = function (lang, date) {
    const d = date || new Date()
    return lang === 'rw' ? RW_DAYS_S[d.getDay()] : EN_DAYS[d.getDay()]
  }

  AS.ago = function (lang, ts) {
    if (!ts) return ''
    const mins = Math.round((Date.now() - ts) / 60000)
    if (mins < 1) return lang === 'rw' ? 'ubu' : 'now'
    if (mins < 60) return mins + (lang === 'rw' ? ' min' : ' min')
    const h = Math.round(mins / 60)
    if (h < 24) return h + (lang === 'rw' ? ' amasaha' : 'h')
    const days = Math.round(h / 24)
    return days + (lang === 'rw' ? ' iminsi' : 'd')
  }

  // ---------- Lottie ----------
  // Two free LottieFiles animations are self-hosted in /lottie (Lottie Simple
  // License, no attribution required):
  //   scan-rings.json     <- assets-v2.lottiefiles.com/a/d62d68ce-1150-11ee-836b-2fdc9f56f40f/nlrTeVZKPl.lottie
  //   thinking-dots.json  <- assets-v2.lottiefiles.com/a/948d6990-1151-11ee-9fdc-bfd7dbdb6f23/1m8X6QziYo.lottie (recoloured to our green)
  // The player is fetched on first use so its 168 KB stay off the startup path,
  // and any failure leaves the caller's CSS fallback untouched.
  let player = null
  function loadPlayer() {
    if (window.lottie) return Promise.resolve(window.lottie)
    if (!player) {
      player = new Promise(function (resolve, reject) {
        const s = document.createElement('script')
        s.src = 'vendor/lottie_light.min.js'
        // A cold-start or offline fetch can still fire onload with an HTML error
        // page, so require the global to exist; otherwise drop the cached
        // promise and let the next call retry.
        const fail = function (why) {
          s.remove()
          player = null
          reject(new Error(why))
        }
        s.onload = function () { window.lottie ? resolve(window.lottie) : fail('lottie_bad_payload') }
        s.onerror = function () { fail('lottie_unavailable') }
        document.head.appendChild(s)
      })
    }
    return player
  }

  // Fills el with the animation; returns a stop() that destroys it.
  const live = new Set()
  AS.lottie = function (el, src, opts) {
    const o = opts || {}
    let anim = null
    let dead = false
    const stop = function () {
      dead = true
      live.delete(stop)
      if (anim) { try { anim.destroy() } catch (e) { /* already gone */ } anim = null }
    }
    live.add(stop)
    loadPlayer()
      .then(function (lottie) {
        if (dead || !el.isConnected) return null
        return fetch(src).then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('lottie_404')) })
          .then(function (data) {
            if (dead || !el.isConnected) return
            el.innerHTML = ''
            el.classList.add('lottie-host')
            anim = lottie.loadAnimation({
              container: el,
              renderer: 'svg',
              loop: o.loop !== false,
              autoplay: o.autoplay !== false,
              animationData: data,
              rendererSettings: { preserveAspectRatio: o.align || 'xMidYMid meet' }
            })
            if (o.speed) anim.setSpeed(o.speed)
          })
      })
      .catch(function () { /* keep the CSS fallback already inside el */ })
    return stop
  }

  // Called on every route change so a screen that is torn down never keeps
  // an invisible animation running.
  AS.lottieStopAll = function () {
    Array.from(live).forEach(function (stop) { stop() })
    live.clear()
  }

  // One delegated listener instead of per-button wiring, so buttons rendered
  // later (store results, chat, admin panels) get the same press feedback.
  const RIPPLE = '.btn, .btn-solid, .btn-ghost, .chip, .sc-chip, .sc-btn, .feature-card, .list-row, .stat-card, .bn-go'
  document.addEventListener('pointerdown', function (e) {
    const host = e.target.closest && e.target.closest(RIPPLE)
    if (!host || host.disabled) return
    const r = host.getBoundingClientRect()
    const size = Math.max(r.width, r.height)
    const s = document.createElement('span')
    s.className = 'ripple'
    s.style.width = s.style.height = size + 'px'
    s.style.left = (e.clientX - r.left - size / 2) + 'px'
    s.style.top = (e.clientY - r.top - size / 2) + 'px'
    host.appendChild(s)
    setTimeout(function () { s.remove() }, 620)
  }, { passive: true })
})()
