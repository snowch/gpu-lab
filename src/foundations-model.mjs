// Copyright © 2026 Christopher Snow.
import {simulateLoad} from './model.mjs';
function multiplier(value) {
  if(typeof value!=='number'||!Number.isFinite(value)||value < -10||value > 10) throw new RangeError('Choose a multiplier from −10 to 10.');
  return Math.fround(value);
}
export function deviceJourney({stage=0,count=5,factor=2}={}) {
  if(![0,1,2].includes(stage)||![5,8].includes(count)) throw new RangeError('Choose a journey stage and five or eight values.');
  factor=multiplier(factor);
  const input=Array.from({length:count},(_,i)=>i+1),output=input.map(x=>Math.fround(x*factor));
  const buffer=(name,values)=>({name,values:[...values],bytes:values.length*4});
  const cpu=[buffer('x_cpu',input)],gpu=stage>0?[buffer('x_gpu',input)]:[];
  if(stage===2) gpu.push(buffer('y_gpu',output));
  const before={cpu:cpu.map(b=>buffer(b.name,b.values)),gpu:gpu.map(b=>buffer(b.name,b.values))};
  if(stage===0) gpu.push(buffer('x_gpu',input));
  if(stage===1) gpu.push(buffer('y_gpu',output));
  if(stage===2) cpu.push(buffer('y_cpu',output));
  return {stage,count,factor,input,output,before,after:{cpu,gpu},bytes:count*4,transferBytes:stage===1?0:count*4,
    direction:stage===0?'CPU → GPU':stage===2?'GPU → CPU':'Within GPU memory',
    allocated:stage===0?'x_gpu':stage===1?'y_gpu':'y_cpu'};
}
export function readTensor({pattern='row',index=0,factor=2}={}) {
  if(!['row','column','packed'].includes(pattern)||!Number.isInteger(index)||index<0||index>4) throw new RangeError('Choose a row or column from 0 to 4.');
  factor=multiplier(factor);
  const matrix=Array.from({length:25},(_,i)=>i+1);
  const sourceOffsets=Array.from({length:5},(_,i)=>pattern==='row'?index*5+i:i*5+index);
  const offsets=pattern==='packed'?Array.from({length:5},(_,i)=>i):[...sourceOffsets];
  const values=sourceOffsets.map(i=>matrix[i]),output=values.map(v=>Math.fround(v*factor));
  const stride=pattern==='column'?5:1,load=simulateLoad({stride,offset:offsets[0],activeLanes:5});
  return {pattern,index,factor,matrix,sourceOffsets,offsets,values,output,stride,byteStride:stride*4,
    shared:pattern!=='packed',copyBytes:pattern==='packed'?20:0,load};
}
export const tensorSetup = 'import torch\nx = torch.arange(\n    1, 26, dtype=torch.float32, device="cuda",\n).reshape(5, 5)';
export function readingCode({pattern='row',index=0,factor=2}={}) {
  readTensor({pattern,index,factor});
  return pattern==='packed'?`column = x[:, ${index}]\npacked = column.contiguous()\ny = packed * ${factor}`:`values = x[${pattern==='row'?`${index}, :`:`:, ${index}`}]\ny = values * ${factor}`;
}
export function journeyCode({stage=0,count=5,factor=2}={}) {
  const s=deviceJourney({stage,count,factor});
  const lines=['import torch',`x_cpu = torch.tensor(\n    [${s.input.map(n=>n+'.0').join(', ')}],\n    dtype=torch.float32,\n)`,'x_gpu = x_cpu.to("cuda")',`y_gpu = x_gpu * ${factor}`,'y_cpu = y_gpu.cpu()'];
  return {setup:lines.slice(0,stage+2).join('\n'),operation:lines[stage+2]};
}
