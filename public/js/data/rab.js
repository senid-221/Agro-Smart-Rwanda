// AgroSmart Rwanda — offline RAB knowledge base.
// Rwanda Agriculture Board (rab.gov.rw) cannot be fetched from the browser
// (CORS), so its core recommendations are baked in here as static, citable
// data. The AI research step consults this OFFLINE source first (always
// available), then optionally Wikipedia when online. Content is consistent
// with RAB's published guidance and the crop guides in data/crops.js.
// General facts verified from rab.gov.rw (contact, Twigire Muhinzi, CIP 2007,
// 13 regional stations, soil-test "Made-in-Rwanda" fertilizer blends).
AS.RAB = {
  source: {
    en: 'Rwanda Agriculture Board (RAB) — rab.gov.rw',
    rw: 'Ikigo cy\'Igihugu Gishinzwe Ubuhinzi n\'Ubworozi (RAB) — rab.gov.rw'
  },
  url: 'https://www.rab.gov.rw',
  contact: { tollFree: '4675', mobile: '+250 788 385 312', email: 'info@rab.gov.rw' },

  services: {
    en: [
      'Twigire Muhinzi extension: learn through Farmer Field Schools (FFS) and Farmer Promotors in your village.',
      'Crop Intensification Program (CIP, since 2007): consolidated land, certified seed and fertilizer for priority crops.',
      'Soil-test based "Made-in-Rwanda" fertilizer blends matched to your district and crop.',
      'Certified seed and planting material through RAB-supported multipliers and cooperatives.',
      '13 regional RAB stations; contact toll-free 4675, +250 788 385 312, or info@rab.gov.rw.'
    ],
    rw: [
      'Twigire Muhinzi: wiga binyuze mu Mashuri y\'Abahinzi mu Murima (FFS) n\'Abajyanama b\'Abahinzi mu mudugudu wawe.',
      'Gahunda yo Kongera Umusaruro w\'Imyaka (CIP, kuva 2007): ubutaka buhurijwe hamwe, imbuto zemewe n\'ifumbire ku bihingwa by\'ibanze.',
      'Ifumbire "Yakozwe mu Rwanda" ishingiye ku isuzuma ry\'ubutaka, ihuye n\'akarere n\'igihingwa cyawe.',
      'Imbuto zemewe n\'ibiti byo gutera binyuze mu baborozi n\'amakoperative afashwa na RAB.',
      'Ibigo 13 bya RAB mu turere; hamagara 4675 (ubuntu), +250 788 385 312, cyangwa info@rab.gov.rw.'
    ]
  },

  // Short, RAB-attributable note per crop (varieties, calendar, fertilizer, key disease).
  crops: {
    maize: {
      en: 'RAB recommends certified hybrid maize (RH series) planted with the first rains — Season A (late Sep–Oct) or B (Feb–Mar). Apply NPK 17-17-17 as basal at planting and top-dress urea when plants are knee-high; rows 75 cm, seeds 25 cm apart. Scout twice weekly for fall armyworm and store grain at 13% moisture.',
      rw: 'RAB isabwa gukoresha imbuto z\'ibigori zemewe (RH) ziterwa n\'imvura ya mbere — Igihembwe A (mpera za Nzeri–Ukwakira) cyangwa B (Gashyantare–Werurwe). Shyira NPK 17-17-17 mu gutera hanyuma wongere urea igihe ibimera bingana n\'ivi; imirongo cm 75, imbuto cm 25. Genzura kabiri mu cyumweru igisambo cy\'ibigori kandi ubike imbuto ku buhehere bwa 13%.'
    },
    bean: {
      en: 'RAB promotes certified climbing and bush bean varieties (RWR, MAC series) and high-iron beans. Plant Season A (Oct–Nov) or B (Feb–Mar); basal NPK 17-17-17, avoid urea because beans fix nitrogen, and lime acidic highland soils. Stake climbing beans immediately.',
      rw: 'RAB ishyigikira imbuto zemewe z\'ibishyimbo bizamuka n\'ibito (RWR, MAC) n\'ibikize kuri fer. Tera Igihembwe A (Ukwakira–Ugushyingo) cyangwa B (Gashyantare–Werurwe); NPK 17-17-17 mu gutera, wirinde urea kuko ibishyimbo byiyongera azote, kandi shyira ishwagara ku butaka bufite aside. Shyira inkingi ku bishyimbo bizamuka ako kanya.'
    },
    banana: {
      en: 'RAB advises clean tissue-culture plantlets or certified suckers, holes 60×60×60 cm with manure, and weekly removal of the male bud to stop Kirabiranya (BXW). Sterilise knives with javel between mats. Bananas are heavy feeders — 20–40 kg manure per mat per year plus NPK.',
      rw: 'RAB igira inama yo gukoresha ibiti byakuwe muri laboratoire cyangwa ibyemejwe, imyobo cm 60×60×60 n\'ifumbire y\'amatungo, no gukuraho indabyo y\'ingabo buri cyumweru kugira ngo uhagarike Kirabiranya (BXW). Sukura icyuma na javel hagati y\'ibiti. Ibitoki bikeneye ifumbire nyinshi — kg 20–40 ku giti buri mwaka wongereho NPK.'
    },
    cassava: {
      en: 'RAB recommends certified disease-free cuttings (NAROCAS series) resistant to mosaic (CMD) and brown streak (CBSD), planted 1×1 m at the onset of rains. Apply NPK one month after planting and never use cuttings from infected fields. Harvest 8–12 months.',
      rw: 'RAB isabwa gukoresha ibiti byemewe bitanduye (NAROCAS) bihangana na mozaiki (CMD) n\'imirongo y\'ikijuju (CBSD), biterwa intera m 1×1 mu ntangiriro z\'imvura. Shyira NPK ukwezi kumwe nyuma yo gutera kandi ntukajye ukoresha ibiti biva mu mirima yanduye. Sarura amezi 8–12.'
    },
    potato: {
      en: 'RAB provides certified seed tubers (Kinigi, Kirundo, Cruza) for the cool highlands above 1,800 m. Plant Season A (Feb–Mar) or B (Sep–Oct) with heavy NPK 17-17-17 and manure. Spray late blight every 5–7 days in the rainy season and rotate 3+ years.',
      rw: 'RAB itanga imbuto zemewe z\'ibirayi (Kinigi, Kirundo, Cruza) ku misozi ikonje hejuru ya m 1,800. Tera Igihembwe A (Gashyantare–Werurwe) cyangwa B (Nzeri–Ukwakira) n\'ifumbire nyinshi ya NPK 17-17-17 n\'iy\'amatungo. Tera imiti y\'ikiyongoyongo buri minsi 5–7 mu gihe cy\'imvura kandi usimburanye imyaka 3+.'
    },
    tomato: {
      en: 'RAB encourages raising netted, disease-free seedlings and staking, with basal compost plus NPK 17-17-17 and foliar calcium. Net nurseries against whitefly to stop TYLCV, water consistently, and rotate away from pepper/eggplant and potato.',
      rw: 'RAB ishyigikira kurera ibiti bisukuye munsi y\'imiyoboro no gushyira ibiti ku nkingi, n\'ifumbire y\'ibimera mu gutera wongereho NPK 17-17-17 na kalisiyumu yo ku mababi. Shyira imiyoboro ku biti kurwanya udukoko tw\'umweru tugahagarika TYLCV, vomerera buri gihe, kandi usimburanye kure y\'urusenda/intoryi n\'ibirayi.'
    },
    rice: {
      en: 'RAB supports marshland rice through cooperatives, with recommended varieties (Komboka, Tox, IRRI types). Transplant 25-day seedlings at 20×20 cm, basal NPK 20-10-10, split urea top-dress, and keep 5 cm water. Level fields well for weed control.',
      rw: 'RAB ifasha guhinga umuceri mu bishanga binyuze muri koperative, n\'imbuto nziza (Komboka, Tox, IRRI). Shyira mu murima ibiti by\'iminsi 25 intera cm 20×20, NPK 20-10-10 mu gutera, urea mu bice bibiri, kandi gumana amazi ya cm 5. Teganya neza imirima kugira ngo urinde ibyatsi.'
    },
    coffee: {
      en: 'RAB (with NAEB) promotes high-quality Arabica Bourbon, shade trees at 30–40%, and picking only fully red cherries delivered to washing stations within 6 hours. Fertilise with NPK 17-17-17 twice a year and prune after harvest; spray copper for leaf rust.',
      rw: 'RAB (ifatanije na NAEB) ishyigikira ikawa nziza ya Arabica Bourbon, ibiti by\'igicucu ku 30–40%, no gusarura gusa urutoki rutukuye neza rujyanwa ku bigo byoza mu masaha 6. Fumbira NPK 17-17-17 kabiri mu mwaka kandi ukatere nyuma y\'isarura; tera umuringa ku ngese y\'amababi.'
    },
    tea: {
      en: 'RAB works with tea factories to support smallholders around Gisakura, Kitabi and Sorwathe. Pluck only "two leaves and a bud" every 7–10 days, deliver green leaf the same day, use tea-specific NPK 25-5-5, and prune on a 4–5 year cycle.',
      rw: 'RAB ifatanya n\'inganda z\'icyayi gufasha abahinzi bato baturiye Gisakura, Kitabi na Sorwathe. Sarura gusa "amababi abiri n\'ijwi" buri minsi 7–10, jyana amababi ku ruganda uwo munsi, koresha NPK 25-5-5 y\'icyayi, kandi ukatere buri myaka 4–5.'
    },
    sorghum: {
      en: 'RAB recommends improved drought-tolerant sorghum varieties (Serena, Macia) that yield about twice local landraces, planted in the dry eastern zones in Season A (Oct). Basal NPK plus urea top-dress; guard fields against birds near maturity.',
      rw: 'RAB isabwa gukoresha imbuto zavuguruwe z\'amasaka zihangana n\'amapfa (Serena, Macia) zitanga umusaruro wikubye kabiri kurusha izo mu gihugu, ziterwa mu turere tw\'amapfa two mu Burasirazuba mu Gihembwe A (Ukwakira). NPK mu gutera wongere urea; rinda imirima inyoni hafi y\'isarura.'
    },
    groundnut: {
      en: 'RAB advises certified groundnut varieties (Nkunda, Shangi), planted early and dense to escape rosette disease. Light basal NPK (legumes fix nitrogen), gypsum at pegging, and dry pods on tarps and store in shell to avoid aflatoxin.',
      rw: 'RAB igira inama yo gukoresha imbuto zemewe z\'ubunyobwa (Nkunda, Shangi), ziterwa kare kandi byegeranye kugira ngo wirinde indwara ya rosette. NPK nke mu gutera (ibinyamisogwe byiyongera azote), gypsum mu gihe cy\'ibifuka, kandi umuze ibifuka ku bitambaro ubibike mu bishishwa kugira ngo wirinde aflatoxin.'
    },
    sweetpotato: {
      en: 'RAB promotes orange-fleshed sweet potato (OFSP) varieties to fight vitamin A deficiency. Plant clean vine tips on ridges at the onset of rains, needing little fertilizer; harvest 3.5–5 months and handle gently to avoid rot.',
      rw: 'RAB ishyigikira imbuto z\'ibijumba by\'umuhondo (OFSP) kugira ngo barwanye ikibazo cya vitamini A. Tera ibiti by\'impera bisukuye ku mirongo mu ntangiriro z\'imvura, ntibikeneye ifumbire nyinshi; sarura amezi 3.5–5 kandi ukoreho witonze kugira ngo wirinde kubora.'
    }
  }
}

// A short cited note for a crop, in the farmer's language. Returns null if unknown.
AS.RAB.cropNote = function (id, lang) {
  const n = AS.RAB.crops[id]
  if (!n) return null
  const L = lang === 'en' ? 'en' : 'rw'
  return {
    text: (L === 'rw' ? '📗 RAB: ' : '📗 RAB: ') + n[L],
    url: AS.RAB.url,
    title: 'RAB — ' + id
  }
}

// General RAB services note (used when no specific crop is detected).
AS.RAB.servicesNote = function (lang) {
  const L = lang === 'en' ? 'en' : 'rw'
  const list = AS.RAB.services[L].slice(0, 3).map(s => '• ' + s).join('\n')
  return { text: '📗 RAB:\n' + list + '\n' + AS.RAB.url, url: AS.RAB.url, title: 'RAB services' }
}
