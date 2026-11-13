# Quieter chapter endings

Copyright © 2026 Christopher Snow.

## Decision brief

The learner is an AI practitioner reading a self-paced chapter, with Python and
array-indexing knowledge but no assumed CUDA background. Their main task is to
apply the chapter's idea, mark their progress and continue. Reviewing the recap,
running locally and consulting official documentation are optional branches.

The existing [Course Builder](https://github.com/ericrisco/rsc-harness/blob/f3765d35e91690c0c7e511447da6cd0176ab38e0/skills/course-builder/SKILL.md)
review keeps the established outcomes, prerequisite sequence and new-case exercises.
This is a presentation repair, not a curriculum redesign. Its alignment is:

| Outcome | Required evidence | Optional support |
| --- | --- | --- |
| Apply the chapter's GPU mechanism to a new case | Existing visible application exercise and local comparison | Visible recap link with measured running time |
| Find and apply an official reference | Existing documentation questions and comparisons | One labelled documentation-practice disclosure; source links in References |
| Follow a complete local program | Existing contextual complete-program download | One local-execution disclosure linking setup and validation boundaries |

Applied [UX Design](https://github.com/f0d010c/stark/blob/ff94e5b4e1c98d259f3cde9f806406c4528deed4/skills/ux-design/SKILL.md)
and [Web Design](https://github.com/f0d010c/stark/blob/ff94e5b4e1c98d259f3cde9f806406c4528deed4/skills/web-design/SKILL.md),
including navigation, progressive disclosure, task ergonomics and rendered-quality
checks. The primary issue was that optional material competed with the lesson and
pushed progression below long reference lists.

- **Pattern:** a quiet resource index followed by the primary next-chapter action.
- **Composition:** existing left-aligned technical field guide; IBM Plex Sans with
  the existing paper, ink and evergreen palette. Thin dividers replace coloured cards.
- **Hierarchy:** a directly accessible recap row with measured duration; three
  independently expandable resource rows; understated manual completion; filled
  next-chapter link. Small decorative icons supplement meaningful labels.
- **Interaction:** native details/summary, at least 44px targets, Enter/Space and
  visible focus. Recap navigation takes one action. No new modal or outer accordion.
- **Continuity:** retain URLs, stable recap IDs, downloads, completion storage and
  reading/player restoration. Reference and practice disclosures have stable IDs.
- **Responsive replacement:** phone rows keep their full touch target and put the
  question count beneath the title; progression stacks with a full-width next link.
- **Recovery/states:** closed/open, keyboard focus, completed/uncompleted, return
  from recap with inputs/results and disclosure state preserved, JavaScript-disabled
  reading and offline navigation. Existing player failure/download fallbacks remain.
- **Restraints:** core explanations, first-use definitions, code and application
  tasks remain visible. No new library, decorative animation or external asset.

All fourteen recaps share the same renderer, including the older reduction and
matrix-multiplication links. A compact runtime duration catalogue is checked against
the measured metadata; importing build-only metadata into browser modules would
add unavailable dependencies. Video encoding, scripts and media stay unchanged.
Chapter 1's local/profiling branch uses one disclosure rather than nested setup panels.
The shared-memory lab has no local-download section; its references and practice
use the same disclosure style.

## Built reading-order and scenario review

Review the preceding application/comparison → resource rows → completion/next link
and following simulation/footer content, plus Chapter 14's recap → Where next →
remaining resources. Inspect collapsed and expanded bodies at phone, tablet and
desktop sizes in both themes. Verify source descriptions, local setup links and
practice comparisons remain readable, with no page-level overflow.

Automated checks cover native keyboard opening/closing, all fourteen measured
recap durations, compact closed footprints, work/disclosure/focus restoration after
a recap detour, reference-task use and JavaScript-disabled disclosures. Existing
full browser checks cover completion, downloads, recordings and earlier chapter
interactions. This review does not claim observations from learners.
