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

1. **One operation, many numbers** (`hello.html`): open with the three-line PyTorch
   example and five values. Introduce threads, indices, blocks and bounds checks
   as needed; assemble the CUDA kernel at the end. Show no CUDA fragments before the complete function and its launch. SMs, warps
   and shared memory belong in later mechanism lessons; the ownership diagram lives
   in the scheduling lab. Finish with an input-count prediction exercise and the optional repair workshop.
2. **Where do the numbers live?** (`devices.html`): follow the same five inputs
   through a CPU-to-GPU copy, multiplication in GPU memory, and a result copy back.
   Each action has its own setup, prediction prompt, control, diagram and result.
   Compare five/eight-input copy sizes and change the multiplier. Explain allocation
   separately from transfers; retain the original tensors in the diagram.
3. **How do we select values from a tensor?** (`reading.html`): introduce shape and
   slicing with a 5×5 tensor. Select rows and columns and multiply five values.
   Keep memory offsets and warp terminology for the following chapters.
4. **How are tensor values arranged in memory?** (`layout.html`): follow the same
   values into a memory strip, introduce views and strides, then compare a column
   with a packed copy. Transpose is optional practice after those ideas.
5. **How do threads read those values?** (`requests.html`): introduce a warp and its
   lanes visually, then sectors. Compare five-value row, column and packed reads;
   finish with a row crossing a sector boundary. Counts are not timing claims.

The optional PyTorch companion runs on a CPU for value/layout verification or on a
CUDA device to follow the transfers. Browser models are clearly labelled; neither
browser counts nor CPU validation are presented as GPU performance evidence.
Reference exercises introduce `torch.tensor`, `Tensor.to`, indexing and strides
beside the operations that need them. Version guidance remains beside the first
lookup task.

## Continuing the journey: chapters 6–12

All twelve chapters are published working drafts in the common book navigation.
The remaining chapters reuse tested numerical engines and replace the legacy
single-dashboard teaching flow with local, independent experiments:

6. **How can work continue during a wait?** (`scheduling.html`): follow one load
   dependency, then compare ready warps. Introduce resident work and issue slots
   when needed. More warps also add work; model cycles are not hardware timings.
7. **What if lanes need different calculations?** (`divergence.html`): begin with
   uniform signs, then mixed masks, then five active inputs. Distinguish a chosen
   branch model from PyTorch's evaluation of tensor expressions in `torch.where`.
8. **How do threads combine their results?** (`reduction.html`): start with a safe
   four-input sum, extend to eight, then diagnose missing ordering. Shared memory
   and barriers serve a visible dependency; no invented result is given for a race.
9. **How can matrix multiplication reuse its inputs?** (`matmul.html`): build one
   dot product before sharing tiles. Compare equal outputs and explicit loads.
   Resource trade-offs are optional; they do not crowd the reuse experiment.
10. **What changes when matrix inputs use fewer bits?** (`tensor-cores.html`):
    inspect conversion before FP32 accumulation. Connect this to cooperative
    matrix hardware without representing the sequential model as tensor-core execution.
11. **How can attention store less?** (`attention.html`): scores, weights and a
    weighted result come before full-intermediate accounting and online tiles.
    The recurrence is optional after its purpose is understood.
12. **What limits an inference step?** (`inference.html`): a real small
    cache example motivates separate cache-capacity, phase-budget and batch-reuse
    experiments. Synthetic rates produce lower bounds, never fabricated timings.

The optional memory-access lab, shared-memory banks lab, repair workshop and GPU
map remain supplementary resources. Existing chapter URLs stay valid. Each new
chapter ends with a transfer question, references and applied documentation tasks.
See [migration decisions](chapter-migration.md) for the reuse/rewrite rationale.

Automated checks cover functions, interactions, layout and offline restoration.
They do not establish learner comprehension. Newcomer observations remain needed:
can readers trace a dependency, explain a changed result, and separate their
PyTorch choices from this book's illustrative implementation choices?

## Interactive GPU map

The **GPU map** replaces Meet the GPU at its stable `lessons/meet-gpu.html` URL.
A persistent header toggle opens it across the reading area, hiding the contents
and highlighting the current chapter. Close map or Escape returns to the unchanged
chapter, scroll position and experiment. The map keeps its expanded components
when reopened; direct map links also use the full width. The overview introduces
this reference in one paragraph; it is not an additional prerequisite chapter.

One expandable hardware diagram starts with the whole system. Readers open
GPU → SM → block → warp → lane while the surrounding structure stays visible.
Memory and execution concepts link to their chapters; worked tensor and AI operations
stay in the chapters rather than being repeated in another map tab.
The map has a
compact heading and instruction, without an appendix introduction, duplicate concept
list, chapter pager or documentation exercises. Chapter links lead to that teaching material.
SMs stay side by side when the GPU panel has enough space, including when expanded;
narrow layouts stack them without reducing the text size.

Native disclosures are rendered at build time, so the complete map works without
JavaScript. Scripts add chapter highlighting, Back and Reset.
Expanded components persist in the URL and across offline app
updates; old concept links still reveal their corresponding component. Highlights use
text as well as colour. The map is available offline after the book download.

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
