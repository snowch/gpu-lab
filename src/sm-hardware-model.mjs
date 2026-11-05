// Copyright © 2026 Christopher Snow.
// A functional worked sequence. Events have no duration or throughput meaning.
export const smEvents=[
  {title:'Before the loads',warp:null,kind:'start',text:'Both warps can start their load. The inputs are in GPU memory; their working registers have no loaded values yet.'},
  {title:'Request Warp A’s inputs',warp:0,kind:'request',text:'The scheduler selects Warp A’s load. Load/store hardware requests its inputs. A’s multiply must wait for those values.'},
  {title:'Warp A’s inputs arrive',warp:0,kind:'arrive',text:'The loaded values enter the registers belonging to Warp A’s threads. Its multiply is now ready.'},
  {title:'Request Warp B’s inputs',warp:1,kind:'request',text:'The scheduler selects Warp B’s load. B waits for its inputs; A still has loaded operands and can multiply.'},
  {title:'Multiply for Warp A',warp:0,kind:'multiply',text:'The scheduler selects A’s ready multiply. Arithmetic units read A’s operands from registers and return results to its registers, while B is waiting.'},
  {title:'Write Warp A’s results',warp:0,kind:'store',text:'Load/store hardware writes A’s result values from registers to the output array in GPU memory. B’s load is still pending in this chosen sequence.'},
  {title:'Warp B’s inputs arrive',warp:1,kind:'arrive',text:'B’s loaded values enter its threads’ registers. Its multiply is now ready.'},
  {title:'Reuse the arithmetic units for Warp B',warp:1,kind:'multiply',text:'The same shared arithmetic hardware now uses B’s register operands. A’s values remain in A’s registers; the threads do not own separate arithmetic units.'},
  {title:'Write Warp B’s results',warp:1,kind:'store',text:'Load/store hardware writes B’s results to the output array. Both warps have completed the multiplication in this worked sequence.'},
];
export function smFrame(cursor=0){
  if(!Number.isInteger(cursor)||cursor<0||cursor>=smEvents.length)throw new RangeError('Unknown SM event');
  const warps=[0,1].map(id=>({name:id===0?'A':'B',input:Array.from({length:32},(_,lane)=>id*32+lane+1),loaded:null,result:null,output:null,status:'Ready to load'}));
  let arithmetic=null;
  for(const event of smEvents.slice(1,cursor+1)){
    const warp=warps[event.warp];
    if(event.kind==='request')warp.status='Waiting for input';
    if(event.kind==='arrive'){warp.loaded=[...warp.input];warp.status='Ready to multiply';}
    if(event.kind==='multiply'){
      if(!warp.loaded)throw new Error('Multiply needs loaded operands');
      warp.result=warp.loaded.map(x=>Math.fround(x*2));warp.status='Ready to store';
      arithmetic={warp:warp.name,input:[...warp.loaded],result:[...warp.result]};
    }
    if(event.kind==='store'){
      if(!warp.result)throw new Error('Store needs a result');
      warp.output=[...warp.result];warp.status='Complete';
    }
  }
  return {cursor,event:smEvents[cursor],warps,arithmetic};
}
