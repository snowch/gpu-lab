# CUDA course sequence and explanation review

Reviewed 12 November 2026. This review supersedes the optional-placement decision
in [launch-from-input-review.md](launch-from-input-review.md).

## Learning and design criteria

Applied the [Course Builder skill](https://github.com/ericrisco/rsc-harness/blob/f3765d35e91690c0c7e511447da6cd0176ab38e0/skills/course-builder/SKILL.md)
and [UX Design skill](https://github.com/f0d010c/stark/blob/ff94e5b4e1c98d259f3cde9f806406c4528deed4/skills/ux-design/SKILL.md).
The learning outcome is to connect each browser concept to a CUDA program whose
parameters, storage requirements and launch contract the reader can explain.
Prerequisites must precede use; a later optional page cannot supply an essential
missing explanation. Exercises remain before reference implementations so the
code does not give away predictions. The design keeps the main path visible,
uses the shared code walkthrough and reserves disclosures for familiar kernels,
complete listings and the more advanced WMMA extension.

## Sequence decision

Chapter 2 keeps its focused PyTorch device-placement story. Chapter 3 follows the
same values through manual CUDA setup: input-derived element count, bytes,
matching output allocation, copies, launch dimensions, result collection and
cleanup. The reader then applies that contract to selection and later algorithms.
The nine-input exercise distinguishes element count, allocated capacity and
launched threads; its comparison stays closed until requested. The full program
and familiar Chapter 1 kernel are optional listings, not repeated required prose.

The existing `launch-from-input.html` route and completion key are preserved.
Navigation, overview, map memberships, references, downloads, recordings, captions,
slide decks and chapter labels use the fourteen-chapter order. Old chapter URLs
remain unchanged; only their displayed numbers move.

## Whole-course findings and fixes

| Chapter | Gap or dependency checked | Result |
| --- | --- | --- |
| 1 · Doubling | Count ownership and first bounds check | Existing early explanation remains before the complete kernel; Chapter 3 expands setup rather than delaying the meaning of `n`. |
| 2 · Devices | Missing bridge from framework-managed storage to manual CUDA | Normal continuation now leads to Chapter 3 without lengthening the device experiment. |
| 3 · CUDA memory | Input/output length, bytes, launch coverage and cleanup | Input vector supplies `n`; equal output count is explicitly specific to elementwise doubling. All allocation/copy/launch/cleanup steps are explained in source order. |
| 4 · Selection | Published chapter lacked CUDA indexing examples | Row/column functions follow the coordinate experiments; CPU-selected coordinates, 25-input/five-output capacities and valid ranges precede use. |
| 5 · Layout | View metadata versus a raw pointer was implicit | Explicit offset/stride/count contract, packing kernel and largest-input-address requirement; selected count is not total input storage. |
| 6 · Requests | Address arithmetic lacked its CUDA connection | Strided load function links threads to counted input sectors; output stores, caches and elapsed time remain separate. |
| 7 · Scheduling | “Instruction stream” preceded the definition; no CPU launch connection | Instruction definition moves to the opening. Two ordered launches explain what the CPU supplies and what hardware chooses. |
| 8 · Divergence | Branch model lacked an explained source implementation | Guarded positive/negative kernel; fixed one-operation negative path and compiler predication limits are explicit. |
| 9 · Reduction | Workspace, result capacity and barrier participation needed concrete code | Complete eight-input/one-output function precedes the race diagnostic, with all-thread barriers and fixed launch contract. |
| 10 · Matrix reuse | Direct and shared algorithms lacked source counterparts | Both complete functions, two-dimensional launch coordinates, zero-initialised private sums, shared arrays, two barriers and full-tile requirements. |
| 11 · Precision | Conversion versus tensor-core execution was unclear without APIs | Explained FP16 conversion; optional complete cooperative WMMA function with its shape, alignment and warp-participation contract. |
| 12 · Attention | Softmax vocabulary and online accumulator state needed explicit setup | Softmax defined in the opening. Online-update excerpt defines all symbols and initial states, with a complete reference function available. |
| 13 · Inference | Batch preceded its definition; cache append implied allocation growth | Batch defined before capacity formula. Reserved-storage append separates logical count, capacity and the FP32 example from later two-byte model assumptions. |
| 14 · Investigation | Timing guidance lacked concrete CUDA interval setup | Stream/event definitions precede the timing excerpt; completion, excluded costs, warm-up, repeats and correctness checks are explained. |

## Validation and limits

The same canonical sources generate visible CUDA functions and complete downloads.
The combined reference computes 215 outputs and compares them with independent
CPU references. Its attention reference materialises softmax instead of copying
the GPU online recurrence. CI additionally compares the emitted output with an
independently generated JavaScript reference. WMMA is compiled separately; no
physical tensor-core execution is claimed. Timing is an optional native-hardware
exercise, not a simulator performance result.

Browser coverage follows all fourteen chapter labels and previous/next links,
checks the preserved Chapter 3 completion mark, exercises later CUDA explanation
highlighting without changing copyable source, and reads static CUDA references
without JavaScript. Screenshots cover 360, 820 and 1440 pixel widths in light and
dark themes. The required reading-order review considers the preceding experiment,
new CUDA connection and following exercise together, including expanded WMMA.

Ten affected recaps were rebuilt from their existing narration with updated chapter
numbers using the pinned record-demo workflow (Kokoro ONNX, `af_heart`, speed 1.0).
The recording exporter checks slide overflow, media dimensions and cue timing.
Phoneme and automated ASR reports screen the regenerated narration; these are
machine checks, not human listening approval or learner testing.

The offline update review also found that an independently restored iframe could
overwrite the parent reader's map state. The reader now captures the map's open
node IDs and scroll position and reapplies them after the iframe's load/restore.
A browser regression injects an older child snapshot: it fails before this fix
and preserves the parent's disclosures and scroll afterwards. Offline test setup
also waits for the map controls to finish loading and verifies the expanded node
before beginning the update.
