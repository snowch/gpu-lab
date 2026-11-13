// Copyright © 2026 Christopher Snow.
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {runnableSource} from '../src/hello-model.mjs';
import {cudaSource} from '../src/kernel-model.mjs';
import {courseCudaProgram,nativeWmmaProgram} from '../src/course-cuda-source.mjs';
const destination=process.argv[2]??'test-results/generated-cuda';
await mkdir(destination,{recursive:true});
// Independent CPU references for the exact source shown throughout the course.
const bridgeExpected=[];
const matrix=Array.from({length:25},(_,i)=>i+1);
for(let row=0;row<5;row++)for(let col=0;col<5;col++)bridgeExpected.push(matrix[row*5+col]*2);
for(let col=0;col<5;col++)for(let row=0;row<5;row++)bridgeExpected.push(matrix[row*5+col]*2);
bridgeExpected.push(...[1,6,11,16,21],...[1,2,3,4,5].map(x=>x*2),...[1,6,11,16,21].map(x=>x*2));
bridgeExpected.push(...[1,2,3,4,5].map(x=>x*4));
bridgeExpected.push(...Array.from({length:32},(_,i)=>i%2?2:4),36);
const matrixExpected=Array.from({length:16},(_,i)=>{
  const row=Math.floor(i/4),col=i%4;
  return Array.from({length:4},(_,k)=>((row+k)%5-2)*((k+col)%3-1)).reduce((a,b)=>a+b,0);
});
bridgeExpected.push(...matrixExpected,...matrixExpected,...Array(8).fill(1),...Array(8).fill(-1));
const q=Array.from({length:8},(_,i)=>Array.from({length:4},(_,c)=>(i+c)%5-2));
const k=Array.from({length:8},(_,i)=>Array.from({length:4},(_,c)=>((2*i+c+4)%7-3)/2));
const v=Array.from({length:8},(_,i)=>Array.from({length:4},(_,c)=>(i+c)%9-4));
for(const query of q){
  const scores=k.map(key=>query.reduce((sum,x,c)=>sum+x*key[c],0)/2);
  const weights=scores.map(score=>Math.exp(score-Math.max(...scores)));
  const total=weights.reduce((a,b)=>a+b,0);
  for(let c=0;c<4;c++)bridgeExpected.push(weights.reduce((sum,w,key)=>sum+w*v[key][c],0)/total);
}
bridgeExpected.push(...Array.from({length:12},(_,i)=>i/10),0.2,0.3,0.4,0.5,...Array.from({length:16},(_,i)=>i));
await writeFile(`${destination}/course-bridges.cu`,courseCudaProgram());
await writeFile(`${destination}/course-bridges.json`,JSON.stringify(bridgeExpected));
await writeFile(`${destination}/native-only-wmma.cu`,nativeWmmaProgram());
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
