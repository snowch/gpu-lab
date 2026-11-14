// Copyright © 2026 Christopher Snow.
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {scan} from '../src/parallel-models.mjs';
import {label as t,recordingDeck,writeRecordingDeck} from './recording-deck.mjs';
import scenes from '../content/scan-scenes.json' with {type:'json'};
export function scanRecordingFrame(stage){
 const small=['question','answer'].includes(stage),r=scan({size:small?'4':'8',kind:['exclusive','answer'].includes(stage)?'exclusive':'inclusive'});
 const index=stage==='distance1'?1:stage==='distance2'?2:stage==='flags'||stage==='question'?0:r.steps.length-1;
 return {result:r,state:r.steps[index],question:stage==='question',small,focus:stage==='exclusive'?5:3};
}
function row(values,y,title,focus=null){
 const cell=680/values.length;
 return t(360,y-20,title,'heading')+values.map((v,i)=>`<rect class="${(Array.isArray(focus)?focus.includes(i):i===focus)?'active':'panel'}" x="${20+i*cell}" y="${y}" width="${cell-5}" height="57" rx="5"/>`+t(20+i*cell+(cell-5)/2,y+37,String(v),'equation')+t(20+i*cell+(cell-5)/2,y+83,'Pos '+i,'coordinate')).join('');
}
export function scanFigure(stage){
 const {result:r,state:s,question,focus}=scanRecordingFrame(stage);
 let out=row(r.input,65,'Input flags',stage==='exclusive'?focus:null);
 if(question)return out+t(360,225,'Partner distances: ?','equation')+t(360,305,'Exclusive offsets: ?','equation')+t(360,385,'Last offset + last flag = ?','heading')+t(360,485,'Which selected positions write?','heading');
 if(stage==='flags')return out+t(360,244,'Inclusive: include the current flag','heading')+t(360,312,'Exclusive: count only earlier flags','heading')+t(360,408,'One prefix total for every input position','body')+t(360,505,'Integer flags · one block · no GPU timing','caption');
 const partner=s.shift?focus-1:focus-s.distance,cell=680/r.input.length,x=i=>20+i*cell+(cell-5)/2;
 out+=row(s.before??r.input,230,s.shift?'Completed inclusive prefixes':'Completed previous snapshot',s.shift?[partner]:[focus,partner]);
 if(!s.shift)out+=`<path class="arrow" d="M${x(focus)} 318L${x(focus)} 355" marker-end="url(#arrow)"/>`;
 out+=`<path class="arrow" d="M${x(partner)} 318L${x(focus)-8} 355" marker-end="url(#arrow)"/>`;
 if(s.shift)out+=t(x(0),365,'Insert 0','caption');
 out+=row(s.cells,415,s.shift?'Exclusive offsets':`New snapshot · distance ${s.distance}`,focus);
 if(stage==='exclusive')out+=t(360,518,`Position ${focus}: inclusive ${r.inclusive[focus]} → exclusive ${r.values[focus]}`,'caption');
 return out+t(360,540,s.shift?`Output length: ${r.values.at(-1)} + ${r.input.at(-1)} = ${r.values.at(-1)+r.input.at(-1)}`:`Position 3: ${s.before[3]} + ${s.before[3-s.distance]} = ${s.cells[3]}`,'caption');
}
export const scanDeck=()=>recordingDeck({chapter:16,title:'Build output positions from prefix sums',scenes,figure:scanFigure,scope:'Snapshot-ordered integer scan · one block · dependency stages, not GPU cycles'});
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await writeRecordingDeck(process.argv[2]||'test-results/scan-recording',scanDeck(),scenes);
