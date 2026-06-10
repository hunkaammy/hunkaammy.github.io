import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const PORT = 8787;
const HOST = "0.0.0.0";
const ROOT = path.dirname(fileURLToPath(import.meta.url));

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

function getLanUrls() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter(i => i && i.family === "IPv4" && !i.internal)
    .map(i => `http://${i.address}:${PORT}`);
}

const server = http.createServer((req, res) => {
  // CORS headers for static file sharing if needed
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method !== "GET") {
    res.writeHead(405);
    res.end("Method not allowed");
    return;
  }

  // Parse path
  let filePath = req.url.split("?")[0];
  if (filePath === "/") {
    filePath = "/mobile.html";
  }

  const fullPath = path.join(ROOT, filePath);

  // Security check to avoid directory traversal
  if (!fullPath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-store"
    });
    res.end(data);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`\nMobile dashboard server running on http://127.0.0.1:${PORT}`);
  for (const u of getLanUrls()) {
    console.log(`Open on your phone: ${u}`);
  }
  console.log("");
});
