// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {tensorStep,renderTensorStep} from '../src/tensor-layout.mjs';
test('tensor index steps agree with contiguous FP32 storage at every allowed origin',()=>{
  for(let row=0;row<=30;row++)for(let col=0;col<=6;col++)for(const direction of ['row','column']){
    const s=tensorStep({row,col,direction});
    assert.equal(s.start,row*8+col);
    assert.equal(s.end,s.targetRow*8+s.targetCol);
    assert.equal(s.byteDelta,(s.end-s.start)*4);
    assert.equal(s.delta,direction==='row'?8:1);
    assert.ok(s.cells.some(c=>c.index===s.start));
    assert.ok(s.cells.some(c=>c.index===s.end));
    assert.ok(s.storage.every(c=>c.index<256&&c.byte===c.index*4));
  }
});
test('static fallback is computed from the same model, with invalid indices rejected',()=>{
  assert.match(renderTensorStep(),/8 elements × 4 bytes = 32 bytes/);
  assert.match(renderTensorStep({direction:'column'}),/1 element × 4 bytes = 4 bytes/);
  for(const config of [{row:31},{col:7},{direction:'other'},{row:NaN}])assert.throws(()=>tensorStep(config));
});
