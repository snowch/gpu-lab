# CPU and GPU tensor storage recap

Copyright © 2026 Christopher Snow.

Chapter 2 links to this optional recap after its new-case exercise. Eight slides
follow CPU input storage, GPU copy, GPU calculation and CPU result copy. They
distinguish zero inter-device transfer from GPU memory activity, then ask about
an eight-value result. All buffers, values and payload counts come from
`deviceJourney` in `src/foundations-model.mjs`. This chosen separate-memory example
does not predict timing, physical bus traffic or allocator behaviour.

The committed assets are native 3840 × 2160 / 30 fps H.264 video with AAC sound,
embedded English subtitles and scene chapters, `captions.vtt`, an eight-slide
`slides.pdf` and `poster.jpg`. Narration and transcript share
`content/devices-scenes.json`; measured times, size and voice provenance are in
`content/devices-media.json`. Native manual playback, captions, transcript,
downloads, parent-state return and paused offline restoration use the common player.

## Rebuild

Use the pinned Linux
[record-demo workflow](https://github.com/snowch/claude-skills/tree/c9a7c521568632aa216932f4c965df386498602a/plugins/demo-video/skills/record-demo):
Kokoro-82M v1.0 ONNX CPU, `af_heart`, speed 1.0. The following assumes that revision
is checked out at `/tmp/gpu-authoring-skills`. FFmpeg, Chromium and `uv` are needed.
The deck writer supplies CUDA's pronunciation for speech while captions retain
ordinary text.

```sh
node scripts/render-devices-recording.mjs
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/tts.py test-results/devices-recording af_heart 1.0
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/phonemes.py test-results/devices-recording --all
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/asr.py test-results/devices-recording small
uv run scripts/build-recording.py devices
```

Use `--slides-only` to review before encoding. The exporter renders at device
scale 3, joins measured sentence audio, normalises to −16 LUFS with a −1.5 dB
true-peak target, and regenerates captions, chapters, slides, poster and metadata.
Review every slide, encoded scene and phoneme and Whisper reports. Automated
screening is not human listening approval. Regenerate all affected derived media
after a revision. Ordinary course builds use committed media and never run TTS.
