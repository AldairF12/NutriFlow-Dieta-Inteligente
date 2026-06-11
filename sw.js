// sw.js
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // Intercepta peticiones para que el navegador valide la PWA
  event.respondWith(
    fetch(event.request).catch(() => new Response('App offline'))
  );
});
