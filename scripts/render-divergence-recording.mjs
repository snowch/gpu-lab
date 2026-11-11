// Copyright © 2026 Christopher Snow.
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {branchWarp} from '../src/architecture.mjs';
import {label as t,value,recordingDeck,writeRecordingDeck} from './recording-deck.mjs';
import scenes from '../content/divergence-scenes.json' with {type:'json'};
export const divergenceRecordingData={uniform:branchWarp({pattern:'positive',negativeOps:1}),mixed:branchWarp({pattern:'alternating',negativeOps:1}),rare:branchWarp({pattern:'one-negative',negativeOps:3}),tail:branchWarp({pattern:'positive',activeLanes:5,negativeOps:1}),mixedTail:branchWarp({pattern:'alternating',activeLanes:5,negativeOps:1}),challenge:branchWarp({pattern:'halves',activeLanes:17,negativeOps:3})};
export function divergenceRecordingFrame(stage){const source=divergenceRecordingData[stage==='uniform'?'uniform':stage==='rare'?'rare':stage==='tail'?'tail':stage==='mixed-tail'?'mixedTail':['question','answer'].includes(stage)?'challenge':'mixed'],question=stage==='question',cursor=['negative-mask','rare','mixed-tail','answer'].includes(stage)?1:0;return {source,question,cursor,event:source.trace[cursor]};}
export function divergenceFigure(stage){
 const {source:s,question,cursor,event}=divergenceRecordingFrame(stage),active=s.lanes.filter(l=>l.active);
 let out=t(360,34,`${active.length} inputs · ${32-active.length} unused positions`,'heading')+t(360,77,question?'Predict the masks and arithmetic trace':event.label,'body');
 out+=s.lanes.map(l=>{const x=25+(l.id%16)*42,y=112+Math.floor(l.id/16)*86;return `<rect class="${!l.active?'empty':!question&&event.mask.includes(l.id)?'active':'panel'}" x="${x}" y="${y}" width="38" height="76" rx="5"/>`+t(x+19,y+23,String(l.id),'coordinate')+t(x+19,y+57,l.active?(l.input>0?'+':'−'):'·','number');}).join('');
 out+=t(360,307,`Small labels: lane · + means ${value(Math.abs(s.lanes[0].input))} · − means ${value(-Math.abs(s.lanes[0].input))}`,'caption');
 if(question)return out+t(360,367,'Positive: input × 2','heading')+t(360,419,'Negative: negate → × 2 → + 1','heading')+t(360,486,'Predict each non-empty mask and the operation count.','caption');
 out+=t(360,342,'Green: selected mask · white: other path · dashed: no input','caption');
 out+=s.trace.map((e,i)=>{const y=377+i*33;return `<rect class="${i===cursor?'active':'panel'}" x="35" y="${y-23}" width="650" height="30" rx="4"/>`+t(270,y,e.label,'caption')+t(594,y,`${e.mask.length} lane${e.mask.length===1?'':'s'}`,'caption');}).join('');
 const examples=[active[0],active.find(l=>l.path!==active[0].path)].filter(Boolean);
 return out+t(360,526,'Final outputs: '+examples.map(l=>`lane ${l.id} = ${value(l.output)}`).join(' · '),'body');
}
const notes={uniform:'Empty arithmetic paths are skipped.','positive-mask':'Other-path lanes still have inputs.','negative-mask':'The positive-first order is chosen for this model.',rare:'Only the listed arithmetic is counted.',tail:'One non-empty path: low participation without divergence.','mixed-tail':'The selected mask and the unused tail are different sets.',question:'Use the input signs and skip only empty paths.',answer:'Masks explain participation; these are not compiled timings.'};
export const divergenceDeck=()=>recordingDeck({chapter:7,title:'Follow active masks through different paths',scenes:scenes.map(s=>({...s,note:notes[s.stage]})),figure:divergenceFigure,scope:'Explicit positive-first arithmetic model · no compiler or GPU timing trace'});
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await writeRecordingDeck(process.argv[2]||'test-results/divergence-recording',divergenceDeck(),scenes);
