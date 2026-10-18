// Copyright © 2026 Christopher Snow.
import {renderTensorStep} from './tensor-layout.mjs';
let direction='row';
function render(){
  document.getElementById('tensor-diagram').innerHTML=renderTensorStep({row:Number(document.getElementById('tensor-origin-row').value),col:Number(document.getElementById('tensor-origin-col').value),direction});
  for(const button of document.querySelectorAll('[data-index-step]'))button.setAttribute('aria-pressed',String(button.dataset.indexStep===direction));
}
for(const button of document.querySelectorAll('[data-index-step]'))button.addEventListener('click',()=>{direction=button.dataset.indexStep;render();});
for(const id of ['tensor-origin-row','tensor-origin-col'])document.getElementById(id).addEventListener('change',render);
render();
