// Copyright © 2026 Christopher Snow.
import {cudaProgram} from './cuda-program.mjs';
export const steps = [
  {title:'Try a different multiplier', factor:3, concept:'The worked example doubled these five inputs. Now use the multiplier below to try a different calculation.', instruction:'Use 3, or choose a multiplier other than 2. Predict the five outputs, then run. Change the multiplier and predict again.', length:5,size:5},
  {title:'One multiplication per thread', leadIn:'Our example assigns one input value to each execution of a small GPU program: read the value, multiply it by 2, and write the result.', definitions:[['Thread','One execution of a GPU program.']], concept:'Each thread uses its array index to choose matching input and output positions. This is our teaching mapping; PyTorch chooses the actual implementation for the tensor operation.', instruction:'Run, then select a thread card below to follow its input, calculation and output.', length:5,size:5},
  {title:'Threads are organised into blocks', leadIn:'The diagram below arranges the threads into two groups. Each group is called a block. The GPU distributes work a block at a time.', definitions:[['Block','A group of threads. Threads in the same block can share a workspace and wait for one another when their calculation needs it.']], concept:'Here each thread multiplies its own input independently. Threads in a block do not necessarily all execute at once.', instruction:'Run, then select thread 4 in Block 1. Follow how its block number and position give index 4, the fifth input.', length:5,size:4},
  {title:'More threads than input values', definitions:[['Bounds check','A check that an index refers to an element that exists before accessing it.']], concept:'Keep the same five inputs and two blocks of four threads. Now inspect the check that protects the arrays from the extra threads.', instruction:'Run with the check enabled. Then turn it off and see which threads would access beyond the arrays.', length:5,size:4},
  {title:'Read the complete GPU function', leadIn:'The launch requests our thread groups, and the bounds check protects the arrays. Now read the complete CUDA function that joins the index calculation, check and multiplication.', definitions:[['Kernel','A GPU function executed by the threads in a launch.']], concept:'Each thread executes this kernel with its own index. Compare its complete body with the short examples beside the earlier diagrams.', instruction:'Run, then select thread 4 in Block 1. Follow its CUDA variables into the index calculation below the cards. Select a grey thread to inspect the bounds check.', length:5,size:4},
];
export function introPrompt(stage) {
  return [
    'Predict the outputs for this multiplier, then press Run.',
    'Run to follow each thread’s input and output.',
    'Run to inspect the indices in each block.',
    'Run with the bounds check, then compare what happens without it.',
    'Run to compare the kernel’s result with the PyTorch example.',
  ][stage];
}
export function simulateIntro(stage,factor,guard=true,size=steps[stage]?.size) {
  const step=steps[stage];
  if(!step) throw new RangeError('Unknown step');
  if(!Number.isInteger(size)||size<1||size>32) throw new RangeError('Choose 1–32 threads per block.');
  if(typeof factor!=='number'||!Number.isFinite(factor)||factor < -10 || factor > 10) throw new RangeError('Choose a multiplier from −10 to 10.');
  if(typeof guard!=='boolean') throw new TypeError('Expected a bounds-check choice');
  const input=Array.from({length:step.length},(_,i)=>i+1),output=Array(step.length).fill(null);
  const threads=Array.from({length:Math.ceil(step.length/size)*size},(_,i)=>{
    const valid=i<input.length, skipped=!valid && guard, invalid=!valid && !guard;
    if(valid) output[i]=Math.fround(input[i]*Math.fround(factor));
    return {i,block:Math.floor(i/size),local:i%size,input:valid?input[i]:null,output:valid?output[i]:null,skipped,invalid};
  });
  return {input,output,threads,factor:Math.fround(factor),size,blocks:Math.ceil(step.length/size),safe:threads.every(t=>!t.invalid)};
}
const literal=factor=>Number.isInteger(Math.fround(factor))?Math.fround(factor)+'.0f':String(Math.fround(factor))+'f';
export function pythonSource(factor=2) {
  const {input}=simulateIntro(0,factor);
  return `import torch\nx = torch.tensor(\n    [${input.map(x=>x.toFixed(1)).join(', ')}],\n    device="cuda",\n)\ny = x * ${factor}`;
}
export function lineFor(factor){return `output[i] = input[i] * ${literal(factor)};`;}
export function kernelSource(factor) {
  return `__global__ void runKernel(
    const float* input, float* output, int n
) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    ${boundsSource(factor).replaceAll('\n','\n    ')}
}`;
}
export function runnableSource(factor,size=4) {
  const result=simulateIntro(4,factor,true,size);
  return cudaProgram({kernel:kernelSource(factor),input:result.input,size:result.size,args:'d_x, d_y, n'});
}

export function launchPlan(count,size=4) {
  if(!Number.isInteger(count)||count<1||count>32) throw new RangeError('Choose 1–32 inputs.');
  if(!Number.isInteger(size)||size<1||size>32) throw new RangeError('Choose 1–32 threads per block.');
  const blocks=Math.ceil(count/size),threads=blocks*size;
  return {count,size,blocks,threads,skipped:Array.from({length:threads-count},(_,i)=>count+i)};
}

export function launchSource(blocks=2,size=4) {
  if(!Number.isInteger(blocks)||blocks<1||!Number.isInteger(size)||size<1||size>32) throw new RangeError('Invalid launch settings');
  return `int threadsPerBlock = ${size};
int blocks = ${blocks};

runKernel<<<blocks, threadsPerBlock>>>(
    d_input, d_output, 5
);`;
}

export function boundsSource(factor,guard=true) {
  return guard?`if (i < n) {
    ${lineFor(factor)}
}`:lineFor(factor);
}
