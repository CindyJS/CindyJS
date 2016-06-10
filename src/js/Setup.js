var createCindy = this; // since this will be turned into a method

var csconsole;
var cslib;

var cscompiled = {};

var csanimating = false;
var csstopped = true;
var csticking = false;
var csscale = 1;
var csgridsize = 0;
var csgridscript;
var cssnap = false;
var csaxes = false;

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
    var prog = evaluator.parse$1([General.wrap(a)], []);
    var erg = evaluate(prog);
    dumpcs(erg);
}


function evokeCS(code) {
    var parsed = analyse(code, false);
    console.log(parsed);
    evaluate(parsed);
    updateCindy();
}


var canvas;
var trafos;

function updateCanvasDimensions() {
    canvas.width = csw = canvas.clientWidth;
    canvas.height = csh = canvas.clientHeight;
    csctx.setTransform(1, 0, 0, 1, 0, 0); // reset
    csport.setMat(25, 0, 0, 25, 250.5, 250.5); // reset
    if (trafos) {
        for (var i = 0; i < trafos.length; i++) {
            var trafo = trafos[i];
            var trname = Object.keys(trafo)[0];
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
    var devicePixelRatio = 1;
    if (typeof window !== "undefined" && window.devicePixelRatio)
        devicePixelRatio = window.devicePixelRatio;
    var backingStoreRatio =
        csctx.webkitBackingStorePixelRatio ||
        csctx.mozBackingStorePixelRatio ||
        csctx.msBackingStorePixelRatio ||
        csctx.oBackingStorePixelRatio ||
        csctx.backingStorePixelRatio ||
        1;
    if (devicePixelRatio !== backingStoreRatio) {
        var ratio = devicePixelRatio / backingStoreRatio;
        canvas.width = csw * ratio;
        canvas.height = csh * ratio;
        csctx.scale(ratio, ratio);
    }
}

// hook to allow instrumented versions to replace or augment the canvas object
var haveCanvas = function(canvas) {
    return canvas;
};

var isFiniteNumber = Number.isFinite || function(x) {
    return (typeof x === 'number') && isFinite(x);
};

var csmouse, csctx, csw, csh, csgeo, images, dropped = nada;

function canvasWithContainingDiv(elt) {
    var div;
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
        var attrs = Array.prototype.slice.call(canvas.attributes);
        var width = null;
        var height = null;
        attrs.forEach(function(attr) {
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
    var style = canvas.style;
    style.position = "absolute";
    style.border = "none";
    style.margin = style.padding = style.left = style.top = "0px";
    style.width = style.height = "100%";
    var position = "static";
    if (window.getComputedStyle) {
        position = window.getComputedStyle(div).getPropertyValue("position");
        position = String(position || "static");
    }
    if (position === "static")
        div.style.position = "relative"; // serve as a positioning root
    div.appendChild(canvas);
    // TODO: implement component resizing detection, probably similar to
    // github.com/marcj/css-element-queries/blob/bfa9a7f/src/ResizeSensor.js
    return canvas;
}

function createCindyNow() {
    startupCalled = true;
    if (waitForPlugins !== 0) return;

    var data = instanceInvocationArguments;
    if (data.exclusive) {
        i = createCindy.instances.length;
        while (i > 0)
            createCindy.instances[--i].shutdown();
    }

    if (data.csconsole !== undefined)
        csconsole = data.csconsole;
    setupConsole();

    csmouse = [100, 100];
    var c = null;
    trafos = data.transform;
    if (data.ports) {
        if (data.ports.length > 0) {
            var port = data.ports[0];
            c = port.element;
            if (!c)
                c = document.getElementById(port.id);
            c = canvasWithContainingDiv(c);
            var divStyle = c.parentNode.style;
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
            if (port.background)
                c.style.backgroundColor = port.background;
            if (port.transform !== undefined)
                trafos = port.transform;
            if (isFiniteNumber(port.grid) && port.grid > 0)
                csgridsize = port.grid;
            if (port.snap)
                cssnap = true;
            if (port.axes)
                csaxes = true;
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
        if (!csctx.setLineDash)
            csctx.setLineDash = function() {};
    }

    //Setup the scripts
    var scripts = ["move", "keydown",
        "mousedown", "mouseup", "mousedrag",
        "init", "tick", "draw",
        "simulationstep", "simulationstart", "simulationstop", "ondrop"
    ];
    var scriptconf = data.scripts,
        scriptpat = null;
    if (typeof scriptconf === "string" && scriptconf.search(/\*/))
        scriptpat = scriptconf;
    if (typeof scriptconf !== "object")
        scriptconf = null;

    scripts.forEach(function(s) {
        var cscode;
        if (scriptconf !== null && scriptconf[s]) {
            cscode = scriptconf[s];
        } else {
            var sname = s + "script";
            if (data[sname]) {
                cscode = document.getElementById(data[sname]);
            } else if (scriptpat) {
                cscode = document.getElementById(scriptpat.replace(/\*/, s));
                if (!cscode)
                    return;
            } else {
                return;
            }
            cscode = cscode.text;
        }
        cscode = analyse(cscode, false);
        if (cscode.ctype === "error") {
            console.error(
                "Error compiling " + s + " script: " +
                cscode.message
            );
        } else {
            cscompiled[s] = cscode;
        }
    });

    if (isFiniteNumber(data.grid) && data.grid > 0) {
        csgridsize = data.grid;
    }
    if (data.snap) {
        cssnap = true;
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
    if (typeof csinitphys === 'function')
        csinitphys(data.behavior);

    for (var k in data.images) {
        var img = loadImage(data.images[k]);
        if (img !== nada)
            images[k] = img;
    }

    globalInstance.canvas = c;

    // Invoke oninit callback
    if (data.oninit)
        data.oninit(globalInstance);

    createCindy.instances.push(globalInstance);
    if (instanceInvocationArguments.use)
        instanceInvocationArguments.use.forEach(function(name) {
            evaluator.use$1([General.wrap(name)], {});
        });
    loadExtraModules();
    doneLoadingModule();
}

/*
 * An image wrapper object contains the following properties:
 * img: the actual drawable, i.e. an <img>, <canvas>, <video> or similar
 * width, height: dimensions of the image
 * ready: boolean indicating whether the image been loaded already
 * live: boolean indicating whether the image is expected to change continuously
 * generation: A counter that is increased once the drawable is changed.
 */
function loadImage(obj) {
    var img;
    if (typeof obj === "string") {
        img = new Image();
        img.src = obj;
    } else {
        img = obj;
    }
    if (!img.tagName) {
        console.error("Not a valid image element", img);
        return nada;
    }
    var value = {
        img: img,
        width: NaN,
        height: NaN,
        ready: true,
        live: false,
        generation: 0,
        whenReady: callFunctionNow,
    };
    var tag = img.tagName.toLowerCase();
    var callWhenReady = [];
    if (tag === "img") {
        if (img.complete) {
            value.width = img.width;
            value.height = img.height;
        } else {
            value.ready = false;
            img.addEventListener("load", function() {
                value.width = img.width;
                value.height = img.height;
                value.ready = true;
                value.whenReady = callFunctionNow;
                callWhenReady.forEach(callFunctionNow);
                updateCindy();
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
            img.addEventListener("loadedmetadata", function() {
                value.width = img.videoWidth;
                value.height = img.videoHeight;
                value.ready = true;
                value.whenReady = callFunctionNow;
                callWhenReady.forEach(callFunctionNow);
                updateCindy();
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
        value: value,
    };
}

function callFunctionNow(f) {
    return f();
}

function loadExtraModules() {
    if (usedFunctions.convexhull3d$1)
        loadExtraPlugin("quickhull3d", "quickhull3d/quickhull3d.nocache.js");
}

var modulesToLoad = 1;

function loadExtraPlugin(name, path) {
    var cb = null;
    if (instanceInvocationArguments.plugins)
        cb = instanceInvocationArguments.plugins[name];
    if (!cb)
        cb = createCindy._pluginRegistry[name];
    if (cb) {
        evaluator.use$1([General.wrap(name)], {});
        return;
    }
    ++modulesToLoad;
    createCindy.autoLoadPlugin(name, path, function() {
        evaluator.use$1([General.wrap(name)], {});
        doneLoadingModule();
    });
}

function loadExtraModule(name, path) {
    ++modulesToLoad;
    createCindy.loadScript(name, path, doneLoadingModule, function() {
        console.error(
            "Failed to load " + path + ", can't start CindyJS instance");
        shutdown();
    });
}

function doneLoadingModule() {
    if (--modulesToLoad !== 0)
        return;

    //Evaluate Init script
    evaluate(cscompiled.init);

    if (instanceInvocationArguments.autoplay)
        csplay();

    if (globalInstance.canvas)
        setuplisteners(globalInstance.canvas, instanceInvocationArguments);
}

var backup = null;

function backupGeo() {
    var state = stateArrays.backup;
    state.set(stateIn);
    var speeds = {};
    for (var i = 0; i < csgeo.points.length; i++) {
        var el = csgeo.points[i];
        if (typeof(el.behavior) !== 'undefined') {
            speeds[el.name] = [
                el.behavior.vx,
                el.behavior.vy,
                el.behavior.vz
            ];
        }
    }
    backup = {
        state: state,
        speeds: speeds
    };
}


function restoreGeo() {
    if (backup === null)
        return;
    stateIn.set(backup.state);
    Object.keys(backup.speeds).forEach(function(name) {
        var el = csgeo.csnames[name];
        if (typeof(el.behavior) !== 'undefined') { //TODO Diese Physics Reset ist FALSCH
            var speed = backup.speeds[name];
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
    if (!csanimating) { // stop or pause state
        if (csstopped) { // stop state
            backupGeo();
            csstopped = false;
        }
        if (typeof csinitphys === 'function') {
            if (csPhysicsInited) {
                csreinitphys(behaviors);
            }
        }

        csanimating = true;
        cs_simulationstart();
        startit();
    }
}

function cspause() {
    if (csanimating) {
        csanimating = false;
    }
}

function csstop() {
    if (!csstopped) {
        if (csanimating) {
            cs_simulationstop();
            csanimating = false;
        }
        csstopped = true;
        restoreGeo();
    }
}

var shutdownHooks = [];
var isShutDown = false;

function shutdown() {
    if (isShutDown)
        return; // ignore multiple calls
    isShutDown = true;
    // console.log("Shutting down");

    // Remove this from the list of all running instances
    var n = createCindy.instances.length;
    while (n > 0) {
        if (createCindy.instances[--n] === globalInstance) {
            createCindy.instances.splice(n, 1);
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

// The following object will be returned from the public createCindy function.
// Its startup method will be called automatically unless specified otherwise.
var globalInstance = {
    "config": instanceInvocationArguments,
    "startup": createCindyNow,
    "shutdown": shutdown,
    "evokeCS": evokeCS,
    "play": csplay,
    "pause": cspause,
    "stop": csstop,
    "evalcs": function(code) {
        return evaluate(analyse(code, false));
    },
    "parse": function(code) {
        return analyse(code);
    },
    "niceprint": niceprint,
    "canvas": null, // will be set during startup
};

var startupCalled = false;
var waitForPlugins = 0;
if (instanceInvocationArguments.use) {
    instanceInvocationArguments.use.forEach(function(name) {
        var cb = null;
        if (instanceInvocationArguments.plugins)
            cb = instanceInvocationArguments.plugins[name];
        if (!cb)
            cb = createCindy._pluginRegistry[name];
        if (!cb) {
            ++waitForPlugins;
            console.log("Loading script for plugin " + name);
            createCindy.loadScript(name + "-plugin", name + "-plugin.js", function() {
                console.log("Successfully loaded plugin " + name);
                if (--waitForPlugins === 0 && startupCalled) createCindyNow();
            }, function() {
                console.error("Failed to auto-load plugin " + name);
                if (--waitForPlugins === 0 && startupCalled) createCindyNow();
            });
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

    this.in = function(s, preventNewline) {
        console.log(s);

        if (preventNewline) {
            this.append(this.createTextNode("span", "blue", s));

        } else {
            this.append(this.createTextNode("p", "blue", s));
        }
    };

    this.out = function(s, preventNewline) {
        console.log(s);

        if (preventNewline) {
            this.append(this.createTextNode("span", "red", s));

        } else {
            this.append(this.createTextNode("p", "red", s));
        }
    };

    this.err = function(s, preventNewline) {
        console.log(s);

        if (preventNewline) {
            this.append(this.createTextNode("span", "red", s));

        } else {
            this.append(this.createTextNode("p", "red", s));
        }
    };

    this.createTextNode = function(tagName, color, s) {
        if (typeof document !== "undefined") {
            var element = document.createElement(tagName);
            element.appendChild(document.createTextNode(s));
            element.style.color = color;

            return element;
        }

        return s + "\n";
    };
}

function CindyConsoleHandler() {

    var that = this;
    var cmd;
    var container = document.createElement("div");
    var log;

    container.innerHTML = (
        '<div id="console" style="border-top: 1px solid #333333; bottom: 0px; position: absolute; width: 100%;">' +
        '<div id="log" style="height: 150px; overflow-y: auto;"></div>' +
        '<input id="cmd" type="text" style="box-sizing: border-box; height: 30px; width: 100%;">' +
        '</div>'
    );

    document.body.appendChild(container);

    cmd = document.getElementById("cmd");
    log = document.getElementById("log");

    cmd.onkeydown = function(evt) {
        if (evt.keyCode !== 13 || cmd.value === "") {
            return;
        }

        that.in(cmd.value);

        evalcs(cmd.value);

        cmd.value = "";

        log.scrollTop = log.scrollHeight;
    };

    this.append = function(s) {
        log.appendChild(s);
    };

    this.clear = function() {
        log.innerHTML = "";
    };
}

CindyConsoleHandler.prototype = new GenericConsoleHandler();

function ElementConsoleHandler(idOrElement) {

    var element = idOrElement;
    if (typeof idOrElement === "string") {
        element = document.getElementById(idOrElement);
    }

    this.append = function(s) {
        element.appendChild(s);
    };

    this.clear = function() {
        element.innerHTML = "";
    };
}

ElementConsoleHandler.prototype = new GenericConsoleHandler();

function NullConsoleHandler() {

    this.append = function(s) {
        // Do nothing
    };

    this.clear = function() {
        // Do nothing
    };
}

NullConsoleHandler.prototype = new GenericConsoleHandler();
