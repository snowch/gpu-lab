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

import {attentionRecordingData as attn,attentionRecordingFrame,attentionFigure} from '../scripts/render-attention-recording.mjs';
import {roundedTensorValue} from '../src/value-format.mjs';
test('attention recap rescales non-empty totals and distinguishes tile scratch from matrix traffic',()=>{
 const {source,event}=attentionRecordingFrame('rescale');
 assert.ok(event.rescale>0&&event.rescale<1);assert.ok(event.previous.l>0);assert.notEqual(event.previous.acc[0],0);
 assert.match(attentionFigure('rescale'),new RegExp(roundedTensorValue(event.previous.l*event.rescale).replaceAll('.','\\.')));
 assert.ok(attentionFigure('rescale').includes(roundedTensorValue(event.previous.acc[0]*event.rescale)));
 assert.equal(source.scratchFloats,8);assert.equal(attn.four.scratchFloats,10);
 assert.equal(source.intermediateComparison.materialisedBytes,1024);assert.equal(source.intermediateBytes,0);
 for(const r of [source,attn.four]){assert.ok(r.maxError<1e-12);for(let i=0;i<r.n;i++)for(let j=0;j<r.d;j++)assert.ok(Math.abs(r.output[i][j]-attn.materialised.output[i][j])<1e-12);}
 assert.doesNotMatch(attentionFigure('question'),/After rescaling|New totals|10 scratch floats|40 bytes/);
 assert.match(attentionFigure('answer'),/10 scratch floats × 4 bytes = 40 bytes/);
});
