// AgroSmart Rwanda — AI instructions & responder.
// AS.AI_POLICY is the instruction set: WHAT the assistant may answer, WHICH
// source it answers from, HOW the reply is built and WHEN it must refuse.
// AS.aiReply() applies the policy against the offline knowledge bases.
AS.AI_POLICY = {
  role: {
    en: 'AgroSmart AI Assistant — farming helper for Rwandan farmers',
    rw: 'Umufasha AI wa AgroSmart — umujyanama w\'abahinzi bo mu Rwanda'
  },
  language: {
    en: 'Always reply in the language the farmer writes in (Kinyarwanda or English).',
    rw: 'Hora usubiza mu rurimi umuhinzi yandikishije (Ikinyarwanda cyangwa Icyongereza).'
  },
  intents: [
    {
      id: 'greeting',
      when: { en: 'Farmer opens the chat or says hello', rw: 'Umuhinzi atangira ikiganiro cyangwa aramukanya' },
      how: { en: 'Short welcome, then list what it can help with', rw: 'Ikaze ngufi, hanyuma urutonde rw\'ibyo ifasha' },
      source: 'none'
    },
    {
      id: 'disease',
      when: { en: 'Question about symptoms, spots, yellowing, wilting, rot or a disease name', rw: 'Ikibazo ku bimenyetso, ibara, umuhondo, kwuma, kubora cyangwa izina ry\'indwara' },
      how: { en: 'Match the disease library, then give cause + first treatment step + first prevention step', rw: 'Shakisha mu rutonde rw\'indwara, utange impamvu + intambwe ya mbere y\'imiti + iy\'irinda' },
      source: 'AS.DISEASES (library)'
    },
    {
      id: 'product',
      when: { en: 'Question about price, buying, stock, or a product name (seeds, tools, sprayers...)', rw: 'Ikibazo ku giciro, kugura, cyangwa izina ry\'igicuruzwa (imbuto, ibikoresho...)' },
      how: { en: 'Look the item up in the store catalog and quote the exact RWF price and unit; never invent prices', rw: 'Shakisha mu Iduka utange igiciro nyacyo mu RWF n\'ipimo; ntihimbe igiciro' },
      source: 'AS.PRODUCTS (store)'
    },
    {
      id: 'fertilizer',
      when: { en: 'Question about which fertilizer to use or how much', rw: 'Ikibazo ku bwoko bw\'ifumbire cyangwa ingano' },
      how: { en: 'Quote the crop guide fertilizing steps for the named crop, else the general NPK+urea rule', rw: 'Tanga amabwiriza y\'ifumbire y\'igihingwa kivuzwe, nibura NPK + urea muri rusange' },
      source: 'AS.CROP_GUIDES / AS.FERTILIZERS'
    },
    {
      id: 'planting',
      when: { en: 'Question about how or when to plant, seasons, spacing', rw: 'Ikibazo uko cyangwa ryari batera, ibihembwe, intera' },
      how: { en: 'Quote season + first planting step of the crop guide', rw: 'Tanga igihembwe + intambwe ya mbere yo gutera y\'igihingwa' },
      source: 'AS.CROP_GUIDES'
    },
    {
      id: 'scan',
      when: { en: 'Farmer mentions a photo, leaf picture or video', rw: 'Umuhinzi avuga ifoto, ishusho y\'ibabi cyangwa video' },
      how: { en: 'Point to the Scan screen for instant detection', rw: 'Mwohereza kuri Gusuzuma kugira ngo AI isuzume ako kanya' },
      source: 'detector'
    },
    {
      id: 'out_of_scope',
      when: { en: 'Politics, sport, human medicine, betting or anything non-farming', rw: 'Politiki, imikino, ubuvuzi bw\'abantu, imikino y\'amahirwe cyangwa ibitari ubuhinzi' },
      how: { en: 'Politely refuse and redirect to farming topics', rw: 'Yirinde gusubiza, mwohereze ku bibazo by\'ubuhinzi' },
      source: 'none'
    },
    {
      id: 'fallback',
      when: { en: 'Nothing matches with confidence', rw: 'Nta cyerekezo gifatika kibonetse' },
      how: { en: 'Say it is not sure, suggest Scan / Diseases / price questions; never guess', rw: 'Vuga ko itabi neza, werekeze kuri Gusuzuma / Indwara / ibiciro; ntikeke' },
      source: 'none'
    }
  ],
  rules: [
    { en: 'Never invent prices or medicines — only catalog and library content', rw: 'Ntihimba ibiciro cyangwa imiti — koresha Iduka n\'urutonde rw\'indwara gusa' },
    { en: 'Keep answers short: at most 4 lines', rw: 'Subiza ngufi: imirongo itarenze 4' },
    { en: 'For diseases always pair treatment with prevention', rw: 'Ku ndwara, huza imiti n\'uburyo bwo kuyirinda' },
    { en: 'When unsure, ask the farmer to scan a leaf or consult an agronomist', rw: 'Iyo utabi neza, sabwe gufata ifoto y\'ibabi cyangwa kugana agronome' }
  ]
}

AS.aiReply = function (text, lang) {
  const low = String(text).toLowerCase()
  const has = (...ws) => ws.some(w => low.includes(w))
  const s = ' ' + low + ' '
  const RW_WORDS = [' y\'', ' y ', ' mu ', ' ku ', ' ni ', ' na ', ' cyangwa', ' ntabwo', ' afite', ' mfite',
    ' igiciro', ' uruhe', ' iyihe', ' ry\'', ' amababi', ' ibigori', ' imbuto', ' ifumbire', ' indwara',
    ' imiti', ' guhinga', ' gura', ' ngura', ' muraho', ' mbese', ' bite', ' umuhondo', ' iduka', ' natumye']
  const EN_WORDS = [' the ', ' what', ' which', ' how', ' price', ' my ', ' for ', ' with', ' fertilizer',
    ' maize', ' leaves', ' yellow', ' buy', ' hello', ' tomato', ' potato', ' beans']
  const rwHits = RW_WORDS.filter(w => s.includes(w)).length
  const enHits = EN_WORDS.filter(w => s.includes(w)).length
  const L = rwHits > enHits ? 'rw' : enHits > rwHits ? 'en' : (lang === 'en' ? 'en' : 'rw')
  const crops = AS.CROPS
  const guides = AS.CROP_GUIDES || []

  const mentionCrop = () => {
    for (const [id, c] of Object.entries(crops)) {
      if (has(c.en.toLowerCase(), c.rw.toLowerCase())) return guides.find(g => g.id === id) || { id, name: c }
    }
    return null
  }

  // 1 — greeting
  if (/^(hi|hello|hey|muraho|mwaramutse|mwiriwe|niteho)\b/.test(low.trim())) {
    return {
      intent: 'greeting',
      text: L === 'rw'
        ? 'Muraho! Ndi Umufasha AI wa AgroSmart. Mbaze ku ndwara z\'ibihingwa, ibiciro by\'ibicuruzwa, ifumbire cyangwa uburyo bwo guhinga.'
        : 'Hello! I am the AgroSmart AI Assistant. Ask me about crop diseases, product prices, fertilizers or how to plant.'
    }
  }

  // 2 — out of scope
  if (has('politic', 'politiki', 'football', 'umupira w', 'betting', 'casino', 'amahirwe', 'headache', 'umutwe ubabaza', 'urukundo', 'love ')) {
    return {
      intent: 'out_of_scope',
      text: L === 'rw'
        ? 'Mbabarira — nsubiza ibibazo by\'ubuhinzi gusa. Gerageza umbaze ku bihingwa, indwara, ifumbire cyangwa ibiciro by\'ibicuruzwa.'
        : 'Sorry — I only answer farming questions. Try asking about crops, diseases, fertilizers or product prices.'
    }
  }

  // 3 — product / price
  const priceAsk = has('price', 'igiciro', 'igura', 'gura', 'buy', 'shop', 'store', 'iduka', 'amafaranga', 'cost', 'frw', 'rfw')
  const findProduct = () => {
    const STOP = ['price', 'cost', 'buy', 'gura', 'igura', 'giciro', 'igiciro', 'store', 'shop', 'iduka',
      'the', 'and', 'for', 'with', 'what', 'which', 'how', 'much', 'many', 'please', 'nyihe', 'uruhe', 'rfw', 'frw']
    const tokens = low.split(/[^a-z']/i).filter(w => w.length >= 3 && !STOP.includes(w))
    let best = null, bestScore = 0
    for (const p of AS.PRODUCTS) {
      const name = (p.en + ' ' + p.rw).toLowerCase()
      let score = 0
      for (const w of tokens) if (name.includes(w)) score++
      if (score > bestScore) { bestScore = score; best = p }
    }
    return bestScore >= 1 ? best : null
  }
  const catKeyword = [
    ['fungicide', 'prot-fung'], ['insecticide', 'prot-insect'], ['herbicide', 'prot-herb'],
    ['pesticide', 'prot-pest'], ['sprayer', 'prot-knap'], ['hoe', 'tool-hoe'], ['machete', 'tool-machete'],
    ['wheelbarrow', 'tool-wheel'], ['incubator', 'live-incub'], ['silo', 'post-silo']
  ].find(([k]) => has(k))
  const plantingStrong = has('ryari', 'when', 'season', 'igihembwe', 'sowing', 'how to plant', 'tera', 'plant', 'guhinga')
  if (priceAsk || catKeyword || (!plantingStrong && findProduct())) {
    let p = findProduct()
    if (!p && catKeyword) p = AS.PRODUCTS.find(x => x.id === catKeyword[1])
    if (!p && priceAsk) {
      const g = mentionCrop()
      if (g) p = AS.PRODUCTS.find(x => x.cat === 'seeds' && x.id.includes(g.id))
    }
    if (p) {
      return {
        intent: 'product',
        text: `${p.emoji ? p.emoji + ' ' : ''}${p[L]} — ${AS.fmtRWF(p.price)} / ${p.unit[L]}. ` + (L === 'rw'
          ? 'Biboneka mu Iduka: shyira mu gatebo utumize.'
          : 'Available in the Store: add to cart to order.')
      }
    }
    return {
      intent: 'product',
      text: L === 'rw'
        ? 'Ntabwo nzi icyo gicuruzwa. Reba mu Iduka (imbuto, ifumbire, imiti, ibikoresho, ivomerera...) cyangwa umbaze igiciro cy\'ikizwi nka NPK, isuka, imbuto z\'ibigori.'
        : 'I don\'t stock that name. Browse the Store (seeds, fertilizers, crop protection, tools, irrigation...) or ask a known price like NPK, hoes, maize seeds.'
    }
  }

  // 4 — disease
  if (has('indwara', 'disease', 'symptom', 'ikimenyetso', 'yellow', 'umuhondo', 'spot', 'ibara', 'wilt', 'kwuma', 'rot', 'kubora', 'blight', 'necrosis', 'hole', 'umwobo', 'udusimba', 'ibyonnyi', 'pest')) {
    const tokens = low.split(/[^a-z']/i).filter(w => w.length >= 5)
    let best = null, bestScore = 0
    for (const d of AS.DISEASES) {
      const hay = (d.name.en + ' ' + d.name.rw + ' ' + d.symptoms.en[0] + ' ' + d.symptoms.rw[0]).toLowerCase()
      let score = 0
      for (const w of tokens) if (hay.includes(w)) score++
      if (score > bestScore) { bestScore = score; best = d }
    }
    const g = mentionCrop()
    if (!best && g) best = AS.DISEASES.find(d => d.crop === g.id)
    if (best) {
      return {
        intent: 'disease',
        text: `${best.name[L]} (${crops[best.crop][L]}).\n` +
          (L === 'rw' ? 'Impamvu: ' : 'Cause: ') + best.cause[L] + '\n' +
          (L === 'rw' ? 'Imiti: ' : 'Treatment: ') + best.treatment[L][0] + '\n' +
          (L === 'rw' ? 'Irinde: ' : 'Prevention: ') + best.prevention[L][0]
      }
    }
  }

  // 5 — fertilizer
  if (has('ifumbire', 'fertiliz', 'npk', 'urea', 'dap', 'mborera', 'compost', 'lime', 'manure')) {
    const g = mentionCrop()
    if (g && g.fertilizing) {
      return {
        intent: 'fertilizer',
        text: `${g.name[L]}: ${g.fertilizing[L][0]} ${g.fertilizing[L][1] || ''} ` +
          (L === 'rw' ? 'Reba "Ifumbire" muri app ku bindi bisobanuro.' : 'See "Fertilizers" in the app for details.')
      }
    }
    return {
      intent: 'fertilizer',
      text: L === 'rw'
        ? 'Muri rusange: NPK 17-17-17 mu gutera (ifumbire y\'ibanze), hanyuma urea yo kongera igihe ibimera bikura. Reba igice cya "Ifumbire" ku ngano za buri gihingwa.'
        : 'General rule: NPK 17-17-17 as basal at planting, then urea top-dress while plants are growing. See the "Fertilizers" section for per-crop rates.'
    }
  }

  // 6 — planting
  if (has('guhinga', 'plant', 'tera', 'sowing', 'mbuto', 'seed', 'season', 'igihembwe', 'ryari', 'when', 'spacing', 'intera')) {
    const g = mentionCrop()
    if (g && g.season) {
      return {
        intent: 'planting',
        text: `${g.name[L]}: ${g.season[L]} ${g.planting ? g.planting[L][0] : ''}`
      }
    }
    return {
      intent: 'planting',
      text: L === 'rw'
        ? 'Mbwire igihingwa (ibigori, ibishyimbo, ibirayi, umuceri...) kugira ngo nguhe igihembwe n\'uburyo bwo gutera.'
        : 'Tell me the crop (maize, beans, potato, rice...) and I will give you the season and planting steps.'
    }
  }

  // 7 — scan
  if (has('ifoto', 'photo', 'picture', 'scan', 'video', 'camera', 'gusuzuma')) {
    return {
      intent: 'scan',
      text: L === 'rw'
        ? 'Koresha "Gusuzuma" ufate ifoto y\'ibabi — AI izakubwira indwara n\'umuti ako kanya.'
        : 'Use "Scan" and take a leaf photo — the AI will identify the disease and treatment instantly.'
    }
  }

  // 8 — fallback
  return {
    intent: 'fallback',
    text: L === 'rw'
      ? 'Simbi neza igisubizo cy\'icyo kibazo. Gerageza: gufata ifoto (Gusuzuma), kureba "Indwara", cyangwa umbaze ibiciro n\'ifumbire.'
      : 'I am not sure about that one. Try: take a photo (Scan), browse "Diseases", or ask me about prices and fertilizers.'
  }
}
