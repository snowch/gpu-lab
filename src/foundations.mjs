// Copyright © 2026 Christopher Snow.
import './theme.mjs';
import {registerExperiment} from './experiment-state.mjs';
import {deviceJourney,readTensor,journeyCode,readingCode} from './foundations-model.mjs';
import {renderDeviceMap,renderReadMap} from './foundations-view.mjs';
function number(input,fallback) {
  if(!input) return fallback;
  if(input.value.trim()==='') throw new Error('Enter a multiplier first.');
  return Number(input.value);
}
for(const section of document.querySelectorAll('[data-book-experiment]')) {
  const device=section.hasAttribute('data-device-stage');
  const key=device?section.dataset.deviceStage:section.dataset.reading;
  const prefix=device?'device':'reading';
  const $=name=>document.getElementById(`${prefix}-${name}-${key}`);
  let ran=false;
  function config() {
    return device?{stage:Number(key),count:number($('count'),5),factor:number($('factor'),2)}:
      {pattern:$('pattern')?.value??key,index:number($('index'),0),factor:number($('factor'),2)};
  }
  function render() {
    try {
      const c=config(),s=device?deviceJourney(c):readTensor(c);
      if(device) {
        const source=journeyCode(c);$('setup').textContent=source.setup;$('code').textContent=source.operation;
        $('map').innerHTML=renderDeviceMap(s,ran);
        $('feedback').textContent=ran?`${s.transferBytes} bytes copied between devices. ${s.allocated} contains [${(s.stage===0?s.input:s.output).join(', ')}].`:'Run to inspect the result.';
      } else {
        $('code').textContent=readingCode(c);$('map').innerHTML=renderReadMap(s,ran,{sectors:key==='sectors'});
        let feedback=ran?'Output: ['+s.output.join(', ')+'].':'Run to inspect the output.';
        if(ran&&key==='sectors') {
          const raw=$('guess').value;
          feedback+=` ${s.load.sectors.length} sector${s.load.sectors.length===1?'':'s'} for ${s.load.usefulBytes} useful bytes.`;
          if(raw.trim()!=='') feedback+=Number(raw)===s.load.sectors.length?' Your prediction matches.':` You predicted ${raw}; follow the byte offsets to explain the difference.`;
        }
        $('feedback').textContent=feedback;
      }
    } catch(error) {
      ran=false;$('map').textContent='Enter valid settings to see the diagram.';$('feedback').textContent=error.message;
    }
  }
  for(const control of section.querySelectorAll('input,select')) control.addEventListener(control.tagName==='INPUT'?'input':'change',()=>{ran=false;render();});
  $('run').addEventListener('click',()=>{ran=true;render();});
  render();
  registerExperiment(section.dataset.bookExperiment,()=>({ran}),state=>{ran=state.ran===true;render();});
}
