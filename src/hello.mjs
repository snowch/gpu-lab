// Copyright © 2026 Christopher Snow.
import './theme.mjs';
import {steps,shaderSource} from './hello-model.mjs';
import {execute} from './hello-gpu.mjs';
const $=id=>document.getElementById(id);
let current=0,busy=false;
const edits=steps.map(step=>step.body);
function show(){
  const step=steps[current];
  $('hello-title').textContent=step.title;
  $('hello-count').textContent='Step '+(current+1)+' of '+steps.length;
  $('hello-description').textContent=step.description;
  $('hello-instruction').textContent=step.instruction;
  $('hello-before').textContent=step.before;
  $('hello-code').value=edits[current]; $('hello-code').rows=current===3?4:2;
  $('hello-after').textContent=step.after;
  $('hello-explanation').textContent=step.explain;
  $('hello-input').hidden=current<2;
  $('hello-input').textContent='Input: ['+Array.from({length:step.length},(_,i)=>i+1).join(', ')+']';
  $('hello-output').textContent='Run to see the output.';
  $('hello-backend').textContent='Run uses WebGPU when available. Otherwise, a labelled browser model runs this exercise.';
  $('hello-next').hidden=true; $('hello-repair').hidden=true;
  $('hello-back').hidden=current===0;
  $('hello-full').textContent=shaderSource(current,edits[current]);
}
$('hello-code').addEventListener('input',()=>{
  edits[current]=$('hello-code').value;
  $('hello-output').textContent='Code changed. Run to see the new output.';
  $('hello-next').hidden=true;$('hello-repair').hidden=true;
  $('hello-full').textContent=shaderSource(current,edits[current]);
});
$('hello-run').addEventListener('click',async()=>{
  if(busy)return;
  busy=true;$('hello-run').disabled=true;$('hello-code').disabled=true;$('hello-back').disabled=true;$('hello-reset').disabled=true;
  $('hello-next').hidden=true;$('hello-repair').hidden=true;
  $('hello-output').textContent='Running…';
  try {
    const result=await execute(current,edits[current]);
    $('hello-output').textContent='Output: '+(current===0?result.output[0]:'['+result.output.map(v=>v===null?'unwritten':v).join(', ')+']');
    $('hello-backend').textContent=result.backend;
    if(current===3) $('hello-output').textContent+='\n'+result.launched+' invocations launched; '+result.skipped+' skipped the arrays.';
    $('hello-next').hidden=current===steps.length-1;
    $('hello-repair').hidden=current!==steps.length-1 || result.output.some(v=>v===null);
  }catch(error){$('hello-output').textContent=error.message;$('hello-backend').textContent='No result produced. Adjust the code or restore the example.';}
  finally{busy=false;$('hello-run').disabled=false;$('hello-code').disabled=false;$('hello-back').disabled=false;$('hello-reset').disabled=false;}
});
$('hello-next').addEventListener('click',()=>{current++;show();$('hello-title').focus();});
$('hello-back').addEventListener('click',()=>{current--;show();$('hello-title').focus();});
$('hello-reset').addEventListener('click',()=>{edits[current]=steps[current].body;show();});
show();
