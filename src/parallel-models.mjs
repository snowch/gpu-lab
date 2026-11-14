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
