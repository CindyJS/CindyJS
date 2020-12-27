CindyJS.registerPlugin(1, "dimensions", function (api) {
    api.defineFunction("pixelwidth", 0, function (args, modifs) {
        var sdet = api.getInitialMatrix().sdet;
        if (sdet && sdet > 0) {
            return {
                ctype: "number",
                value: {
                    real: 1 / sdet,
                    imag: 0,
                },
            };
        } else return api.nada;
    });
});
