function render() {

    function drawgeopoint(el) {
        if (!el.isshowing || el.visible === false || !List._helper.isAlmostReal(el.homog))
            return;
        var col = el.color;
        if (el.behavior) {
            col = el.color; //TODO Anpassen
            // col=List.realVector([0,0,1]);
        }
        evaluator.draw$1([el.homog], {
            size: el.size,
            color: col,
            alpha: el.alpha
        });
        if (el.labeled) {
            var lbl = el.printname || el.name || "P";
            var lpos = el.labelpos || {
                'x': 3,
                'y': 3
            };
            var textsize = el.textsize || 12;
            var bold = (el.textbold === true);
            var italics = (el.textitalics === true);
            var family = el.text_fontfamily || "Sans Serif";
            var dist = lpos.x * lpos.x + lpos.y * lpos.y;
            var factor = 1.0;
            if (dist > 0) {
                factor = 1.0 + el.size.value.real / Math.sqrt(dist);
            }
            evaluator.drawtext$2(
                [el.homog, General.wrap(lbl)], {
                    'x_offset': General.wrap(factor * lpos.x),
                    'y_offset': General.wrap(factor * lpos.y),
                    'size': General.wrap(textsize),
                    'bold': General.wrap(bold),
                    'italics': General.wrap(italics),
                    'family': General.wrap(family)
                });
        }
    }

    function drawgeoarc(el) {
        if (!el.isshowing || el.visible === false)
            return;

        var modifs = {};
        modifs.color = el.color;
        modifs.alpha = el.alpha;
        modifs.size = el.size;

        // check if we have filled: true
        var df = el.filled ? "F" : "D";

        var newargs = [csgeo.csnames[el.args[0]].homog,
            csgeo.csnames[el.args[1]].homog,
            csgeo.csnames[el.args[2]].homog
        ];
        eval_helper.drawarc(newargs, modifs, df);
    }


    function drawgeoconic(el) {
        if (!el.isshowing || el.visible === false)
            return;

        var modifs = {};
        modifs.color = el.color;
        modifs.alpha = el.alpha;
        modifs.size = el.size;

        var args = el;
        eval_helper.drawconic(args, modifs);


    }

    function drawgeoline(el) {
        var pt1, pt2;
        if (!el.isshowing || el.visible === false || !List._helper.isAlmostReal(el.homog))
            return;

        if (el.clip.value === "none") {
            evaluator.draw$1([el.homog], {
                size: el.size,
                color: el.color,
                alpha: el.alpha
            });
        } else if (el.clip.value === "end") {
            evaluator.draw$2(
                [el.startpos, el.endpos], {
                    size: el.size,
                    color: el.color,
                    alpha: el.alpha
                });
        } else if (el.clip.value === "inci") {
            var li = [];
            var xmin = [+1000000, 0];
            var xmax = [-1000000, 0];
            var ymin = [+1000000, 0];
            var ymax = [-1000000, 0];
            for (var i = 0; i < el.incidences.length; i++) {
                var pt = csgeo.csnames[el.incidences[i]].homog;
                var x = pt.value[0];
                var y = pt.value[1];
                var z = pt.value[2];

                if (!CSNumber._helper.isAlmostZero(z)) {
                    x = CSNumber.div(x, z);
                    y = CSNumber.div(y, z);
                    if (CSNumber._helper.isAlmostReal(x) && CSNumber._helper.isAlmostReal(y)) {
                        if (x.value.real < xmin[0]) {
                            xmin = [x.value.real, pt];
                        }
                        if (x.value.real > xmax[0]) {
                            xmax = [x.value.real, pt];
                        }
                        if (y.value.real < ymin[0]) {
                            ymin = [y.value.real, pt];
                        }
                        if (y.value.real > ymax[0]) {
                            ymax = [y.value.real, pt];
                        }
                    }
                }
            }
            if ((xmax[0] - xmin[0]) > (ymax[0] - ymin[0])) {
                pt1 = xmin[1];
                pt2 = xmax[1];
            } else {
                pt1 = ymin[1];
                pt2 = ymax[1];

            }
            if (pt1 !== pt2) {
                evaluator.draw$2(
                    [pt1, pt2], {
                        size: el.size,
                        color: el.color,
                        alpha: el.alpha,
                        overhang: el.overhang
                    });
            } else {
                evaluator.draw$1(
                    [el.homog], {
                        size: el.size,
                        color: el.color,
                        alpha: el.alpha
                    });
            }
        } else {
            console.error(["Bad clip: ", el.clip]);
        }

    }

    var i;

    for (i = 0; i < csgeo.conics.length; i++) {
        if (csgeo.conics[i].type === "ArcBy3") drawgeoarc(csgeo.conics[i]);
        else drawgeoconic(csgeo.conics[i]);
    }


    for (i = 0; i < csgeo.lines.length; i++) {
        drawgeoline(csgeo.lines[i]);
    }


    for (i = 0; i < csgeo.points.length; i++) {
        drawgeopoint(csgeo.points[i]);
    }

}

// TODO Lines, ...
// TODO tracedim
function draw_traces() {
    for (var i = 0; i < csgeo.points.length; i++) {
        var el = csgeo.points[i];

        if (el.trace) {
            if (el._traces_tick % el.traceskip === 0) {
                el._traces.push(el.homog);
            }

            el._traces_tick++;

            if (el._traces.length > el.tracelength) {
                el._traces.shift();
            }

            var antiDamp = 1.03;
            var elAlpha = el.alpha.value.real;
            var alpha = elAlpha * Math.pow(antiDamp, -el._traces.length);

            for (var j = 0; j < el._traces.length; j++) {
                evaluator.draw$1([el._traces[j]], {
                    size: el.size,
                    color: el.color,
                    alpha: CSNumber.real(alpha)
                });
                alpha *= antiDamp;
            }
        }
    }
}
