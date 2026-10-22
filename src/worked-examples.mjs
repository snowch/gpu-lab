// Copyright © 2026 Christopher Snow.
// Static worked examples rendered at build time. Each function returns HTML
// that is visible without JavaScript and requires no interaction to understand.

function cell(label, cls = '') {
  return `<span class="we-cell${cls ? ` ${cls}` : ''}">${label}</span>`;
}

function grid(rows, highlight = () => '') {
  return `<div class="we-grid">${rows.map(row => row.map(c => cell(c, highlight(c))).join('')).join('')}</div>`;
}

export function schedulingExample() {
  // 2 warps, latency 3. Warp 0 issues LD at cycle 0, waits cycles 1-2, MUL at 3.
  // Warp 1 issues LD at cycle 1, MUL at cycle 4. Shows latency vs idle slot.
  const cycles = 8;
  const warp0 = ['LD', 'wait', 'wait', 'MUL', 'ST', 'LD', 'wait', 'wait'];
  const warp1 = ['—', 'LD', 'wait', 'wait', 'MUL', 'ST', 'LD', 'wait'];
  const rows = [
    ['Cycle', ...Array.from({length: cycles}, (_, i) => `t=${i}`)],
    ['Warp 0', ...warp0.slice(0, cycles)],
    ['Warp 1', ...warp1.slice(0, cycles)],
    ['Issue slot', 'W0·LD', 'W1·LD', '—', 'W0·MUL', 'W0·ST', 'W1·MUL', 'W1·ST'],
  ];
  const cls = (r, c) => {
    if (r === 0 || c === 0) return 'we-hdr';
    const val = rows[r][c];
    if (val === 'wait') return 'we-wait';
    if (val === '—') return 'we-idle';
    if (val.startsWith('W')) return 'we-issue';
    return '';
  };
  return `<figure class="worked-example" data-lesson="scheduling">
    <h4>Worked example: two warps, load latency 3</h4>
    <p class="we-caption">Each warp runs <code>LD → MUL → ST</code> twice. A load issued at cycle <code>t</code> can be used at <code>t + 3</code>. The SM has one issue slot per cycle.</p>
    <div class="we-table-wrap"><table class="we-table">
      <thead><tr>${rows[0].map((c, i) => `<th class="${cls(0, i)}">${c}</th>`).join('')}</tr></thead>
      <tbody>${rows.slice(1).map((row, r) => `<tr>${row.map((c, i) => `<td class="${cls(r + 1, i)}">${c}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div>
    <figcaption class="we-summary"><strong>Warp 0 waits 2 cycles</strong> after its first load (latency 3, issued at t=0, usable at t=3). <strong>Warp 1 fills t=1</strong> while warp 0 waits. The issue slot is never idle in this window. Latency is the wait; an idle slot is when nobody can issue. With only one warp, t=1 and t=2 would be idle.</figcaption>
  </figure>`;
}

export function divergenceExample() {
  // 8 lanes shown, alternating signs. Positive path: 1 op. Negative path: 3 ops.
  const lanes = Array.from({length: 8}, (_, i) => ({ id: i, sign: i % 2 === 0 ? '+' : '−' }));
  const rows = [
    ['Lane', ...lanes.map(l => `L${l.id}`)],
    ['Input sign', ...lanes.map(l => l.sign)],
    ['Positive path (×2)', ...lanes.map(l => l.sign === '+' ? '✓' : '—')],
    ['Negative: negate', ...lanes.map(l => l.sign === '−' ? '✓' : '—')],
    ['Negative: ×2', ...lanes.map(l => l.sign === '−' ? '✓' : '—')],
    ['Negative: +1', ...lanes.map(l => l.sign === '−' ? '✓' : '—')],
  ];
  const cls = (r, c) => {
    if (r === 0 || c === 0) return 'we-hdr';
    if (rows[r][c] === '✓') return 'we-active';
    return 'we-inactive';
  };
  return `<figure class="worked-example" data-lesson="divergence">
    <h4>Worked example: alternating signs, 8 lanes shown</h4>
    <p class="we-caption">Half the lanes are positive, half negative. The warp issues the positive path once (4 lanes), then the negative path three times (4 lanes each). Lanes not in a mask do no work for that instruction.</p>
    <div class="we-table-wrap"><table class="we-table">
      <thead><tr>${rows[0].map((c, i) => `<th class="${cls(0, i)}">${c}</th>`).join('')}</tr></thead>
      <tbody>${rows.slice(1).map((row, r) => `<tr>${row.map((c, i) => `<td class="${cls(r + 1, i)}">${c}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div>
    <figcaption class="we-summary">The warp issues <strong>4 path operations</strong> (1 positive + 3 negative) instead of 2. Divergence happens because <em>both</em> paths have participating lanes. Useful lane slots: 4 + 4 + 4 + 4 = 16 out of 4 × 32 = 128 possible.</figcaption>
  </figure>`;
}

export function sharedMemoryExample() {
  // 8 lanes, column read stride 32. Each lane hits bank = (lane*32) % 32 = 0.
  const lanes = Array.from({length: 8}, (_, i) => ({ id: i, word: i * 32, bank: (i * 32) % 32 }));
  const padded = Array.from({length: 8}, (_, i) => ({ id: i, word: i * 33, bank: (i * 33) % 32 }));
  const rows = [
    ['Lane', ...lanes.map(l => `L${l.id}`)],
    ['Word (stride 32)', ...lanes.map(l => l.word)],
    ['Bank (stride 32)', ...lanes.map(l => l.bank)],
    ['Word (stride 33)', ...padded.map(l => l.word)],
    ['Bank (stride 33)', ...padded.map(l => l.bank)],
  ];
  const cls = (r, c) => {
    if (r === 0 || c === 0) return 'we-hdr';
    if (r === 3) return 'we-conflict';
    if (r === 5) return 'we-ok';
    return '';
  };
  return `<figure class="worked-example" data-lesson="shared-memory">
    <h4>Worked example: column read, 8 lanes shown</h4>
    <p class="we-caption">Lanes read one column of a 32×32 tile. Word = lane × pitch. Bank = word % 32. With pitch 32, every lane hits <strong>bank 0</strong>: 32 distinct words in one bank need 32 service rounds. With pitch 33 (one padding word), the banks spread out: 1 round.</p>
    <div class="we-table-wrap"><table class="we-table">
      <thead><tr>${rows[0].map((c, i) => `<th class="${cls(0, i)}">${c}</th>`).join('')}</tr></thead>
      <tbody>${rows.slice(1).map((row, r) => `<tr>${row.map((c, i) => `<td class="${cls(r + 1, i)}">${c}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div>
    <figcaption class="we-summary"><strong>Stride 32 → 32 rounds</strong> (bank conflict: 32 distinct words, all in bank 0). <strong>Stride 33 → 1 round</strong> (padding shifts each lane to a different bank). This is not the same as a broadcast: a broadcast is multiple lanes reading the <em>same</em> word, which also takes 1 round.</figcaption>
  </figure>`;
}

export function reductionExample() {
  // 8 inputs: 1..8. Tree: (1+5)+(2+6) etc. Show level 0 and level 3 (final).
  const inputs = [1, 2, 3, 4, 5, 6, 7, 8];
  const level1 = [inputs[0] + inputs[4], inputs[1] + inputs[5], inputs[2] + inputs[6], inputs[3] + inputs[7]];
  const level2 = [level1[0] + level1[2], level1[1] + level1[3]];
  const level3 = [level2[0] + level2[1]];
  const fmt = arr => arr.map((v, i) => `<div class="we-node${i === 0 && arr.length === 1 ? ' we-final' : ''}"><small>${arr.length === 8 ? 'input' : arr.length === 4 ? 'stage 1' : arr.length === 2 ? 'stage 2' : 'final'}</small><strong>${v}</strong></div>`).join('');
  return `<figure class="worked-example" data-lesson="reduction">
    <h4>Worked example: 8 inputs, synchronised tree</h4>
    <p class="we-caption">Each thread writes its input to shared memory, passes a barrier, then the lower half adds partners from the upper half. A barrier separates each stage.</p>
    <div class="we-tree">
      <div class="we-tree-level">${fmt(inputs)}</div>
      <div class="we-tree-arrow">↓ barrier · add partners at distance 4 ↓</div>
      <div class="we-tree-level">${fmt(level1)}</div>
      <div class="we-tree-arrow">↓ barrier · add partners at distance 2 ↓</div>
      <div class="we-tree-level">${fmt(level2)}</div>
      <div class="we-tree-arrow">↓ barrier · add partners at distance 1 ↓</div>
      <div class="we-tree-level">${fmt(level3)}</div>
    </div>
    <figcaption class="we-summary">The final sum is <strong>36</strong> (1+2+…+8). Without barriers, thread 0 could read its partner's cell before that thread writes it — a <strong>data race</strong>. The barrier makes the writes visible before the reads.</figcaption>
  </figure>`;
}

export function matmulExample() {
  // 2x2 matrices, tile 2. Show A, B, and one C element with one reused value.
  const a = [[1, 2], [3, 4]], b = [[5, 6], [7, 8]];
  const c00 = a[0][0] * b[0][0] + a[0][1] * b[1][0];
  const c01 = a[0][0] * b[0][1] + a[0][1] * b[1][1];
  const c10 = a[1][0] * b[0][0] + a[1][1] * b[1][0];
  const c11 = a[1][0] * b[0][1] + a[1][1] * b[1][1];
  const c = [[c00, c01], [c10, c11]];
  const mat = (m, title, hi = []) => `<div class="we-mat"><p class="we-mat-title">${title}</p><div class="we-mat-grid">${m.flat().map((v, i) => `<span class="we-mat-cell${hi.includes(i) ? ' we-hi' : ''}">${v}</span>`).join('')}</div></div>`;
  return `<figure class="worked-example" data-lesson="matmul">
    <h4>Worked example: 2×2 product, one tile</h4>
    <p class="we-caption">C[0,0] = A[0,0]×B[0,0] + A[0,1]×B[1,0] = 1×5 + 2×7 = 19. The same A[0,0] is reused for C[0,1]. With a tile of 2, the block loads all of A and B once (8 values) and computes all 4 outputs. The naive version loads 2 values per output × 4 outputs = 8 values too — at this tiny size they match. Larger matrices diverge.</p>
    <div class="we-mat-row">${mat(a, 'A', [0, 1])}${mat(b, 'B', [0, 2])}${mat(c, 'C = A × B', [0])}</div>
    <figcaption class="we-summary">Highlighted cells show the values loaded for C[0,0]: A row 0 and B column 0. A[0,0]=1 is loaded once but used for both C[0,0] and C[0,1]. Tiling increases this reuse as matrices grow: for N×N with tile T, input loads drop from 2N³ to 2N³/T.</figcaption>
  </figure>`;
}

export function tensorCoresExample() {
  // One value: 1.0003 in FP32 -> FP16. Show the rounding.
  const fp32 = 1.0003;
  // FP16 quantize (10 fraction bits)
  const magnitude = Math.abs(fp32);
  const exponent = Math.max(-14, Math.floor(Math.log2(magnitude)));
  const spacing = 2 ** (exponent - 10);
  const fp16 = Math.round(magnitude / spacing) * spacing;
  const bf16Spacing = 2 ** (exponent - 7);
  const bf16 = Math.round(magnitude / bf16Spacing) * bf16Spacing;
  return `<figure class="worked-example" data-lesson="tensor-cores">
    <h4>Worked example: one input value, three precisions</h4>
    <p class="we-caption">The value <code>1.0003</code> enters a WMMA operation. FP32 keeps it exactly (shown here to 4 decimals). FP16 has 10 fraction bits; BF16 has 7. Both round the input <em>before</em> any arithmetic. FP32 accumulation adds the rounded values exactly; it cannot recover what conversion discarded.</p>
    <div class="we-table-wrap"><table class="we-table">
      <thead><tr><th>Format</th><th>Fraction bits</th><th>Stored value</th><th>Error</th></tr></thead>
      <tbody>
        <tr><td class="we-hdr">FP32 (reference)</td><td>23</td><td>1.0003</td><td>0</td></tr>
        <tr><td class="we-hdr">FP16</td><td>10</td><td>${fp16.toFixed(6)}</td><td>${Math.abs(fp16 - fp32).toExponential(2)}</td></tr>
        <tr><td class="we-hdr">BF16</td><td>7</td><td>${bf16.toFixed(6)}</td><td>${Math.abs(bf16 - fp32).toExponential(2)}</td></tr>
      </tbody>
    </table></div>
    <figcaption class="we-summary">FP16 stores ${fp16.toFixed(6)} (error ~${Math.abs(fp16 - fp32).toExponential(1)}). BF16 stores ${bf16.toFixed(6)} (error ~${Math.abs(bf16 - fp32).toExponential(1)}). In a dot product of 16 near-one values with exact negatives, this small input error can dominate the final result. FP32 accumulation is exact here; it does not undo the input rounding.</figcaption>
  </figure>`;
}

export function attentionExample() {
  return `<figure class="worked-example" data-lesson="attention">
    <h4>Worked example: one query, four keys</h4>
    <p class="we-caption">A query vector compares with four keys to get scores, turns them into probabilities (softmax), then averages the value vectors. Two strategies differ in what they store.</p>
    <div class="we-flow">
      <div class="we-flow-col">
        <p class="we-flow-title">Materialised (store everything)</p>
        <div class="we-flow-box">Write full score row (4 values)</div>
        <div class="we-flow-arrow">↓</div>
        <div class="we-flow-box">Write probability row (4 values)</div>
        <div class="we-flow-arrow">↓</div>
        <div class="we-flow-box">Read probabilities × V → output</div>
        <p class="we-flow-result">Intermediate writes: <strong>8 values</strong> (2 × 4)</p>
      </div>
      <div class="we-flow-col">
        <p class="we-flow-title">Online (update running state)</p>
        <div class="we-flow-box">Running max, sum, accumulator</div>
        <div class="we-flow-arrow">↓ tile of keys</div>
        <div class="we-flow-box">Rescale, add tile contribution</div>
        <div class="we-flow-arrow">↓ next tile</div>
        <div class="we-flow-box">Normalise at the end → output</div>
        <p class="we-flow-result">Intermediate writes: <strong>0 full-matrix values</strong>; scratch = tile + 6 floats</p>
      </div>
    </div>
    <figcaption class="we-summary">Both produce the same output (up to floating-point rounding). The online version never writes the full score or probability matrix to memory. For <code>n</code> keys, materialised writes 2n² values; online writes none. This is a traffic count, not a measured speedup.</figcaption>
  </figure>`;
}

export function inferenceExample() {
  // Prefill vs decode for a 7B model, batch 1, sequence 512.
  const params = 7, bw = 1000, compute = 100, seq = 512, layers = 32, hidden = 4096, kvWidth = 1024, bpv = 2;
  const weightBytes = params * 1e9 * bpv;
  const kvBytes = 2 * layers * 1 * seq * kvWidth * bpv;
  const prefillFlops = 2 * params * 1e9 * seq + 4 * layers * 1 * seq * hidden * seq;
  const prefillBytes = weightBytes + kvBytes;
  const prefillMemMs = prefillBytes / (bw * 1e9) * 1000;
  const prefillCompMs = prefillFlops / (compute * 1e12) * 1000;
  const decodeFlops = 2 * params * 1e9 * 1 + 4 * layers * 1 * seq * hidden * 1;
  const decodeKvRead = kvBytes;
  const decodeKvWrite = 2 * layers * 1 * kvWidth * bpv;
  const decodeBytes = weightBytes + decodeKvRead + decodeKvWrite;
  const decodeMemMs = decodeBytes / (bw * 1e9) * 1000;
  const decodeCompMs = decodeFlops / (compute * 1e12) * 1000;
  const fmt = ms => ms >= 10 ? `${ms.toFixed(0)} ms` : `${ms.toFixed(1)} ms`;
  const bar = (ms, max, cls) => `<div class="we-bar-wrap"><div class="we-bar ${cls}" style="width:${Math.max(2, ms / max * 100)}%"></div><span>${fmt(ms)}</span></div>`;
  const maxMs = Math.max(prefillMemMs, prefillCompMs, decodeMemMs, decodeCompMs);
  return `<figure class="worked-example" data-lesson="inference">
    <h4>Worked example: 7B model, batch 1, sequence 512</h4>
    <p class="we-caption">Assumptions: 7B parameters in BF16 (2 bytes each), 1,000 GB/s bandwidth, 100 TFLOP/s compute, 32 layers, hidden 4096, KV width 1024. These are illustrative model quantities, not measurements.</p>
    <div class="we-inf">
      <div class="we-inf-row">
        <p class="we-inf-title">Prefill (process 512 tokens)</p>
        ${bar(prefillMemMs, maxMs, 'we-bar-mem')}${bar(prefillCompMs, maxMs, 'we-bar-comp')}
        <p class="we-inf-bound">Dominant bound: <strong>${prefillMemMs >= prefillCompMs ? 'Memory' : 'Compute'}</strong> · ${fmt(Math.max(prefillMemMs, prefillCompMs))}</p>
      </div>
      <div class="we-inf-row">
        <p class="we-inf-title">Decode (generate 1 token)</p>
        ${bar(decodeMemMs, maxMs, 'we-bar-mem')}${bar(decodeCompMs, maxMs, 'we-bar-comp')}
        <p class="we-inf-bound">Dominant bound: <strong>${decodeMemMs >= decodeCompMs ? 'Memory' : 'Compute'}</strong> · ${fmt(Math.max(decodeMemMs, decodeCompMs))}</p>
      </div>
    </div>
    <p class="we-legend"><span class="we-legend-mem">■ Memory lower bound</span> <span class="we-legend-comp">■ Compute lower bound</span></p>
    <figcaption class="we-summary">Prefill is <strong>compute-bound</strong>: it does 512 tokens' worth of arithmetic. Decode is <strong>memory-bound</strong>: it reads the 14 GB of weights for one token's worth of arithmetic. Batching decode amortises the weight read across tokens. These are model lower bounds, not measured latency.</figcaption>
  </figure>`;
}

const workedExamples = {
  scheduling: schedulingExample,
  divergence: divergenceExample,
  'shared-memory': sharedMemoryExample,
  reduction: reductionExample,
  matmul: matmulExample,
  'tensor-cores': tensorCoresExample,
  attention: attentionExample,
  inference: inferenceExample,
};

export function renderWorkedExample(slug) {
  const fn = workedExamples[slug];
  return fn ? fn() : '';
}
