// AgroSmart Rwanda — AI instructions & responder.
// AS.FARMER_RULES / AS.AI_POLICY are the instruction set: WHAT the assistant
// may answer, WHICH source it answers from, HOW the reply is built and WHEN
// it must refuse or escalate to a qualified agronomist.
// AS.aiReply() applies the rules against the offline knowledge bases.
AS.FARMER_RULES = [
  { en: 'Act like a real, experienced agronomist helping the farmer.', rw: 'Itware nk\'umuhinza w\'umwuga (agronome) ufasha umuhinzi.' },
  { en: 'Ask about the crop, symptoms, location, crop age and farming conditions before diagnosing.', rw: 'Banza ubaze igihingwa, ibimenyetso, aho umurima uri, imyaka y\'igihingwa n\'imiterere y\'ubuhinzi mbere yo gupima.' },
  { en: 'If possible, ask the farmer to upload a clear photo of the affected plant.', rw: 'Nibishoboka, sabwa umuhinzi gufata ifoto isobanutse y\'ikimera cyafashwe.' },
  { en: 'Identify the most likely disease, pest, nutrient deficiency or environmental problem.', rw: 'Menya indwara, ikimonyo, ibura ry\'ibigunga cyangwa ikibazo cy\'ibidukikije bishoboka cyane.' },
  { en: 'Never guess when evidence is insufficient; clearly say when you are uncertain.', rw: 'Ntukeke ibimenyetso nidahagije; vuga ukuri iyo utabi neza.' },
  { en: 'Explain the problem in simple language the farmer can understand.', rw: 'Sobanura ikibazo mu mvugo yoroshye umuhinzi yumva.' },
  { en: 'Give practical steps for treatment and prevention.', rw: 'Tanga intambwe zifatika zo kuvura no kwirinda.' },
  { en: 'Recommend agricultural products only when appropriate for the identified problem.', rw: 'Tanga ibicuruzwa by\'ubuhinzi gusa iyo bikwiye ikibazo cyamenyekanye.' },
  { en: 'Never invent pesticide names, dosages or treatment instructions.', rw: 'Ntihimba amazina y\'imiti, ingano cyangwa amabwiriza yo kuvura.' },
  { en: 'Always include chemical-safety precautions when recommending agricultural chemicals.', rw: 'Hora utanga amabwiriza y\'umutekano wo gukoresha imiti y\'ubuhinzi.' },
  { en: 'Consider Rwanda\'s crops, climate, soil and local farming conditions.', rw: 'Tekereza ku bihingwa, ikirere, ubutaka n\'imiterere y\'ubuhinzi by\'u Rwanda.' },
  { en: 'Respond in the farmer\'s language, especially clear Kinyarwanda when they use Kinyarwanda.', rw: 'Subiza mu rurimi rw\'umuhinzi, cyane cyane Ikinyarwanda gisobanutse iye ryanditse.' },
  { en: 'Keep answers short, practical and focused on the farmer\'s problem.', rw: 'Subiza ngufi, bifatika, byibanda ku kibazo cy\'umuhinzi.' },
  { en: 'If the problem is serious or uncertain, recommend contacting a qualified agronomist.', rw: 'Ikibazo nikiba gikomeye cyangwa kitazwi, sabwa kugana agronome ubifitiye ubumenyi.' },
  { en: 'Never pretend to be certain when a professional field inspection is needed.', rw: 'Ntiryandahire ko uzi ukuri hagikenewe isuzuma ry\'umwuga mu murima.' }
]

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
      how: { en: 'First collect crop + symptoms (and suggest a photo); then give most-likely cause, one treatment step, one prevention step, safety notes and agronomist escalation when serious or uncertain', rw: 'Banza ukusanye igihingwa + ibimenyetso (usabe n\'ifoto); hanyuma utange impamvu ishoboka, intambwe imwe y\'imiti, iy\'kwirinda, umutekano w\'imiti no kwohereza kuri agronome niba bikomeye' },
      source: 'AS.DISEASES (library)'
    },
    {
      id: 'product',
      when: { en: 'Question about price, buying, stock, or a product name (seeds, tools, sprayers...)', rw: 'Ikibazo ku giciro, kugura, cyangwa izina ry\'igicuruzwa (imbuto, ibikoresho...)' },
      how: { en: 'Look the item up in the store catalog and quote the exact RWF price and unit; never invent prices; add safety notes for chemicals', rw: 'Shakisha mu Iduka utange igiciro nyacyo mu RWF n\'ipimo; ntihimba igiciro; ongeraho umutekano ku miti' },
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
  rules: AS.FARMER_RULES
}

AS.aiReply = function (text, lang, ctx) {
  ctx = ctx && typeof ctx === 'object' ? ctx : {}
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

  const SAFETY = L === 'rw'
    ? 'Umutekano w\'imiti: kwambara gants n\'udupfukamunwa, ntuvange imiti, karaba nyuma yo gukoresha, bika kure y\'abana n\'amatungo.'
    : 'Chemical safety: wear gloves and a mask, never mix chemicals, wash after handling, store away from children and animals.'
  const AGRONOMIST = L === 'rw'
    ? 'Niba bikomeje cyangwa utabi neza, gana agronome wa RAB ukwegereye kugira ngo asuzume umurima.'
    : 'If it persists or you are unsure, contact a qualified agronomist (RAB office) for a field inspection.'

  const mentionCrop = () => {
    for (const [id, c] of Object.entries(crops)) {
      if (has(c.en.toLowerCase(), c.rw.toLowerCase())) return guides.find(g => g.id === id) || { id, name: c }
    }
    return null
  }

  // 1 — greeting
  if (/^(hi|hello|hey|muraho|mwaramutse|mwiriwe|niteho)\b/.test(low.trim()) && low.length < 40) {
    return {
      intent: 'greeting', ctx,
      text: L === 'rw'
        ? 'Muraho! Ndi Umufasha AI wa AgroSmart, nkora nk\'agronome. Mbwira ikibazo cy\'igihingwa cyawe (ibimenyetso, aho uri, imyaka y\'igihingwa) cyangwa umbaze ibiciro n\'ifumbire.'
        : 'Hello! I am the AgroSmart AI Assistant, working like an agronomist. Tell me your crop problem (symptoms, location, crop age) or ask about prices and fertilizers.'
    }
  }

  // 2 — out of scope
  if (has('politic', 'politiki', 'football', 'umupira w', 'betting', 'casino', 'amahirwe', 'headache', 'umutwe ubabaza', 'urukundo', 'love ')) {
    return {
      intent: 'out_of_scope', ctx,
      text: L === 'rw'
        ? 'Mbabarira — nsubiza ibibazo by\'ubuhinzi gusa. Gerageza umbaze ku bihingwa, indwara, ifumbire cyangwa ibiciro by\'ibicuruzwa.'
        : 'Sorry — I only answer farming questions. Try asking about crops, diseases, fertilizers or product prices.'
    }
  }

  // 3 — product / price
  // Compute the disease / fertilizer signals first so a diagnosis in progress
  // (ctx.awaiting) or a crop+symptom / fertilizer question is never hijacked by
  // a bare product-name match (rules 2,4,5,7).
  const SYMPTOMS = ['indwara', 'disease', 'symptom', 'ikimenyetso', 'yellow', 'umuhondo', 'spot', 'ibara',
    'wilt', 'kwuma', 'rot', 'kubora', 'blight', 'necrosis', 'hole', 'umwobo', 'udusimba', 'ibyonnyi', 'pest',
    'ibimonyo', 'deficien', 'ibura']
  const diseaseAsk = has(...SYMPTOMS) || ctx.awaiting === true
  const FERT_WORDS = ['ifumbire', 'fumbire', 'fertiliz', 'npk', 'urea', 'dap', 'mborera', 'compost', 'lime', 'manure']
  const fertAsk = has(...FERT_WORDS)
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
  if (priceAsk || catKeyword || (!plantingStrong && !diseaseAsk && !fertAsk && findProduct())) {
    let p = findProduct()
    if (!p && catKeyword) p = AS.PRODUCTS.find(x => x.id === catKeyword[1])
    if (!p && priceAsk) {
      const g = mentionCrop()
      if (g) p = AS.PRODUCTS.find(x => x.cat === 'seeds' && x.id.includes(g.id))
    }
    if (p) {
      return {
        intent: 'product', ctx,
        text: `${p.emoji ? p.emoji + ' ' : ''}${p[L]} — ${AS.fmtRWF(p.price)} / ${p.unit[L]}. ` +
          (L === 'rw' ? 'Biboneka mu Iduka: shyira mu gatebo utumize.' : 'Available in the Store: add to cart to order.') +
          (p.cat === 'protect' ? '\n' + SAFETY : '')
      }
    }
    return {
      intent: 'product', ctx,
      text: L === 'rw'
        ? 'Ntabwo nzi icyo gicuruzwa. Reba mu Iduka (imbuto, ifumbire, imiti, ibikoresho, ivomerera...) cyangwa umbaze igiciro cy\'ikizwi nka NPK, isuka, imbuto z\'ibigori.'
        : 'I don\'t stock that name. Browse the Store (seeds, fertilizers, crop protection, tools, irrigation...) or ask a known price like NPK, hoes, maize seeds.'
    }
  }

  // 4 — disease / diagnosis (rules 2,3,4,5,6,7,8,9,10,14,15)
  if (diseaseAsk) {
    const g = mentionCrop()
    if (g) ctx.crop = ctx.crop || g.id
    if (has(...SYMPTOMS)) ctx.symptoms = true
    if (!ctx.crop || !ctx.symptoms) {
      ctx.awaiting = true
      return {
        intent: 'disease', ctx,
        text: L === 'rw'
          ? 'Ngira ngo ngufashe nk\'agronome, mbanza nkumenya neza ikibazo. Mbwira: (1) igihingwa cyafashwe, (2) ibimenyetso ubona (amababi, amabara, kwuma, imyobo), (3) akarere umurima urimo n\'imyaka/ibyumweru by\'igihingwa, (4) uko muvomerera cyangwa imvura. Nibishoboka, fata ifoto isobanutse y\'igice cyafashwe muri "Gusuzuma".'
          : 'To help you like an agronomist, I first need the full picture. Tell me: (1) which crop is affected, (2) the symptoms you see (leaves, colours, wilting, holes), (3) your district and the crop\'s age, (4) irrigation or rain conditions. If possible, upload a clear photo of the affected part using "Scan".'
      }
    }
    ctx.awaiting = false
    const tokens = low.split(/[^a-z']/i).filter(w => w.length >= 5)
    let best = null, bestScore = 0
    for (const d of AS.DISEASES) {
      if (ctx.crop && d.crop !== ctx.crop) continue
      const hay = (d.name.en + ' ' + d.name.rw + ' ' + d.symptoms.en.join(' ') + ' ' + d.symptoms.rw.join(' ')).toLowerCase()
      let score = 0
      for (const w of tokens) if (hay.includes(w)) score++
      if (score > bestScore) { bestScore = score; best = d }
    }
    if (!best) best = AS.DISEASES.find(d => d.crop === ctx.crop) || null
    const cropName = ctx.crop ? crops[ctx.crop][L] : ''
    if (!best || bestScore === 0) {
      ctx.awaiting = true
      return {
        intent: 'disease', ctx,
        text: (L === 'rw'
          ? `Ibimenyetso ntibihagije kugira ngo nvuge indwara nyayo kuri ${cropName}. Ntikeka: fata ifoto isobanutse y\'ibabi cyangwa igice cyafashwe muri "Gusuzuma", cyangwa gana agronome usuzume umurima.`
          : `The evidence is not enough to name a definite problem on ${cropName}. I will not guess: take a clear photo of the affected leaf or part using "Scan", or have an agronomist inspect the field.`) +
          '\n' + AGRONOMIST
      }
    }
    const sure = bestScore >= 2
    const treatAll = best.treatment[L].join(' ').toLowerCase()
    const chem = /insecticide/.test(treatAll) ? 'prot-insect'
      : /fungicide/.test(treatAll) ? 'prot-fung'
      : /herbicide/.test(treatAll) ? 'prot-herb' : null
    const prod = chem ? AS.PRODUCTS.find(p => p.id === chem) : null
    const firstSentence = t => { const m = t.match(/^[^.!?]+[.!?]?/); return m ? m[0] : t }
    let out = `${best.name[L]} (${cropName}) — ` +
      (L === 'rw' ? (sure ? 'ni yo bishoboka cyane.' : 'ishobora kuba ari yo, ariko ntabwo neza neza.') : (sure ? 'this is the most likely cause.' : 'this could be the cause, but I am not certain.')) +
      '\n' + (L === 'rw' ? 'Ikibazo: ' : 'Problem: ') + firstSentence(best.cause[L]) +
      '\n' + (L === 'rw' ? 'Ibyo wakora: ' : 'Do this: ') + best.treatment[L][0] +
      (prod ? ` ${L === 'rw' ? 'Igicuruzwa gikwiye mu Iduka:' : 'Suitable product in the Store:'} ${prod[L]} (${AS.fmtRWF(prod.price)}/${prod.unit[L]}).` : '') +
      '\n' + (L === 'rw' ? 'Kwirinda: ' : 'Prevention: ') + best.prevention[L][0]
    if (prod) out += '\n' + SAFETY
    if (best.severity === 'high' || !sure) out += '\n' + AGRONOMIST
    ctx.symptoms = false
    ctx.awaiting = false
    return { intent: 'disease', ctx, text: out }
  }

  // 5 — fertilizer
  if (fertAsk) {
    const g = mentionCrop()
    if (g && g.fertilizing) {
      return {
        intent: 'fertilizer', ctx,
        text: `${g.name[L]}: ${g.fertilizing[L][0]} ${g.fertilizing[L][1] || ''} ` +
          (L === 'rw' ? 'Reba "Ifumbire" muri app ku bindi bisobanuro.' : 'See "Fertilizers" in the app for details.')
      }
    }
    return {
      intent: 'fertilizer', ctx,
      text: L === 'rw'
        ? 'Muri rusange: NPK 17-17-17 mu gutera (ifumbire y\'ibanze), hanyuma urea yo kongera igihe ibimera bikura. Reba igice cya "Ifumbire" ku ngano za buri gihingwa.'
        : 'General rule: NPK 17-17-17 as basal at planting, then urea top-dress while plants are growing. See the "Fertilizers" section for per-crop rates.'
    }
  }

  // 6 — planting
  if (plantingStrong || has('mbuto', 'seed', 'spacing', 'intera')) {
    const g = mentionCrop()
    if (g && g.season) {
      return {
        intent: 'planting', ctx,
        text: `${g.name[L]}: ${g.season[L]} ${g.planting ? g.planting[L][0] : ''}`
      }
    }
    return {
      intent: 'planting', ctx,
      text: L === 'rw'
        ? 'Mbwire igihingwa (ibigori, ibishyimbo, ibirayi, umuceri...) kugira ngo nguhe igihembwe n\'uburyo bwo gutera.'
        : 'Tell me the crop (maize, beans, potato, rice...) and I will give you the season and planting steps.'
    }
  }

  // 7 — scan
  if (has('ifoto', 'photo', 'picture', 'scan', 'video', 'camera', 'gusuzuma')) {
    return {
      intent: 'scan', ctx,
      text: L === 'rw'
        ? 'Koresha "Gusuzuma" ufate ifoto y\'ibabi — AI izakubwira indwara n\'umuti ako kanya.'
        : 'Use "Scan" and take a leaf photo — the AI will identify the disease and treatment instantly.'
    }
  }

  // 8 — fallback
  return {
    intent: 'fallback', ctx,
    text: L === 'rw'
      ? 'Simbi neza igisubizo cy\'icyo kibazo. Gerageza: gufata ifoto (Gusuzuma), kureba "Indwara", cyangwa umbaze ibiciro n\'ifumbire.'
      : 'I am not sure about that one. Try: take a photo (Scan), browse "Diseases", or ask me about prices and fertilizers.'
  }
}

// ---------- admin-taught Kinyarwanda Q&A (highest priority, built-in mode) ----------
AS.aiTrainedReply = function (text, lang, ctx) {
  const qa = (AS.AIK && AS.AIK.qa()) || []
  if (!qa.length) return null
  const low = String(text).toLowerCase()
  const toks = low.split(/[^a-z0-9']+/i).filter(w => w.length >= 3)
  if (!toks.length) return null
  let best = null, bestScore = 0
  for (const x of qa) {
    const q = (String(x.q || '') + ' ' + String(x.qEn || '')).toLowerCase()
    const qt = q.split(/[^a-z0-9']+/i).filter(w => w.length >= 3)
    if (!qt.length) continue
    let score = 0
    for (const w of toks) if (qt.includes(w)) score++
    const ratio = score / qt.length
    if (score > bestScore && (score >= 2 || ratio >= 0.6)) { bestScore = score; best = x }
  }
  if (!best) return null
  const text2 = lang === 'en' ? (best.aEn || best.a || '') : (best.a || best.aEn || '')
  if (!text2) return null
  return { intent: 'trained', ctx: ctx || {}, text: text2 }
}

// system prompt for a remote provider, built from the 15 rules + admin training
AS.aiSystemPrompt = function (lang) {
  const rules = (AS.FARMER_RULES || [])
    .map((r, i) => (i + 1) + '. ' + (lang === 'en' ? r.en : r.rw)).join('\n')
  const gl = ((AS.AIK && AS.AIK.glossary()) || [])
    .map(x => '- ' + (x.term || '') + ': ' + (lang === 'en' ? (x.defEn || x.def || '') : (x.def || x.defEn || '')))
    .filter(s => s.length > 2).join('\n')
  const qa = ((AS.AIK && AS.AIK.qa()) || [])
    .map(x => 'Q: ' + (lang === 'en' ? (x.qEn || x.q || '') : (x.q || x.qEn || '')) +
      '\nA: ' + (lang === 'en' ? (x.aEn || x.a || '') : (x.a || x.aEn || '')))
    .filter(s => s.length > 6).join('\n\n')
  return 'You are the AgroSmart Rwanda farming assistant for Rwandan farmers. ' +
    'Reply in the farmer\'s language (' + (lang === 'en' ? 'English' : 'clear, simple Kinyarwanda' ) + ').\n\n' +
    'RULES:\n' + rules +
    (gl ? '\n\nGLOSSARY (use these clear Kinyarwanda terms):\n' + gl : '') +
    (qa ? '\n\nADMIN-TRAINED Q&A (prefer these answers when relevant):\n' + qa : '')
}

// provider-aware dispatcher: custom Q&A -> remote provider -> built-in rules engine
AS.aiChat = async function (message, lang, ctx) {
  ctx = ctx && typeof ctx === 'object' ? ctx : {}
  const prov = (AS.PROVIDER && AS.PROVIDER.get()) || { mode: 'builtin' }

  // Optional: research the topic online (Wikipedia) before/while answering.
  // Runs only when the admin enabled it; silently yields nothing when offline.
  let note = null
  if (prov.researchOnline && AS.research) {
    try { note = await AS.research.lookup(message, lang) } catch (e) { note = null }
  }
  const withNote = reply => {
    if (note && reply && reply.text && reply.text.indexOf(note.text) === -1) {
      reply.text = reply.text + '\n\n' + note.text
      reply.research = { url: note.url, title: note.title }
    }
    return reply
  }

  const trained = AS.aiTrainedReply(message, lang, ctx)
  if (trained) return withNote(trained)

  if (prov.mode === 'remote' && prov.apiUrl) {
    try {
      const sys = AS.aiSystemPrompt(lang)
      const res = await fetch(prov.apiUrl, {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' },
          prov.apiKey ? { 'Authorization': 'Bearer ' + prov.apiKey } : {}),
        body: JSON.stringify({
          model: prov.model || undefined,
          message, lang, ctx, system: sys,
          messages: [{ role: 'system', content: sys }, { role: 'user', content: String(message) }]
        })
      })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data = await res.json()
      const text = data.text || data.reply || data.response || data.message ||
        (data.choices && data.choices[0] &&
          (data.choices[0].text || (data.choices[0].message && data.choices[0].message.content))) || ''
      if (String(text).trim()) return withNote({ intent: 'remote', ctx, text: String(text) })
      throw new Error('empty reply')
    } catch (e) {
      if (prov.requireRemote) {
        return {
          intent: 'remote_error', ctx,
          text: lang === 'en'
            ? 'The AI service could not be reached (' + (e && e.message ? e.message : 'error') + '). Check your connection or the provider settings.'
            : 'Serivisi ya AI ntabwo yabashije kuboneka (' + (e && e.message ? e.message : 'ikosa') + '). Reba interineti cyangwa igenamiterere rya AI.'
        }
      }
    }
  }

  return withNote(AS.aiReply(message, lang, ctx))
}
