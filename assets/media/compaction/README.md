# Place surviving token identities with exclusive offsets

Copyright © 2026 Christopher Snow.

Chapter 17's six-scene narrated recap distinguishes token identity from category,
constructs keep flags and exclusive destinations, follows token 5 into output slot
2, and compares forward/reverse inspection before a changed-selection prediction.
Every category, flag, offset, destination, partial output and completed identity
comes from `compaction`. A question mark denotes a genuinely unwritten model slot.
An empty selection uses no output slots while retaining eight input positions.

All flags/offsets are complete before scatter. Unique destinations preserve stable
survivor order independently of the two chosen write inspection sequences. These
are not GPU schedules, allocation measurements or performance results.

Assets: native 3840 × 2160 / 30 fps H.264 with AAC narration, embedded English
captions and scene chapters, external captions, PDF slides and a poster. Source
cues are `content/compaction-scenes.json`; measured cue times, bytes, duration and
voice provenance are in `content/compaction-media.json`. The shared player supplies
manual playback, transcript, downloads and parent/player/map-return restoration.

Rebuild with the pinned [record-demo workflow](https://github.com/snowch/claude-skills/tree/c9a7c521568632aa216932f4c965df386498602a/plugins/demo-video/skills/record-demo)
at `/tmp/gpu-authoring-skills`, using Kokoro v1.0 ONNX CPU, `af_heart`, speed 1.0:

```sh
node scripts/render-compaction-recording.mjs
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/tts.py test-results/compaction-recording af_heart 1.0
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/phonemes.py test-results/compaction-recording --all
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/asr.py test-results/compaction-recording small
uv run scripts/build-recording.py compaction
```

Review every slide/encoded scene, phoneme line and independent Whisper report.
Automated screening is not human listening approval. Finish speech changes before
exporting so sentence audio, captions and video have identical final sources.
Normal site builds consume committed media and never synthesise speech.
