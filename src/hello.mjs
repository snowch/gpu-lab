// Copyright © 2026 Christopher Snow.
import './theme.mjs';
import {steps,simulateIntro,lineFor,kernelSource,runnableSource} from './hello-model.mjs';
import {downloadCuda} from './cuda-program.mjs';
const $=id=>document.getElementById(id);
let stage=0,selected=0,result=null;
function factor(){
  if($('hello-factor').value.trim()==='') throw new Error('Enter a multiplier first.');
  const value=Number($('hello-factor').value);simulateIntro(stage,value);return value;
}
function model(){return simulateIntro(stage,factor(),stage===3?$('hello-guard').checked:true);}
function code(){
  let value;try{value=factor();}catch{return;}
  $('hello-operation').textContent='y = x * '+value;
  $('hello-bound-explanation').textContent=stage===3?'n is the number of elements (5). The condition i < n asks whether this thread’s index is inside the array. Only then does the statement inside the braces run.':'This line is part of a function. We will see the complete function after exploring bounds checks.';
  $('hello-line').textContent=stage===3&&$('hello-guard').checked?'if (i < n) {\n    '+lineFor(value)+'\n}':lineFor(value);
  $('hello-full').textContent=kernelSource(value);
  $('hello-python').textContent='import torch\nx = torch.tensor([1.0, 2.0, 3.0, 4.0, 5.0], device="cuda")\ny = x * '+value;
}
function inspect(t){
  if(stage===0)return;
  $('hello-index').textContent=stage===1
    ? 'Thread '+t.i+': i = '+t.i+'. Read input['+t.i+'], multiply it, then write output['+t.i+'].'
    : 'Thread '+t.i+': block '+t.block+' × '+steps[stage].size+' threads per block + position '+t.local+' = index '+t.i+'.'+(t.skipped?' No element '+t.i+' exists, so the check skips array access.':t.invalid?' No element '+t.i+' exists: this access is invalid.':'');
  $('hello-selected-code').textContent=t.i<steps[stage].length?'output['+t.i+'] = input['+t.i+'] * '+factor()+';':'No array element at index '+t.i+'.';
}
function draw(){
  const container=$('hello-map');container.replaceChildren();
  let state;try{state=model();}catch{return;}
  const groups=stage>=2?Array.from({length:state.blocks},(_,i)=>i):[null];
  for(const group of groups){
    const box=document.createElement('div');box.className='hello-group';
    if(group!==null){const label=document.createElement('h3');label.textContent='Block '+group;box.append(label);}
    const grid=document.createElement('div');grid.className='hello-threads';
    for(const t of state.threads.filter(t=>group===null||t.block===group)){
      const cell=document.createElement(stage===0?'div':'button');cell.className='hello-thread';
      if(stage>0){cell.type='button';cell.setAttribute('aria-pressed',String(t.i===selected));cell.addEventListener('click',()=>{selected=t.i;draw();$('hello-map').querySelector('[aria-pressed="true"]')?.focus();});}
      const values=[['Input',t.input===null?'No element':String(t.input)],['Thread '+t.i,'× '+state.factor],['Output',!result?'?':t.skipped?'Skipped':t.invalid?'Invalid access':String(t.output)]];
      for(const [label,value] of values){const small=document.createElement('small'),strong=document.createElement('strong');small.textContent=label;strong.textContent=value;cell.append(small,strong);}
      if(result&&(t.skipped||t.invalid))cell.dataset.state=t.skipped?'skip':'invalid';
      grid.append(cell);
    }
    box.append(grid);container.append(box);
  }
  inspect(state.threads[selected]??state.threads[0]);
}
function invalidate(){
  result=null;$('hello-output').textContent='Run to see the results.';$('hello-next').hidden=true;$('hello-repair').hidden=true;code();draw();
}
function show(){
  const step=steps[stage];selected=0;result=null;
  $('hello-count').textContent='Chapter 1 · '+(stage+1)+' of '+steps.length;
  $('hello-title').textContent=step.title;$('hello-concept').textContent=step.concept;$('hello-instruction').textContent=step.instruction;
  $('hello-index-section').hidden=stage===0;$('hello-cuda-section').hidden=stage===0||stage===4;
  $('hello-group-code').hidden=stage<2;$('hello-guard-section').hidden=stage!==3;
  $('hello-complete').hidden=stage!==4;$('hello-back').hidden=stage===0;
  $('hello-guard').checked=true;
  invalidate();
}
$('hello-factor').addEventListener('input',invalidate);
$('hello-guard').addEventListener('change',invalidate);
$('hello-run').addEventListener('click',()=>{
  try{
    result=model();draw();
    $('hello-output').textContent=result.safe?'Output: ['+result.output.join(', ')+']':result.threads.filter(t=>t.invalid).length+' threads would access outside the arrays. Enable the bounds check to keep them safe.';
    $('hello-next').hidden=stage===steps.length-1||!result.safe;
    $('hello-repair').hidden=stage!==steps.length-1||!result.safe;
  }catch(error){result=null;$('hello-output').textContent=error.message;$('hello-next').hidden=true;}
});
$('hello-next').addEventListener('click',()=>{stage++;show();$('hello-title').focus();});
$('hello-back').addEventListener('click',()=>{stage--;show();$('hello-title').focus();});
$('hello-download').addEventListener('click',()=>{try{downloadCuda(runnableSource(factor()),'hello.cu');}catch(error){$('hello-output').textContent=error.message;}});
show();
