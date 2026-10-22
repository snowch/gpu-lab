// Copyright © 2026 Christopher Snow.
export function strideExample(direction='row') {
  if (!['row','column'].includes(direction)) throw new RangeError('Choose row or column.');
  const start = 0;
  const delta = direction === 'row' ? 8 : 1;
  const end = start + delta;
  return { direction, start, end, delta, byteDelta: delta * 4,
    targetRow: Number(direction === 'row'), targetCol: Number(direction === 'column'),
    gridRows: Array.from({length:3},(_,r)=>Array.from({length:8},(_,c)=>{const index=r*8+c;return {row:r,col:c,index};})),
    storage: Array.from({length:10},(_,i)=>({index:i,byte:i*4})),
  };
}
export function renderStrideExample(direction='row') {
  const s = strideExample(direction);
  const isRow = direction === 'row';
  const label = isRow ? 'move down one row' : 'move right one column';
  const idxLabel = isRow ? 'row index +1' : 'column index +1';
  const state = index => index === s.start ? ' origin' : index === s.end ? ' destination' : '';
  return `<figure class="stride-example" data-direction="${direction}">
    <h4>Example: ${label}</h4>
    <div class="stride-diagrams">
      <div><p class="stride-subtitle">Tensor view: x[row, column]</p>
        <div class="tensor-grid stride-grid">${s.gridRows.map(row=>row.map(c=>`<span class="tensor-cell${state(c.index)}" aria-label="x[${c.row}, ${c.col}] = ${c.index}${c.index===s.start?', start':c.index===s.end?', destination':''}">${c.index}</span>`).join('')).join('')}</div>
        <p class="tensor-axis">… 32 rows in total · 8 columns across →</p></div>
      <div><p class="stride-subtitle">Storage order (row-major)</p>
        <div class="storage-strip stride-strip">${s.storage.map(c=>`<span class="storage-cell${state(c.index)}${c.index>s.start&&c.index<s.end?' crossed':''}"><strong>${c.index}</strong><span>${c.byte}&nbsp;B</span></span>`).join('')}</div>
        <p class="stride-arrow">${s.start} → ${s.end} · <strong>+${s.delta} ${s.delta===1?'element':'elements'} = +${s.byteDelta} bytes</strong></p></div>
    </div>
    <figcaption class="stride-summary">x[0, 0] → x[${s.targetRow}, ${s.targetCol}]: ${idxLabel}. Storage offset ${s.start} → ${s.end}: +${s.delta} ${s.delta===1?'element':'elements'} × 4 bytes = <strong>+${s.byteDelta} bytes</strong>.</figcaption>
  </figure>`;
}

export function viewCopyComparison() {
  const length = 32;
  const columnOffsets = Array.from({length},(_,i)=>i*8);
  const packedOffsets = Array.from({length},(_,i)=>i);
  const gridCells = Array.from({length:32},(_,i)=>({index:i, inColumn:columnOffsets.includes(i)}));
  return `<figure class="view-copy-comparison">
    <h4>Compare: x[:, 0] (view) versus x[:, 0].contiguous() (copy)</h4>
    <div class="view-copy-diagrams">
      <div class="view-copy-panel">
        <p class="stride-subtitle">x: original storage (first 4 rows)</p>
        <div class="tensor-grid stride-grid">${gridCells.map(c=>`<span class="tensor-cell${c.inColumn?' destination':''}" aria-label="x element ${c.index}${c.inColumn?', in column 0':''}">${c.index}</span>`).join('')}</div>
        <p class="tensor-axis">… 32 rows in total · 8 columns across →</p>
      </div>
      <div class="view-copy-panel">
        <p class="stride-subtitle">Column view: x[:, 0] · stride 8 · shares x's storage</p>
        <div class="slice-slots">${columnOffsets.slice(0,4).map((off,i)=>`<div class="slice-slot"><strong>${off}</strong><span>value ${off} at slot ${off}</span>${i<3?'<small>next: +8 elements</small>':''}</div>`).join('')}</div>
        <p class="visual-caption">Values 0, 8, 16, 24 … point into x's existing storage at offsets 0, 8, 16, 24 … No copy is made; the slice is a view with stride 8.</p>
      </div>
      <div class="view-copy-panel">
        <p class="stride-subtitle">Packed copy: x[:, 0].contiguous() · stride 1 · new storage</p>
        <div class="slice-slots">${packedOffsets.slice(0,4).map((off,i)=>`<div class="slice-slot"><strong>${off*8}</strong><span>value ${off*8} at slot ${off}</span>${i<3?'<small>next: +1 element</small>':''}</div>`).join('')}</div>
        <p class="visual-caption">The <em>same values</em> 0, 8, 16, 24 … are copied into new storage at offsets 0, 1, 2, 3 … The copy has stride 1. <code>.contiguous()</code> on an already-contiguous tensor may return the same tensor without copying.</p>
      </div>
    </div>
  </figure>`;
}

export function sectorComparison() {
  return `<figure class="sector-comparison">
    <h4>Model comparison: what a warp reads</h4>
    <p class="visual-caption">This model counts distinct aligned 32-byte sectors touched by one warp's FP32 load. It is <strong>not measured GPU timing</strong>. Each FP32 value is 4 bytes; each sector holds 8 values (32 bytes).</p>
    <div class="sector-compare-grid">
      <div class="sector-compare-panel">
        <p class="stride-subtitle">Row read: 32 lanes, 32 adjacent values</p>
        <div class="sector-mini-strip">${Array.from({length:4},(_,s)=>`<div class="sector-mini"><span class="sector-mini-label">Sector ${s}</span><div class="sector-mini-words">${Array.from({length:8},(_,w)=>`<span class="sector-mini-word used">L${s*8+w}</span>`).join('')}</div></div>`).join('')}</div>
        <p class="sector-result"><strong>4 sectors</strong> · 128 bytes requested · 128 bytes covered · 100% utilisation</p>
      </div>
      <div class="sector-compare-panel">
        <p class="stride-subtitle">Column read: 32 lanes, every 8th value</p>
        <div class="sector-mini-strip">${Array.from({length:32},(_,s)=>`<div class="sector-mini"><span class="sector-mini-label">S${s}</span><div class="sector-mini-words"><span class="sector-mini-word used">L${s}</span></div></div>`).join('')}</div>
        <p class="sector-result"><strong>32 sectors</strong> · 128 bytes requested · 1,024 bytes covered · 12.5% utilisation</p>
      </div>
    </div>
    <figcaption class="stride-summary">Both reads request the same 128 bytes of useful data, but the column read touches 32 sectors instead of 4. More sectors can mean more memory traffic; this is a model count, not a measured slowdown. Note: the row pattern x[0, :] has only <strong>8 values</strong> (8 active lanes), while the column x[:, 0] has <strong>32</strong>. Comparing their sector totals is not a same-work comparison.</figcaption>
  </figure>`;
}

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
