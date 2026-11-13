import {recordingLink} from '../src/recording-view.mjs';
// Copyright © 2026 Christopher Snow.
import {openingCode,codePanel,definitions,readerTask} from '../src/chapter-view.mjs';
import {deviceOpening} from '../src/book-code.mjs';
import {table} from '../src/continuation-ui.mjs';

// Excerpts come from the runnable download, so edits have one source of truth.
export function launchExcerpt(source,name) {
  const text=source.split(`// BEGIN ${name}\n`)[1]?.split(`// END ${name}`)[0];
  if(text===undefined)throw new Error('Missing launch excerpt: '+name);
  const lines=text.trimEnd().split('\n');
  const indent=Math.min(...lines.filter(line=>line.trim()).map(line=>line.match(/^ */)[0].length));
  return lines.map(line=>line.slice(indent)).join('\n');
}
export function renderLaunchFromInput(source) {
  const code=(name,label)=>codePanel({id:'launch-'+name.toLowerCase(),source:launchExcerpt(source,name),label:'CUDA C++ · '+label});
  return `<section class="book-start"><h2>Turn the input length into a launch</h2>
<p>Chapter 2 followed the values through CPU and GPU storage. Now use the same doubling calculation to connect the input array to the storage and launch settings supplied by a CPU program.</p>
${openingCode(deviceOpening)}
<p>PyTorch handles allocation and kernel launches for these tensor operations. In our own CUDA C++ program, we supply those steps. The code below illustrates the same result; PyTorch does not call our <code>runKernel</code> function.</p>
<p class="chapter-browser-note">No installation or GPU is required to read the worked example and complete the exercises here. This page does not execute CUDA. The complete program is available for optional local execution.</p>
<p>By the end, given a different input length, you should be able to choose matching output storage, calculate enough blocks and pass the correct element count to the kernel.</p></section>

<section class="book-section" id="input-count"><h2>1. Count the existing input values</h2>
<p>Start with five values in CPU memory. A C++ <code>std::vector</code> is a resizable array that keeps track of its length. Unlike a pointer, it can report that length.</p>
${code('INPUT','CPU input array')}
<p>The <code>input</code> name belongs to the CPU array here. Later, the kernel’s separate parameter named <code>input</code> will receive the address of the GPU copy.</p>
<p>This kernel produces one output for each input, so the CPU program uses the input length to size both arrays. It does not need an output array to discover that count.</p>
${definitions([['Element count','The number of values in an array. It is separate from the values themselves, the last index, and the storage size in bytes.']])}
${code('SIZES','CPU counts and result storage')}
<p>Here <code>n = 5</code>, the CPU output has five positions and <code>bytes = 20</code>. The first index is 0 and the last is 4. Each <code>float</code> takes four bytes in this CUDA example.</p></section>

<section class="book-section" id="input-copy"><h2>2. Allocate GPU storage and copy the inputs</h2>
<p>The CPU vectors do not allocate GPU memory. Request two separate GPU allocations, then copy the five input values into one of them.</p>
${definitions([['Device pointer','A variable holding the address of data in GPU memory. Its name and type do not record an array length.']])}
<p><code>CUDA_CHECK</code> is a helper defined in the complete program: it checks a CUDA call’s result and stops with an error message if the call fails. It is a name chosen for this example.</p>
${code('COPY_IN','GPU allocation and CPU-to-GPU copy')}
<p>Each GPU allocation holds 20 bytes. Together they hold 40 bytes of values; the input copy transfers 20 bytes. The output allocation has no calculated results yet. The kernel will write every valid output position, so no initial CPU output copy is needed.</p></section>

<section class="book-section" id="input-launch"><h2>3. Derive the block count and pass n</h2>
<p>Choose four threads per block for this small example. The element count comes from the data; the block size is a separate choice.</p>
${code('BLOCK_SIZE','chosen block size')}
<p>C++ integer division discards the remainder. Adding one less than the block size before dividing rounds the required block count up: <code>(5 + 4 - 1) / 4 = 2</code>.</p>
${code('LAUNCH','CPU launch for the existing input')}
<p>Two blocks launch eight threads, but the argument <code>n</code> remains 5. It tells each thread how many array elements are valid. Changing the block size changes the grouping, while the count still comes from <code>input.size()</code>.</p>
<details><summary>Revisit Chapter 1’s doubling kernel</summary>${code('KERNEL','complete doubling kernel from Chapter 1')}</details>
<p>Indices 0–4 read inputs and write outputs. Indices 5–7 fail <code>i &lt; n</code> and skip both array accesses. The guard trusts the supplied count; the CPU program must keep it consistent with the allocated storage.</p></section>

<section class="book-section" id="input-result"><h2>4. Copy the results into the CPU output</h2>
<p>The launch queues GPU work. To read its result on the CPU, copy the GPU output into the already-sized CPU vector.</p>
${code('COPY_OUT','GPU-to-CPU result copy')}
<p>In this program, this blocking device-to-host copy waits for the preceding kernel and returns with the CPU result available: <code>[2.0, 4.0, 6.0, 8.0, 10.0]</code>. Allocating output storage alone would not copy the result.</p>
<h3>Release the GPU allocations after the copy</h3>${code('FREE','CPU cleanup after result read-back')}<p><code>cudaFree</code> releases the GPU input and output storage. The CPU result remains in <code>output</code>. C++ releases the CPU vectors when they leave their scope at the end of the program.</p>
<details><summary>Read the complete CUDA program</summary><p>The surrounding program supplies headers, error checking, empty-input and size checks, output verification and cleanup. Its tiny four-thread blocks are for tracing, rather than a performance recommendation.</p>${codePanel({id:'launch-complete',source,label:'CUDA C++ · complete program',explainedLocally:true})}</details>
<p><a href="../examples/launch-from-input.cu" download>Download the complete CUDA program</a>. Installation and execution commands are in the <a href="desktop.html#first-cuda">desktop setup appendix</a>.</p></section>

<section class="book-section" id="new-input"><h2>5. Plan a launch for new input data</h2>
<p>Replace only the CPU input values with these entries. Keep four threads per block and the same sizing and launch expressions.</p>
<pre class="book-code" data-code-question><code>std::vector&lt;float&gt; input = {
    1.0f, 2.0f, 3.0f, 4.0f, 5.0f,
    -1.0f, 0.0f, 0.5f, 12.0f
};</code></pre>
${readerTask('Before opening the comparison, write down n, the number of CPU output elements, bytes in each GPU allocation, the block count and the launched thread count. Which indices write results, and which skip the arrays? Does the final value 12.0 determine n?','Plan the new case')}
<details id="launch-comparison"><summary>Compare your launch plan</summary>
${table(['Quantity','New case'],[['n and CPU output elements','9 each'],['Bytes in each GPU allocation','9 × 4 = 36 bytes'],['Blocks','(9 + 4 − 1) / 4 = 3'],['Launched threads','3 × 4 = 12'],['Indices that write','0–8'],['Indices that skip','9–11']]).replace('class="continuation-table"','class="hello-table-wrap"')}
<p>The count is 9 because there are nine entries. The final data value, 12.0, is neither the count nor the last index. The unchanged <code>input.size()</code> expressions produce the new sizes automatically.</p>
<p>Expected output: <code>[2.0, 4.0, 6.0, 8.0, 10.0, -2.0, 0.0, 1.0, 24.0]</code>. Changing 12.0 to 20.0 would change only its result to 40.0; the sizes and launch settings would stay the same.</p>
<p>If you left <code>n</code> hard-coded to 5, extra blocks alone would not fix the result: the guard would still prevent indices 5–8 from writing. This is why the CPU derives the count from the actual data.</p></details>
<p>The equal input and output counts belong to this elementwise calculation. Summing all inputs into one total needs only one output; selecting a subset can also change the output count. Derive counts and storage from what the calculation reads and writes.</p>
<p>Want to diagnose indexing mistakes next? Try <a href="kernel.html">Repair a kernel</a>. You can also return to <a href="devices.html#device-2">Chapter 2’s result copy</a> or continue to Chapter 4’s tensor selections.</p></section>`+recordingLink('launch-from-input','derive CUDA storage and launches from the inputs');
}
