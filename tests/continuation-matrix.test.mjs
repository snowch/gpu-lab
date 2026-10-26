// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {chapters,renderResult} from '../src/continuation-matrix.mjs';
import {tiledMatmul,precisionMatmul} from '../src/ai-models.mjs';
import {fmt} from '../src/continuation-ui.mjs';

test('matrix chapters keep independent, valid focused experiments',()=>{
  assert.deepEqual(chapters.map(chapter=>[chapter.number,chapter.slug]),[[9,'matmul'],[10,'tensor-cores']]);
  const ids=new Set();
  for(const chapter of chapters) {
    assert.match(chapter.source,/import torch/);
    assert.match(chapter.source,/a @ b/);
    assert.ok(chapter.transfer.prompt&&chapter.transfer.answer);
    const sections=chapter.sections.filter(section=>section.experiment);
    assert.equal(sections.length,2);
    for(const section of chapter.sections) {
      assert.ok(!ids.has(section.id));ids.add(section.id);
      if(!section.experiment)continue;
      const experiment=section.experiment;
      const compute=experiment.model==='matmul'?tiledMatmul:precisionMatmul;
      const cases=[experiment.defaults];
      for(const control of experiment.controls) {
        assert.ok(control.options.some(([value])=>value===experiment.defaults[control.key]));
        cases.push(...control.options.map(([value])=>({...experiment.defaults,[control.key]:value})));
      }
      for(const config of cases) {
        const result=compute(config);
        for(const cursor of [0,result.trace.length-1]) {
          const html=renderResult(experiment.model,result,cursor,experiment.focus);
          assert.ok(html.includes('continuation-visual'));
          assert.ok(!html.includes('undefined'));
          assert.ok(!html.includes('NaN'));
        }
        assert.match(experiment.code(config),/import torch/);
      }
    }
  }
});

test('dot rendering follows the current output pair and its actual K contribution',()=>{
  const result=tiledMatmul({n:4,tile:1});
  const cursor=11,step=result.trace[cursor];
  const html=renderResult('matmul',result,cursor,'dot');
  assert.ok(html.includes(`C[${step.row},${step.col}]`));
  assert.ok(html.includes(`K = ${step.k0}`));
  assert.ok(html.includes(`<dd>${fmt(step.cCells[0][2])}</dd>`));
  assert.ok(html.includes(`<dd>${fmt(result.output[step.row][step.col])}</dd>`));
});

test('reuse rendering distinguishes current partial tiles from complete C',()=>{
  for(const tile of [1,2,4]) {
    const result=tiledMatmul({n:4,tile});
    const html=renderResult('matmul',result,0,'reuse');
    assert.ok(html.includes(`<dd>${result.inputLoads}</dd>`));
    assert.ok(html.includes(`<dd>${result.trace[0].aCells.length+result.trace[0].bCells.length}</dd>`));
    assert.match(html,/Final C \(all K phases complete\)/);
  }
});

test('precision rendering separates conversion and accumulation without a hardware trace claim',()=>{
  for(const format of ['fp16','bf16','fp32'])for(const pattern of ['cancellation','small','exact']) {
    const result=precisionMatmul({format,pattern});
    const conversion=renderResult('tensor-cores',result,15,'conversion');
    assert.ok(conversion.includes(`<dd>${result.changed}</dd>`));
    assert.ok(conversion.includes(`Input position K = 15`));
    const accumulation=renderResult('tensor-cores',result,15,'accumulation');
    assert.ok(accumulation.includes(`<dd>${fmt(result.result)}</dd>`));
    assert.ok(accumulation.includes(`<dd>${fmt(result.reference)}</dd>`));
    assert.match(accumulation,/not a tensor-core trace/);
  }
  assert.equal(renderResult('attention',{}),null);
});
