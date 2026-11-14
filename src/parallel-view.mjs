// Copyright © 2026 Christopher Snow.
import {parallelModels} from './parallel-models.mjs';
import {parallelFigure} from './parallel-figures.mjs';
export const escape=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function resultView(r,step=0){
  const s=r.steps[Math.min(step,r.steps.length-1)];
  const figure=parallelFigure(r,step);
  if(figure)return `<p>${escape(r.summary)}</p>${figure}<p>${escape(r.note)}</p>`;
  return `<p>${escape(r.summary)}</p>${parallelFigure(r,step)}<div class="parallel-table"><table><caption>${escape(s.label)}</caption><thead><tr>${r.columns.map(c=>`<th scope="col">${escape(c)}</th>`).join('')}</tr></thead><tbody><tr>${s.cells.map(c=>`<td>${escape(c)}</td>`).join('')}</tr></tbody></table></div>${s.detail?`<p>${escape(s.detail)}</p>`:''}${r.rows?.length?`<div class="parallel-table"><table><caption>${escape(r.rowCaption||'Completed partial results')}</caption>${r.rowColumns?`<thead><tr>${r.rowColumns.map(c=>`<th scope="col">${escape(c)}</th>`).join('')}</tr></thead>`:''}<tbody>${r.rows.map(row=>`<tr><th scope="row">${escape(row[0])}</th>${row.slice(1).map(c=>`<td>${escape(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:''}<p>${escape(r.note)}</p>`;
}
export function experiment({id,model,controls,defaults}){
 const config=escape(JSON.stringify({model,defaults}));
 return `<div class="parallel-experiment" id="${id}" data-book-experiment="${id}" data-parallel="${config}"><div class="parallel-controls">${controls.map(([key,label,options])=>`<label for="${id}-${key}">${label}<select id="${id}-${key}" data-setting="${key}">${options.map(([v,t])=>`<option value="${v}"${defaults[key]===v?' selected':''}>${t}</option>`).join('')}</select></label>`).join('')}<button type="button" data-run disabled>Run</button></div><p id="${id}-feedback" role="status">Predict the result, then press Run.</p><div data-result hidden></div><div data-steps hidden><button type="button" data-prev>Previous step</button><span data-position></span><button type="button" data-next>Next step</button></div></div>`;
}
export function worked(model,config){const r=parallelModels[model](config);return `<details><summary>Inspect a worked example</summary>${resultView(r,r.steps.length-1)}</details>`;}
