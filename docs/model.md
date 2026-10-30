# Memory model contract

Copyright © 2026 Christopher Snow.

## Concept relationship map

`gpu-map-data.mjs` declares concepts, chapter memberships and directed relationships.
The outer Computer / system contains peer Host (CPU side) and GPU device groups.
The host group contains the CPU and system RAM as siblings; RAM is not inside
the CPU. “Host” denotes the CUDA CPU side, not a parent of the GPU device.
CPU caches belong to the processor.

The outer GPU device contains the GPU compute chip and dedicated device memory.
The chip contains SMs (including per-SM L1 caches), shared L2 cache and memory
controllers. VRAM is separate from the compute chip: GDDR is typically on the board;
HBM stacks sit alongside the GPU die within its package. This is a simplified
discrete NVIDIA GPU model, not a universal packaging diagram. Shared memory remains
a block-scoped workspace on the SM; it can share hardware capacity with L1.

The hardware diagram shows three blocks of 64 threads on two SMs: A/C on SM 0
and B on SM 1. Each block has two warps; thread index is warp index × 32 + lane
index. The map does not simulate scheduling, placement, cache behaviour or timing.
Worked tensor operations belong in the chapters, not a second map tab.

Build-time renderers emit all SMs, blocks, warps and lanes as native HTML
disclosures. JavaScript enhances navigation and persistence without creating essential
content. Definitions, book examples and chapter links live inside the expandable
components. Legacy concept hashes open their matching component in the diagram.
The header toggle keeps the reading document in place and loads the map in a same-origin
frame across the reading area. It hides both contents lists, shares the theme, restores
reading position on close, and includes frame state in the release-update protocol.
Map chapter links navigate the reading window. Direct map routes also use the full width.
Hardware terms follow NVIDIA CUDA conventions; boxes distinguish resident work from
physical resources and do not imply a chip floor plan or simultaneous execution.

## Architecture ownership diagrams (chapter 6)

The introduction's ownership view and work map share a declared example: four blocks
with 64 threads each, placed on two SMs by block index modulo two. This placement is
chosen for illustration; no block placement, resource capacity or execution timing is
simulated. Within each block, thread index determines warp index by integer division
by 32 and lane by remainder. The renderers derive block membership, SM labels, warp
ranges and lane/thread labels from that example. Registers are grouped by their owning
threads and shared-memory workspaces by their owning blocks, rather than physical
location on a chip. The diagrams do not imply dedicated execution units for each warp.
Static figures are generated during the build; optional controls change the inspected
block and warp without requiring a GPU. Incomplete final warps are supported by the
mapping function and show unoccupied lane positions as inactive.

The scheduling lesson’s relationship map reuses the same placement rule with three
blocks of 64 threads on two SMs. Blocks A and C share SM 0; block B uses SM 1.
Each block shows two distinct 32-thread warps (local indices 0–31 and 32–63).
The first warp in block A expands into 32 occupied lanes. This is explicitly a
separate placement illustration, not the two-block, four-thread launch in the
chapter 1 experiment. The accompanying text explains that four-thread blocks use
one partially filled warp, without implying this is the general block size.
Ready warps from different resident blocks may make progress while other threads
wait or lanes are unused; resource limits still apply. Empty lanes cannot be
filled with another block’s threads. No scheduling or timing is simulated.

## Repair-a-kernel workshop

The structured editor selects a CUDA index expression (the global index
`blockIdx.x * blockDim.x + threadIdx.x`, that index plus one, or `threadIdx.x`),
an optional `i < n` guard, and multiplication/addition by two or vector addition.
Blocks contain 8, 16, 32 or 64 threads. Block size is not hardware warp size.

The browser model computes these supported expressions on the CPU; it does not
compile CUDA or run GPU code. Inputs are alternating positive/negative half-integers
stored as FP32; the second input is `(i % 5) - 2.25`. An independent reference
computes the selected goal. The model records indexing, guards, reads, arithmetic
and writes, with FP32 rounding. Invalid accesses and repeated writes are hazards
even when all valid output values match. Replay visits threads in global-index
order for inspection, not as a GPU scheduling claim. No timings are inferred.

The download wraps the displayed kernel in a complete CUDA C++ program for 35
elements. It includes input/output allocation, transfers, launch error checking,
synchronisation, read-back, printing and cleanup. Output starts as NaN to expose
unwritten elements. The download is blocked if the selected configuration has
invalid accesses or duplicate writes for that input. Safe incorrect results remain
downloadable for comparison. No CUDA compiler or NVIDIA GPU is available in this
environment, so generated programs are explicitly marked uncompiled and untested.

## Global-memory loads

`simulateLoad` models addresses generated by one global-memory load instruction for a warp.
Its input is an integer stride (1–32 elements), offset (0–31 elements), and active-lane count
(1–32). Active lanes are the consecutive prefix of the warp, not an arbitrary mask.

For active lane `l`:

```
element = offset + l * stride
byteAddress = element * 4
sector = floor(byteAddress / 32)
```

The base address is zero, representing a sector-aligned allocation. Every load occupies four
bytes and cannot straddle a sector boundary because its address is four-byte aligned.
The result groups equal sector indices. Useful bytes are `4 * activeLanes`; covered bytes are
`32 * numberOfSectors`; utilisation is their ratio. Positive strides ensure distinct values.
The minimum sector count is `ceil(usefulBytes / 32)` for an optimally aligned packed range.

The view displays only touched sectors. Missing sector indices represent gaps in address
space, not packed memory. The lane selector follows an address; it does not step execution.

## Limits

No cache hits, cache lines, stores, DRAM bursts, scheduling, bank conflicts, instruction
latency, arbitrary CUDA parsing or numerical execution are modelled. In particular, sector
coverage is not a count of physical DRAM reads. Changes in coverage are not speedup ratios.

The CUDA view is handwritten illustrative source generated from the same validated stride
and offset. It is not compiler output. The downloadable program accepts the configuration as
runtime arguments, validates its output, and includes host/device allocation and copies.

## Verification

Tests pin aligned and misaligned loads, strided patterns, inactive lanes, invalid input and
generated indexing. An independent byte-level oracle checks every supported combination
(32 strides × 32 offsets × 32 active counts). Browser tests exercise predictions, resets,
lane selection, themes, responsive layout and the project Pages base path.

## Scheduling model (Lab 02)

`scheduleWarps` accepts 1–8 resident warps and integer load latency 1–16. Every warp starts
at instruction zero in cycle zero. The instruction stream is `LD,MUL,ST,LD,MUL,ST`.
One ready warp issues per cycle. A round-robin search begins after the last selected warp;
waiting and completed warps are skipped. A load at cycle t sets readiness to t+latency.
MUL and ST set readiness to t+1. The trace records state before issue and the selected warp.
The run ends at the end of the final store's issue cycle, with no store-drain delay.

An idle cycle occurs exactly when no unfinished warp is ready. Total work is six instructions
per warp, so changing warp count changes work. Issue-slot utilisation is issued instructions
divided by elapsed model cycles; it is not occupancy. Warps are already resident; there is no
block placement, bandwidth contention, cache, register budget or resource-limited occupancy.
No contemporary SM is claimed to have these timing or issue-width parameters.

## Divergence model (Lab 03)

`branchWarp` gives each lane input +2 or -2 from an explicit sign pattern. Only the first
N lanes participate. Positive lanes multiply by two; negative lanes either negate only,
or negate, multiply by two and add one. The model issues positive-path operations first,
then negative-path operations, skipping paths with empty masks. Each event records its mask.
Outputs are scalar-reference values; no loads, stores, condition checks or branch instructions
are counted. Each issued operation has 32 lane slots. Utilisation is participating lane
operations divided by all those slots, so inactive tail lanes also reduce utilisation.

This is an explicit path model, not compiled PTX or SASS. The compiler may predicate, fuse,
fold or otherwise change operations. The fixed path order makes the teaching trace readable
and is not a CUDA guarantee. Independent thread scheduling and reconvergence are omitted.

## Shared-memory bank model (Lab 04)

`sharedBanks` models one aligned FP32 read per active lane, with 32 banks and four-byte words.
In strided mode, word index is lane*stride (stride 1–33). In broadcast mode all lanes read
word zero. Bank index is word modulo 32. Each round services one distinct word per bank,
with all lanes requesting that word served together. Words within a bank are ordered by first
requesting lane for display, not as a hardware ordering claim. Rounds equal the maximum
number of distinct words requested from any one bank.

No writes, barriers, races, 64-bit words, matrix-specific instructions or execution timing are
simulated. The CUDA fragment uses a padded tile and a block barrier; the bank figure describes
only its final column read. The fragment's tile-population loop is outside the figure's scope.

## Additional verification

Scheduler invariants cover every accepted warp-count/latency pair: complete instruction streams,
load readiness, ready-only issue and no idle slot with a ready warp. Divergence masks are checked
for every pattern, active count and negative-path choice. Bank tests cover every supported stride
and active count, plus broadcasts, verifying complete lane service and one word per bank per round.
Browser checks drive every lesson at desktop and phone sizes in light and dark themes.

## Reduction workshop (Lab 04B)

Four or eight threads write inputs 1..N into shared words marked initially unwritten. The safe
schedule records each write, an initial block barrier, then snapshot-based tree stages at distances
N/2, N/4, ..., 1. Snapshot reads model the ordering established between stages. The unsafe
schedule lets thread zero read its first partner before that partner writes. This is a diagnostic
interleaving: the model reports the unwritten read and assigns no numeric output to the racy
program. It is not a general exploration of interleavings or CUDA undefined behaviour.

## Tiled matmul (Lab 05)

Square integer-valued A/B matrices have dimension 4 or 8; tile dimension T is 1, 2 or 4. Each
trace event loads one A tile and B tile for one output tile and one K phase. It records source
coordinates and updated output-tile values. All final outputs are computed, not illustrative data.
The explicit input load count is 2N³/T. FP32 traffic adds N² output stores; FLOPs use 2N³.
No cache reuse is assumed. T=1 represents the naive algorithm and allocates no shared tiles.

The separate resource estimate assumes 1,024 registers, eight warp slots and eight maximum
blocks per teaching SM. T² threads each compute one output; registers/thread is selected.
Each small block occupies one warp slot, even with fewer than 32 active threads. Non-naive
blocks allocate 2T²×4 shared bytes. Residency is the minimum of block, register, shared-memory
and warp-slot bounds. No hardware allocation granularity, spills, pipelines or timing is claimed.

## Precision and matrix operations (Lab 06)

The conceptual matrix shape is 16×16×16; every A row is identical and B is all ones. The
numeric trace follows C[0,0]. Inputs enter as FP32, convert to FP16/BF16/FP32 using nearest-even
rounding (including subnormals), then accumulate sequentially into FP32. Every output matches
that dot product by construction. The reference uses the original FP32 inputs with the same
accumulation order. This exposes input conversion, not actual hardware MMA accumulation order.
One WMMA API call expresses 4,096 scalar FMAs; it is not necessarily one hardware instruction.

## Attention (Lab 07)

Deterministic Q/K/V have length 8, 16 or 32, width four. Full dense unmasked attention uses
scores QKᵀ/√d. A stable reference subtracts row maxima before exponentiation. The online
implementation computes all queries in key tiles, recording query zero. For each tile:

```
m_new = max(m_old, max(tile_scores))
alpha = exp(m_old - m_new)
p = exp(tile_scores - m_new)
l_new = alpha*l_old + sum(p)
acc_new = alpha*acc_old + p*V_tile
output = acc/l
```

The reference and recurrence use JavaScript double precision. Accounting assumes four-byte
storage. Materialised score and probability matrices each have N² writes and N² reads: 16N²
bytes for these intermediates. Online mode writes none of those full-matrix intermediates.
Its single-query algorithmic scratch budget is tile+d+2 floats. Q/K/V, output, tile rereads and
the simulator's own arrays/traces are outside that scratch metric. It is not total HBM traffic
or an exact allocation for a production FlashAttention kernel.

## Inference budget (Lab 08)

The synthetic decoder assumes L=32 layers, hidden H=4096, KV width W=1024 and two-byte values.
P is independently selected as 1 or 7 billion dense-weight parameters. Batch is B; context or
prompt length is S. One invocation reads 2P weight bytes with ideal batch reuse.

- Cache capacity: 2LBSW×2 bytes.
- Decode: read that cache, write 2LBW×2 new bytes; FLOPs ≈ 2PB + 4LBSH.
- Prefill: write the full prompt cache; FLOPs ≈ 2PBS + 4LBS²H for full square attention.
- Memory lower bound: counted bytes / selected decimal GB/s.
- Compute lower bound: counted FLOPs / selected TFLOP/s.
- Invocation lower bound: maximum of those times under ideal overlap.

These are deliberately incomplete analytical budgets, not a real named model's full shape.
Activations, communication, intermediates, sparsity and overheads are omitted. Full-square
prefill does not exploit causal triangular savings. Optional measured milliseconds are user
input; no measurement is bundled or fabricated. A value below the bound signals inconsistent
assumptions or scope. Bound/time is a comparison ratio, not a measured hardware utilisation.

## Verification of Labs 04B–08

Matmul is checked against independent scalar dot products and analytical traffic counts across
all teaching resource choices. Precision tests cover ties, normal/subnormal boundaries, overflow
and exact controls. Online attention is compared with stable materialised attention for every
supported size/tile/score-scale pair. Budget tests check dimensions, batch/cache scaling and
rate changes. Reduction tests check safe sums and unwritten hazard reads. Browser tests cover
predictions, reset, keyboard stepping, model edge cases, mobile layout and navigation.

## Linked mechanism diagrams

`mechanism-visuals.mjs` renders explanatory layouts from those same results and trace events.
Scheduling uses pre-issue status across cycles; branching uses actual non-empty masks; bank
queues deduplicate requested words. Reduction nodes record their input contribution sets;
their sums and edges follow the tree stages, not a hand-drawn animation. Resources show the
selected teaching capacities and allocations. Format bars use the defined sign/exponent/fraction
budgets, with a local rounding interval for an inexact selected input.

Attention trace metadata retains the previous denominator/accumulator, rescale and tile terms,
so the visual recurrence shows actual operands. Inference records phase-dependent cache lengths
before and after the invocation. View/copy diagrams derive original and destination offsets from
the first lesson's contiguous tensor layout. The two foundational tensor diagrams are rendered
at build time for a readable JavaScript-disabled fallback. Experiment-dependent diagrams remain
behind prediction/inspection. See `visual-review.md` for the page-by-page review and limits.

## Guided kernel challenges

Four challenges assess missing output, repeated local IDs across blocks, a partial
block without a guard, and vector addition. Predictions are computed from each
starter model. A prediction is required before editing/running a guided starter, but
an incorrect prediction does not prevent learning or completion. Completion requires
safe correct outputs and a correct explanation. The transfer assessment checks five
lengths (1, 7, 17, 35, 65) at all four block sizes. The sandbox remains available.

The mapping visual derives thread membership and output targets from model index
events. It marks skipped/invalid accesses, duplicate targets and missing outputs.
Selecting a thread seeks its first source operation; it does not model scheduling.
Only editor choices persist; challenge answers/completion are session state.


## Hello, GPU

An opening PyTorch snippet and model-derived input/result vectors come before the
thread explanation. Five steps then introduce elementwise multiplication, thread-to-element indices,
block grouping, tail checks and Python-to-kernel orchestration. Each section has its own multiplier in
[-10, 10], selection and results. All five sections remain visible in reading order. All steps use inputs 1..5; block sizes are 5, 5, 4, 4 and 4 respectively.
The block-grouping example introduces the guarded eight-thread launch before the next
section lets the learner disable its check. The opening reference keeps its multiplier
of two; each following experiment has independent controls. The model rounds the
multiplier and results to FP32. It derives every card's input, output, global index,
block membership and local index from those values.

The bounds-check experiment has eight threads for five elements. With the check disabled,
threads 5..7 report invalid accesses without inventing out-of-range values. All valid
outputs still compute, but the run is marked unsafe. Other sections remain independently usable. The final step always
uses the guarded kernel. The download contains that kernel with the selected multiplier
and a separate C++ host harness; the PyTorch example does not compile or call it.

Run evaluates the teaching model on the CPU. The layout is a mapping diagram, not a
physical GPU arrangement or execution timeline. No parsing of arbitrary CUDA, GPU
execution or speed claim is made. The complete CUDA function, pointer definitions and
download appear in the final section, below threads, indices, blocks and guards.
Worked diagrams are generated from the same model during build, so all five examples
remain readable without JavaScript. Interaction never replaces or scrolls to an earlier section.
Chapter 1 generated programs are compiled and checked in GPGPU-Sim by the CUDA
workflow, using the same runner documented for desktop users. The five inputs and
eight launched threads exercise the guarded tail. Multipliers 2, −0.5, 0 and 3.25
are compared against independent CPU references; wrong, missing and nonfinite
outputs fail validation. No physical NVIDIA GPU execution has been validated.

## Book opening: devices, selection, layout and memory requests

`foundations-model.mjs` supplies each chapter 2–5 diagram, byte count and result.
`deviceJourney` models separate CPU and GPU allocations for five or eight FP32
values. Its three snapshots show a CPU-to-GPU copy, out-of-place multiplication
on the GPU, and a GPU-to-CPU copy. Earlier setup is included in each independent
example. Each copy duplicates N×4 value bytes; multiplication transfers zero bytes
between devices but allocates and writes a GPU output. Original buffers remain.
These counts exclude metadata, allocator overhead, physical bus traffic, unified
memory, caching and overlap. They are not timings.

`readTensor` uses a 5×5 row-major tensor containing 1..25. Every selected row or
column has five elements. Row r uses offsets 5r+i; column c uses 5i+c. Packing a
column copies its five values into offsets 0..4 of separate storage. Results use
FP32-rounded multipliers and products, matching the Hello teaching model.
The sector experiment delegates the five input addresses to `simulateLoad`,
assuming a 32-byte-aligned base for each original or packed allocation. It counts
one input read, excluding copy traffic and output stores. The selected five-thread
mapping is a teaching choice, not a claim about PyTorch's implementation.

Each section has independent controls, generated code, a local diagram and result.
Changing a control invalidates only that section. Update snapshots require all
section hooks to be registered and restore each section's controls and run state.
The offline suite exercises these pages in fresh offline tabs and across an actual
release update. Node checks cover copy independence, all rows/columns, FP32 results,
address sets, sector boundaries, equal useful byte counts and invalid settings.

`examples/book-opening.py` checks real PyTorch values, devices, transpose/view
aliasing and packed copies. CI runs its CPU path with PyTorch 2.5.1. CPU mode does
not test transfers; its CUDA path has not yet been validated on a GPU. It records
no timing or speedup claim.

## Chapter 1 reading progression

The five independent experiments now cover the operation, thread indices, launch
groups, bounds checks, then a complete CUDA function and launch. CUDA panels occur
only in the final experiment. Earlier selections explain indices in plain language.
The SM/block/warp diagram belongs to the scheduling lesson. Reference lookups follow
the complete kernel. The final input-count exercise uses launchPlan: four threads
per block, ceiling division for block count, and explicit surplus thread indices.
Existing multiplier, guard and selection IDs are retained for restart snapshots;
the new transfer exercise saves whether its explanation has been revealed.


The tensor-reading sequence spans three pages with the same unchanged `readTensor`
model. `reading.html` shows selection/results without storage offsets; `layout.html`
shows row/column views, memory strips and a packed copy; `requests.html` shows warp
participation and sectors. Each page supplies its own setup and stores experiments
under its own route. Repeated row/column IDs retain their meanings within that route.
The new pages are included in offline release generation and update restoration tests.

## Progressive continuation, chapters 6–12

The continuation uses the unchanged architecture and AI engines above. Each local
experiment fixes most settings and exposes only those needed for its question.
The build hides experiment results before scripts load. Run reveals the computed
result; changing settings invalidates only that example. With JavaScript disabled,
a labelled comparison disclosure offers the default worked result. Trace navigation is
omitted for summary-only capacity/storage comparisons. Existing engine tests
remain authoritative for numerical invariants; chapter checks additionally verify
configuration coverage and model-derived presentation. The earlier Lab numbers in
this document identify engine provenance, not the current chapter numbering.

## Final investigation (chapter 13)

The capstone reuses tiledMatmul unchanged with N=4, shared budget=128 bytes and
64 registers per output thread. Tile widths 1, 2 and 4 count 128, 64 and 32
input loads and 16 output stores. Their resident-block capacities are 8, 4 and 1.
The output is identical. These are per-SM resource bounds, not simulated schedules.
The transfer exercise uses N=8/T=2: 512 loads, 64 stores and capacity 4.
Complete Python downloads reuse matrixCode and CI checks C against the engine.
