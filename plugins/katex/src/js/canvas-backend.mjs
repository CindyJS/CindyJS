/**
 * Canvas backend for KaTeX.
 *
 * KaTeX lays formulas out as a tree of spans (`katex.__renderToHTMLTree`)
 * whose final geometry is determined by the browser's CSS engine together
 * with `katex.css`. This module re-implements the small subset of CSS that
 * KaTeX's output relies on, so the same tree can be drawn onto a 2D canvas.
 *
 * Most of the geometry is already explicit in the tree: glyph metrics, the
 * vertical offsets inside vlists (`top`, pstrut heights), glue as margins,
 * rule thicknesses as border widths, font sizes as `katex-sizing` classes,
 * and stretchy symbols as SVG paths. What is left for us is the horizontal
 * flow (widths come from measuring the glyphs with the canvas' own
 * `measureText`), text alignment inside vlists, percentage widths such as
 * fraction bars, and the absolutely positioned, clipped SVG pieces.
 *
 * Usage:
 *
 *     const tree = katex.__renderToHTMLTree(tex, options);
 *     const box = layout(tree, ctx, { fontSize: 24 });
 *     // ... make sure every font in box.fonts is loaded, then
 *     render(ctx, box, x, baselineY);
 *
 * `layout` only uses `ctx` for `measureText`; it saves and restores the
 * context state. Coordinates in the box are CSS pixels relative to the left
 * end of the formula's baseline, with y pointing down.
 */

// Font-size ratios of KaTeX's sizing classes (`reset-sizeN` / `sizeN`).
const SIZES = [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.2, 1.44, 1.728, 2.074, 2.488];

// Font properties set by classes, in the order of katex.scss, so that later
// rules override earlier ones just like the CSS cascade does for rules of
// equal specificity.
const FONT_CLASSES = [
    [["textbf"], { weight: "bold" }],
    [["textit"], { style: "italic" }],
    [["textrm"], { family: "KaTeX_Main" }],
    [["textsf"], { family: "KaTeX_SansSerif" }],
    [["texttt"], { family: "KaTeX_Typewriter" }],
    [["mathnormal"], { family: "KaTeX_Math", style: "italic" }],
    [["mathit"], { family: "KaTeX_Main", style: "italic" }],
    [["mathrm"], { style: "normal" }],
    [["mathbf"], { family: "KaTeX_Main", weight: "bold" }],
    [["boldsymbol"], { family: "KaTeX_Math", weight: "bold", style: "italic" }],
    [["amsrm"], { family: "KaTeX_AMS" }],
    [["mathbb", "textbb"], { family: "KaTeX_AMS" }],
    [["mathcal"], { family: "KaTeX_Caligraphic" }],
    [["mathfrak", "textfrak"], { family: "KaTeX_Fraktur" }],
    [["mathboldfrak", "textboldfrak"], { family: "KaTeX_Fraktur", weight: "bold" }],
    [["mathtt"], { family: "KaTeX_Typewriter" }],
    [["mathscr", "textscr"], { family: "KaTeX_Script" }],
    [["mathsf", "textsf"], { family: "KaTeX_SansSerif" }],
    [["mathboldsf", "textboldsf"], { family: "KaTeX_SansSerif", weight: "bold" }],
    [["mathsfit", "mathitsf", "textitsf"], { family: "KaTeX_SansSerif", style: "italic" }],
    [["mainrm"], { family: "KaTeX_Main", style: "normal" }],
];

// Horizontal padding and margins that katex.scss attaches to classes (in em).
const CLASS_BOX = {
    "x-arrow-pad": { paddingLeft: 0.5, paddingRight: 0.5 },
    "cd-arrow-pad": { paddingLeft: 0.27778, paddingRight: 0.55556 },
    boxpad: { paddingLeft: 0.3, paddingRight: 0.3 },
    "cancel-pad": { paddingLeft: 0.2, paddingRight: 0.2 },
    "cancel-lap": { marginLeft: -0.2, marginRight: -0.2 },
    anglpad: { paddingLeft: 0.03889, paddingRight: 0.03889 },
    angl: { marginRight: 0.03889 },
};

// Elements with `display: inline-block` (or another atomic inline display)
// in katex.scss. Everything else that is not a vlist table is an inline
// span, except for children of vlist rows, which are always inline-blocks.
const INLINE_BLOCK_CLASSES = new Set([
    "katex-base",
    "katex-strut",
    "frac-line",
    "overline-line",
    "underline-line",
    "katex-hline",
    "katex-hdashline",
    "mspace",
    "katex-rule",
    "nulldelimiter",
    "vertical-separator",
    "arraycolsep",
    "katex-overlay",
    "katex-stretchy",
    "reflectbox",
    "cd-vert-arrow",
]);

// Classes with a percentage width in katex.scss.
const CLASS_WIDTH = {
    "frac-line": 1,
    "overline-line": 1,
    "underline-line": 1,
    "katex-hline": 1,
    "katex-hdashline": 1,
    "katex-stretchy": 1,
    "hide-tail": 1,
    "mtr-glue": 0.5,
};

// Classes that clip their content (`overflow: hidden`).
const CLIPPING_CLASSES = new Set([
    "hide-tail",
    "katex-stretchy",
    "halfarrow-left",
    "halfarrow-right",
    "brace-left",
    "brace-center",
    "brace-right",
]);

// Absolutely positioned pieces of stretchy symbols: horizontal offset and
// width as fractions of the containing block, and the side they attach to.
const PIECES = {
    "halfarrow-left": { side: "left", offset: 0, width: 0.502 },
    "halfarrow-right": { side: "right", offset: 0, width: 0.502 },
    "brace-left": { side: "left", offset: 0, width: 0.251 },
    "brace-center": { side: "left", offset: 0.25, width: 0.5 },
    "brace-right": { side: "right", offset: 0, width: 0.251 },
};

// Classes that make an element a containing block for absolutely
// positioned descendants (`position: relative` or `absolute`).
const POSITIONED_CLASSES = new Set([
    "katex",
    "katex-base",
    "katex-html",
    "hide-tail",
    "katex-stretchy",
    "accent-body",
    "delimcenter",
    "op-symbol",
    "katex-rule",
    "llap",
    "rlap",
    "clap",
    "cd-vert-arrow",
    ...Object.keys(PIECES),
]);

// Classes whose borders are part of their specified size.
const BORDER_BOX_CLASSES = new Set(["fbox", "fcolorbox", "angl"]);

// katex.scss also gives rules `min-height: 1px` to keep Chrome from dropping
// them. That makes \rule one pixel taller than TeX would, so it is only
// emulated along with the other pixel-level browser behaviour (pixelRatio).
const MIN_HEIGHT_CLASSES = new Set([
    "frac-line",
    "overline-line",
    "underline-line",
    "katex-hline",
    "katex-hdashline",
    "katex-rule",
]);

// Box drawing ops. All coordinates are relative to the box origin, which is
// the left end of its baseline.
//   { type: "text", x, y, text, font, color, shadow }  (shadow: {dx, dy} or null)
//   { type: "rect", x, y, w, h, color, edge, dashed }  (a filled rule or
//        background; `edge` names the side a border belongs to, for pixel
//        snapping; `dashed` rules are drawn as dashes along their length)
//   { type: "svg", x, y, w, h, viewBox, preserveAspectRatio, items, color, snap }
//        (an SVG viewport; items: {type: "path", d} filled, or
//        {type: "line", x1, y1, x2, y2, width} stroked, with coordinates
//        given as [fraction of the viewport size, pixels])
//   { type: "image", x, y, w, h, src }
//   { type: "group", x, y, clip, transform, ops }  (ops relative to (x, y);
//        clip: {x, y, w, h} in the group's coordinates, drawn before the
//        transform: {a, b, c, d, e, f}, as for ctx.transform)

const parsedStyles = new WeakMap();

/**
 * The inline style of a node: its `style` object merged with a `style`
 * attribute, which is where \htmlStyle (and SVG nodes) put their CSS text.
 */
function styleOf(node) {
    const attr = node.attributes && node.attributes.style;
    if (!attr) return node.style || {};
    let style = parsedStyles.get(node);
    if (!style) {
        style = Object.assign({}, node.style);
        for (const decl of attr.split(";")) {
            const i = decl.indexOf(":");
            if (i < 0) continue;
            const name = decl
                .slice(0, i)
                .trim()
                .replace(/-([a-z])/g, (_, c) => c.toUpperCase());
            style[name] = decl.slice(i + 1).trim();
        }
        parsedStyles.set(node, style);
    }
    return style;
}

function hasClass(node, name) {
    return node.classes !== undefined && node.classes.indexOf(name) !== -1;
}

function hasAnyClass(node, set) {
    return (node.classes || []).some((c) => set.has(c));
}

function classValue(node, table) {
    for (const c of node.classes || []) if (table[c] !== undefined) return table[c];
    return undefined;
}

// Classifies domTree nodes by shape rather than by constructor name, which
// minifiers are free to mangle.
function kind(node) {
    if (typeof node.text === "string" && node.children === undefined) return "symbol";
    if (node.pathName !== undefined) return "path";
    if (node.src !== undefined && node.alt !== undefined) return "img";
    if (node.classes === undefined) return node.children === undefined ? "line" : "svg";
    return "span";
}

/**
 * Parses a CSS length as emitted by KaTeX. Returns pixels, or null for
 * values we cannot resolve (percentages are handled by the callers).
 */
function length(value, em) {
    if (value === undefined || value === null || value === "") return null;
    if (typeof value === "number") return value * em;
    const m = /^(-?[\d.]+(?:e-?\d+)?)(em|px)?$/.exec(String(value).trim());
    if (!m) return null;
    const n = parseFloat(m[1]);
    if (m[2] === "px") return n;
    if (m[2] === undefined && n !== 0) return null;
    return n * em;
}

function percentage(value) {
    const m = /^(-?[\d.]+)%$/.exec(String(value || "").trim());
    return m ? parseFloat(m[1]) / 100 : null;
}

/** Horizontal margins from the `margin` shorthand, as [left, right]. */
function marginShorthand(value, em) {
    const parts = String(value).trim().split(/\s+/);
    const at = (i) => length(parts[i], em);
    switch (parts.length) {
        case 1:
            return [at(0), at(0)];
        case 2:
        case 3:
            return [at(1), at(1)];
        default:
            return [at(3), at(1)];
    }
}

/**
 * Computes the inherited and non-inherited style properties of a node,
 * given its parent's computed style and its ancestor chain.
 */
function computeStyle(node, parent, ancestors) {
    const cs = {
        family: parent.family,
        style: parent.style,
        weight: parent.weight,
        size: parent.size,
        color: parent.color,
        textAlign: parent.textAlign,
        multDelim: parent.multDelim,
        textShadow: parent.textShadow,
        lineHeight: parent.lineHeight,
    };
    const classes = node.classes || [];
    const has = (name) => classes.indexOf(name) !== -1;

    for (const [names, props] of FONT_CLASSES) {
        if (names.some(has)) Object.assign(cs, props);
    }

    if ((has("katex-sizing") || has("fontsize-ensurer")) && classes.length > 1) {
        let from = null;
        let to = null;
        for (const c of classes) {
            let m = /^reset-size(\d+)$/.exec(c);
            if (m) from = +m[1];
            m = /^size(\d+)$/.exec(c);
            if (m) to = +m[1];
        }
        if (from !== null && to !== null) cs.size *= SIZES[to - 1] / SIZES[from - 1];
    }

    if (has("delimsizing")) {
        for (let i = 1; i <= 4; ++i) if (has("size" + i)) cs.family = "KaTeX_Size" + i;
        if (has("mult")) cs.multDelim = true;
    }
    const parentNode = ancestors[ancestors.length - 1];
    if (cs.multDelim && parentNode) {
        if (hasClass(parentNode, "delim-size1")) cs.family = "KaTeX_Size1";
        if (hasClass(parentNode, "delim-size4")) cs.family = "KaTeX_Size4";
    }
    if (has("op-symbol")) {
        if (has("small-op")) cs.family = "KaTeX_Size1";
        if (has("large-op")) cs.family = "KaTeX_Size2";
    }

    // text-align
    const grandParent = ancestors[ancestors.length - 2];
    if (has("msupsub") || has("svg-align")) cs.textAlign = 0;
    if (grandParent && hasClass(grandParent, "mfrac")) cs.textAlign = 0.5;
    if (has("vlist-t") && parentNode) {
        if (hasClass(parentNode, "op-limits") || hasClass(parentNode, "katex-accent")) cs.textAlign = 0.5;
        if (hasClass(parentNode, "col-align-c")) cs.textAlign = 0.5;
        if (hasClass(parentNode, "col-align-l")) cs.textAlign = 0;
        if (hasClass(parentNode, "col-align-r")) cs.textAlign = 1;
    }
    if (has("x-arrow") || has("mover") || has("munder")) cs.textAlign = 0.5;
    if (has("katex-smash")) cs.lineHeight = 0;
    if (has("cd-label-left")) cs.textAlign = 0;
    if (has("cd-label-right")) cs.textAlign = 1;

    const style = styleOf(node);
    if (isColor(style.color)) cs.color = style.color;

    const em = cs.size;
    if (style.textShadow) {
        // Used by \pmb. The blur (a fraction of a pixel) is ignored.
        const [dx, dy] = style.textShadow.split(/\s+/).map((v) => length(v, em));
        cs.textShadow = dx === null || dy === null ? null : { dx, dy };
    }
    const box = {
        marginLeft: 0,
        marginRight: 0,
        paddingLeft: 0,
        paddingRight: 0,
    };
    for (const c of classes) {
        const extra = CLASS_BOX[c];
        if (extra) for (const k in extra) box[k] += extra[k] * em;
    }
    if (has("katex-root") && parentNode && hasClass(parentNode, "sqrt")) {
        box.marginLeft += (5 / 18) * em;
        box.marginRight -= (10 / 18) * em;
    }
    if (style.margin) {
        const [left, right] = marginShorthand(style.margin, em);
        if (left !== null) box.marginLeft = left;
        if (right !== null) box.marginRight = right;
    }
    for (const k of ["marginLeft", "marginRight", "paddingLeft", "paddingRight"]) {
        const v = length(style[k], em);
        if (v !== null) box[k] = v;
    }
    cs.box = box;
    cs.em = em;
    return cs;
}

function fontString(cs) {
    return `${cs.style || "normal"} ${cs.weight || "normal"} ${cs.size}px ${cs.family}`;
}

// KaTeX accepts any word as a colour name. CSS ignores invalid colours, and
// so does the canvas, which would keep the previous fill style instead of
// the inherited colour; hence they are dropped during layout.
const colors = new Map();

function isColor(color) {
    if (!color) return false;
    if (typeof CSS === "undefined" || !CSS.supports) return true;
    let valid = colors.get(color);
    if (valid === undefined) {
        // Colours computed from animated values are all different.
        if (colors.size >= 1024) colors.clear();
        valid = CSS.supports("color", color);
        colors.set(color, valid);
    }
    return valid;
}

// SVG path data by path name, extracted from the nodes' own markup since
// KaTeX does not export its path table.
const pathData = new Map();

function pathOf(node) {
    if (node.alternate) return node.alternate;
    let d = pathData.get(node.pathName);
    if (d === undefined) {
        const m = /\sd="([^"]*)"/.exec(node.toMarkup());
        d = m ? m[1] : "";
        pathData.set(node.pathName, d);
    }
    return d;
}

/**
 * Viewport-to-user transform of an SVG element with the given viewBox and
 * preserveAspectRatio, for a viewport of size w x h.
 */
function viewBoxTransform(viewBox, par, w, h) {
    const [vx, vy, vw, vh] = viewBox;
    let sx = w / vw;
    let sy = h / vh;
    const [align, mode] = (par || "xMidYMid meet").trim().split(/\s+/);
    if (align !== "none") {
        const s = mode === "slice" ? Math.max(sx, sy) : Math.min(sx, sy);
        sx = sy = s;
    }
    const fx = /^xMid/.test(align) ? 0.5 : /^xMax/.test(align) ? 1 : 0;
    const fy = /YMid$/.test(align) ? 0.5 : /YMax$/.test(align) ? 1 : 0;
    const tx = align === "none" ? 0 : fx * (w - vw * sx);
    const ty = align === "none" ? 0 : fy * (h - vh * sy);
    return { sx, sy, tx: tx - vx * sx, ty: ty - vy * sy };
}

class Layout {
    constructor(ctx, pixelRatio, images) {
        this.ctx = ctx;
        this.pixelRatio = pixelRatio;
        this.images = images || {};
        this.fonts = new Set();
        this.unsupported = new Set();
        this.imageSources = new Set();
        this.equationNumbers = new Map();
        this.struts = new Map();
    }

    measure(text, font) {
        this.ctx.font = font;
        return this.ctx.measureText(text).width;
    }

    /**
     * Lays out a node as part of a horizontal list. Returns a box
     * `{width, height, depth, ops, dependsOnWidth, hasLine}` whose width
     * includes the node's horizontal margins; ops are relative to the box's
     * left edge (outer margin edge) on the baseline.
     *
     * `avail.cb` is the width of the containing block, used to resolve
     * percentage widths, and `avail.pos` that of the nearest positioned
     * ancestor, which absolutely positioned SVGs are sized against. Either
     * is null while computing intrinsic widths.
     */
    node(node, parentStyle, ancestors, avail, inlineBlock) {
        switch (kind(node)) {
            case "symbol":
                return this.symbol(node, parentStyle, ancestors);
            case "span":
                return this.span(node, parentStyle, ancestors, avail, inlineBlock);
            case "img":
                return this.img(node, parentStyle, ancestors);
            default:
                // SVGs are absolutely positioned and handled by their parent.
                this.unsupported.add(kind(node));
                return emptyBox();
        }
    }

    symbol(node, parentStyle, ancestors) {
        const cs = computeStyle(node, parentStyle, ancestors);
        const text = node.text;
        const box = emptyBox();
        if (text === "" || text === "​") return this.decorate(box, node, cs);
        const font = fontString(cs);
        this.fonts.add(font);
        const width = this.measure(text, font);
        const pad = cs.box;
        box.ops.push({ type: "text", x: pad.paddingLeft, y: 0, text, font, color: cs.color, shadow: cs.textShadow });
        box.width = pad.paddingLeft + width + Math.max(0, node.italic || 0) * cs.em + pad.paddingRight;
        // KaTeX rescales the height and depth of a node that carries sizing
        // classes to the em of its parent.
        box.height = (node.height || 0) * parentStyle.size;
        box.depth = (node.depth || 0) * parentStyle.size;
        box.hasLine = true;
        const strut = this.strut(cs);
        box.lineTop = strut.top;
        box.lineBottom = strut.bottom;
        return this.decorate(box, node, cs);
    }

    img(node, parentStyle, ancestors) {
        const cs = computeStyle(node, parentStyle, ancestors);
        const style = styleOf(node);
        const image = this.images[node.src];
        const natural = image && image.naturalWidth ? [image.naturalWidth, image.naturalHeight] : null;
        let w = length(style.width, cs.em);
        let h = length(style.height, cs.em);
        if (natural) {
            if (w === null && h !== null) w = (h * natural[0]) / natural[1];
            if (h === null && w !== null) h = (w * natural[1]) / natural[0];
            if (w === null && h === null) [w, h] = natural;
        }
        this.imageSources.add(node.src);
        const box = emptyBox();
        box.width = w || 0;
        box.height = h || 0;
        box.hasLine = true;
        if (w && h) box.ops.push({ type: "image", x: 0, y: -h, w, h, src: node.src });
        return this.decorate(box, node, cs);
    }

    span(node, parentStyle, ancestors, avail, inlineBlock) {
        const cs = computeStyle(node, parentStyle, ancestors);
        const inner = ancestors.concat([node]);

        if (hasClass(node, "vlist-t")) return this.decorate(this.vlistTable(node, cs, inner, avail), node, cs);
        if (hasClass(node, "llap") || hasClass(node, "rlap") || hasClass(node, "clap")) {
            return this.decorate(this.lap(node, cs, inner, avail), node, cs);
        }
        if (hasClass(node, "katex-thinbox")) {
            // An inline-flex row of zero width whose content overflows.
            const box = this.hlist(node.children || [], cs, inner, avail, true);
            box.width = 0;
            box.hasLine = true;
            return this.decorate(box, node, cs);
        }
        if (hasClass(node, "katex-tag")) {
            // Only meaningful at the top level, see Layout.root.
            this.unsupported.add("nested .katex-tag");
            return emptyBox();
        }

        if (hasClass(node, "eqn-num")) {
            // `.eqn-num::before { content: "(" counter(katexEqnNo) ")" }`
            const text = `(${this.equationNumbers.get(node)})`;
            const font = fontString(cs);
            this.fonts.add(font);
            const number = emptyBox();
            number.ops.push({ type: "text", x: 0, y: 0, text, font, color: cs.color, shadow: cs.textShadow });
            number.width = this.measure(text, font);
            number.hasLine = true;
            append(number, this.hlist(node.children || [], cs, inner, avail));
            return this.decorate(this.padded(number, cs), node, cs);
        }
        if (inlineBlock || hasAnyClass(node, INLINE_BLOCK_CLASSES)) {
            return this.decorate(this.inlineBlock(node, cs, inner, avail), node, cs);
        }
        // Inline span: its children simply continue the horizontal list.
        const box = this.hlist(node.children || [], cs, inner, avail);
        return this.decorate(this.padded(box, cs), node, cs);
    }

    padded(box, cs) {
        box.width += cs.box.paddingLeft + cs.box.paddingRight;
        shift(box, cs.box.paddingLeft, 0);
        return box;
    }

    inlineBlock(node, cs, ancestors, avail) {
        const style = styleOf(node);
        const em = cs.em;

        const borders = {
            top: length(style.borderTopWidth, em) || 0,
            right: length(style.borderRightWidth, em) || 0,
            bottom: length(style.borderBottomWidth, em) || 0,
            left: length(style.borderLeftWidth, em) || 0,
        };
        const bw = length(style.borderWidth, em);
        if (bw !== null) borders.top = borders.right = borders.bottom = borders.left = bw;
        if (hasClass(node, "katex-sout")) borders.bottom = 0.08 * em;
        if (hasClass(node, "fbox") || hasClass(node, "fcolorbox")) {
            if (bw === null) borders.top = borders.right = borders.bottom = borders.left = 0.04 * em;
        }
        if (hasClass(node, "angl")) borders.top = borders.right = 0.049 * em;
        if (this.pixelRatio) {
            // Browsers use whole pixels for border widths already during
            // layout.
            for (const side in borders) borders[side] = snapBorder(borders[side]);
        }
        const dashed = {
            right: style.borderRightStyle === "dashed",
            bottom: style.borderBottomStyle === "dashed" || hasClass(node, "katex-hdashline"),
        };
        const pad = cs.box.paddingLeft + cs.box.paddingRight;
        const hBorders = borders.left + borders.right;
        const borderBox = hasAnyClass(node, BORDER_BOX_CLASSES);

        // The specified width (of the content box).
        let width = null;
        let dependsOnWidth = false;
        let pct = percentage(style.width);
        if (pct === null && style.width === undefined) pct = classValue(node, CLASS_WIDTH) ?? null;
        if (pct !== null) {
            dependsOnWidth = true;
            width = avail.cb === null ? null : pct * avail.cb;
        } else {
            width = length(style.width, em);
        }
        if (hasClass(node, "nulldelimiter")) width = 0.12 * em;
        if (hasClass(node, "accent-body") && !hasClass(node, "accent-full") && ancestors.some(isAccent)) width = 0;
        if (width !== null && borderBox) width = Math.max(0, width - pad - hBorders);
        let minWidth = length(style.minWidth, em);
        // Another Chrome workaround in katex.scss, emulated like min-height.
        if (this.pixelRatio && hasClass(node, "vertical-separator")) minWidth = Math.max(minWidth || 0, 1);
        if (minWidth !== null && borderBox) minWidth = Math.max(0, minWidth - pad - hBorders);

        let height = length(style.height, em);
        if (this.pixelRatio && hasAnyClass(node, MIN_HEIGHT_CLASSES)) height = Math.max(height || 0, 1);
        if (height !== null && borderBox) height = Math.max(0, height - borders.top - borders.bottom);

        const inFlow = [];
        const outOfFlow = [];
        for (const child of node.children || []) {
            if (kind(child) === "svg" || hasAnyClass(child, PIECE_SET) || isAbsoluteLabel(child)) outOfFlow.push(child);
            else inFlow.push(child);
        }

        const positioned = hasAnyClass(node, POSITIONED_CLASSES);
        const layoutContent = (w) => {
            const innerAvail = { cb: w, pos: positioned ? (w === null ? null : w + pad) : avail.pos };
            return this.hlist(inFlow, cs, ancestors, innerAvail);
        };
        let content = layoutContent(width);
        let contentWidth = Math.max(width === null ? content.width : width, minWidth || 0);
        if (content.dependsOnWidth && width === null) {
            // Percentages inside a shrink-to-fit box resolve against the
            // width it got from its other content.
            content = layoutContent(contentWidth);
        }
        dependsOnWidth = dependsOnWidth || content.dependsOnWidth;

        const box = emptyBox();
        box.dependsOnWidth = dependsOnWidth;
        box.hasLine = true;
        const left = cs.box.paddingLeft + borders.left;
        const outerWidth = left + contentWidth + cs.box.paddingRight + borders.right;
        box.width = outerWidth;
        const hasLine = content.hasLine;
        if (hasLine && height === null && !hasAnyClass(node, CLIPPING_CLASSES)) {
            // The baseline is that of the contained line.
            box.ops = content.ops;
            shift(box, left, 0);
            box.height = content.height + borders.top;
            box.depth = content.depth + borders.bottom;
        } else {
            // No line box, a fixed height or `overflow: hidden`: the bottom
            // margin edge sits on the baseline.
            const h = (height === null ? content.height + content.depth : height) + borders.top + borders.bottom;
            box.height = h;
            box.depth = 0;
            box.ops = content.ops;
            shift(box, left, -borders.bottom - (height === null ? content.depth : 0));
            box.height = h;
            box.depth = 0;
        }
        const bottom = box.depth;
        const top = -box.height;
        // The margin box, which is what this box contributes to the CSS line
        // box around it. With a line inside, that line's box decides.
        if (hasLine && height === null && !hasAnyClass(node, CLIPPING_CLASSES)) {
            const strut = this.strut(cs);
            box.lineTop = Math.min(content.lineTop, strut.top) - borders.top;
            box.lineBottom = Math.max(content.lineBottom, strut.bottom) + borders.bottom;
        } else {
            box.lineTop = top;
            box.lineBottom = bottom;
        }
        const paddingBox = {
            x: borders.left,
            y: top + borders.top,
            w: outerWidth - hBorders,
            h: bottom - top - borders.top - borders.bottom,
        };

        // Absolutely positioned children, at their static position: the top
        // left corner of the content box.
        const cbWidth = positioned ? paddingBox.w : avail.pos;
        for (const child of outOfFlow) {
            const ops = this.absolute(child, cs, ancestors, {
                x: left,
                y: paddingBox.y,
                cbWidth,
                cbX: positioned ? paddingBox.x : null,
                height: height,
                boxWidth: paddingBox.w,
                bottom: paddingBox.y + paddingBox.h,
            });
            if (ops === null) box.dependsOnWidth = true;
            else box.ops.push(...ops);
        }

        if (hasAnyClass(node, CLIPPING_CLASSES)) {
            box.ops = [
                { type: "group", x: 0, y: 0, clip: paddingBox, transform: null, ops: box.ops, snap: !!this.pixelRatio },
            ];
        }
        if (hasClass(node, "reflectbox")) {
            box.ops = [
                {
                    type: "group",
                    x: 0,
                    y: 0,
                    clip: null,
                    transform: { a: -1, b: 0, c: 0, d: 1, e: outerWidth, f: 0 },
                    ops: box.ops,
                },
            ];
        }

        const color = cs.color;
        const borderColor = isColor(style.borderColor) ? style.borderColor : color;
        const decorations = [];
        const rect = (x, y, w, h, edge, c, dash) => {
            // Borders of an empty box are not painted.
            if (w > 0 && h > 0) decorations.push({ type: "rect", x, y, w, h, color: c, edge, dashed: !!dash });
        };
        if (isColor(style.backgroundColor)) rect(0, top, outerWidth, bottom - top, null, style.backgroundColor);
        if (borders.bottom) {
            rect(0, bottom - borders.bottom, outerWidth, borders.bottom, "bottom", borderColor, dashed.bottom);
        }
        if (borders.top) rect(0, top, outerWidth, borders.top, "top", borderColor);
        if (borders.left) rect(0, top, borders.left, bottom - top, "left", borderColor);
        if (borders.right) {
            rect(outerWidth - borders.right, top, borders.right, bottom - top, "right", borderColor, dashed.right);
        }
        // Backgrounds and borders are painted below the content.
        box.ops = decorations.concat(box.ops);
        return box;
    }

    /**
     * Lays out an absolutely positioned child of an inline-block. `at`
     * gives the static position (x, y of the content box's top left), the
     * containing block's width and left edge, the parent's specified
     * height (which SVGs inherit) and the parent's padding box width.
     * Returns the ops, or null if the width is not known yet.
     */
    absolute(child, cs, ancestors, at) {
        if (kind(child) === "svg") {
            const style = styleOf(child);
            let w = length(style.width, cs.em);
            if (w === null) {
                if (at.cbWidth === null) return null;
                w = at.cbWidth;
            }
            let h = at.height;
            if (h === null) h = length((child.attributes || {}).height, cs.em);
            return [this.svg(child, at.x, at.y, w, h || 0, cs)];
        }
        const pcs = computeStyle(child, cs, ancestors);
        const inner = ancestors.concat([child]);
        const piece = classValue(child, PIECES);
        if (piece) {
            if (at.cbWidth === null) return null;
            const w = piece.width * at.cbWidth;
            const x0 = at.cbX === null ? at.x : at.cbX;
            const x = piece.side === "left" ? x0 + piece.offset * at.cbWidth : x0 + at.cbWidth - w;
            const h = length(styleOf(child).height, pcs.em);
            const ops = [];
            for (const svg of child.children || []) {
                if (kind(svg) === "svg") ops.push(this.svg(svg, 0, 0, w, h || 0, pcs));
            }
            const clip = { x: 0, y: 0, w, h: h || 0 };
            return [{ type: "group", x, y: at.y, clip, transform: null, ops, snap: !!this.pixelRatio }];
        }
        // \begin{CD} labels next to vertical arrows: offset horizontally
        // from the middle of the arrow (`calc(50% + 0.3em)`), and vertically
        // by `bottom` from the arrow's bottom edge, or else at their static,
        // baseline-aligned position.
        const label = this.inlineBlock(child, pcs, inner, { cb: null, pos: null });
        const gap = 0.3 * pcs.em;
        const x = hasClass(child, "cd-label-left") ? at.boxWidth / 2 - gap - label.width : at.boxWidth / 2 + gap;
        const bottom = length(styleOf(child).bottom, pcs.em);
        const y = bottom === null ? 0 : at.bottom - bottom - label.lineBottom;
        return label.ops.map((op) => moved(op, x, y));
    }

    /**
     * An SVG element with its viewport at (x, y), sized w x h. The geometry
     * inside is resolved when drawing, since the viewport may get snapped
     * to device pixels first.
     */
    svg(node, x, y, w, h, cs) {
        const attrs = node.attributes || {};
        const items = [];
        for (const child of node.children || []) {
            if (kind(child) === "path") {
                items.push({ type: "path", d: pathOf(child) });
            } else if (kind(child) === "line") {
                const a = child.attributes || {};
                // Coordinates as [fraction of the viewport size, pixels].
                const coord = (v) => {
                    const p = percentage(v);
                    return p !== null ? [p, 0] : [0, length(v, cs.em) || 0];
                };
                items.push({
                    type: "line",
                    x1: coord(a.x1),
                    y1: coord(a.y1),
                    x2: coord(a.x2),
                    y2: coord(a.y2),
                    width: length(a["stroke-width"], cs.em) || 1,
                });
            } else {
                this.unsupported.add("svg " + kind(child));
            }
        }
        return {
            type: "svg",
            x,
            y,
            w,
            h,
            viewBox: attrs.viewBox ? attrs.viewBox.trim().split(/[\s,]+/).map(Number) : null,
            preserveAspectRatio: attrs.preserveAspectRatio || null,
            items,
            color: cs.color,
            // Browsers paint SVG viewports at whole device pixels.
            snap: !!this.pixelRatio,
        };
    }

    /**
     * Applies the properties shared by all boxes: horizontal margins,
     * `position: relative` offsets and `vertical-align`.
     */
    decorate(box, node, cs) {
        const style = styleOf(node);
        const dy =
            -(length(style.verticalAlign, cs.em) || 0) +
            (length(style.top, cs.em) || 0) -
            (length(style.bottom, cs.em) || 0);
        const dx = length(style.left, cs.em) || 0;
        shift(box, cs.box.marginLeft + dx, dy);
        box.width += cs.box.marginLeft + cs.box.marginRight;
        return box;
    }

    hlist(children, cs, ancestors, avail, inlineBlocks) {
        const box = emptyBox();
        for (const child of children) {
            const b = this.node(child, cs, ancestors, avail, inlineBlocks);
            append(box, b);
        }
        return box;
    }

    /**
     * A vlist is an inline-table whose first cell contains one block per
     * item. Each block is `position: relative` with a `top` offset and holds
     * a pstrut (an inline-block of known height whose bottom lies on the
     * line's baseline) followed by the item. The cell's bottom edge is the
     * table's baseline, so the item's baseline ends up at `top + pstrut`
     * below the vlist's baseline.
     */
    vlistTable(node, cs, ancestors) {
        const rows = node.children || [];
        const box = emptyBox();
        if (rows.length === 0) return box;
        const rowStyle = computeStyle(rows[0], cs, ancestors);
        const rowAncestors = ancestors.concat([rows[0]]);
        const cell = rows[0].children[0];
        const cellStyle = computeStyle(cell, rowStyle, rowAncestors);
        const cellAncestors = rowAncestors.concat([cell]);

        const items = [];
        for (const wrapper of cell.children || []) {
            const ws = computeStyle(wrapper, cellStyle, cellAncestors);
            const wrapperAncestors = cellAncestors.concat([wrapper]);
            let pstrut = 0;
            const content = [];
            for (const child of wrapper.children || []) {
                if (hasClass(child, "pstrut")) {
                    const ps = computeStyle(child, ws, wrapperAncestors);
                    pstrut = length(styleOf(child).height, ps.em) || 0;
                } else {
                    content.push(child);
                }
            }
            const line = this.hlist(content, ws, wrapperAncestors, { cb: null, pos: null }, true);
            const top = length(styleOf(wrapper).top, ws.em) || 0;
            items.push({ wrapper, ws, wrapperAncestors, content, line, baseline: top + pstrut });
        }

        let cellWidth = 0;
        for (const item of items) {
            const m = item.ws.box;
            cellWidth = Math.max(cellWidth, m.marginLeft + item.line.width + m.marginRight);
        }

        for (const item of items) {
            const m = item.ws.box;
            const available = cellWidth - m.marginLeft - m.marginRight;
            let line = item.line;
            if (line.dependsOnWidth) {
                // The block is `position: relative`, so it is also the
                // containing block of absolutely positioned SVGs.
                const avail = { cb: available, pos: available };
                line = this.hlist(item.content, item.ws, item.wrapperAncestors, avail, true);
            }
            const x = m.marginLeft + item.ws.textAlign * Math.max(0, available - line.width);
            for (const op of line.ops) box.ops.push(moved(op, x, item.baseline));
            box.height = Math.max(box.height, line.height - item.baseline);
            box.depth = Math.max(box.depth, line.depth + item.baseline);
        }

        box.width = cellWidth;
        // The cells' heights are KaTeX's height and depth of the vlist. They
        // take precedence over the extent of the items, whose boxes may
        // include invisible padding (e.g. above the vinculum of \sqrt).
        const cellHeight = length(styleOf(cell).height, cellStyle.em);
        if (cellHeight !== null) box.height = cellHeight;
        box.depth = 0;
        if (rows.length > 1) {
            const depthCell = rows[1].children[0];
            const depthHeight = length(styleOf(depthCell).height, cellStyle.em);
            if (depthHeight !== null) box.depth = depthHeight;
        }
        box.hasLine = true;
        box.lineTop = -box.height;
        box.lineBottom = box.depth;
        return box;
    }

    /**
     * \llap, \rlap and \clap: a zero-width box whose `.katex-inner` is
     * absolutely positioned (at its static position, so it shares the
     * baseline) and aligned to the right, left or center of that point. A
     * `.katex-fix` inline-block provides the line box.
     */
    lap(node, cs, ancestors) {
        const box = emptyBox();
        box.hasLine = true;
        for (const child of node.children || []) {
            if (!hasClass(child, "katex-inner")) continue;
            const is = computeStyle(child, cs, ancestors);
            const inner = this.hlist(child.children || [], is, ancestors.concat([child]), { cb: null, pos: null });
            let x = 0;
            if (hasClass(node, "llap")) x = -inner.width;
            if (hasClass(node, "clap")) x = -inner.width / 2;
            for (const op of inner.ops) box.ops.push(moved(op, x, 0));
            box.height = Math.max(box.height, inner.height);
            box.depth = Math.max(box.depth, inner.depth);
        }
        return box;
    }

    /**
     * The top level: `.katex-html` holds the `.katex-base` boxes, which
     * `.katex-newline` blocks break into lines, and optionally a
     * `.katex-tag`, absolutely positioned at the right end.
     */
    root(tree, rootStyle, displayWidth) {
        // Equation numbers count in document order, independently of how
        // often a node gets laid out.
        (function number(node, map) {
            if (hasClass(node, "eqn-num")) map.set(node, map.size + 1);
            for (const child of node.children || []) number(child, map);
        })(tree, this.equationNumbers);
        let html = tree;
        const path = [];
        while (html && !hasClass(html, "katex-html")) {
            path.push(html);
            html = (html.children || []).find((c) => hasClass(c, "katex-html") || hasClass(c, "katex"));
        }
        if (!html) return this.hlist(tree.children || [], rootStyle, [tree], { cb: null, pos: null });
        const hs = computeStyle(html, rootStyle, path);
        const ancestors = path.concat([html]);
        const avail = { cb: null, pos: null };

        const lines = [[]];
        // Extra space above each line, from \\[<length>].
        const gaps = [0];
        let tag = null;
        for (const child of html.children || []) {
            if (hasClass(child, "katex-newline")) {
                lines.push([]);
                gaps.push(length(styleOf(child).marginTop, computeStyle(child, hs, ancestors).em) || 0);
            }
            else if (hasClass(child, "katex-tag")) tag = child;
            else lines[lines.length - 1].push(child);
        }
        const boxes = lines.map((children) => this.hlist(children, hs, ancestors, avail));

        const box = emptyBox();
        if (boxes.length === 1) {
            append(box, boxes[0]);
        } else {
            // Stack the lines as CSS line boxes: each spans the margin boxes
            // of its `.katex-base` boxes and the strut of `.katex-html`.
            const strut = this.strut(hs);
            let baseline = 0;
            let prevBottom = 0;
            boxes.forEach((line, i) => {
                const top = Math.min(strut.top, line.lineTop);
                const bottom = Math.max(strut.bottom, line.lineBottom);
                if (i > 0) baseline += prevBottom + gaps[i] - top;
                for (const op of line.ops) box.ops.push(moved(op, 0, baseline));
                box.width = Math.max(box.width, line.width);
                if (i === 0) box.height = line.height;
                box.depth = baseline + line.depth;
                prevBottom = bottom;
            });
            box.lastBaseline = baseline;
        }
        if (tag) {
            const ts = computeStyle(tag, hs, ancestors);
            const content = this.hlist(tag.children || [], ts, ancestors.concat([tag]), avail);
            const right = Math.max(displayWidth || 0, box.width);
            const y = box.lastBaseline || 0;
            for (const op of content.ops) box.ops.push(moved(op, right - content.width, y));
            box.height = Math.max(box.height, content.height - y);
            box.depth = Math.max(box.depth, content.depth + y);
        }
        return box;
    }

    /**
     * The extent of an inline box of the given style in a CSS line box: the
     * font's ascent and descent plus half the leading on either side.
     */
    strut(cs) {
        const font = fontString(cs);
        const key = font + " " + cs.lineHeight;
        let strut = this.struts.get(key);
        if (!strut) {
            this.ctx.font = font;
            const m = this.ctx.measureText("x");
            let ascent = m.fontBoundingBoxAscent;
            let descent = m.fontBoundingBoxDescent;
            if (ascent === undefined) {
                // Without font metrics, assume those of KaTeX_Main.
                ascent = 0.9 * cs.em;
                descent = 0.25 * cs.em;
            }
            const leading = (cs.lineHeight * cs.size - ascent - descent) / 2;
            strut = { top: -ascent - leading, bottom: descent + leading };
            this.struts.set(key, strut);
        }
        return strut;
    }
}

const PIECE_SET = new Set(Object.keys(PIECES));

function isAbsoluteLabel(node) {
    return hasClass(node, "cd-label-left") || hasClass(node, "cd-label-right");
}

function isAccent(node) {
    return hasClass(node, "katex-accent");
}

// Chromium snaps border widths in CSS pixels, whatever the device pixel
// ratio: thin ones become one pixel wide, others are rounded down.
function snapBorder(width) {
    if (width <= 0) return 0;
    return width < 1 ? 1 : Math.floor(width);
}

function emptyBox() {
    // height and depth are those of TeX; lineTop and lineBottom delimit the
    // box's contribution to a CSS line box (y coordinates, top negative).
    return { width: 0, height: 0, depth: 0, lineTop: 0, lineBottom: 0, ops: [], dependsOnWidth: false, hasLine: false };
}

function moved(op, dx, dy) {
    const copy = Object.assign({}, op);
    copy.x += dx;
    copy.y += dy;
    return copy;
}

function shift(box, dx, dy) {
    if (dx === 0 && dy === 0) return;
    box.ops = box.ops.map((op) => moved(op, dx, dy));
    box.height -= dy;
    box.depth += dy;
    box.lineTop += dy;
    box.lineBottom += dy;
}

function append(box, b) {
    for (const op of b.ops) box.ops.push(moved(op, box.width, 0));
    box.width += b.width;
    box.height = Math.max(box.height, b.height);
    box.depth = Math.max(box.depth, b.depth);
    box.lineTop = Math.min(box.lineTop, b.lineTop);
    box.lineBottom = Math.max(box.lineBottom, b.lineBottom);
    box.dependsOnWidth = box.dependsOnWidth || b.dependsOnWidth;
    box.hasLine = box.hasLine || b.hasLine;
}

/**
 * Lays out a tree returned by `katex.__renderToHTMLTree`.
 *
 * @param tree the root node (`span.katex`, possibly inside `.katex-display`)
 * @param ctx a 2D canvas context, used for measuring text
 * @param options.fontSize the font size in CSS pixels of the `.katex`
 *        element, i.e. of one TeX em (`katex.css` makes this 1.21 times the
 *        surrounding font size)
 * @param options.pixelRatio if given, device pixels per CSS pixel: border
 *        thicknesses are then rounded to CSS pixels, rules are drawn at
 *        whole device pixels and get katex.css's `min-height: 1px`, as in
 *        browsers, which keeps the layout identical to KaTeX's HTML output
 *        when drawing without rotation or scaling
 * @param options.displayWidth the width that equation tags (\tag) are
 *        right-aligned to; defaults to the width of the formula
 * @param options.images loaded images by URL (\includegraphics); their
 *        natural size determines the layout of images with only one of
 *        width and height given
 * @returns a box `{width, height, depth, ops, fonts, images, unsupported}`;
 *        `fonts` lists the CSS font strings that need to be loaded before
 *        rendering, `images` the URLs of images to pass to `render`
 */
export function layout(tree, ctx, options) {
    const root = {
        family: "KaTeX_Main",
        style: "normal",
        weight: "normal",
        size: options.fontSize,
        color: null,
        textAlign: 0,
        multDelim: false,
        textShadow: null,
        lineHeight: 1.2,
    };
    const engine = new Layout(ctx, options.pixelRatio || null, options.images);
    ctx.save();
    let box;
    try {
        // `.katex` sets the font size to 1.21em; we take fontSize to mean the
        // size inside, so the root's own font rules are applied without it.
        box = engine.root(tree, root, options.displayWidth);
    } finally {
        ctx.restore();
    }
    return {
        width: box.width,
        height: box.height,
        depth: box.depth,
        ops: box.ops,
        fonts: Array.from(engine.fonts),
        images: Array.from(engine.imageSources),
        unsupported: Array.from(engine.unsupported),
    };
}

/**
 * Draws a laid-out box with its baseline starting at (x, y). Ops without an
 * explicit color use the context's current fill style.
 *
 * @param options.images maps the URLs in `box.images` to loaded images;
 *        missing ones are skipped
 * @param options.outline stroke everything with the context's stroke style
 *        and line width before filling
 */
export function render(ctx, box, x, y, options) {
    const images = (options && options.images) || {};
    ctx.save();
    try {
        const fill = ctx.fillStyle;
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.translate(x, y);
        // Outlines go below the whole formula, as CindyJS draws them for
        // plain text: stroked with the context's stroke style and width.
        if (options && options.outline) drawOps(ctx, box.ops, fill, images, true);
        drawOps(ctx, box.ops, fill, images, false);
    } finally {
        ctx.restore();
    }
}

const path2Ds = new Map();

function path2D(d) {
    let p = path2Ds.get(d);
    if (!p) {
        // Stretched delimiters and roots have paths of their own for every
        // height; keep the cache from growing without bound.
        if (path2Ds.size >= 1024) path2Ds.clear();
        p = new Path2D(d);
        path2Ds.set(d, p);
    }
    return p;
}

function drawOps(ctx, ops, fill, images, stroke) {
    for (const op of ops) {
        const color = op.color === null || op.color === undefined ? fill : op.color;
        ctx.fillStyle = color;
        switch (op.type) {
            case "text": {
                ctx.font = op.font;
                const paint = stroke ? ctx.strokeText.bind(ctx) : ctx.fillText.bind(ctx);
                if (op.shadow) paint(op.text, op.x + op.shadow.dx, op.y + op.shadow.dy);
                paint(op.text, op.x, op.y);
                break;
            }
            case "rect":
                drawRect(ctx, op, stroke);
                break;
            case "svg":
                drawSvg(ctx, op, color, stroke);
                break;
            case "image":
                if (images[op.src] && !stroke) ctx.drawImage(images[op.src], op.x, op.y, op.w, op.h);
                break;
            case "group":
                ctx.save();
                ctx.translate(op.x, op.y);
                if (op.clip) clipTo(ctx, op.clip, op.snap);
                if (op.transform) {
                    const t = op.transform;
                    ctx.transform(t.a, t.b, t.c, t.d, t.e, t.f);
                }
                drawOps(ctx, op.ops, fill, images, stroke);
                ctx.restore();
                break;
        }
    }
}

function drawSvg(ctx, op, color, stroke) {
    const outlineWidth = ctx.lineWidth;
    ctx.save();
    ctx.translate(op.x, op.y);
    const { w, h } = op;
    // Browsers paint the viewport at whole device pixels and clip to the
    // pixel-snapped rectangle, but fit the viewBox to the exact size.
    let clip = { x: 0, y: 0, w, h };
    const t = ctx.getTransform();
    if (op.snap && isAxisAligned(t)) {
        const x0 = Math.round(t.e);
        const y0 = Math.round(t.f);
        ctx.setTransform(t.a, 0, 0, t.d, x0, y0);
        clip = { x: 0, y: 0, w: (Math.round(t.e + t.a * w) - x0) / t.a, h: (Math.round(t.f + t.d * h) - y0) / t.d };
    }
    // Inner SVG elements clip to their viewport.
    ctx.beginPath();
    ctx.rect(clip.x, clip.y, clip.w, clip.h);
    ctx.clip();
    const v = op.viewBox ? viewBoxTransform(op.viewBox, op.preserveAspectRatio, w, h) : null;
    for (const item of op.items) {
        if (item.type === "path") {
            ctx.save();
            if (v) {
                ctx.translate(v.tx, v.ty);
                ctx.scale(v.sx, v.sy);
            }
            if (stroke) {
                // The outline's width is meant in the formula's units.
                ctx.lineWidth = outlineWidth / (v ? Math.sqrt(Math.abs(v.sx * v.sy)) : 1);
                ctx.stroke(path2D(item.d));
            } else {
                ctx.fill(path2D(item.d));
            }
            ctx.restore();
        } else {
            // A line's outline is a wider line below it.
            if (!stroke) ctx.strokeStyle = color;
            ctx.lineWidth = item.width + (stroke ? outlineWidth : 0);
            ctx.lineCap = "butt";
            ctx.setLineDash([]);
            ctx.beginPath();
            // Percentages refer to the (snapped) viewport.
            ctx.moveTo(item.x1[0] * clip.w + item.x1[1], item.y1[0] * clip.h + item.y1[1]);
            ctx.lineTo(item.x2[0] * clip.w + item.x2[1], item.y2[0] * clip.h + item.y2[1]);
            ctx.stroke();
        }
    }
    ctx.restore();
}

function isAxisAligned(t) {
    return t.b === 0 && t.c === 0 && t.a !== 0 && t.d !== 0;
}

// Clips to a rectangle; `snap` rounds its edges to device pixels, as
// browsers do for boxes with `overflow: hidden` (and SVG viewports), where
// the transform is axis-aligned. The origin moves along with the top left
// corner, so the content stays put relative to the clip.
function clipTo(ctx, clip, snap) {
    const t = ctx.getTransform();
    ctx.beginPath();
    if (snap && isAxisAligned(t)) {
        const x0 = Math.round(t.a * clip.x + t.e);
        const y0 = Math.round(t.d * clip.y + t.f);
        const x1 = Math.round(t.a * (clip.x + clip.w) + t.e);
        const y1 = Math.round(t.d * (clip.y + clip.h) + t.f);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.rect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0));
        ctx.clip();
        const u = new DOMMatrix([t.a, t.b, t.c, t.d, x0 - t.a * clip.x, y0 - t.d * clip.y]);
        ctx.setTransform(u);
    } else {
        ctx.rect(clip.x, clip.y, clip.w, clip.h);
        ctx.clip();
    }
}

function drawRect(ctx, op, stroke) {
    const t = ctx.getTransform();
    // Rules are snapped to device pixels the way browsers snap borders, but
    // only when that is meaningful, i.e. for axis-aligned transforms.
    let { x, y, w, h } = op;
    if (isAxisAligned(t)) {
        const edge = op.edge;
        // Under a flip, the device-space interval runs the other way round.
        const span = (start, size, anchor, scale, offset) => {
            const a = scale * start + offset;
            const b = scale * (start + size) + offset;
            return scale > 0 ? snapSpan(a, b - a, anchor) : snapSpan(b, a - b, -anchor);
        };
        const [x0, x1] = span(x, w, edge === "left" ? 1 : edge === "right" ? -1 : 0, t.a, t.e);
        const [y0, y1] = span(y, h, edge === "top" ? 1 : edge === "bottom" ? -1 : 0, t.d, t.f);
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        if (stroke) ctx.lineWidth *= Math.sqrt(Math.abs(t.a * t.d));
        paintMaybeDashed(ctx, x0, y0, x1 - x0, y1 - y0, op.dashed, stroke);
        ctx.restore();
    } else {
        paintMaybeDashed(ctx, x, y, w, h, op.dashed, stroke);
    }
}

// Dashed borders: dashes and gaps three times as long as the border is
// thick, spread so that the rule starts and ends with a dash.
function paintMaybeDashed(ctx, x, y, w, h, dashed, stroke) {
    const paint = stroke ? ctx.strokeRect.bind(ctx) : ctx.fillRect.bind(ctx);
    if (!dashed) {
        paint(x, y, w, h);
        return;
    }
    const horizontal = w >= h;
    const len = horizontal ? w : h;
    const thick = horizontal ? h : w;
    const dash = 3 * thick;
    const n = Math.max(1, Math.round((len + dash) / (2 * dash)));
    const gap = n > 1 ? (len - n * dash) / (n - 1) : 0;
    for (let i = 0; i < n; ++i) {
        const s = i * (dash + gap);
        if (horizontal) paint(x + s, y, Math.min(dash, len - s), h);
        else paint(x, y + s, w, Math.min(dash, len - s));
    }
}

// Snaps the interval [start, start + size] to whole pixels. For a border
// (anchor != 0) the thickness is floored and measured from the outer edge:
// the start for anchor 1, the end for anchor -1.
function snapSpan(start, size, anchor) {
    if (anchor === 0) {
        const a = Math.round(start);
        return [a, Math.max(a + 1, Math.round(start + size))];
    }
    const thickness = size < 1 ? 1 : Math.floor(size);
    if (anchor > 0) {
        const a = Math.round(start);
        return [a, a + thickness];
    }
    const b = Math.round(start + size);
    return [b - thickness, b];
}
