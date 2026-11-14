# Count token destinations without losing updates

Copyright © 2026 Christopher Snow.

Chapter 15's six-scene narrated recap distinguishes token identity from category,
protects competing increments with atomic addition, merges per-block partials,
then asks about concentrated input before revealing its merge count. Figures use
`histogram` model results; the atomic-update close-up shows only the selected
input prefix. Two blocks of four use four integer bins. Counts and operation
totals are neither a hardware instruction schedule nor measured GPU performance.

Committed assets: native 3840 × 2160 / 30 fps H.264 with AAC narration, embedded
English captions and scene chapters, `captions.vtt`, `slides.pdf` and `poster.jpg`.
The scene/script source is `content/histograms-scenes.json`; measured cue times,
bytes, duration and voice provenance are in `content/histograms-media.json`.
The common player provides manual playback, a transcript and downloads. Parent
settings, result and selected step survive a return; paused playback also restores.

Rebuild with the pinned [record-demo workflow](https://github.com/snowch/claude-skills/tree/c9a7c521568632aa216932f4c965df386498602a/plugins/demo-video/skills/record-demo)
at `/tmp/gpu-authoring-skills`, using Kokoro v1.0 ONNX CPU, `af_heart`, speed 1.0:

```sh
node scripts/render-histograms-recording.mjs
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/tts.py test-results/histograms-recording af_heart 1.0
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/phonemes.py test-results/histograms-recording --all
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/asr.py test-results/histograms-recording small
uv run scripts/build-recording.py histograms
```

Review all slides and encoded scenes, cue alignment, phonemes and the independent
Whisper report. Automated speech screening is not human listening approval.
Ordinary course builds use the committed assets and never synthesise speech or
fetch models. Speech authoring adds no browser runtime dependency.
