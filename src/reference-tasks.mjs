// Copyright © 2026 Christopher Snow.
import {pythonSource} from './hello-model.mjs';
// Short documentation exercises: direct sections first, independent searches later.
export const guides = {
  indexing: 'https://docs.pytorch.org/docs/stable/tensor_view.html',
  coalescing: 'https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html#coalesced-access-to-global-memory',
  pytorch: 'https://docs.pytorch.org/docs/stable/',
  to: 'https://docs.pytorch.org/docs/stable/generated/torch.Tensor.to.html',
  tensor: 'https://docs.pytorch.org/docs/stable/generated/torch.tensor.html',
  stride: 'https://docs.pytorch.org/docs/stable/generated/torch.Tensor.stride.html',
  cuda: 'https://docs.nvidia.com/cuda/cuda-programming-guide/index.html',
  indices: 'https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/cpp-language-extensions.html#built-in-variables',
  barriers: 'https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/cpp-language-extensions.html#thread-block-synchronization-functions',
  shared: 'https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/writing-cuda-kernels.html#thread-block-synchronization',
  scheduling: 'https://docs.nvidia.com/cuda/cuda-programming-guide/03-advanced/advanced-kernel-programming.html#hardware-multithreading',
  divergence: 'https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html#branching-and-divergence',
  bestPractices: 'https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html',
  matmul: 'https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html#shared-memory-in-matrix-multiplication-c-ab',
  wmma: 'https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/cpp-language-extensions.html#warp-matrix-functions',
  attention: 'https://docs.pytorch.org/docs/stable/generated/torch.nn.functional.scaled_dot_product_attention.html',
  timing: 'https://docs.pytorch.org/docs/2.14/notes/cuda.html#asynchronous-execution',
};
export const referenceTasks = {
  'hello-pytorch': {
    title:'Where does this tensor live?', page:'tensor', label:'PyTorch: torch.tensor', code:pythonSource(),
    prompt:'In this snippet from the start of the chapter, find device="cuda". Use the torch.tensor reference to explain what it selects.',
    followUp:'The snippet does not specify dtype. Find that argument in the reference: what does it control, and what number type does PyTorch infer from these floating-point inputs?',
    answer:'device selects the storage device: "cuda" places this tensor on an NVIDIA GPU. dtype selects the numerical representation. With PyTorch’s usual default settings, these floating-point inputs produce torch.float32. Changing the default floating-point dtype can change that inference. Choosing a dtype alone does not move a tensor between CPU and GPU.',
  },
  'hello-indices': {
    title:'CUDA thread indices', page:'indices', label:'CUDA: built-in variables',
    prompt:'Find threadIdx, blockIdx and blockDim. Which gives a thread’s position inside its block? Which gives the block’s size?',
    answer:'threadIdx gives the position within the block; blockDim gives its dimensions. blockIdx identifies the block in the grid.',
  },
  devices: {
    title:'When does moving a tensor make a copy?', page:'to', label:'PyTorch: Tensor.to',
    prompt:'Find what happens when the requested device and dtype already match. Does calling .to() always allocate a new tensor?',
    answer:'If the device and dtype already match, .to() returns the original tensor by default. Our CPU-to-CUDA example changes the device, so it creates a copy.',
  },
  selection: {
    title:'Check the indexing notation', page:'indexing', label:'PyTorch: tensor indexing and views',
    prompt:'Find the basic indexing examples. Which part of x[0, :] chooses a row, and what does the colon select?',
    answer:'The first index chooses row 0. The colon selects all columns in that row. We explore the guide’s distinction between views and copies in the next chapter.',
  },
  requests: {
    title:'Check how neighbouring reads are grouped', page:'coalescing', label:'CUDA Best Practices: coalesced access',
    prompt:'Find the aligned and misaligned access examples. Why can neighbouring values require more than one 32-byte region?',
    answer:'The requested addresses can cross a region boundary. In our row-1 example, bytes 20–39 span two 32-byte sectors despite the values being neighbours. This count alone does not predict elapsed time.',
  },
  reading: {
    title:'Check what a stride counts', page:'stride', label:'PyTorch: Tensor.stride',
    prompt:'Does stride count bytes or element positions? Use the definition to explain why this column has stride 5 but a byte step of 20.',
    answer:'Stride counts element positions. These FP32 values take four bytes each, so five elements correspond to 20 bytes.',
  },
  kernel: {
    title:'Check the repair against the reference', page:'indices', label:'CUDA: built-in variables',
    prompt:'Which index starts again in each block? Use its definition to explain why the local-index repair fails across multiple blocks.',
    answer:'threadIdx repeats within each block; the global expression combines it with blockIdx and blockDim.',
  },
  memory: {
    title:'Read the stride API', page:'stride', label:'PyTorch: Tensor.stride',
    prompt:'Find what stride(dim) returns. Does it count element positions or bytes? Use that to explain the row and column views above.',
    answer:'A stride counts element positions. Multiply by the element size to obtain a byte step; the model’s FP32 elements occupy four bytes.',
  },
  scheduling: {
    title:'Residency and readiness', page:'scheduling', label:'CUDA: hardware multithreading',
    prompt:'Find what the scheduler needs before issuing an instruction. Is merely being resident enough? Compare with your latency experiment.',
    answer:'A resident warp can still be waiting on a dependency. The scheduler needs ready work, as the latency experiment shows.',
  },
  divergence: {
    title:'Check the divergence rule', page:'divergence', label:'CUDA Best Practices: branching and divergence',
    prompt:'Find the scope of divergence: a thread, a warp or a whole GPU? Relate it to the active masks in your trace.',
    answer:'The relevant scope is a warp: different lanes can follow different paths. Use each trace mask to identify which lanes do work.',
  },
  'shared-memory': {
    title:'Who reaches the barrier?', page:'shared', label:'CUDA: thread block synchronisation',
    prompt:'Find __syncthreads(). Which threads wait for one another? Does this barrier also synchronise other blocks?',
    answer:'It coordinates threads in the same block, not the whole grid. This bank experiment models reads; the reduction workshop below explores ordering hazards.',
  },
  reduction: {
    title:'Find the barrier contract', independent:true, page:'cuda', label:'CUDA Programming Guide', solution:'barriers',
    prompt:'Use the guide’s contents or search to find __syncthreads(). Explain why this reduction keeps its barrier outside if (t < stride).',
    answer:'All participating block threads must reach the barrier. Only the arithmetic is conditional; the barrier orders the next stage.',
  },
  matmul: {
    title:'Find the matrix-multiplication example', independent:true, page:'bestPractices', label:'CUDA Best Practices Guide', solution:'matmul',
    prompt:'Find the shared-memory matrix-multiplication example. Identify which loaded values are reused, then compare with your tile experiment.',
    answer:'A tile’s input values contribute to multiple output elements, so threads can reuse shared loads. Follow one input through several products in your trace.',
  },
  'tensor-cores': {
    title:'Find the warp-matrix requirements', independent:true, page:'cuda', label:'CUDA Programming Guide', solution:'wmma',
    prompt:'Find the requirements for mma_sync. Can just one thread in a warp call it? Compare that contract with the code above.',
    answer:'mma_sync is cooperative across a warp. All warp threads must call it consistently.',
  },
  attention: {
    title:'Find the PyTorch attention API', independent:true, page:'pytorch', label:'PyTorch documentation', solution:'attention',
    prompt:'Find scaled_dot_product_attention. Which dropout_p value matches this no-dropout model? Does the API promise the same implementation for every input?',
    answer:'Use dropout_p=0.0. PyTorch can choose between implementations according to inputs and available support; this browser recurrence is not its production kernel.',
  },
  inference: {
    title:'Find how to time GPU work', independent:true, page:'pytorch', label:'PyTorch documentation', solution:'timing',
    prompt:'Find the CUDA timing guidance. Why can a CPU timer around a GPU call measure too little? Name a documented way to wait for the work you are measuring.',
    answer:'A GPU call can enqueue work before it finishes. Use appropriate synchronisation at timing boundaries or CUDA events and wait for completion; a model bound is not a measurement.',
  },
};
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const link=(key,label)=>`<a href="${guides[key]}" target="_blank" rel="noopener noreferrer">${escape(label)} <span class="reference-new-tab">(new tab)</span></a>`;
export function renderReferenceTask(key) {
  const task=referenceTasks[key];
  if(!task) throw new Error('Unknown reference task: '+key);
  return `<aside class="reference-task" aria-labelledby="reference-${key}">
    <h3 id="reference-${key}"><svg class="reference-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" focusable="false"><path d="M12 5c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1Z"/><path d="M12 5v15"/></svg><span>${task.independent?'Find it in the guide':'Look it up'}: ${escape(task.title)}</span></h3>
    ${task.code?`<pre class="reference-code"><code>${escape(task.code)}</code></pre>`:''}
    <p>${escape(task.prompt)}</p>
    ${task.followUp?`<p>${escape(task.followUp)}</p>`:''}
    <p>${link(task.page,task.label)}</p>
    <details><summary>Compare your answer</summary><p>${escape(task.answer)}</p>${task.solution?`<p>${link(task.solution,'Open the relevant section')}</p>`:''}</details>
    <p class="reference-note">Reference opens online; the comparison works offline.</p>
  </aside>`;
}
