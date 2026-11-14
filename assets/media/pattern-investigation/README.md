# Combine counts, bin starts and ranks for stable token grouping

Copyright © 2026 Christopher Snow.

Chapter 20's six-scene final recap distinguishes counts-only from stable grouping,
constructs disjoint category regions, follows token 5's bin start plus rank into
output slot 2, and checks identities/order. A concentrated-input question comes
before its answer, including empty-bin starts at the output end and the need for
stability beyond unique atomic arrival slots. Every count, offset, rank, partial
identity and completed output comes from `routing`.

The opening program uses PyTorch stable sorting; the browser studies a separate
count/scan/rank/scatter construction. Eight local tokens, four categories, no
dropping, transfers between devices or expert capacity limit are explicit. No
GPU timing, physical traffic, measured speedup or fastest implementation is claimed.

Assets: native 3840 × 2160 / 30 fps H.264 with AAC narration, embedded English
captions and scene chapters, external captions, PDF slides and a poster. Source
cues are `content/pattern-investigation-scenes.json`; measured cue times, bytes, duration and
voice provenance are in `content/pattern-investigation-media.json`. The shared player supplies
manual playback, transcript, downloads and parent/player/map-return restoration.

Rebuild with the pinned [record-demo workflow](https://github.com/snowch/claude-skills/tree/c9a7c521568632aa216932f4c965df386498602a/plugins/demo-video/skills/record-demo)
at `/tmp/gpu-authoring-skills`, using Kokoro v1.0 ONNX CPU, `af_heart`, speed 1.0:

```sh
node scripts/render-pattern-investigation-recording.mjs
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/tts.py test-results/pattern-investigation-recording af_heart 1.0
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/phonemes.py test-results/pattern-investigation-recording --all
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/asr.py test-results/pattern-investigation-recording small
uv run scripts/build-recording.py pattern-investigation
```

Review every slide/encoded scene, phoneme line and independent Whisper report.
Automated screening is not human listening approval. Finish speech changes before
exporting so sentence audio, captions and video have identical final sources.
Normal site builds consume committed media and never synthesise speech.
