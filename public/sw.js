// PWA Service Worker for Offline Calculator Pro
const CACHE_VERSION = 'v1.0.1';
const CACHE_NAME = `calc-offline-${CACHE_VERSION}`;

const OFFLINE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './index.css',
  './icon.svg'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_ASSETS).catch((err) => {
        console.warn('Cache addAll non-critical error:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event (Network first with cache fallback)
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and store in cache if successful
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(async () => {
        // If offline, check cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        // If navigating to a page, return index.html
        if (event.request.mode === 'navigate') {
          const indexFallback = await caches.match('/');
          if (indexFallback) return indexFallback;
        }
        return new Response('Offline - Calculadora Pro', {
          headers: { 'Content-Type': 'text/plain' },
          status: 503
        });
      })
  );
});
