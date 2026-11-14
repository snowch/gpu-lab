// Copyright © 2026 Christopher Snow.
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {compaction} from '../src/parallel-models.mjs';
import {label as t,recordingDeck,writeRecordingDeck} from './recording-deck.mjs';
import scenes from '../content/compaction-scenes.json' with {type:'json'};
export function compactionRecordingFrame(stage){
 const r=compaction({predicate:['question','answer'].includes(stage)?'nonzero':'zero',order:['reverse','question','answer'].includes(stage)?'reverse':'forward'});
 return {result:r,question:stage==='question',state:stage==='scatter'?r.steps.find(s=>s.inputIndex===5):r.steps.at(-1)};
}
function row(values,y,title,focus=null){
 const cell=680/values.length;
 return t(360,y-20,title,'heading')+values.map((v,i)=>`<rect class="${i===focus?'active':'panel'}" x="${20+i*cell}" y="${y}" width="${cell-5}" height="54" rx="5"/>`+t(20+i*cell+(cell-5)/2,y+36,String(v==='Unwritten'?'?':v),'equation')+t(20+i*cell+(cell-5)/2,y+80,'Pos '+i,'coordinate')).join('');
}
export function compactionFigure(stage){
 const {result:r,state:s,question}=compactionRecordingFrame(stage),ids=r.input.map((_,i)=>i);
 if(stage==='inputs')return row(ids,55,'Input token identities')+row(r.input,210,'Categories: keep category 0')+row(r.flags,365,'Completed keep flags')+t(360,520,'Keep = 1 · skip = 0 · identities are not categories','caption');
 if(question)return row(r.input,55,'Input categories: keep category ≠ 0')+row(r.flags,220,'Keep flags')+t(360,385,'Output identities: ?','equation')+t(360,450,'Token 4 destination: ?','heading')+t(360,520,'Reverse write inspection · predict before comparison','caption');
 if(stage==='offsets')return row(r.flags,55,'Completed keep flags')+row(r.offsets,225,'Completed exclusive offsets',5)+t(360,405,`Token 5: flag ${r.flags[5]} → destination ${r.offsets[5]}`,'equation')+t(360,495,`Output count: ${r.offsets.at(-1)} + ${r.flags.at(-1)} = ${r.count}`,'heading');
 if(stage==='reverse'){
  const forward=compaction();
  return row(forward.output,70,'Forward inspection: completed output')+t(360,205,'Write destinations: '+forward.writes.join(' → '),'body')+row(r.output,315,'Reverse inspection: completed output')+t(360,455,'Write destinations: '+r.writes.join(' → '),'body')+t(360,525,'Equal identities and stable order · not a GPU schedule','caption');
 }
 if(stage==='scatter'){
  const cellIn=680/ids.length,cellOut=680/r.count,xIn=20+5*cellIn+(cellIn-5)/2,xOut=20+s.destination*cellOut+(cellOut-5)/2;
  return row(ids,55,'Input token identities',5)+t(360,225,`Token 5: flag 1 → offset ${s.destination}`,'heading')+`<path class="arrow" d="M${xIn} 250L${xOut} 320" marker-end="url(#arrow)"/>`+row(s.output,390,'Used output prefix so far',s.destination)+t(360,530,'? = unwritten · completed scan supplies unique destinations','caption');
 }
 return row(r.flags,55,'New selection: completed keep flags')+row(r.offsets,220,'Completed exclusive offsets',4)+row(r.output,385,'Completed stable token identities',r.offsets[4])+t(360,530,`Token 4 → destination ${r.offsets[4]} · ${r.count} output writes`,'caption');
}
export const compactionDeck=()=>recordingDeck({chapter:17,title:'Place surviving token identities with exclusive offsets',scenes,figure:compactionFigure,scope:'Completed flags and offsets before scatter · unique destinations · no GPU timing'});
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await writeRecordingDeck(process.argv[2]||'test-results/compaction-recording',compactionDeck(),scenes);
