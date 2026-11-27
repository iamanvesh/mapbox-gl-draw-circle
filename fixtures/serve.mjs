// Minimal static file server for built fixture apps: node serve.mjs <dir> <port>
// Unknown paths without an extension fall back to index.html (single-page apps).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const [root = '.', port = '4180'] = process.argv.slice(2);
const base = resolve(root);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

const tryFile = async (path) => {
  try {
    const s = await stat(path);
    return s.isDirectory() ? tryFile(join(path, 'index.html')) : path;
  } catch {
    return null;
  }
};

createServer(async (req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const target = normalize(join(base, urlPath));
  if (!target.startsWith(base)) {
    res.writeHead(403).end();
    return;
  }
  const file = (await tryFile(target))
    ?? (await tryFile(`${target}.html`))
    ?? (extname(target) ? null : await tryFile(join(base, 'index.html')));
  if (!file) {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' });
  res.end(await readFile(file));
}).listen(Number(port), () => console.log(`serving ${base} on http://localhost:${port}`));
