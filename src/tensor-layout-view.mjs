// Copyright © 2026 Christopher Snow.
import {registerExperiment} from './experiment-state.mjs';
import {renderTensorStep,renderTensorSlice} from './tensor-layout.mjs';
let direction='row';
function render(){
  document.getElementById('tensor-diagram').innerHTML=renderTensorStep({row:Number(document.getElementById('tensor-origin-row').value),col:Number(document.getElementById('tensor-origin-col').value),direction});
  for(const button of document.querySelectorAll('[data-index-step]'))button.setAttribute('aria-pressed',String(button.dataset.indexStep===direction));
}
for(const button of document.querySelectorAll('[data-index-step]'))button.addEventListener('click',()=>{direction=button.dataset.indexStep;render();});
for(const id of ['tensor-origin-row','tensor-origin-col'])document.getElementById(id).addEventListener('change',render);
render();
for(const control of document.querySelectorAll('.tensor-visual-controls button,.tensor-visual-controls select'))control.disabled=false;
document.getElementById('tensor-diagram').dataset.ready='true';
const sliceMode=document.getElementById('tensor-slice-mode');
const renderSlice=()=>{document.getElementById('tensor-slice-diagram').innerHTML=renderTensorSlice(sliceMode.value);};
sliceMode.addEventListener('change',renderSlice);
renderSlice();sliceMode.disabled=false;
document.getElementById('tensor-slice-diagram').dataset.ready='true';

registerExperiment('tensor-layout',()=>({direction}),state=>{direction=state.direction;render();renderSlice();});
