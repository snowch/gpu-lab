# Focus code explanations on CUDA

Copyright © 2026 Christopher Snow.

The learner already understands basic programming. The user clarified that the
course should explain GPU mechanisms and CUDA responsibilities without teaching
ordinary C/C++ syntax. The course plan and authoring checklist now state that
boundary explicitly while retaining Python familiarity and no assumed CUDA or
computer-architecture background.

Applied the established [Course Builder](https://github.com/ericrisco/rsc-harness/blob/f3765d35e91690c0c7e511447da6cd0176ab38e0/skills/course-builder/SKILL.md)
and [UX Design](https://github.com/f0d010c/stark/blob/ff94e5b4e1c98d259f3cde9f806406c4528deed4/skills/ux-design/SKILL.md)
checks. This is a copy/scope repair within the existing curriculum. The learning
outcome stays tracing values through thread indices, storage, launches and
cooperation; it does not add C/C++ proficiency as a prerequisite.

| Example | Removed language tutorial | Retained GPU reasoning |
| --- | --- | --- |
| Chapter 1 launch and guard | Variable declarations, braces and the meaning of an ordinary conditional | CPU-supplied count, launch coverage, valid indices, skipped threads and allocation consistency |
| Chapter 3 allocation workflow | C++ container definition, casts as syntax, pointer/address-of operators and naming conventions | Counts derived from CPU data, bytes per array, separate GPU allocation, copies and cleanup |
| Shared walkthroughs and repair | Semicolons, array-bracket notation, float-literal suffixes and variable-name commentary | Source-matched per-thread data flow, FP32 storage, bounds and selected input addresses |
| Reduction and matrix bridges | For-loop clauses, increment, compound assignment and logical-AND syntax | Partner distances, participating threads, private sums, output coordinates and barriers |
| Optional WMMA reference | C++ namespace tutorial | Warp-cooperative fragment shapes, input formats, row pitches and accumulator behaviour |
| Profiling | Meaning of the unused underscore loop variable | Warm-up, capture scope, synchronisation and measurement boundaries |

The code, numerical models, exercise controls, downloads and videos are unchanged.
Walkthrough selection still highlights the original source. Existing source/order
checks remain, with the obsolete float-suffix assertion focused on per-thread FP32
data flow, and the launch-order check following the count explanation rather than
a C++ declaration in prose.

Built review covers the preceding launch responsibility, revised count/guard
explanation and following complete kernel/diagnostic example in Chapter 1; Chapter
3 input count → allocation → launch; and the source/walkthrough/diagram sequence for
reduction, matrix multiplication and WMMA. Check phone, tablet and desktop in both
themes, static reading without JavaScript and keyboard highlighting. Existing full
browser checks verify remaining chapters and interactions. No learner study or
hardware-performance validation is claimed.
