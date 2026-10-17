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

## Modules

| Module | Operation and model | Exercise | State |
| --- | --- | --- | --- |
| 01 Reading a tensor | One warp, FP32 addresses and 32-byte sectors | Compare row/column reads and alignment | Working draft |
| 02 Keeping the GPU busy | Blocks assigned to streaming multiprocessors (SMs), ready/waiting warps | Change memory latency and resident-warps budget | Planned |
| 03 Taking different paths | Lane masks for branches and tail elements | Compare uniform and mixed branch conditions | Planned |
| 04 Sharing work | Reduction, shared-memory banks and barriers | Fix a race; compare bank mappings | Planned |
| 05 Reusing data | Naive then tiled matrix multiply, registers, shared memory | Count reuse; fit tiles to resource constraints | Planned |
| 06 Using tensor cores | Matrix instructions and explicitly chosen numeric formats | Compare precision and accumulation error | Planned |
| 07 Moving less data | Softmax, attention and fused intermediates | Count reads/writes with and without materialisation | Planned |
| 08 Explaining inference | Prefill, decode, KV-cache bytes, batching | Predict bottlenecks and compare with measured profiles | Planned |

## Implementation choices

Start with a portable browser model and optional CUDA files. No server, GPU account, analytics
or API key is needed. The first experiment addresses a familiar tensor indexing decision
before introducing SM internals. It is a standalone static prototype, not yet a copy of the
shared learning platform. Assess that integration before multiplying lesson-shell components.

Next: establish a documented teaching machine for the scheduling lab. Specify cycle semantics,
issue width, memory latency, residency limits and which architecture it is meant to resemble.
Do not turn architecture assumptions into constants labelled as real GPU measurements.

Before the CUDA path becomes a graded track, compile and run every example on a named GPU
and toolkit version; record outputs and compare simulator claims with appropriate profiler
metrics. Performance labs need warm-up, synchronisation, repeated measurements and explicit
measurement scope. No measured performance claim is made by this initial lab.
