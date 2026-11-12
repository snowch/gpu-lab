// Copyright © 2026 Christopher Snow.
import {chapters} from './book-chapters.mjs';
export const lessonIds=[...chapters.filter(chapter=>chapter.opening).map(chapter=>chapter.slug),'kernel','shared-memory','memory'];
export const completionPrefix='gpu-lab:v1:manual-completion:';
export const completionKey=id=>completionPrefix+id;

// One key per lesson prevents a stale tab from overwriting another lesson’s mark.
export class LessonCompletionStore {
  constructor(storage,ids=lessonIds) {
    this.storage=storage;this.ids=new Set(ids);this.completed=new Set();this.unsaved=new Set();this.durable=new Map();
    this.refresh();
  }
  isDone(id){return this.completed.has(id);}
  refresh(id=null,external=false) {
    for(const current of id===null?this.ids:[id]) {
      if(!this.ids.has(current)||(!external&&this.unsaved.has(current)))continue;
      try {
        if(!this.storage)continue;
        const done=this.storage.getItem(completionKey(current))==='true';
        this.durable.set(current,done);this.unsaved.delete(current);
        if(done)this.completed.add(current);else this.completed.delete(current);
      } catch { /* Keep the tab’s current marks when storage cannot be read. */ }
    }
  }
  set(id,done) {
    if(!this.ids.has(id)||typeof done!=='boolean')return false;
    if(done)this.completed.add(id);else this.completed.delete(id);
    try {
      if(!this.storage)throw new Error('Storage unavailable');
      this.storage.setItem(completionKey(id),String(done));
      if((this.storage.getItem(completionKey(id))==='true')!==done)throw new Error('Mark not saved');
      this.durable.set(id,done);
    } catch {
      // A different tab may have saved a newer value since our initial read.
      try {if(this.storage)this.durable.set(id,this.storage.getItem(completionKey(id))==='true');} catch {}
    }
    if(done===(this.durable.get(id)??false))this.unsaved.delete(id);else this.unsaved.add(id);
    return !this.unsaved.has(id);
  }
}
