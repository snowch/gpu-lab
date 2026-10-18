# Visual explanation review

Copyright © 2026 Christopher Snow.

Reviewed the introduction, every main lesson, the reduction workshop, code explanations and
closing exercises. The criterion was whether prose made the learner hold a layout, dependency,
sequence or flow in mind that the model could show directly. Existing useful visuals were retained.

| Page | Finding | Change |
| --- | --- | --- |
| Introduction | The roadmap already provides a clear sequence of links; no hidden mechanism needs a figure here. | Retain the overview and separate lesson pages. |
| 01 Tensor memory | Index stepping is visual, but shared storage and `contiguous()` still require mental reconstruction. | Add a linked view/copy diagram showing unchanged values and original versus packed offsets. Retain shape/stride grid and sector inspector. |
| 02 Scheduling | Cards show one cycle; following latency across cycles requires remembering earlier cards. | Add a computed swimlane timeline of issue, readiness and waits, linked to the current cycle. |
| 03 Divergence | Lane masks show participation, but prose alone explains where paths split and rejoin. | Add a condition/path/join graph with masks and operations from the trace. State that drawn branches are not parallel pipelines. |
| 04 Shared banks | Cards count queued words without showing the address-to-bank mapping or broadcast exception. | Add lane → word → bank paths and a busiest-bank word queue, including multiple readers of one word. |
| 04B Reduction | Memory snapshots hide the dependency tree connecting partial sums. | Add an input-to-partial-sum tree, current-stage highlighting and an explicit missing-ordering path for the unsafe case. |
| 05 Matmul | Tile matrices are already useful; resource residency remains a collection of numbers. | Retain computed matrices; add the same resident blocks consuming register, shared-byte and warp-slot pools. |
| 06 Precision | Converted numbers do not explain how formats distribute bits or why nearby values round together. | Add shared-scale sign/exponent/fraction bars and a local representable-value ruler for the selected input. Exact values use an identity conversion flow. |
| 07 Attention | Numeric cards hide where intermediates are stored and how old state is rescaled. | Add materialised-versus-online data-flow diagrams and denominator/numerator recurrence operands from the actual trace. |
| 08 Inference | Roofline bars are useful, but sequence phase and cache growth are abstract. | Retain bounds; add batch lanes, prompt/decode token views, cache lengths before/after the invocation, and ideal weight-read sharing. |

## Verification and limits

All numeric labels derive from model state. Experiment diagrams appear after prediction/inspection
so they do not reveal prediction answers in advance. The tensor view/copy illustration is a
foundational explanation and has a build-generated JavaScript-disabled fallback.

New model metadata records reduction contribution sets, attention recurrence operands, resource
capacities and cache lengths. Tests verify those quantities and invariants. Browser checks cover
diagram state changes and the full course at phone and desktop widths, in both themes.
The scheduling timeline scrolls locally to preserve legible cycle labels; it must not widen the page.

Layouts, routes and token boxes are explanatory representations, not physical floor plans or
execution timing claims. Reduction edges express dependencies. The unsafe diagram assigns no
numeric result to a data race. Precision rulers describe input conversion, not hardware MMA
accumulation. Attention traffic remains limited to the selected intermediate matrices. Inference
remains a synthetic analytical budget, not a measured transformer run.
