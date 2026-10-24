// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {steps,runnableSource} from '../src/hello-model.mjs';
import {STARTER,cudaSource,kernelBody} from '../src/kernel-model.mjs';
test('intro downloads preserve edited kernels and use matching launch arguments',()=>{
  for(let i=0;i<steps.length;i++){
    const source=runnableSource(i,steps[i].body);
    assert.ok(source.includes(steps[i].body));
    assert.ok(source.includes(`runKernel<<<(n + ${steps[i].size} - 1) / ${steps[i].size}, ${steps[i].size}>>>(${i<2?'d_y':'d_x, d_y'});`));
    assert.match(source,/cudaDeviceSynchronize/);
    assert.match(source,/cudaMemcpyDeviceToHost/);
    assert.match(source,/cudaFree/);
  }
  assert.ok(runnableSource(0,'output[0] = 7.0;').includes('output[0] = 7.0;'));
  assert.throws(()=>runnableSource(3,steps[3].body.replace('5','6')),/past/);
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
