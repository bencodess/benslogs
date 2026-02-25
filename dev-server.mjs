import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { cwd } from 'node:process';

const PORT = Number(process.env.PORT || 4173);
const ROOT = cwd();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

function toSafePath(urlPath) {
  const raw = decodeURIComponent((urlPath || '/').split('?')[0]);
  const path = raw === '/' ? '/index.html' : raw;
  const normalized = normalize(path)
    .replace(/^(\.\.[/\\])+/, '')
    .replace(/^[/\\]+/, '');
  return join(ROOT, normalized);
}

function serveFile(res, absPath, status = 200) {
  const ext = extname(absPath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  res.writeHead(status, { 'Content-Type': type });
  createReadStream(absPath).pipe(res);
}

createServer((req, res) => {
  const target = toSafePath(req.url || '/');

  try {
    if (existsSync(target)) {
      const stats = statSync(target);
      if (stats.isFile()) {
        serveFile(res, target, 200);
        return;
      }

      if (stats.isDirectory()) {
        const indexFile = join(target, 'index.html');
        if (existsSync(indexFile) && statSync(indexFile).isFile()) {
          serveFile(res, indexFile, 200);
          return;
        }
      }
    }
  } catch {
    // fall through to custom 404
  }

  const custom404 = join(ROOT, '404.html');
  if (existsSync(custom404)) {
    serveFile(res, custom404, 404);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404 Not Found');
}).listen(PORT, () => {
  console.log(`Dev server running on http://localhost:${PORT}`);
});
