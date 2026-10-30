// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {chapter,renderResult} from '../src/continuation-capstone.mjs';
import {computeExperiment} from '../src/continuation-view.mjs';
test('capstone choices preserve the linear-layer answer while exposing the reuse/resource trade-off',()=>{
 const experiment=chapter.sections[1].experiment;
 const results=[1,2,4].map(tile=>computeExperiment(experiment,{...experiment.defaults,tile}));
 assert.deepEqual(results.map(r=>[r.inputLoads,r.n*r.n,r.sharedBytes,r.registersPerBlock,r.residentBlocks]),[[128,16,0,64,8],[64,16,32,256,4],[32,16,128,1024,1]]);
 for(const r of results){
  assert.equal(r.output[0][0],1);
  assert.deepEqual(r.output,results[0].output);
  assert.match(renderResult('capstone',r),/Output matches the baseline: <strong>yes/);
 }
 const larger=computeExperiment(experiment,{...experiment.defaults,n:8});
 assert.deepEqual([larger.inputLoads,larger.n*larger.n,larger.residentBlocks],[512,64,4]);
});
