// Hindura — inline SVG icon set + small UI helpers (no build step, no deps).
(function () {
  const HD = (window.HD = window.HD || {})

  const P = {
    home: '<path d="M3.5 10.5 12 3.8l8.5 6.7V20a1 1 0 0 1-1 1h-4.6v-5.6H9.1V21H4.5a1 1 0 0 1-1-1z"/>',
    swap: '<path d="M4 8.5h13M13.5 5 17 8.5 13.5 12"/><path d="M20 15.5H7M10.5 12 7 15.5 10.5 19"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8h.01"/>',
    shield: '<path d="M12 21.5s7.5-3.6 7.5-9.4V5.3L12 2.5 4.5 5.3v6.8c0 5.8 7.5 9.4 7.5 9.4z"/><path d="m9.2 11.8 2.1 2.1 3.8-3.9"/>',
    phone: '<rect x="6" y="2.5" width="12" height="19" rx="2.6"/><path d="M10.5 18.5h3"/>',
    check: '<path d="M20 6.5 9.5 17.5 4 12"/>',
    checkc: '<circle cx="12" cy="12" r="9"/><path d="M16.2 9.4 10.6 15 7.8 12.2"/>',
    arrowr: '<path d="M5 12h13M12.5 5.5 19 12l-6.5 6.5"/>',
    arrowl: '<path d="M19 12H6M11.5 5.5 5 12l6.5 6.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.3l3.4 2"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    idcard: '<rect x="2.5" y="5" width="19" height="14" rx="2.2"/><circle cx="8" cy="11" r="2"/><path d="M5 16c.6-1.6 1.7-2.4 3-2.4s2.4.8 3 2.4M14 10h4M14 13.5h4"/>',
    mail: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>',
    sim: '<path d="M7 2.5h7L19 7.5v14H7a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2z"/><rect x="8.5" y="11" width="7" height="6" rx="1"/>',
    money: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 9.5h.01M18 14.5h.01"/>',
    lock: '<rect x="4.5" y="10" width="15" height="11" rx="2"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/>',
    chart: '<path d="M4 20V10M9.7 20V4.5M15.3 20v-7M21 20V7"/>',
    alert: '<path d="M10.3 3.9 1.9 18.3A2 2 0 0 0 3.6 21.3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9.5v4.2M12 17.4h.01"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4.5V11h-6.5"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    sparkle: '<path d="M12 3.2 13.9 9l5.8 1.9-5.8 1.9L12 18.6 10.1 12.8 4.3 10.9 10.1 9z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3.5 12h17M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    send: '<path d="M21.5 2.5 2.5 10l7.5 3 3 7.5z"/><path d="M21.5 2.5 10 13"/>',
    bell: '<path d="M18 8.5a6 6 0 1 0-12 0c0 6-2.2 7.5-2.2 7.5h16.4S18 14.5 18 8.5"/><path d="M13.7 20a2 2 0 0 1-3.4 0"/>',
    flag: '<path d="M5 21V3.5M5 4.5h11l-1.6 3.5L16 11.5H5"/>'
  }

  HD.icon = function (name, size) {
    const d = P[name] || P.info
    const s = size || 20
    return '<svg class="i" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ' +
      'aria-hidden="true">' + d + '</svg>'
  }

  HD.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ))
  }

  // Kinyarwanda month names (Intl has no reliable rw locale in every browser).
  const RW_MONTHS = ['Mutarama', 'Gashyantare', 'Werurwe', 'Mata', 'Gicurasi', 'Kamena',
    'Nyakanga', 'Kanama', 'Nzeri', 'Ukwakira', 'Ugushyingo', 'Ukuboza']
  const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  function dateParts(iso) {
    if (!iso) return null
    // A bare DATE (YYYY-MM-DD) is a calendar day, not an instant.
    if (typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      const p = iso.split('-').map(Number)
      return { y: p[0], m: p[1] - 1, d: p[2], hh: null, mm: null }
    }
    const dt = new Date(iso)
    if (isNaN(dt)) return null
    return { y: dt.getFullYear(), m: dt.getMonth(), d: dt.getDate(), hh: dt.getHours(), mm: dt.getMinutes() }
  }

  HD.fmtDate = function (iso, lang) {
    const p = dateParts(iso)
    if (!p) return ''
    const months = lang === 'en' ? EN_MONTHS : RW_MONTHS
    return p.d + ' ' + months[p.m] + ' ' + p.y
  }

  HD.fmtDateTime = function (iso, lang) {
    const p = dateParts(iso)
    if (!p || p.hh === null) return HD.fmtDate(iso, lang)
    const hh = String(p.hh).padStart(2, '0')
    const mm = String(p.mm).padStart(2, '0')
    return HD.fmtDate(iso, lang) + ' · ' + hh + ':' + mm
  }

  HD.toast = function (msg) {
    const el = document.createElement('div')
    el.className = 'toast'
    el.textContent = msg
    document.body.appendChild(el)
    requestAnimationFrame(() => el.classList.add('on'))
    setTimeout(() => {
      el.classList.remove('on')
      setTimeout(() => el.remove(), 250)
    }, 2600)
  }

  HD.copy = async function (text) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (e) {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      let ok = false
      try { ok = document.execCommand('copy') } catch (err) { ok = false }
      ta.remove()
      return ok
    }
  }

  HD.operatorDot = function (op, size) {
    if (!op) return ''
    return '<span class="op-dot" style="--dot:' + HD.esc(op.color) + ';width:' + (size || 10) + 'px;height:' + (size || 10) + 'px"></span>'
  }
})()
