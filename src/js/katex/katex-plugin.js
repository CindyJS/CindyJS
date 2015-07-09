(function() {
    "use strict";

    var katex = null;
    var WebFontLoader = null;
    var fontsLoaded = false;
    var waitingInstances = [];

    createCindy.loadScript("WebFont", "webfont.js", loadFonts);
    createCindy.loadScript("katex", "katex/katex.min.js", katexReady);

    function loadFonts() {
        console.log("WebFontLoader is now available.");
        WebFontLoader = window.WebFont;
        WebFontLoader.load({
            custom: {
                families: [
                    "KaTeX_Main:n7,i4,n4",
                    "KaTeX_Math:i7,i4,n4",
                    "KaTeX_AMS:n4",
                    "KaTeX_Size1:n4",
                    "KaTeX_Size2:n4",
                    "KaTeX_Size3:n4",
                    "KaTeX_Size4:n4",
                    "KaTeX_Caligraphic:n4,n7",
                    "KaTeX_Fraktur:n4,n7",
                    "KaTeX_SansSerif:n4",
                    "KaTeX_Script:n4",
                    "KaTeX_Typewriter:n4",
                ],
                testStrings: {
                  "KaTeX_Size1": "()[]",
                  "KaTeX_Size2": "()[]",
                  "KaTeX_Size3": "()[]",
                  "KaTeX_Size4": "()[]"
                },
                urls: [createCindy.getBaseDir() + "katex/katex.min.css"]
            },
            active: fontsReady
        });
    }

    function fontsReady() {
        console.log(arguments);
        console.log("Math fonts are now available.");
        fontsLoaded = true;
        if (katex) doneWaiting();
    }

    function katexReady() {
        console.log("KaTeX is now available.");
        katex = window.katex;
        if (fontsLoaded) doneWaiting();
    }

    function doneWaiting() {
        var instances = waitingInstances;
        waitingInstances = null;
        for (var i = 0; i < instances.length; ++i)
            instances[i].evokeCS(""); // trigger repaint
    }

    createCindy.registerPlugin(1, "katex", plugin);

    function plugin(api) {
        if (waitingInstances)
            waitingInstances.push(api.instance);
        var storage = {cache: {}, misses:0};
        api.setTextRenderer(katexRenderer.bind(storage));
    }

    function textBox(ctx, text) {
        this.width = ctx.measureText(text).width;
        this.renderAt = function(x, y) {
            ctx.fillText(text, x, y);
        };
    }

    var firstMessage = true;

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

    function katexRenderer(ctx, text, x, y, align) {
        if (waitingInstances !== null) {
            if (firstMessage) {
                console.log("KaTeX is not ready yet.");
                firstMessage = false;
            }
            /*
            var width = ctx.measureText(text).width;
            ctx.fillText(text, x - align * width, y);
            */
            return;
        }
        var fontSize = /(?:^| )([0-9]+)px(?:$| )/.exec(ctx.font);
        fontSize = fontSize ? +fontSize[1] : 16;
        var key = fontSize + ":" + text;
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
            for (i = 0; i < n; i += 2) {
                parts[i] = new textBox(ctx, parts[i]);
            }
            for (i = 1; i < n; i += 2) {
                try {
                    parts[i] = katex.canvasBox(parts[i], ctx, opts);
                } catch(e) {
                    console.error(e);
                    parts[i] = new textBox(ctx, "$" + parts[i] + "$");
                }
            }
            if (++this.misses === 1024) {
                this.misses = 0;
                this.cache = {};
            }
            this.cache[key] = parts;
        }
        var total = 0;
        for (i = 0; i < n; ++i)
            total += parts[i].width;
        x -= align * total;
        for (i = 0; i < n; ++i) {
            parts[i].renderAt(x, y);
            x += parts[i].width;
        }
    };
})();
