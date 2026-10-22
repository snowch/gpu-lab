// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {tensorStep,renderTensorStep,strideExample,renderStrideExample,viewCopyComparison,sectorComparison} from '../src/tensor-layout.mjs';
test('stride examples show +1/+8 element steps with correct byte offsets',()=>{
  const col=strideExample('column');
  assert.equal(col.start,0);
  assert.equal(col.end,1);
  assert.equal(col.delta,1);
  assert.equal(col.byteDelta,4);
  assert.equal(col.targetRow,0);
  assert.equal(col.targetCol,1);
  const row=strideExample('row');
  assert.equal(row.start,0);
  assert.equal(row.end,8);
  assert.equal(row.delta,8);
  assert.equal(row.byteDelta,32);
  assert.equal(row.targetRow,1);
  assert.equal(row.targetCol,0);
  assert.throws(()=>strideExample('diagonal'),RangeError);
});
test('static stride figures are always-visible worked examples',()=>{
  const colHtml=renderStrideExample('column');
  assert.match(colHtml,/move right one column/);
  assert.match(colHtml,/\+1 element × 4 bytes = <strong>\+4 bytes<\/strong>/);
  assert.match(colHtml,/x\[0, 0\] → x\[0, 1\]/);
  assert.match(colHtml,/stride-example/);
  assert.match(colHtml,/data-direction="column"/);
  const rowHtml=renderStrideExample('row');
  assert.match(rowHtml,/move down one row/);
  assert.match(rowHtml,/\+8 elements × 4 bytes = <strong>\+32 bytes<\/strong>/);
  assert.match(rowHtml,/x\[0, 0\] → x\[1, 0\]/);
  assert.match(rowHtml,/data-direction="row"/);
});
test('view/copy comparison shows shared versus separate storage',()=>{
  const html=viewCopyComparison();
  assert.match(html,/view-copy-comparison/);
  assert.match(html,/x\[:, 0\] \(view\)/);
  assert.match(html,/x\[:, 0\]\.contiguous\(\) \(copy\)/);
  assert.match(html,/shares x's storage/);
  assert.match(html,/new storage/);
  assert.match(html,/stride 8/);
  assert.match(html,/stride 1/);
});
test('sector comparison shows 4 versus 32 sectors for the same useful bytes',()=>{
  const html=sectorComparison();
  assert.match(html,/sector-comparison/);
  assert.match(html,/<strong>4 sectors<\/strong>/);
  assert.match(html,/<strong>32 sectors<\/strong>/);
  assert.match(html,/128 bytes requested/);
  assert.match(html,/not measured GPU timing/);
  assert.match(html,/8 values<\/strong> \(8 active lanes\)/);
  assert.match(html,/32<\/strong>/);
});
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
