import {tensorValue} from './value-format.mjs';
// Copyright © 2026 Christopher Snow.
import {registerExperiment} from './experiment-state.mjs';
import './theme.mjs';
import {steps,simulateIntro,kernelSource,runnableSource,launchPlan,launchSource,introPrompt,inspectLaunch} from './hello-model.mjs';
import {downloadCuda} from './cuda-program.mjs';
import {renderIntroMap,renderCudaTrace,renderIndexSubstitution} from './hello-view.mjs';
for (const section of document.querySelectorAll('.hello-section')) {
const stage=Number(section.dataset.stage);
if(stage===3){registerExperiment('hello-3',()=>({}),()=>{});continue;}
const worked=stage===2||stage===4;
const $=id=>document.getElementById(id+'-'+stage);
let selected=stage>=2?4:0,result=worked?simulateIntro(stage,2):null;
function factor(){
  if(!$('hello-factor'))return 2;
  if($('hello-factor').value.trim()==='') throw new Error('Enter a multiplier first.');
  const value=Number($('hello-factor').value);simulateIntro(stage,value);return value;
}
function model(){return simulateIntro(stage,factor());}
function code(){
  let value;try{value=factor();}catch{return;}
  $('hello-operation').textContent='y = x * '+value;
  if(stage===2) document.getElementById('hello-bridge-full-2').textContent=kernelSource(value);
  if(stage===4) $('hello-full').textContent=kernelSource(value);
}
function inspect(t){
  if(stage===0)return;
  if(stage===2){$('hello-index').innerHTML=renderIndexSubstitution(t,model());return;}
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
  result=null;$('hello-output').textContent='Settings changed. Run to inspect the new results.';code();draw();
}
function resultText(){return (worked?'Worked output: [':'Output: [')+result.output.map(tensorValue).join(', ')+']';}
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
$('hello-factor')?.addEventListener('input',invalidate);
$('hello-run')?.addEventListener('click',()=>{
  try{
    result=model();draw();
    $('hello-output').textContent=resultText();
  }catch(error){result=null;$('hello-output').textContent=error.message;}
});
if(stage===2) document.getElementById('hello-bridge-download-2').addEventListener('click',()=>{try{downloadCuda(runnableSource(factor()),'hello-blocks.cu');}catch(error){$('hello-output').textContent=error.message;}});
$('hello-download')?.addEventListener('click',()=>{try{downloadCuda(runnableSource(factor()),'hello.cu');}catch(error){$('hello-output').textContent=error.message;}});
code();draw();if($('hello-run'))$('hello-run').disabled=false;
registerExperiment('hello-'+stage,()=>({version:2,selected,ran:result!==null,length:steps[stage].length,message:$('hello-output').textContent}),state=>{
  selected=Number.isInteger(state.selected)&&state.selected>=0&&state.selected<model().threads.length?state.selected:0;result=worked?model():(stage===0||state.version===2)&&state.ran===true&&!state.message?.startsWith('Example output:')?model():null;code();draw();
  $('hello-output').textContent=result?resultText():introPrompt(stage);
});
}

// The regrouping activity has its own controls and reveal state.
const launchSize=document.getElementById('hello-launch-size');
const launchGuess=document.getElementById('hello-launch-guess');
const positionGuess=document.getElementById('hello-position-guess');
const valuesGuess=document.getElementById('hello-values-guess');
const launchFeedback=document.getElementById('hello-launch-feedback');
const launchAnswer=document.getElementById('hello-launch-answer');
const launchMap=document.getElementById('hello-launch-map');
let launchRevealed=false,launchSelected=4;
function inspectGrouping(){
  const state=simulateIntro(4,2,true,Number(launchSize.value));
  const t=state.threads[launchSelected];
  document.getElementById('hello-launch-index').innerHTML=renderIndexSubstitution(t,state);
}
function showLaunch(){
  launchAnswer.hidden=!launchRevealed;
  if(!launchRevealed){launchFeedback.textContent='Make your three predictions, then check.';return;}
  const state=simulateIntro(4,2,true,Number(launchSize.value));
  const target=state.threads[4];
  const correct=Number(launchGuess.value)===state.blocks&&positionGuess.value===`${target.block}:${target.local}`&&valuesGuess.value==='same';
  launchFeedback.textContent=`${correct?'All three predictions match.':'Compare your predictions with the grouping below.'} ${state.blocks} × ${state.size} = ${state.threads.length} threads covers five inputs. Input[4] is handled by block ${target.block}, position ${target.local}. Its index is still 4, so it still doubles 5.0 to 10.0. All five output values stay the same.`;
  document.getElementById('hello-launch-example').textContent=launchSource(state.blocks,state.size);
  launchMap.innerHTML=renderIntroMap(4,state,launchSelected,true);
  document.getElementById('hello-launch-output').textContent='Output: ['+state.output.map(tensorValue).join(', ')+']';
  inspectGrouping();
}
launchSize.addEventListener('change',()=>{launchRevealed=false;launchGuess.value='';positionGuess.value='';valuesGuess.value='';showLaunch();});
for(const control of [launchGuess,positionGuess,valuesGuess])control.addEventListener('change',()=>{launchRevealed=false;showLaunch();});
launchMap.addEventListener('click',event=>{
  const button=event.target.closest('[data-thread]');if(!button)return;
  launchSelected=Number(button.dataset.thread);
  for(const card of launchMap.querySelectorAll('[data-thread]'))card.setAttribute('aria-pressed',String(card===button));
  inspectGrouping();
});
document.getElementById('hello-launch-run').addEventListener('click',()=>{
  const missing=[launchGuess,positionGuess,valuesGuess].find(el=>!el.value);
  if(missing){launchFeedback.textContent='Choose all three predictions first.';missing.focus();return;}
  launchRevealed=true;showLaunch();
});
document.getElementById('hello-launch-download').addEventListener('click',()=>{
  if(launchRevealed)downloadCuda(runnableSource(2,Number(launchSize.value)),'hello-grouping.cu');
});
document.getElementById('hello-launch-run').disabled=false;
registerExperiment('hello-launch',()=>({version:2,revealed:launchRevealed,selected:launchSelected}),state=>{
  launchRevealed=state.version===2&&state.revealed===true&&[launchGuess,positionGuess,valuesGuess].every(el=>el.value);
  launchSelected=Number.isInteger(state.selected)&&state.selected>=0&&state.selected<8?state.selected:4;
  showLaunch();
});

// One-character bounds diagnosis, taught after the correct guard.
const boundsGuess=document.getElementById('hello-bounds-guess');
const boundsFeedback=document.getElementById('hello-bounds-feedback');
const boundsAnswer=document.getElementById('hello-bounds-answer');
const boundsMap=document.getElementById('hello-map-3');
let boundsRevealed=false,boundsFixed=false,boundsSelected=5;
function boundsModel(){return inspectLaunch(5,4,2,boundsFixed?'<':'<=');}
function inspectBounds(){
  const t=boundsModel().threads[boundsSelected];
  document.getElementById('hello-bounds-index').textContent=`Thread ${t.i}: ${t.i} ${boundsFixed?'<':'<='} 5 is ${!t.skipped}. `+(t.invalid?`The condition permits an invalid read of input[${t.i}] and write of output[${t.i}]. There is no valid result.`:t.skipped?'The condition skips both array accesses and the multiplication.':`Input ${tensorValue(t.input)} → output ${tensorValue(t.output)}.`);
}
function showBounds(){
  boundsAnswer.hidden=!boundsRevealed;
  document.getElementById('hello-diagnostic-code').textContent=`if (i ${boundsFixed?'<':'<='} n) {\n    output[i] = input[i] * 2.0f;\n}`;
  document.getElementById('hello-diagnostic-code-label').textContent='CUDA C++ · '+(boundsFixed?'correct condition restored':'changed condition');
  if(!boundsRevealed){boundsFeedback.textContent='Choose a thread, then check.';return;}
  boundsFeedback.textContent=boundsFixed?'With i < n restored, thread 5 skips the arrays along with threads 6 and 7.':(boundsGuess.value==='5'?'Correct. ':'Compare the affected thread below. ')+'Thread 5 passes 5 <= 5, but index 5 has no element. Threads 6 and 7 fail the condition and still skip.';
  boundsMap.innerHTML=renderIntroMap(3,boundsModel(),boundsSelected,true);
  document.getElementById('hello-bounds-fix').hidden=boundsFixed;
  inspectBounds();
}
boundsGuess.addEventListener('change',()=>{boundsRevealed=false;boundsFixed=false;showBounds();});
document.getElementById('hello-bounds-check').disabled=false;
document.getElementById('hello-bounds-check').addEventListener('click',()=>{
  if(!boundsGuess.value){boundsFeedback.textContent='Choose your prediction first.';boundsGuess.focus();return;}
  boundsRevealed=true;boundsFixed=false;boundsSelected=5;showBounds();
});
document.getElementById('hello-bounds-fix').addEventListener('click',()=>{boundsFixed=true;showBounds();document.getElementById('hello-bounds-check').focus({preventScroll:true});});
boundsMap.addEventListener('click',event=>{
  const button=event.target.closest('[data-thread]');if(!button)return;
  boundsSelected=Number(button.dataset.thread);
  for(const card of boundsMap.querySelectorAll('[data-thread]'))card.setAttribute('aria-pressed',String(card===button));
  inspectBounds();
});
registerExperiment('hello-bounds',()=>({revealed:boundsRevealed,fixed:boundsFixed,selected:boundsSelected}),state=>{
  boundsRevealed=state.revealed===true&&boundsGuess.value!=='';boundsFixed=boundsRevealed&&state.fixed===true;
  boundsSelected=Number.isInteger(state.selected)&&state.selected>=0&&state.selected<8?state.selected:5;showBounds();
});

// Transfer: distinguish insufficient coverage from invalid accesses.
const coverageGuess=document.getElementById('hello-coverage-guess');
const repairBlocks=document.getElementById('hello-repair-blocks');
const skipGuess=document.getElementById('hello-skip-guess');
const transferAnswer=document.getElementById('hello-transfer-result');
const transferDiagram=document.getElementById('hello-transfer-diagram');
let transferRevealed=false;
function showTransfer(){
  transferDiagram.hidden=!transferRevealed;
  if(!transferRevealed){transferAnswer.textContent='Make your three predictions, then check.';return;}
  const state=inspectLaunch(9,4,Number(repairBlocks.value));
  const minimum=launchPlan(9,4).blocks;
  const matched=coverageGuess.value==='missing'&&state.blocks===minimum&&skipGuess.value==='9';
  transferAnswer.textContent=(matched?'All three predictions match. ':'Compare your predictions with the launch below. ')+
    'Two blocks launch eight threads, leaving input index 8 without a thread. The bounds check prevents invalid accesses but cannot supply missing threads. '+
    (state.missing.length?`Your ${state.blocks} blocks still leave index ${state.missing.join(', ')} unwritten.`:`Your ${state.blocks} blocks write all nine results. `+(state.blocks===minimum?'This is the smallest sufficient launch.':'This is safe, but three blocks are sufficient.'))+
    ' With the smallest launch, indices 9–11 skip; index 8 must write the ninth result.';
  transferDiagram.innerHTML=`<h3>Your launch: ${state.blocks} blocks × 4 threads</h3><div class="hello-transfer-cells">`+
    state.input.map((value,i)=>`<div class="hello-transfer-cell"><small>Input[${i}] · ${tensorValue(value)}</small><small>Output</small><strong>${state.output[i]===null?'Unwritten':tensorValue(state.output[i])}</strong><small>${state.output[i]===null?'No thread launched':`Thread ${i}`}</small></div>`).join('')+
    `</div><p>${state.threads.filter(t=>t.skipped).length?'Skipped thread indices: '+state.threads.filter(t=>t.skipped).map(t=>t.i).join(', '):'No launched thread skips.'}</p>`;
}
for(const control of [coverageGuess,repairBlocks,skipGuess])control.addEventListener('change',()=>{transferRevealed=false;showTransfer();});
document.getElementById('hello-transfer-run').disabled=false;
document.getElementById('hello-transfer-run').addEventListener('click',()=>{
  const missing=[coverageGuess,repairBlocks,skipGuess].find(el=>!el.value);
  if(missing){transferAnswer.textContent='Choose all three predictions first.';missing.focus();return;}
  transferRevealed=true;showTransfer();
});
registerExperiment('hello-transfer',()=>({version:2,revealed:transferRevealed}),state=>{
  transferRevealed=state.version===2&&state.revealed===true&&[coverageGuess,repairBlocks,skipGuess].every(el=>el.value);showTransfer();
});
