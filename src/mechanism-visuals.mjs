// Copyright © 2026 Christopher Snow.
const number=x=>!Number.isFinite(x)?String(x):x!==0&&(Math.abs(x)<1e-4||Math.abs(x)>1e7)?x.toExponential(3):x.toLocaleString('en-GB',{maximumFractionDigits:4});
const box=(title,value,extra='')=>`<div class="flow-box ${extra}"><strong>${title}</strong><span>${value}</span></div>`;
const arrow='<span class="flow-arrow" aria-hidden="true">→</span>';
const caption=text=>`<p class="visual-caption">${text}</p>`;

function scheduling(r,step){
  const width=70+r.trace.length*38;
  const header=`<div class="swim-label">Cycle</div>${r.trace.map(t=>`<span class="swim-cell${t.cycle===step.cycle?' current':''}">${t.cycle}</span>`).join('')}`;
  const rows=step.before.map((_,id)=>`<div class="swim-label">Warp ${id}</div>${r.trace.map(t=>{
    const status=t.selected===id?t.instruction:t.before[id].status;
    return `<span class="swim-cell ${status==='waiting'?'waiting':status==='ready'?'ready':t.selected===id?'issuing':''}${t.cycle===step.cycle?' current':''}" title="Warp ${id}, cycle ${t.cycle}: ${status}">${status==='waiting'?'wait':status==='ready'?'·':status==='done'?'—':status}</span>`;
  }).join('')}`).join('');
  return `<h3>See the waits that other warps can fill</h3>${caption('Each column is one teaching-machine cycle; each row is one resident warp. Scroll horizontally to inspect the whole run. The outlined column matches the trace position below. LD/MUL/ST = issued; wait = load dependency; dot = ready but not selected; dash = complete.')}
  <div class="visual-scroll" role="region" aria-label="Warp scheduling timeline" tabindex="0"><div class="swim-grid" style="width:${width}px;grid-template-columns:70px repeat(${r.trace.length},38px)">${header}${rows}</div></div>`;
}
function divergence(r,step){
  const path=name=>{
    const lanes=r.lanes.filter(l=>l.active&&l.path===name);
    const operations=r.trace.filter(t=>t.path===name);
    return `<div class="branch-route${step.path===name?' active-route':''}"><h4>${name==='positive'?'v ≥ 0':'v < 0'}: ${lanes.length} lanes</h4>${operations.length?operations.map(t=>box(t.label,`${t.mask.length} participating lanes`,t===step?'selected':'')).join('<span class="down-arrow" aria-hidden="true">↓</span>'):box('Empty mask','Path skipped')}</div>`;
  };
  return `<h3>One condition, separate masked paths</h3><div class="branch-graph">${box('Test each participating lane','v ≥ 0 ?')}<div class="branch-split"><span>↙ positive path</span><span>negative path ↘</span></div><div class="branch-columns">${path('positive')}${path('negative')}</div>${box('Continue after the condition','Participating lanes continue with their path’s output.')}</div>${caption('Both branches are drawn to show the split. The teaching trace issues positive-path operations before negative-path operations; these are not two simultaneous execution pipelines. The final join is a control-flow point, not a block barrier.')}`;
}
function banks(r,step){
  const busiest=r.banks.reduce((a,b)=>b.words.length>a.words.length?b:a,r.banks[0]);
  const serving=step.served.find(s=>s.bank===busiest.id);
  const visibleWords=[...new Set([...busiest.words.slice(0,8),...(serving?[serving.word]:[])])];
  return `<h3>Follow addresses into banks</h3><div class="request-paths">${r.lanes.slice(0,4).map(l=>`<div class="flow-row">${box(`Lane ${l.id}`,`word ${l.word}`)}${arrow}${box(`Bank ${l.bank}`,`word % 32 = ${l.bank}`)}</div>`).join('')}</div>
  <h4>Distinct-word queue at bank ${busiest.id}</h4><div class="word-queue">${visibleWords.map(word=>{const readers=busiest.requests.filter(q=>q.word===word);return box(`Word ${word}`,`${readers.length} ${readers.length===1?'reader':'readers'}`,serving?.word===word?'selected':'');}).join('')}${busiest.words.length>visibleWords.length?box('Other queued words',`${busiest.words.length-visibleWords.length} omitted`):''}</div>${caption(`This bank has ${busiest.words.length} distinct requested ${busiest.words.length===1?'word':'words'}. One round can serve one of those words to all of its readers. Distinct words queue; repeated reads of one word broadcast. This preview includes the first words and the selected round’s word; other words may be omitted.`)}`;
}
function reduction(r,step){
  if(r.hazard)return `<h3>The missing ordering</h3><div class="flow-row">${box('Thread 0 writes',`shared[0] = ${r.inputs[0]}`)}${arrow}${box('No barrier','Other writers need not have run','hazard-box')}${arrow}${box(`Thread 0 reads shared[${r.size/2}]`,'Still unwritten in the exposed schedule','hazard-box')}</div>${caption('A dependency edge exists from the partner’s write to this read. Removing the barrier removes the required ordering; the model assigns no numeric result to the race.')}`;
  const rows=r.levels.length,height=rows*82;
  const position=node=>(node.threads.reduce((a,b)=>a+b,0)/node.threads.length+0.5)/r.size*100;
  const lines=[],nodes=[];
  r.levels.forEach((level,depth)=>level.forEach(node=>{
    const x=position(node),y=depth*82+24;
    nodes.push(`<div class="tree-node${depth===step.level?' active-level':''}" style="left:${x}%;top:${y}px" title="Inputs ${node.threads.map(i=>i+1).join(' + ')}"><small>${depth===0?`T${node.index}`:`Σ ${node.threads.length}`}</small><strong>${node.value}</strong></div>`);
    if(depth){for(const child of r.levels[depth-1].filter(c=>c.threads.every(i=>node.threads.includes(i))))lines.push(`<line x1="${position(child)}" y1="${((depth-1)*82+46)/height*100}" x2="${x}" y2="${(y-5)/height*100}"/>`);}
  }));
  return `<h3>How the partial sums depend on one another</h3><div class="reduction-tree" style="height:${height}px"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines.join('')}</svg>${nodes.join('')}</div>${caption('Top nodes are input threads. Each edge carries a partial sum to its consumer. Σ labels count the input contributions in that node. The highlighted level matches the selected reduction stage; barriers separate arithmetic levels. Individual initial writes are shown in the memory cells below.')}`;
}
function resources(r){
  const pool=(label,perBlock,total)=>{
    const used=r.residentBlocks*perBlock;
    return `<div class="resource-row"><strong>${label}: ${used} / ${total}</strong><div class="resource-pool" aria-label="${label}: ${used} of ${total}">${Array.from({length:r.residentBlocks},(_,i)=>`<span title="Block ${i}: ${perBlock}" style="width:${perBlock/total*100}%">${perBlock?'':''}</span>`).join('')}</div></div>`;
  };
  return `<h3>The same resident blocks consume three budgets</h3>${pool('Registers',r.registersPerBlock,r.resourceCapacity.registers)}${pool('Shared bytes',r.sharedBytes,r.resourceCapacity.shared)}${pool('Warp slots',1,r.resourceCapacity.warps)}<div class="resident-blocks">${Array.from({length:r.residentBlocks},(_,i)=>box(`Block ${i}`,`${r.tile} × ${r.tile} output tile`)).join('')}</div>${caption('Each coloured segment is one resident block’s allocation. Unfilled capacity is left over; any one budget can prevent another block from fitting. The naive tile-one case uses no shared tiles. These are teaching budgets, not a physical GPU floor plan.')}`;
}
function precision(r,step){
  const formats=[['FP32',8,23],['FP16',5,10],['BF16',8,7]];
  const bits=formats.map(([name,e,f])=>`<div class="format-row"><strong>${name}: ${1+e+f} bits</strong><div class="format-bar" style="width:${(1+e+f)/32*100}%"><span class="sign-bits" style="flex:1" title="1 sign bit"></span><span class="exponent-bits" style="flex:${e}" title="${e} exponent bits"></span><span class="fraction-bits" style="flex:${f}" title="${f} fraction bits"></span></div><small>1 sign · ${e} exponent · ${f} fraction</small></div>`).join('');
  let rounding;
  if(step.input===step.converted)rounding=`<div class="flow-row">${box('FP32 input',number(step.input))}${arrow}${box(r.format.toUpperCase(),number(step.converted),'selected')}${arrow}${box('Conversion difference','0 — exactly representable')}</div>`;
  else{
    const fraction=r.format==='fp16'?10:r.format==='bf16'?7:23,minExponent=r.format==='fp16'?-14:-126;
    const spacing=2**(Math.max(minExponent,Math.floor(Math.log2(Math.abs(step.input))))-fraction);
    const lower=Math.floor(step.input/spacing)*spacing,upper=lower+spacing;
    const proportion=Math.max(0,Math.min(100,(step.input-lower)/spacing*100));
    rounding=`<div class="rounding-ruler"><div class="ruler-ends"><span>${number(lower)}</span><span>${number(upper)}</span></div><div class="ruler-track"><span class="input-marker" style="left:${proportion}%" title="FP32 input ${step.input}">▼</span></div><p>Input ${number(step.input)} rounds to <strong>${number(step.converted)}</strong>.<br>Distance between these representable neighbours: ${number(spacing)}.</p></div>`;
  }
  return `<h3>Range and precision use different parts of the format</h3>${caption('The sign chooses positive or negative. The exponent sets scale; fraction bits distinguish nearby values. Bars share the same bit scale. This explains the format budget, not the physical layout of tensor-core hardware.')}<div class="format-comparison">${bits}</div><div class="bit-legend"><span>■ sign</span><span>▧ exponent</span><span>▤ fraction</span></div><h4>The selected input’s conversion</h4>${rounding}${caption('The ruler compares adjacent representable values near the selected input, before accumulation. Subnormal values use the format’s minimum spacing. An exact input needs no rounding.')}`;
}
function attentionFlow(r,step){
  const dense=`<div class="attention-route${r.mode==='materialised'?' active-route':''}"><h4>Materialised</h4>${box('Q × Kᵀ / √d','Scores')}<div class="matrix-footprint" style="--grid:${r.n}">${r.n} × ${r.n}<br>scores</div><div class="down-arrow">↓ softmax</div><div class="matrix-footprint" style="--grid:${r.n}">${r.n} × ${r.n}<br>probabilities</div><div class="down-arrow">↓ multiply by V</div>${box('Output',`${r.n} × ${r.d}`)}<p>${r.intermediateComparison.materialisedWrites} intermediate values written;<br>${r.intermediateComparison.materialisedBytes} read/write bytes.</p></div>`;
  const online=`<div class="attention-route${r.mode==='online'?' active-route':''}"><h4>Online tiled</h4>${box('One query + K/V tile',`${r.tile} keys at a time`)}<div class="down-arrow">↓ score tile</div>${box('Update running state','m, l and weighted-value accumulator')}<div class="loop-arrow">↺ repeat for remaining key tiles</div><div class="down-arrow">↓ divide accumulator by l</div>${box('Output',`${r.n} × ${r.d} across all queries`)}<p>${r.intermediateComparison.onlineWrites} full-matrix intermediate values written.</p></div>`;
  const recurrence=r.mode==='online'?`<h4>This tile’s normalisation update</h4><div class="flow-row">${box('Previous denominator',number(step.previous.l))}${arrow}${box('Rescale old state',`× ${number(step.rescale)}`)}${arrow}${box('Add this tile',`+ ${number(step.tileDenominator)}`)}${arrow}${box('New denominator',number(step.l),'selected')}</div><div class="flow-row">${box('Previous numerator[0]',number(step.previous.acc[0]))}${arrow}${box('Same rescale',`× ${number(step.rescale)}`)}${arrow}${box('Add weighted values',`+ ${number(step.tileNumerator0)}`)}${arrow}${box('New numerator[0]',number(step.acc[0]),'selected')}</div>${caption(`Both use the same new maximum ${number(step.m)}. Output component zero is numerator ${number(step.acc[0])} / denominator ${number(step.l)} = ${number(step.output[0])}.`)}`:'';
  return `<h3>Where the full intermediate matrices go</h3><div class="attention-comparison">${dense}${online}</div>${caption('The diagrams compare algorithms and intermediate storage, not concurrent pipelines or a complete HBM traffic account. The selected algorithm has an outlined route.')}${recurrence}`;
}
function inferenceFlow(r){
  const visible=Math.min(4,r.batch);
  const lanes=Array.from({length:visible},(_,i)=>`<div class="sequence-lane"><strong>Sequence ${i}</strong><div class="token-group">${Array.from({length:4},(_,t)=>`<span class="token${r.phase==='prefill'?' new-token':''}">${t+1}</span>`).join('')}<span>… ${r.sequence} ${r.phase==='decode'?'cached':'prompt'} tokens</span>${r.phase==='decode'?'<span class="token new-token">new</span>':''}</div></div>`).join('');
  return `<h3>Batch, token phase and cache growth</h3><div class="sequence-lanes">${lanes}${r.batch>visible?`<p>+ ${r.batch-visible} more sequences in this batch</p>`:''}</div><div class="flow-row">${box('Before this invocation',`${number(r.cacheTokensBefore)} cached tokens per sequence`)}${arrow}${box(r.phase==='decode'?'Decode one new token per sequence':'Process all prompt tokens',`${r.tokens.toLocaleString('en-GB')} tokens processed across the batch`,'selected')}${arrow}${box('After this invocation',`${number(r.cacheTokensAfter)} cached tokens per sequence`)}</div><div class="flow-row">${box('Weight read',`${number(r.weightBytes)} bytes once per invocation`)}${arrow}${box('Ideal batch reuse',`${r.batch} sequences share that weight read`)}</div>${caption(`Cache entries contain K and V across ${r.layers} layers, KV width ${r.kvWidth}, at two bytes per value. This invocation reads ${number(r.kvReadBytes)} cache bytes and writes ${number(r.kvWriteBytes)} cache bytes. Token boxes are a small schematic of each sequence; ellipses stand for the omitted positions. Cache lengths and counts are computed from the selected phase and context.`)}`;
}
export function mechanismVisual(kind,result,step){
  const renderers={scheduling,divergence,'shared-memory':banks,reduction,matmul:resources,'tensor-cores':precision,attention:attentionFlow,inference:inferenceFlow};
  const renderer=renderers[kind];return renderer?`<section class="mechanism-visual" data-visual="${kind}" aria-label="${kind} mechanism diagram">${renderer(result,step)}</section>`:'';
}
