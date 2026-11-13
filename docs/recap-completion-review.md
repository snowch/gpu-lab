# Complete chapter recap coverage

The user approved the Chapter 1, 3 and 14 scripts on 13 November 2026 before
narration generation. These fill the three gaps in the fourteen-chapter course;
existing recaps retain their narration, and the separate SM appendix stays linked.

Applied the [Course Builder skill](https://github.com/ericrisco/rsc-harness/blob/f3765d35e91690c0c7e511447da6cd0176ab38e0/skills/course-builder/SKILL.md)
and [UX Design skill](https://github.com/f0d010c/stark/blob/ff94e5b4e1c98d259f3cde9f806406c4528deed4/skills/ux-design/SKILL.md).
The learner, prerequisites and self-paced format follow the established course
plan. Recaps reinforce existing outcomes rather than adding a second curriculum.

| Chapter | Observable recap outcome | New-case comparison |
| --- | --- | --- |
| 1 | Trace a value through global index, block and guard; distinguish count from launch coverage. | Cover nine inputs with four-thread blocks; explain the missing input and extra indices. |
| 3 | Derive element/byte counts and launch settings from CPU data; trace allocation, copies, result collection and cleanup. | Derive nine elements, 36 bytes per array and three four-thread blocks together. |
| 14 | Evaluate a reuse hypothesis using correct output, explicit loads and per-block resource costs; specify missing hardware evidence. | For eight-by-eight inputs and tile width two, separate 512 loads, 64 stores and four-block capacity. |

Each recap has eight slides, including a pause before the new-case answer.
`hello-model.mjs` and `ai-models.mjs` supply diagram values and counts; native
four-K rendering preserves the shared course deck style. The scripts distinguish
manual reference mappings, browser counts and synthetic budgets from framework
implementation choices and physical GPU performance.

The chapter link follows the preceding application exercise. Chapter 14’s recap
precedes Where next; desktop setup and references remain in their established
order. The player reuses native controls, English captions, optional transcript,
video/PDF downloads and the existing return-state component. Required chapter
content stays readable without watching a video. No installation or GPU is needed.

The pinned [record-demo workflow](https://github.com/snowch/claude-skills/blob/c9a7c521568632aa216932f4c965df386498602a/plugins/demo-video/skills/record-demo/SKILL.md)
uses the project’s existing Kokoro ONNX af_heart voice at speed 1.0. Captions,
transcripts and cue metadata share the approved text. Phoneme and full ASR
screening are automated checks; no human listening approval or learner study is
claimed. Media metadata records measured durations, byte counts and speech provenance.

Validation covers all fourteen recap destinations; new native playback and
caption loading; keyboard use; source/transcript/media agreement; paused player
and lesson-state restoration; reading without JavaScript; phone/tablet/desktop
layouts in both themes; and offline playback/state restoration during an update.
The built reading-order review includes the preceding application, recap link,
player/transcript and return to the following desktop/continuation content.
