// Copyright © 2026 Christopher Snow.
import {definitions,readerTask} from '../src/chapter-view.mjs';
import {smFrame,smEvents} from '../src/sm-hardware-model.mjs';
import {renderSmHardware,renderSmEvent} from '../src/sm-hardware-view.mjs';
export function renderInsideSm(){
  return `<p class="sm-return"><a id="sm-return" data-reading-return data-reading-link href="hello.html#hello-sm-title">Return to Chapter 1</a> · <a href="scheduling.html#scheduling-wait">Chapter 6: scheduling</a></p>
  <section class="book-section"><h2>Threads share execution hardware</h2>
  <p>A thread is an execution of a program, with its own working values. A streaming multiprocessor (SM) supplies the hardware that executes those instructions. A thread does not have a permanently assigned arithmetic unit.</p>
  <p>This optional appendix follows a doubling operation through the hardware. No installation or GPU is required. Chapter 1’s small launch remains a teaching example; this view does not reveal PyTorch’s chosen kernel or launch.</p>
  ${definitions([['Warp','A group of 32 threads within a block on NVIDIA GPUs. An SM selects ready instructions from warps.'],['Registers','Fast working storage on the SM, allocated separately for individual threads.'],['Arithmetic execution units','Hardware that performs arithmetic on register values. An SM has multiple execution units; different instructions use different hardware.'],['Load/store units','SM hardware that issues memory reads and writes for the threads.'],['Scheduler','The hardware that selects a ready warp instruction to start. An instruction is ready when the values it needs are available.']])}
  </section>
  <section class="book-section" id="sm-explorer"><h2>Follow two warps through the same hardware</h2>
  <p><strong>Worked example:</strong> one block of 64 threads doubles 64 FP32 input values, 1.0–64.0. Warp A contains threads 0–31; Warp B contains threads 32–63. Each thread handles one input. The diagram shows the first two values from each warp; both warps contain 32 threads.</p>
  <p>The event order is chosen to make dependencies visible: B can wait for a load while A multiplies; B later reuses the arithmetic hardware. Events have no duration. Loaded and result rows name working values; a compiler may reuse registers. Cache behaviour, memory-completion timings, instruction throughput and hardware resource limits are outside this illustration.</p>
  <p>The arithmetic box represents floating-point execution hardware for FP32 multiplication. ALU means arithmetic logic unit; an SM has several kinds of execution hardware for different instructions. This diagram does not specify their counts or reproduce a compiler instruction trace.</p>
  ${readerTask('Step through the loads, multiplies and stores. Watch which values are in each warp’s registers, and which warp uses the shared arithmetic units.','Inspect the hardware')}
  <div class="sm-explorer-controls"><button type="button" id="sm-previous" disabled>Previous event</button><button type="button" class="primary" id="sm-next" disabled>Next event</button><button type="button" id="sm-reset" disabled>Restart walkthrough</button><output id="sm-position">Before the loads</output></div>
  <div id="sm-event" class="sm-event" role="status">${renderSmEvent(smFrame())}</div>
  <div id="sm-diagram">${renderSmHardware(smFrame())}</div>
  <noscript><p>Enable JavaScript to step through the diagram, or read the worked sequence below.</p><details><summary>Read every worked event</summary>${smEvents.map((_,i)=>`<section>${renderSmEvent(smFrame(i))}</section>`).join('')}<p>The final output is ${smFrame(8).warps.map(w=>w.output.slice(0,2).map(v=>v.toFixed(1)).join(', ')+' …').join(' and ')}.</p></details></noscript>
  </section>
  <section class="book-section"><h2>What the shared hardware means</h2><p>A’s register values remain separate from B’s, while the arithmetic units are reused. A waiting load does not reserve an arithmetic unit for that thread. Another ready warp may have an instruction that can use available hardware. Actual overlap and throughput depend on the GPU and its resources.</p>
  ${readerTask('Suppose B is waiting for input and A’s multiply has ready operands. Must the arithmetic units wait for B? Explain which storage belongs to the threads and which execution hardware they share.','Apply the distinction')}
  <details><summary>Compare your answer</summary><p>A’s ready multiply can use available arithmetic hardware while B waits. Each thread has its own register values, while execution units are shared. This does not guarantee that every ready instruction can start immediately, or establish a cycle count.</p></details>
  <p>Continue with <a href="scheduling.html">Chapter 6’s ready and waiting warp experiment</a>, which uses an explicit teaching scheduler rather than hardware timing.</p></section>`;
}
