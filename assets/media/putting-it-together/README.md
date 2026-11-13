# Investigate matrix reuse recap

Copyright © 2026 Christopher Snow.

Chapter 14 links to this optional dedicated recap after its application exercise.
The user approved the full talk track on 13 November 2026. Eight model-derived
slides reinforce the chapter’s reasoning, with a pause before a new-case answer.
The diagrams use tiledMatmul from src/ai-models.mjs with the chapter’s fixed inputs and synthetic resource budgets. They retain identical complete outputs, distinguish complete-operation load counts from per-block capacity, and withhold the eight-by-eight new-case counts until the answer.
These diagrams illustrate the declared teaching example; they do not establish
PyTorch’s chosen implementation or physical GPU performance.

Assets: native 3840 × 2160 / 30 fps H.264 video with AAC sound, embedded English
subtitles and scene chapters; browser captions.vtt, eight-slide slides.pdf and
poster.jpg. Narration and transcript share content/putting-it-together-scenes.json.
Measured duration, bytes, cue times and voice provenance are recorded in
content/putting-it-together-media.json. The page uses the common native player, captions,
transcript, downloads, saved-state return and offline update restoration.

## Rebuild

Use the pinned [record-demo workflow](https://github.com/snowch/claude-skills/tree/c9a7c521568632aa216932f4c965df386498602a/plugins/demo-video/skills/record-demo):
Kokoro v1.0 ONNX CPU, af_heart, speed 1.0, matching the existing recaps.
From this repository, with that skill checked out at /tmp/gpu-authoring-skills:

```sh
node scripts/render-putting-it-together-recording.mjs
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/tts.py test-results/putting-it-together-recording af_heart 1.0
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/phonemes.py test-results/putting-it-together-recording --all
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/asr.py test-results/putting-it-together-recording small
uv run scripts/build-recording.py putting-it-together
```

The exporter captures native 4K slides at device scale 3, joins exact speech
cues and uses −16 LUFS / −1.5 dB true-peak normalisation targets. It checks
slide overflow and regenerates the PDF, poster, captions and media metadata.
Review the diagram frames, phonemes and full ASR reports. Automated speech
screening is not human listening approval or learner testing. Ordinary course
builds use committed media and never run TTS or download speech models.
