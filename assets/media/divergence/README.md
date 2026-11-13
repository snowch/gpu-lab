# Active lane masks and unused positions recap

Copyright © 2026 Christopher Snow.

Chapter 8 links to this eight-slide recap after its independent exercise. Uniform,
alternating and rare paths lead into five-input examples, where other-path lanes
and unused positions are distinguished explicitly. A new 17-input example asks
for masks and arithmetic operations before its answer. All masks, input signs,
outputs and counts come from `branchWarp`; its numerical semantics are unchanged.

Lane cells show input signs, with the floating-point magnitudes in the legend.
Green cells identify the selected mask, white cells have inputs on another path,
and dashed cells have no input. The chosen trace issues positive arithmetic first,
then each negative operation, skipping empty paths. Loads, stores, branch overhead,
compiler transformations, reconvergence and GPU timing are outside this model.

Assets: native 3840 × 2160 / 30 fps H.264 with AAC audio, embedded English captions
and scene chapters; `captions.vtt`; eight-slide `slides.pdf`; and `poster.jpg`.
Source cues are `content/divergence-scenes.json`; measured duration, bytes, cue
times and voice provenance are in `content/divergence-media.json`. The common
native player provides captions, transcript, downloads and offline restoration.
Parent inputs, results and selected trace step are checked on return.

## Rebuild

Use the pinned Linux
[record-demo workflow](https://github.com/snowch/claude-skills/tree/c9a7c521568632aa216932f4c965df386498602a/plugins/demo-video/skills/record-demo):
Kokoro-82M v1.0 ONNX CPU, `af_heart`, speed 1.0. With that revision at
`/tmp/gpu-authoring-skills`, run from the repository:

```sh
node scripts/render-divergence-recording.mjs
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/tts.py test-results/divergence-recording af_heart 1.0
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/phonemes.py test-results/divergence-recording --all
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/asr.py test-results/divergence-recording small
uv run scripts/build-recording.py divergence
```

FFmpeg, Chromium and `uv` are needed. `--slides-only` exports frames and the PDF
for review. The exporter uses device scale 3, measured sentence audio and
−16 LUFS / −1.5 dB true-peak targets, regenerating all derived assets together.
Review every slide and encoded scene, phonemes and the independent Whisper report.
Automated screening is not human listening approval. Ordinary course builds use
committed media and never run TTS or download speech models.
