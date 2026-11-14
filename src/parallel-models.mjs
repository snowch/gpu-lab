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
  return {visual:{kind:'histogram',strategy},input,counts,partial,globalUpdates,steps,columns:['Category 0','Category 1','Category 2','Category 3'],
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
 const steps=[{label:'Initial flags in shared memory',cells:[...values],distance:0}];
 for(let distance=1;distance<n;distance*=2){
  const old=[...values];values=old.map((x,i)=>i>=distance?(additions++,x+old[i-distance]):x);
  steps.push({label:`Completed stage: partner distance ${distance}`,cells:[...values],before:old,distance});
 }
 const inclusive=[...values];
 if(kind==='exclusive'){values=[0,...values.slice(0,-1)];steps.push({label:'Exclusive prefixes: shift right and insert zero',cells:[...values],before:inclusive,shift:true});}
 return {visual:{kind:'scan',convention:kind},input,values,inclusive,additions,steps,columns:input.map((_,i)=>`Position ${i}`),summary:`Final ${kind} prefixes [${values.join(', ')}]. ${additions} pair additions in the inclusive stages.`,note:'One block; integer flags; each stage reads a completed snapshot of the preceding stage. Stage boundaries require collective ordering. These are dependency stages, not GPU clock cycles. Shifting is a teaching construction of the exclusive result.'};
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
  steps.push({label:`Thread ${i}: ${flags[i]?'write token to its destination':'skip output write'}`,cells:[i,input[i],flags[i],offsets[i],flags[i]?offsets[i]:'Skip'],inputIndex:i,destination:flags[i]?offsets[i]:null,output:[...output],detail:'Output so far: '+(output.length?'['+output.join(', ')+']':'(empty)')});
 }
 return {visual:{kind:'compaction',predicate,order},input,flags,offsets,count,output,writes,steps,columns:['Token','Category','Keep','Offset','Write to'],summary:`Completed output token positions [${output.join(', ')}]. ${count} survivors; ${writes.length} output writes. Eight input slots were inspected.`,note:'Flags and exclusive offsets are complete before scatter. Only kept threads write. Their distinct destinations preserve input order even when the inspected write sequence is reversed. The model reports the used output prefix, not a measured allocation or GPU schedule.'};
}
parallelModels.compaction=compaction;

export function philosophers({policy='ordered'}={}){
 if(!['ordered','cycle'].includes(policy))throw new RangeError('Unknown acquisition policy');
 const forks=Array(3).fill(null),held=[[],[],[]],done=Array(3).fill(false),names=['A','B','C'];
 const wanted=names.map((_,i)=>policy==='ordered'?[i,(i+1)%3].sort((a,b)=>a-b):[i,(i+1)%3]);
 const steps=[];let deadlocked=false;
 const waitEdges=()=>names.flatMap((_,i)=>{
  if(done[i]||held[i].length===2)return [];
  const fork=wanted[i][held[i].length],to=forks[fork];
  return to===null?[]:[{from:i,to,fork}];
 });
 const statuses=()=>names.map((name,i)=>done[i]?'Finished':held[i].length===2?'Holds both; ready to eat':held[i].length?`Holds ${held[i][0]}; needs ${wanted[i][held[i].length]}`:'Needs '+wanted[i][0]);
 for(let round=0;round<32&&!done.every(Boolean);round++){
  let moved=false;
  for(let i=0;i<3;i++){
   if(done[i])continue;
   let action;
   if(held[i].length===2){for(const fork of held[i])forks[fork]=null;held[i]=[];done[i]=true;moved=true;action=`${names[i]} eats, releases both forks and finishes`;}
   else {const fork=wanted[i][held[i].length];if(forks[fork]===null){forks[fork]=i;held[i].push(fork);moved=true;action=`${names[i]} acquires fork ${fork}`;}else action=`${names[i]} waits for fork ${fork}, held by ${names[forks[fork]]}`;}
   steps.push({label:action,actor:i,forks:[...forks],held:held.map(h=>[...h]),done:[...done],waits:waitEdges(),cells:statuses(),detail:'Fork owners: '+forks.map((owner,j)=>`${j}: ${owner===null?'free':names[owner]}`).join('; ')});
  }
  if(!moved){deadlocked=true;break;}
 }
 const waits=names.filter((_,i)=>!done[i]).map(name=>{const i=names.indexOf(name),fork=wanted[i][held[i].length];return {from:i,to:forks[fork],fork};});
 return {visual:{kind:'philosophers',policy},wanted,forks,held,done,waits,deadlocked,steps,columns:['A','B','C'],summary:deadlocked?`Deadlock in this chosen execution: ${waits.map(w=>names[w.from]+' waits for '+names[w.to]).join('; ')}. No philosopher can eat and release a fork.`:'All three philosophers finish under this chosen execution. A common resource order prevents a circular resource wait.',note:'Three philosophers; three exclusive forks; one meal each; a chosen round-robin opportunity order. This model is not a GPU scheduler and establishes no general fairness or runtime bound.'};
}
export function barrier({participation='all'}={}){
 if(!['all','subset'].includes(participation))throw new RangeError('Unknown barrier participation');
 const states=Array(4).fill('Before barrier'),steps=[];
 for(let i=0;i<4;i++){
  states[i]=participation==='all'||i<2?'Waiting':'Skipped';
  steps.push({label:`Thread ${i} ${participation==='all'||i<2?'reaches':'skips'} the barrier`,cells:[...states]});
 }
 const valid=participation==='all';
 if(valid)steps.push({label:'All four arrive; the barrier releases the block',cells:Array(4).fill('May continue')});
 return {visual:{kind:'barrier',participation},valid,steps,columns:states.map((_,i)=>`Thread ${i}`),summary:valid?'Valid block barrier: all four threads reach the matching barrier before continuing.':'Invalid participation: threads 2 and 3 skip a barrier taken by threads 0 and 1. No valid arithmetic result is assigned.',note:'One block of exactly four threads; no early exits. This is a participation diagnostic, not an execution of undefined CUDA behaviour or a guarantee about how a real GPU fails.'};
}
parallelModels.philosophers=philosophers;
parallelModels.barrier=barrier;

export function pipeline({mode='serial',chunks='4',copy='2'}={}){
 const n=Number(chunks),copyTime=Number(copy),computeTime=3;
 if(!['serial','pipeline'].includes(mode)||![2,4].includes(n)||![2,4].includes(copyTime))throw new RangeError('Unknown pipeline configuration');
 let copyFree=0,computeFree=0;const bufferFree=[0,0],events=[],steps=[];
 for(let i=0;i<n;i++){
  const slot=i%2,previous=bufferFree[slot],copyReady=copyFree,computeReady=computeFree;
  const copyStart=Math.max(copyFree,previous,mode==='serial'?computeFree:0),copyEnd=copyStart+copyTime;
  const computeStart=Math.max(copyEnd,computeFree),computeEnd=computeStart+computeTime;
  copyFree=copyEnd;computeFree=computeEnd;bufferFree[slot]=computeEnd;
  events.push({chunk:i,slot,copyStart,copyEnd,computeStart,computeEnd});
  steps.push({label:`Chunk ${i}; slot ${slot} is released at unit ${computeEnd}`,chunk:i,slot,copyStart,copyEnd,computeStart,computeEnd,copyReady,computeReady,slotReady:previous,previousChunk:i>=2?i-2:null,cells:[i,slot,`${copyStart}–${copyEnd}`,`${computeStart}–${computeEnd}`],detail:i>=2?`Slot ${slot} was held by chunk ${i-2} until unit ${previous}. Its next copy cannot overwrite that chunk's inputs before then.`:'This slot has no previous consumer. Copy completion must still precede computation.'});
 }
 return {visual:{kind:'pipeline',mode},events,span:computeFree,copyTime,computeTime,steps,columns:['Chunk','Slot','Copy','Compute'],rows:events.map(e=>[`Chunk ${e.chunk}`,e.slot,`${e.copyStart}–${e.copyEnd}`,`${e.computeStart}–${e.computeEnd}`]),rowCaption:'Complete synthetic schedule; all intervals in time units',rowColumns:['Chunk','Slot','Copy','Compute'],summary:`Synthetic completion: ${computeFree} time units. ${n} copies and ${n} compute operations. These are model durations, not GPU measurements.`,note:'One copy engine, one compute queue, two reusable slots; copy duration '+copyTime+' units and compute duration 3 units per equal chunk. Intervals show start–finish in arbitrary time units. Operations on the same engine never overlap, and a slot is not reused until its previous computation finishes.'};
}
parallelModels.pipeline=pipeline;

export function routing({distribution='mixed',goal='counts'}={}){
 if(!Object.hasOwn(categories,distribution)||!['counts','group'].includes(goal))throw new RangeError('Unknown routing configuration');
 const input=[...categories[distribution]],counts=Array(4).fill(0),steps=[];
 input.forEach((bin,i)=>{counts[bin]++;if(goal==='counts')steps.push({label:`Token ${i} contributes to category ${bin}`,cells:[...counts]});});
 if(goal==='counts')return {input,counts,offsets:null,ranks:null,destinations:null,output:null,writes:0,steps,columns:['Category 0','Category 1','Category 2','Category 3'],summary:`Counts [${counts.join(', ')}]. Only counts requested: no prefix offsets or grouping; 0 scatter writes.`,note:'Eight integer category IDs contribute once each. This result supplies category sizes, not token identities or their order. Operation counts do not predict GPU runtime.'};
 let start=0;const offsets=counts.map(count=>{const old=start;start+=count;return old;}),seen=Array(4).fill(0),ranks=[],destinations=[],output=Array(input.length).fill('Unwritten');
 input.forEach((bin,i)=>{
  const rank=seen[bin]++,destination=offsets[bin]+rank;ranks.push(rank);destinations.push(destination);output[destination]=i;
  steps.push({label:`Token ${i}: category ${bin}, destination ${destination}`,cells:[i,bin,offsets[bin],rank,destination],detail:'Output token positions so far: ['+output.join(', ')+']'});
 });
 return {input,counts,offsets,ranks,destinations,output,writes:input.length,steps,columns:['Token','Category','Bin start','Rank','Write to'],rows:counts.map((count,bin)=>[`Category ${bin}`,count,offsets[bin]]),rowCaption:'Completed counts and exclusive bin starts before scatter',rowColumns:['Category','Count','Bin start'],summary:`Counts [${counts.join(', ')}]. Stable output token positions [${output.join(', ')}]. ${input.length} unique destinations; ${input.length} scatter writes.`,note:'Counts, exclusive bin starts and each token’s within-category rank are complete before scatter. The trace visits input order to explain placement; it is not a GPU instruction schedule. Every token belongs to exactly one of four categories, with no dropping or capacity limit. No runtime or physical traffic is simulated.'};
}
parallelModels.routing=routing;
