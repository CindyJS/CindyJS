CindyJS.registerPlugin(1, "ComplexCurves", function (api) {
    //////////////////////////////////////////////////////////////////////
    // API bindings

    /** @type {CindyJS.anyval} */
    let nada = api.nada;

    /** @type {function(CindyJS.anyval):CindyJS.anyval} */
    let evaluate = api.evaluate;

    /** @type {function(string,number,CindyJS.op)} */
    let defOp = api.defineFunction;

    //////////////////////////////////////////////////////////////////////
    // Almost global variables

    let instances = {};

    //////////////////////////////////////////////////////////////////////
    // Modifier handling

    /**
     * @param {Object} modifs
     * @param {Object} handlers
     */
    function handleModifs(modifs, handlers) {
        let key, handler;
        for (key in modifs) {
            handler = handlers[key];
            if (handler) handler(evaluate(modifs[key]));
            else console.log("Modifier " + key + " not supported");
        }
    }

    //////////////////////////////////////////////////////////////////////
    // ComplexCurves operators

    function ComplexCurves$1(args, modifs) {
        let canvasId =
            /** @type {string} */
            (coerce.toString(args[0], "CSCanvas"));
        let cc = instances[canvasId];
        if (!cc) {
            console.log("Unknown instance '" + canvasId + "'");
            return nada;
        }
        let alpha = 1,
            bg = [0, 0, 0];
        handleModifs(modifs, {
            alpha: function (a) {
                alpha = coerce.toInterval(0, 1, a, alpha);
            },
            autorotate: function (a) {
                cc.setAutorotate(/** @type {boolean} */ (coerce.toBool(a, false)));
            },
            background: function (a) {
                bg = coerce.toColor(a, bg);
            },
            clip: function (a) {
                cc.setClipping(/** @type {boolean} */ (coerce.toBool(a, false)));
            },
            ortho: function (a) {
                cc.setOrtho(/** @type {boolean} */ (coerce.toBool(a, false)));
            },
            transparency: function (a) {
                cc.setTransparency(/** @type {boolean} */ (coerce.toBool(a, false)));
            },
            view: function (a) {
                let view = coerce.toString(a);
                switch (view) {
                    case "Back":
                        cc.rotateBack();
                        break;
                    case "Bottom":
                        cc.rotateBottom();
                        break;
                    case "Default":
                        cc.rotateDefault();
                        break;
                    case "Front":
                        cc.rotateFront();
                        break;
                    case "Left":
                        cc.rotateLeft();
                        break;
                    case "Right":
                        cc.rotateRight();
                        break;
                    case "Top":
                        cc.rotateTop();
                        break;
                }
            },
            zoom: function (a) {
                cc.setZoom(coerce.toReal(a, 1));
            },
        });
        cc.setBackground(bg[0], bg[1], bg[2], alpha);
        return nada;
    }

    defOp("ComplexCurves", 1, ComplexCurves$1);

    defOp("ComplexCurves", 2, function (args, modifs) {
        let canvasId =
            /** @type {string} */
            (coerce.toString(args[0], "CSCanvas"));
        let canvas =
            /** @type {HTMLCanvasElement} */
            (document.getElementById(canvasId));
        let equationOrFile =
            /** @type {string} */
            (coerce.toString(args[1], "y^2-x"));
        let depth = 12;
        if (modifs["depth"] !== undefined) depth = coerce.toInt(evaluate(modifs["depth"]), 12);
        delete modifs["depth"];
        if (instances[canvasId] && instances[canvasId].unregisterEventHandlers)
            instances[canvasId].unregisterEventHandlers();
        if (equationOrFile.substr(-4, 4) === ".bin") {
            let cc = ComplexCurves.fromFile(canvas, equationOrFile, "", undefined, undefined, undefined, function () {
                instances[canvasId] = cc;
                ComplexCurves$1([args[0]], modifs);
            });
        } else {
            let cc = ComplexCurves.fromEquation(canvas, equationOrFile, depth);
            if (!!cc) {
                instances[canvasId] = cc;
                ComplexCurves$1([args[0]], modifs);
            }
        }
        return nada;
    });
});
