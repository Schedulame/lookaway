// Combined service worker: COOP/COEP headers + offline caching + notification handling

const CACHE = 'lookaway-v1'

// App shell assets to precache on install
const PRECACHE = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// ── COOP/COEP headers (required for SharedArrayBuffer / MediaPipe WASM) ───────
// Strategy: cache-first for same-origin static assets; network-first (with COOP/COEP) otherwise.
self.addEventListener('fetch', (event) => {
  if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') return

  const url = new URL(event.request.url)
  const isSameOrigin = url.origin === self.location.origin
  const isNavigate = event.request.mode === 'navigate'

  // Cache-first for same-origin non-navigate requests (JS, CSS, WASM, images, fonts cached locally)
  if (isSameOrigin && !isNavigate) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached
        return fetchWithHeaders(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone()
            caches.open(CACHE).then((c) => c.put(event.request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // Network-first with COOP/COEP headers for navigation and cross-origin requests
  event.respondWith(
    fetchWithHeaders(event.request).catch(() => {
      if (isNavigate) return caches.match('/').then((r) => r || fetch(event.request))
      return fetch(event.request)
    })
  )
})

function fetchWithHeaders(request) {
  return fetch(request).then((response) => {
    if (!response || response.status === 0 || response.type === 'opaque') return response
    const headers = new Headers(response.headers)
    headers.set('Cross-Origin-Opener-Policy', 'same-origin')
    headers.set('Cross-Origin-Embedder-Policy', 'require-corp')
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  })
}

// ── Notification: click focuses the app window ────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const tag = event.notification.tag
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((list) => {
        const win = list.find((c) => c.focus)
        const action = win ? win.focus() : self.clients.openWindow(self.registration.scope)
        return action
      })
      .then(() =>
        self.clients.matchAll({ type: 'window' }).then((list) =>
          list.forEach((c) => c.postMessage({ type: 'NOTIFICATION_CLICKED', tag }))
        )
      )
  )
})

// ── Notification: close sends message back to main thread ─────────────────────
self.addEventListener('notificationclose', (event) => {
  const tag = event.notification.tag
  self.clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then((list) => list.forEach((c) => c.postMessage({ type: 'NOTIFICATION_CLOSED', tag })))
})
