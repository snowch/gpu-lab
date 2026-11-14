// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {steps,simulateIntro,kernelSource,pythonSource,launchPlan,launchSource,boundsSource,introPrompt,inspectLaunch} from '../src/hello-model.mjs';
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

import {renderIntroSections,renderSmExplanation} from '../src/hello-view.mjs';
test('compact introduction keeps source, static diagrams and unique control IDs',()=>{
 const html=renderIntroSections();
 assert.equal(pythonSource(),'import torch\nx = torch.tensor(\n    [1.0, 2.0, 3.0, 4.0, 5.0],\n    device="cuda",\n)\ny = x * 2');
 assert.equal((html.match(/import torch\nx = /g)||[]).length,1);
 assert.ok(html.indexOf('import torch')<html.indexOf('id="hello-map-0"'));
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length);
 assert.match(html,/One input and one output per thread/);
 assert.match(html,/Array index rule/);
 assert.equal((html.match(/id="hello-run-/g)||[]).length,1);
 assert.equal((html.match(/__global__ void runKernel/g)||[]).length,1);
 assert.doesNotMatch(html,/hello-next|hello-back|id="hello-map-4"|id="hello-map-1"/);
});

test('chapter 1 keeps the SM distinction and links the optional hardware appendix',()=>{
 const html=renderSmExplanation();
 assert.doesNotMatch(html,/hello-thread|hello-sm-details|type="radio"/);
 assert.match(html,/does not own a separate arithmetic unit/);
 assert.match(html,/data-reading-link href="inside-sm.html\?from=hello"/);
 const chapter=renderIntroSections();
 assert.ok(chapter.indexOf('id="hello-map-2"')<chapter.indexOf('id="hello-sm-title"'));
 assert.ok(chapter.indexOf('id="hello-sm-title"')<chapter.indexOf('id="idea-4"'));
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
test('CUDA bridges stay with their diagrams and provide a local complete function',()=>{
  const html=renderIntroSections();
  const blocks=html.split('id="idea-3"')[1].split('id="idea-4"')[0];
  const bounds=html.split('id="idea-4"')[1].split('id="idea-5"')[0];
  assert.ok(html.indexOf('data-language="cuda"')>html.indexOf('id="idea-3"'));
  assert.ok(blocks.indexOf('id="hello-map-2"')<blocks.indexOf('id="hello-bridge-launch-2"'));
  assert.match(blocks,/Complete CUDA kernel for this example/);
  assert.match(blocks,/__global__ void runKernel/);
  assert.match(bounds,/body excerpt from runKernel/);
  assert.match(bounds,/if \(i &lt; n\)/);
  assert.doesNotMatch(html,/role="tablist"|The final CUDA section shows/);
  // Review the launch in isolation, with optional details closed and without
  // borrowing the following guard section to supply its setup.
  const launch=html.split('id="idea-5"')[1].split('id="idea-4"')[0];
  const visible=launch.replace(/<details\b[\s\S]*?<\/details>/g,'');
  const introduction=visible.indexOf('n = 5');
  assert.ok(introduction>=0&&introduction<visible.indexOf('id="hello-bridge-launch-2"'));
  assert.match(visible,/d_input, d_output, n/);
  assert.match(visible,/__global__ void runKernel/);
  assert.match(visible,/A launch queues GPU work/);
  assert.doesNotMatch(bounds,/In the launch above/);
});

test('bounds excerpts match the guarded function and expose only the diagnostic body without a check',()=>{
  for(const factor of [-0.5,2,3.25]) {
    const guarded=boundsSource(factor);
    assert.ok(kernelSource(factor).includes('    '+guarded.replaceAll('\n','\n    ')));
    assert.match(guarded,/if \(i < n\)/);
    assert.doesNotMatch(boundsSource(factor,false),/if/);
    assert.ok(guarded.includes(boundsSource(factor,false)));
  }
});


test('initial compact table withholds output before scripts run',()=>{
 const html=renderIntroSections();
 assert.equal((html.match(/class="hello-result">\?/g)||[]).length,5);
 assert.match(html,/Run to inspect the calculation/);
 assert.doesNotMatch(html,/Example output:/);
 const first=html.split('id="hello-map-0"')[1].split('</table>')[0];
 assert.doesNotMatch(first,/class="hello-result">[0-9]/);
});

test('the single guided demo can change multiplier without pretending to assess arithmetic',()=>{
 const html=renderIntroSections();
 assert.match(html,/id="hello-factor-0"[^>]*value="2"/);
 assert.match(html,/Change the multiplier to inspect another calculation/);
 assert.notDeepEqual(simulateIntro(0,3).output,simulateIntro(0,2).output);
 assert.ok(introPrompt(0).startsWith('Run'));
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
 const source=launchSource(1,8);
 const declaration=source.match(/int n = (\d+);/);
 assert.ok(declaration);
 assert.equal(Number(declaration[1]),simulateIntro(0,2).input.length);
 assert.ok(source.indexOf(declaration[0])<source.indexOf('runKernel<<<'));
 assert.match(source,/d_input, d_output, n/);
 assert.match(launchSource(1,8),/int threadsPerBlock = 8;/);
 assert.match(launchSource(1,8),/int blocks = 1;/);
 assert.match(launchSource(1,8),/runKernel<<<blocks, threadsPerBlock>>>/);
});

test('diagnostics distinguish off-by-one access, missing work and safe surplus work',()=>{
 const changed=inspectLaunch(5,4,2,'<=');
 assert.deepEqual(changed.threads.filter(t=>t.invalid).map(t=>t.i),[5]);
 assert.deepEqual(changed.threads.filter(t=>t.skipped).map(t=>t.i),[6,7]);
 assert.equal(changed.threads[5].output,null);
 const fixed=inspectLaunch(5,4,2);
 assert.deepEqual(fixed.threads.filter(t=>t.skipped).map(t=>t.i),[5,6,7]);
 const short=inspectLaunch(9,4,2);
 assert.equal(short.safe,true);assert.deepEqual(short.missing,[8]);assert.equal(short.output[8],null);
 for(const blocks of [3,4]){
   const complete=inspectLaunch(9,4,blocks);
   assert.equal(complete.safe,true);assert.deepEqual(complete.missing,[]);
   assert.deepEqual(complete.output,[2,4,6,8,10,12,14,16,18]);
   assert.equal(complete.threads.filter(t=>t.skipped).length,blocks*4-9);
 }
 for(const args of [[0,4,2],[5,0,2],[5,4,0],[5,4,9],[5,4,2,'>']])assert.throws(()=>inspectLaunch(...args));
});
