# Tensor row and column selection recap

Copyright © 2026 Christopher Snow.

Chapter 3 links to this optional recap after its explanation exercise. Eight
slides connect zero-based coordinates and colons to five selected inputs, then
to their elementwise results. A new column-3 question checks interpretation
before its answer. Grid values, coordinates and outputs come from `readTensor`
in `src/foundations-model.mjs`. The diagrams describe logical selections; storage
offsets are left to Chapter 4, and no thread mapping or GPU timing is inferred.

Assets: native 3840 × 2160 / 30 fps H.264 video with AAC sound, embedded English
subtitles and scene chapters; browser `captions.vtt`; eight-slide `slides.pdf`;
and `poster.jpg`. Narration and transcript share `content/reading-scenes.json`.
Measured duration, bytes, cue times and voice provenance are in
`content/reading-media.json`. The page uses the common native player, captions,
transcript, downloads, saved-state return and offline update restoration.

## Rebuild

Use the pinned Linux
[record-demo workflow](https://github.com/snowch/claude-skills/tree/c9a7c521568632aa216932f4c965df386498602a/plugins/demo-video/skills/record-demo):
Kokoro-82M v1.0 ONNX CPU, `af_heart`, speed 1.0. With that revision checked out at
`/tmp/gpu-authoring-skills`, run from this repository:

```sh
node scripts/render-reading-recording.mjs
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/tts.py test-results/reading-recording af_heart 1.0
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/phonemes.py test-results/reading-recording --all
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/asr.py test-results/reading-recording small
uv run scripts/build-recording.py reading
```

FFmpeg, Chromium and `uv` are required. Use `--slides-only` for a first review.
The exporter renders at device scale 3, joins exact sentence audio, normalises
to −16 LUFS / −1.5 dB true-peak targets and regenerates all derived media.
Review every slide, encoded scene, phoneme and Whisper report; automated
screening is not human listening approval. Ordinary course builds use committed
media and never run TTS or download speech models.
