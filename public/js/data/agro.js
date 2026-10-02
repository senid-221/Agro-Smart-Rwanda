// AgroSmart Rwanda — agronomy reference + real weather + deterministic risk/insight logic.
// NOTHING here is invented at runtime: coordinates are Rwanda's 30 districts, the nutrient
// numbers are read straight back out of our own crop-guide fertilising rates, weather comes
// from the free Open-Meteo API, and every alert/insight is a deterministic rule over real data.
(function () {
  const AS = (window.AS = window.AS || {})

  // ---------- districts (lat/lon of the district capital) ----------
  AS.RW_DISTRICTS = [
    { id: 'nyarugenge', en: 'Nyarugenge', rw: 'Nyarugenge', prov: 'Kigali', lat: -1.9500, lon: 30.0588 },
    { id: 'gasabo', en: 'Gasabo', rw: 'Gasabo', prov: 'Kigali', lat: -1.8600, lon: 30.1100 },
    { id: 'kicukiro', en: 'Kicukiro', rw: 'Kicukiro', prov: 'Kigali', lat: -1.9900, lon: 30.1300 },
    { id: 'musanze', en: 'Musanze', rw: 'Musanze', prov: 'North', lat: -1.5000, lon: 29.6333 },
    { id: 'burera', en: 'Burera', rw: 'Burera', prov: 'North', lat: -1.4600, lon: 29.8300 },
    { id: 'gakenke', en: 'Gakenke', rw: 'Gakenke', prov: 'North', lat: -1.7000, lon: 29.7800 },
    { id: 'rulindo', en: 'Rulindo', rw: 'Rulindo', prov: 'North', lat: -1.7500, lon: 29.9000 },
    { id: 'gicumbi', en: 'Gicumbi', rw: 'Gicumbi', prov: 'North', lat: -1.5800, lon: 30.0400 },
    { id: 'huye', en: 'Huye', rw: 'Huye', prov: 'South', lat: -2.6000, lon: 29.7900 },
    { id: 'nyamagabe', en: 'Nyamagabe', rw: 'Nyamagabe', prov: 'South', lat: -2.4800, lon: 29.5600 },
    { id: 'nyaruguru', en: 'Nyaruguru', rw: 'Nyaruguru', prov: 'South', lat: -2.5600, lon: 29.5800 },
    { id: 'gisagara', en: 'Gisagara', rw: 'Gisagara', prov: 'South', lat: -2.6300, lon: 29.9400 },
    { id: 'ruhango', en: 'Ruhango', rw: 'Ruhango', prov: 'South', lat: -2.2300, lon: 29.7900 },
    { id: 'muhanga', en: 'Muhanga', rw: 'Muhanga', prov: 'South', lat: -2.0800, lon: 29.7500 },
    { id: 'kamonyi', en: 'Kamonyi', rw: 'Kamonyi', prov: 'South', lat: -2.0500, lon: 30.0200 },
    { id: 'nyanza', en: 'Nyanza', rw: 'Nyanza', prov: 'South', lat: -2.3500, lon: 29.7500 },
    { id: 'nyagatare', en: 'Nyagatare', rw: 'Nyagatare', prov: 'East', lat: -1.3000, lon: 30.3200 },
    { id: 'gatsibo', en: 'Gatsibo', rw: 'Gatsibo', prov: 'East', lat: -1.6600, lon: 30.3200 },
    { id: 'kayonza', en: 'Kayonza', rw: 'Kayonza', prov: 'East', lat: -1.9000, lon: 30.6300 },
    { id: 'kirehe', en: 'Kirehe', rw: 'Kirehe', prov: 'East', lat: -2.1700, lon: 30.6600 },
    { id: 'ngoma', en: 'Ngoma', rw: 'Ngoma', prov: 'East', lat: -2.1600, lon: 30.4400 },
    { id: 'rwamagana', en: 'Rwamagana', rw: 'Rwamagana', prov: 'East', lat: -1.9500, lon: 30.4300 },
    { id: 'bugesera', en: 'Bugesera', rw: 'Bugesera', prov: 'East', lat: -2.0700, lon: 30.1500 },
    { id: 'rubavu', en: 'Rubavu', rw: 'Rubavu', prov: 'West', lat: -1.6800, lon: 29.2500 },
    { id: 'nyabihu', en: 'Nyabihu', rw: 'Nyabihu', prov: 'West', lat: -1.7600, lon: 29.6000 },
    { id: 'ngororero', en: 'Ngororero', rw: 'Ngororero', prov: 'West', lat: -1.8500, lon: 29.6200 },
    { id: 'karongi', en: 'Karongi', rw: 'Karongi', prov: 'West', lat: -2.0600, lon: 29.4000 },
    { id: 'rutsiro', en: 'Rutsiro', rw: 'Rutsiro', prov: 'West', lat: -2.0300, lon: 29.5900 },
    { id: 'rusizi', en: 'Rusizi', rw: 'Rusizi', prov: 'West', lat: -2.4800, lon: 28.9800 },
    { id: 'nyamasheke', en: 'Nyamasheke', rw: 'Nyamasheke', prov: 'West', lat: -2.3600, lon: 29.2000 }
  ]

  AS.district = function (id) {
    for (const d of AS.RW_DISTRICTS) if (d.id === id) return d
    return AS.RW_DISTRICTS[0]
  }

  // ---------- live GPS -> nearest Rwanda district ----------
  // Haversine distance from the phone's real coordinates to each district capital.
  function haversineKm(aLat, aLon, bLat, bLon) {
    const R = 6371
    const dLat = (bLat - aLat) * Math.PI / 180
    const dLon = (bLon - aLon) * Math.PI / 180
    const s = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(aLat * Math.PI / 180) * Math.cos(bLat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    return 2 * R * Math.asin(Math.sqrt(s))
  }

  AS.nearestDistrict = function (lat, lon) {
    let best = AS.RW_DISTRICTS[0]
    let bestKm = Infinity
    for (const d of AS.RW_DISTRICTS) {
      const km = haversineKm(lat, lon, d.lat, d.lon)
      if (km < bestKm) { bestKm = km; best = d }
    }
    return { district: best, km: Math.round(bestKm) }
  }

  // Read the phone's live position and resolve the nearest district. Rejects when
  // geolocation is unavailable or denied so callers can fall back to the manual
  // district — we never guess a location the phone did not actually report.
  AS.locateDistrict = function (opts) {
    return new Promise(function (resolve, reject) {
      if (!navigator.geolocation) return reject(new Error('no_geolocation'))
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          const lat = pos.coords.latitude
          const lon = pos.coords.longitude
          const near = AS.nearestDistrict(lat, lon)
          resolve({ district: near.district, km: near.km, lat: lat, lon: lon, accuracy: Math.round(pos.coords.accuracy || 0) })
        },
        function (err) { reject(err) },
        Object.assign({ enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }, opts || {})
      )
    })
  }

  // Locate via GPS and persist the resolved district (flagged gps:true) so every
  // screen reads the farmer's real region. Returns the located district or null
  // when GPS is denied/unavailable (caller keeps the manual district).
  AS.useGpsDistrict = async function () {
    try {
      const loc = await AS.locateDistrict()
      AS.savePrefs({ district: loc.district.id, gps: true, gpsKm: loc.km })
      return loc
    } catch (e) {
      return null
    }
  }

  // ---------- per-crop soil / nutrient reference ----------
  // ph = the optimum range quoted in our own crop guides.
  // n/p/k = actual nutrient per season, calculated from the NPK blend rate in the guide
  // (17-17-17 means 17 kg N, 17 kg P2O5 and 17 kg K2O per 100 kg of fertiliser) plus any
  // urea top-dressing (46% N). unit tells the UI how to display it.
  AS.SOIL = {
    maize: { ph: [5.5, 7.0], n: { v: '40–52', u: 'kg/ha' }, p: { v: '17', u: 'kg/ha' }, k: { v: '17', u: 'kg/ha' }, src: { en: 'NPK 17-17-17 @100 kg/ha + urea 50–75 kg/ha', rw: 'NPK 17-17-17 @100 kg/ha + urea 50–75 kg/ha' } },
    bean: { ph: [6.0, 7.0], n: { v: '10–14', u: 'kg/ha' }, p: { v: '10–14', u: 'kg/ha' }, k: { v: '10–14', u: 'kg/ha' }, src: { en: 'NPK 17-17-17 @60–80 kg/ha, no urea (legume)', rw: 'NPK 17-17-17 @60–80 kg/ha, nta urea (ikinyampeke)' } },
    banana: { ph: [5.5, 7.5], n: { v: '85', u: 'g/mat' }, p: { v: '85', u: 'g/mat' }, k: { v: '85', u: 'g/mat' }, src: { en: 'NPK 17-17-17 @250 g/mat twice a year', rw: 'NPK 17-17-17 @250 g/mat kabiri mu mwaka' } },
    cassava: { ph: [5.5, 7.0], n: { v: '17', u: 'kg/ha' }, p: { v: '17', u: 'kg/ha' }, k: { v: '17', u: 'kg/ha' }, src: { en: 'NPK 17-17-17 @100 kg/ha, 1 month after planting', rw: 'NPK 17-17-17 @100 kg/ha, ukwezi 1 nyuma yo gutera' } },
    potato: { ph: [5.0, 6.5], n: { v: '51–68', u: 'kg/ha' }, p: { v: '51–68', u: 'kg/ha' }, k: { v: '51–68', u: 'kg/ha' }, src: { en: 'NPK 17-17-17 @300–400 kg/ha (heavy feeder)', rw: 'NPK 17-17-17 @300–400 kg/ha (bikeneye ifumbire nyinshi)' } },
    sweetpotato: { ph: [5.5, 6.5], n: { v: '—', u: '' }, p: { v: '—', u: '' }, k: { v: '—', u: '' }, src: { en: 'Compost 5–10 t/ha; avoid excess nitrogen', rw: 'Ifumbire y\'ibimera t 5–10/ha; wirinde azote nyinshi' } },
    tomato: { ph: [6.0, 7.0], n: { v: '34+', u: 'kg/ha' }, p: { v: '34', u: 'kg/ha' }, k: { v: '34+', u: 'kg/ha' }, src: { en: 'NPK 17-17-17 @200 kg/ha + CAN top-dress', rw: 'NPK 17-17-17 @200 kg/ha + CAN y\'inyongera' } },
    rice: { ph: [5.5, 7.0], n: { v: '30+', u: 'kg/ha' }, p: { v: '15', u: 'kg/ha' }, k: { v: '15', u: 'kg/ha' }, src: { en: 'NPK 20-10-10 @150 kg/ha + urea in 2 splits', rw: 'NPK 20-10-10 @150 kg/ha + urea mu bice 2' } },
    coffee: { ph: [5.0, 6.5], n: { v: '34–51', u: 'g/tree' }, p: { v: '34–51', u: 'g/tree' }, k: { v: '34–51', u: 'g/tree' }, src: { en: 'NPK 17-17-17 @100–150 g/tree twice a year', rw: 'NPK 17-17-17 @100–150 g/tree kabiri mu mwaka' } },
    tea: { ph: [4.5, 5.5], n: { v: '5–10', u: 'g/bush' }, p: { v: '1–2', u: 'g/bush' }, k: { v: '1–2', u: 'g/bush' }, src: { en: 'NPK 25-5-5 @20–40 g/bush, split in the rain', rw: 'NPK 25-5-5 @20–40 g/bush, mu bice mu gihe cy\'imvura' } },
    sorghum: { ph: [5.5, 7.5], n: { v: '20', u: 'kg/ha' }, p: { v: '8.5', u: 'kg/ha' }, k: { v: '8.5', u: 'kg/ha' }, src: { en: 'NPK @50 kg/ha basal + urea 25 kg/ha', rw: 'NPK @50 kg/ha y\'ibanze + urea 25 kg/ha' } },
    groundnut: { ph: [5.5, 7.0], n: { v: '8.5', u: 'kg/ha' }, p: { v: '8.5', u: 'kg/ha' }, k: { v: '8.5', u: 'kg/ha' }, src: { en: 'NPK @50 kg/ha (legume) + lime for calcium', rw: 'NPK @50 kg/ha (ikinyampeke) + ishwagara ya kalisiyumu' } }
  }

  AS.soilFor = function (cropId) { return AS.SOIL[cropId] || AS.SOIL.maize }

  // ---------- real weather (Open-Meteo, no key, CORS open) ----------
  const WX_TTL = 30 * 60 * 1000

  const WMO = {
    0: { en: 'Clear sky', rw: 'Izuba ryaka', ico: 'sun' },
    1: { en: 'Mostly clear', rw: 'Izuba ryinshi', ico: 'sun' },
    2: { en: 'Partly cloudy', rw: 'Ibicu bike', ico: 'cloud' },
    3: { en: 'Overcast', rw: 'Ibicu byinshi', ico: 'cloud' },
    45: { en: 'Fog', rw: 'Igihu', ico: 'cloud' },
    48: { en: 'Freezing fog', rw: 'Igihu gikonje', ico: 'cloud' },
    51: { en: 'Light drizzle', rw: 'Imvura nke', ico: 'rain' },
    53: { en: 'Drizzle', rw: 'Imvura y\'udushashi', ico: 'rain' },
    55: { en: 'Heavy drizzle', rw: 'Imvura nyinshi', ico: 'rain' },
    61: { en: 'Light rain', rw: 'Imvura nke', ico: 'rain' },
    63: { en: 'Rain', rw: 'Imvura', ico: 'rain' },
    65: { en: 'Heavy rain', rw: 'Imvura nyinshi', ico: 'rain' },
    80: { en: 'Rain showers', rw: 'Imvura igwa', ico: 'rain' },
    81: { en: 'Heavy showers', rw: 'Imvura nyinshi igwa', ico: 'rain' },
    82: { en: 'Violent showers', rw: 'Imvura y\'umuvu', ico: 'rain' },
    95: { en: 'Thunderstorm', rw: 'Imvura n\'inkuba', ico: 'flash' },
    96: { en: 'Storm with hail', rw: 'Inkuba na shelegi', ico: 'flash' },
    99: { en: 'Storm with hail', rw: 'Inkuba na shelegi', ico: 'flash' }
  }

  AS.wmo = function (code) { return WMO[code] || { en: 'Cloudy', rw: 'Ibicu', ico: 'cloud' } }

  AS.fetchWeather = async function (districtId) {
    const d = AS.district(districtId)
    const key = 'as_wx_' + d.id
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        const c = JSON.parse(raw)
        if (c && c.ts && (Date.now() - c.ts) < WX_TTL && c.wx) return { district: d, wx: c.wx, cached: true }
      }
    } catch (e) { /* fall through to network */ }

    const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + d.lat +
      '&longitude=' + d.lon +
      '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m' +
      '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
      '&timezone=Africa%2FKigali&forecast_days=3'

    const r = await fetch(url)
    if (!r.ok) throw new Error('weather_http_' + r.status)
    const j = await r.json()
    const cur = j.current || {}
    const daily = j.daily || {}
    const dDates = daily.time || []
    const dMax = daily.temperature_2m_max || []
    const dMin = daily.temperature_2m_min || []
    const dRain = daily.precipitation_probability_max || []
    const dCode = daily.weather_code || []
    // 3-day forecast (iteganyagihe) as real per-day values from Open-Meteo.
    const days = dDates.slice(0, 3).map((date, i) => ({
      date: date,
      tmax: Math.round(dMax[i]),
      tmin: Math.round(dMin[i]),
      rain: dRain[i] == null ? null : Math.round(dRain[i]),
      code: dCode[i],
      cond: AS.wmo(dCode[i])
    }))
    const wx = {
      temp: Math.round(cur.temperature_2m),
      feels: Math.round(cur.apparent_temperature),
      rh: Math.round(cur.relative_humidity_2m),
      wind: Math.round((cur.wind_speed_10m || 0) / 3.6 * 10) / 10, // km/h -> m/s
      code: cur.weather_code,
      cond: AS.wmo(cur.weather_code),
      rainProb: (daily.precipitation_probability_max || []).slice(0, 3),
      tmax: dMax[0],
      tmin: dMin[0],
      days: days,
      ts: Date.now()
    }
    try { localStorage.setItem(key, JSON.stringify({ ts: wx.ts, wx: wx })) } catch (e) { /* quota */ }
    return { district: d, wx: wx, cached: false }
  }

  AS.cachedWeather = function (districtId) {
    try {
      const raw = localStorage.getItem('as_wx_' + AS.district(districtId).id)
      if (!raw) return null
      const c = JSON.parse(raw)
      if (!c || !c.wx || !c.ts) return null
      if ((Date.now() - c.ts) > WX_TTL * 24) return null // stale but better than nothing
      return c.wx
    } catch (e) { return null }
  }

  // ---------- deterministic pest/disease risk rules ----------
  // Each rule fires only on real measured weather and points at a REAL disease id in
  // AS.DISEASES, so tapping it opens the genuine knowledge-base entry.
  const COOL_WET = {
    potato: 'potato-late-blight', tomato: 'tomato-late-blight', maize: 'maize-northern-leaf-blight',
    bean: 'bean-angular-leaf-spot', banana: 'banana-sigatoka', coffee: 'coffee-leaf-rust',
    tea: 'tea-blight', rice: 'rice-blast', sorghum: 'sorghum-anthracnose'
  }
  const WARM_WET = {
    potato: 'potato-early-blight', tomato: 'tomato-early-blight', rice: 'rice-bacterial-leaf-blight',
    bean: 'bean-anthracnose', maize: 'maize-gray-leaf-spot', coffee: 'coffee-berry-disease',
    banana: 'banana-xanthomonas-wilt'
  }
  const DRY_WARM = {
    maize: 'fall-armyworm', cassava: 'cassava-mosaic', tomato: 'tomato-tylcv',
    groundnut: 'groundnut-rosette', bean: 'bean-common-mosaic'
  }

  AS.disease = function (id) {
    const list = AS.DISEASES || []
    for (const d of list) if (d.id === id) return d
    return null
  }

  // Returns [{level:'high'|'medium'|'low', diseaseId|null, title:{en,rw}, body:{en,rw}}]
  AS.risk = function (wx, cropId) {
    if (!wx) return []
    const out = []
    const rh = wx.rh, t = wx.temp, wind = wx.wind
    const crop = cropId || 'maize'

    if (rh >= 80 && t < 22 && COOL_WET[crop]) {
      const d = AS.disease(COOL_WET[crop])
      out.push({
        level: 'high', diseaseId: COOL_WET[crop],
        title: { en: (d ? d.name.en : 'Fungal disease') + ' risk is high', rw: 'Ibyago bya ' + (d ? d.name.rw : 'indwara ya fungus') + ' biri hejuru' },
        body: {
          en: 'Humidity is ' + rh + '% at ' + t + '°C — cool and wet weather is exactly what leaf blight fungi need. Scout today and spray on schedule.',
          rw: 'Ubuhehere ni ' + rh + '% ku bushyuhe bwa ' + t + '°C — ubukonje n\'ubuhehere ni byo fungus y\'amababi ikenera. Genzura umurima uyu munsi utere imiti ku gahunda.'
        }
      })
    } else if (rh >= 80 && t >= 22 && WARM_WET[crop]) {
      const d = AS.disease(WARM_WET[crop])
      out.push({
        level: 'medium', diseaseId: WARM_WET[crop],
        title: { en: (d ? d.name.en : 'Disease') + ' conditions building', rw: 'Ibihe bya ' + (d ? d.name.rw : 'indwara') + ' birimo kwiyongera' },
        body: {
          en: rh + '% humidity at ' + t + '°C. Warm, wet weather spreads infection quickly — check the lower leaves first.',
          rw: 'Ubuhehere ' + rh + '% ku bushyuhe ' + t + '°C. Ubushyuhe n\'ubuhehere bikwirakwiza indwara vuba — banza urebe amababi yo hasi.'
        }
      })
    } else if (rh < 60 && t >= 22 && DRY_WARM[crop]) {
      const d = AS.disease(DRY_WARM[crop])
      out.push({
        level: 'medium', diseaseId: DRY_WARM[crop],
        title: { en: (d ? d.name.en : 'Pest') + ' pressure rising', rw: 'Igitutu cya ' + (d ? d.name.rw : 'udukoko') + ' kiriyongera' },
        body: {
          en: 'Only ' + rh + '% humidity at ' + t + '°C. Dry warm weather favours insect vectors — look for feeding damage and new leaves.',
          rw: 'Ubuhehere ' + rh + '% gusa ku bushyuhe ' + t + '°C. Ibihe bityo bikundwa n\'udusimba — reba ibimenyetso by\'imirire n\'amababi mashya.'
        }
      })
    } else {
      out.push({
        level: 'low', diseaseId: null,
        title: { en: 'Conditions are calm', rw: 'Ibihe bimeze neza' },
        body: {
          en: 'Humidity ' + rh + '% at ' + t + '°C — no strong disease pressure right now. Keep the weekly scout going.',
          rw: 'Ubuhehere ' + rh + '% ku bushyuhe ' + t + '°C — nta gitutu gikomeye cy\'indwara. Komeza kugenzura buri cyumweru.'
        }
      })
    }

    if (wind >= 8) {
      out.push({
        level: 'low', diseaseId: null,
        title: { en: 'Wind ' + wind + ' m/s — spray window poor', rw: 'Umuyaga ' + wind + ' m/s — ntabwo ari igihe cyo gutera imiti' },
        body: {
          en: 'Wind this strong drifts spray away from the leaf and off your field. Wait for a calmer hour, early morning is usually best.',
          rw: 'Umuyaga nk\'uyuujyana umuti kure y\'ibabi n\'umurima wawe. Tegereza umuyaga mucye, mu gitondo kare akenshi ni byiza.'
        }
      })
    }

    const rain3 = (wx.rainProb || []).slice(0, 3)
    if (rain3.some(function (p) { return p >= 70 })) {
      out.push({
        level: 'low', diseaseId: null,
        title: { en: 'Heavy rain likely within 3 days', rw: 'Imvura nyinshi ishoboka mu minsi 3' },
        body: {
          en: 'Rain chance reaches ' + Math.max.apply(null, rain3) + '%. Open drains in the marshland plots and clear the water furrows so roots do not sit in water.',
          rw: 'Amahirwe y\'imvura agera kuri ' + Math.max.apply(null, rain3) + '%. Fungura imiyoboro y\'amazi mu mirima yo mu bishanga kugira ngo imiziitame mu mazi.'
        }
      })
    }

    return out
  }

  // ---------- AI insight (deterministic summary of real numbers) ----------
  AS.insight = function (wx, cropId, lastScan, lang) {
    const l = lang === 'rw' ? 'rw' : 'en'
    const crop = (AS.CROPS || {})[cropId] || null
    const cropName = crop ? crop[l] : (l === 'rw' ? 'imyaka yawe' : 'your crops')

    if (!wx) {
      return {
        title: { en: 'AI Insight', rw: 'Impanuro z\'ubwenge bw\'ubukorikori' },
        body: {
          en: 'Pick your district in Settings and I will pull today\'s live weather to advise on spraying and planting.',
          rw: 'Hitamo akarere kawe muri Igenamiterere kugira ngo nkure ibihe by\'uyu munsi nkugire inama ku gutera imiti.'
        }
      }
    }

    const risks = AS.risk(wx, cropId)
    const top = risks[0]
    const d = top && top.diseaseId ? AS.disease(top.diseaseId) : null

    let body
    if (top && top.level === 'high' && d) {
      body = {
        en: 'Cold wet air (' + wx.rh + '%, ' + wx.temp + '°C) in your district makes ' + d.name.en +
          ' likely on ' + cropName + '. Walk the field today: if you see the first spots, spray the approved fungicide this evening rather than waiting a week.',
        rw: 'Ubukonje n\'ubuhehere (' + wx.rh + '%, ' + wx.temp + '°C) mu karere kawe bishobora gutera ' + d.name.rw +
          ' kuri ' + cropName + '. Genda mu murima uyu munsi: niba ubonye ibimenyetso bya mbere, tera umuti wemewe uyu mugoroba aho gutegereza icyumweru.'
      }
    } else if (lastScan && lastScan.disease) {
      const ld = AS.disease(lastScan.disease)
      body = {
        en: 'Your last scan found ' + (ld ? ld.name.en : lastScan.disease) + ' at ' + Math.round(lastScan.confidence) +
          '% confidence. Weather today is ' + wx.temp + '°C with ' + wx.rh + '% humidity — finish the treatment plan and re-check the same plants in 5 days.',
        rw: 'Isuzuma rya nyuma ryabonye ' + (ld ? ld.name.rw : lastScan.disease) + ' ku kigero cya ' + Math.round(lastScan.confidence) +
          '%. Ibihe by\'uyu munsi ni ' + wx.temp + '°C n\'ubuhehere ' + wx.rh + '% — rangiza gahunda y\'imiti wongere ugenzure ibyo bimera mu minsi 5.'
      }
    } else {
      body = {
        en: 'Weather in ' + AS.district(AS.prefs().district).en + ' today: ' + wx.temp + '°C, ' + wx.rh +
          '% humidity, wind ' + wx.wind + ' m/s. Nothing extreme for ' + cropName +
          ' — a good day to weed, top-dress or scan a leaf you are unsure about.',
        rw: 'Ibihe i ' + AS.district(AS.prefs().district).rw + ' uyu munsi: ' + wx.temp + '°C, ubuhehere ' + wx.rh +
          '%, umuyaga ' + wx.wind + ' m/s. Nta kibazo gikomeye kuri ' + cropName +
          ' — ni umunsi mwiza wo gukura ibyatsi, gufumbira cyangwa gusuzuma ibabi.'
      }
    }
    return { title: { en: 'AI Insight', rw: 'Impanuro y\'ikoranabuhanga' }, body: body, risk: top }
  }

  // ---------- user prefs (district + focus crop) ----------
  AS.prefs = function () {
    let p = {}
    try { p = JSON.parse(localStorage.getItem('as_prefs') || '{}') } catch (e) { p = {} }
    return {
      district: p.district && AS.district(p.district) ? p.district : 'gasabo',
      crop: p.crop && AS.CROPS && AS.CROPS[p.crop] ? p.crop : 'maize',
      gps: !!p.gps,
      gpsKm: p.gpsKm || 0
    }
  }
  AS.savePrefs = function (patch) {
    const cur = AS.prefs()
    const next = Object.assign({}, cur, patch || {})
    try { localStorage.setItem('as_prefs', JSON.stringify(next)) } catch (e) { /* ignore */ }
    return next
  }

  AS.tempBand = function (t, cropId) {
    // Optimum growing band per crop, from the altitude/season guidance in our crop guides.
    const bands = {
      potato: [15, 22], tea: [14, 25], coffee: [16, 24], maize: [18, 30], bean: [18, 28],
      banana: [20, 32], cassava: [20, 32], sweetpotato: [20, 30], tomato: [18, 28],
      rice: [20, 32], sorghum: [22, 34], groundnut: [22, 32]
    }
    const b = bands[cropId] || [18, 30]
    if (t < b[0]) return 'low'
    if (t > b[1]) return 'high'
    return 'ok'
  }
})()
