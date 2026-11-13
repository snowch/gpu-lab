# Recurring section cues

Reviewed 13 November 2026 against the built course.

Applied the [UX Design skill](https://github.com/f0d010c/stark/blob/ff94e5b4e1c98d259f3cde9f806406c4528deed4/skills/ux-design/SKILL.md)
and [Course Builder skill](https://github.com/ericrisco/rsc-harness/blob/f3765d35e91690c0c7e511447da6cd0176ab38e0/skills/course-builder/SKILL.md).
The audience and self-paced format are already defined in the course plan. The
learner's task is to distinguish an optional recap, local execution, authoritative
references and documentation practice while retaining the chapter's reading flow.

The selected pattern keeps descriptive headings and adds a small decorative icon,
a border and a restrained surface treatment. Recaps use a play symbol; local
execution uses a terminal; references use an open book; documentation practice
uses a compass. Text and shape identify the roles independently of colour. The
icons are hidden from assistive technology and introduce no new focus stops.
Ordinary lesson headings keep their existing presentation. Definition and task
callouts keep their established treatment, so the main learning activities retain
priority. No extra navigation or interaction is introduced.

The final chapter's desktop download now uses the same component as the other
chapters, removing its separate local-execution paragraph from Where next. It
still follows the final recommendation and continuation guidance. Existing
recap links, reference targets, native disclosures and downloads keep their IDs
and destinations. The separate SM video remains an optional hardware appendix.

Reviewed the preceding new-case task, recap, desktop section, references and
following documentation practice in built pages. Preview screenshots cover 390,
820 and 1440 pixel widths in light and dark themes. Browser coverage additionally
uses 360 pixels, checks expanded optional sections and extra-practice pages,
verifies decorative icons and unchanged heading names, follows the recap link by
keyboard, and reads the section roles without JavaScript. Code and prediction
interactions remain independent of these supporting sections.

The missing Chapter 1, 3 and 14 recaps are a separate recording task. Their talk
tracks and model-derived slide previews are prepared for the record-demo
workflow's required script approval; this section styling does not publish an
unavailable video or imply that it has already been recorded.

The offline checks exposed a remaining map restart race: the worker independently
restarted the embedded map as well as its parent reader. Restart participation
now includes top-level and auxiliary course windows; embedded frames follow their
parent. The reader already captures map disclosures and scroll, and the stale-child
snapshot regression remains in place. A worker contract checks participant
ownership, while the complete offline browser suite checks coordinated updates.

The embedded-map client also ignores an independent reload request from an older
already-active worker, allowing its parent to perform the coordinated reload. The
map browser regression exercises this older-worker message sequence as well as
stale child snapshots, preserving the map view through deployment transitions.
