// Copyright © 2026 Christopher Snow.
import {pythonProgram} from './desktop-program.mjs';
const enable=()=>document.querySelectorAll('[data-download-python]').forEach(button=>button.disabled=false);
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-download-python]');
  if(!button)return;
  const panel=button.closest('.chapter-code-panel'),source=panel.querySelector('code').textContent;
  const blob=new Blob([pythonProgram(source)],{type:'text/x-python'}),url=URL.createObjectURL(blob);
  const link=document.createElement('a');link.href=url;link.download='gpu-lab-example.py';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  panel.querySelector('[data-download-status]').textContent='Downloaded with --device cpu (default) or --device cuda. See the desktop appendix for setup.';
});
enable();
new MutationObserver(enable).observe(document.querySelector('main'),{childList:true,subtree:true});
