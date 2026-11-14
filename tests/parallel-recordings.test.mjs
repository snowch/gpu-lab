// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {parallelRecordings} from '../src/parallel-recordings.mjs';
import {readingReturn} from '../src/reading-return.mjs';
import {histogram} from '../src/parallel-models.mjs';
import {parallelFigure} from '../src/parallel-figures.mjs';
import {histogramsRecordingFrame,histogramsFigure} from '../scripts/render-histograms-recording.mjs';
const json=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
test('histogram contribution figure follows the selected model state and partial merge',()=>{
 for(const distribution of ['mixed','hot'])for(const strategy of ['global','private']){
  const r=histogram({distribution,strategy});
  for(let step=0;step<8;step++){
   const html=parallelFigure(r,step);
   assert.match(html,new RegExp(`Selected thread ${step} → category ${r.input[step]} → atomic`));
   assert.equal((html.match(/class="is-filled"/g)||[]).length,step+1);
   if(strategy==='private')assert.ok(html.includes(`${r.globalUpdates} global atomic additions`));
  }
 }
 const mixed=histogramsRecordingFrame('partials').result;
 assert.deepEqual(mixed.partial,[[2,1,1,0],[2,1,0,1]]);assert.equal(mixed.globalUpdates,6);
 assert.equal(histogramsRecordingFrame('answer').result.globalUpdates,2);
 assert.match(histogramsFigure('atomic'),/Prefix through thread 2: 3 contributions/);
 assert.doesNotMatch(histogramsFigure('question'),/2 global atomic additions|Final counts:/);
});
for(const recap of parallelRecordings)test(`${recap.slug} recap preserves measured media, cue and transcript contracts`,async()=>{
 const page=`https://example.org/gpu-lab/lessons/inside-sm.html?from=${recap.slug}-video`;
 const path=`/gpu-lab/lessons/${recap.slug}-video.html?keep=recap`;
 assert.deepEqual(readingReturn(page+'&return='+encodeURIComponent(path)),{href:'https://example.org'+path,chapter:recap.chapter,label:`Return to Chapter ${recap.chapter} recap`});
 assert.equal(readingReturn(page+'&return=https://evil.example/').href,`https://example.org/gpu-lab/lessons/${recap.slug}-video.html`);
 const scenes=await json(`content/${recap.slug}-scenes.json`),media=await json(`content/${recap.slug}-media.json`);
 assert.equal((await stat(new URL(`../assets/media/${recap.slug}/${recap.slug}.mp4`,import.meta.url))).size,media.bytes);
 assert.deepEqual(media.cues.map(c=>c.text),scenes.flatMap(s=>s.captions));assert.equal(media.scenes.length,scenes.length);
 assert.ok(media.durationSeconds>120);assert.ok(Math.abs(media.scenes.at(-1).end-media.durationSeconds)<1);
 const vtt=await readFile(new URL(`../assets/media/${recap.slug}/captions.vtt`,import.meta.url),'utf8');let previous=0;
 for(const cue of media.cues){assert.ok(cue.start>=previous&&cue.end>cue.start);assert.ok(vtt.includes(cue.text));previous=cue.end;}
 assert.equal(media.speech.voice,'af_heart');assert.equal(media.speech.speed,1);
});
