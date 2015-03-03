/**
 * @param {Viewer} viewer
 * @constructor
 * @extends {PrimitiveRenderer}
 */
function Triangles(viewer) {
  this.init(viewer.gl.TRIANGLES, viewer);
}

Triangles.prototype = new PrimitiveRenderer(
  ["aPos", "aNormalAndShininess", "aColor"],
  [0, 1, 2]);

/** @type {string} */
Triangles.prototype.vertexShaderCode = c3d_resources.triangle_vert;

/** @type {string} */
Triangles.prototype.fragmentShaderCode =
  c3d_resources.common_frag + "\n" + c3d_resources.triangle_frag;

/**
 * @param {Array.<number>} p1
 * @param {Array.<number>} p2
 * @param {Array.<number>} p3
 * @param {Array.<number>} n1
 * @param {Array.<number>} n2
 * @param {Array.<number>} n3
 * @param {Appearance} appearance
 */
Triangles.prototype.addWithNormals = function(
  p1, p2, p3, n1, n2, n3, appearance)
{
  let color = appearance.color, s = appearance.shininess;
  let r = color[0], g = color[1], b = color[2], a = appearance.alpha;
  if (a < 1.0)
    this.opaque = false;
  this.addPrimitive([
    p1[0], p1[1], p1[2], p1[3], n1[0], n1[1], n1[2], s, r, g, b, a,
    p2[0], p2[1], p2[2], p2[3], n2[0], n2[1], n2[2], s, r, g, b, a,
    p3[0], p3[1], p3[2], p3[3], n3[0], n3[1], n3[2], s, r, g, b, a,
  ]);
};

/**
 * @param {Array.<number>} pos1
 * @param {Array.<number>} pos2
 * @param {Array.<number>} pos3
 * @param {Appearance} appearance
 */
Triangles.prototype.addAutoNormal = function(pos1, pos2, pos3, appearance) {
  let p1 = dehom3(pos1), v = sub3(dehom3(pos2), p1), w = sub3(dehom3(pos3), p1);
  let n = normalized3(cross3(v, w));
  this.addWithNormals(pos1, pos2, pos3, n, n, n, appearance);
};

/**
 * @param {Viewer} viewer
 */
Triangles.prototype.render = function(viewer) {
  this.renderPrimitives(viewer.gl, viewer.setUniforms.bind(viewer));
};
