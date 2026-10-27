import {desktopLinks} from '../src/desktop-links.mjs';
// Copyright © 2026 Christopher Snow.
import {renderChapterReferences} from '../src/reference-tasks.mjs';
// Published chapters form one continuous learner journey.
import {chapters} from '../src/book-chapters.mjs';
export {chapters};
export function renderBookNav(current='index') {
  const home=current==='index',base=home?'./lessons/':'',overview=home?'./index.html':'../index.html';
  const link=(href,label,active=false)=>`<a href="${href}"${active?' class="current" aria-current="page"':''}>${label}</a>`;
  const group=(id,title,links)=>`<section class="nav-section" aria-labelledby="${id}"><h2 class="nav-group" id="${id}">${title}</h2>${links}</section>`;
  return `<nav class="lesson-nav" aria-label="Course lessons">${link(overview,'Course overview',home)}${link(overview+'#curriculum','Book roadmap')}
    ${group('nav-chapters','Chapters',chapters.filter(c=>c.opening).map((c,i)=>link(base+c.slug+'.html',`${i+1}. ${c.title}`,current===c.slug)).join(''))}
    ${group('nav-appendices','Appendices',link(base+'desktop.html','Run on your desktop',current==='desktop')+link(base+'meet-gpu.html','GPU map',current==='meet-gpu'))}
    ${group('nav-practice','Extra practice',link(base+'kernel.html','Repair a kernel',current==='kernel')+link(base+'shared-memory.html','Shared-memory banks',current==='shared-memory')+(current==='memory'?link(base+'memory.html','Memory access explorer',true):''))}</nav>`;

}
export function renderRoadmap() {
  return chapters.map((c,i)=>`<a href="./lessons/${c.slug}.html"><span class="module-no">${String(i+1).padStart(2,'0')}</span><div><h3>${c.title}</h3><p>${c.summary}</p></div><span class="tag live">${c.opening?'Read the chapter':'Explore existing lab'}</span></a>`).join('\n');
}
export function renderBookPage({slug,number,title,lead,content,previous,next,continuation=false,appendix=false}) {
  return `<!doctype html>
<!-- Copyright © 2026 Christopher Snow. -->
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="${lead}"><meta name="color-scheme" content="light dark"><link rel="icon" href="data:,"><title>${title} · GPU Lab</title><link rel="stylesheet" href="../src/style.css"><link rel="stylesheet" href="../src/lessons.css"><link rel="stylesheet" href="../src/hello.css"><link rel="stylesheet" href="../src/foundations.css"><link rel="stylesheet" href="../src/chapter.css">${continuation||appendix?'<link rel="stylesheet" href="../src/continuation.css"><link rel="stylesheet" href="../src/scheduling-relationships.css">':''}<script type="module" src="../src/${appendix?'theme':continuation?'continuation':'foundations'}.mjs"></script></head>
<body class="book-chapter"${continuation?` data-chapter="${slug}"`:''}><a class="skip" href="#main">Skip to chapter</a><header class="topbar"><a class="brand" href="../index.html"><span class="brand-icon" aria-hidden="true">▦</span> GPU Lab <span class="brand-note">/ interactive book</span></a><div class="top-actions"><a href="https://github.com/snowch/gpu-lab">Source ↗</a><button id="theme" type="button" aria-label="Switch colour theme">Theme</button></div></header>
<div class="layout"><aside class="sidebar" aria-label="Course navigation"><p class="eyebrow">HOW GPUS RUN AI</p><p class="sidebar-title">Under the hood.</p>${renderBookNav(slug)}<div class="sidebar-bottom"><span class="status-label">INTERACTIVE BOOK · DRAFT</span><p>Runs in your browser.<br>No GPU required.</p></div></aside><main id="main"><header class="intro"><p class="eyebrow">${appendix?'APPENDIX':'CHAPTER '+number}</p><h1>${title}</h1><p>${lead}</p></header>${appendix?'':'<noscript><p class="notice">Enable JavaScript to run the experiments. The code, explanations and input diagrams remain readable without it.</p></noscript>'}
${content}
${appendix?'':desktopLinks(slug)}
${renderChapterReferences(slug)}
<nav class="book-pager" aria-label="Chapter sequence"><a href="${previous.href}">← ${previous.title}</a><a href="${next.href}">${next.title} →</a></nav><footer><span>Copyright © 2026 Christopher Snow.</span><a href="https://github.com/snowch/gpu-lab">Contribute or report a problem ↗</a></footer></main></div></body></html>`;
}
