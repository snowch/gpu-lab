// Copyright © 2026 Christopher Snow.
// Build-time teaching notes: definitions are HTML, not interactive widgets.
const html = value => String(value).replace(/[&<>"']/g, char => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
})[char]);

export const warpConcepts = [
  { term: 'Kernel', definition: 'A function launched to run on a GPU. Many threads execute it.' },
  { term: 'Thread', definition: 'One execution of the kernel, with its own thread identity and work.' },
  { term: 'Warp', definition: 'A group of 32 threads that an NVIDIA GPU schedules together.' },
  { term: 'Lane', definition: 'A thread’s position within its warp, numbered 0 through 31.' },
];

export function renderConcepts({ id, terms = [], warpDiagram = false } = {}) {
  if (!terms.length) return '';
  if (typeof id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(id))
    throw new TypeError('A unique lowercase concepts section id is required.');
  if (terms.some(entry => !entry.term || !entry.definition))
    throw new TypeError('Each new concept needs a term and a definition.');
  const seen = new Set();
  for (const entry of terms) {
    if (seen.has(entry.term)) throw new TypeError('Duplicate concept: ' + entry.term);
    seen.add(entry.term);
  }

  const items = terms.map(({term,definition}) =>
    `<div class="concepts-entry"><dt>${html(term)}</dt><dd>${html(definition)}</dd></div>`
  ).join('');
  const diagram = warpDiagram ? `
    <figure class="concepts-warp">
      <figcaption><strong>One warp · 32 lanes</strong></figcaption>
      <div class="concepts-warp-grid" role="img" aria-label="One NVIDIA warp contains 32 threads with lanes numbered zero through thirty-one.">
        ${Array.from({length:32},(_,i)=>`<span aria-hidden="true" class="concepts-lane">${i}</span>`).join('')}
      </div>
      <p>Each square represents one lane (one thread). Eight per row is just the drawing layout, not a separate hardware group. Some lanes may be inactive for an instruction.</p>
    </figure>` : '';
  return `<section class="concepts" aria-labelledby="${id}-concepts-heading">
    <h3 class="concepts-heading" id="${id}-concepts-heading"><span class="concepts-icon" aria-hidden="true">▤</span> New concepts</h3>
    <dl class="concepts-list">${items}</dl>${diagram}
  </section>`;
}
