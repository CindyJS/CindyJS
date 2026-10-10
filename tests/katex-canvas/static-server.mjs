/**
 * Minimal static file server for the KaTeX plugin tests.
 *
 * The examples reference the build output by relative path (e.g.
 * `../build/js/Cindy.js`), so the whole repository root has to be served.
 */

import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join, normalize, sep } from "node:path";

const MIME_TYPES = {
    ".css": "text/css; charset=utf-8",
    ".gif": "image/gif",
    ".html": "text/html; charset=utf-8",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".map": "application/json; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".mp3": "audio/mpeg",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".txt": "text/plain; charset=utf-8",
    ".wasm": "application/wasm",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
};

/**
 * Starts a static server for `root` on an ephemeral port.
 *
 * @param {string} root absolute path of the directory to serve
 * @returns {Promise<{url: string, close: () => Promise<void>}>}
 */
export async function startStaticServer(root) {
    const server = createServer((req, res) => {
        serve(root, req, res).catch(() => {
            if (!res.headersSent) res.writeHead(500);
            res.end("internal error");
        });
    });

    await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", resolve);
    });
    // Keeping the server from holding the process open matters because the
    // Playwright runner exits while the handle would still be referenced.
    server.unref();

    const { port } = server.address();
    return {
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise((resolve) => server.close(() => resolve())),
    };
}

async function serve(root, req, res) {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    // `normalize` collapses `..` segments; the prefix check rejects anything
    // that still points outside the served root.
    const target = join(root, normalize(pathname));
    if (target !== root && !target.startsWith(root + sep)) {
        res.writeHead(403);
        res.end("forbidden");
        return;
    }

    let info;
    try {
        info = await stat(target);
    } catch {
        res.writeHead(404);
        res.end("not found");
        return;
    }
    if (info.isDirectory()) {
        res.writeHead(403);
        res.end("directory listing disabled");
        return;
    }

    res.writeHead(200, {
        "Content-Type": MIME_TYPES[extname(target).toLowerCase()] || "application/octet-stream",
        "Content-Length": info.size,
        "Cache-Control": "no-store",
    });
    createReadStream(target).pipe(res);
}
