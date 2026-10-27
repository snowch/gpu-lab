// Copyright © 2026 Christopher Snow.
import {exportDesktop} from './export-desktop.mjs';
import {renderDesktop} from '../content/desktop.mjs';
import {desktopLinks} from '../src/desktop-links.mjs';
import {memorySetup,memoryExample} from '../src/book-code.mjs';
import {escape} from '../src/continuation-ui.mjs';
import { cp, mkdir, rm, writeFile, readFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { renderTensorStep,renderTensorSlice,renderStrideExample,viewCopyComparison,sectorComparison } from '../src/tensor-layout.mjs';
import { lessons, renderLesson } from '../content/lessons.mjs';
import { renderConcepts, warpConcepts } from '../src/concepts.mjs';
import { buildOffline } from './offline.mjs';
import { renderChapterReferences } from '../src/reference-tasks.mjs';
import {chapters,renderBookNav,renderRoadmap,renderBookPage} from '../content/book.mjs';
import {renderDeviceSections,renderReadingSections} from '../src/foundations-view.mjs';
import {continuationChapters,renderContinuation} from '../src/continuation-view.mjs';
import { renderIntroSections, renderIntroTransfer } from '../src/hello-view.mjs';
import {renderMap} from '../src/gpu-map-view.mjs';
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const path of ['index.html', 'src', 'examples', 'assets', 'manifest.webmanifest']) {
  await cp(path, `dist/${path}`, { recursive: true });
}
await writeFile('dist/index.html', (await readFile('index.html', 'utf8'))
  .replace('<!-- BOOK_ROADMAP -->', renderRoadmap()));
await mkdir('dist/lessons', { recursive: true });
const desktopExamples=await exportDesktop('dist/examples/desktop');
const dockerfile=await readFile('docker/cuda-sim.Dockerfile','utf8');
const execution={revision:dockerfile.match(/ARG GPGPUSIM_REV=(\w+)/)[1],image:dockerfile.match(/^FROM (.+)$/m)[1]};
await writeFile('dist/lessons/desktop.html',renderBookPage({slug:'desktop',appendix:true,title:'Run the examples on your desktop',lead:'Use real PyTorch or compile supported CUDA programs with GPGPU-Sim, with a clear check of what ran.',content:renderDesktop(desktopExamples,execution),previous:{href:'inference.html',title:'Chapter 12: What limits an inference step?'},next:{href:'../index.html',title:'Book contents'}}));

await writeFile('dist/lessons/meet-gpu.html',renderBookPage({slug:'meet-gpu',appendix:true,title:'Explore the GPU map',lead:'See how the book’s concepts fit together: work, memory and AI operations.',content:renderMap(),previous:{href:'../index.html',title:'Course overview'},next:{href:'hello.html',title:'Start chapter 1'}}).replace('</head>','<link rel="stylesheet" href="../src/gpu-map.css"><script type="module" src="../src/gpu-map.mjs"></script></head>'));
await writeFile('dist/lessons/hello.html', (await readFile('content/hello.html', 'utf8'))
  .replace('<!-- INTRO_SECTIONS -->', renderIntroSections())
  .replace('<!-- HELLO_TRANSFER -->', renderIntroTransfer())
  .replace('<!-- REFERENCE_HELLO -->',desktopLinks('hello')+renderChapterReferences('hello')));
await writeFile('dist/lessons/devices.html', renderBookPage({slug:'devices',number:2,title:'Where do the numbers live?',lead:'Follow the same five values from CPU memory to GPU memory and back.',content:renderDeviceSections(),previous:{href:'hello.html',title:'Chapter 1: One operation, many numbers'},next:{href:'reading.html',title:'Chapter 3: How do we select values from a tensor?'}}));
for(const [i,part] of ['selection','layout','requests'].entries()) {
  const chapter=chapters[i+2],previous=chapters[i+1],next=chapters[i+3];
  await writeFile(`dist/lessons/${chapter.slug}.html`,renderBookPage({slug:chapter.slug,number:i+3,title:chapter.title,lead:chapter.summary,content:renderReadingSections(part),previous:{href:previous.slug+'.html',title:`Chapter ${i+2}: ${previous.title}`},next:{href:next.slug+'.html',title:`Chapter ${i+4}: ${next.title}`}}));
}
await writeFile('dist/lessons/kernel.html', (await readFile('content/kernel.html', 'utf8')).replace('<!-- REFERENCE_KERNEL -->',desktopLinks('kernel')+renderChapterReferences('kernel')));
await writeFile('dist/lessons/memory.html', (await readFile('content/memory.html','utf8'))
  .replace('<!-- REFERENCE_MEMORY -->',desktopLinks('memory')+renderChapterReferences('memory'))
  .replace('<!-- MEMORY_SETUP_CODE -->',escape(memorySetup))
  .replace('<!-- MEMORY_FULL_CODE -->',escape(memoryExample))
  .replace('<!-- TENSOR_LAYOUT_FIGURE -->',renderTensorStep())
  .replace('<!-- TENSOR_SLICE_FIGURE -->',renderTensorSlice())
  .replace('<!-- WARP_CONCEPTS -->',renderConcepts({id:'memory',terms:warpConcepts,warpDiagram:true}))
  .replace('<!-- STRIDE_EXAMPLE_COLUMN -->',renderStrideExample('column'))
  .replace('<!-- STRIDE_EXAMPLE_ROW -->',renderStrideExample('row'))
  .replace('<!-- VIEW_COPY_COMPARISON -->',viewCopyComparison())
  .replace('<!-- SECTOR_COMPARISON -->',sectorComparison()));
const bankSource=await readFile('examples/shared-memory.cu','utf8');
const bankKernel=bankSource.split('// BEGIN BANK KERNEL')[1].split('// END BANK KERNEL')[0].trim();
for (const [index, original] of lessons.entries()) {
  const lesson=original.slug==='shared-memory'?{...original,code:bankKernel,codeNote:original.codeNote+'<p>This function is extracted from <a href="../examples/shared-memory.cu" download>the complete self-checking CUDA program</a>, which supplies its launch and host setup. <a href="desktop.html#first-cuda">Run it using the desktop appendix</a>.</p>'}:original;
  if(!continuationChapters.some(chapter=>chapter.slug===lesson.slug))await writeFile(`dist/lessons/${lesson.slug}.html`, renderLesson(lesson, index));
}
for(const chapter of continuationChapters) {
  const previous=chapters[chapter.number-2],next=chapters[chapter.number];
  await writeFile(`dist/lessons/${chapter.slug}.html`,renderBookPage({...chapter,content:renderContinuation(chapter),continuation:true,
    previous:{href:previous.slug+'.html',title:`Chapter ${chapter.number-1}: ${previous.title}`},
    next:next?{href:next.slug+'.html',title:`Chapter ${chapter.number+1}: ${next.title}`}:{href:'../index.html#curriculum',title:'Return to the book contents'}}));
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
    .replaceAll('EIGHT LABS · DRAFT','INTERACTIVE BOOK · DRAFT')
    .replace('<div class="top-actions">','<div class="top-actions">'+(current==='meet-gpu'?'':`<a class="gpu-map-link" href="${current==='index'?'./lessons/':''}meet-gpu.html?from=${current}&amp;chapter=${current}" target="gpu-lab-map" aria-label="GPU map (opens a separate tab)">GPU map</a>`))
    .replace('</head>', '<script type="module" src="'+(current==='index'?'./':'../')+'src/desktop.mjs"></script></head>');
  await writeFile(path, html.replace('</footer>', `${versionMarkup}</footer>`));
}
await buildOffline('dist', identity);
console.log('Built static course in dist/ with explicit, verified offline downloads (all asset paths are relative).');
