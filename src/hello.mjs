// Copyright © 2026 Christopher Snow.
import {registerExperiment} from './experiment-state.mjs';
import './theme.mjs';
import {steps,simulateIntro,lineFor,kernelSource,runnableSource} from './hello-model.mjs';
import {downloadCuda} from './cuda-program.mjs';
import {renderIntroMap} from './hello-view.mjs';
for (const section of document.querySelectorAll('.hello-section')) {
const stage=Number(section.dataset.stage);
const $=id=>document.getElementById(id+'-'+stage);
let selected=0,result=simulateIntro(stage,2);
function factor(){
  if($('hello-factor').value.trim()==='') throw new Error('Enter a multiplier first.');
  const value=Number($('hello-factor').value);simulateIntro(stage,value);return value;
}
function model(){return simulateIntro(stage,factor(),stage===3?$('hello-guard').checked:true);}
function code(){
  let value;try{value=factor();}catch{return;}
  $('hello-operation').textContent='y = x * '+value;
  if($('hello-line')) $('hello-line').textContent=stage>=2&&(stage!==3||$('hello-guard').checked)?'if (i < n) {\n    '+lineFor(value)+'\n}':lineFor(value);
  if(stage===4){
    $('hello-full').textContent=kernelSource(value);
    $('hello-python').textContent='y = x * '+value;
  }
}
function inspect(t){
  if(stage===0)return;
  $('hello-index').textContent=stage===1
    ? 'Thread '+t.i+': i = '+t.i+'. Read input['+t.i+'], multiply it, then write output['+t.i+'].'
    : 'Thread '+t.i+': block '+t.block+' × '+steps[stage].size+' threads per block + position '+t.local+' = index '+t.i+'.'+(t.skipped?' No element '+t.i+' exists, so the check skips array access.':t.invalid?' No element '+t.i+' exists: this access is invalid.':'');
  $('hello-selected-label').textContent='// Selected thread: i = '+t.i;
  $('hello-selected-code').textContent=t.i<steps[stage].length?lineFor(factor()).replaceAll('[i]','['+t.i+']'):'No array element at index '+t.i+'.';
}
function draw(){
  const container=$('hello-map');container.replaceChildren();
  let state;try{state=model();}catch{return;}
  container.innerHTML=renderIntroMap(stage,state,selected,result!==null);
  inspect(state.threads[selected]??state.threads[0]);
}
function invalidate(){
  result=null;$('hello-output').textContent='Run to see the results.';code();draw();
}
function resultText(){return result.safe?'Output: ['+result.output.join(', ')+']':result.threads.filter(t=>t.invalid).length+' threads would access outside the arrays. Enable the bounds check to keep them safe.';}
$('hello-map').addEventListener('click',event=>{
  const button=event.target.closest('button[data-thread]');
  if(!button)return;
  selected=Number(button.dataset.thread);draw();
  $('hello-map').querySelector('[aria-pressed="true"]')?.focus({preventScroll:true});
});
$('hello-factor').addEventListener('input',invalidate);
$('hello-guard')?.addEventListener('change',invalidate);
$('hello-run').addEventListener('click',()=>{
  try{
    result=model();draw();
    $('hello-output').textContent=resultText();
  }catch(error){result=null;$('hello-output').textContent=error.message;}
});
$('hello-download')?.addEventListener('click',()=>{try{downloadCuda(runnableSource(factor()),'hello.cu');}catch(error){$('hello-output').textContent=error.message;}});
code();draw();
registerExperiment('hello-'+stage,()=>({selected,ran:result!==null,length:steps[stage].length,message:$('hello-output').textContent}),state=>{
  selected=state.selected;result=state.ran?model():null;code();draw();
  $('hello-output').textContent=state.length===steps[stage].length&&typeof state.message==='string'?state.message:result?resultText():'Run to see the results.';
});
}
