// Copyright © 2026 Christopher Snow.
// Per-tab restart snapshots; no localStorage.clear and no replay of user actions.
const hooks = new Map();
let composing = false, lock = null, unlockTimer;
const key = 'gpu-lab:restart:' + location.pathname + location.search;
export function registerExperiment(name, save, restore) { hooks.set(name, { save, restore }); }
const controls = () => [...document.querySelectorAll('main input,main select,main textarea')];
function formState() { return controls().map(el => ({ id: el.id, name: el.name, value: el.value, checked: el.checked })); }
function restoreForm(values) {
  for (const [index, value] of values.entries()) {
    const el = value.id ? document.getElementById(value.id) : controls()[index];
    if (!el) throw new Error('An experiment control changed');
    el.value = value.value;
    if ('checked' in el) el.checked = value.checked;
  }
}
function releaseLock() {
  clearTimeout(unlockTimer); lock = null;
  for (const el of document.querySelectorAll('[data-update-locked]')) { el.inert = false; delete el.dataset.updateLocked; }
}
function snapshot() {
  const required = document.querySelector('.hello-section') ? ['hello-0','hello-1','hello-2','hello-3','hello-4'] : document.getElementById('kernel-editor') ? ['kernel'] : document.getElementById('tensor-diagram') ? ['memory','tensor-layout'] : document.body.dataset.lesson ? ['lesson'] : document.getElementById('work-map') ? ['overview'] : [];
  if (required.some(name => !hooks.has(name))) throw new Error('An experiment has not finished loading. Wait or reload that window before restarting.');
  if (composing || document.readyState !== 'complete' || document.querySelector('main [aria-busy="true"],main [contenteditable="true"]')) throw new Error('Finish the current input or operation in each GPU Lab window, then try again.');
  const guard = { reason: '' }; dispatchEvent(new CustomEvent('gpu-lab:before-restart', { detail: guard }));
  if (guard.reason) throw new Error(guard.reason);
  const data = { schema: 1, controls: formState(), experiments: Object.fromEntries([...hooks].map(([name, hook]) => [name, hook.save()])),
    details: [...document.querySelectorAll('main details')].map(el => el.open),
    messages: Object.fromEntries([...document.querySelectorAll('main [id]')].filter(el => /(?:feedback|hello-output-\d|kernel-status|prediction-feedback|challenge-feedback)$/.test(el.id)).map(el => [el.id, el.textContent])),
    scroll: [scrollX, scrollY] };
  const encoded = JSON.stringify(data);
  sessionStorage.setItem(key, encoded);
  if (sessionStorage.getItem(key) !== encoded) throw new Error('This window could not save its experiment. Allow browser storage and retry.');
}
addEventListener('compositionstart', () => { composing = true; });
addEventListener('compositionend', () => { composing = false; });
navigator.serviceWorker?.addEventListener('message', ({ data, ports }) => {
  if (data?.type === 'PREPARE_RESTART') {
    try {
      if (lock) throw new Error('This window is already restarting.');
      snapshot(); lock = data.token;
      for (const el of document.querySelectorAll('main,.sidebar,.topbar')) if (!el.inert) { el.inert = true; el.dataset.updateLocked = ''; }
      unlockTimer = setTimeout(releaseLock, 12000);
      ports[0].postMessage({ ready: true });
    } catch (error) { ports[0].postMessage({ ready: false, error: error.message }); }
  }
  if (data?.type === 'ABORT_RESTART' && data.token === lock) { releaseLock(); sessionStorage.removeItem(key); }
  if (data?.type === 'COMMIT_RESTART' && data.token === lock) location.reload();
});
function restore() {
  let stored;
  try {
    stored = sessionStorage.getItem(key); if (!stored) return;
    const data = JSON.parse(stored);
    if (data.schema !== 1) throw new Error('Unknown snapshot');
    restoreForm(data.controls);
    for (const [name, state] of Object.entries(data.experiments)) {
      if (!hooks.has(name)) throw new Error('An experiment changed');
      hooks.get(name).restore(state);
    }
    // Rebuilding a visual may replace controls; restore selections once more.
    restoreForm(data.controls);
    document.querySelectorAll('main details').forEach((el, i) => { el.open = data.details[i]; });
    for (const [id, text] of Object.entries(data.messages)) { const el = document.getElementById(id); if (el) el.textContent = text; }
    requestAnimationFrame(() => scrollTo({ left: data.scroll[0], top: data.scroll[1], behavior: 'instant' }));
    sessionStorage.removeItem(key);
  } catch {
    if (stored) {
      const notice = document.createElement('p'); notice.className = 'restore-notice'; notice.setAttribute('role', 'alert');
      notice.textContent = 'Some experiment state could not be restored. Your saved inputs remain in this tab’s restart snapshot.';
      const download = document.createElement('a'); download.textContent = 'Download saved inputs'; download.download = 'gpu-lab-experiment.json'; download.href = URL.createObjectURL(new Blob([stored], { type: 'application/json' })); notice.append(' ', download);
      document.querySelector('main')?.prepend(notice);
    }
  }
}
if (document.readyState === 'complete') restore(); else addEventListener('load', restore, { once: true });
