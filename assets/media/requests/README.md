# Five-thread memory-sector recap

Copyright © 2026 Christopher Snow.

Chapter 5 links to this optional eight-slide recap after its explanation and
memory-explorer sections. It groups five FP32 input reads into aligned 32-byte
sectors, compares a row, column and packed copy, and demonstrates a row crossing
a sector boundary. A different row is left as a question before its answer.
All values, relative offsets, sector groups and counts come from `readTensor`
and `simulateLoad`; neither numerical model is changed.

The chosen mapping uses five participating lanes in one 32-position warp. Every
allocation begins on a sector boundary. The accounting covers one input load,
excluding packed-copy construction and output stores. Covered bytes are not
physical DRAM traffic, cache misses or a timing prediction.

Assets: native 3840 × 2160 / 30 fps H.264 with AAC audio, embedded English captions
and scene chapters; `captions.vtt`; eight-slide `slides.pdf`; and `poster.jpg`.
Source cues are `content/requests-scenes.json`. Measured duration, bytes, cue times
and voice provenance are in `content/requests-media.json`. The common native player
provides captions, a transcript, downloads, saved-state return and offline playback.

## Rebuild

Use the pinned Linux
[record-demo workflow](https://github.com/snowch/claude-skills/tree/c9a7c521568632aa216932f4c965df386498602a/plugins/demo-video/skills/record-demo):
Kokoro-82M v1.0 ONNX CPU, `af_heart`, speed 1.0. With that revision at
`/tmp/gpu-authoring-skills`, run from the repository:

```sh
node scripts/render-requests-recording.mjs
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/tts.py test-results/requests-recording af_heart 1.0
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/phonemes.py test-results/requests-recording --all
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/asr.py test-results/requests-recording small
uv run scripts/build-recording.py requests
```

FFmpeg, Chromium and `uv` are needed. `--slides-only` exports frames and the PDF
for review. The exporter uses device scale 3, measured sentence audio and
−16 LUFS / −1.5 dB true-peak targets, regenerating all derived assets together.
Review every slide and encoded scene, phonemes and the independent Whisper report.
Automated screening is not human listening approval. Ordinary course builds use
committed media and never run TTS or download speech models.
