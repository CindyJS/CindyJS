/**
 * @param {CanvasWrapper} canvaswrapper
 * @param {string} name
 * @constructor
 */
function TextureReader(name, canvaswrapper) {
    this.name = name;
    this.code = [
        'uniform sampler2D _sampler', name, ';',
        'uniform float _ratio', name, ';',
        'uniform vec2 _cropfact', name, ';',
        'vec4 _imagergba', name, '(vec2 A, vec2 B, vec2 p) {',
        'p -= A; B -= A;',
        //'B.y *= _ratio', name,';',
        //'p.y *= _ratio', name,';',
        'float b = dot(B,B);',
        'p = vec2(dot(p,B),_ratio', name, '*dot(p,vec2(-B.y,B.x)))/b;',
        'if(0. <= p.x && p.x <= 1. && 0. <= p.y && p.y <= 1.)',
        'return texture2D(_sampler', name, ', p*_cropfact', name, ');',
        'else return vec4(0.);',
        '}',
        'vec3 _imagergb', name, '(vec2 A, vec2 B, vec2 p) {',
        'return _imagergba', name, '(A, B, p).rgb;',
        '}'
    ].join('');
    this.canvaswrapper = canvaswrapper;
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
 * @type {CanvasWrapper}
 */
TextureReader.prototype.canvaswrapper;

/**
 * Either takes original name of the image or generates a new unique name for the image for nameless imageobjects.
 * @type {createCindy.image|string} image
 */
function getNameFromImage(image) {
    if (typeof image === "string") {
        return image;
    } else {
        if (!image.hasOwnProperty('name')) image['name'] = generateUniqueHelperString();
        return image['name'];
    }
}


function useimagergba4(args, codebuilder) {
    let imageobject = args[2];
    let name = getNameFromImage(args[2]);

    if (typeof imageobject === "string") {
        imageobject = codebuilder.api.getImage(name, true);
    }

    if (imageobject == null) {
        console.error("Could not find image " + name + ".");
        return nada;
    }

    let canvaswrapper = generateCanvasWrapperIfRequired(imageobject, codebuilder.api);

    if (!codebuilder.texturereaders.hasOwnProperty(name)) {
        codebuilder.texturereaders[name] = new TextureReader(name, canvaswrapper);
    }
    return ['_imagergba', name, '(', args[0], ',', args[1], ',', args[3], ')'].join('');
}


function useimagergb4(args, codebuilder) {
    let name = getNameFromImage(args[2]);
    useimagergba4(args, codebuilder);
    return ['_imagergb', name, '(', args[0], ',', args[1], ',', args[3], ')'].join('');
}

function useimagergba2(args, codebuilder) {
    let name = getNameFromImage(args[0]);
    useimagergba4(['', ''].concat(args), codebuilder);
    let a = computeLowerLeftCorner(codebuilder.api);
    let b = computeLowerRightCorner(codebuilder.api);
    return ['_imagergba', name, '(vec2(', a.x, ',', a.y, '),vec2(', b.x, ',', b.y, '), ', args[1], ')'].join('');
}

function useimagergb2(args, codebuilder) {
    let name = getNameFromImage(args[0]);
    useimagergba4(['', ''].concat(args), codebuilder);
    let a = computeLowerLeftCorner(codebuilder.api);
    let b = computeLowerRightCorner(codebuilder.api);
    return ['_imagergb', name, '(vec2(', a.x, ',', a.y, '),vec2(', b.x, ',', b.y, '), ', args[1], ')'].join('');
}


function generateHeaderOfTextureReaders(codebuilder) {
    let ans = '';
    for (let t in codebuilder.texturereaders) {
        ans += codebuilder.texturereaders[t].code + '\n';
    }
    return ans;
};
