import {renderLessonCompletion} from '../src/lesson-completion-view.mjs';
// Copyright © 2026 Christopher Snow.
import {exportDesktop} from './export-desktop.mjs';
import {renderDesktop} from '../content/desktop.mjs';
import {renderInsideSm} from '../content/inside-sm.mjs';
import {renderReductionVideo} from '../content/reduction-video.mjs';
import {renderMatmulVideo} from '../content/matmul-video.mjs';
import {renderDevicesVideo} from '../content/devices-video.mjs';
import {renderReadingVideo} from '../content/reading-video.mjs';
import {renderProfiling} from '../content/profiling.mjs';
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
import {explainHTML} from '../src/code-explanations-view.mjs';
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
await writeFile('dist/lessons/desktop.html',renderBookPage({slug:'desktop',appendix:true,title:'Run the examples on your desktop',lead:'Use real PyTorch or compile supported CUDA programs with GPGPU-Sim, with a clear check of what ran.',content:renderDesktop(desktopExamples,execution),previous:{href:'putting-it-together.html',title:'Chapter 13: Investigate a matrix multiplication'},next:{href:'../index.html',title:'Book contents'}}));
await writeFile('dist/lessons/profiling.html',renderBookPage({slug:'profiling',appendix:true,title:'Inspect PyTorch GPU launches',lead:'Capture a multiplication on an NVIDIA GPU, view its timeline and inspect the grid and block dimensions.',content:renderProfiling(await readFile('examples/profile-pytorch.py','utf8')),previous:{href:'desktop.html',title:'Desktop setup'},next:{href:'../index.html',title:'Book contents'}}));

await writeFile('dist/lessons/inside-sm.html',renderBookPage({slug:'inside-sm',appendix:true,title:'Inside an SM',lead:'Follow a value through GPU memory, registers and shared arithmetic hardware.',content:renderInsideSm(),references:false,pagination:false}).replace('<body class="book-chapter"','<body class="book-chapter sm-appendix"').replace('</head>','<link rel="stylesheet" href="../src/sm-video.css"><script type="module" src="../src/sm-video.mjs"></script></head>'));

await writeFile('dist/lessons/reduction-video.html',renderBookPage({slug:'reduction-video',appendix:true,title:'Shared memory and barriers',lead:'Follow four inputs through shared-memory writes, barriers and partial sums. Then inspect a read before its write.',content:renderReductionVideo(),references:false,pagination:false}).replace('<body class="book-chapter"','<body class="book-chapter sm-appendix"').replace('</head>','<link rel="stylesheet" href="../src/sm-video.css"><script type="module" src="../src/recording.mjs"></script></head>'));

await writeFile('dist/lessons/matmul-video.html',renderBookPage({slug:'matmul-video',appendix:true,title:'How matrix tiles reuse inputs',lead:'Follow input tiles into several outputs and keep partial sums while the inputs change.',content:renderMatmulVideo(),references:false,pagination:false}).replace('<body class="book-chapter"','<body class="book-chapter sm-appendix"').replace('</head>','<link rel="stylesheet" href="../src/sm-video.css"><script type="module" src="../src/recording.mjs"></script></head>'));

await writeFile('dist/lessons/devices-video.html',renderBookPage({slug:'devices-video',appendix:true,title:'Follow tensor values between CPU and GPU',lead:'Copy inputs, calculate on the GPU and request a CPU result. Keep storage locations and transfer counts distinct.',content:renderDevicesVideo(),references:false,pagination:false}).replace('<body class="book-chapter"','<body class="book-chapter sm-appendix"').replace('</head>','<link rel="stylesheet" href="../src/sm-video.css"><script type="module" src="../src/recording.mjs"></script></head>'));

await writeFile('dist/lessons/reading-video.html',renderBookPage({slug:'reading-video',appendix:true,title:'Select tensor rows and columns',lead:'Follow row and column coordinates into selected inputs and their elementwise results.',content:renderReadingVideo(),references:false,pagination:false}).replace('<body class="book-chapter"','<body class="book-chapter sm-appendix"').replace('</head>','<link rel="stylesheet" href="../src/sm-video.css"><script type="module" src="../src/recording.mjs"></script></head>'));

await writeFile('dist/lessons/meet-gpu.html',renderBookPage({slug:'meet-gpu',map:true,title:'GPU map',lead:'Open a component to explore its connections. Follow chapter links for explanations and experiments.',content:renderMap()}).replace('</head>','<link rel="stylesheet" href="../src/gpu-map.css"><script type="module" src="../src/gpu-map.mjs"></script></head>'));
await writeFile('dist/lessons/hello.html', (await readFile('content/hello.html', 'utf8'))
  .replace('<!-- INTRO_SECTIONS -->', renderIntroSections())
  .replace('<!-- HELLO_TRANSFER -->', renderIntroTransfer())
  .replace('<!-- REFERENCE_HELLO -->','<details class="hello-local"><summary>Optional: run locally or inspect a real PyTorch launch</summary>'+desktopLinks('hello')+'<p><a href="profiling.html">Inspect PyTorch’s real kernel launches</a> on an NVIDIA GPU, or read a saved trace.</p></details>'+renderChapterReferences('hello',{compact:true})));
await writeFile('dist/lessons/devices.html', renderBookPage({slug:'devices',number:2,title:'Where are tensor values stored?',lead:'Follow the same five values from CPU memory to GPU memory and back.',content:renderDeviceSections(),previous:{href:'hello.html',title:'Chapter 1: How does a GPU double five values?'},next:{href:'reading.html',title:'Chapter 3: How do we select values from a tensor?'}}));
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
    next:next?{href:next.slug+'.html',title:`Chapter ${chapter.number+1}: ${next.title}`}:{href:'../index.html#curriculum',title:'Return to the book contents'}}).replace('</head>',chapter.slug==='scheduling'?'<link rel="stylesheet" href="../src/sm-hardware.css"></head>':'</head>'));
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
  const html = explainHTML(await readFile(path, 'utf8'))
    .replace(/<nav class="(?:course-nav|lesson-nav)"[^>]*>[\s\S]*?<\/nav>/,renderBookNav(current))
    .replace('<!-- LESSON_COMPLETION -->',renderLessonCompletion(current))
    .replaceAll('EIGHT LABS · DRAFT','INTERACTIVE BOOK · DRAFT')
    .replace('<a href="https://github.com/snowch/gpu-lab">Source ↗</a>','<a class="github-star" href="https://github.com/snowch/gpu-lab" target="_blank" rel="noopener noreferrer" aria-label="Star on GitHub (opens in a new tab)"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" focusable="false"><path d="m12 3 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3L12 17.4l-5.6 3 1.1-6.3L3 9.6l6.2-.9Z"/></svg><span>Star on GitHub</span></a>')
    .replace('<div class="top-actions">','<div class="top-actions">'+(current==='meet-gpu'?'<a class="gpu-map-link" href="../index.html">Close map</a>':`<a class="gpu-map-link" href="${current==='index'?'./lessons/':''}meet-gpu.html?from=${current}">GPU map</a>`))
    .replace('<body class="',current==='meet-gpu'?'<body class="gpu-map-page ':'<body class="')
    .replace('</head>', '<link rel="stylesheet" href="'+(current==='index'?'./':'../')+'src/map-toggle.css"><script type="module" src="'+(current==='index'?'./':'../')+'src/map-toggle.mjs"></script></head>')
    .replace('</head>', '<script type="module" src="'+(current==='index'?'./':'../')+'src/desktop.mjs"></script><script type="module" src="'+(current==='index'?'./':'../')+'src/reading-links.mjs"></script></head>')
    .replace('</head>', '<link rel="stylesheet" href="'+(current==='index'?'./':'../')+'src/code-explanations.css"><script type="module" src="'+(current==='index'?'./':'../')+'src/code-explanations.mjs"></script></head>');
  const fontBase=current==='index'?'./':'../';
  await writeFile(path, html.replace('</head>', `<link rel="preload" href="${fontBase}assets/fonts/plex-sans.woff2" as="font" type="font/woff2" crossorigin></head>`).replace('</footer>', `${versionMarkup}</footer>`));
}
await buildOffline('dist', identity);
console.log('Built static course in dist/ with explicit, verified offline downloads (all asset paths are relative).');
