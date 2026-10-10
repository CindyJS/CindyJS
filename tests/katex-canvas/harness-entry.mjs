/**
 * Browser side of the KaTeX canvas comparison suite (bundled by
 * global-setup.mjs into build/katex-canvas/harness.js).
 *
 * For one formula, `harness.render` draws KaTeX's regular HTML output (the
 * reference) and the canvas backend's output side by side into two cells of
 * equal size, with the formula's baseline at the same position in both. The
 * test then screenshots the stage and hands the image back to
 * `harness.compare`, which diffs the two halves in the browser, so no image
 * library is needed in node.
 */

import katex from "katex";
import { layout, render } from "../../plugins/katex/src/js/canvas-backend.mjs";
import { katexOptions as pluginOptions, preprocess } from "../../plugins/katex/src/js/macros.mjs";

const stage = document.getElementById("stage");
const htmlCell = document.getElementById("htmlCell");
const canvasCell = document.getElementById("canvasCell");
const host = document.getElementById("host");
const canvas = document.getElementById("canvas");

// The CindyJS sets render with the plugin's own options (macros,
// colorIsTextColor); KaTeX's test cases with KaTeX's defaults.
function katexOptions(testCase) {
    return Object.assign({ strict: "ignore" }, testCase.cindyMacros ? pluginOptions : {}, {
        displayMode: testCase.display,
        throwOnError: !testCase.noThrow,
        errorColor: testCase.errorColor || undefined,
        trust: true,
        macros: Object.assign({}, testCase.cindyMacros ? pluginOptions.macros : {}, testCase.macros || {}),
    });
}

function texOf(testCase) {
    return testCase.cindyMacros ? preprocess(testCase.tex) : testCase.tex;
}

/** Sum of the struts' height and depth, i.e. KaTeX's own idea of the extent. */
function strutExtent(tree, em) {
    let height = 0;
    let depth = 0;
    let lines = 1;
    (function walk(node) {
        if (node.classes && node.classes.indexOf("katex-newline") !== -1) ++lines;
        if (node.classes && node.classes.indexOf("katex-strut") !== -1) {
            const h = parseFloat(node.style.height) * em;
            const d = -(parseFloat(node.style.verticalAlign || "0") || 0) * em;
            height = Math.max(height, h - d);
            depth = Math.max(depth, d);
            return;
        }
        (node.children || []).forEach(walk);
    })(tree);
    // Struts cannot express the extent of several stacked lines.
    return lines > 1 ? null : { height, depth };
}

/** KaTeX's error message if it rejects the input, else null. */
function parseError(testCase) {
    try {
        katex.__renderToHTMLTree(texOf(testCase), katexOptions(testCase));
        return null;
    } catch (e) {
        return String(e.message || e);
    }
}

async function render_(testCase, hostPx, pad) {
    const tex = texOf(testCase);
    const options = katexOptions(testCase);

    // Reference: KaTeX's HTML rendering.
    host.style.fontSize = hostPx + "px";
    host.textContent = "";
    katex.render(tex, host, options);
    host.getBoundingClientRect();
    await document.fonts.ready;
    await Promise.all(Array.from(host.querySelectorAll("img"), (img) => img.decode().catch(() => null)));

    const emPx = parseFloat(getComputedStyle(host.querySelector(".katex")).fontSize);
    const firstBase = host.querySelector(".katex-base");
    const strut = firstBase.querySelector(".katex-strut");
    const strutRect = strut.getBoundingClientRect();
    const strutDepth = -(parseFloat(strut.style.verticalAlign || "0") || 0) * emPx;
    const hostRect = host.getBoundingClientRect();
    const baseLeft = firstBase.getBoundingClientRect().left - hostRect.left;
    const baseline = strutRect.bottom - strutDepth - hostRect.top;

    // Canvas: lay out once to learn the fonts, load them, lay out again.
    const tree = katex.__renderToHTMLTree(tex, options);
    const ctx = canvas.getContext("2d");
    const images = {};
    const layoutOptions = { fontSize: emPx, pixelRatio: window.devicePixelRatio, images };
    let box = layout(tree, ctx, layoutOptions);
    await Promise.all(box.fonts.map((f) => document.fonts.load(f)));
    await Promise.all(box.images.map(async (src) => (images[src] = await loadImage(src).catch(() => null))));
    box = layout(tree, ctx, layoutOptions);

    const width = Math.ceil(Math.max(hostRect.width, box.width) + 2 * pad);
    const height = Math.ceil(Math.max(hostRect.height, box.height + box.depth) + 2 * pad);
    for (const cell of [htmlCell, canvasCell]) {
        cell.style.width = width + "px";
        cell.style.height = height + "px";
    }
    host.style.left = pad + "px";
    host.style.top = pad + "px";
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    const c = canvas.getContext("2d");
    c.fillStyle = "#fff";
    c.fillRect(0, 0, width, height);
    c.fillStyle = "#000";
    const x0 = pad + baseLeft;
    const y0 = pad + baseline;
    render(c, box, x0, y0, { images });

    // Let both renderings reach the screen before the screenshot.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const extent = strutExtent(tree, emPx);
    return {
        cellWidth: width,
        cellHeight: height,
        x0,
        y0,
        emPx,
        htmlWidth: host.querySelector(".katex-html").getBoundingClientRect().width,
        canvasWidth: box.width,
        heightError: extent ? box.height - extent.height : 0,
        depthError: extent ? box.depth - extent.depth : 0,
        unsupported: box.unsupported,
        fonts: box.fonts,
    };
}

function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("could not decode screenshot"));
        image.src = dataUrl;
    });
}

async function pixels(dataUrl, x, y, w, h) {
    const image = await loadImage(dataUrl);
    const probe = document.createElement("canvas");
    probe.width = w;
    probe.height = h;
    const ctx = probe.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(image, -x, -y);
    return ctx.getImageData(0, 0, w, h);
}

// A channel difference above this counts as a visible difference.
const THRESHOLD = 96;
// Threshold of the strict, pixel-by-pixel comparison.
const STRICT_THRESHOLD = 48;

/**
 * Compares two images of equal size. A pixel only counts as mismatched if no
 * pixel in the 3x3 neighbourhood of the other image is close to it, which
 * absorbs anti-aliasing and sub-pixel differences of at most one pixel.
 */
function diff(a, b) {
    const w = a.width;
    const h = a.height;
    const A = a.data;
    const B = b.data;
    const out = new ImageData(w, h);
    const O = out.data;
    let mismatched = 0;
    let strict = 0;
    // Darkness-weighted centroids, to detect systematic sub-pixel offsets.
    const centroid = () => ({ w: 0, x: 0, y: 0 });
    const cA = centroid();
    const cB = centroid();
    let ink = 0;
    const bbox = () => ({ x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity });
    const inkA = bbox();
    const inkB = bbox();
    const grow = (bb, x, y) => {
        bb.x0 = Math.min(bb.x0, x);
        bb.y0 = Math.min(bb.y0, y);
        bb.x1 = Math.max(bb.x1, x);
        bb.y1 = Math.max(bb.y1, y);
    };
    const nearest = (P, Q, x, y) => {
        const i = (y * w + x) * 4;
        let best = 255;
        for (let dy = -1; dy <= 1; ++dy) {
            const yy = y + dy;
            if (yy < 0 || yy >= h) continue;
            for (let dx = -1; dx <= 1; ++dx) {
                const xx = x + dx;
                if (xx < 0 || xx >= w) continue;
                const j = (yy * w + xx) * 4;
                const d = Math.max(Math.abs(P[i] - Q[j]), Math.abs(P[i + 1] - Q[j + 1]), Math.abs(P[i + 2] - Q[j + 2]));
                if (d < best) best = d;
            }
        }
        return best;
    };
    for (let y = 0; y < h; ++y) {
        for (let x = 0; x < w; ++x) {
            const i = (y * w + x) * 4;
            const la = (A[i] + A[i + 1] + A[i + 2]) / 3;
            const lb = (B[i] + B[i + 1] + B[i + 2]) / 3;
            if (la < 255 - THRESHOLD) {
                ++ink;
                grow(inkA, x, y);
            }
            if (lb < 255 - THRESHOLD) grow(inkB, x, y);
            cA.w += 255 - la;
            cA.x += (255 - la) * x;
            cA.y += (255 - la) * y;
            cB.w += 255 - lb;
            cB.x += (255 - lb) * x;
            cB.y += (255 - lb) * y;
            if (
                Math.max(Math.abs(A[i] - B[i]), Math.abs(A[i + 1] - B[i + 1]), Math.abs(A[i + 2] - B[i + 2])) >
                STRICT_THRESHOLD
            ) {
                ++strict;
            }
            const bad = nearest(A, B, x, y) > THRESHOLD || nearest(B, A, x, y) > THRESHOLD;
            if (bad) {
                ++mismatched;
                if (la < lb) {
                    O[i] = 230;
                    O[i + 1] = 0;
                    O[i + 2] = 0;
                } else {
                    O[i] = 0;
                    O[i + 1] = 90;
                    O[i + 2] = 255;
                }
            } else {
                const v = 255 - (255 - la) * 0.35;
                O[i] = O[i + 1] = O[i + 2] = v;
            }
            O[i + 3] = 255;
        }
    }
    const shift =
        inkA.x0 === Infinity || inkB.x0 === Infinity
            ? null
            : {
                  left: inkB.x0 - inkA.x0,
                  right: inkB.x1 - inkA.x1,
                  top: inkB.y0 - inkA.y0,
                  bottom: inkB.y1 - inkA.y1,
              };
    const centroidShift = cA.w > 0 && cB.w > 0 ? { x: cB.x / cB.w - cA.x / cA.w, y: cB.y / cB.w - cA.y / cA.w } : null;
    return {
        mismatched,
        ink,
        score: mismatched / Math.max(1, ink),
        strictScore: strict / Math.max(1, ink),
        centroidShift,
        darkness: cA.w > 0 ? cB.w / cA.w : null,
        shift,
        image: out,
    };
}

/**
 * Diffs the reference half of `shot` against its canvas half and, if given,
 * against `oldShot` (the old KaTeX 0.7 canvas fork rendered at the same
 * position). Returns the statistics and a composite image
 * [reference | new | diff | old | diff] as a data URL.
 */
async function compare(shot, oldShot, w, h) {
    // The statistics are frozen into a string right away: in the chromium
    // used here, the fractional fields of the first diff's result were seen
    // to change to those of the second diff, apparently an optimizer bug.
    const stats = (r) =>
        r &&
        JSON.stringify({
            mismatched: r.mismatched,
            ink: r.ink,
            score: r.mismatched / Math.max(1, r.ink),
            strictScore: r.strictScore,
            centroidShift: r.centroidShift,
            darkness: r.darkness,
            shift: r.shift,
        });
    const reference = await pixels(shot, 0, 0, w, h);
    const fresh = await pixels(shot, w, 0, w, h);
    const d = diff(reference, fresh);
    const newStats = stats(d);
    let old = null;
    let dOld = null;
    let oldStats = null;
    if (oldShot) {
        old = await pixels(oldShot, 0, 0, w, h);
        dOld = diff(reference, old);
        oldStats = stats(dOld);
    }
    const gap = 6;
    const panels = old ? [reference, fresh, d.image, old, dOld.image] : [reference, fresh, d.image];
    const composite = document.createElement("canvas");
    composite.width = panels.length * w + (panels.length - 1) * gap;
    composite.height = h;
    const ctx = composite.getContext("2d");
    ctx.fillStyle = "#b0b0b0";
    ctx.fillRect(0, 0, composite.width, h);
    panels.forEach((p, i) => ctx.putImageData(p, i * (w + gap), 0));
    return { new: newStats, old: oldStats, composite: composite.toDataURL("image/png") };
}

/**
 * Diffs two screenshots of the same size (of an example page with the old
 * and with the new plugin). Returns the statistics and a composite image
 * [a | b | diff] as a data URL.
 */
async function compareTwo(a, b, w, h) {
    const pa = await pixels(a, 0, 0, w, h);
    const pb = await pixels(b, 0, 0, w, h);
    const d = diff(pa, pb);
    const stats = JSON.stringify({
        mismatched: d.mismatched,
        ink: d.ink,
        score: d.mismatched / Math.max(1, d.ink),
        centroidShift: d.centroidShift,
        darkness: d.darkness,
    });
    const gap = 6;
    const composite = document.createElement("canvas");
    composite.width = 3 * w + 2 * gap;
    composite.height = h;
    const ctx = composite.getContext("2d");
    ctx.fillStyle = "#b0b0b0";
    ctx.fillRect(0, 0, composite.width, h);
    [pa, pb, d.image].forEach((p, i) => ctx.putImageData(p, i * (w + gap), 0));
    return { stats, composite: composite.toDataURL("image/png") };
}

window.harness = {
    parseError,
    render: render_,
    compare,
    compareTwo,
    stageRect: () => {
        const r = stage.getBoundingClientRect();
        return { x: r.left, y: r.top, width: r.width, height: r.height };
    },
};
