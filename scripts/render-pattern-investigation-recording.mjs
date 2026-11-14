// Copyright © 2026 Christopher Snow.
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {routing} from '../src/parallel-models.mjs';
import {label as t,recordingDeck,writeRecordingDeck} from './recording-deck.mjs';
import scenes from '../content/pattern-investigation-scenes.json' with {type:'json'};
export function investigationRecordingFrame(stage){
 const result=routing({distribution:['question','answer'].includes(stage)?'hot':'mixed',goal:stage==='contract'?'counts':'group'});
 return {result,state:stage==='placement'?result.steps[5]:result.steps.at(-1),question:stage==='question'};
}
function row(values,y,title,focus=null,positions=true){
 const cell=680/values.length;
 return t(360,y-20,title,'heading')+values.map((v,i)=>`<rect class="${i===focus?'active':'panel'}" x="${20+i*cell}" y="${y}" width="${cell-5}" height="54" rx="5"/>`+t(20+i*cell+(cell-5)/2,y+36,String(v==='Unwritten'?'?':v),'equation')+(positions?t(20+i*cell+(cell-5)/2,y+80,(values.length===4?'Bin ':'Pos ')+i,'coordinate'):'')).join('');
}
export function investigationFigure(stage){
 const {result:r,state:s,question}=investigationRecordingFrame(stage),ids=r.input.map((_,i)=>i);
 if(stage==='contract')return row(ids,55,'Input token identities')+row(r.input,220,'Input categories')+row(r.counts,385,'Counts only: no offsets, ranks or scatter')+t(360,530,'Grouping requests identities and order in addition to counts','caption');
 if(question)return row(ids,65,'Input token identities')+row(r.input,245,'New input categories: every token in category 0')+t(360,440,'Bin starts and stable output identities: ?','heading')+t(360,525,'Do unique atomic arrival slots prove stable order?','caption');
 if(stage==='regions')return row(r.counts,55,'Completed category counts')+row(r.offsets,225,'Completed exclusive bin starts')+t(360,405,`Bin 1: start ${r.offsets[1]} · ${r.counts[1]} output slots`,'equation')+t(360,495,'Each start counts tokens in earlier categories','heading');
 if(stage==='placement')return row(r.input,55,'Input categories',s.inputIndex)+t(360,225,`Token ${s.inputIndex}: bin ${s.bin} start ${s.binStart} + rank ${s.rank} → slot ${s.destination}`,'heading')+row(s.output,355,'Output identities so far',s.destination)+t(360,510,'? means not written · counts, starts and ranks are complete','caption');
 if(stage==='complete'){
  const bins=r.counts.flatMap((n,b)=>Array(n).fill(b));
  return row(r.output,65,'Completed token identities')+row(bins,245,'Category of each output token')+t(360,425,`${r.writes} unique destinations · ${r.writes} scatter writes`,'heading')+t(360,505,'Check conservation, category order and within-bin stability','caption');
 }
 return row(r.counts,55,'New completed category counts')+row(r.offsets,225,'Exclusive bin starts: empty bins use no slots')+row(r.output,395,'Completed stable token identities')+t(360,540,'Within-category ranks still determine stable destinations','caption');
}
export const investigationDeck=()=>recordingDeck({chapter:20,title:'Combine counts, bin starts and ranks for stable token grouping',scenes,figure:investigationFigure,scope:'Local token placement and output contracts · no GPU timing or fastest algorithm'});
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await writeRecordingDeck(process.argv[2]||'test-results/pattern-investigation-recording',investigationDeck(),scenes);
