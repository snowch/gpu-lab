// Copyright © 2026 Christopher Snow.
import { escape, fmt, metrics, table } from './continuation-ui.mjs';
import { renderSchedulingRelationships } from './scheduling-relationships.mjs';

const scaleSource = `import torch

x = torch.tensor([1., 2., 3., 4., 5.], device="cuda")
y = x * 2
z = y * 2
print(z.cpu())`;

function branchSource({ pattern = 'positive', activeLanes = 32, negativeOps = 1 } = {}) {
  const values = {
    positive: '[2.] * 32',
    negative: '[-2.] * 32',
    halves: '[2.] * 16 + [-2.] * 16',
    alternating: '[2., -2.] * 16',
    'one-negative': '[-2.] + [2.] * 31',
  }[pattern];
  return `import torch

values = ${values}
x = torch.tensor(values[:${activeLanes}], device="cuda")
y = torch.where(x > 0, x * 2, ${negativeOps === 1 ? '-x' : '-x * 2 + 1'})
print(y.cpu())`;
}

function sumSource({ size = 4 } = {}) {
  return `import torch

x = torch.arange(1, ${size + 1}, dtype=torch.float32, device="cuda")
total = x.sum()
print(total.cpu())`;
}

const patternControl = {
  key: 'pattern', label: 'Input sign pattern', options: [
    ['positive', 'All positive'], ['negative', 'All negative'],
    ['halves', 'Positive first half, negative second half'],
    ['alternating', 'Alternating positive and negative'],
    ['one-negative', 'Only lane 0 is negative'],
  ],
};

export const chapters = [
  {
    slug: 'scheduling', number: 6, title: 'How can work continue during a wait?',
    lead: 'Trace a load dependency, then see when another ready warp can start its next instruction.',
    source: scaleSource,
    openingHTML: `<p>The five inputs from the opening chapters are scaled twice: <code>y</code> contains the first products and <code>z</code> the second. You choose the tensors and operations; PyTorch selects implementations, allocates the results and arranges their launches. Copying <code>z</code> to the CPU lets Python print its values.</p>
      <p>A calculation may have to wait for a loaded input. We will model that dependency with two repetitions of <code>LD → MUL → ST</code>: load, multiply, store. This is a deliberately chosen instruction stream, not a compiler trace of the PyTorch program. The model does not compute its tensor values or infer how PyTorch assigns them to warps.</p>`,
    sections: [
      {
        id: 'scheduling-wait', title: 'Follow one warp through a load wait',
        terms: [
          ['Streaming multiprocessor (SM)', 'A GPU unit on which a block’s threads run, grouped into warps. This model begins with warps assigned to one SM.'],
          ['Cycle', 'One discrete step of this teaching machine, not a measured duration on a GPU.'],
          ['Load latency', 'The number of model cycles from issuing a load until its value is ready for the dependent multiply.'],
        ],
        body: `<p>Begin with one warp on an SM. A load starts a wait; its dependent multiply cannot start until the value is ready. In the diagram, ready means the next instruction can start; waiting means its input is still unavailable.</p>
          <p>The chosen sequence is <code>LD, MUL, ST, LD, MUL, ST</code>. The teaching machine starts at most one instruction each cycle; an idle cycle starts none. A latency of 6 means a load started at cycle 0 becomes usable at cycle 6. Watch what can happen between those two events. The model ends when the last store starts; it does not model a later wait for the store to complete.</p>`,
        task: 'With one warp, predict where idle cycles appear. Run and step past the first load. Change only load latency to 1, run again, and explain what happened to the waits.',
        experiment: {
          model: 'scheduling', defaults: { warps: 1, latency: 6 }, focus: 'wait',
          controls: [{ key: 'latency', label: 'Load latency · model cycles', options: [[1, '1'], [3, '3'], [6, '6'], [10, '10']] }],
        },
      },
      {
        id: 'scheduling-ready', title: 'Give the scheduler another ready warp',
        leadIn: 'One warp left gaps while waiting for data. Could the SM use those gaps for another warp? That requires other work already on the SM and ready to continue.',
        terms: [
          ['Resident warp', 'A warp already assigned resources on an SM. Every warp in this experiment is resident from the start.'],
          ['Instruction issue', 'Selecting a ready warp and starting its next instruction. An issue slot is one opportunity to do that; this teaching machine has one per cycle.'],
          ['Scheduler', 'The mechanism that chooses which ready resident warp issues next. This teaching scheduler searches in round-robin order after the last warp selected.'],
          ['Issue-slot use', 'Issued instructions divided by elapsed model cycles. This describes how many teaching issue slots were used.'],
        ],
        body: `<p>All resident warps begin ready at cycle zero. After each issue, the scheduler searches from the next warp, skipping waiting and completed warps. When one waits for its load, another may have an instruction ready. The cards show each warp immediately before the selected cycle issues.</p>
          <p>Keep latency fixed and change only the number of resident warps. Each extra warp adds another six instructions, so the total work changes too. Compare idle slots and issue-slot use; elapsed cycles for these different workloads do not give a speedup.</p>
          <p>This teaching SM starts with its warps already resident and does not calculate resource limits or competition for memory bandwidth. Its single issue slot and fixed load latency describe this experiment, rather than a particular GPU.</p>`,
        task: 'Predict whether two ready warps can fill every wait at latency 6. Run, inspect an idle cycle if one remains, then change only the warp count to 4. Explain the difference using readiness and the extra work.',
        experiment: {
          model: 'scheduling', defaults: { warps: 2, latency: 6 }, focus: 'ready',
          controls: [{ key: 'warps', label: 'Resident warps · six instructions each', options: [[1, '1'], [2, '2'], [4, '4'], [8, '8']] }],
        },
      },
    ],
    transfer: {
      prompt: 'A resident warp is waiting on a load, and another resident warp is ready. Must the next issue slot be idle? Explain what this model can tell you, and whether doubling the resident warp count proves a speedup.',
      answer: '<p>The ready warp can issue: the scheduler skips the waiting warp. Adding resident warps also adds six instructions per warp in this experiment. Compare issue-slot use and idle slots, but do not turn the elapsed cycles of different workloads into a speedup. Actual residency and performance need resource and hardware evidence beyond this model.</p>',
    },
    optionalHTML: `<section class="book-section"><h2>Optional: place the warps in the bigger picture</h2><p>The experiments began with warps already resident. This separate ownership map puts their blocks on two SMs. It uses three blocks of 64 threads, rather than the five tensor inputs in the opening. Inspect the block with two warps: warp membership follows thread indices, while available resources constrain which blocks can reside on an SM.</p>${renderSchedulingRelationships()}</section>`,
  },
  {
    slug: 'divergence', number: 7, title: 'What if lanes need different calculations?',
    lead: 'Follow an elementwise condition from input signs to participating lanes, then separate different paths from an incomplete warp.',
    source: branchSource(),
    openingHTML: `<p>This small activation-like operation doubles positive inputs and negates negative inputs. <code>torch.where(condition, a, b)</code> selects an output value from <code>a</code> where the condition is true and from <code>b</code> otherwise. The opening has 32 inputs so we can inspect one full warp.</p>
      <p>You choose the condition and expressions; PyTorch chooses its implementations and launches. Python evaluates the two expressions supplied to <code>torch.where</code>, so this source is not evidence of a GPU branch. Our browser model assigns one input to each participating lane and explicitly runs the non-empty paths. It illustrates lane participation, not PyTorch compiler output.</p>`,
    sections: [
      {
        id: 'divergence-uniform', title: 'Start with every lane on the same path',
        terms: [
          ['Path', 'The sequence of operations chosen by one outcome of a condition. Here the positive path doubles an input; the negative path negates it.'],
          ['Lane mask', 'The set of lanes participating in one issued operation. A lane outside that mask does no work for that operation.'],
        ],
        body: `<p>All 32 lanes begin with the same sign. A non-empty path issues its operations; an empty path is skipped. In this first experiment each path has one operation, so changing from all positive to all negative changes the selected arithmetic without creating mixed participation.</p>
          <p>The dynamic PyTorch example follows the sign control. The diagram highlights the selected operation’s mask; the lane cards include final outputs for checking the calculation.</p>`,
        task: 'Predict how many paths are needed when all inputs are positive. Run and inspect the mask. Change only the signs to all negative, run again, and explain whether two paths are now needed.',
        experiment: {
          model: 'divergence', defaults: { pattern: 'positive', activeLanes: 32, negativeOps: 1 }, focus: 'uniform',
          controls: [{ key: 'pattern', label: 'Input sign pattern', options: [['positive', 'All positive'], ['negative', 'All negative']] }],
          code: branchSource,
        },
      },
      {
        id: 'divergence-mixed', title: 'Let a warp contain both signs',
        terms: [
          ['Divergence', 'Different participating lanes of one warp taking different paths through a condition.'],
          ['Lane slot', 'One lane’s opportunity to take part in an issued operation. This model counts 32 slots for every path operation.'],
        ],
        body: `<p>With both signs present, the model runs each non-empty path using its own mask. It issues positive-path operations first, then negative-path operations. Lanes on the other path wait without contributing to the current operation. The displayed order is a teaching choice, not a CUDA guarantee.</p>
          <p>Begin with one operation per path. Then change the negative expression from <code>-x</code> to <code>-x * 2 + 1</code>: negate, multiply, add. Even one negative lane causes that non-empty path to appear. Useful lane slots count participating lanes across all issued operations; lane-slot use divides that count by all 32-slot operations.</p>
          <p>These counts cover only the listed arithmetic. A compiler can combine operations or execute them conditionally, so this trace does not establish compiled instruction counts or timings.</p>`,
        task: 'Predict which masks appear for alternating signs, then run. Change only the pattern to one negative lane. Next change only the negative path from one to three operations. Explain why the rare path still appears in the trace.',
        experiment: {
          model: 'divergence', defaults: { pattern: 'alternating', activeLanes: 32, negativeOps: 1 }, focus: 'mixed',
          controls: [patternControl, { key: 'negativeOps', label: 'Negative-path arithmetic', options: [[1, 'Negate · one operation'], [3, 'Negate, multiply, add · three operations']] }],
          code: branchSource,
        },
      },
      {
        id: 'divergence-tail', title: 'Separate unused lanes from different paths',
        body: `<p>Return to the five-value scale of earlier chapters. Here only the first five lanes have inputs. The remaining positions are unused throughout the calculation. That differs from a participating lane masked off for one path that later takes part in its own path.</p>
          <p>Keep all inputs positive and vary the input count first. Lane-slot use can fall even when there is only one path. Then keep five inputs and switch to alternating signs to see both effects together. Empty positions in this warp are not filled with another block’s threads; other resident warps may still make progress, as chapter 6 showed.</p>`,
        task: 'With five positive inputs, predict whether the low participation means divergence. Run, then change only the signs to alternating. Explain which lane positions are unused throughout and which participate on a different path.',
        experiment: {
          model: 'divergence', defaults: { pattern: 'positive', activeLanes: 5, negativeOps: 1 }, focus: 'tail',
          controls: [
            { key: 'activeLanes', label: 'Inputs · first lanes participating', options: [[5, '5'], [16, '16'], [32, '32']] },
            { key: 'pattern', label: 'Input sign pattern', options: [['positive', 'All positive'], ['alternating', 'Alternating signs']] },
          ], code: branchSource,
        },
      },
    ],
    transfer: {
      prompt: 'Compare five all-positive inputs with 32 inputs containing one negative value. Which case has different paths within the warp? Can a low lane-slot use alone tell you the cause?',
      answer: '<p>The 32-input case has both paths, because lane 0 is negative and the others are positive. Five all-positive inputs use only one path but leave 27 positions unused. A low lane-slot use alone cannot distinguish incomplete input participation from mixed paths; inspect the actual masks.</p>',
    },
  },
  {
    slug: 'reduction', number: 8, title: 'How do threads combine their results?',
    lead: 'Trace a small sum through shared partial results, then explain the ordering that makes each read safe.',
    source: sumSource(),
    openingHTML: `<p><code>x.sum()</code> combines all inputs into one scalar tensor. <code>torch.arange(1, 5)</code> gives values 1 through 4: its endpoint is excluded. <code>dtype=torch.float32</code> requests 32-bit floating-point values. PyTorch chooses the reduction implementation and arranges the necessary storage and launches.</p>
      <p>We use four values, then eight, so the pairwise combination repeatedly halves the number of partial sums. Earlier five-value examples made an incomplete group visible; a power of two keeps this first cooperation example free of extra boundary rules. The browser’s one-block tree is a chosen algorithm, not a trace of <code>torch.sum</code>.</p>`,
    sections: [
      {
        id: 'reduction-tree', title: 'Build a safe tree of partial sums',
        leadIn: 'Multiplication gave each thread an independent output. A sum is different: values handled by different threads must meet. We need somewhere to exchange partial results and a way to wait until those results are ready.',
        terms: [
          ['Reduction', 'Combining many values into fewer values using an operation such as addition; here all inputs become one sum.'],
          ['Shared memory', 'Storage that threads in the same block can read and write. In this model thread i first writes input i into shared word i.'],
          ['Partial sum', 'A sum containing only some of the original inputs. The diagram lists those input indices beside each partial sum.'],
          ['Block barrier', 'A point that all threads in the block must reach before any continues. It also makes preceding shared-memory writes visible to participating threads after the barrier.'],
        ],
        body: `<p>Each thread first writes one input into shared memory. The initial barrier ensures all those writes precede the first partner reads. At partner distance 2, threads 0 and 1 add values from words 2 and 3. After another barrier, thread 0 adds the two partial sums at distance 1.</p>
          <p>Step through the writes before the arithmetic. “Unwritten” means a thread has not yet stored its input there. Each model arithmetic stage reads a snapshot of the preceding stage, representing the ordering between stages. Only some threads add, but every thread reaches each block barrier.</p>`,
        task: 'Predict which two input indices contribute to thread 0’s first partial sum. Run and step through the writes, initial barrier and first addition. Explain why the first two array neighbours are not the first pair combined.',
        experiment: { model: 'reduction', defaults: { size: 4, synchronised: true }, controls: [], focus: 'tree', code: sumSource },
      },
      {
        id: 'reduction-size', title: 'Add another level without losing inputs',
        body: `<p>The synchronised algorithm starts at partner distance <code>N / 2</code>, then halves the distance down to 1. Each new partial sum combines disjoint sets of input contributions. The final node should contain every input index exactly once.</p>
          <p>Change from four to eight inputs. Follow the same write, barrier and combine sequence, now with one more arithmetic stage. Both examples use one block with one partially filled warp. The small input count does not remove the need to express the required ordering.</p>`,
        task: 'Predict how the partner distances change for eight inputs. Run with four, then change only the size to eight and run again. Inspect the final contribution list and explain why every original value is included once.',
        experiment: {
          model: 'reduction', defaults: { size: 4, synchronised: true }, focus: 'contributions',
          controls: [{ key: 'size', label: 'Inputs and threads in this block', options: [[4, '4'], [8, '8']] }], code: sumSource,
        },
      },
      {
        id: 'reduction-order', title: 'Diagnose a missing ordering guarantee',
        terms: [['Data race', 'Conflicting accesses to the same storage by different threads without the required ordering, with at least one write. A useful numeric outcome is not guaranteed.']],
        body: `<p>Start with the safe eight-input sum. Then select the diagnostic without synchronisation. The model deliberately lets thread 0 read its first partner before that partner writes. This shows one missing ordering guarantee; it does not enumerate every possible interleaving.</p>
          <p>The later partner write cannot repair the earlier read. The diagnostic therefore reports the unwritten access and assigns no numeric output to the racy program. Seeing a plausible sum in some other execution would not establish safety. The PyTorch example still expresses the safe sum; the diagnostic is a change to our teaching algorithm, not a PyTorch option.</p>`,
        task: 'Run the synchronised case first. Predict which write must precede thread 0’s first partner read, then change only the ordering to the diagnostic. Step to the flagged read and explain the missing dependency; do not guess a numeric racy result.',
        experiment: {
          model: 'reduction', defaults: { size: 8, synchronised: true }, focus: 'ordering',
          controls: [{ key: 'synchronised', label: 'Shared-memory ordering', options: [[true, 'Synchronised tree'], [false, 'Diagnostic without synchronisation']] }],
        },
      },
    ],
    transfer: {
      prompt: 'In the four-input tree, thread 0 reads shared word 2 at the first addition. Which ordering must hold? Would a block barrier after that read fix a read that happened before thread 2 wrote?',
      answer: '<p>Thread 2’s write must happen before thread 0 reads shared word 2. The initial block barrier establishes that ordering when all threads take part. A barrier after an early read cannot make that read safe retroactively. The stage barriers also order partial-sum writes before subsequent stages read them.</p>',
    },
    optionalHTML: '<section class="book-section"><h2>Optional: how does shared-memory layout affect reads?</h2><p>The barriers establish when a shared value may be read. The <a href="shared-memory.html">shared-memory banks lab</a> explores a different question: how the addresses requested together affect the service of those reads. You can continue directly to matrix multiplication and return to that layout experiment later.</p></section>',
  },
];

const percent = value => `${fmt(value * 100)}%`;
const card = (title, body, selected = false) => `<div class="continuation-card${selected ? ' selected' : ''}"><strong>${escape(title)}</strong><p>${escape(body)}</p></div>`;
const eventAt = (result, cursor) => result.trace[Math.max(0, Math.min(result.trace.length - 1, Math.trunc(cursor) || 0))];

function renderScheduling(result, cursor, focus) {
  const event = eventAt(result, cursor);
  const introductory = focus === 'wait';
  const current = event.selected === null
    ? `Cycle ${event.cycle}: idle; no unfinished warp is ready.`
    : `Cycle ${event.cycle}: warp ${event.selected} ${introductory ? 'starts' : 'issues'} ${event.instruction}.`;
  const cards = event.before.map((warp, id) => {
    const action = event.selected === id ? 'selected to start' : warp.status;
    const next = warp.status === 'done' ? 'Program complete.'
      : `Next: ${result.program[warp.pc]}.${warp.status === 'waiting' ? ` Ready at cycle ${warp.readyAt}.` : ''}`;
    return card(`Warp ${id} · ${action}`, next, event.selected === id);
  }).join('');
  const counts = [['Model cycles', result.cycles], [introductory ? 'Instructions started' : 'Issued instructions', result.issued], ['Idle cycles', result.idle]];
  if (!introductory) counts.push(['Issue-slot use', percent(result.issueUtilisation)]);
  return `<div class="continuation-visual" aria-label="Computed warp readiness and instruction trace">
    ${metrics(counts)}
    <p><strong>${escape(current)}</strong></p><p class="muted">Warp states immediately before this cycle’s instruction starts. LD = load; MUL = multiply; ST = store.</p>
    <div class="continuation-cards">${cards}</div>
    <details><summary>Inspect the complete model trace</summary>${table(['Cycle', 'Selected warp', 'Instruction', 'Waiting warps'], result.trace.map(t => [t.cycle, t.selected === null ? 'None' : t.selected, t.instruction, t.before.flatMap((w, i) => w.status === 'waiting' ? [i] : []).join(', ') || 'None']), 'Complete model run; cycle numbers start at zero.')}</details>
    <p>${escape(introductory ? `${result.issued} instructions start in ${result.cycles} model cycles; ${result.idle} cycles are idle. Step through a load and its following multiply to locate the wait.` : `${result.issued} instructions issued in ${result.cycles} model cycles; ${result.idle} slots were idle. Every resident warp adds six instructions. This is issue-slot use for the selected work, not occupancy or a measured GPU speedup.`)}</p>
  </div>`;
}

function renderDivergence(result, cursor, focus) {
  const event = eventAt(result, cursor);
  const introductory = focus === 'uniform';
  const lanes = result.lanes.map(lane => {
    const state = !lane.active ? 'Unused' : event.mask.includes(lane.id) ? 'Now' : 'Other path';
    return `<div class="continuation-card${!lane.active ? ' unused' : event.mask.includes(lane.id) ? ' selected' : ''}"><strong>Lane ${lane.id}</strong><p>${lane.active ? `${lane.input} → ${lane.output}` : '—'}<br>${state}</p></div>`;
  }).join('');
  return `<div class="continuation-visual" aria-label="Computed branch masks and lane outputs">
    ${metrics(introductory ? [['Paths used', result.paths], ['Path operations', result.instructions]] : [['Paths used', result.paths], ['Path operations', result.instructions], ['Useful lane slots', result.usefulSlots], ['Lane-slot use', percent(result.utilisation)]])}
    <p><strong>${escape(event.label)}: ${event.mask.length} lanes participate.</strong></p>
    <details><summary>Inspect the lane indices for each path</summary>${table(['Operation', 'Participating lane indices'], result.trace.map(t => [t.label, t.mask.join(', ')]), 'Actual masks in the chosen positive-first teaching order.')}</details>
    <p class="muted">Each card shows input → final output. “Now” participates in the selected operation; “Other path” is masked off now; “Unused” has no input throughout.</p>
    <div class="lane-grid">${lanes}</div>
    <p>${escape(introductory ? 'All participating lanes follow the same path. The other path has no participating lanes, so the model skips it.' : `${result.usefulSlots} useful lane slots out of ${result.instructions * 32} possible slots. Empty paths are skipped. Both different paths and unused tail positions can reduce this ratio; these are explicit path operations, not compiled instructions or timings.`)}</p>
  </div>`;
}

function renderReduction(result, cursor) {
  const event = eventAt(result, cursor);
  const memory = event.shared.map((value, index) => card(`Shared word ${index}${event.reads.includes(index) ? ' · partner read' : ''}`, value === null ? 'Unwritten' : `Value ${value}`, event.reads.includes(index))).join('');
  // A diagnostic trace has no valid arithmetic levels beyond the initial inputs.
  const levels = result.hazard ? '' : table(
    ['Arithmetic level', 'Shared word receiving partial sum', 'Input indices contributing', 'Partial sum'],
    result.levels.slice(0, event.level + 1).flatMap((level, depth) => level.map(node => [depth === 0 ? 'Inputs' : depth, node.index, node.threads.join(', '), node.value])),
    'Contribution tree through the selected arithmetic stage. Input indices start at zero; each tree edge combines two preceding contribution sets.',
  );
  const diagnostic = event.hazard
    ? `<p><strong>Unwritten read detected:</strong> thread 0 reads shared word ${event.reads[0]} before its input write. No numeric result is assigned.</p>`
    : result.hazard ? '<p>This diagnostic run contains an unwritten read. Later writes cannot repair the earlier missing ordering; no numeric result is assigned.</p>' : '';
  return `<div class="continuation-visual" aria-label="Computed shared-memory state and reduction contributions">
    ${metrics([['Inputs', result.size], ['Ordering hazard', result.hazard ? 'Detected' : 'None'], ['Final valid sum', result.hazard ? 'No numeric result' : result.result]])}
    <p><strong>${escape(event.label)}</strong></p>${diagnostic}
    <div class="continuation-cards">${memory}</div>${levels}
    <p>${result.hazard ? 'This is one diagnostic interleaving, not a prediction of the numeric outcome of a racy CUDA program.' : escape(`The complete synchronised tree combines all ${result.size} inputs into ${result.result}. Shared-memory values above are the snapshot after the selected event; the final sum metric describes the whole run.`)}</p>
  </div>`;
}

export function renderResult(model, result, cursor, focus) {
  const render = { scheduling: renderScheduling, divergence: renderDivergence, reduction: renderReduction }[model];
  return render ? render(result, cursor, focus) : null;
}
