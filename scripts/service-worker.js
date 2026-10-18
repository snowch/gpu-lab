// Copyright © 2026 Christopher Snow.
// Build replaces these placeholders with a content fingerprint and complete asset list.
const VERSION = __VERSION__;
const FILES = __FILES__;
const BASE = new URL(self.registration.scope);
const PREFIX = `gpu-lab:${BASE.href}:`;
const CACHE = PREFIX + VERSION;
const URLS = new Set(FILES.map(path => new URL(path, BASE).href));

self.addEventListener('install', event => {
  // addAll is atomic: a missing file leaves the existing course version in use.
  // Waiting workers activate naturally when all course tabs close; never replace
  // modules underneath an open experiment with skipWaiting().
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try {
      await cache.addAll([...URLS].map(url => new Request(url, { cache: 'reload' })));
    } catch (error) {
      await caches.delete(CACHE);
      throw error;
    }
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(PREFIX) && name !== CACHE).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname)) return;
  if (url.pathname === BASE.pathname) url.pathname += 'index.html';
  // Course files are static: query strings do not create separate offline copies.
  url.search = '';
  url.hash = '';
  if (!URLS.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    return await cache.match(url.href) || fetch(event.request);
  })());
});
