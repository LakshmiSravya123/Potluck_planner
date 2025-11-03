const CACHE_NAME = 'potluck-v2';
const urlsToCache = [
  '/Potluck_planner/',
  '/Potluck_planner/index.html',
  '/Potluck_planner/style.css',
  '/Potluck_planner/app.js',
  '/Potluck_planner/create.html',
  '/Potluck_planner/firebase-config.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(err => console.log('SW cache failed:', err))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request)
      .then(response => response || fetch(e.request))
  );
});