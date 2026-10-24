// Copyright © 2026 Christopher Snow.
import './experiment-state.mjs';
import { validateRelease } from './release-contract.mjs';
const $ = id => document.getElementById(id);
const base = new URL(document.querySelector('meta[name="gpu-base"]').content, location.href);
const running = document.querySelector('meta[name="gpu-release"]').content;
const dialog = $('app-status-dialog');
let registration, worker, latest, runningRelease, snapshot = {}, checking, lastCheck = 0, checkingAbort;
let downloading = false, mode, removed = false, refreshGeneration = 0;
let version = navigator.onLine ? 'Checking for updates' : 'Cannot check for updates';
const supported = 'serviceWorker' in navigator && isSecureContext && 'caches' in self;
let unavailable = !supported;
let remembered = false, remembering;
const bytes = n => `${n.toLocaleString('en-GB')} bytes (${(n / 1048576).toFixed(2)} MiB)`;
function error(message = '') { $('app-status-error').textContent = message; }
function render() {
  const pending = snapshot.pending && snapshot.pending !== running;
  const available = latest && latest.id !== running;
  const ready = pending && snapshot.pendingReady;
  $('version-status').textContent = downloading && mode === 'update' ? 'Downloading update' : ready ? 'Update ready' : version;
  $('app-status-summary').textContent = `${document.querySelector('.build-info a')?.textContent || running.slice(0, 7)} · ${ready ? 'Update ready' : available || pending ? 'Update available' : version === 'Up to date' ? 'Up to date' : 'Check version'}`;
  $('download-update').hidden = !available || Boolean(ready && snapshot.pending === latest.id);
  $('download-update').disabled = downloading || !supported;
  $('restart-update').hidden = !ready; $('later-update').hidden = !ready;
  $('restart-note').hidden = !ready;
  $('check-update').disabled = Boolean(checking);
  $('check-update').textContent = version === 'Couldn’t check for updates' ? 'Retry' : 'Check for updates';
  let offline = unavailable ? 'Offline access unavailable' : downloading && mode === 'offline' ? 'Saving for offline use' : snapshot.offlineReady ? 'Available offline' : snapshot.saved || snapshot.partial ? 'Offline download incomplete' : 'Not saved for offline use';
  $('offline-status').textContent = offline;
  $('offline-status').dataset.state = snapshot.offlineReady ? 'ready' : 'unavailable';
  const release = runningRelease;
  $('offline-size').textContent = release ? `Complete app: ${bytes(release.bytes)}. Includes all required files; browser storage overhead is additional.` : 'The download size is unavailable. Connect to the internet and retry.';
  $('save-offline').hidden = Boolean(snapshot.offlineReady) || !supported;
  $('save-offline').disabled = downloading || !release;
  $('save-offline').textContent = unavailable ? 'Retry offline access' : snapshot.partial === running ? 'Resume download' : snapshot.saved ? 'Repair offline copy' : 'Download for offline use';
  $('remove-offline').hidden = !supported || !(snapshot.saved || snapshot.partial || snapshot.active || snapshot.pending);
  $('remove-offline').disabled = downloading;
  $('version-detail').textContent = !supported ? 'This browser cannot save or prepare updates here. You can keep using GPU Lab online.' : latest && available ? `Deployed release ${latest.commit?.slice(0, 7) || latest.id.slice(0, 7)}${latest.date ? ' · ' + latest.date : ''}. Download: ${bytes(latest.bytes)}.` : version === 'Cannot check for updates' ? 'You are offline. Saved files remain usable; the published version cannot be checked.' : version === 'Couldn’t check for updates' ? 'The deployed release could not be verified. Try again when connected.' : '';
}
function rpc(type, data = {}, progress) {
  return new Promise((resolve, reject) => {
    if (!worker) { reject(new Error('Offline access unavailable. Reopen App status to retry.')); return; }
    const channel = new MessageChannel();
    let timer;
    const reset = () => { clearTimeout(timer); timer = setTimeout(() => { channel.port1.close(); reject(new Error('The operation did not respond. Reopen App status and retry.')); }, type === 'PREPARE' ? 30000 : 15000); };
    reset();
    channel.port1.onmessage = ({ data }) => {
      if (data.progress) { reset(); progress?.(data.progress); return; }
      clearTimeout(timer); channel.port1.close();
      data.error ? reject(new Error(data.error)) : resolve(data.result);
    };
    worker.postMessage({ type, running, ...data }, [channel.port2]);
  });
}
async function refresh() {
  if (!worker || removed) return;
  try {
    const generation = ++refreshGeneration;
    const result = await rpc('STATUS');
    if (generation !== refreshGeneration) return;
    snapshot = result; unavailable = false;
    runningRelease ||= snapshot.runningRelease;
    render();
  } catch (failure) { unavailable = true; error(failure.message); render(); }
}
async function metadata(url, signal) {
  const response = await fetch(url, { cache: 'no-store', credentials: 'same-origin', signal, headers: { 'Cache-Control': 'no-cache' } });
  if (!response.ok || Number(response.headers.get('Age') || 0) > 0) throw new Error('Release unavailable or cached');
  return validateRelease(await response.json());
}
async function check(force = false) {
  if (checking || (!force && Date.now() - lastCheck < 15000)) return checking;
  if (!navigator.onLine) { version = 'Cannot check for updates'; render(); return; }
  lastCheck = Date.now();
  const abort = new AbortController(); checkingAbort = abort;
  const timer = setTimeout(() => abort.abort(), 8000);
  version = 'Checking for updates';
  checking = (async () => {
    try {
      const url = new URL('release.json', base); url.searchParams.set('check', crypto.randomUUID());
      const release = await metadata(url, abort.signal);
      if (checkingAbort !== abort || abort.signal.aborted) return;
      latest = release;
      if (release.id === running) runningRelease = release;
      version = release.id === running ? 'Up to date' : 'Update available';
    } catch { if (checkingAbort === abort) version = navigator.onLine ? 'Couldn’t check for updates' : 'Cannot check for updates'; }
    finally { clearTimeout(timer); checking = null; render(); }
  })();
  render(); return checking;
}
async function connect() {
  if (!supported) { render(); return; }
  try {
    registration = await navigator.serviceWorker.register(new URL('sw.js', base), { scope: base.href, updateViaCache: 'none' });
    // Never activate a waiting worker over an unprepared legacy tab.
    if (registration.active && !registration.active.scriptURL.endsWith('/sw.js')) throw new Error('A previous installation must be closed before App status can connect.');
    worker = registration.active;
    if (!worker) {
      await Promise.race([navigator.serviceWorker.ready, new Promise((_, reject) => setTimeout(() => reject(new Error('Offline access unavailable. Retry when browser storage is enabled.')), 8000))]);
      worker = registration.active;
    }
    removed = false; await refresh(); await remember();
  } catch (failure) { unavailable = true; error(failure.message); render(); }
}
async function remember() {
  if (remembered || remembering || !worker || !runningRelease || removed || document.readyState !== 'complete') return remembering;
  const prefix = new URL(`releases/${running}/`, base).href;
  const paths = performance.getEntriesByType('resource').map(entry => entry.name).filter(url => url.startsWith(prefix)).map(url => url.slice(prefix.length).split('?')[0]);
  paths.push(location.pathname.slice(base.pathname.length) || 'index.html');
  remembering = rpc('REMEMBER_PAGE', { release: runningRelease, paths }).then(() => { remembered = true; }).catch(() => {
    // Storage is optional for normal online use; an explicit save/update reports
    // its own error. Never claim offline readiness for this best-effort cache.
  }).finally(() => { remembering = null; });
  return remembering;
}
async function download(save) {
  const release = save ? runningRelease : latest;
  if (!release || downloading) return;
  await remembering;
  if (!worker || removed || unavailable) await connect();
  downloading = true; mode = save ? 'offline' : 'update'; error();
  $('download-progress').hidden = false; $('asset-progress').value = 0; $('asset-progress').max = release.bytes;
  $('progress-text').textContent = `0 of ${bytes(release.bytes)} verified`;
  render();
  try {
    await rpc('PREPARE', { release, save }, p => {
      $('asset-progress').max = p.total; $('asset-progress').value = p.bytes;
      $('progress-text').textContent = `${bytes(p.bytes)} of ${bytes(p.total)} verified`;
    });
  } catch (failure) { error(failure.message); }
  finally { downloading = false; $('download-progress').hidden = true; await refresh(); render(); }
}
$('running-version').append('Running ', document.querySelector('.build-info').cloneNode(true), ` · Build ${running.slice(0, 12)}`);
$('app-status-open').addEventListener('click', () => { dialog.showModal(); check(); if (!worker || removed) connect(); else refresh(); });
$('app-status-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => $('app-status-open').focus({ preventScroll: true }));
$('check-update').addEventListener('click', () => { check(true); refresh(); });
$('download-update').addEventListener('click', () => download(false));
$('save-offline').addEventListener('click', () => download(true));
$('cancel-download').addEventListener('click', () => rpc('CANCEL').catch(f => error(f.message)));
$('later-update').addEventListener('click', () => dialog.close());
$('restart-update').addEventListener('click', async () => {
  error(); $('restart-update').disabled = true;
  try { await rpc('RESTART'); }
  catch (failure) { error(failure.message); }
  finally { $('restart-update').disabled = false; await refresh(); }
});
$('remove-offline').addEventListener('click', () => { $('remove-confirmation').hidden = false; $('cancel-remove').focus(); });
$('cancel-remove').addEventListener('click', () => { $('remove-confirmation').hidden = true; $('remove-offline').focus(); });
$('confirm-remove').addEventListener('click', async () => {
  try { await rpc('REMOVE'); snapshot = {}; removed = true; $('remove-confirmation').hidden = true; error('Downloaded files removed. Your experiment work and preferences have been kept.'); render(); $('save-offline').focus(); }
  catch (failure) { error(failure.message); }
});
navigator.serviceWorker?.addEventListener('message', ({ data }) => {
  if (data?.type === 'STATUS_CHANGED') refresh();
  if (data?.type === 'OFFLINE_REMOVED') { snapshot = {}; removed = true; render(); }
});
addEventListener('online', () => { lastCheck = 0; check(); refresh(); });
addEventListener('offline', () => { checkingAbort?.abort(); version = 'Cannot check for updates'; render(); });
addEventListener('focus', () => { check(); refresh(); });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') { check(); refresh(); }
  else { checkingAbort?.abort(); }
});
setInterval(() => { if (document.visibilityState === 'visible' && navigator.onLine) check(); }, 60000);
addEventListener('load', remember, { once: true });
render(); check(); connect();
// Running metadata is immutable and small; it is not a course download.
metadata(new URL(`releases/${running}/release.json`, base), AbortSignal.timeout(8000)).then(r => { if (r.id === running) { runningRelease = r; render(); remember(); } }).catch(() => {});
