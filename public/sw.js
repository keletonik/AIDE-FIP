/* AIDE-FIP service worker.
 *
 * Strategy:
 *  - App shell + same-origin GETs: stale-while-revalidate.
 *  - HTML navigations: network-first with offline fallback.
 *  - Anything POST or with cache-control: no-store: bypass cache.
 *
 * Bumped CACHE on each release so old shells don't linger.
 */
const CACHE = 'aide-fip-v1';
const SHELL = ['/', '/standards', '/panels', '/battery', '/troubleshoot', '/products', '/offline'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
    )).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/debug/log')) return; // never cache the beacon

  // HTML pages — network first, fall back to cache, then offline page.
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then((c) => c || caches.match('/offline'))),
    );
    return;
  }

  // Static / API GETs — stale-while-revalidate.
  event.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(req).then((cached) => {
        const network = fetch(req).then((res) => {
          if (res.status === 200) cache.put(req, res.clone()).catch(() => {});
          return res;
        }).catch(() => cached);
        return cached || network;
      }),
    ),
  );
});
