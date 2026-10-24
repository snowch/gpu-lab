// Copyright © 2026 Christopher Snow.
import {cudaProgram} from './cuda-program.mjs';
export const steps = [
  {title:'Many numbers, one calculation', concept:'A GPU can run many copies of a small program. Each copy is called a thread. Here, each of five threads multiplies one input number by the same amount.', instruction:'Run to double the numbers. Then change the multiplier and run again.', length:5,size:5},
  {title:'Which number does each thread use?', concept:'The numbers live in an array: a list whose positions start at zero. Each thread uses an index, i, to choose the input it reads and the output it writes.', instruction:'Select a thread in the picture. Follow its index into the line of CUDA code below.', length:5,size:5},
  {title:'Threads are organised into blocks', concept:'A block is a group of threads that can cooperate. Threads in the same block can share a small, fast workspace called shared memory. They can also wait for one another before using results produced by the group.', instruction:'Select thread 4 in the second block to follow the fifth input and see how its index is calculated. The three extra threads skip the arrays; we will explore that check next.', length:5,size:4},
  {title:'More threads than numbers', concept:'Keep the same five inputs and two blocks of four threads. The extra three threads must skip the arrays because their indices have no input or output element.', instruction:'Run with the check enabled. Then turn it off and see which threads would access beyond the arrays.', length:5,size:4},
  {title:'From Python to a GPU kernel', concept:'Python runs on the CPU. For a tensor stored on a GPU, PyTorch arranges for a GPU function—a kernel—to do the calculation. The complete CUDA kernel below puts together the ideas you have just explored.', instruction:'Run once more, then compare the Python operation with the complete CUDA example.', length:5,size:4},
];
export function simulateIntro(stage,factor,guard=true) {
  const step=steps[stage];
  if(!step) throw new RangeError('Unknown step');
  if(typeof factor!=='number'||!Number.isFinite(factor)||factor < -10 || factor > 10) throw new RangeError('Choose a multiplier from −10 to 10.');
  if(typeof guard!=='boolean') throw new TypeError('Expected a bounds-check choice');
  const input=Array.from({length:step.length},(_,i)=>i+1),output=Array(step.length).fill(null);
  const threads=Array.from({length:Math.ceil(step.length/step.size)*step.size},(_,i)=>{
    const valid=i<input.length, skipped=!valid && guard, invalid=!valid && !guard;
    if(valid) output[i]=Math.fround(input[i]*Math.fround(factor));
    return {i,block:Math.floor(i/step.size),local:i%step.size,input:valid?input[i]:null,output:valid?output[i]:null,skipped,invalid};
  });
  return {input,output,threads,factor:Math.fround(factor),size:step.size,blocks:Math.ceil(step.length/step.size),safe:threads.every(t=>!t.invalid)};
}
const literal=factor=>Number.isInteger(Math.fround(factor))?Math.fround(factor)+'.0f':String(Math.fround(factor))+'f';
export function pythonSource(factor=2) {
  const {input}=simulateIntro(0,factor);
  return `import torch\nx = torch.tensor([${input.map(x=>x.toFixed(1)).join(', ')}], device="cuda")\ny = x * ${factor}`;
}
export function lineFor(factor){return `output[i] = input[i] * ${literal(factor)};`;}
export function kernelSource(factor) {
  return `__global__ void runKernel(const float* input, float* output, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) {
        ${lineFor(factor)}
    }
}`;
}
export function runnableSource(factor) {
  const result=simulateIntro(4,factor);
  return cudaProgram({kernel:kernelSource(factor),input:result.input,size:result.size,args:'d_x, d_y, n'});
}
