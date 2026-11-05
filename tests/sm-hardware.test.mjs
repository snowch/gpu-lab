// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {smFrame,smEvents} from '../src/sm-hardware-model.mjs';
import {readingReturn} from '../src/reading-return.mjs';
test('SM walkthrough keeps each warp’s register values separate while reusing arithmetic hardware',()=>{
 const initial=smFrame();assert.ok(initial.warps.every(w=>w.loaded===null&&w.output===null));
 const a=smFrame(4);
 assert.equal(a.warps[0].status,'Ready to store');
 assert.equal(a.warps[1].status,'Waiting for input');
 assert.equal(a.arithmetic.warp,'A');
 const b=smFrame(7);
 assert.equal(b.arithmetic.warp,'B');
 assert.deepEqual(b.warps[0].loaded,a.warps[0].loaded);
 assert.deepEqual(b.warps[0].result,a.warps[0].result);
 assert.equal(b.warps[1].output,null);
 const final=smFrame(smEvents.length-1);
 assert.deepEqual(final.warps.flatMap(w=>w.output),Array.from({length:64},(_,i)=>(i+1)*2));
 for(let i=0;i<smEvents.length;i++)for(const warp of smFrame(i).warps){
  assert.equal(warp.input.length,32);
  if(warp.result)assert.deepEqual(warp.result,warp.loaded.map(x=>x*2));
  if(warp.output)assert.deepEqual(warp.output,warp.result);
 }
 assert.throws(()=>smFrame(-1));assert.throws(()=>smFrame(9));assert.throws(()=>smFrame(1.5));
});
test('appendix returns retain local chapter URLs and reject outside or unrelated destinations',()=>{
 const base='https://example.org/gpu-lab/lessons/inside-sm.html?from=hello';
 assert.deepEqual(readingReturn(base+'&return='+encodeURIComponent('/gpu-lab/lessons/hello.html?keep=1#idea-3')),{href:'https://example.org/gpu-lab/lessons/hello.html?keep=1#idea-3',chapter:1,label:'Return to Chapter 1'});
 for(const path of ['https://evil.example/hello.html','/other/hello.html','/gpu-lab/lessons/kernel.html','javascript:alert(1)'])assert.equal(readingReturn(base+'&return='+encodeURIComponent(path)).href,'https://example.org/gpu-lab/lessons/hello.html#hello-sm-title');
 assert.equal(readingReturn(base.replace('from=hello','from=scheduling')).chapter,6);
 assert.equal(readingReturn(base.replace('from=hello','from=reading')).chapter,3);
 assert.equal(readingReturn(base.replace('from=hello','from=index')).label,'Return to the book contents');
 assert.equal(readingReturn(base.replace('from=hello','from=unknown')),null);
});
