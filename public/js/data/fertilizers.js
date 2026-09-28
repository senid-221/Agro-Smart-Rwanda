// Fertilizer & soil health guide for Rwanda
AS.FERTILIZERS = [
  {
    id: 'npk-17', emoji: '⚗️',
    name: { en: 'NPK 17-17-17', rw: 'NPK 17-17-17' },
    type: { en: 'Inorganic — compound basal fertiliser', rw: 'Ifumbire y\'imiti — ivanze y\'ibanze' },
    uses: {
      en: 'Balanced nitrogen (N), phosphorus (P) and potassium (K). The standard basal fertiliser in Rwanda for maize, potato, rice, vegetables and coffee.',
      rw: 'Azote (N), fosifore (P) na potasi (K) biringaniye. Ni ifumbire isanzwe y\'ibanze mu Rwanda ku bigori, ibirayi, umuceri, imboga n\'ikawa.'
    },
    dosage: {
      en: ['Maize: 100 kg/ha at planting + urea top-dress', 'Potato: 300-400 kg/ha at planting', 'Tomato/onion: 200 kg/ha basal', 'Coffee: 100-150 g per tree, 2x per year', 'Apply in bands or holes 5-7 cm from the plant, then cover — never broadcast on leaves'],
      rw: ['Ibigori: kg 100 kuri hegitari mu gutera + urea nyuma', 'Ibirayi: kg 300-400 kuri hegitari', 'Inyanya/ibitunguru: kg 200 kuri hegitari', 'Ikawa: g 100-150 ku giti, kabiri mu mwaka', 'Shyira mu mirongo cyangwa imyobo cm 5-7 uvuye ku kimera, hanyuma uyishingire — ntukayiterere ku mababi']
    },
    cautions: {
      en: ['Store in a dry place, off the ground, away from children', 'Wash hands after handling', 'Over-application burns roots — measure, do not guess', 'Buy from licensed agro-dealers (check the RAB label)'],
      rw: ['Bika ahantu humye, hejuru y\'ubutaka, kure y\'abana', 'Karaba intoki nyuma yo gukoraho', 'Gukoresha nyinshi cyane byangiza imizi — bipime, ntugerekeranye', 'Gura ku badandaza bemewe (reba ikirango cya RAB)']
    }
  },
  {
    id: 'urea', emoji: '💧',
    name: { en: 'Urea (46% N)', rw: 'Urea (46% N)' },
    type: { en: 'Inorganic — nitrogen top-dressing', rw: 'Ifumbire y\'imiti — azote yo kongera' },
    uses: {
      en: 'Fast green-up and leafy growth. Used as top-dress on maize, sorghum, rice and leafy vegetables when plants are actively growing.',
      rw: 'Guhindura vuba ibimera icyatsi no kongera amababi. Ikoreshwa nko kongera ku bigori, amasaka, umuceri n\'imboga igihe ibimera bikura.'
    },
    dosage: {
      en: ['Maize: 50-75 kg/ha at knee-height, second dose at tasselling', 'Rice: split into 2 doses (tillering + panicle initiation)', 'Apply on moist soil and cover immediately — uncovered urea evaporates as gas', 'NEVER apply during hot midday sun'],
      rw: ['Ibigori: kg 50-75 kuri hegitari igihe bingana n\'ivi, iya kabiri mu gusoroma', 'Umuceri: gabanya kabiri (amashami + ibitoki)', 'Shyira ku butaka butose kandi uyishingire ako kanya — urea itapfutse irahinduka umwuka', 'NTUKAYISIGIRE mu zuba ryo mu manywa']
    },
    cautions: {
      en: ['Excess urea makes plants soft and attracts pests/disease', 'Keep away from seed at planting — it kills germination'],
      rw: ['Urea nyinshi ituma ibimera byoroha bigakurura udukoko/indwara', 'Kuyirinda imbuto mu gutera — yica imera']
    }
  },
  {
    id: 'can', emoji: '🌱',
    name: { en: 'CAN (Calcium Ammonium Nitrate)', rw: 'CAN' },
    type: { en: 'Inorganic — nitrogen + calcium', rw: 'Ifumbire y\'imiti — azote + kalisiyumu' },
    uses: {
      en: 'Gentler nitrogen source that also supplies calcium. Good for acidic highland soils and vegetables (prevents blossom-end rot in tomato).',
      rw: 'Isoko ya azote yoroshye itanga na kalisiyumu. Nziza ku butaka bw\'aside bwo mu misozi n\'imboga (irinda uburwayi bw\'imbuto ku nyanya).'
    },
    dosage: {
      en: ['Vegetables: 100-150 kg/ha split at transplanting and flowering', 'Top-dress maize at 75-100 kg/ha where soils are acidic', 'Band-apply and cover; water in if no rain within 2 days'],
      rw: ['Imboga: kg 100-150 kuri hegitari gabanya mu gushyira mu murima no mu ndabyo', 'Kongera ku bigori kg 75-100 kuri hegitari aho ubutaka bufite aside', 'Shyira mu mirongo uyishingire; vomera niba imvura itaje mu minsi 2']
    },
    cautions: {
      en: ['Less volatile than urea but still measure carefully', 'Do not mix with lime in the same application'],
      rw: ['Ntihinduka umwuka nka urea ariko wirinde gupima nabi', 'Ntukayivange n\'ishwagara rimwe']
    }
  },
  {
    id: 'manure', emoji: '🐄',
    name: { en: 'Farmyard Manure', rw: 'Ifumbire y\'Amatungo' },
    type: { en: 'Organic', rw: 'Ifumbire kamere' },
    uses: {
      en: 'Improves soil structure, water holding and slowly releases nutrients. The backbone of Rwandan smallholder fertility — from cattle, goats and poultry.',
      rw: 'Ituma ubutaka buba bwiza, bugafata amazi kandi bukarekura intungamubiri buhoro. Ni umusingi w\'uburumbuke bw\'abahinzi bato mu Rwanda — iva ku nka, ihene n\'inkoko.'
    },
    dosage: {
      en: ['Field crops: 5-10 tonnes/ha', 'Banana: 20-40 kg per mat per year', 'Vegetables: 10-20 t/ha', 'Coffee/fruit trees: 10-20 kg per tree', 'Use only WELL-DECOMPOSED manure (dark, crumbly, no smell) — fresh manure burns roots and carries weed seeds'],
      rw: ['Imyaka y\'umurima: t 5-10 kuri hegitari', 'Ibitoki: kg 20-40 ku giti buri mwaka', 'Imboga: t 10-20 kuri hegitari', 'Ikawa/ibiti by\'imbuto: kg 10-20 ku giti', 'Koresha ifumbire iboze NEZA (umukara, yoroshye, nta mpumuro) — ifumbire mbi itera ibisebe ku mizi']
    },
    cautions: {
      en: ['Compost 2-3 months before use, turning the heap weekly', 'Do not use manure from animals treated with herbicide-tainted feed (aminopyralid persists and kills beans/tomatoes)'],
      rw: ['Ifumbire ibore amezi 2-3 mbere yo kuyikoresha, uyihindure buri cyumweru', 'Ntukoreshe ifumbire y\'amatungo yariye ibyatsi byavuwe n\'imiti (aminopyralid iguma ikangiza ibishyimbo/inyanya)']
    }
  },
  {
    id: 'compost', emoji: '♻️',
    name: { en: 'Compost Making', rw: 'Gukora Ifumbire y\'Ibimera (Compost)' },
    type: { en: 'Organic — make it free on your farm', rw: 'Kamere — iyikore ku buntu ku murima wawe' },
    uses: {
      en: 'Turn crop residues, kitchen waste, weeds and manure into black gold. Costs nothing but labour and works on every soil in Rwanda.',
      rw: 'Hindura ibisigazwa by\'imyaka, imyanda yo mu gikoni, ibyatsi n\'ifumbire y\'amatungo mo ifumbire y\'agaciro. Nta kiguzi usibye umurimo kandi ikora ku butaka bwose mu Rwanda.'
    },
    dosage: {
      en: ['Build heap: 15 cm crop waste → thin manure layer → 15 cm green weeds → repeat, watering each layer', 'Keep moist like a squeezed sponge; turn every 2 weeks', 'Ready in 2-3 months when dark, crumbly and earthy-smelling', 'Apply 5-10 t/ha before planting, or a handful per planting hole'],
      rw: ['Kora umurundo: cm 15 z\'ibisigazwa → agace gato k\'ifumbire → cm 15 z\'ibyatsi bibisi → subiramo, uvomera buri gice', 'Gumana ubuhehere nk\'isponji yikamiye; hindura buri byumweru 2', 'Irangira mu mezi 2-3 igihe ari umukara, yoroshye kandi ifite impumuro y\'ubutaka', 'Shyiramo t 5-10 kuri hegitari mbere yo gutera, cyangwa agafuni kuri buri mwobo']
    },
    cautions: {
      en: ['Never compost diseased plants (blight, wilt, BXW) — the pathogens survive', 'Cover the heap to avoid nutrient loss from rain'],
      rw: ['Ntukajye ukore compost y\'ibimera byanduye (ikiyongoyongo, wilt, Kirabiranya) — indwara zigumamo', 'Twikiriza umurundo kugira ngo wirinde gutakaza intungamubiri mu mvura']
    }
  },
  {
    id: 'lime', emoji: '⛰️',
    name: { en: 'Agricultural Lime', rw: 'Ishwagara yo mu Buhinzi' },
    type: { en: 'Soil amendment — raises pH', rw: 'Ivugurura ubutaka — rizamura pH' },
    uses: {
      en: 'Most Rwandan highland soils are acidic (pH 4.5-5.5). Lime "unlocks" nutrients already in the soil so fertiliser actually works.',
      rw: 'Ubutaka bwinshi bwo mu misozi y\'u Rwanda bufite aside (pH 4.5-5.5). Ishwagara "ifungura" intungamubiri ziri mu butaka kugira ngo ifumbire ikore.'
    },
    dosage: {
      en: ['Test soil first (district agronomist / RAB labs do this)', 'Typical: 1-3 t/ha, applied 1-2 months BEFORE planting and ploughed in', 'Do not apply lime and fertiliser at the same time'],
      rw: ['Banze upime ubutaka (agronome w\'akarere / laboratoire za RAB)', 'Bisanzwe: t 1-3 kuri hegitari, amezi 1-2 MBERE yo gutera uyihingemo', 'Ntukajye ushyira ishwaragara n\'ifumbire rimwe']
    },
    cautions: {
      en: ['Over-liming locks up phosphorus and micronutrients — test, don\'t guess', 'Wear gloves and mask when spreading'],
      rw: ['Ishwagara nyinshi ifunga fosifore n\'intungamubiri nto — upime, ntugerekeranye', 'Ambara uturindantoki n\'agapfukamunwa mu gihe uyitatera']
    }
  }
]

AS.SOIL_TIPS = {
  en: [
    'Rwanda\'s steep slopes wash away nutrients — always farm on contours or terraces (radical terraces in Gakenke/Rulindo model)',
    'Cover the soil: mulch, cover crops (lablab, Tithonia) stop erosion and feed the soil',
    'Test your soil every 3 years through your district agronomist — fertiliser choice should follow the test',
    'Rotate cereals with legumes (beans, groundnuts, soybean) — legumes add free nitrogen',
    'Tithonia hedges along terraces give free green manure — cut and apply 5 t/ha'
  ],
  rw: [
    'Imisozi ihanamye y\'u Rwanda itwara intungamubiri — buri gihe hinga ku mirongo ihuza ubutaka cyangwa ku mazu y\'ubutaka (terraces z\'icyitegererezo za Gakenke/Rulindo)',
    'Twikiriza ubutaka: mulch, ibimera bitwikira (lablab, Tithonia) birinda isuri kandi bifumbira',
    'Pima ubutaka bwawe buri myaka 3 binyuze kuri agronome w\'akarere — guhitamo ifumbire bikurikize isuzuma',
    'Simbuza ibinyampeke n\'ibinyamisogwe (ibishyimbo, ubunyobwa, soya) — ibinyamisogwe byongera azote ku buntu',
    'Inkingi za Tithonia ku mazu y\'ubutaka zitanga ifumbire y\'icyatsi ku buntu — kate uzitere t 5 kuri hegitari'
  ]
}
