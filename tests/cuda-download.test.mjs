// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {runnableSource} from '../src/hello-model.mjs';
import {STARTER,cudaSource,kernelBody} from '../src/kernel-model.mjs';
test('intro download uses the final guarded example and current multiplier',()=>{
  const source=runnableSource(3);
  assert.ok(source.includes('input[i] * 3.0f;'));
  assert.ok(source.includes('runKernel<<<(n + 4 - 1) / 4, 4>>>(d_x, d_y, n);'));
  assert.match(source,/cudaDeviceSynchronize/);
  assert.match(source,/cudaMemcpyDeviceToHost/);
  assert.match(source,/cudaFree/);
  assert.throws(()=>runnableSource(Infinity));
});
test('workshop downloads refuse invalid accesses and write races',()=>{
  for(const blockSize of [8,16,32,64]) {
    const safe={...STARTER,index:'global',blockSize,operation:'vector-add',task:'vector-add'};
    const source=cudaSource(safe);
    assert.ok(source.includes(kernelBody(safe)));
    assert.ok(source.includes('const int n = 35;'));
    assert.throws(()=>cudaSource({...safe,guard:false}),/Repair/);
    if(blockSize<35) assert.throws(()=>cudaSource({...safe,index:'local'}),/Repair/);
  }
});
