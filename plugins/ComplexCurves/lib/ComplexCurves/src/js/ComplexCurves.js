import {
    PolynomialParser
}
from './PolynomialParser';

var defaultLat = 5 / 12 * Math.PI;
var defaultLon = Math.PI / 6;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {number=} lat
 * @param {number=} lon
 * @param {boolean=} ortho
 * @constructor
 */
export function ComplexCurves(canvas, lat = defaultLat, lon = defaultLon,
    ortho = false) {
    this.canvas = canvas;
    this.state3d = State3D.fromLatLong(lat, lon, ortho);
    this.stategl = new StateGL(canvas);
    this.registerEventHandlers();
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {string} equation
 * @param {number} depth
 * @param {number=} lat
 * @param {number=} lon
 * @param {boolean=} ortho
 * @return {ComplexCurves}
 */
export function ComplexCurvesFromEquation(canvas, equation, depth,
    lat = defaultLat, lon = defaultLon, ortho = false) {
    var p = PolynomialParser.eval(PolynomialParser.parse(equation));
    return ComplexCurvesFromPolynomial(canvas, p, depth, lat, lon, ortho);
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {string} file
 * @param {string=} equation
 * @param {number=} lat
 * @param {number=} lon
 * @param {boolean=} ortho
 * @param {function()=} onload
 * @return {ComplexCurves}
 */
export function ComplexCurvesFromFile(canvas, file, equation = "",
    lat = defaultLat, lon = defaultLon, ortho = false, onload = function() {}) {
    var p = PolynomialParser.eval(PolynomialParser.parse(equation));
    var complexCurves = new ComplexCurves(canvas, lat, lon, ortho);
    var gl = complexCurves.stategl;
    gl.renderer = new CachedSurface(gl, file, p, function() {
        complexCurves.renderSurface();
        onload();
    });
    return complexCurves;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Polynomial} polynomial
 * @param {number} depth
 * @param {number=} lat
 * @param {number=} lon
 * @param {boolean=} ortho
 * @return {ComplexCurves}
 */
function ComplexCurvesFromPolynomial(canvas, polynomial, depth,
    lat = defaultLat, lon = defaultLon, ortho = false) {
    var complexCurves = new ComplexCurves(canvas, lat, lon, ortho);
    var gl = complexCurves.stategl;
    gl.renderer = new Surface(gl, polynomial, depth);
    complexCurves.renderSurface();
    return complexCurves;
}

/**
 * @param {boolean=} big
 * @return {Array<string>} */
ComplexCurves.prototype.domainColouring = function(big = false) {
    var gl = this.stategl;
    return gl.renderer.domainColouring(gl, big);
};

/** @param {string=} name */
ComplexCurves.prototype.exportBinary = function(name = "surface.bin") {
    var gl = this.stategl;
    gl.renderer.exportBinary(gl, name);
};

/**
 * @param {string=} name
 * @param {boolean=} big
 */
ComplexCurves.prototype.exportDomainColouring = function(name = "sheet",
    big = true) {
    var gl = this.stategl;
    gl.renderer.exportDomainColouring(gl, name, big);
};

/**
 * @param {string=} name
 * @param {boolean=} big
 */
ComplexCurves.prototype.exportScreenshot = function(name = "surface.png",
    big = false) {
    var complexCurves = this;
    var stategl = this.stategl;
    stategl.withRenderToTexture(function() {
        complexCurves.renderSurface();
    }, big);
    var pixels = /** @type {Uint8Array} */
        (stategl.readTexture(big ? stategl.rttBigTexture : stategl.rttTexture));
    Export.download(name, Export.pixelsToImageDataURL(pixels));
};

/**
 * @param {string=} name
 * @param {boolean=} big
 */
ComplexCurves.prototype.exportSurface = function(name = "surface", big = true) {
    var gl = this.stategl;
    gl.renderer.exportSurface(gl, name, big);
};

ComplexCurves.prototype.registerEventHandlers = function() {
    var canvas = this.canvas,
        state3d = this.state3d,
        gl = this.stategl;
    var complexCurves = this;
    /** @type {function(!Event) : undefined} */
    this.mousedownHandler = function(evt) {
        evt.preventDefault();
        if (state3d.autorotate)
            return;
        state3d.mouseDown([evt.clientX, evt.clientY]);
        complexCurves.renderSurface();
    };
    /** @type {function(!Event) : undefined} */
    this.mousemoveHandler = function(evt) {
        evt.preventDefault();
        state3d.mouseMove(evt.clientX, evt.clientY);
    };
    /** @type {function(!Event) : undefined} */
    this.mouseupHandler = function(evt) {
        evt.preventDefault();
        state3d.mouseUp();
    };
    /** @type {function(!Event) : undefined} */
    this.touchstartHandler = function(evt) {
        evt.preventDefault();
        var touch = /** @type {TouchEvent} */ (evt).touches[0];
        state3d.mouseDown([touch.clientX, touch.clientY]);
        complexCurves.renderSurface();
    };
    /** @type {function(!Event) : undefined} */
    this.touchmoveHandler = function(evt) {
        evt.preventDefault();
        var touch = /** @type {TouchEvent} */ (evt).touches[0];
        state3d.mouseMove(touch.clientX, touch.clientY);
    };
    /** @type {function(!Event) : undefined} */
    this.touchendHandler = function(evt) {
        evt.preventDefault();
        state3d.mouseUp();
    };
    /** @type {function(!Event) : undefined} */
    this.wheelHandler = function(evt) {
        evt.preventDefault();
        state3d.mouseWheel( /** @type {WheelEvent} */ (evt).deltaY);
        complexCurves.renderSurface();
    };
    canvas.addEventListener('mousedown', this.mousedownHandler);
    canvas.addEventListener('mousemove', this.mousemoveHandler);
    canvas.addEventListener('mouseup', this.mouseupHandler);
    canvas.addEventListener('touchstart', this.touchstartHandler);
    canvas.addEventListener('touchmove', this.touchmoveHandler);
    canvas.addEventListener('touchend', this.touchendHandler);
    canvas.addEventListener('wheel', this.wheelHandler);
};

ComplexCurves.prototype.renderSurface = function() {
    var state3d = this.state3d,
        gl = this.stategl;
    var complexCurves = this;
    gl.renderSurface(state3d);
    if (state3d.isRotating()) {
        state3d.updateRotation();
        requestAnimationFrame(function() {
            complexCurves.renderSurface();
        });
    }
};

ComplexCurves.prototype.rotateBack = function() {
    this.rotateLatLong(Math.PI / 2, Math.PI);
};

ComplexCurves.prototype.rotateBottom = function() {
    this.rotateLatLong(Math.PI, 0);
};

ComplexCurves.prototype.rotateDefault = function() {
    this.rotateLatLong(defaultLat, defaultLon);
};

ComplexCurves.prototype.rotateFront = function() {
    this.rotateLatLong(Math.PI / 2, 0);
};

/**
 * @param {number} lat
 * @param {number} lon
 */
ComplexCurves.prototype.rotateLatLong = function(lat, lon) {
    this.state3d.autorotate = false;
    this.state3d.target1 = this.state3d.target0 = this.state3d.rotation;
    this.state3d.target1 = Quaternion.fromLatLong(lat, lon);
    this.renderSurface();
};

ComplexCurves.prototype.rotateLeft = function() {
    this.rotateLatLong(Math.PI / 2, -Math.PI / 2);
};

ComplexCurves.prototype.rotateRight = function() {
    this.rotateLatLong(Math.PI / 2, Math.PI / 2);
};

ComplexCurves.prototype.rotateTop = function() {
    this.rotateLatLong(0, 0);
};

/** @param {boolean} fxaa */
ComplexCurves.prototype.setAntialiasing = function(fxaa) {
    this.stategl.setAntialiasing(fxaa);
    this.renderSurface();
};

/** @param {boolean} autorotate */
ComplexCurves.prototype.setAutorotate = function(autorotate) {
    this.state3d.setAutorotate(autorotate);
    this.renderSurface();
};

/** @param {boolean} clipping */
ComplexCurves.prototype.setClipping = function(clipping) {
    this.stategl.setClipping(clipping);
    this.renderSurface();
};

/**
 * @param {number} lat
 * @param {number} lon
 */
ComplexCurves.prototype.setLatLong = function(lat, lon) {
    var q = Quaternion.fromLatLong(lat, lon);
    this.state3d.autorotate = false;
    this.state3d.rotating = false;
    this.state3d.rotation = this.state3d.target1 = q;
    this.renderSurface();
};

/** @param {boolean} ortho */
ComplexCurves.prototype.setOrtho = function(ortho) {
    this.state3d.setOrtho(ortho);
    this.renderSurface();
};

/** @param {boolean} transparency */
ComplexCurves.prototype.setTransparency = function(transparency) {
    this.stategl.setTransparency(transparency);
    this.renderSurface();
};

/** @param {number} zoomLevel */
ComplexCurves.prototype.setZoom = function(zoomLevel) {
    this.state3d.updateZoom(zoomLevel || 1);
    this.renderSurface();
};

ComplexCurves.prototype.toggleAntialiasing = function() {
    this.stategl.toggleAntialiasing();
    this.renderSurface();
};

ComplexCurves.prototype.toggleAutorotate = function() {
    this.state3d.toggleAutorotate();
    this.renderSurface();
};

ComplexCurves.prototype.toggleClipping = function() {
    this.stategl.toggleClipping();
    this.renderSurface();
};

ComplexCurves.prototype.toggleOrtho = function() {
    this.state3d.toggleOrtho();
    this.renderSurface();
};

ComplexCurves.prototype.toggleTransparency = function() {
    this.stategl.toggleTransparency();
    this.renderSurface();
};

ComplexCurves.prototype.unregisterEventHandlers = function() {
    var canvas = this.canvas;
    canvas.removeEventListener('mousedown', this.mousedownHandler);
    canvas.removeEventListener('mousemove', this.mousemoveHandler);
    canvas.removeEventListener('mouseup', this.mouseupHandler);
    canvas.removeEventListener('touchstart', this.touchstartHandler);
    canvas.removeEventListener('touchmove', this.touchmoveHandler);
    canvas.removeEventListener('touchend', this.touchendHandler);
    canvas.removeEventListener('wheel', this.wheelHandler);
};
