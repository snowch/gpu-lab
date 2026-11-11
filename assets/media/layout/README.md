# Tensor storage, stride and packed-copy recap

Copyright © 2026 Christopher Snow.

Chapter 4 links to this optional recap after its explanation exercise. Eight
slides distinguish values from element/byte offsets, follow row and column views
through row-major storage, compare a packed copy, and show an already-contiguous
row sharing storage at a non-zero offset. A column-3 copy question applies these
ideas before its answer. Values, offsets, strides, copy payloads and outputs come
from `readTensor` in `src/foundations-model.mjs`; no model semantics change.

The memory strip wraps after ten elements for display. Small labels count
elements from the start of the named storage; these are relative offsets, not
physical addresses. Original storage remains visible beside a new packed buffer.
Counts describe FP32 values copied and make no GPU timing claim.

Assets: native 3840 × 2160 / 30 fps H.264 video with AAC sound, embedded English
subtitles and scene chapters; `captions.vtt`; eight-slide `slides.pdf`; and
`poster.jpg`. Narration/transcript source is `content/layout-scenes.json`.
Measured bytes, duration, exact cue times and voice provenance are in
`content/layout-media.json`. The native player supports captions, transcript,
downloads, state-preserving return and paused offline restoration.

## Rebuild

Use the pinned Linux
[record-demo workflow](https://github.com/snowch/claude-skills/tree/c9a7c521568632aa216932f4c965df386498602a/plugins/demo-video/skills/record-demo):
Kokoro-82M v1.0 ONNX CPU, `af_heart`, speed 1.0. With that revision at
`/tmp/gpu-authoring-skills`, run from the repository:

```sh
node scripts/render-layout-recording.mjs
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/tts.py test-results/layout-recording af_heart 1.0
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/phonemes.py test-results/layout-recording --all
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/asr.py test-results/layout-recording small
uv run scripts/build-recording.py layout
```

FFmpeg, Chromium and `uv` are needed. `--slides-only` exports frames and the PDF
for review. The exporter uses device scale 3, measured sentence audio and
−16 LUFS / −1.5 dB true-peak targets, regenerating all derived assets together.
Review every slide and encoded scene, phonemes and the independent Whisper report.
Automated screening is not human listening approval. Ordinary course builds use
committed media and never run TTS or download speech models.
