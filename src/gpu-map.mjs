// Copyright © 2026 Christopher Snow.
import './theme.mjs';
import {mapViews,mapConcepts,conceptById,initialMap} from './gpu-map-data.mjs';
import {renderMapDiagram,renderMapDetail} from './gpu-map-view.mjs';
import {registerExperiment} from './experiment-state.mjs';
const root=document.querySelector('#gpu-map'),params=new URLSearchParams(location.search);
let state=initialMap(params.get('chapter'));
const requested=conceptById(params.get('concept'));
if(requested)state={...state,concept:requested.id,view:requested.views.includes(params.get('view'))?params.get('view'):requested.views[0]};
function draw(){
 const concept=conceptById(state.concept);
 document.querySelector('#map-chapter').value=state.chapter;
 for(const button of root.querySelectorAll('[data-map-view]'))button.setAttribute('aria-pressed',String(button.dataset.mapView===state.view));
 for(const button of root.querySelectorAll('[data-palette]')){const c=conceptById(button.dataset.palette),match=Boolean(state.chapter&&c.chapters.includes(state.chapter));button.hidden=!c.views.includes(state.view);button.setAttribute('aria-pressed',String(c.id===state.concept));button.classList.toggle('chapter-match',match);button.querySelector('span').hidden=!match;}
 document.querySelector('#map-detail').innerHTML=renderMapDetail(state.concept);
 document.querySelector('#map-diagram').innerHTML=renderMapDiagram(state.concept);
 const view=mapViews.find(v=>v.id===state.view),visible=mapConcepts.filter(c=>c.views.includes(state.view));
 document.querySelector('#map-status').textContent=`${view.title} · ${visible.length} concepts · Selected: ${concept.title}${state.chapter?` · ${visible.filter(c=>c.chapters.includes(state.chapter)).length} highlighted in this view`:''}`;
 const url=new URL(location);url.searchParams.set('view',state.view);url.searchParams.set('concept',state.concept);if(state.chapter)url.searchParams.set('chapter',state.chapter);else url.searchParams.delete('chapter');history.replaceState(null,'',url);
}
root.addEventListener('click',event=>{
 const button=event.target.closest('[data-concept],[data-map-view]');if(!button)return;event.preventDefault();
 const inDiagram=Boolean(button.closest('#map-diagram'));
 if(button.dataset.concept){const c=conceptById(button.dataset.concept);state.concept=c.id;if(!c.views.includes(state.view))state.view=c.views[0];}
 else{state.view=button.dataset.mapView;const choices=mapConcepts.filter(c=>c.views.includes(state.view));if(!choices.some(c=>c.id===state.concept))state.concept=(choices.find(c=>c.chapters.includes(state.chapter))??choices[0]).id;}
 draw();if(inDiagram)root.querySelector(`[data-palette="${state.concept}"]`).focus({preventScroll:true});
});
document.querySelector('#map-chapter').addEventListener('change',event=>{state=initialMap(event.target.value);draw();});
document.querySelector('#map-glossary').open=false;
const origin=params.get('from'),validPages=new Set(['index','desktop','memory','kernel','shared-memory',...mapConcepts.flatMap(c=>c.chapters)]);
if(validPages.has(origin)){const back=document.querySelector('#map-return');back.href=origin==='index'?'../index.html':origin+'.html';back.textContent='Return to where you were reading';back.addEventListener('click',event=>{if(window.opener&&!window.opener.closed){event.preventDefault();window.opener.focus();window.close();}});}
registerExperiment('gpu-map',()=>({...state}),saved=>{if(conceptById(saved.concept)&&mapViews.some(v=>v.id===saved.view)){state={...saved,chapter:initialMap(saved.chapter).chapter};draw();}});
root.hidden=false;draw();
