// Copyright © 2026 Christopher Snow.
import {renderChapterReferences} from '../src/reference-tasks.mjs';
// Published chapters form one continuous learner journey.
export const chapters=[
  {title:'One operation, many numbers',slug:'hello',summary:'Follow five values from PyTorch to threads, indices and a small CUDA kernel.',opening:true},
  {title:'Where do the numbers live?',slug:'devices',summary:'Copy inputs to the GPU, calculate there, and bring back a result.',opening:true},
  {title:'How do we select values from a tensor?',slug:'reading',summary:'Select rows and columns, then multiply the chosen values.',opening:true},
  {title:'How are tensor values arranged in memory?',slug:'layout',summary:'Follow values into storage, compare strides, then make a packed copy.',opening:true},
  {title:'How do threads read those values?',slug:'requests',summary:'Follow five reads from one warp and compare the sectors they touch.',opening:true},
  {title:'How can work continue during a wait?',slug:'scheduling',summary:'Follow a waiting warp, then see how another warp can make progress.',opening:true},
  {title:'What if lanes need different calculations?',slug:'divergence',summary:'Follow active lanes through different calculations.',opening:true},
  {title:'How do threads combine their results?',slug:'reduction',summary:'Build a sum using shared values and block barriers.',opening:true},
  {title:'How can matrix multiplication reuse its inputs?',slug:'matmul',summary:'Compare repeated loads with shared tiles in matrix multiplication.',opening:true},
  {title:'What changes when matrix inputs use fewer bits?',slug:'tensor-cores',summary:'Trace input rounding and accumulation, then connect them to matrix hardware.',opening:true},
  {title:'How can attention store less?',slug:'attention',summary:'Build a weighted result, then compare full intermediates with tiles.',opening:true},
  {title:'What limits an inference step?',slug:'inference',summary:'Follow the KV cache, then compare memory and compute bounds.',opening:true},
];
export function renderBookNav(current='index') {
  const home=current==='index',base=home?'./lessons/':'',overview=home?'./index.html':'../index.html';
  const link=(href,label,active=false)=>`<a href="${href}"${active?' class="current" aria-current="page"':''}>${label}</a>`;
  return `<nav class="lesson-nav" aria-label="Course lessons">${link(overview,'Course overview',home)}${chapters.filter(c=>c.opening).map((c,i)=>link(base+c.slug+'.html',`${i+1}. ${c.title}`,current===c.slug)).join('')}
    <p class="nav-group">Optional labs and references</p>${[
      ['memory','Memory access lab'],['shared-memory','Shared-memory banks'],['kernel','Repair a kernel'],
    ].map(([slug,title])=>link(base+slug+'.html',title,current===slug)).join('')}${link(base+'meet-gpu.html','Meet the GPU',current==='meet-gpu')}${link(overview+'#curriculum','Book roadmap')}</nav>`;
}
export function renderRoadmap() {
  return chapters.map((c,i)=>`<a href="./lessons/${c.slug}.html"><span class="module-no">${String(i+1).padStart(2,'0')}</span><div><h3>${c.title}</h3><p>${c.summary}</p></div><span class="tag live">${c.opening?'Read the chapter':'Explore existing lab'}</span></a>`).join('\n');
}
export function renderBookPage({slug,number,title,lead,content,previous,next,continuation=false}) {
  return `<!doctype html>
<!-- Copyright © 2026 Christopher Snow. -->
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="${lead}"><meta name="color-scheme" content="light dark"><link rel="icon" href="data:,"><title>${title} · GPU Lab</title><link rel="stylesheet" href="../src/style.css"><link rel="stylesheet" href="../src/lessons.css"><link rel="stylesheet" href="../src/hello.css"><link rel="stylesheet" href="../src/foundations.css"><link rel="stylesheet" href="../src/chapter.css">${continuation?'<link rel="stylesheet" href="../src/continuation.css"><link rel="stylesheet" href="../src/scheduling-relationships.css">':''}<script type="module" src="../src/${continuation?'continuation':'foundations'}.mjs"></script></head>
<body class="book-chapter"${continuation?` data-chapter="${slug}"`:''}><a class="skip" href="#main">Skip to chapter</a><header class="topbar"><a class="brand" href="../index.html"><span class="brand-icon" aria-hidden="true">▦</span> GPU Lab <span class="brand-note">/ interactive book</span></a><div class="top-actions"><a href="https://github.com/snowch/gpu-lab">Source ↗</a><button id="theme" type="button" aria-label="Switch colour theme">Theme</button></div></header>
<div class="layout"><aside class="sidebar" aria-label="Course navigation"><p class="eyebrow">HOW GPUS RUN AI</p><p class="sidebar-title">Under the hood.</p>${renderBookNav(slug)}<div class="sidebar-bottom"><span class="status-label">INTERACTIVE BOOK · DRAFT</span><p>Runs in your browser.<br>No GPU required.</p></div></aside><main id="main"><header class="intro"><p class="eyebrow">CHAPTER ${number}</p><h1>${title}</h1><p>${lead}</p></header><noscript><p class="notice">Enable JavaScript to run the experiments. The code, explanations and input diagrams remain readable without it.</p></noscript>
${content}
${continuation?'':`<section class="book-section"><h2>Run the real PyTorch example</h2><p><a href="../examples/book-opening.py" download>Download the PyTorch companion</a>. It checks values, devices, views and copies. These checks do not measure performance.</p>${'<pre class="book-code"><code>python book-opening.py --device cuda\n# Or check the values and layouts on a CPU:\npython book-opening.py --device cpu</code></pre>'}<p>Requires an installed PyTorch; CUDA mode also needs a compatible NVIDIA GPU and driver. CPU mode cannot demonstrate CPU–GPU transfers. GPU execution of this new companion has not yet been validated.</p></section>
`}
${renderChapterReferences(slug)}
<nav class="book-pager" aria-label="Chapter sequence"><a href="${previous.href}">← ${previous.title}</a><a href="${next.href}">${next.title} →</a></nav><footer><span>Copyright © 2026 Christopher Snow.</span><a href="https://github.com/snowch/gpu-lab">Contribute or report a problem ↗</a></footer></main></div></body></html>`;
}
