# Shared chapter styling

Copyright © 2026 Christopher Snow.

Chapters 1–3 use `src/chapter.css` and the helpers in `src/chapter-view.mjs`.
Use the same components when extending the book rather than copying a chapter's
colours, type sizes or spacing into another stylesheet.

- Opening example: `openingCode(source)` renders the green panel with a left accent,
  18px code, consistent padding and wrapping. Use it once in the opening section.
- Supporting code: neutral panels with 16px code explain setup and later examples.
- Focal operation: the existing larger operation panel highlights the calculation
  currently being explored. It has a different role from a complete opening program.
- Browser guidance: `browserNotice()` follows the opening example and explanation.
  Lead with running the browser examples without installation or a GPU; keep local
  PyTorch requirements in the same shared explanation instead of adding a different
  warning in each chapter header.
- Chapter shell: use the `book-chapter` body class and “interactive book” brand label.
  The shared stylesheet sets experiment spacing, heading sizes and note typography.
- Reader tasks: use the shared reference-task component for documentation lookups.
  Its label and decorative icon identify the action; colour supplements the text.

The shared rules are loaded after chapter-specific styles. Keep model-specific
layouts in their own stylesheets and put common visual decisions in `chapter.css`.
Browser checks compare computed styles across all three chapters at phone, tablet
and desktop widths in both themes, and record opening screenshots. Review those
screenshots as well as checking for overflow.
