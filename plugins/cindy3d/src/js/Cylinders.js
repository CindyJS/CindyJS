/**
 * @param {Viewer} viewer
 * @constructor
 * @extends {PrimitiveRenderer}
 */
function Cylinders(viewer) {
    this.init(viewer.gl.TRIANGLE_STRIP, viewer);
}

Cylinders.prototype = new PrimitiveRenderer(
    ["aPoint1", "aPoint2", "aColor", "aRelativeRadius", "aShininess"],
    [0, 0, 2, 4, 6, 7, 2, 3, 1, 7, 5, 4, 1, 0, 2, 2]
);
// Element pattern: http://stackoverflow.com/a/28375339/1468366

/** @type {string} */
Cylinders.prototype.vertexShaderCode = c3d_resources.cylinder_vert;

/** @type {string} */
Cylinders.prototype.fragmentShaderCode = c3d_resources.common_frag + "\n" + c3d_resources.cylinder_frag;

/**
 * @param {Array.<number>} pos1
 * @param {Array.<number>} pos2
 * @param {Appearance} appearance
 */
Cylinders.prototype.add = function (pos1, pos2, appearance) {
    let x1 = pos1[0],
        y1 = pos1[1],
        z1 = pos1[2],
        w1 = pos1[3];
    let x2 = pos2[0],
        y2 = pos2[1],
        z2 = pos2[2],
        w2 = pos2[3];
    let color = appearance.color,
        s = appearance.shininess;
    let radius = appearance.size;
    let r = color[0],
        g = color[1],
        b = color[2],
        a = appearance.alpha;
    if (a < 1.0) this.opaque = false;
    this.addPrimitive([
        x1,
        y1,
        z1,
        w1,
        x2,
        y2,
        z2,
        w2,
        r,
        g,
        b,
        a,
        1.0,
        1.0,
        1.0,
        radius,
        s,
        0,
        0,
        0,
        x1,
        y1,
        z1,
        w1,
        x2,
        y2,
        z2,
        w2,
        r,
        g,
        b,
        a,
        1.0,
        1.0,
        -1.0,
        radius,
        s,
        0,
        0,
        0,
        x1,
        y1,
        z1,
        w1,
        x2,
        y2,
        z2,
        w2,
        r,
        g,
        b,
        a,
        1.0,
        -1.0,
        1.0,
        radius,
        s,
        0,
        0,
        0,
        x1,
        y1,
        z1,
        w1,
        x2,
        y2,
        z2,
        w2,
        r,
        g,
        b,
        a,
        1.0,
        -1.0,
        -1.0,
        radius,
        s,
        0,
        0,
        0,
        x1,
        y1,
        z1,
        w1,
        x2,
        y2,
        z2,
        w2,
        r,
        g,
        b,
        a,
        -1.0,
        1.0,
        1.0,
        radius,
        s,
        0,
        0,
        0,
        x1,
        y1,
        z1,
        w1,
        x2,
        y2,
        z2,
        w2,
        r,
        g,
        b,
        a,
        -1.0,
        1.0,
        -1.0,
        radius,
        s,
        0,
        0,
        0,
        x1,
        y1,
        z1,
        w1,
        x2,
        y2,
        z2,
        w2,
        r,
        g,
        b,
        a,
        -1.0,
        -1.0,
        1.0,
        radius,
        s,
        0,
        0,
        0,
        x1,
        y1,
        z1,
        w1,
        x2,
        y2,
        z2,
        w2,
        r,
        g,
        b,
        a,
        -1.0,
        -1.0,
        -1.0,
        radius,
        s,
        0,
        0,
        0,
    ]);
};

/**
 * @param {Viewer} viewer
 */
Cylinders.prototype.render = function (viewer) {
    if (this.count === 0) return;
    let gl = viewer.gl;
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    this.renderPrimitives(gl, viewer.setUniforms.bind(viewer));
    gl.disable(gl.CULL_FACE);
};
