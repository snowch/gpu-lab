# Shared chapter styling

Copyright © 2026 Christopher Snow.

Chapters 1–3 use `src/chapter.css` and the helpers in `src/chapter-view.mjs`.
Use the same components when extending the book rather than copying a chapter's
colours, type sizes or spacing into another stylesheet.

- Opening example: `openingCode(source)` renders the green panel with a left accent,
  18px code, consistent padding and wrapping. Use it once in the opening section.
- Code language: label PyTorch and CUDA C++ explicitly. Green identifies PyTorch;
  blue identifies CUDA, with suitable accents in both themes. Colour supplements
  the language label. Use `codePanel()` for labelled explanatory code.
- Selected-thread examples: label the selected index and update it with the worked
  substitution. Show the general CUDA expression and worked substitution in one labelled
  panel. Explain their relationship once; changing the selection updates only the
  worked substitution, leaving the general expression’s variable index unchanged.
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
- Reader tasks: use the shared reference-task component for documentation lookups.
  Its label and decorative icon identify the action; colour supplements the text.

The shared rules are loaded after chapter-specific styles. Keep model-specific
layouts in their own stylesheets and put common visual decisions in `chapter.css`.
Browser checks compare computed styles across all three chapters at phone, tablet
and desktop widths in both themes, and record opening screenshots. Review those
screenshots as well as checking for overflow.
