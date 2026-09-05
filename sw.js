// sw.js — Service Worker de NutriFlow PWA
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // PWA offline fallback
  event.respondWith(
    fetch(event.request).catch(() => new Response('NutriFlow offline'))
  );
});

// Manejador de eventos PUSH en segundo plano (Web Push desde Cloudflare Worker)
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || '🥑 NutriFlow Recordatorio';
  const options = {
    body: data.body || 'Tú registra. Nosotros hacemos las cuentas.',
    icon: 'img/favicon.png',
    badge: 'img/logo.png',
    tag: data.tag || 'nutriflow-reminder',
    renotify: true,
    data: data.data || { url: './' },
    vibrate: [100, 50, 100]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Manejador para cuando el usuario toca la notificación en el móvil o escritorio
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

