// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {tiledMatmul,quantize,precisionMatmul,attention,inferenceBudget,reduceBlock} from '../src/ai-models.mjs';

test('every tiling matches an independent scalar dot product and analytical load count',()=>{
  for(const n of [4,8])for(const tile of [1,2,4])for(const sharedBudget of [128,512,2048])for(const registers of [16,64]){
    const r=tiledMatmul({n,tile,sharedBudget,registers});
    for(let i=0;i<n;i++)for(let j=0;j<n;j++){
      let sum=0;for(let k=0;k<n;k++)sum+=r.a[i][k]*r.b[k][j];
      assert.equal(r.output[i][j],sum);
    }
    assert.equal(r.inputLoads,2*n**3/tile);
    assert.equal(r.trace.length,(n/tile)**3);
    assert.ok(r.residentBlocks*r.registersPerBlock<=1024);
    assert.ok(r.residentBlocks*r.sharedBytes<=sharedBudget);
    assert.equal(r.trace.at(-1).cCells.at(-1)[2],r.output[n-1][n-1]);
  }
});
test('precision conversions round ties to even and handle subnormals, signs and range',()=>{
  assert.equal(quantize(1+2**-11),1);
  assert.equal(quantize(1+3*2**-11),1+2**-9);
  assert.equal(quantize(-1-2**-11),-1);
  assert.equal(quantize(2**-24),2**-24);
  assert.equal(quantize(2**-25),0);
  assert.equal(quantize(3*2**-25),2**-23);
  assert.equal(quantize(65504),65504);
  assert.equal(quantize(65520),Infinity);
  assert.equal(quantize(1+2**-8,'bf16'),1);
  assert.equal(quantize(2**-133,'bf16'),2**-133);
  assert.equal(quantize(2**-134,'bf16'),0);
  for(const format of ['fp16','bf16','fp32'])for(const pattern of ['cancellation','small','exact']){
    const r=precisionMatmul({format,pattern});
    assert.equal(r.trace.at(-1).partial,r.result);
    assert.ok(Number.isFinite(r.result));
    if(format==='fp32'||pattern==='exact')assert.equal(r.error,0);
  }
  assert.equal(precisionMatmul().changed,8);
  assert.equal(precisionMatmul({pattern:'small'}).result,0);
  assert.ok(precisionMatmul({pattern:'small',format:'bf16'}).result>0);
});
test('online attention agrees with stable materialised attention, even for extreme scores',()=>{
  for(const n of [8,16,32])for(const tile of [2,4,8])for(const scale of [1,1000]){
    const r=attention({n,tile,scale});
    assert.ok(r.maxError<1e-12);
    for(let i=0;i<n;i++){
      assert.ok(Math.abs(r.probabilities[i].reduce((a,b)=>a+b,0)-1)<1e-12);
      for(let j=0;j<r.d;j++){
        assert.ok(Number.isFinite(r.output[i][j]));
        assert.ok(r.output[i][j]>=-4&&r.output[i][j]<=4);
      }
    }
    assert.equal(r.intermediateWrites,0);
    assert.equal(r.trace.length,n/tile);
    const m=attention({n,tile,scale,mode:'materialised'});
    assert.equal(m.intermediateBytes,16*n*n);
    assert.deepEqual(m.output,r.reference);
  }
});
test('inference budget dimensions, batch reuse and roofline limits are consistent',()=>{
  const r=inferenceBudget();
  assert.equal(r.weightBytes,14e9);
  assert.equal(r.kvCacheBytes,2*32*512*1024*2);
  assert.equal(r.bottleneck,'memory');
  assert.equal(r.boundMs,Math.max(r.computeMs,r.memoryMs));
  const b=inferenceBudget({batch:4});
  assert.equal(b.weightBytes,r.weightBytes);
  assert.equal(b.kvCacheBytes,4*r.kvCacheBytes);
  const p=inferenceBudget({phase:'prefill',batch:16,sequence:2048});
  assert.equal(p.bottleneck,'compute');assert.equal(p.kvReadBytes,0);
  assert.equal(inferenceBudget({bandwidth:2000}).memoryMs,r.memoryMs/2);
  assert.equal(inferenceBudget({compute:200}).computeMs,r.computeMs/2);
  assert.equal(inferenceBudget({measuredMs:2*r.boundMs}).measurementRatio,0.5);
});
test('reduction barriers preserve all contributions; an unsafe interleaving is reported without a fake result',()=>{
  for(const size of [4,8]){
    const safe=reduceBlock({size});
    assert.equal(safe.result,size*(size+1)/2);
    assert.equal(safe.result,safe.expected);
    assert.equal(safe.hazard,false);
    const unsafe=reduceBlock({size,synchronised:false});
    assert.equal(unsafe.result,null);
    const hazard=unsafe.trace.find(t=>t.hazard);
    assert.equal(hazard.shared[hazard.reads[0]],null);
  }
});
test('models reject unsupported and nonfinite inputs',()=>{
  for(const call of [()=>tiledMatmul({n:7}),()=>quantize(1,'fp8'),()=>attention({tile:3}),()=>inferenceBudget({bandwidth:0}),()=>inferenceBudget({measuredMs:NaN}),()=>reduceBlock({size:3})])assert.throws(call);
});
