// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import { STARTER, inputFor, reference, simulateKernel, snapshot, kernelBody } from '../src/kernel-model.mjs';
const repaired = { ...STARTER, index: 'global' };
test('repaired kernel matches an independent scalar reference through partial workgroups', () => {
  for (let length = 0; length <= 129; length++) {
    const input = inputFor(length), result = simulateKernel(repaired, input);
    assert.equal(result.passed, true);
    assert.deepEqual(result.output, Array.from(input, value => Math.fround(value * 2)));
    assert.equal(result.trace.filter(event => event.op === 'store').length, length);
    assert.equal(new Set(result.trace.filter(event => event.op === 'store').map(event => event.i)).size, length);
    assert.deepEqual(snapshot(result, result.trace.length - 1), result.output);
    for (const event of result.trace) {
      assert.equal(event.group * 32 + event.local, event.global);
      if (event.op === 'load' || event.op === 'store') assert.equal(event.byteOffset, event.i * 4);
    }
  }
});
test('starter misses exactly the first output and source follows every supported edit', () => {
  for (const length of [8, 32, 35]) {
    const result = simulateKernel(STARTER, inputFor(length));
    assert.equal(result.safe, true); assert.equal(result.passed, false);
    assert.deepEqual(result.failures.map(failure => failure.index), [0]);
    assert.equal(result.output[0], null);
  }
  assert.match(kernelBody(STARTER), /let i = global_id.x \+ 1u/);
  assert.match(kernelBody(repaired), /let i = global_id.x;/);
  assert.doesNotMatch(kernelBody({ ...repaired, guard: false }), /if \(/);
  assert.match(kernelBody({ ...repaired, operation: 'add' }), /x\[i\] \+ params.factor/);
});
test('unsafe configurations fail even when the in-bounds outputs happen to match', () => {
  const tail = simulateKernel({ ...repaired, guard: false }, inputFor(8));
  assert.equal(tail.safe, false); assert.equal(tail.passed, false);
  assert.deepEqual(tail.output, reference(inputFor(8)));
  assert.equal(tail.trace.find(event => event.op === 'fault').global, 8);
  const local = { ...repaired, index: 'local' };
  assert.equal(simulateKernel(local, inputFor(32)).passed, true);
  const repeated = simulateKernel(local, inputFor(35));
  assert.equal(repeated.safe, false);
  assert.match(repeated.hazards[0], /different workgroups/);
  assert.deepEqual(repeated.output.slice(32), [null, null, null]);
});
test('changing arithmetic changes computed output, and unsupported expressions are rejected', () => {
  const result = simulateKernel({ ...repaired, operation: 'add' }, inputFor(35));
  assert.equal(result.safe, true); assert.equal(result.passed, false);
  assert.equal(result.output[0], 2.5);
  assert.throws(() => simulateKernel({ ...repaired, index: 'eval(code)' }, inputFor(8)));
  assert.throws(() => simulateKernel(repaired, [NaN]));
});
