// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  schedulingExample,
  divergenceExample,
  sharedMemoryExample,
  reductionExample,
  matmulExample,
  tensorCoresExample,
  attentionExample,
  inferenceExample,
  renderWorkedExample,
} from '../src/worked-examples.mjs';

test('all worked example renderers return non-empty HTML figures', () => {
  const renderers = {
    scheduling: schedulingExample,
    divergence: divergenceExample,
    'shared-memory': sharedMemoryExample,
    reduction: reductionExample,
    matmul: matmulExample,
    'tensor-cores': tensorCoresExample,
    attention: attentionExample,
    inference: inferenceExample,
  };
  for (const [slug, fn] of Object.entries(renderers)) {
    const html = fn();
    assert.ok(html.length > 100, `${slug} worked example should produce substantial HTML`);
    assert.match(html, /worked-example/, `${slug} should have the worked-example class`);
    assert.match(html, /<figure/, `${slug} should be wrapped in a figure element`);
  }
});

test('scheduling worked example shows warp scheduling and latency', () => {
  const html = schedulingExample();
  assert.match(html, /warp/i);
  assert.match(html, /latency|idle|issue/i);
});

test('divergence worked example shows branch divergence', () => {
  const html = divergenceExample();
  assert.match(html, /diverg/i);
  assert.match(html, /lane/i);
});

test('shared memory worked example shows bank conflicts', () => {
  const html = sharedMemoryExample();
  assert.match(html, /bank/i);
  assert.match(html, /conflict/i);
});

test('reduction worked example shows tree reduction', () => {
  const html = reductionExample();
  assert.match(html, /tree|reduc/i);
  assert.match(html, /\+/);
});

test('matmul worked example shows tiling', () => {
  const html = matmulExample();
  assert.match(html, /tile/i);
  assert.match(html, /matmul|matrix mult/i);
});

test('tensor cores worked example shows precision trade-off', () => {
  const html = tensorCoresExample();
  assert.match(html, /FP16|fp16|BF16|bf16|FP32|fp32/i);
  assert.match(html, /precision|fraction/i);
});

test('attention worked example shows memory savings', () => {
  const html = attentionExample();
  assert.match(html, /attention/i);
  assert.match(html, /online|flash/i);
});

test('inference worked example shows roofline concept', () => {
  const html = inferenceExample();
  assert.match(html, /roofline|bound/i);
  assert.match(html, /memory|compute/i);
});

test('renderWorkedExample dispatches by slug', () => {
  const html = renderWorkedExample('scheduling');
  assert.match(html, /worked-example/);
  assert.match(html, /warp/i);
});

test('renderWorkedExample returns empty string for unknown slug', () => {
  assert.equal(renderWorkedExample('nonexistent'), '');
  assert.equal(renderWorkedExample(''), '');
  assert.equal(renderWorkedExample(undefined), '');
});
