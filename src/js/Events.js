import {
    csgeo,
    shutdownHooks,
    shutdown,
    csmouse,
    cscompiled,
    loadImage,
    updateCanvasDimensions,
    isShutDown,
    csanimating,
    csctx,
    csw,
    csh,
    csgridsize,
    csaxes,
    cstgrid,
    simcap,
    simtick,
    simspeed,
    simfactor,
    simtime,
    setSimTime,
    setDropped,
    setDropPoint,
} from "Setup";
import { document, nada, window, instanceInvocationArguments } from "expose";
import { CSNumber } from "libcs/CSNumber";
import { List } from "libcs/List";
import { General } from "libcs/General";
import { evaluate } from "libcs/Evaluator";
import { manage } from "libcs/Tools";
import { csport } from "libgeo/GeoState";
import { draw_traces, render } from "libgeo/GeoRender";
import { traceMouseAndScripts } from "libgeo/Tracing";
import { csPhysicsInited, lab } from "liblab/LabBasics";

const mouse = {};
let move;

function setMove(mv) {
    move = mv;
}

let cskey = "";
let cskeycode = 0;

let multiid = 0;
const multipos = {};
const multiiddict = {};

function getmover(mouse) {
    let mov = null;
    let adist = 1000000;
    let diff;

    for (const el of csgeo.free) {
        if (el.pinned || el.visible === false || el.tmp === true) continue;

        let dx, dy, dist, p;
        const sc = csport.drawingstate.matrix.sdet;
        if (el.kind === "P") {
            p = List.normalizeZ(el.homog);
            if (!List._helper.isAlmostReal(p)) continue;
            dx = p.value[0].value.real - mouse.x;
            dy = p.value[1].value.real - mouse.y;
            dist = Math.sqrt(dx * dx + dy * dy);
            if (el.narrow && dist > (typeof el.narrow === "number" ? el.narrow : 20) / sc) continue;
        } else if (el.kind === "C") {
            //Must be CircleMr
            const normalizedmid = List.normalizeZ(csgeo.csnames[el.args[0]].homog);
            const rad = el.radius;

            if (!List._helper.isAlmostReal(normalizedmid) || !CSNumber._helper.isAlmostReal(rad)) continue;

            const midx = normalizedmid.value[0].value.real; //center of circle
            const midy = normalizedmid.value[1].value.real;

            const vx = mouse.x - midx; //vector from center to mouse
            const vy = mouse.y - midy;

            const vlength = Math.sqrt(vx * vx + vy * vy);
            if (vlength === 0) continue;

            const refx = midx + (vx / vlength) * rad.value.real; //reference point: the to mouse projected on the circle
            const refy = midy + (vy / vlength) * rad.value.real;

            dx = refx - mouse.x; //vector from mouse to reference point
            dy = refy - mouse.y;

            dist = Math.sqrt(dx * dx + dy * dy);

            dist = dist + 30 / sc;

            if (el.narrow && dist > ((typeof el.narrow === "number" ? el.narrow : 20) + 30) / sc) continue;
        } else if (el.kind === "L") {
            //Must be ThroughPoint(Horizontal/Vertical not treated yet)
            const l = el.homog;
            const N = CSNumber;
            const nn = N.add(N.mult(l.value[0], N.conjugate(l.value[0])), N.mult(l.value[1], N.conjugate(l.value[1])));
            const ln = List.scaldiv(N.sqrt(nn), l);
            dist = ln.value[0].value.real * mouse.x + ln.value[1].value.real * mouse.y + ln.value[2].value.real;
            dx = -ln.value[0].value.real * dist;
            dy = -ln.value[1].value.real * dist;

            if (dist < 0) {
                dist = -dist;
            }
            dist = dist + 25 / sc;
        } else if (el.kind === "Text") {
            if (!el.homog || el.dock || !el._bbox) continue;
            p = csport.from(mouse.x, mouse.y, 1);
            dx = Math.max(0, p[0] - el._bbox.right, el._bbox.left - p[0]);
            dy = Math.max(0, p[1] - el._bbox.bottom, el._bbox.top - p[1]);
            dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 20) continue;
            dist = dist / sc;
            p = List.normalizeZ(el.homog);
            if (!List._helper.isAlmostReal(p)) continue;
            dx = p.value[0].value.real - mouse.x;
            dy = p.value[1].value.real - mouse.y;
        } else {
            continue;
        }

        if (dist < adist + 0.2 / sc) {
            //A bit a dirty hack, prefers new points
            adist = dist;
            mov = el;
            diff = {
                x: dx,
                y: dy,
            };
        }
    }

    //console.log("Moving " + (mov ? mov.name : "nothing"));
    if (mov === null) return null;
    return {
        mover: mov,
        offset: diff,
        prev: {
            x: mouse.x,
            y: mouse.y,
        },
    };
}

function addAutoCleaningEventListener(target, type, listener, useCapture) {
    if (useCapture === undefined) useCapture = false;
    shutdownHooks.push(function () {
        target.removeEventListener(type, listener, useCapture);
    });
    target.addEventListener(type, listener, useCapture);
}

function setuplisteners(canvas, data) {
    let MO = null;
    let mousedownevent = null;
    let hasmoved = false;
    if (typeof MutationObserver !== "undefined") MO = MutationObserver;
    if (!MO && typeof WebKitMutationObserver !== "undefined") MO = WebKitMutationObserver;
    if (MO) {
        MO = new MO(function (mutations) {
            // Browsers which support MutationObserver likely support contains
            if (!document.body.contains(canvas)) shutdown();
        });
        MO.observe(document.documentElement, {
            childList: true,
            subtree: true,
        });
        shutdownHooks.push(function () {
            MO.disconnect();
        });
    } else {
        addAutoCleaningEventListener(canvas, "DOMNodeRemovedFromDocument", shutdown);
        addAutoCleaningEventListener(canvas, "DOMNodeRemoved", shutdown);
    }

    function updateMultiPositions(event, initialize) {
        for (let touch of event.changedTouches) {
            let id = getmultiid(touch.identifier);
            if (!initialize && !multipos[id]) continue;
            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left - canvas.clientLeft + 0.5;
            const y = touch.clientY - rect.top - canvas.clientTop + 0.5;
            const pos = csport.to(x, y);
            multipos[id] = [pos[0], pos[1]];
        }

        scheduleUpdate();
    }

    function updatePosition(event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left - canvas.clientLeft + 0.5;
        const y = event.clientY - rect.top - canvas.clientTop + 0.5;
        const pos = csport.to(x, y);
        mouse.prevx = mouse.x;
        mouse.prevy = mouse.y;
        mouse.x = pos[0];
        mouse.y = pos[1];
        csmouse[0] = mouse.x;
        csmouse[1] = mouse.y;
        scheduleUpdate();
    }

    if (data.keylistener === true) {
        addAutoCleaningEventListener(document, "keydown", function (e) {
            cs_keydown(e);
            return false;
        });
        addAutoCleaningEventListener(document, "keyup", function (e) {
            cs_keyup(e);
            return false;
        });
        addAutoCleaningEventListener(document, "keypress", function (e) {
            cs_keytyped(e);
            return false;
        });
    } else if (cscompiled.keydown || cscompiled.keyup || cscompiled.keytyped) {
        canvas.setAttribute("tabindex", "0");
        addAutoCleaningEventListener(canvas, "pointerdown", function () {
            canvas.focus();
        });
        addAutoCleaningEventListener(canvas, "keydown", function (e) {
            if (e.keyCode === 9 /* tab */) return;
            cs_keydown(e);
            if (!cscompiled.keytyped) {
                // this must bubble in order to trigger a keypress event
                e.preventDefault();
            }
        });
        addAutoCleaningEventListener(canvas, "keyup", function (e) {
            cs_keyup(e);
            e.preventDefault();
        });
        addAutoCleaningEventListener(canvas, "keypress", function (e) {
            if (e.keyCode === 9 /* tab */) return;
            cs_keytyped(e);
            e.preventDefault();
        });
    }

    addAutoCleaningEventListener(canvas, "pointerdown", function (e) {
        if (e.pointerType != "touch") {
            mousedownevent = e;
            hasmoved = false;
            mouse.button = e.which;
            updatePosition(e);
            manage("mousedown");
            cs_multidown(0);
            cs_mousedown();
            mouse.down = true;
            e.preventDefault();
            canvas.setPointerCapture(e.pointerId);
        }
    });

    addAutoCleaningEventListener(canvas, "pointerup", function (e) {
        if (e.pointerType != "touch") {
            mouse.down = false;
            manage("mouseup");
            cs_mouseup();
            cs_multiup(0);
            cindy_cancelmove();
            delete multipos[0];
            scheduleUpdate();
            e.preventDefault();
            canvas.releasePointerCapture(e.pointerId);
        }
    });

    addAutoCleaningEventListener(canvas, "pointermove", function (e) {
        if (e.pointerType != "touch") {
            updatePosition(e);
            if (mouse.down) {
                // this might be also a touchdown
                if (
                    mousedownevent &&
                    (Math.abs(mousedownevent.clientX - e.clientX) > 2 ||
                        Math.abs(mousedownevent.clientY - e.clientY) > 2)
                )
                    hasmoved = true;
                cs_mousedrag();
                cs_multidrag(0);
            } else {
                cs_mousemove();
            }
            manage("mousemove");
            e.preventDefault();
        }
    });

    addAutoCleaningEventListener(canvas, "click", function (e) {
        updatePosition(e);
        if (!hasmoved) cs_mouseclick();
        e.preventDefault();
    });

    addAutoCleaningEventListener(canvas, "dragenter", function (e) {
        e.preventDefault();
    });

    addAutoCleaningEventListener(canvas, "dragover", function (e) {
        e.preventDefault();
    });

    addAutoCleaningEventListener(canvas, "drop", function (e) {
        e.preventDefault();

        // get data
        const dt = e.dataTransfer;
        let files = dt.files;
        let dropped = Array(files.length);
        let countDown = files.length;
        // drop position
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left - canvas.clientLeft + 0.5;
        const y = e.clientY - rect.top - canvas.clientTop + 0.5;
        const pos = List.realVector(csport.to(x, y));

        if (files.length > 0) {
            Array.prototype.forEach.call(files, function (file, i) {
                const reader = new FileReader();
                if (textType(file.type)) {
                    reader.onload = function () {
                        textDone(i, reader.result);
                    };
                    reader.readAsText(file);
                } else if (/^image\//.test(file.type)) {
                    reader.onload = function () {
                        imgDone(i, reader.result);
                    };
                    reader.readAsDataURL(file);
                } else {
                    console.log("Unknown MIME type: " + file.type);
                    oneDone(i, nada);
                }
            });
        } else {
            let data = dt.getData("text/uri-list");
            if (data) {
                data = data.split("\n").filter(function (line) {
                    return !/^\s*(#|$)/.test(line);
                });
                countDown = data.length;
                dropped = Array(countDown);
                files = Array(countDown);
                data.forEach(dropUri);
            }
        }

        function dropUri(uri, i) {
            let name = uri.replace(/[?#][^]*/, "");
            name = name.replace(/[^]*\/([^\/])/, "$1");
            files[i] = {
                type: "",
                name,
            };
            let req = new XMLHttpRequest();
            req.onreadystatechange = haveHead;
            req.open("HEAD", uri);
            req.send();

            function haveHead() {
                if (req.readyState !== XMLHttpRequest.DONE) return;
                if (req.status !== 200) {
                    console.error("HEAD request for " + uri + " failed: " + (req.responseText || "(no error message)"));
                    oneDone(i, nada);
                    return;
                }
                const type = req.getResponseHeader("Content-Type");
                files[i].type = type;
                if (/^image\//.test(type)) {
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
                if (req.readyState !== XMLHttpRequest.DONE) return;
                if (req.status !== 200) {
                    console.error("GET request for " + uri + " failed: " + (req.responseText || "(no error message)"));
                    oneDone(i, nada);
                    return;
                }
                textDone(i, req.responseText);
            }
        }

        function textType(type) {
            type = type.replace(/;[^]*/, "");
            if (/^text\//.test(type)) return 1;
            if (type === "application/json") return 2;
            return 0;
        }

        function textDone(i, text) {
            switch (textType(files[i].type)) {
                case 1:
                    oneDone(i, General.string(text));
                    break;
                case 2: {
                    let data, value;
                    try {
                        data = JSON.parse(text);
                        value = General.wrapJSON(data);
                    } catch (err) {
                        console.error(err);
                        value = nada;
                    }
                    oneDone(i, value);
                    break;
                }
                default:
                    oneDone(i, nada);
                    break;
            }
        }

        function imgDone(i, src) {
            const img = new Image();
            let reported = false;
            img.onload = function () {
                if (reported) return;
                reported = true;
                oneDone(
                    i,

                    loadImage(img, false)
                );
            };
            img.onerror = function (err) {
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

    function getmultiid(identifier) {
        if (multiiddict.hasOwnProperty(identifier)) return multiiddict[identifier];
        let used = Object.values(multiiddict);

        //find the smallest integer >= 1 that is not already used in O(n log n)
        used = used.sort((a, b) => a - b); //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
        let isset = false;
        for (let k in used) {
            if (!isset && used[k] > (k | 0) + 1) {
                //used differs from [1, 2, 3,...]
                multiiddict[identifier] = (k | 0) + 1;
                isset = true;
            }
        }
        if (!isset) multiiddict[identifier] = used.length + 1;
        return multiiddict[identifier];
    }

    function touchMove(e) {
        updateMultiPositions(e, false);
        for (let i = 0; i < e.changedTouches.length; i++) {
            multiid = getmultiid(e.changedTouches[i].identifier);
            cs_multidrag(multiid);
        }

        const activeTouchIDList = e.changedTouches;
        let gotit = false;
        for (var i = 0; i < activeTouchIDList.length; i++) {
            if (activeTouchIDList[i].identifier === activeTouchID) {
                gotit = true;
            }
        }
        if (!gotit) {
            return;
        }

        updatePosition(e.targetTouches[0]);
        if (mouse.down) {
            if (
                mousedownevent &&
                (Math.abs(mousedownevent.clientX - e.targetTouches[0].clientX) > 2 ||
                    Math.abs(mousedownevent.clientY - e.targetTouches[0].clientY) > 2)
            )
                hasmoved = true;
            multiid = getmultiid(activeTouchID);
            cs_mousedrag();
        } else {
            cs_mousemove();
        }

        manage("mousemove"); // this should be done before the cs_* calls, but we will fix this later, too
        e.preventDefault();
    }
    var activeTouchID = -1;

    function touchDown(e) {
        updateMultiPositions(e, true);
        for (let i = 0; i < e.changedTouches.length; i++) {
            cs_multidown(getmultiid(e.changedTouches[i].identifier));
        }

        if (activeTouchID !== -1) {
            return;
        }

        const activeTouchIDList = e.changedTouches;

        if (activeTouchIDList.length === 0) {
            return;
        }
        activeTouchID = activeTouchIDList[0].identifier;

        updatePosition(e.targetTouches[0]);
        mouse.down = true;
        mousedownevent = e.targetTouches[0];
        hasmoved = false;
        move = getmover(mouse); // should be handeled in manage(Move), I think, but actually is not
        manage("mousedown");
        cs_mousedown(); // only handle CindyScript after the built-in mode. Actually, CindyScript should only be handled in Move mode, but we leave this fix for later.
        e.preventDefault();
    }

    function touchUp(e) {
        const activeTouchIDList = e.changedTouches;
        updateMultiPositions(e, false);
        for (let i = 0; i < e.changedTouches.length; i++) {
            multiid = getmultiid(e.changedTouches[i].identifier);
            cs_multiup(multiid);
            delete multiiddict[e.changedTouches[i].identifier];
        }

        let gotit = false;
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
        manage("mouseup"); // do the mouseup-action of the current mode
        cs_mouseup(); // first do the script, then …
        cindy_cancelmove(); // … forget the mover
        if (!hasmoved) cs_mouseclick();
        scheduleUpdate();
        e.preventDefault();
    }

    // adding listeners for touch events
    addAutoCleaningEventListener(canvas, "touchstart", touchDown, false);
    addAutoCleaningEventListener(canvas, "touchmove", touchMove, true);
    addAutoCleaningEventListener(canvas, "touchend", touchUp, false);
    if (typeof document !== "undefined" && document.body) {
        addAutoCleaningEventListener(document.body, "touchcancel", touchUp, false);
        // addAutoCleaningEventListener(document.body, "mouseup", mouseUp, false);
    }

    if (typeof window !== "undefined") {
        addAutoCleaningEventListener(
            window,
            "resize",
            function () {
                requestAnimFrame(function () {
                    updateCanvasDimensions();
                    scheduleUpdate();
                });
            },
            false
        );
    }
    resizeSensor(canvas.parentNode);

    scheduleUpdate();
}

function mkdiv(parent, style) {
    const div = document.createElement("div");
    div.setAttribute("style", style);
    parent.appendChild(div);
    return div;
}

// Inspired by
// github.com/marcj/css-element-queries/blob/bfa9a7f/src/ResizeSensor.js
// written by Marc J. Schmidt and others, licensed under the MIT license.
function resizeSensor(element) {
    if (typeof document === "undefined") return;
    const styleChild = "position: absolute; transition: 0s; left: 0; top: 0;";
    const style = styleChild + " right: 0; bottom: 0; overflow: hidden;" + " z-index: -1; visibility: hidden;";
    const expand = mkdiv(element, style);
    const expandChild = mkdiv(expand, styleChild + " width: 100000px; height: 100000px");
    const shrink = mkdiv(element, style);
    mkdiv(shrink, styleChild + " width: 200%; height: 200%");

    function reset() {
        expand.scrollLeft = expand.scrollTop = shrink.scrollLeft = shrink.scrollTop = 100000;
    }

    reset();
    let w = element.clientWidth;
    let h = element.clientHeight;
    let scheduled = false;

    function onScroll() {
        if (w !== element.clientWidth || h !== element.clientHeight) {
            w = element.clientWidth;
            h = element.clientHeight;
            if (!scheduled) {
                scheduled = true;
                requestAnimFrame(function () {
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
    requestAnimFrame = process.nextTick;
} else {
    requestAnimFrame =
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 0);
        };
}

let requestedAnimFrame = null;

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
    const m = csport.drawingstate.matrix;
    let d, a, b, i, p;
    // due to the csport.reset(), m is initial, i.e. a = d and b = c = 0
    if (csgridsize !== 0) {
        // Square grid
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
    if (cstgrid !== 0) {
        // Triangular grid
        csctx.beginPath();
        csctx.strokeStyle = "rgba(0,0,0,0.1)";
        csctx.lineWidth = 1;
        csctx.lineCap = "butt";
        d = cstgrid * m.a;
        const sqrt3 = Math.sqrt(3);
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
    const evtobj = window.event ? event : e;
    const unicode = evtobj.charCode ? evtobj.charCode : evtobj.keyCode;
    const actualkey = String.fromCharCode(unicode);
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

function cs_multidown(id) {
    multiid = id;
    if (id === 0) multipos[0] = csmouse;
    evaluate(cscompiled.multidown);
    multiid = 0;
}

function cs_multiup(id) {
    multiid = id;
    evaluate(cscompiled.multiup);
    delete multipos[id];
    multiid = 0;
}

function cs_multidrag(id) {
    multiid = id;
    evaluate(cscompiled.multidrag);
    multiid = 0;
}

function cs_mousemove(e) {
    evaluate(cscompiled.mousemove);
}

function cs_mouseclick(e) {
    evaluate(cscompiled.mouseclick);
}

function cs_tick(e) {
    const now = Date.now();
    const delta = Math.min(simcap, now - simtick) * simspeed * simfactor;
    setSimTime(now);
    const time = simtime + delta;
    if (csPhysicsInited && typeof lab !== "undefined") {
        lab.tick(delta);
    }
    setSimTime(time);
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
    setDropped(List.turnIntoCSList(lst));
    setDropPoint(pos);
    evaluate(cscompiled.ondrop);
    setDropped(nada);
    setDropPoint(nada);
    scheduleUpdate();
}

function cindy_cancelmove() {
    move = undefined;
}

export {
    scheduleUpdate,
    addAutoCleaningEventListener,
    setuplisteners,
    cs_simulationstart,
    cs_simulationstop,
    cskey,
    cskeycode,
    multipos,
    move,
    multiid,
    updateCindy,
    mouse,
    getmover,
    cs_keydown,
    cs_keyup,
    cs_keytyped,
    cs_simulationstep,
    setMove,
};
