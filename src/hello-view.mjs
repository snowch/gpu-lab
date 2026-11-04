import {tensorValue} from './value-format.mjs';
// Copyright © 2026 Christopher Snow.
import {openingCode,browserNotice,codePanel,definitions,readerTask} from './chapter-view.mjs';
import {steps,simulateIntro,kernelSource,pythonSource,launchPlan,launchSource,introPrompt} from './hello-model.mjs';
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function renderIntroMap(stage,state,selected=0,showOutput=true) {
  const groups=stage>=2?Array.from({length:state.blocks},(_,i)=>i):[null];
  return groups.map(group=>`<div class="hello-group">${group===null?'':`<h3>Block ${group}</h3>`}<div class="hello-threads">${state.threads.filter(t=>group===null||t.block===group).map(t=>{
    const tag=stage===0?'div':'button';
    const calculation=t.skipped?'No calculation':t.invalid?(showOutput?'Invalid read':'Run to check'):'× '+state.factor;
    const cardState=t.skipped?'skip':t.invalid?(showOutput?'invalid':'pending'):null;
    const values=[['Input',t.input===null?'No element':tensorValue(t.input)],[stage===0?'Calculation':'Thread '+t.i,calculation],['Output',!showOutput?'?':t.skipped?'Skipped':t.invalid?'Invalid access':tensorValue(t.output)]];
    return `<${tag} class="hello-thread" ${stage===0?'':`type="button" data-thread="${t.i}" aria-pressed="${t.i===selected}"`} ${cardState?`data-state="${cardState}"`:''}>${values.map(([label,value])=>`<small>${escape(label)}</small><strong>${escape(value)}</strong>`).join('')}</${tag}>`;
  }).join('')}</div></div>`).join('');
}
export function renderIntroSections() {
  const start=simulateIntro(0,2);
  return `<section class="hello-start" aria-labelledby="hello-start-title">
    <h2 id="hello-start-title">Double five values with PyTorch</h2>
    <p>We’ll store the five input values in a <strong>tensor</strong>: a collection of values arranged in one or more dimensions.</p>
    ${openingCode(pythonSource(),'hello-start-code')}
    ${definitions([['Float (floating-point value)','A value stored in a format that can represent fractional amounts. The .0 literals create floating-point inputs: 1.0 has a whole-number value, but is still stored as a float. Multiplying this tensor by 2 keeps its floating-point type.']])}
    <dl class="hello-start-values">
      <div><dt>Input <code>x</code></dt><dd><code>[${start.input.map(tensorValue).join(', ')}]</code></dd></div>
      <div><dt>Result <code>y</code></dt><dd><code>[${start.output.map(tensorValue).join(', ')}]</code></dd></div>
    </dl>
    ${browserNotice()}
    <p class="hello-question"><strong>How does the GPU calculate these results?</strong></p>
  </section>`+steps.map((step,stage)=>{
    const state=simulateIntro(stage,step.factor??2);
    const worked=stage===1?simulateIntro(stage,2):null;
    const pre=(id,source,label)=>codePanel({id:id+'-'+stage,source,label});
    return `<section class="hello-section" data-stage="${stage}" id="idea-${stage+1}" aria-labelledby="hello-title-${stage}">
      <p class="eyebrow">Idea ${stage+1} of ${steps.length}</p>
      <h2 id="hello-title-${stage}">${step.title}</h2>
      ${step.leadIn?`<p>${step.leadIn}</p>`:''}
      ${definitions(step.definitions)}
      ${worked?`<p>Here, each thread handles one input value:</p><ul class="hello-thread-examples">${worked.threads.slice(0,2).map(thread=>`<li>Thread ${thread.i} reads <strong>${tensorValue(thread.input)}</strong>, multiplies it by <strong>${worked.factor}</strong>, and writes <strong>${tensorValue(thread.output)}</strong>.</li>`).join('')}<li>Threads ${worked.threads[2].i}–${worked.threads.at(-1).i} do the same for the remaining inputs.</li></ul><p>Each thread follows the same instructions using a different input value. The GPU is built to run many threads at the same time. It schedules threads in groups, so launching many threads does not mean they all run at once.</p>`:''}
      <p class="hello-concept">${step.concept}</p>
      <div class="chapter-code-panel" data-language="pytorch"><p class="chapter-code-label">PyTorch operation</p><pre class="hello-operation"><code id="hello-operation-${stage}">y = x * ${state.factor}</code></pre></div>
      ${stage===2?'<p>For our example we choose four threads per block. Two blocks provide eight threads for five inputs. The final CUDA section shows the launch code that requests those groups. Each thread has a position within its block. Its index across the array is: block number × threads per block + position within the block.</p><p>Block 1, position 0 gives 1 × 4 + 0 = 4: the fifth input. The extra three threads still exist, but have no input. A check makes them skip the read, multiplication and write. Their cards are grey and say “No calculation”; select one to inspect its index. The next experiment lets you turn that check off.</p>':''}
      ${stage===3?'<p>Here, the bounds check asks whether a thread’s index is smaller than the number of inputs. Indices 0–4 pass; indices 5–7 skip the read, multiplication and write. Turn the check off below to see why it matters.</p>':''}
      ${stage===4?`<p>For <code>y = x * 2</code>, PyTorch selects an optimised implementation and handles its launch. This expression does not expose block or thread settings. You can still improve a PyTorch program by choosing suitable tensor layouts and data types, and avoiding unnecessary copies. To control a launch directly, a developer can write a custom CUDA kernel and call it from PyTorch.</p><p>Here, CUDA lets us write the GPU function and choose those settings ourselves. The compiler also optimises our code. Our <code>runKernel</code> is a separate teaching function; PyTorch does not call it when evaluating this expression. The example makes the work visible and is not intended to outperform PyTorch. For a real NVIDIA GPU, the optional <a href="profiling.html">profiling appendix shows how to inspect PyTorch’s actual kernel launches</a>.</p>
      ${pre('hello-full',kernelSource(2),'CUDA C++ · complete GPU function (kernel)')}
      ${pre('hello-launch',launchSource(),'CUDA C++ · launch from the CPU')}
      <p>This one-dimensional launch uses the <code>.x</code> components. Two blocks of four provide eight threads. The final argument <code>5</code> supplies the input count <code>n</code>. The download includes the GPU allocations and copies.</p><p>Launch settings choose the block count and size. The GPU decides where each block runs.</p>`:''}
      ${stage===1?'':readerTask(step.instruction)}
      <label class="hello-factor-label" for="hello-factor-${stage}">Multiply each value by <input id="hello-factor-${stage}" type="number" value="${state.factor}" min="-10" max="10" step="any" inputmode="decimal"></label>
      ${stage===3?'<div class="hello-guard-section"><label><input id="hello-guard-3" type="checkbox" checked> Only access elements that exist</label></div>':''}
      <button id="hello-run-${stage}" type="button" class="primary" disabled>Run</button>
      <p class="hello-note">Browser simulation</p>
      ${stage===1?readerTask(step.instruction):''}
      <div id="hello-map-${stage}" aria-label="Each input connects to its output">${renderIntroMap(stage,state,stage===4?4:0,false)}</div>
      <p id="hello-output-${stage}" class="hello-output" role="status">${introPrompt(stage)}</p>
      <noscript><details><summary>Compare the worked result</summary><p>Output: [${state.output.map(tensorValue).join(', ')}].</p></details></noscript>
      ${stage>0?`<p id="hello-index-${stage}" role="status"${stage===4?' hidden':''}>Select a thread to follow its input and output.</p>`:''}
      ${stage===4?renderCudaTrace(state.threads[4],state,false):''}
      ${stage===4?renderLaunchPractice():''}
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

export function renderCudaTrace(thread,state,ran) {
  const valid=thread.i<state.input.length;
  return `<div id="hello-cuda-trace" class="hello-cuda-trace" role="status" aria-label="Selected thread’s CUDA trace">
    <h3>Selected thread ${thread.i}</h3>
    ${codePanel({id:'hello-trace-line',source:'int i = blockIdx.x * blockDim.x + threadIdx.x;',label:'CUDA C++ · index line from the complete kernel'})}
    <dl class="hello-cuda-variables">
      <div><dt><code>blockIdx.x</code></dt><dd>${thread.block}</dd></div>
      <div><dt><code>blockDim.x</code></dt><dd>${state.size}</dd></div>
      <div><dt><code>threadIdx.x</code></dt><dd>${thread.local}</dd></div>
    </dl>
    <p><code>i = ${thread.block} × ${state.size} + ${thread.local} = ${thread.i}</code></p>
    <p><code>${thread.i} &lt; ${state.input.length}</code> is ${valid?'true':'false'}. ${valid?`The check permits reading <code>input[${thread.i}]</code> and writing <code>output[${thread.i}]</code>.`:'No element exists at this index. The check skips the read, multiplication and write.'}</p>
    <p>${!ran?'Output: ? · Run to reveal the result.':valid?`Input ${tensorValue(thread.input)} → output ${tensorValue(thread.output)}.`:'No calculation · no output written.'}</p>
  </div>`;
}
export function renderLaunchPractice() {
  return `<div class="hello-launch-practice" aria-labelledby="hello-launch-title">
    <h3 id="hello-launch-title">Change how the threads are grouped</h3>
    <p>Keep the same five inputs and multiply each by 2. This exercise starts with eight threads per block.</p>
    ${readerTask('Use as few blocks as possible while giving every input a thread. Predict the block count before running. Will regrouping the threads change the five output values?','Predict the launch')}
    <div class="hello-launch-controls">
      <label for="hello-launch-size">Threads per block<select id="hello-launch-size"><option value="8">8</option><option value="4">4</option></select></label>
      <label for="hello-launch-guess">Your block count<select id="hello-launch-guess"><option value="">Choose…</option><option>1</option><option>2</option><option>3</option></select></label>
      <button type="button" class="primary" id="hello-launch-run" disabled>Check and run simulation</button>
    </div>
    <p class="hello-note">Browser simulation · inspect how the same input cards regroup.</p>
    <p id="hello-launch-feedback" role="status">Predict the block count, then check.</p>
    <div id="hello-launch-answer" hidden>
      ${codePanel({id:'hello-launch-example',source:'',label:'CUDA C++ · launch for your settings'})}
      <button type="button" id="hello-launch-download">Download this launch as a CUDA program</button>
      <div id="hello-launch-map" aria-label="Thread grouping for the checked launch"></div>
      <p id="hello-launch-output"></p>
      <p id="hello-launch-index" role="status"></p>
      <p>Two blocks of four and one block of eight both supply eight threads. The output values stay the same: indices 0–4 calculate results and indices 5–7 skip the arrays.</p>
    </div>
  </div>`;
}
