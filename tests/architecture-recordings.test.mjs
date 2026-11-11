// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {schedulingRecordingData as d,schedulingRecordingFrame as frame,schedulingFigure} from '../scripts/render-scheduling-recording.mjs';
test('scheduler recap follows pre-issue readiness and distinguishes idle slots from changing total work',()=>{
 assert.deepEqual([d.single,d.two,d.four].map(s=>[s.issued,s.idle,s.cycles]),[[6,10,16],[12,8,20],[24,4,28]]);
 assert.deepEqual(frame('other').event.before.map(w=>w.status),['waiting','ready']);
 assert.equal(frame('other').event.selected,1);
 assert.equal(frame('idle').event.selected,null);
 assert.deepEqual(frame('ready').event.before.map(w=>w.status),['ready','waiting']);
 assert.equal(d.challenge.trace[2].selected,null);
 assert.deepEqual(frame('answer').event.before.map(w=>w.status),['ready','waiting']);
 assert.equal(frame('answer').event.instruction,'MUL');
 assert.doesNotMatch(schedulingFigure('question'),/Issue warp|Idle: no unfinished|Warp 1 becomes ready/);
 assert.match(schedulingFigure('answer'),/Issue warp 0: MUL/);
});
