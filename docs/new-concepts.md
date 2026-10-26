# Introducing new technical terms

GPU Lab teaches from a fixed, visible explanation first, then invites prediction and exploration. Short first-use vocabulary notes support that approach; they are **not** another simulator or a glossary for every word.

## When to use a New concepts panel

- Use one compact panel when a cluster of **new, foundational, repeatedly used** terms is required to understand the next worked example.
- Lead with one plain-language motivation; define the terms **before** their technical use, then apply them with an example.
- Retain ordinary prose for already-taught terms, minor expressions and one-off words. Don't add another panel just to repeat Lab 01's definitions.
- Prefer 2–4 one-sentence definitions. Where a topic requires more, split an explanation at a natural boundary rather than packing a page of definitions into one panel.
- Visuals belong in the panel only when they show a relationship independently useful to the learner. Lab 01 uses 32 labelled lanes; the other labs reuse their existing computed or static diagrams.
- Remove any paragraph that simply repeats the panel's definitions. Keep model limitations and algorithm consequences in normal prose.

## Implementation

Follow the [authoring checklist](authoring-checklist.md) for teaching decisions.
Book chapters use `definitions()` from `src/chapter-view.mjs` and its shared styles
in `src/chapter.css`. Supply plain-text term/meaning pairs; the helper escapes them
and emits a semantic definition list. Keep first-use definitions visible without JS.

The older further labs still use `content/concept-definitions.mjs`, `renderConcepts`
and `NEW_CONCEPTS` markers. These are a legacy implementation, not an alternative
pattern for new book chapters. When adapting a lab into a chapter, move its terms to
the shared chapter component and remove the old panel rather than showing both.

Review on a narrow phone: each term stays beside its meaning, with readable text
and no horizontal overflow. Label and typography convey the role without colour.
