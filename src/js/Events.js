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

        var dx, dy, dist, p;
        var sc = csport.drawingstate.matrix.sdet;
        if (el.kind === "P") {
            p = List.normalizeZ(el.homog);
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
            dist = dist + 25 / sc;
        } else if (el.kind === "Text") {
            if (!el._bbox) continue;
            p = csport.from(mouse.x, mouse.y, 1);
            dx = Math.max(0, p[0] - el._bbox.right, el._bbox.left - p[0]);
            dy = Math.max(0, p[1] - el._bbox.bottom, el._bbox.top - p[1]);
            dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 20)
                continue;
            dist = dist / sc;
            p = List.normalizeZ(el.homog);
            if (!List._helper.isAlmostReal(p))
                continue;
            dx = p.value[0].value.real - mouse.x;
            dy = p.value[1].value.real - mouse.y;
        } else {
            continue;
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
            cs_keydown(e);
            return false;
        });
        addAutoCleaningEventListener(document, "keyup", function(e) {
            cs_keyup(e);
            return false;
        });
        addAutoCleaningEventListener(document, "keypress", function(e) {
            cs_keytyped(e);
            return false;
        });
    } else if (cscompiled.keydown || cscompiled.keyup || cscompiled.keytyped) {
        canvas.setAttribute("tabindex", "0");
        addAutoCleaningEventListener(canvas, "mousedown", function() {
            canvas.focus();
        });
        addAutoCleaningEventListener(canvas, "keydown", function(e) {
            if (e.keyCode === 9 /* tab */ ) return;
            cs_keydown(e);
            if (!cscompiled.keytyped) {
                // this must bubble in order to trigger a keypress event
                e.preventDefault();
            }
        });
        addAutoCleaningEventListener(canvas, "keyup", function(e) {
            cs_keyup(e);
            e.preventDefault();
        });
        addAutoCleaningEventListener(canvas, "keypress", function(e) {
            if (e.keyCode === 9 /* tab */ ) return;
            cs_keytyped(e);
            e.preventDefault();
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

        if (files.length > 0) {
            Array.prototype.forEach.call(files, function(file, i) {
                var reader = new FileReader();
                if (textType(file.type)) {
                    reader.onload = function() {
                        textDone(i, reader.result);
                    };
                    reader.readAsText(file);
                } else if ((/^image\//).test(file.type)) {
                    reader.onload = function() {
                        imgDone(reader.result);
                    };
                    reader.readAsDataURL(file);
                } else {
                    console.log("Unknown MIME type: " + file.type);
                    oneDone(i, nada);
                }
            });
        } else {
            var data = dt.getData("text/uri-list");
            if (data) {
                data = data.split("\n").filter(function(line) {
                    return !/^\s*(#|$)/.test(line);
                });
                countDown = data.length;
                dropped = Array(countDown);
                files = Array(countDown);
                data.forEach(dropUri);
            }
        }

        function dropUri(uri, i) {
            var name = uri.replace(/[?#][^]*/, "");
            name = name.replace(/[^]*\/([^\/])/, "$1");
            files[i] = {
                type: "",
                name: name
            };
            var req = new XMLHttpRequest();
            req.onreadystatechange = haveHead;
            req.open("HEAD", uri);
            req.send();

            function haveHead() {
                if (req.readyState !== XMLHttpRequest.DONE)
                    return;
                if (req.status !== 200) {
                    console.error("HEAD request for " + uri + " failed: " +
                        (req.responseText || "(no error message)"));
                    oneDone(i, nada);
                    return;
                }
                var type = req.getResponseHeader("Content-Type");
                files[i].type = type;
                if ((/^image\//).test(type)) {
                    imgDone(i, uri);
                } else if (textType(type)) {
                    req = new XMLHttpRequest();
                    req.onreadystatechange = haveText;
                    req.open("GET", uri);
                    req.send();
                } else {
                    oneDone(i, nada);
                }
            }

            function haveText() {
                if (req.readyState !== XMLHttpRequest.DONE)
                    return;
                if (req.status !== 200) {
                    console.error("GET request for " + uri + " failed: " +
                        (req.responseText || "(no error message)"));
                    oneDone(i, nada);
                    return;
                }
                textDone(i, req.responseText);
            }

        }

        function textType(type) {
            type = type.replace(/;[^]*/, "");
            if ((/^text\//).test(type)) return 1;
            if (type === "application/json") return 2;
            return 0;
        }

        function textDone(i, text) {
            switch (textType(files[i].type)) {
                case 1:
                    oneDone(i, General.string(text));
                    break;
                case 2:
                    var data, value;
                    try {
                        data = JSON.parse(text);
                        value = General.wrapJSON(data);
                    } catch (err) {
                        console.error(err);
                        value = nada;
                    }
                    oneDone(i, value);
                    break;
                default:
                    oneDone(i, nada);
                    break;
            }
        }

        function imgDone(i, src) {
            var img = new Image();
            var reported = false;
            img.onload = function() {
                if (reported) return;
                reported = true;
                oneDone(i, loadImage(img));
            };
            img.onerror = function(err) {
                if (reported) return;
                reported = true;
                console.error(err);
                oneDone(i, nada);
            };
            img.src = src;
        }

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

        var activeTouchIDList = e.changedTouches;
        var gotit = false;
        for (var i = 0; i < activeTouchIDList.length; i++) {
            if (activeTouchIDList[i].identifier === activeTouchID) {
                gotit = true;
            }
        }
        if (!gotit) {
            return;
        }

        updatePostition(e.targetTouches[0]);
        if (mouse.down) {
            cs_mousedrag();
        } else {
            cs_mousemove();
        }

        manage("mousemove");

        e.preventDefault();
    }
    var activeTouchID = -1;

    function touchDown(e) {
        if (activeTouchID !== -1) {
            return;
        }

        var activeTouchIDList = e.changedTouches;
        if (activeTouchIDList.length === 0) {
            return;
        }
        activeTouchID = activeTouchIDList[0].identifier;

        updatePostition(e.targetTouches[0]);
        cs_mousedown();
        mouse.down = true;
        //move = getmover(mouse);
        manage("mousedown");
        e.preventDefault();
    }

    function touchUp(e) {
        var activeTouchIDList = e.changedTouches;
        var gotit = false;
        for (var i = 0; i < activeTouchIDList.length; i++) {
            if (activeTouchIDList[i].identifier === activeTouchID) {
                gotit = true;
            }
        }

        if (!gotit) {
            return;
        }
        activeTouchID = -1;
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
    resizeSensor(canvas.parentNode);

    scheduleUpdate();
}

function mkdiv(parent, style) {
    var div = document.createElement("div");
    div.setAttribute("style", style);
    parent.appendChild(div);
    return div;
}

// Inspired by
// github.com/marcj/css-element-queries/blob/bfa9a7f/src/ResizeSensor.js
// written by Marc J. Schmidt and others, licensed under the MIT license.
function resizeSensor(element) {
    if (typeof document === "undefined") return;
    var styleChild = "position: absolute; transition: 0s; left: 0; top: 0;";
    var style = styleChild + " right: 0; bottom: 0; overflow: hidden;" +
        " z-index: -1; visibility: hidden;";
    var expand = mkdiv(element, style);
    var expandChild = mkdiv(
        expand, styleChild + " width: 100000px; height: 100000px");
    var shrink = mkdiv(element, style);
    mkdiv(shrink, styleChild + " width: 200%; height: 200%");

    function reset() {
        expand.scrollLeft = expand.scrollTop =
            shrink.scrollLeft = shrink.scrollTop = 100000;
    }

    reset();
    var w = element.clientWidth;
    var h = element.clientHeight;
    var scheduled = false;

    function onScroll() {
        if (w !== element.clientWidth || h !== element.clientHeight) {
            w = element.clientWidth;
            h = element.clientHeight;
            if (!scheduled) {
                scheduled = true;
                requestAnimFrame(function() {
                    scheduled = false;
                    updateCanvasDimensions();
                    scheduleUpdate();
                });
            }
        }
        reset();
    }

    expand.addEventListener("scroll", onScroll);
    shrink.addEventListener("scroll", onScroll);
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

function keyEvent(e, script) {
    var evtobj = window.event ? event : e;
    var unicode = evtobj.charCode ? evtobj.charCode : evtobj.keyCode;
    var actualkey = String.fromCharCode(unicode);
    cskey = actualkey;
    cskeycode = unicode;
    evaluate(script);
    scheduleUpdate();
}

function cs_keydown(e) {
    keyEvent(e, cscompiled.keydown);
}

function cs_keyup(e) {
    keyEvent(e, cscompiled.keyup);
}

function cs_keytyped(e) {
    keyEvent(e, cscompiled.keytyped);
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
    var now = Date.now();
    var delta = Math.min(simcap, now - simtick) * simspeed * simfactor;
    simtick = now;
    var time = simtime + delta;
    if (csPhysicsInited && typeof(lab) !== 'undefined') {
        lab.tick(delta);
    }
    simtime = time;
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
