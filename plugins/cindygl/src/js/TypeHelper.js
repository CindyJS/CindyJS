/* types */
let list = (n, type) => ({
    type: "list",
    length: n,
    parameters: type,
});

let constant = (value) => ({
    /* variables that are constant in GLSL */ type: "constant",
    value: value,
});

let constint = (n) =>
    constant({
        ctype: "number",
        value: {
            real: n,
            imag: 0,
        },
    });
const type = {
    //assert all indices are different
    bool: 1,
    int: 2,
    float: 3,
    complex: 4,
    voidt: 5,
    color: 6, //color is the color type of glsl. CindyJS-colors are vec3
    point: 7,
    line: 8,
    coordinate2d: 9, //for accessing 2D textures
    image: 10,

    vec2: list(2, 3),
    vec3: list(3, 3),
    vec4: list(4, 3),
    vec: (n) => list(n, 3),
    cvec: (n) => list(n, 4),

    mat2: list(2, list(2, 3)),
    mat3: list(3, list(3, 3)),
    mat4: list(4, list(4, 3)),
    // positivefloat: 14 //@TODO: positive int < int, positive real < real. positivefloat+ positivefloat = positivefloat...
    // nonnegativefloat: 15 //@TODO: negative float...
};
Object.freeze(type);

function typeToString(t) {
    if (1 <= t && t <= 10) {
        let l = ["bool", "int", "float", "complex", "voidt", "color", "point", "line", "coordinate2d", "image"];
        return l[t - 1];
    } else {
        if (t.type === "list") return `${typeToString(t.parameters)}[${t.length}]`;
        if (t.type === "constant") return `const[${JSON.stringify(t.value["value"])}]`;
        return JSON.stringify(t); //TODO
    }
}

/* checks wheather t can be embedded is a R-vectorspace (but not an C-vectorspace)*/
let isrvectorspace = (t) => (t.type === "list" && isrvectorspace(t.parameters)) || issubtypeof(t, type.float);
/* checks wheather t can be embedded into an C-vectorspace*/
let iscvectorspace = (t) => (t.type === "list" && iscvectorspace(t.parameters)) || issubtypeof(t, type.complex);

/* checks whether t is a constant integer */
let isconstantint = (t) => t.type === "constant" && issubtypeof(t, type.int);

/*generalizes constants to non-constant types and leaves other types unaffected */
let generalize = (t) => (t.type === "constant" ? guessTypeOfValue(t.value) : t);

/* depth of an list construct */
let depth = (t) => (t.type === "list" ? depth(t.parameters) + 1 : 0);
let finalparameter = (t) => (t.parameters !== undefined ? finalparameter(t.parameters) : t);
let dimensionsmatch = (a, b) =>
    depth(a) === depth(b) && (depth(a) === 0 || (a.length === b.length && dimensionsmatch(a.parameters, b.parameters)));

/* get the smallest R-vectorspace that contains t */
let getrvectorspace = (t) =>
    issubtypeof(t, type.float)
        ? type.float
        : issubtypeof(t, type.complex)
        ? type.complex
        : {
              type: "list",
              length: t.length,
              parameters: getrvectorspace(t.parameters),
          };

/* get the smallest C-vectorspace that contains t */
let getcvectorspace = (t) =>
    issubtypeof(t, type.complex)
        ? type.complex
        : {
              type: "list",
              length: t.length,
              parameters: getcvectorspace(t.parameters),
          };

let replaceCbyR = (t) =>
    t === type.complex
        ? type.float
        : {
              type: "list",
              length: t.length,
              parameters: replaceCbyR(t.parameters),
          };

/* is t implementented in native glsl, as bool, float, int, vec2, vec3, vec4, mat2, mat3, mat4 */
let isnativeglsl = (t) =>
    (t.type === "constant" && isnativeglsl(generalize(t))) ||
    t === type.bool ||
    t === type.int ||
    t === type.float ||
    t === type.complex ||
    t === type.point ||
    t === type.line ||
    (t.type === "list" && t.parameters === type.float && 1 <= t.length && t.length <= 4) ||
    (t.type === "list" &&
        t.parameters.type === "list" &&
        t.parameters.parameters === type.float &&
        t.length === t.parameters.length &&
        2 <= t.length &&
        t.length <= 4);

let isprimitive = (a) => [type.bool, type.int, type.float, type.complex].indexOf(a) !== -1;

let typesareequal = (a, b) =>
    a === b ||
    (a.type === "constant" && b.type === "constant" && expressionsAreEqual(a.value, b.value)) ||
    (a.type === "list" && b.type === "list" && a.length === b.length && typesareequal(a.parameters, b.parameters));

function issubtypeof(a, b) {
    if (typesareequal(a, b)) return true;
    if (!a) return false; //unset/false is not subtype of any type

    if (isprimitive(a) && isprimitive(b)) {
        //if (subtype[a] === undefined) return false;
        //return (subtype[a][b] < oo);
        return a <= b;
    }
    if (b.type === "constant") return false; //if a is a subtype of b then typesareequal(a, b), which we already checked
    if (a.type === "constant") return issubtypeof(guessTypeOfValue(a.value), b);

    if (b === type.coordinate2d)
        return issubtypeof(a, type.complex) || issubtypeof(a, type.vec2) || issubtypeof(a, type.point);
    if (b === type.point) return issubtypeof(a, type.vec3) || issubtypeof(a, type.vec2);
    if (b === type.line) return issubtypeof(a, type.vec3);
    if (b === type.color)
        return (
            issubtypeof(a, type.float) ||
            (a.type === "list" && (a.length === 3 || a.length === 4) && issubtypeof(a.parameters, type.float))
        );

    if (a.type === "list" && b.type === "list" && a.length === b.length) {
        return issubtypeof(a.parameters, b.parameters);
    }

    return false;
}

function lca(a, b) {
    if (!a) return b;
    if (!b) return a;
    if (typesareequal(a, b)) {
        return a;
    }
    if (a.type === "constant") a = guessTypeOfValue(a.value);
    if (b.type === "constant") b = guessTypeOfValue(b.value);

    if (isprimitive(a) && isprimitive(b)) {
        return Math.max(a, b);
    }

    if (a.type === "list" && b.type === "list" && a.length === b.length) {
        let st = lca(a.parameters, b.parameters);
        if (!st) return false;
        else
            return {
                type: "list",
                length: a.length,
                parameters: st,
            };
    }

    return false;
}

function first(signatures) {
    return (args) => {
        for (let i in signatures) {
            let cur = signatures[i];
            let reqargs = cur[0];
            if (args.length == reqargs.length && args.every((elem, index) => issubtypeof(elem, reqargs[index]))) {
                return {
                    args: reqargs,
                    res: cur[1],
                    generator: cur[2],
                };
            }
        }
        return false;
    };
}

function inclusionfunction(toType) {
    switch (toType) {
        case type.int:
            return first([[[type.bool], type.int, usefunction("int")]]);
        case type.float:
            return first([
                [[type.bool], type.float, usefunction("float")],
                [[type.int], type.float, usefunction("float")],
            ]);
        case type.complex:
            return first([[[type.float], type.complex, (f) => `vec2(${f}, 0.)`]]);
        case type.color:
            return first([
                [[type.float], type.color, useincludefunction("float2color")],
                [[type.vec3], type.color, (v) => `vec4(${v},1.0)`],
                [[type.vec4], type.color, identity],
            ]);
        case type.point:
            return first([
                [[type.vec2], type.point, (v) => `vec3(${v},1.0)`],
                [[type.vec3], type.point, identity],
            ]);
        case type.line:
            return first([
                [[type.vec2], type.line, (v) => `vec3(${v},1.0)`],
                [[type.vec3], type.line, identity],
            ]);
        case type.coordinate2d:
            return first([
                [[type.complex], type.coordinate2d, identity],
                [[type.vec2], type.coordinate2d, identity],
                [[type.point], type.coordinate2d, useincludefunction("dehomogenize")],
            ]);
        default:
            if (toType.type === "list") {
                let fp = finalparameter(toType);

                return (args) => {
                    let fromType = args[0];
                    let rec = inclusionfunction(toType.parameters)([fromType.parameters]).generator;
                    return {
                        args: args,
                        res: toType,
                        generator: (list, modifs, codebuilder) =>
                            uselist(toType)(
                                range(toType.length).map((k) =>
                                    rec([accesslist(fromType, k)([list], modifs, codebuilder)], modifs, codebuilder)
                                ),
                                modifs,
                                codebuilder
                            ),
                    };
                };
            }
    }

    console.log(`no inclusionfunction ->${typeToString(toType)} implemented yet; using identity...`);
    return (args) => ({
        args: args,
        res: toType,
        generator: identity,
    });
}

function webgltype(ctype) {
    ctype = generalize(ctype);
    switch (ctype) {
        case type.bool:
            return "bool";
        case type.int:
            return "int";
        case type.float:
            return "float";
        case type.complex:
        case type.coordinate2d:
            return "vec2";
        case type.voidt:
            return "void";
        case type.color:
            return "vec4";
        case type.point:
        case type.line:
            return "vec3";
    }
    if (ctype.type === "list" && ctype.parameters === type.float) {
        if (ctype.length == 1) return "float";
        else return `vec${ctype.length}`;
    } else if (ctype.type === "list" && ctype.parameters === type.complex) {
        return `cvec${ctype.length}`;
    } else if (
        ctype.type === "list" &&
        ctype.parameters.type === "list" &&
        ctype.length === ctype.parameters.length &&
        ctype.parameters.parameters === type.float
    ) {
        switch (ctype.length) {
            case 2:
                return "mat2";
            case 3:
                return "mat3";
            case 4:
                return "mat4";
        }
    }
    if (ctype.type === "list") {
        return `l${ctype.length}_${webgltype(ctype.parameters)}`;
    }

    console.error(`No WebGL implementation for type ${typeToString(ctype)} found`);
}

function pastevalue(val, toType) {
    switch (toType) {
        case type.bool:
            return `${webgltype(toType)}(${val["value"]})`;
        case type.int:
            return `${val["value"]["real"] | 0}`;
        case type.float:
            return `${webgltype(toType)}(${val["value"]["real"]})`;
        case type.complex:
            return `${webgltype(toType)}(${val["value"]["real"]}, ${val["value"]["imag"]})`;
        case type.color:
            let f = val["value"]["real"];
            return `vec4(${f},${f},${f},1.)`;
        default:
            console.error(`Dont know how to paste values of Type ${typeToString(toType)} yet.`);
    }
}
