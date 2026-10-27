// Copyright © 2026 Christopher Snow.
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {desktopExamples} from '../src/desktop-catalog.mjs';
import {pythonProgram} from '../src/desktop-program.mjs';
import {runnableSource} from '../src/hello-model.mjs';
import {cudaSource} from '../src/kernel-model.mjs';
export async function exportDesktop(destination){
  await mkdir(destination,{recursive:true});
  const examples=desktopExamples();
  for(const example of examples)await writeFile(`${destination}/${example.filename}`,pythonProgram(example.source));
  await writeFile(`${destination}/hello.cu`,runnableSource(2));
  for(const [name,operation] of [['kernel-scale','multiply'],['kernel-vector-add','vector-add']])await writeFile(`${destination}/${name}.cu`,cudaSource({index:'global',guard:true,operation,task:operation==='vector-add'?'vector-add':'scale',blockSize:32}));
  await writeFile(`${destination}/manifest.json`,JSON.stringify(examples.map(({slug,id,filename})=>({slug,id,filename,execution:'PyTorch; CPU value/layout checks; CUDA hardware unvalidated'})),null,2));
  return examples;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const destination=process.argv[2]??'test-results/desktop-examples';
  const examples=await exportDesktop(destination);
  console.log(`Exported ${examples.length} PyTorch examples and three CUDA programs to ${destination}`);
}
