// Agro-learning lessons for Rwandan farmers
AS.LESSONS = [
  {
    id: 'land-prep', emoji: '⛏️', category: 'farming',
    title: { en: 'Land Preparation & Soil Health', rw: 'Gutegura Ubutaka n\'Ubuzima Bw\'Ubutaka' },
    minutes: 6,
    body: {
      en: [
        { h: 'Why preparation wins', p: 'A well-prepared field gives even germination, easy weeding and deeper roots. In Rwanda\'s sloping landscape it also stops soil from washing away.' },
        { steps: true, h: 'Step by step', items: [
          'Clear weeds and old crop residues 2-3 weeks before planting; compost residues, never burn',
          'Test soil pH through your district agronomist (free service in most districts)',
          'Plough or dig to 20-30 cm depth; on slopes above 10% follow the contour, never up-and-down',
          'Build radical terraces or planting basins (zai pits) on steeper land — the Gakenke model is proven',
          'Apply lime if pH < 5.5, at least 1 month before planting',
          'Apply basal manure (5-10 t/ha) and mix into the top 15 cm'
        ]},
        { h: 'Keep soil alive', p: 'Cover the soil with mulch or cover crops (lablab, Desmodium, Tithonia). Living soil holds water in dry spells and releases nutrients slowly. Bare soil in heavy rain loses up to 40 tonnes per hectare per year on Rwanda\'s slopes.' }
      ],
      rw: [
        { h: 'Impamvu gutegura ari ugutsinda', p: 'Umurima wateguwe neza utanga kumera kuringaniye, gukuraho ibyatsi byoroshye n\'imizi irekire. Mu misozi y\'u Rwanda birinda kandi ubutaka gutwarwa n\'amazi.' },
        { steps: true, h: 'Intambwe ku yindi', items: [
          'Kuraho ibyatsi n\'ibisigazwa by\'imyaka ibyumweru 2-3 mbere yo gutera; bikoremo compost, ntukajye ubitwika',
          'Pima pH y\'ubutaka binyuze kuri agronome w\'akarere (serivisi y\'ubuntu mu turere twinshi)',
          'Hinga cyangwa ucukure ubujyakuzimu bwa cm 20-30; ku misozi irengeje 10% kurikiza umurongo uhagarara (contour), ntukajye uhinga uzamuka',
          'Kora amazu y\'ubutaka (terraces) cyangwa imyobo yo gutera ku butaka buhanamye — icyitegererezo cya Gakenke cyemejwe',
          'Shyiramo ishwagara niba pH < 5.5, ukwezi 1 mbere yo gutera',
          'Shyiramo ifumbire y\'ibanze (t 5-10 kuri hegitari) uyivange mu butaka bwo hejuru bwa cm 15'
        ]},
        { h: 'Gumisha ubutaka buzima', p: 'Twikiriza ubutaka na mulch cyangwa ibimera bitwikira (lablab, Desmodium, Tithonia). Ubutaka buzima bufata amazi mu gihe cy\'izuba kandi burekura intungamubiri buhoro. Ubutaka bweriye mu mvura nyinshi butakaza kugeza kuri t 40 kuri hegitari buri mwaka ku misozi y\'u Rwanda.' }
      ]
    }
  },
  {
    id: 'good-seed', emoji: '🌱', category: 'farming',
    title: { en: 'Choosing Good Seed & Planting Material', rw: 'Guhitamo Imbuto Nziza' },
    minutes: 5,
    body: {
      en: [
        { h: 'Seed is 50% of your harvest', p: 'Certified seed from licensed agro-dealers germinates above 90%, carries no seed-borne disease, and is bred for Rwanda\'s zones. Farmer-saved seed from unknown fields often carries mosaic viruses, anthracnose and weevils.' },
        { steps: true, h: 'What to check when buying', items: [
          'The RAB certified seed label/tag — no label, no buy',
          'Expiry date and variety name (RH maize, RWR beans, Kinigi potato, NAROCAS cassava)',
          'Bag must be sealed and dry; reject anything with mould or insect holes',
          'Buy from registered agro-dealers (ask for the shop licence)',
          'For banana and cassava: demand tissue-culture plantlets or cuttings from inspected multiplication gardens'
        ]},
        { h: 'Right variety, right zone', p: 'Lowland Nyagatare needs early-maturing drought-tolerant maize; highland Musanze needs blight-hardy potato. Your sector agronomist knows the recommended list for your altitude.' }
      ],
      rw: [
        { h: 'Imbuto ni 50% by\'isarura ryawe', p: 'Imbuto zemewe ziva ku badandaza bafite uruhushya zimera kurenza 90%, nta ndwara ziba mu mbuto zitwaye, kandi zarewe uturere tw\'u Rwanda. Imbuto zizigamwa n\'abahinzi ziva mu mirima itazwi akenshi zitwara virus, anthracnose n\'ibinyugunyugu.' },
        { steps: true, h: 'Ibyo ugenzura mu kugura', items: [
          'Ikirango/ikarita y\'imbuto zemewe za RAB — nta kirango, ntugure',
          'Itariki y\'irangiza n\'izina ry\'imbuto (ibigori RH, ibishyimbo RWR, ibirayi Kinigi, imyumbati NAROCAS)',
          'Umufuka ugomba kuba ufunze kandi udatose; yanga ibifite ububore cyangwa imyobo y\'udukoko',
          'Gura ku badandaza bemewe (saba uruhushya rw\'iduka)',
          'Ku bitoki n\'imyumbati: saba ibiti byakuwe muri laboratoire cyangwa ibiti biva mu mirima yagenzuwe'
        ]},
        { h: 'Imbuto nyayo ku karere nyako', p: 'Nyagatare yo hasi ikeneye ibigori byera vuba byihangana amapfa; Musanze yo hejuru ikeneye ibirayi bihangana n\'ikiyongoyongo. Agronome w\'umurenge azi urutonde rw\'imbuto zigenewe ubutumburuke bwawe.' }
      ]
    }
  },
  {
    id: 'ipm', emoji: '🐛', category: 'pests',
    title: { en: 'Integrated Pest Management', rw: 'Gucunga Udukoko mu buryo Bwiza (IPM)' },
    minutes: 7,
    body: {
      en: [
        { h: 'Spray last, not first', p: 'Every spray costs money and kills beneficial insects. Integrated Pest Management means you watch, decide, and use the cheapest effective tool first.' },
        { steps: true, h: 'The IPM pyramid', items: [
          'PREVENT: clean seed, crop rotation, healthy soil, push-pull intercrops (Desmodium + Brachiaria against fall armyworm)',
          'SCOUT: check 10 plants in 5 field spots twice weekly; count damage and insects',
          'DECIDE: act only when you cross the threshold (e.g. fall armyworm on 1 in 10 young maize plants)',
          'MECHANICAL/BIOLOGICAL: handpick, traps (yellow sticky for whiteflies, pheromone for FAW), neem extract, ash in whorls, protect birds and wasps',
          'CHEMICAL last: use RAB-approved products only, correct dose, spray late evening, wear gloves/mask, observe pre-harvest interval (days listed on the label before harvest is safe)'
        ]},
        { h: 'Major pests in Rwanda', p: 'Fall armyworm (maize), banana aphid (spreads bunchy top), whitefly (cassava mosaic, tomato TYLCV), bean aphids (BCMV), potato tuber moth, coffee antestia bug, tea mosquito bug.' },
        { h: 'Protect yourself', p: 'Never spray against the wind. Never reuse pesticide containers — triple-rinse and return them to the agro-dealer. Wash spray clothing separately.' }
      ],
      rw: [
        { h: 'Tera imiti nyuma, si mbere', p: 'Buri gutera imiti birahenda kandi bwica udukoko twiza. IPM bivuze ko ureba, ukemeza, hanyuma ugakoresha uburyo buhendutse bubanza gukora.' },
        { steps: true, h: 'Piramida ya IPM', items: [
          'KWIRINDA: imbuto zisukuye, gusimburanya imyaka, ubutaka buzima, ibimera bya push-pull (Desmodium + Brachiaria ku gisambo cy\'ibigori)',
          'KUGENZURA: reba ibimera 10 ahantu 5 mu murima kabiri mu cyumweru; bara ibyangiritse n\'udukoko',
          'KWEMEZA: kora gusa iyo urenze urugero (urugero: igisambo cy\'ibigori ku kimera 1 muri 10 by\'ibigori bito)',
          'UBURYO BW\'INTOKI/KAMERE: gufata n\'intoki, imitego (iy\'umuhondo kuri whiteflies, pheromone ku gisambo), umuti wa neemu, ivu mu mitima, kurinda inyoni n\'ibinyugunyugu byiza',
          'IMITI nyuma: koresha ibicuruzwa byemewe na RAB gusa, igipimo nyacyo, tera mu mugoroba, ambara uturindantoki/agapfukamunwa, kubahiriza iminsi iri ku kirango mbere y\'isarura'
        ]},
        { h: 'Udukoko dukomeye mu Rwanda', p: 'Igisambo cy\'ibigori (fall armyworm), igikeri cy\'ibitoki (gitwara bunchy top), udukoko tw\'umweru (cassava mosaic, TYLCV ku nyanya), aphids z\'ibishyimbo (BCMV), igisambo cy\'ibirayi, antestia ku ikawa, udukoko tw\'icyayi.' },
        { h: 'Irinde', p: 'Ntukajye utera imiti ugana n\'umuyaga. Ntukajye wongera gukoresha ibikoresho by\'imiti — bikoresha gatatu ubisukure ubisubize ku mudandaza. Mesura imyenda yo gutera ukwayo.' }
      ]
    }
  },
  {
    id: 'harvest-post', emoji: '🧺', category: 'harvest',
    title: { en: 'Harvesting & Post-Harvest Handling', rw: 'Gusarura no Gukorana n\'Umusaruro' },
    minutes: 7,
    body: {
      en: [
        { h: '30% is lost after harvest', p: 'Rwandan farmers lose up to 30% of harvests to bad drying, weevils, mould and rats. Post-harvest care is free money.' },
        { steps: true, h: 'The golden rules', items: [
          'Harvest at the right maturity and in DRY weather',
          'Never dry grain on bare ground — use raised racks, tarpaulins or cement drying floors (common in cooperatives)',
          'Dry maize/beans to 13%, groundnuts to <10% — bite-test is unreliable; use the cooperative moisture meter',
          'Winnow and sort out damaged, discoloured or mouldy grains — one mouldy handful spoils a bag',
          'Store in raised, ventilated rooms; use hermetic bags (PICS) for maize and beans — they suffocate weevils without chemicals',
          'For fresh produce (tomato, Irish potato): use plastic crates, never sacks; keep out of sun; sell within days'
        ]},
        { h: 'Aflatoxin — the silent killer', p: 'Moulds on late-harvested, ground-dried maize and groundnuts produce aflatoxin, which causes liver cancer and blocks export. Prevention = dry fast, dry well, store dry. RAB and cooperatives test grain free at collection points.' },
        { h: 'Sell smart', p: 'Grade your produce; graded maize fetches 15-25% more at aggregation centres. Join a cooperative to access collective storage (wait for prices to rise) and bulk buyers.' }
      ],
      rw: [
        { h: '30% itakara nyuma y\'isarura', p: 'Abahinzi b\'u Rwanda batangaza kugeza kuri 30% by\'umusaruro kubera kumuza nabi, ibinyugunyugu, ububore n\'imbeba. Kwita ku musaruro nyuma y\'isarura ni amafaranga y\'ubuntu.' },
        { steps: true, h: 'Amategeko ya zahabu', items: [
          'Sarura ku gihe nyacyo cy\'isarura kandi mu bihe BY\'IZUBA',
          'Ntukajye umuze imbuto ku butaka — koresha ibirago, ibitambaro cyangwa aho kumuza ha cement (bisanzwe muri koperative)',
          'Muza ibigori/ibishyimbo ku buhehere bwa 13%, ubunyobwa <10% — gupima n\'amenyo ntibizewe; koresha icyuma gipima cya koperative',
          'Yungurura ukuremo imbuto zangiritse, zahinduye ibara cyangwa zifite ububore — agafuni kamwe kaboze kangiza umufuka',
          'Bika mu byumba bifite umuyaga; koresha imifuka idasohora umwuka (PICS) ku bigori n\'ibishyimbo — yica ibinyugunyugu nta miti',
          'Ku mbuto z\'ibiribwa (inyanya, ibirayi): koresha ibirago bya pulasitiki, nta mifuka; birinde izuba; gurisha mu minsi mike'
        ]},
        { h: 'Aflatoxin — umwicanyi utagaragara', p: 'Ubwandu ku bigori n\'ubunyobwa byamuwe ku butaka bitanga aflatoxin, itera kanseri y\'umwijima kandiibuza kohereza hanze. Kwirinda = muza vuba, muza neza, bika byumye. RAB na koperative bipima imbuto ku buntu ku bibanza byo gukusanya.' },
        { h: 'Gurisha ubwenge', p: 'Tondeka umusaruro wawe; ibigori bitondetswe bibona 15-25% by\'inyongera ku bibanza byo guhuriza. Injira muri koperative kugira ngo ubone ububiko buhuriweho (tegereza ibiciro bizamuke) n\'abaguzi benshi.' }
      ]
    }
  },
  {
    id: 'water', emoji: '💦', category: 'farming',
    title: { en: 'Water Management & Small-Scale Irrigation', rw: 'Gucunga Amazi n\'Ubwuhira Buto' },
    minutes: 5,
    body: {
      en: [
        { h: 'Water is the new land', p: 'With climate change, rain alone is risky. Small-scale irrigation lets you grow tomatoes, onions and maize in the dry season when prices double.' },
        { steps: true, h: 'Practical options for smallholders', items: [
          'Rainwater harvesting: roof gutters into a 5-10 m³ tank or lined pond — enough for a 200 m² vegetable garden through the dry season',
          'Watering cans with rose heads for seedbeds and young vegetables (morning or evening only)',
          'Treadle pumps and small motor pumps from valley wetlands (join a user group for shared pumping)',
          'Drip kits: a 500 m² drip kit costs around 60,000-100,000 RWF and saves 50% water; many programmes (SPIU, WASAC) subsidise them',
          'Mulch everything — 15 cm of grass mulch cuts evaporation by a third'
        ]},
        { h: 'Protect water sources', p: 'Never wash spray equipment in streams. Keep 10 m buffer of grass/trees along waterways (law requirement) — it also traps your fertiliser before it escapes.' }
      ],
      rw: [
        { h: 'Amazi ni ubutaka bushya', p: 'N\'imihindagurikire y\'ikirere, imvura yonyine ifite ingaruka mbi. Ubwuhira buto bugutera inyanya, ibitunguru n\'ibigori mu gihe cy\'izuba igihe ibiciro byikuba kabiri.' },
        { steps: true, h: 'Uburyo bwiza ku bahinzi bato', items: [
          'Gukusanya amazi y\'imvura: imiferege yo ku nzu mu kigega cya m³ 5-10 cyangwa icyuzi — bihagije ku murima w\'imboga wa m² 200 mu gihe cy\'izuba',
          'Ibikarito byo kuvomera bifite imitwe ku mabuto n\'imboga nto (mu gitondo cyangwa nimugoroba gusa)',
          'Pompe z\'amaguru na pompe nto z\'imashini mu bishanga byo mu bibaya (injira mu itsinda rikoresha hamwe)',
          'Ibikoresho bya drip: kit ya m² 500 ihenda 60,000-100,000 RWF ikazigama 50% by\'amazi; gahunda nyinshi (SPIU, WASAC) zitanga inkunga',
          'Twikiriza byose — mulch ya cm 15 igabanya guhumuka ho kimwe cya gatatu'
        ]},
        { h: 'Rinda amasoko y\'amazi', p: 'Ntukajye ukarabira ibikoresho by\'imiti mu migezi. Gumana metero 10 z\'ibyatsi/ibiti ku nkombo z\'amazi (itegeko) — binafata ifumbire yawe itaracika.' }
      ]
    }
  },
  {
    id: 'climate', emoji: '🌦️', category: 'farming',
    title: { en: 'Climate-Smart Farming in Rwanda', rw: 'Ubuhinzi Bwihanganira Imihindagurikire y\'Ikirere' },
    minutes: 6,
    body: {
      en: [
        { h: 'The seasons are shifting', p: 'Season A rains now start later and end sooner; dry spells hit mid-season. Adapt with these practices used by Rwanda\'s climate-smart villages.' },
        { steps: true, h: 'What works', items: [
          'Plant EARLY within 3 days of effective rain — neighbours who plant together harvest together (fewer pest raids too)',
          'Use short-cycle varieties (90-day maize for Nyagatare, early beans)',
          'Zai pits / planting basins: dig 30 cm holes, fill with manure, plant inside — yields double in dry zones',
          'Intercrop and mix: maize+beans, banana+coffee+calliandra — if one fails, another pays',
          'Agroforestry on boundaries: Grevillea, Calliandra, Leucaena give shade, fodder, firewood and hold terraces',
          'Weather info: follow RAB/Meteo-Rwanda SMS alerts and the Twigire Umwuga agronomy messages'
        ]},
        { h: 'One cow, one garden', p: 'The Girinka programme model: one cow gives manure for fertiliser, biogas potential, and milk income. Combined with a kitchen garden and rainwater tank, it is the resilient smallholder package.' }
      ],
      rw: [
        { h: 'Ibihe birahinduka', p: 'Imvura y\'igihembwe A ubu itangira itinze kandi irangira vuba; amapfa akubita hagati. Kwihuza n\'ibi bikorwa bikoreshwa mu midugudu y\'ubuhinzi bwihanganira ikirere mu Rwanda.' },
        { steps: true, h: 'Ibikora', items: [
          'Tera KARE mu minsi 3 nyuma y\'imvura ifatika — abaturanyi batera rimwe basarura rimwe (bigabanya n\'ibitero by\'udukoko)',
          'Koresha imbuto z\'igihe gito (ibigori by\'iminsi 90 bya Nyagatare, ibishyimbo byera vuba)',
          'Imyobo ya zai: cukura imyobo ya cm 30, wuzuze ifumbire, uteremo — umusaruro wikuba kabiri mu turere tw\'amapfa',
          'Guteranya no kuvanga: ibigori+ibishyimbo, ibitoki+ikawa+calliandra — iyo kimwe gitsinzwe, ikindi kirishyura',
          'Amashyamba ku mbibi: Grevillea, Calliandra, Leucaena bitanga igicucu, ubwatsi bw\'amatungo, inkwi kandi bifata amazu y\'ubutaka',
          'Amakuru y\'ikirere: kurikira ubutumwa bwa SMS bwa RAB/Meteo-Rwanda n\'ubuhinzi bwa Twigire Umwuga'
        ]},
        { h: 'Inka imwe, umurima umwe', p: 'Icyitegererezo cya Girinka: inka imwe itanga ifumbire, biogas, n\'amafaranga y\'amata. Hamwe n\'umurima w\'imboga n\'ikigega cy\'amazi, ni umurongo wuzuye w\'umuhinzi mwiza.' }
      ]
    }
  },
  {
    id: 'livestock-basics', emoji: '🐄', category: 'livestock',
    title: { en: 'Livestock Basics for Crop Farmers', rw: 'Ubworozi ku Bahinzi' },
    minutes: 5,
    body: {
      en: [
        { h: 'Animals feed the farm', p: 'A goat or cow turns your crop residues and roadside grass into manure, milk and meat. Livestock and crops belong together.' },
        { steps: true, h: 'Key practices', items: [
          'Build the kraal/stall on a slope with a concrete or compacted floor — collect urine + manure into a covered pit',
          'Zero-grazing dairy cows: cut and carry Napier grass, supplement with Calliandra leaves and brans',
          'Vaccinate on schedule: Newcastle (poultry), FMD and lumpy skin (cattle), PPR (goats) — district vets run free campaigns',
          'Deworm every 3 months; dip/spray against ticks every week in tick season',
          'Compost the manure 2-3 months (turn weekly) before applying to fields',
          'One cow needs 2 cut-and-carry plots of Napier (~0.1 ha) — plant it on boundaries and terraces'
        ]},
        { h: 'Watch for disease', p: 'Sick animal? Isolate it immediately, call the sector vet (free) before trying local remedies. East Coast Fever kills fast in calves — tick control is cheaper than treatment.' }
      ],
      rw: [
        { h: 'Amatungo afumbira umurima', p: 'Ihene cyangwa inka ihindura ibisigazwa by\'imyaka n\'ibyatsi byo ku muhanda mo ifumbire, amata n\'inyama. Amatungo n\'imyaka bigendana.' },
        { steps: true, h: 'Imigenzereze y\'ingenzi', items: [
          'Kora ikiraro ku musozi ufite hasi ha cement — kusanya inkari + ifumbire mu mwobo wifutse',
          'Inka z\'amata zitagira inzerereza: kate ubwatsi bwa Napier, wongereho amababi ya Calliandra n\'ibisigazwa by\'ingano',
          'Kingira ku gihe: Newcastle (inkoko), FMD na lumpy skin (inka), PPR (ihene) — abavuzi b\'akarere bakora ubukangurambaga bw\'ubuntu',
          'Kuraho inzoka buri mezi 3; tera/kuraho udukoko buri cyumweru mu gihe cy\'udukoko',
          'Ifumbire ibore amezi 2-3 (uyihindure buri cyumweru) mbere yo kuyishyira mu mirima',
          'Inka imwe ikeneye imirima 2 ya Napier (hegitari 0.1) — tere ku mbibi n\'amazu y\'ubutaka'
        ]},
        { h: 'Reba indwara', p: 'Itungo rirwaye? Rishyire ukwaryo ako kanya, hamagare umuvuzi w\'umurenge (ku buntu) mbere yo kugerageza imiti y\'ibanze. East Coast Fever yica vuba mu nyana — kurinda udukoko birahendutse kurusha kuvura.' }
      ]
    }
  },
  {
    id: 'market', emoji: '💰', category: 'business',
    title: { en: 'Farming as a Business', rw: 'Ubuhinzi nk\'Ubucuruzi' },
    minutes: 6,
    body: {
      en: [
        { h: 'Know your numbers', p: 'A farm without records is a gamble. Track every input and every sale in a simple notebook per plot, per season.' },
        { steps: true, h: 'The record book', items: [
          'For each plot write: size, crop, variety, seed cost, fertiliser cost, sprays, labour days, harvest kg, selling price',
          'Compute: profit = sales − all costs (including your own labour days valued at the local wage)',
          'Compare crops each season — most farmers discover vegetables or soybean beat maize per m²',
          'Save 10% of sales as next season\'s input fund BEFORE anything else'
        ]},
        { h: 'Sell together, sell better', p: 'Aggregation centres and cooperatives negotiate bulk prices (maize at RWF 50-80/kg more than roadside). Contract farming with processors (e.g. for chilli, soybean, Irish potato crisp) guarantees a buyer — but read the contract and ask your agronomist to explain clauses.' },
        { h: 'Support you can tap', p: 'Twigire Umwuga extension advisors (sector office), BK/URwego farmer loans, crop insurance schemes (NAEB for coffee, BK General for maize/potato), and the Nkunganire subsidy programme for seed and fertiliser.' }
      ],
      rw: [
        { h: 'Menya imibare yawe', p: 'Umurima udafite inyandiko ni ugukina. Andika buri gikoresho na buri kugurisha mu gitabo cyoroheje kuri buri murima, buri gihembwe.' },
        { steps: true, h: 'Igitabo cy\'inyandiko', items: [
          'Kuri buri murima andika: ubunini, igihingwa, imbuto, igiciro cy\'imbuto, ifumbire, imiti, iminsi y\'umurimo, kg z\'umusaruro, igiciro cyo kugurisha',
          'Bara: inyungu = amafaranga yose − ibiciro byose (harimo n\'iminsi yawe y\'umurimo ihembwa nk\'umukozi)',
          'Gereranya ibihingwa buri gihembwe — abahinzi benshi basanga imboga cyangwa soya biruta ibigori kuri m²',
          'Zigama 10% by\'amafaranga nk\'ifaranga ry\'ibikoresho by\'igihembwe gitaha MBERE y\'ibindi byose'
        ]},
        { h: 'Gurisha hamwe, gurisha neza', p: 'Ibibanza byo guhuriza na koperative biganira ibiciro byinshi (ibigori kuri RWF 50-80/kg byinshi kurusha ku muhanda). Ubuhinzi bw\'amasezerano n\'inganda (urugero: urusenda, soya, ibirayi by\'udukote) bwemeza umuguzi — ariko soma amasezerano usabe agronome gusobanura.' },
        { h: 'Inkunga ushobora kubona', p: 'Abajyanama ba Twigire Umwuga (ibiro by\'umurenge), inguzanyo z\'abahinzi za BK/URwego, gahunda z\'ubwishingizi bw\'imyaka (NAEB ku ikawa, BK General ku bigori/ibirayi), na gahunda ya Nkunganire ku mbuto n\'ifumbire.' }
      ]
    }
  }
]

AS.LESSON_CATEGORIES = {
  farming: { emoji: '⛏️', en: 'Crop Farming', rw: 'Ubuhinzi' },
  pests: { emoji: '🐛', en: 'Pests & Diseases', rw: 'Udukoko n\'Indwara' },
  harvest: { emoji: '🧺', en: 'Harvest & Storage', rw: 'Isarura n\'Ububiko' },
  livestock: { emoji: '🐄', en: 'Livestock', rw: 'Ubworozi' },
  business: { emoji: '💰', en: 'Agri-Business', rw: 'Ubucuruzi bw\'Ubuhinzi' }
}
