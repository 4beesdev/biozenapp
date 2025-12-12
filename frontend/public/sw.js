// Service Worker za BioZen PWA
const CACHE_NAME = 'biozen-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/logo.svg',
  '/manifest.json'
];


// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // Preskoči ne-HTTP/HTTPS zahteve (chrome-extension, data:, blob:, itd.)
  if (!request.url.startsWith('http://') && !request.url.startsWith('https://')) {
    return;
  }
  
  // Preskoči API zahteve - ne cache-ujemo API odgovore
  // Ne presreći API zahteve uopšte - neka idu direktno na network
  if (request.url.includes('/api/')) {
    event.respondWith(fetch(request));
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(request).then(
          (response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            // Clone the response
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              })
              .catch((err) => {
                // Ignoriši greške pri cache-ovanju
                console.log('Cache put failed:', err);
              });
            return response;
          }
        ).catch((err) => {
          // Ako fetch ne uspe, vrati grešku
          console.log('Fetch failed:', err);
          throw err;
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Odmah aktiviraj novi service worker
      return self.clients.claim();
    })
  );
});

// Install event - odmah aktiviraj novi service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Odmah aktiviraj novi service worker bez čekanja
        return self.skipWaiting();
      })
  );
});

