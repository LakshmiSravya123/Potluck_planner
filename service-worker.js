const CACHE = 'potluck-v1';
const FILES = [
  '/', '/Potluck_planner/', '/Potluck_planner/index.html', '/Potluck_planner/style.css', '/Potluck_planner/app.js',
  '/Potluck_planner/create.html', '/Potluck_planner/manifest.json', '/Potluck_planner/icon-192.png', '/Potluck_planner/icon-512.png'
];

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES))));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));