import {
    scheduleUpdate,
    addAutoCleaningEventListener,
    setuplisteners,
    cs_simulationstart,
    cs_simulationstop,
} from "Events";
import { window, nada, document, instanceInvocationArguments } from "expose";
import { General } from "libcs/General";
import { niceprint, evaluator } from "libcs/Essentials";
import { setStatusBar } from "libcs/Operators";
import { evaluate, analyse, labelCode, usedFunctions } from "libcs/Evaluator";
import { csport } from "libgeo/GeoState";
import { csinit } from "libgeo/GeoBasics";
import { stateArrays, stateIn, recalcAll } from "libgeo/Tracing";
import { noop } from "libgeo/GeoOps";
import { csinitphys, csPhysicsInited, csresetphys } from "liblab/LabBasics";

const CindyJS = this; // since this will be turned into a method

let csconsole;
let cslib;

const cscompiled = {};

// Simulation settings
let csanimating = false;
let csstopped = true;
let simtime = 0; // accumulated simulation time since start
let simspeed = 0.5; // global speed setting, will get scaled for applications
const simcap = 1000 / 20; // max. ms between frames for fps-independent sim
let simtick = 0; // Date.now of the most recent simulation tick
let simaccuracy = 10; // number of sub-steps per frame

const simunit = 5 / 360; // reported simulationtime() per internal simtime unit
/* Cinderella has a factor 5 for its internal animation clock,
 * and the division by 360 is in the simulationtime function implementation.
 */

// internal simtime units per millisecond at simspeed 1
const simfactor = (0.32 / simunit / 1000) * 2;
/*              ^^^^ simulationtime per second, observed in Cinderella
 *                     ^^^^^^^ simulationtime per simtime unit
 *                               ^^^^ milliseconds per second
 *                                      ^ default accuracy factor
 *
 * Cinderella does timing different from CindyJS, so here are some notes.
 * The default in Cinderella is speed=1.0, accuracy=2, frames=1 in its terms,
 * which in CindyJS terminology would mean speed=0.5, accuracy=1.
 * It schedules animation frames with 20ms between, so the actual framerate
 * depends on the time each such frame takes to compute.
 * The step in simulated time for each such job is computed in Cinderella
 * as speed * 2^(frames - accuracy), so it's 0.5 units by default.
 * This amount is internal only; the simulationtime() divides the accumulated
 * time by 360.  Using its output, one can observe the amount of simulated
 * time for each second of wall time.  It will vary with hardware, but
 * on current desktops was observed to be close to 0.32 per second,
 * corresponding to 23.04ms between consecutive frames on average.
 * So that's where all the magic values in the simfactor computation come from.
 *
 * Should these values (simunit and simfactor) be different for widgets
 * which were not exported from Cinderella? (gagern, 2016-09-02)
 */

// Coordinate system settings
let csscale = 1;
let csgridsize = 0;
let cstgrid = 0;
let csgridscript;
let cssnap = false;
let cssnapDistance = 0.2;
let csaxes = false;

//virtual resolution
let virtualwidth = 0;
let virtualheight = 0;
let vscale = 1;

function dump(a) {
    console.log(JSON.stringify(a));
}

function dumpcs(a) {
    console.log(niceprint(a));

    if (a.ctype !== "undefined") {
        csconsole.out(niceprint(a));
    }
}

function evalcs(a) {
    const prog = evaluator.parse$1([General.wrap(a)], []);
    const erg = evaluate(prog);
    dumpcs(erg);
}

function evokeCS(code) {
    const parsed = analyse(code, false);
    evaluate(parsed);
    scheduleUpdate();
}

let canvas;
let trafos;

function updateCanvasDimensions() {
    canvas.width = csw = canvas.clientWidth;
    canvas.height = csh = canvas.clientHeight;

    vscale = 1;
    if (virtualwidth || virtualheight) {
        vscale = Math.max(
            virtualwidth ? virtualwidth / canvas.width : 0,
            virtualheight ? virtualheight / canvas.height : 0
        );

        csw = vscale * canvas.clientWidth;
        csh = vscale * canvas.clientHeight;
    }

    csctx.setTransform(1 / vscale, 0, 0, 1 / vscale, 0, 0); // reset
    csport.setMat(25, 0, 0, 25, 250.5, 250.5); // reset
    if (trafos) {
        for (const trafo of trafos) {
            const trname = Object.keys(trafo)[0];
            if (trname === "scale") {
                csscale = trafo.scale;
                csport[trname](trafo.scale);
            }
            if (trname === "translate") {
                csport[trname](trafo.translate[0], trafo.translate[1]);
            }
            if (trname === "scaleAndOrigin") {
                csscale = trafo[trname][0] / 25;
                csport[trname].apply(null, trafo[trname]);
            }
            if (trname === "visibleRect") {
                csport[trname].apply(null, trafo[trname]);
                csscale = csport.drawingstate.initialmatrix.a / 25;
            }
        }
    }

    csport.createnewbackup();
    csport.greset();
    let devicePixelRatio = 1;
    if (typeof window !== "undefined" && window.devicePixelRatio) devicePixelRatio = window.devicePixelRatio;
    const backingStoreRatio =
        csctx.webkitBackingStorePixelRatio ||
        csctx.mozBackingStorePixelRatio ||
        csctx.msBackingStorePixelRatio ||
        csctx.oBackingStorePixelRatio ||
        csctx.backingStorePixelRatio ||
        1;
    if (devicePixelRatio !== backingStoreRatio) {
        const ratio = devicePixelRatio / backingStoreRatio;
        canvas.width = csw * ratio;
        canvas.height = csh * ratio;
        csctx.scale(ratio, ratio);
    }
}

// hook to allow instrumented versions to replace or augment the canvas object
const haveCanvas = function (canvas) {
    return canvas;
};

const isFiniteNumber =
    Number.isFinite ||
    function (x) {
        return typeof x === "number" && isFinite(x);
    };

let csmouse;
var csctx;
var csw;
var csh;
let csgeo;
let images;
let dropped = nada;
let dropPoint = nada;

function setCsctx(ctx) {
    csctx = ctx;
}

function canvasWithContainingDiv(elt) {
    let div;
    if (elt.tagName.toLowerCase() !== "canvas") {
        // we have a div or something like that, nest a canvas inside that
        div = elt;
        canvas = document.createElement("canvas");
        while (div.firstChild) {
            div.removeChild(div.firstChild);
        }
    } else {
        // we have a canvas; build a div around it
        canvas = elt;
        div = document.createElement("div");
        const attrs = Array.prototype.slice.call(canvas.attributes);
        let width = null;
        let height = null;
        attrs.forEach(function (attr) {
            if (attr.name === "width") {
                width = attr.value;
            } else if (attr.name === "height") {
                height = attr.value;
            } else {
                div.setAttributeNodeNS(canvas.removeAttributeNode(attr));
            }
        });
        if (width !== null && !div.style.width) {
            div.style.width = width + "px";
        }
        if (height !== null && !div.style.height) {
            div.style.height = height + "px";
        }
        canvas.parentNode.replaceChild(div, canvas);
    }
    div.classList.add("CindyJS-widget");
    const style = canvas.style;
    style.position = "absolute";
    style.border = "none";
    style.margin = style.padding = style.left = style.top = "0px";
    style.width = style.height = "100%";
    let position = "static";
    if (window.getComputedStyle) {
        position = window.getComputedStyle(div).getPropertyValue("position");
        position = String(position || "static");
    }
    if (position === "static") div.style.position = "relative"; // serve as a positioning root
    div.appendChild(canvas);
    return canvas;
}

function isCinderellaBeforeVersion() {
    const c = instanceInvocationArguments.cinderella;
    if (!c || !c.version) return false;
    for (let i = 0; i < arguments.length; ++i) {
        const x = c.version[i];
        const y = arguments[i];
        if (x !== y) return typeof x === typeof y && x < y;
    }
    return false;
}

async function createCindyNow() {
    startupCalled = true;
    if (waitForPlugins !== 0) return;

    const data = instanceInvocationArguments;
    if (data.exclusive) {
        i = CindyJS.instances.length;
        while (i > 0) CindyJS.instances[--i].shutdown();
    }

    if (data.csconsole !== undefined) csconsole = data.csconsole;
    setupConsole();

    csmouse = [100, 100];
    let c = null;
    trafos = data.transform;
    if (data.ports) {
        if (data.ports.length > 0) {
            const port = data.ports[0];
            c = port.element;
            if (!c) c = document.getElementById(port.id);
            c = canvasWithContainingDiv(c);
            const divStyle = c.parentNode.style;
            if (port.fill === "window") {
                divStyle.width = "100vw";
                divStyle.height = "100vh";
            } else if (port.fill === "parent") {
                divStyle.width = "100%";
                divStyle.height = "100%";
            } else if (port.width && port.height) {
                divStyle.width = port.width + "px";
                divStyle.height = port.height + "px";
            }
            if (port.virtualwidth) virtualwidth = port.virtualwidth;
            if (port.virtualheight) virtualheight = port.virtualheight;

            if (port.background) c.style.backgroundColor = port.background;
            if (port.transform !== undefined) trafos = port.transform;
            if (isFiniteNumber(port.grid) && port.grid > 0) csgridsize = port.grid;
            if (isFiniteNumber(port.tgrid) && port.tgrid > 0) cstgrid = port.tgrid;
            if (port.snap) cssnap = true;
            if (Number.isFinite(port.snapdistance)) cssnapDistance = Math.max(port.snapdistance, 0);
            if (port.axes) csaxes = true;
        }
    }
    if (!c) {
        c = data.canvas;
        if (!c && typeof document !== "undefined") {
            c = document.getElementById(data.canvasname);
            if (c) c = canvasWithContainingDiv(c);
        }
    }
    if (c) {
        canvas = c = haveCanvas(c);
        csctx = c.getContext("2d");
        updateCanvasDimensions();
        if (!csctx.setLineDash) csctx.setLineDash = function () {};
        if (data.animation ? data.animation.controls : data.animcontrols) setupAnimControls(data);
        if (data.animation && isFiniteNumber(data.animation.speed)) {
            if (data.animation.accuracy === undefined && isCinderellaBeforeVersion(2, 9, 1875))
                setSpeed(data.animation.speed * 0.5);
            else setSpeed(data.animation.speed);
        }
        if (data.animation && isFiniteNumber(data.animation.accuracy)) simaccuracy = data.animation.accuracy;
    }
    if (data.statusbar) {
        if (typeof data.statusbar === "string") {
            setStatusBar(document.getElementById(data.statusbar));
        } else {
            setStatusBar(data.statusbar);
        }
    }

    //Setup the scripts
    const scripts = [
        "move",
        "keydown",
        "keyup",
        "keytyped",
        "keytype",
        "mousedown",
        "mouseup",
        "mousedrag",
        "mousemove",
        "mouseclick",
        "multidown",
        "multiup",
        "multidrag",
        "init",
        "tick",
        "draw",
        "simulationstep",
        "simulationstart",
        "simulationstop",
        "ondrop",
        // CindyXR plugin
        "xrdraw",
        "xrinputsourceschange",
        "xrselectstart",
        "xrselectend",
        "xrselect",
        "xrselecthold",
        "xrsqueezestart",
        "xrsqueezeend",
        "xrsqueeze",
        "xrsqueezehold",
    ];
    let scriptconf = data.scripts;
    let scriptpat = null;
    if (typeof scriptconf === "string" && scriptconf.search(/\*/) >= 0) scriptpat = scriptconf;
    if (typeof scriptconf !== "object") scriptconf = null;

    /*
Loads CindyScript files (marked by .cjs file ending) and adds their code AT THE BEGINNING of the init script.
The file names (and paths) have to be listed in the dictionary that's passed to CindyJS/createCindy as an array for the key 'import'. I.e., like this:
          var cdy = CindyJS({
                ports: [{ id: "CSCanvas", width: 500, height: 500 }],
                scripts: "cs*",
                import: ["cindyscript_libraries/libraryA", "cindyscript_libraries/libraryB"]

            });
Note that the libraries get prepended to the init-script BACK TO FRONT. So, in the example above, the code from libraryA comes before the code from libraryB whoch comes before the custom user code. That way, libraries can reference each others code.

CAUTION!
Since this uses the 'fetch' command, it only works on a web server. So, for local testing, start one with 'python -m http.server' or however else you are comfortable with.
If the key 'import' doesn't exists or its value is an empty array, opening the file locally works as always.
*/
    if (data.import && Array.isArray(data.import) && data.import.length > 0) {
        let initId = "csinit";
        if (data.initscript) {
            initId = data.initscript;
        } else if (scriptpat) {
            initId = scriptpat.replace(/\*/, "init");
        } else {
            return;
        }

        console.log("===== Importing CindyScript libraries to " + initId + " =====");

        let fullCode = "";

        for (let library of data.import.reverse()) {
            if (typeof library !== "string") continue;

            console.log("Loading " + library + " ...");

            let query = library.search(/.+\.cjs$/) == -1 ? library + ".cjs" : library;
            let response = await fetch(query);

            if (response.status === 200) {
                let code = await response.text();
                let safety = code[code.length - 1] == ";" ? "" : ";";
                fullCode = code + safety + "\n" + fullCode;
                console.log(library + " loaded!");
            } else {
                console.log("CAUTION! Import of " + library + " failed.");
            }
        }

        prependCindyScript(fullCode, initId);
        console.log("===== Import of libraries to " + initId + " finished ========");
    }

    // Continue with compiling scripts.

    scripts.forEach(function (s) {
        let cscode;
        if (scriptconf !== null && scriptconf[s]) {
            cscode = scriptconf[s];
        } else {
            const sname = s + "script";
            if (data[sname]) {
                cscode = document.getElementById(data[sname]);
            } else if (scriptpat) {
                cscode = document.getElementById(scriptpat.replace(/\*/, s));
                if (!cscode) return;
            } else {
                return;
            }
            cscode = cscode.text;
        }
        cscode = analyse(cscode, false);
        if (cscode.ctype === "error") {
            console.error("Error compiling " + s + " script: " + cscode.message);
        } else {
            cscompiled[s] = labelCode(cscode, s);
        }
    });
    if (isCinderellaBeforeVersion(2, 9, 1888) && !cscompiled.keydown) {
        // Cinderella backwards-compatible naming of key events
        cscompiled.keydown = cscompiled.keytyped;
        cscompiled.keytyped = cscompiled.keytype;
        cscompiled.keytype = undefined;
    }

    if (isFiniteNumber(data.grid) && data.grid > 0) {
        csgridsize = data.grid;
    }
    if (data.snap) {
        cssnap = true;
    }
    if (Number.isFinite(data.snapdistance)) {
        cssnapDistance = Math.max(data.snapdistance, 0);
    }

    csgeo = {};

    var i = 0;
    images = {};

    //Read Geometry
    if (!data.geometry) {
        data.geometry = [];
    }
    csinit(data.geometry);

    //Read Physics
    if (!data.behavior) {
        data.behavior = [];
    }
    if (typeof csinitphys === "function") csinitphys(data.behavior);

    for (const k in data.images) {
        const img = loadImage(data.images[k], false);
        if (img !== nada) images[k] = img;
    }

    for (const l in data.videos) {
        const video = loadImage(data.videos[l], true);
        if (video !== nada) images[l] = video;
    }

    globalInstance.canvas = c;

    // Invoke oninit callback
    if (data.oninit) data.oninit(globalInstance);

    CindyJS.instances.push(globalInstance);
    if (instanceInvocationArguments.use)
        instanceInvocationArguments.use.forEach(function (name) {
            evaluator.use$1([General.wrap(name)], {});
        });
    loadExtraModules();
    doneLoadingModule();
}

function prependCindyScript(codeString, scriptId = "csinit") {
    var codeNode = document.createTextNode(codeString);

    var scriptElement = document.getElementById(scriptId);
    if (!scriptElement) {
        scriptElement = document.createElement("script");
        scriptElement.id = scriptId;
        scriptElement.type = "text/x-cindyscript";
        document.head.appendChild(scriptElement);
    }
    if (scriptElement.firstChild) {
        scriptElement.insertBefore(codeNode, scriptElement.firstChild);
    } else {
        scriptElement.appendChild(codeNode);
    }
}

/*
 * An image wrapper object contains the following properties:
 * img: the actual drawable, i.e. an <img>, <canvas>, <video> or similar
 * width, height: dimensions of the image
 * ready: boolean indicating whether the image been loaded already
 * live: boolean indicating whether the image is expected to change continuously
 * generation: A counter that is increased once the drawable is changed.
 */
function loadImage(obj, video) {
    let img;
    if (typeof obj === "string") {
        if (video) {
            img = document.createElement("video");
            img.preload = "auto";
            img.loop = true; //loop videos as default

            //https://www.npmjs.com/package/iphone-inline-video
            img.setAttribute("playsinline", "");
            enableInlineVideo(img);
        } else {
            img = new Image();
        }
        img.src = obj;
    } else {
        img = obj;
    }
    if (!img.tagName) {
        console.error("Not a valid image element", img);
        return nada;
    }
    const value = {
        img,
        width: NaN,
        height: NaN,
        ready: true,
        live: false,
        generation: 0,
        whenReady: callFunctionNow,
    };
    const tag = img.tagName.toLowerCase();
    const callWhenReady = [];
    if (tag === "img") {
        if (img.complete) {
            value.width = img.width;
            value.height = img.height;
        } else {
            value.ready = false;
            img.addEventListener("load", function () {
                value.width = img.width;
                value.height = img.height;
                value.ready = true;
                value.whenReady = callFunctionNow;
                callWhenReady.forEach(callFunctionNow);
                scheduleUpdate();
            });
            value.whenReady = callWhenReady.push.bind(callWhenReady);
        }
    } else if (tag === "video") {
        value.live = true;
        if (img.readyState >= img.HAVE_METADATA) {
            value.width = img.videoWidth;
            value.height = img.videoHeight;
        } else {
            value.ready = false;
            img.addEventListener("loadedmetadata", function () {
                value.width = img.videoWidth;
                value.height = img.videoHeight;
                value.ready = true;
                value.whenReady = callFunctionNow;
                callWhenReady.forEach(callFunctionNow);
                scheduleUpdate();
            });
            value.whenReady = callWhenReady.push.bind(callWhenReady);
        }
    } else if (tag === "canvas") {
        value.width = img.width;
        value.height = img.height;
    } else {
        console.error("Not a valid image element", tag, img);
        return nada;
    }
    return {
        ctype: "image",
        value,
    };
}

const animcontrols = {
    play: noop,
    pause: noop,
    stop: noop,
};

function setupAnimControls(data) {
    const controls = document.createElement("div");
    controls.className = "CindyJS-animcontrols";
    canvas.parentNode.appendChild(controls);
    let speedLo = 0;
    let speedHi = 1;
    let speedScale = 1;
    if (
        data.animation &&
        data.animation.speedRange &&
        isFiniteNumber(data.animation.speedRange[0]) &&
        isFiniteNumber(data.animation.speedRange[1])
    ) {
        speedLo = data.animation.speedRange[0];
        speedHi = data.animation.speedRange[1];
        speedScale = speedHi - speedLo;
    }
    const slider = document.createElement("div");
    slider.className = "CindyJS-animspeed";
    controls.appendChild(slider);
    const knob = document.createElement("div");
    slider.appendChild(knob);
    addAutoCleaningEventListener(slider, "mousedown", speedDown);
    addAutoCleaningEventListener(slider, "mousemove", speedDrag);
    addAutoCleaningEventListener(canvas.parentNode, "mouseup", speedUp, true);
    const buttons = document.createElement("div");
    buttons.className = "CindyJS-animbuttons";
    controls.appendChild(buttons);
    setupAnimButton("play", csplay);
    setupAnimButton("pause", cspause);
    setupAnimButton("stop", csstop);
    animcontrols.stop(true);

    setSpeedKnob = function (speed) {
        speed = (speed - speedLo) / speedScale;
        speed = Math.max(0, Math.min(1, speed));
        speed = Math.round(speed * 1000) * 0.1; // avoid scientific notation
        knob.style.width = speed + "%";
    };

    function setupAnimButton(id, ctrl) {
        const button = document.createElement("button");
        const img = document.createElement("img");
        button.appendChild(img);
        buttons.appendChild(button);
        loadSvgIcon(img, id);
        button.addEventListener("click", ctrl);
        animcontrols[id] = setActive;

        function setActive(active) {
            if (active) button.classList.add("CindyJS-active");
            else button.classList.remove("CindyJS-active");
        }
    }

    let speedDragging = false;

    function speedDown(event) {
        speedDragging = true;
        speedDrag(event);
    }

    function speedDrag(event) {
        if (!speedDragging) return;
        const rect = slider.getBoundingClientRect();
        const x = event.clientX - rect.left - slider.clientLeft + 0.5;
        setSpeed((speedScale * x) / rect.width + speedLo);
    }

    function speedUp(event) {
        speedDragging = false;
    }
}

var setSpeedKnob = null;

function setSpeed(speed) {
    simspeed = speed;
    if (setSpeedKnob) setSpeedKnob(speed);
}

/* Install layer ‹id› of Icons.svg as the src of the given img element.
 * Since Safari has problems honoring the :target SVG selector
 * to make the selected layer visible, we achieve the same effect manually:
 * We load the SVG once, then remove all layers from its DOM but keep them
 * in a dictionary.  Then when an icon gets requested, we re-add that layer
 * to the SVG DOM, serialize the resulting XML and use it as a data: URI.
 *
 * There are three phases, and during each the loadSvgIcon variable refers
 * to a fifferent function.
 * The first request triggers loading of the SVG, and changes the function
 * to a version which simply enqueues subsequent requests.
 * Once the SVG has arrived, the function gets changes to the one that actually
 * sets the src attribute to the icon in question.
 * That function is then applied to all the enqueued requests as well.
 */
var loadSvgIcon = function (img, id) {
    let iconsToLoad = [];
    loadSvgIcon = function cacheRequest(img, id) {
        // subsequent requests get enqueued while we load the SVG
        iconsToLoad.push({
            img,
            id,
        });
    };
    loadSvgIcon(img, id); // cache the first request as well
    const url = CindyJS.getBaseDir() + "images/Icons.svg";
    const req = new XMLHttpRequest();
    req.onreadystatechange = handleStateChange;
    req.responseType = "document";
    req.open("GET", url);
    req.send();

    function handleStateChange() {
        if (req.readyState !== XMLHttpRequest.DONE) return;
        if (req.status !== 200) {
            console.error("Failed to load CindyJS Icons.svg from " + url + ": " + req.statusText);
            return;
        }
        const svg = req.responseXML;
        const docElt = svg.documentElement;
        const layers = {};
        let node, next;
        for (node = docElt.firstChild; node; node = next) {
            next = node.nextSibling;
            if (
                node.nodeType !== Node.ELEMENT_NODE ||
                node.namespaceURI !== "http://www.w3.org/2000/svg" ||
                node.localName.toLowerCase() !== "g"
            )
                continue;
            docElt.removeChild(node);
            node.setAttribute("style", "display:inline");
            layers[node.getAttribute("id")] = node;
        }
        const serializer = new XMLSerializer();
        loadSvgIcon = function (img, id) {
            // now that the SVG is loaded, requests get handled straight away
            if (!layers.hasOwnProperty(id)) return;
            const layer = layers[id];
            docElt.appendChild(layer);
            let str;
            try {
                str = serializer.serializeToString(svg);
            } finally {
                docElt.removeChild(layer);
            }
            img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(str);
        };
        iconsToLoad.forEach(function (icon) {
            loadSvgIcon(icon.img, icon.id);
        });
        iconsToLoad = null;
    }
};

function callFunctionNow(f) {
    return f();
}

function loadExtraModules() {
    if (usedFunctions.convexhull3d$1) {
        loadExtraPlugin("QuickHull3D", "QuickHull3D.js");
    }
    if (
        usedFunctions.colorplot$1 ||
        usedFunctions.colorplot$2 ||
        usedFunctions.colorplot$3 ||
        usedFunctions.colorplot$4
    ) {
        loadExtraPlugin("CindyGL", "CindyGL.js");
    }
    if (usedFunctions.playtone$1 || usedFunctions.playmelody$1) {
        loadExtraPlugin("midi", "midi-plugin.js");
    }
}

let modulesToLoad = 1;

function loadExtraPlugin(name, path, skipInit) {
    let cb = null;
    if (instanceInvocationArguments.plugins) cb = instanceInvocationArguments.plugins[name];
    if (!cb) cb = CindyJS._pluginRegistry[name];
    if (cb) {
        evaluator.use$1([General.wrap(name)], {});
        return;
    }
    ++modulesToLoad;
    CindyJS.autoLoadPlugin(name, path, function () {
        evaluator.use$1([General.wrap(name)], {});
        doneLoadingModule(skipInit);
    });
}

function loadExtraModule(name, path) {
    ++modulesToLoad;
    CindyJS.loadScript(name, path, doneLoadingModule, function () {
        console.error("Failed to load " + path + ", can't start CindyJS instance");
        shutdown();
    });
}

function doneLoadingModule(skipInit) {
    if (--modulesToLoad !== 0) return;

    if (!skipInit) {
        //Evaluate Init script
        evaluate(cscompiled.init);

        if ((instanceInvocationArguments.animation || instanceInvocationArguments).autoplay) csplay();

        if (globalInstance.canvas) setuplisteners(globalInstance.canvas, instanceInvocationArguments);
    } else scheduleUpdate();
}

let backup = null;

function backupGeo() {
    const state = stateArrays.backup;
    state.set(stateIn);
    const speeds = {};

    for (const el of csgeo.points) {
        if (typeof el.behavior !== "undefined") {
            speeds[el.name] = [el.behavior.vx, el.behavior.vy, el.behavior.vz];
        }
    }

    backup = {
        state,
        speeds,
    };
}

function restoreGeo() {
    if (backup === null) return;
    stateIn.set(backup.state);
    Object.keys(backup.speeds).forEach(function (name) {
        const el = csgeo.csnames[name];
        if (typeof el.behavior !== "undefined") {
            //TODO Diese Physics Reset ist FALSCH
            const speed = backup.speeds[name];
            el.behavior.vx = speed[0];
            el.behavior.vy = speed[1];
            el.behavior.vz = speed[2];
            el.behavior.fx = 0;
            el.behavior.fy = 0;
            el.behavior.fz = 0;
        }
    });
    recalcAll();
}

function csplay() {
    if (!csanimating) {
        // stop or pause state
        if (csstopped) {
            // stop state
            backupGeo();
            simtime = 0;
            csstopped = false;
            animcontrols.stop(false);
        } else {
            animcontrols.pause(false);
        }
        simtick = Date.now();
        animcontrols.play(true);
        if (typeof csinitphys === "function") {
            if (csPhysicsInited) {
                csresetphys();
            }
        }

        csanimating = true;
        cs_simulationstart();
        scheduleUpdate();
    }
}

function cspause() {
    if (csanimating) {
        animcontrols.play(false);
        animcontrols.pause(true);
        csanimating = false;
    }
}

function csstop() {
    if (!csstopped) {
        if (csanimating) {
            cs_simulationstop();
            csanimating = false;
            animcontrols.play(false);
        } else {
            animcontrols.pause(false);
        }
        animcontrols.stop(true);
        csstopped = true;
        restoreGeo();
    }
}

const shutdownHooks = [];
let isShutDown = false;

function shutdown() {
    if (isShutDown) return; // ignore multiple calls
    isShutDown = true;
    // console.log("Shutting down");

    // Remove this from the list of all running instances
    let n = CindyJS.instances.length;
    while (n > 0) {
        if (CindyJS.instances[--n] === globalInstance) {
            CindyJS.instances.splice(n, 1);
            break;
        }
    }

    // Call hooks in reverse order
    n = shutdownHooks.length;
    while (n > 0) {
        try {
            shutdownHooks[--n]();
        } catch (e) {
            console.error(e);
        }
    }
}

// The following object will be returned from the public CindyJS function.
// Its startup method will be called automatically unless specified otherwise.
var globalInstance = {
    config: instanceInvocationArguments,
    startup: createCindyNow,
    shutdown,
    evokeCS,
    play: csplay,
    pause: cspause,
    stop: csstop,
    evalcs: function (code) {
        return evaluate(analyse(code, false));
    },
    parse: function (code) {
        return analyse(code);
    },
    niceprint,
    canvas: null, // will be set during startup
};

var startupCalled = false;
var waitForPlugins = 0;
if (instanceInvocationArguments.use) {
    instanceInvocationArguments.use.forEach(function (name) {
        let cb = null;
        if (instanceInvocationArguments.plugins) cb = instanceInvocationArguments.plugins[name];
        if (!cb) cb = CindyJS._pluginRegistry[name];
        if (!cb) {
            ++waitForPlugins;
            console.log("Loading script for plugin " + name);
            CindyJS.loadScript(
                name + "-plugin",
                name + "-plugin.js",
                function () {
                    console.log("Successfully loaded plugin " + name);
                    if (--waitForPlugins === 0 && startupCalled) createCindyNow();
                },
                function () {
                    console.error("Failed to auto-load plugin " + name);
                    if (--waitForPlugins === 0 && startupCalled) createCindyNow();
                }
            );
        }
    });
}

//
// CONSOLE
//
function setupConsole() {
    if (csconsole === null) {
        csconsole = new NullConsoleHandler();
    } else if (csconsole === true) {
        csconsole = new CindyConsoleHandler();
    } else if (typeof csconsole === "string") {
        csconsole = new ElementConsoleHandler(csconsole);
    } else if (typeof csconsole === "object" && typeof csconsole.appendChild === "function") {
        csconsole = new ElementConsoleHandler(csconsole);
    } else {
        // Default
        csconsole = new NullConsoleHandler();
    }
}

function GenericConsoleHandler(args) {
    this.in = function (s, preventNewline) {
        console.log(s);

        if (preventNewline) {
            this.append(this.createTextNode("span", "blue", s));
        } else {
            this.append(this.createTextNode("p", "blue", s));
        }
    };

    this.out = function (s, preventNewline) {
        console.log(s);

        if (preventNewline) {
            this.append(this.createTextNode("span", "red", s));
        } else {
            this.append(this.createTextNode("p", "red", s));
        }
    };

    this.err = function (s, preventNewline) {
        console.log(s);

        if (preventNewline) {
            this.append(this.createTextNode("span", "red", s));
        } else {
            this.append(this.createTextNode("p", "red", s));
        }
    };

    this.createTextNode = function (tagName, color, s) {
        if (typeof document !== "undefined") {
            const element = document.createElement(tagName);
            element.appendChild(document.createTextNode(s));
            element.style.color = color;

            return element;
        }

        return s + "\n";
    };
}

function CindyConsoleHandler() {
    const that = this;
    let cmd;
    const container = document.createElement("div");
    let log;

    container.innerHTML =
        '<div id="console" style="border-top: 1px solid #333333; bottom: 0px; position: absolute; width: 100%;">' +
        '<div id="log" style="height: 150px; overflow-y: auto;"></div>' +
        '<input id="cmd" type="text" style="box-sizing: border-box; height: 30px; width: 100%;">' +
        "</div>";

    document.body.appendChild(container);

    cmd = document.getElementById("cmd");
    log = document.getElementById("log");

    cmd.onkeydown = function (evt) {
        if (evt.keyCode !== 13 || cmd.value === "") {
            return;
        }

        that.in(cmd.value);

        evalcs(cmd.value);

        cmd.value = "";

        log.scrollTop = log.scrollHeight;
    };

    this.append = function (s) {
        log.appendChild(s);
    };

    this.clear = function () {
        log.innerHTML = "";
    };
}

CindyConsoleHandler.prototype = new GenericConsoleHandler();

function ElementConsoleHandler(idOrElement) {
    let element = idOrElement;
    if (typeof idOrElement === "string") {
        element = document.getElementById(idOrElement);
    }

    this.append = function (s) {
        element.appendChild(s);
    };

    this.clear = function () {
        element.innerHTML = "";
    };
}

ElementConsoleHandler.prototype = new GenericConsoleHandler();

function NullConsoleHandler() {
    this.append = function (s) {
        // Do nothing
    };

    this.clear = function () {
        // Do nothing
    };
}

NullConsoleHandler.prototype = new GenericConsoleHandler();

function setSimTick(tick) {
    simtick = tick;
}

function setSimTime(time) {
    simtime = time;
}

function setSimAccuracy(acc) {
    simaccuracy = acc;
}

function setDropped(drop) {
    dropped = drop;
}

function setDropPoint(point) {
    dropPoint = point;
}

export {
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
    setCsctx,
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
    dropped,
    dropPoint,
    csconsole,
    CindyJS,
    loadExtraPlugin,
    csscale,
    canvas,
    images,
    vscale,
    csplay,
    isFiniteNumber,
    dump,
    cspause,
    csstop,
    globalInstance,
    simunit,
    setSpeed,
    setSimAccuracy,
    setSimTick,
    setSimTime,
    setDropped,
    setDropPoint,
    cssnap,
    cssnapDistance,
    simaccuracy,
};
