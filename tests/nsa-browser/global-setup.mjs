/**
 * Playwright global setup for the nsa browser tests: checks that the build
 * exists and serves the repository root (the examples load
 * ../build/js/Cindy.js).
 */

import { access } from "node:fs/promises";
import { join } from "node:path";

import { REPO_ROOT } from "../katex-canvas/paths.mjs";
import { startStaticServer } from "../katex-canvas/static-server.mjs";

export default async function globalSetup() {
    await access(join(REPO_ROOT, "build/js/Cindy.js")).catch(() => {
        throw new Error("Missing build/js/Cindy.js; build it first: node make Cindy.js");
    });
    const server = await startStaticServer(REPO_ROOT);
    process.env.CINDY_BASE_URL = server.url;
    return async () => {
        await server.close();
    };
}
