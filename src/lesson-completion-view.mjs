// Copyright © 2026 Christopher Snow.
import {lessonIds} from './lesson-completion-store.mjs';
export const canComplete=id=>lessonIds.includes(id);
export const completionAttribute=id=>canComplete(id)?` data-completion-lesson="${id}"`:'';
export function completionIndicator(id){
  return canComplete(id)?'<span class="lesson-done-tick" aria-hidden="true" hidden>✓</span><span class="completion-sr" data-done-label hidden> — done</span>':'';
}
export function renderLessonCompletion(id){
  if(!canComplete(id))return '';
  return `<div class="lesson-completion" hidden><label for="lesson-complete"><input type="checkbox" id="lesson-complete" data-completion-lesson="${id}" data-lesson-completion aria-describedby="lesson-completion-note"><span>Mark lesson as done</span></label><p id="lesson-completion-note" role="status">Marks are saved in this browser.</p></div>`;
}
export function renderLessonForward(id,link){
  return canComplete(id)?`<div class="lesson-forward">${renderLessonCompletion(id)}${link}</div>`:link;
}
