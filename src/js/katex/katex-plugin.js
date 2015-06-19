(function() {
    "use strict";
    var waitingForFonts = [];
    WebFont.load({
        custom: {
            families: ["KaTeX_Main:n7,i4,n4", "KaTeX_Math:i7,i4,n4"]
        },
        active: function() {
            console.log("Math fonts are now available.");
            var instances = waitingForFonts;
            waitingForFonts = null;
            for (var i = 0; i < instances.length; ++i)
                instances[i].evokeCS(""); // trigger repaint
        }
    });
    createCindy.registerPlugin(1, "katex", function(api) {
        if (waitingForFonts)
            waitingForFonts.push(api.instance);
        api.setTextRenderer(katexRenderer);
    });
    function textBox(ctx, text) {
        this.width = ctx.measureText(text).width;
        this.renderAt = function(x, y) {
            ctx.fillText(text, x, y);
        };
    }
    function katexRenderer(ctx, text, x, y, align) {
        if (waitingForFonts !== null) {
            // Fonts not available yet
            console.log("Math fonts are not available yet.");
            var width = ctx.measureText(text).width;
            ctx.fillText(text, x - align * total, y);
            return;
        }
        var fontSize = /(?:^| )([0-9]+)px(?:$| )/.exec(ctx.font);
        fontSize = fontSize ? +fontSize[1] : 16;
        var opts = {
            fontSize: fontSize
        };
        var parts = text.split("$");
        var n = parts.length;
        var i;
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
