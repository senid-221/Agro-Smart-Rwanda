// AgroSmart Rwanda — storefront catalog (prices in RWF, indicative agro-dealer prices)
AS.PRODUCT_CATEGORIES = [
  { id: 'seeds',     emoji: '🌱', en: 'Seeds', rw: 'Imbuto' },
  { id: 'fert',      emoji: '🧪', en: 'Fertilizers', rw: 'Ifumbire' },
  { id: 'protect',   emoji: '🛡️', en: 'Crop protection', rw: 'Imiti y\'ibihingwa' },
  { id: 'tools',     emoji: '🛠️', en: 'Hand tools', rw: 'Ibikoresho by\'ubuhinzi' },
  { id: 'water',     emoji: '💧', en: 'Irrigation & covers', rw: 'Ivomerera n\'ibipfutiro' },
  { id: 'post',      emoji: '📦', en: 'Storage & processing', rw: 'Kubika no gutunganya' },
  { id: 'live',      emoji: '🐄', en: 'Livestock & poultry', rw: 'Amatungo n\'inkoko' },
  { id: 'bee',       emoji: '🐝', en: 'Beekeeping', rw: 'Ubworozi bw\'inzuki' },
  { id: 'vet',       emoji: '💊', en: 'Veterinary', rw: 'Imiti y\'amatungo' },
  { id: 'gear',      emoji: '🦺', en: 'Protective gear', rw: 'Imyambaro y\'umutekano' },
  { id: 'tech',      emoji: '☀️', en: 'Solar & tech', rw: 'Solar n\'ikoranabuhanga' }
]

const U = (en, rw) => ({ en, rw })
const KG = U('kg', 'kg')
const BAG50 = U('50kg bag', 'umufuka wa 50kg')
const PC = U('piece', 'igikoresho 1')
const L = U('1L', 'litiro 1')

AS.PRODUCTS = [
  // ---- seeds ----
  { id: 'seed-maize',  cat: 'seeds', emoji: '🌽', en: 'Maize seeds', rw: 'Imbuto z\'ibigori', price: 3500, unit: KG },
  { id: 'seed-bean',   cat: 'seeds', emoji: '🫘', en: 'Bean seeds', rw: 'Imbuto z\'ibishyimbo', price: 3000, unit: KG },
  { id: 'seed-rice',   cat: 'seeds', emoji: '🌾', en: 'Rice seeds', rw: 'Imbuto z\'umuceri', price: 2800, unit: KG },
  { id: 'seed-potato', cat: 'seeds', emoji: '🥔', en: 'Potato seeds', rw: 'Imbuto z\'ibirayi', price: 600, unit: KG },
  { id: 'seed-veg',    cat: 'seeds', emoji: '🥬', en: 'Vegetable seeds', rw: 'Imbuto z\'imboga', price: 5000, unit: U('100g pack', 'agapaki ka 100g') },
  // ---- fertilizers ----
  { id: 'fert-general', cat: 'fert', emoji: '🧪', en: 'Fertilizer (compound)', rw: 'Ifumbire rusange', price: 25000, unit: U('25kg bag', 'umufuka wa 25kg') },
  { id: 'fert-npk',     cat: 'fert', emoji: '🧪', en: 'NPK fertilizer', rw: 'Ifumbire ya NPK', price: 38000, unit: BAG50 },
  { id: 'fert-urea',    cat: 'fert', emoji: '🧪', en: 'Urea', rw: 'Ifumbire ya Urea', price: 40000, unit: BAG50 },
  { id: 'fert-dap',     cat: 'fert', emoji: '🧪', en: 'DAP', rw: 'Ifumbire ya DAP', price: 42000, unit: BAG50 },
  { id: 'fert-manure',  cat: 'fert', emoji: '🟤', en: 'Organic manure', rw: 'Mborera (ifumbire y\'amatungo)', price: 2000, unit: BAG50 },
  { id: 'fert-compost', cat: 'fert', emoji: '🍂', en: 'Compost', rw: 'Komiposite', price: 1500, unit: BAG50 },
  { id: 'fert-lime',    cat: 'fert', emoji: '⚪', en: 'Lime', rw: 'Lime', price: 1200, unit: BAG50 },
  // ---- crop protection ----
  { id: 'prot-pest',   cat: 'protect', emoji: '☠️', en: 'Pesticides', rw: 'Imiti y\'ibyonnyi', price: 15000, unit: L },
  { id: 'prot-insect', cat: 'protect', emoji: '🐛', en: 'Insecticides', rw: 'Imiti y\'udukoko twangiza', price: 12000, unit: L },
  { id: 'prot-fung',   cat: 'protect', emoji: '🍄', en: 'Fungicides', rw: 'Imiti y\'ubuhumyi', price: 14000, unit: L },
  { id: 'prot-herb',   cat: 'protect', emoji: '🌿', en: 'Herbicides', rw: 'Imiti y\'ibyatsi bibi', price: 11000, unit: L },
  { id: 'prot-bio',    cat: 'protect', emoji: '🐞', en: 'Bio-pesticides', rw: 'Imiti kamere y\'ibyonnyi', price: 9000, unit: L },
  { id: 'prot-seedt',  cat: 'protect', emoji: '🌱', en: 'Seed treatment', rw: 'Imiti yo gutegura imbuto', price: 8000, unit: U('500ml', '500ml') },
  { id: 'prot-knap',   cat: 'protect', emoji: '🎒', en: 'Knapsack sprayers', rw: 'Imyuhagirizo y\'umugongo', price: 35000, unit: PC },
  { id: 'prot-motor',  cat: 'protect', emoji: '💨', en: 'Motorized sprayers', rw: 'Imyuhagirizo y\'imashini', price: 180000, unit: PC },
  // ---- hand tools ----
  { id: 'tool-hoe',     cat: 'tools', emoji: '⛏️', en: 'Hoes', rw: 'Amasuka', price: 5000, unit: PC },
  { id: 'tool-machete', cat: 'tools', emoji: '🔪', en: 'Machetes', rw: 'Amahoro', price: 4000, unit: PC },
  { id: 'tool-shovel',  cat: 'tools', emoji: '🪣', en: 'Shovels', rw: 'Amapiki', price: 8000, unit: PC },
  { id: 'tool-rake',    cat: 'tools', en: 'Rakes', rw: 'Amareki', price: 6000, unit: PC },
  { id: 'tool-fork',    cat: 'tools', en: 'Forks', rw: 'Amasumu', price: 7000, unit: PC },
  { id: 'tool-sickle',  cat: 'tools', en: 'Sickles', rw: 'Amahoro mato', price: 3500, unit: PC },
  { id: 'tool-shears',  cat: 'tools', emoji: '✂️', en: 'Pruning shears', rw: 'Amakasi y\'amashami', price: 12000, unit: PC },
  { id: 'tool-wheel',   cat: 'tools', emoji: '🛒', en: 'Wheelbarrows', rw: 'Amagare y\'imizigo', price: 45000, unit: PC },
  // ---- irrigation & covers ----
  { id: 'water-can',   cat: 'water', emoji: '💧', en: 'Watering cans', rw: 'Amajerekani yo kuvomerera', price: 6000, unit: PC },
  { id: 'water-pump',  cat: 'water', emoji: '⚙️', en: 'Irrigation pumps', rw: 'Pompi zo kuvomerera', price: 250000, unit: PC },
  { id: 'water-tank',  cat: 'water', emoji: '🛢️', en: 'Water tanks', rw: 'Ibigega by\'amazi', price: 120000, unit: U('1000L', '1000L') },
  { id: 'water-pipe',  cat: 'water', en: 'Irrigation pipes', rw: 'Amatiyo yo kuvomerera', price: 1500, unit: U('meter', 'metero 1') },
  { id: 'water-hose',  cat: 'water', emoji: '💦', en: 'Water hoses', rw: 'Amatiyo y\'amazi', price: 2000, unit: U('meter', 'metero 1') },
  { id: 'water-drip',  cat: 'water', emoji: '💧', en: 'Drip irrigation kits', rw: 'Sisitemu yo kuvomerera bitonka', price: 150000, unit: U('kit', 'seti 1') },
  { id: 'water-green', cat: 'water', emoji: '🏡', en: 'Greenhouse covers', rw: 'Ibipfutiro bya serre', price: 350000, unit: U('roll', 'izingiro 1') },
  { id: 'water-shade', cat: 'water', emoji: '🕸️', en: 'Shade nets', rw: 'Ibitambaro by\'igicucu', price: 25000, unit: U('roll', 'izingiro 1') },
  { id: 'water-mulch', cat: 'water', en: 'Mulching sheets', rw: 'Ibitambaro byo gupfundikira', price: 18000, unit: U('roll', 'izingiro 1') },
  { id: 'water-tarp',  cat: 'water', emoji: '⛺', en: 'Tarpaulins', rw: 'Amabasha', price: 20000, unit: PC },
  // ---- storage & processing ----
  { id: 'post-bag',    cat: 'post', en: 'Grain storage bags', rw: 'Imifuka yo kubikamo umusaruro', price: 1500, unit: PC },
  { id: 'post-herm',   cat: 'post', emoji: '🔒', en: 'Hermetic bags', rw: 'Imifuka idahumeka (hermetic)', price: 3500, unit: PC },
  { id: 'post-silo',   cat: 'post', en: 'Grain silos', rw: 'Silo z\'umusaruro', price: 250000, unit: PC },
  { id: 'post-basket', cat: 'post', emoji: '🧺', en: 'Harvest baskets', rw: 'Amaseke yo gusaruramo', price: 8000, unit: PC },
  { id: 'post-crate',  cat: 'post', emoji: '📦', en: 'Plastic crates', rw: 'Amasanduku ya pulasitiki', price: 10000, unit: PC },
  { id: 'post-moist',  cat: 'post', emoji: '💦', en: 'Grain moisture meters', rw: 'Imashini ipima ubuhehere bw\'umusaruro', price: 85000, unit: PC },
  { id: 'post-scale',  cat: 'post', emoji: '⚖️', en: 'Weighing scales', rw: 'Imizani', price: 35000, unit: PC },
  { id: 'post-sheller', cat: 'post', emoji: '⚙️', en: 'Maize shellers', rw: 'Imashini zihingura ibigori', price: 120000, unit: PC },
  { id: 'post-mill',   cat: 'post', emoji: '🏭', en: 'Grain mills', rw: 'Imashini zisya umusaruro', price: 350000, unit: PC },
  // ---- livestock & poultry ----
  { id: 'live-cattle',  cat: 'live', emoji: '🐄', en: 'Cattle feed', rw: 'Ibiryo by\'inka', price: 12000, unit: BAG50 },
  { id: 'live-chicken', cat: 'live', emoji: '🐔', en: 'Chicken feed', rw: 'Ibiryo by\'inkoko', price: 14000, unit: BAG50 },
  { id: 'live-pig',     cat: 'live', emoji: '🐖', en: 'Pig feed', rw: 'Ibiryo by\'ingurube', price: 15000, unit: BAG50 },
  { id: 'live-goat',    cat: 'live', emoji: '🐐', en: 'Goat feed', rw: 'Ibiryo by\'ihene', price: 13000, unit: BAG50 },
  { id: 'live-mineral', cat: 'live', emoji: '🧂', en: 'Mineral blocks', rw: 'Amabuye y\'umunyu (mineral)', price: 3000, unit: PC },
  { id: 'live-feeder',  cat: 'live', emoji: '🥣', en: 'Animal feeders', rw: 'Ibyo kugabuririramo', price: 5000, unit: PC },
  { id: 'live-drinker', cat: 'live', emoji: '🥤', en: 'Animal drinkers', rw: 'Ibyo kunywesheramo', price: 4500, unit: PC },
  { id: 'live-trough',  cat: 'live', en: 'Water troughs', rw: 'Amavomo y\'amatungo', price: 15000, unit: PC },
  { id: 'live-cage',    cat: 'live', emoji: '🐔', en: 'Poultry cages', rw: 'Amazu y\'inkoko (cages)', price: 60000, unit: PC },
  { id: 'live-incub',   cat: 'live', emoji: '🥚', en: 'Chicken incubators', rw: 'Imashini zumutsa imishwi', price: 180000, unit: PC },
  { id: 'live-milk',    cat: 'live', emoji: '🥛', en: 'Milking machines', rw: 'Imashini zikama', price: 450000, unit: PC },
  // ---- beekeeping ----
  { id: 'bee-hive',  cat: 'bee', emoji: '🐝', en: 'Beehives', rw: 'Amasaro y\'inzuki', price: 25000, unit: PC },
  { id: 'bee-suit',  cat: 'bee', emoji: '🧥', en: 'Beekeeping suits', rw: 'Imyenda y\'ubworozi bw\'inzuki', price: 35000, unit: PC },
  { id: 'bee-ext',   cat: 'bee', emoji: '🍯', en: 'Honey extractors', rw: 'Imashini zikamura ubuki', price: 120000, unit: PC },
  // ---- veterinary ----
  { id: 'vet-med',  cat: 'vet', emoji: '💊', en: 'Veterinary medicines', rw: 'Imiti y\'amatungo', price: 8000, unit: U('dose pack', 'agapaki k\'umuti') },
  { id: 'vet-vac',  cat: 'vet', emoji: '💉', en: 'Animal vaccines', rw: 'Inkingo z\'amatungo', price: 5000, unit: U('dose', 'doze 1') },
  { id: 'vet-supp', cat: 'vet', emoji: '💊', en: 'Feed supplements', rw: 'Ibinyongera by\'ibiryo', price: 6000, unit: U('1kg', 'kg 1') },
  // ---- protective gear ----
  { id: 'gear-boots',   cat: 'gear', emoji: '👢', en: 'Gumboots', rw: 'Gumboots (amaboti y\'imvura)', price: 12000, unit: U('pair', 'ipari') },
  { id: 'gear-gloves',  cat: 'gear', emoji: '🧤', en: 'Work gloves', rw: 'Gants zo gukorera', price: 3000, unit: U('pair', 'ipari') },
  { id: 'gear-rain',    cat: 'gear', emoji: '☔', en: 'Raincoats', rw: 'Imyenda y\'imvura', price: 15000, unit: PC },
  { id: 'gear-overall', cat: 'gear', emoji: '🦺', en: 'Overalls', rw: 'Imyenda y\'akazi (overalls)', price: 18000, unit: PC },
  { id: 'gear-mask',    cat: 'gear', emoji: '😷', en: 'Protective masks', rw: 'Udupfukamunwa', price: 2500, unit: PC },
  { id: 'gear-goggles', cat: 'gear', emoji: '🥽', en: 'Safety goggles', rw: 'Indorerwamo z\'umutekano', price: 4000, unit: PC },
  // ---- solar & tech ----
  { id: 'tech-pump',  cat: 'tech', emoji: '☀️', en: 'Solar water pumps', rw: 'Pompi z\'amazi zikoresha izuba', price: 650000, unit: PC },
  { id: 'tech-light', cat: 'tech', emoji: '🔆', en: 'Solar lights', rw: 'Amatara y\'izuba', price: 15000, unit: PC },
  { id: 'tech-soil',  cat: 'tech', emoji: '🧪', en: 'Soil testing kits', rw: 'Seti zo gupima ubutaka', price: 45000, unit: U('kit', 'seti 1') },
  { id: 'tech-therm', cat: 'tech', emoji: '🌡️', en: 'Farm thermometers', rw: 'Termometero z\'ubuhinzi', price: 12000, unit: PC },
  { id: 'tech-dscale', cat: 'tech', emoji: '⚖️', en: 'Digital weighing scales', rw: 'Imizani ya digital', price: 55000, unit: PC }
]
