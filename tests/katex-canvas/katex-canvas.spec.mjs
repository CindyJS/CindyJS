/**
 * Compares the KaTeX canvas backend against KaTeX's own HTML rendering.
 *
 * For each formula of the corpus (corpus/index.mjs) the harness page draws
 * the HTML reference and the canvas rendering side by side; the old KaTeX
 * 0.7 canvas fork is drawn on a second page at the same position. The
 * screenshots are diffed with a one pixel tolerance (see harness-entry.mjs),
 * giving a score: mismatched pixels per inked reference pixel.
 *
 * A case passes if its score is at most PASS_SCORE, the backend reported no
 * unsupported constructs, and the laid-out height and depth agree with
 * KaTeX's struts. Cases that are known not to pass yet are listed with their
 * score in expectations.json; for those the test only fails if the score
 * gets worse. Any case not listed there must pass. After deliberate changes,
 * regenerate the file with
 *
 *     KATEX_CANVAS_UPDATE=1 npm run test:katex-canvas
 *
 * and review the diff. The gallery at build/katex-canvas/index.html shows
 * every case as [reference | new | diff | old | diff].
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

import { loadVariants } from "./corpus/index.mjs";
import { macros as cindyMacros, preprocess } from "../../plugins/katex/src/js/macros.mjs";
import { OUT_DIR, EXPECTATIONS_FILE, fileName } from "./report.mjs";

const PASS_SCORE = 0.02;
// The tolerant diff forgives one-pixel offsets everywhere. Systematic offsets
// are caught by comparing darkness-weighted centroids instead, and missing or
// extra ink by comparing the total darkness.
const MAX_CENTROID_SHIFT = 0.75;
const MAX_DARKNESS_DEVIATION = 0.08;
// Tolerance before a known failure counts as having become worse.
const REGRESSION_SLACK = 0.01;
// Padding around the formula in each cell, in em.
const PAD_EM = 1.5;

const cases = loadVariants();
const expectations = JSON.parse(readFileSync(EXPECTATIONS_FILE, "utf8"));

test.describe.configure({ mode: "parallel" });

let newPage;
let oldPage;

test.beforeAll(async ({ browser }) => {
    const base = process.env.CINDY_BASE_URL;
    const context = await browser.newContext({ viewport: { width: 4000, height: 2400 }, deviceScaleFactor: 1 });
    newPage = await context.newPage();
    oldPage = await context.newPage();
    for (const page of [newPage, oldPage]) {
        page.on("pageerror", (e) => console.error(`page error: ${e.stack || e}`));
    }
    await newPage.goto(`${base}/tests/katex-canvas/harness.html`);
    await newPage.waitForFunction(() => window.harness !== undefined);
    await oldPage.goto(`${base}/tests/katex-canvas/old.html`);
    await oldPage.waitForFunction(() => window.renderOld !== undefined);
});

test.afterAll(async () => {
    await newPage?.context().close();
});

async function renderOld(testCase, info) {
    const tex = testCase.cindyMacros ? preprocess(testCase.tex) : testCase.tex;
    // The macro table of the old katex-plugin.js, including its workaround
    // for the then missing \operatorname.
    const macros = testCase.cindyMacros
        ? Object.assign({}, cindyMacros, { "\\operatorname": "\\text" })
        : testCase.macros || {};
    const options = {
        fontSize: info.emPx,
        macros,
        displayMode: testCase.display,
        throwOnError: !testCase.noThrow,
        errorColor: testCase.errorColor || undefined,
    };
    try {
        await oldPage.evaluate(
            ([tex, options, w, h, x, y]) => window.renderOld(tex, options, w, h, x, y),
            [tex, options, info.cellWidth, info.cellHeight, info.x0, info.y0]
        );
    } catch (e) {
        return { error: String(e.message || e).split("\n")[0] };
    }
    const shot = await oldPage.screenshot({
        clip: { x: 0, y: 0, width: info.cellWidth, height: info.cellHeight },
    });
    return { shot: `data:image/png;base64,${shot.toString("base64")}` };
}

for (const testCase of cases) {
    test(testCase.id, async () => {
        const result = { ...testCase };
        // Only KaTeX rejecting the input skips a case; an exception in the
        // canvas backend fails it.
        const parseError = await newPage.evaluate((c) => window.harness.parseError(c), testCase);
        if (parseError !== null) {
            result.status = "error";
            result.error = parseError.split("\n")[0];
            writeFileSync(join(OUT_DIR, "results", fileName(testCase.id) + ".json"), JSON.stringify(result));
            test.skip(true, `KaTeX cannot render this: ${result.error}`);
            return;
        }
        const info = await newPage.evaluate(
            ([c, pad]) => window.harness.render(c, c.hostPx, Math.round(pad * c.hostPx * 1.21)),
            [testCase, PAD_EM]
        );
        Object.assign(result, info);

        const shot = await newPage.screenshot({
            clip: { x: 0, y: 0, width: 2 * info.cellWidth, height: info.cellHeight },
        });
        const old = await renderOld(testCase, info);
        const cmp = await newPage.evaluate(
            ([s, o, w, h]) => window.harness.compare(s, o, w, h),
            [`data:image/png;base64,${shot.toString("base64")}`, old.shot || null, info.cellWidth, info.cellHeight]
        );
        cmp.new = JSON.parse(cmp.new);
        cmp.old = cmp.old && JSON.parse(cmp.old);
        expect(cmp.new.score, "inconsistent diff statistics").toBe(cmp.new.mismatched / Math.max(1, cmp.new.ink));
        result.new = cmp.new;
        result.old = cmp.old;
        result.oldError = old.error || null;
        writeFileSync(
            join(OUT_DIR, "img", fileName(testCase.id) + ".png"),
            Buffer.from(cmp.composite.split(",")[1], "base64")
        );

        const problems = [];
        // Rule thicknesses are snapped to pixels here (pixelRatio), so allow
        // for that; tests/KatexCanvas_tests.js checks the unsnapped extents
        // exactly.
        if (Math.abs(info.heightError) >= 1 || Math.abs(info.depthError) >= 1) {
            problems.push(`height/depth off by ${info.heightError.toFixed(3)}/${info.depthError.toFixed(3)}px`);
        }
        if (cmp.new.score > PASS_SCORE) problems.push(`diff score ${cmp.new.score.toFixed(4)}`);
        const c = cmp.new.centroidShift;
        if (c && Math.max(Math.abs(c.x), Math.abs(c.y)) > MAX_CENTROID_SHIFT) {
            problems.push(`ink centroid shifted by (${c.x.toFixed(2)}, ${c.y.toFixed(2)})px`);
        }
        if (cmp.new.darkness !== null && Math.abs(cmp.new.darkness - 1) > MAX_DARKNESS_DEVIATION) {
            problems.push(`${(100 * cmp.new.darkness).toFixed(1)}% of the reference's ink`);
        }
        result.problems = problems;
        if (expectations[testCase.id] && expectations[testCase.id].note) result.note = expectations[testCase.id].note;
        if (info.unsupported.length > 0) result.status = "unsupported";
        else if (problems.length === 0) result.status = "pass";
        else result.status = "fail";
        writeFileSync(join(OUT_DIR, "results", fileName(testCase.id) + ".json"), JSON.stringify(result));

        const expected = expectations[testCase.id];
        if (!expected) {
            expect(result.status, [`unsupported: [${info.unsupported}]`, ...problems].join("; ")).toBe("pass");
        } else {
            expect(cmp.new.score, `known ${expected.status} case got worse`).toBeLessThanOrEqual(
                expected.score + REGRESSION_SLACK
            );
            if (result.status === "pass") {
                test.info().annotations.push({ type: "improved", description: "now passes; update expectations" });
            }
        }
    });
}
