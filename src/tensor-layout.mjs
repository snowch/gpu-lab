// Copyright © 2026 Christopher Snow.
export function tensorStep({row=0,col=0,direction='row'}={}) {
  if(!Number.isInteger(row)||row<0||row>30||!Number.isInteger(col)||col<0||col>6||!['row','column'].includes(direction))throw new RangeError('Choose a starting row 0–30, column 0–6, and row/column direction.');
  const start=row*8+col,delta=direction==='row'?8:1,end=start+delta;
  const firstRow=Math.min(row,28);
  return {row,col,direction,start,end,delta,byteDelta:delta*4,
    targetRow:row+Number(direction==='row'),targetCol:col+Number(direction==='column'),
    cells:Array.from({length:32},(_,i)=>{const r=firstRow+Math.floor(i/8),c=i%8;return {row:r,col:c,index:r*8+c};}),
    storage:Array.from({length:9},(_,i)=>({index:start+i,byte:(start+i)*4})),firstRow};
}
export function renderTensorStep(config) {
  const s=tensorStep(config);
  const state=index=>index===s.start?' origin':index===s.end?' destination':'';
  return `<div class="tensor-diagrams">
    <div><h3>Tensor view: 32 rows × 8 columns</h3><p class="tensor-caption">Showing rows ${s.firstRow}–${s.firstRow+3}; each cell shows x[row, column].</p>
      <div class="tensor-grid">${s.cells.map(c=>`<span class="tensor-cell${state(c.index)}" aria-label="x[${c.row}, ${c.col}] = ${c.index}${c.index===s.start?', start':c.index===s.end?', destination':''}">${c.index}</span>`).join('')}</div>
      <p class="tensor-axis">← 8 columns across · 32 rows down ↓</p></div>
    <div><h3>The same values in storage order</h3><p class="tensor-caption">A window starting at element ${s.start}. Neighbouring boxes are neighbouring stored elements.</p>
      <div class="storage-strip">${s.storage.map(c=>`<span class="storage-cell${state(c.index)}${c.index>s.start&&c.index<s.end?' crossed':''}"><strong>${c.index}</strong><span>${c.byte} B</span></span>`).join('')}</div>
      <p class="stride-arrow">${s.start} → ${s.end}<br><strong>+${s.delta} ${s.delta===1?'element':'elements'} = +${s.byteDelta} bytes</strong></p>
      <p class="tensor-caption">Top number: element offset and value in this <code>arange</code> example. Bottom: byte offset from x’s storage base.</p></div>
    </div><p id="tensor-step-summary" class="tensor-summary" role="status">x[${s.row}, ${s.col}] → x[${s.targetRow}, ${s.targetCol}]: increase the ${s.direction} index by one. Storage offset ${s.start} → ${s.end}; ${s.delta} ${s.delta===1?'element':'elements'} × 4 bytes = ${s.byteDelta} bytes.</p>`;
}

export function tensorSlice(mode='column') {
  if(!['row','column','packed'].includes(mode))throw new RangeError('Choose row, column or packed.');
  const length=mode==='row'?8:32;
  const sourceStride=mode==='row'?1:8;
  const offsets=Array.from({length},(_,i)=>i*sourceStride);
  return {mode,length,sourceStride,stride:mode==='packed'?1:sourceStride,sharesStorage:mode!=='packed',
    offsets,values:[...offsets],destinationOffsets:Array.from({length},(_,i)=>mode==='packed'?i:offsets[i])};
}
export function renderTensorSlice(mode='column') {
  const s=tensorSlice(mode);
  const slots=(offsets,title)=>`<div class="slice-storage"><h4>${title}</h4><div class="slice-slots">${s.values.slice(0,4).map((value,i)=>`<div class="slice-slot"><strong>${value}</strong><span>slot ${offsets[i]}</span>${i<3?`<small>next: +${offsets[i+1]-offsets[i]}</small>`:''}</div>`).join('')}</div><p>First four reads shown; ${s.length} values in the complete slice.</p></div>`;
  return `<div class="slice-diagram"><div><h3>x: original storage</h3><div class="tensor-grid">${Array.from({length:32},(_,i)=>`<span class="tensor-cell${s.offsets.includes(i)?' destination':''}">${i}</span>`).join('')}</div><p class="tensor-caption">First four rows of x. Highlighted values belong to the selected slice.</p></div>
  <div><h3>${mode==='row'?'x[0, :]':mode==='column'?'x[:, 0]':'x[:, 0].contiguous()'}</h3>${slots(s.offsets,mode==='packed'?'Read from x’s original slots':'View points into x’s same storage')}${mode==='packed'?'<p class="slice-copy-arrow">↓ allocate new storage and copy values ↓</p>'+slots(s.destinationOffsets,'Packed copy: different storage, same values'):''}
  <p class="tensor-summary">${s.sharesStorage?'Storage is shared: no values are copied to make this view.':'Storage is separate: the strided column is copied.'} The resulting slice has stride ${s.stride}.</p></div></div>`;
}
