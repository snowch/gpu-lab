// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {precisionRecordingData as d,precisionRecordingFrame,precisionFigure} from '../scripts/render-tensor-cores-recording.mjs';
test('precision recap distinguishes input loss, accumulation, range and exact-input agreement',()=>{
 for(const format of ['fp16','bf16']){
  const r=d.cancellation[format];assert.equal(r.changed,8);assert.equal(r.converted[0],1);
  assert.equal(r.trace[7].partial,8);assert.ok(r.trace[7].reference>8);
  assert.equal(r.result,0);assert.ok(r.reference>0);
  const exact=d.exact[format];assert.equal(exact.changed,0);assert.equal(exact.result,4);assert.equal(exact.result,exact.reference);
 }
 assert.equal(d.cancellation.fp32.error,0);
 assert.equal(d.small.fp16.result,0);assert.ok(d.small.bf16.result>0);assert.equal(d.small.bf16.changed,16);
 assert.equal(d.cancellation.fp16.scalarFmas,4096);
 assert.equal(precisionRecordingFrame('question').pattern,'exact');
 assert.doesNotMatch(precisionFigure('question'),/Changed inputs: 0|Converted sum: 4.0/);
 assert.match(precisionFigure('answer'),/Converted sum: 4.0 · reference: 4.0/);
});
