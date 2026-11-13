// Copyright © 2026 Christopher Snow.
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {precisionMatmul} from '../src/ai-models.mjs';
import {roundedTensorValue as number} from '../src/value-format.mjs';
import {label as t,recordingDeck,writeRecordingDeck} from './recording-deck.mjs';
import scenes from '../content/tensor-cores-scenes.json' with {type:'json'};
export const precisionRecordingData=Object.fromEntries(['cancellation','small','exact'].map(pattern=>[pattern,Object.fromEntries(['fp16','bf16','fp32'].map(format=>[format,precisionMatmul({pattern,format})]))]));
function card(x,y,width,title,lines,active=false){return `<rect class="${active?'active':'panel'}" x="${x}" y="${y}" width="${width}" height="${65+lines.length*38}" rx="9"/>`+t(x+width/2,y+35,title,'heading')+lines.map((line,i)=>t(x+width/2,y+78+i*38,line,'body')).join('');}
export function precisionRecordingFrame(stage){const question=stage==='question',pattern=['question','answer'].includes(stage)?'exact':stage==='range'?'small':'cancellation';return {formats:precisionRecordingData[pattern],question,pattern};}
export function precisionFigure(stage){
 const {formats:f,question}=precisionRecordingFrame(stage),r=f.fp16;
 const head=t(360,34,'A: 16 × 16 · B: 16 × 16 · C: 16 × 16','heading');
 if(stage==='inputs')return head+card(40,100,640,'Every row of A has 16 FP32 inputs',[`First 8: ${number(r.row[0])} · last 8: ${number(r.row[8])}`])+card(40,265,640,'B contains only 1.0',[`${r.output.length*r.output[0].length} outputs share this row-sum example`])+t(360,485,'FP32 input → smaller format → product → FP32 sum','body')+t(360,535,'Displayed values are rounded; calculations use model values.','caption');
 if(stage==='conversion')return head+['fp16','bf16','fp32'].map((format,i)=>{const s=f[format];return card(40,68+i*156,640,format.toUpperCase(),[`${number(s.row[0])} → ${number(s.converted[0])} · ${number(s.row[8])} stays ${number(s.converted[8])}`,`Changed row inputs: ${s.changed} / ${s.row.length}`],format!=='fp32');}).join('');
 if(['partial','cancellation'].includes(stage)){
  const k=stage==='partial'?7:15,e=r.trace[k];
  return head+t(360,88,`After K = ${k}: ${k+1} additions into each FP32 sum`,'body')+card(35,135,650,'Converted inputs',[`Selected input × B: ${number(e.converted)} × 1.0`,`Running sum: ${number(e.partial)}`],true)+card(35,320,650,'Original FP32 inputs · same order',[`Selected input × B: ${number(e.input)} × 1.0`,`Reference sum: ${number(e.reference)}`])+t(360,529,stage==='partial'?'The next eight inputs are −1.0.':'The final difference originates in input conversion.','caption');
 }
 if(stage==='range')return head+t(360,87,`16 small inputs: each begins as ${number(r.row[0])} in FP32`,'body')+['fp16','bf16'].map((format,i)=>{const s=f[format];return card(40,130+i*190,640,format.toUpperCase(),[`Converted input: ${number(s.converted[0])}`,`Final FP32 sum: ${number(s.result)}`],format==='bf16');}).join('')+t(360,538,'BF16 values stay non-zero here, but still round.','caption');
 if(stage==='hardware')return head+card(40,100,640,'Arithmetic in this chosen matrix shape',[`${r.output.length} × ${r.output[0].length} outputs × ${r.row.length} K positions`,`${r.scalarFmas.toLocaleString('en-GB')} scalar multiply–accumulates`],true)+card(40,308,640,'Hardware implementation',[`Supported matrix shapes and formats depend on the GPU.`,'The sequential browser trace does not identify hardware.'])+t(360,537,'Arithmetic work, instruction count and GPU time are distinct.','caption');
 return head+card(40,100,640,'A new row · B remains all 1.0',[`Alternate ${number(r.row[0])} and ${number(r.row[1])} · ${r.row.length} inputs`])+card(40,265,640,question?'Predict FP16 and BF16 conversion':'FP16 and BF16 keep these values',question?['Changed inputs: ?','Final sum: ?']:[`Changed inputs: ${r.changed} / ${r.row.length}`,`Converted sum: ${number(r.result)} · reference: ${number(r.reference)}`],!question)+t(360,528,question?'Apply exact representability, then pause.':'Agreement on one row does not validate all other inputs.','caption');
}
const notes={inputs:'Inputs first enter FP32 storage; display values are rounded.',conversion:'Conversion loss occurs before accumulation.',partial:'Both paths round every addition to FP32.',cancellation:'Changing the print format cannot restore discarded input data.',range:'Range and nearby-value precision are different properties.',hardware:'No tensor-core execution or GPU timing is simulated.',question:'The source row is visible; conversion answers are withheld.',answer:'Use a reference and data representative of the real calculation.'};
export const precisionDeck=()=>recordingDeck({chapter:11,title:'Follow input rounding into FP32 sums',scenes:scenes.map(s=>({...s,note:notes[s.stage]})),figure:precisionFigure,scope:'Nearest-even input conversion · sequential FP32 additions · rounded display · no tensor-core execution'});
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await writeRecordingDeck(process.argv[2]||'test-results/tensor-cores-recording',precisionDeck(),scenes);
