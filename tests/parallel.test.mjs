import {readingReturn} from '../src/reading-return.mjs';
// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {histogram,categories,scan,compaction,philosophers,barrier,pipeline,routing} from '../src/parallel-models.mjs';
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
 for(const c of parallelChapters){const html=renderParallel(c);assert.match(html,/data-result hidden/);assert.match(html,/data-run disabled/);assert.match(html,/<noscript>/);assert.match(html,/Compare your answer/);assert.match(html,/import torch/);}
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

test('optional appendix returns accept Part II chapters without accepting arbitrary routes',()=>{
 for(const c of parallelChapters){
  const page=`https://example.org/gpu-lab/lessons/inside-sm.html?from=${c.slug}`;
  const path=`/gpu-lab/lessons/${c.slug}.html?inspect=1#main`;
  assert.deepEqual(readingReturn(page+'&return='+encodeURIComponent(path)),{href:'https://example.org'+path,chapter:c.number,label:`Return to Chapter ${c.number}`});
  assert.equal(readingReturn(page+'&return=https://evil.example/').href,readingReturn(page).href);
 }
 assert.equal(readingReturn('https://example.org/gpu-lab/lessons/inside-sm.html?from=unknown'),null);
});

test('resource order finishes while own-fork-first exposes an actual ownership cycle',()=>{
 const safe=philosophers({policy:'ordered'}),cycle=philosophers({policy:'cycle'});
 assert.equal(safe.deadlocked,false);assert.ok(safe.done.every(Boolean));assert.deepEqual(safe.forks,[null,null,null]);assert.deepEqual(safe.held,[[],[],[]]);
 assert.equal(cycle.deadlocked,true);assert.deepEqual(cycle.forks,[0,1,2]);
 assert.deepEqual(cycle.waits,[{from:0,to:1,fork:1},{from:1,to:2,fork:2},{from:2,to:0,fork:0}]);
 assert.ok(cycle.done.every(x=>!x));
 assert.throws(()=>philosophers({policy:'unknown'}),RangeError);
});
test('barrier release requires all matching participants, diagnostics never fabricate a sum',()=>{
 assert.equal(barrier().valid,true);assert.ok(barrier().steps.at(-1).cells.every(x=>x==='May continue'));
 const r=barrier({participation:'subset'});assert.equal(r.valid,false);assert.match(r.summary,/No valid arithmetic result/);
 assert.ok(!r.steps.some(s=>s.cells.includes('May continue')));
});

test('pipeline obeys engine exclusion, producer readiness and slot lifetimes in every configuration',()=>{
 for(const chunks of ['2','4'])for(const copy of ['2','4'])for(const mode of ['serial','pipeline']){
  const r=pipeline({chunks,copy,mode}),n=Number(chunks);
  assert.equal(r.events.length,n);
  for(const [i,e] of r.events.entries()){
   assert.equal(e.copyEnd-e.copyStart,Number(copy));assert.equal(e.computeEnd-e.computeStart,3);
   assert.ok(e.computeStart>=e.copyEnd);
   if(i){assert.ok(e.copyStart>=r.events[i-1].copyEnd);assert.ok(e.computeStart>=r.events[i-1].computeEnd);}
   if(i>=2)assert.ok(e.copyStart>=r.events[i-2].computeEnd);
  }
  const baseline=n*(Number(copy)+3);
  if(mode==='serial')assert.equal(r.span,baseline);else assert.ok(r.span<=baseline);
 }
 assert.equal(pipeline({mode:'pipeline'}).span,14);
 assert.equal(pipeline({mode:'pipeline',copy:'4'}).span,19);
 assert.throws(()=>pipeline({copy:'0'}),RangeError);
});

test('routing conserves identities, assigns unique destinations and preserves category order',()=>{
 for(const distribution of ['mixed','hot']){
  const input=categories[distribution],expectedCounts=[0,1,2,3].map(bin=>input.filter(x=>x===bin).length);
  const countOnly=routing({distribution,goal:'counts'});
  assert.deepEqual(countOnly.counts,expectedCounts);assert.equal(countOnly.writes,0);
  assert.equal(countOnly.offsets,null);assert.equal(countOnly.ranks,null);assert.equal(countOnly.output,null);
  const r=routing({distribution,goal:'group'});
  const expected=[0,1,2,3].flatMap(bin=>input.map((x,i)=>x===bin?i:null).filter(i=>i!==null));
  assert.deepEqual(r.output,expected);assert.deepEqual(r.counts,expectedCounts);
  assert.equal(new Set(r.destinations).size,input.length);assert.equal(r.writes,input.length);
  assert.deepEqual([...r.output].sort((a,b)=>a-b),input.map((_,i)=>i));
  input.forEach((bin,i)=>{
   assert.equal(r.ranks[i],input.slice(0,i).filter(x=>x===bin).length);
   assert.equal(r.offsets[bin],input.filter(x=>x<bin).length);
   assert.equal(r.output[r.destinations[i]],i);
  });
 }
 const r=routing({goal:'group'});
 assert.deepEqual(r.offsets,[0,4,6,7]);assert.deepEqual(r.destinations,[0,4,1,6,5,2,7,3]);
 assert.deepEqual(routing({distribution:'hot',goal:'group'}).offsets,[0,8,8,8]);
 assert.throws(()=>routing({goal:'unknown'}),RangeError);assert.throws(()=>routing({distribution:'unknown'}),RangeError);
});
