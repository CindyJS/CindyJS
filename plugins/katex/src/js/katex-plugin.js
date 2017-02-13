(function() {
    "use strict";

    var log = console.log.bind(console);
    var fonts = {};
    var waitingInstances = [];
    var repaintTimeout = null;

    // Load required components: WebFontLoader and katex

    var WebFontLoader = null;
    var katex = null;

    CindyJS.loadScript("WebFont", "webfont.js", fontLoaderReady);
    CindyJS.loadScript("katex", "katex/katex.min.js", katexReady);

    function fontLoaderReady() {
        log("WebFontLoader is now available.");
        WebFontLoader = window.WebFont;
        loadFonts(["KaTeX_Math:i4", "KaTeX_Main:n4"]); // pre-load common fonts
        someScriptLoaded();
    }

    function katexReady() {
        log("KaTeX is now available.");
        katex = window.katex;
        someScriptLoaded();
    }

    function someScriptLoaded() {
        if (allScriptsLoaded())
            triggerRepaints();
    }

    function allScriptsLoaded() {
        return katex && WebFontLoader;
    }

    // Load common and used fonts

    function loadFonts(fontsToLoad) {
        log("Loading ", fontsToLoad);
        fontsToLoad.forEach(function(fvd) {
            fonts[fvd] = "loading";
        });
        WebFontLoader.load({
            custom: {
                families: fontsToLoad,
                testStrings: {
                  "KaTeX_Size1": "()[]",
                  "KaTeX_Size2": "()[]",
                  "KaTeX_Size3": "()[]",
                  "KaTeX_Size4": "()[]"
                },
                urls: [CindyJS.getBaseDir() + "katex/katex.min.css"]
            },
            fontactive: fontActive
        });
    }

    function fontActive(font, variant) {
        var fvd = font + ":" + variant;
        log("Loaded " + fvd);
        fonts[fvd] = true; // done loading
        if (repaintTimeout === null)
            repaintTimeout = setTimeout(triggerRepaints, 0);
    }

    // Handle repainting

    function triggerRepaints() {
        repaintTimeout = null;
        var instances = waitingInstances;
        waitingInstances = [];
        for (var i = 0; i < instances.length; ++i)
            instances[i].evokeCS(""); // trigger repaint
    }

    function haveToWait(i) {
        if (!waitingInstances.some(function(j) {
            return i === j;
        })) {
            waitingInstances.push(i);
        }
    }

    // Plugin API

    CindyJS.registerPlugin(1, "katex", plugin);

    function plugin(api) {
        var storage = {instance: api.instance, cache: {}, misses:0};
        api.setTextRenderer(
            katexRenderer.bind(storage),
            katexHtml.bind(storage));
    }

    // Text box, with same api as a prepared KaTeX box but using current font

    function textBox(ctx, text) {
        this.width = ctx.measureText(text).width;
        this.renderAt = function(x, y) {
            ctx.fillText(text, x, y);
        };
    }

    textBox.prototype.height = 0;

    textBox.prototype.depth = 0;

    // Custom macros defined specifically for Cinderella / CindyJS

    var macros = {
        "\\mbox": "\\text",
        "\\lamda": "\\lambda",
        "\\my": "\\mu",
        "\\ny": "\\nu",
        "\\ypsilon": "\\upsilon",
        "\\Alpha": "\\mathrm{A}",
        "\\Beta": "\\mathrm{B}",
        "\\Epsilon": "\\mathrm{E}",
        "\\Zeta": "\\mathrm{Z}",
        "\\Eta": "\\mathrm{H}",
        "\\Iota": "\\mathrm{I}",
        "\\Kappa": "\\mathrm{K}",
        "\\Lamda": "\\Lambda",
        "\\Mu": "\\mathrm{M}",
        "\\My": "\\Mu",
        "\\Nu": "\\mathrm{N}",
        "\\Ny": "\\Nu",
        "\\Omicron": "\\mathrm{O}",
        "\\Rho": "\\mathrm{P}",
        "\\Tau": "\\mathrm{T}",
        "\\Ypsilon": "\\Upsilon",
        "\\Chi": "\\mathrm{X}",
        "\\dots": "\\ldots",
        "\\C": "\\mathbb{C}",
        "\\H": "\\mathbb{H}",
        "\\N": "\\mathbb{N}",
        "\\P": "\\mathbb{P}",
        "\\Q": "\\mathbb{Q}",
        "\\R": "\\mathbb{R}",
        "\\Z": "\\mathbb{Z}",
        "\\slash": "/",
        "\\operatorname": "\\text", // till KaTeX #145 gets resolved
        "\\arccot": "\\operatorname{arccot}",
        "\\arcsec": "\\operatorname{arcsec}",
        "\\arccsc": "\\operatorname{arccsc}",
    };

    // Report whether we are ready

    var firstMessage = true;

    function katexRenderer(ctx, text, x, y, align, fontSize, lineHeight) {
        var key = fontSize + "," + lineHeight + ":" + text;
        var fontsMissing = false;
        var fontsToLoad = {};
        var parts, rows, row, n, i, j;
        if (this.cache.hasOwnProperty(key)) {
            rows = this.cache[key];
        } else {
            var opts = {
                fontSize: fontSize,
                macros: macros
            };
            parts = text.split("$");
            row = [];
            rows = [row];
            n = parts.length;
            if (n > 1 && !allScriptsLoaded()) {
                if (firstMessage) {
                    log("KaTeX is not ready yet.");
                    firstMessage = false;
                }
                haveToWait(this.instance);
                return;
            }
            for (i = 0; i < n; ++i) {
                var part = parts[i];
                var box;
                if ((i & 1) === 0) { // plain text not TeX
                    if (part.indexOf("\n") === -1) {
                        row.push(new textBox(ctx, part));
                    } else {
                        var rows2 = part.split("\n");
                        row.push(new textBox(ctx, rows2[0]));
                        for (j = 1; j < rows2.length; ++j) {
                            row = [new textBox(ctx, rows2[j])];
                            rows.push(row);
                        }
                    }
                } else {
                    try {
                        var tex = parts[i].replace(/°/g, "\\degree");
                        box = katex.canvasBox(tex, ctx, opts);
                        row.push(box);
                        for (var font in box.fontsUsed) {
                            var fontState = fonts[font];
                            if (fontState !== true) {
                                fontsMissing = true;
                                if (fontState === undefined)
                                    fontsToLoad[font] = true;
                            }
                        }
                    } catch(e) {
                        console.error(e);
                        row.push(new textBox(ctx, "$" + parts[i] + "$"));
                    }
                }
            }
            if (++this.misses === 1024) {
                this.misses = 0;
                this.cache = {};
            }
            if (!fontsMissing) {
                this.cache[key] = rows;
            }
        }
        if (fontsMissing) {
            fontsToLoad = Object.keys(fontsToLoad);
            if (fontsToLoad.length !== 0) {
                loadFonts(fontsToLoad);
            }
            haveToWait(this.instance);
        } else {
            var left = Infinity;
            var right = -Infinity;
            var top = y - 0.7 * 1.2 * fontSize;
            var bottom = -Infinity;
            for (i = 0; i < rows.length; ++i) {
                var total = 0;
                var pos = x;
                row = rows[i];
                n = row.length;
                for (j = 0; j < n; ++j)
                    total += row[j].width;
                var pos = x - align * total;
                for (j = 0; j < n; ++j) {
                    row[j].renderAt(pos, y);
                    if (left > pos) left = pos;
                    if (top > y - row[j].height) top = y - row[j].height;
                    if (bottom < y + row[j].depth) bottom = y + row[j].depth;
                    pos += row[j].width;
                    if (right < pos) right = pos;
                }
                y += lineHeight;
                // TODO: take vertical dimensions of formulas into account
            }
            bottom = Math.max(bottom, y - lineHeight + 0.3 * 1.2 * fontSize);
            return {
                left: left,
                right: right,
                top: top,
                bottom: bottom
            };
        }
    };

    function katexHtml(element, text) {
        var opts = {
            macros: macros
        };
        var parts = text.split("$");
        var n = parts.length;
        if (n > 1 && !allScriptsLoaded()) {
            if (firstMessage) {
                log("KaTeX is not ready yet.");
                firstMessage = false;
            }
            haveToWait(this.instance);
            return false;
        }
        while (element.firstChild)
            element.removeChild(element.firstChild);
        for (var i = 0; i < n; ++i) {
            var text = parts[i];
            if ((i & 1) === 0) {
                if (text.indexOf("\n") !== -1) {
                    var rows = text.split("\n");
                    element.appendChild(document.createTextNode(rows[0]));
                    for (var j = 1; j < rows.length; ++j) {
                        element.appendChild(document.createElement("br"));
                        element.appendChild(document.createTextNode(rows[j]));
                    }
                } else {
                    element.appendChild(document.createTextNode(text));
                }
            } else {
                var span = document.createElement("span");
                katex.render(text, span, opts);
                element.appendChild(span);
            }
        }
    }
})();
