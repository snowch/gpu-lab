// Copyright © 2026 Christopher Snow.
import {mkdir,writeFile} from 'node:fs/promises';
import {escape} from '../src/continuation-ui.mjs';
export const value=n=>n.toFixed(1).replace('-','−');
export const label=(x,y,body,kind='body')=>`<text class="${kind}" x="${x}" y="${y}">${escape(body)}</text>`;
export function valuesRow(values,x,y,width=286){
 const cols=values.length>5?4:values.length,cell=width/cols;
 return values.map((v,i)=>`<rect class="cell" x="${x+(i%cols)*cell}" y="${y+Math.floor(i/cols)*36}" width="${cell-4}" height="32" rx="4"/>${label(x+(i%cols)*cell+(cell-4)/2,y+Math.floor(i/cols)*36+23,value(v),'number')}`).join('');
}
export function recordingDeck({chapter,title,scenes,figure,scope}){
 return `<!doctype html><html lang="en-GB"><meta charset="utf-8"><link rel="icon" href="data:,"><title>${escape(title)} · GPU Lab</title><style>
 @font-face{font-family:Plex;src:url('../../assets/fonts/plex-sans.woff2')}*{box-sizing:border-box}body{margin:0;font-family:Plex,Arial,sans-serif;color:#183d3d;background:#f7faf7}.slide{width:1280px;height:720px;padding:35px 48px 24px;break-after:page;position:relative;overflow:hidden}.mast{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #cbded5;padding-bottom:17px;font-size:14px;color:#53736e}.brand{font-weight:700;color:#185f51;font-size:22px}.main{display:grid;grid-template-columns:342px 1fr;gap:32px;padding-top:32px}.eyebrow{font-size:13px;font-weight:600;letter-spacing:1.3px;text-transform:uppercase;color:#297765;margin:0 0 18px}h1{font-size:39px;line-height:1.12;margin:0 0 24px;font-weight:600;letter-spacing:-1px}.lead{font-size:23px;line-height:1.45;margin:0}.note{font-size:17px;line-height:1.5;border-left:3px solid #a6cbb9;padding-left:15px;margin-top:30px;color:#40685e}.figure{border:1px solid #cbded5;border-radius:16px;background:#edf5ef;padding:12px 8px;height:568px}svg{width:100%;height:100%}svg text{text-anchor:middle;fill:#183d3d;font-family:Plex,Arial,sans-serif}.panel{fill:#fff;stroke:#c7d9cf}.cell{fill:#e5f3ec;stroke:#c7d9cf}.empty{fill:none;stroke:#b0c7bd;stroke-dasharray:5 4}.heading{font-size:23px;font-weight:600}.body{font-size:21px}.caption{font-size:17px;fill:#40685e}.number{font-size:22px;font-weight:500}.equation{font-size:30px;font-weight:600}.code{font-size:21px}.arrow{fill:none;stroke:#328774;stroke-width:3}.active{fill:#d3ebdf;stroke:#328774;stroke-width:2}.coordinate{font-size:15px;fill:#53736e}.footer{position:absolute;bottom:17px;left:48px;right:48px;display:flex;justify-content:space-between;font-size:12px;color:#53736e}@page{size:1280px 720px;margin:0}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.slide:last-child{break-after:auto}}
 </style>${scenes.map((s,i)=>`<section class="slide" id="${s.id}"><header class="mast"><span class="brand">▦ GPU Lab</span><span>CHAPTER ${chapter} · NARRATED RECAP</span></header><div class="main"><div><p class="eyebrow">${i+1} / ${scenes.length}</p><h1>${escape(s.title)}</h1><p class="lead">${escape(s.lead)}</p><p class="note">${escape(s.note||scope)}</p></div><div class="figure"><svg viewBox="0 0 720 550" role="img" aria-label="${escape(s.lead)}"><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="#328774"/></marker></defs>${figure(s.stage)}</svg></div></div><footer class="footer"><span>${escape(scope)}</span><span>Copyright © 2026 Christopher Snow</span></footer></section>`).join('')}</html>`;
}
export async function writeRecordingDeck(output,deck,scenes){
 await mkdir(output,{recursive:true});await writeFile(`${output}/deck.html`,deck);
 await writeFile(`${output}/scenes.json`,JSON.stringify(scenes.flatMap(s=>s.captions.map((text,i)=>{
  const say=text.replace(/\bcuda\b/gi,'[CUDA](/ˈkuːdə/)');
  return {id:`${s.id}-c${i+1}`,step:s.title,text,...(say!==text?{say}:{})};
 })),null,2));
 console.log(`Rendered ${scenes.length} slides in ${output}`);
}
