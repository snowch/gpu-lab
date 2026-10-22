// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderConcepts, warpConcepts } from '../src/concepts.mjs';
import { conceptsByLesson } from '../content/concept-definitions.mjs';
import { lessons, renderLesson } from '../content/lessons.mjs';

test('concept notes use semantic definitions and safely escape plain text', () => {
  assert.equal(renderConcepts({id:'empty',terms:[]}), '');
  const result = renderConcepts({id:'unit',terms:[{term:'<term>',definition:'a & "b"'}]});
  assert.match(result, /<section class="concepts" aria-labelledby="unit-concepts-heading">/);
  assert.match(result, /<dl class="concepts-list">/);
  assert.match(result, /<dt>&lt;term&gt;<\/dt>/);
  assert.match(result, /<dd>a &amp; &quot;b&quot;<\/dd>/);
  assert.doesNotMatch(result, /<dt><term>/);
  assert.throws(() => renderConcepts({id:'INVALID',terms:warpConcepts}), /id/);
  assert.throws(() => renderConcepts({id:'duplicate',terms:[warpConcepts[0],warpConcepts[0]]}), /Duplicate/);
});

test('first warp explanation gives 32 clearly labelled lanes without interaction', () => {
  const html = renderConcepts({id:'memory',terms:warpConcepts,warpDiagram:true});
  for (const term of ['Kernel','Thread','Warp','Lane']) assert.ok(html.includes('<dt>'+term+'</dt>'));
  const lanes = [...html.matchAll(/<span aria-hidden="true" class="concepts-lane">(\d+)<\/span>/g)].map(m=>Number(m[1]));
  assert.deepEqual(lanes,Array.from({length:32},(_,i)=>i));
  assert.match(html,/not a separate hardware group/);
  assert.match(html,/Some lanes may be inactive/);
  assert.doesNotMatch(html, /<button|<script/);
});

test('generated lessons put selected new terms before the worked example', () => {
  const ids = new Set();
  for (let i=0;i<lessons.length;i++) {
    const lesson=lessons[i];
    const terms=conceptsByLesson[lesson.slug];
    assert.ok(terms?.length >= 2,lesson.slug+' is missing curated terms');
    const html=renderLesson(lesson,i);
    const sectionId=lesson.slug+'-concepts-heading';
    assert.ok(!ids.has(sectionId)); ids.add(sectionId);
    assert.equal(html.split('id="'+sectionId+'"').length-1,1,lesson.slug);
    assert.ok(html.includes('class="concepts"'),lesson.slug);
    assert.ok(html.indexOf('class="concepts"') < html.indexOf('class="worked-example"'),lesson.slug);
    assert.doesNotMatch(html,/<!-- NEW_CONCEPTS -->/);
    for (const term of terms) assert.ok(html.includes('<dt>'+term.term+'</dt>'),lesson.slug+' '+term.term);
  }
});
