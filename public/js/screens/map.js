// AgroSmart Rwanda — Map screen.
// A real interactive map (Leaflet + OpenStreetMap tiles — no API key, no samples).
// Plots only honest, real locations: the phone's live GPS position (when the
// farmer allows it), the selected district capital, and the farmer's own Crop
// Health Cases at the district they were recorded in. A case with no recorded
// district is listed but never plotted at an invented coordinate.
(function () {
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

  // Real district match (no fallback) so we never plot a case at a guessed place.
  function districtById(id) {
    for (const d of AS.RW_DISTRICTS) if (d.id === id) return d
    return null
  }

  AS.renderMap = function (container, app) {
    const tr = app.t()
    const lang = app.lang === 'en' ? 'en' : 'rw'
    const prefs = app.prefs()
    const home = districtById(prefs.district) || AS.RW_DISTRICTS[0]
    const CROPS = AS.CROPS || {}

    // Province -> district picker (same real 30 districts as the weather screen).
    const provs = {}
    AS.RW_DISTRICTS.forEach(d => { (provs[d.prov] = provs[d.prov] || []).push(d) })
    const regionOptions = Object.keys(provs).map(p =>
      '<optgroup label="' + esc(p) + '">' +
      provs[p].map(d => '<option value="' + d.id + '"' + (d.id === home.id ? ' selected' : '') + '>' + esc(d[lang]) + '</option>').join('') +
      '</optgroup>').join('')

    container.innerHTML = `
      <div class="card wx-gps">
        <span class="wx-gps-ico">${AS.icon('target', 20)}</span>
        <span class="wx-gps-body">
          <span class="wx-gps-loc" id="mapLoc">${esc(home[lang])}</span>
          <span class="wx-gps-sub" id="mapGpsSub">${prefs.gps ? esc(tr('wx_gps_on')) : esc(tr('map_gps_hint'))}</span>
        </span>
        <button class="btn btn-outline sm" id="gpsBtn">${esc(tr('map_use_gps'))}</button>
      </div>

      <label class="wx-region">
        <span>${esc(tr('map_region'))}</span>
        <select id="regionSel">${regionOptions}</select>
      </label>

      <div class="map-shell">
        <div id="map"></div>
        <div class="map-none" id="mapNone" hidden>${esc(tr('map_unavailable'))}</div>
      </div>

      <div class="map-legend">
        <span><i class="lg lg-you"></i>${esc(tr('map_lg_you'))}</span>
        <span><i class="lg lg-dist"></i>${esc(tr('map_lg_district'))}</span>
        <span><i class="lg lg-case"></i>${esc(tr('map_lg_case'))}</span>
      </div>

      <div class="section-title">${esc(tr('map_cases'))}</div>
      <div id="mapCaseList">
        <div class="card empty-state" style="padding:16px"><span class="emoji">⏳</span>${esc(tr('map_loading'))}</div>
      </div>

      <p class="danger-note">${esc(tr('map_source'))}</p>
    `

    const listEl = container.querySelector('#mapCaseList')
    const statusKey = { open: 'cs_open', monitoring: 'cs_monitoring', resolved: 'cs_resolved', closed: 'cs_closed' }

    // Leaflet is loaded from a CDN in index.html. If it is not present (offline /
    // blocked) we say so honestly and still list the farmer's cases below.
    if (!window.L) {
      const mp = container.querySelector('#map')
      if (mp) mp.hidden = true
      const none = container.querySelector('#mapNone')
      if (none) none.hidden = false
    }

    let map = null, youMarker = null, accCircle = null
    const caseLayer = window.L ? L.layerGroup() : null

    function initMap(center) {
      if (!window.L || map) return
      map = L.map(container.querySelector('#map'), { zoomControl: true, attributionControl: true })
        .setView([center.lat, center.lon], 9)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map)
      // Selected district marker (real capital coordinate).
      L.marker([center.lat, center.lon], { title: center.name })
        .addTo(map)
        .bindPopup('<b>' + esc(center.name) + '</b>')
      if (caseLayer) caseLayer.addTo(map)
    }

    function recenter(d) {
      const locEl = container.querySelector('#mapLoc')
      if (locEl) locEl.textContent = d[lang]
      if (map) map.setView([d.lat, d.lon], 9)
    }

    // Plot the farmer's real cases. Only cases with a recorded district get a pin;
    // every case is listed below (tappable to open the Crop Health Case).
    function paintCases(cases) {
      if (caseLayer) caseLayer.clearLayers()
      if (!cases.length) {
        listEl.innerHTML = `<div class="card empty-state" style="padding:16px"><span class="emoji">🌿</span>${esc(tr('map_no_cases'))}</div>`
        return
      }
      // Group plotted cases by district so pins do not stack invisibly.
      const groups = {}
      cases.forEach(c => {
        const d = districtById(c.district)
        if (!d) return
        ;(groups[d.id] = groups[d.id] || { d, items: [] }).items.push(c)
      })
      Object.values(groups).forEach(g => {
        const label = g.items.map(c => {
          const crop = CROPS[c.crop] ? CROPS[c.crop][lang] : (c.crop || '—')
          return esc(crop) + ' · ' + esc(tr(statusKey[c.status] || 'cs_open'))
        }).join('<br>')
        if (map && caseLayer) {
          L.circleMarker([g.d.lat, g.d.lon], {
            radius: 7, color: '#c0392b', weight: 2, fillColor: '#e74c3c', fillOpacity: 0.85
          }).addTo(caseLayer).bindPopup('<b>' + esc(g.d[lang]) + '</b><br>' + label)
        }
      })

      listEl.innerHTML = cases.map(c => {
        const crop = CROPS[c.crop] ? CROPS[c.crop] : null
        const d = districtById(c.district)
        const where = [c.sector, d ? d[lang] : null].filter(Boolean).join(', ') || tr('map_no_location')
        const ico = crop && crop.img ? `<img src="${crop.img}" alt="">` : `<span style="font-size:20px">${(crop && crop.emoji) || '🌿'}</span>`
        return `<button class="list-row" data-case="${c.id}">
          <span class="cr-ico">${ico}</span>
          <span class="body"><span class="name">${esc(crop ? crop[lang] : (c.crop || '—'))}</span><span class="meta">${esc(where)} · ${esc(tr(statusKey[c.status] || 'cs_open'))}</span></span>
          <span class="arrow">${AS.icon('arrowr', 16)}</span>
        </button>`
      }).join('')
      listEl.querySelectorAll('[data-case]').forEach(b => {
        b.onclick = () => app.go('case', { id: b.dataset.case })
      })
    }

    async function loadCases() {
      const r = await AS.api.get('/ai/cases')
      if (!container.isConnected) return
      const cases = (r && !r.error && r.cases) ? r.cases : []
      paintCases(cases)
    }

    container.querySelector('#regionSel').onchange = e => {
      const d = districtById(e.target.value)
      if (d) recenter(d)
    }

    container.querySelector('#gpsBtn').onclick = async () => {
      const sub = container.querySelector('#mapGpsSub')
      if (sub) sub.textContent = tr('map_locating')
      let loc = null
      try { loc = await AS.locateDistrict() } catch (e) { loc = null }
      if (!container.isConnected) return
      if (!loc) { if (sub) sub.textContent = tr('wx_gps_fail'); return }
      AS.savePrefs({ district: loc.district.id, gps: true, gpsKm: loc.km })
      const sel = container.querySelector('#regionSel')
      if (sel) sel.value = loc.district.id
      if (sub) sub.textContent = tr('wx_gps_on') + (loc.accuracy ? ' · ±' + loc.accuracy + ' m' : '')
      if (map) {
        if (!youMarker) {
          youMarker = L.marker([loc.lat, loc.lon], { title: tr('map_lg_you') }).addTo(map)
        } else { youMarker.setLatLng([loc.lat, loc.lon]) }
        youMarker.bindPopup('<b>' + esc(tr('map_lg_you')) + '</b>').openPopup()
        if (accCircle) map.removeLayer(accCircle)
        if (loc.accuracy) {
          accCircle = L.circle([loc.lat, loc.lon], {
            radius: loc.accuracy, color: '#2f80ed', weight: 1, fillColor: '#2f80ed', fillOpacity: 0.12
          }).addTo(map)
        }
        map.setView([loc.lat, loc.lon], 13)
      } else {
        recenter(loc.district)
      }
    }

    initMap(home)
    loadCases()
  }
})()
