// Copyright © 2026 Christopher Snow.
import scenes from './inside-sm-scenes.json' with {type:'json'};
import {escape} from '../src/continuation-ui.mjs';
export const smTranscript=scenes.map(scene=>({title:scene.step,text:scene.text.replaceAll('S M','SM')}));
export function renderInsideSm(){
  return `<section class="sm-recording" id="sm-recording" aria-label="Inside an SM recording">
  <video id="sm-video" controls playsinline preload="none" width="1920" height="1080" poster="../assets/media/inside-sm/poster.jpg" aria-label="Inside an SM: narrated walkthrough, 2 minutes 56 seconds">
    <source src="../assets/media/inside-sm/inside-sm.mp4" type="video/mp4">
    <track kind="captions" src="../assets/media/inside-sm/captions.vtt" srclang="en" label="English" default>
    Your browser cannot play this recording. Download the video or read the transcript.
  </video>
  <p class="sm-video-note">2 min 56 sec · English captions · No installation or GPU required</p>
  <nav class="sm-video-downloads" aria-label="Recording downloads"><a href="../assets/media/inside-sm/inside-sm.mp4" download>Download video (7.1 MiB)</a><a href="../assets/media/inside-sm/slides.pdf" download>Download slides (PDF)</a></nav>
  <details class="sm-transcript" id="sm-transcript"><summary>Read the transcript</summary>${smTranscript.map(scene=>`<section><h2>${escape(scene.title)}</h2><p>${escape(scene.text)}</p></section>`).join('')}</details>
  <p class="sm-return"><a id="sm-return" data-reading-return data-reading-link href="hello.html#hello-sm-title">Return to Chapter 1</a></p>
  </section>`;
}
