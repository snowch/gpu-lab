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
- [ ] End with a small new case that applies the chapter’s idea and a local answer
  comparison. Keep optional extensions, such as transpose practice, clearly optional.

## Code, visuals and references

- [ ] Use shared opening-code, code-language, definition, action and browser-notice
  components. Keep code legible on phones; label PyTorch versus CUDA C++ in text as
  well as colour. Do not shrink code to make a long line fit.
- [ ] Lead browser guidance with “no installation or GPU required”. Explain simulation
  versus local execution once at the appropriate point. State validation limits
  accurately; compiler/simulator checks are not physical GPU performance evidence.
- [ ] Make visuals show a relationship or consequence. Generate values from the model.
  Distinguish values, indices, element offsets and byte offsets. A grouping diagram
  is not a chip floor plan or a promise of simultaneous execution.
- [ ] Avoid misleading small examples: a block may have several warps; unused lanes
  do not prevent another block from making progress. State simplifying assumptions
  beside the picture, and defer scheduling details until they are needed.
- [ ] Label dynamic code as dynamic and update it with the controls. Explain fixed
  reference code as fixed. Never tell readers to follow a change that does not occur.
- [ ] Place short official-documentation tasks after the relevant concept/code.
  Early tasks link directly to the section and refer to a visible local snippet;
  later tasks can ask readers to find the section. Provide an offline comparison.
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
- [ ] When moving or adding pages, update contents, chapter numbering, previous/next
  links, reference tasks, offline coverage and saved-state restoration checks.
  Preserve stable control IDs where possible; do not silently reuse an ID for a
  different meaning. Keep planned chapters distinguishable from existing labs.
- [ ] Run `npm run check` and `python tests/browser.py`; run/update offline checks for
  changed routes or state. Use `tests/requirements.txt` for the supported browser
  version. Validate numerical changes independently and record execution boundaries.
- [ ] Report learner testing separately from automated verification. Passing tests
  does not establish that a newcomer understands the lesson.
