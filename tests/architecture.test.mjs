// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import { scheduleWarps, branchWarp, sharedBanks } from '../src/architecture.mjs';

test('scheduler honours dependencies, a single issue slot, and complete per-warp programs', () => {
  for (let warps = 1; warps <= 8; warps++) for (let latency = 1; latency <= 16; latency++) {
    const r = scheduleWarps({ warps, latency });
    assert.equal(r.issued, warps * 6);
    for (let w = 0; w < warps; w++) {
      const issued = r.trace.filter(t => t.selected === w);
      assert.deepEqual(issued.map(t => t.instruction), r.program);
      assert.ok(issued[1].cycle - issued[0].cycle >= latency);
      assert.ok(issued[4].cycle - issued[3].cycle >= latency);
    }
    for (const tick of r.trace) {
      if (tick.selected === null) assert.ok(!tick.before.some(w => w.status === 'ready'));
      else assert.equal(tick.before[tick.selected].status, 'ready');
    }
  }
});
test('one warp exposes waits; more warps can fill them without reducing load latency', () => {
  assert.equal(scheduleWarps({ warps: 1, latency: 6 }).idle, 10);
  assert.equal(scheduleWarps({ warps: 1, latency: 1 }).idle, 0);
  assert.equal(scheduleWarps({ warps: 8, latency: 6 }).idle, 0);
  assert.equal(scheduleWarps({ warps: 1, latency: 6 }).cycles, 16);
});
test('branch paths skip empty masks and exclude inactive lanes', () => {
  assert.equal(branchWarp({ pattern: 'positive' }).instructions, 1);
  assert.equal(branchWarp({ pattern: 'negative' }).instructions, 3);
  assert.equal(branchWarp({ pattern: 'halves', activeLanes: 16 }).instructions, 1);
  const mixed = branchWarp();
  assert.equal(mixed.instructions, 4);
  assert.equal(mixed.usefulSlots, 64);
  assert.equal(mixed.utilisation, 0.5);
  assert.equal(mixed.lanes[1].output, 5);
  assert.equal(branchWarp({ negativeOps: 1 }).lanes[1].output, 2);
  assert.equal(branchWarp({ pattern: 'one-negative' }).usefulSlots, 34);
  assert.equal(branchWarp({ activeLanes: 1 }).lanes[1].output, null);
});
test('branch instruction masks match scalar conditions for every supported active count', () => {
  for (const pattern of ['positive', 'negative', 'halves', 'alternating', 'one-negative']) {
    for (let activeLanes = 1; activeLanes <= 32; activeLanes++) for (const negativeOps of [1, 3]) {
      const r = branchWarp({ pattern, activeLanes, negativeOps });
      for (const lane of r.lanes) {
        const appearances = r.trace.filter(t => t.mask.includes(lane.id)).length;
        assert.equal(appearances, !lane.active ? 0 : lane.input < 0 ? negativeOps : 1);
      }
    }
  }
});
test('bank conflicts distinguish broadcasts from different words in the same bank', () => {
  assert.equal(sharedBanks({ stride: 1 }).rounds, 1);
  assert.equal(sharedBanks({ stride: 32 }).rounds, 32);
  assert.equal(sharedBanks({ stride: 33 }).rounds, 1);
  assert.equal(sharedBanks({ stride: 2 }).rounds, 2);
  const broadcast = sharedBanks({ broadcast: true });
  assert.equal(broadcast.rounds, 1);
  assert.equal(broadcast.banksUsed, 1);
  assert.equal(broadcast.trace[0].served[0].laneIds.length, 32);
});
test('bank rounds deliver every lane once and at most one word per bank per round', () => {
  for (let stride = 1; stride <= 33; stride++) for (let activeLanes = 1; activeLanes <= 32; activeLanes++) {
    const r = sharedBanks({ stride, activeLanes });
    const expected = Array(32).fill(0);
    for (let lane = 0; lane < activeLanes; lane++) expected[lane * stride % 32]++;
    assert.equal(r.rounds, Math.max(...expected));
    assert.deepEqual(r.trace.flatMap(t => t.served.flatMap(s => s.laneIds)).sort((a,b)=>a-b), Array.from({length:activeLanes},(_,i)=>i));
    for (const round of r.trace) assert.equal(new Set(round.served.map(s=>s.bank)).size, round.served.length);
  }
});
test('invalid model parameters fail clearly', () => {
  for (const config of [{ warps: 0 }, { latency: 0 }, { latency: NaN }]) assert.throws(() => scheduleWarps(config));
  assert.throws(() => branchWarp({ pattern: 'unknown' }));
  assert.throws(() => sharedBanks({ stride: 34 }));
  assert.throws(() => sharedBanks({ activeLanes: 0 }));
});
