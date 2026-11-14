// Copyright © 2026 Christopher Snow.
export const categories = {mixed:[0,1,0,2,1,0,3,0],hot:[0,0,0,0,0,0,0,0]};
export function histogram({distribution='mixed',strategy='global'}={}) {
  const input=categories[distribution];
  if(!input||!['global','private'].includes(strategy))throw new RangeError('Unknown histogram configuration');
  const partial=[Array(4).fill(0),Array(4).fill(0)],counts=Array(4).fill(0),steps=[];
  input.forEach((bin,i)=>{
    partial[Math.floor(i/4)][bin]++;counts[bin]++;
    steps.push({label:`Thread ${i} adds 1 to category ${bin}`,cells:[...counts]});
  });
  const globalUpdates=strategy==='global'?input.length:partial.flat().filter(Boolean).length;
  return {input,counts,partial,globalUpdates,steps,columns:['Category 0','Category 1','Category 2','Category 3'],
    summary:`Final counts [${counts.join(', ')}]. ${globalUpdates} global atomic additions; ${strategy==='private'?8:0} local atomic additions. These are operation counts, not timings.`,
    rows:strategy==='private'?partial.map((p,i)=>[`Block ${i} partial`,...p]):[],
    note:strategy==='private'?'Two blocks of four threads count into separate zeroed four-counter shared arrays, synchronise, then add only non-zero partials to global counters. The trace shows logical contributions to the final counts, not instruction or scheduling order.':'Global counters start at zero. Each of eight threads makes one atomic addition. The chosen trace order illustrates counts; hardware may order additions differently.'};
}
export const parallelModels={histograms:histogram};

export function scan({size='8',kind='inclusive'}={}){
 const n=Number(size);
 if(![4,8].includes(n)||!['inclusive','exclusive'].includes(kind))throw new RangeError('Unknown scan configuration');
 const input=categories.mixed.slice(0,n).map(x=>Number(x===0));
 let values=[...input],additions=0;
 const steps=[{label:'Initial flags in shared memory',cells:[...values]}];
 for(let distance=1;distance<n;distance*=2){
  const old=[...values];values=old.map((x,i)=>i>=distance?(additions++,x+old[i-distance]):x);
  steps.push({label:`Completed stage: partner distance ${distance}`,cells:[...values]});
 }
 const inclusive=[...values];
 if(kind==='exclusive'){values=[0,...values.slice(0,-1)];steps.push({label:'Exclusive prefixes: shift right and insert zero',cells:[...values]});}
 return {input,values,inclusive,additions,steps,columns:input.map((_,i)=>`Position ${i}`),summary:`Final ${kind} prefixes [${values.join(', ')}]. ${additions} pair additions in the inclusive stages.`,note:'One block; integer flags; each stage reads a completed snapshot of the preceding stage. Stage boundaries require collective ordering. These are dependency stages, not GPU clock cycles. Shifting is a teaching construction of the exclusive result.'};
}
parallelModels.scan=scan;

export function compaction({predicate='zero',order='forward'}={}){
 const predicates={zero:x=>x===0,nonzero:x=>x!==0,all:()=>true,none:()=>false};
 if(!Object.hasOwn(predicates,predicate)||!['forward','reverse'].includes(order))throw new RangeError('Unknown compaction configuration');
 const input=[...categories.mixed],flags=input.map(x=>Number(predicates[predicate](x)));
 let count=0;const offsets=flags.map(f=>{const old=count;count+=f;return old;});
 const output=Array(count).fill('Unwritten'),steps=[],writes=[];
 const indices=input.map((_,i)=>i);if(order==='reverse')indices.reverse();
 for(const i of indices){
  if(flags[i]){output[offsets[i]]=i;writes.push(offsets[i]);}
  steps.push({label:`Thread ${i}: ${flags[i]?'write token to its destination':'skip output write'}`,cells:[i,input[i],flags[i],offsets[i],flags[i]?offsets[i]:'Skip'],detail:'Output so far: '+(output.length?'['+output.join(', ')+']':'(empty)')});
 }
 return {input,flags,offsets,count,output,writes,steps,columns:['Token','Category','Keep','Offset','Write to'],summary:`Completed output token positions [${output.join(', ')}]. ${count} survivors; ${writes.length} output writes. Eight input slots were inspected.`,note:'Flags and exclusive offsets are complete before scatter. Only kept threads write. Their distinct destinations preserve input order even when the inspected write sequence is reversed. The model reports the used output prefix, not a measured allocation or GPU schedule.'};
}
parallelModels.compaction=compaction;
