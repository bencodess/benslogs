import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, resolve, sep } from "node:path";

const PORT = Number(process.env.PORT || 4173);
const ROOT = new URL(".", import.meta.url).pathname.replace(/\/+$/, "");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".map": "application/json",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".gz": "application/gzip",
  ".txt": "text/plain; charset=utf-8",
};

function toSafePath(urlPath) {
  const raw = decodeURIComponent((urlPath || "/").split("?")[0]);
  const path = raw === "/" ? "/index.html" : raw;
  const resolved = resolve(ROOT, "." + path);
  if (!resolved.startsWith(ROOT + sep) && resolved !== ROOT) {
    return null;
  }
  return resolved;
}

function serveFile(res, absPath, status = 200) {
  const ext = extname(absPath).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-cache",
  });
  const stream = createReadStream(absPath);
  stream.on("error", () => {
    if (!res.headersSent) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("404 Not Found");
    }
  });
  stream.pipe(res);
}

function hasDirectoryIndex(absPath) {
  try {
    if (existsSync(absPath)) {
      const stats = statSync(absPath);
      if (stats.isDirectory()) {
        const indexFile = join(absPath, "index.html");
        return existsSync(indexFile) && statSync(indexFile).isFile();
      }
    }
  } catch {
    // fall through
  }
  return false;
}

createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Method Not Allowed");
    return;
  }

  const rawUrl = (req.url || "/").split("?")[0];
  const target = toSafePath(req.url || "/");

  if (!target) {
    send404(res);
    return;
  }

  if (rawUrl.length > 1 && !rawUrl.endsWith("/") && hasDirectoryIndex(target)) {
    res.writeHead(302, { Location: rawUrl + "/" });
    res.end();
    return;
  }

  try {
    if (existsSync(target)) {
      const stats = statSync(target);
      if (stats.isFile()) {
        serveFile(res, target, 200);
        return;
      }

      if (stats.isDirectory()) {
        const indexFile = join(target, "index.html");
        if (existsSync(indexFile) && statSync(indexFile).isFile()) {
          serveFile(res, indexFile, 200);
          return;
        }
      }
    }
  } catch {
    // fall through to 404
  }

  send404(res);
}).listen(PORT, () => {
  console.log(`Dev server running on http://localhost:${PORT}`);
});

function send404(res) {
  const custom404 = join(ROOT, "404.html");
  if (existsSync(custom404)) {
    serveFile(res, custom404, 404);
    return;
  }
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("404 Not Found");
}
