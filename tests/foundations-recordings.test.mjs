// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {devicesRecordingData as data,devicesFigure} from '../scripts/render-devices-recording.mjs';
test('device recording preserves source buffers, distinguishes copies from calculation and withholds the transfer answer',()=>{
 assert.deepEqual(data.steps.map(s=>s.transferBytes),[20,0,20]);
 const back=data.steps[2];assert.deepEqual(back.after.cpu[0],back.before.cpu[0]);assert.deepEqual(back.after.gpu,back.before.gpu);
 assert.deepEqual(back.after.cpu[1].values,[2,4,6,8,10]);
 assert.equal(data.challenge.transferBytes,32);assert.deepEqual(data.challenge.output,[3,6,9,12,15,18,21,24]);
 assert.doesNotMatch(devicesFigure('question'),/32 bytes copied|>y_cpu</);
 assert.match(devicesFigure('answer'),/32 bytes copied/);
 assert.match(devicesFigure('calculate'),/0 bytes copied/);
});
for(const slug of ['devices'])test(`${slug} recording media, captions and transcript retain exact audio-cue timing`,async()=>{
 const base=new URL('../',import.meta.url),json=async file=>JSON.parse(await readFile(new URL(file,base),'utf8'));
 const scenes=await json(`content/${slug}-scenes.json`),media=await json(`content/${slug}-media.json`);
 assert.equal((await stat(new URL(`assets/media/${slug}/${slug}.mp4`,base))).size,media.bytes);
 assert.deepEqual(media.cues.map(c=>c.text),scenes.flatMap(s=>s.captions));
 assert.equal(media.scenes.length,scenes.length);assert.ok(Math.abs(media.scenes.at(-1).end-media.durationSeconds)<1);
 const vtt=await readFile(new URL(`assets/media/${slug}/captions.vtt`,base),'utf8');let end=0;
 for(const cue of media.cues){assert.ok(cue.start>=end&&cue.end>cue.start);assert.ok(vtt.includes(cue.text));end=cue.end;}
});
