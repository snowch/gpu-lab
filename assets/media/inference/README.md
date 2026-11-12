# Cache capacity and inference budget recap

Copyright © 2026 Christopher Snow.

Chapter 12 links to this optional eight-slide recap after its independent exercise.
It distinguishes model-managed keys and values from hardware caches, counts occupied
payload, then compares one-token decode, whole-prompt prefill and batch reuse.
A longer-context question for four independent sequences separates fourfold cache
growth from fixed weight reads and new entries. Counts and lower bounds come from `inferenceBudget`
in `src/ai-models.mjs`; the numerical model is unchanged.

The synthetic decoder uses 32 layers, hidden width 4,096, KV width 1,024, seven
billion parameters and two-byte weights/cache values. It assumes one weight read
per invocation, including ideal batch reuse, and full square prefill attention
without causal triangular savings. Counted transfers exclude activation traffic
and other work. Decimal bandwidth/compute rates and binary cache units are labelled.
The maximum of memory and compute bounds is an ideal lower bound, not a named
model's latency, actual memory traffic or measured GPU throughput. Amortised time
per token is distinct from a single user's next-token latency. The opening small
PyTorch append example is separate from the budget's synthetic dimensions.

Assets: native 3840 × 2160 / 30 fps H.264 with AAC audio, embedded English captions
and scene chapters; `captions.vtt`; eight-slide `slides.pdf`; and `poster.jpg`.
Source cues are `content/inference-scenes.json`; measured duration, bytes, cue
times and voice provenance are in `content/inference-media.json`. The common
native player provides transcript, downloads, state-preserving return and offline
playback. Return checks preserve the chosen phase and accounting step alongside
independent capacity-experiment state.

## Rebuild

Use the pinned Linux
[record-demo workflow](https://github.com/snowch/claude-skills/tree/c9a7c521568632aa216932f4c965df386498602a/plugins/demo-video/skills/record-demo):
Kokoro-82M v1.0 ONNX CPU, `af_heart`, speed 1.0. With that revision at
`/tmp/gpu-authoring-skills`, run from the repository:

```sh
node scripts/render-inference-recording.mjs
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/tts.py test-results/inference-recording af_heart 1.0
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/phonemes.py test-results/inference-recording --all
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/asr.py test-results/inference-recording small
uv run scripts/build-recording.py inference
```

FFmpeg, Chromium and `uv` are needed. `--slides-only` exports frames and the PDF
for review. The exporter uses device scale 3, measured sentence audio and
−16 LUFS / −1.5 dB true-peak targets, regenerating all derived assets together.
Review every slide and encoded scene, phonemes and the independent Whisper report.
Automated screening is not human listening approval. Ordinary course builds use
committed media and never run TTS or download speech models.
