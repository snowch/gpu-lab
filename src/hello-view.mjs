// Copyright © 2026 Christopher Snow.
import {tensorValue} from './value-format.mjs';
import {openingCode,browserNotice,codePanel,definitions,readerTask} from './chapter-view.mjs';
import {simulateIntro,kernelSource,pythonSource,launchSource,boundsSource,introPrompt,inspectLaunch} from './hello-model.mjs';
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

// One row per thread, instead of repeating a tall input/calculation/output card.
export function renderIntroMap(stage,state,selected=0,showOutput=true,interactive=true) {
  if(stage===0)return `<div class="hello-table-wrap"><table class="hello-thread-table"><caption>One input and one output per thread</caption><thead><tr><th scope="col">Thread</th><th scope="col">Input</th><th scope="col">× ${state.factor}</th><th scope="col">Output</th></tr></thead><tbody>${state.threads.map(t=>`<tr class="${t.i===selected?'is-selected':''}"><th scope="row"><button type="button" data-thread="${t.i}" aria-pressed="${t.i===selected}">Thread ${t.i}</button></th><td>${tensorValue(t.input)}</td><td>× ${state.factor}</td><td class="hello-result">${showOutput?tensorValue(t.output):'?'}</td></tr>`).join('')}</tbody></table></div>`;
  return `<div class="hello-blocks">${Array.from({length:state.blocks},(_,group)=>`<div class="hello-group"><h3>Block ${group}<small>${state.size} threads</small></h3><div class="hello-threads">${state.threads.filter(t=>t.block===group).map(t=>{
    const tag=interactive?'button':'div',status=t.invalid?'invalid':t.skipped?'skip':'';
    const value=t.invalid?'Invalid access':t.skipped?(stage===3?'Skipped':'No input'):tensorValue(stage===3?t.output:t.input);
    return `<${tag} class="hello-thread"${interactive?` type="button" data-thread="${t.i}" aria-pressed="${t.i===selected}" aria-label="Thread ${t.i}, block ${t.block}, position ${t.local}, ${escape(value)}"`:''}${status?` data-state="${status}"`:''}><span>Thread ${t.i}</span><strong>${escape(value)}</strong></${tag}>`;
  }).join('')}</div></div>`).join('')}</div>`;
}

export function renderIntroSections() {
 const first=simulateIntro(0,2),grouped=simulateIntro(2,2);
 return `<section class="hello-section hello-start" data-stage="0" id="idea-1" aria-labelledby="hello-title-0">
 <p class="eyebrow">01 · From PyTorch to threads</p><h2 id="hello-title-0">One input value per thread</h2>
 <p>Store five input values in a <strong>tensor</strong>—a collection of values. This PyTorch program doubles each value:</p>
 ${openingCode(pythonSource(),'hello-start-code')}
 <p class="hello-note">Multiplying this floating-point tensor by <code>2</code> keeps the results floating-point too.</p>
 ${browserNotice()}
 <p id="idea-2">To divide up the multiplication, imagine five executions of a small program. One reads <strong>1.0</strong>, multiplies it by 2 and writes <strong>2.0</strong>; another does the same for <strong>2.0</strong>.</p>
 ${definitions([['Thread','One execution of a GPU program.']])}
 <p>The GPU is built to run many threads at the same time. It schedules them in groups, so they do not necessarily all run at once. Here, we assign one input to each thread; PyTorch may divide the calculation among threads differently.</p>
 ${readerTask('Run, then select a thread row below to follow its input and output. Change the multiplier to inspect another calculation.','Inspect')}
 <div class="hello-launch-controls"><label for="hello-factor-0">Multiply each value by<input id="hello-factor-0" type="number" value="2" min="-10" max="10" step="any" inputmode="decimal"></label><button id="hello-run-0" type="button" class="primary" disabled>Run simulation</button></div>
 <div id="hello-map-0">${renderIntroMap(0,first,0,false)}</div>
 <p id="hello-output-0" class="hello-output" role="status">${introPrompt(0)}</p><p id="hello-index-0" class="hello-thread-detail" role="status">Thread 0 reads x[0] = 1.0. Run to reveal its output.</p>
 <noscript><details><summary>Compare the worked result</summary><p>Output: [${first.output.map(tensorValue).join(', ')}].</p></details></noscript>
 </section>
 <section class="hello-section" data-stage="2" id="idea-3" aria-labelledby="hello-title-2">
 <p class="eyebrow">02 · Thread groups</p><h2 id="hello-title-2">Group threads into blocks</h2>
 <p>We specify groups of threads when starting a GPU program. Each group is called a <strong>block</strong>. The GPU distributes the calculation a block at a time.</p>
 ${definitions([['Block','A group of threads. Threads in the same block can share data and wait for one another when their calculation needs it. Our multiplication does not need that cooperation.']])}
 <p>This worked example uses <strong>two blocks of four threads</strong>. That provides eight threads for five inputs. The grey tiles have no input, so those threads must skip the calculation.</p>
 <div class="hello-visual"><p class="hello-figure-title">Worked grouping · 5 inputs, 8 threads</p><p class="hello-note">Select a thread tile. Its block number and position determine its array index.</p>
 <div id="hello-map-2">${renderIntroMap(2,grouped,4)}</div>
 ${renderIndexRule()}<div id="hello-index-2" class="hello-index-panel" role="status">${renderIndexSubstitution(grouped.threads[4],grouped)}</div></div>
 <p id="hello-output-2" class="hello-note" role="status">Positions and array indices start at zero. An index identifies a position, rather than the value stored there.</p>
 ${renderSmExplanation()}
 </section>
 <section class="hello-section hello-launch-section" data-stage="4" id="idea-5" aria-labelledby="hello-title-4">
 <p class="eyebrow">03 · CUDA launch</p><h2 id="hello-title-4">Choose the number of blocks and threads</h2>
 ${renderCodeBridge(2,2)}${renderLaunchPractice()}
 </section>
 <section class="hello-section" data-stage="3" id="idea-4" aria-labelledby="hello-title-3">
 <p class="eyebrow">04 · Bounds check</p><h2 id="hello-title-3">Keep extra threads out of the arrays</h2>
 <p>Our two blocks of four create threads with indices 0–7, but the five inputs have indices 0–4. An extra thread must check its index before reading or writing.</p>
 ${definitions([['Bounds check','A check that an index refers to an element that exists before accessing it.']])}
 ${renderBoundsChallenge()}</section>`;
}

export function renderSmExplanation() {
 return `<div class="hello-sm" aria-labelledby="hello-sm-title"><h3 id="hello-sm-title">Where do these threads run?</h3>
 ${definitions([['Streaming multiprocessor (SM)','A part of the GPU containing hardware that executes instructions for threads.']])}
 <p>Each block stays on one SM. Several blocks can share an SM when resources allow. Threads share the SM’s arithmetic hardware; each thread does not own a separate arithmetic unit. They do not necessarily all execute at once.</p>
 <p class="hello-note">This diagram shows grouping, not hardware placement or execution order. <a id="hello-sm-explore" data-reading-link href="inside-sm.html?from=hello">Optional: follow one value inside an SM</a>.</p></div>`;
}
const choice=(id,label,options)=>`<label for="${id}">${label}<select id="${id}"><option value="">Choose…</option>${options.map(([value,text])=>`<option value="${value}">${text}</option>`).join('')}</select></label>`;
export function renderLaunchPractice() {
  return `<div class="hello-launch-practice" aria-labelledby="hello-launch-title">
    <h3 id="hello-launch-title">Predict a different grouping</h3>
    <p>Keep the same five inputs and multiply each by 2. This exercise starts with eight threads per block.</p><p class="hello-note">These small block sizes illustrate grouping, not recommended settings or GPU speed. Extra threads with no input skip the calculation.</p>
    ${readerTask('Change from four to eight threads per block. Predict the smallest block count, the location of the thread handling input[4], and whether the output values change.','Predict the regrouping')}
    <div class="hello-launch-controls">
      <label for="hello-launch-size">Threads per block<select id="hello-launch-size"><option value="8">8</option><option value="4">4</option></select></label>
      <label for="hello-launch-guess">Your block count<select id="hello-launch-guess"><option value="">Choose…</option><option>1</option><option>2</option><option>3</option></select></label>
      ${choice('hello-position-guess','Where is the thread handling input[4]?',[['0:4','Block 0, position 4'],['1:0','Block 1, position 0']])}
      ${choice('hello-values-guess','The five output values…',[['same','Stay the same'],['different','Change with the block size']])}
      <button type="button" class="primary" id="hello-launch-run" disabled>Check and run simulation</button>
    </div>

    <p id="hello-launch-feedback" role="status">Make your three predictions, then check.</p>
    <details><summary>Hint</summary><p>The array index is block number × threads per block + position in the block. Regrouping changes these coordinates; each valid index still doubles the same input.</p></details>
    <details><summary>Compare a worked explanation</summary><p>With eight threads per block, one block covers the five inputs. Input index 4 belongs to block 0, position 4. With four per block, it belongs to block 1, position 0. Both calculate 5.0 × 2 = 10.0.</p></details>
    <div id="hello-launch-answer" hidden>
      ${codePanel({id:'hello-launch-example',source:'',label:'CUDA C++ · launch for your settings'})}
      <button type="button" id="hello-launch-download">Download this launch as a CUDA program</button>
      <div id="hello-launch-map" aria-label="Thread grouping for the checked launch"></div>
      <p id="hello-launch-output"></p>
      <div id="hello-launch-index" class="hello-index-panel" role="status"></div>

    </div>
  </div>`;
}

export function renderBoundsChallenge() {
 return `<p>Here <code>i</code> is the array index and <code>n</code> is the input count, 5. The correct check permits only indices 0–4:</p>
 ${codePanel({id:'hello-bounds-code-3',source:boundsSource(2),label:'CUDA C++ · body excerpt from runKernel · correct check',explainedLocally:true})}
 <p>The braces enclose the statements controlled by <code>if</code>. Threads 5–7 skip both the read and the write.</p>
 <div class="hello-visual"><p class="hello-figure-title">Worked check · i &lt; 5</p>${renderIntroMap(3,inspectLaunch(5,4,2),null,true,false)}<p class="hello-note">Values are outputs. “Skipped” means no array access.</p></div>
 <h3>Investigate one changed character</h3>
 <p>Keep five inputs and two blocks of four threads. Someone changes the condition to <code>i &lt;= n</code>, allowing an index equal to the input count.</p>
 ${codePanel({id:'hello-diagnostic-code',source:'if (i <= n) {\n    output[i] = input[i] * 2.0f;\n}',label:'CUDA C++ · changed condition',explainedLocally:true})}
 ${readerTask('Which thread would access an element that does not exist? Predict, then inspect the affected thread.','Investigate')}
 <div class="hello-launch-controls">${choice('hello-bounds-guess','Thread with an invalid access',[['4','Thread 4'],['5','Thread 5'],['6','Threads 6 and 7'],['none','None']])}
 <button type="button" class="primary" id="hello-bounds-check" disabled>Check and inspect</button></div>
 <p id="hello-bounds-feedback" role="status">Choose a thread, then check.</p>
 <div id="hello-bounds-answer" hidden><div id="hello-map-3"></div><p id="hello-bounds-index" role="status"></p>
 <button id="hello-bounds-fix" type="button">Restore i &lt; n and inspect</button></div>
 <details><summary>Hint</summary><p>Five inputs have indices 0–4. Test indices 4, 5 and 6 against <code>i &lt;= 5</code>.</p></details>
 <details><summary>Compare a worked explanation</summary><p>Thread 5 passes <code>5 &lt;= 5</code>, but <code>input[5]</code> and <code>output[5]</code> do not exist. Threads 6 and 7 still fail the condition and skip. Restore <code>i &lt; n</code> to exclude index 5 too.</p></details>`;
}

export function renderIntroTransfer() {
  return `<section class="hello-section hello-section-end" id="hello-transfer"><p class="eyebrow">05 · Apply it</p><h2>Can every input get a result?</h2>
  <p>A new tensor has nine inputs, 1.0–9.0. Each thread doubles one input. Use four threads per block and the correct <code>i &lt; n</code> check, with <code>n = 9</code>.</p>
  ${readerTask('A launch uses only two blocks. Predict what happens, then choose the smallest block count that safely processes all nine inputs.','Investigate')}
  <div class="hello-launch-controls">
  ${choice('hello-coverage-guess','With two blocks…',[['all','All nine inputs get results'],['missing','An input gets no result'],['invalid','A thread accesses beyond the arrays']])}
  ${choice('hello-repair-blocks','Smallest sufficient block count',[['2','2'],['3','3'],['4','4']])}
  ${choice('hello-skip-guess','With that smallest launch, which indices skip?',[['none','None'],['8','8–11'],['9','9–11']])}
  <button type="button" class="primary" id="hello-transfer-run" disabled>Check and inspect</button></div>
  <p id="hello-transfer-result" role="status">Make your three predictions, then check.</p>
  <div id="hello-transfer-diagram" hidden></div>
  <details><summary>Hint</summary><p>Multiply blocks by threads per block to count executions. Indices start at zero. A bounds check can stop an access; it cannot launch another thread.</p></details>
  <details><summary>Compare a worked explanation</summary><p>Two blocks provide only eight threads: input index 8 has no thread. Three blocks provide twelve threads: indices 0–8 write results, while 9–11 skip the arrays. The guard prevents extra threads from accessing nonexistent elements.</p></details>
  <p><a href="kernel.html">Optional practice: repair a kernel →</a></p></section>`;
}
export function renderCodeBridge(stage,factor) {
 if(stage!==2)return '';
 return `<div class="hello-code-bridge" aria-labelledby="hello-title-4">
 <p>Where did “two blocks of four” come from? In CUDA C++, we choose those settings when starting a GPU function.</p>
 ${definitions([['Launch','A request to start a GPU function with a chosen number of blocks and threads per block.'],['Kernel','A GPU function executed by the threads in a launch.']])}
 <p><code>runKernel</code> is our chosen name for the kernel that doubles the inputs. This launch creates the grouping in the worked diagram:</p>
 ${codePanel({id:'hello-bridge-launch-2',source:launchSource(),label:'CUDA C++ · launch from the CPU program',explainedLocally:true})}
 <div class="code-explanations hello-launch-explanations"><p class="code-explanation-heading">What each part does</p><ul>
 <li><code>int threadsPerBlock = 4;</code> — Sets four threads per block; <code>int</code> declares an integer variable.</li>
 <li><code>int blocks = 2;</code> — Requests two blocks: eight threads in total.</li>
 <li><code>runKernel&lt;&lt;&lt;blocks, threadsPerBlock&gt;&gt;&gt;</code> — Starts our kernel with those settings.</li>
 <li><code>d_input, d_output</code> — Refer to arrays already in GPU memory; <code>5</code> is the input count.</li></ul></div>
 <details id="hello-bridge-complete-2"><summary>Complete CUDA kernel for this example</summary>
 <p>Each thread calculates its index, checks whether an input exists, then doubles it. The next section explains that check.</p>
 ${codePanel({id:'hello-full-4',source:kernelSource(factor),label:'CUDA C++ · complete GPU function'})}
 <button type="button" id="hello-bridge-download-2">Download complete CUDA program</button> <a href="desktop.html#first-cuda">Desktop setup</a></details>
 <p class="hello-note"><strong>What PyTorch handles:</strong> <code>y = x * 2</code> describes the calculation. PyTorch chooses its kernel and launch settings; this expression does not let you set their block or thread counts directly. Layout, data type and other choices can still affect performance. Our CUDA program is a separate implementation, not PyTorch’s generated source.</p></div>`;
}
export function renderIndexRule() {
 return `<div class="hello-index-rule" aria-labelledby="hello-index-rule-title"><h3 id="hello-index-rule-title">Array index rule</h3><p class="hello-index-equation">index = <span class="hello-term-block">block number</span> × <span class="hello-term-size">threads per block</span> + <span class="hello-term-position">position in block</span></p></div>`;
}
export function renderIndexSubstitution(thread,state) {
 const equation=`index = ${thread.block} × ${state.size} + ${thread.local} = ${thread.i}`;
 return `<h3>Selected thread ${thread.i} · Block ${thread.block}, position ${thread.local}</h3>
 <p class="hello-index-equation" aria-label="${equation}">index = <span class="hello-term-block">${thread.block}</span> × <span class="hello-term-size">${state.size}</span> + <span class="hello-term-position">${thread.local}</span> = <strong>${thread.i}</strong></p>
 <p>${thread.skipped?`No <code>input[${thread.i}]</code> exists. This thread skips the calculation.`:`Index ${thread.i} selects <code>input[${thread.i}] = ${tensorValue(thread.input)}</code>. Doubling it writes <code>output[${thread.i}] = ${tensorValue(thread.output)}</code>.`}</p>`;
}
