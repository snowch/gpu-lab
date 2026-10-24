// Copyright © 2026 Christopher Snow.
import { guides } from '../src/reference-tasks.mjs';
export const remainingLessons = [
  {
    engine:'ai',slug:'reduction',number:'04B',title:'A reduction needs an ordering',workedExample:'reduction',
    subtitle:'Make other threads’ writes visible before consuming them.',
    prerequisite:'Lab 04: shared memory, blocks, and block barriers. This workshop completes the reduction part of that lab.',
    intro:`<p>Computing a mean, a norm, or a softmax denominator requires combining many inputs. Threads can cooperate by adding different pairs in parallel.</p><!-- NEW_CONCEPTS --><p>A tree reduction combines partial sums in stages. Each thread first writes its input to shared memory. A block barrier ensures writes are visible before later stages read them. Without the required ordering, the program has no guaranteed useful result.</p>`,
    setup:`<p>The inputs are consecutive integers starting at one. Predict whether the selected schedule can read a value before its writer has stored it. Then inspect the shared-memory cells and step through the tree.</p><p>With barriers removed, the experiment deliberately lets thread zero run ahead. It stops the arithmetic at the first unwritten read. The later writes show why arriving eventually cannot repair that earlier access. This is a diagnostic interleaving, not a prediction of a GPU's behaviour.</p>`,
    controls:`<label>Threads / inputs<select id="size"><option value="4">4</option><option value="8" selected>8</option></select></label><label>Ordering<select id="ordering"><option value="barrier">Block barriers</option><option value="unsafe">Remove barriers; thread 0 runs ahead</option></select></label>`,
    prediction:'Will the trace encounter an unwritten read?',maxGuess:1,namedChoices:[{value:'0',label:'All reads are safe'},{value:'1',label:'Unwritten read occurs'}],
    figureTitle:'Shared values over the reduction',figureHint:'Each cell is one shared-memory word. Pending cells have not been written. Highlighted cells are read as partners in this event.',
    code:`// One block with N threads; N is a power of two.
__shared__ float partial[N];
int t = threadIdx.x;
partial[t] = input[t];
__syncthreads();
for (int stride = N / 2; stride > 0; stride /= 2) {
    if (t < stride) partial[t] += partial[t + stride];
    __syncthreads(); // every block thread reaches this barrier
}
if (t == 0) output[0] = partial[0];`,
    codeNote:`<p><code>+=</code> reads a value, adds to it, then writes the result. <code>/= 2</code> halves the stride each stage. Although only some threads perform the addition, every thread reaches the following barrier. Putting that barrier inside <code>if (t &lt; stride)</code> would violate this requirement.</p><p>This teaching reduction uses a full-block barrier at each stage. Optimised implementations may use warp shuffles, warp synchronisation or library primitives with their own contracts. Sharing a warp alone is not a replacement for reasoning about visibility and ordering.</p><p><a href="../examples/ai-kernels.cu" download>Download self-checking CUDA matmul and reduction examples ↓</a></p>`,
    exercises:[
      'Sum the input values on paper. Step the synchronised run and explain what each remaining partial sum represents.',
      'Remove the barriers and predict the first partner read. Why does its later write fail to make the earlier access safe?',
      'Change from eight inputs to four. Compare the number of tree stages with the number of additions.',
      'Explain why the addition can be conditional while the following block barrier must be reached by every thread.',
    ],
    takeaway:`<p>Every safe stage combines disjoint groups from the previous stage. The group represented by the first partial sum grows until it contains every input. Barriers establish when those shared values can be consumed.</p><p>The unsafe schedule is evidence that the unsynchronised program lacks a required guarantee. One successful run would not prove it correct. The experiment reports a hazard instead of inventing a numeric answer for a data race.</p>`,
    limits:'The teaching schedule uses small integer-valued sums, shared words initially marked unwritten, and stage snapshots. It detects one deliberately exposed read-before-write hazard; it is not a general CUDA race detector or a scheduler model. No output is assigned to the racy program. Floating-point summation-order error and optimised warp reductions are outside this experiment.',
    source:guides.barriers,sourceLabel:'CUDA Programming Guide: synchronisation functions',
  },
  {
    engine:'ai',slug:'matmul',number:'05',title:'Reusing data in matrix multiplication',workedExample:'matmul',
    subtitle:'Compute the same matrix product with fewer repeated input loads.',
    prerequisite:'Labs 01–04: memory access, resident warps, shared memory and block barriers. A matrix is a two-dimensional array.',
    intro:`<p>Linear layers multiply matrices. For <code>C = A × B</code>, output <code>C[row,col]</code> sums <code>A[row,k] × B[k,col]</code> over k. A naive thread loads both inputs for each product; neighbouring output threads often need the same values.</p><!-- NEW_CONCEPTS --><p>Threads in a block can cooperatively load tiles of A and B into shared memory, reuse their values for several outputs, then load new tiles. Each thread holds a running sum in a register.</p><p>We count a multiply and an add as two floating-point operations (FLOPs), and count global input loads plus one final output store. Cache reuse is excluded from this particular intensity calculation.</p>`,
    setup:`<p>Each step loads one A tile and one B tile, then adds their product to one C tile. Highlighted source cells are loaded in this step. The C tile shows its partial sums after the step. Tile size one represents the naive calculation.</p><p>A second model checks whether blocks fit a teaching SM with 1,024 registers, eight warp slots and a maximum of eight blocks. Shared memory is adjustable. One thread computes each output, and each of these small blocks uses one partly filled warp. Register allocation is an assumption you choose, not compiler output.</p>`,
controls:`<label>Matrix dimension<select id="n"><option value="4">4 × 4</option><option value="8" selected>8 × 8</option></select></label><label>Tile dimension<select id="tile"><option value="1">1 · naive</option><option value="2" selected>2</option><option value="4">4</option></select></label>`,
    advancedControls:`<label>Shared bytes per teaching SM<select id="sharedBudget"><option value="128">128</option><option value="512" selected>512</option><option value="2048">2,048</option></select></label><label>Registers per thread<select id="registers"><option value="16">16</option><option value="64">64</option></select></label>`,
    prediction:'How many input values will the whole matrix multiply load? Count repeated loads.',maxGuess:100000,
    figureTitle:'Two input tiles and their output tile',figureHint:'Choose a trace step to inspect the loaded regions and the resulting partial C tile. The full final matrix is also available after inspection.',
    code:`// One T × T block computes one C tile; N is divisible by T.
__shared__ float As[T][T], Bs[T][T];
int r = blockIdx.y * T + threadIdx.y;
int c = blockIdx.x * T + threadIdx.x;
float sum = 0;
for (int k0 = 0; k0 < N; k0 += T) {
    As[threadIdx.y][threadIdx.x] = A[r * N + k0 + threadIdx.x];
    Bs[threadIdx.y][threadIdx.x] = B[(k0 + threadIdx.y) * N + c];
    __syncthreads();
    for (int k = 0; k < T; ++k)
        sum += As[threadIdx.y][k] * Bs[k][threadIdx.x];
    __syncthreads(); // finish reading before overwriting the tiles
}
C[r * N + c] = sum;`,
    codeNote:`<p>The first barrier makes tile loads visible. The second prevents a fast thread from overwriting shared values that another thread still needs. The fragment assumes square matrices with dimensions divisible by T; edge tiles in general code need bounds handling.</p><p>The downloadable example includes a complete launch, allocations and CPU-result checks. Production kernels use larger tiles, register tiling and more complex pipelines. These small tiles make every value inspectable.</p><p><a href="../examples/ai-kernels.cu" download>Download self-checking CUDA examples ↓</a></p>`,
    exercises:[
      'Predict the input loads for tile one, then tile two. Explain which output threads share each newly loaded input.',
      'Keep the matrices fixed and compare all tile sizes. Check that the final output values stay the same.',
      'Increase registers per thread. Find a case where larger tiles reuse more data but permit fewer resident blocks.',
      'Lower the shared-memory budget. Compare register and shared-memory limits before claiming a larger tile will be faster.',
    ],
    takeaway:`<p>For square matrices of dimension N and tile dimension T, this algorithm loads <code>2N³/T</code> input values. Tiling reduces explicit repeated loads while leaving arithmetic and output values unchanged.</p><p>Reusing more data consumes resources. A block's shared tiles use <code>2T² × 4</code> bytes, and its T² threads each need registers. Fewer resident blocks may reduce opportunities to hide latency. Arithmetic intensity and occupancy describe different constraints; neither alone predicts measured speed.</p>`,
    limits:'Exact integer-valued arithmetic is evaluated in JavaScript; traffic assumes FP32 values and no cache reuse. Tile one uses no shared storage. Other tiles use two single-buffered shared tiles. Resource limits are deliberately small teaching budgets; allocation granularity, spills, hardware pipelines and actual GPU timings are omitted. Counted FLOPs use the conventional two per multiply-add.',
    source:'https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html#shared-memory-in-matrix-multiplication-c-ab',sourceLabel:'CUDA Best Practices Guide: shared memory in matrix multiplication',
  },
  {
    engine:'ai',slug:'tensor-cores',number:'06',title:'Using tensor cores',workedExample:'tensor-cores',
    subtitle:'Matrix operations can use specialised hardware, but input precision still matters.',
    prerequisite:'Lab 05: matrix multiplication and tiles. FP32 is the four-byte floating-point format used in earlier labs.',
    intro:`<p>Modern GPUs can accelerate matrix multiplication with specialised hardware, but reducing input precision can change the answer.</p><!-- NEW_CONCEPTS --><p>A warp cooperates on matrix tiles rather than assigning a whole output row to each lane. This lab uses a conceptual 16 × 16 × 16 tile; supported shapes and numeric formats depend on the GPU.</p><p><strong>FP16</strong> has fewer fraction bits and a narrower range than FP32. <strong>BF16</strong> has fewer fraction bits still, but an exponent range similar to FP32. FP32 accumulation cannot recover information already lost when inputs were rounded.</p>`,
    setup:`<p>All rows of A are identical and every entry of B is one, so every C element has the same value. Inspect the dot product for C[0,0]. Values first enter as FP32, are rounded to the selected input format, then products accumulate sequentially into FP32.</p><p>The cancellation pattern contains values close to one and exact negative ones. The small-value pattern tests range. Exact binary fractions provide a control case. The displayed 16 accumulation steps are an arithmetic explanation, not the internal schedule of a tensor core.</p>`,
    controls:`<label>Input format<select id="format"><option value="fp32">FP32 reference</option><option value="fp16" selected>FP16 · 10 fraction bits</option><option value="bf16">BF16 · 7 fraction bits</option></select></label><label>Inputs<select id="pattern"><option value="cancellation">Near-one cancellation</option><option value="small">Small positive values</option><option value="exact">Exact binary fractions</option></select></label>`,
    prediction:'How many of the 16 values in A’s first row change during input conversion?',maxGuess:16,
    figureTitle:'Conversion and accumulation for C[0,0]',figureHint:'The selected K position shows its original FP32 value, converted value, product and FP32 partial sum.',
    code:`// WMMA sketch: all 32 lanes execute these calls together.
using namespace nvcuda;
wmma::fragment<wmma::matrix_a,16,16,16,half,wmma::row_major> a;
wmma::fragment<wmma::matrix_b,16,16,16,half,wmma::row_major> b;
wmma::fragment<wmma::accumulator,16,16,16,float> c;
wmma::fill_fragment(c, 0.0f);
wmma::load_matrix_sync(a, A_half, 16);
wmma::load_matrix_sync(b, B_half, 16);
wmma::mma_sync(c, a, b, c);
wmma::store_matrix_sync(C, c, 16, wmma::mem_row_major);`,
    codeNote:`<p>This sketch requires <code>&lt;mma.h&gt;</code>, <code>&lt;cuda_fp16.h&gt;</code>, a supported target, suitably aligned allocations and already converted FP16 inputs. The trailing 16 is the row pitch in elements. It is a cooperative warp operation: invoking it from only some lanes is invalid.</p><p>One 16 × 16 × 16 WMMA multiply-accumulate call represents 4,096 scalar multiply-adds. It may lower to several hardware instructions. That comparison says how much arithmetic the API expresses; it gives no cycle count or speedup. BF16 support and other shapes require their own supported type and target choices.</p>`,
    exercises:[
      'Predict changed inputs for near-one cancellation in each format. Can FP32 accumulation recover the discarded part of an input?',
      'Try the small-value pattern. Compare FP16 and BF16 results. Explain range separately from fraction precision.',
      'Use exact binary fractions. Why can lower-precision inputs now agree with the FP32 reference?',
      'Explain why a WMMA operation can replace many scalar multiply-add expressions without implying that it completes in one GPU cycle.',
    ],
    takeaway:`<p>Input conversion and accumulation are separate choices. Cancellation can make a small input-rounding error dominate the final result. Exact inputs can avoid conversion error; values outside a format's useful range can lose information even before arithmetic starts.</p><p>Tensor-core performance depends on shapes, layouts, data movement, supported formats and the implementation selected by a library or compiler. The numeric experiment gives a reason to check accuracy alongside throughput.</p>`,
    limits:'Input conversion uses round-to-nearest, ties-to-even with subnormals. The arithmetic illustration uses a chosen sequential FP32 accumulation order. It does not reproduce hardware MMA accumulation order or precision guarantees, flush-to-zero behaviour, fragment mapping, tensor-core scheduling, compiler lowering or performance. The FP32 option is a numeric reference, not a claim that this WMMA FP16 sketch accepts FP32 matrix inputs.',
    source:guides.wmma,sourceLabel:'CUDA Programming Guide: warp matrix functions',
  },
  {
    engine:'ai',slug:'attention',number:'07',title:'Moving less data in attention',workedExample:'attention',
    subtitle:'Compute softmax-weighted values without storing full score and probability matrices.',
    prerequisite:'Labs 04–06: reductions, matrix multiplication, precision and data reuse. This lab introduces attention and stable softmax.',
    intro:`<p>Attention lets an input weigh information from other inputs. It first scores possible matches, then combines information according to those scores.</p><!-- NEW_CONCEPTS --><p>For head width d, scores are <code>QKᵀ/√d</code>; transposing K makes the key vectors columns in the product. Each score row is then normalised.</p><p>Subtracting the row maximum before exponentiation preserves the softmax result and avoids overflow for large positive scores.</p><p>A materialised implementation writes scores, reads them for softmax, writes probabilities, then reads those probabilities to multiply by V. <strong>Fusion</strong> can avoid full intermediates by keeping and updating a smaller running state.</p>`,
    setup:`<p>In online mode, step through key tiles for query zero. Track a running maximum m, denominator l and unnormalised weighted-value vector. When a tile raises the maximum, rescale the old denominator and vector by <code>exp(old_m − new_m)</code> before adding new contributions. Divide the final vector by l.</p><p>The simulator computes every query and compares with the stable materialised result. Intermediate traffic counts only score/probability writes and reads, assuming four-byte values. Workspace excludes Q, K, V and the output. These are algorithmic accounting quantities; the JavaScript implementation retains extra arrays for comparison and traces.</p>`,
    controls:`<label>Algorithm<select id="mode"><option value="online">Online tiled</option><option value="materialised">Materialised scores and probabilities</option></select></label><label>Sequence length<select id="n"><option value="8">8</option><option value="16">16</option><option value="32">32</option></select></label><label>Key tile size<select id="tile"><option value="2">2</option><option value="4">4</option><option value="8">8</option></select></label><label>Score scale<select id="scale"><option value="1">Ordinary</option><option value="1000">Large scores · test stability</option></select></label>`,
    prediction:'How many score/probability values are written as full-matrix intermediates? Count both matrices.',maxGuess:10000,
    figureTitle:'Attention state for query zero',figureHint:'Online steps show key scores and running normalisation state. Materialised steps show the score row, probability row and final output.',
    code:`// Algorithm sketch; vectors and reductions need an implementation.
float m = -INFINITY, l = 0;
vector acc = zeros(d);
for (each key_value_tile) {
    vector s = dot(query, keys) / sqrt(d);
    float next_m = max(m, max(s));
    float alpha = exp(m - next_m);
    vector p = exp(s - next_m);
    acc = alpha * acc + p_times_values(p, values);
    l = alpha * l + sum(p);
    m = next_m;
}
output = acc / l;`,
    codeNote:`<p>This is pseudocode, not compilable CUDA. <code>vector</code>, tile iteration and the reductions stand for work that a kernel must assign to threads and memory. The code shows the normalisation invariant rather than a production implementation.</p><p>The online recurrence is a building block of memory-efficient attention. Real FlashAttention implementations also choose query tiles, manage memory hierarchies and parallelism, and often handle masks and different attention variants.</p>`,
    exercises:[
      'Predict the full-matrix writes in materialised mode, then online mode. Double sequence length and explain the change.',
      'Step an online run until the running maximum changes. Explain why the previous accumulated state must be rescaled.',
      'Change tile size. Check agreement with the materialised result and compare the scratch-space budget.',
      'Use large scores. Explain why exponentiating raw scores is risky and why subtracting a maximum fixes that risk.',
    ],
    takeaway:`<p>The online recurrence keeps numerator and denominator expressed relative to the same running maximum. Rescaling both preserves their ratio. The final output matches stable full-row softmax apart from floating-point order differences.</p><p>Avoiding full score/probability matrices removes their intermediate traffic, not all attention traffic. Q, K, V, output writes, tile rereads and synchronisation still matter. This experiment does not turn saved intermediate bytes into a measured speedup.</p>`,
    limits:'Dense single-head, unmasked forward attention only; width four and small deterministic matrices. The recurrence uses JavaScript double precision while byte accounting assumes FP32 storage. No backward pass, dropout, causal mask, block scheduling, tensor-core execution or complete HBM traffic is simulated. Online workspace is a single-query tile plus d accumulator values and two scalars, not a production kernel allocation.',
    source:'https://arxiv.org/abs/2205.14135',sourceLabel:'FlashAttention: exact attention with IO awareness',
  },
  {
    engine:'ai',slug:'inference',number:'08',title:'Explaining inference performance',workedExample:'inference',
    subtitle:'Compare compute and memory bounds for prefill, decode and batching.',
    prerequisite:'Labs 01–07: data movement, FLOPs, attention and resource constraints. This lab uses decimal GB/s and TFLOP/s.',
    intro:`<p>Generating text begins by processing a prompt, then continues by producing new tokens. These phases can put different demands on a GPU.</p><!-- NEW_CONCEPTS --><p>Weights can be reused across many tokens in a matrix operation. Small-batch decode provides less such reuse, while longer contexts increase KV-cache reads. Batching shares weight reads across sequences, but increases cache-capacity requirements.</p><p>This lab compares time needed for its counted memory transfers and arithmetic under ideal throughput and overlap. The larger figure is an optimistic lower bound: real work includes overheads and imperfect utilisation.</p>`,
    setup:`<p>Choose an explicitly synthetic decoder: 32 layers, hidden width 4,096, KV width 1,024 and two-byte weights/cache values. Parameter count is an independent approximate dense-weight budget. These settings do not name or fully specify a real model.</p><p>One invocation reads weights once under ideal batch reuse. Decode reads the existing cache and writes one new entry per sequence; prefill writes the prompt cache and counts full square attention arithmetic. Input sequence length is the existing context for decode and the prompt length for prefill.</p><p>Optionally enter a measured invocation time with the same scope. Zero means no measurement. Compare it with the bound; a measurement below the bound means the assumptions or measurement scope need checking.</p>`,
controls:`<label>Phase<select id="phase"><option value="decode">Decode · one token per sequence</option><option value="prefill">Prefill · all prompt tokens</option></select></label><label>Batch<select id="batch"><option value="1">1</option><option value="4">4</option><option value="16">16</option></select></label>`,
    advancedControls:`<label>Context / prompt length<select id="sequence"><option value="128">128</option><option value="512" selected>512</option><option value="2048">2,048</option></select></label><label>Weight parameters<select id="parameters"><option value="1">1 billion</option><option value="7" selected>7 billion</option></select></label><label>Bandwidth · decimal GB/s<select id="bandwidth"><option value="100">100</option><option value="1000" selected>1,000</option></select></label><label>Compute · TFLOP/s<select id="compute"><option value="10">10</option><option value="100" selected>100</option></select></label><label>Optional measured invocation · ms<input id="measuredMs" type="number" value="0" min="0" step="any"></label>`,
    prediction:'Which lower bound dominates?',maxGuess:1,namedChoices:[{value:'0',label:'Memory-limited'},{value:'1',label:'Compute-limited'}],
    figureTitle:'Where the lower bound comes from',figureHint:'The bars compare memory and compute bounds on the same scale. Trace items break down the counted work; these are accounting terms, not sequential execution events.',
    code:`// Measurement sketch using a CUDA stream and timing events.
cudaEventRecord(start, stream);
run_one_invocation(stream); // define prefill or one decode step
cudaEventRecord(stop, stream);
cudaEventSynchronize(stop);
cudaEventElapsedTime(&milliseconds, start, stop);`,
    codeNote:`<p>Events must be created first. Define the measured scope, warm up the workload, repeat measurements and check CUDA errors. The sketch measures work between events in the chosen stream, not network time or all end-to-end serving latency. Work on other streams may need additional ordering.</p><p>Use an appropriate sustained compute rate for the chosen precision, not an unrelated peak number. Profilers can reveal whether the real workload moves the bytes or performs the operations that this estimate assumes. Entering a number here does not automatically validate its scope.</p>`,
    exercises:[
      'Predict the dominant bound for default decode. Increase batch size and compare counted weight bytes per output token.',
      'Increase context length during decode. Which cache quantity grows, and which weight quantity stays fixed?',
      'Switch to prefill with a large batch and prompt. Compare arithmetic with memory traffic. Explain why one label cannot describe every phase.',
      'Change bandwidth without changing compute rate, then do the reverse. If you have a real measurement, enter it and investigate the remaining gap.',
    ],
    takeaway:`<p>The bound identifies which counted resource would take longer even with perfect use of the selected rates. Raising the other rate cannot lower that bound. The result remains conditional on the byte and FLOP estimates.</p><p>Observed time can exceed the bound because of launch overhead, limited parallelism, communication, extra memory movement and incomplete compute/bandwidth utilisation. A time below it calls for checking units, precision, reuse, sparsity, model shape and measurement scope.</p>`,
    limits:'Analytical budget, not an executed transformer or a named-GPU prediction. Dense projection FLOPs are approximated as 2 × parameters × tokens. Attention uses 4 × layers × batch × sequence × hidden for decode and an extra sequence factor for full-square prefill. Activations, temporary storage, sampling, communication, launch overheads, tensor parallelism and cache reuse beyond the stated assumptions are omitted. Full-square prefill does not model causal triangular work savings.',
    source:'https://doi.org/10.1145/1498765.1498785',sourceLabel:'Roofline: an insightful visual performance model',
  },
];
