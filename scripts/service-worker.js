// Copyright © 2026 Christopher Snow.
// The build prepends the dependency-free release validator. No precache on install.
const BASE = new URL(self.registration.scope);
const PREFIX = `gpu-lab:${BASE.href}:`;
const META = PREFIX + 'status-v1';
const STATE = new URL('__app_status_state__', BASE).href;
const MANIFEST = new URL('__release_manifest__', BASE).href;
const cacheName = id => PREFIX + 'release-' + id;
let operation = null;
let restarting = false;
let navigationGate, releaseNavigation;
const seen = new Map();
async function readState() {
  const cache = await caches.open(META);
  return (await cache.match(STATE))?.json() ?? {};
}
async function writeState(state) {
  await (await caches.open(META)).put(STATE, new Response(JSON.stringify(state)));
}
async function manifest(id) {
  if (!id) return null;
  const response = await (await caches.open(cacheName(id))).match(MANIFEST);
  return response ? validateRelease(await response.json()) : null;
}
async function verified(response, file) {
  if (!response?.ok) return false;
  const data = await response.arrayBuffer();
  return data.byteLength === file.bytes && await digest(data) === file.sha256;
}
async function complete(release) {
  if (!release) return false;
  const cache = await caches.open(cacheName(release.id));
  for (const file of release.files) if (!await verified(await cache.match(new URL(file.path, BASE)), file)) return false;
  return true;
}
async function broadcast(message) {
  for (const client of await self.clients.matchAll({ type: 'window', includeUncontrolled: true })) {
    if (client.url.startsWith(BASE.href)) client.postMessage(message);
  }
}
async function prune(state) {
  if (!state.active || operation || restarting) return;
  const release = await manifest(state.active);
  if (!await complete(release)) return;
  const windows = await courseWindows(release);
  if (windows.some(client => seen.get(client.id) !== state.active)) return;
  const keep = new Set([META, ...[state.active, state.previous, state.pending, state.partial].filter(Boolean).map(cacheName)]);
  for (const name of await caches.keys()) if (name.startsWith(PREFIX) && !keep.has(name)) await caches.delete(name);
}
async function status(running) {
  const state = await readState();
  const release = await manifest(state.active || running);
  const pending = await manifest(state.pending);
  const keys = await caches.keys();
  // Old workers saved automatically. Keep their complete cache until the learner
  // explicitly removes it; treat it as consent to preserve offline access on update.
  const legacy = keys.some(k => k.startsWith(PREFIX) && !k.startsWith(PREFIX + 'release-') && k !== META);
  return { ...state, runningRelease: await manifest(running), saved: Boolean(state.saved || legacy), legacy,
    offlineReady: Boolean(state.saved && await complete(release)),
    pendingReady: Boolean(pending && await complete(pending)),
    busy: Boolean(operation || restarting) };
}
async function prepare(release, save, port, signal) {
  validateRelease(release);
  const cache = await caches.open(cacheName(release.id));
  await cache.put(MANIFEST, new Response(JSON.stringify(release)));
  let bytes = 0;
  for (const file of release.files) {
    signal.throwIfAborted();
    const key = new URL(file.path, BASE);
    if (!await verified(await cache.match(key), file)) {
      const timeout = AbortSignal.timeout(15000);
      const response = await fetch(new URL(`releases/${release.id}/${file.path}`, BASE), {
        cache: 'no-store', signal: AbortSignal.any([signal, timeout]), credentials: 'same-origin',
      });
      if (!await verified(response.clone(), file)) throw new Error('A downloaded file did not match the release. Retry after deployment finishes.');
      signal.throwIfAborted();
      await cache.put(key, response);
    }
    bytes += file.bytes;
    port.postMessage({ progress: { bytes, total: release.bytes } });
  }
  signal.throwIfAborted();
  if (!await complete(release)) throw new Error('The saved files could not be verified. Free storage and retry.');
  signal.throwIfAborted();
  const state = await readState();
  if (save && (!state.active || state.active === release.id)) {
    state.active = release.id; state.saved = true;
  } else {
    state.pending = release.id;
    state.pendingSaved = Boolean(save || state.saved || (await status()).legacy);
  }
  state.partial = null;
  await writeState(state);
  await broadcast({ type: 'STATUS_CHANGED' });
}
async function courseWindows(release) {
  const paths = new Set(release.files.filter(f => f.path.endsWith('.html')).map(f => new URL(f.path, BASE).pathname));
  return (await self.clients.matchAll({ type: 'window', includeUncontrolled: true })).filter(client => {
    const url = new URL(client.url);
    return url.origin === BASE.origin && paths.has(url.pathname === BASE.pathname ? url.pathname + 'index.html' : url.pathname);
  });
}
function ask(client, token) {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => { channel.port1.close(); reject(new Error('Another GPU Lab window did not respond. Open it and try again, or close it after saving your work.')); }, 5000);
    channel.port1.onmessage = ({ data }) => {
      clearTimeout(timer); channel.port1.close();
      data?.ready ? resolve() : reject(new Error(data?.error || 'Another window cannot save its work yet.'));
    };
    client.postMessage({ type: 'PREPARE_RESTART', token }, [channel.port2]);
  });
}
async function restart() {
  const state = await readState(), release = await manifest(state.pending);
  if (!release || !await complete(release)) throw new Error('The update is incomplete. Download it again before restarting.');
  const token = crypto.randomUUID();
  const windows = await courseWindows(release);
  try {
    // Every participant saves and locks its inputs. A missing or old client blocks
    // the transaction; it is never silently navigated and stripped of its work.
    await Promise.all(windows.map(client => ask(client, token)));
    const current = await courseWindows(release);
    if (current.length !== windows.length || current.some(c => !windows.some(w => w.id === c.id))) throw new Error('The open windows changed. Try restarting again.');
    state.previous = state.active;
    state.active = state.pending; state.saved = state.pendingSaved;
    state.pending = null; state.pendingSaved = false;
    await writeState(state);
    for (const client of windows) client.postMessage({ type: 'COMMIT_RESTART', token });
  } catch (error) {
    for (const client of windows) client.postMessage({ type: 'ABORT_RESTART', token });
    throw error;
  }
}
self.addEventListener('install', () => {});
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('message', event => {
  const port = event.ports[0];
  if (!port || !event.source?.url.startsWith(BASE.href)) return;
  event.waitUntil((async () => {
    try {
      const data = event.data;
      let result;
      if (data.type === 'STATUS') {
        if (/^[a-f0-9]{64}$/.test(data.running)) seen.set(event.source.id, data.running);
        result = await status(data.running);
        await prune(await readState());
      }
      else if (data.type === 'CANCEL') {
        operation?.abort(); result = {};
      } else if (data.type === 'PREPARE') {
        if (operation || restarting) throw new Error('Another window is downloading or restarting. Wait for it to finish.');
        operation = new AbortController();
        try {
          validateRelease(data.release);
          const state = await readState(); state.partial = data.release.id; await writeState(state);
          await prepare(data.release, Boolean(data.save), port, operation.signal);
          result = await status(data.running);
        } finally { operation = null; await broadcast({ type: 'STATUS_CHANGED' }); }
      } else if (data.type === 'RESTART') {
        if (operation || restarting) throw new Error('Wait for the current operation to finish.');
        restarting = true;
        navigationGate = new Promise(resolve => { releaseNavigation = resolve; });
        try { await restart(); result = {}; } finally { restarting = false; releaseNavigation(); }
      } else if (data.type === 'REMOVE') {
        if (operation || restarting) throw new Error('Cancel the download or wait for the restart before removing files.');
        for (const name of await caches.keys()) if (name.startsWith(PREFIX)) await caches.delete(name);
        await self.registration.unregister();
        await broadcast({ type: 'OFFLINE_REMOVED' }); result = {};
      } else throw new Error('Unsupported App status request');
      port.postMessage({ result });
    } catch (error) { port.postMessage({ error: error.name === 'AbortError' ? 'Download cancelled. Verified files can be resumed.' : error.message }); }
  })());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname)) return;
  let path = url.pathname.slice(BASE.pathname.length) || 'index.html';
  // Metadata is network-only, including requests from legacy cached documents.
  if (path === 'release.json' || path.endsWith('/release.json')) {
    event.respondWith(fetch(new Request(event.request, { cache: 'no-store' }))); return;
  }
  if (path === 'sw.js') return;
  event.respondWith((async () => {
    if (event.request.mode === 'navigate' && restarting) await navigationGate;
    const pinned = path.match(/^releases\/([a-f0-9]{64})\/(.+)$/);
    const state = await readState();
    const id = pinned ? pinned[1] : state.active;
    if (pinned) path = pinned[2];
    if (id) {
      const cache = await caches.open(cacheName(id));
      const cached = await cache.match(new URL(path, BASE));
      if (cached) return cached;
      // Missing assets from a selected release must never fall through to a
      // different root deployment. The immutable release URL may repair them.
      return fetch(new URL(`releases/${id}/${path}`, BASE), { cache: 'no-store' });
    }
    try { return await fetch(event.request); }
    catch (error) {
      // Preserve old complete installations during the protocol migration.
      for (const name of await caches.keys()) {
        if (name.startsWith(PREFIX) && name !== META && !name.startsWith(PREFIX + 'release-')) {
          const response = await (await caches.open(name)).match(new URL(path, BASE));
          if (response) return response;
        }
      }
      throw error;
    }
  })());
});
