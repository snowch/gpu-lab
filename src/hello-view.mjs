// Copyright © 2026 Christopher Snow.
import {openingCode,browserNotice,codePanel,definitions,readerTask} from './chapter-view.mjs';
import {steps,simulateIntro,kernelSource,pythonSource,launchPlan} from './hello-model.mjs';
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function renderIntroMap(stage,state,selected=0,showOutput=true) {
  const groups=stage>=2?Array.from({length:state.blocks},(_,i)=>i):[null];
  return groups.map(group=>`<div class="hello-group">${group===null?'':`<h3>Block ${group}</h3>`}<div class="hello-threads">${state.threads.filter(t=>group===null||t.block===group).map(t=>{
    const tag=stage===0?'div':'button';
    const calculation=t.skipped?'No calculation':t.invalid?(showOutput?'Invalid read':'Run to check'):'× '+state.factor;
    const cardState=t.skipped?'skip':t.invalid?(showOutput?'invalid':'pending'):null;
    const values=[['Input',t.input===null?'No element':t.input],[stage===0?'Calculation':'Thread '+t.i,calculation],['Output',!showOutput?'?':t.skipped?'Skipped':t.invalid?'Invalid access':t.output]];
    return `<${tag} class="hello-thread" ${stage===0?'':`type="button" data-thread="${t.i}" aria-pressed="${t.i===selected}"`} ${cardState?`data-state="${cardState}"`:''}>${values.map(([label,value])=>`<small>${escape(label)}</small><strong>${escape(value)}</strong>`).join('')}</${tag}>`;
  }).join('')}</div></div>`).join('');
}
export function renderIntroSections() {
  const start=simulateIntro(0,2);
  return `<section class="hello-start" aria-labelledby="hello-start-title">
    <h2 id="hello-start-title">Start with a PyTorch operation</h2>
    ${openingCode(pythonSource(),'hello-start-code')}
    ${definitions([['Tensor','A collection of numbers arranged in one or more dimensions. Here, our tensor is a one-dimensional list of five numbers.']])}
    <p><code>import torch</code> loads PyTorch. Here <code>x</code> holds five inputs. <code>device="cuda"</code> places them on an NVIDIA GPU, and <code>y = x * 2</code> multiplies each number by two to produce <code>y</code>.</p>
    <dl class="hello-start-values">
      <div><dt>Input <code>x</code></dt><dd><code>[${start.input.join(', ')}]</code></dd></div>
      <div><dt>Result <code>y</code></dt><dd><code>[${start.output.join(', ')}]</code></dd></div>
    </dl>
    ${browserNotice()}
    <p class="hello-question"><strong>How does the GPU calculate these results?</strong></p>
  </section>`+steps.map((step,stage)=>{
    const state=simulateIntro(stage,2);
    const pre=(id,source,label)=>codePanel({id:id+'-'+stage,source,label});
    return `<section class="hello-section" data-stage="${stage}" id="idea-${stage+1}" aria-labelledby="hello-title-${stage}">
      <p class="eyebrow">Idea ${stage+1} of ${steps.length}</p>
      <h2 id="hello-title-${stage}">${step.title}</h2>
      ${step.leadIn?`<p>${step.leadIn}</p>`:''}
      ${definitions(step.definitions)}
      <p class="hello-concept">${step.concept}</p>
      <div class="chapter-code-panel" data-language="pytorch"><p class="chapter-code-label">PyTorch operation</p><pre class="hello-operation"><code id="hello-operation-${stage}">y = x * 2</code></pre></div>
      ${stage===2?'<p>For our example we choose four threads per block. Two blocks provide eight threads for five inputs. Each thread has a position within its block. Its index across the array is: block number × threads per block + position within the block.</p><p>Block 1, position 0 gives 1 × 4 + 0 = 4: the fifth input. The extra three threads still exist, but have no input. A check makes them skip the read, multiplication and write. Their cards are grey and say “No calculation”; select one to inspect its index. The next experiment lets you turn that check off.</p>':''}
      ${stage===3?'<p>Here, the bounds check asks whether a thread’s index is smaller than the number of inputs. Indices 0–4 pass; indices 5–7 skip the read, multiplication and write. Turn the check off below to see why it matters.</p>':''}
      ${stage===4?`<p>PyTorch selects an optimised implementation and handles its launch; <code>y = x * 2</code> does not choose blocks or threads. CUDA lets us write the GPU function and choose those settings ourselves. The compiler also optimises our code. Our <code>runKernel</code> is a separate teaching function; PyTorch does not call it when evaluating this expression. The example makes the work visible and is not intended to outperform PyTorch.</p>
      ${pre('hello-full',kernelSource(2),'CUDA C++ · complete GPU function (kernel)')}
      ${pre('hello-launch','runKernel<<<2, 4>>>(d_input, d_output, 5);','CUDA C++ · launch from the CPU')}
      <ol><li><strong>Find the input.</strong> <code>blockIdx.x</code> is the block number, <code>blockDim.x</code> is its size, and <code>threadIdx.x</code> is the position within it. Their calculation gives the integer index <code>i</code>. The <code>.x</code> selects the first dimension of our one-dimensional launch.</li>
      <li><strong>Check the index.</strong> <code>n</code> is the input count. <code>if (i &lt; n)</code> lets only existing elements reach the calculation.</li>
      <li><strong>Calculate one result.</strong> The assignment reads <code>input[i]</code>, multiplies it and writes <code>output[i]</code>. <code>2.0f</code> is a floating-point number; <code>;</code> ends the statement.</li></ol>
      <p>The launch’s <code>&lt;&lt;&lt;2, 4&gt;&gt;&gt;</code> starts two blocks of four threads. <code>d_input</code> and <code>d_output</code> refer to arrays already allocated in GPU memory; the final <code>5</code> supplies <code>n</code>. The download below includes that allocation and the copies.</p>
      <details><summary>Read the function declaration</summary><p><code>__global__</code> marks a GPU kernel. <code>void</code> means it writes results through <code>output</code> rather than returning a value. <code>float*</code> passes the location of an array of floating-point values; <code>const</code> means this function does not change the input. <code>int</code> declares an integer.</p></details>`:''}
      ${readerTask(step.instruction)}
      <label class="hello-factor-label" for="hello-factor-${stage}">Multiply each number by <input id="hello-factor-${stage}" type="number" value="2" min="-10" max="10" step="any" inputmode="decimal"></label>
      ${stage===3?'<div class="hello-guard-section"><label><input id="hello-guard-3" type="checkbox" checked> Only access elements that exist</label></div>':''}
      <button id="hello-run-${stage}" type="button" class="primary" disabled>Run</button>
      <p class="hello-note">Browser simulation</p>
      <div id="hello-map-${stage}" aria-label="Each input connects to its output">${renderIntroMap(stage,state,0,false)}</div>
      <p id="hello-output-${stage}" class="hello-output" role="status">Predict the outputs, then press Run.</p>
      <noscript><details><summary>Compare the worked result</summary><p>Output: [${state.output.join(', ')}].</p></details></noscript>
      ${stage>0?`<p id="hello-index-${stage}" role="status">Select a thread to follow its input and output.</p>`:''}
      ${stage===4?`<div class="hello-complete">
        <details class="more-settings"><summary>Run the CUDA example on your computer</summary>
          <p>The download contains this kernel and a separate CPU-side C++ program that allocates memory, copies inputs, launches the kernel and reads the output. It is not a Python extension.</p>
          <button id="hello-download-4" type="button">Download CUDA program</button>
          <p><strong>With an NVIDIA GPU:</strong> install a compatible driver, CUDA Toolkit and host C++ compiler, then run:</p>
          <pre>nvcc -std=c++17 hello.cu -o hello\n./hello</pre>
          <p><strong>Without an NVIDIA GPU:</strong> use our GPGPU-Sim Docker container to compile and simulate the download on your desktop.</p>
          <p><a href="desktop.html#first-cuda">Desktop setup and output checks</a></p>
          <p>CI compiles generated chapter 1 examples with the CUDA Toolkit and checks their outputs in GPGPU-Sim. Physical NVIDIA GPU execution has not yet been validated.</p>
        </details>

        <p><a href="scheduling.html">Later: how the GPU schedules blocks and warps →</a></p>
      </div>`:''}
    </section>`;
  }).join('\n');
}
export function renderIntroTransfer() {
  const plan=launchPlan(6);
  return `<section class="hello-section-end"><h2>Try a new case</h2>${readerTask('Keep four threads per block. Choose an input count, then predict how many blocks you need and which thread indices should skip the arrays.','Predict a new case')}
  <label for="hello-transfer-count">Number of inputs <select id="hello-transfer-count"><option>6</option><option>8</option><option>9</option></select></label>
  <button type="button" class="primary" id="hello-transfer-run">Check your explanation</button>
  <p id="hello-transfer-result" role="status">Predict first, then check.</p>
  <noscript><p>For 6 inputs, ${plan.blocks} blocks supply ${plan.threads} threads. Indices ${plan.skipped.join(' and ')} skip the arrays.</p></noscript>
  <p><a href="kernel.html">Optional practice: repair a kernel →</a></p></section>`;
}
