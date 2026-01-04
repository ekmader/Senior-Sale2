const CACHE_NAME = 'senrio-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Try network first for API calls, otherwise cache-first
  if (url.pathname.startsWith('/storage') || url.pathname.startsWith('/api') ) {
    event.respondWith(
      fetch(event.request).catch(()=> caches.match(event.request))
    );
    return
  }
  event.respondWith(
    caches.match(event.request).then((res) => res || fetch(event.request).then((res) => {
      if (res && res.status === 200){
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      }
      return res;
    }).catch(()=> caches.match('/')))
  );
});
