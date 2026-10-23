// Copyright © 2026 Christopher Snow.
// Build replaces these placeholders with a content fingerprint and complete asset list.
const VERSION = __VERSION__;
const FILES = __FILES__;
const BASE = new URL(self.registration.scope);
const PREFIX = `gpu-lab:${BASE.href}:`;
const CACHE = PREFIX + VERSION;
const URLS = new Set(FILES.map(path => new URL(path, BASE).href));
const RELOAD_REQUEST = new URL('__reload-course-windows__', BASE).href;

function isCoursePage(href) {
  const url = new URL(href);
  if (url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname)) return false;
  if (url.pathname === BASE.pathname) url.pathname += 'index.html';
  url.search = '';
  url.hash = '';
  return url.pathname.endsWith('.html') && URLS.has(url.href);
}

self.addEventListener('message', event => {
  if (event.data?.type !== 'ACTIVATE_UPDATE' || !event.source || !isCoursePage(event.source.url)) return;
  event.waitUntil((async () => {
    // Persist intent across worker restarts. Installation has already saved the
    // complete version; activation never depends on a new network request.
    const cache = await caches.open(CACHE);
    await cache.put(RELOAD_REQUEST, new Response('reload'));
    await self.skipWaiting();
  })());
});

self.addEventListener('install', event => {
  // addAll is atomic: a missing file leaves the existing course version in use.
  // Waiting workers activate naturally when all course tabs close, unless the
  // learner explicitly chooses Update and reload after the download completes.
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
    const cache = await caches.open(CACHE);
    const reloadRequested = Boolean(await cache.match(RELOAD_REQUEST));
    await cache.delete(RELOAD_REQUEST);
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(PREFIX) && name !== CACHE).map(name => caches.delete(name)));
    await self.clients.claim();
    if (reloadRequested) {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of windows.filter(client => isCoursePage(client.url))) {
        // Do not await navigations here: their fetches may wait for this activate
        // event to finish. Browser navigation continues once activation completes.
        client.navigate(client.url).catch(() => {});
      }
    }
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
