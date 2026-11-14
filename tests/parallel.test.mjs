// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {histogram,categories} from '../src/parallel-models.mjs';
import {parallelChapters} from '../src/parallel-chapters.mjs';
import {renderParallel} from '../content/parallel.mjs';
test('histogram conserves inputs, private merge equals independent category counts',()=>{
 for(const distribution of Object.keys(categories))for(const strategy of ['global','private']){
  const r=histogram({distribution,strategy});
  const expected=[0,1,2,3].map(bin=>categories[distribution].filter(x=>x===bin).length);
  assert.deepEqual(r.counts,expected);
  assert.deepEqual(r.counts,r.partial[0].map((x,i)=>x+r.partial[1][i]));
  assert.equal(r.counts.reduce((a,b)=>a+b,0),8);
  assert.equal(r.globalUpdates,strategy==='global'?8:distribution==='hot'?2:6);
 }
 assert.throws(()=>histogram({distribution:'unknown'}),RangeError);
});
test('new chapters keep model results hidden until Run and offer static comparisons',()=>{
 for(const c of parallelChapters){const html=renderParallel(c);assert.match(html,/data-result hidden/);assert.match(html,/Compare your answer/);assert.match(html,/import torch/);}
});
