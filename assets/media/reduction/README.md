# Shared memory and barriers recording

Copyright © 2026 Christopher Snow.

Chapter 8 links to this optional recap after its transfer exercise. The recording
follows four inputs through shared-memory writes, the initial block barrier,
partner-distance-2 additions, another barrier and the final addition. A separate
diagnostic shows an unwritten partner read and assigns no numeric result. An
eight-thread question checks barrier participation and write-before-read ordering.

- `reduction.mp4`: native 3840 × 2160, 30 fps H.264/yuv420p, AAC 160 kbps/48 kHz,
  embedded English subtitles and scene chapters.
- `captions.vtt`: native browser captions, timed to individually synthesised
  sentence cues rather than estimated from word counts.
- `slides.pdf`: the eleven-slide deck; `poster.jpg`: opening slide at 1920 × 1080.
- `content/reduction-scenes.json`: titles and narration; also generates the page
  transcript. `content/reduction-media.json`: measured file size, duration, scene
  and cue times, and speech-model provenance.

These are conceptual diagrams of the chapter's chosen algorithm, not a captured
PyTorch implementation, a compiler trace or GPU timing evidence. Values, shared
snapshots and contribution sets come from `reduceBlock` in `src/ai-models.mjs`.
No simulator semantics were changed for the recording. The video uses manual
playback, captions, a transcript, downloads and paused playback restoration. The
whole-course offline download includes all media and supports byte-range seeking.

## Rebuild

The speech tooling adapts
[record-demo](https://github.com/snowch/claude-skills/tree/c9a7c521568632aa216932f4c965df386498602a/plugins/demo-video/skills/record-demo)
on Linux: Kokoro-82M v1.0, ONNX CPU, `af_heart`, speed 1.0. Use that pinned
revision's `scripts/tts.py`, `phonemes.py` and `asr.py`. `uv` installs each script's
declared dependencies; FFmpeg and Chromium must be installed separately.

From the GPU Lab repository, with the pinned skill checked out in
`/tmp/gpu-authoring-skills`:

```sh
node scripts/render-reduction-recording.mjs
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/tts.py test-results/reduction-recording af_heart 1.0
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/phonemes.py test-results/reduction-recording --all
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/asr.py test-results/reduction-recording small
uv run scripts/build-reduction-recording.py
```

The export script serves the deck locally, renders at device scale 3, exports the
PDF and JPEG, joins exact audio cues, normalises to −16 LUFS with a −1.5 dB
true-peak target, and regenerates captions and measured metadata. It needs no GPU.
Ordinary course builds use the committed media and never download speech models.

Review every slide and encoded scene boundary, phonemes and the independent
Whisper report before shipping. Speech checks are automated screening, not human
listening approval. Revisions must regenerate affected audio, captions, transcript,
slides, poster and duration/size metadata together.
