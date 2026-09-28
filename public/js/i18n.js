// UI translations: Kinyarwanda (rw) + English (en)
window.AS = window.AS || {}
AS.T = {
  appName: { en: 'AgroSmart Rwanda', rw: 'AgroSmart Rwanda' },
  tagline: { en: 'AI farming assistant for Rwandan farmers', rw: 'Umujyanama w\'ubuhinzi ukoresheje AI ku bahinzi b\'u Rwanda' },

  // nav
  nav_home: { en: 'Home', rw: 'Ahabanza' },
  nav_learn: { en: 'Learn', rw: 'Kwiga' },
  nav_scan: { en: 'Scan', rw: 'Gusuzuma' },
  nav_library: { en: 'Diseases', rw: 'Indwara' },
  nav_more: { en: 'More', rw: 'Ibindi' },

  // onboarding
  onb_welcome: { en: 'Welcome, Farmer!', rw: 'Ikaze, Muhinzi!' },
  onb_choose_lang: { en: 'Choose your language / Hitamo ururimi', rw: 'Hitamo ururimi / Choose your language' },
  onb_f1_t: { en: 'AI Disease Detection', rw: 'AI Ibona Indwara z\'Ibihingwa' },
  onb_f1_d: { en: 'Take a photo or short video of a sick crop — AI identifies the disease and the medicine to treat it.', rw: 'Fata ifoto cyangwa video ngufi y\'igihingwa kirwaye — AI imenya indwara n\'umuti wo kuyivura.' },
  onb_f2_t: { en: 'Rwanda-Focused Knowledge', rw: 'Ubumenyi Bwihariye ku Rwanda' },
  onb_f2_d: { en: 'Crops, diseases and treatments specific to Rwanda: maize, banana, beans, cassava, potato, tomato, rice, coffee, tea…', rw: 'Ibihingwa, indwara n\'imiti byihariye ku Rwanda: ibigori, ibitoki, ibishyimbo, imyumbati, ibirayi, inyanya, umuceri, ikawa, icyayi…' },
  onb_f3_t: { en: 'Learn Agriculture', rw: 'Kwiga Ubuhinzi' },
  onb_f3_d: { en: 'Lessons on planting, fertilizers, harvesting, storage, pest control and farming as a business.', rw: 'Amasomo yo gutera, ifumbire, gusarura, kubika, kurwanya udukoko n\'ubuhinzi nk\'ubucuruzi.' },
  onb_start: { en: 'Start Farming Smart', rw: 'Tangira Guhinga Neza' },

  // home
  home_greeting: { en: 'Hello, {name}!', rw: 'Muraho neza {name}!' },
  home_greeting_generic: { en: 'Hello!', rw: 'Muraho neza!' },
  your_name: { en: 'Your name', rw: 'Amazina yawe' },
  settings_name_desc: { en: 'Used to greet you on the home screen', rw: 'Akoreshwa mu kuramutsa ku ahabanza' },
  home_scan_title: { en: 'Is your crop sick?', rw: 'Igihingwa cyawe kirarwaye?' },
  home_scan_desc: { en: 'Upload a photo or video — AI diagnoses it in seconds and tells you the treatment.', rw: 'Shyiramo ifoto cyangwa video — AI iyisuzuma mu masegonda ikakubwira umuti.' },
  home_scan_btn: { en: 'Scan now', rw: 'Suzuma noneho' },
  home_features: { en: 'What can I do?', rw: 'Nabigenza nte?' },
  home_feature_learn: { en: 'Learn', rw: 'Kwiga' },
  home_feature_learn_d: { en: 'Farming lessons', rw: 'Amasomo y\'ubuhinzi' },
  home_feature_crops: { en: 'Crops', rw: 'Ibihingwa' },
  home_feature_crops_d: { en: 'Growing guides', rw: 'Amabwiriza yo guhinga' },
  home_feature_fert: { en: 'Fertilizers', rw: 'Ifumbire' },
  home_feature_fert_d: { en: 'How & how much', rw: 'Uburyo n\'ingano' },
  home_feature_diseases: { en: 'Diseases', rw: 'Indwara' },
  home_feature_diseases_d: { en: 'Full library', rw: 'Urutonde rwose' },
  home_tip: { en: 'Tip of the day', rw: 'Inama y\'uyu munsi' },
  home_history: { en: 'Recent scans', rw: 'Ibisuzumwe vuba' },
  home_no_history: { en: 'No scans yet — your diagnoses will appear here.', rw: 'Nta bisuzumwe biragiye — ibisubizo byawe bizagaragara hano.' },
  home_offline: { en: 'Works offline once loaded', rw: 'Ikora nta internet nyuma yo kuyitangiza' },

  // scan
  scan_title: { en: 'AI Crop Doctor', rw: 'Muganga w\'Ibihingwa (AI)' },
  scan_step1: { en: '1. Add a photo or short video of the sick plant', rw: '1. Shyiramo ifoto cyangwa video ngufi y\'igihingwa kirwaye' },
  scan_step1_hint: { en: 'Tap to choose from gallery or take a picture. Get close to the affected leaf — good light, one leaf fills the frame.', rw: 'Kanda uhitemo mu bubiko cyangwa ufate ifoto. Egere ibabi rirwaye — urumuri rwiza, ibabi rimwe ryuzuze ifoto.' },
  scan_photo: { en: 'Photo', rw: 'Ifoto' },
  scan_video: { en: 'Short video', rw: 'Video ngufi' },
  scan_step2: { en: '2. Which crop is this?', rw: '2. Ni ikihe gihingwa?' },
  scan_step2_hint: { en: 'Telling AI the crop makes the diagnosis much more accurate.', rw: 'Kubwira AI igihingwa bituma igisubizo kiba cyiza cyane.' },
  scan_start: { en: 'Analyze with AI', rw: 'Suzuma na AI' },
  scan_analyzing: { en: 'AI is analyzing…', rw: 'AI irasuzuma…' },
  scan_steps_analyzing: {
    en: ['Reading image…', 'Detecting leaf color patterns…', 'Matching against Rwanda disease database…', 'Preparing diagnosis & treatment…'],
    rw: ['Gusoma ishusho…', 'Kubona amabara y\'amababi…', 'Kugereranya n\'urutonde rw\'indwara zo mu Rwanda…', 'Gutegura igisubizo n\'umuti…']
  },
  scan_error_type: { en: 'Please choose an image (JPG/PNG) or a short video file.', rw: 'Hitamo ifoto (JPG/PNG) cyangwa video ngufi.' },
  scan_error_crop: { en: 'Please select which crop this is first.', rw: 'Banze uhitemo igihingwa.' },

  // result
  result_diagnosis: { en: 'Diagnosis', rw: 'Igisubizo' },
  result_confidence: { en: 'AI confidence', rw: 'Ukwizera kwa AI' },
  result_severity: { en: 'Severity', rw: 'Uburemere' },
  result_symptoms: { en: 'Symptoms', rw: 'Ibimenyetso' },
  result_cause: { en: 'Cause & spread', rw: 'Impamvu n\'ikwirakwira' },
  result_treatment: { en: 'Treatment (medicine)', rw: 'Umuti (imiti)' },
  result_organic: { en: 'Organic options', rw: 'Uburyo kamere' },
  result_prevention: { en: 'Prevention', rw: 'Kwirinda' },
  result_healthy: { en: 'No disease detected', rw: 'Nta ndwara yabonetse' },
  result_healthy_desc: {
    en: 'This plant looks healthy. Keep scouting weekly and maintain good fertilisation and weeding.',
    rw: 'Iki gihingwa kigaragara ari mazima. Komeza kugenzura buri cyumweru, ufumbire neza kandi ukureho ibyatsi.'
  },
  result_other_possibilities: { en: 'Other possibilities', rw: 'Ibindi bishoboka' },
  result_scan_again: { en: 'Scan another plant', rw: 'Suzuma ikindi gihingwa' },
  result_view_details: { en: 'View full disease guide', rw: 'Reba amabwiriza yose y\'indwara' },
  result_disclaimer: {
    en: 'AI results are guidance only. For serious outbreaks, contact your sector agronomist or RAB office. Notifiable diseases (e.g. Maize Lethal Necrosis, BXW) must be reported.',
    rw: 'Ibisubizo bya AI ni ubuyobozi gusa. Ku byorezo bikomeye, hamagara agronome w\'umurenge cyangwa ibiro bya RAB. Indwara zigomba kumenyekeshwa (nka MLN, Kirabiranya) zigomba gutangwa amakuru.'
  },
  sev_high: { en: 'High — act now', rw: 'Bikomeye — kora vuba' },
  sev_medium: { en: 'Medium', rw: 'Biringaniye' },
  sev_low: { en: 'Low', rw: 'Byoroshye' },

  // learn
  learn_title: { en: 'Learn Agriculture', rw: 'Kwiga Ubuhinzi' },
  learn_sub: { en: 'Practical lessons for Rwandan farms', rw: 'Amasomo y\'ingiro ku mirima yo mu Rwanda' },
  learn_minutes: { en: 'min read', rw: 'iminoti yo gusoma' },

  // crops
  crops_title: { en: 'Crop Growing Guides', rw: 'Amabwiriza yo Guhinga' },
  crops_sub: { en: 'Planting → fertilizing → harvesting, for Rwanda\'s crops', rw: 'Gutera → gufumbira → gusarura, ku bihingwa by\'u Rwanda' },
  crop_season: { en: 'Seasons & calendar', rw: 'Ibihembwe n\'ngengabihe' },
  crop_planting: { en: 'Planting', rw: 'Gutera' },
  crop_fertilizing: { en: 'Fertilizing', rw: 'Gufumbira' },
  crop_harvesting: { en: 'Harvesting & storage', rw: 'Gusarura no kubika' },
  crop_tips: { en: 'Pro tips', rw: 'Inama z\'inzobere' },
  crop_regions: { en: 'Main growing areas', rw: 'Uturere duhinga cyane' },

  // fertilizer
  fert_title: { en: 'Fertilizer Guide', rw: 'Amabwiriza y\'Ifumbire' },
  fert_sub: { en: 'What to use, how much, when', rw: 'Icyo ukoresha, ingano, igihe' },
  fert_uses: { en: 'What it does', rw: 'Akamaro kayo' },
  fert_dosage: { en: 'Dosage & application', rw: 'Ingano n\'imikoreshereze' },
  fert_cautions: { en: 'Safety & cautions', rw: 'Umutekano n\'ubwirinzi' },
  fert_soil_tips: { en: 'Rwanda soil & conservation tips', rw: 'Inama z\'ubutaka bw\'u Rwanda no kuburinda' },

  // library
  library_title: { en: 'Disease Library', rw: 'Urutonde rw\'Indwara' },
  library_sub: { en: 'Tap any disease for symptoms and treatment', rw: 'Kanda ku ndwara ubone ibimenyetso n\'umuti' },
  library_search: { en: 'Search disease or crop…', rw: 'Shakisha indwara cyangwa igihingwa…' },
  library_all: { en: 'All', rw: 'Byose' },
  library_empty: { en: 'No disease found for that search.', rw: 'Nta ndwara yabonetse kuri ubwo bushakashatsi.' },

  // settings / more
  settings_title: { en: 'Settings & More', rw: 'Amagenamiterere n\'Ibindi' },
  settings_install: { en: 'Install app on phone', rw: 'Shyira porogaramu kuri telefone' },
  settings_install_desc: { en: 'Use AgroSmart offline, like a real app', rw: 'Koresha AgroSmart nta internet, nka porogaramu nyayo' },
  settings_installed: { en: 'App is installed', rw: 'Porogaramu yashyizwemo' },
  install_help_t: { en: 'How to install', rw: 'Uko wayishyira kuri telefone' },
  install_help_android: { en: 'Android (Chrome): tap the menu ⋮, then "Add to Home Screen" or "Install app".', rw: 'Android (Chrome): kanda ⋮, hanyuma uhitemo "Add to Home Screen" cyangwa "Install app".' },
  install_help_ios: { en: 'iPhone (Safari): tap the Share button, then "Add to Home Screen".', rw: 'iPhone (Safari): kanda Share, hanyuma uhitemo "Add to Home Screen".' },
  install_help_note: { en: 'The one-tap install prompt only appears on HTTPS or localhost. Otherwise use the browser menu steps above.', rw: 'Buto yikora igaragara gusa kuri HTTPS cyangwa localhost. Nibitaba ibyo, koresha intambwe za menu ya browser zavuzwe hejuru.' },
  login_sub: { en: 'Enter your details to continue', rw: 'Andika amakuru yawe kugira ngo ukomeze' },
  login_id: { en: 'User ID', rw: 'ID y\'umukoresha' },
  login_phone: { en: 'Mobile phone', rw: 'Telefoni igendanwa' },
  login_btn: { en: 'Log in', rw: 'Injira' },
  login_err_id: { en: 'Please enter your user ID', rw: 'Andika ID y\'umukoresha' },
  login_err_phone: { en: 'Enter a valid phone, e.g. 0788 123 456', rw: 'Andika telefoni nyayo, urugero: 0788 123 456' },
  auth_tab_login: { en: 'Log in', rw: 'Kwinjira' },
  auth_tab_signup: { en: 'Sign up', rw: 'Kwiyandikisha' },
  auth_signup_sub: { en: 'Create your farmer account with ID and mobile number', rw: 'Fungura konti yawe y\'umuhinzi ukoresheje ID na telefoni' },
  auth_signup_btn: { en: 'Create account', rw: 'Fungura konti' },
  auth_hint_login: { en: 'New here? Switch to Sign up above.', rw: 'Urashya hano? Hindukira kuri Kwiyandikisha hejuru.' },
  auth_hint_signup: { en: 'Already registered? Switch to Log in above.', rw: 'Wariyandikishije? Hindukira kuri Kwinjira hejuru.' },
  auth_err_notfound: { en: 'Account not found. Check your details or sign up.', rw: 'Konti ntabwo ibonetse. Reba amakuru cyangwa wiyandikishe.' },
  auth_err_exists: { en: 'This ID is already registered. Use Log in.', rw: 'Iyi ID yamaze kwiyandikisha. Koresha Kwinjira.' },
  settings_account: { en: 'Account', rw: 'Konti' },
  settings_logout: { en: 'Log out', rw: 'Sohoka' },
  credits: { en: 'Icons: icons8.com · Crop photos: AgroSmart studio', rw: 'Udushushanyo: icons8.com · Amafoto y\'ibihingwa: AgroSmart studio' },
  settings_about: { en: 'About', rw: 'Ibyerekeye' },
  settings_about_text: {
    en: 'AgroSmart Rwanda helps farmers diagnose crop diseases with AI and learn modern farming — built for Rwanda\'s crops, seasons and soils. Information follows RAB (Rwanda Agriculture Board) recommendations. Always consult your sector agronomist for serious outbreaks.',
    rw: 'AgroSmart Rwanda ifasha abahinzi kumenya indwara z\'ibihingwa na AI no kwiga ubuhinzi bugezweho — yakozwe ku bihingwa, ibihembwe n\'ubutaka by\'u Rwanda. Amakuru akurikiza inama za RAB. Buri gihe ganira na agronome w\'umurenge ku byorezo bikomeye.'
  },
  settings_reset: { en: 'Reset app (clear scan history)', rw: 'Gusubiramo porogaramu (gusiba ibisuzumwe)' },
  settings_version: { en: 'Version 1.0.0', rw: 'Verisiyo 1.0.0' },

  back: { en: '← Back', rw: '← Inyuma' },
  close: { en: 'Close', rw: 'Funga' },
  remove: { en: 'Remove', rw: 'Kuraho' }
}

AS.makeT = function (lang) {
  return key => (AS.T[key] ? (AS.T[key][lang] || AS.T[key].en) : key)
}
