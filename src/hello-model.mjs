// Copyright © 2026 Christopher Snow.
import {cudaProgram} from './cuda-program.mjs';
export const steps = [
  {title:'Many numbers, one calculation', concept:'A GPU can run many copies of a small program. Each copy is called a thread. Here, each thread multiplies one input number by the same amount.', instruction:'Run to double the numbers. Then change the multiplier and run again.', length:4,size:4},
  {title:'Which number does each thread use?', concept:'The numbers live in an array: a list whose positions start at zero. Each thread uses an index, i, to choose the input it reads and the output it writes.', instruction:'Select a thread in the picture. Follow its index into the line of CUDA code below.', length:4,size:4},
  {title:'Threads are organised into blocks', concept:'A block is a group of threads. Here we put two threads in each block. Each thread has a position within its block; combining that position with the block number gives its index across the whole array.', instruction:'Select a thread in the second block to see how its index is calculated.', length:4,size:2},
  {title:'More threads than numbers', concept:'We now have five inputs and blocks of four threads. Two blocks give us eight threads. The extra three must skip the arrays because their indices have no input or output element.', instruction:'Run with the check enabled. Then turn it off and see which threads would access beyond the arrays.', length:5,size:4},
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
