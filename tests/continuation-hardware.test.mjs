// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import { chapters, renderResult } from '../src/continuation-hardware.mjs';
import { scheduleWarps, branchWarp } from '../src/architecture.mjs';
import { reduceBlock } from '../src/ai-models.mjs';

const models = { scheduling: scheduleWarps, divergence: branchWarp, reduction: reduceBlock };
function configurations(experiment) {
  return experiment.controls.reduce((configs, control) => configs.flatMap(config =>
    control.options.map(([value]) => ({ ...config, [control.key]: value }))), [experiment.defaults]);
}

test('hardware chapters render every offered configuration and trace position from the unchanged models', () => {
  assert.deepEqual(chapters.map(chapter => chapter.number), [6, 7, 8]);
  const ids = new Set();
  for (const chapter of chapters) {
    assert.match(chapter.source, /^import torch/);
    for (const section of chapter.sections) {
      assert.ok(!ids.has(section.id), `Duplicate section ${section.id}`);
      ids.add(section.id);
      assert.ok(section.task);
      const experiment = section.experiment;
      for (const config of configurations(experiment)) {
        const result = models[experiment.model](config);
        if (experiment.code) assert.match(experiment.code(config), /^import torch/);
        for (let cursor = 0; cursor < result.trace.length; cursor++) {
          const html = renderResult(experiment.model, result, cursor, experiment.focus);
          assert.match(html, /continuation-visual/);
          assert.doesNotMatch(html, /undefined|NaN|Infinity/);
        }
      }
    }
  }
  assert.equal(renderResult('other-model', {}, 0), null);
});

test('reduction diagnostics identify the actual unwritten partner and never display a numeric final sum', () => {
  for (const size of [4, 8]) {
    const result = reduceBlock({ size, synchronised: false });
    const cursor = result.trace.findIndex(event => event.hazard);
    const html = renderResult('reduction', result, cursor);
    assert.match(html, new RegExp(`thread 0 reads shared word ${size / 2} before its input write`));
    assert.match(html, /Final valid sum<\/dt><dd>No numeric result/);
    assert.doesNotMatch(html, new RegExp(`Final valid sum<\/dt><dd>${result.expected}`));
    assert.doesNotMatch(html, /Contribution tree/);
  }
});

test('current reduction state shows only contribution levels reached by the selected event', () => {
  const result = reduceBlock({ size: 8, synchronised: true });
  const first = renderResult('reduction', result, 0);
  const last = renderResult('reduction', result, result.trace.length - 1);
  assert.doesNotMatch(first, /0, 4, 2, 6, 1, 5, 3, 7/);
  assert.match(last, /0, 4, 2, 6, 1, 5, 3, 7/);
  assert.match(last, /Final valid sum<\/dt><dd>36/);
});
