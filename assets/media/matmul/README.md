# Matrix input reuse recording

Copyright © 2026 Christopher Snow.

Chapter 9 links to this optional recap after its transfer exercise. Ten slides
connect one output's dot product to shared input tiles, reuse across output rows
and columns, private partial sums retained between K phases, and complete input
load counts. A separate 8 × 8 question asks about one phase and the scope of sharing.

- `matmul.mp4`: native 3840 × 2160, 30 fps H.264/yuv420p, AAC 160 kbps/48 kHz,
  embedded English subtitles and scene chapters.
- `captions.vtt`: browser captions timed to individually synthesised sentence cues.
- `slides.pdf`: ten-slide deck; `poster.jpg`: opening slide at 1920 × 1080.
- `content/matmul-scenes.json`: titles and narration, also generating the transcript.
  `content/matmul-media.json`: measured size, duration, scene/cue times and voice provenance.

Values and counts come from `tiledMatmul` in `src/ai-models.mjs`. These diagrams
illustrate the chapter's teaching algorithm, excluding caches, physical memory
transaction counts, PyTorch implementation selection and measured GPU speed.
No model semantics change. Playback is manual; captions, transcript, downloads,
paused restoration and whole-course offline byte-range seeking are supported.

## Rebuild

The speech tooling adapts
[record-demo](https://github.com/snowch/claude-skills/tree/c9a7c521568632aa216932f4c965df386498602a/plugins/demo-video/skills/record-demo)
on Linux: Kokoro-82M v1.0, ONNX CPU, `af_heart`, speed 1.0. Use that pinned
revision's `scripts/tts.py`, `phonemes.py` and `asr.py`. `uv` installs declared
dependencies; FFmpeg and Chromium must be installed separately.

From the repository, with the pinned skill in `/tmp/gpu-authoring-skills`:

```sh
node scripts/render-matmul-recording.mjs
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/tts.py test-results/matmul-recording af_heart 1.0
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/phonemes.py test-results/matmul-recording --all
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/asr.py test-results/matmul-recording small
uv run scripts/build-recording.py matmul
```

The source generator supplies a pronunciation override for the letter A in
“matrix A”; visible captions keep ordinary text. The shared exporter serves the
deck locally, renders at device scale 3, joins exact audio cues and normalises
to −16 LUFS with a −1.5 dB true-peak target. It generates captions, chapters,
PDF, poster and measured metadata. Use `--slides-only` to review frames before
encoding. The Chapter 8 wrapper continues to use this exporter with `reduction`.
Ordinary course builds use committed media and never download speech models.

Review every slide and encoded scene boundary, phonemes and the independent
Whisper report. Automated speech screening does not constitute human listening
approval. Regenerate affected audio and all derived media together after revisions.
