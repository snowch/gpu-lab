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

import {inferenceRecordingData as budget,inferenceRecordingFrame,inferenceFigure} from '../scripts/render-inference-recording.mjs';
test('inference recap separates payload, invocation work, ideal bounds and batch amortisation',()=>{
 const {decode:d,prefill:p,batch:b,long:l}=budget;
 assert.equal(d.kvCacheBytes,64*1024**2);assert.equal(d.kvWriteBytes,128*1024);
 assert.equal(d.cacheTokensAfter-d.cacheTokensBefore,1);assert.equal(d.tokens,1);
 assert.equal(p.cacheTokensBefore,0);assert.equal(p.tokens,512);assert.equal(p.kvReadBytes,0);assert.equal(p.kvWriteBytes,d.kvCacheBytes);
 assert.equal(p.weightBytes,d.weightBytes);assert.ok(p.computeMs>p.memoryMs);
 assert.equal(b.weightBytes,d.weightBytes);assert.equal(b.kvCacheBytes,4*d.kvCacheBytes);assert.equal(b.tokens,4);
 assert.ok(b.boundMs>d.boundMs);assert.ok(b.boundMs/b.tokens<d.boundMs);
 assert.equal(l.kvCacheBytes,4*b.kvCacheBytes);assert.equal(l.kvWriteBytes,b.kvWriteBytes);assert.equal(l.weightBytes,d.weightBytes);
 assert.ok(l.boundMs>b.boundMs&&l.boundMs<4*b.boundMs);
 for(const r of Object.values(budget)){
  assert.equal(r.boundMs,Math.max(r.memoryMs,r.computeMs));assert.equal(r.bytes,r.weightBytes+r.kvReadBytes+r.kvWriteBytes);
  assert.equal(r.measuredMs,0);assert.equal(r.measurementRatio,null);
 }
 assert.equal(inferenceRecordingFrame('question').source,l);
 assert.doesNotMatch(inferenceFigure('question'),/1,024 MiB|15\.074|512 KiB/);
 assert.match(inferenceFigure('answer'),/256 MiB → 1,024 MiB/);
 assert.match(inferenceFigure('bounds'),/73\.054 ms/);
});
