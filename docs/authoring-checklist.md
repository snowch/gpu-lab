# Chapter authoring and review checklist

Copyright © 2026 Christopher Snow.

This is the authoritative checklist for new chapters and revisions. It captures
the opening chapters’ teaching and usability decisions. `docs/plan.md` defines the
curriculum; `docs/model.md` defines numerical assumptions; the styling and terminology
documents describe implementation details. Historical redesign notes are not a
second set of authoring requirements.

## Learning journey

- [ ] Name the calculation, inputs, destination or comparison in titles and instructions:
  “double five input values”, “copy the results to CPU memory”, or “compare tile widths
  2 and 4”. Use “tensor” for the container and “values” for its data. Keep established
  terms such as stride, warp and number format, explaining them at first use. Replace
  vague references such as “the work” when the actual instruction, count or action
  can be named; avoid mechanical word substitution.

- [ ] Give the chapter one question and an observable outcome: what can the reader
  trace, predict or explain at the end? Split a chapter when it introduces separate
  learning goals. Carry the same small dataset and calculation into the next chapter.
- [ ] Start with a short, complete PyTorch example relevant to AI/ML practitioners.
  Explain its inputs, result and unfamiliar arguments beside it. Distinguish the
  learner’s choices from PyTorch’s kernel, allocation and launch responsibilities.
- [ ] Build from behaviour to concepts to implementation. Introduce only what the
  next example needs. Do not begin with a broken kernel or unexplained CUDA fragment.
  Keep short CUDA bridges beside the concept and diagram they explain. A first
  launch excerpt must name the function’s purpose and offer its complete function
  and launch locally; explain its arguments before relying on them. Label body
  excerpts with their function and role. Keep core bridges visible alongside the
  PyTorch operation; reserve disclosures for complete references and deeper detail,
  rather than hiding required languages behind tabs.
- [ ] Before a new mechanism, explain the problem it solves in the current example.
  A definition tells the reader what a term means; a short bridge tells them why
  they need it. Connect the last observable result to the next question. Ground
  execution terms in a specific input, calculation and output before generalising
  about many executions or parallel progress.
- [ ] Match explanations to the ML audience: assume basic Python, array indexing and
  floating-point familiarity. Explain unfamiliar PyTorch arguments and GPU mechanisms;
  use a short contextual note where prerequisite knowledge needs clarification.
  Keep deeper compiler, optimisation and profiling discussion optional until needed.
  Put detailed scheduler policy, arithmetic rules and secondary accounting behind
  labelled native disclosures when the main activity does not require them.
  Keep experiment inputs, units, scope and prediction rules visible beside controls;
  use compact local tables for shared assumptions instead of repeating long paragraphs.
- [ ] Define new terms before using them in prose, diagrams or controls. Use the
  shared `definitions()` callout: bold term, brief meaning, visible Definition label.
  Group related terms, remove duplicate explanations, and leave later mentions plain.
  Do not introduce substitute jargon such as “worker” for an already-defined thread.
- [ ] Keep each explanation, code, controls, diagram and result together in a
  downward reading flow. Repeat a needed diagram locally rather than sending readers
  back up the page. Each experiment owns its controls and results. Keep that
  implementation detail out of reader-facing prose; explain interface behaviour
  only when it helps the reader carry out a specific action.
- [ ] A worked example and the next prediction must ask different questions. Use a
  new multiplier, row or other case for prediction; label revisiting a known result
  as inspection or confirmation. A definition such as “softmax weights sum to one”
  should be checked or applied, not presented as an unseen answer to guess.
- [ ] Make exercises practise the chapter’s GPU reasoning, rather than familiar
  arithmetic. Label guided demonstrations “Inspect”; ask for a prediction only for
  a new decision or case. Collect a concrete prediction before “Check”, give feedback
  about its consequence, and show the affected values or threads. A reveal-only
  button must say “Compare”, not claim to check an explanation it never received.
  Teach the correct mechanism before a diagnostic mistake. Include hints and worked
  comparisons without locking readers out, remove controls unrelated to the goal,
  and end with a new case that requires applying the mechanism.
- [ ] Follow predict → run → change one variable → explain. Use `readerTask()` for
  explicit learner actions, with a visible label and decorative icon. Put feedback
  beside Run. Show `?` for unknown output values until Run; hide derived counts, traces and
  answer diagrams until then, including in the initial HTML before scripts load.
  Keep inputs and clearly labelled worked examples visible. Changing calculation
  settings must invalidate only that experiment’s old result; inspecting a thread
  or stepping an existing trace must preserve it. Cover first load, changed settings
  and restart restoration in browser checks.
- [ ] Keep optional material only for a distinct learning outcome. Link deeper
  experiment controls from the chapter that prepares the reader. Keep the relationships
  required for a later exercise visible beside that exercise, even when a detailed
  explorer is optional. An interaction must reveal values, dependencies or consequences
  beyond changing the colour of an existing static picture. Preserve the reader’s
  inputs, result and position when returning from an optional detour. Group reference
  maps and setup guides under Appendices, separately from Extra practice.
- [ ] End with a small new case that applies the chapter’s idea and a local answer
  comparison. Keep optional extensions, such as transpose practice, clearly optional.

## Code, visuals and references

- [ ] Use shared opening-code, code-language, definition, action and browser-notice
  components. Keep code legible on phones; label PyTorch versus CUDA C++ in text as
  well as colour. Do not shrink code to make a long line fit. Use short source lines and explicit
  continuation in Python; preserve indentation and keep any horizontal scrolling
  inside the code panel. Check complete programs and dynamic excerpts alike.
- [ ] Keep tensor values distinct from indices and counts in **prose, worked examples,
  diagrams, feedback and answer comparisons**. Whole-valued floating-point data must
  retain `.0` or floating-point scientific notation; thread IDs, indices, dimensions,
  counts and byte offsets remain integers. Explain floating-point inputs at first use.
  Match the displayed source and dtype: a scalar multiplier written as `2` does not
  turn a floating-point tensor’s results into integer data. Preserve values and
  calculations rather than changing the example to hide a formatting mismatch.
  Quote actual external-tool output faithfully; its print format may omit `.0`
  without changing the tensor’s dtype.
- [ ] Explain unfamiliar code with compact bullets in source order, starting each
  point with the actual fragment it describes. Keep explanations immediately after
  the snippet, before downloads or other callouts. Use the shared walkthrough
  renderer for optional code highlighting; preserve copyable source, keyboard
  operation, static explanations and current values in dynamic examples. Remove
  duplicate syntax prose; familiar one-line operations and documentation questions
  do not need another walkthrough.
- [ ] Lead browser guidance with “no installation or GPU required”. Explain simulation
  versus local execution once at the appropriate point. State validation limits
  accurately; compiler/simulator checks are not physical GPU performance evidence.
- [ ] When connecting a model to a real profiler, link the optional profiling appendix.
  Keep launch dimensions, operation/kernel correlation and measured performance
  distinct. Missing trace fields are unknown, not zero or the model's settings.
  Ordinary PyTorch expressions choose implementations internally; custom kernels
  permit direct launch control. Do not imply that PyTorch programs cannot be optimised.
- [ ] Use one local-execution section per page through `desktopLinks()`. Keep
  installation steps in the desktop appendix and browser requirements at the opening.
  Link contextual code downloads beside their code without repeating setup guidance.
- [ ] Keep complete PyTorch examples in shared source templates. Generate desktop
  downloads through `pythonProgram()` and exercise those same wrappers in
  `tests/chapter_examples.py`. Provide a complete-program link for excerpts; keep
  dynamic downloads aligned with current controls. Update the desktop appendix's
  coverage table when adding programs. Test supported CUDA examples in the pinned
  simulator workflow; label unsupported features and hardware execution separately.
- [ ] Preserve visual scaffolding when introducing code: show what a thread does,
  then add block boundaries, then connect a local copy of the block view to CUDA.
  A code walkthrough must not replace a diagram that explains a different relationship.
  Ask for launch-count predictions before revealing calculated launch settings.
- [ ] Recover diagram space through a compact representation, rather than smaller
  text or touch targets. Use rows for repeated input/calculation/output relationships,
  small tiles for grouping, and one shared detail panel for the selected item. Keep
  group boundaries, explicit states and the values needed to reason visible. Combine
  repeated demonstrations that teach the same outcome; retain distinct diagnosis and
  transfer tasks. Check the whole page before adding another diagram or splitting it.
- [ ] Make visuals show a relationship or consequence. Generate values from the model.
  When connecting threads to hardware, follow a known input through its read,
  calculation and write. Explain what the hardware does; distinguish logical
  executions from physical execution units. Keep placement and timing claims separate.
  Distinguish values, indices, element offsets and byte offsets. A grouping diagram
  is not a chip floor plan or a promise of simultaneous execution. Distinguish the
  GPU device from its compute chip: caches belong on the chip; dedicated device
  memory is separate from the compute chip. CPU and system RAM are peers within
  the CUDA host side; use Computer / system for the parent of host and GPU device.
  State the architecture scope.
- [ ] Match the picture to the work actually performed. Give skipped work a readable
  neutral treatment and an explicit label; do not draw arithmetic that a guard skips.
  Keep inspectable threads selectable, distinguish invalid accesses from safe skips,
  and distinguish threads with no input from unused warp positions and other-path lanes.
- [ ] Avoid misleading small examples: a block may have several warps; unused lanes
  do not prevent another block from making progress. State simplifying assumptions
  beside the picture, and defer scheduling details until they are needed.
- [ ] Label dynamic code as dynamic and update it with the controls. Explain fixed
  reference code as fixed. Never tell readers to follow a change that does not occur.
- [ ] Keep a supporting recording page short: native manual playback, captions,
  a readable transcript, downloads and a return link. State its scope in the parent
  chapter. Place deeper interactions beside the chapter that introduces their
  prerequisites. Such a recording page need not duplicate the parent’s references
  and documentation exercises. Include media in offline verification and check
  playback, seeking and paused restoration after a return or update.
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

## Required reading-order review

Apply this to every learner-facing edit, including a one-sentence correction. Review
**the preceding section → the changed section → the following section** in the built
page. Expand the review to the chapter opening or previous chapter when the edit
changes what the reader must already know. Use the stated prerequisites, not the
author’s knowledge of later chapters.

1. **Knowledge before use:** identify each new term and the first sentence, code
   explanation or definition that explains it. Include headings, figure labels and
   controls in the review. A heading may announce a topic; the opening must establish
   its purpose and meaning before an example or question relies on it. Check terms
   inside definitions too. Do not fix a missing introduction by adding another term.
2. **Reason for the next idea:** connect the previous calculation or observation to
   the mechanism now needed. A definition on its own is not that connection.
3. **A visible, named target:** resolve every “this”, “picture”, “diagram”, “above” or
   “below” that carries an instruction. Name the actual card, figure, code panel or
   control; keep selection instructions adjacent to their targets. If a result only
   appears after Run or inside a disclosure, say how to reveal it first.
   Remove leftover author instructions such as “check which terms this example
   uses”. A code explanation describes constructs actually present in its fragment;
   a reader task names an action, its target and a question or result to inspect.
   Verify requested settings against the initial and changed UI states: do not ask
   readers to change a value already selected, or promise a failure that depends on
   an unstated block size. Name a disclosure when the target is inside it.
4. **Enough information to act:** before Run, verify that inputs and rules needed for
   a prediction are available, without revealing the answer. If the relevant source
   is collapsed, name the disclosure to open. Check the initial case, a changed case
   and the worked comparison separately. Compare the data type and value notation
   across source, explanatory prose, cards and feedback; distinguish data from indices
   and counts. Label an already-shown answer as inspection;
   ask for a fresh case when requesting a new prediction.
5. **Read the revised sequence again:** inspect it at phone and desktop sizes, before
   and after Run, including any affected disclosure, selection or saved state.
   Check that moving an explanation has not created a new undefined term, distant
   reference, duplicate explanation or jump in the next section.

Record the reviewed sequence and relevant interaction states briefly in the PR’s
validation notes. Automated tests can protect structural requirements such as
source-before-prediction order and hidden results; they cannot establish that the
prose prepares a newcomer. Do not claim learner testing without learner observations.
For the whole-book baseline, see [the learning-flow audit](learning-flow-audit.md).
The subsequent [reader instruction audit](reader-instruction-audit.md) records fixes
to stale prompts, settings and code explanations.

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
