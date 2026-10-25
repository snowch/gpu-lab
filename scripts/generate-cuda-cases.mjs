// Copyright © 2026 Christopher Snow.
import {mkdir,writeFile} from 'node:fs/promises';
import {runnableSource} from '../src/hello-model.mjs';
const destination=process.argv[2]??'test-results/generated-cuda';
await mkdir(destination,{recursive:true});
for(const [name,factor] of [['double',2],['negative',-0.5],['zero',0],['fractional',3.25]]) {
  // Use the browser download generator, with an independent scalar reference.
  await writeFile(`${destination}/${name}.cu`,runnableSource(factor));
  await writeFile(`${destination}/${name}.json`,JSON.stringify([1,2,3,4,5].map(x=>x*factor)));
}
