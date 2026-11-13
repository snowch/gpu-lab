# Double five values recap

Copyright © 2026 Christopher Snow.

Chapter 1 links to this optional dedicated recap after its application exercise.
The user approved the full talk track on 13 November 2026. Eight model-derived
slides reinforce the chapter’s reasoning, with a pause before a new-case answer.
The diagrams use inspectLaunch and launchPlan from src/hello-model.mjs. The new-case question covers nine inputs with four threads per block, withholding the required block count and skipped indices until the answer.
These diagrams illustrate the declared teaching example; they do not establish
PyTorch’s chosen implementation or physical GPU performance.

Assets: native 3840 × 2160 / 30 fps H.264 video with AAC sound, embedded English
subtitles and scene chapters; browser captions.vtt, eight-slide slides.pdf and
poster.jpg. Narration and transcript share content/hello-scenes.json.
Measured duration, bytes, cue times and voice provenance are recorded in
content/hello-media.json. The page uses the common native player, captions,
transcript, downloads, saved-state return and offline update restoration.

## Rebuild

Use the pinned [record-demo workflow](https://github.com/snowch/claude-skills/tree/c9a7c521568632aa216932f4c965df386498602a/plugins/demo-video/skills/record-demo):
Kokoro v1.0 ONNX CPU, af_heart, speed 1.0, matching the existing recaps.
From this repository, with that skill checked out at /tmp/gpu-authoring-skills:

```sh
node scripts/render-hello-recording.mjs
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/tts.py test-results/hello-recording af_heart 1.0
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/phonemes.py test-results/hello-recording --all
uv run /tmp/gpu-authoring-skills/plugins/demo-video/skills/record-demo/scripts/asr.py test-results/hello-recording small
uv run scripts/build-recording.py hello
```

The exporter captures native 4K slides at device scale 3, joins exact speech
cues and uses −16 LUFS / −1.5 dB true-peak normalisation targets. It checks
slide overflow and regenerates the PDF, poster, captions and media metadata.
Review the diagram frames, phonemes and full ASR reports. Automated speech
screening is not human listening approval or learner testing. Ordinary course
builds use committed media and never run TTS or download speech models.
