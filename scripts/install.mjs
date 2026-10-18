// Copyright © 2026 Christopher Snow.
export function installMarkup(html, base) {
  return html
    .replace('<link rel="icon" href="data:,">', `<link rel="icon" type="image/svg+xml" href="${base}assets/icon.svg">`)
    .replace('</head>', `<link rel="manifest" href="${base}manifest.webmanifest">
<meta name="theme-color" content="#122824">
<meta name="apple-mobile-web-app-title" content="GPU Lab">
<link rel="apple-touch-icon" sizes="180x180" href="${base}assets/apple-touch-icon.png">
<script type="module" src="${base}src/install.mjs"></script></head>`)
    .replace('<span class="brand-icon" aria-hidden="true">▦</span>', `<img class="brand-icon" src="${base}assets/icon.svg" alt="" width="32" height="32">`)
    .replace('<div class="top-actions">', '<div class="top-actions"><button id="install" type="button" aria-haspopup="dialog" hidden>Install</button>')
    .replace('</body>', `<dialog id="install-dialog" aria-labelledby="install-title">
<img src="${base}assets/icon.svg" class="install-icon" alt="" width="64" height="64">
<h2 id="install-title">Install GPU Lab</h2>
<p id="install-message" role="status">Give GPU Lab its own icon and window. All lessons and simulators work offline once the course is saved.</p>
<div id="install-instructions"><p>Use your browser’s install option:</p><ul>
<li><strong>Chrome or Edge:</strong> choose the install app icon in the address bar, or find “Install GPU Lab” in the browser menu.</li>
<li><strong>Safari on Mac:</strong> choose File → Add to Dock.</li>
<li><strong>Safari on iPhone or iPad:</strong> choose Share → Add to Home Screen, with Open as Web App enabled if offered.</li>
</ul><p>If your browser has no install option, try Chrome or Edge.</p></div>
<div class="install-actions"><button id="install-confirm" type="button" class="primary" hidden>Install GPU Lab</button><button id="install-close" type="button" autofocus>Close</button></div>
</dialog></body>`);
}
