// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {guides,referenceTasks,renderReferenceTask,chapterReferences,renderChapterReferences} from '../src/reference-tasks.mjs';
import {lessons,renderLesson} from '../content/lessons.mjs';
import {chapters} from '../content/book.mjs';
import {pythonSource} from '../src/hello-model.mjs';

test('reference exercises use official guides and retain local answer comparisons',()=>{
  for(const [key,task] of Object.entries(referenceTasks)){
    for(const target of [task.page,task.solution].filter(Boolean)) {
      const url=new URL(guides[target]);
      assert.equal(url.protocol,'https:');
      assert.ok(['docs.pytorch.org','docs.nvidia.com','github.com','pytorch.org'].includes(url.hostname));
      assert.ok(!url.pathname.includes('/cuda-c-programming-guide/'));
    }
    const html=renderReferenceTask(key);
    assert.match(html,/target="_blank" rel="noopener noreferrer"/);
    assert.match(html,/<summary>Compare your answer<\/summary>/);
    assert.match(html,/comparison works offline/);
    if(task.independent){
      assert.ok(!new URL(guides[task.page]).hash);
      assert.match(html,/Open the relevant section/);
    }
  }
  for(const key of ['reduction','matmul','tensor-cores','attention','inference']) assert.equal(referenceTasks[key].independent,true);
  assert.throws(()=>renderReferenceTask('missing'));
  assert.equal(referenceTasks['hello-pytorch'].code,pythonSource());
});
test('every published chapter and lab has annotated references before two or more exercises',()=>{
  const pages=new Set([...chapters.filter(c=>c.opening).map(c=>c.slug),...lessons.map(l=>l.slug),'memory','kernel','desktop']);
  assert.deepEqual(new Set(Object.keys(chapterReferences)),pages);
  for(const slug of pages){
    const entry=chapterReferences[slug],html=renderChapterReferences(slug);
    assert.ok(entry.sources.length>=2&&entry.sources.length<=3,slug);
    assert.ok(entry.tasks.length>=2,slug);
    for(const [key,label,description] of [...entry.sources,...(entry.optional??[])]){
      assert.ok(guides[key]&&label&&description,slug);
    }
    const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
    assert.equal(ids.length,new Set(ids).size,slug);
    assert.ok(html.indexOf('>References</h2>')<html.indexOf('>Use the documentation</h2>'));
    assert.ok(html.indexOf('>Use the documentation</h2>')<html.indexOf('class="reference-task"'));
    assert.doesNotMatch(html,/href="undefined"/);
  }
  assert.throws(()=>renderChapterReferences('missing'));
  const hello=renderChapterReferences('hello');
  assert.match(hello,/not a CUDA API/);
  assert.match(hello,/not code generated from this expression/);
  lessons.forEach((lesson,i)=>{
    const html=renderLesson(lesson,i);
    assert.match(html,new RegExp('id="reference-'+lesson.slug+'"'));
    assert.ok(html.indexOf('>References</h2>')>html.indexOf('>Change one thing. Explain the result.</h2>'));
  });
});
