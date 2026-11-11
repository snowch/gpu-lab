// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {matmulRecordingFrame,matmulRecordingData as data,matmulFigure} from '../scripts/render-matmul-recording.mjs';
import scenes from '../content/matmul-scenes.json' with {type:'json'};
import media from '../content/matmul-media.json' with {type:'json'};
test('recording keeps partial sums while replacing shared inputs and distinguishes phase loads from complete loads',()=>{
 const first=matmulRecordingFrame('first-phase'),replacement=matmulRecordingFrame('replace-inputs'),final=matmulRecordingFrame('second-phase');
 assert.deepEqual(first.c,[[2,-1],[1,0]]);
 assert.deepEqual(replacement.c,first.c);
 assert.notDeepEqual(replacement.a,first.a);
 assert.notDeepEqual(replacement.b,first.b);
 assert.deepEqual(final.c,data.shared.output.slice(0,2).map(row=>row.slice(0,2)));
 assert.deepEqual([data.baseline.inputLoads,data.shared.inputLoads,data.wide.inputLoads],[128,64,32]);
 assert.deepEqual(data.baseline.output,data.shared.output);
 assert.deepEqual(data.wide.output,data.shared.output);
 const phase=data.eight.trace[0];assert.equal(phase.aCells.length+phase.bCells.length,32);
 assert.equal(data.eight.trace.filter(step=>step.aCells.some(([r,k])=>r===0&&k===0)).length,2,'Another output tile reloads the same A input');
 assert.doesNotMatch(matmulFigure('question'),/32 input values|Each input serves 4/);
 assert.match(matmulFigure('answer'),/32 input values|Each input serves 4/);
});
test('matrix recording media, timed captions and transcript share the same sources',async()=>{
 assert.equal((await stat(new URL('../assets/media/matmul/matmul.mp4',import.meta.url))).size,media.bytes);
 const vtt=await readFile(new URL('../assets/media/matmul/captions.vtt',import.meta.url),'utf8');
 assert.equal(media.scenes.length,scenes.length);
 assert.deepEqual(media.cues.map(c=>c.text),scenes.flatMap(s=>s.captions));
 assert.ok(Math.abs(media.scenes.at(-1).end-media.durationSeconds)<1);
 let end=0;
 for(const cue of media.cues){assert.ok(cue.start>=end&&cue.end>cue.start);assert.ok(vtt.includes(cue.text));end=cue.end;}
});
