/* eslint-disable no-restricted-globals */

/**
 * Custom Service Worker for PWA.
 *
 * Caching strategy:
 *   - HTML / navigation requests → network-first (so deep links + new
 *     deploys are picked up immediately; cache only used when offline).
 *   - Same-origin static assets (js/css/img/font) → cache-first
 *     (immutable filenames courtesy of Vite's hashed bundles).
 *   - Cross-origin and non-http(s) → never cached, always passthrough
 *     (this avoids the chrome-extension:// Cache API error).
 *
 * Bump CACHE_VERSION whenever the SW logic changes — the activate
 * handler nukes any cache whose name doesn't match the current version,
 * so a single deploy invalidates every visitor's stale cache.
 */

const CACHE_VERSION = 'v3';
const STATIC_CACHE = `codewithgabo-static-${CACHE_VERSION}`;
const HTML_CACHE = `codewithgabo-html-${CACHE_VERSION}`;

// Pre-cache only the bare minimum that Vite always emits at known paths.
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(HTML_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch((err) => console.warn('[SW] precache failed (non-fatal):', err))
  );
  // Activate this SW as soon as it's installed, replacing any older one.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((n) => n !== STATIC_CACHE && n !== HTML_CACHE)
          .map((n) => {
            console.log('[SW] deleting stale cache:', n);
            return caches.delete(n);
          })
      )
    )
  );
  // Take control of any open tabs immediately.
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never cache cross-origin requests or non-http(s) schemes
  // (this fixes the chrome-extension:// "scheme unsupported" error
  // and avoids stale-caching analytics, fonts.googleapis, sanity CDN, etc).
  if (url.origin !== self.location.origin) return;
  if (request.method !== 'GET') return;

  // Navigation / HTML: network-first
  const isHTML =
    request.mode === 'navigate' ||
    request.destination === 'document' ||
    (request.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(HTML_CACHE).then((cache) => {
            cache.put(request, copy).catch(() => {});
          });
          return response;
        })
        .catch(() =>
          // Offline: serve cached index.html as SPA fallback.
          caches.match('/index.html').then((r) => r || caches.match('/'))
        )
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const copy = response.clone();
        caches.open(STATIC_CACHE).then((cache) => {
          cache.put(request, copy).catch(() => {});
        });
        return response;
      });
    })
  );
});

// Optional: allow the page to ping the SW to force-skip-waiting on demand.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
