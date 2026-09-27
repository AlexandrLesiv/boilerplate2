/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;
declare const __WB_MANIFEST: Array<{ url: string; revision: string | null }>;

const worker = self;
const ASSETS = __WB_MANIFEST.map((e) => e.url);
// Cache key derived from versioned asset paths, e.g. '/0.0.1/assets/...' → '0.0.1'
const CACHE = ASSETS[0]?.split('/').filter(Boolean)[0] ?? 'app';

worker.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  worker.skipWaiting();
});

worker.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  worker.clients.claim();
});

worker.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches
      .open(CACHE)
      .then((c) => c.match(e.request))
      .then((r) => r ?? fetch(e.request))
  );
});
