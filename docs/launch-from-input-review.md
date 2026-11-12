# Input-derived launch practice review

Copyright © 2026 Christopher Snow.

## Scope and skills

The practice is a separate optional page after Chapter 2. The main reading path
still goes directly to Chapter 3. Chapter 1 continues to explain who supplies `n`
before the learner encounters its bounds check.

Applied public skills:

- [Course Builder](https://github.com/ericrisco/rsc-harness/blob/f3765d35e91690c0c7e511447da6cd0176ab38e0/skills/course-builder/SKILL.md):
  backward design, prerequisite order and observable evidence.
- [UX Design](https://github.com/f0d010c/stark/blob/ff94e5b4e1c98d259f3cde9f806406c4528deed4/skills/ux-design/SKILL.md):
  task-led information architecture, progressive disclosure, recognition rather
  than recall, keyboard access and return paths.

The existing audience is an AI practitioner comfortable with Python arrays and
indexing, without assumed CUDA or C++ knowledge. This is self-paced practice with
local answer comparisons, not certification or observed learner testing.

## Learning alignment

Outcome: given a small non-empty CPU input vector, derive storage and launch
settings that double every input exactly once, with surplus threads skipping
array accesses.

| Part of the outcome | Worked preparation | Independent evidence |
| --- | --- | --- |
| Derive element count and matching output size | Five-input vector, `.size()`, conversion to `int` | Nine-input plan; final value 12.0 differs from count and last index |
| Distinguish elements from bytes | Five FP32 elements, 20 bytes per allocation and copy | Nine-input 36-byte allocation; seven-input documentation task |
| Cover inputs and guard surplus threads | Two blocks of four threads, `n = 5` | Three blocks for nine inputs; identify writing and skipped indices |

Decisions from the review:

- Keep responsibility for `n` in Chapter 1. Optional practice must not hide a
  prerequisite needed to read later examples.
- Teach a correct end-to-end host setup before linking to the existing diagnostic
  repair workshop. Reuse the familiar kernel and five values to isolate the new
  relationship between data length, allocations and launch arguments.
- Introduce the CPU vector, element count, device pointer, byte units and helper
  before relying on them. Explain unfamiliar source fragments directly beneath
  the corresponding excerpts, in source order.
- State that equal input/output counts belong to this elementwise calculation;
  reduction and gather have different contracts.
- Generate displayed excerpts from the complete downloadable program. Exercise
  the same program with five and nine inputs against independent expected values
  in the CUDA functional-simulation workflow.

## UX decisions and evidence

The primary task is to follow the working host setup, then plan a launch for new
data. Use one downward reading flow and native answer disclosures. Avoid adding
an editor, setup wizard or another simulator for this task.

The major proposed risk was discoverability: an optional page hidden only in a
generic practice list would be easy to miss. The Chapter 2 closing link names
both the task and the audience writing custom CUDA. The contents also list the
page under Extra practice. The page labels itself Extra practice and names its
Chapter 1–2 prerequisites. It provides return, continuation and repair-workshop
links without renumbering the chapters.

The other risk was overload from complete host boilerplate. Keep short excerpts
visible, explain them with the shared walkthrough renderer, and put the complete
program in a disclosure and download. Keep installation in the desktop appendix.
The existing kernel is available locally so readers can connect the host argument
to the kernel parameter without navigating away.

Focused browser checks passed at 390, 820 and 1440 pixels in light and dark themes:
Chapter 2 entry, shared explanation highlighting by keyboard, initially closed
answer, native keyboard reveal, complete source identical to its download,
contained code scrolling and no page overflow. Browser Back restores Chapter 2's
changed multiplier and computed result. The entry link explicitly saves reading
state for return when the browser does not retain the live document. Without
JavaScript, code explanations, answer comparisons and downloads remain available.
Completion uses the same manual mark as the other practice pages.

Inspected built source explanations and screenshots for the count, allocation and
launch sections, alongside the six responsive full-page captures. Reviewed the
reading order from Chapter 2's closing new case through the practice invitation
and following recording link; reviewed the complete practice sequence, its local
answers and its continuation into Chapter 3's row/column selection opening.

Automated checks establish source consistency, navigation and interaction
behaviour. They do not establish learner comprehension or physical GPU execution
and performance.
