// Copyright © 2026 Christopher Snow.
import {LessonCompletionStore,completionPrefix} from './lesson-completion-store.mjs';
let storage;
try {storage=localStorage;} catch { /* Manual marks still work for this tab. */ }
const store=new LessonCompletionStore(storage);
const links=[...document.querySelectorAll('a[data-completion-lesson]')];
const input=document.querySelector('[data-lesson-completion]');
const note=document.getElementById('lesson-completion-note');
function render(){
  for(const link of links) {
    const done=store.isDone(link.dataset.completionLesson);
    link.dataset.done=String(done);
    link.querySelector('.lesson-done-tick').hidden=!done;
    link.querySelector('[data-done-label]').hidden=!done;
  }
  if(input){
    input.checked=store.isDone(input.dataset.completionLesson);
    input.closest('.lesson-completion').dataset.done=String(input.checked);
    note.textContent=store.unsaved.has(input.dataset.completionLesson)
      ?'This mark could not be saved. It will be lost when you reload or close this tab.'
      :'Marks are saved in this browser.';
  }
}
if(input){
  input.closest('.lesson-completion').hidden=false;
  input.addEventListener('change',()=>{store.set(input.dataset.completionLesson,input.checked);render();});
}
addEventListener('storage',event=>{
  try {if(event.storageArea&&event.storageArea!==localStorage)return;} catch {return;}
  if(event.key!=null&&!event.key.startsWith(completionPrefix))return;
  store.refresh(event.key==null?null:event.key.slice(completionPrefix.length),true);render();
});
addEventListener('pageshow',()=>{store.refresh();render();});
addEventListener('gpu-lab:before-restart',event=>{
  if(store.unsaved.size)event.detail.reason='This tab has an unsaved lesson mark. Allow browser storage or undo that mark before updating.';
});
render();
