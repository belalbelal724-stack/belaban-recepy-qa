// Service Worker - Rasbi PWA v3
const CACHE_NAME = 'rasbi-v3-' + Date.now();
const CORE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './favicon.svg'
];

// Install - cache core files immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        CORE_FILES.map(url => 
          cache.add(url).catch(err => console.log('Cache fail:', url))
        )
      );
    })
  );
});

// Activate - claim clients and clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => 
        Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
      )
    ])
  );
});

// Fetch - serve from cache first, fallback to network
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      
      return fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone).catch(()=>{});
          });
        }
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
