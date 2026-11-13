// Copyright © 2026 Christopher Snow.
import {readFileSync} from 'node:fs';
import {inspectLaunch,launchPlan} from '../src/hello-model.mjs';
import {tiledMatmul} from '../src/ai-models.mjs';
import {label as t,valuesRow,recordingDeck,writeRecordingDeck} from './recording-deck.mjs';
const v=n=>n.toFixed(1).replace('-','−');
const panel=(x,y,w,h,active=false)=>`<rect class="${active?'active':'panel'}" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>`;
const textRows=(rows,y=130)=>rows.map((row,i)=>panel(45,y+i*77,630,65)+t(360,y+27+i*77,row[0],'heading')+t(360,y+53+i*77,row[1],'caption')).join('');
export const recapData={
 hello:{five:inspectLaunch(5,4,2),nine:inspectLaunch(9,4,3)},
 'launch-from-input':{five:launchPlan(5,4),nine:launchPlan(9,4),output:inspectLaunch(5,4,2).output},
 'putting-it-together':{variants:[1,2,4].map(tile=>tiledMatmul({n:4,tile,sharedBudget:128,registers:64})),challenge:tiledMatmul({n:8,tile:2,sharedBudget:128,registers:64})},
};
function threadGrid(state){
 const width=630/state.blocks;
 return state.threads.map(thread=>{
  const x=45+thread.block*width,y=116+thread.local*82;
  return (thread.local===0?t(x+(width-10)/2,90,'Block '+thread.block,'heading'):'')+panel(x,y,width-10,70,!thread.skipped)+t(x+(width-10)/2,y+26,`Index ${thread.i} · position ${thread.local}`,'caption')+t(x+(width-10)/2,y+53,thread.skipped?'Skip arrays':`${v(thread.input)} → ${v(thread.output)}`,'body');
 }).join('');
}
export function helloFigure(stage){
 const d=recapData.hello;
 if(['blocks','launch','guard','answer'].includes(stage)){
  const s=stage==='answer'?d.nine:d.five;
  return t(360,40,`${s.input.length} inputs · ${s.blocks} blocks × ${s.size} threads`,'heading')+threadGrid(s)+t(360,505,stage==='blocks'?'Index 4 = block 1 × 4 + position 0':`Valid indices: 0–${s.input.length-1} · ${s.threads.filter(t=>t.skipped).length} threads skip`,'body');
 }
 if(stage==='question')return t(360,52,'Nine inputs · four threads per block','heading')+valuesRow(recapData.hello.nine.input,90,116,560)+textRows([['Two blocks × four threads = eight threads','Does every input have a thread?'],['Smallest block count: ?','Extra indices that must skip: ?']],255);
 if(stage==='summary')return t(360,55,'Explain three different quantities','heading')+textRows([['Array index','Which input and output does this thread use?'],['Launch coverage','How many threads do the requested blocks create?'],['Bounds check','Which of those indices may access the arrays?']],120)+t(360,440,'Changing the grouping does not change doubling.','body');
 return t(360,46,stage==='threads'?'One input position per participating thread':'Five FP32 inputs → five doubled outputs','heading')+t(135,101,'Array index','caption')+t(340,101,'Input','caption')+t(565,101,'Output','caption')+d.five.input.map((value,i)=>panel(45,120+i*67,630,58,i===4&&stage==='threads')+t(135,157+i*67,String(i),'number')+t(340,157+i*67,v(value),'number')+t(565,157+i*67,v(d.five.output[i]),'number')).join('')+t(360,503,stage==='threads'?'Index 4 selects value 5.0 and writes 10.0.':'Same calculation · PyTorch chooses its implementation.','caption');
}
export function memoryFigure(stage){
 const d=recapData['launch-from-input'];
 if(stage==='question'||stage==='answer'){
  const p=d.nine,answer=stage==='answer';
  return t(360,48,'CPU input vector: nine FP32 values','heading')+valuesRow(Array.from({length:p.count},(_,i)=>i+1),90,100,560)+textRows([['Element count',answer?String(p.count):'?'],['Bytes per input/output array',answer?`${p.count} × 4 = ${p.count*4} bytes`:'?'],['Four-thread blocks',answer?`${p.blocks} blocks · ${p.threads} threads · skip ${p.skipped.join(', ')}`:'?']],246);
 }
 if(stage==='summary')return t(360,50,'The CPU supplies the complete workflow','heading')+textRows([['Input size and operation','Derive element count and required output shape.'],['Storage, copies and launch','Use bytes for storage/copies; elements for the guard.'],['Result and cleanup','Copy results to the CPU; then free GPU allocations.']],115)+t(360,440,'A pointer carries an address, without an array length.','caption');
 if(stage==='bytes')return t(360,50,'Count elements; allocate and copy bytes','heading')+valuesRow([1,2,3,4,5],90,110,560)+textRows([['5 elements × 4 bytes = 20 bytes','One FP32 array’s value storage'],['Input: 20 bytes · output: 20 bytes','Equal sizes here because doubling is one-to-one']],240);
 if(stage==='launch')return t(360,42,'Five elements · two blocks of four','heading')+threadGrid(recapData.hello.five)+t(360,507,'CPU argument n = 5 · valid indices 0–4','body');
 const rows=[['CPU input','[1.0, 2.0, 3.0, 4.0, 5.0]'],['GPU input','Allocate 20 bytes; copy the five input values.'],['GPU output','Allocate 20 bytes; the kernel writes doubled values.'],['CPU output',`[${d.output.map(v).join(', ')}]`]];
 return t(360,42,'Separate CPU and GPU storage','heading')+rows.map((row,i)=>panel(50,78+i*105,620,82,(stage==='input'&&i===0)||(stage==='allocate'&&(i===1||i===2))||(stage==='result'&&i===3))+t(360,109+i*105,row[0],'heading')+t(360,139+i*105,row[1],'body')+(i<3?'<path class="arrow" d="M360 '+(163+i*105)+' v15" marker-end="url(#arrow)"/>':'')).join('')+t(360,528,stage==='result'?'Free GPU storage; keep the CPU input and result.':'Allocation reserves storage; copying supplies values.','caption');
}
function matrixFigure(result){return result.output.map((row,y)=>row.map((value,x)=>panel(178+x*92,125+y*65,85,58)+t(220+x*92,162+y*65,v(value),'number')).join('')).join('');}
export function investigationFigure(stage){
 const {variants,challenge}=recapData['putting-it-together'];
 if(stage==='baseline')return t(360,45,'C: the same complete 4 × 4 output','heading')+matrixFigure(variants[0])+t(360,434,`${variants[0].inputLoads} input loads · 16 output stores`,'heading')+t(360,482,'Tile width 1 · caches excluded','caption');
 if(stage==='reuse')return t(360,47,'Explicit input loads for the complete product','heading')+variants.map((r,i)=>t(130,145+i*125,`Tile ${r.tile}`,'heading')+`<rect class="active" x="220" y="112" width="${r.inputLoads*3}" height="44" rx="5" transform="translate(0 ${i*125})"/>`+t(240+r.inputLoads*3,143+i*125,String(r.inputLoads),'number')).join('')+t(360,514,'Every variant produces the same C.','body');
 if(stage==='resources'||stage==='hypothesis')return t(360,45,'Reuse benefit and per-block resource cost','heading')+variants.slice(1).map((r,i)=>panel(40+i*345,90,310,360)+t(195+i*345,135,`Tile width ${r.tile}`,'heading')+[[`${r.inputLoads} input loads`,'Complete product'],[`${r.sharedBytes} shared bytes`,'Per block'],[`${r.registersPerBlock} registers`,'Per block'],[`${r.residentBlocks} blocks fit`,'Synthetic resource budgets']].map((row,j)=>t(195+i*345,190+j*75,row[0],'body')+t(195+i*345,215+j*75,row[1],'caption')).join('')).join('')+t(360,505,'Neither count establishes which kernel is faster.','caption');
 if(stage==='question'||stage==='answer'){
  const answer=stage==='answer';return t(360,48,'8 × 8 matrices · tile width 2','heading')+textRows([['Complete-product input loads',answer?String(challenge.inputLoads):'?'],['Output stores',answer?String(challenge.output.length**2):'?'],['Resident-block capacity',answer?`${challenge.residentBlocks} blocks in the teaching budgets`:'?']],120)+t(360,435,answer?'Per-block resource requirements are unchanged.':'Does doubling N double every count?','body');
 }
 return t(360,48,stage==='measure'?'Design a fair hardware comparison':'Make a testable recommendation','heading')+textRows(stage==='measure'?[['Check complete outputs','Keep shapes, inputs and dtype comparable.'],['Define the timed interval','Choose whether copies and allocation are included.'],['Warm up, synchronise, repeat','Then inspect actual operations with a profiler.']]:[['Evidence','What changed in the browser model?'],['Uncertainty','Which real implementation costs are missing?'],['Next measurement','What would support or reject your hypothesis?']],120)+t(360,450,'Browser counts are not measured GPU performance.','caption');
}
export const recapConfig={
 hello:{chapter:1,title:'Trace five values through GPU threads',figure:helloFigure,scope:'Explicit teaching thread mapping · no GPU timing claim'},
 'launch-from-input':{chapter:3,title:'Derive CUDA storage and launches from inputs',figure:memoryFigure,scope:'CPU-managed CUDA workflow · FP32 values · correctness, not timing'},
 'putting-it-together':{chapter:14,title:'Turn matrix reuse into a testable hypothesis',figure:investigationFigure,scope:'Declared teaching algorithm and synthetic budgets · no GPU timing'},
};
export async function renderRecap(slug,output){
 const config=recapConfig[slug],scenes=JSON.parse(readFileSync(new URL(`../content/${slug}-scenes.json`,import.meta.url)));
 await writeRecordingDeck(output,recordingDeck({...config,scenes}),scenes);
}
