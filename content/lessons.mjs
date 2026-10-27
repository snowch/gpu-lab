// Copyright © 2026 Christopher Snow.
import { renderChapterReferences, guides } from '../src/reference-tasks.mjs';
import { remainingLessons } from './remaining-lessons.mjs';
import {renderSchedulingRelationships} from '../src/scheduling-relationships.mjs';
import { renderWorkedExample } from '../src/worked-examples.mjs';
import { renderConcepts } from '../src/concepts.mjs';
import { conceptsByLesson } from './concept-definitions.mjs';
// Original lesson text. Models, not this content, supply all prediction answers.
export const lessons = [
  {
    slug: 'scheduling', number: '02', title: 'Keeping the GPU busy', workedExample: 'scheduling',
    subtitle: 'A waiting warp need not mean an idle GPU.',
    prerequisite: 'Lab 01: threads, warps, and memory loads. You can read a short array-indexing expression.',
    intro: `<p>Scaling a tensor means reading values, multiplying them, and writing the results. Arithmetic cannot use a value before its load returns. While one warp waits, the GPU can issue an instruction from another ready warp.</p><!-- NEW_CONCEPTS --><p>A thread block stays on one SM for its lifetime. Several blocks can fit on one SM when resources allow. Their warps remain <strong>resident</strong> with execution state available, and the scheduler chooses one that is ready.</p>`,
    setup: `<p>Our teaching SM has one issue slot per cycle: it can start one warp instruction. Each warp performs <code>LD → MUL → ST</code> twice. LD loads values, MUL multiplies them, and ST stores the results. All warps are resident from the start.</p>
      <p>A load issued at cycle <code>t</code> can be used at cycle <code>t + latency</code>. MUL and ST each occupy one issue slot without further waits. The scheduler searches ready warps in round-robin order, starting after the warp it last chose. An idle cycle occurs only when no unfinished warp is ready.</p>`,
    controls: `<label>Resident warps<select id="warps"><option value="1">1 warp</option><option value="2">2 warps</option><option value="4">4 warps</option><option value="8">8 warps</option></select></label>
      <label>Load latency<select id="latency"><option value="1">1 model cycle</option><option value="3">3 model cycles</option><option value="6" selected>6 model cycles</option><option value="12">12 model cycles</option></select></label>`,
    prediction: 'How many idle cycles will the whole run contain?', maxGuess: 200,
    figureTitle: 'The SM at one cycle',
    figureHint: 'Step through the computed trace. Cards show each warp just before issue; the highlighted card is selected this cycle.',
    code: `// Illustrative CUDA source, not compiler output.
__global__ void scale(const float* x, float* y, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) y[i] = x[i] * 2.0f;
}
// A typical host-side launch:
scale<<<(n + 127) / 128, 128>>>(x, y, n);`,
    codeNote: `<p>The launch uses blocks of 128 threads. The expression rounds the block count up to cover <code>n</code> values; the condition excludes threads beyond the end. CUDA uses <code>&lt;&lt;&lt;blocks, threadsPerBlock&gt;&gt;&gt;</code> to launch a kernel.</p>
      <p>This is a link to the programming model, not the simulator's instruction stream. A compiler may change instructions. The toy run repeats its three-instruction sequence to expose dependency waits; it does not execute this source.</p>`,
    exercises: [
      'With one warp and latency six, predict the idle cycles. Inspect the first load and count the cycles before its multiply can issue.',
      'Keep the latency fixed and increase resident warps. Find a setting with no idle cycles. What runs while the first warp waits?',
      'Compare total cycles and instructions issued per cycle. More warps also do more work here: why would raw run duration be an unfair speedup comparison?',
      'Raise latency to twelve. Does the setting that previously filled every slot still do so? Explain your prediction before inspecting.',
    ],
    takeaway: `<p>More ready warps can fill issue slots that a single warp leaves unused. They cannot make this single-issue model start more than one instruction per cycle. Compare issue-slot use, or work completed per cycle, when the amount of work changes.</p>
      <p><strong>Occupancy</strong> is resident warps divided by the hardware's maximum resident warps on an SM. Registers, shared memory, block sizes, and hardware limits affect it. Occupancy does not tell you how many warps are ready. This lab selects the resident count directly and does not calculate resource-limited occupancy.</p>`,
    limits: 'This is a teaching machine, not a model of a particular NVIDIA SM. Real SMs have multiple schedulers, execution pipelines, variable memory latency and limited bandwidth. Loads from all warps can overlap without contention here. Stores complete after issue, and block placement, register limits, caches and instruction overlap are omitted. Model cycles are not GPU clock-cycle predictions.',
    source: guides.scheduling,
    sourceLabel: 'CUDA Programming Guide: hardware multithreading',
  },
  {
    slug: 'divergence', number: '03', title: 'Taking different paths', workedExample: 'divergence',
    subtitle: 'One condition can produce two active-lane masks.',
    prerequisite: 'Labs 01–02: a warp contains lanes, and instructions can issue with only some lanes active.',
    intro: `<p>Suppose a preprocessing step treats positive and negative tensor values differently. Some threads in one warp take the positive path while others take the negative path.</p><!-- NEW_CONCEPTS --><p>A lane excluded from an instruction's mask does no work for that instruction, but can participate in a later one. This model executes the positive path with its mask, then the negative path with its mask, skipping paths with no active lanes. Afterward, participating lanes continue together.</p>`,
    setup: `<p>Each positive lane multiplies its value by two. A negative lane either just negates its value, or negates it, multiplies it by two, and adds one. The inputs are +2 and −2 so you can check each output.</p>
      <p>We count only those path operations. The condition, loads, stores and control-flow instructions are excluded. One issued operation has 32 possible lane slots; only its mask's lanes perform useful work. Changing the number of negative-path operations changes the calculation as well as the work.</p>`,
    controls: `<label>Input signs<select id="pattern"><option value="positive">All positive</option><option value="negative">All negative</option><option value="alternating" selected>Alternating signs</option><option value="halves">First half positive</option><option value="one-negative">Only lane 0 negative</option></select></label>
      <label>Negative path<select id="negativeOps"><option value="1">Negate only</option><option value="3" selected>Negate, multiply, add</option></select></label>
      <label>Active lanes<select id="activeLanes"><option value="32">32 lanes</option><option value="16">First 16 lanes</option><option value="8">First 8 lanes</option></select></label>`,
    prediction: 'How many path operations will the warp issue?', maxGuess: 10,
    figureTitle: 'Which lanes participate?',
    figureHint: 'Each tile is a lane. + and − mark its input sign. Highlighted lanes execute the selected instruction; crossed-out lanes are outside the active prefix.',
    code: `// Illustrative branch; the compiler may use predication.
if (i < n) {
    float v = x[i];
    if (v >= 0.0f) {
        y[i] = v * 2.0f;
    } else {
        float a = -v;
        float b = a * 2.0f;
        y[i] = b + 1.0f;
    }
}`, 
    codeNote: `<p><code>float</code> holds an FP32 value; <code>&gt;=</code> means “greater than or equal to”. The inner condition chooses a calculation. The outer <code>i &lt; n</code> guards array bounds, as in the previous lab.</p>
      <p>The code shows the three-operation negative path. A real compiler may combine operations or use <strong>predication</strong>: conditionally enabling instructions instead of emitting a branch. Therefore these source lines do not establish an exact GPU instruction count.</p>`,
    exercises: [
      'Predict for all-positive inputs, then alternating signs. Follow the active mask through each operation. Are all lanes doing work on every operation?',
      'Compare alternating signs with a positive first half. Does grouping signs within this single warp change the issued operation count?',
      'Choose only lane 0 negative. How much of the warp participates in the negative path? Compare with all-negative inputs.',
      'Choose a positive first half and reduce active lanes to sixteen. Predict which path disappears. Explain why inactive tail lanes must not influence the condition masks.',
    ],
    takeaway: `<p>What matters here is whether both paths have participating lanes, not how many times adjacent input signs change. Grouping similar work into separate warps may avoid divergence, but rearranging data has costs and can change memory access patterns.</p>
      <p>Inactive tail lanes can also leave instruction slots unused even when every participating lane follows the same path. Low lane-slot use alone does not prove branch divergence. Nor does it directly measure elapsed time.</p>`,
    limits: 'The model serialises two explicit paths and counts their scalar operations. It does not model compiler optimisations, instruction latency, branch overhead, reconvergence machinery or independent thread scheduling. No universal execution order between divergent paths is promised by CUDA. Our chosen order is for inspection; real path order and compiled instruction count can differ.',
    source: 'https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html#branching-and-divergence',
    sourceLabel: 'CUDA Best Practices Guide: branching and divergence',
  },
  {
    slug: 'shared-memory', number: '04', title: 'Sharing work within a block', workedExample: 'shared-memory',
    subtitle: 'A small change in layout can change bank conflicts.',
    prerequisite: 'Chapters 5 and 8: warps, active lanes, shared memory and block barriers. This optional lab explores the layout of that shared workspace.',
    intro: `<p>A tiled tensor operation can load data once and reuse it across threads in the same block. The layout of that reusable data matters.</p><!-- NEW_CONCEPTS --><p>This model uses 32 banks. Successive four-byte words map to successive banks, wrapping around at bank zero. For word index <code>w</code>, the bank is <code>w % 32</code>, where <code>%</code> means remainder.</p><p>These bank rules describe reads; broadcasting a word does not make simultaneous writes safe.</p>`,
    setup: `<p>Imagine a square tile with 32 rows and 32 useful columns. Threads read one column, so successive lanes are separated by the row pitch: the number of allocated words per row. A pitch of 33 adds one unused padding word to each row.</p>
      <p>Each round serves at most one distinct word from each bank. Banks work in parallel; the busiest bank determines the number of rounds. Try a row read, a column read, a padded column, and a broadcast.</p>`,
    controls: `<label>Access pattern<select id="bankPattern"><option value="row">Row · stride 1</option><option value="column" selected>Column · stride 32</option><option value="padded">Padded column · stride 33</option><option value="stride2">Every other word · stride 2</option><option value="broadcast">Same word · broadcast</option></select></label>
      <label>Active lanes<select id="activeLanes"><option value="32">32 lanes</option><option value="16">First 16 lanes</option><option value="8">First 8 lanes</option></select></label>`,
    prediction: 'How many service rounds will this read need?', maxGuess: 32,
    figureTitle: 'Requests grouped by bank',
    figureHint: 'Select a round. Each bank card counts its distinct requested words; highlighted cards serve a word in this round. Select a lane to inspect its word and bank.',
    code: '// Extracted from examples/shared-memory.cu by the build.',
    codeNote: `<p><code>__shared__</code> places an array in shared memory. The two array dimensions allocate rows with a pitch of 33 words. Each thread fills one column across all rows. After the barrier, the threads read the first column, which thread zero filled. This fragment assumes a full tile, one block of 32 threads, and valid input and output allocations.</p>
      <p><code>__syncthreads()</code> is a block barrier: every thread in the block must reach it before any proceeds past it. Prior shared-memory writes become visible to the block. Here it ensures that thread zero's writes are ready before the other threads read them. A barrier inside a condition taken by only some block threads can hang or behave incorrectly. The bank model covers the final read; it does not simulate the loop or barrier.</p>`,
    exercises: [
      'Predict the rounds for a column read with pitch 32. Select lanes 0 and 1. They read different words: which banks receive them?',
      'Switch to a padded column with pitch 33. Explain why adding a padding word changes the bank mapping while preserving the useful column.',
      'Compare the unpadded column with a broadcast. Both use one bank. Why does only one of them need repeated service rounds?',
      'Choose every other word and reduce the active lanes to sixteen. Can this subset avoid the conflict that appears with a full warp?',
    ],
    takeaway: `<p>Bank conflicts depend on both the bank and the word address. A count of requests per bank would incorrectly penalise broadcasts. Padding changes the row pitch, which changes the bank mapping for column reads.</p>
      <p>Padding uses extra shared memory. That can affect how many blocks fit on an SM, connecting this layout choice to resident work in chapter 6. <a href="reduction.html">Revisit the cooperation chapter</a> to apply block barriers to a computed tree and inspect an unsafe interleaving. The bank model on this page covers reads only.</p>`,
    limits: 'We model one warp instruction reading aligned FP32 words through 32 banks of four-byte width, one distinct word per bank per round, with read broadcast. Rounds express conflict multiplicity, not measured cycles. Global-memory traffic, shared-memory writes, barriers, races, allocation limits, 64-bit accesses and matrix-specific load instructions are not simulated.',
    source: 'https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html#shared-memory-and-memory-banks',
    sourceLabel: 'CUDA Best Practices Guide: shared memory and memory banks',
  },
];
lessons.push(...remainingLessons);

const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

export function renderLesson(lesson, index) {
  const workedExample = lesson.workedExample ? renderWorkedExample(lesson.workedExample) : '';
  const terms = conceptsByLesson[lesson.slug] || [];
  if (terms.length && !lesson.intro.includes('<!-- NEW_CONCEPTS -->')) throw new Error('Missing new-concepts marker for ' + lesson.slug);
  const intro = lesson.intro.replace('<!-- NEW_CONCEPTS -->', renderConcepts({id:lesson.slug,terms}));
  const previous = lesson.slug==='shared-memory' ? 'reduction.html' : index ? `${lessons[index - 1].slug}.html` : 'memory.html';
  const next = lesson.slug==='shared-memory' ? 'matmul.html' : index + 1 < lessons.length ? `${lessons[index + 1].slug}.html` : '../index.html#curriculum';
  return `<!doctype html>
<!-- Copyright © 2026 Christopher Snow. -->
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="${lesson.subtitle}"><meta name="color-scheme" content="light dark"><link rel="icon" href="data:,">
<title>${lesson.title} · GPU Lab</title><link rel="stylesheet" href="../src/style.css"><link rel="stylesheet" href="../src/lessons.css"><link rel="stylesheet" href="../src/mechanism-visuals.css"><link rel="stylesheet" href="../src/worked-examples.css">
${lesson.slug==='scheduling'?'<link rel="stylesheet" href="../src/scheduling-relationships.css">':''}
<script type="module" src="../src/${lesson.engine === 'ai' ? 'ai-lesson' : 'lesson'}.mjs"></script></head>
<body data-lesson="${lesson.slug}"><a class="skip" href="#main">Skip to lesson</a>
<header class="topbar"><a class="brand" href="../index.html"><span class="brand-icon" aria-hidden="true">▦</span> GPU Lab <span class="brand-note">/ interactive course</span></a><div class="top-actions"><a href="https://github.com/snowch/gpu-lab">Source ↗</a><button id="theme" type="button" aria-label="Switch colour theme">Theme</button></div></header>
<div class="layout"><aside class="sidebar"><p class="eyebrow">HOW GPUS RUN AI</p><p class="sidebar-title">Under the hood.</p>
<nav class="lesson-nav" aria-label="Course lessons"><a href="../index.html">Course overview</a><a href="../index.html#meet-gpu">Meet the GPU</a><a href="hello.html">Start here: Hello, GPU</a><a href="kernel.html">Repair a kernel</a><a href="memory.html">01 Reading a tensor</a>${lessons.map(l => `<a href="${l.slug}.html" ${l.slug === lesson.slug ? 'class="current" aria-current="page"' : ''}>${l.number} ${l.title}</a>`).join('')}<a href="../index.html#curriculum">Course roadmap</a></nav>
<div class="sidebar-bottom"><span class="status-label">INTERACTIVE DRAFT</span><p>Computed models.<br>No GPU required.</p></div></aside>
<main id="main"><section class="intro"><p class="eyebrow">${lesson.slug==='shared-memory'?'OPTIONAL LAB':'LAB '+lesson.number} / GPU ARCHITECTURE</p><h1>${lesson.title}</h1><p class="lead">${lesson.subtitle}</p><p class="prerequisite"><strong>Before you start:</strong> ${lesson.prerequisite}</p></section>
<section class="prose"><h2>The mechanism</h2>${intro}</section>
${lesson.slug==='scheduling'?renderSchedulingRelationships():''}
${workedExample ? `<section class="section-space"><h2>Worked example</h2>${workedExample}</section>` : ''}
<section class="section-space"><h2>Experiment: try changing it</h2><div class="prose">${lesson.setup}</div>
<noscript><p class="notice">Enable JavaScript to use the simulator. The lesson and exercises remain readable.</p></noscript>
<div class="lab-panel"><div class="panel-top"><span class="eyebrow">PREDICT → SHOW → STEP</span><span class="model-badge">Teaching model</span></div>
<div class="controls" id="controls">${lesson.controls}</div>
${lesson.advancedControls ? `<details class="more-settings"><summary>More settings</summary><div class="controls">${lesson.advancedControls}</div></details>` : ''}
${lesson.namedChoices ? `<form id="prediction" class="prediction"><fieldset class="named-choices"><legend><strong>Make a prediction.</strong> ${lesson.prediction}</legend>${lesson.namedChoices.map((c,i)=>`<label class="named-choice"><input type="radio" name="guess" value="${c.value}"${i===0?' required':''}><span>${c.label}</span></label>`).join('')}</fieldset><div><button class="primary" type="submit">Check prediction</button><button id="show-result" type="button">Show result without guessing</button></div></form>` : `<form id="prediction" class="prediction"><label for="guess"><strong>Make a prediction.</strong> ${lesson.prediction}</label><div><input id="guess" type="number" min="0" max="${lesson.maxGuess}" required step="1" aria-label="Your prediction"><button class="primary" type="submit">Check prediction</button><button id="show-result" type="button">Show result without guessing</button></div></form>`}
<p id="feedback" class="feedback" role="status">Choose a configuration, then predict or inspect.</p>
<div id="results" hidden><div id="metrics" class="metrics"></div>
<div class="figure-label"><h3>${lesson.figureTitle}</h3></div><p class="figure-note">${lesson.figureHint}</p>
<div class="step-controls"><button id="back" type="button">Previous step</button><button id="next" type="button">Next step</button><button id="restart" type="button">Replay from start</button><label for="step">Trace position</label><input id="step" type="range" min="0" value="0"><output id="position" for="step"></output></div>
<p id="step-detail" class="lane-detail" aria-live="polite"></p><div id="figure" class="architecture-figure"></div>
<div id="lane-inspector" hidden><label for="lane">Inspect lane</label><select id="lane"></select><p id="lane-detail" aria-live="polite"></p></div>
<div id="trace" class="trace" aria-label="Computed instruction trace"></div><p id="explanation" class="explanation"></p></div>
<details class="model-note"><summary>Model assumptions and limits</summary><p>${lesson.limits}</p><a href="${lesson.source}">${lesson.sourceLabel} ↗</a></details></div></section>
<section class="two-col section-space"><div><p class="eyebrow">CONNECT TO CUDA</p><h2>The programming connection</h2>${lesson.codeNote}</div><div class="code-panel"><div class="code-title">${lesson.slug==='shared-memory'?'CUDA C++ · function from shared-memory.cu':'Illustrative CUDA · not executed in this page'}</div><pre><code>${escape(lesson.code)}</code></pre></div></section>
<section class="challenge section-space"><p class="eyebrow">TRY IT YOURSELF</p><h2>Change one thing. Explain the result.</h2><ol>${lesson.exercises.map(x=>`<li>${x}</li>`).join('')}</ol><details><summary>Compare your explanation</summary>${lesson.takeaway}</details></section>
${renderChapterReferences(lesson.slug)}
<nav class="lesson-pagination" aria-label="Lesson sequence"><a href="${previous}">← Previous lesson</a><a href="${next}">${index + 1 < lessons.length ? 'Next lesson →' : 'Return to roadmap →'}</a></nav>
<footer><span>Copyright © 2026 Christopher Snow.</span><a href="https://github.com/snowch/gpu-lab">Contribute or report a problem ↗</a></footer></main></div></body></html>`;
}
