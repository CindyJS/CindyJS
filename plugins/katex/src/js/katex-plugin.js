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
        api.setTextRenderer(katexRenderer.bind(storage));
    }

    // Text box, with same api as a prepared KaTeX box but using current font

    function textBox(ctx, text) {
        this.width = ctx.measureText(text).width;
        this.renderAt = function(x, y) {
            ctx.fillText(text, x, y);
        };
    }

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

    function katexRenderer(ctx, text, x, y, align) {
        var fontSize = /(?:^| )([0-9]+)px(?:$| )/.exec(ctx.font);
        fontSize = fontSize ? +fontSize[1] : 16;
        var key = fontSize + ":" + text;
        var fontsMissing = false;
        var fontsToLoad = {};
        var parts, n, i;
        if (this.cache.hasOwnProperty(key)) {
            parts = this.cache[key];
            n = parts.length;
        } else {
            var opts = {
                fontSize: fontSize,
                macros: macros
            };
            parts = text.split("$");
            n = parts.length;
            if (n > 1 && !allScriptsLoaded()) {
                if (firstMessage) {
                    log("KaTeX is not ready yet.");
                    firstMessage = false;
                }
                haveToWait(this.instance);
                return;
            }
            for (i = 0; i < n; i += 2) {
                parts[i] = new textBox(ctx, parts[i]);
            }
            for (i = 1; i < n; i += 2) {
                try {
                    parts[i] = katex.canvasBox(parts[i], ctx, opts);
                    for (var font in parts[i].fontsUsed) {
                        var fontState = fonts[font];
                        if (fontState !== true) {
                            fontsMissing = true;
                            if (fontState === undefined)
                                fontsToLoad[font] = true;
                        }
                    }
                } catch(e) {
                    console.error(e);
                    parts[i] = new textBox(ctx, "$" + parts[i] + "$");
                }
            }
            if (++this.misses === 1024) {
                this.misses = 0;
                this.cache = {};
            }
            if (!fontsMissing) {
                this.cache[key] = parts;
            }
        }
        if (fontsMissing) {
            fontsToLoad = Object.keys(fontsToLoad);
            if (fontsToLoad.length !== 0) {
                loadFonts(fontsToLoad);
            }
            haveToWait(this.instance);
        } else {
            var total = 0;
            for (i = 0; i < n; ++i)
                total += parts[i].width;
            x -= align * total;
            for (i = 0; i < n; ++i) {
                parts[i].renderAt(x, y);
                x += parts[i].width;
            }
        }
    };
})();
