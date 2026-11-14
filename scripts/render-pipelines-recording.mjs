// Copyright © 2026 Christopher Snow.
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {pipeline} from '../src/parallel-models.mjs';
import {label as t,recordingDeck,writeRecordingDeck} from './recording-deck.mjs';
import scenes from '../content/pipelines-scenes.json' with {type:'json'};
export function pipelinesRecordingFrame(stage){
 const copy=['question','answer'].includes(stage)?'4':'2',result=pipeline({mode:stage==='serial'?'serial':'pipeline',copy});
 return {result,state:result.steps[2],axis:pipeline({copy}).span,question:stage==='question'};
}
function box(x,y,width,title,detail){return `<rect class="panel" x="${x}" y="${y}" width="${width}" height="90" rx="8"/>`+t(x+width/2,y+35,title,'heading')+t(x+width/2,y+68,detail,'body');}
export function pipelinesFigure(stage){
 const {result:r,state:s,axis,question}=pipelinesRecordingFrame(stage);
 if(stage==='contract')return box(160,35,400,'Copy inputs','Ready follows copy completion')+`<path class="arrow" d="M360 130V195" marker-end="url(#arrow)"/>`+box(160,205,400,'Consume inputs','Consumed follows the actual kernel')+`<path class="arrow" d="M360 300V365" marker-end="url(#arrow)"/>`+box(160,375,400,'Reuse the same slot','Next copy waits for consumed')+t(360,525,'References keep storage allocated; dependencies order its use','caption');
 if(question)return box(30,65,200,'4 chunks','Two slots')+box(260,65,200,'Copy: 4','Time units')+box(490,65,200,'Compute: 3','Time units')+t(360,285,'Completion total: ?','equation')+t(360,370,'Engine setting the pace: ?','heading')+t(360,450,'Chunk 2 copy start: ?','heading')+t(360,525,'Allow overlap · preserve ready and consumed dependencies','caption');
 if(stage==='handoffs')return box(30,45,300,`Copy engine free: ${s.copyReady}`,`Slot 0 free: ${s.slotReady}`)+box(390,45,300,`Copy: ${s.copyStart}–${s.copyEnd}`,`Ready at ${s.copyEnd}`)+`<path class="arrow" d="M335 90H380" marker-end="url(#arrow)"/>`+box(30,240,300,`Input ready: ${s.copyEnd}`,`Compute queue free: ${s.computeReady}`)+box(390,240,300,`Compute: ${s.computeStart}–${s.computeEnd}`,`Consumed at ${s.computeEnd}`)+`<path class="arrow" d="M335 285H380" marker-end="url(#arrow)"/>`+t(360,445,`Slot 0 cannot be overwritten before ${s.computeEnd}`,'heading')+t(360,520,'Event waits order queued work; the CPU need not wait','caption');
 const x=time=>115+time/axis*570,bar=(e,y,start,end)=>`<rect class="${e.chunk===2?'active':'panel'}" x="${x(start)}" y="${y}" width="${x(end)-x(start)}" height="52" rx="4"/>`+t((x(start)+x(end))/2,y+35,String(e.chunk),'heading');
 return t(360,30,'Complete schedule · bar number = chunk ID','heading')+['Copy','Compute','Slot 0','Slot 1'].map((name,i)=>t(55,132+i*86,name,'body')).join('')+r.events.map(e=>bar(e,100,e.copyStart,e.copyEnd)+bar(e,186,e.computeStart,e.computeEnd)+bar(e,272+e.slot*86,e.copyStart,e.computeEnd)).join('')+Array.from({length:axis/2+1},(_,i)=>t(x(i*2),455,String(i*2),'coordinate')).join('')+t(360,495,`Completion: ${r.span} synthetic time units`,'heading')+t(360,535,stage==='answer'?`Chunk 2: engine free ${s.copyReady} · slot free ${s.slotReady} → copy starts ${s.copyStart}`:'Same 0–20 axis · slot bars end only after consumption','caption');
}
export const pipelinesDeck=()=>recordingDeck({chapter:19,title:'Order copy, compute and buffer reuse before expecting overlap',scenes,figure:pipelinesFigure,scope:'Synthetic durations and two reusable slots · no GPU timing or speedup claim'});
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await writeRecordingDeck(process.argv[2]||'test-results/pipelines-recording',pipelinesDeck(),scenes);
