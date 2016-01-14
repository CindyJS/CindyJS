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
 * @param {Array.<number>} p1
 * @param {Array.<number>} p2
 * @param {Array.<number>} p3
 * @param {Array.<number>} n1
 * @param {Array.<number>} n2
 * @param {Array.<number>} n3
 * @param {Array.<number>} c1
 * @param {Array.<number>} c2
 * @param {Array.<number>} c3
 * @param {Appearance} appearance
 */
Triangles.prototype.addWithNormalsAndColors = function(
  p1, p2, p3, n1, n2, n3, c1, c2, c3, appearance)
{
  let s = appearance.shininess, a = appearance.alpha;
  if (a < 1.0)
    this.opaque = false;
  this.addPrimitive([
    p1[0], p1[1], p1[2], p1[3], n1[0], n1[1], n1[2], s, c1[0], c1[1], c1[2], a,
    p2[0], p2[1], p2[2], p2[3], n2[0], n2[1], n2[2], s, c2[0], c2[1], c2[2], a,
    p3[0], p3[1], p3[2], p3[3], n3[0], n3[1], n3[2], s, c3[0], c3[1], c3[2], a,
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
 * @param {Array.<Array.<number>>} pos
 * @param {Appearance} appearance
 */
Triangles.prototype.addPolygonAutoNormal = function(pos, appearance) {
  if (pos.length == 3)
    return this.addAutoNormal(pos[0], pos[1], pos[2], appearance);
  let k = pos.length, p = Array(k + 2), i, n = [0, 0, 0];
  for (i = 0; i < k; ++i)
    p[i] = dehom3(pos[i]);
  p[k] = p[0];
  p[k + 1] = p[1];
  for (i = 1; i <= k; ++i)
    n = add3(n, cross3(sub3(p[i], p[i - 1]), sub3(p[i], p[i + 1])));
  if (k == 4) {
    this.addWithNormals(pos[0], pos[1], pos[3], n, n, n, appearance);
    this.addWithNormals(pos[3], pos[1], pos[2], n, n, n, appearance);
    return;
  }
  let center = [0, 0, 0, 0], prev = pos[k - 1];
  for (i = 0; i < k; ++i)
    center = add4(center, pos[i]);
  for (i = 0; i < k; ++i) {
    this.addWithNormals(prev, pos[i], center, n, n, n, appearance);
    prev = pos[i];
  }
};

/**
 * @param {Array.<Array.<number>>} pos
 * @param {Array.<Array.<number>>} n
 * @param {Appearance} appearance
 */
Triangles.prototype.addPolygonWithNormals = function(pos, n, appearance) {
  if (pos.length == 3)
    return this.addWithNormals(
      pos[0], pos[1], pos[2], n[0], n[1], n[2], appearance);
  if (pos.length == 4) {
    this.addWithNormals(pos[0], pos[1], pos[3], n[0], n[1], n[3], appearance);
    this.addWithNormals(pos[3], pos[1], pos[2], n[3], n[1], n[2], appearance);
    return;
  }
  let k = pos.length, i, center = [0, 0, 0, 0], cn = [0, 0, 0];
  for (i = 0; i < k; ++i) {
    center = add4(center, pos[i]);
    cn = add3(cn, n[i]);
  }
  let pp = pos[k - 1], pn = n[k - 1];
  for (i = 0; i < k; ++i) {
    this.addWithNormals(pp, pos[i], center, pn, n[i], cn, appearance);
    pp = pos[i];
    pn = n[i];
  }
};

/**
 * @param {Array.<Array.<number>>} pos
 * @param {Array.<Array.<number>>} n
 * @param {Array.<Array.<number>>} c
 * @param {Appearance} appearance
 */
Triangles.prototype.addPolygonWithNormalsAndColors = function(pos, n, c, appearance) {
  if (pos.length == 3)
    return this.addWithNormalsAndColors(
      pos[0], pos[1], pos[2], n[0], n[1], n[2], c[0], c[1], c[2], appearance);
  if (pos.length == 4) {
    this.addWithNormalsAndColors(pos[0], pos[1], pos[3], n[0], n[1], n[3], c[0], c[1], c[3], appearance);
    this.addWithNormalsAndColors(pos[3], pos[1], pos[2], n[3], n[1], n[2], c[3], c[1], c[2], appearance);
    return;
  }
  console.error("addPolygonWithNormalsAndColors not supported for more than 4 corners");
};

/** @type {?createCindy.img} */
Triangles.prototype.texture = null;

/** @type {?WebGLTexture} */
Triangles.prototype.textureObj = null;

/**
 * @param {Viewer} viewer
 */
Triangles.prototype.render = function(viewer) {
  const gl = viewer.gl;
  if (this.texture) {
    if (this.textureObj === null) {
      this.textureObj = gl.createTexture();
    }
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.textureObj);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                     gl.LINEAR_MIPMAP_LINEAR);
    gl.hint(gl.GENERATE_MIPMAP_HINT, gl.NICEST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
                  this.texture);
    gl.generateMipmap(gl.TEXTURE_2D);
    this.renderPrimitives(gl, u => {
      viewer.setUniforms(u);
      u["uTextured"]([true]);
      u["uTexture"]([0]);
    });
    gl.bindTexture(gl.TEXTURE_2D, null);
  } else {
    this.renderPrimitives(gl, u => {
      viewer.setUniforms(u);
      u["uTextured"]([false]);
    });
  }
};
