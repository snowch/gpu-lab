# Chapter authoring and review checklist

Copyright © 2026 Christopher Snow.

This is the authoritative checklist for new chapters and revisions. It captures
the opening chapters’ teaching and usability decisions. `docs/plan.md` defines the
curriculum; `docs/model.md` defines numerical assumptions; the styling and terminology
documents describe implementation details. Historical redesign notes are not a
second set of authoring requirements.

## Learning journey

- [ ] Give the chapter one question and an observable outcome: what can the reader
  trace, predict or explain at the end? Split a chapter when it introduces separate
  learning goals. Carry the same small dataset and calculation into the next chapter.
- [ ] Start with a short, complete PyTorch example relevant to AI/ML practitioners.
  Explain its inputs, result and unfamiliar arguments beside it. Distinguish the
  learner’s choices from PyTorch’s kernel, allocation and launch responsibilities.
- [ ] Build from behaviour to concepts to implementation. Introduce only what the
  next example needs. Do not begin with a broken kernel or unexplained CUDA fragment.
  When CUDA first appears, show a complete kernel and its launch together, then
  explain their parts. Label later excerpts as excerpts of an already-seen function.
- [ ] Define new terms before using them in prose, diagrams or controls. Use the
  shared `definitions()` callout: bold term, brief meaning, visible Definition label.
  Group related terms, remove duplicate explanations, and leave later mentions plain.
  Do not introduce substitute jargon such as “worker” for an already-defined thread.
- [ ] Keep each explanation, code, controls, diagram and result together in a
  downward reading flow. Repeat a needed diagram locally rather than sending readers
  back up the page. Each experiment owns its controls and results.
- [ ] Follow predict → run → change one variable → explain. Use `readerTask()` for
  explicit learner actions, with a visible label and decorative icon. Put feedback
  beside Run. Changing settings must invalidate that experiment’s old result.
- [ ] Keep optional material only for a distinct learning outcome. Link deeper
  experiment controls from the chapter that prepares the reader; group reference
  maps and setup guides under Appendices, separately from Extra practice.
- [ ] End with a small new case that applies the chapter’s idea and a local answer
  comparison. Keep optional extensions, such as transpose practice, clearly optional.

## Code, visuals and references

- [ ] Use shared opening-code, code-language, definition, action and browser-notice
  components. Keep code legible on phones; label PyTorch versus CUDA C++ in text as
  well as colour. Do not shrink code to make a long line fit.
- [ ] Lead browser guidance with “no installation or GPU required”. Explain simulation
  versus local execution once at the appropriate point. State validation limits
  accurately; compiler/simulator checks are not physical GPU performance evidence.
- [ ] Keep complete PyTorch examples in shared source templates. Generate desktop
  downloads through `pythonProgram()` and exercise those same wrappers in
  `tests/chapter_examples.py`. Provide a complete-program link for excerpts; keep
  dynamic downloads aligned with current controls. Update the desktop appendix's
  coverage table when adding programs. Test supported CUDA examples in the pinned
  simulator workflow; label unsupported features and hardware execution separately.
- [ ] Make visuals show a relationship or consequence. Generate values from the model.
  Distinguish values, indices, element offsets and byte offsets. A grouping diagram
  is not a chip floor plan or a promise of simultaneous execution. Distinguish the
  GPU device from its compute chip: caches belong on the chip; dedicated device
  memory is separate from the compute chip. CPU and system RAM are peers within
  the CUDA host side; use Computer / system for the parent of host and GPU device.
  State the architecture scope.
- [ ] Avoid misleading small examples: a block may have several warps; unused lanes
  do not prevent another block from making progress. State simplifying assumptions
  beside the picture, and defer scheduling details until they are needed.
- [ ] Label dynamic code as dynamic and update it with the controls. Explain fixed
  reference code as fixed. Never tell readers to follow a change that does not occur.
- [ ] End each published chapter/lab with `renderChapterReferences(slug)`: a References
  section with two or three annotated official links, followed by Use the documentation
  with at least two applied questions and local answer disclosures. The GPU map is a
  navigation tool: keep explanations and chapter links inside its diagrams, without
  a chapter introduction, duplicate concept catalogue or documentation exercises. Remove superseded
  scattered tasks. Early questions link directly and repeat a short fixed snippet
  when needed; later questions can ask readers to locate a rule.
- [ ] Distinguish names chosen for examples (such as `runKernel`) from official API
  names. Link to the documented language features, not an invented API entry. Explain
  ordinary PyTorch implementation selection separately from optional compiler-generated
  kernels; keep the compiler reference as later reading until it is taught.
- [ ] Say that browser exercises have no installed PyTorch/CUDA documentation version;
  matching installed versions applies to optional local execution. External links
  open in a labelled new tab so readers retain their experiment.

## Acceptance checks

- [ ] Read the page as a newcomer: no forward references needed to understand an
  instruction, no paragraph introducing a whole cluster of unrelated concepts,
  and no duplicate code or explanation that adds no new information.
- [ ] Check phone, tablet and desktop layouts in both themes. Inspect the actual
  screenshots, text size, wrapping, contrast and page overflow.
- [ ] Check keyboard and touch operation, visible focus and labelled inputs. Selection
  and Run must not jump the page. Definitions and worked explanations remain readable
  without JavaScript; essential content is not hidden in hover-only controls.
- [ ] Keep the GPU map catalogue in sync with concepts taught in a chapter. Give
  each concept a plain definition, a book example and valid chapter links. Label
  relationships explicitly; ownership, containment and data movement are different.
  Add hardware, memory and execution relationships to the expandable map; keep
  worked operations in their chapters. Render essential diagram
  content at build time and verify nested expansion with JavaScript disabled.
- [ ] When moving or adding pages, update contents, chapter numbering, previous/next
  links, reference tasks, offline coverage and saved-state restoration checks.
  Preserve stable control IDs where possible; do not silently reuse an ID for a
  different meaning. Keep planned chapters distinguishable from existing labs.
- [ ] Run `npm run check` and `python tests/browser.py`; run/update offline checks for
  changed routes or state. Use `tests/requirements.txt` for the supported browser
  version. Validate numerical changes independently and record execution boundaries.
- [ ] Report learner testing separately from automated verification. Passing tests
  does not establish that a newcomer understands the lesson.
