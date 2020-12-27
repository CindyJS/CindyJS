/**
 * @param {Viewer} viewer
 * @constructor
 * @extends {PrimitiveRenderer}
 */
function Spheres(viewer) {
    this.init(viewer.gl.TRIANGLES, viewer);
}

Spheres.prototype = new PrimitiveRenderer(["aCenter", "aColor", "aRelativeShininessRadius"], [0, 1, 2, 2, 1, 3]);

/** @type {string} */
Spheres.prototype.vertexShaderCode = c3d_resources.sphere_vert;

/** @type {string} */
Spheres.prototype.fragmentShaderCode = c3d_resources.common_frag + "\n" + c3d_resources.sphere_frag;

/**
 * @param {Array.<number>} pos
 * @param {number} radius
 * @param {Appearance} appearance
 */
Spheres.prototype.add = function (pos, radius, appearance) {
    let x = pos[0],
        y = pos[1],
        z = pos[2],
        w = pos[3];
    let color = appearance.color,
        s = appearance.shininess;
    let r = color[0],
        g = color[1],
        b = color[2],
        a = appearance.alpha;
    if (a < 1.0) this.opaque = false;
    this.addPrimitive([
        x,
        y,
        z,
        w,
        r,
        g,
        b,
        a,
        1.0,
        1.0,
        s,
        radius,
        x,
        y,
        z,
        w,
        r,
        g,
        b,
        a,
        -1.0,
        1.0,
        s,
        radius,
        x,
        y,
        z,
        w,
        r,
        g,
        b,
        a,
        1.0,
        -1.0,
        s,
        radius,
        x,
        y,
        z,
        w,
        r,
        g,
        b,
        a,
        -1.0,
        -1.0,
        s,
        radius,
    ]);
};

/**
 * @param {Viewer} viewer
 * @param {number} mode
 */
Spheres.prototype.render = function (viewer, mode) {
    this.renderPrimitives(viewer.gl, (u) => {
        viewer.setUniforms(u);
        u["sphereMode"]([mode]);
    });
};
