// Copyright © 2026 Christopher Snow.
import {registerExperiment} from './experiment-state.mjs';
import './theme.mjs';
import {steps,simulateIntro,kernelSource,runnableSource,launchPlan} from './hello-model.mjs';
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
  if(stage===4) $('hello-full').textContent=kernelSource(value);
}
function inspect(t){
  if(stage===0)return;
  $('hello-index').textContent=stage===1
    ? 'Thread '+t.i+': i = '+t.i+'. Read the input at index '+t.i+', multiply it, then write the output at index '+t.i+'.'
    : 'Thread '+t.i+': block '+t.block+' × '+steps[stage].size+' threads per block + position '+t.local+' = index '+t.i+'.'+(t.skipped?' No element '+t.i+' exists, so the check skips array access.':t.invalid?' No element '+t.i+' exists: this access is invalid.':'');

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
  selected=Number(button.dataset.thread);
  // Preserve the cards and focused element so browser scroll anchoring stays stable.
  for(const card of $('hello-map').querySelectorAll('button[data-thread]')) {
    card.setAttribute('aria-pressed',String(Number(card.dataset.thread)===selected));
  }
  try{inspect(model().threads[selected]);}catch{/* Keep the validation message until the input is corrected. */}
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

const count=document.getElementById('hello-transfer-count'),answer=document.getElementById('hello-transfer-result');
let revealed=false;
function showTransfer(){
  const p=launchPlan(Number(count.value));
  answer.textContent=revealed?`${p.blocks} blocks × ${p.size} threads = ${p.threads} threads. Indices 0–${p.count-1} handle inputs. ${p.skipped.length?'Indices '+p.skipped.join(', ')+' skip the arrays.':'Every thread has an input; none skip the arrays.'}`:'Predict first, then check.';
}
count.addEventListener('change',()=>{revealed=false;showTransfer();});
document.getElementById('hello-transfer-run').addEventListener('click',()=>{revealed=true;showTransfer();});
registerExperiment('hello-transfer',()=>({revealed}),state=>{revealed=Boolean(state.revealed);showTransfer();});
