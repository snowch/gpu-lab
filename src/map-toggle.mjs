// Copyright © 2026 Christopher Snow.
import {registerExperiment} from './experiment-state.mjs';
const link=document.querySelector('.gpu-map-link');
const standalone=document.body.classList.contains('gpu-map-page');
if(link&&!standalone){
 const toggle=document.createElement('button');
 toggle.type='button';toggle.className='gpu-map-link';toggle.textContent='GPU map';
 toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','gpu-map-panel');
 const mapURL=new URL(link.href);mapURL.searchParams.set('embedded','1');
 link.replaceWith(toggle);
 const reading=document.querySelector('.layout');
 const panel=document.createElement('section');panel.id='gpu-map-panel';panel.hidden=true;panel.setAttribute('aria-label','GPU map');
 const status=document.createElement('p');status.setAttribute('role','status');status.className='map-loading';
 const frame=document.createElement('iframe');frame.title='GPU map';frame.id='gpu-map-frame';
 panel.append(status,frame);reading.after(panel);
 let opened=false,ready=false,position=[0,0],pendingURL=mapURL.href;
 const resize=()=>panel.style.setProperty('--map-header-height',document.querySelector('.topbar').getBoundingClientRect().height+'px');
 new ResizeObserver(resize).observe(document.querySelector('.topbar'));
 function theme(){if(ready)frame.contentDocument.documentElement.dataset.theme=document.documentElement.dataset.theme;}
 new MutationObserver(theme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 function close(){
  if(!opened)return;
  opened=false;panel.hidden=true;reading.hidden=false;reading.inert=false;
  document.body.classList.remove('map-is-open');
  toggle.textContent='GPU map';toggle.setAttribute('aria-expanded','false');
  window.scrollTo({left:position[0],top:position[1],behavior:'instant'});
  toggle.focus({preventScroll:true});
 }
 function open(saved){
  if(opened)return;
  position=saved?.position??[scrollX,scrollY];opened=true;
  if(!frame.hasAttribute('src')){
   const url=new URL(saved?.url??pendingURL,location);
   // A restored frame may only load this book's map.
   frame.src=url.origin===mapURL.origin&&url.pathname===mapURL.pathname?url.href:mapURL.href;
   status.textContent='Loading GPU map…';
  }
  reading.hidden=true;reading.inert=true;panel.hidden=false;
  document.body.classList.add('map-is-open');
  toggle.textContent='Close map';toggle.setAttribute('aria-expanded','true');resize();
  if(ready)frame.contentWindow.focus();
 }
 frame.addEventListener('load',()=>{
  const doc=frame.contentDocument;
  ready=Boolean(doc?.querySelector('#gpu-map'));
  status.textContent=ready?'':'The map could not load. Close it and try again.';
  status.hidden=ready;
  if(!ready){frame.removeAttribute('src');return;}
  doc.documentElement.classList.add('map-embedded');theme();
  doc.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close();}});
  doc.addEventListener('click',event=>{
   const a=event.target.closest('a');if(!a||event.defaultPrevented)return;
   const url=new URL(a.href);
   if(a.target==='_blank'||a.hasAttribute('download')||url.origin!==location.origin||!url.pathname.endsWith('.html')||url.pathname===mapURL.pathname)return;
   event.preventDefault();
   if(url.pathname===location.pathname)close();else location.assign(url.href);
  });
  if(opened)frame.contentWindow.focus();
 });
 toggle.addEventListener('click',()=>opened?close():open());
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&opened&&!document.querySelector('dialog[open]')){event.preventDefault();close();}});
 addEventListener('gpu-lab:before-restart',event=>{if(frame.hasAttribute('src')&&!ready)event.detail.reason='Wait for the GPU map to finish loading, then retry the update.';});
 registerExperiment('map-toggle',()=>({open:opened,position,url:ready?frame.contentWindow.location.href:mapURL.href}),saved=>{pendingURL=saved.url??mapURL.href;if(saved.open)open(saved);});
}
