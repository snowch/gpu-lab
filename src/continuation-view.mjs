// Copyright © 2026 Christopher Snow.
import {chapters as hardware,renderResult as hardwareResult} from './continuation-hardware.mjs';
import {chapters as matrix,renderResult as matrixResult} from './continuation-matrix.mjs';
import {chapters as applications,renderResult as applicationsResult} from './continuation-applications.mjs';
import {scheduleWarps,branchWarp} from './architecture.mjs';
import {reduceBlock,tiledMatmul,precisionMatmul,attention,inferenceBudget} from './ai-models.mjs';
import {openingCode,browserNotice,definitions,readerTask} from './chapter-view.mjs';
import {escape} from './continuation-ui.mjs';
export const continuationChapters=[...hardware,...matrix,...applications];
const models={scheduling:scheduleWarps,divergence:branchWarp,reduction:reduceBlock,matmul:tiledMatmul,'tensor-cores':precisionMatmul,attention,inference:inferenceBudget};
export function computeExperiment(experiment,config=experiment.defaults){
  const model=models[experiment.model];
  if(!model)throw new Error('Unknown chapter model: '+experiment.model);
  return model(config);
}
export function experimentResult(experiment,result,cursor=0){
  const render=[hardwareResult,matrixResult,applicationsResult];
  for(const renderer of render){const html=renderer(experiment.model,result,cursor,experiment.focus);if(html!==null&&html!==undefined)return html;}
  throw new Error('Missing chapter visual: '+experiment.model);
}
export function renderContinuation(chapter){
  return `<section class="book-section"><h2>Start with the operation</h2>${openingCode(chapter.source)}${chapter.openingHTML}${browserNotice()}</section>`+
  chapter.sections.map((section,index)=>{
    const experiment=section.experiment;
    let interactive='';
    if(experiment){
      const result=computeExperiment(experiment);
      interactive=`<div class="continuation-experiment" data-book-experiment="${section.id}">
      <div class="controls">${experiment.controls.map(control=>`<label for="${section.id}-${control.key}">${escape(control.label)}<select id="${section.id}-${control.key}" data-setting="${control.key}">${control.options.map(([value,label])=>`<option value="${escape(value)}"${value===experiment.defaults[control.key]?' selected':''}>${escape(label)}</option>`).join('')}</select></label>`).join('')}</div>
      ${experiment.code?`<details class="continuation-code"><summary>Inspect the PyTorch example for these settings</summary><div data-experiment-code>${openingCode(experiment.code(experiment.defaults))}</div></details>`:''}
      <button type="button" class="primary continuation-run" data-run>Run</button>
      <p id="${section.id}-feedback" class="continuation-feedback" role="status">Predict the result, then run. The worked example below uses the initial settings.</p>
      <div data-results><div class="continuation-steps"${experiment.trace===false?' hidden':''}><button type="button" data-back disabled>Previous step</button><button type="button" data-next${experiment.trace===false||result.trace.length<=1?' disabled':''}>Next step</button><output data-position>Step 1 of ${result.trace.length}</output></div><div data-visual-output>${experimentResult(experiment,result)}</div></div></div>`;
    }
    return `<section class="book-section continuation-section" id="${section.id}"><p class="eyebrow">Idea ${index+1} of ${chapter.sections.length}</p><h2>${section.title}</h2>${definitions(section.terms)}${section.body}${section.task?readerTask(section.task):''}${interactive}${section.after||''}</section>`;
  }).join('')+`${chapter.optionalHTML||''}<section class="book-section continuation-transfer"><h2>Try a new case</h2>${readerTask(chapter.transfer.prompt,'Apply it')}<details><summary>Compare your answer</summary><div>${chapter.transfer.answer}</div></details></section>`;
}
