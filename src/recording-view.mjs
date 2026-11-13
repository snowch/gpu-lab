import {sectionHeading} from './section-cues.mjs';
// Copyright © 2026 Christopher Snow.
import {escape} from './continuation-ui.mjs';
export function recordingLink(slug,title,description){
 return `<section class="book-section chapter-resource" data-section-kind="recap" id="${slug}-recording-link">${sectionHeading('recap','Watch the chapter recap')}<p>Optional recap: <a id="${slug}-watch" data-reading-link href="${slug}-video.html?from=${slug}">${escape(title)}</a>. ${escape(description)}</p></section>`;
}
export function recordingContent({slug,chapter,title,scenes,media}){
 const duration=`${Math.floor(media.durationSeconds/60)} min ${media.durationSeconds%60} sec`,base=`../assets/media/${slug}`;
 return `<section class="sm-recording" id="${slug}-recording" aria-label="Chapter ${chapter} narrated recap">
 <video id="${slug}-video" data-recording="${slug}-recording" controls playsinline preload="none" width="1920" height="1080" poster="${base}/poster.jpg" aria-label="${escape(title)}: narrated walkthrough, ${duration}">
 <source src="${base}/${slug}.mp4" type="video/mp4"><track kind="captions" src="${base}/captions.vtt" srclang="en" label="English" default>
 Your browser cannot play this recording. Download the video or read the transcript.</video>
 <p class="sm-video-note">${duration} · English captions · No installation or GPU required</p>
 <nav class="sm-video-downloads" aria-label="Recording downloads"><a href="${base}/${slug}.mp4" download>Download video (${(media.bytes/1024**2).toFixed(1)} MiB)</a><a href="${base}/slides.pdf" download>Download slides (PDF)</a></nav>
 <details class="sm-transcript" id="${slug}-transcript"><summary>Read the transcript</summary>${scenes.map(s=>`<section><h2>${escape(s.title)}</h2><p>${escape(s.captions.join(' '))}</p></section>`).join('')}</details>
 <p class="sm-return"><a id="${slug}-return" data-reading-return data-reading-link href="${slug}.html#${slug}-recording-link">Return to Chapter ${chapter}</a></p></section>`;
}
