// Copyright © 2026 Christopher Snow.
import { cp, mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { renderTensorStep } from '../src/tensor-layout.mjs';
import { lessons, renderLesson } from '../content/lessons.mjs';
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const path of ['index.html', 'src', 'examples']) {
  await cp(path, `dist/${path}`, { recursive: true });
}
await mkdir('dist/lessons', { recursive: true });
await writeFile('dist/lessons/memory.html', (await readFile('content/memory.html','utf8')).replace('<!-- TENSOR_LAYOUT_FIGURE -->',renderTensorStep()));
for (const [index, lesson] of lessons.entries()) {
  await writeFile(`dist/lessons/${lesson.slug}.html`, renderLesson(lesson, index));
}
console.log('Built static course in dist/ (all asset paths are relative).');
