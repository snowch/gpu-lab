// Copyright © 2026 Christopher Snow.
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {histogram} from '../src/parallel-models.mjs';
import {label as t,recordingDeck,writeRecordingDeck} from './recording-deck.mjs';
import scenes from '../content/histograms-scenes.json' with {type:'json'};
export function histogramsRecordingFrame(stage){return {result:histogram({distribution:['hot','question','answer'].includes(stage)?'hot':'mixed',strategy:['partials','question','answer'].includes(stage)?'private':'global'}),question:stage==='question',selected:stage==='atomic'?2:null};}
const box=(x,y,w,h,text,active=false)=>`<rect class="${active?'active':'panel'}" x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>`+t(x+w/2,y+h/2+8,String(text),'heading');
export function histogramsFigure(stage){
 const {result:r,question,selected}=histogramsRecordingFrame(stage);
 let out=t(360,28,'Token position → integer category ID','heading');
 out+=r.input.map((bin,i)=>t(43+i*89,72,'T'+i,'caption')+box(8+i*89,86,78,54,bin,i===selected)).join('');
 if(['partials','question','answer'].includes(stage)){
  out+=t(180,191,'Block 0 partial','heading')+t(540,191,'Block 1 partial','heading');
  out+=r.partial.map((p,b)=>p.map((count,bin)=>box(10+b*360+bin*88,216,80,55,question?'?':count)+t(50+b*360+bin*88,301,'Bin '+bin,'caption')).join('')).join('');
  out+=`<path class="arrow" d="M180 318L335 360" marker-end="url(#arrow)"/><path class="arrow" d="M540 318L385 360" marker-end="url(#arrow)"/>`+t(360,395,question?'How many non-zero partial bins?':`${r.globalUpdates} global atomic additions`,'equation');
  out+=t(360,445,question?'Predict before revealing the merge.':`Final counts: [${r.counts.join(', ')}]`,'heading');
  return out+t(360,505,question?'Include local updates, storage and barriers.':'8 local atomic additions · 2 four-thread blocks','caption');
 }
 out+=t(360,188,selected===null?'Final category counts':`Selected thread ${selected} → bin ${r.input[selected]} → atomic +1`,'heading');
 const counts=selected===null?r.counts:r.steps[selected].cells;
 out+=counts.map((count,bin)=>t(70,242+bin*58,'Bin '+bin,'heading')+Array.from({length:r.input.length},(_,i)=>`<rect class="${i<count?'active':'empty'}" x="${135+i*60}" y="${214+bin*58}" width="53" height="40" rx="4"/>`).join('')+t(665,242+bin*58,String(count),'equation')).join('');
 return out+t(360,496,selected===null?`${r.globalUpdates} global additions · counts sum to ${r.counts.reduce((a,b)=>a+b,0)}`:`Prefix through thread ${selected}: ${counts.reduce((a,b)=>a+b,0)} contributions`,'heading')+t(360,534,'Destinations and counts, not a GPU schedule or timing.','caption');
}
export const histogramsDeck=()=>recordingDeck({chapter:15,title:'Count token destinations without losing updates',scenes,figure:histogramsFigure,scope:'Integer category IDs · two four-thread blocks · model operation counts'});
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await writeRecordingDeck(process.argv[2]||'test-results/histograms-recording',histogramsDeck(),scenes);
