// Copyright © 2026 Christopher Snow.
import scenes from './reduction-scenes.json' with {type:'json'};
import media from './reduction-media.json' with {type:'json'};
import {escape} from '../src/continuation-ui.mjs';
export const reductionDuration=`${Math.floor(media.durationSeconds/60)} min ${media.durationSeconds%60} sec`;
export function renderReductionVideo(){
 return `<section class="sm-recording" id="reduction-recording" aria-label="Shared memory and barriers recording">
 <video id="reduction-video" data-recording="reduction-recording" controls playsinline preload="none" width="1920" height="1080" poster="../assets/media/reduction/poster.jpg" aria-label="Shared memory and barriers: narrated walkthrough, ${reductionDuration}">
 <source src="../assets/media/reduction/reduction.mp4" type="video/mp4">
 <track kind="captions" src="../assets/media/reduction/captions.vtt" srclang="en" label="English" default>
 Your browser cannot play this recording. Download the video or read the transcript.
 </video>
 <p class="sm-video-note">${reductionDuration} · English captions · No installation or GPU required</p>
 <nav class="sm-video-downloads" aria-label="Recording downloads"><a href="../assets/media/reduction/reduction.mp4" download>Download video (${(media.bytes/1024**2).toFixed(1)} MiB)</a><a href="../assets/media/reduction/slides.pdf" download>Download slides (PDF)</a></nav>
 <details class="sm-transcript" id="reduction-transcript"><summary>Read the transcript</summary>${scenes.map(s=>`<section><h2>${escape(s.title)}</h2><p>${escape(s.captions.join(' '))}</p></section>`).join('')}</details>
 <p class="sm-return"><a id="reduction-return" data-reading-return data-reading-link href="reduction.html#reduction-recording-link">Return to Chapter 8</a></p>
 </section>`;
}
