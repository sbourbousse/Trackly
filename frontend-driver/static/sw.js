// Service Worker basique pour PWA
const CACHE_NAME = 'trackly-driver-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ne pas intercepter les requêtes vers l'API ou SignalR
  // Laisser passer toutes les requêtes réseau pour l'API sans cache
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/hubs/')) {
    // Stratégie network-only : toujours aller au réseau, pas de cache
    event.respondWith(fetch(request));
    return;
  }

  // Pour les assets statiques, utiliser network-first avec fallback cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Mettre en cache les réponses valides
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback sur le cache si la requête échoue
        return caches.match(request);
      })
  );
});
