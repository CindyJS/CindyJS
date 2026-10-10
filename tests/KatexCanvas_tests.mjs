import { assert } from "chai";
import katex from "katex";

import { layout, render } from "../plugins/katex/src/js/canvas-backend.mjs";
import { katexOptions as pluginOptions, preprocess } from "../plugins/katex/src/js/macros.mjs";
import { loadCorpus } from "./katex-canvas/corpus/index.mjs";

// Layout checks for the KaTeX canvas backend that need no browser: text
// widths come from a stand-in measureText, but heights and depths do not
// depend on widths at all, so they can be compared with the struts KaTeX
// puts into its own output. The pixel comparison against KaTeX's HTML
// rendering lives in tests/katex-canvas (npm run test:katex-canvas).

const FAMILIES =
    /^(normal|italic) (normal|bold) [\d.]+px KaTeX_(Main|Math|AMS|Caligraphic|Fraktur|SansSerif|Script|Typewriter|Size[1-4])$/;

describe("KaTeX canvas backend", function () {
    const cases = loadCorpus();

    const measureCtx = {
        font: "",
        save() {},
        restore() {},
        measureText(text) {
            return { width: 7 * text.length };
        },
    };

    function treeOf(c) {
        const options = Object.assign({ strict: "ignore" }, c.cindyMacros ? pluginOptions : {}, {
            displayMode: c.display,
            throwOnError: !c.noThrow,
            trust: true,
            macros: Object.assign({}, c.cindyMacros ? pluginOptions.macros : {}, c.macros || {}),
        });
        return katex.__renderToHTMLTree(c.cindyMacros ? preprocess(c.tex) : c.tex, options);
    }

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

    it("lays out every formula of the corpus", function () {
        for (const c of cases) {
            let tree;
            try {
                tree = treeOf(c);
            } catch (e) {
                continue; // KaTeX itself rejects the input
            }
            const box = layout(tree, measureCtx, { fontSize: 24 });
            assert.isFinite(box.width, c.id);
            for (const font of box.fonts) assert.match(font, FAMILIES, c.id);
        }
    });

    it("agrees with KaTeX's struts on height and depth", function () {
        let checked = 0;
        for (const c of cases) {
            let tree;
            try {
                tree = treeOf(c);
            } catch (e) {
                continue;
            }
            const box = layout(tree, measureCtx, { fontSize: 24 });
            if (box.unsupported.length > 0) continue;
            const extent = strutExtent(tree, 24);
            if (extent === null) continue;
            assert.closeTo(box.height, extent.height, 0.05, `height of ${c.id}`);
            assert.closeTo(box.depth, extent.depth, 0.05, `depth of ${c.id}`);
            ++checked;
        }
        assert.isAbove(checked, 150, "too few formulas were checked");
    });

    it("renders with the context's fill style and restores the context", function () {
        const calls = [];
        let depth = 0;
        const ctx = Object.assign({}, measureCtx, {
            fillStyle: "#123456",
            save() {
                ++depth;
            },
            restore() {
                --depth;
            },
            getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
            setTransform() {},
            translate() {},
            fillText(text, x, y) {
                calls.push(["text", text, this.fillStyle, x, y]);
            },
            fillRect(x, y, w, h) {
                calls.push(["rect", this.fillStyle, x, y, w, h]);
            },
        });
        const box = layout(katex.__renderToHTMLTree("\\frac{a}{\\color{red}b}"), measureCtx, { fontSize: 20 });
        render(ctx, box, 100, 50);
        assert.equal(depth, 0, "every save is restored");
        const texts = calls.filter((c) => c[0] === "text");
        assert.deepEqual(
            texts.map((c) => [c[1], c[2]]),
            [
                ["b", "red"],
                ["a", "#123456"],
            ]
        );
        const rects = calls.filter((c) => c[0] === "rect");
        assert.lengthOf(rects, 1, "one fraction bar");
        assert.equal(rects[0][1], "#123456");
        assert.equal(rects[0][5], 1, "the bar is snapped to one pixel");
    });

    function collect(ops, type, acc = []) {
        for (const op of ops) {
            if (op.type === type) acc.push(op);
            if (op.ops) collect(op.ops, type, acc);
        }
        return acc;
    }

    it("draws stretchy symbols as clipped SVG paths", function () {
        const box = layout(katex.__renderToHTMLTree("\\sqrt{x}+\\vec{a}+\\overrightarrow{AB}"), measureCtx, {
            fontSize: 20,
        });
        const svgs = collect(box.ops, "svg");
        assert.lengthOf(svgs, 3);
        for (const svg of svgs) {
            assert.isAbove(svg.w, 0);
            assert.isAbove(svg.h, 0);
            assert.isNotNull(svg.viewBox);
            assert.match(svg.items[0].d, /^M/, "path data extracted from KaTeX's markup");
        }
        // \sqrt and \overrightarrow are 400em wide paths cut off by their
        // `.hide-tail` box, which is as wide as the content above.
        const clips = collect(box.ops, "group").filter((g) => g.clip);
        assert.lengthOf(clips, 2);
        for (const g of clips) assert.isBelow(g.clip.w, 5 * 20);
        assert.deepEqual(box.unsupported, []);
    });

    it("numbers equations and stacks lines", function () {
        const tree = katex.__renderToHTMLTree("\\begin{gather}a\\\\b\\end{gather}", { displayMode: true });
        const box = layout(tree, measureCtx, { fontSize: 20 });
        assert.includeMembers(
            collect(box.ops, "text").map((op) => op.text),
            ["(1)", "(2)"]
        );
        const baselines = (tex) => {
            const b = layout(katex.__renderToHTMLTree(tex), measureCtx, { fontSize: 20 });
            return collect(b.ops, "text").map((op) => op.y);
        };
        const [a, b] = baselines("a\\\\b");
        const [c, d] = baselines("a\\\\[1em]b");
        assert.isAbove(b, a);
        assert.closeTo(d - c, b - a + 20, 1e-9, "\\\\[1em] adds one em");
    });
});
