# Whole-book learning-flow audit

Copyright © 2026 Christopher Snow.

Reviewed on 2026-11-02, starting from `f19dd3f`. This is the record of the review,
not another authoring checklist. Future edits use the required reading-order review
in [the authoritative checklist](authoring-checklist.md), linked from `AGENTS.md`.

## Scope and method

Read the published sequence in order: overview, chapters 1–13, GPU map, desktop
appendix, repair workshop, optional banks lab and retained memory-access explorer.
Included opening code walkthroughs, experiment instructions, result labels, transfer
questions and documentation exercises. Historical lesson templates overwritten by
the build were not treated as additional published chapters.

For each sequence, checked what the reader knows from the prerequisites and earlier
chapters; where a mechanism gets its purpose and definition; what an instruction
points to; and what is available before Run, after Run or behind a disclosure.
Kept preview headings distinct from instructions that require an unexplained term.
Resolved vague references by naming their targets, rather than banning ordinary
words such as “diagram”. Kept labelled worked answers separate from fresh predictions.

## Coverage and corrections

| Page | Review outcome |
| --- | --- |
| Overview | Removed the opening navigation instruction’s assumption that a newcomer already knows SMs, blocks and warps. The map remains optional, with chapter links for explanations. |
| 1 — Double five values | Rechecked calculation → thread definition → numbered examples → cards after the earlier repairs. Explained cooperation in the block definition using a workspace and waiting, without introducing shared-memory jargon. Named thread cards in the final simulation note. |
| 2 — Tensor storage | Reviewed source walkthrough, device/storage/FP32 definitions, copy inputs and CPU/GPU maps. Existing five/eight-value cases and copying versus computation progression remain intact. |
| 3 — Selection | Removed “view” from the shared opening-code explanation before chapter 4 teaches it; explained that selected values stay in existing storage. Rechecked row/column controls and the new-row prediction. |
| 4 — Layout | Removed a reference to “your choice of view” before its definition. Rechecked value/offset distinction, memory-strip directions, copying and the optional transpose question. |
| 5 — Requests | Replaced unexplained instruction-issue wording with a read. Explained that Run reveals sector cards. Named the five-thread warp figure in its documentation question. |
| 6 — Scheduling | Removed “issuing” from the introductory latency definition; introduced the scheduler before relying on it. Named warp cards and when they appear. Replaced an ambiguous “the block with two warps” instruction: all three illustrated blocks have two warps. |
| 7 — Different calculations | Explained separate positive/negative calculations before using “path”. The first experiment heading now starts with input signs. Named the disclosure containing the current source and the lane cards revealed by Run. |
| 8 — Adding values | Removed reduction/partial-sum jargon from the opening before those terms are explained. Defined a shared word where the model first uses it. Rechecked writes → barriers → partner reads and the unsafe-ordering exercise. |
| 9 — Matrix reuse | The first dot-product prediction lacked its smaller 4 × 4 inputs before Run: added the model-derived first row and column. Removed “tile size” from the dot-product stage before tiles are introduced. Named the actual Next step control. |
| 10 — Fewer input bits | Treated the previously demonstrated near-one conversion as inspection. For the new small-value prediction, explicitly directed the reader to open the current source and find the magnitude first. Rechecked conversion → accumulation → tensor-core distinction. |
| 11 — Attention | Explained a token at first use; described all-key participation and no random weight removal without assuming mask/dropout terminology. Named the score/weight table and the weighted-result card, and said they appear after Run. Rechecked running totals and optional recurrence. |
| 12 — Inference | Explained causal masking and distinguished model-managed KV tensors from hardware caches. Defined payload and bandwidth, added the bridge from cache capacity to time budgets, and avoided assuming prefill/decode in the opening lead. |
| 13 — Final investigation | Defined the synthetic warp-slot budget beside its assumptions. Rechecked the visible baseline inputs, fixed-output comparisons, resource trade-off and proposed hardware measurement. |
| GPU map | Replaced unexplained “resident work” hints with “assigned work”, defined residency inside the SM panel, and explained queued CPU/GPU work without assuming asynchronous-execution terminology. Containment and chapter links remain intact. |
| Desktop appendix | Explained containers and Docker beside setup, with an installation link. Removed the supplied answer from the multiplier-3 prediction; the reader supplies their own expected array before testing it. |
| Repair workshop | Made chapter 1 the explicit starting point. Moved challenge prediction after the starter source; starting a challenge focuses that source first. Corrected thread wording and removed the stale “editor below” instruction. |
| Shared-memory banks | Defined word and service round before conflicts/broadcasts rely on them. Distinguished the existing full-warp worked cases from a new eight-lane prediction. Corrected the documentation answer’s stale “reduction workshop below” reference to chapter 8. |
| Memory-access explorer | Named the tensor-pattern buttons. Labelled previously shown contiguous/column sector counts as inspection, then directed new predictions to a changed alignment. Rechecked stride/offset, warp/lane and sector explanations. |

## Cross-course finding: floats displayed as integers

The opening source stores `[1.0, 2.0, 3.0, 4.0, 5.0]`, but the worked prose said
“Thread 0 reads 1 … writes 2”, and cards and feedback also dropped `.0`. These
were whole-valued floating-point data, not an integer tensor. The mixed notation
hid the distinction from the reader. This issue was added during the audit after
the reader identified it in both the source comparison and the worked sentence.

- Introduce a float beside the first complete example, including why `1.0` remains
  floating-point and why multiplying that tensor by the scalar `2` preserves its type.
- Use floating-point notation for tensor inputs, outputs, partial sums and worked
  narrative values across the opening chapters and continuation experiments. Include
  kernel inspection, the retained memory diagrams and static answer comparisons.
- Keep thread/lane IDs, array indices, dimensions, offsets, counts, bytes and budgets
  in integer notation. A shared-memory **word index** is not a tensor data value.
- Preserve existing rounding in precision/attention tables; keep the opening browser
  exercises’ actual calculated values. This is presentation, not conversion to a
  new dtype or a change to arithmetic. Python/CUDA source stays unchanged.
- Check first-load, Run, changed multiplier, selection and restored-result feedback.
  The value formatter and thread-card checks cover fractional values, whole-valued
  floats, zero, small values and unrevealed outputs.

The authoritative checklist now includes this distinction for future edits, as part
of both code/visual review and the required reading-order review.

## Verification and limits

- Run the normal unit/build and full browser checks, including static/no-JavaScript
  content, phone/tablet/desktop, both themes, independent results and saved state.
- Check focused rendered reading order and pre-run input availability; exercise the
  moved workshop prediction with keyboard focus. Its source-before-prediction order
  and initial source focus are now covered by the workshop browser checks.
- Compare generated complete Python downloads against the starting revision to
  ensure this editorial pass has not changed programs or their arithmetic.
- Inspect screenshots of the affected sequences before and after interaction.

The example calculations and measurement boundaries are unchanged. The reduction trace now names an input write without duplicating its value in integer-looking text; the shared-memory card supplies that value.
Automated verification and editorial inspection are not learner testing. This audit
reduces identifiable reading-order problems; observations from actual learners can
still reveal gaps.
