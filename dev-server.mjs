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

const esc = (code, s) => `\x1b[${code}m${s}\x1b[0m`;
const dim = (s) => esc("2", s);
const green = (s) => esc("32", s);
const yellow = (s) => esc("33", s);
const red = (s) => esc("31", s);
const cyan = (s) => esc("36", s);
const magenta = (s) => esc("35", s);

function methodColor(m) {
  switch (m) {
    case "GET":
      return green(m);
    case "HEAD":
      return cyan(m);
    case "POST":
      return yellow(m);
    case "PUT":
    case "PATCH":
      return magenta(m);
    case "DELETE":
      return red(m);
    default:
      return m;
  }
}

function statusColor(s) {
  if (s < 200) return magenta(String(s));
  if (s < 300) return green(String(s));
  if (s < 400) return cyan(String(s));
  if (s < 500) return yellow(String(s));
  return red(String(s));
}

function timeColor(ms) {
  if (ms < 10) return green(`${ms}ms`);
  if (ms < 50) return yellow(`${ms}ms`);
  return red(`${ms}ms`);
}

function shortType(ct) {
  if (!ct) return "-";
  if (ct.includes("text/html")) return "html";
  if (ct.includes("text/css")) return "css";
  if (ct.includes("javascript")) return "js";
  if (ct.includes("image/")) return ct.split("/")[1];
  if (ct.includes("application/json")) return "json";
  if (ct.includes("font/")) return ct.split("/")[1];
  return ct;
}

createServer((req, res) => {
  const start = Date.now();
  const originalWriteHead = res.writeHead.bind(res);
  let status = 200;
  res.writeHead = function (statusCode, ...args) {
    status = statusCode;
    return originalWriteHead(statusCode, ...args);
  };

  res.once("finish", () => {
    const elapsed = Date.now() - start;
    const ts = dim(new Date().toLocaleTimeString());
    const method = methodColor(req.method).padEnd(6);
    const url = req.url || "/";
    const sc = statusColor(status);
    const type = shortType(res.getHeader("Content-Type"));
    console.log(
      `${ts}  ${method} ${url}  ${sc}  ${type}  ${timeColor(elapsed)}`,
    );
  });

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
