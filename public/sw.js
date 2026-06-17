// Combined service worker: COOP/COEP headers + notification handling

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

// ── COOP/COEP headers (required for SharedArrayBuffer / MediaPipe WASM) ───────
self.addEventListener('fetch', (event) => {
  if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') return
  event.respondWith(
    fetch(event.request)
      .then((response) => {
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
      .catch(() => fetch(event.request))
  )
})

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
    .matchAll({ type: 'window' })
    .then((list) => list.forEach((c) => c.postMessage({ type: 'NOTIFICATION_CLOSED', tag })))
})
