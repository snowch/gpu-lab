// Copyright © 2026 Christopher Snow.
import {codeExplanations} from './code-explanation-data.mjs';
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function annotatedSource(source){return source.split('\n').map((line,i)=>`<span data-code-line="${i}">${escape(line)}</span>`).join('\n');}
function label(fragment){
 if(fragment.endsWith('('))return fragment+'...)';
 if(/^torch\.arange\(1, \d+$/.test(fragment))return fragment+', ...)';
 return fragment;
}
export function explanationList(entries){
 return `<div class="code-explanations"><p class="code-explanation-heading">What each part does</p><p class="code-explanation-hint" hidden>Select an explanation to highlight its code.</p><ul>${entries.map(entry=>`<li><button type="button" data-code-explanation data-code-fragment="${escape(entry.fragment)}" data-lines="${entry.lines.join(',')}" aria-pressed="false" disabled><code>${escape(label(entry.fragment))}</code> — ${escape(entry.meaning)}</button></li>`).join('')}</ul></div>`;
}
// All templates use plain escaped pre/code contents. Keep their attributes and IDs.
export function explainHTML(html){
 return html.replace(/<pre\b([^>]*)>([\s\S]*?)<\/pre>/g,(original,attrs,inner)=>{
  // Documentation questions already supply a task; a walkthrough could give its answer away.
  if(attrs.includes('reference-code')||attrs.includes('data-code-question'))return original;
  const code=inner.match(/^<code\b([^>]*)>([\s\S]*)<\/code>$/);
  const encoded=code?code[2]:inner;
  if(encoded.includes('<'))return original;
  const source=encoded.replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"').replaceAll('&#39;',"'").replaceAll('&amp;','&');
  const entries=codeExplanations(source);
  if(!entries.length)return original;
  const content=annotatedSource(source);
  return `<pre${attrs} data-explained-code>${code?`<code${code[1]}>${content}</code>`:content}</pre>${explanationList(entries)}`;
 });
}
