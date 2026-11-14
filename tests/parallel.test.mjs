// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {histogram,categories,scan,compaction} from '../src/parallel-models.mjs';
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

test('scan matches independent prefixes for every supported size and convention',()=>{
 for(const size of ['4','8'])for(const kind of ['inclusive','exclusive']){
  const r=scan({size,kind});
  assert.deepEqual(r.values,r.input.map((_,i)=>r.input.slice(0,i+(kind==='inclusive'?1:0)).reduce((a,b)=>a+b,0)));
  assert.equal(r.steps.length,1+Math.log2(Number(size))+(kind==='exclusive'?1:0));
  assert.equal(r.values.at(-1)+(kind==='exclusive'?r.input.at(-1):0),r.input.reduce((a,b)=>a+b,0));
 }
 assert.equal(scan().additions,17);assert.throws(()=>scan({size:'5'}),RangeError);
});

test('compaction preserves stable identities with unique destinations for all/none and both write orders',()=>{
 const predicates={zero:x=>x===0,nonzero:x=>x!==0,all:()=>true,none:()=>false};
 for(const [predicate,keep] of Object.entries(predicates))for(const order of ['forward','reverse']){
  const r=compaction({predicate,order});
  const expected=categories.mixed.map((x,i)=>keep(x)?i:null).filter(x=>x!==null);
  assert.deepEqual(r.output,expected);assert.equal(r.count,expected.length);
  assert.equal(r.offsets.at(-1)+r.flags.at(-1),r.count);
  assert.equal(new Set(r.writes).size,r.count);
  assert.deepEqual([...r.writes].sort((a,b)=>a-b),Array.from({length:r.count},(_,i)=>i));
 }
 assert.throws(()=>compaction({order:'unknown'}),RangeError);
});
