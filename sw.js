// ============================================================================
// sw.js — Service Worker de NutriFlow PWA
// Soporte 100% Offline-First + Notificaciones Web Push en Segundo Plano
// ============================================================================

const CACHE_NAME = 'nutriflow-cache-v4.6';

const CORE_ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'css/styles.css',
  'css/core/base.css',
  'css/components/chat.css',
  'css/components/register-sheet.css',
  'css/components/voice.css',
  'css/components/recipe-editor.css',
  'css/views/dashboard.css',
  'css/views/profile.css',
  'css/views/diary.css',
  'js/main.js',
  'js/core/logger.js',
  'js/core/utils.js',
  'js/data/catalog.js',
  'js/services/db.js',
  'js/utils/calc.js',
  'js/services/ai.js',
  'js/services/notificationService.js',
  'js/components/voice.js',
  'js/components/registerSheet.js',
  'js/components/aiChat.js',
  'js/components/recipeEditor.js',
  'js/views/diaryView.js',
  'js/views/dashboardView.js',
  'js/views/profileView.js',
  'js/views/pantryView.js',
  'js/views/shoppingView.js',
  'js/views/recipesView.js',
  'img/favicon.png',
  'img/logo.png',
  'img/og-image.png'
];

// 1. INSTALACIÓN: Precarga del Shell de la aplicación en la caché
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Cachear individualmente para que un recurso opcional no bloquee la instalación
      for (const asset of CORE_ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn('[NutriFlow SW] Recurso no cacheado en install:', asset, err);
        }
      }
    }).then(() => self.skipWaiting())
  );
});

// 2. ACTIVACIÓN: Limpieza de cachés antiguas y control inmediato de clientes
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[NutriFlow SW] Eliminando caché antigua:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. ESTRATEGIA DE RED / CACHÉ (Offline-First)
self.addEventListener('fetch', (event) => {
  // Solo interceptar peticiones GET (no interceptar POSTs a Cloudflare ni APIs de IA)
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // No interceptar extensiones del navegador ni llamadas a APIs externas
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // A) Para navegación de páginas (HTML principal): Red primero, fallback a caché
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(async () => {
          // Si no hay conexión (offline), cargar la app completa desde la caché
          const cached = await caches.match(event.request, { ignoreSearch: true });
          if (cached) return cached;
          const fallback = await caches.match('index.html', { ignoreSearch: true });
          if (fallback) return fallback;
          return caches.match('./', { ignoreSearch: true });
        })
    );
    return;
  }

  // B) Para assets estáticos (CSS, JS, imágenes, fuentes): Caché primero, fallback a red
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        // Devolver de caché de inmediato y actualizar en segundo plano si hay red
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => {/* Modo offline silencioso */});
        return cachedResponse;
      }

      // Si no está en caché, buscar en la red y guardar copia
      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback para imágenes si fallan sin conexión
          if (event.request.destination === 'image') {
            return caches.match('img/favicon.png', { ignoreSearch: true });
          }
          return new Response('', { status: 408, statusText: 'Offline' });
        });
    })
  );
});

// ============================================================================
// 4. NOTIFICACIONES PUSH EN SEGUNDO PLANO (Web Push desde Cloudflare Worker)
// ============================================================================
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

// 5. CLIC EN LA NOTIFICACIÓN: Enfoca o abre NutriFlow
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
