// Copyright © 2026 Christopher Snow.
export function renderSmValues(){return `<section class="vsm-workbench" aria-label="Inspect the values and hardware">
 <div class="vsm-toolbar">
  <div class="vsm-controls">
   <fieldset><legend>Inspect a thread</legend><div class="vsm-thread-choices"><label class="vsm-choice"><input type="radio" name="vsm-thread" id="vsm-thread-0" value="0" checked>Thread 0 · input 1.0</label><label class="vsm-choice"><input type="radio" name="vsm-thread" id="vsm-thread-1" value="1">Thread 1 · input 2.0</label></div></fieldset>

  </div>
  <ol class="vsm-progress" aria-label="Actions inspected for the selected thread"><li id="vsm-progress-1">1. Load</li><li id="vsm-progress-2">2. Multiply</li><li id="vsm-progress-3">3. Write</li></ol>
  <p class="vsm-hint">Selection changes the values you inspect, rather than choosing the GPU’s execution order.</p>
 </div>
 <div class="vsm-status" id="vsm-status" role="status" aria-live="polite">Start with Thread 0. Load its input into a register.</div>
 <figure class="vsm-hardware" aria-labelledby="vsm-diagram-caption">
  <div class="vsm-memory" id="vsm-memory"><h3>GPU memory</h3><p class="vsm-scope">Two values from the doubling example</p><div class="vsm-memory-columns"><div><p class="vsm-memory-label">Inputs</p><div class="vsm-memory-list"><div class="vsm-memory-value" id="vsm-input-0"><span>input[0]</span><strong>1.0</strong></div><div class="vsm-memory-value" id="vsm-input-1"><span>input[1]</span><strong>2.0</strong></div></div></div><div><p class="vsm-memory-label">Outputs inspected</p><div class="vsm-memory-list"><div class="vsm-memory-value" id="vsm-output-cell-0"><span>output[0]</span><strong id="vsm-output-0">?</strong></div><div class="vsm-memory-value" id="vsm-output-cell-1"><span>output[1]</span><strong id="vsm-output-1">?</strong></div></div></div></div></div>
  <div class="vsm-memory-link" id="vsm-memory-path"><b aria-hidden="true">↔</b><span id="vsm-memory-path-label">Memory reads / writes</span></div>
  <div class="vsm-sm">
   <div class="vsm-sm-heading"><h3>Inside one SM</h3><p>Shared hardware · separate working values</p></div>
   <div class="vsm-node" id="vsm-load-store"><h4>Load/store hardware</h4><p>Requests memory reads and writes, connecting GPU memory with registers.</p><div class="vsm-values" id="vsm-load-store-values">Waiting for an action to inspect.</div>
   <p class="vsm-related"><a href="https://snowch.github.io/assembly-lab/#/lesson/memory-and-addresses" target="_blank" rel="noopener noreferrer">Assembly Lab: loads and stores (new tab)</a><small>Arm CPU instructions; the memory-to-register idea also helps here.</small></p></div><div class="vsm-connector" id="vsm-register-path"><b aria-hidden="true">↕</b><span id="vsm-register-path-label">Values between memory instructions and registers</span></div>
   <div class="vsm-execution">
    <div class="vsm-node" id="vsm-registers"><h4>Registers</h4><p>Small, fast storage for each thread’s working values.</p><div class="vsm-table-wrap"><table aria-label="Working values inspected for each thread"><thead><tr><th scope="col">Thread</th><th scope="col">Loaded value</th><th scope="col">Result</th></tr></thead><tbody><tr id="vsm-register-row-0"><th scope="row">Thread 0</th><td id="vsm-loaded-0"><span class="vsm-unknown">—</span></td><td id="vsm-result-0"><span class="vsm-unknown">—</span></td></tr><tr id="vsm-register-row-1"><th scope="row">Thread 1</th><td id="vsm-loaded-1"><span class="vsm-unknown">—</span></td><td id="vsm-result-1"><span class="vsm-unknown">—</span></td></tr></tbody></table></div><div class="vsm-node-note">The rows distinguish the threads’ working values.</div><p class="vsm-related"><a href="https://snowch.github.io/assembly-lab/#/lesson/one-addition" target="_blank" rel="noopener noreferrer">Assembly Lab: registers (new tab)</a><small>Arm CPU instructions; this is a related example, not GPU code.</small></p></div>
    <div class="vsm-connector" id="vsm-arithmetic-path"><b aria-hidden="true">↔</b><span>Input<br>Result</span></div>
    <div class="vsm-node" id="vsm-arithmetic-unit"><h4>Floating-point arithmetic units</h4><p>Multiply register values. Results return to registers.</p><div class="vsm-calculation" id="vsm-calculation"><small>No multiplication inspected yet.</small><span>× 2</span></div><p class="vsm-same-hardware">Both threads use this shared hardware.</p><p class="vsm-related"><a href="https://snowch.github.io/bit-lab/#/lesson/alu" target="_blank" rel="noopener noreferrer">Bit Lab: the ALU (new tab)</a><small>A four-bit integer ALU; it does not model this GPU floating-point multiplication.</small></p></div>
   </div>
  </div>
  <figcaption class="vsm-caption" id="vsm-diagram-caption">The arrows trace values, not threads moving through a machine. The rows name working values; a compiler may reuse registers. This illustrates hardware roles and data flow, without specifying execution order, unit counts or timings.</figcaption>
 </figure>
<div class="vsm-actionbar"><div class="vsm-actioncontext" id="vsm-action-context">Inspecting Thread 0</div><div class="vsm-actions"><button class="primary vsm-primary" id="vsm-next" type="button" disabled>Load input</button><button id="vsm-reset" type="button" disabled>Reset view</button></div></div>
</section>
<section class="vsm-takeaway" aria-labelledby="vsm-takeaway-title"><h3 id="vsm-takeaway-title">What to notice</h3><p id="vsm-takeaway">A value must be loaded into a working register before the multiplication can use it.</p></section>
<details><summary>Where is the result before it is written?</summary><p>After the multiply, the result is in the thread’s working registers. The store writes it to the output array in GPU memory. The arithmetic hardware is shared across threads; the working values remain separate.</p></details>
<noscript><p>Enable JavaScript to inspect each action. The hardware roles and answer comparison remain readable. Worked example: Thread 0 loads 1.0 into a register, multiplies it by 2 to produce 2.0 in a register, then stores 2.0 in output[0]. Thread 1 uses the same kinds of hardware with 2.0 to produce 4.0.</p></noscript>`;}
