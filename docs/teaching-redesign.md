# Teaching redesign: static worked examples first

This document records the before/after state of the teaching redesign
requested in issue #1 ("Simplify GPU Lab teaching: static worked examples
first, meaningful experiments second").

## Before

- Lab 01 (memory / tensor layout) led with interactive stride and slice
  explorers. Learners had to click buttons and dropdowns before seeing a
  single worked example.
- Labs 02–08 had no static worked example at all. The first explanation of
  the mechanism was the interactive simulator itself.
- Prediction prompts used a bare number input (`0` or `1`) with no labels,
  so learners had to guess what the numbers meant.
- The "Inspect without guessing" button revealed the answer with one click,
  encouraging answer-peeking before thinking.
- All controls were always visible, including advanced tuning knobs
  (shared-memory budget, register count, bandwidth, compute rate) that
  distract from the core experiment.
- Some controls were inside `<details>` but the disclosure pattern was
  inconsistent across lessons.

## After

### Lab 01 — Reading a tensor (Workstream A)

- Two always-visible static worked examples show column-major stride
  (+1 element × 4 bytes = +4 bytes) and row-major stride
  (+8 elements × 4 bytes = +32 bytes), each with a tensor grid, a storage
  strip, and a prose summary.
- A view-vs-copy comparison figure shows `x[:, 0]` (stride 8, shares
  storage) vs `x[:, 0].contiguous()` (stride 1, new storage).
- A fixed sector comparison figure shows 4 sectors (row access) vs
  32 sectors (column access) with caveats about coalescing.
- The full PyTorch example and the interactive stride/slice explorers are
  moved under `<details class="more-settings">` disclosures.
- The prediction button reads "Show result without guessing" instead of
  "Inspect without guessing".

### Labs 02–08 + reduction workshop (Workstream B)

- Every lesson now has a static worked example rendered from
  `src/worked-examples.mjs`:
  - Lab 02 (scheduling): warp scheduling timeline with latency hiding
  - Lab 03 (divergence): branch divergence lane diagram
  - Lab 04 (shared memory): bank conflict comparison
  - Lab 04B (reduction): tree reduction with hazard warning
  - Lab 05 (matmul): tiled matrix multiply with arithmetic intensity
  - Lab 06 (tensor cores): FP32 vs FP16 vs BF16 precision trade-off
  - Lab 07 (attention): online vs materialised attention memory comparison
  - Lab 08 (inference): roofline bound with memory vs compute bars
- The worked example appears as a `<section>` between "The mechanism" and
  "Experiment: try changing it", so it is visible on page load without any
  interaction.

### Shared renderer (Workstream C)

- `workedExample` field added to lesson data; `renderWorkedExample(slug)`
  dispatches to the correct static figure.
- "Show result without guessing" button replaces "Inspect without guessing"
  on all lessons (both number-input and named-choice variants).
- Named-choice predictions: lessons with binary conceptual choices (reduction,
  inference) now use labelled radio buttons ("All reads are safe" /
  "Unwritten read occurs", "Memory-limited" / "Compute-limited") instead of
  bare `0`/`1` number inputs.
- Progressive disclosure: `advancedControls` field renders secondary
  controls inside `<details class="more-settings"><summary>More settings</summary>`.
  - Lab 05 (matmul): shared-memory budget and registers per thread are advanced.
  - Lab 08 (inference): context length, parameters, bandwidth, compute rate,
    and measured time are advanced.
- The experiment heading changed from "The experiment" to
  "Experiment: try changing it".
- The lab panel eyebrow changed from "PREDICT → INSPECT" to
  "PREDICT → SHOW → STEP".

### Responsive / mobile / accessibility (Workstream D)

- `src/worked-examples.css` includes responsive breakpoints: tables scroll
  horizontally on narrow screens, grids stack vertically, and font sizes
  scale down at ≤ 600px.
- `src/style.css` includes `.named-choices` / `.named-choice` styles with
  proper fieldset/legend semantics for screen readers.
- `details.more-settings` uses native `<details>`/`<summary>` for
  keyboard-accessible disclosure.
- Browser tests cover 390px and 360px viewport widths.

### Tests and docs (Workstream E)

- `tests/worked-examples.test.mjs`: 11 Node tests covering all 8 worked
  example renderers and the dispatcher.
- `tests/tensor-layout.test.mjs`: 4 tests for stride examples, view/copy
  comparison, and sector comparison (from Workstream A).
- `tests/browser.py`, `tests/new_lessons.py`, `tests/remaining_lessons.py`:
  updated for new button text, named-choice radios, worked-example visibility,
  and advanced-controls disclosure.
- `npm run check` runs 42 Node tests + build; all pass.

## Files changed

| File | Change |
|------|--------|
| `src/worked-examples.mjs` | New: 8 static worked example renderers + dispatcher |
| `src/worked-examples.css` | New: styles for worked example figures, responsive |
| `src/tensor-layout.mjs` | New: `strideExample`, `renderStrideExample`, `viewCopyComparison`, `sectorComparison` |
| `src/tensor-layout.css` | New: styles for stride/sector/view-copy figures |
| `content/lessons.mjs` | `workedExample` rendering, `advancedControls` disclosure, named-choice template, button text |
| `content/remaining-lessons.mjs` | `workedExample` + `namedChoices` + `advancedControls` on labs 04B–08 |
| `content/memory.html` | Static worked examples, progressive disclosure, button text |
| `src/lesson.mjs` | `readGuess()` handles radios; `#show-result` button |
| `src/ai-lesson.mjs` | Same pattern for AI-engine lessons |
| `src/app.mjs` | Null-guard for `#guess` input |
| `src/style.css` | `.named-choices`, `.named-choice`, `.more-settings` styles |
| `scripts/build.mjs` | Placeholder replacement for stride/view-copy/sector figures |
| `tests/worked-examples.test.mjs` | New: 11 tests |
| `tests/tensor-layout.test.mjs` | New: 4 tests |
| `tests/browser.py` | Updated assertions |
| `tests/new_lessons.py` | Updated assertions |
| `tests/remaining_lessons.py` | Updated assertions |
| `docs/teaching-redesign.md` | This document |
