// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {steps,analyse,kernelSource} from '../src/hello-model.mjs';
test('hello progression computes outputs and exposes unwritten tail elements',()=>{
 assert.deepEqual(steps.map((s,i)=>analyse(i,s.body).output),[[42],[0,1,2,3],[2,4,6,8],[2,4,6,8,10]]);
 for(const number of [-12.5,0,7,100.25]) assert.equal(analyse(0,'output[0] = '+number+';').output[0],number);
 assert.deepEqual(analyse(2,'output[i] = input[i] * 3.0;').output,[3,6,9,12]);
 const tail=analyse(3,steps[3].body.replace('5','4'));
 assert.deepEqual(tail.output,[2,4,6,8,null]);assert.equal(tail.skipped,4);
 assert.equal(analyse(3,steps[3].body.replace('5','0')).skipped,8);
 assert.throws(()=>analyse(3,steps[3].body.replace('5','6')),/past/);
 assert.throws(()=>analyse(0,'output[7] = 42.0;'),/change only/);
 assert.throws(()=>analyse(0,'loop {}'));
 assert.throws(()=>analyse(0,'output[0] = 010;'),/leading zeroes/);
 assert.throws(()=>analyse(0,'output[0] = 4 2.0;'),/without spaces/);
 assert.match(kernelSource(2,steps[2].body),/__global__ void runKernel/);
});
