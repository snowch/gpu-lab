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

## Architecture ownership diagrams (chapter 7)

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

Deterministic Q/K/V have length 8, 16 or 32, width four. The key fixture uses
`((2*i+j+4)%7-3)/2`, also used by the generated PyTorch example, so query zero
encounters larger scores in later tiles and visibly rescales non-empty totals. Full dense unmasked attention uses
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

`foundations-model.mjs` supplies the chapters 2 and 4–6 diagrams, byte counts and results.
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

Chapter 1 uses two guided demonstrations (calculation and thread mapping), a
worked four-thread block diagram followed by a regrouping prediction, a bounds
condition diagnosis, and complete-kernel trace consolidation. The final challenge
asks about nine inputs and four threads per block. Regrouping collects block count,
block/local position for input[4], and output invariance. `inspectLaunch` models
explicit block counts and `<` versus `<=`: with five inputs and eight threads,
`<=` makes only thread 5 access outside the arrays; 6–7 still skip. With nine inputs,
two four-thread blocks leave output[8] unwritten (null, not zero). Three blocks write
all outputs and skip 9–11. These are functional relationships, not timings.

Only the first guided demonstration has a multiplier control. Fixed worked examples
are labelled and retain their selectable diagrams; challenge answers stay hidden
until a prediction is checked or the reader opens a worked comparison. Hints and
comparisons are available without JavaScript. New challenge controls use new IDs;
old multiplier/guard/count controls are retired on snapshot restoration, old results
are not reused as answers, and new answer disclosures start closed. Current snapshots
preserve choices, reveals, repaired bounds and thread selections independently.
Generated five-input CUDA downloads and the optional SM appendix remain unchanged.


The tensor-reading sequence spans three pages with the same unchanged `readTensor`
model. `reading.html` shows selection/results without storage offsets; `layout.html`
shows row/column views, memory strips and a packed copy; `requests.html` shows warp
participation and sectors. Each page supplies its own setup and stores experiments
under its own route. Repeated row/column IDs retain their meanings within that route.
The new pages are included in offline release generation and update restoration tests.

## Progressive continuation, chapters 7–13

The continuation uses the unchanged architecture and AI engines above. Each local
experiment fixes most settings and exposes only those needed for its question.
The build hides experiment results before scripts load. Run reveals the computed
result; changing settings invalidates only that example. With JavaScript disabled,
a labelled comparison disclosure offers the default worked result. Trace navigation is
omitted for summary-only capacity/storage comparisons. Existing engine tests
remain authoritative for numerical invariants; chapter checks additionally verify
configuration coverage and model-derived presentation. The earlier Lab numbers in
this document identify engine provenance, not the current chapter numbering.

## Final investigation (chapter 14)

The capstone reuses tiledMatmul unchanged with N=4, shared budget=128 bytes and
64 registers per output thread. Tile widths 1, 2 and 4 count 128, 64 and 32
input loads and 16 output stores. Their resident-block capacities are 8, 4 and 1.
The output is identical. These are per-SM resource bounds, not simulated schedules.
The transfer exercise uses N=8/T=2: 512 loads, 64 stores and capacity 4.
Complete Python downloads reuse matrixCode and CI checks C against the engine.

## SM recording and value walkthrough

The beginner appendix uses an approved recording of the Chapter 1 value path:
1.0 → 2.0 and 2.0 → 4.0, with a third-thread transfer case 3.0 → 6.0. Registers
hold per-thread working values; shared arithmetic units return results to registers;
stores write the output array. Values and hardware roles are conceptual, not a
schedule or compiler trace. Caches, unit counts, latency and throughput are omitted.

The existing generated 64-input/two-warp readiness sequence remains unchanged in
Chapter 7’s optional hardware walkthrough. Its cursor is saved independently of
the chapter’s teaching scheduler. The video saves time and playback preferences,
restores paused, and retires old inspector snapshots without replaying them.

## CUDA connections and host workflow

Chapter 3 follows the original five-value host workflow using a CPU C++ vector.
It derives the element count from `input.size()`, derives bytes from element size,
allocates matching output storage for this elementwise operation, and distinguishes
launch coverage from valid indices. New CUDA excerpts for chapters 4–14 and their
complete downloads share `course-cuda-source.mjs`; `cuda-bridges.mjs` supplies their
launch/allocation contracts and `cuda-bridge-explanations.mjs` supplies the shared
walkthrough fragments. These reference implementations do not change browser model
numerics or claim to be PyTorch-generated source. The 215-output functional check
uses independent CPU references; WMMA is compiled separately. Physical GPU execution
and timing remain outside this review's validation.

## Part II: histograms

Eight non-negative integer category IDs map to four integer counters. Two logical
blocks of four inputs are used for private partials. Global counters and shared
partials start at zero; shared initialisation and completed updates are separated
by block barriers. Global mode counts eight atomic additions. Private mode counts
eight shared atomic additions and one global atomic addition per non-zero partial
bin. The trace accumulates contributions in input order for explanation, including
in private mode; it is not the actual instruction sequence. No scheduling, atomic
latency, physical memory traffic or runtime is simulated. The plain increment
race is described as a conflicting execution, never assigned a guaranteed output.

## Part II: scan

Flags select category zero from the histogram's eight IDs. The first four or all
eight are supported. A single block uses separate old/new snapshots at partner
distances 1, 2, 4, with collective ordering between stages. Inclusive results are
compared with independent prefix sums. Exclusive results shift right and insert
zero; output length is final offset plus final flag. The eight-input construction
performs 17 pair additions. Stage counts are not hardware cycles; integer flags
avoid floating-point reassociation and overflow in these examples. No multi-block
execution, CUDA compilation or performance is simulated.

## Part II: compaction

The eight category IDs select token positions 0–7, with zero, non-zero, all or none
as the selection rule. Integer keep flags are exclusively scanned before scatter.
The model reserves eight output slots conceptually and reports only the used prefix;
output count is last offset plus last flag. Forward/reverse inspection visits each
input once, records skipped writes explicitly and fills only distinct destinations.
Both schedules must match an independent stable filter, including empty selection.
This is a placement/dependency model, not a scheduler, allocator or GPU benchmark.
The genuinely empty-input rule is described separately from eight unselected items.

## Part II: synchronisation and progress

Three philosophers each need forks i and (i+1) modulo three, with exclusive
ownership. Each unfinished philosopher gets one opportunity per chosen round.
An opportunity acquires the next fork, waits, or (after holding both) eats once,
releases both and finishes. Lower-numbered-first acquisition completes; own-fork-first
acquisition reaches an ownership cycle. A round with no progress detects that deadlock.
The demo establishes no arbitrary-scheduler fairness or GPU scheduling result.
The separate four-thread barrier model has no early exits. All participation releases
the collective; the subset diagnostic assigns no numeric output or real-GPU failure
prediction. The two-block/one-resident-slot case is an explicit progress illustration,
not a claim about placement or capacity of a named GPU. No unsafe CUDA is executed.

## Part II: pipelines

A deterministic synthetic budget has one copy engine, one compute queue, two slots,
2/4 equal chunks, copy duration 2/4 arbitrary units and compute duration 3 units.
Operations are considered in input order. Copy starts after its engine and slot
are free; computation starts after its input copy and the previous compute finish.
Slot availability is the previous consumer's finish, not the previous copy's finish.
Serial mode also waits for the previous computation before the next copy. All
reported intervals/makespans are synthetic schedule values, not hardware times or
real-overlap predictions. The complete PyTorch program instead uses two independent
chunks/streams and no slot reuse; CPU checks only its reference path. The reusable-slot
CUDA event excerpt omits its actual consumer launch and host setup and is unvalidated.

## Part II: pattern investigation

Eight integer category IDs each belong to one of four bins. Counts-only mode returns
the histogram without constructing offsets, ranks or grouped output. Group mode
exclusively scans counts for bin starts and counts earlier same-category tokens for
within-bin ranks. Four per-category flag scans describe one source-level construction
of those ranks; the browser derives their mathematical values, not GPU instructions.
The sum of start and rank gives distinct destinations in 0–7. Every token is retained;
no capacity constraint, multi-device transfer or dropping is modelled. Empty bins
perform no writes. Stable grouping is checked against an independent per-category
filter of token identities. The opening PyTorch program uses stable argsort, without
claiming the model represents its implementation. No GPU execution, latency, physical
traffic or speedup is inferred from placement or operation counts.

## Part II visuals and narrated recaps

### Histogram contribution visuals and recap

The chapter's diagram uses the selected histogram step's integer counters and
highlights its token/category destination. Eight counter segments encode input
contributions, not latency. Completed per-block partials are separately labelled.
The optional narrated recap uses the same model for mixed/concentrated inputs,
with the atomic close-up restricted to the selected prefix. A question hides
partial counts and the merge total until the answer scene. Figures establish
counter ownership and conservation, never hardware timing or placement.

### Scan snapshots and recap

Each scan step retains its immutable old array and partner distance; the exclusive
construction retains its completed inclusive source and a shift marker. The
responsive figure shows completed read values, separately written values and the
focused position's operand relationship. It never reads a partially updated stage.
The recap uses the same staged model for eight inputs and a four-input transfer,
with question results hidden until comparison. The shift diagram identifies the
previous position and inserted zero. Last offset plus last flag gives output count;
prefix values need not be distinct. No GPU cycles, scheduling or timing are inferred.
