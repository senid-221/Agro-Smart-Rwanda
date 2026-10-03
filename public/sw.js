const CACHE = 'agrosmart-v49'
const ASSETS = [
  '/', '/index.html', '/styles.css', '/manifest.webmanifest', '/icon.png', '/icon-192.png', '/icon-512.png',
  '/js/app.js', '/js/ui.js', '/js/i18n.js', '/js/db.js', '/js/custom.js', '/js/api.js', '/js/ai.js', '/js/research.js', '/js/engine/detector.js',
  '/js/data/diseases.js', '/js/data/crops.js', '/js/data/rab.js', '/js/data/fertilizers.js', '/js/data/lessons.js', '/js/data/products.js', '/js/data/agro.js',
  '/js/screens/home.js', '/js/screens/scan.js', '/js/screens/learn.js',
  '/js/screens/library.js', '/js/screens/fertilizer.js', '/js/screens/store.js',
  '/js/screens/assistant.js', '/js/screens/case.js', '/js/screens/dashboard.js', '/js/screens/alerts.js',
  '/js/screens/weather.js', '/js/screens/map.js', '/js/screens/community.js', '/js/screens/expert.js',
  '/js/screens/admin.js', '/js/screens/settings.js', '/js/screens/warroom.js'
]

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)
  // Never cache backend API calls — the app is online-only and data must be live.
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(fetch(e.request))
    return
  }
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone()
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {})
        return res
      })
      .catch(() => caches.match(e.request).then(m => m || caches.match('/index.html')))
  )
})
