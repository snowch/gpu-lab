// Copyright © 2026 Christopher Snow.
import scenes from './matmul-scenes.json' with {type:'json'};
import media from './matmul-media.json' with {type:'json'};
import {escape} from '../src/continuation-ui.mjs';
const duration=`${Math.floor(media.durationSeconds/60)} min ${media.durationSeconds%60} sec`;
export function renderMatmulVideo(){
 return `<section class="sm-recording" id="matmul-recording" aria-label="Matrix input reuse recording">
 <video id="matmul-video" data-recording="matmul-recording" controls playsinline preload="none" width="1920" height="1080" poster="../assets/media/matmul/poster.jpg" aria-label="How matrix tiles reuse inputs: narrated walkthrough, ${duration}">
 <source src="../assets/media/matmul/matmul.mp4" type="video/mp4">
 <track kind="captions" src="../assets/media/matmul/captions.vtt" srclang="en" label="English" default>
 Your browser cannot play this recording. Download the video or read the transcript.
 </video>
 <p class="sm-video-note">${duration} · English captions · No installation or GPU required</p>
 <nav class="sm-video-downloads" aria-label="Recording downloads"><a href="../assets/media/matmul/matmul.mp4" download>Download video (${(media.bytes/1024**2).toFixed(1)} MiB)</a><a href="../assets/media/matmul/slides.pdf" download>Download slides (PDF)</a></nav>
 <details class="sm-transcript" id="matmul-transcript"><summary>Read the transcript</summary>${scenes.map(s=>`<section><h2>${escape(s.title)}</h2><p>${escape(s.captions.join(' '))}</p></section>`).join('')}</details>
 <p class="sm-return"><a id="matmul-return" data-reading-return data-reading-link href="matmul.html#matmul-recording-link">Return to Chapter 10</a></p>
 </section>`;
}
