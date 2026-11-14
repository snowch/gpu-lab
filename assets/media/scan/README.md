# Build output positions from prefix sums

Copyright © 2026 Christopher Snow.

Chapter 16's six-scene narrated recap follows selection flags through completed
old/new snapshots, partner distances and the inclusive-to-exclusive shift. A
four-flag prediction precedes its answer. All row values, source positions and
output counts come from `scan`; arrows identify the previous-snapshot operands.
Repeated prefix values are allowed. Only selected tokens use exclusive offsets
for writes, and the output length includes the final flag.

The one-block integer teaching algorithm uses separate stage arrays and collective
ordering. Distances are dependencies, not hardware cycles or PyTorch's kernel
trace. Multiple blocks require an additional ordered combination of block totals.

Assets: native 3840 × 2160 / 30 fps H.264 with AAC narration, embedded English
captions and scene chapters, external captions, PDF slides and a poster. Source
cues are `content/scan-scenes.json`; measured times, bytes, duration and voice
provenance are in `content/scan-media.json`. Manual native playback, transcript,
downloads, parent experiment restoration and paused player restoration use the
shared book components.

Rebuild with the pinned [record-demo workflow](https://github.com/snowch/claude-skills/tree/c9a7c521568632aa216932f4c965df386498602a/plugins/demo-video/skills/record-demo)
at `/tmp/gpu-authoring-skills`, using Kokoro v1.0 ONNX CPU, `af_heart`, speed 1.0:

```sh
node scripts/render-scan-recording.mjs
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/tts.py test-results/scan-recording af_heart 1.0
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/phonemes.py test-results/scan-recording --all
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/asr.py test-results/scan-recording small
uv run scripts/build-recording.py scan
```

Review every slide, encoded scene, phoneme line and independent Whisper report.
Automated speech screening is not human listening approval. Finish synthesis
before export so cues, speech and video share the same final source. Normal site
builds use committed media and never download or synthesise speech models.
