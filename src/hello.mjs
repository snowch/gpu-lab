import {tensorValue} from './value-format.mjs';
// Copyright © 2026 Christopher Snow.
import {registerExperiment} from './experiment-state.mjs';
import './theme.mjs';
import {steps,simulateIntro,kernelSource,runnableSource,launchPlan,launchSource,boundsSource,introPrompt} from './hello-model.mjs';
import {downloadCuda} from './cuda-program.mjs';
import {renderIntroMap,renderCudaTrace} from './hello-view.mjs';
for (const section of document.querySelectorAll('.hello-section')) {
const stage=Number(section.dataset.stage);
const $=id=>document.getElementById(id+'-'+stage);
let selected=stage===4?4:0,result=null;
function factor(){
  if($('hello-factor').value.trim()==='') throw new Error('Enter a multiplier first.');
  const value=Number($('hello-factor').value);simulateIntro(stage,value);return value;
}
function model(){return simulateIntro(stage,factor(),stage===3?$('hello-guard').checked:true);}
function code(){
  let value;try{value=factor();}catch{return;}
  $('hello-operation').textContent='y = x * '+value;
  if(stage===2) document.getElementById('hello-bridge-full-2').textContent=kernelSource(value);
  if(stage===3) {
    const guard=$('hello-guard').checked;
    document.getElementById('hello-bounds-code-3').textContent=boundsSource(value,guard);
    document.getElementById('hello-bounds-code-3-label').textContent='CUDA C++ · body excerpt from runKernel · check '+(guard?'enabled':'disabled (diagnostic)');
  }
  if(stage===4) $('hello-full').textContent=kernelSource(value);
}
function inspect(t){
  if(stage===0)return;
  $('hello-index').textContent=stage===1
    ? 'Thread '+t.i+': i = '+t.i+'. Read the input at index '+t.i+', multiply it, then write the output at index '+t.i+'.'
    : 'Thread '+t.i+': block '+t.block+' × '+steps[stage].size+' threads per block + position '+t.local+' = index '+t.i+'.'+(t.skipped?' No element '+t.i+' exists, so the check skips the read, multiplication and write.':t.invalid?' No element '+t.i+' exists: without the check, the read is invalid and there is no valid result.':'');
  if(stage===4) {
    const state=model();
    document.getElementById('hello-cuda-trace')?.remove();
    $('hello-index').insertAdjacentHTML('afterend',renderCudaTrace(t,state,result!==null));
  }
}
function draw(){
  const container=$('hello-map');container.replaceChildren();
  let state;try{state=model();}catch{if(stage===4)document.getElementById('hello-cuda-trace').textContent='Enter a valid multiplier to inspect the CUDA trace.';return;}
  container.innerHTML=renderIntroMap(stage,state,selected,result!==null);
  inspect(state.threads[selected]??state.threads[0]);
}
function invalidate(){
  result=null;$('hello-output').textContent='Settings changed—predict again, then press Run.';code();draw();
}
function resultText(){return result.safe?'Output: ['+result.output.map(tensorValue).join(', ')+']':result.threads.filter(t=>t.invalid).length+' threads would access outside the arrays. Enable the bounds check to keep them safe.';}
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
if(stage===2) document.getElementById('hello-bridge-download-2').addEventListener('click',()=>{try{downloadCuda(runnableSource(factor()),'hello-blocks.cu');}catch(error){$('hello-output').textContent=error.message;}});
$('hello-download')?.addEventListener('click',()=>{try{downloadCuda(runnableSource(factor()),'hello.cu');}catch(error){$('hello-output').textContent=error.message;}});
code();draw();$('hello-run').disabled=false;
registerExperiment('hello-'+stage,()=>({selected,ran:result!==null,length:steps[stage].length,message:$('hello-output').textContent}),state=>{
  selected=state.selected;result=state.ran===true&&!state.message?.startsWith('Example output:')?model():null;code();draw();
  $('hello-output').textContent=result?resultText():introPrompt(stage);
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

// The regrouping activity has its own controls and reveal state.
const launchSize=document.getElementById('hello-launch-size');
const launchGuess=document.getElementById('hello-launch-guess');
const launchFeedback=document.getElementById('hello-launch-feedback');
const launchAnswer=document.getElementById('hello-launch-answer');
const launchMap=document.getElementById('hello-launch-map');
let launchRevealed=false,launchSelected=4;
function inspectLaunch(){
  const state=simulateIntro(4,2,true,Number(launchSize.value));
  const t=state.threads[launchSelected];
  document.getElementById('hello-launch-index').textContent=`Thread ${t.i}: block ${t.block} × ${state.size} + position ${t.local} = index ${t.i}. `+(t.skipped?'No element exists here; the check skips the calculation.':`Input ${tensorValue(t.input)} → output ${tensorValue(t.output)}.`);
}
function showLaunch(){
  launchAnswer.hidden=!launchRevealed;
  if(!launchRevealed){launchFeedback.textContent='Predict the block count, then check.';return;}
  const state=simulateIntro(4,2,true,Number(launchSize.value));
  const correct=Number(launchGuess.value)===state.blocks;
  launchFeedback.textContent=`${correct?'Correct.':'You need '+state.blocks+' block'+(state.blocks===1?'':'s')+'.'} ${state.blocks} × ${state.size} = ${state.threads.length} threads covers five inputs. `+(state.blocks===1?'One block is enough; a second would add unneeded threads.':'One block of four would leave the fifth input without a thread.');
  document.getElementById('hello-launch-example').textContent=launchSource(state.blocks,state.size);
  launchMap.innerHTML=renderIntroMap(4,state,launchSelected,true);
  document.getElementById('hello-launch-output').textContent='Output: ['+state.output.map(tensorValue).join(', ')+']';
  inspectLaunch();
}
launchSize.addEventListener('change',()=>{launchRevealed=false;launchGuess.value='';showLaunch();});
launchGuess.addEventListener('change',()=>{launchRevealed=false;showLaunch();});
launchMap.addEventListener('click',event=>{
  const button=event.target.closest('[data-thread]');if(!button)return;
  launchSelected=Number(button.dataset.thread);
  for(const card of launchMap.querySelectorAll('[data-thread]'))card.setAttribute('aria-pressed',String(card===button));
  inspectLaunch();
});
document.getElementById('hello-launch-run').addEventListener('click',()=>{
  if(!launchGuess.value){launchFeedback.textContent='Choose your predicted block count first.';launchGuess.focus();return;}
  launchRevealed=true;showLaunch();
});
document.getElementById('hello-launch-download').addEventListener('click',()=>{
  if(launchRevealed)downloadCuda(runnableSource(2,Number(launchSize.value)),'hello-grouping.cu');
});
document.getElementById('hello-launch-run').disabled=false;
registerExperiment('hello-launch',()=>({revealed:launchRevealed,selected:launchSelected}),state=>{
  launchRevealed=state.revealed===true&&launchGuess.value!=='';
  launchSelected=Number.isInteger(state.selected)&&state.selected>=0&&state.selected<8?state.selected:4;
  showLaunch();
});
