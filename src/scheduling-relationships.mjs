// Copyright © 2026 Christopher Snow.
import {overviewExample} from './overview-visuals.mjs';
export function renderSchedulingRelationships() {
  const example=overviewExample(64,3);
  const expanded=example.blocks[0];
  return `<figure class="hello-relationships" aria-labelledby="hello-relationships-title" aria-describedby="hello-relationships-caption">
    <h4 id="hello-relationships-title">Inside a GPU: SMs → blocks → warps → threads</h4>
    <p class="hello-placement-note">Separate placement example: ${example.blocks.length} blocks, ${example.threadsPerBlock} threads per block.</p>
    <div class="hello-gpu"><strong>GPU</strong>
      <div class="hello-sm-grid">${example.sms.map(sm=>`<section class="hello-sm" aria-label="SM ${sm.sm} example blocks">
        <h5>SM ${sm.sm}</h5>
        ${sm.blocks.map(block=>`<div class="hello-resident-block">
          <strong>Block ${block.name}</strong><span>${block.threads.length} threads · ${block.warps.length} warps · stays on this SM</span>
          ${block.warps.map((warp,index)=>`<div class="hello-warp"><strong>Warp ${index} · ${warp.length} threads</strong>
            <p>Threads ${warp[0].thread}–${warp.at(-1).thread} within block ${block.name}</p>
            ${block===expanded&&index===0?`<div class="hello-warp-lanes" role="list" aria-label="Block A, warp 0: 32 lane positions">${warp.map(thread=>
              `<span class="hello-warp-lane has-thread" role="listitem" aria-label="Lane ${thread.lane}: thread ${thread.thread} within block A">${thread.thread}</span>`
            ).join('')}</div>`:''}
          </div>`).join('')}
        </div>`).join('')}
      </section>`).join('')}</div>
    </div>
    <figcaption id="hello-relationships-caption">Each block here contains two warps. A lane is a thread’s position within its warp; each tile shows a thread’s index within block A. Warps never combine threads from different blocks. This shows one possible placement, not a chip floor plan or an execution timeline. Placement and how much work can execute at once depend on available resources.</figcaption>
    <p><strong>Blocks can make progress independently.</strong> The SM can choose ready warps from any of the blocks it holds. Another block can run while some threads in the first are waiting or some lanes are unused, when resources allow. A block does not have to finish before another can start.</p>
    <p>In chapter 1’s four-thread exercise, each block uses one partially filled warp: 4 of 32 lanes have threads. The other 28 positions do not prevent another block from running, and cannot be filled with threads from another block.</p>

  </figure>`;
}
