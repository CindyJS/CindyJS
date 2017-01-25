/**
 * @param {string} name the uniform variable that describes the texture
 * @constructor
 */
function TextureReader(name, expr, modifs, api) {
    this.expr = expr;
    this.api = api;
    this.modifs = modifs;

    this.name = name;
    this.code = `uniform sampler2D _sampler${name};
uniform float _ratio${name};
uniform vec2 _cropfact${name};
uniform bool _repeat${name};
uniform bool _mipmap${name};
vec4 _imagergba${name} (vec2 A, vec2 B, vec2 p) {
  p -= A; B -= A;
  float b = dot(B,B);
  p = vec2(dot(p,B),_ratio${name}*dot(p,vec2(-B.y,B.x)))/b;
  if(_repeat${name}) p = mod(p, vec2(1.));
  if(_repeat${name} && _mipmap${name}) {
    vec4 color = vec4(0.);
    float totalWeight = 0.;
    for(int dx=0; dx<2; dx++) for(int dy=0; dy<2; dy++) {
      vec2 delta = .5*vec2(dx, dy);
      vec2 center = delta+vec2(.5);
      vec2 tc = fract(p-delta)+delta;
      float dst = dot(abs(tc-center),vec2(1.));
      float w = max(.5-dst,0.);
      w=w*w;
      color += w * texture2D(_sampler${name}, tc*_cropfact${name});
      totalWeight += w;
    }
    return color/totalWeight;
  }
  if(0. <= p.x && p.x <= 1. && 0. <= p.y && p.y <= 1.)
    return texture2D(_sampler${name}, p*_cropfact${name});
  else
    return vec4(0.);
  }`;
}


/**
 * GLSL name of texture
 * @type {string}
 */
TextureReader.prototype.name;

/**
 * glsl code of the texture reader (vec 4_imagergba_NAME(vec2 A, vec2 B, vec2 p) {...})
 * @type {string}
 */
TextureReader.prototype.code;


/**
 * The expression that is encoded by the the uniform
 */
TextureReader.prototype.expr;

/**
 * The API
 */
TextureReader.prototype.api;

TextureReader.prototype.returnCanvaswrapper = function(properties) {
    let nameorimageobject = this.api.evaluateAndVal(this.expr)['value'];
    let imageobject = (typeof nameorimageobject === "string") ? this.api.getImage(nameorimageobject, true) : nameorimageobject;

    if (imageobject == null) {
        console.error(`Could not find image ${nameorimageobject}.`);
        return nada;
    }

    return generateReadCanvasWrapperIfRequired(imageobject, this.api, properties);
}

/**
 * Either takes original name of the image or generates a new unique name for the image for nameless imageobjects.
 * @type {CindyJS.image|string} image
 */
function getNameFromImage(image) {
    if (typeof image === "string") {
        return image;
    } else {
        if (!image.hasOwnProperty('name')) image['name'] = generateUniqueHelperString();
        return image['name'];
    }
}


function generateTextureReaderIfRequired(uname, modifs, codebuilder) {
    if (!codebuilder.texturereaders.hasOwnProperty(uname)) {
        codebuilder.texturereaders[uname] = [];
    }

    let idx = codebuilder.texturereaders[uname].length;
    for (let i in codebuilder.texturereaders[uname])
        if (idx == codebuilder.texturereaders[uname].length) {
            let othermodifs = codebuilder.texturereaders[uname][i].modifs;
            let iscandidate = true;
            for (let prop in ["interpolation", "mipmap", "repeat"])
                if (iscandidate) {
                    if (!expressionsAreEqual(othermodifs, modifs)) iscandidate = false;
                }
            if (iscandidate) idx = i;
        }

    let tname = `${uname}_${idx}`; //the glsl name of the texture having the uname as image and a set of modifs

    if (idx == codebuilder.texturereaders[uname].length) {
        codebuilder.texturereaders[uname].push(new TextureReader(tname, codebuilder.uniforms[uname].expr, modifs, codebuilder.api));
    }

    return tname;
}

function useimagergba4(args, modifs, codebuilder) {
    return ['_imagergba', generateTextureReaderIfRequired(args[2], modifs, codebuilder), '(', args[0], ',', args[1], ',', args[3], ')'].join('');
}


function useimagergb4(args, modifs, codebuilder) {
    return ['(_imagergba', generateTextureReaderIfRequired(args[2], modifs, codebuilder), '(', args[0], ',', args[1], ',', args[3], ').rgb)'].join('');
}

function useimagergba2(args, modifs, codebuilder) {
    codebuilder.add('uniforms', 'corners', () => 'uniform vec2 _lowerleft, _lowerright;');
    return ['_imagergba', generateTextureReaderIfRequired(args[0], modifs, codebuilder), '(_lowerleft, _lowerright, ', args[1], ')'].join('');
}

function useimagergb2(args, modifs, codebuilder) {
    codebuilder.add('uniforms', 'corners', () => 'uniform vec2 _lowerleft, _lowerright;');
    return ['(_imagergba', generateTextureReaderIfRequired(args[0], modifs, codebuilder), '(_lowerleft, _lowerright, ', args[1], ').rgb)'].join('');
}


function generateHeaderOfTextureReaders(codebuilder) {
    let ans = '';
    for (let t in codebuilder.texturereaders)
        for (let i in codebuilder.texturereaders[t]) {
            ans += `${codebuilder.texturereaders[t][i].code}\n`;
        }
    return ans;
};
