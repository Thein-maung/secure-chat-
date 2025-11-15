const CACHE = 'quantum-entangled-v3';
const FILES = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './app.js',
  './crypto.js',
  './qr.js',
  './twinnet.js'
];

const EXTERNAL_DEPS = [
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.15.0/dist/tf.min.js',
  'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js',
  'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js'
];

self.addEventListener('install', (event) => {
  console.log('⚛️ Quantum Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => {
        console.log('Caching quantum app shell');
        return cache.addAll(FILES);
      })
      .then(() => {
        return caches.open(CACHE + '-deps');
      })
      .then(cache => cache.addAll(EXTERNAL_DEPS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('⚛️ Quantum Service Worker activating...');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE && key !== CACHE + '-deps') {
            console.log('Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request)
          .then(fetchResponse => {
            if (event.request.url.startsWith('http') && 
                (event.request.url.includes('localhost') || 
                 event.request.url.includes('vercel.app') ||
                 event.request.url.includes('github.io'))) {
              const responseToCache = fetchResponse.clone();
              caches.open(CACHE)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }
            return fetchResponse;
          })
          .catch(error => {
            console.log('Fetch failed:', error);
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
          });
      })
  );
});