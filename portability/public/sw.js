// Hindura — offline shell cache. Registered only outside preview mode.
const CACHE = 'hindura-v1'
const SHELL = [
  './',
  './styles.css',
  './manifest.webmanifest',
  './icon.svg',
  './js/ui.js',
  './js/i18n.js',
  './js/api.js',
  './js/app.js',
  './js/screens/home.js',
  './js/screens/port.js',
  './js/screens/track.js',
  './js/screens/info.js',
  './js/screens/admin.js'
]

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET') return
  if (url.origin !== location.origin) return
  if (url.pathname.startsWith('/api/') || url.pathname === '/__reload') return

  event.respondWith(
    caches.match(event.request).then(hit => hit || fetch(event.request).then(res => {
      const copy = res.clone()
      caches.open(CACHE).then(c => c.put(event.request, copy)).catch(() => {})
      return res
    }).catch(() => caches.match('./')))
  )
})
