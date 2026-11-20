const cacheName = 'fluidmotion-v26';
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
  './tuner/script.js',
  './designer/landing.html',
  './designer/index.html',
  './designer/style.css',
  './designer/script.js',
  './dragon8editor/index.html',
  './dragon8editor/script.js',
  './kiterider/index.html',
  './kiterider/script.js',
  './surf/index.html',
  './harmonyexchange/index.html',
  './harmonyexchange/script.js',
  './lib/ffmpeg.min.js',
  './lib/qrious.min.js',
  './lib/leaflet.js',
  './lib/leaflet.css',
  './lib/jsQR.js',
  './lib/images/marker-icon.png',
  './lib/images/marker-icon-2x.png',
  './lib/images/marker-shadow.png',
  './creative.html',
  './systems.html',
  './sound.html',
  './nature.html',
  './vision.html',
  './lotus-spinner.html',
  './album.html',
  './album-builder/index.html',
  './album-builder/landing.html',
  './exhibition/index.html',
  './exhibition/script.js',
  './organ/index.html',
  './organ/script.js',
  './pianola/index.html',
  './pianola/script.js',
  './plasma/index.html',
  './plasmaxracer/index.html',
  './plasmaxracer/script.js',
  './portal/index.html',
  './sequencer/index.html',
  './sequencer/script.js',
  './ukulele/index.html',
  './ukulele/script.js'
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
