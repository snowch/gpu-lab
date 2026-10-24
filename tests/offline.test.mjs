// Copyright © 2026 Christopher Snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { buildOffline } from '../scripts/offline.mjs';
import { validateRelease } from '../src/release-contract.mjs';

test('release fingerprints every file, measures bytes, pins assets and leaves worker installation lightweight', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'gpu-lab-offline-'));
  try {
    async function build(content = 'first') {
      await rm(directory, { recursive: true, force: true });
      await mkdir(`${directory}/lessons`, { recursive: true }); await mkdir(`${directory}/examples`);
      const html = '<html><head><link rel="stylesheet" href="../src/style.css"></head><body><div class="top-actions"></div><footer></footer></body></html>';
      await writeFile(`${directory}/index.html`, html); await writeFile(`${directory}/lessons/test.html`, html);
      await writeFile(`${directory}/examples/test.cu`, content);
      return buildOffline(directory);
    }
    const first = await build();
    assert.deepEqual(await build(), first);
    const second = await build('changed example'); assert.notEqual(second.id, first.id);
    for (const file of second.files) {
      const body = await readFile(`${directory}/releases/${second.id}/${file.path}`);
      assert.equal(file.bytes, body.length); assert.equal(file.sha256, createHash('sha256').update(body).digest('hex'));
    }
    assert.equal(second.bytes, second.files.reduce((n, f) => n + f.bytes, 0));
    assert.match(await readFile(`${directory}/lessons/test.html`, 'utf8'), new RegExp(`href="../releases/${second.id}/src/style.css"`));
    assert.match(await readFile(`${directory}/index.html`, 'utf8'), /id="app-status-open"/);
    assert.doesNotMatch(await readFile(`${directory}/sw.js`, 'utf8'), /cache\.addAll|skipWaiting/);
    for (const bad of [{ ...second, bytes: 0 }, { ...second, id: 'main' }, { ...second, files: [...second.files, second.files[0]] }, { ...second, files: [{...second.files[0], path:'../bad'}] }]) assert.throws(() => validateRelease(bad));
  } finally { await rm(directory, { recursive: true, force: true }); }
});
