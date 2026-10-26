// Copyright © 2026 Christopher Snow.
import {openingCode,browserNotice,codePanel} from './chapter-view.mjs';
import {overviewExample} from './overview-visuals.mjs';
import {renderReferenceTask} from './reference-tasks.mjs';
import {steps,simulateIntro,lineFor,kernelSource,pythonSource} from './hello-model.mjs';
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function renderIntroMap(stage,state,selected=0,showOutput=true) {
  const groups=stage>=2?Array.from({length:state.blocks},(_,i)=>i):[null];
  return groups.map(group=>`<div class="hello-group">${group===null?'':`<h3>Block ${group}</h3>`}<div class="hello-threads">${state.threads.filter(t=>group===null||t.block===group).map(t=>{
    const tag=stage===0?'div':'button';
    const values=[['Input',t.input===null?'No element':t.input],['Thread '+t.i,'× '+state.factor],['Output',!showOutput?'?':t.skipped?'Skipped':t.invalid?'Invalid access':t.output]];
    return `<${tag} class="hello-thread" ${stage===0?'':`type="button" data-thread="${t.i}" aria-pressed="${t.i===selected}"`} ${showOutput&&(t.skipped||t.invalid)?`data-state="${t.skipped?'skip':'invalid'}"`:''}>${values.map(([label,value])=>`<small>${escape(label)}</small><strong>${escape(value)}</strong>`).join('')}</${tag}>`;
  }).join('')}</div></div>`).join('');
}
export function renderIntroRelationships() {
  const example=overviewExample(64,3);
  const expanded=example.blocks[0];
  return `<figure class="hello-relationships" aria-labelledby="hello-relationships-title" aria-describedby="hello-relationships-caption">
    <h4 id="hello-relationships-title">Inside a GPU: SMs → blocks → warps → threads</h4>
    <p class="hello-placement-note">Separate placement example: ${example.blocks.length} blocks, ${example.threadsPerBlock} threads per block.</p>
    <div class="hello-gpu"><strong>GPU</strong>
      <div class="hello-sm-grid">${example.sms.map(sm=>`<section class="hello-sm" aria-label="SM ${sm.sm} example blocks">
        <h5>SM ${sm.sm}</h5>
        ${sm.blocks.map(block=>`<div class="hello-resident-block">
          <strong>Block ${block.name}</strong><span>${block.threads.length} threads · ${block.warps.length} warps · stays on this SM</span>
          ${block.warps.map((warp,index)=>`<div class="hello-warp"><strong>Warp ${index} · ${warp.length} threads</strong>
            <p>Threads ${warp[0].thread}–${warp.at(-1).thread} within block ${block.name}</p>
            ${block===expanded&&index===0?`<div class="hello-warp-lanes" role="list" aria-label="Block A, warp 0: 32 lane positions">${warp.map(thread=>
              `<span class="hello-warp-lane has-thread" role="listitem" aria-label="Lane ${thread.lane}: thread ${thread.thread} within block A">${thread.thread}</span>`
            ).join('')}</div>`:''}
          </div>`).join('')}
        </div>`).join('')}
      </section>`).join('')}</div>
    </div>
    <figcaption id="hello-relationships-caption">Each block here contains two warps. A lane is a thread’s position within its warp; each tile shows a thread’s index within block A. Warps never combine threads from different blocks. This shows one possible placement, not a chip floor plan or an execution timeline. Placement and how much work can execute at once depend on available resources.</figcaption>
    <p><strong>Blocks can make progress independently.</strong> The SM can choose ready warps from any of the blocks it holds. Another block can run while some threads in the first are waiting or some lanes are unused, when resources allow. A block does not have to finish before another can start.</p>
    <p>In the four-thread exercise below, each block uses one partially filled warp: 4 of 32 lanes have threads. The other 28 positions do not prevent another block from running, and cannot be filled with threads from another block.</p>
    <p><a href="scheduling.html">Explore warp scheduling in the later lab →</a></p>
  </figure>`;
}
export function renderIntroSections() {
  const start=simulateIntro(0,2);
  return `<section class="hello-start" aria-labelledby="hello-start-title">
    <h2 id="hello-start-title">Start with a PyTorch operation</h2>
    ${openingCode(pythonSource(),'hello-start-code')}
    <p><code>import torch</code> loads PyTorch. A tensor holds a collection of numbers; here <code>x</code> holds five inputs. <code>device="cuda"</code> places them on an NVIDIA GPU, and <code>y = x * 2</code> multiplies each number by two to produce <code>y</code>.</p>
    <dl class="hello-start-values">
      <div><dt>Input <code>x</code></dt><dd><code>[${start.input.join(', ')}]</code></dd></div>
      <div><dt>Result <code>y</code></dt><dd><code>[${start.output.join(', ')}]</code></dd></div>
    </dl>
    ${browserNotice()}
    <p class="hello-question"><strong>How does the GPU calculate these results?</strong></p>
  </section>`+steps.map((step,stage)=>{
    const state=simulateIntro(stage,2);
    const pre=(id,source,label,language='cuda')=>codePanel({id:id+'-'+stage,source,language,label:label??'CUDA C++'});
    return `<section class="hello-section" data-stage="${stage}" id="idea-${stage+1}" aria-labelledby="hello-title-${stage}">
      <p class="eyebrow">Idea ${stage+1} of ${steps.length}</p>
      <h2 id="hello-title-${stage}">${step.title}</h2>
      ${stage===2?'<h3>Why group threads?</h3>':''}
      <p class="hello-concept">${step.concept}</p>
      ${stage===2?`<p>For <code>y = x * 2</code>, each thread works independently. Later, in matrix multiplication, a block can load inputs into shared memory once and reuse them across its threads.</p>
      <h3>Where do they run?</h3>
      <p>Each block stays on one streaming multiprocessor (SM), a part of the GPU that executes threads in parallel. Different blocks can run on different SMs; several blocks can share one SM when resources allow.</p>
      <p>A block’s threads do not necessarily all execute at once. The SM organises them into groups called warps and schedules work from those groups. On NVIDIA GPUs, each warp has 32 thread positions. We explore warp scheduling later.</p>
      ${renderIntroRelationships()}
      <h3>Try two blocks</h3>
      <p>Here we put four threads in each block. Each thread has a position within its block; combining that position with the block number gives its index across the whole array. Two blocks provide eight threads for our five inputs.</p>`:''}
      <div class="chapter-code-panel" data-language="pytorch"><p class="chapter-code-label">PyTorch operation</p><pre class="hello-operation"><code id="hello-operation-${stage}">y = x * 2</code></pre></div>
      ${stage===2?`<p>The PyTorch expression above does not specify blocks or threads. For our CUDA teaching example, we choose the launch size explicitly:</p>
      ${pre('hello-launch','runKernel<<<2, 4>>>(d_input, d_output, 5);','CUDA C++ · launch two blocks of four threads')}
      <p>The numbers inside <code>&lt;&lt;&lt;2, 4&gt;&gt;&gt;</code> request two blocks with four threads each. <code>d_input</code> and <code>d_output</code> refer to arrays in GPU memory; the final <code>5</code> tells our kernel how many values exist. The GPU decides which SM receives each block.</p>
      <p>Inside the kernel, each thread calculates its index. CUDA calls the block number <code>blockIdx.x</code>, the block size <code>blockDim.x</code>, and the thread’s position within its block <code>threadIdx.x</code>. The <code>.x</code> selects the first dimension; we use a one-dimensional list.</p>
      ${pre('hello-index-expression','int i = blockIdx.x * blockDim.x + threadIdx.x;','CUDA C++ · calculate the index')}
      <p><code>int</code> makes <code>i</code> an integer. For block 1, position 0: <code>i = 1 * 4 + 0 = 4</code>, which selects the fifth input. Block size is our grouping choice, not a count of physical GPU cores.</p>`:''}
      <p>${stage===0?'Predict the five outputs before you run. ':stage===3?'Predict which threads have no input. ':''}${step.instruction}</p>
      <label class="hello-factor-label" for="hello-factor-${stage}">Multiply each number by <input id="hello-factor-${stage}" type="number" value="2" min="-10" max="10" step="any" inputmode="decimal"></label>
      ${stage===3?`<div class="hello-guard-section"><label><input id="hello-guard-3" type="checkbox" checked> Only access elements that exist</label></div>`:''}
      <button id="hello-run-${stage}" type="button" class="primary">Run</button>
      <p class="hello-note">Browser simulation · this example has its own controls</p>
      <div id="hello-map-${stage}" aria-label="Each thread connects one input to one output">${renderIntroMap(stage,state)}</div>
      <p id="hello-output-${stage}" class="hello-output" role="status">Example output: [${state.output.join(', ')}]</p>
      ${stage===0?`<p class="reference-goal">Practise using the official PyTorch and CUDA references as you work through the course. Start with the links provided; later labs ask you to find the relevant section.</p><p class="reference-version">Use the documentation links provided for the browser exercises. These simulations do not run PyTorch or CUDA and require no installation. If you run the examples in your own environment, use documentation matching your installed PyTorch or CUDA version.</p>
    ${renderReferenceTask('hello-pytorch')}`: ''}
      ${stage>0?`<div class="hello-index-section">
        ${stage===1?'<h3>What does PyTorch handle for you?</h3><p>With <code>y = x * 2</code>, you describe the calculation. PyTorch selects a GPU function, called a kernel, and handles its launch. Its implementations and supporting libraries are already optimised, though choices such as tensor layout and data type still affect performance.</p><p>CUDA gives the kernel developer more control over threads, blocks and memory access. The CUDA compiler also performs optimisations. Here, our small CUDA example shows how the work is organised; it is not intended to outperform PyTorch.</p><p>Each thread uses the same CUDA statement with its own index <code>i</code>. Select a thread to see its index substituted below. <code>input</code> and <code>output</code> are arrays; <code>;</code> ends the statement and <code>2.0f</code> is a floating-point number.</p>':''}
        <p id="hello-index-${stage}" role="status">Select a thread to follow its index.</p>
        <div class="chapter-code-panel is-selected-thread" data-language="cuda">
          <p class="chapter-code-label" id="hello-cuda-label-${stage}">CUDA C++</p>
          <pre aria-labelledby="hello-cuda-label-${stage}"><code>// Every thread uses this statement
<span id="hello-line-${stage}">${escape(stage>=2?'if (i < n) {\n    '+lineFor(2)+'\n}':lineFor(2))}</span>

<span id="hello-selected-label-${stage}">// Selected thread: i = 0</span>
<span id="hello-selected-code-${stage}" aria-labelledby="hello-selected-label-${stage}">output[0] = input[0] * 2.0f;</span></code></pre>
        </div>
      </div>`:''}
      ${stage>0&&stage<4?`<div class="hello-cuda-section">
        ${stage===2?'<p>A bounds check tests whether an index names an existing element. Here <code>n</code> is 5; <code>i &lt; n</code> lets indices 0–4 access the arrays and skips indices 5–7.</p>':''}
        ${stage===3?`<p>CUDA calls the block number <code>blockIdx.x</code>, its size <code>blockDim.x</code>, and a thread’s position within it <code>threadIdx.x</code>. The <code>.x</code> selects the first dimension; this example uses a one-dimensional list.</p>${pre('hello-index-expression','int i = blockIdx.x * blockDim.x + threadIdx.x;','CUDA C++ · calculate the index')}<p>The variable <code>i</code> is an integer. Block size is our grouping choice, not a count of physical GPU cores.</p>`:''}
        ${stage===3?'<p>The condition <code>i &lt; n</code> asks whether this thread’s index is inside the array. Only then does the statement inside the braces run.</p>':''}
      </div>`:''}
      ${stage===2?renderReferenceTask('hello-indices'):''}
      ${stage===4?`<div class="hello-complete">
        <h3>The PyTorch operation we started with</h3>${pre('hello-python','y = x * 2','PyTorch operation','pytorch')}
        <p>PyTorch handles allocation and launches its own implementation of the operation; it does not compile the example below.</p>
        <h3>The complete CUDA example</h3>${pre('hello-full',kernelSource(2),'CUDA C++ · complete kernel')}
        <p><code>__global__</code> marks a GPU kernel. <code>void</code> means it returns no value directly: it writes into <code>output</code>. <code>float*</code> passes the location of an array of floating-point numbers; <code>const</code> means this function does not change that input. <code>n</code> is the number of elements.</p>
        <details class="more-settings"><summary>Run the CUDA example on your computer</summary>
          <p>The download contains this kernel and a separate CPU-side C++ program that allocates memory, copies inputs, launches the kernel and reads the output. It is not a Python extension.</p>
          <button id="hello-download-4" type="button">Download CUDA program</button>
          <p><strong>With an NVIDIA GPU:</strong> install a compatible driver, CUDA Toolkit and host C++ compiler, then run:</p>
          <pre>nvcc -std=c++17 hello.cu -o hello\n./hello</pre>
          <p><strong>Without an NVIDIA GPU:</strong> use our GPGPU-Sim Docker container to compile and simulate the download on your desktop.</p>
          <p><a href="https://github.com/snowch/gpu-lab/blob/main/docs/run-cuda.md" target="_blank" rel="noopener">Desktop setup and output checks (opens in a new tab)</a></p>
          <p>CI compiles generated chapter 1 examples with the CUDA Toolkit and checks their outputs in GPGPU-Sim. Physical NVIDIA GPU execution has not yet been validated.</p>
        </details>
      </div>`:''}
    </section>`;
  }).join('\n');
}
