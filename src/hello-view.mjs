import {tensorValue} from './value-format.mjs';
// Copyright © 2026 Christopher Snow.
import {openingCode,browserNotice,codePanel,definitions,readerTask} from './chapter-view.mjs';
import {steps,simulateIntro,kernelSource,pythonSource,launchPlan,launchSource,boundsSource,introPrompt} from './hello-model.mjs';
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function renderIntroMap(stage,state,selected=0,showOutput=true) {
  const groups=stage>=2?Array.from({length:state.blocks},(_,i)=>i):[null];
  return groups.map(group=>`<div class="hello-group">${group===null?'':`<h3>Block ${group}</h3>`}<div class="hello-threads">${state.threads.filter(t=>group===null||t.block===group).map(t=>renderIntroThread(stage,state,t,selected,showOutput)).join('')}</div></div>`).join('');
}
function renderIntroThread(stage,state,t,selected,showOutput,worked=false) {
    const interactive=stage!==0&&!worked,tag=interactive?'button':'div';
    const calculation=t.skipped?'No calculation':t.invalid?(showOutput?'Invalid read':'Run to check'):'× '+state.factor;
    const cardState=t.skipped?'skip':t.invalid?(showOutput?'invalid':'pending'):null;
    const values=[[worked?'Read input':'Input',t.input===null?'No element':tensorValue(t.input)],[stage===0?'Calculation':'Thread '+t.i,calculation],[worked?'Write output':'Output',!showOutput?'?':t.skipped?'Skipped':t.invalid?'Invalid access':tensorValue(t.output)]];
    return `<${tag} class="hello-thread" ${interactive?`type="button" data-thread="${t.i}" aria-pressed="${t.i===selected}"`:''} ${cardState?`data-state="${cardState}"`:''}>${values.map(([label,value])=>`<small>${escape(label)}</small><strong>${escape(value)}</strong>`).join('')}</${tag}>`;
}
export function renderIntroSections() {
  const start=simulateIntro(0,2);
  return `<section class="hello-start" aria-labelledby="hello-start-title">
    <h2 id="hello-start-title">Double five values with PyTorch</h2>
    <p>We’ll store the five input values in a <strong>tensor</strong>: a collection of values arranged in one or more dimensions.</p>
    ${openingCode(pythonSource(),'hello-start-code')}
    <p class="hello-note"><strong>Note:</strong> Multiplying this floating-point tensor by <code>2</code> keeps its results floating-point too.</p>
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
      ${stage===2?'<p>In the diagram, four threads per block give eight threads in total for five inputs. Each thread has a position within its block. Its index across the array is: block number × threads per block + position within the block.</p><p>Block 1, position 0 gives 1 × 4 + 0 = 4: the fifth input. The grey cards have no input and say “No calculation”. Select one to inspect its index; the next experiment explores the check that makes it skip the arrays.</p>':''}
      ${stage===3?'<p>The check asks whether a thread’s index is smaller than the input count, 5. Indices 0–4 pass; indices 5–7 skip the read, multiplication and write.</p>':''}
      ${stage===4?`<p>PyTorch chooses its own kernel and launch settings for <code>y = x * 2</code>. Our <code>runKernel</code> is a separate CUDA teaching example that lets us choose the settings ourselves; PyTorch does not call it for this expression.</p>
      <details class="more-settings" id="hello-pytorch-control"><summary>More about PyTorch, optimisation and profiling</summary>
        <p>You can improve a PyTorch program by choosing suitable tensor layouts and data types and avoiding unnecessary copies. A custom CUDA kernel can give you direct control over threads and blocks, and can be called from PyTorch. The CUDA compiler also optimises code.</p>
        <p>This small example illustrates how the calculation is organised. For a real NVIDIA GPU, the optional <a href="profiling.html">profiling appendix shows how to inspect PyTorch’s actual kernel launches</a>.</p>
      </details>
      ${pre('hello-full',kernelSource(2),'CUDA C++ · complete GPU function (kernel)')}
      ${pre('hello-launch',launchSource(),'CUDA C++ · launch from the CPU')}
      <p>This one-dimensional launch uses the <code>.x</code> components. Two blocks of four provide eight threads. The final argument <code>5</code> supplies the input count <code>n</code>. The download includes the GPU allocations and copies.</p><p>Launch settings choose the block count and size. The GPU decides where each block runs.</p>`:''}
      ${stage===1?'':readerTask(step.instruction)}
      <label class="hello-factor-label" for="hello-factor-${stage}">Multiply each value by <input id="hello-factor-${stage}" type="number" value="${state.factor}" min="-10" max="10" step="any" inputmode="decimal"></label>
      ${stage===3?'<div class="hello-guard-section"><label><input id="hello-guard-3" type="checkbox" checked> Only access elements that exist</label></div>':''}
      <button id="hello-run-${stage}" type="button" class="primary" disabled>Run</button>
      <p class="hello-note">Browser simulation</p>
      ${stage===1?readerTask(step.instruction):''}
      ${stage===2||stage===3?'<div class="hello-bridge-layout"><div class="hello-bridge-visual">':''}
      <div id="hello-map-${stage}" aria-label="Each input connects to its output">${renderIntroMap(stage,state,stage===4?4:0,false)}</div>
      <p id="hello-output-${stage}" class="hello-output" role="status">${introPrompt(stage)}</p>
      <noscript><details><summary>Compare the worked result</summary><p>Output: [${state.output.map(tensorValue).join(', ')}].</p></details></noscript>
      ${stage>0?`<p id="hello-index-${stage}" role="status"${stage===4?' hidden':''}>Select a thread to follow its input and output.</p>`:''}
      ${stage===2||stage===3?`</div>${renderCodeBridge(stage,state.factor)}</div>`:''}
      ${stage===2?renderSmExplanation():''}
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

export function renderSmExplanation() {
  const state=simulateIntro(2,2),threads=state.threads.filter(t=>t.block===0);
  return `<section class="hello-sm" aria-labelledby="hello-sm-title">
    <h3 id="hello-sm-title">Where do these threads run?</h3>
    ${definitions([['Streaming multiprocessor (SM)','A part of the GPU containing hardware that executes instructions for threads.']])}
    <p>The GPU assigns each block to one SM, where it stays for its lifetime. Several blocks can share an SM when resources allow. The SM can carry out work for multiple threads in parallel; a block’s threads do not necessarily all execute at once.</p>
    <p>A block groups threads together. The SM supplies the hardware that reads their input values, performs their multiplications and writes their results.</p>
    <details id="hello-sm-details"><summary>Inside one SM: read → multiply → write</summary>
      <p><strong>Worked example: doubling the inputs in Block 0.</strong> This fixed example uses the opening multiplier, ${state.factor}, independently of the experiment controls.</p>
      <ul>${threads.slice(0,2).map(t=>`<li>Thread ${t.i} reads <strong>${tensorValue(t.input)}</strong>. The SM’s arithmetic hardware multiplies it by <strong>${state.factor}</strong>, producing <strong>${tensorValue(t.output)}</strong>, which the thread writes to its output position.</li>`).join('')}</ul>
      <div class="hello-sm-machine" aria-label="An example SM containing all four threads of Block 0">
        <p class="hello-sm-label"><strong>One SM</strong> · hardware shared by the block’s threads</p>
        <fieldset class="hello-sm-phase"><legend>Highlight an instruction</legend>
          ${[['read','Read input'],['multiply','Multiply'],['write','Write output']].map(([phase,label],i)=>`<label><input type="radio" name="hello-sm-phase" id="hello-sm-${phase}" value="${phase}"${i===0?' checked':''}> ${label}</label>`).join('')}
        </fieldset>
        <div class="hello-group"><h4>Block 0 · four threads</h4><div class="hello-threads">${threads.map(t=>renderIntroThread(2,state,t,0,true,true)).join('')}</div></div>
      </div>
      <p class="hello-note">One possible block placement on an NVIDIA GPU. Block 1 is omitted; it could share this SM or run on another. Highlighting follows the calculation, not execution timing. The cards represent threads sharing SM hardware.</p>
      <p><a href="scheduling.html">Chapter 6: how an SM keeps threads making progress →</a></p>
    </details>
  </section>`;
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
    <p>Keep the same five inputs and multiply each by 2. This exercise starts with eight threads per block.</p><p class="hello-note">Four and eight threads per block are small teaching examples, rather than recommended settings for a real workload. This activity compares grouping, not speed.</p>
    ${readerTask('For this exercise, choose the smallest block count that gives every input a thread. Predict the count before running. Will regrouping the threads change the five output values?','Predict the launch')}
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

export function renderCodeBridge(stage,factor) {
  if(stage===2)return `<div class="hello-code-bridge" aria-labelledby="hello-bridge-title-2">
    <h3 id="hello-bridge-title-2">How CUDA requests these blocks</h3>
    ${definitions([['Launch','Starting a GPU function with a chosen number of blocks and threads per block.']])}
    <p>PyTorch chooses its launch for <code>y = x * 2</code>. In this separate CUDA C++ example, we choose the block count and size. <code>runKernel</code> is our name for the GPU function that multiplies each input.</p>
    ${codePanel({id:'hello-bridge-launch-2',source:launchSource(),label:'CUDA C++ · launch for this diagram',explainedLocally:true})}
    <p><code>blocks = 2</code> matches the two block boundaries; <code>threadsPerBlock = 4</code> matches the four cards in each. The <code>&lt;&lt;&lt;blocks, threadsPerBlock&gt;&gt;&gt;</code> syntax requests that grouping. The last argument, <code>5</code>, is the input count. <code>d_input</code> and <code>d_output</code> refer to arrays already in GPU memory.</p>
    <p class="hello-note">The browser simulates the calculation; it does not compile or execute this CUDA code.</p>
    <details id="hello-bridge-complete-2"><summary>See the complete CUDA function for this diagram</summary>
      <p>Each thread calculates its array index, skips indices with no input, then multiplies one value. The next section explores that check.</p>
      ${codePanel({id:'hello-bridge-full-2',source:kernelSource(factor),label:'CUDA C++ · complete GPU function'})}
      <p>The launch above starts this function. The download also includes memory allocation and copies.</p>
      <button type="button" id="hello-bridge-download-2">Download this CUDA example</button> <a href="desktop.html#first-cuda">Desktop setup</a>
    </details>
  </div>`;
  if(stage===3)return `<div class="hello-code-bridge" aria-labelledby="hello-bridge-title-3">
    <h3 id="hello-bridge-title-3">The check in CUDA</h3>
    <p>Here <code>i</code> is the thread’s array index and <code>n</code> is the input count, 5. The condition protects both the read and the write.</p>
    ${codePanel({id:'hello-bounds-code-3',source:boundsSource(factor),label:'CUDA C++ · body excerpt from runKernel · check enabled',explainedLocally:true})}
    <p>The braces enclose the statements controlled by <code>if</code>; the <code>f</code> suffix writes the multiplier as a 32-bit floating-point value. Toggle the check above to compare this excerpt with and without its condition.</p>
  </div>`;
  return '';
}
