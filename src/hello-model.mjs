import {cudaProgram} from './cuda-program.mjs';
// Copyright © 2026 Christopher Snow.
export const steps = [
  {title:'Hello, GPU', description:'Write one number, then read it back.', instruction:'Run this program. Then change 42.0 to another number and run it again.',
    before:'__global__ void runKernel(float* output) {', body:'output[0] = 42.0;', after:'}', size:1, length:1,
    explain:'This small GPU function is a kernel. It writes a number into output[0], the first element of a buffer. A buffer is an array of values. The browser simulates this kernel; it does not compile or execute CUDA. __global__ marks a function that runs on an NVIDIA GPU when compiled with CUDA.'},
  {title:'Give each thread an ID', description:'Run the same function four times.', instruction:'Run the program. Each thread writes its own ID into its own output element.',
    before:'__global__ void runKernel(float* output) {\n  int i = blockIdx.x * blockDim.x + threadIdx.x;', body:'output[i] = i;', after:'}', size:4,length:4,
    explain:'A thread is one execution of the function. Here four threads form one block. Their IDs are 0, 1, 2 and 3. threadIdx.x is the index within a block; blockIdx.x identifies the block; blockDim.x is its thread count. Combining them gives i, an index across blocks. Block size is a software choice, not a hardware warp size.'},
  {title:'Double an input', description:'Read one input value and write one result.', instruction:'Input is [1, 2, 3, 4]. Run to double every value. Then change 2.0 to 3.0 and run again.',
    before:'__global__ void runKernel(const float* input, float* output) {\n  int i = blockIdx.x * blockDim.x + threadIdx.x;',body:'output[i] = input[i] * 2.0;',after:'}',size:4,length:4,
    explain:'Each thread reads input[i] and writes output[i]. Together they perform elementwise scaling, the same kind of operation you can express on a tensor.'},
  {title:'Handle a partial block',description:'Five inputs need two blocks of four.',instruction:'Input is [1, 2, 3, 4, 5]. Run the guarded program. Then change 5 to 4 and see which output is missed. Restore 5 afterwards.',
    before:'__global__ void runKernel(const float* input, float* output) {\n  int i = blockIdx.x * blockDim.x + threadIdx.x;',body:'if (i < 5) {\n  output[i] = input[i] * 2.0;\n}',after:'}',size:4,length:5,
    explain:'We launch eight threads for five elements. IDs 5, 6 and 7 must skip the arrays. The condition keeps each access inside the buffer. A block can contain threads that have no valid element to process.'},
];
const number = '(-?(?:\\d+(?:\\.\\d*)?|\\.\\d+))';
export function analyse(stepIndex, body) {
  const step=steps[stepIndex]; if (!step) throw new Error('Unknown lesson.');
  if (/[A-Za-z0-9_]\s+[A-Za-z0-9_]|\d\s+\.|\.\s+\d/.test(body)) throw new Error('Keep names and numeric literals together, without spaces inside them.');
  const compact=body.replace(/\s+/g,'');
  const patterns=[
    new RegExp('^output\\[0\\]='+number+';$'),
    /^output\[i\]=i;$/,
    new RegExp('^output\\[i\\]=input\\[i\\]\\*'+number+';$'),
    /^if\(i<(\d+)\)\{output\[i\]=input\[i\]\*2\.0;\}$/,
  ];
  const match=compact.match(patterns[stepIndex]);
  if (!match) throw new Error(stepIndex===1 ? 'Keep the ID-writing statement for this step. Restore the example to continue.' : stepIndex===3 ? 'For this step, change only the whole number in the bounds check.' : 'For this step, change only the number in the highlighted line.');
  if (/^-?0[0-9]+$/.test(match[1] ?? '')) throw new Error('Use a decimal number without leading zeroes; CUDA treats leading-zero integers as octal.');
  const value=Number(match[1]??0);
  if (!Number.isFinite(Math.fround(value))) throw new Error('Use a finite FP32 number.');
  if(stepIndex===3 && value>step.length) throw new Error('That guard allows an access past the five-element buffer. Use 5 or less.');
  const input=Array.from({length:step.length},(_,i)=>i+1);
  const launched=Math.ceil(step.length/step.size)*step.size;
  const output=Array(step.length).fill(null);
  for(let id=0;id<launched;id++){
    if(stepIndex===3 && id>=value) continue;
    output[id]=stepIndex===0?Math.fround(value):stepIndex===1?id:Math.fround(input[id]*(stepIndex===3?2:value));
  }
  return {input,output,launched,skipped:stepIndex===3?launched-value:0};
}
export function kernelSource(stepIndex, body) {
  const step=steps[stepIndex];
  return step.before+'\n'+body+'\n'+step.after;
}
export function runnableSource(stepIndex,body) {
  const result=analyse(stepIndex,body);
  return cudaProgram({kernel:kernelSource(stepIndex,body),input:result.input,size:steps[stepIndex].size,args:stepIndex<2?'d_y':'d_x, d_y'});
}
