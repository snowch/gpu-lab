// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import { overviewExample, renderWorkMap } from '../src/overview-visuals.mjs';

test('overview warps partition each block exactly, including incomplete final warps', () => {
  for (let count = 1; count <= 128; count++) {
    const example = overviewExample(count);
    assert.equal(new Set(example.sms.flatMap(sm => sm.blocks)).size, example.blocks.length);
    for (const block of example.blocks) {
      const flat = block.warps.flat();
      assert.deepEqual(flat.map(thread => thread.thread), Array.from({ length: count }, (_, i) => i));
      for (const [warpIndex, warp] of block.warps.entries()) {
        assert.ok(warp.length > 0 && warp.length <= 32);
        assert.equal(new Set(warp.map(thread => thread.lane)).size, warp.length);
        for (const thread of warp) assert.equal(warpIndex * 32 + thread.lane, thread.thread);
      }
    }
  }
  const partial = overviewExample(33);
  const html = renderWorkMap(partial, 'D', 1);
  assert.equal((html.match(/class="overview-lane inactive"/g) || []).length, 31);
  assert.match(html, /Lane 0, thread 32/);
  assert.match(html, /Lane 31, inactive/);
});

test('overview rejects unsupported examples and unknown selections', () => {
  for (const count of [0, 129, 1.5, NaN]) assert.throws(() => overviewExample(count), RangeError);
  assert.throws(() => renderWorkMap(overviewExample(), 'Z'), RangeError);
  assert.throws(() => renderWorkMap(overviewExample(), 'A', 2), RangeError);
});
