// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {LessonCompletionStore,lessonIds,completionKey} from '../src/lesson-completion-store.mjs';
import {renderLessonCompletion,renderLessonForward} from '../src/lesson-completion-view.mjs';
import {renderBookNav,renderRoadmap} from '../content/book.mjs';
const storage=()=>{const data=new Map();return {data,getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};};

test('manual marks survive reopening and stale tabs do not overwrite other lessons',()=>{
  const saved=storage(),a=new LessonCompletionStore(saved),b=new LessonCompletionStore(saved);
  assert.equal(a.set('hello',true),true);
  assert.equal(b.set('devices',true),true);
  const reopened=new LessonCompletionStore(saved);
  assert.ok(reopened.isDone('hello'));assert.ok(reopened.isDone('devices'));
  a.refresh('devices',true);assert.ok(a.isDone('devices'));
  b.set('hello',false);a.refresh('hello',true);assert.equal(a.isDone('hello'),false);
  assert.equal(saved.data.get(completionKey('devices')),'true');
  assert.equal(a.set('meet-gpu',true),false);
  assert.equal(a.set('hello','true'),false);
});

test('blocked storage keeps a visible unsaved choice and supports undo to durable state',()=>{
  const saved=storage(),store=new LessonCompletionStore(saved);
  saved.setItem=()=>{throw new Error('Storage denied');};
  assert.equal(store.set('hello',true),false);assert.ok(store.isDone('hello'));assert.ok(store.unsaved.has('hello'));
  store.refresh();assert.ok(store.isDone('hello'));
  assert.equal(store.set('hello',false),true);assert.equal(store.unsaved.size,0);
  saved.data.set(completionKey('hello'),'true');
  assert.equal(store.set('hello',false),false);assert.ok(store.unsaved.has('hello'));
  store.refresh('hello',true);assert.ok(store.isDone('hello'));assert.equal(store.unsaved.size,0);
  const memoryOnly=new LessonCompletionStore(null);
  assert.equal(memoryOnly.set('hello',true),false);assert.ok(memoryOnly.isDone('hello'));
  memoryOnly.set('hello',false);assert.equal(memoryOnly.unsaved.size,0);
});

test('unknown and malformed marks cannot complete a lesson',()=>{
  const saved=storage();saved.data.set(completionKey('hello'),'[true]');saved.data.set(completionKey('unknown'),'true');
  const store=new LessonCompletionStore(saved);
  assert.equal(store.completed.size,0);
  assert.equal(store.set('unknown',true),false);
  assert.equal(saved.data.get(completionKey('unknown')),'true');
});

test('lessons expose native manual marks beside next links and both contents lists expose indicators',()=>{
  const next='<a href="next.html">Next</a>';
  for(const id of lessonIds){
    const html=renderLessonForward(id,next);
    assert.match(html,/type="checkbox"/);assert.ok(html.indexOf('lesson-complete')<html.indexOf(next));
    assert.match(html,new RegExp(`data-completion-lesson="${id}"`));
  }
  assert.equal(renderLessonCompletion('desktop'),'');
  assert.equal(renderLessonCompletion('meet-gpu'),'');
  assert.equal(renderLessonForward('desktop',next),next);
  const nav=renderBookNav(),overview=renderRoadmap();
  for(const id of lessonIds.filter(id=>!['memory','kernel','shared-memory','launch-from-input'].includes(id))){
    assert.ok(nav.includes(`data-completion-lesson="${id}"`));
    assert.ok(overview.includes(`data-completion-lesson="${id}"`));
  }
});
