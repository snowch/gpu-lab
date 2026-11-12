// Copyright © 2026 Christopher Snow.
// Build slide figures from the chapter's numerical engine; no GPU timings.
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {reduceBlock} from '../src/ai-models.mjs';
import {escape} from '../src/continuation-ui.mjs';
import scenes from '../content/reduction-scenes.json' with {type:'json'};
const safe=reduceBlock({size:4}),unsafe=reduceBlock({size:4,synchronised:false}),eight=reduceBlock({size:8});
const value=n=>n===null?'Unwritten':n.toFixed(1);
const xs=[96,272,448,624];
function box(x,y,width,heading,body,{active=false,danger=false,small=false}={}){
  return `<g class="${danger?'danger':active?'active':'neutral'}"><rect x="${x-width/2}" y="${y}" width="${width}" height="80" rx="10"/><text class="label" x="${x}" y="${y+25}">${heading}</text><text class="${small?'small':'number'}" x="${x}" y="${y+59}">${body}</text></g>`;
}
const arrow=(x1,y1,x2,y2,danger=false)=>`<path class="edge${danger?' bad':''}" d="M ${x1} ${y1} C ${x1} ${(y1+y2)/2}, ${x2} ${(y1+y2)/2}, ${x2} ${y2}" marker-end="url(#${danger?'bad':'arrow'})"/>`;
function memory(event,{hazard=false}={}){
  return `<text class="row-title" x="16" y="28">BLOCK'S SHARED MEMORY · FOUR FP32 WORDS</text>`+event.shared.map((n,i)=>box(xs[i],48,154,`Word ${i}`,value(n),{active:n!==null,danger:hazard&&i===2,small:n===null})).join('');
}
function inputs(){return `<text class="row-title" x="16" y="211">ONE INPUT PER THREAD</text>`+safe.inputs.map((n,i)=>box(xs[i],235,154,`Thread ${i}`,value(n))).join('');}
function gate(size=4,question=false){
 const positions=Array.from({length:size},(_,i)=>48+i*(624/(size-1)));
 return `<text class="row-title" x="16" y="217">ALL ${size} THREADS REACH THE SAME BLOCK BARRIER</text>`+
 positions.map((x,i)=>`<text class="label" x="${x}" y="257">T${i}</text>${question?'':arrow(x,269,x,325)}`).join('')+
 `<rect class="barrier" x="16" y="330" width="688" height="53" rx="9"/><text class="barrier-text" x="360" y="364">Block barrier · all ${size} threads</text><text class="footnote" x="360" y="427">Preceding shared writes → subsequent partner reads</text>`;
}
function tree(final=false){
 const pairs=safe.levels[1],sum=safe.levels[2][0],p=[184,536];
 return `<text class="row-title" x="16" y="205">INPUT INDICES TRACK EACH CONTRIBUTION</text>`+
 safe.inputs.map((n,i)=>box(xs[i],225,150,`Input ${i}`,value(n))).join('')+
 pairs.map((n,i)=>n.threads.map(j=>arrow(xs[j],305,p[i],350)).join('')+box(p[i],350,232,`Thread ${i} · inputs ${n.threads.join(', ')}`,value(n.value),{active:!final})).join('')+
 (final?pairs.map((n,i)=>arrow(p[i],430,360,474)).join('')+box(360,474,294,`Thread 0 · inputs ${sum.threads.join(', ')}`,value(sum.value),{active:true}):'');
}
export function reductionFigure(stage){
 const event=stage==='first-write'?safe.trace[0]:['inputs','writes','initial-barrier'].includes(stage)?safe.trace[3]:['pairs','stage-barrier'].includes(stage)?safe.trace[5]:stage==='sum'?safe.trace[6]:stage==='hazard'?unsafe.trace[1]:unsafe.trace.at(-1);
 let body='';
 if(stage==='inputs')body=inputs()+`<text class="footnote" x="360" y="405">Combine four values into one result.</text>`;
 else if(['first-write','writes'].includes(stage))body=memory(event)+inputs()+safe.inputs.map((_,i)=>stage==='first-write'&&i!==0?'':arrow(xs[i],235,xs[i],136)).join('');
 else if(stage==='initial-barrier'||stage==='stage-barrier')body=memory(event)+gate();
 else if(stage==='pairs'||stage==='sum')body=memory(event)+tree(stage==='sum');
 else if(stage==='hazard')body=memory(event,{hazard:true})+box(96,248,154,'Thread 0','Read word 2',{danger:true,small:true})+arrow(115,248,448,138,true)+`<text class="warning" x="360" y="390">Unwritten partner read · no numeric result</text><text class="footnote" x="360" y="435">One diagnostic interleaving; other orders are possible.</text>`;
 else if(stage==='late-write')body=memory(event)+`<text class="warning" x="360" y="264">The earlier read is still invalid.</text><text class="footnote" x="360" y="314">Writing word 2 later cannot repair it.</text><text class="footnote" x="360" y="364">A barrier only after the read is too late.</text><text class="footnote" x="360" y="426">Racy program → no numeric result assigned</text>`;
 else if(stage==='question'||stage==='answer')body=gate(8,stage==='question')+`<text class="row-title" x="16" y="35">EIGHT INPUTS · ONE BLOCK · PARTNER DISTANCE ${eight.size/2}</text>`+eight.inputs.map((n,i)=>box(48+i*(624/7),63,78,`Input ${i}`,value(n),{active:i<4})).join('')+`<text class="footnote" x="360" y="166">${stage==='answer'?`Thread 1 reads word ${1+eight.size/2} after Thread ${1+eight.size/2} writes it.`:'Thread 1 reads word 5. Which write must come first?'}</text>`;
 if(stage==='question')body=body.replace('ALL 8 THREADS REACH THE SAME BLOCK BARRIER','ONLY THREADS 0–3 ADD IN THE FIRST STAGE').replace('Block barrier · all 8 threads','Block barrier · how many threads?').replace('Preceding shared writes → subsequent partner reads','Pause and explain both answers.');
 return `<svg viewBox="0 0 720 580" role="img" aria-label="${escape(scenes.find(s=>s.stage===stage).lead)}"><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="#328774"/></marker><marker id="bad" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="#b44a35"/></marker></defs>${body}</svg>`;
}
const notes={inputs:'PyTorch chooses its implementation. This is a separate teaching algorithm.','first-write':'Snapshot after one input write. Unwritten is not zero.',writes:'Inspection order is not a promised thread execution order.','initial-barrier':'The initial barrier orders input writes before partner reads.',pairs:'Partner distance 2 · the partial sums contain disjoint input sets.','stage-barrier':'Threads without an addition still reach the block barrier.',sum:'Dependency arrows are not a hardware timing diagram.',hazard:'Do not invent a numeric result for a data race.','late-write':'Correctness requires ordering before the read.',question:'Pause the video before checking the next slide.',answer:'Return to Chapter 9 → extend the synchronised tree to eight inputs.'};
export function reductionDeck(){return `<!doctype html><html lang="en-GB"><meta charset="utf-8"><title>Shared memory and barriers · GPU Lab</title><style>
@font-face{font-family:Plex;src:url('../../assets/fonts/plex-sans.woff2')}
*{box-sizing:border-box}body{margin:0;font-family:Plex,Arial,sans-serif;color:#183d3d;background:#f7faf7}.slide{width:1280px;height:720px;padding:35px 48px 24px;break-after:page;position:relative;overflow:hidden}.mast{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #cbded5;padding-bottom:17px;font-size:14px;color:#53736e}.brand{font-weight:700;color:#185f51;font-size:22px}.main{display:grid;grid-template-columns:342px 1fr;gap:32px;padding-top:32px}.eyebrow{font-size:13px;font-weight:600;letter-spacing:1.3px;text-transform:uppercase;color:#297765;margin:0 0 18px}h1{font-size:39px;line-height:1.12;margin:0 0 24px;font-weight:600;letter-spacing:-1px}.lead{font-size:23px;line-height:1.45;margin:0}.note{font-size:17px;line-height:1.5;border-left:3px solid #a6cbb9;padding-left:15px;margin-top:30px;color:#40685e}.figure{border:1px solid #cbded5;border-radius:16px;background:#edf5ef;padding:12px 8px;height:568px}svg{width:100%;height:100%}svg text{text-anchor:middle;fill:#183d3d;font-family:Plex,Arial,sans-serif}.row-title{text-anchor:start;font-size:12px;letter-spacing:1px;font-weight:600;fill:#53736e}.label{font-size:14px;font-weight:500}.number{font-size:29px;font-weight:600}.small{font-size:18px}.neutral rect{fill:#fff;stroke:#c7d9cf}.active rect{fill:#d9eee1;stroke:#328774;stroke-width:2}.danger rect{fill:#fff0e8;stroke:#b44a35;stroke-width:2}.edge{fill:none;stroke:#328774;stroke-width:2.5}.edge.bad{stroke:#b44a35}.barrier{fill:#185f51}.barrier-text{fill:white;font-size:21px;font-weight:600}.footnote{font-size:18px;fill:#40685e}.warning{font-size:24px;fill:#a43e2c;font-weight:600}.footer{position:absolute;bottom:17px;left:48px;right:48px;display:flex;justify-content:space-between;font-size:12px;color:#53736e}@page{size:1280px 720px;margin:0}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.slide:last-child{break-after:auto}}
</style>${scenes.map((s,i)=>`<section class="slide" id="${s.id}"><header class="mast"><span class="brand">▦ GPU Lab</span><span>CHAPTER 9 · SHARED MEMORY AND BARRIERS</span></header><div class="main"><div><p class="eyebrow">${i<7?'The synchronised tree':i<9?'The missing dependency':'Try a new case'} · ${i+1} / ${scenes.length}</p><h1>${escape(s.title)}</h1><p class="lead">${escape(s.lead)}</p><p class="note">${escape(notes[s.stage])}</p></div><div class="figure">${reductionFigure(s.stage)}</div></div><footer class="footer"><span>Conceptual teaching model · no GPU timing or compiler trace</span><span>Copyright © 2026 Christopher Snow</span></footer></section>`).join('')}</html>`;}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const output=process.argv[2]||'test-results/reduction-recording';await mkdir(output,{recursive:true});
 await writeFile(`${output}/deck.html`,reductionDeck());
 const cues=scenes.flatMap(scene=>scene.captions.map((text,i)=>({id:`${scene.id}-c${i+1}`,step:scene.title,text})));
 await writeFile(`${output}/scenes.json`,JSON.stringify(cues,null,2));
 console.log(`Rendered ${scenes.length} model-derived slides and ${cues.length} narration cues in ${output}`);
}
