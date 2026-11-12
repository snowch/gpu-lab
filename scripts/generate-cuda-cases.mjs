// Copyright © 2026 Christopher Snow.
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {runnableSource} from '../src/hello-model.mjs';
import {cudaSource} from '../src/kernel-model.mjs';
const destination=process.argv[2]??'test-results/generated-cuda';
await mkdir(destination,{recursive:true});
// Exercise the exact practice download with both the worked and transfer inputs.
const launchSource=await readFile(new URL('../examples/launch-from-input.cu',import.meta.url),'utf8');
for(const [name,values] of [
  ['five',[1,2,3,4,5]],
  ['nine',[1,2,3,4,5,-1,0,0.5,12]],
]) {
  const source=launchSource.replace(/(std::vector<float> input = \{)[\s\S]*?(\};)/,(_,start,end)=>`${start}\n        ${values.map(x=>x.toFixed(1)+'f').join(', ')}\n    ${end}`);
  await writeFile(`${destination}/launch-input-${name}.cu`,source);
  await writeFile(`${destination}/launch-input-${name}.json`,JSON.stringify(values.map(x=>x*2)));
}
for(const [name,factor] of [['double',2],['negative',-0.5],['zero',0],['fractional',3.25]]) {
  // Use the browser download generator, with an independent scalar reference.
  await writeFile(`${destination}/${name}.cu`,runnableSource(factor));
  await writeFile(`${destination}/${name}.json`,JSON.stringify([1,2,3,4,5].map(x=>x*factor)));
}

// Match the chapter's one-block/eight-thread regrouping download.
await writeFile(`${destination}/double-eight.cu`,runnableSource(2,8));
await writeFile(`${destination}/double-eight.json`,JSON.stringify([2,4,6,8,10]));

// Guarded global indexing covers every output once, including the partial block.
// Derive references directly from the documented input formulae, without taking
// expected values from the browser model or its task-correctness assessment.
for(const operation of ['multiply','add','vector-add']) {
  const expected=Array.from({length:35},(_,i)=>{
    const x=(i%2===0?1:-1)*(i+1)/2;
    const b=(i%5)-2.25;
    return Math.fround(operation==='multiply'?x*2:operation==='add'?x+2:x+b);
  });
  for(const blockSize of [8,16,32,64]) {
    const name=`workshop-${operation}-${blockSize}`;
    const program={index:'global',guard:true,operation,blockSize,task:operation==='vector-add'?'vector-add':'scale'};
    await writeFile(`${destination}/${name}.cu`,cudaSource(program));
    await writeFile(`${destination}/${name}.json`,JSON.stringify(expected));
  }
}
