// Service Worker - Network First Strategy (faster, no stale cache)
const CACHE = 'potluck-v20251103222000';

// Install immediately
self.addEventListener('install', e => {
  self.skipWaiting();
});

// Activate and clear old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys.map(key => caches.delete(key)));
    }).then(() => self.clients.claim())
  );
});

// Network first, cache fallback (faster, always fresh)
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Clone and cache the response
        const responseClone = response.clone();
        caches.open(CACHE).then(cache => {
          cache.put(e.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(e.request);
      })
  );
});