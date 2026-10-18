// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import {scheduleWarps,branchWarp,sharedBanks} from '../src/architecture.mjs';
import {tiledMatmul,precisionMatmul,attention,inferenceBudget,reduceBlock} from '../src/ai-models.mjs';
import {mechanismVisual} from '../src/mechanism-visuals.mjs';
import {tensorSlice} from '../src/tensor-layout.mjs';

test('storage views preserve offsets while a packed copy preserves values at new offsets',()=>{
  const row=tensorSlice('row'),column=tensorSlice('column'),packed=tensorSlice('packed');
  assert.equal(row.sharesStorage,true);assert.equal(column.sharesStorage,true);assert.equal(packed.sharesStorage,false);
  assert.equal(row.stride,1);assert.equal(column.stride,8);assert.equal(packed.stride,1);
  assert.deepEqual(column.values,packed.values);
  for(let i=0;i<32;i++){assert.equal(column.destinationOffsets[i],i*8);assert.equal(packed.destinationOffsets[i],i);}
});
test('each reduction dependency level partitions the inputs and sums exactly those contributions',()=>{
  for(const size of [4,8]){
    const r=reduceBlock({size});
    for(const level of r.levels){
      assert.deepEqual(level.flatMap(node=>node.threads).sort((a,b)=>a-b),Array.from({length:size},(_,i)=>i));
      for(const node of level)assert.equal(node.value,node.threads.reduce((sum,i)=>sum+r.inputs[i],0));
    }
    assert.equal(r.levels.at(-1)[0].value,r.result);
    assert.equal(r.trace.at(-1).level,r.levels.length-1);
  }
});
test('attention diagram terms are the actual recurrence operands, not reconstructed labels',()=>{
  for(const n of [8,16,32])for(const scale of [1,1000]){
    const r=attention({n,scale});let previousL=0;
    for(const step of r.trace){
      assert.equal(step.previous.l,previousL);
      assert.equal(step.l,step.previous.l*step.rescale+step.tileDenominator);
      assert.equal(step.acc[0],step.previous.acc[0]*step.rescale+step.tileNumerator0);
      assert.equal(step.output[0],step.acc[0]/step.l);previousL=step.l;
    }
  }
});
test('cache growth distinguishes an empty prefill cache from an existing decode cache',()=>{
  for(const sequence of [128,512,2048]){
    const decode=inferenceBudget({sequence}),prefill=inferenceBudget({sequence,phase:'prefill'});
    assert.equal(decode.cacheTokensAfter-decode.cacheTokensBefore,1);
    assert.equal(prefill.cacheTokensBefore,0);assert.equal(prefill.cacheTokensAfter,sequence);
    assert.equal(decode.kvWriteBytes,2*decode.layers*decode.batch*decode.kvWidth*2);
  }
});
test('every mechanism diagram renders from trace state, including edge configurations',()=>{
  const cases=[['scheduling',scheduleWarps({warps:8,latency:12})],['divergence',branchWarp()],['shared-memory',sharedBanks()],['shared-memory',sharedBanks({broadcast:true})],['matmul',tiledMatmul()],['reduction',reduceBlock()],['reduction',reduceBlock({synchronised:false})],['attention',attention()],['attention',attention({mode:'materialised'})],['inference',inferenceBudget()],['inference',inferenceBudget({phase:'prefill',batch:16})]];
  for(const format of ['fp32','fp16','bf16'])for(const pattern of ['cancellation','small','exact'])cases.push(['tensor-cores',precisionMatmul({format,pattern})]);
  for(const [kind,r] of cases)for(const step of r.trace){
    const html=mechanismVisual(kind,r,step);
    assert.ok(html.includes(`data-visual="${kind}"`));assert.doesNotMatch(html,/NaN|undefined/);
  }
  const bank=sharedBanks();assert.match(mechanismVisual('shared-memory',bank,bank.trace[20]),/Word 640/);
});
