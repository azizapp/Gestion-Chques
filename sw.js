
const CACHE_NAME = 'finansse-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/index.tsx',
  '/types.ts',
  '/constants.tsx',
  '/supabase.ts'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Network first, then cache
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
