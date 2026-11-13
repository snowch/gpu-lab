// Copyright © 2026 Christopher Snow.
import {codePanel,definitions} from './chapter-view.mjs';
import {courseKernels,scaleLaunch,timingSource,wmmaKernel} from './course-cuda-source.mjs';

const program='../examples/desktop/course-bridges.cu';
const panel=(id,source,label)=>codePanel({id:'cuda-'+id,source,label:'CUDA C++ · '+label});
const complete=(key)=>`<details><summary>Read the complete GPU function</summary>${panel(key+'-complete',courseKernels[key],'complete reference function')}</details>`;
const download='<p><a href="'+program+'" download>Download the complete CUDA reference program</a>. Its CPU code supplies allocations, copies, launches and cleanup using Chapter 3’s workflow. These small examples check values; they do not benchmark GPU performance.</p>';
const wrap=(key,title,body)=>`<div class="chapter-cuda-bridge" id="cuda-${key}-connection"><h3>${title}</h3>${body}${download}</div>`;

export function renderSelectionCuda(){return `<section class="book-section" id="selection-cuda"><h2>Choose the same coordinates in CUDA C++</h2>
<p>A CUDA function can use a two-dimensional array’s row and column coordinates too. This fixed example receives a 5 × 5 FP32 GPU array and space for five output values. The CPU chooses a valid row or column number, from 0 to 4, and launches one block of eight threads. The guard permits only five of them to access the arrays.</p>
${panel('row',courseKernels.row,'fixed 5 × 5 input · chosen row')}
${panel('column',courseKernels.column,'fixed 5 × 5 input · chosen column')}
<p>For a row, the CPU-supplied <code>row</code> stays fixed while threads choose columns. For a column, <code>column</code> stays fixed while threads choose rows. Both produce five doubled values, just as the PyTorch selections do. These are separate manual implementations; PyTorch chooses its own kernels.</p>${download}</section>`;}

export function renderLayoutCuda(){return `<section class="book-section" id="layout-cuda"><h2>Represent a view, then make a packed copy in CUDA C++</h2>
<p>A raw CUDA pointer has no tensor shape or stride metadata. The CPU supplies those choices explicitly. Our original 5 × 5 row-major array has 25 FP32 values. A column selection has <code>n = 5</code> selected values, a stride of 5 elements and an offset equal to the column number. A row has stride 1 and offset equal to the row number times 5.</p>
<p>Keeping the original pointer plus these counts describes the selection without copying it. To pack it, the CPU allocates five new FP32 positions and launches the following function with one block of eight threads:</p>
${panel('pack',courseKernels.pack,'copy selected values into packed GPU storage')}
<p><code>n</code> counts selected outputs, rather than all 25 original inputs. The CPU must ensure <code>offset + (n - 1) * stride</code> stays inside the input allocation. The guard protects output positions; it cannot validate an incorrect stride or offset. This function copies values without doubling them. A later multiplication can read the packed array.</p>${download}</section>`;}

export function renderRequestsCuda(){return `<section class="book-section" id="requests-cuda"><h2>Connect a thread’s read to CUDA C++</h2>
<p>Use the original 25-value GPU array and a five-value output. The CPU supplies <code>n = 5</code>, the selected row or column’s element stride and starting offset. Launch one block of 32 threads: five participating threads occupy the first five positions of one warp, and the others skip the arrays.</p>
${panel('requests',courseKernels.requests,'five selected inputs · one partially filled warp')}
<p>The input expression generates the addresses counted in the sector model. <code>stride = 1</code> selects neighbouring elements; <code>stride = 5</code> selects a column. The CPU must allocate enough input storage for the largest selected address. The browser counts sectors for this input read only; the source also writes outputs. Neither the expression nor the browser count specifies cache hits, physical DRAM reads or GPU time.</p>${download}</section>`;}

const bridges={
'scheduling-ready':()=>wrap('scheduling','Connect the calculation to CUDA launches',`
<p>The CPU can request the two multiplications, but it does not choose which resident warp issues next. Here <code>scale</code> is the familiar guarded doubling kernel. The CPU derives <code>n</code> from the input and allocates three GPU buffers of <code>n</code> FP32 values: input, intermediate and output. The block count covers those <code>n</code> values, as in Chapter 3.</p>
${panel('scheduling',scaleLaunch,'two ordered launches from the CPU')}
<p>These calls use the same default CUDA queue, so the second calculation waits for the first calculation’s intermediate values. Within each kernel, hardware chooses ready warp instructions. The browser’s resident-warp count and toy cycles are model settings, not launch arguments. Its repeated LD → MUL → ST sequence illustrates dependencies; it is not compiler output from these calls.</p>
${complete('scale')}`),
'divergence-mixed':()=>wrap('branch','Express the condition in CUDA C++',`
<p>The CPU allocates matching input and output arrays and passes their element count as <code>n</code>. This fixed reference doubles positive inputs and negates the others, matching the one-operation negative path. The browser’s three-operation negative variant would require changing the <code>else</code> expression too.</p>
${panel('branch',courseKernels.branch,'fixed positive-double / otherwise-negate function')}
<p>The outer check excludes threads with no input. The inner condition chooses a calculation for valid inputs. A compiler may combine operations or enable instructions conditionally instead of emitting a branch. The source therefore does not establish the browser’s positive-first path order, instruction count or timing.</p>`),
'reduction-size':()=>wrap('reduction','Write the eight-input sum in CUDA C++',`
<p>This fixed function requires one block of exactly eight threads, eight FP32 inputs and one FP32 output. The CPU allocates and copies those arrays. The kernel declares its separate eight-word shared workspace. Its result count is one even though its input count is eight.</p>
${panel('reduction',courseKernels.reduction,'complete eight-input, one-block reduction')}
<p>The CPU launches <code>sumEight&lt;&lt;&lt;1, 8&gt;&gt;&gt;(d_input, d_sum)</code>. Every thread reaches the initial barrier and every loop barrier, including threads that do no addition at that stage. The first barrier orders the input writes; later barriers order partial sums before partner reads. The following diagnostic removes these ordering guarantees from this teaching algorithm.</p>`),
'matrix-dot':()=>wrap('dot','Compute one matrix output per CUDA thread',`
<p>For the four-by-four example, the CPU allocates 16 FP32 positions for each of A, B and C, copies A and B, and launches a two-dimensional grid of 2 × 2 blocks with 2 × 2 threads per block. CUDA’s <code>.x</code> coordinate chooses columns and <code>.y</code> chooses rows here; that mapping is our choice. <code>dim3 threads(2, 2), blocks(2, 2)</code> declares those two-dimensional launch sizes in CPU C++.</p>
${panel('dot',courseKernels.dot,'fixed 4 × 4 matrices · one output per thread')}
<p>The CPU calls <code>separateProducts&lt;&lt;&lt;blocks, threads&gt;&gt;&gt;(d_a, d_b, d_c)</code>. Flat row-major indexing turns <code>A[row,k]</code> into <code>a[row * 4 + k]</code>. Each thread starts its own sum at zero, visits four K positions, then writes one output. This is an equivalent reference algorithm, not the implementation selected by PyTorch.</p>`),
'matrix-reuse':()=>wrap('tiled','Put the shared tiles and barriers into CUDA C++',`
<p>The complete <code>sharedProducts</code> reference keeps the same 4 × 4 matrices and uses a 2 × 2 output tile per block. The CPU launches 2 × 2 blocks of 2 × 2 threads. Each block declares two 2 × 2 shared arrays, <code>aTile</code> and <code>bTile</code>. Each thread’s <code>x</code> and <code>y</code> are its local column and row; <code>row</code> and <code>col</code> are its output coordinates. Its private <code>sum</code> starts at 0.0.</p>
${panel('tiled',courseKernels.tiled,'complete fixed 4 × 4 multiply · tile width 2')}
<p>The first barrier makes both loaded tiles ready for every thread. The second stops a faster thread replacing a tile before another finishes reading it. This fixed function requires the stated full tiles; arbitrary dimensions need additional edge handling. The browser’s tile control changes its model, while this reference remains tile width 2.</p>`),
'precision-conversion':()=>wrap('precision','Round inputs with CUDA’s FP16 conversion',`
<p>For a CUDA reference, include <code>&lt;cuda_fp16.h&gt;</code>. Its <code>__half</code> type represents FP16. The CPU supplies 16 FP32 inputs, allocates 16 FP32 output positions for inspection and passes <code>n = 16</code>. Launch one block of 32 threads. The output is converted back to FP32 so we can read the rounded values; it is not FP16 output storage.</p>
${panel('precision',courseKernels.precision,'FP32 → FP16 → FP32 inspection')}
<p><code>__float2half_rn</code> rounds an FP32 value to FP16 using nearest-even rounding; <code>__half2float</code> converts that stored value back to FP32. The original excess above 1.0 cannot reappear. This demonstrates input conversion, not tensor-core execution. BF16 has a different type and conversion API.</p>`),
'precision-cooperation':()=>`<details class="chapter-cuda-bridge" id="cuda-wmma-connection"><summary>Optional: read a cooperative CUDA matrix operation</summary>
${definitions([['WMMA','CUDA’s warp-cooperative matrix multiply–accumulate interface. A fragment holds a matrix tile distributed across the warp’s threads.']])}
<p>This fixed reference uses <code>&lt;mma.h&gt;</code> and <code>&lt;cuda_fp16.h&gt;</code>. The CPU must provide two 16 × 16 row-major FP16 inputs and a 16 × 16 FP32 output, with suitably aligned GPU allocations. It launches exactly one block of 32 threads on a supported NVIDIA GPU. All 32 threads execute these calls together; no lane condition surrounds them.</p>
${panel('wmma',wmmaKernel,'complete cooperative 16 × 16 × 16 WMMA function')}
<p>The CPU launches <code>matrixTile&lt;&lt;&lt;1, 32&gt;&gt;&gt;(d_a, d_b, d_c)</code>. Each leading dimension of 16 is the row pitch in elements. The result starts at zero and accumulates A × B. This API expresses warp cooperation; its name does not specify a hardware instruction count or elapsed time.</p>
<p><a href="../examples/desktop/wmma.cu" download>Download the complete native WMMA program</a>. CI compiles this example; its tensor-core execution is outside the functional-simulation checks. Use the <a href="desktop.html#native">native GPU setup appendix</a> for hardware execution.</p></details>`,
'attention-online':()=>wrap('attention','Update the running totals in CUDA C++',`
<p>The reference assigns one query to each CUDA thread and visits one key at a time. The CPU supplies <code>n = 8</code> query rows, eight key rows and eight value rows, each four FP32 components wide; it allocates <code>n × 4</code> output floats. This is a small correctness reference. The browser groups keys into tiles; a production kernel would distribute the calculation differently.</p>
<p>For one query, <code>maxScore</code> starts at negative infinity, <code>normalizer</code> at 0.0, and the four private <code>weighted</code> totals at 0.0. The kernel computes the current key’s scaled dot product as <code>score</code>. In the update below, <code>key</code> identifies its row in <code>values</code>; <code>fmaxf</code> chooses the larger FP32 value and <code>expf(z)</code> computes e raised to z.</p>
${panel('attention-update',courseKernels.attention.split('// BEGIN ONLINE_UPDATE\n')[1].split('// END ONLINE_UPDATE')[0].trimEnd().split('\n').map(line=>line.slice(8)).join('\n'),'body excerpt from onlineAttention · one key’s update')}
<p>Both old totals change scale before the new key contributes. Once every key has been visited, each output component is <code>weighted[c] / normalizer</code>. No full score or weight matrix is allocated by this reference. Its FP32 arithmetic can differ slightly from the browser’s double-precision calculation.</p>${complete('attention')}`),
'inference-capacity':()=>wrap('cache','Append one token into reserved CUDA storage',`
<p>The opening PyTorch example creates new cache tensors with <code>torch.cat</code>. A CUDA implementation can instead reserve enough GPU storage for the next token. For the small opening example, the CPU allocates at least 4 × 4 FP32 positions for each cache and copies the three existing rows. It separately supplies the four-component <code>newKey</code> and <code>newValue</code> arrays, then passes <code>cachedTokens = 3</code> and <code>width = 4</code>.</p>
${panel('cache',courseKernels.cache,'append one four-component key and value')}
<p>The CPU launches one block of eight threads. Four valid threads write the new row, preserving the existing rows. Each cache needs capacity for <code>(cachedTokens + 1) * width</code> values before the launch. The guard checks components; it does not grow the allocation. Keys and values together add 32 bytes in this FP32 example. This differs from the later synthetic decoder’s two-byte values, 32 layers and wider vectors.</p>`),
'capstone-evidence':()=>wrap('timing','Place CUDA events around a kernel launch',`
${definitions([['CUDA stream','An ordered queue of CUDA operations. This example uses the default stream for its kernel and events.'],['CUDA event','A marker recorded in a CUDA stream; two timing-enabled events can measure the GPU interval between their positions.']])}
<p>The CPU has already allocated and copied the 4 × 4 inputs and checked the result. It supplies 2 × 2 blocks of 2 × 2 threads. After warm-up, one measured interval can use the following CPU C++ calls. <code>CUDA_CHECK</code> is the error-checking helper introduced in Chapter 3.</p>
${panel('timing',timingSource,'CPU timing excerpt · same-stream events and kernel')}
<p>Waiting for the stop event makes the interval available before reading milliseconds. This interval excludes allocation and CPU/GPU copies. The download’s <code>--timing</code> option measures this fixed tile-width-2 reference ten times after warm-up and output checks. To compare another implementation, use the same interval and correctness checks for it too. This tiny kernel illustrates timing mechanics, so launch overhead can dominate. Browser counts and functional-simulator timing cannot establish physical GPU performance.</p>`),
};
export const renderSectionCuda=id=>bridges[id]?.()||'';
