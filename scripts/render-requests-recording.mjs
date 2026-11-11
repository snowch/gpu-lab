// Copyright © 2026 Christopher Snow.
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readTensor} from '../src/foundations-model.mjs';
import {label as t,value,recordingDeck,writeRecordingDeck} from './recording-deck.mjs';
import scenes from '../content/requests-scenes.json' with {type:'json'};
export const requestsRecordingData={row:readTensor(),column:readTensor({pattern:'column'}),packed:readTensor({pattern:'packed'}),rowOne:readTensor({index:1}),challenge:readTensor({index:3})};
export function requestsRecordingFrame(stage){return {source:requestsRecordingData[stage==='row-one'?'rowOne':['question','answer'].includes(stage)?'challenge':['column','packed'].includes(stage)?stage:'row'],revealed:!['warp','question'].includes(stage)};}
export function requestsFigure(stage){
 const {source:s,revealed}=requestsRecordingFrame(stage),load=s.load;
 if(stage==='sector')return t(360,40,'One sector = 32 bytes','heading')+t(360,83,'Eight FP32 positions · four bytes each','body')+Array.from({length:8},(_,i)=>{const x=42+i*80;return `<rect class="cell" x="${x}" y="144" width="76" height="90" rx="5"/>`+t(x+38,179,`${i*4}–${i*4+3}`,'number')+t(x+38,214,'bytes','caption');}).join('')+t(360,290,'Sector 0: bytes 0–31','equation')+t(360,365,'Sector 1: bytes 32–63','body')+t(360,413,'Sector 2: bytes 64–95','body')+t(360,497,'Region boundaries stay fixed when a view changes.','caption');
 const code=stage==='packed'?'x[:, 0].contiguous()':stage==='column'?'x[:, 0]':`x[${s.index}, :]`;
 let out=t(360,34,code,'heading')+t(360,73,'FP32 inputs · element offsets and byte positions are integers','caption');
 if(stage==='warp'){
  out+=Array.from({length:32},(_,i)=>{const x=40+(i%16)*40,y=110+Math.floor(i/16)*55;return `<rect class="${i<5?'active':'empty'}" x="${x}" y="${y}" width="36" height="40" rx="4"/>`+t(x+18,y+27,i<5?String(i):'–','caption');}).join('');
  return out+t(360,264,'Lanes 0–4: one input read each','heading')+t(360,314,'27 unused positions: no read','body')+s.values.map((v,i)=>{const x=48+i*127;return `<rect class="cell" x="${x}" y="363" width="119" height="85" rx="6"/>`+t(x+59.5,392,`Thread ${i}`,'caption')+t(x+59.5,430,value(v),'number');}).join('')+t(360,513,'Chosen thread mapping · not a physical chip diagram','caption');
 }
 const xs=[76,198,333,470,621],heads=['Thread','Value','Element offset','Byte position','Sector'];
 out+=heads.map((h,i)=>t(xs[i],120,h,'caption')).join('');
 out+=s.values.map((v,i)=>{const y=151+i*46;return `<rect class="panel" x="22" y="${y-25}" width="676" height="42" rx="5"/>`+[i,value(v),s.offsets[i],load.lanes[i].address,revealed?load.lanes[i].sector:'?'].map((v,j)=>t(xs[j],y,String(v),j===1?'number':'body')).join('');}).join('');
 if(!revealed)return out+t(360,430,'Which sector contains each byte position?','heading')+t(360,486,'Useful bytes: ? · sectors: ? · covered bytes: ?','body');
 out+=load.sectors.map((sector,i)=>{const width=660/load.sectors.length,x=30+i*width;return `<rect class="active" x="${x}" y="384" width="${width-8}" height="105" rx="7"/>`+t(x+(width-8)/2,415,`Sector ${sector.id}`,'heading')+t(x+(width-8)/2,445,`Bytes ${sector.startAddress}–${sector.startAddress+31}`,'caption')+t(x+(width-8)/2,474,`Threads ${sector.laneIds.join(', ')}`,'caption');}).join('');
 return out+t(360,534,`${load.usefulBytes} useful bytes · ${load.sectors.length} sector${load.sectors.length===1?'':'s'} · ${load.coveredBytes} covered bytes`,'body');
}
const notes={warp:'All five threads belong to the same warp.',sector:'Every named allocation starts at a 32-byte boundary.',row:'Useful bytes count requested FP32 values.',column:'A sector groups addresses, not tensor coordinates.',packed:'Copy construction and output stores are excluded.','row-one':'The original row-major storage has not moved.',question:'Pause before revealing the sector groups.',answer:'Sector coverage is not a measurement of DRAM traffic.'};
export const requestsDeck=()=>recordingDeck({chapter:5,title:'Group five reads into memory sectors',scenes:scenes.map(s=>({...s,note:notes[s.stage]})),figure:requestsFigure,scope:'Aligned allocations · one modelled input read · no cache or timing model'});
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await writeRecordingDeck(process.argv[2]||'test-results/requests-recording',requestsDeck(),scenes);
