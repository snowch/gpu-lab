// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateLoad, kernelSource } from '../src/model.mjs';

test('an aligned contiguous warp occupies four sectors', () => {
  const result = simulateLoad();
  assert.equal(result.sectors.length, 4);
  assert.equal(result.usefulBytes, 128);
  assert.equal(result.utilisation, 1);
  assert.deepEqual(result.sectors[0].laneIds, [0, 1, 2, 3, 4, 5, 6, 7]);
});
test('offset and stride change sector coverage, not requested bytes', () => {
  assert.equal(simulateLoad({ offset: 1 }).sectors.length, 5);
  for (const [stride, count] of [[2, 8], [4, 16], [8, 32], [16, 32], [32, 32]]) {
    const result = simulateLoad({ stride });
    assert.equal(result.sectors.length, count);
    assert.equal(result.usefulBytes, 128);
  }
});
test('inactive lanes issue no access, including the sector boundary', () => {
  assert.equal(simulateLoad({ activeLanes: 8 }).sectors.length, 1);
  const result = simulateLoad({ activeLanes: 8, offset: 1 });
  assert.equal(result.sectors.length, 2);
  assert.equal(result.usefulBytes, 32);
  assert.equal(result.lanes.filter(l => !l.active).length, 24);
});
test('all supported configurations match an independent byte-address oracle', () => {
  for (let stride = 1; stride <= 32; stride++) {
    for (let offset = 0; offset <= 31; offset++) {
      for (let activeLanes = 1; activeLanes <= 32; activeLanes++) {
        const bytes = Array.from({ length: activeLanes * 4 }, (_, b) =>
          (offset + Math.floor(b / 4) * stride) * 4 + b % 4);
        const expected = new Set(bytes.map(b => b >> 5));
        const result = simulateLoad({ stride, offset, activeLanes });
        assert.deepEqual(new Set(result.sectors.map(s => s.id)), expected);
        assert.equal(result.sectors.flatMap(s => s.laneIds).length, activeLanes);
        assert.ok(result.utilisation > 0 && result.utilisation <= 1);
      }
    }
  }
});
test('invalid configurations are rejected', () => {
  for (const config of [{ stride: 0 }, { offset: -1 }, { activeLanes: 33 },
    { stride: 1.2 }, { offset: NaN }, { activeLanes: Infinity }]) {
    assert.throws(() => simulateLoad(config), RangeError);
  }
});
test('CUDA view uses the configured indexing expression', () => {
  assert.match(kernelSource({ stride: 8, offset: 3 }), /x\[3 \+ i \* 8\]/);
});
