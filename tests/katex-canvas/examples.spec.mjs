/**
 * Loads every example that typesets TeX twice, with the old KaTeX 0.7
 * plugin and with the new one, and compares the results.
 *
 * The old plugin is swapped in by routing the requests for
 * build/js/katex-plugin.js and build/js/katex/* to tests/katex-canvas/old,
 * so both runs use the same build of everything else.
 *
 * A run with the new plugin must not produce page errors, console errors or
 * failed requests that the old one did not, and on every page where the old
 * one typeset formulas it must typeset some too (counted as text drawn in
 * KaTeX fonts; the count differs between the versions). The
 * screenshots are diffed as well and shown side by side in
 * build/katex-canvas/examples.html; KaTeX 0.18 lays out some formulas a
 * little differently from 0.7, so the visual comparison is for review
 * rather than a pass criterion.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

import { REPO_ROOT } from "./paths.mjs";
import { OUT_DIR, fileName } from "./report.mjs";

const OLD_DIR = join(REPO_ROOT, "tests/katex-canvas/old");
const VIEWPORT = { width: 1100, height: 800 };
const WEBGL_EXAMPLE = "examples/cindygl/31_fft.html";

/**
 * Examples that typeset TeX: those that mention KaTeX and those drawing
 * `$...$` strings (which loads the plugin automatically). Examples needing
 * a webcam or a Leap Motion controller are left out, and of the WebGL ones
 * (slow under software rendering) only a single light one is kept.
 */
function examples() {
    const found = [];
    const dirs = [
        "examples",
        ...readdirSync(join(REPO_ROOT, "examples"), { withFileTypes: true })
            .filter((d) => d.isDirectory())
            .map((d) => "examples/" + d.name),
    ];
    for (const dir of dirs) {
        for (const name of readdirSync(join(REPO_ROOT, dir))) {
            if (!name.endsWith(".html")) continue;
            const path = dir + "/" + name;
            if (/webcam|cindyleap/i.test(path)) continue;
            if (/cindygl|cindyprint/.test(path) && path !== WEBGL_EXAMPLE) continue;
            const source = readFileSync(join(REPO_ROOT, path), "utf8");
            if (/katex/i.test(source) || /"[^"]*\$[^"$ ]+[^"$]*\$[^"]*"/.test(source)) found.push(path);
        }
    }
    return found.sort();
}

const MIME = {
    ".css": "text/css",
    ".js": "text/javascript",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
    ".ttf": "font/ttf",
    ".eot": "application/vnd.ms-fontobject",
};

async function useOldPlugin(page) {
    await page.route(/\/build\/js\/(katex-plugin\.js|webfont\.js|katex\/.*)$/, (route) => {
        const rel = new URL(route.request().url()).pathname.replace(/^.*\/build\/js\//, "");
        const file = join(OLD_DIR, rel);
        if (!existsSync(file)) return route.fulfill({ status: 404, body: "not found" });
        const ext = rel.slice(rel.lastIndexOf("."));
        return route.fulfill({ body: readFileSync(file), contentType: MIME[ext] || "application/octet-stream" });
    });
}

async function capture(browser, path, old) {
    const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const errors = [];
    const consoleErrors = [];
    const failed = [];
    page.on("pageerror", (e) => errors.push(String(e.message || e)));
    page.on("console", (m) => {
        if (m.type() === "error") consoleErrors.push(m.text());
    });
    page.on("requestfailed", (r) => failed.push(r.url()));
    page.on("response", (r) => {
        if (r.status() >= 400) failed.push(`${r.url()} (HTTP ${r.status()})`);
    });
    // Count text drawn in KaTeX fonts, i.e. typeset formulas.
    await page.addInitScript(() => {
        window.__katexGlyphs = 0;
        const fillText = CanvasRenderingContext2D.prototype.fillText;
        CanvasRenderingContext2D.prototype.fillText = function (...args) {
            if (/KaTeX_/.test(this.font)) ++window.__katexGlyphs;
            return fillText.apply(this, args);
        };
    });
    if (old) await useOldPlugin(page);

    await page.goto(`${process.env.CINDY_BASE_URL}/${path}`, { waitUntil: "load" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForFunction(() => document.fonts.status === "loaded").catch(() => {});
    // Fonts arriving trigger a repaint; give that and animations a moment.
    await page.waitForTimeout(1500);
    const first = await page.screenshot();
    await page.waitForTimeout(300);
    const shot = await page.screenshot();
    const glyphs = await page.evaluate(() => window.__katexGlyphs);
    await context.close();
    return {
        shot: `data:image/png;base64,${shot.toString("base64")}`,
        animated: !first.equals(shot),
        glyphs,
        errors,
        consoleErrors,
        failed,
    };
}

// Console noise that says nothing about the plugin: examples that use
// hardware or services a headless browser does not have.
const IRRELEVANT = [/WebGL/i, /AudioContext/i, /getUserMedia/i, /favicon/i];

function relevant(messages) {
    return messages.filter((m) => !IRRELEVANT.some((re) => re.test(m)));
}

test.describe.configure({ mode: "parallel" });

let comparePage;

test.beforeAll(async ({ browser }) => {
    mkdirSync(join(OUT_DIR, "examples"), { recursive: true });
    comparePage = await browser.newPage({ viewport: VIEWPORT });
    await comparePage.goto(`${process.env.CINDY_BASE_URL}/tests/katex-canvas/harness.html`);
    await comparePage.waitForFunction(() => window.harness !== undefined);
});

test.afterAll(async () => {
    await comparePage?.close();
});

for (const path of examples()) {
    test(`example ${path}`, async ({ browser }) => {
        test.setTimeout(path === WEBGL_EXAMPLE ? 180_000 : 60_000);
        const oldRun = await capture(browser, path, true);
        const newRun = await capture(browser, path, false);
        const cmp = await comparePage.evaluate(
            ([a, b, w, h]) => window.harness.compareTwo(a, b, w, h),
            [oldRun.shot, newRun.shot, VIEWPORT.width, VIEWPORT.height]
        );
        const stats = JSON.parse(cmp.stats);
        const id = fileName(path);
        writeFileSync(join(OUT_DIR, "examples", id + ".png"), Buffer.from(cmp.composite.split(",")[1], "base64"));
        const summary = {
            path,
            stats,
            animated: oldRun.animated || newRun.animated,
            glyphs: { old: oldRun.glyphs, new: newRun.glyphs },
            old: { errors: oldRun.errors, consoleErrors: oldRun.consoleErrors, failed: oldRun.failed },
            new: { errors: newRun.errors, consoleErrors: newRun.consoleErrors, failed: newRun.failed },
        };
        writeFileSync(join(OUT_DIR, "examples", id + ".json"), JSON.stringify(summary, null, 2));

        const added = (key) => relevant(newRun[key]).filter((m) => !oldRun[key].includes(m));
        expect(added("errors"), "new page errors").toEqual([]);
        expect(added("consoleErrors"), "new console errors").toEqual([]);
        expect(relevant(newRun.failed), "failed requests").toEqual([]);
        if (oldRun.glyphs > 0) expect(newRun.glyphs, "formulas typeset").toBeGreaterThan(0);
    });
}
