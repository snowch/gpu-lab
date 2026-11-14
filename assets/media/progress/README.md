# Distinguish resource waits, barriers and scheduling dependencies

Copyright © 2026 Christopher Snow.

Chapter 18's six-scene narrated recap follows model-derived exclusive fork
ownership and next-request wait edges. B can finish first in the chosen ordered
execution; the own-fork-first policy closes a three-way wait cycle. Four-thread
barrier participation is a separate agreement. A one-resident-block question
precedes the ordered producer/consumer launch explanation.

Ownership states come from `philosophers`; barrier states come from `barrier`.
The capacity picture illustrates the chapter's stated dependency, not a residency
simulator. No fairness proof, GPU schedule, guaranteed hardware hang or timing
result is claimed.

Assets: native 3840 × 2160 / 30 fps H.264 with AAC narration, embedded English
captions and scene chapters, external captions, PDF slides and a poster. Source
cues are `content/progress-scenes.json`; measured cue times, bytes, duration and
voice provenance are in `content/progress-media.json`. The shared player supplies
manual playback, transcript, downloads and parent/player/map-return restoration.

Rebuild with the pinned [record-demo workflow](https://github.com/snowch/claude-skills/tree/c9a7c521568632aa216932f4c965df386498602a/plugins/demo-video/skills/record-demo)
at `/tmp/gpu-authoring-skills`, using Kokoro v1.0 ONNX CPU, `af_heart`, speed 1.0:

```sh
node scripts/render-progress-recording.mjs
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/tts.py test-results/progress-recording af_heart 1.0
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/phonemes.py test-results/progress-recording --all
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/asr.py test-results/progress-recording small
uv run scripts/build-recording.py progress
```

Review every slide/encoded scene, phoneme line and independent Whisper report.
Automated screening is not human listening approval. Finish speech changes before
exporting so sentence audio, captions and video have identical final sources.
Normal site builds consume committed media and never synthesise speech.
