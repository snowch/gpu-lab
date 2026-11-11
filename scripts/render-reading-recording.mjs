// Copyright © 2026 Christopher Snow.
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readTensor} from '../src/foundations-model.mjs';
import {label as t,value,valuesRow,recordingDeck,writeRecordingDeck} from './recording-deck.mjs';
import scenes from '../content/reading-scenes.json' with {type:'json'};
export const readingRecordingData={row:readTensor(),column:readTensor({pattern:'column'}),rowOne:readTensor({index:1}),columnOne:readTensor({pattern:'column',index:1}),challenge:readTensor({pattern:'column',index:3})};
function grid(s,{x=48,y=140,cell=56,highlight=true}={}){
 return Array.from({length:5},(_,i)=>t(x+i*cell+(cell-4)/2,y-13,String(i),'coordinate')+t(x-20,y+i*cell+33,String(i),'coordinate')).join('')+
 s.matrix.map((v,i)=>`<rect class="${highlight&&s.sourceOffsets.includes(i)?'active':'cell'}" x="${x+(i%5)*cell}" y="${y+Math.floor(i/5)*cell}" width="${cell-4}" height="${cell-4}" rx="5"/>`+t(x+(i%5)*cell+(cell-4)/2,y+Math.floor(i/5)*cell+33,value(v),'number')).join('');
}
function selected(s,{results=false,question=false}={}){
 return t(444,112,'From [row,col]','caption')+t(537,112,'Input','caption')+t(640,112,'× 2 result','caption')+
 s.values.map((v,i)=>`<rect class="panel" x="378" y="${136+i*58}" width="326" height="50" rx="7"/>`+t(444,168+i*58,question?'?':`[${Math.floor(s.sourceOffsets[i]/5)},${s.sourceOffsets[i]%5}]`,'caption')+t(537,168+i*58,question?'?':value(v),'number')+t(640,168+i*58,results?value(s.output[i]):'?','number')).join('');
}
export function readingFigure(stage){
 const d=readingRecordingData;
 if(stage==='grid')return t(360,44,'x: five rows × five columns','heading')+grid(d.row,{x:190,y:108,cell:68,highlight:false})+t(360,503,'First coordinate: row · second coordinate: column','body');
 if(stage==='compare')return [d.rowOne,d.columnOne].map((s,i)=>`<rect class="panel" x="25" y="${78+i*194}" width="670" height="164" rx="12"/>`+t(360,119+i*194,i?'x[:, 1] · column 1':'x[1, :] · row 1','heading')+valuesRow(s.values,100,147+i*194,520)+t(360,219+i*194,`${s.values.length} selected inputs`,'caption')).join('')+t(360,503,'Same count · different coordinates','body');
 const question=stage==='question',answer=stage==='answer';
 const s=question||answer?d.challenge:stage.startsWith('column')?d.column:d.row;
 const expression=question||answer?'x[:, 3] * 2':stage==='column'?'x[:, 0]':stage==='column-result'?'x[:, 0] * 2':stage==='row'?'x[0, :]':'x[0, :] * 2';
 return t(360,44,expression,'heading')+t(182,87,'Original x','caption')+t(541,87,'Selected inputs → outputs','caption')+grid(s,{highlight:!question})+selected(s,{question,results:answer||stage.endsWith('result')})+
 t(360,489,question?'Which dimension is fixed? Which does the colon include?':`${s.values.length} selected inputs · ${s.values.length} output values`,'body')+t(360,531,'Read each [row, column] coordinate in the original x.','caption');
}
const notes={grid:'Indices start at 0; the floating-point values keep .0.',row:'Fix the row, then include every column.','row-result':'Follow each input to its own output.',column:'Include every row, then fix the column.','column-result':'The selection changes; the multiplier remains 2.',compare:'Inspect a second row and a second column.',question:'Pause before checking the next slide.',answer:'Return to Chapter 3 and change one selection at a time.'};
export const readingDeck=()=>recordingDeck({chapter:3,title:'Select tensor rows and columns',scenes:scenes.map(s=>({...s,note:notes[s.stage]})),figure:readingFigure,scope:'Logical tensor selections · no GPU timing model'});
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await writeRecordingDeck(process.argv[2]||'test-results/reading-recording',readingDeck(),scenes);
