// Copyright © 2026 Christopher Snow.
import {saveReadingState} from './experiment-state.mjs';
import {readingReturn} from './reading-return.mjs';
for(const back of document.querySelectorAll('[data-reading-return]')){
  const target=readingReturn(location.href);
  if(target){back.href=target.href;back.textContent=target.label;}
}
document.addEventListener('click',event=>{
  const link=event.target.closest('a');
  if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const url=new URL(link.href,location);
  // In-page navigation keeps the existing return destination and live state.
  if(url.pathname===location.pathname&&url.search===location.search&&url.hash)return;
  const appendix=['inside-sm','reduction-video','matmul-video','devices-video','reading-video'].some(slug=>url.pathname.endsWith('/'+slug+'.html'));
  if(url.origin!==location.origin||(!appendix&&!link.matches('[data-reading-link]'))||window.frameElement)return;
  event.preventDefault();
  try{
    saveReadingState();
    if(appendix){
      url.searchParams.set('return',location.pathname+location.search+location.hash);
      url.searchParams.set('from',location.pathname.split('/').at(-1)?.replace('.html','')||'index');
    }
    location.assign(url.href);
  }catch(error){
    let status=document.getElementById('reading-link-status');
    if(!status){status=document.createElement('p');status.id='reading-link-status';status.setAttribute('role','alert');link.after(status);}
    status.textContent='Your reading state could not be saved. '+error.message;
  }
});
