// Copyright © 2026 Christopher Snow.
const status = document.getElementById('offline-status');
const base = new URL('../', import.meta.url);
let registration;
let failed = false;

function show() {
  status.hidden = false;
  if (registration?.active) {
    status.dataset.state = 'ready';
    status.textContent = navigator.onLine
      ? 'Available offline · All lessons, simulators and example files are saved in this browser.'
      : 'Working offline · All lessons, simulators and example files are available.';
    if (registration.waiting) status.textContent += ' Update saved: close all GPU Lab tabs and reopen to use it.';
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
  addEventListener('online', () => {
    show();
    registration?.update().catch(() => {});
  });
  addEventListener('offline', show);
  start();
}
