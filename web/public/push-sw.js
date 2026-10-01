/* Push handlers — carregado via importScripts no service worker principal (Workbox). */

self.addEventListener('push', (event) => {
  let payload = {}
  if (event.data) {
    try {
      payload = event.data.json()
    } catch {
      payload = { body: event.data.text() }
    }
  }

  const title = payload.title || 'Minha Rotina'
  const options = {
    body: payload.body || 'Você tem uma nova atualização na sua rotina.',
    icon: payload.icon || '/pwa-192x192.png',
    badge: payload.badge || '/pwa-64x64.png',
    data: {
      url: payload.url || '/',
      notificationId: payload.notificationId || null,
    },
  }
  if (payload.tag) options.tag = payload.tag

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const data = event.notification.data || {}
  const url = data.url || '/'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus()
            if ('navigate' in client) {
              return client.navigate(url)
            }
            return undefined
          }
        }
        return self.clients.openWindow(url)
      }),
  )
})
