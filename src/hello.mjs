// Copyright © 2026 Christopher Snow.
import {tensorValue} from './value-format.mjs';
import {registerExperiment} from './experiment-state.mjs';
import './theme.mjs';
import {simulateIntro,runnableSource,launchPlan,launchSource,introPrompt,inspectLaunch} from './hello-model.mjs';
import {downloadCuda} from './cuda-program.mjs';
import {renderIntroMap,renderIndexSubstitution} from './hello-view.mjs';
const byId=id=>document.getElementById(id);
const factorInput=byId('hello-factor-0'),introMap=byId('hello-map-0');
let introSelected=0,introResult=null,incomingIntroVersion=3;
function introModel(){
 if(factorInput.value.trim()==='')throw new Error('Enter a multiplier first.');
 return simulateIntro(0,Number(factorInput.value));
}
function inspectIntro(){
 const thread=introModel().threads[introSelected];
 byId('hello-index-0').textContent=`Thread ${thread.i} reads x[${thread.i}] = ${tensorValue(thread.input)}. `+(introResult?`Writes y[${thread.i}] = ${tensorValue(thread.output)}.`:'Run to reveal its output.');
}
function drawIntro(){
 try{const state=introModel();introMap.innerHTML=renderIntroMap(0,state,introSelected,introResult!==null);inspectIntro();}
 catch(error){introMap.replaceChildren();byId('hello-index-0').textContent=error.message;}
}
introMap.addEventListener('click',event=>{
 const button=event.target.closest('[data-thread]');if(!button)return;
 introSelected=Number(button.dataset.thread);
 for(const row of introMap.querySelectorAll('tbody tr')){
  const control=row.querySelector('[data-thread]'),chosen=Number(control.dataset.thread)===introSelected;
  control.setAttribute('aria-pressed',String(chosen));row.classList.toggle('is-selected',chosen);
 }
 inspectIntro();
});
factorInput.addEventListener('input',()=>{introResult=null;drawIntro();byId('hello-output-0').textContent='Settings changed. Run to inspect the new results.';});
byId('hello-run-0').addEventListener('click',()=>{
 try{introResult=introModel();drawIntro();byId('hello-output-0').textContent='Output: ['+introResult.output.map(tensorValue).join(', ')+']';}
 catch(error){introResult=null;byId('hello-output-0').textContent=error.message;}
});
drawIntro();byId('hello-run-0').disabled=false;
registerExperiment('hello-0',()=>({version:3,selected:introSelected,ran:introResult!==null}),state=>{
 incomingIntroVersion=state.version;
 introSelected=Number.isInteger(state.selected)&&state.selected>=0&&state.selected<5?state.selected:0;
 try{introResult=state.ran===true&&!state.message?.startsWith('Example output:')?introModel():null;}catch{introResult=null;}
 drawIntro();byId('hello-output-0').textContent=introResult?'Output: ['+introResult.output.map(tensorValue).join(', ')+']':introPrompt(0);
});
// The former standalone thread demo is now the opening table. Migrate its
// selection without revealing an answer for a different multiplier.
registerExperiment('hello-1',()=>({version:3}),state=>{
 if(incomingIntroVersion!==3&&Number.isInteger(state.selected)&&state.selected>=0&&state.selected<5){introSelected=state.selected;drawIntro();}
});
const grouped=simulateIntro(2,2);let groupedSelected=4;
function inspectBlock(){byId('hello-index-2').innerHTML=renderIndexSubstitution(grouped.threads[groupedSelected],grouped);}
byId('hello-map-2').addEventListener('click',event=>{
 const button=event.target.closest('[data-thread]');if(!button)return;groupedSelected=Number(button.dataset.thread);
 for(const card of byId('hello-map-2').querySelectorAll('[data-thread]'))card.setAttribute('aria-pressed',String(card===button));inspectBlock();
});
registerExperiment('hello-2',()=>({version:3,selected:groupedSelected}),state=>{
 groupedSelected=Number.isInteger(state.selected)&&state.selected>=0&&state.selected<8?state.selected:4;
 byId('hello-map-2').innerHTML=renderIntroMap(2,grouped,groupedSelected);inspectBlock();
});
// Retain these hook names so earlier restart snapshots still restore. Bounds
// diagnosis has its own hook; the repeated final worked trace has been removed.
for(const stage of [3,4])registerExperiment('hello-'+stage,()=>({version:3}),()=>{});
byId('hello-bridge-download-2').addEventListener('click',()=>downloadCuda(runnableSource(2),'hello-blocks.cu'));

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
  transferDiagram.innerHTML=`<h3>Your launch: ${state.blocks} blocks × 4 threads</h3><div class="hello-table-wrap"><table class="hello-transfer-table"><caption>Results for your checked launch</caption><thead><tr><th scope="col">Index</th><th scope="col">Input</th><th scope="col">Output</th><th scope="col">Thread</th></tr></thead><tbody>`+
    state.input.map((value,i)=>`<tr class="hello-transfer-cell"><th scope="row">${i}</th><td>${tensorValue(value)}</td><td><strong>${state.output[i]===null?'Unwritten':tensorValue(state.output[i])}</strong></td><td>${state.output[i]===null?'Not launched':i}</td></tr>`).join('')+
    `</tbody></table></div><p>${state.threads.filter(t=>t.skipped).length?'Skipped thread indices: '+state.threads.filter(t=>t.skipped).map(t=>t.i).join(', '):'No launched thread skips.'}</p>`;
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
