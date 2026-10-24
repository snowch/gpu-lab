// Copyright © 2026 Christopher Snow.
import './theme.mjs';
import {steps,kernelSource,runnableSource,analyse} from './hello-model.mjs';
import {downloadCuda} from './cuda-program.mjs';
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
  $('hello-pytorch').textContent = [
    'import torch\ny = torch.full((1,), 42.0)',
    'import torch\ny = torch.arange(4, dtype=torch.float32)',
    'import torch\nx = torch.arange(1, 5, dtype=torch.float32)\ny = 2 * x',
    'import torch\nx = torch.arange(1, 6, dtype=torch.float32)\ny = 2 * x'
  ][current];
  $('hello-launch').textContent='Launch: '+Math.ceil(step.length/step.size)+' block(s), '+step.size+' thread(s) per block.';
  $('hello-input').hidden=current<2;
  $('hello-input').textContent='Input: ['+Array.from({length:step.length},(_,i)=>i+1).join(', ')+']';
  $('hello-output').textContent='Run to see the output.';
  $('hello-backend').textContent='Browser simulation · evaluates the supported CUDA examples on the CPU; no CUDA compilation or GPU execution.';
  $('hello-next').hidden=true; $('hello-repair').hidden=true;
  $('hello-back').hidden=current===0;
  $('hello-full').textContent=kernelSource(current,edits[current]);
}
$('hello-code').addEventListener('input',()=>{
  edits[current]=$('hello-code').value;
  $('hello-output').textContent='Code changed. Run to see the new output.';
  $('hello-next').hidden=true;$('hello-repair').hidden=true;
  $('hello-full').textContent=kernelSource(current,edits[current]);
});
$('hello-run').addEventListener('click',async()=>{
  if(busy)return;
  busy=true;$('hello-run').disabled=true;$('hello-code').disabled=true;$('hello-back').disabled=true;$('hello-reset').disabled=true;
  $('hello-next').hidden=true;$('hello-repair').hidden=true;
  $('hello-output').textContent='Running…';
  try {
    const result=analyse(current,edits[current]);
    $('hello-output').textContent='Output: '+(current===0?result.output[0]:'['+result.output.map(v=>v===null?'unwritten':v).join(', ')+']');
    $('hello-backend').textContent='Browser simulation · not measured GPU output.';
    if(current===3) $('hello-output').textContent+='\n'+result.launched+' threads launched; '+result.skipped+' skipped the arrays.';
    $('hello-next').hidden=current===steps.length-1;
    $('hello-repair').hidden=current!==steps.length-1 || result.output.some(v=>v===null);
  }catch(error){$('hello-output').textContent=error.message;$('hello-backend').textContent='No result produced. Adjust the code or restore the example.';}
  finally{busy=false;$('hello-run').disabled=false;$('hello-code').disabled=false;$('hello-back').disabled=false;$('hello-reset').disabled=false;}
});
$('hello-next').addEventListener('click',()=>{current++;show();$('hello-title').focus();});
$('hello-back').addEventListener('click',()=>{current--;show();$('hello-title').focus();});
$('hello-reset').addEventListener('click',()=>{edits[current]=steps[current].body;show();});
show();

$('hello-download').addEventListener('click',()=>{
  try {downloadCuda(runnableSource(current,edits[current]),'hello.cu');}
  catch(error){$('hello-output').textContent=error.message;}
});
