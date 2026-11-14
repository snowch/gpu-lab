import {parallelChapters} from './parallel-chapters.mjs';
// Copyright © 2026 Christopher Snow.
import {chapters} from './book-chapters.mjs';
const appendices={desktop:'the desktop appendix',profiling:'the profiling appendix','meet-gpu':'the GPU map',kernel:'the kernel workshop','shared-memory':'the shared-memory lab',memory:'the memory explorer',index:'the book contents'};
export function readingReturn(pageURL){
  const page=new URL(pageURL),from=page.searchParams.get('from');
  const chapter=chapters.findIndex(c=>c.slug===from)+1 || parallelChapters.find(c=>c.slug===from)?.number || 0;
  if(!chapter&&!Object.hasOwn(appendices,from))return null;
  const fallback=new URL(from==='index'?'../index.html':from+'.html',page);
  if(from==='hello')fallback.hash='hello-sm-title';
  if(from==='scheduling')fallback.hash='sm-hardware-basics';
  const label=chapter?`Return to Chapter ${chapter}`:`Return to ${appendices[from]}`;
  const result=href=>({href,chapter:chapter||null,label});
  const raw=page.searchParams.get('return');
  if(raw){
    try{
      const url=new URL(raw,page),indexPath=new URL('../',page).pathname;
      if(url.origin===page.origin&&(url.pathname===fallback.pathname||(from==='index'&&url.pathname===indexPath)))return result(url.href);
    }catch{/* Use the local book link. */}
  }
  return result(fallback.href);
}
