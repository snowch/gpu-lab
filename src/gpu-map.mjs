// Copyright © 2026 Christopher Snow.
import './theme.mjs';
import {conceptById,initialMap,mapConcepts} from './gpu-map-data.mjs';
import {registerExperiment} from './experiment-state.mjs';
const root=document.querySelector('#gpu-map');
const $=s=>root.querySelector(s);
const params=new URLSearchParams(location.search);
if(params.get('embedded')==='1'&&window.parent!==window)document.documentElement.classList.add('map-embedded');
const panels=['hardware','operation'];
const nodes=[...root.querySelectorAll('.map-node')];
let active=panels.includes(params.get('view'))?params.get('view'):params.get('view')==='ai'?'operation':'hardware';
let chapter=initialMap(params.get('chapter')).chapter;
let recent=[];
let queued=false;
const panel=()=>$(`#${active}-panel`);
const visible=node=>node.open&&!node.closest('.map-panel').hidden&&!node.parentElement.closest('details:not([open])');
function openPath(node){
 for(let el=node;el&&el!==root;el=el.parentElement)if(el.matches('details'))el.open=true;
 recent=recent.filter(id=>id!==node.id);recent.push(node.id);
}
function highlight(){
 $('#map-chapter').value=chapter;
 for(const node of nodes){
  const own=Boolean(chapter&&conceptById(node.dataset.mapConcept)?.chapters.includes(chapter));
  const below=Boolean(chapter&&[...node.querySelectorAll('[data-map-concept]')].some(child=>conceptById(child.dataset.mapConcept)?.chapters.includes(chapter)));
  node.classList.toggle('map-highlight',own);
  const badge=node.querySelector(':scope > summary .map-match');
  badge.hidden=!own&&!below;badge.textContent=own?'In highlighted chapter':'Related concepts inside';
 }
}
function sync(){
 for(const name of panels)$(`#${name}-panel`).hidden=name!==active;
 for(const link of root.querySelectorAll('[data-map-view]'))link.setAttribute('aria-current',link.dataset.mapView===active?'true':'false');
 const last=recent.map(id=>document.getElementById(id)).filter(node=>node&&visible(node)).at(-1);
 const chain=[];
 for(let el=last;el&&el!==root;el=el.parentElement)if(el.matches('.map-node'))chain.unshift(el.querySelector(':scope > summary strong').textContent);
 $('#map-back').disabled=!last;
 $('#map-status').textContent=chain.length?`You are looking at ${chain.join(' › ')}`:active==='hardware'?'You are looking at the whole system':'You are looking at one tensor operation';
 const url=new URL(location);
 url.searchParams.set('view',active);url.searchParams.delete('concept');
 const opened=nodes.filter(n=>n.open).map(n=>n.id);
 if(opened.length)url.searchParams.set('open',opened.join(','));else url.searchParams.delete('open');
 if(chapter)url.searchParams.set('chapter',chapter);else url.searchParams.delete('chapter');
 history.replaceState(null,'',url);
}
function scheduleSync(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;sync();});}
// The disclosures are already rendered. JavaScript only adds navigation and persistence.
for(const control of root.querySelectorAll('.map-enhancement'))control.hidden=false;
for(const id of (params.get('open')??'').split(',')){
 const node=nodes.find(n=>n.id===id);if(node)openPath(node);
}
// Preserve links from the previous map's concept/view URLs.
const legacy=conceptById(params.get('concept'));
if(legacy){
 const target=nodes.find(n=>n.dataset.mapConcept===legacy.id);
 if(target){active=target.closest('.map-panel').id.replace('-panel','');openPath(target);}
}
// Persist a user toggle synchronously, before a quick reload or copied URL.
// Native details remain the fallback when scripts are unavailable.
root.addEventListener('click',event=>{
 const summary=event.target.closest('.map-node > summary');
 if(!summary)return;
 event.preventDefault();const node=summary.parentElement;
 node.open=!node.open;
 recent=recent.filter(id=>id!==node.id);
 if(node.open)recent.push(node.id);
 else for(const child of node.querySelectorAll('details[open]'))child.open=false;
 sync();
});
root.addEventListener('toggle',event=>{
 const node=event.target;if(!node.matches('.map-node'))return;
 recent=recent.filter(id=>id!==node.id);
 if(node.open)recent.push(node.id);
 else for(const child of node.querySelectorAll('details[open]'))child.open=false;
 scheduleSync();
},true);
for(const link of root.querySelectorAll('[data-map-view]'))link.addEventListener('click',event=>{
 event.preventDefault();active=link.dataset.mapView;sync();
});
$('#map-chapter').addEventListener('change',event=>{chapter=initialMap(event.target.value).chapter;highlight();sync();});
$('#map-back').addEventListener('click',()=>{
 const node=recent.map(id=>document.getElementById(id)).filter(n=>n&&visible(n)).at(-1);
 if(!node)return;
 for(const child of node.querySelectorAll('details[open]'))child.open=false;
 node.open=false;node.querySelector('summary').focus({preventScroll:true});sync();
});
$('#map-reset').addEventListener('click',()=>{
 for(const node of panel().querySelectorAll('details[open]'))node.open=false;
 sync();
});
// Hash links in the text reference reveal their destination before browser scrolling.
function revealHash(){
 const target=document.getElementById(location.hash.slice(1));
 if(!target||!root.contains(target))return;
 if(target.closest('#map-glossary')){
  for(let el=target;el&&el!==root;el=el.parentElement)if(el.matches('details'))el.open=true;
  target.scrollIntoView();
 }
}
addEventListener('hashchange',revealHash);
const origin=params.get('from');
const validPages=new Set(['index','desktop','memory','kernel','shared-memory',...mapConcepts.flatMap(c=>c.chapters)]);
if(validPages.has(origin)){
 const back=$('#map-return');back.href=origin==='index'?'../index.html':origin+'.html';back.textContent='Return to where you were reading';
 const close=document.querySelector('.top-actions .gpu-map-link');if(close)close.href=back.href;
 back.addEventListener('click',event=>{if(window.opener&&!window.opener.closed){event.preventDefault();window.opener.focus();window.close();}});
}
registerExperiment('gpu-map',()=>({view:active,chapter,open:nodes.filter(n=>n.open).map(n=>n.id),recent}),saved=>{
 if(panels.includes(saved.view))active=saved.view;
 chapter=initialMap(saved.chapter).chapter;
 for(const node of nodes)node.open=false;
 for(const id of Array.isArray(saved.open)?saved.open:[]){const node=nodes.find(n=>n.id===id);if(node)openPath(node);}
 if(saved.concept){const target=nodes.find(n=>n.dataset.mapConcept===saved.concept);if(target){active=target.closest('.map-panel').id.replace('-panel','');openPath(target);}}
 recent=Array.isArray(saved.recent)?saved.recent.filter(id=>nodes.some(n=>n.id===id)):recent;
 highlight();sync();
});
highlight();sync();revealHash();
