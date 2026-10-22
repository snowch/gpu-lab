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

- Author the plain-text term and definition in `content/concept-definitions.mjs` keyed by lesson slug.
- In the matching intro in `content/lessons.mjs` or `content/remaining-lessons.mjs`, insert `<!-- NEW_CONCEPTS -->` at the correct first-use point (not automatically after the last intro paragraph).
- `renderLesson` in `content/lessons.mjs` calls `renderConcepts` from `src/concepts.mjs`. It validates that configured lessons have a marker.
- Manually authored Lab 01 has `<!-- WARP_CONCEPTS -->`, replaced at build time by the same semantic renderer. Its only extra option is the fixed warp/lane diagram.
- Styling is shared in `src/lessons.css` and uses existing light/dark theme variables. No JS, tooltip, icons per definition, or runtime control is needed.
- The term and definition strings are escaped when rendered; avoid embedding HTML in the data. Heading IDs are based on each distinct lesson slug.

Review on a narrow phone: a term and its definition should remain adjacent, with no horizontal page overflow or tiny text. Keep the panel visible with JavaScript off, and avoid repeating definitions after it.
