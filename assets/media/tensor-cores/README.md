# Input conversion and FP32 accumulation recap

Copyright © 2026 Christopher Snow.

Chapter 10 links to this optional eight-slide recap after its independent exercise.
It traces near-one input conversion before sequential FP32 accumulation, exposes
lost information through cancellation, compares very small FP16/BF16 inputs, and
asks about exactly representable inputs before showing their result. All displayed
inputs, partial sums, reference sums and counts come from `precisionMatmul`.
Its numerical rules and the parent experiments are unchanged.

Input conversion is nearest-even; each addition rounds to FP32 in K order. The
original-input reference uses the same order. Displayed values are rounded by the
course's shared value formatter. The 4,096 scalar multiply–accumulates describe
arithmetic work, not hardware instructions, tensor-core execution or elapsed time.
The common speech writer explicitly pronounces matrix A as the letter name.

Assets: native 3840 × 2160 / 30 fps H.264 with AAC audio, embedded English captions
and scene chapters; `captions.vtt`; eight-slide `slides.pdf`; and `poster.jpg`.
Source cues are `content/tensor-cores-scenes.json`; measured duration, bytes, cue
times and voice provenance are in `content/tensor-cores-media.json`. The native
player supports captions, transcript, downloads, state-preserving return and offline
restoration. Return checks preserve the selected trace step and independent work.

## Rebuild

Use the pinned Linux
[record-demo workflow](https://github.com/snowch/claude-skills/tree/c9a7c521568632aa216932f4c965df386498602a/plugins/demo-video/skills/record-demo):
Kokoro-82M v1.0 ONNX CPU, `af_heart`, speed 1.0. With that revision at
`/tmp/gpu-authoring-skills`, run from the repository:

```sh
node scripts/render-tensor-cores-recording.mjs
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/tts.py test-results/tensor-cores-recording af_heart 1.0
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/phonemes.py test-results/tensor-cores-recording --all
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/asr.py test-results/tensor-cores-recording small
uv run scripts/build-recording.py tensor-cores
```

FFmpeg, Chromium and `uv` are needed. `--slides-only` exports frames and the PDF
for review. The exporter uses device scale 3, measured sentence audio and
−16 LUFS / −1.5 dB true-peak targets, regenerating all derived assets together.
Review every slide and encoded scene, phonemes and the independent Whisper report.
Automated screening is not human listening approval. Ordinary course builds use
committed media and never run TTS or download speech models.
