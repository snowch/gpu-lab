// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {chapters,renderResult} from '../src/continuation-applications.mjs';
import {attention,inferenceBudget} from '../src/ai-models.mjs';
import {fmt,escape} from '../src/continuation-ui.mjs';

const models={attention,inference:inferenceBudget};

test('application chapters have complete real PyTorch openings and independent narrow experiments',()=>{
  assert.deepEqual(chapters.map(c=>[c.number,c.slug]),[[11,'attention'],[12,'inference']]);
  const ids=chapters.flatMap(c=>c.sections.map(s=>s.id));
  assert.equal(new Set(ids).size,ids.length);
  for(const chapter of chapters){
    assert.match(chapter.source,/import torch/);
    assert.match(chapter.source,/print\(/);
    assert.match(chapter.source,/device="cuda"/);
    assert.ok(chapter.transfer.prompt&&chapter.transfer.answer);
    assert.equal(chapter.sections.length,3);
    for(const section of chapter.sections){
      assert.ok(section.body&&section.task);
      assert.equal(section.experiment.controls.length,1);
      const e=section.experiment;
      for(const [value] of e.controls[0].options){
        const config={...e.defaults,[e.controls[0].key]:value};
        const r=models[e.model](config);
        const frames=r.trace.map((_,cursor)=>renderResult(e.model,r,cursor,e.focus));
        frames.forEach(html=>{
          assert.match(html,/continuation-visual/);
          assert.doesNotMatch(html,/undefined|NaN/);
        });
        if(e.trace===false) assert.equal(new Set(frames).size,1,`${section.id}: the summary is independent of trace position`);
        else assert.equal(new Set(frames).size,frames.length,`${section.id}: every trace step has local evidence`);
        if(e.code){assert.match(e.code(config),/import torch/);assert.match(e.code(config),/print\(/);}
      }
    }
  }
  assert.match(chapters[1].source,/torch.cat\(\(k_cache, k_new\), dim=-2\)/);
  assert.match(chapters[1].source,/dropout_p=0.0, is_causal=False/);
  assert.doesNotMatch(chapters[1].source,/model\.|generate\(/);
});

test('application renderers expose model-derived intermediate accounting and final comparisons',()=>{
  const a=attention({n:32,mode:'materialised'});
  const storage=renderResult('attention',a,2,'attention-storage');
  assert.ok(storage.includes(`${escape(fmt(a.intermediateBytes))} bytes`));
  const online=attention({tile:4});
  const last=renderResult('attention',online,online.trace.length-1,'attention-online');
  assert.ok(last.includes(escape(online.output[0].map(fmt).join(', '))));
  assert.ok(last.includes(`${online.scratchFloats} floats`));
  assert.match(last,/JavaScript doubles/);
  const budget=inferenceBudget({batch:16});
  const batchHTML=renderResult('inference',budget,4,'inference-batch');
  assert.ok(batchHTML.includes(`${escape(fmt(budget.boundMs/budget.tokens))} ms/token`));
  assert.ok(batchHTML.includes(`${escape(fmt(budget.kvCacheBytes))} bytes`));
  assert.match(batchHTML,/not an individual request/);
});

test('renderResult declines unrelated models and accepts default attention focus',()=>{
  assert.equal(renderResult('unrelated',{}),null);
  assert.match(renderResult('attention',attention({mode:'materialised'})),/Softmax weights/);
  assert.match(renderResult('attention',attention()),/Current query-0 estimate/);
});
