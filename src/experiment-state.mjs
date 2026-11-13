// Copyright © 2026 Christopher Snow.
// Per-tab restart snapshots; no localStorage.clear and no replay of user actions.
const hooks = new Map();
let composing = false, lock = null, unlockTimer;
const snapshotKey = () => 'gpu-lab:restart:' + location.pathname + location.search;
// Read the incoming route before a page migrates its URL; saves still use the live route.
const incomingSnapshotKey = snapshotKey();
export function registerExperiment(name, save, restore) { hooks.set(name, { save, restore }); }
const controls = () => [...document.querySelectorAll('main input:not([data-lesson-completion]),main select,main textarea')];
function formState() { return controls().map(el => ({ id: el.id, name: el.name, value: el.value, checked: el.checked })); }
function restoreForm(values) {
  for (const [index, value] of values.entries()) {
    // Completion is shared durable state, not a per-tab experiment snapshot.
    if(location.pathname.endsWith('/hello.html')&&/^(hello-factor-[1-4]|hello-guard-3|hello-transfer-count)$/.test(value.id))continue;
    if(location.pathname.endsWith('/inside-sm.html')&&value.id?.startsWith('vsm-'))continue;
    if (value.id === 'lesson-complete' || /^hello-sm-(read|multiply|write)$/.test(value.id)) continue;
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
  const key = snapshotKey();
  const required = document.querySelector('[data-book-experiment]') ? [...document.querySelectorAll('[data-book-experiment]')].map(el=>el.dataset.bookExperiment) : document.querySelector('.hello-section') ? ['hello-0','hello-1','hello-2','hello-3','hello-4','hello-launch','hello-bounds','hello-transfer'] : document.getElementById('sm-recording') ? ['sm-recording'] : document.getElementById('sm-explorer') ? ['sm-hardware'] : document.getElementById('kernel-editor') ? ['kernel'] : document.getElementById('tensor-diagram') ? ['memory','tensor-layout'] : document.body.dataset.lesson ? ['lesson'] : document.getElementById('gpu-map') ? ['gpu-map'] : document.getElementById('work-map') ? ['overview'] : [];
  if(document.getElementById('sm-explorer'))required.push('sm-hardware');
  if (required.some(name => !hooks.has(name))) throw new Error('An experiment has not finished loading. Wait or reload that window before restarting.');
  if (composing || document.readyState !== 'complete' || document.querySelector('main [aria-busy="true"],main [contenteditable="true"]')) throw new Error('Finish the current input or operation in each GPU Lab window, then try again.');
  const guard = { reason: '' }; dispatchEvent(new CustomEvent('gpu-lab:before-restart', { detail: guard }));
  if (guard.reason) throw new Error(guard.reason);
  const data = { schema: 1, controls: formState(), experiments: Object.fromEntries([...hooks].map(([name, hook]) => [name, hook.save()])),
    details: [...document.querySelectorAll('main details')].map(el => el.open),
    messages: Object.fromEntries([...document.querySelectorAll('main [id]')].filter(el => /(?:feedback|kernel-status|prediction-feedback|challenge-feedback)$/.test(el.id)).map(el => [el.id, el.textContent])),
    focus: document.activeElement?.closest('main') ? document.activeElement.id : null, scroll: [scrollX, scrollY] };
  const encoded = JSON.stringify(data);
  sessionStorage.setItem(key, encoded);
  if (sessionStorage.getItem(key) !== encoded) throw new Error('This window could not save its experiment. Allow browser storage and retry.');
}
export const saveReadingState=snapshot;
// Back/forward cache already preserves the live document and its scroll position.
addEventListener('pageshow',event=>{if(event.persisted){try{sessionStorage.removeItem(snapshotKey());}catch{/* The live document already retains its state. */}}});
addEventListener('compositionstart', () => { composing = true; });
addEventListener('compositionend', () => { composing = false; });
navigator.serviceWorker?.addEventListener('message', ({ data, ports }) => {
  if (data?.type === 'PREPARE_RESTART') {
    try {
      if (lock) throw new Error('This window is already restarting.');
      snapshot(); lock = data.token;
      for (const el of document.querySelectorAll('main,.sidebar,.topbar,#gpu-map-panel')) if (!el.inert) { el.inert = true; el.dataset.updateLocked = ''; }
      unlockTimer = setTimeout(releaseLock, 12000);
      ports[0].postMessage({ ready: true });
    } catch (error) { ports[0].postMessage({ ready: false, error: error.message }); }
  }
  if (data?.type === 'ABORT_RESTART' && data.token === lock) { releaseLock(); sessionStorage.removeItem(snapshotKey()); }
  if (data?.type === 'COMMIT_RESTART' && data.token === lock) {
    // Older workers may still include the embedded map in their transaction.
    // Its reader owns the reload and the map's disclosure/scroll snapshot.
    if (window.parent !== window && document.getElementById('gpu-map')) releaseLock();
    else location.reload();
  }
});
function restore() {
  const key = incomingSnapshotKey;
  let stored;
  try {
    stored = sessionStorage.getItem(key); if (!stored) return;
    const data = JSON.parse(stored);
    if (data.schema !== 1) throw new Error('Unknown snapshot');
    // Retired arithmetic controls do not apply to the fixed worked examples.
    // Old positional disclosures must not reveal newly introduced challenge answers.
    if(location.pathname.endsWith('/hello.html')&&data.experiments['hello-0']?.version!==3)data.details=[];
    restoreForm(data.controls);
    // The retired Chapter 1 SM disclosure followed its complete-function reference.
    // Preserve the other disclosure positions when opening a snapshot from that version.
    if (data.controls.some(control=>control.id==='hello-sm-read') && location.pathname.endsWith('/hello.html')) data.details.splice(1,1);
    // The recording replaces the former value inspector and warp appendix.
    // Their positional disclosures must not open the new transcript.
    if(location.pathname.endsWith('/inside-sm.html')&&data.experiments['sm-hardware']){
      delete data.experiments['sm-hardware'];data.details=[];
    }
    for (const [name, state] of Object.entries(data.experiments)) {
      if (!hooks.has(name)) throw new Error('An experiment changed');
      hooks.get(name).restore(state);
    }
    // Rebuilding a visual may replace controls; restore selections once more.
    restoreForm(data.controls);
    // The GPU map owns its disclosures by stable ID, including migration from its
    // previous concept view. Positional snapshots must not overwrite that state.
    document.querySelectorAll('main details').forEach((el, i) => {
      if (!el.matches('#gpu-map .map-node')) el.open = data.details[i];
    });
    for (const [id, text] of Object.entries(data.messages)) {
      // Hello owns its derived output text. Older snapshots may describe four
      // inputs; its restore hook recomputes that text for the current model.
      if (location.pathname.endsWith('/hello.html')&&id.startsWith('hello-')) continue;
      const el = document.getElementById(id); if (el) el.textContent = text;
    }
    requestAnimationFrame(() => {
      if(data.focus)document.getElementById(data.focus)?.focus({preventScroll:true});
      scrollTo({ left: data.scroll[0], top: data.scroll[1], behavior: 'instant' });
    });
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
