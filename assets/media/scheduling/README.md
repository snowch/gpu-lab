# Ready and waiting warp recap

Copyright © 2026 Christopher Snow.

Chapter 6 links to this optional eight-slide recap after its independent transfer
exercise. Loads, thread registers and shared execution hardware lead into the
single-issue teaching scheduler. The slides follow one and two resident warps,
compare idle slots alongside changing instruction counts, and ask about a new
load latency before revealing readiness. Every timeline, card and count is derived
from `scheduleWarps`; scheduler semantics and chapter experiments are unchanged.

All warps are resident and ready initially. The round-robin search skips waiting
and completed warps. The fixed-latency model ends at final store issue, without
store-drain delay; it models neither resource limits nor bandwidth competition.
It does not compute tensor values or capture a compiler trace or GPU timing.

Assets: native 3840 × 2160 / 30 fps H.264 with AAC audio, embedded English captions
and scene chapters; `captions.vtt`; eight-slide `slides.pdf`; and `poster.jpg`.
Source cues are `content/scheduling-scenes.json`; measured duration, bytes, cue
times and voice provenance are in `content/scheduling-media.json`. The common
native player supports captions, transcript, downloads and offline restoration.
Parent inputs, results and the selected trace step survive the return journey.

## Rebuild

Use the pinned Linux
[record-demo workflow](https://github.com/snowch/claude-skills/tree/c9a7c521568632aa216932f4c965df386498602a/plugins/demo-video/skills/record-demo):
Kokoro-82M v1.0 ONNX CPU, `af_heart`, speed 1.0. With that revision at
`/tmp/gpu-authoring-skills`, run from the repository:

```sh
node scripts/render-scheduling-recording.mjs
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/tts.py test-results/scheduling-recording af_heart 1.0
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/phonemes.py test-results/scheduling-recording --all
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/asr.py test-results/scheduling-recording small
uv run scripts/build-recording.py scheduling
```

FFmpeg, Chromium and `uv` are needed. `--slides-only` exports frames and the PDF
for review. The exporter uses device scale 3, measured sentence audio and
−16 LUFS / −1.5 dB true-peak targets, regenerating all derived assets together.
Review every slide and encoded scene, phonemes and the independent Whisper report.
Automated screening is not human listening approval. Ordinary course builds use
committed media and never run TTS or download speech models.
