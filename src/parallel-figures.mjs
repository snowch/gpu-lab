// Copyright © 2026 Christopher Snow.
const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function parallelFigure(r,step=0){
 if(r.visual?.kind==='routing')return routingFigure(r,step);
 if(r.visual?.kind==='pipeline')return pipelineFigure(r,step);
 if(r.visual?.kind==='philosophers')return philosophersFigure(r,step);
 if(r.visual?.kind==='barrier')return barrierFigure(r,step);
 if(r.visual?.kind==='compaction')return compactionFigure(r,step);
 if(r.visual?.kind==='scan')return scanFigure(r,step);
 if(r.visual?.kind!=='histogram')return '';
 const selected=Math.min(step,r.input.length-1),bin=r.input[selected],counts=r.steps[selected].cells;
 const tokens=[0,1].map(block=>`<div class="pattern-block"><strong>Block ${block} · category IDs</strong><div class="pattern-tokens">${r.input.slice(block*4,block*4+4).map((value,j)=>{const i=block*4+j;return `<div class="pattern-token${i===selected?' is-current':''}"><span>Thread ${i}</span><strong>${value}</strong></div>`;}).join('')}</div></div>`).join('');
 const bars=counts.map((count,b)=>`<div class="pattern-bin"><strong>Bin ${b}</strong><div class="pattern-bar" aria-hidden="true">${r.input.map((_,i)=>`<span class="${i<count?'is-filled':''}"></span>`).join('')}</div><span>${count} contributions</span></div>`).join('');
 const partials=r.visual.strategy==='private'?`<div class="pattern-partials">${r.partial.map((p,i)=>`<div><strong>Completed block ${i} partial</strong><p>[${p.map(esc).join(', ')}]</p></div>`).join('')}</div><p class="pattern-flow">Non-zero partial bins → ${r.globalUpdates} global atomic additions</p>`:'';
 return `<figure class="pattern-figure"><figcaption>Input threads → category counters</figcaption>${tokens}<p class="pattern-flow">Selected thread ${selected} → category ${bin} → atomic +1</p><p>Logical contributions through thread ${selected}; one filled segment per input counted.</p>${bars}${partials}</figure>`;
}

function routingFigure(r,step){
 const s=r.steps[Math.min(step,r.steps.length-1)],i=s.inputIndex,group=r.visual.goal==='group';
 const inputs=r.input.map((bin,j)=>`<div class="pattern-token${j===i?' is-current':''}"><span>Token ${j}</span><strong>${bin}</strong></div>`).join('');
 const counts=group?r.counts:s.cells;
 const bins=counts.map((count,b)=>`<div class="pattern-token${r.input[i]===b?' is-current':''}"><span>Bin ${b}</span><strong>${count}</strong>${group?`<span>Start ${r.offsets[b]}</span>${count?'':'<span>No slots</span>'}`:''}</div>`).join('');
 const intro=`<p>Bold input values are categories; token labels identify input positions. ${group?'Each bin is one category’s output region.':'Each bin counts one category.'}</p><div class="pattern-tokens">${inputs}</div><p><strong>${group?'Completed counts and exclusive bin starts':'Counts through the selected token'}</strong></p><div class="pattern-tokens">${bins}</div>`;
 if(!group)return `<figure class="pattern-figure"><figcaption>Count contributions without building grouped output</figcaption>${intro}<p class="pattern-flow">Token ${i} → bin ${r.input[i]} → count ${counts[r.input[i]]}.</p><p>Stop after counting: bin starts, ranks and grouped token identities were not requested. No scatter writes.</p></figure>`;
 const outputBins=r.counts.flatMap((count,b)=>Array(count).fill(b));
 const output=s.output.map((value,j)=>`<div class="pattern-token${j===s.destination?' is-current':''}"><span>Output ${j}</span><strong data-output-token>${value==='Unwritten'?'?':value}</strong><span>${value==='Unwritten'?'Not written':'token ID'}</span><span>Bin ${outputBins[j]}</span></div>`).join('');
 return `<figure class="pattern-figure"><figcaption>Categories → disjoint bin regions → stable token identities</figcaption>${intro}<p class="pattern-flow">Token ${i}, category ${s.bin}: bin start ${s.binStart} + rank ${s.rank} → output slot ${s.destination}.</p><p><strong>Output identities so far · ? means not written</strong></p><div class="pattern-tokens">${output}</div><p>Distinct ranks separate writes within a bin; disjoint bin regions separate categories. Empty bins use no output slots.</p></figure>`;
}

function pipelineFigure(r,step){
 const s=r.steps[Math.min(step,r.steps.length-1)],axis=r.events.length*(r.copyTime+r.computeTime);
 const interval=(event,row,start,end,kind)=>`<span role="img" aria-label="Chunk ${event.chunk}, ${kind}: ${start}–${end} time units" class="pattern-interval${event.chunk===s.chunk?' is-current':''}" style="grid-row:${row};grid-column:${start+2}/${end+2}">Chunk ${event.chunk}</span>`;
 const lanes=['Copy','Compute','Slot 0','Slot 1'].map((name,i)=>`<strong class="pattern-lane" style="grid-row:${i+2};grid-column:1">${name}</strong>`).join('');
 const bars=r.events.map(e=>interval(e,2,e.copyStart,e.copyEnd,'copy')+interval(e,3,e.computeStart,e.computeEnd,'compute')+interval(e,e.slot+4,e.copyStart,e.computeEnd,'slot '+e.slot+' held')).join('');
 return `<figure class="pattern-figure"><figcaption>Complete synthetic schedule · selected chunk ${s.chunk}</figcaption><p>Shared serial/overlap axis: 0–${axis} time units. Slot bars last from copy start through consumer completion. Scroll the timeline horizontally when needed.</p><div class="pattern-timeline" role="region" aria-label="Complete synthetic schedule" tabindex="0"><div class="pattern-chart" style="--units:${axis+1}"><span class="pattern-lane" style="grid-row:1;grid-column:1">Time units</span>${Array.from({length:axis+1},(_,i)=>`<span class="pattern-tick" style="grid-row:1;grid-column:${i+2}">${i}</span>`).join('')}${lanes}${bars}</div></div><p class="pattern-flow">Chunk ${s.chunk}: copy ${s.copyStart}–${s.copyEnd} → compute ${s.computeStart}–${s.computeEnd} → release slot ${s.slot} at ${s.computeEnd}.</p><p>${s.previousChunk===null?`Slot ${s.slot} has no previous consumer.`:`Previous owner: chunk ${s.previousChunk} → slot ${s.slot} free at ${s.slotReady}.`} Copy engine free at ${s.copyReady}; selected copy starts at ${s.copyStart}.${r.visual.mode==='serial'?' Serial mode also waits for the previous computation.':''}</p><p>Copy completion supplies ready at ${s.copyEnd}; the compute queue is free at ${s.computeReady}. Consumption starts at ${s.computeStart}. These intervals are synthetic model values.</p></figure>`;
}

function philosophersFigure(r,step){
 const s=r.steps[Math.min(step,r.steps.length-1)],names=['A','B','C'];
 const forks=s.forks.map((owner,j)=>`<div class="pattern-token"><span>Fork ${j}</span><strong>${owner===null?'Free':names[owner]}</strong><span>${owner===null?'No owner':'Owner'}</span></div>`).join('');
 const people=s.held.map((held,j)=>`<div class="pattern-token${j===s.actor?' is-current':''}"><strong>${names[j]}</strong><span>${s.done[j]?'Finished':held.length===2?'Both held; can eat':`Holds ${held.length?held.join(', '):'none'}`}</span>${!s.done[j]&&held.length<2?`<span>Next: fork ${r.wanted[j][held.length]}</span>`:''}</div>`).join('');
 const waits=s.waits.map(w=>`<li>${names[w.from]} → fork ${w.fork} → owner ${names[w.to]}</li>`).join('');
 return `<figure class="pattern-figure"><figcaption>${esc(s.label)}</figcaption><p><strong>Exclusive fork ownership</strong></p><div class="pattern-tokens pattern-triple">${forks}</div><p><strong>Philosophers · held forks and next request</strong></p><div class="pattern-tokens pattern-triple">${people}</div><p class="pattern-flow">Next requests blocked by current owners</p>${waits?`<ul>${waits}</ul>`:'<p>No next request is blocked by an owner.</p>'}<p>Arrows run from requester to the owner it needs to release a fork. Holding both enables eating at that philosopher’s next opportunity.</p></figure>`;
}
function barrierFigure(r,step){
 const s=r.steps[Math.min(step,r.steps.length-1)],arrived=s.cells.filter(v=>v==='Waiting'||v==='May continue').length,skipped=s.cells.filter(v=>v==='Skipped').length;
 return `<figure class="pattern-figure"><figcaption>${esc(s.label)}</figcaption><div class="pattern-tokens">${s.cells.map((v,i)=>`<div class="pattern-token${v==='Waiting'?' is-current':''}"><span>Thread</span><strong>${i}</strong><span>${v==='Before barrier'?'Before':v==='May continue'?'Ready':v}</span></div>`).join('')}</div><p class="pattern-flow">${arrived} of 4 required arrivals → ${s.cells.every(v=>v==='May continue')?'matching barrier releases the block':skipped?'invalid participation; skipped threads still continue elsewhere':'no release yet'}</p><p>Exactly four threads; no early exits. A skipped call does not count as an arrival. This diagram assigns no arithmetic output or real-hardware failure mode.</p></figure>`;
}
export function capacityFigure(){
 return `<figure class="pattern-figure"><figcaption>One resident slot cannot host the waiting block and its producer</figcaption><div class="pattern-partials"><div><strong>Resident capacity: 1 block</strong><p>Block A occupies the slot and waits for B’s flag.</p></div><div><strong>Block B · not resident</strong><p>Needs that slot before it can run and set the flag.</p></div></div><p class="pattern-flow">A needs B’s result → B needs capacity held by A</p><p>This chosen capacity example explains a progress dependency. Ordinary blocks have no general simultaneous-residency guarantee.</p></figure>`;
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

function compactionFigure(r,step){
 const state=r.steps[Math.min(step,r.steps.length-1)],i=state.inputIndex;
 const inputs=r.input.map((bin,j)=>`<div class="pattern-token${j===i?' is-current':''}"><span>Token ${j}</span><strong>${bin}</strong><span>Flag ${r.flags[j]}</span><span>Offset ${r.offsets[j]}</span></div>`).join('');
 const output=state.output.map((value,j)=>`<div class="pattern-token${j===state.destination?' is-current':''}"><span>Output ${j}</span><strong data-output-token>${value==='Unwritten'?'?':value}</strong><span>${value==='Unwritten'?'Not written':'token ID'}</span></div>`).join('');
 const action=state.destination===null?`Token ${i} has flag 0: skip its write. Its offset ${r.offsets[i]} is not used.`:`Token ${i} has flag 1 → exclusive offset ${state.destination} → output slot ${state.destination}.`;
 return `<figure class="pattern-figure"><figcaption>Token categories → flags → exclusive offsets</figcaption><p>Bold input values are category IDs; token labels identify input positions.</p><div class="pattern-tokens">${inputs}</div><p class="pattern-flow">${esc(action)}</p><div class="pattern-output"><p><strong>Output so far · used prefix</strong></p>${r.count?`<div class="pattern-tokens">${output}</div>`:'<p>No output slots used (empty).</p>'}</div><p>Final count = last offset ${r.offsets.at(-1)} + last flag ${r.flags.at(-1)} = ${r.count}. Every survivor owns a distinct destination.</p></figure>`;
}
