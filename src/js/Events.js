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
        if (el.pinned || el.visible === false || el.tmp === true)
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
        scheduleUpdate();
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
        manage("mousedown");
        mouse.down = true;
        e.preventDefault();
    });

    addAutoCleaningEventListener(canvas, "mouseup", function(e) {
        mouse.down = false;
        cindy_cancelmove();
        stateContinueFromHere();
        cs_mouseup();
        manage("mouseup");
        scheduleUpdate();
        e.preventDefault();
    });

    addAutoCleaningEventListener(canvas, "mousemove", function(e) {
        updatePostition(e);
        if (mouse.down) {
            cs_mousedrag();
        } else {
            cs_mousemove();
        }
        manage("mousemove");
        e.preventDefault();
    });

    addAutoCleaningEventListener(canvas, "click", function(e) {
        updatePostition(e);
        cs_mouseclick();
        e.preventDefault();
    });

    addAutoCleaningEventListener(canvas, "dragenter", function(e) {
        e.preventDefault();
    });

    addAutoCleaningEventListener(canvas, "dragover", function(e) {
        e.preventDefault();
    });

    addAutoCleaningEventListener(canvas, "drop", function(e) {
        e.preventDefault();

        // get data
        var dt = e.dataTransfer;
        var files = dt.files;
        var dropped = Array(files.length);
        var countDown = files.length;
        // drop position
        var rect = e.currentTarget.getBoundingClientRect();
        var x = e.clientX - rect.left - canvas.clientLeft + 0.5;
        var y = e.clientY - rect.top - canvas.clientTop + 0.5;
        var pos = List.realVector(csport.to(x, y));

        Array.prototype.forEach.call(files, function(file, i) {
            var reader = new FileReader();
            if ((/^text\//).test(file.type)) {
                reader.onload = function() {
                    var value = General.string(reader.result);
                    oneDone(i, value);
                };
                reader.readAsText(file);
            } else if ((/^image\//).test(file.type)) {
                reader.onload = function() {
                    var img = new Image();
                    img.onload = function() {
                        oneDone(i, loadImage(img));
                    };
                    img.src = reader.result;
                };
                reader.readAsDataURL(file);
            } else {
                oneDone(i, nada);
            }
        });

        function oneDone(i, value, type) {
            dropped[i] = List.turnIntoCSList([
                value,
                General.string(type || value.ctype),
                General.string(files[i].type),
                General.string(files[i].name),
            ]);
            if (--countDown === 0) {
                cs_onDrop(dropped, pos);
            }
        }
    });


    function touchMove(e) {
        updatePostition(e.targetTouches[0]);
        if (mouse.down) {
            cs_mousedrag();
        } else {
            cs_mousemove();
        }

        manage("mousemove");

        e.preventDefault();
    }

    function touchDown(e) {
        updatePostition(e.targetTouches[0]);
        cs_mousedown();
        mouse.down = true;
        //move = getmover(mouse);
        manage("mousedown");
        e.preventDefault();
    }

    function touchUp(e) {
        mouse.down = false;
        cindy_cancelmove();
        stateContinueFromHere();
        cs_mouseup();
        manage("mouseup");
        scheduleUpdate();
        e.preventDefault();
    }

    addAutoCleaningEventListener(canvas, "touchstart", touchDown, false);
    addAutoCleaningEventListener(canvas, "touchmove", touchMove, true);
    addAutoCleaningEventListener(canvas, "touchend", touchUp, false);
    if (typeof document !== "undefined" && document.body) {
        addAutoCleaningEventListener(document.body, "touchcancel", touchUp, false);
        // addAutoCleaningEventListener(document.body, "mouseup", mouseUp, false);
    }

    if (typeof window !== "undefined") {
        addAutoCleaningEventListener(window, "resize", function() {
            requestAnimFrame(function() {
                updateCanvasDimensions();
                scheduleUpdate();
            });
        }, false);
    }

    scheduleUpdate();
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
            window.setTimeout(callback, 0);
        };
}

var requestedAnimFrame = null;

function scheduleUpdate() {
    if (!requestedAnimFrame) {
        requestedAnimFrame = requestAnimFrame(doit);
    }
}

function doit() {
    requestedAnimFrame = null; // so we can schedule a new one
    if (isShutDown) return;
    if (csanimating) {
        cs_tick();
    }
    updateCindy();
    if (csanimating) {
        scheduleUpdate();
    }
}

function updateCindy() {
    csport.reset();
    csctx.save();
    csctx.clearRect(0, 0, csw, csh);
    var m = csport.drawingstate.matrix;
    var d, a, b, i, p;
    // due to the csport.reset(), m is initial, i.e. a = d and b = c = 0
    if (csgridsize !== 0) { // Square grid
        csctx.beginPath();
        csctx.strokeStyle = "rgba(0,0,0,0.1)";
        csctx.lineWidth = 1;
        csctx.lineCap = "butt";
        d = csgridsize * m.a;
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
    if (cstgrid !== 0) { // Triangular grid
        csctx.beginPath();
        csctx.strokeStyle = "rgba(0,0,0,0.1)";
        csctx.lineWidth = 1;
        csctx.lineCap = "butt";
        d = cstgrid * m.a;
        var sqrt3 = Math.sqrt(3);
        a = m.ty / sqrt3;
        b = (csh + m.ty) / sqrt3;
        // down slope first
        i = Math.ceil(-(m.tx + b) / d);
        while ((p = i * d + m.tx) + a < csw) {
            csctx.moveTo(p + a, 0);
            csctx.lineTo(p + b, csh);
            i++;
        }
        // up slope second
        i = Math.ceil(-(m.tx - a) / d);
        while ((p = i * d + m.tx) - b < csw) {
            csctx.moveTo(p - a, 0);
            csctx.lineTo(p - b, csh);
            i++;
        }
        // horizontal last
        d *= 0.5 * sqrt3;
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

function cs_keypressed(e) {
    var evtobj = window.event ? event : e;
    var unicode = evtobj.charCode ? evtobj.charCode : evtobj.keyCode;
    var actualkey = String.fromCharCode(unicode);
    cskey = actualkey;
    cskeycode = unicode;
    evaluate(cscompiled.keydown);
    scheduleUpdate();
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

function cs_mouseclick(e) {
    evaluate(cscompiled.mouseclick);
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

function cs_onDrop(lst, pos) {
    dropped = List.turnIntoCSList(lst);
    dropPoint = pos;
    evaluate(cscompiled.ondrop);
    dropped = nada;
    dropPoint = nada;
    scheduleUpdate();
}

function cindy_cancelmove() {
    move = undefined;
}
