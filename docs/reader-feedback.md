# Reader feedback and resulting guidance

Copyright © 2026 Christopher Snow.

This log captures feedback from 24–25 October 2026 and the subsequent chapter 2–3
content review. It is a record of reader feedback and author review, not a formal
newcomer study. The reusable guidance lives in [the chapter-writing guide](chapter-writing.md).
Statuses describe the known scope of the work; a rule being documented does not
mean every existing chapter already follows it.

| Feedback or finding | Guidance for future chapters | Current scope / follow-up |
| --- | --- | --- |
| The first exercise introduced a full kernel, pointers and launch terminology too early. | Start with a familiar operation and a small working example; explain concepts before assembling the complete function. | The revised chapter 1 establishes the pattern. Apply it to unfinished chapters. |
| Shared memory mentioned blocks before explaining them; “workers” introduced another unexplained term. | Define terms at first use, explain their purpose and use the same vocabulary consistently. | Review every new chapter for dependencies on later terminology. |
| The tutorial required scrolling back to a changing visual. | Keep code, explanation and visual together; repeat small examples and preserve each experiment’s state. | Continuous examples are established in the opening chapters; retain this pattern. |
| Meet the GPU diagrams interrupted the contents page. | Introduce diagrams in context and keep the full map as an optional reference. | The map moved to its own page in [PR #29](https://github.com/snowch/gpu-lab/pull/29). |
| Run appeared broken on a phone because its result was below a tall input grid. | Show feedback directly beneath Run; test it from the actual tap position, with no automatic jump. | Fixed in chapters 2–3 in [PR #30](https://github.com/snowch/gpu-lab/pull/30). Check future experiments too. |
| Inline code was much smaller than the surrounding paragraph. | Match inline code to prose size and keep code blocks readable on phones and tablets. | Typography improved in [PR #31](https://github.com/snowch/gpu-lab/pull/31). Retain readable sizes in new components. |
| Leading with GPU/PyTorch requirements suggested the browser exercises could not be run. | Lead with browser access; place local installation and hardware requirements beside the optional local path. | Chapter 1 wording improved in PR #31. The shared chapter 2–3 introduction still needs the same consistency pass. |
| Documentation-version advice sounded as though readers had to identify the simulator’s installed tool version. | Explain that browser models do not run PyTorch/CUDA; version matching applies to the reader’s own environment. | Clarified in [PR #32](https://github.com/snowch/gpu-lab/pull/32). Apply this distinction wherever new setup advice appears. |
| Reference instructions blended into prose, and the first lookup was detached from the original code. | Use labelled action callouts and repeat the relevant snippet beside an applied question. Distinguish a specified argument from an omitted default. | Reference tasks improved in [PR #33](https://github.com/snowch/gpu-lab/pull/33). Predict/Try prompts in chapters 2–3 still need consistent action styling. |
| The chapter 3 review found shape, layout and stride introduced together, with slicing and offset explanations arriving late. | Stage vocabulary around the next action and distinguish values from storage positions before using the diagram. | Open chapter 3 review follow-up; not implemented by this documentation change. |
| The column example asks readers to choose column 1, while the following packed example defaults to column 0. The comparison can imply packing changed the values. | Explicitly match the column and multiplier before comparing; independent panels must not imply shared state. | Open chapter 3 review follow-up. With multiplier 2, column 1 gives [4, 14, 24, 34, 44], while packed column 0 gives [2, 12, 22, 32, 42]. Matching column 1 restores equal outputs. |

When adding an entry, record the concrete confusion, the resulting guidance and the
remaining affected chapters. Mark an issue resolved only for the scope actually
changed. Link the implementation when available; keep proposed improvements and
observed reader failures distinguishable.
