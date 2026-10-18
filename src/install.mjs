// Copyright © 2026 Christopher Snow.
const open = document.getElementById('install');
const dialog = document.getElementById('install-dialog');
const confirm = document.getElementById('install-confirm');
const message = document.getElementById('install-message');
const instructions = document.getElementById('install-instructions');
const standalone = matchMedia('(display-mode: standalone)');
let prompt;
let isInstalled = standalone.matches || navigator.standalone === true;

function installed() {
  isInstalled = true;
  prompt = null;
  open.hidden = true;
  confirm.hidden = true;
  instructions.hidden = true;
  message.textContent = 'GPU Lab is installed. Open it from your apps using the GPU Lab icon.';
}

open.hidden = isInstalled;
open.addEventListener('click', () => dialog.showModal());
document.getElementById('install-close').addEventListener('click', () => dialog.close());
addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  prompt = event;
  if (isInstalled) return;
  open.hidden = false;
  confirm.hidden = false;
  instructions.hidden = true;
});
confirm.addEventListener('click', async () => {
  if (!prompt) return;
  const request = prompt;
  prompt = null;
  confirm.disabled = true;
  try {
    await request.prompt();
    const choice = await request.userChoice;
    if (!isInstalled) message.textContent = choice.outcome === 'accepted'
      ? 'Installation requested. Your browser will add GPU Lab to your apps.'
      : 'Installation cancelled. You can install later from your browser’s menu.';
  } catch {
    message.textContent = 'Use your browser’s menu to install GPU Lab.';
  } finally {
    confirm.hidden = true;
    confirm.disabled = false;
    instructions.hidden = isInstalled;
    document.getElementById('install-close').focus();
  }
});
addEventListener('appinstalled', installed);
standalone.addEventListener('change', event => {
  if (event.matches) installed();
});
