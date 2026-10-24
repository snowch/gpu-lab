// Copyright © 2026 Christopher Snow.
import { cp, mkdir, rm, writeFile, readFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { renderTensorStep,renderTensorSlice,renderStrideExample,viewCopyComparison,sectorComparison } from '../src/tensor-layout.mjs';
import { lessons, renderLesson } from '../content/lessons.mjs';
import { renderConcepts, warpConcepts } from '../src/concepts.mjs';
import { buildOffline } from './offline.mjs';
import { renderReferenceTask } from '../src/reference-tasks.mjs';
import {renderBookNav,renderRoadmap,renderBookPage} from '../content/book.mjs';
import {renderDeviceSections,renderReadingSections} from '../src/foundations-view.mjs';
import {simulateKernel} from '../src/kernel-model.mjs';
import { renderIntroSections } from '../src/hello-view.mjs';
import { renderSmOverview, renderWorkMap } from '../src/overview-visuals.mjs';
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const path of ['index.html', 'src', 'examples', 'assets', 'manifest.webmanifest']) {
  await cp(path, `dist/${path}`, { recursive: true });
}
await writeFile('dist/index.html', (await readFile('index.html', 'utf8'))
  .replace('<!-- BOOK_ROADMAP -->', renderRoadmap())
  .replace('<!-- SM_OVERVIEW -->', renderSmOverview())
  .replace('<!-- WORK_MAP -->', renderWorkMap()));
await mkdir('dist/lessons', { recursive: true });
const transfer = simulateKernel({index:'global',guard:true,operation:'multiply',blockSize:8},Array.from({length:6},(_,i)=>i+1));
const skipped = transfer.trace.filter(event=>event.op==='guard'&&!event.allowed).map(event=>event.global);
await writeFile('dist/lessons/hello.html', (await readFile('content/hello.html', 'utf8'))
  .replace('<!-- INTRO_SECTIONS -->', renderIntroSections())
  .replace('<!-- HELLO_TRANSFER -->', `<section class="hello-section-end"><h2>Try a new case</h2><p>Imagine ${transfer.input.length} inputs and ${transfer.blockSize} threads per block. How many blocks do you need? Which threads should skip the arrays?</p><details><summary>Compare your explanation</summary><p>${transfer.groups} block supplies ${transfer.threads} threads. Indices 0–${transfer.input.length-1} handle inputs; indices ${skipped.join(' and ')} skip the arrays. The check becomes <code>i &lt; ${transfer.input.length}</code>.</p></details><p><a href="kernel.html">Optional practice: repair a kernel →</a></p></section>`));
await writeFile('dist/lessons/devices.html', renderBookPage({slug:'devices',number:2,title:'Where do the numbers live?',lead:'Follow the same five values from CPU memory to GPU memory and back.',content:renderDeviceSections(),previous:{href:'hello.html',title:'Chapter 1: One operation, many numbers'},next:{href:'reading.html',title:'Chapter 3: How do threads read a tensor?'}}));
await writeFile('dist/lessons/reading.html', renderBookPage({slug:'reading',number:3,title:'How do threads read a tensor?',lead:'Multiply five values from a row or column, then follow their positions in memory.',content:renderReadingSections(),previous:{href:'devices.html',title:'Chapter 2: Where do the numbers live?'},next:{href:'scheduling.html',title:'Continue to the scheduling lab'}}));
await writeFile('dist/lessons/kernel.html', (await readFile('content/kernel.html', 'utf8')).replace('<!-- REFERENCE_KERNEL -->',renderReferenceTask('kernel')));
await writeFile('dist/lessons/memory.html', (await readFile('content/memory.html','utf8'))
  .replace('<!-- REFERENCE_MEMORY -->',renderReferenceTask('memory'))
  .replace('<!-- TENSOR_LAYOUT_FIGURE -->',renderTensorStep())
  .replace('<!-- TENSOR_SLICE_FIGURE -->',renderTensorSlice())
  .replace('<!-- WARP_CONCEPTS -->',renderConcepts({id:'memory',terms:warpConcepts,warpDiagram:true}))
  .replace('<!-- STRIDE_EXAMPLE_COLUMN -->',renderStrideExample('column'))
  .replace('<!-- STRIDE_EXAMPLE_ROW -->',renderStrideExample('row'))
  .replace('<!-- VIEW_COPY_COMPARISON -->',viewCopyComparison())
  .replace('<!-- SECTOR_COMPARISON -->',sectorComparison()));
for (const [index, lesson] of lessons.entries()) {
  await writeFile(`dist/lessons/${lesson.slug}.html`, renderLesson(lesson, index));
}
// Stamp the checked-out source revision before fingerprinting the offline files.
// The commit date is stable across rebuilds of the same revision.
let identity = { commit: null, date: null };
let versionMarkup = '<span class="build-info">Development build · source revision unavailable</span>';
try {
  const dirty = execFileSync('git', ['status', '--porcelain', '--untracked-files=normal'], { cwd: new URL('../', import.meta.url), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  if (dirty) throw new Error('Development build has uncommitted changes');
  const [sha, committedAt] = execFileSync('git', ['log', '-1', '--format=%H%n%cI'], {
    cwd: new URL('../', import.meta.url), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
  }).trim().split('\n');
  const date = new Date(committedAt).toISOString().slice(0, 10);
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error('Invalid commit hash');
  identity = { commit: sha, date };
  versionMarkup = `<span class="build-info" data-commit="${sha}">Commit <a href="https://github.com/snowch/gpu-lab/commit/${sha}" aria-label="View commit ${sha.slice(0, 7)}">${sha.slice(0, 7)}</a> · <time datetime="${date}">${date}</time></span>`;
} catch {
  // Source archives may have no Git metadata; keep them buildable without inventing a version.
}
for (const path of ['dist/index.html', ...(await readdir('dist/lessons')).filter(name => name.endsWith('.html')).map(name => `dist/lessons/${name}`)]) {
  const current=path==='dist/index.html'?'index':path.split('/').at(-1).replace('.html','');
  const html = (await readFile(path, 'utf8'))
    .replace(/<nav class="(?:course-nav|lesson-nav)"[^>]*>[\s\S]*?<\/nav>/,renderBookNav(current))
    .replaceAll('EIGHT LABS · DRAFT','INTERACTIVE BOOK · DRAFT');
  await writeFile(path, html.replace('</footer>', `${versionMarkup}</footer>`));
}
await buildOffline('dist', identity);
console.log('Built static course in dist/ with explicit, verified offline downloads (all asset paths are relative).');
