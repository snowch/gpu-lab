// Copyright © 2026 Christopher Snow.
import { cp, mkdir, rm, writeFile, readFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { renderTensorStep,renderTensorSlice,renderStrideExample,viewCopyComparison,sectorComparison } from '../src/tensor-layout.mjs';
import { lessons, renderLesson } from '../content/lessons.mjs';
import { renderConcepts, warpConcepts } from '../src/concepts.mjs';
import { buildOffline } from './offline.mjs';
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const path of ['index.html', 'src', 'examples', 'assets', 'manifest.webmanifest']) {
  await cp(path, `dist/${path}`, { recursive: true });
}
await mkdir('dist/lessons', { recursive: true });
await writeFile('dist/lessons/memory.html', (await readFile('content/memory.html','utf8'))
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
let versionMarkup = '<span class="build-info">Version information unavailable</span>';
try {
  const [sha, committedAt] = execFileSync('git', ['log', '-1', '--format=%H%n%cI'], {
    cwd: new URL('../', import.meta.url), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
  }).trim().split('\n');
  const date = new Date(committedAt).toISOString().slice(0, 10);
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error('Invalid commit hash');
  versionMarkup = `<span class="build-info" data-commit="${sha}">Commit <a href="https://github.com/snowch/gpu-lab/commit/${sha}" aria-label="View commit ${sha.slice(0, 7)}">${sha.slice(0, 7)}</a> · <time datetime="${date}">${date}</time><span class="version-status" role="status">Latest version unchecked</span></span>`;
} catch {
  // Source archives may have no Git metadata; keep them buildable without inventing a version.
}
for (const path of ['dist/index.html', ...(await readdir('dist/lessons')).filter(name => name.endsWith('.html')).map(name => `dist/lessons/${name}`)]) {
  const html = await readFile(path, 'utf8');
  const base = path === 'dist/index.html' ? './' : '../';
  await writeFile(path, html.replace('</footer>', `${versionMarkup}</footer>`)
    .replace('</head>', `<script type="module" src="${base}src/version.mjs"></script></head>`));
}
await buildOffline('dist');
console.log('Built static course in dist/ with complete offline caching (all asset paths are relative).');
