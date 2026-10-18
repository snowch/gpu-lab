// Copyright © 2026 Christopher Snow.
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { installMarkup } from './install.mjs';

async function filesUnder(directory, prefix = '') {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${prefix}${entry.name}`;
    if (entry.isDirectory()) files.push(...await filesUnder(`${directory}/${entry.name}`, `${path}/`));
    else files.push(path);
  }
  return files.sort();
}

export async function buildOffline(directory) {
  const files = (await filesUnder(directory)).filter(path => path !== 'sw.js');
  for (const path of files.filter(path => path.endsWith('.html'))) {
    const base = '../'.repeat(path.split('/').length - 1) || './';
    const html = await readFile(`${directory}/${path}`, 'utf8');
    await writeFile(`${directory}/${path}`, installMarkup(html, base)
      .replace('<footer>', '<p id="offline-status" class="offline-status" role="status" hidden></p><footer>')
      .replace('</head>', `<script type="module" src="${base}src/offline.mjs"></script></head>`));
  }
  const template = await readFile(new URL('./service-worker.js', import.meta.url), 'utf8');
  const hash = createHash('sha256').update(template);
  for (const path of files) hash.update(path).update('\0').update(await readFile(`${directory}/${path}`)).update('\0');
  const version = hash.digest('hex').slice(0, 20);
  await writeFile(`${directory}/sw.js`, template
    .replace('__VERSION__', JSON.stringify(version))
    .replace('__FILES__', JSON.stringify(files)));
}
