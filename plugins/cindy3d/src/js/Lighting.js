/**
 * @constructor
 * @struct
 */
function Lighting() {
  this.ambient = [0, 0, 0];
  this.lights = [new CameraPointLight([0, 0, 0, 1], [1, 1, 1], [1, 1, 1])];
  this.modified = false;
}

/** @type {Array.<number>} */
Lighting.prototype.ambient;

/** @type {Array.<Light>} */
Lighting.prototype.lights;

/** @type {boolean} */
Lighting.prototype.modified;

/**
 * @param {number} i
 * @param {Light} l
 */
Lighting.prototype.setLight = function(i, l) {
  this.modified =
    (!l !== !this.lights[i]) || (!!l && this.lights[i].type !== l.type);
  this.lights[i] = l;
};

/**
 * @return {string}
 */
Lighting.prototype.shaderCode = function() {
  let vars = "", code = "";
  for (let i = 0; i < this.lights.length; ++i) {
    if (this.lights[i]) {
      vars += this.lights[i].shaderVars(i);
      code += this.lights[i].shaderCode(i);
    }
  }
  return vars + "void lightScene() {\n" + code + "}";
};

/**
 * @param {Object} u
 */
Lighting.prototype.setUniforms = function(u) {
  u["uAmbient"](this.ambient);
  for (let i = 0; i < this.lights.length; ++i)
    if (this.lights[i])
      this.lights[i].setUniforms(u, i);
};

/**
 * @param {string} type
 * @param {Array.<string>} args
 * @constructor
 */
function Light(type, args) {
  this.type = type;
  this.args = args;
}

/** @type {string} */
Light.prototype.type;

/** @type {Array.<string>} */
Light.prototype.args;

/** @enum {string} */
Light.prototype.typeMap = {
  "uDiffuse": "vec3",
  "uSpecular": "vec3",
  "uLightPos": "vec4",
  "uSpotPos": "vec4",
  "uSpotCosCutoff": "float",
  "uSpotExponent": "float",
};

/**
 * @param {number} i
 * @return {string}
 */
Light.prototype.shaderCode = function(i) {
  return "  " + this.type + "(" + this.args.map(
    a => a + i).join(", ") + ");\n";
};

/**
 * @param {number} i
 * @return {string}
 */
Light.prototype.shaderVars = function(i) {
  return this.args.map(
    a => "uniform " + this.typeMap[a] + " " + a + i + ";\n").join("");
};

/**
 * @param {Object} u
 * @param {number} i
 */
Light.prototype.setUniforms = function(u, i) {
  this.args.forEach(a => u[a + i](this[a]));
};

/**
 * @constructor
 * @extends Light
 * @param {Array.<number>} pos
 * @param {Array.<number>} diffuse
 * @param {Array.<number>} specular
 */
function CameraPointLight(pos, diffuse, specular) {
  this["uLightPos"] = pos;
  this["uDiffuse"] = diffuse;
  this["uSpecular"] = specular;
}

CameraPointLight.prototype = new Light(
  "cameraPointLight", ["uLightPos", "uDiffuse", "uSpecular"]);

/**
 * @constructor
 * @extends Light
 * @param {Array.<number>} pos
 * @param {Array.<number>} diffuse
 * @param {Array.<number>} specular
 */
function WorldPointLight(pos, diffuse, specular) {
  this["uLightPos"] = pos;
  this["uDiffuse"] = diffuse;
  this["uSpecular"] = specular;
}

WorldPointLight.prototype = new Light(
  "worldPointLight", ["uLightPos", "uDiffuse", "uSpecular"]);

/**
 * @enum {function(new:Light, Array.<number>, Array.<number>, Array.<number>)}
 */
const PointLights = {
  "camera": CameraPointLight,
  "world": WorldPointLight,
};

/**
 * @constructor
 * @extends Light
 * @param {Array.<number>} lightPos
 * @param {Array.<number>} spotPos
 * @param {number} cutoff
 * @param {number} exponent
 * @param {Array.<number>} diffuse
 * @param {Array.<number>} specular
 */
function CameraSpotLight(
  lightPos, spotPos, cutoff, exponent, diffuse, specular)
{
  this["uLightPos"] = lightPos;
  this["uSpotPos"] = spotPos;
  this["uSpotCosCutoff"] = [cutoff];
  this["uSpotExponent"] = [exponent];
  this["uDiffuse"] = diffuse;
  this["uSpecular"] = specular;
}

CameraSpotLight.prototype = new Light(
  "cameraSpotLight", [
    "uLightPos", "uSpotPos", "uSpotCosCutoff", "uSpotExponent",
    "uDiffuse", "uSpecular"]);

/**
 * @constructor
 * @extends Light
 * @param {Array.<number>} lightPos
 * @param {Array.<number>} spotPos
 * @param {number} cutoff
 * @param {number} exponent
 * @param {Array.<number>} diffuse
 * @param {Array.<number>} specular
 */
function WorldSpotLight(
  lightPos, spotPos, cutoff, exponent, diffuse, specular)
{
  this["uLightPos"] = lightPos;
  this["uSpotPos"] = spotPos;
  this["uSpotCosCutoff"] = [cutoff];
  this["uSpotExponent"] = [exponent];
  this["uDiffuse"] = diffuse;
  this["uSpecular"] = specular;
}

WorldSpotLight.prototype = new Light(
  "worldSpotLight", [
    "uLightPos", "uSpotPos", "uSpotCosCutoff", "uSpotExponent",
    "uDiffuse", "uSpecular"]);

/**
 * @enum {function(new:Light, Array.<number>, Array.<number>, number, number,
 *                 Array.<number>, Array.<number>)}
 */
const SpotLights = {
  "camera": CameraSpotLight,
  "world": WorldSpotLight,
};
