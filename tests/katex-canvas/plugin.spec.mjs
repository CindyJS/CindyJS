/**
 * The KaTeX plugin inside CindyJS: formulas drawn with drawtext must match
 * KaTeX's HTML rendering placed where CindyJS puts text, i.e. with the
 * CindyJS text size as the formula's em (as the old plugin had it), the
 * baseline at the given point and the requested alignment and colour, also
 * on a screen with two device pixels per CSS pixel.
 *
 * Uses the built artifacts (build/js/Cindy.js, build/js/katex-plugin.js).
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

import { OUT_DIR, fileName } from "./report.mjs";

const CASES = [];
for (const size of [13, 20, 32]) {
    for (const tex of ["x^2+y_i", "\\frac{a}{b}", "\\sqrt{2}\\cdot\\vec{v}", "\\sum_{i=1}^n i^2"]) {
        CASES.push({ tex, size, align: "left", color: "rgb(0, 0, 0)" });
    }
}
for (const align of ["mid", "right"]) CASES.push({ tex: "\\frac{\\sin x}{x}", size: 20, align, color: "rgb(0, 0, 0)" });
CASES.push({ tex: "\\overrightarrow{AB}+c", size: 24, align: "left", color: "rgb(0, 128, 0)" });
// CSS ignores invalid colours; b must not take over the red of a.
CASES.push({ tex: "\\color{red}{a}\\color{bogus}{b}c", size: 24, align: "left", color: "rgb(0, 0, 0)" });
const BORDERS = "\\fbox{a}\\begin{array}{c|c}a&b\\\\\\hline c&d\\end{array}";
CASES.push({ tex: BORDERS, size: 20, align: "left", color: "rgb(0, 0, 0)" });
// Rotated around the anchor, all parts of the text together: two formulas
// in one text, which must line up as one formula would.
for (const align of ["left", "mid"]) {
    CASES.push({
        tex: "x^2\\frac{a}{b}",
        text: "$x^2$$\\frac{a}{b}$",
        size: 24,
        align,
        color: "rgb(0, 0, 0)",
        angle: 0.5,
    });
}
for (const c of CASES.slice()) {
    if (/frac|sqrt|fbox/.test(c.tex) && c.align === "left") CASES.push({ ...c, dpr: 2 });
}

test.describe.configure({ mode: "parallel" });

const pages = {};
let comparePage;

async function pluginPage(browser, dpr) {
    const context = await browser.newContext({ viewport: { width: 1100, height: 400 }, deviceScaleFactor: dpr });
    const page = await context.newPage();
    page.on("pageerror", (e) => console.error(`page error: ${e.stack || e}`));
    await page.goto(`${process.env.CINDY_BASE_URL}/tests/katex-canvas/plugin.html`);
    return page;
}

test.beforeAll(async ({ browser }) => {
    mkdirSync(join(OUT_DIR, "plugin"), { recursive: true });
    pages[1] = await pluginPage(browser, 1);
    pages[2] = await pluginPage(browser, 2);
    comparePage = await pages[1].context().newPage();
    await comparePage.goto(`${process.env.CINDY_BASE_URL}/tests/katex-canvas/harness.html`);
    await comparePage.waitForFunction(() => window.harness !== undefined);
});

test.afterAll(async () => {
    for (const page of Object.values(pages)) await page.context().close();
});

for (const c of CASES) {
    const dpr = c.dpr || 1;
    const id =
        `${c.text || c.tex}@${c.size} ${c.align} ${c.color}` +
        (c.angle ? ` angle${c.angle}` : "") +
        (dpr === 1 ? "" : ` dpr${dpr}`);
    test(`plugin ${id}`, async () => {
        const page = pages[dpr];
        const { width, height } = await page.evaluate((c) => window.drawBoth({ ...c, x: 250, y: 110 }), c);
        const shot = async (x) =>
            "data:image/png;base64," + (await page.screenshot({ clip: { x, y: 0, width, height } })).toString("base64");
        const reference = await shot(0);
        const plugin = await shot(width);
        const cmp = await comparePage.evaluate(
            ([a, b, w, h]) => window.harness.compareTwo(a, b, w, h),
            [reference, plugin, width * dpr, height * dpr]
        );
        writeFileSync(
            join(OUT_DIR, "plugin", fileName(id) + ".png"),
            Buffer.from(cmp.composite.split(",")[1], "base64")
        );
        const stats = JSON.parse(cmp.stats);
        expect(stats.ink, "the reference has ink").toBeGreaterThan(0);
        expect(stats.score, "mismatched pixels per inked reference pixel").toBeLessThanOrEqual(0.02);
        expect(Math.abs(stats.centroidShift.x), "horizontal offset").toBeLessThanOrEqual(0.75);
        expect(Math.abs(stats.centroidShift.y), "vertical offset").toBeLessThanOrEqual(0.75);
        expect(Math.abs(stats.darkness - 1), "amount of ink").toBeLessThanOrEqual(0.08);
    });
}

// drawtable passes the plugin neither a text size nor a line height.
test("plugin drawtable", async () => {
    const fonts = await pages[1].evaluate(() =>
        window.drawTable('drawtable([50, 100], [["$x^2$", "b"], ["c", "$\\frac{1}{2}$"]], size->20);')
    );
    expect(fonts.filter((f) => /KaTeX_/.test(f)).length, "formulas drawn").toBeGreaterThan(0);
    expect(
        fonts.filter((f) => /undefined|NaN/.test(f)),
        "fonts without a size"
    ).toEqual([]);
});
