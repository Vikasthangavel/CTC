self.addEventListener('install', (e) => {
  console.log('[Service Worker] Installed');
});

self.addEventListener('fetch', (e) => {
    // Basic fetch event handler
    e.respondWith(fetch(e.request));
});