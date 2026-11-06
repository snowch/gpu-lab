// Copyright © 2026 Christopher Snow.
export function mountSmValues(){
 const inputs=[1,2],steps=[0,0];let selected=0,lastMultiply=null;
 const $=id=>document.getElementById('vsm-'+id),value=x=>Math.fround(x).toFixed(1);
 const unknown=()=>'<span class="vsm-unknown">—</span>';
 function render(){
  const step=steps[selected],x=value(inputs[selected]),y=value(inputs[selected]*2);
  document.querySelectorAll('#sm-values [data-active]').forEach(el=>el.dataset.active='false');
  for(let i=0;i<2;i++){
   $('loaded-'+i).innerHTML=steps[i]>=1?value(inputs[i]):unknown();
   $('result-'+i).innerHTML=steps[i]>=2?value(inputs[i]*2):unknown();
   $('output-'+i).textContent=steps[i]>=3?value(inputs[i]*2):'?';
   $('register-row-'+i).dataset.selected=String(i===selected);
   $('input-'+i).dataset.selected=String(i===selected);
   $('output-cell-'+i).dataset.selected=String(i===selected);
  }
  for(let i=1;i<=3;i++){
   $('progress-'+i).dataset.done=String(step>=i);
   if(step===i)$('progress-'+i).setAttribute('aria-current','step');else $('progress-'+i).removeAttribute('aria-current');
  }
  $('next').textContent=step===3?(steps[1-selected]<3?'Inspect Thread '+(1-selected):'Both outputs inspected'):['Load input','Multiply value','Write output'][step];
  $('action-context').textContent=`Inspecting Thread ${selected} · ${step} of 3 actions inspected`;
  $('next').disabled=steps.every(s=>s===3);$('reset').disabled=steps.every(s=>s===0);
  $('memory-path-label').textContent=step===1?'Load input':step===3?'Write output':'Memory reads / writes';
  $('register-path-label').textContent=step===1?'Loaded value enters the register':step===3?'Result leaves the register for output memory':'Values between memory instructions and registers';
  if(step===0){
   $('status').textContent=`Inspect Thread ${selected}: its input is ${x}. Load that value into its working register.`;
   $('load-store-values').textContent=`Ready to inspect the read of input[${selected}].`;
  }else if(step===1){
   $('status').innerHTML=`Thread ${selected}’s input, <strong>${x}</strong>, is now in its working register. The output is still <strong>?</strong>; it will be written by the store.`;
   $('load-store-values').textContent=`input[${selected}] → ${x} → Thread ${selected}’s input register`;
  }else if(step===2){
   $('status').innerHTML=`The shared arithmetic hardware uses Thread ${selected}’s <strong>${x}</strong> and returns <strong>${y}</strong> to its result register. Next, write that result to output memory.`;
   $('load-store-values').textContent='The result is in a register, ready to be stored.';
  }else{
   $('status').innerHTML=`Load/store hardware writes <strong>${y}</strong> from Thread ${selected}’s result register to <strong>output[${selected}]</strong>. ${steps[1-selected]<3?'Inspect the other thread to follow its values through the same hardware.':'Both inspected outputs have now been written.'}`;
   $('load-store-values').textContent=`Thread ${selected}’s result register → ${y} → output[${selected}]`;
  }
  if(step===1||step===3){['load-store','registers','memory-path','register-path'].forEach(id=>$(id).dataset.active='true');$(step===1?'input-'+selected:'output-cell-'+selected).dataset.active='true';}
  if(step===2){['registers','arithmetic-unit','arithmetic-path'].forEach(id=>$(id).dataset.active='true');}
  if(lastMultiply!==null)$('calculation').innerHTML=`<small>Inspected calculation · Thread ${lastMultiply}</small><span>${value(inputs[lastMultiply])} × 2</span><span>↓ ${value(inputs[lastMultiply]*2)}</span>`;
  else $('calculation').innerHTML='<small>No multiplication inspected yet.</small><span>× 2</span>';
  $('takeaway').innerHTML=steps.every(s=>s>=2)?'<span class="vsm-lead-answer">Different working values. The same arithmetic hardware.</span> The shared hardware above has been used to inspect both multiplications; the register rows keep each thread’s values separate.':step===2?'The result is already in a register. Writing it to output memory is a separate action.':step===3?'The store puts the result in the output array. Inspect the other thread to see the hardware used with different working values.':'A value must be loaded into a working register before the multiplication can use it.';
 }
 document.querySelectorAll('input[name=vsm-thread]').forEach(input=>input.addEventListener('change',()=>{selected=Number(input.value);render();}));
 $('next').addEventListener('click',()=>{if(steps[selected]<3){steps[selected]++;if(steps[selected]===2)lastMultiply=selected;}else if(steps[1-selected]<3){selected=1-selected;$('thread-'+selected).checked=true;}render();});
 $('reset').addEventListener('click',()=>{steps[0]=0;steps[1]=0;selected=0;lastMultiply=null;$('thread-0').checked=true;render();});

 render();
 return {save:()=>({steps:[...steps],selected,lastMultiply}),restore:saved=>{
  steps[0]=saved?.steps?.[0];steps[1]=saved?.steps?.[1];
  if(!steps.every(s=>Number.isInteger(s)&&s>=0&&s<=3)){steps[0]=0;steps[1]=0;}
  selected=saved?.selected===1?1:0;
  lastMultiply=[0,1].includes(saved?.lastMultiply)&&steps[saved.lastMultiply]>=2?saved.lastMultiply:null;
  $('thread-'+selected).checked=true;render();
 }};
}
