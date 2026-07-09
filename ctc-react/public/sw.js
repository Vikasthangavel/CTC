// ─── VERSION: bump this string on every deploy ───────────────────────────────
// The browser detects a byte-change in this file → installs the new SW →
// shows the "Update Available" banner to the user.
const CACHE_VERSION = 'v8'; // ← change to v3, v4 … each time you deploy
const CACHE_NAME = `ctc-pwa-${CACHE_VERSION}`;

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.svg',
  '/icons.svg'
];

// ── Install: cache assets but DON'T skipWaiting ──────────────────────────────
// skipWaiting() would silently replace the old SW mid-session (causes glitches).
// Instead we wait for the React app to call skipWaiting via postMessage.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  // Do NOT call self.skipWaiting() here — let the user trigger it.
});

// ── Activate: delete all old caches ──────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// ── Message: React app tells us to skip waiting (apply update now) ────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── Fetch: network-first for HTML, stale-while-revalidate for assets ──────────
self.addEventListener('fetch', (event) => {
  // Only handle same-origin HTTP/HTTPS
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Never intercept Firestore / Firebase API calls
  if (
    event.request.url.includes('firestore.googleapis.com') ||
    event.request.url.includes('firebaseinstallations.googleapis.com') ||
    event.request.url.includes('identitytoolkit.googleapis.com') ||
    event.request.url.includes('securetoken.googleapis.com')
  ) return;

  // Network-first for navigation (HTML) — always serve latest page shell
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Stale-while-revalidate for everything else (JS, CSS, images)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkFetch = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_NAME).then((cache) =>
            cache.put(event.request, networkResponse.clone())
          );
        }
        return networkResponse;
      }).catch(() => null);

      return cachedResponse || networkFetch;
    })
  );
});
