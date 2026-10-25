// Copyright © 2026 Christopher Snow.
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function openingCode(source,extraClass='') {
  return `<pre class="chapter-opening-code${extraClass?' '+extraClass:''}"><code>${escape(source)}</code></pre>`;
}
export function browserNotice() {
  return '<p class="chapter-browser-note">Run the examples below in your browser with no installation or GPU required. The browser simulates the calculation; it does not execute PyTorch or GPU code. To run the PyTorch snippet itself, use a Python environment with PyTorch and an NVIDIA GPU.</p>';
}
