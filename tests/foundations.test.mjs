// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {deviceJourney,readTensor,journeyCode,readingCode} from '../src/foundations-model.mjs';
import {renderDeviceSections,renderReadingSections} from '../src/foundations-view.mjs';
import {chapters,renderBookNav} from '../content/book.mjs';

test('device journey separates copies from computation and retains input allocations',()=>{
  for(const count of [5,8]) for(const factor of [-3,0,2,0.1,10]) {
    const copied=deviceJourney({count,stage:0,factor});
    assert.equal(copied.before.gpu.length,0);assert.equal(copied.after.gpu.length,1);
    assert.deepEqual(copied.after.cpu[0].values,copied.after.gpu[0].values);
    assert.notEqual(copied.after.cpu[0].values,copied.after.gpu[0].values);
    assert.equal(copied.transferBytes,count*4);
    const computed=deviceJourney({count,stage:1,factor});
    assert.deepEqual(computed.before.gpu,copied.after.gpu);
    assert.equal(computed.transferBytes,0);assert.equal(computed.after.gpu.length,2);
    assert.deepEqual(computed.after.cpu,computed.before.cpu);
    assert.deepEqual(computed.after.gpu[1].values,Array.from({length:count},(_,i)=>Math.fround((i+1)*Math.fround(factor))));
    const returned=deviceJourney({count,stage:2,factor});
    assert.deepEqual(returned.before.gpu,computed.after.gpu);
    assert.deepEqual(returned.after.cpu[1].values,computed.after.gpu[1].values);
    assert.equal(returned.transferBytes,count*4);
    returned.after.cpu[1].values[0]=999;
    assert.notEqual(returned.after.gpu[1].values[0],999);
    assert.equal(returned.before.cpu[0].values[0],1);
  }
});
test('equal-length row/column views and packed copies preserve the expected values',()=>{
  const rows=Array.from({length:5},(_,r)=>Array.from({length:5},(_,c)=>1+r*5+c));
  for(let index=0;index<5;index++) for(const factor of [-2,0,2,0.1]) {
    const row=readTensor({pattern:'row',index,factor}),column=readTensor({pattern:'column',index,factor}),packed=readTensor({pattern:'packed',index,factor});
    assert.deepEqual(row.values,rows[index]);assert.deepEqual(column.values,rows.map(r=>r[index]));
    assert.deepEqual(packed.values,column.values);assert.deepEqual(packed.output,column.output);
    assert.equal(row.stride,1);assert.equal(column.stride,5);assert.equal(packed.stride,1);
    assert.equal(row.copyBytes,0);assert.equal(column.copyBytes,0);assert.equal(packed.copyBytes,20);
    assert.ok(row.shared&&column.shared&&!packed.shared);
    assert.deepEqual(packed.offsets,[0,1,2,3,4]);assert.deepEqual(packed.sourceOffsets,column.offsets);
    assert.deepEqual(column.output,column.values.map(v=>Math.fround(v*Math.fround(factor))));
    for(const s of [row,column,packed]) {
      assert.equal(s.load.usefulBytes,20);
      const byteSets=new Set(s.offsets.flatMap(offset=>[0,1,2,3].map(b=>Math.floor((offset*4+b)/32))));
      assert.equal(s.load.sectors.length,byteSets.size);
      assert.deepEqual(s.load.lanes.filter(l=>l.active).map(l=>l.element),s.offsets);
    }
  }
  assert.equal(readTensor().load.sectors.length,1);
  assert.equal(readTensor({pattern:'column'}).load.sectors.length,3);
  assert.equal(readTensor({pattern:'packed'}).load.sectors.length,1);
  assert.equal(readTensor({index:1}).load.sectors.length,2);
});
test('models reject unsupported states before generating code',()=>{
  for(const factor of [NaN,Infinity,-11,11,'2']) {
    assert.throws(()=>deviceJourney({factor}));assert.throws(()=>readTensor({factor}));
  }
  for(const config of [{stage:3},{count:6}]) assert.throws(()=>journeyCode(config));
  for(const config of [{index:5},{index:-1},{index:0.5},{pattern:'other'}]) assert.throws(()=>readingCode(config));
  assert.match(journeyCode({stage:1,factor:3}).operation,/y_gpu = x_gpu \* 3/);
  assert.match(readingCode({pattern:'packed',index:2}),/column = x\[:, 2\]/);
});
test('opening has independent experiment ownership and all-page chapter navigation',()=>{
  const device=renderDeviceSections(),reading=renderReadingSections();
  assert.equal([...device.matchAll(/data-book-experiment=/g)].length,3);
  assert.equal([...reading.matchAll(/data-book-experiment=/g)].length,4);
  assert.equal(chapters.filter(c=>c.opening).length,3);
  for(const current of ['index','hello','devices','reading','memory','reduction']) {
    const nav=renderBookNav(current);
    assert.equal([...nav.matchAll(/aria-current="page"/g)].length,1);
    for(const slug of ['hello','devices','reading']) assert.ok(nav.includes(slug+'.html'));
  }
});
