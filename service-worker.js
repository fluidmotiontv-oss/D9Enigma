const cacheName = 'fluidmotion-v16';
const staticAssets = [
  './',
  './index.html',
  './manifest.json',
  './three.module.min.js',
  './scripts/night_fish.css',
  './scripts/app.js',
  './scripts/math.js',
  './scripts/data.js',
  './scripts/spawner.js',
  './scripts/asset_library.js',
  './scripts/night_fish_assistant.js',
  './icon-192.png',
  './icon-512.png',
  './tuner/index.html',
  './tuner/script.js'
];

// Cache core assets on install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll(staticAssets);
    }).then(() => self.skipWaiting())
  );
});

// Activate handler: Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== cacheName) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch handler: Network fallback to Cache strategy
self.addEventListener('fetch', event => {
  // Only handle GET requests and local/http URLs
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then(response => {
        // Only cache valid standard responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(cacheName).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => {
        // Return index.html as a fallback for navigation requests offline
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
