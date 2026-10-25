# Writing and reviewing chapters

Copyright © 2026 Christopher Snow.

Use this guide when developing the unfinished book chapters and revising existing
ones. Chapter numbers here follow the book roadmap, not the older lab numbers.
Read it alongside [the course plan](plan.md), [model contracts](model.md) and
[technical sources](sources.md). [The feedback log](reader-feedback.md) records
why these guidelines exist and which gaps still need attention.

## Begin with an operation and an outcome

Start with a familiar PyTorch operation and a small, traceable input. Say what the
reader will be able to explain by the end. Keep the same values across the code,
visuals and experiments where possible; explain any change in size or layout.

Follow the learning loop: see the operation → predict → run → change one thing →
explain → connect to code → apply the idea to a new case. Give readers useful work
to do early. Introduce a complete CUDA function only after its parts have meaning;
repair exercises follow an understandable working example.

## Introduce concepts when they become useful

Explain why a mechanism exists before teaching its indexing or API details. For
example, blocks enable cooperation and give the GPU groups of work to distribute;
a block-size expression alone does not explain their purpose.

Define a term or syntax before asking the reader to use it. Avoid introducing
several hardware terms in one paragraph. A brief signpost to a later topic is
fine, but the current task must not depend on that later explanation.

Use precise labels and one concrete example to distinguish a value, an array
index, a storage position, a stride in elements and an offset in bytes. Explain
slicing syntax such as `:` before asking readers to interpret it. Explain number
types and element sizes before requiring byte calculations.

## Keep the reading flow moving down the page

Keep each explanation, relevant code, controls, visual and result together. Repeat
a small snippet or visual when the next task needs it; do not send readers back
to the top to remember code or inspect a changing shared diagram. Each experiment
keeps its own state and result so earlier examples remain available for comparison.

Introduce an architecture diagram where it answers a question raised by the
operation. Use consistent labels and colours. An optional reference page can
collect the relationships; the contents page should focus on the chapter sequence.
Make clear whether a diagram shows ownership, addresses, placement or execution.

## Make reader actions explicit

Use a consistent callout treatment for **Predict**, **Try it** and **Look it up**.
Keep the instruction specific: name the code or setting, ask a concrete question,
and say what to change next. Avoid burying several actions in ordinary prose.

Use a subtle tint and accent border, with readable text and a visible action label.
A book icon identifies a documentation lookup; decorative icons must be hidden from
assistive technology. Labels must carry the meaning without colour or icons. Avoid
adding unexplained symbols or extra controls solely to mark a task.

Place Run feedback directly beneath the button, before tall diagrams. Show a clear
result or error where the reader has just acted. Changing an input must invalidate
the old result in that experiment. Preserve keyboard focus and avoid automatic
scroll jumps when running, selecting or comparing.

## Make comparisons fair and explicit

Name what stays the same and what changes. Match the relevant input, selected
row/column, multiplier and useful work before drawing a conclusion about a layout
or algorithm. Independent experiments must not silently imply shared settings.

For a column and its packed copy, explicitly ask readers to select the same column
and multiplier in both examples. Qualify claims such as “the outputs are the same”
with those conditions. Keep earlier results intact rather than silently resetting
or synchronising them. Derive visual quantities and prediction answers from models.

## Separate browser exercises from optional local execution

Lead with what readers can do immediately: run the browser exercises without
installing PyTorch, CUDA or owning a GPU. Explain the simulation honestly. Put the
installation and hardware requirements beside the optional real-code path.

The browser model has no installed PyTorch or CUDA version to select. Direct
browser readers to the provided references. Documentation-version matching applies
to readers running examples in their own environment. Explain separately what a
CPU-only companion check validates and what still requires GPU execution.

Preserve the model boundaries: simulated counts are not hardware measurements,
sector counts are not DRAM reads or elapsed time, and a chosen thread mapping is
not a promise about PyTorch's implementation. Record unvalidated GPU paths.

## Make reference reading an applied task

Early tasks link to the relevant API section; later ones can ask readers to find
it. Keep the code being discussed beside the question. Ask readers to apply a
specific definition to that code, rather than merely find a term in a guide.

For example, show the opening tensor snippet and ask what `device="cuda"` selects.
Then ask about the omitted `dtype` argument and the inferred floating-point type.
The comparison should state the usual default and any assumption that could change
it. Do not ask readers to find an argument in code that never specifies it.

Keep a native “Compare your answer” disclosure. Open documentation in a labelled
new tab so the experiment remains in place. The question, snippet and comparison
must remain readable offline and without JavaScript; external documentation needs
a connection. Do not imply that every official documentation link is available offline.

## Review checklist

Before calling a chapter ready:

- Can a newcomer follow it without knowing terminology introduced later?
- Does the opening operation lead to a clear explanation the reader can give?
- Are new terms, syntax, units and diagram labels explained before the task needs them?
- Are actions visibly labelled and tied to nearby code or controls?
- Does Run show its full result near the button on a phone, without a page jump?
- Are inline code and code blocks readable without zooming, on phones and tablets?
- Can long code wrap or scroll within its panel without widening the whole page?
- Do comparisons explicitly match inputs and settings while preserving earlier work?
- Are browser access, optional local execution and version advice clearly separated?
- Do reference questions require applying the documentation to the example?
- Are colours supplemented by labels, icons decorative, and controls keyboard accessible?
- Are static explanations and appropriate worked examples available without JavaScript?
- Are model assumptions, measured evidence and unvalidated hardware paths distinguished?
- Have the relevant model, browser and offline/update checks passed as required by AGENTS.md?

Review light and dark themes, phone and tablet widths, touch and keyboard input,
and feedback visibility from the position where a reader presses Run. When measuring
scroll stability, finish any test-setup scrolling before capturing the starting position.

Automated checks establish behaviour, not comprehension. Observe newcomers when
possible: ask them to explain a result, then try a new case. Record observed confusion
in the feedback log and distinguish it from an author review or a proposed improvement.
