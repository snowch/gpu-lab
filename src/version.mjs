// Copyright © 2026 Christopher Snow.
const info = document.querySelector('.build-info[data-commit]');
const status = info?.querySelector('.version-status');
let controller;

function show(state, text) {
  status.dataset.state = state;
  status.textContent = text;
}

async function checkLatest() {
  controller?.abort();
  if (!navigator.onLine) {
    show('unknown', 'Offline · latest unverified');
    return;
  }
  const request = new AbortController();
  controller = request;
  const timeout = setTimeout(() => request.abort(), 8000);
  show('checking', 'Checking latest…');
  try {
    const response = await fetch('https://api.github.com/repos/snowch/gpu-lab/git/ref/heads/main', {
      cache: 'no-store', credentials: 'omit', signal: request.signal,
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!response.ok) throw new Error('Version check unavailable');
    const sha = (await response.json()).object?.sha;
    if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error('Invalid version response');
    if (controller !== request || request.signal.aborted) return;
    if (sha === info.dataset.commit) show('latest', '✓ Latest');
    else show('different', 'Different from latest on main');
  } catch {
    if (controller === request && navigator.onLine) show('unknown', 'Latest version unavailable');
  } finally {
    clearTimeout(timeout);
  }
}

if (status) {
  addEventListener('online', checkLatest);
  addEventListener('offline', () => {
    controller?.abort();
    controller = undefined;
    show('unknown', 'Offline · latest unverified');
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkLatest();
    else {
      controller?.abort();
      controller = undefined;
      show('unknown', 'Latest version unchecked');
    }
  });
  checkLatest();
}
