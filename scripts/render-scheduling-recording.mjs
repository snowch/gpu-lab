// Copyright © 2026 Christopher Snow.
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {scheduleWarps} from '../src/architecture.mjs';
import {label as t,recordingDeck,writeRecordingDeck} from './recording-deck.mjs';
import scenes from '../content/scheduling-scenes.json' with {type:'json'};
export const schedulingRecordingData={single:scheduleWarps({warps:1,latency:6}),two:scheduleWarps({warps:2,latency:6}),four:scheduleWarps({warps:4,latency:6}),challenge:scheduleWarps({warps:2,latency:3})};
export function schedulingRecordingFrame(stage){const challenge=['question','answer'].includes(stage),source=schedulingRecordingData[challenge?'challenge':stage==='single'?'single':'two'],cycle=stage==='single'?1:stage==='other'?1:stage==='idle'?2:stage==='ready'?6:challenge?3:0;return {source,cycle,event:source.trace[cycle],latency:challenge?3:6,question:stage==='question'};}
function timeline(source,current,question=false){
 const events=source.trace.slice(0,question?4:8);
 return t(360,125,'One issue slot per cycle · W0 = warp 0','caption')+events.map((e,i)=>{const x=25+i*84,hidden=question&&i>=2;return `<rect class="${i===current&&!question?'active':'panel'}" x="${x}" y="147" width="78" height="86" rx="6"/>`+t(x+39,173,`Cycle ${e.cycle}`,'caption')+t(x+39,201,hidden?'?':e.selected===null?'idle':`W${e.selected} ${e.instruction}`,'caption')+t(x+39,223,hidden?'predict':e.selected===null?'no issue':'issued','coordinate');}).join('');
}
export function schedulingFigure(stage){
 const {source,cycle,event,latency,question}=schedulingRecordingFrame(stage);
 const head=t(360,35,'LD → MUL → ST → LD → MUL → ST','heading');
 if(stage==='program')return head+['Load input','Multiply register value','Store result'].map((text,i)=>{const y=127+i*124;return `<rect class="panel" x="67" y="${y}" width="586" height="84" rx="9"/>`+t(360,y+48,text,'heading')+(i<2?`<path class="arrow" d="M360 ${y+89}v26" marker-end="url(#arrow)"/>`:'');}).join('')+t(360,531,'Registers hold each thread’s working values.','caption');
 if(stage==='compare')return head+t(360,87,'Same latency: 6 model cycles','body')+t(120,148,'Resident warps','caption')+t(300,148,'Issued','caption')+t(450,148,'Idle slots','caption')+t(606,148,'Total cycles','caption')+[schedulingRecordingData.single,schedulingRecordingData.two,schedulingRecordingData.four].map((s,i)=>{const y=190+i*94;return `<rect class="panel" x="25" y="${y-30}" width="670" height="76" rx="8"/>`+t(120,y+17,String([1,2,4][i]),'equation')+t(300,y+17,String(s.issued),'equation')+t(450,y+17,String(s.idle),'equation')+t(606,y+17,String(s.cycles),'equation');}).join('')+t(360,487,'Each additional warp adds six instructions.','body')+t(360,534,'Different total work: these times are not a speedup.','caption');
 let out=head+t(360,80,`${event.before.length} resident warp${event.before.length===1?'':'s'} · load latency ${latency} model cycles`,'body')+timeline(source,cycle,question);
 if(question)return out+t(360,294,'Warp 0 load starts: cycle 0','heading')+t(360,343,'Warp 1 load starts: cycle 1','heading')+t(360,424,'Cycle 2: idle or an instruction?','body')+t(360,476,'Cycle 3: which warp is ready?','body');
 out+=t(360,280,`State before issue at cycle ${cycle}`,'heading');
 out+=event.before.map((w,i)=>{const x=event.before.length===1?165:35+i*335,width=event.before.length===1?390:315;return `<rect class="${event.selected===i?'active':'panel'}" x="${x}" y="303" width="${width}" height="143" rx="9"/>`+t(x+width/2,337,`Warp ${i}: ${w.status}`,'heading')+t(x+width/2,379,`Next: ${source.program[w.pc]||'done'}`,'body')+t(x+width/2,417,`Ready at cycle ${w.readyAt}`,'caption');}).join('');
 return out+t(360,500,event.selected===null?'Idle: no unfinished warp is ready':`Issue warp ${event.selected}: ${event.instruction}`,'equation')+t(360,540,stage==='answer'?'Warp 1 becomes ready at cycle 4.':'Pre-issue state · round-robin ready-warp selection','caption');
}
const notes={program:'Chosen instruction stream; tensor values are outside this model.',single:'At most one instruction starts per cycle.',other:'Resident warps share execution hardware.',idle:'Waiting and completed warps are skipped.',ready:'Cards show state before issue.',compare:'Final store issue ends the model; no store-drain wait.',question:'Apply load start + latency, then pause.',answer:'Model cycles are not elapsed GPU measurements.'};
export const schedulingDeck=()=>recordingDeck({chapter:7,title:'Choose a ready warp while another waits',scenes:scenes.map(s=>({...s,note:notes[s.stage]})),figure:schedulingFigure,scope:'Single-issue teaching scheduler · fixed latency · all warps initially resident'});
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await writeRecordingDeck(process.argv[2]||'test-results/scheduling-recording',schedulingDeck(),scenes);
