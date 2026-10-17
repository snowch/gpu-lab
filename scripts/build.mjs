// Copyright © 2026 Christopher Snow.
import { cp, mkdir, rm } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const path of ['index.html', 'src', 'examples']) {
  await cp(path, `dist/${path}`, { recursive: true });
}
console.log('Built static course in dist/ (all asset paths are relative).');
