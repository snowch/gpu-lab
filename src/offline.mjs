// Copyright © 2026 Christopher Snow.
const status = document.getElementById('offline-status');
const base = new URL('../', import.meta.url);
let registration;
let failed = false;
const updatePanel = document.getElementById('offline-update');
const updatePrompt = document.getElementById('update-prompt');
const applyUpdate = document.getElementById('apply-update');
const deferUpdate = document.getElementById('defer-update');
const showUpdate = document.getElementById('show-update');
const updateError = document.getElementById('update-error');
let deferredWorker;
let updating = false;

function showUpdateControls() {
  const waiting = registration?.active && registration.waiting;
  updatePanel.hidden = !waiting && !updating;
  const deferred = waiting && waiting === deferredWorker && !updating;
  updatePrompt.hidden = Boolean(deferred);
  showUpdate.hidden = !deferred;
  applyUpdate.disabled = updating || !waiting;
  deferUpdate.disabled = updating;
  applyUpdate.textContent = updating ? 'Updating…' : 'Update and reload';
}

function show() {
  showUpdateControls();
  status.hidden = false;
  if (registration?.active) {
    status.dataset.state = 'ready';
    status.textContent = navigator.onLine
      ? 'Available offline · All lessons, simulators and example files are saved in this browser.'
      : 'Working offline · All lessons, simulators and example files are available.';
    if (registration.waiting) status.textContent += ' Update saved.';
    status.textContent += ' External links need an internet connection.';
  } else if (failed) {
    status.dataset.state = 'unavailable';
    status.textContent = 'Offline saving is unavailable. You can keep using the course online; revisit to try again.';
  } else {
    status.dataset.state = 'saving';
    status.textContent = 'Saving the course for offline use… Keep this tab open until “Available offline” appears.';
  }
}

async function start() {
  if (!('serviceWorker' in navigator) || !isSecureContext) {
    failed = true;
    show();
    return;
  }
  show();
  try {
    registration = await navigator.serviceWorker.register(new URL('sw.js', base), {
      scope: base.href, updateViaCache: 'none',
    });
    const watch = worker => {
      if (!worker) return;
      const changed = () => {
        if (worker.state === 'redundant') failed = true;
        show();
      };
      worker.addEventListener('statechange', changed);
      changed();
    };
    registration.addEventListener('updatefound', () => watch(registration.installing));
    watch(registration.installing);
    navigator.serviceWorker.addEventListener('controllerchange', show);
    // Covers a worker that finished installing between registration and listeners.
    navigator.serviceWorker.ready.then(show);
    show();
  } catch {
    failed = true;
    show();
  }
}

if (status) {
  deferUpdate.addEventListener('click', () => {
    deferredWorker = registration?.waiting;
    showUpdateControls();
    showUpdate.focus();
  });
  showUpdate.addEventListener('click', () => {
    deferredWorker = undefined;
    showUpdateControls();
    applyUpdate.focus();
  });
  applyUpdate.addEventListener('click', () => {
    const worker = registration?.waiting;
    if (!worker || updating) return;
    updating = true;
    updateError.hidden = true;
    showUpdateControls();
    // Only a fully installed waiting worker can activate. It navigates every
    // open course window after claiming clients, including older page versions.
    worker.postMessage({ type: 'ACTIVATE_UPDATE' });
    setTimeout(() => {
      // Navigation normally replaces this document before the timeout fires.
      updating = false;
      updateError.textContent = 'The update could not reload this window. Close all GPU Lab tabs and app windows, then reopen the course to use the saved update.';
      showUpdateControls();
      updatePanel.hidden = false;
      updateError.hidden = false;
    }, 15000);
  });
  addEventListener('online', () => {
    show();
    registration?.update().catch(() => {});
  });
  addEventListener('offline', show);
  start();
}
