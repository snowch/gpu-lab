// Copyright © 2026 Christopher Snow.
import {attention, inferenceBudget} from './ai-models.mjs';
import {escape, fmt, metrics, table} from './continuation-ui.mjs';

const attentionCode = ({n = 8, scale = 1} = {}) => `import torch

n, d = ${n}, 4
q = torch.tensor([[(i + j) % 5 - 2 for j in range(d)]
                  for i in range(n)], dtype=torch.float32, device="cuda") * ${scale}
k = torch.tensor([[((2 * i + j) % 7 - 3) / 2 for j in range(d)]
                  for i in range(n)], dtype=torch.float32, device="cuda")
v = torch.tensor([[(i + j) % 9 - 4 for j in range(d)]
                  for i in range(n)], dtype=torch.float32, device="cuda")
scores = q @ k.T / d**0.5
weights = torch.softmax(scores, dim=-1)
out = weights @ v
print(out[0])`;

const cacheCode = `import torch
import torch.nn.functional as F

# Three cached tokens, each with four components.
k_cache = torch.arange(12, dtype=torch.float32, device="cuda").reshape(3, 4) / 10
v_cache = torch.arange(12, dtype=torch.float32, device="cuda").reshape(3, 4)
q_new = torch.tensor([[1., 0., -1., 0.]], dtype=torch.float32, device="cuda")
k_new = torch.tensor([[0.2, 0.3, 0.4, 0.5]], dtype=torch.float32, device="cuda")
v_new = torch.tensor([[12., 13., 14., 15.]], dtype=torch.float32, device="cuda")
k_cache = torch.cat((k_cache, k_new), dim=-2)
v_cache = torch.cat((v_cache, v_new), dim=-2)
out = F.scaled_dot_product_attention(
    q_new, k_cache, v_cache, dropout_p=0.0, is_causal=False)
print(k_cache.shape, out)`;

const attentionDefaults = {n:8, tile:2, mode:'materialised', scale:1};
const inferenceDefaults = {phase:'decode', batch:1, sequence:512, parameters:7, bandwidth:1000, compute:100, measuredMs:0};
const sequenceControl = {key:'sequence', label:'Cached tokens per sequence before decode', options:[[128,'128 tokens'],[512,'512 tokens'],[2048,'2,048 tokens']]};
const cacheAssumptions = `<p>The synthetic decoder stores keys and values for <strong>32 layers</strong>, with <strong>1,024 components</strong> in each key or value and <strong>two bytes</strong> per component. A layer is one stage of the model. These are teaching dimensions; the opening code uses one set of four-component values.</p>`;
const budgetAssumptions = `<p>This <strong>synthetic budget</strong> assumes 7 billion learned weight values (parameters), 32 layers, hidden width 4,096, KV width 1,024 and two bytes per stored value. Hidden width sizes the model’s internal vectors in the operation estimate; KV width is the number of cached key or value components per token per layer. It is not the shape of a named model. One invocation reads the 14 GB weight payload once, with ideal reuse across its batch. Activations, communication, intermediate tensors, allocation, cache-copy costs and other overheads are excluded.</p>`;
const rateAssumptions = `<p>The selected ideal rates are <strong>1,000 decimal GB/s</strong> (10<sup>12</sup> bytes/s) and <strong>100 TFLOP/s</strong> (10<sup>14</sup> floating-point operations/s). These are teaching inputs, not measured specifications. Divide counted bytes by bandwidth and counted operations by compute rate; take the larger time assuming ideal overlap. Real elapsed time needs a measurement with a matching scope.</p>`;

const transferAttention = attention({n:16,tile:4});
const transferCacheA = inferenceBudget({batch:4,sequence:128});
const transferCacheB = inferenceBudget({batch:1,sequence:512});

export const chapters = [
  {
    slug:'attention', number:11, title:'How can attention store less?',
    lead:'How can attention combine the same values without storing two full intermediate matrices?',
    source:attentionCode(),
    openingHTML:`<p>Each row of <code>q</code> is a <strong>query</strong>: what one token looks for. Each row of <code>k</code> is a <strong>key</strong>: what another token offers for comparison. The matching row of <code>v</code> is its <strong>value</strong>: the numbers to combine. Here each has eight rows of four numbers.</p><p><code>k.T</code> transposes K, making each key row a column. <code>q @ k.T</code> then compares every query with every key. Dividing by √4 scales the scores. <code>dim=-1</code> selects the last dimension, so <code>softmax(..., dim=-1)</code> turns each score row into non-negative weights summing to one; <code>weights @ v</code> forms a weighted sum of value rows. <code>out[0]</code> is the four-number result for query zero. There is no masking or dropout in this example.</p><p>You choose the tensors and operations. PyTorch selects implementations, allocates results and launches GPU work if the tensors are on a CUDA device. This complete opening puts its tensors on an NVIDIA GPU with <code>device="cuda"</code>. The browser computes the same mathematical example in JavaScript double precision; the PyTorch code uses FP32, so small numerical differences are expected.</p>`,
    sections:[
      {
        id:'attention-weighted', title:'Follow one weighted result',
        body:`<p>Start with query zero. A high score gives a key more weight, but the output still combines its value with the others. The table shows how the score row becomes weights. Each output component adds those weights multiplied by the corresponding component of every value row; the four-component result is shown beside it.</p><p>Run, then step from scores to weights to the result. Increasing the query multiplier multiplies all scores in this example. It makes the largest-score keys more influential; tied largest scores can share the weight.</p>`,
        terms:[['Score','A query–key dot product divided by the square root of their width.'],['Softmax','A conversion from scores to non-negative weights that sum to one along a chosen dimension.']],
        task:'Predict whether the weights sum to one. Run and follow the three steps. Change only the query multiplier to 1,000: which keys now supply almost all the result, and why are there two?',
        experiment:{model:'attention',defaults:attentionDefaults,focus:'attention-weighted',controls:[{key:'scale',label:'Query multiplier',options:[[1,'1 × query values'],[1000,'1,000 × query values']]}],code:attentionCode},
        after:`<p>Softmax is evaluated stably by subtracting the largest score before exponentiating. This preserves the normalised weights and avoids exponentiating a large positive score. Larger scores do not make the weighted result grow by the same multiplier.</p>`,
      },
      {
        id:'attention-storage', title:'Count the matrices between input and output',
        body:`<p>The straightforward expression stores an N × N score matrix and an N × N weight matrix. For each matrix this accounting counts one write and one later read. It assumes <strong>four-byte FP32 storage</strong>, even though browser arithmetic uses JavaScript doubles.</p><p>The two matrices therefore account for 4N² value transfers × 4 bytes = 16N² bytes. These are selected intermediate reads and writes, excluding Q, K, V, output, caching and all other traffic. They are not measured DRAM transfers.</p>`,
        terms:[['Materialised intermediate','A temporary result stored in full so that a later operation can read it.']],
        task:'Predict what doubling N from 8 to 16 does to the intermediate byte count. Run at 8, change only N to 16, and explain the factor using rows and columns.',
        experiment:{model:'attention',defaults:attentionDefaults,focus:'attention-storage',trace:false,controls:[{key:'n',label:'Queries and keys (N)',options:[[8,'8 × 8'],[16,'16 × 16'],[32,'32 × 32']]}],code:attentionCode},
      },
      {
        id:'attention-online', title:'Combine one key tile at a time',
        body:`<p>We can visit a few keys at a time, combine their contribution, then move to the next group. Keep a running weighted total and a normalisation total instead of writing full score and weight matrices. When a larger score arrives, earlier weights need a new common scale. Multiply both previous totals by the same factor before adding the new tile’s contributions. Their ratio is preserved. The result below shows these additions for output component zero.</p><p>The current output estimate uses only the keys visited so far. It need not equal the final answer until every key has been included. The final result below compares all queries against the full-matrix reference.</p><p>This experiment fixes N = 8 and width = 4. Its single-query scratch budget is <strong>tile width + 4 + 2 floats</strong>: one tile of scores, four accumulated output components and two normalisation scalars. It excludes inputs, output, tile rereads and the browser's own arrays and trace. It is not a production kernel's allocation or a total memory-traffic estimate.</p>`,
        terms:[['Online softmax','A running normalisation that updates when another group of scores arrives, without keeping the complete score row.'],['Normalisation total','The sum of unnormalised weights; divide the weighted-value total by this sum to obtain the output.'],['Scratch storage','Temporary space used while calculating a result. This experiment counts the state needed for one query.']],
        task:'Predict whether changing the key tile from 2 to 4 changes the final result or only the intermediate steps and scratch budget. Run, step to the last tile, then change only tile width and compare.',
        experiment:{model:'attention',defaults:{...attentionDefaults,mode:'online'},focus:'attention-online',controls:[{key:'tile',label:'Keys per tile',options:[[2,'2 keys'],[4,'4 keys'],[8,'8 keys']]}]},
        after:`<p>No full score/weight matrices are written in the online algorithm's accounting. That removes the selected intermediate transfers from the previous experiment; Q, K, V and output still exist. The browser intentionally retains arrays for inspection. This is a small algorithm model, not GPU execution or a reproduction of a production FlashAttention kernel.</p>`,
      },
    ],
    transfer:{prompt:'With 16 queries and keys, width 4 and tiles of 4 keys, how many key tiles does query zero visit? Predict its scratch budget and the materialised intermediate byte count. Does choosing online attention mean no data moves?',answer:`Query zero visits ${transferAttention.trace.length} key tiles. The single-query online scratch budget is ${transferAttention.scratchFloats} floats. Materialising the two matrices accounts for ${fmt(transferAttention.intermediateComparison.materialisedBytes)} read/write bytes, versus ${transferAttention.intermediateBytes} full-matrix intermediate bytes for online attention. Inputs and outputs still move; these counts exclude them and do not predict elapsed time.`},
    optionalHTML:`<details><summary>Optional: inspect the running normalisation</summary><p>Let m be the largest score seen, l the sum of exp(score − m), and a the four-component sum of exp(score − m) × V. For each new tile, choose its combined maximum m′. Multiply the previous l and a by exp(m − m′), then add this tile's contributions expressed relative to m′. The estimate is a / l. Both numerator and denominator change scale together. This avoids storing previous scores. Finite-precision accumulation order can still change low-order digits.</p><p>The tile result shows these quantities only after the weighted-result and storage experiments have introduced their purpose.</p></details>`,
  },
  {
    slug:'inference',number:12,title:'What limits an inference step?',
    lead:'How do a growing cache, the invocation phase and batch size change an inference budget?',
    source:cacheCode,
    openingHTML:`<p>A decoder reuses keys and values from earlier tokens. This complete CUDA-device PyTorch example starts with three cached tokens, appends one new key and value, and computes one new query's weighted result over all four tokens. Each row is one token and each column is one component, as in the previous chapter. <code>reshape(3, 4)</code> arranges twelve numbers into three rows of four. <code>dim=-2</code> selects the first dimension of these two-dimensional tensors, so concatenation appends rows.</p><p><code>F</code> is the short name given to PyTorch’s functional operations by the import. Its <code>scaled_dot_product_attention</code> function performs the score, softmax and weighted-value calculation from the previous chapter. <code>dropout_p=0.0</code> keeps every attention weight. <code>is_causal=False</code> is intentional: the sole query is the newest token, so all four supplied keys are permitted. For a multi-query prompt, a causal mask is needed to hide future tokens. This example receives Q/K/V directly; it contains no model weights, projections or token generator.</p><p><code>torch.cat</code> creates new tensors and copies existing entries. Production caches can instead reserve storage and write new positions. The small code illustrates cache contents, not efficient cache management. PyTorch handles allocation and implementation selection. The browser budgets below use a separate, explicitly synthetic decoder; they do not estimate this four-component PyTorch example.</p>`,
    sections:[
      {
        id:'inference-capacity',title:'Reserve space for past tokens',
        body:`<p>Start with the cache just before one decode invocation. First count storage, without asking about time. The cache payload is <strong>2 × layers × batch × cached tokens × KV width × bytes/value</strong>. The first factor of two stores both keys and values.</p>${cacheAssumptions}<p>Here batch stays at one. The selected token count S is the cache length <em>before</em> a decode invocation; the invocation appends one entry per sequence. Payload capacity excludes any reserved unused slots and allocator metadata.</p>`,
        terms:[['KV cache','Stored keys and values from earlier tokens, reused by later attention queries.'],['Decode','Processing one new token per sequence while reusing earlier cache entries.'],['Batch','Independent sequences processed together.'],['Invocation','One execution of the work being counted: a whole prompt or one decode step for each sequence.']],
        task:'Predict the cache payload when the cached length changes from 512 to 2,048 tokens. Run at 512, change only the length, and explain the factor. Distinguish the existing payload from the new bytes appended.',
        experiment:{model:'inference',defaults:inferenceDefaults,focus:'inference-capacity',trace:false,controls:[sequenceControl]},
      },
      {
        id:'inference-phase',title:'Compare two invocation phases',
        body:`<p>Now keep batch = 1 and S = 512. For prefill, S means the number of prompt tokens processed from an empty cache. For decode, S means the number already cached, followed by one new token. These invocations do different amounts of work.</p>${budgetAssumptions}<p>Decode reads the S-token cache and writes one new entry per sequence. Prefill writes the full S-token cache; this model counts no previous-cache read. The prefill operation estimate uses full square attention, without causal triangular savings. Dense-weight work is approximately 2 × parameters × tokens; attention adds 4 × layers × batch × S × hidden width for decode, and another factor S for prefill.</p>${rateAssumptions}`,
        terms:[['Prefill','Processing the prompt tokens and building their cache entries.'],['Lower bound','An ideal minimum implied by the counted work and assumed rate; it is not a prediction of measured elapsed time.'],['FLOP','One floating-point arithmetic operation in the work estimate.']],
        task:'Predict which bound is larger for decode, then run. Change only phase to prefill. Explain why the compute work changes even though the model reads the same weight payload per invocation.',
        experiment:{model:'inference',defaults:inferenceDefaults,focus:'inference-phase',controls:[{key:'phase',label:'Invocation phase',options:[['decode','Decode: 1 new token after 512 cached'],['prefill','Prefill: 512 prompt tokens']]}]},
        after:`<p>The larger lower bound identifies the tighter of these two ideal budgets. It does not diagnose an actual GPU bottleneck. This page supplies no timing measurements; uncounted work and implementation details need separate investigation.</p>`,
      },
      {
        id:'inference-batch',title:'Share a weight read across a batch',
        body:`<p>Return to decode with S = 512 cached tokens per sequence. Increasing batch produces more tokens per invocation. The ideal budget reuses each weight read across the whole batch, while each sequence needs its own cache.</p>${budgetAssumptions}${rateAssumptions}<p>Compare both milliseconds per invocation and the bound divided by the number of new tokens. The latter is a budget per produced token, not a user's time to receive the next token. More batch members also need more cache capacity.</p>`,
        task:'Predict which grows with batch: weight payload read, KV cache, or new tokens. Run at batch 1, change only batch to 4, and compare the invocation bound with the bound per new token. Explain the ideal reuse assumption.',
        experiment:{model:'inference',defaults:inferenceDefaults,focus:'inference-batch',trace:false,controls:[{key:'batch',label:'Independent sequences in this decode invocation',options:[[1,'1 sequence'],[4,'4 sequences'],[16,'16 sequences']]}]},
      },
    ],
    transfer:{prompt:'Compare a cache for batch 4 with 128 tokens per sequence against batch 1 with 512 tokens per sequence, keeping layers, width and value size fixed. Which needs more cache payload? Does equal cache payload imply equal per-token work or measured latency?',answer:`Both cache payloads are ${fmt(transferCacheA.kvCacheBytes)} bytes: batch × sequence length is 512 in each (${fmt(transferCacheB.kvCacheBytes)} bytes for the second case). Decode produces ${transferCacheA.tokens} new tokens in the first invocation and ${transferCacheB.tokens} in the second. Weight reuse and per-token accounting differ. Equal cache capacity alone does not establish equal work per token or measured latency.`},
    optionalHTML:`<details><summary>Optional: plan a real timing comparison</summary><p>Use a real model and document its shapes, datatype, batch, context, attention implementation and cache allocation strategy. Choose whether timing covers one invocation or the whole request. Warm up, account for asynchronous CUDA execution, synchronise the chosen interval, and repeat measurements. A result below this page's bound would first require checking units, counted work, assumed rates and timing scope. The browser exercises run no PyTorch or GPU benchmark.</p></details>`,
  },
];

const vector = values => values.map(fmt).join(', ');
const card = (label, value, selected=false) => `<div class="continuation-card${selected?' selected':''}"><strong>${escape(label)}</strong><p>${escape(value)}</p></div>`;
const stepFor = (result,cursor) => result.trace[Math.max(0,Math.min(result.trace.length-1,Number.isFinite(cursor)?cursor:0))];

function renderAttention(result,cursor,focus) {
  const step=stepFor(result,cursor);
  if(focus==='attention-weighted'||(!focus&&result.mode==='materialised')) {
    return `<div class="continuation-visual"><div class="continuation-cards">${card('Scores',vector(result.scores[0]),cursor===0)}${card('Softmax weights',vector(result.probabilities[0]),cursor===1)}${card('Weighted result: query 0',vector(result.output[0]),cursor===2)}</div>${table(['Key index','Score','Weight','Value component 0','Weight × value'],result.probabilities[0].map((p,i)=>[i,fmt(result.scores[0][i]),fmt(p),fmt(result.v[i][0]),fmt(p*result.v[i][0])]),'Add the final column to obtain output component out[0,0]; displayed numbers are rounded.')}${metrics([['Sum of query-0 weights',fmt(result.probabilities[0].reduce((a,b)=>a+b,0))],['out[0, 0]',fmt(result.output[0][0])]])}<p>Selected phase: ${escape(step.label)}. Each score compares query zero with one key; the same weight combines all four components of that key’s value.</p></div>`;
  }
  if(focus==='attention-storage') {
    return `<div class="continuation-visual"><div class="continuation-cards">${card('Score matrix',`${result.n} × ${result.n} = ${result.n*result.n} values`)}${card('Weight matrix',`${result.n} × ${result.n} = ${result.n*result.n} values`)}${card('Output (excluded from intermediate count)',`${result.n} × ${result.d} values`)}</div>${table(['Counted intermediate','Values written','Values read','Bytes at 4/value'],[['Scores',result.n*result.n,result.n*result.n,8*result.n*result.n],['Weights',result.n*result.n,result.n*result.n,8*result.n*result.n]],'One write and one read for each of the two N × N matrices')}${metrics([['Full-matrix values written',fmt(result.intermediateWrites)],['Intermediate reads + writes',`${fmt(result.intermediateBytes)} bytes`]])}<p>These totals describe the complete calculation. Counts exclude inputs, output and hardware cache effects; they are not a timing result.</p></div>`;
  }
  return `<div class="continuation-visual"><div class="continuation-cards">${card('Keys in this tile',`${step.start}–${step.start+step.block.length-1}`)}${card('Keys included so far',`${step.start+step.block.length} / ${result.n}`)}${card('Current query-0 estimate',vector(step.output))}${card('Final query-0 result',vector(result.output[0]))}</div>${table(['Key index','Score in this tile'],step.block.map((score,i)=>[step.start+i,fmt(score)]),'Only this group of scores is needed for the next update')}${metrics([['Key tiles per query',fmt(result.n/result.tile)],['Single-query algorithm scratch',`${result.scratchFloats} floats (${result.scratchFloats*4} FP32 bytes)`],['Full-matrix intermediate traffic',`${fmt(result.intermediateBytes)} bytes`],['Maximum final difference from reference',fmt(result.maxError)]])}<h3>Update the running totals</h3><p>The previous totals use the old largest score. Multiply both by ${fmt(step.rescale)} to put them on the current scale, then add this tile’s contributions.</p>${table(['Running quantity','Previous × scale','Tile contribution','New total'],[['Normalisation total',`${fmt(step.previous.l)} × ${fmt(step.rescale)}`,fmt(step.tileDenominator),fmt(step.l)],['Weighted total, component 0',`${fmt(step.previous.acc[0])} × ${fmt(step.rescale)}`,fmt(step.tileNumerator0),fmt(step.acc[0])]])}<p>Current output component zero = ${fmt(step.acc[0])} / ${fmt(step.l)} = ${fmt(step.output[0])}. The totals use JavaScript doubles; displayed numbers are rounded and the scratch byte count assumes FP32 storage.</p><p>All ${result.n} query results are compared with the materialised reference. A tiny difference reflects finite-precision operation order; it is not a GPU error measurement.</p></div>`;
}

function renderInference(result,cursor,focus) {
  const step=stepFor(result,cursor);
  if(focus==='inference-capacity') {
    const afterBytes=2*result.layers*result.batch*result.cacheTokensAfter*result.kvWidth*2;
    return `<div class="continuation-visual"><div class="continuation-cards">${card('Before decode',`${result.cacheTokensBefore} cached tokens per sequence`)}${card('Append',`${result.cacheTokensAfter-result.cacheTokensBefore} token per sequence`)}${card('After decode',`${result.cacheTokensAfter} cached tokens per sequence`)}</div>${metrics([['Existing KV payload',`${fmt(result.kvCacheBytes)} bytes`],['New KV bytes written',`${fmt(result.kvWriteBytes)} bytes`],['KV payload after append',`${fmt(afterBytes)} bytes`]])}<p>2 × ${result.layers} layers × ${result.batch} sequence × ${result.sequence} tokens × ${result.kvWidth} KV components × 2 bytes = ${fmt(result.kvCacheBytes)} existing bytes. This is payload capacity, excluding spare allocation.</p><p class="muted">Capacity is a storage question; the separate phase experiment introduces time bounds.</p></div>`;
  }
  const timing=metrics([['Memory lower bound',`${fmt(result.memoryMs)} ms`],['Compute lower bound',`${fmt(result.computeMs)} ms`],['Invocation lower bound',`${fmt(result.boundMs)} ms`],['Larger ideal bound',result.bottleneck]]);
  const accounting=table(['Counted work per invocation','Amount'],[['Weight reads',`${fmt(result.weightBytes)} bytes`],['Previous KV reads',`${fmt(result.kvReadBytes)} bytes`],['New KV writes',`${fmt(result.kvWriteBytes)} bytes`],['Total counted transfers',`${fmt(result.bytes)} bytes`],['Arithmetic work',`${fmt(result.flops)} FLOPs`]],'Synthetic budget; the three byte terms sum to the counted transfers');
  const selected=`<p>Selected accounting step: <strong>${escape(step.label)}</strong>, ${fmt(step.ms)} ms${step.bytes!==undefined?` from ${fmt(step.bytes)} counted bytes`:step.flops!==undefined?` from ${fmt(step.flops)} counted FLOPs`:''}. Component memory times share the same bandwidth; the final bound takes the larger of total memory time and compute time.</p>`;
  if(focus==='inference-batch') return `<div class="continuation-visual"><div class="continuation-cards">${card('Independent sequences',result.batch)}${card('New tokens this invocation',result.tokens)}${card('Existing KV payload',`${fmt(result.kvCacheBytes)} bytes`)}${card('Ideal bound per new token',`${fmt(result.boundMs/result.tokens)} ms/token`)}</div>${timing}${accounting}<p>Weight bytes stay fixed under ideal batch reuse; cache bytes and arithmetic work scale with batch. The per-token bound is not an individual request’s next-token latency or a measured throughput.</p></div>`;
  return `<div class="continuation-visual"><div class="continuation-cards">${card('Phase',result.phase)}${card('Tokens processed',result.tokens)}${card('Cache length per sequence',`${result.cacheTokensBefore} → ${result.cacheTokensAfter}`)}</div>${timing}${accounting}${selected}<p>At the stated ideal rates, max(${fmt(result.memoryMs)}, ${fmt(result.computeMs)}) = ${fmt(result.boundMs)} ms. This is an analytical lower bound, with no measured time supplied.</p></div>`;
}

export function renderResult(model,result,cursor=0,focus='') {
  if(model==='attention')return renderAttention(result,cursor,focus);
  if(model==='inference')return renderInference(result,cursor,focus);
  return null;
}
