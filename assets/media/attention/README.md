# Online attention and visible rescaling recap

Copyright © 2026 Christopher Snow.

Chapter 12 links to this optional eight-slide recap after its independent exercise.
Weighted value products lead into full score/weight intermediate reads and writes,
then a two-key online recurrence. Later larger scores rescale both non-empty
retained totals. A four-key tile question applies the same update while changing
single-query scratch. Values and counts come from `attention` in `src/ai-models.mjs`.

The deterministic key fixture uses `((2*i+j+4)%7-3)/2` in the browser and generated
PyTorch source. Query zero's maxima across two-key tiles are −1.0, 1.5, 2.0, 2.0;
this makes both later rescaling steps visible. Recurrence and accounting rules are
unchanged. All query outputs are checked against stable materialised attention.
Browser arithmetic uses JavaScript doubles; displayed values are rounded and byte
accounting assumes FP32. Selected intermediate transfers and single-query scratch
exclude Q/K/V, output, tile rereads and inspection arrays as labelled. This is not
production FlashAttention execution, total traffic or a GPU time/error measurement.

Assets: native 3840 × 2160 / 30 fps H.264 with AAC audio, embedded English captions
and scene chapters; `captions.vtt`; eight-slide `slides.pdf`; and `poster.jpg`.
Source cues are `content/attention-scenes.json`; measured duration, bytes, cue
times and voice provenance are in `content/attention-media.json`. The native
player supplies captions, transcript, downloads, state-preserving return and
offline restoration. Return checks include the selected trace and independent work.

## Rebuild

Use the pinned Linux
[record-demo workflow](https://github.com/snowch/claude-skills/tree/c9a7c521568632aa216932f4c965df386498602a/plugins/demo-video/skills/record-demo):
Kokoro-82M v1.0 ONNX CPU, `af_heart`, speed 1.0. With that revision at
`/tmp/gpu-authoring-skills`, run from the repository:

```sh
node scripts/render-attention-recording.mjs
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/tts.py test-results/attention-recording af_heart 1.0
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/phonemes.py test-results/attention-recording --all
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/asr.py test-results/attention-recording small
uv run scripts/build-recording.py attention
```

FFmpeg, Chromium and `uv` are needed. `--slides-only` exports frames and the PDF
for review. The exporter uses device scale 3, measured sentence audio and
−16 LUFS / −1.5 dB true-peak targets, regenerating all derived assets together.
Review every slide and encoded scene, phonemes and the independent Whisper report.
Automated screening is not human listening approval. Ordinary course builds use
committed media and never run TTS or download speech models.
