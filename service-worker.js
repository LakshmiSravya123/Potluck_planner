const CACHE = 'potluck-v20251103221322';
const FILES = [
  '/Potluck_planner/',
  '/Potluck_planner/index.html',
  '/Potluck_planner/style.css',
  '/Potluck_planner/app.js',
  '/Potluck_planner/create.html',
  '/Potluck_planner/manifest.json'
];

// Install - cache files
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting())
  );
});

// Activate - delete old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)));
    }).then(() => self.clients.claim())
  );
});

// Fetch - serve from cache or network
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});