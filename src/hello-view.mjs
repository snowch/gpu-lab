// Copyright © 2026 Christopher Snow.
import {steps,simulateIntro,lineFor,kernelSource} from './hello-model.mjs';
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function renderIntroMap(stage,state,selected=0,showOutput=true) {
  const groups=stage>=2?Array.from({length:state.blocks},(_,i)=>i):[null];
  return groups.map(group=>`<div class="hello-group">${group===null?'':`<h3>Block ${group}</h3>`}<div class="hello-threads">${state.threads.filter(t=>group===null||t.block===group).map(t=>{
    const tag=stage===0?'div':'button';
    const values=[['Input',t.input===null?'No element':t.input],['Thread '+t.i,'× '+state.factor],['Output',!showOutput?'?':t.skipped?'Skipped':t.invalid?'Invalid access':t.output]];
    return `<${tag} class="hello-thread" ${stage===0?'':`type="button" data-thread="${t.i}" aria-pressed="${t.i===selected}"`} ${showOutput&&(t.skipped||t.invalid)?`data-state="${t.skipped?'skip':'invalid'}"`:''}>${values.map(([label,value])=>`<small>${escape(label)}</small><strong>${escape(value)}</strong>`).join('')}</${tag}>`;
  }).join('')}</div></div>`).join('');
}
export function renderIntroSections() {
  return steps.map((step,stage)=>{
    const state=simulateIntro(stage,2);
    const pre=(id,code)=>`<pre id="${id}-${stage}">${escape(code)}</pre>`;
    return `<section class="hello-section" data-stage="${stage}" id="idea-${stage+1}" aria-labelledby="hello-title-${stage}">
      <p class="eyebrow">Idea ${stage+1} of ${steps.length}</p>
      <h2 id="hello-title-${stage}">${step.title}</h2>
      <p class="hello-concept">${step.concept}</p>
      <p>In PyTorch, <code>x</code> holds the inputs and <code>y</code> the results.</p>
      <pre class="hello-operation"><code id="hello-operation-${stage}">y = x * 2</code></pre>
      <p>${step.instruction}</p>
      <label class="hello-factor-label" for="hello-factor-${stage}">Multiply each number by <input id="hello-factor-${stage}" type="number" value="2" min="-10" max="10" step="any" inputmode="decimal"></label>
      ${stage===3?`<div class="hello-guard-section"><label><input id="hello-guard-3" type="checkbox" checked> Only access elements that exist</label></div>`:''}
      <button id="hello-run-${stage}" type="button" class="primary">Run</button>
      <p class="hello-note">Browser simulation · this example has its own controls</p>
      <div id="hello-map-${stage}" aria-label="Each thread connects one input to one output">${renderIntroMap(stage,state)}</div>
      <p id="hello-output-${stage}" class="hello-output" role="status">Example output: [${state.output.join(', ')}]</p>
      ${stage>0?`<div class="hello-index-section"><p id="hello-index-${stage}" role="status">Select a thread to follow its index.</p>${pre('hello-selected-code','output[0] = input[0] * 2;')}</div>`:''}
      ${stage>0&&stage<4?`<div class="hello-cuda-section">
        <h3>The same idea in CUDA</h3>
        <p>This code runs inside a GPU function. <code>input</code> and <code>output</code> are arrays; <code>i</code> chooses an element. CUDA C++ uses <code>;</code> to end a statement and <code>2.0f</code> to write a floating-point number.</p>
        ${pre('hello-line',stage===3?'if (i < n) {\n    '+lineFor(2)+'\n}':lineFor(2))}
        ${stage>=2?`<p>CUDA calls the block number <code>blockIdx.x</code>, its size <code>blockDim.x</code>, and a thread’s position within it <code>threadIdx.x</code>. The <code>.x</code> selects the first dimension; this example uses a one-dimensional list.</p><pre>int i = blockIdx.x * blockDim.x + threadIdx.x;</pre><p>The variable <code>i</code> is an integer. Block size is our grouping choice, not a count of physical GPU cores.</p>`:''}
        <p>${stage===3?'n is the number of elements (5). The condition i &lt; n asks whether this thread’s index is inside the array. Only then does the statement inside the braces run.':'We will see the complete function below, after exploring bounds checks.'}</p>
      </div>`:''}
      ${stage===4?`<div class="hello-complete">
        <h3>The Python operation</h3>${pre('hello-python','import torch\nx = torch.tensor([1.0, 2.0, 3.0, 4.0, 5.0], device="cuda")\ny = x * 2')}
        <p><code>device="cuda"</code> asks PyTorch to store the tensor on an NVIDIA GPU. PyTorch handles allocation and launches its own implementation of the operation; it does not compile the example below.</p>
        <h3>The complete CUDA example</h3>${pre('hello-full',kernelSource(2))}
        <p><code>__global__</code> marks a GPU kernel. <code>void</code> means it returns no value directly: it writes into <code>output</code>. <code>float*</code> passes the location of an array of floating-point numbers; <code>const</code> means this function does not change that input. <code>n</code> is the number of elements.</p>
        <details class="more-settings"><summary>Run the CUDA example on an NVIDIA GPU</summary>
          <p>The download contains this kernel and a separate CPU-side C++ program that allocates memory, copies inputs, launches the kernel and reads the output. It is not a Python extension.</p>
          <button id="hello-download-4" type="button">Download CUDA program</button>
          <p>Requires an NVIDIA GPU, compatible driver, CUDA Toolkit and host C++ compiler:</p>
          <pre>nvcc -std=c++17 hello.cu -o hello\n./hello</pre>
          <p>The generated CUDA program has not yet been compiled or tested on an NVIDIA GPU.</p>
        </details>
      </div>`:''}
    </section>`;
  }).join('\n');
}
