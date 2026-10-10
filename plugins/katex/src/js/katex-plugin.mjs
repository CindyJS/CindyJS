/**
 * The KaTeX plugin: typesets the `$...$` parts of texts drawn by CindyJS.
 *
 * On canvases, formulas are laid out by current KaTeX and drawn by
 * canvas-backend.mjs; for HTML texts KaTeX renders into the DOM. KaTeX is
 * bundled into this script (see tools/build-katex-plugin.js); its stylesheet,
 * which defines the fonts, is loaded from the `katex` directory next to
 * Cindy.js when first needed. Texts whose fonts are still loading are not
 * drawn; the instance is repainted once they are available.
 */

import katex from "katex";

import { layout, render } from "./canvas-backend.mjs";
import { katexOptions, preprocess } from "./macros.mjs";

// Loading KaTeX's stylesheet and fonts

let stylesheet = null;

function stylesheetLoaded() {
    if (stylesheet === null) {
        stylesheet = new Promise((resolve) => {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = CindyJS.getBaseDir() + "katex/katex.min.css";
            link.onload = () => resolve();
            link.onerror = () => {
                console.error("Could not load " + link.href);
                resolve();
            };
            document.head.appendChild(link);
        });
    }
    return stylesheet;
}

// Font faces by family, style and weight (without the size): true once
// loaded (or given up on), false while loading.
const fonts = {};

function faceOf(font) {
    return font.replace(/ [\d.]+px /, " ");
}

function missingFonts(fontList) {
    let missing = false;
    for (const font of fontList) {
        const face = faceOf(font);
        if (fonts[face] === true) continue;
        missing = true;
        if (fonts[face] === undefined) {
            fonts[face] = false;
            // A font that cannot be loaded is not waited for forever: the
            // formula is then drawn in a fallback font, with a warning.
            const unavailable = (why) =>
                console.warn(`KaTeX font ${face} is unavailable (${why}); formulas use a fallback font`);
            stylesheetLoaded()
                .then(() => document.fonts.load(font))
                .then((faces) => {
                    if (faces.length === 0) unavailable("not defined by katex.min.css");
                })
                .catch((e) => unavailable(e && e.message ? e.message : e))
                .then(() => {
                    fonts[face] = true;
                    scheduleRepaint();
                });
        }
    }
    return missing;
}

// Repainting instances that had to wait for fonts

let waitingInstances = [];
let repaintTimeout = null;

function haveToWait(instance) {
    if (waitingInstances.indexOf(instance) === -1) waitingInstances.push(instance);
}

function scheduleRepaint() {
    if (repaintTimeout === null) repaintTimeout = setTimeout(triggerRepaints, 0);
}

function triggerRepaints() {
    repaintTimeout = null;
    const instances = waitingInstances;
    waitingInstances = [];
    for (const instance of instances) {
        try {
            instance.evokeCS(""); // trigger repaint
        } catch (e) {
            console.error(e);
        }
    }
}

// Plugin API

CindyJS.registerPlugin(1, "katex", plugin);

function plugin(api) {
    const storage = { instance: api.instance, cache: new Map() };
    api.setTextRenderer(katexRenderer.bind(storage), katexHtml.bind(storage));
    api.setMeasure(katexMeasure.bind(storage));
}

// Items of a laid-out text: plain text in the current font, or a formula.

function textItem(ctx, text) {
    return {
        width: ctx.measureText(text).width,
        height: 0,
        depth: 0,
        draw(ctx, x, y) {
            ctx.strokeText(text, x, y);
            ctx.fillText(text, x, y);
        },
    };
}

function formulaItem(box) {
    return {
        width: box.width,
        height: box.height,
        depth: box.depth,
        draw(ctx, x, y) {
            render(ctx, box, x, y, { outline: hasOutline(ctx) });
        },
    };
}

// CindyJS strokes texts with a transparent colour unless an outline was
// requested; skipping that stroke saves time and changes nothing.
function hasOutline(ctx) {
    const style = ctx.strokeStyle;
    if (!(ctx.lineWidth > 0)) return false;
    return typeof style !== "string" || !/^rgba\(.*,\s*0\)$/.test(style);
}

// Pixel snapping only makes sense for unrotated, uniformly scaled output.
function pixelRatioOf(ctx, angle) {
    if (angle) return null;
    const t = ctx.getTransform();
    return t.b === 0 && t.c === 0 && Math.abs(t.a) === Math.abs(t.d) ? Math.abs(t.a) : null;
}

// KaTeX stores \gdef and \global\def definitions in the macro table it is
// given, so every formula gets a copy of its own.
function options() {
    return Object.assign({}, katexOptions, { macros: Object.assign({}, katexOptions.macros) });
}

// drawtable passes neither a size nor a line height, only the context's font.
function sizeOf(ctx, fontSize) {
    if (fontSize > 0) return fontSize;
    const match = /([\d.]+)px/.exec(ctx.font);
    return match ? parseFloat(match[1]) : 16;
}

/**
 * Splits a text into rows of items: "$" toggles between plain text and TeX,
 * newlines in plain text start new rows. Returns null if fonts are still
 * loading, in which case the instance gets repainted later.
 */
function prepare(storage, ctx, text, fontSize, lineHeight, angle) {
    const pixelRatio = pixelRatioOf(ctx, angle);
    const key = [fontSize, lineHeight, pixelRatio, ctx.font, text].join(":");
    const cached = storage.cache.get(key);
    if (cached !== undefined) {
        // Maps keep insertion order: move the entry to the recent end.
        storage.cache.delete(key);
        storage.cache.set(key, cached);
        return cached;
    }

    let fontsMissing = false;
    const parts = text.split("$");
    let row = [];
    const rows = [row];
    for (let i = 0; i < parts.length; ++i) {
        const part = parts[i];
        if ((i & 1) === 0) {
            // plain text, not TeX
            const lines = part.split("\n");
            row.push(textItem(ctx, lines[0]));
            for (let j = 1; j < lines.length; ++j) {
                row = [textItem(ctx, lines[j])];
                rows.push(row);
            }
        } else {
            try {
                const tree = katex.__renderToHTMLTree(preprocess(part), options());
                const box = layout(tree, ctx, { fontSize, pixelRatio });
                if (missingFonts(box.fonts)) fontsMissing = true;
                row.push(formulaItem(box));
            } catch (e) {
                console.error(e);
                row.push(textItem(ctx, "$" + part + "$"));
            }
        }
    }
    if (fontsMissing) {
        haveToWait(storage.instance);
        return null;
    }
    // Keep the 1024 most recently used texts.
    if (storage.cache.size >= 1024) storage.cache.delete(storage.cache.keys().next().value);
    storage.cache.set(key, rows);
    return rows;
}

/**
 * Lays out (and with `draw` also draws) the rows, anchored at (x, y) with
 * the given horizontal alignment (0 = left, 1 = right) and rotated by
 * `angle` around the anchor. Returns the unrotated bounding box.
 */
function place(ctx, rows, x, y, align, fontSize, lineHeight, angle, draw) {
    let left = Infinity;
    let right = -Infinity;
    let top = y - 0.7 * 1.2 * fontSize;
    let bottom = -Infinity;
    let dy = 0;
    // Rotated texts are drawn in a coordinate system rotated around the
    // anchor, whose origin is the anchor.
    const rotated = draw && angle;
    if (rotated) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-angle);
    }
    for (const row of rows) {
        let total = 0;
        for (const item of row) total += item.width;
        let pos = x - align * total;
        for (const item of row) {
            if (draw) {
                if (rotated) item.draw(ctx, pos - x, dy);
                else item.draw(ctx, pos, y + dy);
            }
            if (left > pos) left = pos;
            if (top > y + dy - item.height) top = y + dy - item.height;
            if (bottom < y + dy + item.depth) bottom = y + dy + item.depth;
            pos += item.width;
            if (right < pos) right = pos;
        }
        dy += lineHeight;
    }
    if (rotated) ctx.restore();
    bottom = Math.max(bottom, y + dy - lineHeight + 0.3 * 1.2 * fontSize);
    return { left, right, top, bottom };
}

function katexMeasure(ctx, text, x, y, align, fontSize, lineHeight, angle = 0) {
    fontSize = sizeOf(ctx, fontSize);
    if (!(lineHeight > 0)) lineHeight = 1.45 * fontSize;
    const rows = prepare(this, ctx, text, fontSize, lineHeight, angle);
    if (rows === null) return undefined;
    return place(ctx, rows, x, y, align, fontSize, lineHeight, angle, false);
}

function katexRenderer(ctx, text, x, y, align, fontSize, lineHeight, angle = 0) {
    fontSize = sizeOf(ctx, fontSize);
    if (!(lineHeight > 0)) lineHeight = 1.45 * fontSize;
    const rows = prepare(this, ctx, text, fontSize, lineHeight, angle);
    if (rows === null) return undefined;
    return place(ctx, rows, x, y, align, fontSize, lineHeight, angle, true);
}

function katexHtml(element, text) {
    stylesheetLoaded();
    while (element.firstChild) element.removeChild(element.firstChild);
    const parts = text.split("$");
    for (let i = 0; i < parts.length; ++i) {
        const part = parts[i];
        if ((i & 1) === 0) {
            const lines = part.split("\n");
            element.appendChild(document.createTextNode(lines[0]));
            for (let j = 1; j < lines.length; ++j) {
                element.appendChild(document.createElement("br"));
                element.appendChild(document.createTextNode(lines[j]));
            }
        } else {
            const span = document.createElement("span");
            try {
                katex.render(preprocess(part), span, options());
            } catch (e) {
                console.error(e);
                span.textContent = "$" + part + "$";
            }
            element.appendChild(span);
        }
    }
}
