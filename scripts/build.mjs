// Copyright © 2026 Christopher Snow.
import { cp, mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { renderTensorStep,renderTensorSlice,renderStrideExample,viewCopyComparison,sectorComparison } from '../src/tensor-layout.mjs';
import { lessons, renderLesson } from '../content/lessons.mjs';
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
  .replace('<!-- STRIDE_EXAMPLE_COLUMN -->',renderStrideExample('column'))
  .replace('<!-- STRIDE_EXAMPLE_ROW -->',renderStrideExample('row'))
  .replace('<!-- VIEW_COPY_COMPARISON -->',viewCopyComparison())
  .replace('<!-- SECTOR_COMPARISON -->',sectorComparison()));
for (const [index, lesson] of lessons.entries()) {
  await writeFile(`dist/lessons/${lesson.slug}.html`, renderLesson(lesson, index));
}
await buildOffline('dist');
console.log('Built static course in dist/ with complete offline caching (all asset paths are relative).');
