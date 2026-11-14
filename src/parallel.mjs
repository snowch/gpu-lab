// Copyright © 2026 Christopher Snow.
import './theme.mjs';
import {registerExperiment} from './experiment-state.mjs';
import {parallelModels} from './parallel-models.mjs';
import {resultView} from './parallel-view.mjs';
for(const el of document.querySelectorAll('[data-parallel]')){
 const spec=JSON.parse(el.dataset.parallel),controls=[...el.querySelectorAll('[data-setting]')];
 let ran=false,step=0,result;
 const config=()=>Object.fromEntries(controls.map(c=>[c.dataset.setting,c.value]));
 function render(){
  el.querySelector('[data-result]').hidden=!ran;el.querySelector('[data-steps]').hidden=!ran;
  if(!ran){el.querySelector('[data-result]').innerHTML='';return;}
  result=parallelModels[spec.model](config());step=Math.min(step,result.steps.length-1);
  el.querySelector('[data-result]').innerHTML=resultView(result,step);
  el.querySelector('[data-position]').textContent=`Step ${step+1} of ${result.steps.length}`;
  el.querySelector('[data-prev]').disabled=step===0;el.querySelector('[data-next]').disabled=step===result.steps.length-1;
 }
 controls.forEach(c=>c.addEventListener('change',()=>{ran=false;step=0;render();el.querySelector('[role=status]').textContent='Settings changed. Predict again, then press Run.';}));
 el.querySelector('[data-run]').addEventListener('click',()=>{ran=true;step=0;render();el.querySelector('[role=status]').textContent='Result ready. Step through the dependencies, then explain the result.';});
 el.querySelector('[data-prev]').addEventListener('click',()=>{step--;render();});
 el.querySelector('[data-next]').addEventListener('click',()=>{step++;render();});
 registerExperiment(el.dataset.bookExperiment,()=>({config:config(),ran,step}),s=>{for(const c of controls)if([...c.options].some(o=>o.value===s.config[c.dataset.setting]))c.value=s.config[c.dataset.setting];ran=!!s.ran;step=Math.max(0,Number(s.step)||0);render();});
 render();
 el.querySelector('[data-run]').disabled=false;
}
