# Shared chapter styling

Copyright © 2026 Christopher Snow.

Chapters 1–5 use `src/chapter.css` and the helpers in `src/chapter-view.mjs`.
Use the same components when extending the book rather than copying a chapter's
colours, type sizes or spacing into another stylesheet.

- Opening example: `openingCode(source)` renders the green panel with a left accent,
  18px code, consistent padding and wrapping. Use it once in the opening section.
- Code language: label PyTorch and CUDA C++ explicitly. Green identifies PyTorch;
  blue identifies CUDA, with suitable accents in both themes. Colour supplements
  the language label. Use `codePanel()` for labelled explanatory code.
- CUDA progression follows the [authoring checklist](authoring-checklist.md): show
  a complete kernel and launch before excerpts. Later selected-thread substitutions
  may share one labelled panel with the general expression; avoid duplicate panels.
- Supporting code: neutral panels with 16px code explain setup and later examples.
- Focal operation: the existing larger operation panel highlights the calculation
  currently being explored. It has a different role from a complete opening program.
- Browser guidance: `browserNotice()` follows the opening example and explanation.
  Lead with running the browser examples without installation or a GPU; keep local
  PyTorch requirements in the same shared explanation instead of adding a different
  warning in each chapter header.
- Chapter shell: use the `book-chapter` body class and “interactive book” brand label.
  The shared stylesheet sets experiment spacing, heading sizes and note typography.
- First-use definitions: use `definitions([[term, meaning], ...])` beside the example
  that introduces a term. Use a bold term, a short plain-language meaning and the
  shared neutral background/left border. The visible Definition label and semantic
  definition list distinguish these from code and reader actions without colour.
  Group closely related terms in one box; do not repeat the definition in nearby
  prose or highlight every later mention. Keep definitions visible without clicks.
- Reader tasks: use `readerTask()` for experiment instructions and new-case prompts.
  Use `renderChapterReferences(slug)` at the end of each page for the annotated
  References list followed by documentation exercises. Its catalogue in
  `src/reference-tasks.mjs` supplies each page’s sources, questions and local answers.
  Its label and decorative icon identify the action; colour supplements the text.

The shared rules are loaded after chapter-specific styles. Keep model-specific
layouts in their own stylesheets and put common visual decisions in `chapter.css`.
Browser checks compare computed styles across all five chapters at phone, tablet
and desktop widths in both themes, and record opening screenshots. Review those
screenshots as well as checking for overflow.

Chapters 6–12 use `continuation-view.mjs` and `continuation.mjs` for local experiments.
Each `data-book-experiment` has its own configuration, Run feedback and result.
Use `trace: false` when a result is a capacity/count comparison with no useful
sequence to inspect; do not manufacture steps just because the underlying engine
has a trace. New content must reuse `openingCode`, `definitions` and `readerTask`.
