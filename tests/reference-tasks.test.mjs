// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {guides,referenceTasks,renderReferenceTask} from '../src/reference-tasks.mjs';
import {lessons,renderLesson} from '../content/lessons.mjs';
import {pythonSource} from '../src/hello-model.mjs';
import {renderIntroSections} from '../src/hello-view.mjs';

test('reference practice covers the course and progresses to independent lookups',()=>{
  for(const key of ['hello-pytorch','hello-indices','devices','reading','kernel','memory',...lessons.map(l=>l.slug)]){
    const task=referenceTasks[key];assert.ok(task,key);
    for(const target of [task.page,task.solution].filter(Boolean)) {
      const url=new URL(guides[target]);
      assert.equal(url.protocol,'https:');
      assert.ok(['docs.pytorch.org','docs.nvidia.com'].includes(url.hostname));
      assert.ok(!url.pathname.includes('/cuda-c-programming-guide/'),'Do not send readers through obsolete guide redirects');
    }
    const html=renderReferenceTask(key);
    assert.match(html,/target="_blank" rel="noopener noreferrer"/);
    assert.match(html,/<summary>Compare your answer<\/summary>/);
    assert.match(html,/comparison works offline/);
    if(task.independent){
      assert.ok(!new URL(guides[task.page]).hash,'Start independent tasks at a guide, not its answer');
      assert.match(html,/Open the relevant section/);
    }
  }
  for(const key of ['reduction','matmul','tensor-cores','attention','inference']) assert.equal(referenceTasks[key].independent,true);
  assert.throws(()=>renderReferenceTask('missing'));
  assert.equal(referenceTasks['hello-pytorch'].code,pythonSource());
  const intro=renderIntroSections();
  assert.match(intro,/reference-hello-pytorch/);assert.match(intro,/reference-hello-indices/);
  lessons.forEach((lesson,i)=>assert.match(renderLesson(lesson,i),new RegExp('id="reference-'+lesson.slug+'"')));
});
