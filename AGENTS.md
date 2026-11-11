# Working on GPU Lab

Copyright © 2026 Christopher Snow.

Use the [chapter authoring checklist](docs/authoring-checklist.md) for every new or revised chapter.
Complete its required reading-order review for every learner-facing edit, including
small copy changes: review the preceding, changed and following sections in the built
page before marking the change complete. Passing automated checks does not replace
that review.

For every new or edited learner-facing page, exercise, diagram or recording,
use both a relevant design/UX skill and a learning/instructional-design skill when
available. Complete the checklist’s [design and learning review](docs/authoring-checklist.md#design-and-learning-review)
before merging, with depth proportional to the change, and record the skills and
findings in the PR. If either skill is unavailable, say so and perform the equivalent
checklist review; never claim a skill was used when it was not.

Read `docs/plan.md`, `docs/model.md` and `docs/sources.md` before extending the course.

- Keep AI workloads as the motivation and introduce hardware terms at first use.
- Generate figures and prediction answers from model results; no scripted performance claims.
- Separate CUDA programming semantics, the teaching machine and real hardware measurements.
- State assumptions beside the experiment. Do not present sector counts as DRAM reads or time.
- Keep planned modules clearly marked until their lessons and experiments work.
- Follow [shared chapter styling](docs/chapter-styling.md); reuse the common opening-code and browser-guidance components.
- Use clear British English, accessible labels and keyboard controls. Preserve mobile layouts.
- Keep the first build dependency-free unless a feature justifies adding a dependency.
- Use relative asset paths; the production site is hosted beneath `/gpu-lab/`.
- Run `npm run check` and `python tests/browser.py` for simulator or interface changes.
- Validate new CUDA examples on a named toolkit/GPU when available; record untested status otherwise.
- Main is the authorised branch for the initial implementation; never force-push over remote work.
