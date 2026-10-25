// Copyright © 2026 Christopher Snow.
// A declared placement example, not a scheduler or a hardware-capacity model.
export function overviewExample(threadsPerBlock = 64, blockCount = 4) {
  if (!Number.isInteger(threadsPerBlock) || threadsPerBlock < 1 || threadsPerBlock > 128) throw new RangeError('Expected 1–128 threads per block');
  if (!Number.isInteger(blockCount) || blockCount < 1 || blockCount > 8) throw new RangeError('Expected 1–8 blocks');
  const blocks = Array.from({ length: blockCount }, (_, index) => {
    const threads = Array.from({ length: threadsPerBlock }, (_, thread) => ({ thread, warp: Math.floor(thread / 32), lane: thread % 32 }));
    return { name: String.fromCharCode(65 + index), sm: index % 2, threads,
      warps: Array.from({ length: Math.ceil(threadsPerBlock / 32) }, (_, warp) => threads.filter(thread => thread.warp === warp)) };
  });
  return { threadsPerBlock, blocks, sms: [0, 1].map(sm => ({ sm, blocks: blocks.filter(block => block.sm === sm) })) };
}

export function renderSmOverview(example = overviewExample()) {
  return `<section class="architecture-box architecture-sm sm-ownership" aria-labelledby="sm-ownership-title">
    <h3 id="sm-ownership-title">A closer look at one SM</h3>
    <p>A <strong>thread block</strong> is a group of threads that runs on one SM and can cooperate by sharing data.</p>
    <div class="sm-units"><strong>Execution units · shared by the SM’s blocks</strong>
      <div class="sm-unit-grid"><div><strong>Arithmetic and other instructions</strong><span>Process the threads’ working values</span></div><div><strong>Tensor cores</strong><span>Specialised units for supported matrix operations, on GPUs that have them</span></div></div>
    </div>
    <p class="overview-arrow"><span aria-hidden="true">↑</span> Threads’ instructions use the appropriate units</p>
    <div class="sm-block-grid">${example.sms[0].blocks.map(block => `<section class="sm-block" aria-label="Block ${block.name} resources"><h4>Block ${block.name}</h4>
      <div class="sm-thread-grid">${block.threads.slice(0, 2).map(({ thread }) => `<div class="sm-thread"><strong>Thread ${thread}</strong><div class="sm-registers"><strong>Registers</strong><span>Private working values</span></div></div>`).join('')}</div>
      ${block.threads.length > 2 ? `<p class="overview-small">${block.threads.length - 2} other threads, each with its own registers</p>` : ''}
      <div class="sm-shared"><strong>Shared memory</strong><span>A workspace for threads in block ${block.name}</span></div></section>`).join('')}</div>
    <p class="overview-small">Example: blocks ${example.sms[0].blocks.map(block => block.name).join(' and ')} use this SM. Each block has its own shared-memory workspace; registers hold values for individual threads. Both use the SM’s limited storage resources.</p>
  </section>`;
}

export function renderWorkMap(example = overviewExample(), name = 'A', warpIndex = 0) {
  const selected = example.blocks.find(block => block.name === name);
  if (!selected || !selected.warps[warpIndex]) throw new RangeError('Unknown block or warp');
  const warp = selected.warps[warpIndex];
  const chip = block => `<span class="work-block${block.name === name ? ' is-selected' : ''}" data-map-block="${block.name}">Block ${block.name}${block.name === name ? '<span class="block-selection"> · selected</span>' : ''}</span>`;
  return `<div class="work-launch"><h4>One kernel launch → one grid</h4><div class="work-grid">${example.blocks.map(chip).join('')}</div><p>${example.blocks.length} blocks · ${example.threadsPerBlock} threads in each block</p></div>
    <p class="overview-arrow"><span aria-hidden="true">↓</span> One possible placement of these blocks</p>
    <div class="work-sms">${example.sms.map(sm => `<section class="work-sm${sm.sm === selected.sm ? ' is-selected' : ''}" data-map-sm="${sm.sm}"><h4>SM ${sm.sm}</h4>${sm.blocks.map(chip).join('')}</section>`).join('')}</div>
    <p class="overview-arrow"><span aria-hidden="true">↓</span> Look inside block ${name} on SM ${selected.sm}</p>
    <section class="work-detail"><h4>Block ${name} · ${example.threadsPerBlock} threads → ${selected.warps.length} warps</h4>
      <p>A <strong>warp</strong> is a group of 32 thread positions within a block. A thread’s position in that group is called its <strong>lane</strong>.</p>
      <div class="work-warp-list">${selected.warps.map((threads, index) => `<div class="work-warp${index === warpIndex ? ' is-selected' : ''}"><strong>Warp ${index}${index === warpIndex ? ' · shown below' : ''}</strong><span>Threads ${threads[0].thread}–${threads.at(-1).thread}</span></div>`).join('')}</div>
      <h4 class="lane-heading">Warp ${warpIndex}: lanes and threads</h4><p class="overview-small">Each tile shows a lane position and the thread’s index within block ${name}.</p>
      <div class="overview-lanes" role="list" aria-label="Warp ${warpIndex} lane positions">${Array.from({ length: 32 }, (_, lane) => {
        const thread = warp.find(thread => thread.lane === lane);
        return `<div class="overview-lane${thread ? '' : ' inactive'}" role="listitem" aria-label="Lane ${lane}, ${thread ? `thread ${thread.thread}` : 'inactive'}"><strong>${lane}</strong><span>${thread ? `t${thread.thread}` : '—'}</span></div>`;
      }).join('')}</div>
    </section>`;
}
