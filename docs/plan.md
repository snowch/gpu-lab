# GPU Lab course plan

Copyright © 2026 Christopher Snow.

## Audience and outcome

The learner works with AI models and tensors, can read Python and array indexing, and wants
to explain what happens below a framework operation. No CUDA or computer-architecture
background is assumed. Introduce C/CUDA syntax when an experiment needs it.

The outcome: explain where the time and memory go in an AI operation, predict which changes
might help, and test those predictions against a model and eventually a real GPU.

## Teaching loop

Start from an AI operation; introduce the smallest mechanism that explains it; ask for a
prediction; run the model; change one variable; explain the difference; connect it to code.
Every visual value comes from model state. Counts and timing estimates must be visibly
different. Each lab records what its model leaves out.

## Architecture introduction

Before Lab 01, the course overview offers **Meet the GPU**, a five-minute map with
three progressively disclosed layers: CPU/GPU memory, SM internals, and kernel/block/warp
mapping. It introduces terms without requiring learners to memorise them. The map describes
NVIDIA CUDA relationships rather than a simulated chip or performance measurement. Lab 01
remains the first hands-on experiment. Native disclosure controls keep the map available
without JavaScript and in the offline course.

## Hands-on prototype

Before redesigning all eight labs, `lessons/kernel.html` compares an inspectable browser
model and real WebGPU execution on one task: repair vector scaling, pass several input
lengths, inspect addresses, and diagnose a missing guard or a local/global indexing
mistake. Source is built from a small explicit set of editable WGSL expressions. The
prototype now provides four assessed prediction–repair–explanation challenges, a selectable
workgroup/invocation/output map, configurable launch sizes and a vector-addition transfer task.
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
