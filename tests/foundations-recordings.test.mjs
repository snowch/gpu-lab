// Copyright © 2026 Christopher Snow.
import {requestsRecordingData as requests,requestsFigure} from '../scripts/render-requests-recording.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {devicesRecordingData as data,devicesFigure} from '../scripts/render-devices-recording.mjs';
import {readingRecordingData as selection,readingFigure} from '../scripts/render-reading-recording.mjs';
import {layoutRecordingData as layout,layoutRecordingFrame,layoutFigure} from '../scripts/render-layout-recording.mjs';
test('device recording preserves source buffers, distinguishes copies from calculation and withholds the transfer answer',()=>{
 assert.deepEqual(data.steps.map(s=>s.transferBytes),[20,0,20]);
 const back=data.steps[2];assert.deepEqual(back.after.cpu[0],back.before.cpu[0]);assert.deepEqual(back.after.gpu,back.before.gpu);
 assert.deepEqual(back.after.cpu[1].values,[2,4,6,8,10]);
 assert.equal(data.challenge.transferBytes,32);assert.deepEqual(data.challenge.output,[3,6,9,12,15,18,21,24]);
 assert.doesNotMatch(devicesFigure('question'),/32 bytes copied|>y_cpu</);
 assert.match(devicesFigure('answer'),/32 bytes copied/);
 assert.match(devicesFigure('calculate'),/0 bytes copied/);
});
test('selection recap follows logical coordinates and leaves a new column unanswered until its explanation',()=>{
 assert.deepEqual(selection.rowOne.values,[6,7,8,9,10]);assert.deepEqual(selection.columnOne.values,[2,7,12,17,22]);
 assert.deepEqual(selection.challenge.sourceOffsets,[3,8,13,18,23]);
 assert.deepEqual(selection.challenge.output,[8,18,28,38,48]);
 assert.equal((readingFigure('question').match(/class="active"/g)||[]).length,0);
 assert.equal((readingFigure('answer').match(/class="active"/g)||[]).length,5);
 assert.deepEqual(selection.row.matrix,selection.challenge.matrix);
});
test('layout recording distinguishes values, source offsets, new copy offsets and an already-contiguous view',()=>{
 assert.deepEqual(layout.column.offsets,[0,5,10,15,20]);assert.equal(layout.column.byteStride,20);
 assert.deepEqual(layout.columnOne.offsets,[1,6,11,16,21]);
 assert.deepEqual(layout.rowOne.offsets,[5,6,7,8,9]);assert.equal(layout.rowOne.stride,1);assert.equal(layout.rowOne.copyBytes,0);
 const packedFrame=layoutRecordingFrame('packed');assert.deepEqual(packedFrame.source.values,layout.columnOne.values);assert.deepEqual(packedFrame.packed.values,layout.columnOne.values);
 const frame=layoutRecordingFrame('answer');
 assert.deepEqual(frame.source.offsets,[3,8,13,18,23]);assert.deepEqual(frame.packed.offsets,[0,1,2,3,4]);
 assert.deepEqual(frame.source.values,frame.packed.values);assert.deepEqual(frame.source.output,frame.packed.output);
 assert.deepEqual(frame.source.matrix,layout.row.matrix);assert.equal(frame.packed.copyBytes,20);
 assert.doesNotMatch(layoutFigure('question'),/New stride: 1|20 bytes of values copied/);
 assert.match(layoutFigure('answer'),/New stride: 1/);assert.match(layoutFigure('contiguous-row'),/0 bytes of values copied/);
 assert.match(layoutFigure('storage'),/Value 1.0 is at element offset 0/);
});
for(const slug of ['hello','launch-from-input','putting-it-together','devices','reading','layout','requests','scheduling','divergence','tensor-cores','attention','inference'])test(`${slug} recording media, captions and transcript retain exact audio-cue timing`,async()=>{
 const base=new URL('../',import.meta.url),json=async file=>JSON.parse(await readFile(new URL(file,base),'utf8'));
 const scenes=await json(`content/${slug}-scenes.json`),media=await json(`content/${slug}-media.json`);
 assert.equal((await stat(new URL(`assets/media/${slug}/${slug}.mp4`,base))).size,media.bytes);
 assert.deepEqual(media.cues.map(c=>c.text),scenes.flatMap(s=>s.captions));
 assert.equal(media.scenes.length,scenes.length);assert.ok(Math.abs(media.scenes.at(-1).end-media.durationSeconds)<1);
 const vtt=await readFile(new URL(`assets/media/${slug}/captions.vtt`,base),'utf8');let end=0;
 for(const cue of media.cues){assert.ok(cue.start>=end&&cue.end>cue.start);assert.ok(vtt.includes(cue.text));end=cue.end;}
});

test('sector recap preserves useful bytes, accounts for alignment and excludes the answer before reveal',()=>{
 for(const s of Object.values(requests))assert.equal(s.load.usefulBytes,20);
 assert.deepEqual(requests.column.values,requests.packed.values);
 assert.deepEqual(requests.column.load.sectors.map(s=>s.id),[0,1,2]);
 assert.equal(requests.packed.load.sectors.length,1);
 assert.deepEqual(requests.rowOne.load.sectors.map(s=>s.laneIds),[[0,1,2],[3,4]]);
 assert.deepEqual(requests.challenge.load.sectors.map(s=>s.laneIds),[[0],[1,2,3,4]]);
 assert.equal(requests.challenge.load.coveredBytes,64);
 assert.doesNotMatch(requestsFigure('question'),/20 useful bytes|64 covered bytes/);
 assert.match(requestsFigure('answer'),/20 useful bytes · 2 sectors · 64 covered bytes/);
});
