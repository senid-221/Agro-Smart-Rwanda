// AgroSmart Rwanda — customization layer.
// Admin-managed overrides for the catalog, site theme, AI Kinyarwanda training
// and the AI provider. Everything persists on-device via AS.db / localStorage so
// the app still runs from file:// with no server.
window.AS = window.AS || {}

AS.CUSTOM = (function () {
  // ---------- catalog resolution (custom over built-in) ----------
  const normUnit = u => (u && typeof u === 'object') ? { en: u.en || '', rw: u.rw || '' } : { en: 'piece', rw: 'igikoresho 1' }
  function normProduct(p) {
    return {
      id: p.id, cat: p.cat || 'seeds', en: p.en || p.id, rw: p.rw || p.en || p.id,
      price: Number(p.price) || 0, unit: normUnit(p.unit),
      emoji: p.emoji || '', img: p.img || '', hidden: !!p.hidden
    }
  }
  const CATALOG = {
    products() {
      const custom = AS.db.all('products')
      const byId = {}; custom.forEach(c => { byId[c.id] = c })
      const baseIds = new Set(AS.PRODUCTS.map(p => p.id))
      const merged = AS.PRODUCTS.map(p => {
        const c = byId[p.id]
        if (!c) return p
        if (c.hidden) return null
        return Object.assign({}, p, c, { unit: c.unit ? normUnit(c.unit) : p.unit })
      }).filter(Boolean)
      const added = custom.filter(c => !baseIds.has(c.id) && !c.hidden).map(normProduct)
      return merged.concat(added)
    },
    product(id) { return CATALOG.products().find(p => p.id === id) || null },
    categories() {
      const custom = AS.db.all('categories')
      const byId = {}; custom.forEach(c => { byId[c.id] = c })
      const baseIds = new Set(AS.PRODUCT_CATEGORIES.map(c => c.id))
      const merged = AS.PRODUCT_CATEGORIES.map(c => {
        const o = byId[c.id]
        if (!o) return c
        if (o.hidden) return null
        return Object.assign({}, c, o)
      }).filter(Boolean)
      const added = custom.filter(c => !baseIds.has(c.id) && !c.hidden)
        .map(c => ({ id: c.id, emoji: c.emoji || '🧺', en: c.en || c.id, rw: c.rw || c.en || c.id }))
      return merged.concat(added)
    }
  }

  // ---------- site theme ----------
  const DEFAULT_THEME = {
    id: 'site', titleEn: '', titleRw: '', subEn: '', subRw: '',
    font: '', accent: '', icon: '', logo: ''
  }
  if (!AS.db.find('theme', 'site')) AS.db.insert('theme', { ...DEFAULT_THEME })
  const THEME = {
    get() { return Object.assign({}, DEFAULT_THEME, AS.db.find('theme', 'site') || {}) },
    set(patch) { return AS.db.update('theme', 'site', patch) },
    title(lang, tr) { const t = THEME.get(); return (lang === 'rw' ? t.titleRw : t.titleEn) || tr('appName') },
    subtitle(lang, tr) { const t = THEME.get(); return (lang === 'rw' ? t.subRw : t.subEn) || tr('tagline') },
    apply(lang, tr) {
      const t = THEME.get()
      const root = document.documentElement
      if (t.font) root.style.setProperty('--app-font', t.font)
      else root.style.removeProperty('--app-font')
      if (t.accent) {
        root.style.setProperty('--green-700', t.accent)
        root.style.setProperty('--green-500', t.accent)
      } else {
        root.style.removeProperty('--green-700'); root.style.removeProperty('--green-500')
      }
      const title = THEME.title(lang, tr)
      document.title = title
      // icon overrides (favicon + splash/logo)
      const setHref = (sel, attr, val) => { const e = document.querySelector(sel); if (e && val) e.setAttribute(attr, val) }
      if (t.icon) {
        setHref('link[rel="icon"]', 'href', t.icon)
        setHref('link[rel="apple-touch-icon"]', 'href', t.icon)
      }
      AS.THEME_ICON = t.icon || ''
      AS.THEME_LOGO = t.logo || ''
    }
  }

  // ---------- AI Kinyarwanda training ----------
  const AIK = {
    qa() { return AS.db.all('ai_qa') },
    glossary() { return AS.db.all('ai_glossary') }
  }

  // ---------- AI provider ----------
  const DEFAULT_PROVIDER = {
    id: 'current', mode: 'builtin', name: 'Built-in (offline)', model: 'agro-rules-v1',
    apiUrl: '', apiKey: '', requireRemote: false, researchOnline: false
  }
  if (!AS.db.find('ai_provider', 'current')) AS.db.insert('ai_provider', { ...DEFAULT_PROVIDER })
  const PROVIDER = {
    get() { return Object.assign({}, DEFAULT_PROVIDER, AS.db.find('ai_provider', 'current') || {}) },
    set(patch) { return AS.db.update('ai_provider', 'current', patch) }
  }

  return { CATALOG, THEME, AIK, PROVIDER }
})()

// convenience aliases used across screens
AS.CATALOG = AS.CUSTOM.CATALOG
AS.THEME = AS.CUSTOM.THEME
AS.PROVIDER = AS.CUSTOM.PROVIDER
AS.AIK = AS.CUSTOM.AIK
