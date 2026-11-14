// Copyright © 2026 Christopher Snow.
const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function parallelFigure(r,step=0){
 if(r.visual?.kind==='scan')return scanFigure(r,step);
 if(r.visual?.kind!=='histogram')return '';
 const selected=Math.min(step,r.input.length-1),bin=r.input[selected],counts=r.steps[selected].cells;
 const tokens=[0,1].map(block=>`<div class="pattern-block"><strong>Block ${block} · category IDs</strong><div class="pattern-tokens">${r.input.slice(block*4,block*4+4).map((value,j)=>{const i=block*4+j;return `<div class="pattern-token${i===selected?' is-current':''}"><span>Thread ${i}</span><strong>${value}</strong></div>`;}).join('')}</div></div>`).join('');
 const bars=counts.map((count,b)=>`<div class="pattern-bin"><strong>Bin ${b}</strong><div class="pattern-bar" aria-hidden="true">${r.input.map((_,i)=>`<span class="${i<count?'is-filled':''}"></span>`).join('')}</div><span>${count} contributions</span></div>`).join('');
 const partials=r.visual.strategy==='private'?`<div class="pattern-partials">${r.partial.map((p,i)=>`<div><strong>Completed block ${i} partial</strong><p>[${p.map(esc).join(', ')}]</p></div>`).join('')}</div><p class="pattern-flow">Non-zero partial bins → ${r.globalUpdates} global atomic additions</p>`:'';
 return `<figure class="pattern-figure"><figcaption>Input threads → category counters</figcaption>${tokens}<p class="pattern-flow">Selected thread ${selected} → category ${bin} → atomic +1</p><p>Logical contributions through thread ${selected}; one filled segment per input counted.</p>${bars}${partials}</figure>`;
}

export function scanFigureFrame(r,step=0){
 const state=r.steps[Math.min(step,r.steps.length-1)],focus=Math.min(3,r.input.length-1);
 const before=state.before??state.cells,partner=state.shift?focus-1:state.distance?focus-state.distance:null;
 return {state,focus,before,partner,result:state.cells[focus]};
}
function scanFigure(r,step){
 const {state,focus,before,partner,result}=scanFigureFrame(r,step);
 const row=(values,title,marked)=>`<p><strong>${esc(title)}</strong></p><div class="pattern-tokens">${values.map((v,i)=>`<div class="pattern-token${marked.includes(i)?' is-current':''}"><span>Position ${i}</span><strong>${v}</strong></div>`).join('')}</div>`;
 const detail=state.shift?`Shift: position ${focus} receives old position ${partner}'s value ${result}. Position 0 receives zero.`:state.distance?`Position ${focus}: old[${focus}] (${before[focus]})${partner>=0?` + old[${partner}] (${before[partner]})`:'; no partner, so keep its value'} → ${result}.`:'Initial flags: a 1 selects the token; a 0 skips it.';
 return `<figure class="pattern-figure"><figcaption>${esc(state.label)}</figcaption>${state.before?row(before,'Read only this completed previous snapshot',state.shift?[partner]:[focus,partner]):''}<p class="pattern-flow">${esc(detail)}</p>${row(state.cells,state.before?'Write the new snapshot':'Input flags',[focus])}${state.shift?`<p>Output length = last offset ${r.values.at(-1)} + last flag ${r.input.at(-1)} = ${r.values.at(-1)+r.input.at(-1)}.</p>`:''}</figure>`;
}
