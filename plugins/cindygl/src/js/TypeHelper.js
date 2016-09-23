/* checks wheather t can be embedded is a R-vectorspace (but not an C-vectorspace)*/
let isrvectorspace = t => (t.type === 'list' && isrvectorspace(t.parameters)) || issubtypeof(t, type.float);
/* checks wheather t can be embedded into an C-vectorspace*/
let iscvectorspace = t => (t.type === 'list' && iscvectorspace(t.parameters)) || issubtypeof(t, type.complex);

/* depth of an list construct */
let depth = t => (t.type === 'list') ? depth(t.parameters) + 1 : 0;
let finalparameter = t => t.parameters ? finalparameter(t.parameters) : t;
let dimensionsmatch = (a, b) => (depth(a) === depth(b) && (depth(a) === 0 || (a.length === b.length && dimensionsmatch(a.parameters, b.parameters))));

/* get the smallest R-vectorspace that contains t */
let getrvectorspace = t => issubtypeof(t, type.float) ? type.float : issubtypeof(t, type.complex) ? type.complex : {
    type: 'list',
    length: t.length,
    parameters: getrvectorspace(t.parameters)
};

/* get the smallest C-vectorspace that contains t */
let getcvectorspace = t => issubtypeof(t, type.complex) ? type.complex : {
    type: 'list',
    length: t.length,
    parameters: getrvectorspace(t.parameters)
};

let replaceCbyR = t => t === type.complex ? type.float : {
    type: 'list',
    length: t.length,
    parameters: replaceCbyR(t.parameters)
};

/* is t implementented in native glsl, as bool, float, int, vec2, vec3, vec4, mat2, mat3, mat4 */
let isnativeglsl = t =>
    t === type.bool || t === type.int || t === type.float || t === type.complex ||
    (t.type === 'list' && t.parameters === type.float && 2 <= t.length && t.length <= 4) ||
    (t.type === 'list' && t.parameters.type === 'list' && t.parameters.parameters === type.float && t.length === t.parameters.length && 2 <= t.length && t.length <= 4);

let isprimitive = a => [type.bool, type.int, type.float, type.complex].indexOf(a) !== -1;

let typesareequal = (a, b) => (a === b) || (a.type === 'list' && b.type === 'list' && a.length === b.length && typesareequal(a.parameters, b.parameters));


function issubtypeof(a, b) {
    if (typesareequal(a, b)) return true;
    if (a === type.anytype) return true;
    if (!a) return false; //unset/false is not subtype of any type

    if (isprimitive(a) && isprimitive(b)) {
        //if (subtype[a] === undefined) return false;
        //return (subtype[a][b] < oo);
        return a <= b;
    }

    if (b === type.coordinate2d) return issubtypeof(a, type.complex) || issubtypeof(a, type.vec2) || issubtypeof(a, type.point);
    if (b === type.point) return issubtypeof(a, type.vec3);
    if (b === type.line) return issubtypeof(a, type.vec3);
    if (b === type.color) return (issubtypeof(a, type.float) || (a.type === 'list' && (a.length === 3 || a.length === 4) && issubtypeof(a.parameters, type.float)));


    if (a.type === 'list' && b.type === 'list' && a.length === b.length) {
        return issubtypeof(a.parameters, b.parameters);
    }

    return false;
}

function lca(a, b) {
    if (!a) return b;
    if (!b) return a;
    if (isprimitive(a) && isprimitive(b)) {
        return Math.max(a, b);
    }
    if (a.type === 'list' && b.type === 'list' && a.length === b.length) {
        let st = lca(a.parameters, b.parameters);
        if (!st) return false;
        else return {
            type: 'list',
            length: a.length,
            parameters: st
        };
    }
    return false;
}


function first(signatures) {
    return args => {
        for (let i in signatures) {
            let cur = signatures[i];
            let reqargs = cur[0];
            if (args.length == reqargs.length &&
                args.every((elem, index) => issubtypeof(elem, reqargs[index]))) {
                return {
                    args: reqargs,
                    res: cur[1],
                    generator: cur[2]
                };
            }
        }
        return false;
    };
}

function inclusionfunction(toType) {
    switch (toType) {
        case type.int:
            return first([
                [
                    [type.bool], type.int, usefunction('int')
                ]
            ]);
        case type.float:
            return first([
                [
                    [type.bool], type.float, usefunction('float')
                ],
                [
                    [type.int], type.float, usefunction('float')
                ]
            ]);
        case type.complex:
            return first([
                [
                    [type.float], type.complex, f => `vec2(${f}, 0.)`
                ]
            ]);
        case type.color:
            return first([
                [
                    [type.float], type.color, useincludefunction('float2color')
                ],
                [
                    [type.vec3], type.color, v => `vec4(${v},1.0)`
                ],
                [
                    [type.vec4], type.color, identity
                ],
            ]);
        case type.point:
            return first([
                [
                    [type.vec2], type.point, v => `vec3(${v},1.0)`
                ],
                [
                    [type.vec3], type.point, identity
                ]
            ]);
        case type.line:
            return first([
                [
                    [type.vec2], type.line, v => `vec3(${v},1.0)`
                ],
                [
                    [type.vec3], type.line, identity
                ]
            ]);
        case type.coordinate2d:
            return first([
                [
                    [type.complex], type.coordinate2d, identity
                ],
                [
                    [type.vec2], type.coordinate2d, identity
                ],
                [
                    [type.point], type.coordinate2d, useincludefunction('dehomogenize')
                ]
            ]);
        default:
            //real list
            if (toType.type === 'list' && issubtypeof(toType.parameters, type.float)) return args => {
                let fromType = args[0];
                if (fromType.type === 'list' && issubtypeof(fromType.parameters, type.float) && fromType.length === toType.length) {
                    return {
                        args: args,
                        res: toType,
                        generator: identity
                    };
                }
            };
            //complex list
            else if (toType.type === 'list' && toType.parameters === type.complex) return args => {
                let fromType = args[0];
                if (fromType.type === 'list' && issubtypeof(fromType.parameters, type.float) && fromType.length === toType.length) {
                    let n = toType.length;
                    return {
                        args: [list(n, type.float)],
                        res: toType,
                        generator: list => `cvec${n}(${list}, ${usevec(n)(Array(n).fill('0.'))})`
                    };
                }
            };
            //real matrix
            else if (toType.type === 'list' && toType.parameters === 'list' && issubtypeof(toType.parameters.parameters, type.float)) return args => {
                let fromType = args[0];
                if (fromType.type === 'list' && fromType.parameters === 'list' && issubtypeof(fromType.parameters.parameters, type.float) && fromType.length === toType.length && fromType.parameters.length === toType.parameters.length) {
                    return {
                        args: args,
                        res: toType,
                        generator: identity
                    };
                }
            };
            //complex matrix
            else if (toType.type === 'list' && toType.parameters === 'list' && toType.parameters.parameters === type.complex) return args => {
                let fromType = args[0];
                if (fromType.type === 'list' && fromType.parameters === 'list' && issubtypeof(fromType.parameters.parameters, type.float) && fromType.length === toType.length && fromType.parameters.length === toType.parameters.length) {
                    let n = toType.length;
                    let m = toType.parameters.length;
                    return {
                        args: [list(n, list(m, type.float))],
                        res: toType,
                        generator: list => `cmat${n}_${m}(${list}, ${usemat(n, m)(Array(n).fill(
                          usevec(m)(Array(m).fill('0.'))
                        ))})`
                    };
                }
            };
    }


    console.log(`no inclusionfunction ->${typeToString(toType)} implemented yet; using identity...`);
    return args => ({
        args: args,
        res: toType,
        generator: identity
    });
}


function webgltype(ctype) {
    switch (ctype) {
        case type.bool:
            return 'bool';
        case type.int:
            return 'int';
        case type.float:
            return 'float';
        case type.complex:
        case type.coordinate2d:
            return 'vec2';
        case type.voidt:
            return 'void';
        case type.color:
            return 'vec4';
        case type.point:
        case type.line:
            return 'vec3';
    }
    if (ctype.type === 'list' && issubtypeof(ctype.parameters, type.float)) {
        return `vec${ctype.length}`;
    } else if (ctype.type === 'list' && issubtypeof(ctype.parameters, type.complex)) {
        return `cvec${ctype.length}`;
    } else if (ctype.type === 'list' && ctype.parameters.type === 'list' && ctype.length === ctype.parameters.length && issubtypeof(ctype.parameters.parameters, type.float)) {
        switch (ctype.length) {
            case 2:
                return 'mat2';
            case 3:
                return 'mat3';
            case 4:
                return 'mat4';
        }
    }
    if (ctype.type === 'list' && ctype.parameters.type === 'list' && issubtypeof(ctype.parameters.parameters, type.float)) {
        return `mat${ctype.length}_${ctype.parameters.length}`;
    }
    if (ctype.type === 'list' && ctype.parameters.type === 'list' && issubtypeof(ctype.parameters.parameters, type.complex)) {
        return `cmat${ctype.length}_${ctype.parameters.length}`;
    }

    console.error(`No WebGL implementation for type ${typeToString(ctype)} found`);
}
