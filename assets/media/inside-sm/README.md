# Inside an SM recording

Copyright © 2026 Christopher Snow.

The approved recording replaces the beginner value inspector in `inside-sm.html`.
The separate warp/readiness walkthrough remains interactive in Chapter 6.

- `inside-sm.mp4`: 3840 × 2160, 30 fps, H.264/AAC; 209 seconds. Includes English
  subtitles and scene chapters. The browser also uses `captions.vtt` for native captions.
- `slides.pdf`: the approved eight-slide deck, also available as a download.
- `poster.jpg`: the opening slide, reduced to 1920 × 1080.
- `content/inside-sm-media.json`: measured duration and file size, used for the
  playback/download labels and checked against the video in browser tests.
- `content/inside-sm-scenes.json`: the narration and scene source. The page transcript
  is generated from this source, replacing spoken “S M” with the readable “SM”.

Narration uses Kokoro-82M, voice `af_heart`, speed 1.0, ONNX CPU inference. Audio was
normalised to −16 LUFS with a −1.5 dB true-peak target. The workflow adapts
[snowch/claude-skills: record-demo](https://github.com/snowch/claude-skills/tree/main/plugins/demo-video/skills/record-demo)
for Linux. Whisper small checked every scene against the script; differences were
number formatting and ordinary spellings of spoken acronyms/names. This is synthetic
narration, not an external speaker recording.

To revise: update the scene source, revise the corresponding slides and narration
with that workflow, render the deck at 3840 × 2160, then encode H.264/yuv420p at 30 fps
and AAC 160 kbps/48 kHz. Keep narration and slides synchronised; regenerate English
WebVTT captions, the PDF and opening JPEG together. Check pronunciation, captions,
all slide frames and the full video decode before replacing these approved files.
IBM Plex fonts are used; their licences are in `assets/fonts`.

Revised 11 November 2026: introduce instructions, small fast working registers,
floating-point arithmetic and FP32 at first use. Explain the wait between a load
request and arrival, the separate store, and reuse of register storage. The store
slide highlights the store path only. Speech screening and phoneme checks used the
same voice/model; these are automated checks, not human listening approval.

The recording is a conceptual explanation, not a captured PyTorch instruction trace.
It makes no execution-unit count, latency or throughput claims. Playback is manual;
`preload="none"` avoids downloading video before the reader requests it. The optional
whole-book offline download includes video, captions, poster and PDF. Verified cached
bytes support native media byte-range requests for offline seeking.
