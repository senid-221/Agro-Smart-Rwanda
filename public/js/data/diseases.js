// AgroSmart Rwanda — Crop disease knowledge base (Rwanda-focused)
// colorSig: weights used by the detection engine to match leaf color patterns.
AS.CROPS = {
  maize:    { emoji: '🌽', img: 'img/crops/maize.png', en: 'Maize', rw: 'Ibigori' },
  banana:   { emoji: '🍌', img: 'img/crops/banana.png', en: 'Banana', rw: 'Igitoki' },
  bean:     { emoji: '🫘', img: 'img/crops/bean.png', en: 'Beans', rw: 'Ibishyimbo' },
  cassava:  { emoji: '🥔', img: 'img/crops/cassava.png', en: 'Cassava', rw: 'Imyumbati' },
  potato:   { emoji: '🥔', img: 'img/crops/potato.png', en: 'Irish Potato', rw: 'Ibirayi' },
  sweetpotato:{ emoji: '🍠', img: 'img/crops/sweetpotato.png', en: 'Sweet Potato', rw: 'Ibijumba' },
  tomato:   { emoji: '🍅', img: 'img/crops/tomato.png', en: 'Tomato', rw: 'Inyanya' },
  rice:     { emoji: '🌾', img: 'img/crops/rice.png', en: 'Rice', rw: 'Umuceri' },
  coffee:   { emoji: '☕', img: 'img/crops/coffee.png', en: 'Coffee', rw: 'Ikawa' },
  tea:      { emoji: '🍵', img: 'img/crops/tea.png', en: 'Tea', rw: 'Icyayi' },
  sorghum:  { emoji: '🌾', img: 'img/crops/sorghum.png', en: 'Sorghum', rw: 'Amasaka' },
  groundnut:{ emoji: '🥜', img: 'img/crops/groundnut.png', en: 'Groundnuts', rw: 'Ubunyobwa' }
}

AS.DISEASES = [
  // ============ MAIZE ============
  {
    id: 'maize-lethal-necrosis', crop: 'maize', severity: 'high',
    name: { en: 'Maize Lethal Necrosis (MLN)', rw: 'Indwara y\'Ibigori Itera Urumega (MLN)' },
    sci: 'Maize chlorotic mottle virus + Sugarcane mosaic virus',
    symptoms: {
      en: ['Yellowing of leaves from the edges inward, starting on lower leaves', 'Green veins remain visible within yellow tissue (striped look)', 'Stunted plant growth and shortened internodes', 'Deformed, small cobs or complete failure to form grain', 'Plants may die prematurely'],
      rw: ['Amababi atangira guhinduka umuhondo kuva ku nkombo zerekeza imbere, bitangirira ku mababi yo hasi', 'Imitsi y\'amababi iguma ari icyatsi mu bice by\'umuhondo', 'Ikigori kiragwingira, ntikirekire', 'Ibisagihwa biba bito, bipfuye cyangwa ntibiboneke na gato', 'Ibigori bishobora gupfuma imburagihe']
    },
    cause: {
      en: 'Spread by thrips, beetles and aphids feeding on infected plants. Very serious in East Africa — it is a NOTIFIABLE disease in Rwanda.',
      rw: 'Ikwirakwizwa n\'udusimba (thrips, amahenehene n\'ibikeri by\'ibimera) turya ku bimera byanduye. Ni indwara ikomeye cyane mu Burasirazuba bwa Afurika — igomba kumenyekeshwa mu Rwanda.'
    },
    treatment: {
      en: ['There is NO cure for infected plants — remove and burn or bury them immediately', 'Do NOT feed infected plants to animals', 'Control insect vectors with approved insecticides (e.g. imidacloprid for aphids/thrips at early stage)', 'Report the outbreak to the nearest RAB (Rwanda Agriculture Board) office or agronomist'],
      rw: ['NTA muti uvura ibimera byanduye — bicukure ubitwike cyangwa ubihambe ako kanya', 'NTUHE amatungo ibimera byanduye', 'Rwanya udukoko dukwirakwiza iyi ndwara ukoresheje imiti yemewe (nka imidacloprid ku dukoko two mu bwoko bwa aphids/thrips)', 'Menyesha ibiro bya RAB bigegereye cyangwa umuhinza w\'umwuga (agronome)']
    },
    organic: {
      en: ['Use certified clean seed only', 'Rotate maize with beans, soybeans or sweet potato', 'Plant early to escape peak thrips activity', 'Remove weed hosts around the field'],
      rw: ['Koresha imbuto z\'umwimerere zifite icyangombwa gusa', 'Simbuza ibigori n\'ibishyimbo, soya cyangwa ibijumba', 'Tera kare kugira ngo wirinde igihe cy\'udusimba twinshi', 'Kuraho ibyatsi bibi bikikije umurima']
    },
    prevention: {
      en: ['Always plant certified MLN-free seed', 'Avoid continuous maize cropping on the same field', 'Scout fields weekly for early yellowing symptoms'],
      rw: ['Teraho imbuto zemewe zitarandura', 'Wirinde guhinga ibigori ku murima umwe imyaka ikurikirana', 'Genzura umurima buri cyumweru urebe ibimenyetso by\'umuhondo']
    },
    colorSig: { yellow: 0.9, green: 0.4, brown: 0.3, black: 0.05, pale: 0.6 }
  },
  {
    id: 'maize-northern-leaf-blight', crop: 'maize', severity: 'medium',
    name: { en: 'Northern Leaf Blight', rw: 'Ikirungu cy\'Amababi y\'Ibigori' },
    sci: 'Exserohilum turcicum',
    symptoms: {
      en: ['Long cigar-shaped grey-green lesions (3-15 cm) on leaves', 'Lesions turn tan/brown as they age', 'Starts on lower leaves and moves upward', 'Heavy infection dries the whole leaf'],
      rw: ['Ibice byanduye bimeze nk\'itabi (cigar) ibara ry\'icyatsi-ikirungu ku mababi (santi 3-15)', 'Iyo bishaje bihinduka ikigina/ikijuju', 'Bitangirira ku mababi yo hasi bizamuka hejuru', 'Iyo indwara ikomeye riba ryuma ryose']
    },
    cause: {
      en: 'Fungus favoured by cool, humid weather common in Rwanda\'s highlands (1,500-2,000 m). Spreads by wind and rain splash.',
      rw: 'Iterwa na fungus ikunda ubuhehere n\'ubukonje bwo mu misozi miremire y\'u Rwanda (metero 1,500-2,000). Ikwirakwira n\'umuyaga n\'imvura.'
    },
    treatment: {
      en: ['Spray fungicide: mancozeb, chlorothalonil or azoxystrobin at first symptoms; repeat every 10-14 days', 'Spray early morning or late evening', 'Remove and destroy heavily infected lower leaves'],
      rw: ['Tera imiti ya fungus: mancozeb, chlorothalonil cyangwa azoxystrobin ku kimenyetso cya mbere; subiramo buri minsi 10-14', 'Tera mu gitondo kare cyangwa nimugoroba', 'Kuraho utwika amababi yo hasi yanduye cyane']
    },
    organic: {
      en: ['Plant tolerant varieties (ask agro-dealers for RHM series)', 'Rotate with legumes for 1-2 seasons', 'Ensure good drainage and avoid overcrowding'],
      rw: ['Tera imbuto zihangana n\'indwara (baza abadandaza imiti z\'uruhererekane RHM)', 'Simbuza n\'ibinyamisogwe imyaka 1-2', 'Shyiraho uburyo bwo kuyungurura amazi neza wirinde no gutera byegeranye cyane']
    },
    prevention: {
      en: ['Use resistant hybrids', 'Plough in crop residues after harvest', 'Avoid planting late in the season'],
      rw: ['Koresha imbuto zivange zihangana', 'Hinga ibisigazwa by\'imyaka nyuma y\'isarura', 'Wirinde gutera bitinze mu mwaka']
    },
    colorSig: { yellow: 0.3, green: 0.5, brown: 0.8, black: 0.1, pale: 0.3 }
  },
  {
    id: 'maize-gray-leaf-spot', crop: 'maize', severity: 'medium',
    name: { en: 'Gray Leaf Spot', rw: 'Utudomo Duto Tw\'Ikigina ku Ibigori' },
    sci: 'Cercospora zeae-maydis',
    symptoms: {
      en: ['Small rectangular spots (2-5 mm) with grey centres and brown margins', 'Spots are restricted by leaf veins — square-ish shape', 'Many spots join and the leaf dries from bottom up', 'Reduced grain filling and yield'],
      rw: ['Utudomo duto tw\'urukiramende (mm 2-5) dufite hagati h\'ikigina n\'inkengero z\'ikijuju', 'Utudomo tuguma hagati y\'imitsi y\'ibabi — dufite ishusho ya kare', 'Iyo tubaye twinshi turahuzwa ibabi rikuma riva hasi rizamuka', 'Umusaruro w\'imbuto uragabanuka']
    },
    cause: {
      en: 'Fungus surviving in maize residues; humid warm weather with long dew periods (common in Rwanda\'s cropping highlands).',
      rw: 'Fungus ibaho mu bisigazwa by\'ibigori; ikundwa n\'ubuhehere n\'ubushyuhe hamwe n\'ikime kirekire (bisanzwe mu misozi y\'u Rwanda).'
    },
    treatment: {
      en: ['Apply azoxystrobin, difenoconazole or mancozeb at tasselling stage', 'Repeat after 14 days if rain continues'],
      rw: ['Koresha azoxystrobin, difenoconazole cyangwa mancozeb igihe ibigori bitangiye gusoroma', 'Subiramo nyuma y\'iminsi 14 niba imvura ikomeza']
    },
    organic: {
      en: ['Deep plough residues to bury infected material', 'Rotate with non-host crops (beans, groundnuts)', 'Wider spacing to let leaves dry faster'],
      rw: ['Hinga burundu ibisigazwa kugira ngo ushyingure ibyanduye', 'Simbuza n\'imyaka itandukanye (ibishyimbo, ubunyobwa)', 'Terana intera nini kugira ngo amababi yume vuba']
    },
    prevention: {
      en: ['Choose resistant hybrids', 'Never plant into unburied infected residue'],
      rw: ['Hitamo imbuto zihangana', 'Ntukagire icyo utera mu bisigazwa byanduye bitarashyingurwa']
    },
    colorSig: { yellow: 0.35, green: 0.5, brown: 0.7, black: 0.1, pale: 0.5 }
  },
  {
    id: 'maize-streak-virus', crop: 'maize', severity: 'medium',
    name: { en: 'Maize Streak Virus', rw: 'Indwara y\'Imirongo ku Ibigori (MSV)' },
    sci: 'Maize streak mastrevirus',
    symptoms: {
      en: ['Narrow pale-yellow streaks running parallel to the veins', 'Streaks concentrated on young leaves', 'Severe stunting; plants infected early may produce no cob', 'Worst in young plants'],
      rw: ['Imirongo mito y\'umuhondo ibangikanye n\'imitsi y\'ibabi', 'Imirongo yiganje ku mababi mato', 'Ikigori kiragwingira cyane; ibyanduye bikiri bito bishobora kutabyara ikiyongoyongo', 'Bikomeye cyane ku bimera bikiri bito']
    },
    cause: {
      en: 'Spread by leafhoppers (Cicadulina mbila) that feed on infected maize and grasses.',
      rw: 'Ikwirakwizwa n\'udusimba two mu bwoko bwa leafhopper turya ku bigori byanduye n\'ibyatsi.'
    },
    treatment: {
      en: ['No cure — remove severely infected young plants', 'Control leafhoppers with insecticide seed treatment or foliar spray early in the season', 'Remove surrounding grass weeds that host leafhoppers'],
      rw: ['Nta muti uvura — kuraho ibimera bito byanduye bikabije', 'Rwanya leafhoppers ukoresheje imiti yo gushyira ku mbuto cyangwa guterera ku mababi mu ntangiriro', 'Kuraho ibyatsi bibi bikikije umurima bicumbikira utwo dusimba']
    },
    organic: {
      en: ['Plant MSV-tolerant varieties', 'Weed the field and field margins regularly', 'Avoid planting next to old infected maize fields'],
      rw: ['Tera imbuto zihanganira MSV', 'Sarura ibyatsi mu murima no ku nkengero buri gihe', 'Wirinde guhinga iruhande rw\'imirima ishaje yanduye']
    },
    prevention: {
      en: ['Early planting', 'Use treated certified seed', 'Keep fields weed-free'],
      rw: ['Tera kare', 'Koresha imbuto zemewe zavuwe', 'Gumana umurima udafite ibyatsi']
    },
    colorSig: { yellow: 0.7, green: 0.5, brown: 0.15, black: 0.05, pale: 0.7 }
  },
  {
    id: 'fall-armyworm', crop: 'maize', severity: 'high',
    name: { en: 'Fall Armyworm', rw: 'Igisambo cy\'Ibigori (Fall Armyworm)' },
    sci: 'Spodoptera frugiperda',
    symptoms: {
      en: ['Ragged holes in leaves and "window pane" scrapes', 'Sawdust-like frass in the whorl', 'Whorl and tassels being eaten; young plants cut at the base', 'Cream/brown caterpillars with stripes and 4 dots on the tail end'],
      rw: ['Imyobo itaringaniye mu mababi n\'ibice byononekaye', 'Umwanda umeze nk\'amaso y\'imbaho mu mutima w\'ikigori', 'Umutima n\'indabyo biraribwa; ibimera bito bigacibwa hasi', 'Inyo z\'ibinyugunyugu z\'umweru/ikijuju zifite imirongo n\'utudomo 4 ku murizo']
    },
    cause: {
      en: 'Invasive moth pest present across Rwanda; moths fly at night and lay egg masses covered with fur on lower leaves.',
      rw: 'Ni igisambo cy\'ibinyugunyugu cyabaye icyorezo mu Rwanda; bikorera nijoro bikajugunya amagi apfutse n\'ubwoya ku mababi yo hasi.'
    },
    treatment: {
      en: ['Spray at early larval stage into the whorl: emamectin benzoate, chlorantraniliprole or indoxacarb (RAB approved)', 'Spray late afternoon when larvae are active', 'Dust or pour soapy water / ash into whorls of small plots'],
      rw: ['Tera imiti mu mutima w\'ikigori hakiri kare: emamectin benzoate, chlorantraniliprole cyangwa indoxacarb (yemewe na RAB)', 'Tera mu mugoroba inyoni zitarinda ijoro ryose', 'Shyira amazi arimo isabune cyangwa ivu mu mitima y\'ibigori ku mirima mito']
    },
    organic: {
      en: ['Handpick and crush larvae early morning', 'Push-pull technology: intercrop with desmodium, plant brachiaria around the field', 'Spray neem (Azadirachta indica) extract into the whorl', 'Release natural enemies — birds, wasps; do not over-spray'],
      rw: ['Fata inyo z\'ibinyugunyugu uzimene mu gitondo kare', 'Uburyo bwa push-pull: tera desmodium mu murima, brachiaria ku nkengero', 'Tera umuti w\'igiti cya neemu mu mutima w\'ibigori', 'Reka abanzi kamere b\'ibisambo — inyoni, ibinyugunyugu by\'umuhondo; wirinde guterera imiti myinshi']
    },
    prevention: {
      en: ['Scout 10 plants in 5 field locations twice weekly from emergence', 'Plant early and synchronised with neighbours', 'Maintain healthy fertilised plants — they tolerate damage better'],
      rw: ['Genzura ibimera 10 ahantu 5 mu murima kabiri mu cyumweru guhera bimera', 'Tera kare kandi hamwe n\'abaturanyi', 'Gumana ibimera bifite ifumbire nziza — bihangana n\'ibyangiritse']
    },
    colorSig: { yellow: 0.3, green: 0.6, brown: 0.5, black: 0.2, pale: 0.4 }
  },

  // ============ BANANA ============
  {
    id: 'banana-xanthomonas-wilt', crop: 'banana', severity: 'high',
    name: { en: 'Banana Xanthomonas Wilt (Kirabiranya)', rw: 'Kirabiranya (BXW)' },
    sci: 'Xanthomonas campestris pv. musacearum',
    symptoms: {
      en: ['Yellow-orange bacterial ooze when the pseudostem is cut', 'Premature ripening of fruits, uneven and hard', 'Wilting and yellowing of leaves starting from oldest', 'Rotting of the stem centre; male bud blackens and dries'],
      rw: ['Amazi y\'umuhondo-orange (bacterie) asohoka iyo umuhatsa uciwe', 'Ibitoki birasha kare, bidatunganye kandi bikomeye', 'Amababi ararwarwa arahinduka umuhondo bitangirira ku mashaje', 'Umutima w\'igiti kirabora; indabyo y\'ingabo irahinduka umukara ikuma']
    },
    cause: {
      en: 'Bacterial disease spread by contaminated tools, insects visiting male buds, and infected planting suckers. Rwanda\'s #1 banana threat.',
      rw: 'Indwara ya bacterie ikwirakwira n\'ibikoresho byanduye, udukoko dusura indabyo z\'ingabo, n\'ibiti by\'urubyaro byanduye. Ni yo nti ya mbere ku bitoki mu Rwanda.'
    },
    treatment: {
      en: ['NO chemical cure exists — cut out and destroy the whole infected mat including roots', 'Bury or burn infected material; never compost it', 'Disinfect tools with bleach (javel) or fire after every cut'],
      rw: ['NTA muti w\'imiti uvura iyi ndwara — tema ushireho igiti cyose cyanduye harimo n\'imizi', 'Shyingura cyangwa utwike ibyanduye; ntukabikoreremo ifumbire', 'Sukura ibikoresho na javel cyangwa umuriro nyuma ya buri gikorwa']
    },
    organic: {
      en: ['Remove the male bud by hand (using a forked stick, not a knife) to stop insect spread', 'Plant only clean, disease-free suckers or tissue-culture plantlets', 'Debuds: remove male buds weekly', 'Use ash-slurry tool sterilisation'],
      rw: ['Kuraho indabyo y\'ingabo ukoresheje intoki (ukoresheje agiti k\'amashami abiri, atari icyuma)', 'Tera gusa ibiti by\'urubyaro bisukuye cyangwa ibiti byakuwe muri laboratoire (tissue culture)', 'Kuraho indabyo z\'ingabo buri cyumweru', 'Koresha ivu mu gusukura ibikoresho']
    },
    prevention: {
      en: ['Always sterilise tools between plants and gardens', 'Use tissue-culture plantlets where possible', 'Report new outbreaks to the sector agronomist immediately'],
      rw: ['Buri gihe sukura ibikoresho hagati y\'ibiti n\'imirima', 'Koresha ibiti byakuwe muri laboratoire bishoboka', 'Menyesha agronome w\'umurenge vuba ku byorezo bishya']
    },
    colorSig: { yellow: 0.85, green: 0.3, brown: 0.6, black: 0.3, pale: 0.4 }
  },
  {
    id: 'banana-fusarium-wilt', crop: 'banana', severity: 'high',
    name: { en: 'Panama Disease (Fusarium Wilt)', rw: 'Indwara ya Panama (Fusarium)' },
    sci: 'Fusarium oxysporum f. sp. cubense',
    symptoms: {
      en: ['Older leaves yellow at the margins, then collapse downwards like a "skirt"', 'Splitting the pseudostem shows red-brown streaks in the vessels', 'Whole plant wilts while fruits stay small', 'No ooze (this distinguishes it from Kirabiranya)'],
      rw: ['Amababi ashaje ahinduka umuhondo ku nkombo, hanyuma amanuka hasi nk\'"ijipo"', 'Iyo ucagase umuhatsa ubona imirongo itukura-ijuju mu miyoboro', 'Igiti cyose kirarwara mu gihe ibitoki biguma ari bito', 'Nta mazi asohoka (ibitandukanya na Kirabiranya)']
    },
    cause: {
      en: 'Soil-borne fungus entering through roots; survives in soil for decades. Spreads with infected suckers and contaminated soil/water.',
      rw: 'Fungus ibaho mu butaka yinjirira mu mizi; ibaho mu butaka imyaka mirongo. Ikwirakwira n\'ibiti byanduye n\'ubutaka/amazi yanduye.'
    },
    treatment: {
      en: ['No cure — remove and burn infected plants with surrounding soil', 'Do not replay susceptible varieties in that spot', 'Flood or solarise soil where feasible'],
      rw: ['Nta muti uvura — kuraho ibimera byanduye ubitwikane n\'ubutaka bubikikije', 'Ntusubire gutera imbuto zumva iyo ndwara aho hantu', 'Shyira amazi cyangwa imirasire y\'izuba ku butaka bishoboka']
    },
    organic: {
      en: ['Plant resistant varieties (e.g. FHIA hybrids, Nshikazi)', 'Use only certified tissue-culture plantlets', 'Improve drainage; apply compost to boost soil microbes'],
      rw: ['Tera imbuto zihangana (nka FHIA, Nshikazi)', 'Koresha gusa ibiti byemewe byakuwe muri laboratoire', 'Tezamura kuyungurura amazi; shyiramo ifumbire y\'ibimera kugira ngoongerwe bacterie nziza mu butaka']
    },
    prevention: {
      en: ['Quarantine: never move soil or suckers from infected zones', 'Clean tools and footwear between fields'],
      rw: ['Shyira mu kato: ntukimuke ubutaka cyangwa ibiti biva mu turere twanduye', 'Sukura ibikoresho n\'inkweto hagati y\'imirima']
    },
    colorSig: { yellow: 0.8, green: 0.35, brown: 0.55, black: 0.15, pale: 0.5 }
  },
  {
    id: 'banana-bunchy-top', crop: 'banana', severity: 'high',
    name: { en: 'Banana Bunchy Top', rw: 'Umutwe w\'Ibitoki (Bunchy Top)' },
    sci: 'Banana bunchy top virus',
    symptoms: {
      en: ['Severely stunted, narrow leaves bunched at the top ("bunchy")', 'Dark green streaks on leaf veins and petioles', 'Upright, brittle leaves with yellow margins', 'No fruit production'],
      rw: ['Amababi mato afunze yikubiye ku mutwe ("bunchy")', 'Imirongo y\'icyatsi kibisi ku mitsi y\'amababi', 'Amababi ahagaritse, adakomeye, afite inkombo z\'umuhondo', 'Nta bitoki biboneka']
    },
    cause: {
      en: 'Virus spread by the banana aphid and by infected planting material.',
      rw: 'Virus ikwirakwizwa n\'igikeri cy\'ibitoki (banana aphid) n\'ibiti by\'urubyaro byanduye.'
    },
    treatment: {
      en: ['Destroy infected plants: inject herbicide into the pseudostem or cut and cover with plastic to kill aphids first', 'Control aphids with insecticide on surrounding healthy mats'],
      rw: ['Kuraho ibimera byanduye: shyira umuti wica ibyatsi mu muhatsa cyangwa uteme ubishyire mu mufuka wa pulasitiki kugira ngo wice udukoko', 'Rwanya aphids ku biti bizima bikikije']
    },
    organic: {
      en: ['Use clean certified planting material', 'Encourage ladybirds and hoverflies that eat aphids', 'Remove wild banana hosts near gardens'],
      rw: ['Koresha ibiti by\'urubyaro bisukuye byemewe', 'Fasha ibinyugunyugu by\'umuhondo n\'udusimba turya aphids', 'Kuraho ibitoki by\'ishyamba hafi y\'imirima']
    },
    prevention: {
      en: ['Inspect suckers before planting', 'Keep gardens weed-free and monitored monthly'],
      rw: ['Genzura ibiti by\'urubyaro mbere yo gutera', 'Gumana imirima isukuye kandi igenzurwa buri kwezi']
    },
    colorSig: { yellow: 0.6, green: 0.7, brown: 0.1, black: 0.05, pale: 0.3 }
  },
  {
    id: 'banana-sigatoka', crop: 'banana', severity: 'medium',
    name: { en: 'Black Sigatoka (Black Leaf Streak)', rw: 'Sigatoka y\'Umwirabura' },
    sci: 'Pseudocercospora fijiensis',
    symptoms: {
      en: ['Red-brown streaks on the underside of leaves', 'Streaks enlarge into dark necrotic patches with yellow halos', 'Leaves die from the outside in; few functional leaves remain', 'Bunches ripen prematurely and unevenly'],
      rw: ['Imirongo itukura-ijuju ku ruhande rwo hasi rw\'amababi', 'Imirongo ikura ihinduka ibice by\'umukara bifite uruziga rw\'umuhondo', 'Amababi apfa ahereye ku nkombo; hasigara make', 'Ibitoki biraisha kare kandi bidatunganye']
    },
    cause: {
      en: 'Fungus thriving in warm humid conditions; spreads by wind-blown spores. Present in most banana-growing districts of Rwanda.',
      rw: 'Fungus ikundwa n\'ubushyuhe n\'ubuhehere; ikwirakwira n\'umuyaga. Iboneka mu turere twinshi duhinga ibitoki mu Rwanda.'
    },
    treatment: {
      en: ['Remove and cut away all infected leaves ("desuckering/deleafing")', 'Spray difenoconazole or chlorothalonil-based fungicides every 14-21 days in severe cases', 'Apply potassium to strengthen plants'],
      rw: ['Kuraho amababi yanduye yose', 'Tera imiti ya fungus nka difenoconazole cyangwa chlorothalonil buri minsi 14-21 mu bihe bikomeye', 'Shyiramo ifumbire ya potasi kugira ngo ibimera bikomere']
    },
    organic: {
      en: ['Wider spacing (3 x 3 m) for airflow', 'Regular deleafing of infected tissue', 'Heavy mulching and farmyard manure to boost vigour'],
      rw: ['Intera nini (m 3 x 3) kugira ngo umuyaga uhite', 'Gukuraho amababi yanduye buri gihe', 'Gutwikira ubutaka n\'ifumbire y\'amatungo kugira ngo ibimera bikomere']
    },
    prevention: {
      en: ['Plant tolerant varieties', 'Keep drainage channels open', 'Do not move infected leaves between gardens'],
      rw: ['Tera imbuto zihanganira', 'Gumana imiferege ifunguye', 'Ntukimuke amababi yanduye hagati y\'imirima']
    },
    colorSig: { yellow: 0.5, green: 0.45, brown: 0.75, black: 0.5, pale: 0.3 }
  },

  // ============ BEANS ============
  {
    id: 'bean-angular-leaf-spot', crop: 'bean', severity: 'medium',
    name: { en: 'Angular Leaf Spot', rw: 'Utudomo tw\'Amababi twa Mfuruka (Ibishyimbo)' },
    sci: 'Pseudocercospora griseola',
    symptoms: {
      en: ['Angular brown spots bounded by leaf veins', 'Grey mould on the underside of spots in humid weather', 'Spots may join, drying and tearing the leaf', 'Reddish-brown lesions on pods'],
      rw: ['Utudomo tw\'ikijuju twa mfuruka turinzwe n\'imitsi y\'ibabi', 'Ifu y\'ikirungu munsi y\'utudomo mu bihe by\'ubuhehere', 'Utudomo dushobora guhuzwa, ibabi rikuma rikatandukana', 'Ibice bitukura-ijuju ku bifuka']
    },
    cause: {
      en: 'Fungus favoured by 16-28°C with prolonged leaf wetness; seed-borne and residue-borne.',
      rw: 'Fungus ikundwa n\'ubushyuhe bwa 16-28°C n\'ubuhehere ku mababi; ikwirakwira n\'imbuto n\'ibisigazwa.'
    },
    treatment: {
      en: ['Spray mancozeb or thiophanate-methyl at first sign, repeat every 7-10 days', 'Do not work in the field when leaves are wet'],
      rw: ['Tera mancozeb cyangwa thiophanate-methyl ku kimenyetso cya mbere, subiramo buri minsi 7-10', 'Ntukore mu murima igihe amababi atose']
    },
    organic: {
      en: ['Plant certified disease-free seed', 'Rotate with maize or sweet potato for 2 seasons', 'Remove and burn crop residues after harvest'],
      rw: ['Tera imbuto zemewe zitanduye', 'Simbuza n\'ibigori cyangwa ibijumba imyaka 2', 'Kusanya ubutwike ibisigazwa nyuma y\'isarura']
    },
    prevention: {
      en: ['Avoid overhead irrigation', 'Use resistant varieties (RAB-bushed series)'],
      rw: ['Wirinde kuhira hejuru y\'ibimera', 'Koresha imbuto zihangana (z\'uruhererekane RAB)']
    },
    colorSig: { yellow: 0.35, green: 0.45, brown: 0.75, black: 0.15, pale: 0.3 }
  },
  {
    id: 'bean-common-mosaic', crop: 'bean', severity: 'high',
    name: { en: 'Bean Common Mosaic Virus (BCMV)', rw: 'Indwara y\'Uruhererekane ku Bishyimbo (BCMV)' },
    sci: 'Bean common mosaic virus',
    symptoms: {
      en: ['Light and dark green mosaic pattern on leaves', 'Leaf blistering, distortion and downward curling', 'Stunted plants with few pods', 'Blackened vascular tissue in severe strains (black root)'],
      rw: ['Amababi afite ibara ry\'icyatsi cyijimye n\'icyatsi kibisi bivanze (mosaic)', 'Amababi afite utubyimba, apfunitse kandi yikunze hasi', 'Ibimera bigwingiye bifite ibifuka bike', 'Imiyoboro y\'umukara mu ndwara ikomeye']
    },
    cause: {
      en: 'Virus carried inside the seed and spread plant-to-plant by aphids.',
      rw: 'Virus iboneka mu mbuto ubwayo kandi ikwirakwira n\'udukoko (aphids) kuva ku kimera ku kindi.'
    },
    treatment: {
      en: ['No cure — rogue out and destroy infected plants as soon as seen', 'Control aphids with approved insecticides early in the season'],
      rw: ['Nta muti uvura — kuraho ibimera byanduye ako kanya ubitwike', 'Rwanya aphids n\'imiti yemewe mu ntangiriro y\'umwaka']
    },
    organic: {
      en: ['Always plant certified seed of resistant varieties (e.g. RWR series from RAB)', 'Intercrop with maize to confuse aphids', 'Spray neem or soapy water on aphid colonies'],
      rw: ['Teraho imbuto zemewe zihangana (nka RWR za RAB)', 'Tera hamwe n\'ibigori kugira ngo aphids zitabone aho zija', 'Tera amazi arimo isabune cyangwa neemu ku dukoko']
    },
    prevention: {
      en: ['Never save seed from infected fields', 'Monitor fields weekly for aphids'],
      rw: ['Ntukagire imbuto uzigama uva mu mirima yanduye', 'Genzura umurima buri cyumweru urebe aphids']
    },
    colorSig: { yellow: 0.6, green: 0.65, brown: 0.2, black: 0.1, pale: 0.55 }
  },
  {
    id: 'bean-anthracnose', crop: 'bean', severity: 'high',
    name: { en: 'Bean Anthracnose', rw: 'Anthracnose y\'Ibishyimbo' },
    sci: 'Colletotrichum lindemuthianum',
    symptoms: {
      en: ['Dark sunken lesions on stems and leaf veins', 'Brown-black spots on pods with pink/grey centres', 'Infected seeds show brown sunken spots', 'Seedlings collapse ("damping off")'],
      rw: ['Ibice by\'umukara byinjiye mu mubiri w\'ibiti no ku mitsi y\'amababi', 'Utudomo tw\'ikijuju-umukara ku bifuka dufite hagati h\'iroza/ikirungu', 'Imbuto zanduye zigaragaza utudomo tw\'ikijuju', 'Ibimera bito birarwa bikagwa']
    },
    cause: {
      en: 'Fungus spread by rain splash and infected seed; cool wet weather favours it (highland bean zones of Rwanda).',
      rw: 'Fungus ikwirakwira n\'imvura n\'imbuto zanduye; ikundwa n\'ubukonje n\'ubuhehere (mu turere tw\'imisozi duhinga ibishyimbo).'
    },
    treatment: {
      en: ['Spray mancozeb + carbendazim or thiophanate-methyl at flowering and pod formation', 'Treat seed before planting with fungicide seed dressing'],
      rw: ['Tera mancozeb + carbendazim cyangwa thiophanate-methyl mu gihe cy\'indabyo n\'ibifuka', 'Vura imbuto mbere yo gutera ukoresheje imiti y\'imbuto']
    },
    organic: {
      en: ['Use only certified seed from clean fields', 'Rotate 2-3 years with non-host crops', 'Plant in wide rows for airflow; avoid touching wet plants'],
      rw: ['Koresha imbuto zemewe ziva mu mirima isukuye', 'Simbuza imyaka 2-3 n\'imyaka itandukanye', 'Tera mu mirongo minini kugira ngo umuyaga uhite; wirinde gukora ku bimera bitose']
    },
    prevention: {
      en: ['Seed treatment is the most effective control', 'Remove volunteer bean plants'],
      rw: ['Kuvura imbuto ni bwo buryo bwiza kurusha ubundi', 'Kuraho ibimera by\'ibishyimbo byera ubwabyo']
    },
    colorSig: { yellow: 0.25, green: 0.4, brown: 0.7, black: 0.55, pale: 0.25 }
  },
  {
    id: 'bean-rust', crop: 'bean', severity: 'low',
    name: { en: 'Bean Rust', rw: 'Ingese y\'Ibishyimbo' },
    sci: 'Uromyces appendiculatus',
    symptoms: {
      en: ['Small raised rusty-brown pustules mostly on leaf undersides', 'Pustules leave rust-coloured dust on fingers', 'Heavily infected leaves yellow and drop', 'Pods can also be infected'],
      rw: ['Utubyimba duto tw\'ikijuju-umuhondo cyane cyane munsi y\'amababi', 'Utubyimba dusiga umuhondo w\'ingese ku ntoki', 'Amababi yanduye cyane ahinduka umuhondo akagwa', 'Ibifuka nabyo bishobora kwandura']
    },
    cause: {
      en: 'Fungus favoured by moderate temperatures (17-27°C) and dew; wind-borne spores.',
      rw: 'Fungus ikundwa n\'ubushyuhe buringaniye (17-27°C) n\'ikime; spores zikwirakwira n\'umuyaga.'
    },
    treatment: {
      en: ['Spray tebuconazole, difenoconazole or mancozeb at first pustules', 'Repeat after 10-14 days'],
      rw: ['Tera tebuconazole, difenoconazole cyangwa mancozeb ku tubyimba twa mbere', 'Subiramo nyuma y\'iminsi 10-14']
    },
    organic: {
      en: ['Plant resistant varieties', 'Remove infected debris after harvest', 'Avoid late planting in rust-prone areas'],
      rw: ['Tera imbuto zihangana', 'Kuraho ibisigazwa byanduye nyuma y\'isarura', 'Wirinde gutera bitinze mu turere dukunze ingese']
    },
    prevention: {
      en: ['Crop rotation with cereals', 'Monitor weekly from flowering'],
      rw: ['Gusimburanya imyaka n\'ibinyampeke', 'Genzura buri cyumweru guhera mu ndabyo']
    },
    colorSig: { yellow: 0.5, green: 0.45, brown: 0.85, black: 0.1, pale: 0.3 }
  },

  // ============ CASSAVA ============
  {
    id: 'cassava-mosaic', crop: 'cassava', severity: 'high',
    name: { en: 'Cassava Mosaic Disease (CMD)', rw: 'Uburwayi bw\'Imyumbati (CMD)' },
    sci: 'Cassava mosaic geminiviruses',
    symptoms: {
      en: ['Mottled light and dark green mosaic on young leaves', 'Leaflets twisted, narrowed and deformed', 'Stunted plant with short stems', 'Root yield drastically reduced'],
      rw: ['Amababi mato afite ibara ry\'icyatsi kibisi n\'icyijimye bivanze (mosaic)', 'Amababi apfunitse, afunganye kandi adasanzwe', 'Ikimera cyagwingiye gifite amashami magufi', 'Umusaruro w\'imizi uragabanuka cyane']
    },
    cause: {
      en: 'Virus spread by whiteflies and by planting infected cuttings — the biggest cassava problem in Rwanda.',
      rw: 'Virus ikwirakwizwa n\'udusimba tw\'umweru (whiteflies) no gutera ibiti byanduye — ni yo ndwara ikomeye ku myumbati mu Rwanda.'
    },
    treatment: {
      en: ['No cure — uproot and destroy infected plants', 'Replant with clean certified cuttings of tolerant varieties'],
      rw: ['Nta muti uvura — kuraho ibimera byanduye ubitwike', 'Subiramo utere ibiti bisukuye by\'imbuto zihanganira indwara']
    },
    organic: {
      en: ['Use resistant/tolerant varieties from RAB (e.g. NAROCAS series)', 'Select cuttings only from healthy plants', 'Control whiteflies naturally with reflective mulches'],
      rw: ['Koresha imbuto zihangana za RAB (nka NAROCAS)', 'Hitamo ibiti gusa ku bimera bizima', 'Rwanya whiteflies n\'uburyo bwa mulch yaka']
    },
    prevention: {
      en: ['Never exchange cuttings with neighbours without inspection', 'Rogue infected plants monthly'],
      rw: ['Ntukajye gusangira ibiti n\'abaturanyi utabanje kubigenzura', 'Kuraho ibimera byanduye buri kwezi']
    },
    colorSig: { yellow: 0.65, green: 0.7, brown: 0.15, black: 0.05, pale: 0.6 }
  },
  {
    id: 'cassava-brown-streak', crop: 'cassava', severity: 'high',
    name: { en: 'Cassava Brown Streak Disease (CBSD)', rw: 'Indwara y\'Imirongo y\'Ikijuju ku Myumbati (CBSD)' },
    sci: 'Cassava brown streak virus',
    symptoms: {
      en: ['Brown necrotic streaks along leaf veins', 'Yellow-brown patches on leaves, leaf distortion', 'Dark brown corky streaks inside the root (visible when cut)', 'Roots may look normal outside but rotten inside'],
      rw: ['Imirongo y\'ikijuju ku mitsi y\'amababi', 'Ibice by\'umuhondo-ikijuju ku mababi, amababi apfunitse', 'Imirongo y\'ikijuju cyane imbere mu mizi (igaragara iyo uciye)', 'Imizi ishobora kugaragara nziza inyuma ariko yangiritse imbere']
    },
    cause: {
      en: 'Virus spread by whiteflies and infected cuttings; often hidden until harvest.',
      rw: 'Virus ikwirakwizwa na whiteflies n\'ibiti byanduye; akenshi ntibigaragara kugeza igihe cy\'isarura.'
    },
    treatment: {
      en: ['No cure — destroy infected plants and roots', 'Cut open roots before selling to check for streaks'],
      rw: ['Nta muti uvura — kuraho ibimera n\'imizi byanduye', 'Ca imizi mbere yo kuyigurisha kugira ngo urebe imirongo']
    },
    organic: {
      en: ['Plant CBSD-tolerant varieties', 'Use certified clean planting material', 'Rotate fields and fallow land'],
      rw: ['Tera imbuto zihanganira CBSD', 'Koresha ibiti by\'urubyaro bisukuye byemewe', 'Simbuza imirima kandi ureke ubutaka buruhuke']
    },
    prevention: {
      en: ['Inspect planting material carefully', 'Report suspicious fields to agronomists'],
      rw: ['Genzura ibiti by\'urubyaro witonze', 'Menyesha abahinzi b\'umwuga ku mirima idasanzwe']
    },
    colorSig: { yellow: 0.6, green: 0.45, brown: 0.85, black: 0.25, pale: 0.4 }
  },

  // ============ POTATO ============
  {
    id: 'potato-late-blight', crop: 'potato', severity: 'high',
    name: { en: 'Potato Late Blight', rw: 'Ikiyongoyongo cy\'Ibirayi (Late Blight)' },
    sci: 'Phytophthora infestans',
    symptoms: {
      en: ['Water-soaked dark spots on leaf tips and edges', 'White fuzzy mould ring around spots in the morning', 'Spots enlarge to brown-black necrotic areas', 'Tubers develop reddish-brown dry rot; strong smell in wet fields'],
      rw: ['Utudomo tw\'amazi y\'umukara ku mpera z\'amababi', 'Ubwoko bw\'ifu y\'umweru bukikije utudomo mu gitondo', 'Utudomo tukaguka duhinduka ibice by\'ikijuju-umukara', 'Imbuto z\'ibirayi zigira uburwayi bw\'ikijuju-umutuku; impumuro ikomeye mu mirima itose']
    },
    cause: {
      en: 'Water mould exploding in cool wet weather (10-24°C with rain) — Rwanda\'s most destructive potato disease, especially in Musanze, Burera, Nyabihu, Rubavu.',
      rw: 'Fungus ikura vuba mu bukonje n\'imvura (10-24°C) — ni yo ndwara yangiza ibirayi kurusha izindi mu Rwanda, cyane cyane i Musanze, Burera, Nyabihu na Rubavu.'
    },
    treatment: {
      en: ['At first sign spray protectant mancozeb, then switch to curative metalaxyl + mancozeb or cymoxanil every 5-7 days', 'In wet weather spray every 5 days without fail', 'Earth up soil around stems to protect tubers', 'Destroy infected haulms 2 weeks before harvest'],
      rw: ['Ku kimenyetso cya mbere tera mancozeb, hanyuma uhindure ukoresha metalaxyl + mancozeb cyangwa cymoxanil buri minsi 5-7', 'Mu bihe by\'imvura tera buri minsi 5 nta gusiba', 'Shyira ubutaka ku biti kugira ngo urinde imizi', 'Kuraho ibiti byanduye ibyumweru 2 mbere y\'isarura']
    },
    organic: {
      en: ['Plant certified disease-free seed tubers', 'Wide spacing and ridges for drainage', 'Copper-based sprays (Bordeaux mixture) as protectant', 'Remove volunteer potatoes and nightshade weeds'],
      rw: ['Tera imbuto z\'ibirayi zemewe zitanduye', 'Terana intera nini n\'imirongo myiza kugira ngo amazi ayunguruke', 'Koresha imiti y\'umuringa (Bordeaux mixture) nko kurinda', 'Kuraho ibirayi byera ubwabyo n\'ibyatsi bibi by\'umuryango wa nightshade']
    },
    prevention: {
      en: ['Scout daily in rainy season — blight can destroy a field in 7 days', 'Avoid overhead irrigation late in the day', 'Harvest in dry weather; sort tubers before storage'],
      rw: ['Genzura buri munsi mu gihe cy\'imvura — ikiyongoyongo gishobora kwangiza umurima mu minsi 7', 'Wirinde kuhira hejuru y\'ibimera nimugoroba', 'Sarura mu bihe by\'izuba; tondeka imbuto mbere yo kuzibika']
    },
    colorSig: { yellow: 0.4, green: 0.4, brown: 0.7, black: 0.6, pale: 0.3 }
  },
  {
    id: 'potato-early-blight', crop: 'potato', severity: 'medium',
    name: { en: 'Potato Early Blight', rw: 'Ikiyongoyongo cy\'Igitangira (Early Blight)' },
    sci: 'Alternaria solani',
    symptoms: {
      en: ['Dark brown spots with concentric rings ("target board" pattern)', 'Spots mainly on older/lower leaves', 'Yellow halo around spots; leaves drop early', 'Dark sunken lesions on tubers'],
      rw: ['Utudomo tw\'ikijuju dufite impeta zikurikirana ("target board")', 'Utudomo cyane cyane ku mababi ashaje/yo hasi', 'Uruziga rw\'umuhondo rukikije utudomo; amababi agwa hakiri kare', 'Ibice by\'ikijuju byinjiye mu mizi']
    },
    cause: {
      en: 'Fungus attacking stressed or nutrient-deficient plants in warm humid weather.',
      rw: 'Fungus yibasira ibimera binaniwe cyangwa bidafite ifumbire ihagije mu bihe by\'ubushyuhe n\'ubuhehere.'
    },
    treatment: {
      en: ['Spray mancozeb, chlorothalonil or azoxystrobin every 7-10 days', 'Boost plant nutrition with balanced NPK and foliar feeds'],
      rw: ['Tera mancozeb, chlorothalonil cyangwa azoxystrobin buri minsi 7-10', 'Ongerera ibimera ifumbire ya NPK n\'imiti yo ku mababi']
    },
    organic: {
      en: ['Rotate 2+ years with non-solanaceous crops', 'Maintain steady watering and fertility', 'Mulch to prevent soil splash onto leaves'],
      rw: ['Simbuza imyaka 2+ n\'imyaka itari mu muryango wa nightshade', 'Gumana kuhira n\'ifumbire biringaniye', 'Twikiriza ubutaka kugira ngo wirinde ko amazi y\'ubutaka ajya ku mababi']
    },
    prevention: {
      en: ['Use certified seed', 'Avoid working plants when wet'],
      rw: ['Koresha imbuto zemewe', 'Wirinde gukora ku bimera bitose']
    },
    colorSig: { yellow: 0.45, green: 0.4, brown: 0.8, black: 0.3, pale: 0.3 }
  },
  {
    id: 'potato-bacterial-wilt', crop: 'potato', severity: 'high',
    name: { en: 'Bacterial Wilt', rw: 'Kurwara kwa Bacterie ku BIRAYI' },
    sci: 'Ralstonia solanacearum',
    symptoms: {
      en: ['Sudden wilting of the whole plant while leaves stay green', 'Cut stem in water releases milky-white bacterial stream', 'Brown rot inside tubers with foul smell', 'Wilting starts on one branch then spreads'],
      rw: ['Ikimera cyose kirarwara gitunguranye mu gihe amababi aguma ari icyatsi', 'Iyo uciye igiti ukagishyira mu mazi asohora umukondo w\'umweru (bacterie)', 'Uburwayi bw\'ikijuju imbere mu mbuto bufite impumuro mbi', 'Kurwara bitangirira ku ishami rimwe hanyuma bikwirakwira']
    },
    cause: {
      en: 'Soil-borne bacterium; infects through wounds at warm temperatures (>25°C). Also affects tomato, pepper, eggplant and banana.',
      rw: 'Bacterie ibaho mu butaka; yinjira mu bisago mu bushyuhe burenze 25°C. Yanangiza inyanya, urusenda, intoryi n\'ibitoki.'
    },
    treatment: {
      en: ['No chemical cure — remove and burn infected plants with the soil ball around them', 'Do not compost infected material', 'Disinfect tools with bleach'],
      rw: ['Nta muti uvura — kuraho ibimera byanduye ubitwikane n\'ubutaka bubikikije', 'Ntukabikorereho ifumbire', 'Sukura ibikoresho na javel']
    },
    organic: {
      en: ['Use certified wilt-free seed tubers — the ONLY reliable control', 'Rotate 3-4 years with cereals or legumes', 'Solarise seedbed soil with clear plastic', 'Improve drainage; avoid working wet soil'],
      rw: ['Koresha imbuto zemewe zitanduye — ni bwo buryo BWIZWE gusa', 'Simbuza imyaka 3-4 n\'ibinyampeke cyangwa ibinyamisogwe', 'Shyira izuba ku butaka bw\'ububiko bwa plastiki', 'Tezamura kuyungurura amazi; wirinde gukora ku butaka butose']
    },
    prevention: {
      en: ['Never cut seed tubers with infected knives', 'Control root-knot nematodes which create entry wounds'],
      rw: ['Ntukagire icyo uca imbuto z\'ibirayi n\'icyuma cyanduye', 'Rwanya inyamaswa nto zo mu butaka (nematodes) zitera ibisago']
    },
    colorSig: { yellow: 0.4, green: 0.65, brown: 0.3, black: 0.1, pale: 0.35 }
  },

  // ============ TOMATO ============
  {
    id: 'tomato-late-blight', crop: 'tomato', severity: 'high',
    name: { en: 'Tomato Late Blight', rw: 'Ikiyongoyongo ku Nyanya' },
    sci: 'Phytophthora infestans',
    symptoms: {
      en: ['Large irregular grey-green to dark brown leaf patches', 'White mould under leaves in humid mornings', 'Firm brown lesions on green fruits', 'Rapid collapse of the whole plant in wet weather'],
      rw: ['Ibice binini by\'ikigina-icyatsi ku mababi bihinduka ikijuju', 'Ifu y\'umweru munsi y\'amababi mu gitondo gitose', 'Ibice by\'ikijuju bikomeye ku mbuto z\'icyatsi', 'Ikimera cyose kigwa vuba mu bihe by\'imvura']
    },
    cause: {
      en: 'Same pathogen as potato late blight — spreads between the two crops. Cool wet nights are critical.',
      rw: 'Ni fungus imwe n\'iy\'ikiyongoyongo cy\'ibirayi — ikwirakwira hagati y\'iyo myaka yombi. Ijoro rikonje n\'ubuhehere ni byo bibi.'
    },
    treatment: {
      en: ['Spray mancozeb protectively; at infection use metalaxyl-M + mancozeb or fluopicolide every 7 days', 'Remove and destroy infected fruits and leaves', 'Stake plants and prune lower leaves for airflow'],
      rw: ['Tera mancozeb nk\'ubwirinzi; iyo indwara igeze koresha metalaxyl-M + mancozeb cyangwa fluopicolide buri minsi 7', 'Kuraho imbuto n\'amababi byanduye ubitwike', 'Shyira ibiti ku nkingi ukatere amababi yo hasi kugira ngo umuyaga uhite']
    },
    organic: {
      en: ['Bordeaux mixture weekly as protectant', 'Grow under rain-shelter tunnels where possible', 'Never plant tomato next to potato', 'Widen spacing to 60 x 60 cm'],
      rw: ['Bordeaux mixture buri cyumweru nk\'ubwirinzi', 'Hinga munsi y\'inzu z\'ibiti (tunnels) bishoboka', 'Ntukagire icyo utera inyanya iruhande rw\'ibirayi', 'Terana intera ya cm 60 x 60']
    },
    prevention: {
      en: ['Use resistant hybrids', 'Drip irrigation instead of overhead', 'Monitor daily in rainy season'],
      rw: ['Koresha imbuto z\'uruhererekane zihangana', 'Kuhira ku mizi aho guterera hejuru', 'Genzura buri munsi mu gihe cy\'imvura']
    },
    colorSig: { yellow: 0.4, green: 0.4, brown: 0.7, black: 0.5, pale: 0.3 }
  },
  {
    id: 'tomato-early-blight', crop: 'tomato', severity: 'medium',
    name: { en: 'Tomato Early Blight', rw: 'Ikiyongoyongo cy\'Igitangira ku Nyanya' },
    sci: 'Alternaria solani',
    symptoms: {
      en: ['Target-like concentric ring spots on lower leaves', 'Yellow halos; leaves wither and hang down', 'Sunken dark lesions on stems and fruit near the calyx', 'Progressive defoliation from bottom up'],
      rw: ['Utudomo tw\'impeta nk\'"target" ku mababi yo hasi', 'Inziga z\'umuhondo; amababi ararwa akamanuka', 'Ibice by\'ikijuju byinjiye ku biti no ku mbuto hafi y\'igitereko', 'Amababi agenda agwa ahereye hasi']
    },
    cause: { en: 'Fungus in soil residues; splashes onto lower leaves with rain or irrigation.', rw: 'Fungus ibaho mu bisigazwa by\'ubutaka; ijya ku mababi yo hasi n\'imvura cyangwa kuhira.' },
    treatment: {
      en: ['Spray chlorothalonil or mancozeb every 7-10 days from flowering', 'Remove lowest infected leaves'],
      rw: ['Tera chlorothalonil cyangwa mancozeb buri minsi 7-10 guhera mu ndabyo', 'Kuraho amababi yo hasi yanduye']
    },
    organic: {
      en: ['Mulch heavily to stop soil splash', 'Rotate 2 years away from potato/pepper/eggplant', 'Prune for airflow and stake all plants'],
      rw: ['Twikiriza ubutaka cyane kugira ngo wirinde amazi y\'ubutaka', 'Simbuza imyaka 2 kure y\'ibirayi/urusenda/intoryi', 'Katere ibiti bishyire ku nkingi kugira ngo umuyaga uhite']
    },
    prevention: { en: ['Drip irrigation', 'Balanced fertilisation — avoid nitrogen excess'], rw: ['Kuhira ku mizi', 'Ifumbire iringaniye — wirinde azote nyinshi'] },
    colorSig: { yellow: 0.45, green: 0.4, brown: 0.8, black: 0.3, pale: 0.3 }
  },
  {
    id: 'tomato-tylcv', crop: 'tomato', severity: 'high',
    name: { en: 'Tomato Yellow Leaf Curl Virus (TYLCV)', rw: 'Virus Ihindura Amababi y\'Inyanya Umuhondo (TYLCV)' },
    sci: 'Tomato yellow leaf curl virus',
    symptoms: {
      en: ['Leaflets curl upward and inward, cup-shaped', 'Bright yellow leaf margins and veins', 'Severe stunting; flowers drop, few or no fruits', 'Plants infected early remain tiny "bushy dwarfs"'],
      rw: ['Amababi yikunze hejuru n\'imbere, ameze nk\'igikombe', 'Inkombo n\'imitsi y\'amababi birabengerana umuhondo', 'Ikimera kiragwingira; indabyo ziragwa, imbuto nkeya cyangwa nta zo', 'Ibimera byanduye bikiri bito biguma ari bito cyane']
    },
    cause: {
      en: 'Spread by the tobacco whitefly (Bemisia tabaci) — one whitefly is enough to infect a plant.',
      rw: 'Ikwirakwizwa n\'udusimba tw\'umweru (Bemisia tabaci) — akamwe gusa gashobora kwanduza ikimera.'
    },
    treatment: {
      en: ['No cure — uproot and bag infected plants immediately', 'Control whiteflies: spray abamectin, imidacloprid (soil drench) or acetamiprid weekly', 'Yellow sticky traps (10-15 per 100 m²)'],
      rw: ['Nta muti uvura — kuraho ibimera byanduye ubishyire mu mufoka ako kanya', 'Rwanya whiteflies: tera abamectin, imidacloprid cyangwa acetamiprid buri cyumweru', 'Imitego y\'umuhondo ifata (10-15 kuri m² 100)']
    },
    organic: {
      en: ['Nursery under insect-proof net (40 mesh) — the single most effective measure', 'Neem oil or soapy water sprays on whiteflies', 'Reflective silver mulch repels whiteflies', 'Intercrop with onion/garlic'],
      rw: ['Urugero rw\'ibiti munsi y\'umuyoboro udasohora udukoko (mesh 40) — ni bwo buryo bwiza kurusha ubundi', 'Tera amavuta ya neemu cyangwa amazi arimo isabune kuri whiteflies', 'Mulch ya argent yaka isohora whiteflies', 'Tera hamwe n\'ibitunguru/cyongwa']
    },
    prevention: {
      en: ['Use resistant hybrids (TYLCV-tolerant)', 'Remove weed hosts (black nightshade)', 'Do not plant new seedlings next to old infested fields'],
      rw: ['Koresha imbuto zihangana na TYLCV', 'Kuraho ibyatsi bibi bicumbikira udukoko', 'Ntukagire icyo utera ibiti bishya iruhande rw\'imirima ishaje yanduye']
    },
    colorSig: { yellow: 0.85, green: 0.55, brown: 0.1, black: 0.05, pale: 0.6 }
  },
  {
    id: 'tomato-fusarium-wilt', crop: 'tomato', severity: 'high',
    name: { en: 'Tomato Fusarium Wilt', rw: 'Kurwara kwa Fusarium ku Nyanya' },
    sci: 'Fusarium oxysporum f. sp. lycopersici',
    symptoms: {
      en: ['Yellowing and wilting of leaves on ONE side of the plant or one branch', 'Wilting progresses upward from older leaves', 'Cut stem shows brown vascular ring', 'Plant collapses despite moist soil'],
      rw: ['Amababi ahinduka umuhondo kandi ararwa ku RUHANDE RUMWE rw\'ikimera cyangwa ishami rimwe', 'Kurwara bizamuka ahereye ku mababi ashaje', 'Iyo uciye igiti ubona uruziga rw\'ikijuju', 'Ikimera kigwa nubwo ubutaka butose']
    },
    cause: {
      en: 'Soil fungus entering through roots; favoured by warm soil (>25°C). Survives many years in soil.',
      rw: 'Fungus y\'ubutaka yinjira mu mizi; ikundwa n\'ubushyuhe bw\'ubutaka burenze 25°C. Ibaho imyaka myinshi mu butaka.'
    },
    treatment: {
      en: ['No field cure — remove and burn infected plants', 'Soil drench with Trichoderma-based biofungicide for healthy neighbours', 'In greenhouses, steam or solarise soil'],
      rw: ['Nta muti uvura mu murima — kuraho ibimera byanduye ubitwike', 'Shyira ku butaka biofungicide ya Trichoderma ku bimera bizima bikikije', 'Mu nzu z\'ibiti, shyira umuriro cyangwa izuba ku butaka']
    },
    organic: {
      en: ['Grow resistant hybrids (VFN labelled)', 'Apply Trichoderma/compost teas to boost beneficial fungi', 'Graft onto resistant rootstocks', 'Raise soil pH with lime (fungus hates pH > 6.5)'],
      rw: ['Tera imbuto zihangana (zanditseho VFN)', 'Koresha Trichoderma/ifumbire y\'ibimera kugira ngo wongere fungus nziza', 'Shyira ibiti ku mizi ihangana (grafting)', 'Zamura pH y\'ubutaka n\'ishwagara (fungus ntiyikunda pH > 6.5)']
    },
    prevention: {
      en: ['Never reuse contaminated trays/soil for seedlings', 'Rotate 3-4 years with non-solanaceous crops'],
      rw: ['Ntukajye ukoresha tray/ubutaka byanduye ku biti', 'Simbuza imyaka 3-4 n\'imyaka itari mu muryango wa nightshade']
    },
    colorSig: { yellow: 0.7, green: 0.5, brown: 0.4, black: 0.15, pale: 0.5 }
  },

  // ============ RICE ============
  {
    id: 'rice-blast', crop: 'rice', severity: 'high',
    name: { en: 'Rice Blast', rw: 'Ryavunika ry\'Umuceri (Rice Blast)' },
    sci: 'Magnaporthe oryzae',
    symptoms: {
      en: ['Diamond/eye-shaped lesions with grey centres and brown margins', 'Lesions on leaves, nodes and the neck (neck blast)', 'Neck blast: panicle turns white and breaks — empty grains', 'Seedlings can die in patches ("nursery blast")'],
      rw: ['Ibice bimeze nk\'ijisho bifite hagati h\'ikirungu n\'inkengero z\'ikijuju', 'Ibice ku mababi, ku ngingo no ku ijosi (neck blast)', 'Neck blast: umuvumbu uhinduka umweru ukavunika — imbuto zirimo ubusa', 'Ibimera bito bishobora gupfira rimwe mu bice']
    },
    cause: {
      en: 'Fungus favoured by cool nights, drought stress and excess nitrogen — major problem in Bugarama and marshland rice schemes.',
      rw: 'Fungus ikundwa n\'amajoro akonje, amapfa n\'azote nyinshi — ikibazo gikomeye i Bugarama no mu mirima y\'umuceri y\'ibishanga.'
    },
    treatment: {
      en: ['Spray tricyclazole or azoxystrobin at booting and heading stages', 'Stop nitrogen top-dressing at first sign', 'Maintain standing water in paddies'],
      rw: ['Tera tricyclazole cyangwa azoxystrobin mu gihe cy\'ibitoki n\'imbuto', 'Reka gushyiramo azote ku kimenyetso cya mbere', 'Gumana amazi mu mirima y\'umuceri']
    },
    organic: {
      en: ['Plant resistant varieties (RAB recommends for your zone)', 'Split nitrogen into 3 applications instead of one', 'Silicon-rich amendments (rice husk ash) strengthen cell walls'],
      rw: ['Tera imbuto zihangana (RAB ikwereka izo mu karere kawe)', 'Gabanya azote mu bice 3 aho kuyishyira rimwe', 'Shyiramo ivu ry\'ibisigazwa by\'umuceri (silicon) kugira ngo ibimera bikomere']
    },
    prevention: {
      en: ['Use certified seed', 'Avoid dense planting', 'Scout weekly at booting stage'],
      rw: ['Koresha imbuto zemewe', 'Wirinde gutera byegeranye cyane', 'Genzura buri cyumweru mu gihe cy\'ibitoki']
    },
    colorSig: { yellow: 0.4, green: 0.4, brown: 0.65, black: 0.2, pale: 0.5 }
  },
  {
    id: 'rice-bacterial-leaf-blight', crop: 'rice', severity: 'medium',
    name: { en: 'Bacterial Leaf Blight', rw: 'Ikirungu cya Bacterie ku Muceri' },
    sci: 'Xanthomonas oryzae pv. oryzae',
    symptoms: {
      en: ['Water-soaked streaks that turn yellow-white, starting at leaf tips', 'Leaf edges dry and the whole leaf can turn straw-coloured', 'Milky bacterial ooze from cut leaves in the morning', 'Worst on heavily nitrogen-fertilised fields'],
      rw: ['Imirongo y\'amazi ihinduka umuhondo-umweru, itangirira ku mpera z\'amababi', 'Inkombo z\'amababi ziruma ibabi ryose rishobora guhinduka nk\'ibyatsi byumye', 'Amazi y\'umweru (bacterie) asohoka mu mababi aciye mu gitondo', 'Bikomeye ku mirima ifite azote nyinshi']
    },
    cause: { en: 'Bacterium entering through leaf wounds in warm humid weather; spread by water and wind-driven rain.', rw: 'Bacterie yinjira mu bisago by\'amababi mu bihe by\'ubushyuhe n\'ubuhehere; ikwirakwira n\'amazi n\'imvura.' },
    treatment: {
      en: ['Drain the field for 2-3 days', 'Spray copper-based bactericides (copper oxychloride) early', 'Stop all nitrogen application'],
      rw: ['Kuramo amazi mu murima iminsi 2-3', 'Tera imiti ya bacterie y\'umuringa (copper oxychloride) hakiri kare', 'Reka gushyiramo azote yose']
    },
    organic: {
      en: ['Plant resistant varieties', 'Balanced nutrition — use compost, not just urea', 'Avoid clipping seedling tips at transplanting'],
      rw: ['Tera imbuto zihangana', 'Ifumbire iringaniye — koresha ifumbire y\'ibimera, si urea gusa', 'Wirinde gukata impera z\'ibiti igihe ubitera']
    },
    prevention: { en: ['Use certified seed', 'Field sanitation — remove weed hosts'], rw: ['Koresha imbuto zemewe', 'Isuku y\'umurima — kuraho ibyatsi bibi'] },
    colorSig: { yellow: 0.75, green: 0.35, brown: 0.25, black: 0.05, pale: 0.7 }
  },

  // ============ COFFEE ============
  {
    id: 'coffee-leaf-rust', crop: 'coffee', severity: 'high',
    name: { en: 'Coffee Leaf Rust', rw: 'Ingese ku Mabi y\'Ikawa' },
    sci: 'Hemileia vastatrix',
    symptoms: {
      en: ['Bright orange-yellow powdery spots on leaf undersides', 'Upper leaf surface shows pale yellow blotches', 'Heavy leaf fall; branches die back ("light branches")', 'Yield drops dramatically the following season'],
      rw: ['Utudomo tw\'umuhondo-orange tw\'ifu munsi y\'amababi', 'Hejuru y\'ibabi hagaragaza ibice by\'umuhondo', 'Amababi menshi aragwa; amashami arapfa ("amashami yoroshye")', 'Umusaruro uragabanuka cyane mu mwaka ukurikira']
    },
    cause: {
      en: 'Fungus spread by wind and rain; thrives in shade coffee with poor nutrition — widespread in Rwanda\'s coffee belt.',
      rw: 'Fungus ikwirakwira n\'umuyaga n\'imvura; ikundwa n\'ikawa ifite igicucu n\'ifumbire nke — ikwirakwiye mu karere k\'ikawa mu Rwanda.'
    },
    treatment: {
      en: ['Spray copper oxychloride or Bordeaux mixture after harvest (main spray)', 'During rainy season spray every 6-8 weeks', 'Prune out dead wood and apply mancozeb to wounds'],
      rw: ['Tera copper oxychloride cyangwa Bordeaux nyuma y\'isarura (umuti w\'ingenzi)', 'Mu gihe cy\'imvura tera buri byumweru 6-8', 'Katere amashami yapfuye ushyire mancozeb ku bisago']
    },
    organic: {
      en: ['Apply compost and mulch to boost tree vigour', 'Regulate shade trees to 30-40% cover', 'Plant rust-tolerant varieties (e.g. resistant Arabica lines)'],
      rw: ['Shyiramo ifumbire y\'ibimera na mulch kugira ngo ibiti bikomere', 'Gumana igicucu cya 30-40%', 'Tera imbuto zihanganira ingese']
    },
    prevention: {
      en: ['Annual pruning after harvest', 'Balanced NPK + potassium fertilisation', 'Keep fields weed-free to improve airflow'],
      rw: ['Gukatere buri mwaka nyuma y\'isarura', 'Ifumbire ya NPK + potasi iringaniye', 'Gumana imirima isukuye kugira ngo umuyaga uhite']
    },
    colorSig: { yellow: 0.7, green: 0.4, brown: 0.5, black: 0.1, pale: 0.4 }
  },
  {
    id: 'coffee-berry-disease', crop: 'coffee', severity: 'medium',
    name: { en: 'Coffee Berry Disease', rw: 'Indwara y\'Urutoki rw\'Ikawa' },
    sci: 'Colletotrichum kahawae',
    symptoms: {
      en: ['Dark sunken lesions on green berries', 'Berries mummify, turn black and remain hanging', 'Active on young berries from flowering to pinhead stage', 'Up to 50% yield loss in wet seasons'],
      rw: ['Ibice by\'ikijuju byinjiye ku rutoki rw\'icyatsi', 'Urutoki ruruma, rugahinduka umukara rukaguma ku giti', 'Bikora ku rutoki ruto guhera mu ndabyo', 'Gutakaza kugeza 50% by\'umusaruro mu bihe by\'imvura']
    },
    cause: { en: 'Fungus favoured by wet humid weather during berry expansion.', rw: 'Fungus ikundwa n\'ubuhehere mu gihe urutoki rukura.' },
    treatment: {
      en: ['Spray copper oxychloride + mancozeb from pinhead stage every 2-3 weeks', 'Remove and destroy mummified berries'],
      rw: ['Tera copper oxychloride + mancozeb guhera ku rutoki ruto buri byumweru 2-3', 'Kuraho urutoki rwumye urutwike']
    },
    organic: {
      en: ['Prune for airflow and light penetration', 'Collect all fallen and mummified berries', 'Reduce shade density in wet zones'],
      rw: ['Katere kugira ngo umuyaga n\'urumuri bihite', 'Kusanya urutoki rwose rwaguye n\'urwumye', 'Gabanya igicucu mu turere tw\'ubuhehere']
    },
    prevention: { en: ['Timely spraying before rains', 'Balanced tree nutrition'], rw: ['Guterera imiti mbere y\'imvura', 'Ifumbire iringaniye ku biti'] },
    colorSig: { yellow: 0.3, green: 0.5, brown: 0.5, black: 0.7, pale: 0.2 }
  },

  // ============ TEA ============
  {
    id: 'tea-blight', crop: 'tea', severity: 'medium',
    name: { en: 'Tea Blight', rw: 'Indwara y\'Ibyayi' },
    sci: 'Pestalotiopsis sp.',
    symptoms: {
      en: ['Brown lesions on young shoots and maintenance leaves', 'Lesions start at leaf margins and spread inward', 'Grey centres with tiny black fruiting bodies', 'Die-back of plucking shoots'],
      rw: ['Ibice by\'ikijuju ku mashami mato n\'amababi', 'Ibice bitangirira ku nkombo z\'amababi bikwirakwira imbere', 'Hagati h\'ikirungu dufite utudomo tw\'umukara', 'Amashami arapfa ahereye ku mpera']
    },
    cause: { en: 'Fungus attacking stressed tea (drought, poor nutrition, heavy plucking); worse in dry-wet alternations.', rw: 'Fungus yibasira icyayi kigoranye (amapfa, ifumbire nke, isarura rikabije); bikomeye mu bihe bihindagurika.' },
    treatment: {
      en: ['Spray copper oxychloride at 2-week intervals on affected fields', 'Pause plucking to let the bush recover'],
      rw: ['Tera copper oxychloride buri byumweru 2 ku mirima yanduye', 'Hagarika isarura gato kugira ngo igiti gisubirane']
    },
    organic: {
      en: ['Apply mulch and compost to reduce stress', 'Shade young tea during establishment', 'Avoid over-plucking in dry spells'],
      rw: ['Shyiramo mulch n\'ifumbire y\'ibimera kugira ngo ugabanye umuvuduko', 'Shyira igicucu ku cyayi gito', 'Wirinde isarura rikabije mu bihe by\'amapfa']
    },
    prevention: { en: ['Regular weeding and fertilisation', 'Drain waterlogged fields'], rw: ['Gukuraho ibyatsi no gufumbira buri gihe', 'Kuramo amazi mu mirima yatose cyane'] },
    colorSig: { yellow: 0.35, green: 0.5, brown: 0.75, black: 0.2, pale: 0.3 }
  },
  {
    id: 'sweetpotato-virus', crop: 'sweetpotato', severity: 'medium',
    name: { en: 'Sweet Potato Virus Disease', rw: 'Indwara ya Virus ku Bijumba' },
    sci: 'Sweet potato feathery chlorotic virus complex',
    symptoms: {
      en: ['Yellow-purple feathery patterns along the veins', 'Leaf chlorosis and purpling of margins', 'Stunted vines with small leaves', 'Roots small, cracked and poorly formed'],
      rw: ['Imirongo y\'umuhondo-purple ku mitsi y\'amababi', 'Amababi ahinduka umuhondo n\'inkengero zihinduka purple', 'Ibiti bigwingiye bifite amababi mato', 'Imizi mito, icitse kandi idatunganye']
    },
    cause: { en: 'Complex of viruses spread by aphids and whiteflies, and through infected vines used as planting material.', rw: 'Virus nyinshi zikwirakwizwa na aphids na whiteflies, no gukoresha ibiti byanduye.' },
    treatment: {
      en: ['No cure — rogue infected plants', 'Replace with clean vines from multiplication gardens'],
      rw: ['Nta muti uvura — kuraho ibimera byanduye', 'Simbuza n\'ibiti bisukuye biva mu mirima y\'ibiti by\'urubyaro']
    },
    organic: {
      en: ['Use virus-tested vines from RAB multipliers', 'Rotate with legumes or cereals', 'Control aphids with neem or soapy water'],
      rw: ['Koresha ibiti byagenzuwe biva ku barwanyi ba RAB', 'Simbuza n\'ibinyamisogwe cyangwa ibinyampeke', 'Rwanya aphids na neemu cyangwa amazi arimo isabune']
    },
    prevention: { en: ['Never save vines from visibly infected fields', 'Plant early in the season'], rw: ['Ntukajye uzigama ibiti biva mu mirima yanduye', 'Tera kare mu mwaka'] },
    colorSig: { yellow: 0.65, green: 0.55, brown: 0.15, black: 0.05, pale: 0.5 }
  },
  {
    id: 'groundnut-rosette', crop: 'groundnut', severity: 'high',
    name: { en: 'Groundnut Rosette Disease', rw: 'Indwara ya Rosette ku Bunyobwa' },
    sci: 'Groundnut rosette virus',
    symptoms: {
      en: ['Small pale-yellow leaves clustered at the stem tip ("rosette")', 'Severe stunting; plants look bushy and dwarfed', 'Few or no pods formed', 'Early infection = total loss'],
      rw: ['Amababi mato y\'umuhondo yikubiye ku mutwe w\'igiti ("rosette")', 'Ikimera cyagwingiye cyane; kigaragara nk\'igiti gito', 'Ibifuka bike cyangwa nta byo', 'Iyo byanduye hakiri kare = gutakaza byose']
    },
    cause: {
      en: 'Virus spread by aphids (Aphis craccivora) feeding on infected plants; drought-stressed crops are worst hit.',
      rw: 'Virus ikwirakwizwa na aphids ziri ku bimera byanduye; ibimera bigoranye n\'amapfa birangirika cyane.'
    },
    treatment: {
      en: ['No cure — rogue and destroy infected plants early', 'Spray aphids with imidacloprid or acetamiprid immediately'],
      rw: ['Nta muti uvura — kuraho ibimera byanduye hakiri kare', 'Tera imiti ya aphids (imidacloprid cyangwa acetamiprid) ako kanya']
    },
    organic: {
      en: ['Plant EARLY with the first rains — escape aphid peak', 'Dense planting (25 x 10 cm) closes canopy fast, blocking aphids', 'Use resistant/tolerant local varieties', 'Rotate with maize or beans'],
      rw: ['Tera KARE n\'imvura ya mbere — wirinde igihe cya aphids', 'Gutera byegeranye (cm 25 x 10) bifunga ibimera vuba, bikabuza aphids', 'Koresha imbuto zihangana zo mu gihugu', 'Simbuza n\'ibigori cyangwa ibishyimbo']
    },
    prevention: { en: ['Early planting is the #1 control', 'Keep fields weed-free', 'Do not plant near old infected groundnut fields'], rw: ['Gutera kare ni bwo buryo bwa mbere', 'Gumana umurima usukuye', 'Ntukagire icyo utera hafi y\'imirima ishaje yanduye'] },
    colorSig: { yellow: 0.8, green: 0.5, brown: 0.1, black: 0.05, pale: 0.65 }
  },
  {
    id: 'sorghum-anthracnose', crop: 'sorghum', severity: 'medium',
    name: { en: 'Sorghum Anthracnose / Grain Mould', rw: 'Anthracnose ku Masaka' },
    sci: 'Colletotrichum graminicola',
    symptoms: {
      en: ['Small reddish-brown spots on leaves with straw-coloured centres', 'Dark lesions on panicles and glumes', 'Grains discoloured, chalky or mouldy', 'Worst in warm humid weather at grain filling'],
      rw: ['Utudomo duto tw\'ikijuju-umutuku ku mababi dufite hagati h\'umuhondo', 'Ibice by\'umukara ku mivumbu', 'Imbuto zihindura ibara, zikoroha cyangwa zirabora', 'Bikomeye mu bihe by\'ubushyuhe n\'ubuhehere mu gihe cy\'imbuto']
    },
    cause: { en: 'Fungus surviving in crop residues; rain-splashed spores infect leaves and grains.', rw: 'Fungus ibaho mu bisigazwa; spores zikwirakwira n\'imvura.' },
    treatment: {
      en: ['Spray mancozeb or carbendazim at booting and grain filling', 'Harvest promptly at maturity to avoid mould'],
      rw: ['Tera mancozeb cyangwa carbendazim mu gihe cy\'ibitoki n\'imbuto', 'Sarura vuba igihe cy\'isarura kugira ngo wirinde kubora']
    },
    organic: {
      en: ['Rotate with legumes', 'Plough in residues deeply', 'Plant early-maturing varieties'],
      rw: ['Simbuza n\'ibinyamisogwe', 'Hinga burundu ibisigazwa', 'Tera imbuto z\'imbuto ziva vuba']
    },
    prevention: { en: ['Use clean seed', 'Avoid continuous sorghum cropping'], rw: ['Koresha imbuto zisukuye', 'Wirinde guhinga amasaka ku murima umwe imyaka ikurikirana'] },
    colorSig: { yellow: 0.4, green: 0.4, brown: 0.8, black: 0.25, pale: 0.4 }
  }
]

AS.diseaseById = id => AS.DISEASES.find(d => d.id === id)
AS.diseasesByCrop = crop => AS.DISEASES.filter(d => d.crop === crop)
