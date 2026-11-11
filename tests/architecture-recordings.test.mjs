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

import {divergenceRecordingData as branches,divergenceRecordingFrame as branchFrame,divergenceFigure} from '../scripts/render-divergence-recording.mjs';
test('mask recap distinguishes other-path lanes from unused positions and keeps the rare path',()=>{
 assert.equal(branches.uniform.instructions,1);assert.equal(branches.uniform.usefulSlots,32);
 assert.deepEqual(branches.mixedTail.trace.map(t=>t.mask),[[0,2,4],[1,3]]);
 assert.equal(branches.mixedTail.lanes.filter(l=>!l.active).length,27);
 assert.deepEqual(branches.rare.trace.slice(1).map(t=>t.mask),[[0],[0],[0]]);
 assert.equal(branches.rare.lanes[0].output,5);
 const {source,event}=branchFrame('answer');
 assert.deepEqual(event.mask,[16]);assert.equal(source.instructions,4);assert.equal(source.usefulSlots,19);
 assert.equal(source.lanes.filter(l=>!l.active).length,15);
 assert.equal((divergenceFigure('question').match(/class="active"/g)||[]).length,0);
 assert.doesNotMatch(divergenceFigure('question'),/Final outputs:/);
 assert.match(divergenceFigure('answer'),/lane 16 = 5.0/);
});
