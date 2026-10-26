# Chapters 6–12: migration decisions

Copyright © 2026 Christopher Snow.

The learner journey determines the boundaries. The old route names remain stable,
but moving an existing lab into the contents does not make it a book chapter.

| Area | Retained | Rebuilt for the reader |
| --- | --- | --- |
| Scheduling | Tested ready/waiting scheduler and optional ownership map | One load wait before additional resident warps; work-normalised interpretation |
| Different paths | Sign/mask/output model | Uniform outputs, then mixed paths, then unused lanes; explicit `torch.where` boundary |
| Cooperation | Sum tree, contribution sets and unsafe diagnostic | Safe result first, size extension second, missing ordering last |
| Matrix reuse | Exact products and explicit input-load accounting | One dot product before a tile; resource capacity becomes optional context |
| Precision | FP16/BF16 conversion and sequential FP32 reference | Inspect lost input information before cancellation; specialised hardware is a later connection |
| Attention | Stable materialised and online references | Weighted output before storage counts and tiled processing |
| Inference | Synthetic cache/work/rate budget | Separate capacity, phase and batch questions, motivated by an actual small PyTorch cache operation |

Attention and inference are separate chapters because storing intermediates and
reasoning about a decoder invocation are different learning goals. Shared-memory
banks remain an optional lab after cooperation; it does not interrupt the first
sum or matrix example. Memory access and kernel repair also remain optional.

## Implementation and constraints

`continuation-view.mjs` uses the same pure models during static build and browser
interaction. Content is split by subject into three modules, with shared code,
definition and action styles. Every experiment has a unique identity, local
controls, a Run result and (only where meaningful) trace navigation. Changing a
setting invalidates that example alone. The update snapshot mechanism saves all
experiment states; URLs and existing opening-chapter controls are retained.

The scheduling model does not compute tensor outputs; the PyTorch example motivates
its chosen dependency stream. Divergence models explicit paths rather than a
compiler's translation of `torch.where`. Reduction uses four/eight values to teach
a power-of-two tree before irregular sizes. Matrix reuse counts explicit loads,
not physical traffic. Precision has a declared sequential accumulation order,
not tensor-core instruction execution. Attention computes in JavaScript doubles
while accounting for assumed FP32 storage. Inference uses a synthetic decoder
and ideal rates, not a named model's measured latency.

No new CUDA program or numerical engine is introduced. Existing CUDA validation
claims do not extend to the new PyTorch examples. CPU snippet checks can validate
values and API use; they cannot establish CUDA backend selection, GPU numerical
behaviour or performance.

## Review boundary

The rewrite received an independent teaching review. Automated checks exercise
model-derived figures, configuration changes, independent state, keyboard control,
mobile/tablet/desktop layouts, static content and offline restart. These are not
newcomer usability observations. Learner trials should check whether readers can
explain a dependency, predict a changed output/count, and distinguish a framework
operation from a chosen teaching implementation.
