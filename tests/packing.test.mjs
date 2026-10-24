// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import { compareColumnPlans } from '../src/packing-plan.mjs';

test('packing preserves the 32 first-column values in their original order', () => {
  const result = compareColumnPlans(1);
  const source = Array.from({ length: 256 }, (_, i) => i);
  const independent = source.filter((_, index) => index % 8 === 0);
  assert.deepEqual(result.originalValues, independent);
  assert.deepEqual(result.packedValues, independent);
  assert.equal(result.packedValues.length, 32);
});

test('packing costs are counted before every later read and can outweigh benefits', () => {
  const examples = [
    [1, 32, 40, 'direct'], [2, 64, 44, 'packed'],
    [4, 128, 52, 'packed'], [8, 256, 68, 'packed'],
  ];
  for (const [reads, direct, packed, best] of examples) {
    const result = compareColumnPlans(reads);
    assert.equal(result.directTotal, direct);
    assert.equal(result.packedTotal, packed);
    assert.equal(result.best, best);
    assert.equal(result.packRead + result.packWrite + reads * result.packedPerRead, packed);
  }
});

test('the independent byte-sector oracle agrees for every supported number of reads', () => {
  const sectors = addresses => new Set(addresses.map(byte => Math.floor(byte / 32))).size;
  const originalAddresses = Array.from({ length: 32 }, (_, r) => r * 8 * 4);
  const packedAddresses = Array.from({ length: 32 }, (_, r) => r * 4);
  for (let reads = 1; reads <= 64; reads++) {
    const result = compareColumnPlans(reads);
    assert.equal(result.directTotal, reads * sectors(originalAddresses));
    assert.equal(result.packedTotal,
      sectors(originalAddresses) + sectors(packedAddresses) + reads * sectors(packedAddresses));
  }
});

test('invalid read counts are refused', () => {
  for (const value of [0, -1, 1.5, 65, NaN, Infinity, '4', null]) {
    assert.throws(() => compareColumnPlans(value), RangeError);
  }
});
