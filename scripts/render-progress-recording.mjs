// Copyright © 2026 Christopher Snow.
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {philosophers,barrier} from '../src/parallel-models.mjs';
import {label as t,recordingDeck,writeRecordingDeck} from './recording-deck.mjs';
import scenes from '../content/progress-scenes.json' with {type:'json'};
const names=['A','B','C'];
export function progressRecordingFrame(stage){
 const result=philosophers({policy:stage==='cycle'?'cycle':'ordered'});
 const state=stage==='ordered'?result.steps.find(s=>s.held[1].length===2):result.steps.at(-1);
 return {result,state,valid:barrier(),invalid:barrier({participation:'subset'}),question:stage==='question'};
}
function cards(values,y,title){return t(360,y-22,title,'heading')+values.map((v,i)=>`<rect class="panel" x="${20+i*230}" y="${y}" width="210" height="110" rx="8"/>`+t(125+i*230,y+38,v[0],'heading')+t(125+i*230,y+80,v[1],'body')).join('');}
function participation(r,y,title){const s=r.steps.at(-1);return t(360,y-25,title,'heading')+s.cells.map((v,i)=>`<rect class="${v==='Skipped'?'empty':'active'}" x="${20+i*172}" y="${y}" width="164" height="80" rx="7"/>`+t(102+i*172,y+30,'Thread '+i,'body')+t(102+i*172,y+62,v==='May continue'?'May continue':v,'body')).join('');}
export function progressFigure(stage){
 const {result:r,state:s,valid,invalid,question}=progressRecordingFrame(stage);
 if(stage==='resources')return cards(r.wanted.map((w,i)=>[names[i],`Needs ${w.join(' and ')}`]),80,'Required forks')+t(360,280,'Lower number → higher number','equation')+t(360,370,'Acquire both → eat once → release both','heading')+t(360,480,'Chosen round-robin opportunities · not a hardware schedule','caption');
 if(stage==='ordered'||stage==='cycle')return cards(s.forks.map((owner,i)=>['Fork '+i,owner===null?'Free':'Owner '+names[owner]]),50,'Exclusive ownership')+cards(s.held.map((held,i)=>[names[i],held.length===2?'Both held; can eat':'Holds '+(held.join(', ')||'none')]),240,'Philosopher state')+s.waits.map((w,i)=>t(360,410+i*42,`${names[w.from]} → fork ${w.fork} → owner ${names[w.to]}`,'heading')).join('')+(stage==='ordered'?t(360,520,'B can finish → release forks → unblock A','caption'):'');
 if(stage==='barriers')return participation(valid,65,'Matching barrier: four required arrivals')+t(360,210,'4 of 4 → block may continue','heading')+participation(invalid,310,'Diagnostic: no early exits')+t(360,455,'2 of 4 → invalid participation','heading')+t(360,520,'No arithmetic output · no guaranteed hardware failure mode','caption');
 if(question)return cards([['Resident A','Waits for B’s flag'],['Capacity','1 block'],['Pending B','Must set the flag']],100,'Chosen ordinary-block capacity')+t(360,310,'A needs B → B needs the occupied slot','heading')+t(360,415,'Does resource order solve this wait?','heading')+t(360,510,'Predict before the comparison','caption');
 return t(360,65,'A holds capacity while waiting for B','heading')+t(360,130,'Resource order does not schedule B','body')+`<rect class="active" x="50" y="225" width="250" height="100" rx="8"/><rect class="panel" x="420" y="225" width="250" height="100" rx="8"/><path class="arrow" d="M305 275H410" marker-end="url(#arrow)"/>`+t(175,266,'Producer kernel','heading')+t(175,300,'Completes its outputs','caption')+t(545,266,'Consumer kernel','heading')+t(545,300,'Uses producer results','caption')+t(360,390,'Appropriate stream dependency orders phases','heading')+t(360,475,'A block barrier is not a grid barrier','body')+t(360,525,'No simultaneous-residency or GPU timing claim','caption');
}
export const progressDeck=()=>recordingDeck({chapter:18,title:'Distinguish resource waits, barriers and scheduling dependencies',scenes,figure:progressFigure,scope:'Chosen ownership and participation examples · not GPU scheduling or timing'});
const speechText=text=>text.replace(/\b(?:Block A|A holds|A can|A now|A is|for A)\b/g,phrase=>phrase.replace(/\bA\b/,'[A](/ˈeɪ/)'));
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await writeRecordingDeck(process.argv[2]||'test-results/progress-recording',progressDeck(),scenes,speechText);
