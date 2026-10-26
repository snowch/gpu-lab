// Copyright © 2026 Christopher Snow.
import {pythonSource} from './hello-model.mjs';
// Short documentation exercises: direct sections first, independent searches later.
export const guides = {
  dispatcher: 'https://docs.pytorch.org/docs/2.14/notes/extending.html#extending-torch-native-api',
  compiler: 'https://docs.pytorch.org/docs/2.14/user_guide/torch_compiler/torch.compiler_get_started.html',
  cudaSemantics: 'https://docs.pytorch.org/docs/2.14/notes/cuda.html',
  launch: 'https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/writing-cuda-kernels.html',
  cpu: 'https://docs.pytorch.org/docs/stable/generated/torch.Tensor.cpu.html',
  shape: 'https://docs.pytorch.org/docs/stable/generated/torch.Tensor.shape.html',
  contiguous: 'https://docs.pytorch.org/docs/stable/generated/torch.Tensor.contiguous.html',
  banks: 'https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html#shared-memory-and-memory-banks',
  torchMatmul: 'https://docs.pytorch.org/docs/stable/generated/torch.matmul.html',
  finfo: 'https://docs.pytorch.org/docs/stable/type_info.html#torch-finfo',
  sdpaKernel: 'https://docs.pytorch.org/docs/stable/generated/torch.nn.attention.sdpa_kernel.html',
  elementSize: 'https://docs.pytorch.org/docs/stable/generated/torch.Tensor.element_size.html',
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
    code:'runKernel<<<2, 4>>>(d_input, d_output, 5);',
    prompt:'Find threadIdx, blockIdx and blockDim. Which gives a thread’s position inside its block? Which gives the block’s size?',
    followUp:'Use the kernel-launch reference above to interpret <<<2, 4>>>. Is runKernel a CUDA keyword?',
    answer:'threadIdx gives the position within the block; blockDim gives its dimensions. blockIdx identifies the block in the grid. The launch requests two blocks with four threads each. runKernel is the name we chose for our function; it is not a CUDA keyword or an official API entry.',
  },
  'hello-dispatch': {
    title:'Who chooses the implementation?', page:'dispatcher', label:'PyTorch: selecting backend implementations',
    code:'y = x * 2',
    prompt:'Read the dispatcher paragraph under “Extending torch native API”. What chooses the implementation for a CPU or CUDA tensor? Does this Python expression call our runKernel function?',
    answer:'PyTorch’s dispatcher selects the relevant backend implementation. With an ordinary CUDA tensor, PyTorch handles the GPU work and launch; this expression does not call our separately written runKernel. The CUDA example explains the same calculation but is not code generated from this expression. Optional torch.compile can generate and combine kernels; that is a separate execution path.',
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
  'devices-result': {
    title:'Where does the result live?', page:'cudaSemantics', label:'PyTorch: CUDA semantics',
    code:'y_gpu = x_gpu * 2\ny_cpu = y_gpu.cpu()',
    prompt:'Read the opening device rules. Where is y_gpu created? Use the Tensor.cpu reference above to explain what the second line adds.',
    answer:'The multiplication result stays on the CUDA tensor’s device. .cpu() gives us a CPU copy so the values are also available in system memory. It does not move or delete the original GPU result.',
  },
  'selection-shape': {
    title:'Check the size of the selection', page:'shape', label:'PyTorch: Tensor.shape',
    code:'x.shape  # (5, 5)\nvalues = x[:, 2]',
    prompt:'Use shape and the indexing reference above. What shape should values have? Does choosing column 2 mean choosing the second column?',
    answer:'values has shape (5,): one dimension with five elements. Indices start at zero, so column 2 is the third column. Selecting a single column removes that column dimension from this selection.',
  },
  'layout-copy': {
    title:'Does contiguous always copy?', page:'contiguous', label:'PyTorch: Tensor.contiguous',
    code:'row = x[0, :]\ncolumn = x[:, 0]',
    prompt:'Find what .contiguous() returns when the input already has the requested layout. Compare row.contiguous() and column.contiguous() for our grid.',
    answer:'The row already has contiguous values, so .contiguous() can return it without a copy. The column has stride 5, so its packed result needs a new copy. Equal values do not imply shared storage.',
  },
  'requests-warp': {
    title:'Distinguish a block from a warp', page:'scheduling', label:'CUDA: hardware multithreading',
    prompt:'Find how blocks are divided into warps. How many warps does a 64-thread block contain? Does our picture of five participating threads establish the size of every block?',
    answer:'On NVIDIA GPUs a 64-thread block contains two 32-thread warps. Our five-thread read is a small teaching example; blocks can have more threads and multiple warps. A warp does not combine threads from different blocks.',
  },
  'memory-copy': {
    title:'Separate values from their positions', page:'indexing', label:'PyTorch: tensor views',
    prompt:'Find the view-versus-copy explanation. Does taking a column view pack its values together? What operation in the lab explicitly requests a contiguous layout?',
    answer:'A column view shares the original storage and keeps the stride needed to reach its values. .contiguous() creates a packed copy when the view is not already contiguous. Making that copy has a cost; fewer sectors in a later read alone do not prove an overall speedup.',
  },
  'kernel-launch': {
    title:'Apply the launch rules to a repair', page:'launch', label:'CUDA: writing and launching kernels',
    prompt:'Find the launch configuration and thread-index examples. For 35 inputs and 8 threads per block, how many blocks cover the input? Which thread indices need the bounds check?',
    answer:'Five blocks launch 40 threads. Indices 0–34 access the input; indices 35–39 must skip it. The global index combines the block number, block size and local thread position. Changing only the block count does not repair an incorrect local-only index.',
  },
  'scheduling-limits': {
    title:'Check the teaching-machine assumptions', page:'scheduling', label:'CUDA: hardware multithreading',
    prompt:'Find the discussion of resident blocks and resource limits. Does adding more blocks guarantee that they all reside on an SM at once? Does the guide guarantee our model’s one-instruction-per-cycle timing?',
    answer:'No. Residency depends on resources and hardware limits, including registers and shared memory. Readiness is separate from residency. The model’s single issue slot and fixed load latency are teaching assumptions, not universal GPU timing guarantees.',
  },
  'divergence-scope': {
    title:'Apply the rule across two warps', page:'divergence', label:'CUDA Best Practices: branching',
    prompt:'If every thread in warp A takes one branch and every thread in warp B takes the other, is either warp internally divergent? Compare this with alternating choices within one warp.',
    answer:'Neither uniform warp diverges internally merely because the other warp takes another branch. Alternating choices within a warp leave different subsets participating along each path. The model’s chosen path order is not a hardware guarantee.',
  },
  'shared-banks': {
    title:'Distinguish a broadcast from a bank conflict', page:'banks', label:'CUDA Best Practices: shared-memory banks',
    prompt:'Find the broadcast exception. Compare several threads reading the same word with reading different words mapped to the same bank in our experiment.',
    answer:'Reading the same shared-memory word can be served as a broadcast. Different words in the same bank can require separate service. For the lab’s 32-bank, four-byte-word model, adding padding changes which bank each address reaches.',
  },
  'reduction-order': {
    title:'Explain the unsafe reduction', page:'barriers', label:'CUDA: synchronisation functions',
    prompt:'Use the barrier contract to explain why one thread must not read a shared partial sum before the producing thread writes it. Is a barrier inside a condition reached by only part of the block a general repair?',
    answer:'Threads can reach operations at different times. A block-wide barrier orders the shared writes before subsequent reads when used correctly. All required block threads must reach it; placing it only in a branch taken by some threads is not a general repair. Keep the arithmetic conditional and the barrier consistent across the block.',
  },
  'matmul-shape': {
    title:'Connect the tile experiment to PyTorch', page:'torchMatmul', label:'PyTorch: torch.matmul',
    prompt:'Find the two-dimensional case. If A is 4×4 and B is 4×4, what is the output shape? Does this API let the caller specify the CUDA tile size used in our model?',
    answer:'The output is 4×4. torch.matmul describes the mathematical operation; it does not expose our teaching model’s CUDA tile-size control. PyTorch and its implementations/libraries choose the execution strategy. The model illustrates reuse rather than reproducing that choice.',
  },
  'tensor-precision': {
    title:'Check precision before comparing results', page:'finfo', label:'PyTorch: floating-point type information',
    prompt:'Find eps in torch.finfo. What does it describe near 1? Why can converting the near-one inputs in our cancellation example change the answer even when accumulation uses FP32?',
    answer:'eps describes the gap from 1 to the next larger representable value for that format. Lower-precision conversion may round distinct near-one inputs to the same value. FP32 accumulation cannot recover information already lost in the inputs. This does not specify the hardware accumulation order.',
  },
  'attention-backend': {
    title:'Check what backend selection promises', page:'sdpaKernel', label:'PyTorch: sdpa_kernel',
    prompt:'Find what the context manager controls. Does its existence mean our handwritten browser recurrence is the kernel PyTorch must execute? Why should a backend comparison check input eligibility as well as outputs?',
    answer:'The context manager controls which scaled-dot-product-attention backends are enabled. Available implementations have input and hardware constraints. PyTorch does not promise to execute this browser recurrence. Compare supported inputs and numerical results before making timing claims.',
  },
  'inference-bytes': {
    title:'Check the bytes in a cache estimate', page:'elementSize', label:'PyTorch: Tensor.element_size',
    prompt:'Find the unit returned by element_size(). If a fixed number of KV-cache elements changes from four bytes each to two bytes each, what happens to that payload estimate? Does it prove total GPU memory use halves?',
    answer:'element_size() returns bytes per element. The same element count at two rather than four bytes halves that tensor payload estimate. It does not account for every allocation, temporary tensor, allocator overhead or other model state, so total memory need not halve.',
  },
  'overview-placement': {
    title:'Check the hardware relationships', page:'scheduling', label:'CUDA: hardware multithreading',
    prompt:'Find the relationship between a block, an SM and a warp. Can one block spread its threads across several SMs? Can an SM hold more than one block?',
    answer:'A block stays on one SM for its lifetime. Several blocks may reside on an SM when resources allow. Threads within each block are organised into warps; neither a thread nor a warp is a permanently dedicated physical core.',
  },
  'overview-memory': {
    title:'Check where CUDA results remain', page:'cudaSemantics', label:'PyTorch: CUDA semantics',
    prompt:'Use the opening CUDA device rules to explain why a result from multiplying a CUDA tensor stays in GPU memory. Which operation from the book requests a CPU copy?',
    answer:'PyTorch keeps ordinary tensor-operation results on the input tensor’s device. Calling .cpu() requests a CPU copy. The CPU can launch GPU work without automatically receiving a CPU copy of every result.',
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

// Page-level coverage is explicit so a new chapter cannot silently omit its references.
export const chapterReferences = {
  hello: {
    sources:[['tensor','PyTorch: torch.tensor','Check device and dtype in the opening snippet.'],['dispatcher','PyTorch: selecting an implementation','Read the dispatcher paragraph under “Extending torch native API”; the rest is advanced.'],['launch','CUDA: writing and launching kernels','Recognise the complete GPU function and the <<<blocks, threads>>> launch syntax.']],
    tasks:['hello-pytorch','hello-dispatch','hello-indices'],
    note:'runKernel is our example function name, not a CUDA API or a function generated by PyTorch. Follow the CUDA references for the language features it uses.',
    optional:[['compiler','PyTorch: torch.compile getting started','Later reading: compilation can generate kernels and combine operations. The opening example uses ordinary PyTorch execution.']],
  },
  devices:{sources:[['to','PyTorch: Tensor.to','Check when a device conversion returns the original tensor or makes a copy.'],['cpu','PyTorch: Tensor.cpu','Check how a CPU copy is requested.'],['cudaSemantics','PyTorch: CUDA semantics','Read the opening rules for the device on which results are created.']],tasks:['devices','devices-result']},
  reading:{sources:[['indexing','PyTorch: tensor views and indexing','Find basic indexing and slicing examples. The next chapter explains shared storage.'],['shape','PyTorch: Tensor.shape','Check how a tensor reports the sizes of its dimensions.']],tasks:['selection','selection-shape']},
  layout:{sources:[['indexing','PyTorch: tensor views','Distinguish changing how values are accessed from copying them.'],['stride','PyTorch: Tensor.stride','Check the unit of a stride.'],['contiguous','PyTorch: Tensor.contiguous','Check when requesting a contiguous layout makes a copy.']],tasks:['reading','layout-copy']},
  requests:{sources:[['coalescing','CUDA Best Practices: coalesced access','Compare aligned and misaligned accesses to 32-byte regions.'],['scheduling','CUDA: hardware multithreading','Check how a block’s threads are divided into warps.']],tasks:['requests','requests-warp']},
  memory:{sources:[['stride','PyTorch: Tensor.stride','Relate a view’s strides to the byte addresses in the diagram.'],['indexing','PyTorch: tensor views','Check which operations share storage.'],['coalescing','CUDA Best Practices: coalesced access','Compare the model’s sectors with the documented access rules.']],tasks:['memory','memory-copy']},
  kernel:{sources:[['indices','CUDA: built-in variables','Check the meanings of threadIdx, blockIdx and blockDim.'],['launch','CUDA: writing and launching kernels','Relate block counts, thread counts and bounds checks to the repair.']],tasks:['kernel','kernel-launch'],note:'Function names in the repair examples are chosen for this course. The CUDA guide documents their qualifiers, indexing variables and launch syntax.'},
  scheduling:{sources:[['scheduling','CUDA: hardware multithreading','Distinguish resident work, ready work and hardware resource limits.'],['launch','CUDA: writing and launching kernels','Review how launched threads are grouped into blocks.']],tasks:['scheduling','scheduling-limits']},
  divergence:{sources:[['divergence','CUDA Best Practices: branching and divergence','Check the warp-level scope of divergent paths and predication.'],['scheduling','CUDA: hardware multithreading','Review the grouping of threads into warps.']],tasks:['divergence','divergence-scope']},
  'shared-memory':{sources:[['banks','CUDA Best Practices: shared-memory banks','Compare bank conflicts with the same-word broadcast exception.'],['barriers','CUDA: synchronisation functions','Check the scope and participation rules for __syncthreads().']],tasks:['shared-memory','shared-banks']},
  reduction:{sources:[['barriers','CUDA: synchronisation functions','Check the barrier contract before reasoning about partial sums.'],['banks','CUDA Best Practices: shared memory','Review shared values and access behaviour within a block.']],tasks:['reduction','reduction-order']},
  matmul:{sources:[['matmul','CUDA Best Practices: tiled matrix multiplication','Follow input tiles that are reused by multiple threads.'],['torchMatmul','PyTorch: torch.matmul','Connect the low-level example to the two-dimensional tensor operation.']],tasks:['matmul','matmul-shape']},
  'tensor-cores':{sources:[['wmma','CUDA: warp matrix functions','Check the cooperative operation and its supported types and layouts.'],['finfo','PyTorch: floating-point type information','Look up eps and the representable range of input formats.']],tasks:['tensor-cores','tensor-precision']},
  attention:{sources:[['attention','PyTorch: scaled_dot_product_attention','Check dropout behaviour and the available implementations.'],['sdpaKernel','PyTorch: sdpa_kernel','Check how enabled attention backends can be selected.']],tasks:['attention','attention-backend']},
  inference:{sources:[['timing','PyTorch: asynchronous CUDA execution','Find why timing must account for queued GPU work.'],['elementSize','PyTorch: Tensor.element_size','Check the byte unit used in tensor-payload estimates.']],tasks:['inference','inference-bytes']},
  'meet-gpu':{sources:[['scheduling','CUDA: hardware multithreading','Check SM, block and warp relationships shown in the map.'],['cudaSemantics','PyTorch: CUDA semantics','Connect CPU/GPU memory placement to tensor operations.']],tasks:['overview-placement','overview-memory']},
};
export function renderChapterReferences(slug) {
  const chapter=chapterReferences[slug];
  if(!chapter) throw new Error('Missing chapter references: '+slug);
  const entries=sources=>`<ul class="chapter-reference-list">${sources.map(([key,label,description])=>`<li>${link(key,label)}<p>${escape(description)}</p></li>`).join('')}</ul>`;
  return `<section class="chapter-references section-space" aria-labelledby="chapter-references-title"><h2 id="chapter-references-title">References</h2><p>Use these official references to check the concepts and code on this page.</p>${chapter.note?`<p>${escape(chapter.note)}</p>`:''}${entries(chapter.sources)}${chapter.optional?`<details><summary>Optional later reading</summary>${entries(chapter.optional)}</details>`:''}<p class="reference-version">These browser exercises do not run an installed PyTorch or CUDA toolkit. For optional local execution, choose documentation matching your installed tools. Links open online in a new tab; the questions and answer comparisons below work offline.</p></section>
<section class="documentation-exercises section-space" aria-labelledby="documentation-exercises-title"><h2 id="documentation-exercises-title">Use the documentation</h2><p>Use the references to explain each answer, then apply it to this page’s example. No installation is needed.</p>${chapter.tasks.map(renderReferenceTask).join('\n')}</section>`;
}
