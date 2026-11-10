// Copyright © 2026 Christopher Snow.
import {mediaRangeResponse} from '../src/media-range.mjs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve(process.argv.includes('--dist') ? 'dist' : '.');
const types = { '.mp4':'video/mp4', '.vtt':'text/vtt; charset=utf-8', '.jpg':'image/jpeg', '.pdf':'application/pdf', '.txt':'text/plain; charset=utf-8', '.woff2':'font/woff2', '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.cu': 'text/plain', '.py': 'text/plain', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname === '/gpu-lab') { res.writeHead(302, { Location: '/gpu-lab/' }); res.end(); return; }
    pathname = pathname.replace(/^\/gpu-lab\//, '/');
    const file = resolve(root, `.${pathname.endsWith('/') ? pathname + 'index.html' : pathname}`);
    if (!file.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
    const body = await readFile(file);
    const response=await mediaRangeResponse(req.headers.range,new Response(body,{headers:{'Content-Type':types[extname(file)]??'application/octet-stream','Content-Length':String(body.length),'Accept-Ranges':'bytes'}}));
    res.writeHead(response.status,Object.fromEntries(response.headers));
    res.end(req.method==='HEAD'?undefined:Buffer.from(await response.arrayBuffer()));
  } catch { if (!res.headersSent) res.writeHead(404); res.end('Not found'); }
});
server.listen(Number(process.env.PORT ?? 5173), '127.0.0.1', () => console.log('GPU Lab: http://localhost:5173/gpu-lab/'));
