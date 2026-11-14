// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {parallelRecordings} from '../src/parallel-recordings.mjs';
import {readingReturn} from '../src/reading-return.mjs';
import {histogram,scan,compaction,philosophers,barrier} from '../src/parallel-models.mjs';
import {compactionRecordingFrame,compactionFigure} from '../scripts/render-compaction-recording.mjs';
import {progressRecordingFrame,progressFigure} from '../scripts/render-progress-recording.mjs';
import {parallelFigure,scanFigureFrame} from '../src/parallel-figures.mjs';
import {scanRecordingFrame,scanFigure as scanRecordingFigure} from '../scripts/render-scan-recording.mjs';
import {histogramsRecordingFrame,histogramsFigure} from '../scripts/render-histograms-recording.mjs';
const json=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
test('progress diagrams retain exclusive ownership, correct wait edges and matching barrier arrivals',()=>{
 for(const policy of ['ordered','cycle']){
  const r=philosophers({policy});
  for(const [i,s] of r.steps.entries()){
   for(let fork=0;fork<3;fork++){
    const owners=s.held.flatMap((held,person)=>held.includes(fork)?[person]:[]);
    assert.ok(owners.length<=1);assert.equal(s.forks[fork],owners[0]??null);
   }
   for(const edge of s.waits){assert.equal(edge.to,s.forks[edge.fork]);assert.equal(edge.fork,r.wanted[edge.from][s.held[edge.from].length]);assert.notEqual(edge.from,edge.to);}
   assert.match(parallelFigure(r,i),/Exclusive fork ownership/);
  }
  assert.deepEqual(r.steps.at(-1).forks,r.forks);
 }
 const ordered=progressRecordingFrame('ordered');assert.deepEqual(ordered.state.held,[[0],[1,2],[]]);
 assert.deepEqual(progressRecordingFrame('cycle').state.waits,[{from:0,to:1,fork:1},{from:1,to:2,fork:2},{from:2,to:0,fork:0}]);
 for(const participation of ['all','subset']){
  const r=barrier({participation});
  assert.equal(r.valid,participation==='all');assert.match(parallelFigure(r,r.steps.length-1),participation==='all'?/4 of 4 required arrivals → matching barrier releases/:/2 of 4 required arrivals → invalid participation/);
 }
 assert.doesNotMatch(progressFigure('question'),/does not schedule|Producer kernel|Consumer kernel/);
});
test('compaction visual snapshots retain only inspected writes and preserve stable identity placement',()=>{
 for(const predicate of ['zero','nonzero','all','none'])for(const order of ['forward','reverse']){
  const r=compaction({predicate,order}),expected=Array(r.count).fill('Unwritten');
  for(const [step,s] of r.steps.entries()){
   const i=s.inputIndex;
   if(r.flags[i]){assert.equal(s.destination,r.offsets[i]);expected[s.destination]=i;}
   else assert.equal(s.destination,null);
   assert.deepEqual(s.output,expected);assert.match(parallelFigure(r,step),/pattern-figure/);
   if(!r.count)assert.match(parallelFigure(r,step),/No output slots used/);
  }
 }
 const placed=compactionRecordingFrame('scatter');assert.equal(placed.state.inputIndex,5);assert.equal(placed.state.destination,2);assert.deepEqual(placed.state.output,[0,2,5,'Unwritten']);
 assert.deepEqual(compactionRecordingFrame('answer').result.output,[1,3,4,6]);
 assert.doesNotMatch(compactionFigure('question'),/Output count:|Completed stable token identities|Token 4 → destination/);
});
test('scan diagrams use completed snapshots, distinguish shifting and hide the new-case answer',()=>{
 for(const size of ['4','8'])for(const kind of ['inclusive','exclusive']){
  const r=scan({size,kind});
  for(let i=0;i<r.steps.length;i++){
   const {state,focus,before,partner,result}=scanFigureFrame(r,i);
   if(state.before)assert.deepEqual(before,r.steps[i-1].cells);
   if(state.shift)assert.equal(result,before[focus-1]);
   else if(state.distance)assert.equal(result,before[focus]+(partner>=0?before[partner]:0));
   assert.match(parallelFigure(r,i),/pattern-figure/);
  }
 }
 const exclusive=scanRecordingFrame('exclusive');assert.equal(exclusive.focus,5);assert.equal(exclusive.result.inclusive[5],3);assert.equal(exclusive.result.values[5],2);
 const small=scanRecordingFrame('answer').result;
 assert.deepEqual(small.values,[0,1,1,2]);assert.equal(small.values.at(-1)+small.input.at(-1),2);
 assert.doesNotMatch(scanRecordingFigure('question'),/Output length:|New snapshot|Exclusive offsets<\/text>/);
});
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
