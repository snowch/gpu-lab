// Copyright © 2026 Christopher Snow.
import {mapViews,mapConcepts,conceptById,connections} from './gpu-map-data.mjs';
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
 `<p>An SM is a part of the GPU that executes instructions for resident threads. It can host several blocks when resources allow.</p><div class="map-resources">${concept('scheduler',`sm${n}`,'','Selects ready instructions from warps')}${concept('registers',`sm${n}`,'','Working values private to each thread')}${concept('tensor-cores',`sm${n}`,'','Specialised units for supported matrix operations')}</div><p class="map-label">Work assigned to this SM</p>${names.map(block).join('')}<p class="map-note">A block’s threads do not necessarily execute all at once. Ready work from other resident blocks may proceed while threads wait or lanes are unused. Unused lanes cannot be filled by another block’s threads.</p>${chapterLinks(conceptById('sm'))}`,'map-sm');
}
function hardware(){
 return `<section id="hardware-panel" class="map-panel" aria-label="Inside the GPU diagram"><h2>From the system to one thread</h2><p>Open the GPU, then an SM. Keep opening components to see blocks, warps and threads.</p><div class="map-machine">
${node('cpu','cpu','CPU','Host · runs your program',info('cpu')+concept('cpu-memory','host'),'map-cpu')}
<div class="map-transfer">Launches work<br>and copies data<span aria-hidden="true">⇄</span></div><div class="map-device">
${node('gpu','gpu','GPU','Device · open to find the SMs',`<p>A GPU contains many <strong>streaming multiprocessors (SMs)</strong>. Each can execute work from several blocks when resources allow.</p><div class="map-sms">${sm(0,['a','c'])}${sm(1,['b'])}</div><p class="map-note">Two SMs are shown. These boxes show relationships, not the chip’s physical layout.</p>${chapterLinks(conceptById('gpu'))}`,'map-gpu')}
<div class="map-connection"><span aria-hidden="true">↕</span> SMs read and write through a cache hierarchy</div>
${node('vram','gpu-memory','GPU memory / VRAM','Storage accessible by all SMs',info('gpu-memory')+concept('cache','memory')+concept('sectors','memory')+concept('tensor','memory',concept('shape','tensor')+concept('strides','tensor')+concept('dtype','tensor'))+concept('copy','memory'),'map-memory')}
</div></div><p class="map-note">Illustrative placement: three blocks of 64 threads on two SMs. Each block stays on one SM; several blocks may share it. This is a relationship map, not a schedule or a promise that every thread executes at once.</p></section>`;
}
export function renderThread(i){
 const b=Math.floor(i/4),t=i%4;
 return node(`op-thread-${i}`,'thread',`Thread ${i}`,i<5?`Input ${i+1} → output ${(i+1)*2}`:'No input · bounds check skips',
 `<p>Block ${b} × 4 threads per block + position ${t} = index ${i}.</p><p>${i<5?`Read input[${i}] = ${i+1} → multiply by 2 → write output[${i}] = ${(i+1)*2}.`:`Index ${i} is beyond the five inputs. The bounds check skips the read and write.`}</p>${chapterLinks(conceptById('thread'))}`,'map-thread');
}
function operation(){
 const vector=values=>`<div class="map-vector">${values.map(v=>`<span>${v}</span>`).join('')}</div>`;
 const grid=[0,1].map(b=>`<div class="map-launch-block"><h3>Block ${b}</h3><p>Thread positions 0–3</p>${Array.from({length:4},(_,t)=>renderThread(b*4+t)).join('')}</div>`).join('');
 const ai=concept('reduction','ai',concept('barrier','reduction'),'Combine many values into fewer results')+
 concept('matmul','ai',concept('reuse','matmul')+concept('tensor-cores','matmul',concept('dtype','matrix')),'Row × column → one output')+
 concept('attention','ai',concept('softmax','attention')+concept('fusion','attention'),'Queries and keys → scores → weights → weighted values')+
 concept('inference','ai',concept('kv-cache','inference')+concept('batch','inference')+concept('limits','inference'),'Prefill the context → decode new tokens');
 return `<section id="operation-panel" class="map-panel" aria-label="Follow an operation diagram"><h2>One operation, five results</h2><p>Keep the inputs and outputs in view as you open the work between them.</p>
<div class="map-flow"><div><span>Input x · GPU tensor</span>${vector([1,2,3,4,5])}</div><span class="map-arrow" aria-hidden="true">→</span><div class="map-expression"><span>PyTorch</span><code>y = x * 2</code></div><span class="map-arrow" aria-hidden="true">→</span><div><span>Result y · GPU tensor</span>${vector([2,4,6,8,10])}</div></div>
${node('operation','pytorch','What happens between x and y?','Follow the operation into GPU work',`<div class="map-stage"><h3>PyTorch selects an implementation</h3><p>Your operation and the tensor’s device, data type and layout help determine which implementation runs. This expression does not specify blocks or threads.</p>${chapterLinks(conceptById('pytorch'))}</div>
${node('launch','kernel','A kernel is launched','GPU function → grid of thread blocks',`<p>A <strong>kernel</strong> is a GPU function. Its launch specifies blocks of threads to execute it.</p><p class="map-note">The following blocks belong to the book’s <strong>handwritten CUDA example</strong>. They illustrate the same calculation; these are not PyTorch’s generated code or actual launch settings.</p>${node('op-grid','grid','Inspect the two blocks','Eight threads for five inputs',`<p>A <strong>grid</strong> is all the blocks in a launch. Here there are two blocks with four threads each. Each block has one partially filled warp; larger blocks can have several warps, as the hardware diagram shows.</p><div class="map-launch-grid">${grid}</div>${concept('divergence','launch','','What if lanes need different paths?')}`)}${chapterLinks(conceptById('kernel'))}`)}
<div class="map-stage"><h3>The result stays on the GPU</h3><p>The output tensor y holds the results. A copy to CPU memory is a separate action when the host needs those values.</p>${concept('copy','result')}</div>`)}
${node('ai-operations','pytorch','From this calculation to AI operations','Open the later chapters’ calculations and their connections',`<p>Other tensor operations use the same hardware with different calculations and data movement. Open an operation to see the mechanisms it uses.</p>${ai}`)}
<p class="map-note">This four-thread launch is a separate example from the 64-thread blocks in “Inside the GPU”. No PyTorch or CUDA code runs in this map, and it does not simulate timing.</p></section>`;
}
export function renderMap(){return `<div id="gpu-map">
<p>Start with the big picture, then open a component to look inside. These two diagrams keep the surrounding structure in view. Chapter links connect each concept to its explanation and experiment. No installation or GPU is required.</p><p><a href="../index.html" id="map-return">Return to course overview</a></p>
<nav class="map-jump" aria-label="Choose a diagram"><a href="#hardware-panel" data-map-view="hardware">1. Inside the GPU</a><a href="#operation-panel" data-map-view="operation">2. Follow an operation</a></nav>
<div class="map-tools map-enhancement" hidden><label for="map-chapter">Highlight concepts from<select id="map-chapter"><option value="">All chapters</option>${chapters.map((c,i)=>`<option value="${c.slug}">Chapter ${i+1}: ${escape(c.title)}</option>`).join('')}${['memory','kernel','shared-memory'].map(s=>`<option value="${s}">${chapterName(s)}</option>`).join('')}</select></label><div><button type="button" id="map-back" disabled>← Back one level</button><button type="button" id="map-reset">Reset diagram</button></div></div>
<p id="map-status" class="map-enhancement" role="status" hidden></p>
${hardware()}${operation()}
<details class="map-glossary" id="map-glossary"><summary>All concepts and connections · text reference</summary><p>Every concept and directed relationship is also available here.</p>${mapViews.map(view=>`<section><h2>${view.title}</h2>${mapConcepts.filter(c=>c.views[0]===view.id).map(c=>`<details id="concept-${c.id}"><summary>${escape(c.title)}</summary>${info(c.id)}<ul>${connections(c.id).map(e=>`<li><a href="#concept-${e.from}">${escape(conceptById(e.from).title)}</a> ${escape(e.label)} <a href="#concept-${e.to}">${escape(conceptById(e.to).title)}</a>.</li>`).join('')}</ul></details>`).join('')}</section>`).join('')}</details></div>`;}
