# Shared chapter styling

Copyright © 2026 Christopher Snow.

Chapters 1–5 use `src/chapter.css` and the helpers in `src/chapter-view.mjs`.
Use the same components when extending the book rather than copying a chapter's
colours, type sizes or spacing into another stylesheet.

- Opening example: `openingCode(source)` renders the green panel with a left accent,
  18px code and consistent padding. Preserve source line breaks and indentation;
  long code scrolls inside its panel instead of wrapping mid-statement. Format
  Python calls with explicit parenthesised continuation and short lines (aim for
  60 columns), including dynamic examples. Do not reduce the font size to fit. Use it once in the opening section.
- Code explanations: `code-explanation-data.mjs` supplies curated fragments and
  meanings for the teaching examples. The build renders compact bullets directly
  after their code; `code-explanations.mjs` adds keyboard/touch highlighting and
  refreshes dynamic snippets. Keep each fragment tied to actual source. Preserve
  essential explanations without JavaScript and exclude reference-question snippets.
  Mark other prediction-only code with `data-code-question` to avoid giving its answer.
  For a short bridge with its own diagram-linked explanation, use
  `codePanel({explainedLocally: true, ...})` to avoid a second generic walkthrough.
  Use 1.5 line spacing in code, 1.45 in explanation lists and 6px list-item padding.
- Code language: label PyTorch and CUDA C++ explicitly. Green identifies PyTorch;
  blue identifies CUDA, with suitable accents in both themes. Colour supplements
  the language label. Use `codePanel()` for labelled explanatory code.
- CUDA progression follows the [authoring checklist](authoring-checklist.md): put
  short, labelled code bridges beside the concepts and diagrams they explain.
  At the first launch, name the function’s purpose and offer the complete function
  locally. Keep required PyTorch and CUDA bridges visible; use disclosures for
  complete references and deeper detail. Later selected-thread substitutions may
  share one labelled panel with the general expression; avoid duplicate panels.
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
  Use `renderChapterReferences(slug)` at the end of each teaching page (not the GPU map) for the annotated
  References list followed by documentation exercises. Its catalogue in
  `src/reference-tasks.mjs` supplies each page’s sources, questions and local answers.
  Its label and decorative icon identify the action; colour supplements the text.

The shared rules are loaded after chapter-specific styles. Keep model-specific
layouts in their own stylesheets and put common visual decisions in `chapter.css`.
Browser checks compare computed styles across all five chapters at phone, tablet
and desktop widths in both themes, and record opening screenshots. Review those
screenshots as well as checking for overflow.

Chapters 6–13 use `continuation-view.mjs` and `continuation.mjs` for local experiments.
Each `data-book-experiment` has its own configuration, Run feedback and result.
Use `trace: false` when a result is a capacity/count comparison with no useful
sequence to inspect; do not manufacture steps just because the underlying engine
has a trace. New content must reuse `openingCode`, `definitions` and `readerTask`.

The GPU map uses colour for containment levels: pale yellow host/device groups within
the neutral Computer / system boundary, and matching green CPU/RAM and
GPU-chip/device-memory panels, with theme equivalents in dark mode.
Components within the chip use neutral surfaces. Borders, nesting and explicit
labels carry the hierarchy independently of colour; keyboard focus remains distinct.
The map has no chapter filter, chapter highlights or related-concept badges. Keep
Back one level, Reset diagram and chapter links inside the components.

Map boundaries carry the hierarchy: a quiet system outline, gold host/device groups,
green component headers and neutral SM resources. Resource disclosures share one
compact list; dashed borders distinguish assigned blocks and warps. Keep body text
at 16px and recover space through padding and grouping rather than shrinking it.
The current path and Back/Reset share a sticky toolbar. Its offset follows the
actual app-header height, including the embedded map's hidden header, so controls
remain available without covering focused disclosures.

Map tile headings include compact chapter numbers from the concept catalogue,
using smaller readable text and ranges for consecutive chapters. Supplementary
concepts without a numbered chapter say Extra practice. Full chapter links remain
inside the disclosure; the title and its annotation share the expansion target.
Lane grids omit the repeated chapter annotation while collapsed; opening a lane
shows its annotation and chapter links. The warp header retains its chapter coverage.
The current-path text omits chapter annotations to keep the hierarchy easy to scan.

Collapsed parent tiles also show an Inside line aggregating the chapters of their
actual rendered descendants, with duplicates removed and optional practice noted.
It hides on expansion, when child headings provide their own references. Leaf tiles
have no Inside line. Containment comes from the rendered tree, not catalogue edges.

## Manual lesson completion

Published chapters and practice pages place a native “Mark lesson as done” checkbox
beside the next-page link, using `renderLessonForward`. Raw page templates use the
`LESSON_COMPLETION` build placeholder. Reference appendices and the GPU map have no mark.
Sidebar and overview links use the same stable lesson slugs and show a tick plus
accessible “done” text. Completion does not change navigation or grade exercises.

Marks use a separate local-storage key per lesson, following Assembly Lab’s manual
completion approach. They synchronise across tabs and survive offline-file removal
and app updates. Experiment snapshots exclude the checkbox so an older tab snapshot
cannot undo a durable mark. An actual save failure keeps the choice on the current page and
reports it beside the checkbox; an unsaved change blocks an app restart until saved
or undone.
