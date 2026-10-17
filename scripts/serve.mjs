// Copyright © 2026 Christopher Snow.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve(process.argv.includes('--dist') ? 'dist' : '.');
const types = { '.html': 'text/html', '.mjs': 'text/javascript', '.css': 'text/css', '.cu': 'text/plain' };
const server = createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname === '/gpu-lab') { res.writeHead(302, { Location: '/gpu-lab/' }); res.end(); return; }
    pathname = pathname.replace(/^\/gpu-lab\//, '/');
    const file = resolve(root, `.${pathname.endsWith('/') ? pathname + 'index.html' : pathname}`);
    if (!file.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch { if (!res.headersSent) res.writeHead(404); res.end('Not found'); }
});
server.listen(Number(process.env.PORT ?? 5173), '127.0.0.1', () => console.log('GPU Lab: http://localhost:5173/gpu-lab/'));
