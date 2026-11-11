// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {reductionFigure} from '../scripts/render-reduction-recording.mjs';
import scenes from '../content/reduction-scenes.json' with {type:'json'};
import media from '../content/reduction-media.json' with {type:'json'};
test('recording keeps unknown shared reads and transfer answers distinct',()=>{
 assert.match(reductionFigure('first-write'),/Unwritten/);
 assert.match(reductionFigure('sum'),/inputs 0, 2, 1, 3/);
 assert.match(reductionFigure('hazard'),/Unwritten partner read · no numeric result/);
 assert.match(reductionFigure('late-write'),/The earlier read is still invalid/);
 assert.doesNotMatch(reductionFigure('question'),/Block barrier · all 8/);
 assert.match(reductionFigure('answer'),/Block barrier · all 8/);
});
test('shipped media matches its timing, caption and transcript sources',async()=>{
 assert.equal((await stat(new URL('../assets/media/reduction/reduction.mp4',import.meta.url))).size,media.bytes);
 const vtt=await readFile(new URL('../assets/media/reduction/captions.vtt',import.meta.url),'utf8');
 assert.equal(media.scenes.length,scenes.length);
 assert.equal(media.cues.length,scenes.flatMap(s=>s.captions).length);
 assert.ok(Math.abs(media.scenes.at(-1).end-media.durationSeconds)<1);
 let lastEnd=0;
 for(const cue of media.cues){
  assert.ok(cue.start>=lastEnd&&cue.end>cue.start);
  assert.ok(vtt.includes(cue.text));lastEnd=cue.end;
 }
 assert.deepEqual(media.cues.map(c=>c.text),scenes.flatMap(s=>s.captions));
});
