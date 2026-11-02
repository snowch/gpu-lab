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

test('thread cards distinguish floating-point values from thread indices and unknown results',()=>{
  const state=simulateIntro(1,1.5);
  const before=renderIntroMap(1,state,0,false),after=renderIntroMap(1,state,0,true);
  assert.match(before,/<small>Input<\/small><strong>1\.0<\/strong>/);
  assert.match(before,/<small>Thread 0<\/small>/);
  assert.match(before,/<small>Output<\/small><strong>\?<\/strong>/);
  assert.match(after,/<small>Output<\/small><strong>1\.5<\/strong>/);
  assert.match(after,/<small>Output<\/small><strong>3\.0<\/strong>/);
});
