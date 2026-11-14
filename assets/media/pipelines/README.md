# Order copy, compute and buffer reuse before expecting overlap

Copyright © 2026 Christopher Snow.

Chapter 19's six-scene recap distinguishes ready from consumed handoffs, compares
serial and overlapping synthetic schedules on the same axis, and follows chunk 2
reusing slot 0. A changed-copy-duration question precedes its answer. Every
interval and total derives from `pipeline`; slot holding ends at consumer
completion, not copy completion. The opening PyTorch program has independent
allocations and is not claimed to implement this reusable-slot model.

One copy engine, one compute queue, two reusable slots and fixed equal-chunk
durations are explicit teaching assumptions. These are not GPU timings, profiler
traces or measured speedups. Queuing launches and event waits do not imply a CPU
wait, and a non-blocking option alone does not prove real overlap.

Assets: native 3840 × 2160 / 30 fps H.264 with AAC narration, embedded English
captions and scene chapters, external captions, PDF slides and a poster. Source
cues are `content/pipelines-scenes.json`; measured cue times, bytes, duration and
voice provenance are in `content/pipelines-media.json`. The shared player supplies
manual playback, transcript, downloads and parent/player/map-return restoration.

Rebuild with the pinned [record-demo workflow](https://github.com/snowch/claude-skills/tree/c9a7c521568632aa216932f4c965df386498602a/plugins/demo-video/skills/record-demo)
at `/tmp/gpu-authoring-skills`, using Kokoro v1.0 ONNX CPU, `af_heart`, speed 1.0:

```sh
node scripts/render-pipelines-recording.mjs
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/tts.py test-results/pipelines-recording af_heart 1.0
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/phonemes.py test-results/pipelines-recording --all
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/asr.py test-results/pipelines-recording small
uv run scripts/build-recording.py pipelines
```

Review every slide/encoded scene, phoneme line and independent Whisper report.
Automated screening is not human listening approval. Finish speech changes before
exporting so sentence audio, captions and video have identical final sources.
Normal site builds consume committed media and never synthesise speech.
