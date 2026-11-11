// Copyright © 2026 Christopher Snow.
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {tiledMatmul} from '../src/ai-models.mjs';
import {escape} from '../src/continuation-ui.mjs';
import scenes from '../content/matmul-scenes.json' with {type:'json'};

const configs={baseline:{n:4,tile:1},shared:{n:4,tile:2},wide:{n:4,tile:4},eight:{n:8,tile:4}};
export const matmulRecordingData=Object.fromEntries(Object.entries(configs).map(([name,config])=>[name,tiledMatmul(config)]));
const r=matmulRecordingData.shared,first=r.trace[0],second=r.trace[1];
const fmt=n=>n.toFixed(1).replace('-','−');
const partial=step=>Array.from({length:r.tile},(_,row)=>Array.from({length:r.tile},(_,col)=>step.cCells.find(c=>c[0]===row&&c[1]===col)[2]));
const inputs=(matrix,step,kind)=>Array.from({length:r.tile},(_,i)=>Array.from({length:r.tile},(_,j)=>kind==='a'?matrix[i][step.k0+j]:matrix[step.k0+i][j]));
export function matmulRecordingFrame(stage){
 const step=['replace-inputs','second-phase'].includes(stage)?second:first;
 return {step,a:inputs(r.a,step,'a'),b:inputs(r.b,step,'b'),c:partial(stage==='replace-inputs'?first:step)};
}
const arrow=d=>`<path class="arrow" d="${d}" marker-end="url(#arrow)"/>`;
const text=(x,y,body,style='body')=>`<text class="${style}" x="${x}" y="${y}">${escape(body)}</text>`;
function fullMatrix(values,x,y,title,{row=null,col=null}={}){
 const size=54;
 return text(x+2*size,y-25,title,'heading')+values.map((_,i)=>text(x+i*size+(size-3)/2,y-8,String(i),'coordinate')+text(x-14,y+i*size+32,String(i),'coordinate')).join('')+values.map((values,i)=>values.map((v,j)=>`<g class="${i===row||j===col?'active':'cell'}"><rect x="${x+j*size}" y="${y+i*size}" width="${size-3}" height="${size-3}" rx="5"/>${text(x+j*size+(size-3)/2,y+i*size+32,fmt(v),'matrix-value')}</g>`).join('')).join('');
}
function panel(x,title,subtitle,values,kind,step,{selected=[],targets=false,shape=false}={}){
 const count=values.length,size=shape?40:78,top=118,start=x+(220-count*size)/2;
 return `<rect class="panel" x="${x}" y="25" width="220" height="268" rx="12"/>`+text(x+110,60,title,'heading')+text(x+110,88,subtitle,'caption')+
 values.map((row,i)=>row.map((v,j)=>{
  const cx=start+j*size,cy=top+i*(shape?40:72),picked=selected.some(([a,b])=>a===i&&b===j);
  const label=kind==='a'?`r${i}, k${step.k0+j}`:kind==='b'?`k${step.k0+i}, c${j}`:`r${i}, c${j}`;
  return `<g class="${picked?'active':'cell'}"><rect x="${cx}" y="${cy}" width="${size-2}" height="${shape?38:70}" rx="6"/>${shape?'':text(cx+(size-2)/2,cy+22,targets?`Thread ${i*r.tile+j}`:label,'coordinate')+text(cx+(size-2)/2,cy+52,targets?`C[${i},${j}]`:fmt(v),targets?'destination':'value')}</g>`;
 }).join('')).join('');
}
function phasePanels(stage,{focus=''}={}){
 const {step,a,b,c}=matmulRecordingFrame(stage),retained=stage==='replace-inputs';
 const as=focus==='a'?[[0,0]]:[],bs=focus==='b'?[[0,0]]:[],cs=focus==='a'?[[0,0],[0,1]]:focus==='b'?[[0,0],[1,0]]:[];
 const targets=Boolean(focus);
 return panel(8,'A tile',`Rows 0–1 · K ${step.k0}–${step.k0+1}`,a,'a',step,{selected:as})+
 panel(248,'B tile',`K ${step.k0}–${step.k0+1} · columns 0–1`,b,'b',step,{selected:bs})+
 panel(488,targets?'C destinations':retained?'Retained partial C':step.k0===0?'Partial C':'Completed C tile',targets?'One output per thread':`After K 0–${retained?1:step.k0+1}`,c,'c',step,{selected:cs,targets});
}
function dot(result=false){
 const a=r.a[0],b=r.b.map(row=>row[0]),products=a.map((v,k)=>v*b[k]);
 let html=text(360,25,'FOUR BY FOUR MATRICES · OUTPUT C[0,0]','eyebrow')+
 fullMatrix(r.a,70,80,'A · row 0',{row:0})+fullMatrix(r.b,434,80,'B · column 0',{col:0});
 if(!result)return html+text(360,360,'Match A[0,k] with B[k,0] for each K position.','body')+text(360,435,'C[0,0] = ?','equation');
 return html+products.map((v,k)=>{
  const x=22+k*176;
  return `<rect class="panel" x="${x}" y="315" width="160" height="100" rx="10"/>`+text(x+80,343,`K = ${k}`,'coordinate')+text(x+80,370,`${fmt(a[k])} × ${fmt(b[k])}`,'body')+text(x+80,401,fmt(v),'value');
 }).join('')+text(360,475,`${products.map(v=>v<0?`(${fmt(v)})`:fmt(v)).join(' + ')} = ${fmt(r.output[0][0])}`,'equation');
}
function reuse(kind){
 const coords=kind==='a'?[[0,0],[0,1]]:[[0,0],[1,0]];
 const prefix=kind==='a'?'M 40 153 H 20 V 330 H 505':'M 280 153 H 260 V 330 H 505';
 const routes=kind==='a'?arrow(prefix+' V 153 H 520')+arrow('M 505 330 H 708 V 153 H 674'):arrow(prefix+' V 153 H 520')+arrow('M 505 330 V 225 H 520');
 return text(360,15,kind==='a'?'ONE A VALUE → TWO OUTPUT COLUMNS':'ONE B VALUE → TWO OUTPUT ROWS','eyebrow')+phasePanels('first-phase',{focus:kind})+routes+
 text(360,377,'Inspecting contributions from K = 0.','body')+
 coords.map(([row,col],i)=>{
  const a=r.a[row][0],b=r.b[0][col],x=24+i*352;
  return `<rect class="panel" x="${x}" y="402" width="328" height="115" rx="12"/>`+text(x+164,433,`Contribution to C[${row},${col}]`,'caption')+text(x+164,477,`${fmt(a)} × ${fmt(b)} = ${fmt(a*b)}`,'equation');
 }).join('');
}
function comparison(){
 const list=[matmulRecordingData.baseline,r,matmulRecordingData.wide];
 return text(360,26,'COMPLETE FOUR BY FOUR MULTIPLICATION','eyebrow')+
 fullMatrix(r.output,44,145,'Same C · 16 output values')+
 text(510,84,'Explicit input values loaded','heading')+
 list.map((m,i)=>text(482,143+i*112,`Tile width ${m.tile} · ${m.inputLoads} input loads`,'body')+`<rect class="bar" x="310" y="${160+i*112}" width="${m.inputLoads/list[0].inputLoads*358}" height="26" rx="5"/>`).join('')+
 text(360,495,'Caches excluded · counts are not elapsed time','body');
}
function wider(answer=false){
 const m=matmulRecordingData.eight,step=m.trace[0],shape=Array.from({length:m.tile},()=>Array(m.tile).fill(0));
 let html=text(360,15,'ONE OUTPUT TILE · ONE K PHASE · N = 8','eyebrow')+
 panel(8,'A tile','4 rows × 4 K positions',shape,'a',step,{shape:true})+
 panel(248,'B tile','4 K positions × 4 columns',shape,'b',step,{shape:true})+
 panel(488,'C tile','4 rows × 4 columns',shape,'c',step,{shape:true,selected:answer?Array.from({length:m.tile},(_,j)=>[0,j]):[]});
 if(!answer)return html+text(360,366,'How many input values load in this phase?','body')+text(360,412,'How many outputs can use each loaded input?','body')+text(360,473,'Pause and explain the scope of this sharing.','caption');
 const count=step.aCells.length+step.bCells.length;
 return html+text(360,359,`${step.aCells.length} + ${step.bCells.length} = ${count} input values in this phase`,'equation')+text(360,416,`Each input serves ${m.tile} outputs within this tile.`,'heading')+
 text(360,474,'Another output tile can load the same input again.','body');
}
export function matmulFigure(stage){
 let body='';
 if(stage==='dot-inputs'||stage==='dot-result')body=dot(stage==='dot-result');
 else if(stage==='first-phase')body=text(360,15,'FIRST PHASE · K POSITIONS 0–1','eyebrow')+phasePanels(stage)+text(360,357,`${first.aCells.length} A inputs + ${first.bCells.length} B inputs = ${first.aCells.length+first.bCells.length} values loaded`,'equation')+text(360,420,'Four threads build four partial output sums.','body')+text(360,478,'Input tiles in shared memory · one private sum per thread','caption');
 else if(stage==='reuse-a'||stage==='reuse-b')body=reuse(stage==='reuse-a'?'a':'b');
 else if(stage==='replace-inputs')body=text(360,15,'NEXT INPUT TILES · PREVIOUS SUMS RETAINED','eyebrow')+phasePanels(stage)+`<rect class="gate" x="20" y="332" width="680" height="66" rx="10"/>`+text(360,373,'Finish old reads → replace tiles → order new writes','gate-label')+text(360,452,'The threads retain their own partial sums.','heading')+text(360,494,'A new input phase adds to them; it does not reset them.','body');
 else if(stage==='second-phase'){
  const old=first.cCells[0][2],now=second.cCells[0][2],delta=now-old;
  body=text(360,15,'SECOND PHASE · K POSITIONS 2–3','eyebrow')+phasePanels(stage)+text(360,365,`C[0,0]: ${fmt(old)} + (${fmt(delta)}) = ${fmt(now)}`,'equation')+text(360,425,'All four K positions have contributed.','heading')+text(360,479,'The output matches the separate-output reference.','body');
 }else if(stage==='compare')body=comparison();
 else if(stage==='question'||stage==='answer')body=wider(stage==='answer');
 else throw new Error('Unknown matrix recording stage: '+stage);
 return `<svg viewBox="0 0 720 550" role="img" aria-label="${escape(scenes.find(s=>s.stage===stage).lead)}"><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="#328774"/></marker></defs>${body}</svg>`;
}
const notes={
 'dot-inputs':'K is an index. The highlighted cells hold input values.',
 'dot-result':'One thread per output is a chosen teaching mapping.',
 'first-phase':'These are the first output tile’s partial sums, not the complete C.',
 'reuse-a':'Arrows identify the outputs using one selected input.',
 'reuse-b':'The same B input can serve different output rows.',
 'replace-inputs':'Shared inputs change; each thread keeps its private partial sum.',
 'second-phase':'Input tiles may be reused only after their users finish.',
 compare:'Input-load counts cover all output tiles and all K phases.',
 question:'Pause before checking the next slide.',
 answer:'Return to Chapter 9 → compare tile widths while keeping inputs fixed.',
};
export function matmulDeck(){return `<!doctype html><html lang="en-GB"><meta charset="utf-8"><link rel="icon" href="data:,"><title>How matrix tiles reuse inputs · GPU Lab</title><style>
@font-face{font-family:Plex;src:url('../../assets/fonts/plex-sans.woff2')}
*{box-sizing:border-box}body{margin:0;font-family:Plex,Arial,sans-serif;color:#183d3d;background:#f7faf7}.slide{width:1280px;height:720px;padding:35px 48px 24px;break-after:page;position:relative;overflow:hidden}.mast{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #cbded5;padding-bottom:17px;font-size:14px;color:#53736e}.brand{font-weight:700;color:#185f51;font-size:22px}.main{display:grid;grid-template-columns:342px 1fr;gap:32px;padding-top:32px}.eyebrow{font-size:13px;font-weight:600;letter-spacing:1.3px;text-transform:uppercase;color:#297765;margin:0 0 18px}h1{font-size:39px;line-height:1.12;margin:0 0 24px;font-weight:600;letter-spacing:-1px}.lead{font-size:23px;line-height:1.45;margin:0}.note{font-size:17px;line-height:1.5;border-left:3px solid #a6cbb9;padding-left:15px;margin-top:30px;color:#40685e}.figure{border:1px solid #cbded5;border-radius:16px;background:#edf5ef;padding:12px 8px;height:568px}svg{width:100%;height:100%}svg text{text-anchor:middle;fill:#183d3d;font-family:Plex,Arial,sans-serif}.panel{fill:#fff;stroke:#c7d9cf}.cell rect{fill:#fff;stroke:#c7d9cf}.active rect{fill:#d9eee1;stroke:#328774;stroke-width:2}.heading{font-size:21px;font-weight:600}.caption{font-size:16px;fill:#40685e}.coordinate{font-size:14px;fill:#53736e}.value{font-size:29px;font-weight:600}.destination{font-size:23px;font-weight:600}.matrix-value{font-size:23px;font-weight:500}.body{font-size:20px}.equation{font-size:26px;font-weight:600}.arrow{fill:none;stroke:#328774;stroke-width:3}.bar{fill:#328774}.gate{fill:#185f51}.gate-label{fill:#fff;font-size:21px;font-weight:500}.footer{position:absolute;bottom:17px;left:48px;right:48px;display:flex;justify-content:space-between;font-size:12px;color:#53736e}@page{size:1280px 720px;margin:0}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.slide:last-child{break-after:auto}}
</style>${scenes.map((s,i)=>`<section class="slide" id="${s.id}"><header class="mast"><span class="brand">▦ GPU Lab</span><span>CHAPTER 9 · MATRIX INPUT REUSE</span></header><div class="main"><div><p class="eyebrow">${i<2?'One output':i<7?'Shared input tiles':i===7?'Compare the algorithms':'Try a new case'} · ${i+1} / ${scenes.length}</p><h1>${escape(s.title)}</h1><p class="lead">${escape(s.lead)}</p><p class="note">${escape(notes[s.stage])}</p></div><div class="figure">${matmulFigure(s.stage)}</div></div><footer class="footer"><span>Teaching algorithm · caches and GPU timing excluded</span><span>Copyright © 2026 Christopher Snow</span></footer></section>`).join('')}</html>`;}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const output=process.argv[2]||'test-results/matmul-recording';await mkdir(output,{recursive:true});
 await writeFile(`${output}/deck.html`,matmulDeck());
 await writeFile(`${output}/scenes.json`,JSON.stringify(scenes.flatMap(s=>s.captions.map((text,i)=>{
  const say=text.replaceAll('matrix A','matrix [A](/ˈeɪ/)');
  return {id:`${s.id}-c${i+1}`,step:s.title,text,...(say!==text?{say}:{})};
 })),null,2));
 console.log(`Rendered ${scenes.length} model-derived matrix slides in ${output}`);
}
