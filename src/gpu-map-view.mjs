// Copyright © 2026 Christopher Snow.
import {conceptById} from './gpu-map-data.mjs';
import {chapters} from './book-chapters.mjs';
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const chapterName=slug=>{const index=chapters.findIndex(c=>c.slug===slug);return index>=0?`Chapter ${index+1}: ${chapters[index].title}`:({'shared-memory':'Extra practice: shared-memory banks',kernel:'Extra practice: repair a kernel',memory:'Memory access explorer'}[slug]??slug);};
const chapterLinks=c=>`<div class="map-chapter-links">${c.chapters.map(slug=>`<a href="${slug}.html">${escape(chapterName(slug))}</a>`).join('')}</div>`;
const info=id=>{const c=conceptById(id);return `<p>${escape(c.meaning)}</p><p><strong>Book example:</strong> ${escape(c.example)}</p>${chapterLinks(c)}`;};
// These functions run during the build. Native disclosures work before any script loads.
function node(id,concept,title,hint,body,kind=''){
 return `<details class="map-node ${kind}" id="${id}" data-map-concept="${concept}"><summary><span><strong>${title}</strong><span class="map-hint">${hint}</span><span class="map-match" hidden>In highlighted chapter</span></span></summary><div class="map-inside">${body}</div></details>`;
}
const concept=(id,prefix,children='',hint='Definition, book example and chapter links')=>node(`${prefix}-${id}`,id,escape(conceptById(id).title),hint,info(id)+children);
export function renderWarp(block,w){
 return node(`${block}-warp-${w}`,'warp',`Warp ${w}`,`Threads ${w*32}–${w*32+31} · 32 lane positions`,
 `<p>A <strong>lane</strong> is a thread’s position within its warp. T labels give the thread index within block ${block.toUpperCase()}. Select a lane to inspect its thread.</p><div class="map-lanes">${Array.from({length:32},(_,i)=>node(`${block}-w${w}-lane-${i}`,'lane',`<span class="map-lane-label">Lane ${i}</span> T${w*32+i}`,'',`<p>Lane ${i} → thread ${w*32+i} within block ${block.toUpperCase()}. Its registers hold its own working values.</p>${chapterLinks(conceptById('thread'))}`,'map-lane')).join('')}</div>${chapterLinks(conceptById('warp'))}`,'map-warp');
}
function block(name){
 return node(`block-${name}`,'block',`Block ${name.toUpperCase()}`,'Resident work · 64 threads → 2 warps',
 `<p>A block is a group of threads that can cooperate. It stays on this SM for its lifetime.</p>${renderWarp(name,0)}${renderWarp(name,1)}${node(`shared-${name}`,'shared',`Block ${name.toUpperCase()}’s shared memory`,'A workspace for both warps',info('shared')+concept('barrier',name)+concept('banks',name),'map-memory')}${chapterLinks(conceptById('block'))}`,'map-block');
}
function sm(n,names){
 return node(`sm-${n}`,'sm',`SM ${n}`,`Streaming multiprocessor · ${names.length} resident block${names.length===1?'':'s'} shown`,
 `<p>An SM is a part of the GPU that executes instructions for resident threads. It can host several blocks when resources allow.</p><div class="map-resources">${concept('scheduler',`sm${n}`,'','Selects ready instructions from warps')}${concept('registers',`sm${n}`,'','Working values private to each thread')}${concept('l1-cache',`sm${n}`,'','On-chip cache local to this SM')}${concept('tensor-cores',`sm${n}`,'','Specialised units for supported matrix operations')}</div><p class="map-label">Work assigned to this SM</p>${names.map(block).join('')}<p class="map-note">A block’s threads do not necessarily execute all at once. Ready work from other resident blocks may proceed while threads wait or lanes are unused. Unused lanes cannot be filled by another block’s threads.</p>${chapterLinks(conceptById('sm'))}`,'map-sm');
}
function hardware(){
 return `<section id="hardware-panel" class="map-panel" aria-label="Inside the GPU diagram"><h2>From the system to one thread</h2><p>Open the GPU chip, then an SM. Keep opening components to see blocks, warps and threads.</p><div class="map-machine">
${node('cpu','cpu','CPU','Host · runs your program',info('cpu')+concept('cpu-memory','host'),'map-cpu')}
<div class="map-transfer">Launches work and copies data<span aria-hidden="true">⇄</span></div><section class="map-device" id="gpu-device" aria-labelledby="gpu-device-title">
<h3 id="gpu-device-title">GPU device / accelerator</h3><p class="map-device-note">A discrete NVIDIA GPU device includes a compute chip and dedicated memory. It may be a card or a module.</p>
${node('gpu','gpu','GPU chip','Contains SMs, caches and memory controllers',`<p>The compute chip contains many <strong>streaming multiprocessors (SMs)</strong>. Each SM has its own L1 cache; the SMs share an on-chip L2 cache.</p><div class="map-sms">${sm(0,['a','c'])}${sm(1,['b'])}</div>
<div class="map-connection"><span aria-hidden="true">↕</span><p>SMs read and write through the on-chip cache hierarchy.</p>${node('memory-cache','cache','L2 cache','Inside the chip · shared across SMs',info('cache')+concept('sectors','memory'))}<span aria-hidden="true">↕</span>${node('memory-controllers','memory-controllers','Memory controllers','Inside the chip · connect to device memory',info('memory-controllers'))}</div>
<p class="map-note">Two SMs are shown. Hardware manages caches; a kernel uses each block’s shared-memory workspace explicitly. On many NVIDIA architectures, L1 and shared memory share on-chip capacity. Boxes show relationships, not the chip’s physical layout.</p>${chapterLinks(conceptById('gpu'))}`,'map-gpu')}
<div class="map-connection"><span aria-hidden="true">↕</span><p>Memory controllers connect the chip to its dedicated memory.</p></div>
${node('vram','gpu-memory','Device memory / VRAM','Inside the GPU device · separate from the compute chip',info('gpu-memory')+concept('tensor','memory',concept('shape','tensor')+concept('strides','tensor')+concept('dtype','tensor'))+concept('copy','memory'),'map-memory')}
</section></div><p class="map-note">Illustrative placement: three blocks of 64 threads on two SMs. Each block stays on one SM; several blocks may share it. This is a relationship map, not a schedule or a promise that every thread executes at once. Integrated GPUs can share system memory; this picture shows a discrete GPU device.</p></section>`;
}
export function renderMap(){return `<div id="gpu-map">
<div class="map-tools map-enhancement" hidden><label for="map-chapter">Highlight concepts from<select id="map-chapter"><option value="">All chapters</option>${chapters.map((c,i)=>`<option value="${c.slug}">Chapter ${i+1}: ${escape(c.title)}</option>`).join('')}${['memory','kernel','shared-memory'].map(s=>`<option value="${s}">${chapterName(s)}</option>`).join('')}</select></label><div><button type="button" id="map-back" disabled>← Back one level</button><button type="button" id="map-reset">Reset diagram</button></div></div>
<p id="map-status" class="map-enhancement" role="status" hidden></p>
${hardware()}
</div>`;}
