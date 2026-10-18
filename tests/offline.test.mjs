// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildOffline } from '../scripts/offline.mjs';

test('offline build fingerprints all content and includes nested lessons and downloads', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'gpu-lab-offline-'));
  try {
    async function build(content = 'first') {
      await rm(directory, { recursive: true, force: true });
      await mkdir(`${directory}/lessons`, { recursive: true });
      await mkdir(`${directory}/examples`);
      const html = '<html><head></head><body><footer></footer></body></html>';
      await writeFile(`${directory}/index.html`, html);
      await writeFile(`${directory}/lessons/test.html`, html);
      await writeFile(`${directory}/examples/test.cu`, content);
      await buildOffline(directory);
      return readFile(`${directory}/sw.js`, 'utf8');
    }
    const first = await build();
    assert.equal(await build(), first, 'unchanged builds do not trigger a new download');
    assert.notEqual(await build('changed example'), first, 'even a download-only change updates the cache');
    const paths = JSON.parse(first.match(/const FILES = (.*);/)[1]);
    assert.deepEqual(paths, ['examples/test.cu', 'index.html', 'lessons/test.html']);
    assert.doesNotMatch(first, /__VERSION__|__FILES__/);
    assert.match(await readFile(`${directory}/index.html`, 'utf8'), /src="\.\/src\/offline.mjs"/);
    assert.match(await readFile(`${directory}/lessons/test.html`, 'utf8'), /src="\.\.\/src\/offline.mjs"/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
