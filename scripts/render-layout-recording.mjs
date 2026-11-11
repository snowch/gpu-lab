// Copyright © 2026 Christopher Snow.
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readTensor} from '../src/foundations-model.mjs';
import {label as t,value,recordingDeck,writeRecordingDeck} from './recording-deck.mjs';
import scenes from '../content/layout-scenes.json' with {type:'json'};
export const layoutRecordingData={row:readTensor(),rowOne:readTensor({index:1}),column:readTensor({pattern:'column'}),columnOne:readTensor({pattern:'column',index:1}),packed:readTensor({pattern:'packed',index:1}),challenge:readTensor({pattern:'column',index:3}),challengePacked:readTensor({pattern:'packed',index:3})};
export function layoutRecordingFrame(stage){
 const d=layoutRecordingData,challenge=['question','answer'].includes(stage);
 return {source:challenge?d.challenge:stage==='column-one'||stage==='packed'?d.columnOne:stage==='contiguous-row'?d.rowOne:stage==='row'||stage==='storage'?d.row:d.column,packed:challenge?d.challengePacked:stage==='packed'?d.packed:null,question:stage==='question'};
}
function storage(s,selected=s.sourceOffsets){
 return `<rect class="panel" x="64" y="89" width="592" height="224" rx="10"/>`+s.matrix.map((v,i)=>{
  const x=80+(i%10)*56,y=100+Math.floor(i/10)*70;
  return `<rect class="${selected.includes(i)?'active':'cell'}" x="${x}" y="${y}" width="52" height="52" rx="5"/>`+t(x+26,y+25,value(v),'number')+t(x+26,y+45,String(i),'coordinate');
 }).join('');
}
function packedStorage(s,question){
 return t(360,383,question?'New copy: predict its element offsets':'Packed copy in new storage','heading')+`<rect class="${question?'panel':'active'}" x="72" y="395" width="576" height="82" rx="10"/>`+
 s.values.map((v,i)=>{
  const x=88+i*108.8;
  return `<rect class="cell" x="${x}" y="407" width="104.8" height="56" rx="5"/>`+t(x+52.4,432,value(v),'number')+t(x+52.4,454,question?'?':String(s.offsets[i]),'coordinate');
 }).join('');
}
export function layoutFigure(stage){
 const {source:s,packed,question}=layoutRecordingFrame(stage);
 const code=stage==='storage'?'x: chosen row-major storage':stage==='row'?'x[0, :]':stage==='column'?'x[:, 0]':stage==='column-one'?'x[:, 1]':stage==='contiguous-row'?'x[1, :].contiguous()':stage==='packed'?'x[:, 1].contiguous()':'x[:, 3].contiguous()';
 const base=t(360,34,code,'heading')+t(360,75,'Large labels: values · small labels: element offsets','caption')+storage(s,stage==='storage'?[0]:s.sourceOffsets);
 if(packed)return base+'<path class="arrow" d="M360 324V353" marker-end="url(#arrow)"/>'+t(526,343,'Copy selected values','caption')+packedStorage(packed,question)+
  (question?t(360,527,'Predict the new offsets, stride and copied payload.','body'):t(360,509,`New stride: ${packed.stride}`,'heading')+t(360,542,`${packed.copyBytes} bytes of values copied`,'body'));
 const wrap=t(360,350,'Read left to right; wrapped lines continue the same array.','caption');
 if(stage==='storage')return base+wrap+t(360,428,`Value ${value(s.matrix[0])} is at element offset 0`,'equation')+t(360,494,`${s.matrix.length} FP32 values × 4 bytes = ${s.matrix.length*4} bytes`,'body');
 if(stage==='contiguous-row')return base+wrap+`<rect class="panel" x="40" y="388" width="640" height="125" rx="10"/>`+t(360,428,'Stride 1 · same x storage','heading')+t(360,474,'contiguous() can return this row without copying.','body')+t(360,540,`${s.copyBytes} bytes of values copied`,'caption');
 return base+wrap+t(360,404,`Element offsets: ${s.offsets.join(', ')}`,'body')+t(360,452,`Byte offsets: ${s.offsets.map(i=>i*4).join(', ')}`,'body')+t(360,515,`Stride ${s.stride} element${s.stride===1?'':'s'} = ${s.byteStride} bytes`,'equation');
}
const notes={storage:'The strip wraps for display; storage order continues.',row:'A view uses existing values without moving them.',column:'Selecting a column preserves the original positions.','column-one':'The starting offset and the stride are different quantities.',packed:'This column needs new storage to become contiguous.','contiguous-row':'Contiguous describes value order, not storage ownership.',question:'Pause before checking the new copy’s positions.',answer:'Return to Chapter 4 and explain the view/copy distinction.'};
export const layoutDeck=()=>recordingDeck({chapter:4,title:'Follow tensor views into memory',scenes:scenes.map(s=>({...s,note:notes[s.stage]})),figure:layoutFigure,scope:'Chosen FP32 row-major layout · no timing model'});
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await writeRecordingDeck(process.argv[2]||'test-results/layout-recording',layoutDeck(),scenes);
