// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {steps,simulateIntro,kernelSource,pythonSource,launchPlan} from '../src/hello-model.mjs';
test('intro diagram and outputs derive from thread indices and selected multiplier',()=>{
 for(let stage=0;stage<steps.length;stage++)for(const factor of [-10,-0.5,0,2,3,10]){
  const r=simulateIntro(stage,factor);
  assert.deepEqual(r.input,[1,2,3,4,5]);
  assert.deepEqual(r.output,r.input.map(x=>Math.fround(x*Math.fround(factor))));
  assert.equal(r.safe,true);
  for(const t of r.threads) {
   assert.equal(t.block*r.size+t.local,t.i);
   assert.equal(t.skipped,t.i>=r.input.length);
   if(!t.skipped){assert.equal(t.input,r.input[t.i]);assert.equal(t.output,r.output[t.i]);}
  }
 }
 const unsafe=simulateIntro(3,2,false);
 assert.equal(unsafe.safe,false);
 assert.deepEqual(unsafe.threads.filter(t=>t.invalid).map(t=>t.i),[5,6,7]);
 assert.deepEqual(simulateIntro(2,2).threads.map(t=>t.block),[0,0,0,0,1,1,1,1]);
 assert.throws(()=>simulateIntro(0,NaN));
 assert.throws(()=>simulateIntro(0,11));
 assert.throws(()=>simulateIntro(9,2));
 assert.match(kernelSource(3),/input\[i\] \* 3.0f/);
});

import {renderIntroSections} from '../src/hello-view.mjs';
test('static introduction includes all worked diagrams with unique control IDs',()=>{
 const html=renderIntroSections();
 assert.equal(pythonSource(),'import torch\nx = torch.tensor([1.0, 2.0, 3.0, 4.0, 5.0], device="cuda")\ny = x * 2');
 assert.ok(html.indexOf('import torch') < html.indexOf('Idea 1 of 5'));
 assert.match(html,/Result <code>y<\/code><\/dt><dd><code>\[2, 4, 6, 8, 10\]/);
 assert.equal((html.match(/import torch\nx = /g)||[]).length,2);
 assert.match(html,/How does the GPU calculate these results/);
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length);
 assert.equal((html.match(/class="hello-section"/g)||[]).length,5);
 assert.equal((html.match(/class="hello-thread"/g)||[]).length,34);
 for(let i=0;i<5;i++){
  assert.ok(html.includes('id="hello-factor-'+i+'"'));
  assert.ok(html.includes('id="hello-output-'+i+'"'));
 }
 assert.doesNotMatch(html,/hello-next|hello-back/);
});

test('new-case launch plans cover each input and identify only surplus threads',()=>{
  for(let count=1;count<=32;count++){
    const p=launchPlan(count);
    assert.equal(p.size,4);
    assert.ok(p.threads>=count&&p.threads-count<4);
    assert.equal(p.blocks*4,p.threads);
    assert.deepEqual(p.skipped,Array.from({length:p.threads-count},(_,i)=>count+i));
  }
  for(const count of [0,33,1.5,NaN])assert.throws(()=>launchPlan(count));
});
test('concepts precede CUDA and the first CUDA panel contains a complete kernel',()=>{
  const html=renderIntroSections();
  const cuda=html.indexOf('data-language="cuda"');
  assert.ok(cuda>html.indexOf('id="idea-5"'));
  assert.ok(html.indexOf('__global__')<html.indexOf('id="hello-launch-4"'));
  assert.doesNotMatch(html,/hello-relationships|hello-selected-code|hello-line-/);
});
