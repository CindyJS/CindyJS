/**
 * @param {Viewer} viewer
 * @constructor
 * @extends {PrimitiveRenderer}
 */
function Triangles(viewer) {
  this.init(viewer.gl.TRIANGLES, viewer);
}

Triangles.prototype = new PrimitiveRenderer(
  ["aPos", "aNormal", "aColor"],
  [0, 1, 2]);

/** @type {string} */
Triangles.prototype.vertexShaderCode = c3d_resources.triangle_vert;

/** @type {string} */
Triangles.prototype.fragmentShaderCode =
  c3d_resources.common_frag + "\n" + c3d_resources.triangle_frag;

/**
 * @param {Array.<number>} pos1
 * @param {Array.<number>} pos2
 * @param {Array.<number>} pos3
 * @param {Appearance} appearance
 */
Triangles.prototype.add = function(pos1, pos2, pos3, appearance) {
  let p1 = dehom3(pos1), v = sub3(dehom3(pos2), p1), w = sub3(dehom3(pos3), p1);
  let n = normalized3(cross3(v, w)), nx = n[0], ny = n[1], nz = n[2];
  let color = appearance.color;
  let r = color[0], g = color[1], b = color[2], a = appearance.alpha;
  if (a < 1.0)
    this.opaque = false;
  this.addPrimitive([
    pos1[0], pos1[1], pos1[2], pos1[3], nx, ny, nz, 0, r, g, b, a,
    pos2[0], pos2[1], pos2[2], pos2[3], nx, ny, nz, 0, r, g, b, a,
    pos3[0], pos3[1], pos3[2], pos3[3], nx, ny, nz, 0, r, g, b, a,
  ]);
};

/**
 * @param {Viewer} viewer
 */
Triangles.prototype.render = function(viewer) {
  this.renderPrimitives(viewer.gl, viewer.setUniforms.bind(viewer));
};
