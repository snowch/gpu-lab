// Copyright © 2026 Christopher Snow.
import {cudaProgram} from './cuda-program.mjs';
export const steps = [
  {title:'One calculation for five inputs', concept:'The PyTorch operation multiplies every input by the same amount. Follow the five numbers through the picture, then try a different multiplier.', instruction:'Predict the outputs, then run. Change the multiplier and predict again.', length:5,size:5},
  {title:'Which number does each thread use?', leadIn:'The previous picture showed the same calculation applied to five inputs. A GPU can divide that work among many executions of a small program: each reads an input, multiplies it, and writes a result. These executions are called threads, and many can make progress in parallel.', definitions:[['Thread','One execution of a GPU program. Many threads can run the same code, each working on different data.'],['Array','An ordered collection of values.'],['Index','A number that identifies a position in an array, starting at zero.']], concept:'In this picture, one thread handles one input. Its index tells it which input to read and where to write the result. This is a simplified mapping; PyTorch chooses the actual implementation.', instruction:'Select a thread in the picture. Follow its index from one input to one output.', length:5,size:5},
  {title:'Threads are organised into blocks', leadIn:'How do we ask the GPU to start those threads? We specify groups rather than starting each thread separately. The GPU can distribute these groups, and threads within a group can cooperate when an algorithm needs them to.', definitions:[['Launch','Starting a GPU function with a chosen number of blocks and threads per block.'],['Block','A group of threads in a launch. Threads in the same block can cooperate.']], concept:'Here each thread multiplies its own input independently, so it needs no cooperation. Threads in a block do not necessarily all execute at once. Later, we will use cooperation to add many inputs into one result.', instruction:'Select thread 4 in the second block to follow the fifth input and see how its index is calculated. The three extra threads skip the arrays; we will explore that check next.', length:5,size:4},
  {title:'More threads than numbers', definitions:[['Bounds check','A check that an index refers to an element that exists before accessing it.']], concept:'Keep the same five inputs and two blocks of four threads. The extra three threads must skip the arrays because their indices have no input or output element.', instruction:'Run with the check enabled. Then turn it off and see which threads would access beyond the arrays.', length:5,size:4},
  {title:'From Python to a GPU kernel', leadIn:'We have followed the work in pictures. Now we can write the small program each thread follows and show the code that starts the groups.', definitions:[['Kernel','A GPU function executed by the threads in a launch.']], concept:'Each thread executes the complete function below with its own index. Here is a CUDA kernel and the launch that starts it, putting together the index, calculation and bounds check you have just explored.', instruction:'Run once more, then compare the Python operation with the complete CUDA example.', length:5,size:4},
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

export function launchPlan(count) {
  if(!Number.isInteger(count)||count<1||count>32) throw new RangeError('Choose 1–32 inputs.');
  const size=4,blocks=Math.ceil(count/size),threads=blocks*size;
  return {count,size,blocks,threads,skipped:Array.from({length:threads-count},(_,i)=>count+i)};
}
