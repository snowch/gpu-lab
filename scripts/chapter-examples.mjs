// Copyright © 2026 Christopher Snow.
// Export displayed snippets and model data for independent CPU PyTorch validation.
import {continuationChapters,computeExperiment} from '../src/continuation-view.mjs';
const examples=[];
for(const chapter of continuationChapters){
  examples.push({slug:chapter.slug,id:'opening',source:chapter.source});
  for(const section of chapter.sections.filter(s=>s.experiment?.code)){
    const experiment=section.experiment;
    const combinations=experiment.controls.reduce((configs,control)=>configs.flatMap(config=>control.options.map(([value])=>({...config,[control.key]:value}))),[{...experiment.defaults}]);
    for(const config of combinations){
      const result=computeExperiment(experiment,config);
      examples.push({slug:chapter.slug,id:section.id,source:experiment.code(config),expected:chapter.slug==='divergence'?{y:result.lanes.filter(l=>l.active).map(l=>l.output)}:chapter.slug==='reduction'?{total:result.expected}:chapter.slug==='matmul'?{c:result.output}:chapter.slug==='tensor-cores'?{converted:result.converted,total:result.result,reference:result.reference}:chapter.slug==='attention'?{out:result.output}:null});
    }
  }
}
process.stdout.write(JSON.stringify(examples));
