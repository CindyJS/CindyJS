var mouse = {};
var move;

var cskey = "";
var cskeycode = 0;


function getmover(mouse) {
    var mov = null;
    var adist = 1000000;
    var diff;
    for (var i = 0; i < csgeo.free.length; i++) {
        var el = csgeo.free[i];
        if (el.pinned || el.visible === false)
            continue;

        var dx, dy, dist;
        var sc = csport.drawingstate.matrix.sdet;
        if (el.kind === "P") {
            var p = List.normalizeZ(el.homog);
            if (!List._helper.isAlmostReal(p))
                continue;
            dx = p.value[0].value.real - mouse.x;
            dy = p.value[1].value.real - mouse.y;
            dist = Math.sqrt(dx * dx + dy * dy);
            if (el.narrow && dist > (typeof el.narrow === "number" ?
                    el.narrow : 20) / sc)
                continue;
        } else if (el.kind === "C") { //Must be CircleMr
            var mid = csgeo.csnames[el.args[0]];
            var rad = el.radius;
            var xx = CSNumber.div(mid.homog.value[0], mid.homog.value[2]).value.real;
            var yy = CSNumber.div(mid.homog.value[1], mid.homog.value[2]).value.real;
            dx = xx - mouse.x;
            dy = yy - mouse.y;
            var ref = Math.sqrt(dx * dx + dy * dy);
            dist = ref - rad.value.real;
            dx = 0;
            dy = 0;
            if (dist < 0) {
                dist = -dist;
            }
            dist = dist + 30 / sc;

        } else if (el.kind === "L") { //Must be ThroughPoint(Horizontal/Vertical not treated yet)
            var l = el.homog;
            var N = CSNumber;
            var nn = N.add(N.mult(l.value[0], N.conjugate(l.value[0])),
                N.mult(l.value[1], N.conjugate(l.value[1])));
            var ln = List.scaldiv(N.sqrt(nn), l);
            dist = ln.value[0].value.real * mouse.x + ln.value[1].value.real * mouse.y + ln.value[2].value.real;
            dx = -ln.value[0].value.real * dist;
            dy = -ln.value[1].value.real * dist;

            if (dist < 0) {
                dist = -dist;
            }
            dist = dist + 1;
        }

        if (dist < adist + 0.2 / sc) { //A bit a dirty hack, prefers new points
            adist = dist;
            mov = el;
            diff = {
                x: dx,
                y: dy
            };
        }
    }
    console.log("Moving " + (mov ? mov.name : "nothing"));
    if (mov === null)
        return null;
    return {
        mover: mov,
        offset: diff,
        prev: {
            x: mouse.x,
            y: mouse.y
        }
    };
}

function addAutoCleaningEventListener(target, type, listener, useCapture) {
    if (useCapture === undefined)
        useCapture = false;
    shutdownHooks.push(function() {
        target.removeEventListener(type, listener, useCapture);
    });
    target.addEventListener(type, listener, useCapture);
}

function setuplisteners(canvas, data) {

    var MO = null;
    if (typeof MutationObserver !== "undefined")
        MO = MutationObserver;
    if (!MO && typeof WebKitMutationObserver !== "undefined")
        MO = WebKitMutationObserver; // jshint ignore: line
    if (MO) {
        MO = new MO(function(mutations) {
            // Browsers which support MutationObserver likely support contains
            if (!document.body.contains(canvas))
                shutdown();
        });
        MO.observe(document.documentElement, {
            "childList": true,
            "subtree": true
        });
        shutdownHooks.push(function() {
            MO.disconnect();
        });
    } else {
        addAutoCleaningEventListener(canvas, "DOMNodeRemovedFromDocument", shutdown);
        addAutoCleaningEventListener(canvas, "DOMNodeRemoved", shutdown);
    }

    function updatePostition(event) {
        var rect = canvas.getBoundingClientRect();
        var x = event.clientX - rect.left - canvas.clientLeft + 0.5;
        var y = event.clientY - rect.top - canvas.clientTop + 0.5;
        var pos = csport.to(x, y);
        mouse.prevx = mouse.x;
        mouse.prevy = mouse.y;
        mouse.x = pos[0];
        mouse.y = pos[1];
        csmouse[0] = mouse.x;
        csmouse[1] = mouse.y;
        mouse.moved = true;
    }

    if (data.keylistener === true) {
        addAutoCleaningEventListener(document, "keydown", function(e) {
            cs_keypressed(e);
            return false;
        });
    } else if (cscompiled.keydown) {
        canvas.setAttribute("tabindex", "0");
        addAutoCleaningEventListener(canvas, "mousedown", function() {
            canvas.focus();
        });
        addAutoCleaningEventListener(canvas, "keydown", function(e) {
            // console.log("Got key " + e.charCode + " / " + e.keyCode);
            if (e.keyCode !== 9 /* tab */ ) {
                cs_keypressed(e);
                e.preventDefault();
            }
        });
    }

    addAutoCleaningEventListener(canvas, "mousedown", function(e) {
        mouse.button = e.which;
        updatePostition(e);
        cs_mousedown();
        move = getmover(mouse);
        startit(); //starts d3-timer

        mouse.down = true;
        e.preventDefault();
    });

    addAutoCleaningEventListener(canvas, "mouseup", function(e) {
        mouse.down = false;
        cindy_cancelmove();
        stateContinueFromHere();
        cs_mouseup();
        updateCindy();
        e.preventDefault();
    });

    addAutoCleaningEventListener(canvas, "mousemove", function(e) {
        updatePostition(e);
        if (mouse.down) {
            cs_mousedrag();
        } else {
            cs_mousemove();
        }
        e.preventDefault();
    });


    function touchMove(e) {
        updatePostition(e.targetTouches[0]);
        if (mouse.down) {
            cs_mousedrag();
        } else {
            cs_mousemove();
        }
        e.preventDefault();
    }

    function touchDown(e) {
        updatePostition(e.targetTouches[0]);
        cs_mousedown();
        mouse.down = true;
        move = getmover(mouse);
        startit();
        e.preventDefault();
    }

    function touchUp(e) {
        mouse.down = false;
        cindy_cancelmove();
        stateContinueFromHere();
        updateCindy();
        cs_mouseup();
        e.preventDefault();
    }

    addAutoCleaningEventListener(canvas, "touchstart", touchDown, false);
    addAutoCleaningEventListener(canvas, "touchmove", touchMove, true);
    addAutoCleaningEventListener(canvas, "touchend", touchUp, false);
    if (typeof document !== "undefined" && document.body) {
        addAutoCleaningEventListener(document.body, "touchcancel", touchUp, false);
        // addAutoCleaningEventListener(document.body, "mouseup", mouseUp, false);
    }

    updateCindy();
}


var requestAnimFrame;
if (instanceInvocationArguments.isNode) {
    requestAnimFrame = process.nextTick; // jshint ignore:line
} else {
    requestAnimFrame =
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(callback) {
            //                window.setTimeout(callback, 1000 / 60);
            window.setTimeout(callback, 0);
        };
}

function doit() { //Callback for d3-timer
    if (isShutDown) return true;
    if (csanimating) {
        cs_tick();
    }
    if (csanimating || mouse.moved) {
        mouse.moved = false;
        updateCindy();
    }
    csticking = csanimating || mouse.down;
    return !csticking;
}

function startit() {
    if (!csticking) {
        csticking = true;
        d3.timer(doit);
    }
}

function updateCindy() {
    csport.reset();
    csctx.save();
    csctx.clearRect(0, 0, csw, csh);
    var m = csport.drawingstate.matrix;
    // due to the csport.reset(), m is initial, i.e. a = d and b = c = 0
    if (csgridsize !== 0) {
        csctx.beginPath();
        csctx.strokeStyle = "rgba(0,0,0,0.1)";
        csctx.lineWidth = 1;
        csctx.lineCap = "butt";
        var d = csgridsize * m.a;
        var i, p;
        i = Math.ceil(-m.tx / d);
        while ((p = i * d + m.tx) < csw) {
            if (i || !csaxes) {
                csctx.moveTo(p, 0);
                csctx.lineTo(p, csh);
            }
            i++;
        }
        i = Math.floor(m.ty / d);
        while ((p = i * d - m.ty) < csh) {
            if (i || !csaxes) {
                csctx.moveTo(0, p);
                csctx.lineTo(csw, p);
            }
            i++;
        }
        csctx.stroke();
    }
    if (csaxes) {
        csctx.beginPath();
        csctx.strokeStyle = "rgba(0,0,0,0.2)";
        csctx.lineWidth = 3;
        csctx.lineCap = "butt";
        csctx.lineJoin = "miter";
        csctx.miterLimit = 10;
        csctx.beginPath();
        csctx.moveTo(0, -m.ty);
        csctx.lineTo(csw - 6, -m.ty);
        csctx.moveTo(csw - 13, -5 - m.ty);
        csctx.lineTo(csw - 3, -m.ty);
        csctx.lineTo(csw - 13, 5 - m.ty);
        csctx.moveTo(m.tx, csh);
        csctx.lineTo(m.tx, 6);
        csctx.moveTo(m.tx - 5, 13);
        csctx.lineTo(m.tx, 3);
        csctx.lineTo(m.tx + 5, 13);
        csctx.stroke();
    }
    traceMouseAndScripts();
    //   console.log("NOW UPDATING");
    //  drawgrid();
    csport.greset();
    draw_traces();
    render();
    csctx.restore();
}

function update() {
    if (isShutDown) return;
    updateCindy();
    if (mouse.down)
        requestAnimFrame(update);
}


function cs_keypressed(e) {
    var evtobj = window.event ? event : e;
    var unicode = evtobj.charCode ? evtobj.charCode : evtobj.keyCode;
    var actualkey = String.fromCharCode(unicode);
    cskey = actualkey;
    cskeycode = unicode;


    evaluate(cscompiled.keydown);
    updateCindy();

}

function cs_mousedown(e) {
    evaluate(cscompiled.mousedown);

}

function cs_mouseup(e) {
    evaluate(cscompiled.mouseup);

}


function cs_mousedrag(e) {
    evaluate(cscompiled.mousedrag);

}


function cs_mousemove(e) {
    evaluate(cscompiled.mousemove);

}

function cs_tick(e) {
    if (csPhysicsInited) { //TODO: Check here if physics is required
        if (typeof(lab) !== 'undefined') {
            lab.tick();
        }
    }
    if (csanimating) {
        evaluate(cscompiled.tick);
    }

}

function cs_simulationstep(e) {
    evaluate(cscompiled.simulationstep);
}

function cs_simulationstart(e) {
    evaluate(cscompiled.simulationstart);
}

function cs_simulationstop(e) {
    evaluate(cscompiled.simulationstop);
}


function cindy_cancelmove() {
    move = undefined;
}
