# Prediction before results

Copyright © 2026 Christopher Snow.

## Course review

- Chapter 1: five independent experiments now begin with unknown outputs (`?`),
  including the generated HTML. Run reveals the computed output; multiplier or
  guard changes invalidate that example. Thread inspection preserves its run state.
  The introductory PyTorch worked example still shows its explained result.
- Chapter 2: diagrams already show the before-state until Run. Retain the inputs
  and previously prepared tensors; use explicit prediction/changed-setting feedback.
- Chapter 3: multiplication outputs were already gated. The column task now asks
  for output predictions, matching the visible inputs and unrevealed results.
- Chapter 4: selected offsets, strides, packed-copy details and memory-strip answers
  now wait for Run, alongside multiplication outputs. The input grid stays visible.
- Chapter 5: sector counts and diagrams already wait for Run. The shared layout
  renderer now also withholds derived offsets before running.
- Chapters 6–12: local result panels already invalidate correctly in JavaScript.
  Generate them hidden as well, preventing results flashing before scripts start.
  Run buttons become available only after their handlers are installed.
- Optional memory and bank labs and the repair workshop already gate their results
  behind Inspect, Check or Run and invalidate on settings changes. Their existing
  browser tests cover those behaviours. Live reference maps and worked diagrams
  remain inspectable without adding an unnecessary Run step.

No numerical models, example code or hardware claims change. No-JavaScript readers
can open labelled worked-result comparisons; they are not shown as completed runs.
Restart restoration preserves actual completed runs and unanswered exercises.
Older chapter 1 snapshots labelled “Example output” are treated as unrun, because
that label was generated automatically rather than by a learner pressing Run.

## Verification

Browser coverage checks all five chapter 1 experiments, pending offsets in chapter 4,
all exposed configuration selectors in chapters 6–12, independent results, keyboard
inspection, static fallbacks, and phone/tablet/desktop layouts in both themes.
The offline suite additionally checks an edited-but-unrun chapter 1 example and
unrun row examples across a real release update, alongside completed results.

The first browser attempt found an ambiguous test selector for nested fallback
summaries; the test now selects the outer comparison disclosure explicitly.
Visual review inspected actual pending/running chapter 1 and pending chapter 4
screenshots, including phone and tablet layouts. This was an author review and
automated verification, not independent learner testing.

Final command results are recorded in the pull request: `npm run check`,
`python tests/browser.py`, and `python tests/offline.py` using the pinned Playwright
requirements. The authoring checklist records the first-load/reset/restoration rule.
