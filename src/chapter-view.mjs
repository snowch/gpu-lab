// Copyright © 2026 Christopher Snow.
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function openingCode(source,extraClass='') {
  return `<div class="chapter-code-panel" data-language="pytorch"><p class="chapter-code-label">PyTorch</p><pre class="chapter-opening-code${extraClass?' '+extraClass:''}"><code>${escape(source)}</code></pre></div>`;
}
export function browserNotice() {
  return '<p class="chapter-browser-note">Run the examples below in your browser with no installation or GPU required. The browser simulates the calculation; it does not execute PyTorch or GPU code. To run the PyTorch snippet itself, use a Python environment with PyTorch and an NVIDIA GPU.</p>';
}

export function codePanel({id,source,language='cuda',label,labelId=id+'-label',selected=false}) {
  return `<div class="chapter-code-panel${selected?' is-selected-thread':''}" data-language="${language}"><p class="chapter-code-label" id="${labelId}">${escape(label)}</p><pre id="${id}" aria-labelledby="${labelId}"><code>${escape(source)}</code></pre></div>`;
}

// Keep first-use definitions readable without JavaScript or colour cues.
export function definitions(entries) {
  if(!entries?.length) return '';
  return `<div class="chapter-definition"><p class="chapter-definition-label">${entries.length===1?'Definition':'Definitions'}</p><dl>${entries.map(([term,meaning])=>`<dt><dfn>${escape(term)}</dfn></dt><dd>${escape(meaning)}</dd>`).join('')}</dl></div>`;
}

export function readerTask(text,label='Try it') {
  return `<div class="chapter-task"><p class="chapter-task-label"><span aria-hidden="true">→</span> ${escape(label)}</p><p>${escape(text)}</p></div>`;
}
