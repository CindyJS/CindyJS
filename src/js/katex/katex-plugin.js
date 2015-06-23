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
                    "KaTeX_Size1:n4",
                    "KaTeX_Size2:n4",
                    "KaTeX_Size3:n4",
                    "KaTeX_Size4:n4",
                ],
                urls: [createCindy.getBaseDir() + "katex/katex.min.css"]
            },
            classes: false,
            active: fontsReady
        });
    }

    function fontsReady() {
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
                fontSize: fontSize
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
