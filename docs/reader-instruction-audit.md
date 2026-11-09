# Reader instruction audit

Copyright © 2026 Christopher Snow.

Reviewed 9 November 2026 against the built book. This is an editorial and functional
review, not a study with learners. The [authoring checklist](authoring-checklist.md)
remains the authoritative guidance for future changes.

## Scope and method

Read the published prose, code explanations, exercise instructions and answer
comparisons across all 21 pages:

- Course overview.
- Chapters 1–13: doubling, device storage, selection, layout, memory requests,
  scheduling, divergence, reduction, matrix reuse, precision, attention, inference
  and the capstone.
- Appendices: desktop setup, profiling, inside an SM and the GPU map.
- Extra practice: memory access, kernel repair and shared-memory banks.

For each candidate, read the preceding, changed and following sections. Resolve the
instruction against the actual code, control labels, defaults and disclosure titles.
Keep valid local references and applied documentation questions; do not mechanically
remove words such as “compare”, “above” or “below”. Unpublished legacy templates are
outside this reader-facing audit.

## Corrections

| Mismatch | Correction |
| --- | --- |
| Shared CUDA explanations described block variables absent from a local-index expression, or an `f` suffix absent from arithmetic using a variable. | Explain only the syntax in the displayed fragment; describe the guard condition without promising a broken index is safe. |
| Formatted tensor examples lacked their input-range explanation. | Recognise the multiline `arange` call while preserving the displayed and copyable source. |
| Chapter 1 asked readers to change to an already-selected block size. Its simulation note still named the former card layout. | Start the prediction from the displayed eight-thread setting; name the thread table and block tiles. Explicitly return to doubling after the editable opening. |
| Chapter 2 described `device` as a selector although its opening uses `.to("cuda")`. | Name CPU and GPU as devices and explain storage independently of a missing argument. |
| Selection, packed-copy and request exercises left the comparison or verification settings implicit. | Ask about the count versus choice of inputs, predict packed offsets for column 1, and name the exact row-request controls. |
| Matrix and precision prose pointed vaguely to results or code hidden in disclosures. | Name the actual disclosure and, for generated results, say to run first. |
| Capstone recommendation referred to a nonexistent comparison; closing prose referred to “questions” that were outcomes. | Remove the dangling comparison and give a concrete next investigation. |
| Kernel-repair instructions promised a length-dependent failure without fixing block size. | Specify eight threads per block, the local index and enabled guard. Name lengths and the repaired configuration for last-thread inspection. |
| Setup and profiling exercises referred to “the first command” or guides “below”. | Name the CUDA file, multiplier, command section and profiler reference links. |
| Reference notes mentioned an absent `dtype`; map hints and workshop labels retained placeholder wording. | Explain inferred type, provide component-specific hints and label published extra practice and local execution accurately. |

No corresponding changes were needed in the overview, scheduling, divergence,
reduction, attention, inference, inside-SM, memory-access or bank-conflict activities.
Their local targets and questions were checked as part of the same review.

## Verification

Reviewed the revised pages at 390, 820 and 1440 pixels in both themes. Relevant states
included eight versus four threads per block; column 1 and its packed copy; row 1
crossing a sector boundary; Run followed by both matrix result disclosures; the
precision code disclosure; the local-index repair at block size 8; and nested map
components. Read surrounding sections in the built pages, including static setup
and reference guidance. No layout redesign or numerical-model change is involved.

Regression checks cover source-specific CUDA terminology, FP32-literal explanations,
formatted input ranges and preservation of copyable source. The full browser and
offline suites cover controls, hidden results, restoration, navigation and downloads.
CI additionally runs the supported CUDA examples in the pinned GPGPU-Sim toolchain;
that does not establish physical GPU performance.
