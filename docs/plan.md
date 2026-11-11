# GPU Lab course plan

Copyright © 2026 Christopher Snow.

## Audience and outcome

The learner works with AI models and tensors, can read Python and array indexing, and wants
to explain what happens below a framework operation. No CUDA or computer-architecture
background is assumed. Introduce C/CUDA syntax when an experiment needs it.

The outcome: explain where the time and memory go in an AI operation, predict which changes
might help, and test those predictions against a model and eventually a real GPU.
A second outcome is to find and apply the relevant official PyTorch or CUDA reference
to check an API argument, an indexing rule or a synchronisation requirement.

Author and review chapters with [the authoritative checklist](authoring-checklist.md).

## Teaching loop

Start from an AI operation; introduce the smallest mechanism that explains it; ask for a
prediction; run the model; change one variable; explain the difference; connect it to code.
Each published chapter/lab ends with annotated References and Use the documentation
sections. Short fixed snippets reconnect questions to the example. Early tasks link to
the exact API/guide section; later tasks start at the official guide and ask the learner
to find it, then apply the result to their experiment. Native “Compare your answer”
disclosures provide a local explanation and, for independent tasks, the direct section
link. They are optional reading exercises, with no score or extra editor controls.
External documentation opens in a labelled new tab so the experiment stays in place.
Questions and comparisons remain available offline; official sites require internet.
Every visual value comes from model state. Counts and timing estimates must be visibly
different. Each lab records what its model leaves out.

## Book opening: chapters 1–5

Build the book from familiar operations: see the operation, predict, run, change
one thing, explain, inspect the code, and apply the idea to a new case. Keep each
experiment and visual beside its own explanation in a continuous downward flow.

1. **How does a GPU double five values?** (`hello.html`): open with the short PyTorch
   example and five values. Combine the calculation/thread demonstrations in one
   compact input-to-output table. Add block boundaries with small thread tiles and
   one shared, selectable index substitution. Keep five short sections in a continuous
   reading flow: threads, blocks, launch settings, bounds checks and a nine-input case.
   Put launch syntax and an optional complete kernel immediately after grouping;
   define launch and kernel before using them. Avoid a second full worked trace at
   the end. Retain all three reasoning challenges: regroup four/eight threads per
   block, diagnose an off-by-one condition after teaching the correct guard, then
   choose enough blocks for nine inputs. Mark unknown outputs until Run and
   distinguish missing work from unsafe access. Introduce an SM beside blocks as
   shared hardware; defer warps, scheduling and shared memory to later lessons.
   Desktop/profiling extensions and documentation practice remain explicitly optional.
   Preserve earlier thread selections, predictions and manual completion on restart.
2. **Where are tensor values stored?** (`devices.html`): follow the same five inputs
   through a CPU-to-GPU copy, multiplication in GPU memory, and a result copy back.
   Each action has its own setup, prediction prompt, control, diagram and result.
   Compare five/eight-input copy sizes and change the multiplier. Explain allocation
   separately from transfers; retain the original tensors in the diagram.
3. **How do we select values from a tensor?** (`reading.html`): apply familiar shape and
   slicing notation to a 5×5 tensor. Select rows and columns and multiply five values.
   Keep memory offsets and warp terminology for the following chapters.
4. **How are tensor values arranged in memory?** (`layout.html`): follow the same
   values into a memory strip, introduce views and strides, then compare a column
   with a packed copy. Transpose is optional practice after those ideas.
5. **How do threads read tensor values?** (`requests.html`): introduce a warp and its
   lanes visually, then sectors. Compare five-value row, column and packed reads;
   finish with a row crossing a sector boundary. Counts are not timing claims.

The optional PyTorch companion runs on a CPU for value/layout verification or on a
CUDA device to follow the transfers. Browser models are clearly labelled; neither
browser counts nor CPU validation are presented as GPU performance evidence.
Reference exercises introduce `torch.tensor`, `Tensor.to`, indexing and strides
beside the operations that need them. Version guidance remains beside the first
lookup task.

## Continuing the journey: chapters 6–13

All thirteen chapters are published working drafts in the common book navigation.
The remaining chapters reuse tested numerical engines and replace the legacy
single-dashboard teaching flow with local, independent experiments:

6. **What runs while a warp waits for data?** (`scheduling.html`): follow one load
   dependency, then compare ready warps. Introduce resident work and issue slots
   when needed. More warps also add work; model cycles are not hardware timings.
7. **What if lanes need different calculations?** (`divergence.html`): begin with
   uniform signs, then mixed masks, then five active inputs. Distinguish a chosen
   branch model from PyTorch's evaluation of tensor expressions in `torch.where`.
8. **How do threads add values together?** (`reduction.html`): start with a safe
   four-input sum, extend to eight, then diagnose missing ordering. Shared memory
   and barriers serve a visible dependency; no invented result is given for a race.
9. **How can matrix multiplication reuse its inputs?** (`matmul.html`): build one
   dot product before sharing tiles. Compare equal outputs and explicit loads.
   Resource trade-offs are optional; they do not crowd the reuse experiment.
10. **What changes when matrix inputs use fewer bits?** (`tensor-cores.html`):
    inspect conversion before FP32 accumulation. Connect this to cooperative
    matrix hardware without representing the sequential model as tensor-core execution.
11. **How can attention use less memory?** (`attention.html`): scores, weights and a
    weighted result come before full-intermediate accounting and online tiles.
    The recurrence is optional after its purpose is understood.
12. **What limits an inference step?** (`inference.html`): a real small
    cache example motivates separate cache-capacity, phase-budget and batch-reuse
    experiments. Synthetic rates produce lower bounds, never fabricated timings.

13. **Investigate a matrix multiplication** (`putting-it-together.html`): use the tested 4 × 4
    matmul engine as a final independent investigation. Establish a baseline,
    compare reuse with per-block resources, defend a hypothesis, then design a
    hardware measurement. Finish with PyTorch profiling, CUDA/Triton and local
    execution paths. No new timing or GPU execution is claimed.

The optional memory-access lab, shared-memory banks lab, repair workshop and GPU
map remain supplementary resources. Existing chapter URLs stay valid. Each new
chapter ends with a transfer question, references and applied documentation tasks.
See [migration decisions](chapter-migration.md) for the reuse/rewrite rationale.

Automated checks cover functions, interactions, layout and offline restoration.
They do not establish learner comprehension. Newcomer observations remain needed:
can readers trace a dependency, explain a changed result, and separate their
PyTorch choices from this book's illustrative implementation choices?

## Inspecting real PyTorch launches

The optional `profiling.html` appendix connects chapter 1's multiplication to a
real PyTorch CUDA trace. Readers capture the operation, view the timeline and
inspect grid/block dimensions, with Nsight Systems/Compute as follow-up tools.
It requires physical NVIDIA hardware for capture and is separate from the browser
models and functional GPGPU-Sim checks. A standard-library reader can inspect a
saved trace on a CPU-only machine; absence of kernel events or dimensions remains
explicitly unknown. Chapter 1 and the final chapter link to this guide.

## Interactive GPU map

The **GPU map** replaces Meet the GPU at its stable `lessons/meet-gpu.html` URL.
A persistent header toggle opens it across the reading area, hiding the contents. Close map or Escape returns to the unchanged
chapter, scroll position and experiment. The map keeps its expanded components
when reopened; direct map links also use the full width. The overview introduces
this reference in one paragraph; it is not an additional prerequisite chapter.

One expandable hardware diagram starts with the whole system. Readers open
GPU device → GPU chip → SM → block → warp → lane while the surrounding structure stays visible.
Memory and execution concepts link to their chapters; worked tensor and AI operations
stay in the chapters rather than being repeated in another map tab.
The map has a
compact heading and instruction, without an appendix introduction, duplicate concept
list, chapter pager or documentation exercises. Chapter links lead to that teaching material.
SMs stay side by side when the GPU panel has enough space, including when expanded;
narrow layouts stack them without reducing the text size.

Native disclosures are rendered at build time, so the complete map works without
JavaScript. Scripts add Back and Reset. Chapter links sit inside each component; the map has
no chapter filter or chapter highlighting.
Expanded components persist in the URL and across offline app
updates; old concept links still reveal their corresponding component. The map is available offline after the book download.

Relationships distinguish ownership, grouping, scheduling and data movement. This
is neither a chip floor plan nor a promise of simultaneous execution. Numerical
experiments and the detailed ownership diagram remain beside their chapters.

## Hands-on prototype

Before redesigning all eight labs, `lessons/kernel.html` compares an inspectable browser
model and downloadable CUDA C++ programs on one task: repair vector scaling, pass several input
lengths, inspect addresses, and diagnose a missing guard or a local/global indexing
mistake. Source is built from a small explicit set of editable CUDA expressions. The
prototype now provides four assessed prediction–repair–explanation challenges, a selectable
block/thread/output map, configurable launch sizes and a vector-addition transfer task.
It is optional and separately labelled; it does not replace Lab 01 or promise
CUDA compilation or hardware timing. Evaluate learner control and feedback before
choosing a larger execution platform.

## Modules

| Module | Operation and model | Exercise | State |
| --- | --- | --- | --- |
| 01 Reading a tensor | One warp, FP32 addresses and 32-byte sectors | Compare row/column reads and alignment | Working draft |
| 02 Keeping the GPU busy | One teaching SM with ready/waiting resident warps | Change load latency and resident count; step the scheduler | Working draft |
| 03 Taking different paths | Lane masks for branches and tail elements | Compare uniform and mixed branch conditions | Working draft |
| 04 Sharing work | Banks, broadcasts, padding; tree reduction with barrier and unsafe interleaving | Compare bank mappings; diagnose an unwritten read | Working draft, including 04B workshop |
| 05 Reusing data | Computed naive/tiled products and teaching resource budgets | Count reuse; fit tiles to shared/register limits | Working draft |
| 06 Using tensor cores | WMMA concepts, FP16/BF16 rounding, FP32 accumulation | Inspect input conversion and cancellation | Working draft |
| 07 Moving less data | Stable materialised and online tiled attention | Trace normalisation; count intermediate traffic | Working draft |
| 08 Explaining inference | Prefill/decode, KV bytes, batching and roofline bounds | Predict dominant bounds; optionally compare a measurement | Working draft |

## Implementation choices

Start with a portable browser model and optional CUDA files. No server, GPU account, analytics
or API key is needed. The first experiment addresses a familiar tensor indexing decision
before introducing SM internals. It is a standalone static prototype, not yet a copy of the
shared learning platform. Assess that integration before multiplying lesson-shell components.

The scheduling teaching machine is now specified in `docs/model.md`: one issue slot, round-robin
selection and fixed load latency. It models no particular GPU. The three new pages share a static
renderer and experiment controls to avoid duplicating the shell. Integrating the external learning
platform remains a separate decision; this implementation keeps the prototype dependency-free.

All eight main labs and the reduction workshop now have computed experiments. Resource-limited
residency is introduced through explicit budgets in Lab 05. The introduction remains a separate
landing page; every lab has its own URL. This is a complete first teaching pass, not a complete
GPU simulator. Future extensions can add block placement, compiler-produced listings, real
hardware measurements and production-kernel implementations without claiming those exist today.

Before the CUDA path becomes a graded track, compile and run every example on a named GPU
and toolkit version; record outputs and compare simulator claims with appropriate profiler
metrics. Performance labs need warm-up, synchronisation, repeated measurements and explicit
measurement scope. No measured performance claim is made by this initial lab.

## Optional recordings and hardware depth

`inside-sm.html` is a short, full-width video appendix linked from Chapter 1 as
“Watch: inside an SM · 3½ minutes”. The approved narrated deck follows a load,
register multiplication and store, then contrasts separate thread values with
shared execution hardware. Native playback controls, English captions, a generated
transcript and video/PDF downloads work without a custom player or installation.
The return link preserves the originating chapter’s inputs, result and position;
return visits and release updates restore the video position without autoplay.

Chapter 2 offers an optional narrated recap after its new-case exercise, at
`devices-video.html`. Eight model-derived slides follow CPU and GPU buffers,
separate copies from calculation, and apply the byte count to eight results.
The recap reuses native playback, captions, transcript, PDF/video downloads,
parent-state return and offline update restoration. The separate-memory example
counts tensor payloads and makes no timing claim. Rebuild instructions are in
`assets/media/devices/README.md`.

Chapter 3 follows with `reading-video.html`, after its explanation exercise.
Eight slides connect row/column coordinates and colon syntax to selected inputs
and elementwise results. A new column-3 question checks interpretation. The
recording preserves Chapter 3's distinction between logical coordinates and the
storage positions introduced next. Playback, downloads, saved-state return and
offline coverage match Chapter 2. See `assets/media/reading/README.md`.

Chapter 4 adds `layout-video.html`, following its explanation exercise. Eight
slides distinguish values, element offsets and byte offsets; follow strides in
shared storage; then compare a packed copy and an already-contiguous row. The
new column-3 copy question checks new offsets and payload while preserving the
original values. The same playback, transcript, downloads, return and offline
features apply. See `assets/media/layout/README.md`.

Chapter 6's optional narrated recap follows one and two resident warps through
loads, waits and instruction issue. Its comparison keeps added work visible, and
a new latency question tests readiness before revealing the answer. It reuses the
common captions, transcript, downloads and offline player without changing the
scheduler. See `assets/media/scheduling/README.md`.

The interactive two-warp readiness walkthrough is local to Chapter 6, behind an
optional disclosure reached from its hardware overview. Chapter 6 retains its
visible core diagram and teaching-scheduler experiments. The optional trace keeps
its own saved cursor; moving it has not changed its values or event semantics.
No instruction timing, execution-unit count or captured PyTorch trace is implied.

Chapter 7's optional recap follows uniform, mixed and rare arithmetic paths, then
distinguishes other-path lanes from positions without input. A 17-input question
applies the mask rule before the answer. It keeps the positive-first teaching
order and arithmetic-only scope explicit, with common playback and offline
features. See `assets/media/divergence/README.md`.

Chapter 8 offers an optional narrated recap after its transfer exercise, at
`reduction-video.html`. Eleven model-derived slides follow the four-input tree,
block barriers and one unsafe read-before-write interleaving, then ask about eight
threads. The page reuses native playback, English captions, a source-generated
transcript, PDF/video downloads and a return link preserving chapter state.
Offline coverage includes playback, range seeking and paused restoration across
updates. See `assets/media/reduction/README.md` for the reproducible media workflow.

Chapter 9 offers a matching optional recap at `matmul-video.html`, after its
transfer exercise. Ten model-derived slides connect one dot product to shared
input tiles, reuse across output rows and columns, and private partial sums kept
across K phases. A new 8 × 8 case checks phase loads and the scope of sharing.
Counts describe the teaching algorithm, excluding caches and GPU timing. The
recording has the same accessible playback, downloads, return-state preservation
and offline update coverage. See `assets/media/matmul/README.md` for its sources.

Chapter 5's optional recap follows five model-derived input reads into aligned
32-byte sectors. It compares row and column reads with a packed copy, includes a
neighbouring row crossing a sector boundary, and asks about a different row before
revealing its groups. Useful bytes, covered bytes and physical traffic remain
separate. Packing and output stores are outside the input-load count. Captions,
transcript, slides, downloads and offline state restoration use the common player.

Chapter 10's optional recap compares converted and original-input FP32 running
sums through cancellation, then tests very small and exactly representable inputs.
It separates number format, accumulation and hardware execution. All displayed
values come from the existing precision model; common playback, captions,
transcript, downloads and offline return checks apply. See
`assets/media/tensor-cores/README.md`.

Chapter 11's optional recap follows one weighted component, full intermediate
reads/writes, online totals and later-maximum rescaling. A four-key tile question
applies the same recurrence while changing the single-query scratch count. The
chapter and recording share the revised key fixture; both retain the distinction
between JavaScript double arithmetic and assumed four-byte storage. Common
playback and offline features apply. See `assets/media/attention/README.md`.

## Course recording review

Short recaps can support recall after a chapter's independent exercise. Each
should trace one example and end with a fresh explanation question. This review
uses the current thirteen-chapter book; recommendations below are future work.

| Chapter | Recording goal | State |
| --- | --- | --- |
| 1 | Trace five inputs through blocks, global indices and bounds checks. | Core recap recommended; the existing SM video supplies separate hardware depth. |
| 2 | Follow CPU/GPU copies and distinguish transfer payload from calculation. | Recap included. |
| 3 | Interpret row/column coordinates and colon syntax, then follow selected outputs. | Recap included. |
| 4 | Connect views, strides, offsets and packed storage while preserving values. | Recap included. |
| 5 | Group the same five reads into sectors; distinguish useful bytes, alignment and covered regions. | Recap included. |
| 6 | Narrate a waiting warp and another ready warp on the declared teaching timeline. | Recap included. |
| 7 | Follow changing active masks and distinguish other-path lanes from unused tail positions. | Recap included. |
| 8 | Trace shared-memory writes, barriers and the reduction tree. | Recap included. |
| 9 | Follow shared input reuse and partial sums across K phases. | Recap included. |
| 10 | Trace input conversion before accumulation, including cancellation and a range-sensitive case. | Recap included. |
| 11 | Explain weighted outputs, then tile updates and rescaling of both running totals. | Recap included; later larger scores now rescale retained totals. |
| 12 | Connect KV payload, prefill/decode and batch reuse; distinguish capacity, work and ideal time bounds. | Recommended. |
| 13 | Model how to form a hypothesis, check outputs and choose a fair measurement. | Optional investigation guide; preserve the learner's independent recommendation. |

Chapter 11 now uses a shifted deterministic key fixture in both the browser
model and PyTorch source. With two-key tiles, query zero encounters later larger
scores and both non-empty retained totals visibly rescale. Every query output
is checked against the materialised reference for the same inputs. The recurrence,
byte-accounting scope and implementation/timing qualifiers remain unchanged.

Chapter 5's recap should include the row crossing a sector boundary as well as a
packed column. Chapter 6 must retain its explicit scheduler assumptions; Chapter
7 must label its chosen path order. Chapters 10–12 need the same separation of
arithmetic/storage models from measured GPU execution as their parent lessons.
