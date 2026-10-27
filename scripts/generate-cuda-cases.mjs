// Copyright © 2026 Christopher Snow.
import {mkdir,writeFile} from 'node:fs/promises';
import {runnableSource} from '../src/hello-model.mjs';
import {cudaSource} from '../src/kernel-model.mjs';
const destination=process.argv[2]??'test-results/generated-cuda';
await mkdir(destination,{recursive:true});
for(const [name,factor] of [['double',2],['negative',-0.5],['zero',0],['fractional',3.25]]) {
  // Use the browser download generator, with an independent scalar reference.
  await writeFile(`${destination}/${name}.cu`,runnableSource(factor));
  await writeFile(`${destination}/${name}.json`,JSON.stringify([1,2,3,4,5].map(x=>x*factor)));
}

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
