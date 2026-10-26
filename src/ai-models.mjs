// Copyright © 2026 Christopher Snow.
function choice(name, value, values) {
  if (!values.includes(value)) throw new RangeError(`${name}: choose ${values.join(', ')}.`);
}
function positive(name, value) {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be positive and finite.`);
}
export function multiply(a, b) {
  return a.map(row => b[0].map((_, col) => row.reduce((sum, x, k) => sum + x * b[k][col], 0)));
}

export function tiledMatmul({ n = 8, tile = 2, sharedBudget = 512, registers = 16 } = {}) {
  choice('n', n, [4, 8]); choice('tile', tile, [1, 2, 4]);
  choice('sharedBudget', sharedBudget, [128, 512, 2048]); choice('registers', registers, [16, 64]);
  const a = Array.from({length:n}, (_,r)=>Array.from({length:n},(_,k)=>(r+k)%5-2));
  const b = Array.from({length:n}, (_,k)=>Array.from({length:n},(_,c)=>(k+c)%3-1));
  const output = Array.from({length:n},()=>Array(n).fill(0));
  const trace = [];
  for (let row=0;row<n;row+=tile) for(let col=0;col<n;col+=tile) for(let k0=0;k0<n;k0+=tile) {
    const aCells=[],bCells=[],cCells=[];
    for(let i=0;i<tile;i++) for(let j=0;j<tile;j++) {
      aCells.push([row+i,k0+j]); bCells.push([k0+i,col+j]);
      for(let k=0;k<tile;k++) output[row+i][col+j]+=a[row+i][k0+k]*b[k0+k][col+j];
      cCells.push([row+i,col+j,output[row+i][col+j]]);
    }
    trace.push({label:`C tile (${row},${col}), K ${k0}–${k0+tile-1}`,row,col,k0,aCells,bCells,cCells});
  }
  const inputLoads=trace.reduce((sum,t)=>sum+t.aCells.length+t.bCells.length,0);
  const bytes=4*(inputLoads+n*n),flops=2*n*n*n;
  const sharedBytes=tile===1 ? 0 : 2*tile*tile*4;
  // Explicit teaching budgets: 1024 registers, 8 warp slots, at most 8 blocks.
  const registersPerBlock=tile*tile*registers;
  const residentBlocks=Math.min(8,Math.floor(1024/registersPerBlock),sharedBytes ? Math.floor(sharedBudget/sharedBytes) : 8);
  return {a,b,output,trace,n,tile,inputLoads,naiveLoads:2*n*n*n,bytes,flops,
    intensity:flops/bytes,sharedBytes,registersPerBlock,residentBlocks,occupancy:residentBlocks/8,
    resourceCapacity:{registers:1024,shared:sharedBudget,warps:8}};
}

function evenRound(value) {
  const floor=Math.floor(value),fraction=value-floor;
  return fraction===0.5 ? floor%2===0 ? floor : floor+1 : Math.round(value);
}
/** Round-to-nearest, ties-to-even, including gradual underflow and overflow. */
export function quantize(value, format='fp16') {
  choice('format',format,['fp32','fp16','bf16']);
  if (!Number.isFinite(value) || value===0) return value;
  if(format==='fp32') return Math.fround(value);
  const [fractionBits,minExponent,maxExponent]=format==='fp16' ? [10,-14,15] : [7,-126,127];
  const magnitude=Math.abs(value);
  const exponent=Math.max(minExponent,Math.floor(Math.log2(magnitude)));
  const spacing=2**(exponent-fractionBits);
  const rounded=evenRound(magnitude/spacing)*spacing;
  return Math.sign(value)*(rounded>=2**(maxExponent+1) ? Infinity : rounded);
}

export function precisionMatmul({ format='fp16', pattern='cancellation' }={}) {
  choice('format',format,['fp32','fp16','bf16']);
  choice('pattern',pattern,['cancellation','small','exact']);
  const row=Array.from({length:16},(_,k)=>Math.fround(pattern==='cancellation' ? k<8 ? 1.0003 : -1 : pattern==='small' ? 1e-8 : k%2 ? -0.5 : 1));
  const converted=row.map(x=>quantize(x,format));
  let reference=0,sum=0;
  const trace=row.map((input,k)=>{
    // B[k,0] is 1. Each accumulation is rounded to FP32.
    reference=Math.fround(reference+input);sum=Math.fround(sum+converted[k]);
    return {label:`K=${k}: accumulate product`,k,input,converted:converted[k],product:converted[k],partial:sum,reference};
  });
  return {row,converted,trace,format,reference,result:sum,error:Math.abs(sum-reference),
    changed:row.filter((x,k)=>x!==converted[k]).length,
    // Identical A rows and all-one B columns make every C element identical.
    output:Array.from({length:16},()=>Array(16).fill(sum)),scalarFmas:16**3,warpMmaCalls:1};
}

export function attention({ n=8, tile=2, mode='online', scale=1 }={}) {
  choice('n',n,[8,16,32]);choice('tile',tile,[2,4,8]);choice('mode',mode,['online','materialised']);choice('scale',scale,[1,1000]);
  const d=4;
  const q=Array.from({length:n},(_,i)=>Array.from({length:d},(_,j)=>((i+j)%5-2)*scale));
  const k=Array.from({length:n},(_,i)=>Array.from({length:d},(_,j)=>((2*i+j)%7-3)/2));
  const v=Array.from({length:n},(_,i)=>Array.from({length:d},(_,j)=>(i+j)%9-4));
  const scores=q.map(row=>k.map(key=>row.reduce((s,x,j)=>s+x*key[j],0)/Math.sqrt(d)));
  const probabilities=scores.map(row=>{const m=Math.max(...row),e=row.map(x=>Math.exp(x-m)),l=e.reduce((a,b)=>a+b,0);return e.map(x=>x/l);});
  const reference=multiply(probabilities,v),online=[];
  const onlineTrace=[];
  for(let query=0;query<n;query++) {
    let m=-Infinity,l=0,acc=Array(d).fill(0);
    for(let start=0;start<n;start+=tile) {
      const previous={m,l,acc:[...acc]};
      const block=scores[query].slice(start,start+tile);
      const nextMax=Math.max(m,...block),rescale=Math.exp(m-nextMax);
      const weights=block.map(x=>Math.exp(x-nextMax));
      l=l*rescale+weights.reduce((a,b)=>a+b,0);
      acc=acc.map((x,j)=>x*rescale+weights.reduce((s,w,t)=>s+w*v[start+t][j],0));
      m=nextMax;
      if(query===0) onlineTrace.push({label:`Query 0, keys ${start}–${start+tile-1}`,start,block,m,l,rescale,previous,acc:[...acc],weights:[...weights],tileDenominator:weights.reduce((a,b)=>a+b,0),tileNumerator0:weights.reduce((s,w,t)=>s+w*v[start+t][0],0),output:acc.map(x=>x/l)});
    }
    online.push(acc.map(x=>x/l));
  }
  const trace=mode==='online' ? onlineTrace : [
    {label:'Write full score matrix',values:scores[0],description:'Query 0 scores; all query rows are materialised.'},
    {label:'Read scores, write probabilities',values:probabilities[0],description:'Subtract each row maximum before exponentiating.'},
    {label:'Read probabilities, multiply by V',values:reference[0],description:'The final query-0 output vector.'},
  ];
  return {n,d,tile,mode,q,k,v,scores,probabilities,reference,output:mode==='online'?online:reference,trace,
    intermediateComparison:{materialisedWrites:2*n*n,materialisedBytes:4*n*n*4,onlineWrites:0,onlineBytes:0},
    intermediateWrites:mode==='online'?0:2*n*n,
    intermediateBytes:mode==='online'?0:4*n*n*4,
    scratchFloats:mode==='online'?tile+d+2:2*n*n,
    maxError:Math.max(...online.flatMap((row,i)=>row.map((x,j)=>Math.abs(x-reference[i][j]))))};
}

export function inferenceBudget({phase='decode',batch=1,sequence=512,parameters=7,bandwidth=1000,compute=100,measuredMs=0}={}) {
  choice('phase',phase,['decode','prefill']);choice('batch',batch,[1,4,16]);choice('sequence',sequence,[128,512,2048]);
  choice('parameters',parameters,[1,7]);positive('bandwidth',bandwidth);positive('compute',compute);
  if(!Number.isFinite(measuredMs)||measuredMs<0)throw new RangeError('Measured milliseconds must be non-negative.');
  const layers=32,hidden=4096,kvWidth=1024,bytesPerValue=2;
  const tokens=phase==='decode'?batch:batch*sequence;
  const weightBytes=parameters*1e9*bytesPerValue;
  const kvCacheBytes=2*layers*batch*sequence*kvWidth*bytesPerValue;
  const kvReadBytes=phase==='decode'?kvCacheBytes:0;
  const kvWriteBytes=phase==='decode'?2*layers*batch*kvWidth*bytesPerValue:kvCacheBytes;
  const flops=2*parameters*1e9*tokens+4*layers*batch*sequence*hidden*(phase==='prefill'?sequence:1);
  const bytes=weightBytes+kvReadBytes+kvWriteBytes;
  const memoryMs=bytes/(bandwidth*1e9)*1000,computeMs=flops/(compute*1e12)*1000;
  const boundMs=Math.max(memoryMs,computeMs),bottleneck=memoryMs>=computeMs?'memory':'compute';
  const trace=[
    {label:'Read weights',bytes:weightBytes,ms:weightBytes/(bandwidth*1e9)*1000},
    {label:'Read previous KV entries',bytes:kvReadBytes,ms:kvReadBytes/(bandwidth*1e9)*1000},
    {label:'Write new KV entries',bytes:kvWriteBytes,ms:kvWriteBytes/(bandwidth*1e9)*1000},
    {label:'Compute bound',flops,ms:computeMs},
    {label:'Take the larger bound',ms:boundMs},
  ];
  return {trace,phase,batch,sequence,layers,hidden,kvWidth,tokens,weightBytes,kvCacheBytes,kvReadBytes,kvWriteBytes,flops,bytes,memoryMs,computeMs,boundMs,bottleneck,
    cacheTokensBefore:phase==='decode'?sequence:0,cacheTokensAfter:phase==='decode'?sequence+1:sequence,
    measuredMs,measurementRatio:measuredMs?boundMs/measuredMs:null};
}

export function reduceBlock({size=8,synchronised=true}={}) {
  choice('size',size,[4,8]);if(typeof synchronised!=='boolean')throw new TypeError('synchronised must be boolean.');
  const inputs=Array.from({length:size},(_,i)=>i+1),shared=Array(size).fill(null),trace=[];
  const levels=[inputs.map((value,index)=>({value,index,threads:[index]}))];
  const record=(label,hazard=false,reads=[])=>trace.push({label,hazard,reads,shared:[...shared],level:levels.length-1});
  if(synchronised) {
    for(let lane=0;lane<size;lane++){shared[lane]=inputs[lane];record(`Thread ${lane} writes input ${inputs[lane]}`);}
    record('All threads pass the initial barrier');
    for(let stride=size/2;stride>=1;stride/=2){
      const before=[...shared];
      for(let lane=0;lane<stride;lane++)shared[lane]=before[lane]+before[lane+stride];
      const previous=levels.at(-1);
      levels.push(Array.from({length:stride},(_,i)=>({index:i,value:shared[i],threads:[...previous[i].threads,...previous[i+stride].threads]})));
      record(`Add partners at distance ${stride}; then block barrier`,false,Array.from({length:stride},(_,i)=>i+stride));
    }
  }else{
    shared[0]=inputs[0];record('Thread 0 writes its input');
    record(`Thread 0 reads partner ${size/2} before that thread writes`,true,[size/2]);
    for(let lane=1;lane<size;lane++){shared[lane]=inputs[lane];record(`Thread ${lane} writes too late for the earlier read`);}
  }
  const hazard=trace.some(event=>event.hazard);
  return {inputs,trace,levels,size,hazard,expected:inputs.reduce((a,b)=>a+b,0),result:hazard?null:shared[0]};
}
