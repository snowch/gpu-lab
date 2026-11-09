// Copyright © 2026 Christopher Snow.
import {codePanel,definitions,readerTask} from '../src/chapter-view.mjs';
const shell=(id,source)=>codePanel({id,source,language:'shell',label:'Terminal · shell commands'});
export function renderProfiling(source) {
  // Assemble a standalone capture program from the download's imports and shared code.
  const imports=source.slice(source.indexOf('import torch\n'),source.indexOf('\nparser =')).trimEnd();
  const setup=source.slice(source.indexOf('print("PyTorch:"'),source.indexOf('\nif args.external:')).trimEnd();
  const capture=source.slice(source.indexOf('    activities ='),source.indexOf('\n    print("Saved trace.json")')).split('\n').map(line=>line.slice(4)).join('\n');
  const check=source.slice(source.indexOf('torch.testing.assert_close')).trimEnd();
  return `<section class="book-section"><h2>See the launch behind a multiplication</h2>
  <p>Chapter 1 uses <code>y = x * 2</code> to explain threads and blocks. PyTorch chooses the implementation for that expression. A <strong>profiler</strong> records the CPU calls and GPU activity from a real run, so you can inspect which kernels were launched and how their threads were grouped.</p>
  <p>Reading this appendix needs no installation. <strong>Capturing a CUDA trace requires an NVIDIA GPU, a compatible driver and CUDA-enabled PyTorch with CUDA profiling support.</strong> Follow the <a href="desktop.html#pytorch">PyTorch desktop setup</a> first. The browser simulations and our GPGPU-Sim functional checks cannot capture PyTorch’s actual GPU launches.</p>
  ${definitions([['Trace','A record of events from one run, including their names and times. A timeline viewer draws these events along a time axis.'],['Grid dimensions','The numbers of thread blocks along the launch’s x, y and z axes.'],['Block dimensions','The numbers of threads along a block’s x, y and z axes.']])}
  <p>Start with a timeline, then inspect a kernel’s launch details. These describe the implementation selected for <em>that run</em>; they are not settings guaranteed by the PyTorch API.</p></section>

  <section class="book-section" id="capture"><h2>1. Capture one PyTorch operation</h2>
  <p><a href="../examples/profile-pytorch.py" download>Download profile-pytorch.py</a>. It keeps the chapter’s multiplication and uses 4,096 FP32 input values to give PyTorch a larger array. The program checks CUDA availability, prints the PyTorch version and GPU name, and runs five warm-up multiplications before recording one more.</p>
  <p>You can copy this complete capture example into a Python file. It shares its imports, calculation, capture and output check with the download; the download also checks the CUDA setup and provides a mode for external profiling tools.</p>
  ${codePanel({id:'profiling-capture',source:[imports,setup,capture,check].join('\n\n'),language:'pytorch',label:'PyTorch · complete capture example'})}
  <p>In a terminal in the download folder, run:</p>${shell('profiling-run','python profile-pytorch.py')}
  <p>The program writes <code>trace.json</code> and checks the multiplication result. Allocation and warm-up are outside the recorded interval; synchronisation inside it waits for the captured GPU operation to finish. The range also includes CPU overhead and that wait, so its duration is not the kernel’s execution time.</p>
  <p>This is an inspection example, not a benchmark. We have checked the trace-reader logic and Python syntax; this capture program has not yet been validated on an NVIDIA GPU.</p></section>

  <section class="book-section" id="timeline"><h2>2. Open the timeline</h2>
  <p>Open the <a href="https://ui.perfetto.dev/" target="_blank" rel="noopener noreferrer">Perfetto trace viewer (new tab)</a> and choose <strong>Open trace file</strong> to load your <code>trace.json</code>.</p>
  <p>The viewer draws CPU calls and GPU kernels on separate <strong>tracks</strong> (timeline rows). Our named <strong>CPU range</strong>, <code>gpu_lab_multiply</code>, encloses the multiplication call and its wait. A kernel’s <strong>correlation ID</strong> links it to the CPU-side CUDA call that launched it.</p>
  ${readerTask('Find the CPU range named gpu_lab_multiply. Expand the CPU and GPU tracks, then select a GPU kernel event. Inspect its name, duration and arguments.','Inspect your run')}
  <p>The CPU-side CUDA launch and GPU kernel are separate events; use the viewer’s event links or matching correlation IDs where available to connect them. GPU work can begin after its CPU launch call returns. Do not assign a kernel to an operator solely because the timeline boxes overlap.</p>
  <p>Look in a kernel event’s arguments for <code>grid</code> and <code>block</code>. PyTorch’s Kineto trace exporter can include these fields. Field availability and presentation vary with PyTorch, CUDA profiling support and the viewer. <code>key_averages().table()</code> aggregates operator statistics; use the exported trace to inspect individual launches.</p>
  <p>One PyTorch operation may launch several kernels. Conversely, <code>torch.compile</code> can combine operations or select a different implementation. The number of Python expressions is not a kernel count.</p></section>

  <section class="book-section" id="dimensions"><h2>3. Read grid and block dimensions</h2>
  <p><a href="../examples/inspect-pytorch-trace.py" download>Download inspect-pytorch-trace.py</a> beside the trace. This reader needs only Python’s standard library, so you can also inspect a trace copied from another machine without installing PyTorch.</p>
  ${shell('profiling-inspect','python inspect-pytorch-trace.py trace.json')}
  <p>It lists every <code>kernel</code> event (also accepting <code>Kernel</code>), its name, grid, block and correlation ID. It does not infer which CPU operator owns an event. Missing or unrecognised dimensions are reported as <strong>unavailable</strong>. No kernel events can mean CUDA activity was not captured; it is not proof that no GPU work ran.</p>
  ${codePanel({id:'profiling-dimensions',source:'grid: [2, 1, 1]\nblock: [4, 1, 1]',language:'text',label:'Illustration · chapter 1’s handwritten launch, not measured PyTorch output'})}
  <ul><li><code>grid: [2, 1, 1]</code> means 2 × 1 × 1 = <strong>2 blocks</strong>.</li><li><code>block: [4, 1, 1]</code> means 4 × 1 × 1 = <strong>4 threads per block</strong>.</li><li>Together they describe <strong>8 launched threads</strong>. A bounds check can make extra threads skip array accesses.</li></ul>
  <p>Use the dimensions from <em>your</em> trace to do the same calculation. PyTorch need not choose the book’s small launch. Dimensions alone do not reveal which streaming multiprocessor (SM) runs each block, whether threads execute at once, or how fast the calculation is. The <a href="scheduling.html">scheduling chapter</a> explains how an SM holds and schedules groups of threads.</p>
  ${readerTask('For a new case, interpret grid [3, 2, 1] and block [8, 4, 1]. How many blocks, threads per block and launched threads does that describe?','Check your interpretation')}
  <details><summary>Compare your answer</summary><p>There are 6 blocks, 32 threads per block and 192 launched threads. These counts do not establish how many useful array elements are processed or how much parallel execution occurs.</p></details></section>

  <section class="book-section" id="nsight"><h2>Optional: inspect with NVIDIA Nsight</h2>
  <p><strong>Nsight Systems</strong> shows CPU calls, transfers and GPU kernels on a timeline. <strong>Nsight Compute</strong> inspects individual kernels and their hardware metrics. Both need a supported NVIDIA setup and separate installation; Compute may also need permission to access GPU performance counters. Use the Nsight Systems and Nsight Compute links in References for installation and command options on your platform.</p>
  <p>The download’s <code>--external</code> mode runs the same setup and multiplication without starting the PyTorch profiler. It marks the target multiplication with an <strong>NVTX range</strong>: a named annotation that NVIDIA’s tools can recognise.</p>
  <h3>Nsight Systems: follow the timeline</h3>
  ${shell('profiling-nsys','nsys profile -t cuda,nvtx -o multiply \\\n  python profile-pytorch.py --external\nnsys stats --report cuda_gpu_trace multiply.nsys-rep')}
  <p>Open <code>multiply.nsys-rep</code> in the Nsight Systems application and find <code>gpu_lab_multiply</code>. The statistics report lists kernels and memory operations; kernel rows include <code>GrdX/Y/Z</code> and <code>BlkX/Y/Z</code> launch dimensions in current versions. This whole-process capture also contains allocation, warm-up and result checking. Use the named range and correlation information to identify the target.</p>
  <h3>Nsight Compute: inspect one marked operation</h3>
  ${shell('profiling-ncu','ncu --nvtx --nvtx-include "gpu_lab_multiply/" \\\n  --section LaunchStats --section Occupancy \\\n  python profile-pytorch.py --external')}
  <p>The NVTX filter selects kernels launched inside the named range; the trailing <code>/</code> identifies a push/pop range. Launch Statistics reports launch configuration and register use. The <a href="scheduling.html">scheduling chapter introduces registers, warps and residency</a>, which prepare you to interpret the Occupancy section. Occupancy compares resident warps with the SM’s maximum; theoretical occupancy describes what resources permit, while achieved occupancy describes activity during a measurement. It is not a speed score. For CSV output, add <code>--csv --page raw</code>. For a different workload, use the documented kernel-name and launch filters after identifying its target.</p>
  <p>Profiler collection adds overhead, and Compute may replay kernels to gather metrics. Do not compare these runs’ wall-clock durations as application benchmarks. Use separate runs for PyTorch profiling and Nsight. Record your tool versions, GPU, input shape and dtype with any conclusion.</p></section>

  <section class="book-section"><h2>If the trace is missing GPU details</h2>
  <ul><li><strong>CUDA is unavailable:</strong> check the NVIDIA driver and CUDA-enabled PyTorch installation. A CPU-only installation can check values, but cannot record GPU launches.</li><li><strong>The trace has CPU events only:</strong> check CUDA profiler support, warnings about CUPTI (NVIDIA’s profiling interface), and whether the capture interval includes the operation. Some setups can report CUDA time in summaries without exporting GPU events.</li><li><strong>A kernel lacks grid or block fields:</strong> inspect the original event arguments and tool versions. Try Nsight Systems on supported hardware. Do not substitute the teaching diagram’s dimensions.</li><li><strong>A command or report differs:</strong> use the official guide matching the installed tool version.</li></ul>
  <p>Return to <a href="hello.html#idea-5">chapter 1’s complete kernel and launch</a>, or use <a href="putting-it-together.html#where-next">the final chapter’s next steps</a> to investigate a workload of your own.</p></section>`;
}
