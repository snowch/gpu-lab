// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderProfiling} from '../content/profiling.mjs';
import {codeExplanations} from '../src/code-explanation-data.mjs';
test('profiling excerpt shares the runnable capture source and explains the recorded boundary',()=>{
  const source=readFileSync(new URL('../examples/profile-pytorch.py',import.meta.url),'utf8');
  const html=renderProfiling(source);
  const excerpt=html.match(/id="profiling-capture"[^>]*><code>([\s\S]*?)<\/code>/)[1]
    .replaceAll('&quot;','"').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');
  const entries=codeExplanations(excerpt);
  assert.match(excerpt,/^import torch\nfrom torch.profiler import/);
  assert.match(excerpt,/torch.testing.assert_close\(y, x \+ x\)/);
  assert.ok(entries.length>=6);
  for(const line of excerpt.split('\n').filter(Boolean)) assert.ok(source.includes(line),line);
  assert.match(html,/not yet been validated on an NVIDIA GPU/);
  assert.match(html,/not measured PyTorch output/);
  assert.match(html,/not a benchmark/);
});
