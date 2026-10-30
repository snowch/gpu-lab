// Copyright © 2026 Christopher Snow.
import {codeExplanations} from './code-explanation-data.mjs';
import {annotatedSource,explanationList} from './code-explanations-view.mjs';
const seen=new WeakMap();
function refresh(pre){
 if(pre.matches('.reference-code,[data-code-question]'))return;
 const source=pre.textContent;
 if(seen.get(pre)===source)return;
 seen.set(pre,source);
 const entries=codeExplanations(source);
 let list=pre.nextElementSibling?.matches('.code-explanations')?pre.nextElementSibling:null;
 if(!entries.length){list?.remove();return;}
 (pre.querySelector('code')||pre).innerHTML=annotatedSource(source);
 pre.setAttribute('data-explained-code','');
 if(list)list.outerHTML=explanationList(entries);
 else pre.insertAdjacentHTML('afterend',explanationList(entries));
 list=pre.nextElementSibling;
 list.querySelector('.code-explanation-hint').hidden=false;
 list.querySelectorAll('button').forEach(button=>button.disabled=false);
}
const main=document.querySelector('main');
main?.querySelectorAll('pre').forEach(refresh);
function select(button){
 const list=button.closest('.code-explanations'),pre=list.previousElementSibling;
 const lines=button.dataset.lines.split(',');
 pre.querySelectorAll('[data-code-line]').forEach(line=>line.classList.toggle('is-code-highlighted',lines.includes(line.dataset.codeLine)));
 list.querySelectorAll('[data-code-explanation]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
}
document.addEventListener('click',event=>{const button=event.target.closest('[data-code-explanation]');if(button)select(button);});
document.addEventListener('focusin',event=>{if(event.target.matches('[data-code-explanation]'))select(event.target);});
if(main)new MutationObserver(records=>{
 const pending=new Set();
 for(const record of records){
  const target=record.target.nodeType===1?record.target:record.target.parentElement;
  const pre=target?.closest('pre');if(pre)pending.add(pre);
  for(const node of record.addedNodes)if(node.nodeType===1){if(node.matches('pre'))pending.add(node);node.querySelectorAll('pre').forEach(pre=>pending.add(pre));}
 }
 pending.forEach(pre=>{if(pre.isConnected)refresh(pre);});
}).observe(main,{childList:true,subtree:true,characterData:true});
