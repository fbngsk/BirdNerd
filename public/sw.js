// Birbz Service Worker v1.0.0
// Cache-first mit automatischer Aktualisierung

const CACHE_NAME = 'birbz-v1';
const STATIC_CACHE = 'birbz-static-v1';

// Assets die gecached werden sollen (App Shell)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install: Cache App Shell
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Sofort aktivieren, nicht auf alte Tabs warten
        return self.skipWaiting();
      })
  );
});

// Activate: Alte Caches löschen
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      // Sofort alle Clients übernehmen
      return self.clients.claim();
    })
  );
});

// Fetch: Network-first für API, Cache-first für Assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // API-Requests (Supabase, Gemini) - immer Network
  if (url.hostname.includes('supabase') || 
      url.hostname.includes('googleapis') ||
      url.hostname.includes('generativelanguage')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Navigation requests - Network first, fallback to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Erfolgreiche Response cachen
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Offline: aus Cache laden
          return caches.match(event.request)
            .then((response) => response || caches.match('/'));
        })
    );
    return;
  }

  // Static assets (JS, CSS, Images) - Stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Update cache mit neuer Version
        if (networkResponse.ok) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Network failed, return cached or nothing
        return cachedResponse;
      });

      // Return cached version immediately, update in background
      return cachedResponse || fetchPromise;
    })
  );
});

// Message handler für Update-Check
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
