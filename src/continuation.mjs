// Copyright © 2026 Christopher Snow.
import './theme.mjs';
import {registerExperiment} from './experiment-state.mjs';
import {continuationChapters,computeExperiment,experimentResult,traceLength} from './continuation-view.mjs';
import {openingCode} from './chapter-view.mjs';
const chapter=continuationChapters.find(chapter=>chapter.slug===document.body.dataset.chapter);
for(const section of chapter.sections.filter(section=>section.experiment)){
  const root=document.querySelector(`[data-book-experiment="${section.id}"]`),experiment=section.experiment;
  const $=selector=>root.querySelector(selector);
  let cursor=0,revealed=false,result;
  function configuration(){
    const config={...experiment.defaults};
    for(const control of experiment.controls){
      const value=$(`[data-setting="${control.key}"]`).value;
      const option=control.options.find(([option])=>String(option)===value);
      if(!option)throw new Error('Choose one of the listed settings.');
      config[control.key]=option[0];
    }
    return config;
  }
  function code(){if(experiment.code)$('[data-experiment-code]').innerHTML=openingCode(experiment.code(configuration()));}
  function draw(){
    $('[data-results]').hidden=!revealed;
    if(!revealed)return;
    const steps=traceLength(experiment,result);
    cursor=Math.max(0,Math.min(cursor,steps-1));
    $('[data-steps]').hidden=steps<=1;
    $('[data-visual-output]').innerHTML=experimentResult(experiment,result,cursor);
    $('[data-back]').disabled=cursor===0;
    $('[data-next]').disabled=cursor===steps-1;
    $('[data-position]').textContent=`Step ${cursor+1} of ${steps}`;
  }
  function run(){
    try{result=computeExperiment(experiment,configuration());cursor=0;revealed=true;draw();$('[role="status"]').textContent=traceLength(experiment,result)<=1?'Run complete. Compare the result below with your prediction.':'Run complete. Inspect the result below, then follow the steps.';}
    catch(error){revealed=false;draw();$('[role="status"]').textContent=error.message;}
  }
  for(const control of root.querySelectorAll('[data-setting]'))control.addEventListener('change',()=>{revealed=false;cursor=0;code();draw();$('[role="status"]').textContent='Settings changed. Predict again, then Run to update this example.';});
  $('[data-run]').addEventListener('click',run);
  $('[data-back]').addEventListener('click',()=>{cursor--;draw();});
  $('[data-next]').addEventListener('click',()=>{cursor++;draw();});
  draw();$('[role="status"]').textContent='Predict the result, then Run to see it.';
  registerExperiment(section.id,()=>({cursor,revealed}),state=>{cursor=state.cursor;revealed=state.revealed;code();if(revealed)result=computeExperiment(experiment,configuration());draw();});
}
