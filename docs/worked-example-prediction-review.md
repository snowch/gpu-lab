# Worked examples and prediction tasks

Copyright © 2026 Christopher Snow.

The opening ×2 program already displays its result, so predicting that same result
again adds little. Keep it as a worked example; begin the first interactive case
with multiplier 3, unchanged inputs, and unknown outputs. Code, controls and diagram
all use that multiplier. Later thread/block/kernel sections explicitly return to
the familiar doubling case for inspection. Their initial feedback asks the reader
to inspect, rather than guess a known arithmetic result. Changing settings still
clears that experiment’s results and asks for a new prediction.

Reviewed the prediction targets across all thirteen chapters:

| Chapters | Outcome |
| --- | --- |
| 1 | Predict ×3 after seeing ×2. Use later doubling sections to inspect indices, blocks, bounds and the CUDA kernel. |
| 2 | Inspect the explained copy/location behaviour first, then change input count or multiplier and predict copied bytes or values. |
| 3 | Confirm the familiar first row, then predict row 1; the column exercise uses different input values. |
| 4 | Predict offsets, including offsets in the new packed storage, instead of asking whether already-explained packing changes values. |
| 5–10 | Keep requests, scheduling, sign patterns, partial sums, input reuse and precision experiments: readers apply rules to counts or results not displayed in the opening. Definitions may supply rules; they should not be framed as unseen answers to guess. |
| 11 | Inspect scores, softmax weights and the result first. Change query scale to 1,000 before predicting the new weight distribution/output; remove the prompt that asks readers to guess the stated softmax sum and discloses the number of dominant keys. |
| 12 | Keep the cache-size and time-bound questions: the numerical budgets require applying the stated dimensions/rates. |
| 13 | Check the known chapter-9 result as a baseline, then compare tile widths and the changed resource budgets. |

Static HTML and live feedback use the same inspection/prediction prompts. Existing
experiment IDs and settings remain valid. A completed ×2 snapshot from an older
release keeps that multiplier and its result; the new default must not overwrite it.
Unknown outputs stay hidden until Run, and changing one experiment leaves the
others intact. Python/CUDA programs and model arithmetic are unchanged.

Verification includes the initial ×3 code/control/diagram, hidden first results,
Run and setting invalidation, independent experiments, historical ×2 restoration,
no-JavaScript disclosures, keyboard operation and responsive layouts in both themes.
The authoring checklist now distinguishes worked confirmation from fresh prediction.
This is an author review with automated checks, not independent learner testing.
