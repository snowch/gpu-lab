> Historical review: chapter numbers below use the order at the time of review.
> See [the current CUDA and sequence review](cuda-learning-review.md) for the fourteen-chapter course.

# Explanation and setup responsibility review

Copyright © 2026 Christopher Snow.

Reviewed 12 November 2026, following the reader's question about who supplies `n`
in chapter 1. This is an editorial review, not learner testing or a guarantee
that no comprehension gaps remain. The authoring checklist remains authoritative.

## Scope and method

Read the course overview, all thirteen published chapters, the three extra-practice
pages, desktop/profiling appendices, the GPU map catalogue and all twelve recording
transcripts. Included opening and dynamic code explanations, setup, experiment
instructions, results, transfer exercises and documentation comparisons. Legacy
templates overwritten by the build are not additional published chapters.

For each example, trace the origin of values, dimensions, parameters and working
storage. Identify what the learner supplies, what the host program prepares, what
PyTorch arranges and what CUDA hardware provides. Check units, initial values,
allocation assumptions and whether controls change source or only the model.
Read the surrounding built sections rather than judging an isolated paragraph.

No dedicated design/UX or instructional-design skill was available in the session
catalogue. Apply the equivalent design, learning and reading-order checks in
`authoring-checklist.md`. Use the existing shared components and compact bullets;
do not introduce another walkthrough or hide essential setup in a reference link.

## Page-by-page findings

| Page | Finding and action |
| --- | --- |
| Overview | Prerequisites name Python indexing, loops and nested comprehensions; CUDA is introduced by the book. Browser/local execution and optional paths are distinguished. No added explanation needed. |
| 1 — Double five values | The guard named `n` without explaining who supplied it. Section 03 now declares `int n = 5;`, explains the CPU's count/allocation/copy responsibilities before the launch, and passes `n` as the third ordinary argument. Its visible walkthrough explains how every thread receives that value, independently of launch dimensions. Section 03 also introduces and defines the bounds check visibly before the complete kernel and regrouping exercise. Section 04 tests that known check at the last valid and first invalid indices, rather than introducing it again. Pointers carry no length, and guards trust the supplied count. The nine-input transfer explicitly supplies 9. Explain queued launches versus completion/read-back in the complete-program disclosure. |
| 2 — Storage | Checked original versus copied buffers, FP32 bytes, result allocation, `.to()` and `.cpu()` responsibilities. Existing text explains PyTorch's preparation and the CPU copy's wait. No change. |
| 3 — Selection | Checked construction of `x`, zero-based row/column notation, excluded endpoint, selection count and independence of dynamic examples. Existing source and explanations supply the inputs. No change. |
| 4 — Layout | Checked element/byte offsets, shared storage, strides, packed allocation, copy cost and already-contiguous behaviour. No change. |
| 5 — Requests | “The same five values” incorrectly suggested that row and column selected identical data. Say “five values” and distinguish equal useful-byte counts from identical values; packing preserves the selected column. Alignment, chosen thread mapping and excluded copy/store costs remain explicit. |
| 6 — Scheduling | Checked who chooses the teaching instruction stream, ready versus resident warps, initial readiness, load latency and issue order. Existing text states these assumptions and distinguishes them from PyTorch and measured hardware. No change. |
| 7 — Different calculations | Explain `values[:N]` beside the current source: it chooses the list prefix and hence the tensor length, rather than CUDA automatically choosing participating lanes. Existing path/unused-lane and `torch.where` boundaries remain intact. |
| 8 — Reduction | Define N as the selected input/thread count in the single-block algorithm before `N / 2`. Input writes, initial shared state, stage barriers and the diagnostic interleaving already explain the dependencies. |
| 9 — Matrix reuse | Name N before the load-count formula; make the chosen block/thread/output mapping explicit. State zero initial partial sums and retention across K phases. Distinguish direct loads at T=1 from shared tiles at larger widths. Explain programmer-declared shared workspace versus compiler-determined register use in optional resource discussion. |
| 10 — Precision | Checked construction of repeated A rows and all-one B, input conversion, zero initial CPU accumulators, FP32 rounding/order and hardware-selection limits. Existing code and prose explain these. No change. |
| 11 — Attention | Define token at first use; connect Q/K/V to the code's names and synthetic construction, with the role of learned transformations in a network. Explain `n, d`, define N before N² accounting, and state zero initial running totals and the first tile's scale. The optional recurrence now defines `exp` and the combined maximum. |
| 12 — Inference | Explain negative dimension numbering for `torch.cat(..., dim=-2)`: rows versus components. Checked that the small cache example receives Q/K/V directly and that the synthetic budget has separately stated dimensions, counts, rates and scope. No numerical or budget change. |
| 13 — Investigation | Checked input availability, block/tile/output mapping, register/shared/warp budgets, baseline comparison and need for separate hardware implementations. Existing text supplies these; the shared matrix walkthrough remains applicable. No change. |
| Kernel repair | State who supplies test length, scalar factor, second input and storage in the browser, and who performs setup in the downloadable CUDA program. Shared walkthrough now explains pointer, count and scalar parameters even when a guard is disabled. |
| Memory explorer | Here `n` counts outputs, not the extent of the strided input. Explain required output capacity and the largest input index `offset + (n - 1) * stride`; the guard alone cannot validate that input address. Correct full-warp wording for n=32. State the complete download supplies host setup. |
| Shared-memory banks | Replace “valid allocations” with exact host requirements: 32×32 FP32 input, 32 outputs, copies and one block of 32 threads. Explain the kernel's separately declared workspace and lack of a bounds check. Label the CUDA function as fixed padded/full-warp source; controls change the read model, not that function. |
| Desktop appendix | Checked environment creation, download locations, host/container paths, expected output supplied by the reader and CPU/simulator/hardware boundaries. Complete programs and setup are already provided. No change. |
| Profiling appendix | Checked capture setup, warm-up, synchronisation, source of grid/block metadata, missing fields, CPU/kernel correlation and measurement scope. Existing text distinguishes caller setup from recorded evidence. No change. |
| GPU map | Checked concept meanings, containment versus assigned work, programmer-managed versus hardware storage, and illustrative placement. It is a reference with chapter links, not another code exercise. No change. |
| Recordings | Read Inside an SM plus chapters 2–12 transcripts. Each is a recap of its parent with a declared small example, explicit input/count assumptions and a new-case explanation. No contradictory parameter/setup claim found; media and narration unchanged. |

## Reading-order and verification evidence

Review chapter 1 as grouping → launch/parameters and bounds-check introduction →
regrouping → boundary investigation → nine-input transfer. Check that the CPU's count and storage responsibilities are
explained in section 03 before its launch, without opening the complete kernel or
reading section 04. The bounds-check definition and `if (i < n)` explanation must
also precede the complete kernel in section 03, including when its disclosure is
closed. Section 04 applies the known check locally before its diagnostic variant.
Review requests as layout/warp/sector rules → equal-count comparison → boundary
case; reduction as four-input tree → N/2 extension → unsafe ordering; matrix reuse
as dot product → explicit mapping/zero sums → load-count derivation.

Review attention as source/dimensions/token → weighted result → N² storage →
zero-initialised tiled totals → optional recurrence → new case. Review the cache
append's axes, workshop setup/source, gather's guard/allocation surroundings and
the fixed shared-memory function beside its preceding read model and following
exercises. Existing experiments and numerical results are unchanged.

The PR records actual build/browser results and rendered review evidence at phone,
tablet and desktop widths in both themes, including relevant disclosures, changed
controls and no-JavaScript reading. Existing variant tests verify that walkthrough
fragments match the actual source and preserve copyable programs. No new CUDA
program or arithmetic model is introduced, so no new hardware-validation claim is
made. Automated checks and editorial inspection do not substitute for observing
newcomers using the course.

The existing CUDA introductory reference was checked directly: Triple Chevron
Notation explains launch dimensions, ordinary arguments and asynchronous launches;
Thread and Grid Index Intrinsics explains the built-ins. The guide does not define
our `n`. Its meaning and the host program's responsibilities are now taught locally.


## Follow-up: bounds-check introduction

The previous review missed a dependency: Section 03's complete kernel already
contained and explained `if (i < n)`, while Section 04 introduced Bounds check as
new. Move the definition and short explanation outside the Section 03 disclosure,
before that kernel. Label Section 04 as a boundary investigation and remove its
duplicate definition. Keep its correct-check excerpt, worked diagram and changed
condition together for local inspection. The CUDA source and numerical model are
unchanged.

Apply the same public
[Course Builder](https://github.com/ericrisco/rsc-harness/blob/f3765d35e91690c0c7e511447da6cd0176ab38e0/skills/course-builder/SKILL.md)
and [UX Design](https://github.com/f0d010c/stark/blob/ff94e5b4e1c98d259f3cde9f806406c4528deed4/skills/ux-design/SKILL.md)
criteria used for the input-derived launch practice: knowledge before use,
distinct introduction and application goals, visible essentials, and the shared
definition treatment. The PR records the built reading-order and responsive review
for Sections 02 → 03 → 04 → 05, including the complete kernel open and closed.
