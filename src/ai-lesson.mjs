// Copyright © 2026 Christopher Snow.
import './theme.mjs';
import {tiledMatmul,precisionMatmul,attention,inferenceBudget,reduceBlock} from './ai-models.mjs';
import {mechanismVisual} from './mechanism-visuals.mjs';
const $=id=>document.getElementById(id),kind=document.body.dataset.lesson;
const number=id=>Number($(id).value);
const format=x=>typeof x==='number' ? !Number.isFinite(x)?String(x):x!==0&&(Math.abs(x)<0.0001||Math.abs(x)>=1e7)?x.toExponential(5):x.toLocaleString('en-GB',{maximumFractionDigits:6}):String(x);
const bytes=x=>x>=1e9?`${(x/1e9).toFixed(3)} GB`:x>=1024?`${(x/1024).toFixed(2)} KiB`:`${x} B`;
let result,cursor=0,revealed=false;
function element(tag,text,cls=''){const e=document.createElement(tag);e.textContent=text;e.className=cls;return e;}
function compute(){
  if(kind==='matmul')result=tiledMatmul({n:number('n'),tile:number('tile'),sharedBudget:number('sharedBudget'),registers:number('registers')});
  if(kind==='tensor-cores')result=precisionMatmul({format:$('format').value,pattern:$('pattern').value});
  if(kind==='attention')result=attention({n:number('n'),tile:number('tile'),mode:$('mode').value,scale:number('scale')});
  if(kind==='inference')result=inferenceBudget({phase:$('phase').value,batch:number('batch'),sequence:number('sequence'),parameters:number('parameters'),bandwidth:number('bandwidth'),compute:number('compute'),measuredMs:number('measuredMs')});
  if(kind==='reduction')result=reduceBlock({size:number('size'),synchronised:$('ordering').value==='barrier'});
}
function answer(){return kind==='matmul'?result.inputLoads:kind==='tensor-cores'?result.changed:kind==='attention'?result.intermediateWrites:kind==='inference'?Number(result.bottleneck==='compute'):Number(result.hazard);}
function metrics(){
  if(kind==='matmul')return [['Input loads',result.inputLoads],['FLOPs / global byte',result.intensity],['Shared bytes / block',result.sharedBytes],['Resident blocks (toy SM)',result.residentBlocks]];
  if(kind==='tensor-cores')return [['Converted row values',result.changed],['FP32 reference C[0,0]',result.reference],['Selected result C[0,0]',result.result],['Absolute difference',result.error]];
  if(kind==='attention')return [['Full-matrix values written',result.intermediateWrites],['Intermediate read/write bytes',result.intermediateBytes],['Algorithm scratch floats',result.scratchFloats],['Max reference difference',result.maxError]];
  if(kind==='inference')return [['Memory lower bound · ms',result.memoryMs],['Compute lower bound · ms',result.computeMs],['KV cache capacity',bytes(result.kvCacheBytes)],['Dominant bound',result.bottleneck]];
  return [['Input values',result.size],['Reference sum',result.expected],['Ordering hazard',result.hazard?'Detected':'None'],['Computed sum',result.result===null?'Undefined':result.result]];
}
function card(parent,title,value,note=''){
  const e=element('div','','value-card');e.append(element('strong',title),element('p',format(value)));if(note)e.append(element('span',note));parent.append(e);return e;
}
function matrix(parent,title,values,selected=[]){
  const wrapper=element('div','','matrix-panel');wrapper.append(element('h3',title));
  const grid=element('div','','matrix-grid');grid.style.gridTemplateColumns=`repeat(${values[0].length},minmax(0,1fr))`;
  values.forEach((row,r)=>row.forEach((value,c)=>{
    const cell=element('span',format(value),`matrix-cell${selected.some(([i,j])=>i===r&&j===c)?' selected':''}`);
    cell.title=`${title} [${r},${c}] = ${value}`;grid.append(cell);
  }));wrapper.append(grid);parent.append(wrapper);return wrapper;
}
function draw(){
  const figure=$('figure'),step=result.trace[cursor];figure.replaceChildren();figure.className=`architecture-figure ai-figure ${kind}`;
  figure.insertAdjacentHTML('beforeend',mechanismVisual(kind,result,step));
  $('step-detail').textContent=step.label;
  if(kind==='matmul'){
    const group=element('div','','matrix-group');
    matrix(group,'A: selected values loaded',result.a,step.aCells);
    matrix(group,'B: selected values loaded',result.b,step.bCells);
    const partial=Array.from({length:result.tile},()=>Array(result.tile).fill(0));
    step.cCells.forEach(([r,c,value])=>partial[r-step.row][c-step.col]=value);
    matrix(group,`C tile (${step.row},${step.col}): partial sums`,partial);
    figure.append(group);
    const resources=element('div','','value-grid');
    card(resources,'Registers per block',result.registersPerBlock);
    card(resources,'Toy warp-slot occupancy',`${Math.round(result.occupancy*100)}%`,'One warp slot per small block; maximum eight.');
    card(resources,'Naive input loads',result.naiveLoads);
    card(resources,'Counted global bytes',result.bytes,'Inputs and final output; cache reuse excluded.');figure.append(resources);
    const details=element('details','');details.append(element('summary','Inspect the complete final C matrix'));matrix(details,'Final C',result.output);figure.append(details);
    $('explanation').textContent=`The complete product uses ${result.flops} FLOPs and ${result.inputLoads} explicit input loads. All tilings produce the same C. Register and shared-memory budgets limit the teaching SM to ${result.residentBlocks} resident blocks. These counts do not establish a speedup.`;
  }else if(kind==='tensor-cores'){
    const flow=element('div','','mma-flow');
    for(const label of [`A ${result.row.length}×${result.row.length}`, '×', `B ${result.row.length}×${result.row.length}`, '→ warp MMA →', `C ${result.output.length}×${result.output[0].length}`])flow.append(element('span',label));
    figure.append(flow);
    const row=element('div','','precision-row');result.row.forEach((x,i)=>{const e=card(row,`K ${i}`,result.converted[i],`FP32 input ${format(x)}`);if(i===cursor)e.classList.add('selected');});figure.append(row);
    const work=element('div','','value-grid');card(work,'Selected converted A',step.converted);card(work,'B value',1);card(work,'Product',step.product);card(work,'FP32 partial sum',step.partial);card(work,'Reference partial sum',step.reference);card(work,'Tile-level expression',`${result.scalarFmas} scalar FMAs`,'One WMMA API call; hardware instruction count is unspecified.');figure.append(work);
    $('explanation').textContent=`${result.changed} first-row inputs change under ${result.format.toUpperCase()} conversion. Sequential FP32 accumulation gives ${format(result.result)}, compared with ${format(result.reference)} for the FP32 inputs. The chosen arithmetic order is not a tensor-core hardware trace.`;
  }else if(kind==='attention'){
    const group=element('div','','value-grid');
    if(result.mode==='online'){
      card(group,'Running maximum m',step.m);card(group,'Running denominator l',step.l);card(group,'Previous-state rescale',step.rescale);
      matrix(figure,'Current key-tile scores',[step.block]);matrix(figure,'Current normalised output estimate',[step.output]);
    }else{matrix(figure,step.label,[step.values]);card(group,'Current phase',step.description);}
    figure.append(group);
    matrix(figure,'Final output for query 0',[result.output[0]]);
    $('explanation').textContent=`The ${result.mode} algorithm writes ${result.intermediateWrites} full-matrix intermediate values. Score/probability reads plus writes account for ${result.intermediateBytes} bytes. Maximum online/reference output difference is ${format(result.maxError)}. This is selected intermediate traffic, not all HBM traffic.`;
  }else if(kind==='inference'){
    const maximum=Math.max(result.memoryMs,result.computeMs);
    for(const [label,ms] of [['Memory bound',result.memoryMs],['Compute bound',result.computeMs]]){
      const row=element('div','','budget-row');row.append(element('strong',`${label}: ${format(ms)} ms`));
      const track=element('div','','budget-track'),bar=element('div','','budget-bar');bar.style.width=`${ms/maximum*100}%`;track.append(bar);row.append(track);figure.append(row);
    }
    const group=element('div','','value-grid');card(group,'Selected accounting term',step.label);card(group,'Selected lower bound · ms',step.ms);
    if(step.bytes!==undefined)card(group,'Counted bytes',bytes(step.bytes));if(step.flops!==undefined)card(group,'Counted FLOPs',step.flops);
    card(group,'Weight bytes / invocation',bytes(result.weightBytes));card(group,'Tokens in invocation',result.tokens);figure.append(group);
    let comparison='No measurement entered.';
    if(result.measuredMs)comparison=result.measuredMs<result.boundMs ? 'Entered time is below the model bound: check assumptions, units and measurement scope.' : `Entered time ${format(result.measuredMs)} ms; bound/time ratio ${format(result.measurementRatio)}. The gap needs measurement, not an assumed cause.`;
    $('explanation').textContent=`The ${result.bottleneck} bound dominates: max(${format(result.memoryMs)}, ${format(result.computeMs)}) = ${format(result.boundMs)} ms under the stated ideal rates. ${comparison}`;
  }else{
    const grid=element('div','','reduction-grid');
    step.shared.forEach((value,i)=>{const e=card(grid,`Shared[${i}]`,value===null?'Pending':value);if(step.reads.includes(i))e.classList.add('selected');});figure.append(grid);
    if(step.hazard)figure.append(element('p','Unwritten partner read detected. No valid numeric result is assigned.','hazard-note'));
    $('explanation').textContent=result.hazard?'The selected interleaving reaches an unwritten shared value. Later writes do not establish the missing ordering. CUDA does not define a useful result for this data race.':`The synchronised tree combines all ${result.size} inputs into ${result.result}. Each stage reads the previous stage after its block barrier.`;
  }
}
function render(){
  $('results').hidden=!revealed;if(!revealed)return;
  $('lane-inspector').hidden=true;
  $('metrics').replaceChildren(...metrics().map(([label,value])=>{const e=element('div','');e.dataset.metric=label;e.append(element('span',label),element('strong',format(value)));return e;}));
  $('step').max=result.trace.length-1;$('step').value=cursor;$('position').textContent=`${cursor+1} / ${result.trace.length}`;
  $('back').disabled=cursor===0;$('next').disabled=cursor===result.trace.length-1;draw();
  // Long matmul traces keep the first, current neighbourhood and final positions.
  const indices=result.trace.map((_,i)=>i).filter(i=>result.trace.length<=64||i===0||i===result.trace.length-1||Math.abs(i-cursor)<=4);
  $('trace').replaceChildren(...indices.map(i=>{const b=element('button',`${i+1}: ${result.trace[i].label}`,i===cursor?'selected':'');b.type='button';b.dataset.step=i;b.setAttribute('aria-pressed',String(i===cursor));b.addEventListener('click',()=>{cursor=i;render();$('trace').querySelector(`[data-step="${i}"]`).focus({preventScroll:true});});return b;}));
}
for(const control of $('controls').querySelectorAll('select,input'))control.addEventListener('change',()=>{
  revealed=false;cursor=0;$('guess').value='';$('results').hidden=true;
  try{compute();render();$('feedback').textContent='Configuration changed. Make a new prediction, then inspect.';}catch(error){$('feedback').textContent=error.message;}
});
function reveal(){try{compute();cursor=0;revealed=true;render();return true;}catch(error){$('feedback').textContent=error.message;return false;}}
$('prediction').addEventListener('submit',event=>{event.preventDefault();if(!$('prediction').reportValidity()||!reveal())return;$('feedback').textContent=number('guess')===answer()?`Your prediction matches: ${answer()}. Follow the computed trace to explain why.`:`You predicted ${number('guess')}; the model gives ${answer()}. Inspect the trace and compare your reasoning.`;});
$('inspect').addEventListener('click',()=>{if(reveal())$('feedback').textContent='Computed results ready. Step through the experiment.';});
$('next').addEventListener('click',()=>{cursor=Math.min(result.trace.length-1,cursor+1);render();});
$('back').addEventListener('click',()=>{cursor=Math.max(0,cursor-1);render();});
$('restart').addEventListener('click',()=>{cursor=0;render();});
$('step').addEventListener('input',()=>{cursor=number('step');render();});
compute();render();
