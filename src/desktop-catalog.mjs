// Copyright © 2026 Christopher Snow.
import {pythonSource} from './hello-model.mjs';
import {deviceOpening,readingOpening,memorySetup,memoryExample} from './book-code.mjs';
import {tensorSetup,journeyCode,readingCode,deviceJourney,readTensor} from './foundations-model.mjs';
import {continuationChapters,computeExperiment} from './continuation-view.mjs';
export function desktopExamples(){
  const examples=[
    {slug:'hello',id:'opening',source:pythonSource(),expected:{y:[2,4,6,8,10]}},
    {slug:'devices',id:'opening',source:deviceOpening,expected:{y_cpu:[2,4,6,8,10]}},
    ...['reading','layout','requests'].map((slug,i)=>({slug,id:'opening',source:readingOpening(i===0?'selection':'layout'),expected:{y:readTensor({pattern:i===0?'row':'column'}).output}})),
    {slug:'memory',id:'opening',source:memoryExample},
    ...continuationChapters.map(chapter=>({slug:chapter.slug,id:'opening',source:chapter.source})),
  ];
  for(let stage=0;stage<3;stage++){
    const code=journeyCode({stage}),result=deviceJourney({stage});
    examples.push({slug:'devices',id:'device-'+stage,source:code.setup+'\n'+code.operation,expected:{[stage===0?'x_gpu':stage===1?'y_gpu':'y_cpu']:stage===0?result.input:result.output}});
  }
  for(const [slug,patterns] of [['reading',['row','column']],['layout',['column','packed']],['requests',['row','column','packed']]])for(const pattern of patterns)
    examples.push({slug,id:slug+'-'+pattern,source:tensorSetup+'\n'+readingCode({pattern}),expected:{y:readTensor({pattern}).output}});
  for(const chapter of continuationChapters)for(const section of chapter.sections.filter(s=>s.experiment?.code))
    examples.push({slug:chapter.slug,id:section.id,source:section.experiment.code(section.experiment.defaults)});
  return examples.map(example=>({...example,filename:(example.id==='opening'?example.slug:example.id)+'.py'}));
}
// Configurations exercise the displayed source templates independently of downloads.
export function testedPythonExamples(){
  const examples=desktopExamples();
  examples.push({slug:'memory',id:'memory-setup',source:memorySetup});
  for(const factor of [-0.5,0,2,3.25])examples.push({slug:'hello',id:'hello-factor',source:pythonSource(factor),expected:{y:[1,2,3,4,5].map(x=>x*factor)}});
  for(let stage=0;stage<3;stage++)for(const count of [5,8])for(const factor of [2,3.25]){
    const code=journeyCode({stage,count,factor}),result=deviceJourney({stage,count,factor});
    examples.push({slug:'devices',id:'device-'+stage,source:code.setup+'\n'+code.operation,expected:{[stage===0?'x_gpu':stage===1?'y_gpu':'y_cpu']:stage===0?result.input:result.output}});
  }
  for(const pattern of ['row','column','packed'])for(let index=0;index<5;index++)for(const factor of [2,-0.5])examples.push({slug:'reading',id:'reading-'+pattern,source:tensorSetup+'\n'+readingCode({pattern,index,factor}),expected:{y:readTensor({pattern,index,factor}).output}});
  for(const chapter of continuationChapters)for(const section of chapter.sections.filter(s=>s.experiment?.code)){
    const experiment=section.experiment;
    const configs=experiment.controls.reduce((configs,control)=>configs.flatMap(config=>control.options.map(([value])=>({...config,[control.key]:value}))),[{...experiment.defaults}]);
    for(const config of configs){
      const result=computeExperiment(experiment,config);
      examples.push({slug:chapter.slug,id:section.id,source:experiment.code(config),expected:chapter.slug==='divergence'?{y:result.lanes.filter(l=>l.active).map(l=>l.output)}:chapter.slug==='reduction'?{total:result.expected}:chapter.slug==='matmul'?{c:result.output}:chapter.slug==='tensor-cores'?{converted:result.converted,total:result.result,reference:result.reference}:chapter.slug==='attention'?{out:result.output}:null});
    }
  }
  return examples;
}
