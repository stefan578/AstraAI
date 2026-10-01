// AstraAI no longer uses a caching service worker.
// Keep this file only so browsers with an older AstraAI worker can update it
// and remove the old cache safely.

const OLD_CACHES = ['astra-ai-cache-v1'];

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      ...OLD_CACHES.map((name) => caches.delete(name)),
      self.clients.claim(),
    ])
  );
});

self.addEventListener('fetch', (event) => {
  // Never cache or replace application requests.
  event.respondWith(fetch(event.request));
});
