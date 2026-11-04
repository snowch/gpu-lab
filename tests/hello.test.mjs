// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {steps,simulateIntro,kernelSource,pythonSource,launchPlan,launchSource,introPrompt} from '../src/hello-model.mjs';
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
 assert.equal(pythonSource(),'import torch\nx = torch.tensor(\n    [1.0, 2.0, 3.0, 4.0, 5.0],\n    device="cuda",\n)\ny = x * 2');
 assert.ok(html.indexOf('import torch') < html.indexOf('Idea 1 of 5'));
 assert.match(html,/Result <code>y<\/code><\/dt><dd><code>\[2\.0, 4\.0, 6\.0, 8\.0, 10\.0\]/);
 assert.equal((html.match(/import torch\nx = /g)||[]).length,1);
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


test('initial experiment HTML withholds output before scripts run',()=>{
 const html=renderIntroSections().split('<section class="hello-section"').slice(1).join('');
 assert.equal((html.match(/<small>Output<\/small><strong>\?<\/strong>/g)||[]).length,34);
 assert.equal((html.match(/Predict the outputs for this multiplier, then press Run\./g)||[]).length,1);
 assert.match(html,/id="hello-output-1"[^>]*>Run to follow/);
 assert.doesNotMatch(html,/Example output:/);
});

test('first prediction uses a different multiplier from the opening worked example',()=>{
 const html=renderIntroSections(),first=html.split('id="idea-1"')[1].split('id="idea-2"')[0];
 assert.equal(steps[0].factor,3);
 assert.notDeepEqual(simulateIntro(0,steps[0].factor).output,simulateIntro(0,2).output);
 assert.match(first,/id="hello-factor-0"[^>]*value="3"/);
 assert.match(first,/id="hello-operation-0">y = x \* 3/);
 assert.doesNotMatch(first.replace(/<noscript>[\s\S]*?<\/noscript>/g,''),/\[3\.0, 6\.0, 9\.0, 12\.0, 15\.0\]/);
 assert.ok(introPrompt(0).startsWith('Predict'));
 for(let stage=1;stage<5;stage++)assert.ok(introPrompt(stage).startsWith('Run'));
});


test('regrouping preserves outputs and array indices while changing block membership',()=>{
 const four=simulateIntro(4,2,true,4),eight=simulateIntro(4,2,true,8);
 assert.deepEqual(four.output,eight.output);
 assert.equal(four.blocks,2);assert.equal(eight.blocks,1);
 assert.equal(four.threads[4].block,1);assert.equal(eight.threads[4].block,0);
 assert.equal(four.threads[4].local,0);assert.equal(eight.threads[4].local,4);
 for(const size of [4,8]){
  const state=simulateIntro(4,2,true,size),plan=launchPlan(5,size);
  assert.equal(state.blocks,plan.blocks);
  assert.deepEqual(state.threads.filter(t=>t.skipped).map(t=>t.i),plan.skipped);
  for(const t of state.threads)assert.equal(t.block*size+t.local,t.i);
 }
 for(const size of [0,1.5,33,NaN]){
  assert.throws(()=>simulateIntro(4,2,true,size));
  assert.throws(()=>launchPlan(5,size));
 }
 assert.match(launchSource(1,8),/int threadsPerBlock = 8;/);
 assert.match(launchSource(1,8),/int blocks = 1;/);
 assert.match(launchSource(1,8),/runKernel<<<blocks, threadsPerBlock>>>/);
});
