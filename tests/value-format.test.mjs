// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {tensorValue} from '../src/value-format.mjs';
import {renderIntroMap} from '../src/hello-view.mjs';
import {simulateIntro} from '../src/hello-model.mjs';

test('floating-point data remains recognisable for whole and fractional values',()=>{
  assert.deepEqual([1,1.5,-2,0,-0].map(tensorValue),['1.0','1.5','-2.0','0.0','0.0']);
  assert.equal(tensorValue(1e-8),'1e-8');
  assert.equal(tensorValue(1000),'1000.0');
});

test('thread rows distinguish floating-point values from thread indices and unknown results',()=>{
  const state=simulateIntro(1,1.5);
  const before=renderIntroMap(0,state,0,false),after=renderIntroMap(0,state,0,true);
  assert.match(before,/<td>1\.0<\/td>/);
  assert.match(before,/>Thread 0<\/button>/);
  assert.match(before,/class="hello-result">\?<\/td>/);
  assert.match(after,/class="hello-result">1\.5<\/td>/);
  assert.match(after,/class="hello-result">3\.0<\/td>/);
});
