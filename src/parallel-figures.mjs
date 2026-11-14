// Copyright © 2026 Christopher Snow.
const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function parallelFigure(r,step=0){
 if(r.visual?.kind!=='histogram')return '';
 const selected=Math.min(step,r.input.length-1),bin=r.input[selected],counts=r.steps[selected].cells;
 const tokens=[0,1].map(block=>`<div class="pattern-block"><strong>Block ${block} · category IDs</strong><div class="pattern-tokens">${r.input.slice(block*4,block*4+4).map((value,j)=>{const i=block*4+j;return `<div class="pattern-token${i===selected?' is-current':''}"><span>Thread ${i}</span><strong>${value}</strong></div>`;}).join('')}</div></div>`).join('');
 const bars=counts.map((count,b)=>`<div class="pattern-bin"><strong>Bin ${b}</strong><div class="pattern-bar" aria-hidden="true">${r.input.map((_,i)=>`<span class="${i<count?'is-filled':''}"></span>`).join('')}</div><span>${count} contributions</span></div>`).join('');
 const partials=r.visual.strategy==='private'?`<div class="pattern-partials">${r.partial.map((p,i)=>`<div><strong>Completed block ${i} partial</strong><p>[${p.map(esc).join(', ')}]</p></div>`).join('')}</div><p class="pattern-flow">Non-zero partial bins → ${r.globalUpdates} global atomic additions</p>`:'';
 return `<figure class="pattern-figure"><figcaption>Input threads → category counters</figcaption>${tokens}<p class="pattern-flow">Selected thread ${selected} → category ${bin} → atomic +1</p><p>Logical contributions through thread ${selected}; one filled segment per input counted.</p>${bars}${partials}</figure>`;
}
