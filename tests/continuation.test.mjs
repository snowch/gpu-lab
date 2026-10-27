// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {continuationChapters,renderContinuation,computeExperiment,experimentResult,traceLength} from '../src/continuation-view.mjs';
import {chapters,renderBookNav,renderBookPage} from '../content/book.mjs';
import {chapterReferences} from '../src/reference-tasks.mjs';

test('published continuation has a continuous sequence and independent local experiments',()=>{
  assert.deepEqual(continuationChapters.map(c=>c.number),[6,7,8,9,10,11,12]);
  const ids=new Set();
  for(const chapter of continuationChapters){
    assert.equal(chapters[chapter.number-1].slug,chapter.slug);
    assert.equal(chapters[chapter.number-1].title,chapter.title);
    assert.ok(chapterReferences[chapter.slug].tasks.length>=2);
    const html=renderContinuation(chapter);
    assert.match(html,/no installation or GPU required/);
    assert.match(html,/import torch/);
    assert.ok(html.indexOf('chapter-opening-code')<html.indexOf('continuation-section'));
    assert.ok(chapter.sections.filter(s=>s.experiment).length>=2);
    for(const section of chapter.sections){
      assert.ok(!ids.has(section.id),section.id);ids.add(section.id);
      if(!section.experiment)continue;
      assert.ok(section.task);
      const result=computeExperiment(section.experiment);
      assert.ok(result.trace.length>0);
      assert.ok(experimentResult(section.experiment,result).length>100);
    }
    const nav=renderBookNav(chapter.slug);
    assert.equal([...nav.matchAll(/aria-current="page"/g)].length,1);
    for(const other of chapters)assert.ok(nav.includes(other.slug+'.html'));
    const page=renderBookPage({...chapter,content:html,continuation:true,previous:{href:'previous.html',title:'Previous'},next:{href:'next.html',title:'Next'}});
    assert.match(page,/src\/continuation.mjs/);
    assert.ok(page.indexOf('continuation-transfer')<page.indexOf('chapter-references'));
    assert.match(page,/desktop.html#examples/);
    const attributes=[...page.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
    assert.equal(new Set(attributes).size,attributes.length,'duplicate HTML ids in '+chapter.slug);
  }
});

test('matrix steps follow one output or tile, while single-result comparisons have no step navigation',()=>{
  const matrix=continuationChapters.find(c=>c.slug==='matmul');
  for(const section of matrix.sections){
    const e=section.experiment,r=computeExperiment(e);
    assert.equal(traceLength(e,r),e.focus==='dot'?r.n:r.n/r.tile);
    assert.ok(traceLength(e,r)<r.trace.length);
  }
  const capacity=continuationChapters.find(c=>c.slug==='inference').sections[0].experiment;
  assert.equal(traceLength(capacity,computeExperiment(capacity)),1);
});
