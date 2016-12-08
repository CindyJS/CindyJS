/* types */
let list = (n, type) => ({
    type: 'list',
    length: n,
    parameters: type
});

let constant = (value) => ({ /* variables that are constant in GLSL */
    type: 'constant',
    value: value
});

const type = { //assert all indices are different
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
    vec: n => list(n, 3),
    cvec: n => list(n, 4),

    mat2: list(2, list(2, 3)),
    mat3: list(3, list(3, 3)),
    mat4: list(4, list(4, 3)),
    anytype: 18, // is subtype of any other type
    // positivefloat: 14 //@TODO: positive int < int, positive real < real. positivefloat+ positivefloat = positivefloat...
    // nonnegativefloat: 15 //@TODO: negative float...
};
Object.freeze(type);

function typeToString(t) {
    if (1 <= t && t <= 10) {
        let l = [
            'bool',
            'int',
            'float',
            'complex',
            'voidt',
            'color',
            'point',
            'line',
            'coordinate2d',
            'image',
        ];
        return l[t - 1];
    } else {
        if (t.type === 'list') return `${typeToString(t.parameters)}[${t.length}]`;
        if (t.type === 'constant') return `const[${JSON.stringify(t.value['value'])}]`;
        return JSON.stringify(t); //TODO
    }
}

function usefunction(name) {
    return args => { //args?
        if (typeof 'args' === 'string')
            return `${getPlainName(name)}(${args})`;
        else
            return `${getPlainName(name)}(${args.join(', ')})`;
    };
}

function useinfix(inf) {
    return args => //args?
        `(${args.join(inf)})`;
}

//subtype inclusion function in WebGL
let identity = x => x;

let getReal = c => `(${c}).x`
let getImag = c => `(${c}).y`


var webgl = {};

webgl['join'] = first([
    [type.point, type.point], type.line, usefunction('cross')
]);

webgl['meet'] = first([
    [type.line, type.line], type.point, usefunction('cross')
]);

webgl['if'] = (argtypes) => { //generator is not used yet
    if (!argtypes.every(a => a)) return false;
    if (argtypes.length === 2) {
        return ({
            args: argtypes,
            res: argtypes[1],
            generator: args => `if(${args[0]}) {${args[1]};}`
        });
    } else if (argtypes.length === 3) {
        let template = lca(argtypes[1], argtypes[2]);
        if (template) {
            return ({
                args: [type.bool, template, template],
                res: template,
                generator: args => `(${args[0]} ? ${args[1]} : ${args[2]})`
            });
        } else { //they do not have an common lca
            return ({
                args: argtypes,
                res: type.voidt,
                generator: args => `if(${args[0]}) {${args[1]};} else {${args[2]};}`
            });
        }
    }
    return false;
};

webgl['='] = (argtypes) => {
    let match = lca(argtypes[0], argtypes[1]);
    return { //generator not used yet
        args: match,
        res: match,
        generator: args => `${args[0]} = ${args[1]};`
    }
};

webgl[';'] = (argtypes) => ({ //generator not used yet
    args: argtypes,
    res: (argtypes[1] !== type.voidt) ? argtypes[1] : argtypes[0],
    generator: args => `${args[0]} ; ${args[1]};`
});

webgl['repeat'] = argtypes => (argtypes.length == 2 || argtypes.length == 3) && isconstantint(argtypes[0]) ? ({ //generator not used yet
    args: argtypes,
    res: argtypes[argtypes.length - 1],
    generator: args => ''
}) : false;


webgl['forall'] = argtypes => (argtypes.length == 2 || argtypes.length == 3) && (argtypes[0].type === 'list') ? ({ //generator not used
    args: argtypes,
    res: argtypes[argtypes.length - 1],
    generator: args => ''
}) : false;

webgl['apply'] = argtypes => (argtypes.length == 2 || argtypes.length == 3) && (argtypes[0].type === 'list') ? ({ //generator not used
    args: argtypes,
    res: list(argtypes[0].length, argtypes[argtypes.length - 1]),
    generator: args => ''
}) : false;

webgl['sum'] = argtypes => (argtypes.length == 1) && (isrvectorspace(argtypes[0]) || iscvectorspace(argtypes[0])) ? ({
    args: argtypes,
    res: argtypes[0].parameters,
    generator: usesum(argtypes[0]),
}) : false;

webgl['regional'] = argtypes => ({ //generator not used yet
    args: argtypes,
    res: type.voidt,
    generator: args => ''
});

webgl["sqrt"] = first([
    [
        [type.float], type.complex, useincludefunction('sqrtf')
    ],
    [
        [type.complex], type.complex, useincludefunction('sqrtc')
    ]
]);

webgl['abs'] = first([
    [
        [type.float], type.float, usefunction('abs')
    ],
    [
        [type.complex], type.float, usefunction('length')
    ],
    [
        [type.vec2], type.float, usefunction('length')
    ],
    [
        [type.vec3], type.float, usefunction('length')
    ],
    [
        [type.vec4], type.float, usefunction('length')
    ]
]); //TODO: other lengths

webgl['abs_infix'] = webgl['abs'];

webgl['dist'] = first([
    [
        [type.float, type.float], type.float, (x => usefunction('abs')(useinfix('-')(x)))
    ],
    [
        [type.complex, type.complex], type.float, (x => usefunction('length')(useinfix('-')(x)))
    ],
    [
        [type.vec2, type.vec2], type.float, (x => usefunction('length')(useinfix('-')(x)))
    ],
    [
        [type.vec3, type.vec3], type.float, (x => usefunction('length')(useinfix('-')(x)))
    ],
    [
        [type.vec4, type.vec4], type.float, (x => usefunction('length')(useinfix('-')(x)))
    ]
]);


webgl['dist_infix'] = webgl['dist'];


webgl['sin'] = first([
    [
        [type.float], type.float, usefunction('sin')
    ],
    [
        [type.complex], type.complex, useincludefunction('sinc')
    ]
]);

webgl['cos'] = first([
    [
        [type.float], type.float, usefunction('cos')
    ],
    [
        [type.complex], type.complex, useincludefunction('cosc')
    ]
]);

webgl['tan'] = first([
    [
        [type.float], type.float, usefunction('tan')
    ],
    [
        [type.complex], type.complex, useincludefunction('tanc')
    ]
]);

webgl['exp'] = first([
    [
        [type.float], type.float, usefunction('exp')
    ],
    [
        [type.complex], type.complex, useincludefunction('expc')
    ]
]);

webgl['arctan'] = first([
    [
        [type.float], type.float, usefunction('atan')
    ],
    [
        [type.complex], type.complex, useincludefunction('arctanc')
    ]
]);

webgl['log'] = first([
    [
        [type.float], type.complex, useincludefunction('logr')
    ],
    [
        [type.complex], type.complex, useincludefunction('logc')
    ]
]);

let glslstructures = [2, 3, 4].map(n => list(n, type.float))
    .concat([2, 3, 4].map(n => (list(n, list(n, type.float)))));

let glslsupportop = [type.int, type.float, type.complex].concat(glslstructures);

webgl["add"] = args => {
    let match = first(
        glslsupportop.map(t => [
            [t, t], t, useinfix('+')
        ])
    )(args);
    if (match) return match;

    let a = args[0];
    let b = args[1];

    if ([a, b].every(a => isrvectorspace(a) || iscvectorspace(a)) && dimensionsmatch(a, b)) {
        let vectorspace = lca(getrvectorspace(a), getrvectorspace(b)); //this might also be a C-vectorspace
        return {
            args: [vectorspace, vectorspace],
            res: vectorspace,
            generator: useadd(vectorspace),
        };
    }
};

//var negate = v => `-(${v[1]})`
webgl["sub"] = args => {
    let match = first(
        glslsupportop.map(t => [
            [t, t], t, useinfix('-')
        ])
        .concat(glslsupportop.map(t => [
            [type.voidt, t], t, useinfix('-')
        ]))
    )(args);
    if (match) return match;

    let a = args[0];
    let b = args[1];

    if ([a, b].every(a => isrvectorspace(a) || iscvectorspace(a)) && dimensionsmatch(a, b)) {
        let vectorspace = lca(getrvectorspace(a), getrvectorspace(b)); //this might also be a C-vectorspace
        return {
            args: [vectorspace, vectorspace],
            res: vectorspace,
            generator: usesub(vectorspace),
        };
    }
};

webgl['+'] = webgl['add'];
webgl['-'] = webgl['sub'];

let rings = [type.int, type.float, type.complex, type.vec2, type.vec3, type.vec4];


webgl["_"] = args => {
    let t = args[0];
    if (t.type === 'list' && isconstantint(args[1])) {
        let k = Number(args[1].value["value"]["real"]);
        if (1 <= Math.abs(k) && Math.abs(k) <= t.length) {
            if (k > 0) k = k - 1;
            if (k < 0) k = t.length - k;
            return {
                args: args,
                res: t.parameters,
                generator: accesslist(t, k),
            };
        }
    }
    return false;
};


webgl["mult"] = args => {
    let match = first([
        [
            [type.int, type.int], type.int, useinfix('*')
        ],
        [
            [type.float, type.float], type.float, useinfix('*')
        ],
        [
            [type.complex, type.complex], type.complex, useincludefunction('multc')
        ],
    ])(args);
    if (match) return match;
    if (args.length !== 2) return false;
    let a = args[0];
    let b = args[1];
    //DOT-product
    if ([a, b].every(a => a.type === 'list' && issubtypeof(a.parameters, type.float)) && a.length === b.length) {
        let vectorspace = getrvectorspace(a);
        if (isnativeglsl(vectorspace)) {
            return {
                args: [vectorspace, vectorspace],
                res: type.float,
                generator: usefunction('dot')
            };
        } else {
            return {
                args: [vectorspace, vectorspace],
                res: type.float,
                generator: usedot(a.length)
            };
        }
    }

    if ([a, b].every(a => a.type === 'list' && issubtypeof(a.parameters, type.complex)) && a.length === b.length) {
        let vectorspace = getcvectorspace(a);

        return {
            args: [vectorspace, vectorspace],
            res: type.complex,
            generator: usecdot(a.length)
        };

    }


    //real matrix-vector products (also non-quadratic)
    if (isrvectorspace(a) && depth(a) === 2 &&
        isrvectorspace(b) && depth(b) === 1 && a.parameters.length === b.length) {
        return {
            args: [getrvectorspace(a), getrvectorspace(b)],
            res: type.vec(a.length),
            generator: usemult(getrvectorspace(a))
        };

    }

    //complex matrix-vector products (also non-quadratic)
    if (iscvectorspace(a) && depth(a) === 2 &&
        iscvectorspace(b) && depth(b) === 1 && a.parameters.length === b.length) {
        return {
            args: [getcvectorspace(a), getcvectorspace(b)],
            res: type.cvec(a.length),
            generator: usemult(getcvectorspace(a))
        };

    }

    for (let swap = 0; swap < 2; swap++) {
        //R/C vectorspaces with real scalar
        if (issubtypeof(args[0 ^ swap], type.float) && (isrvectorspace(args[1 ^ swap]) || iscvectorspace(args[1 ^ swap]))) {
            let vs = getrvectorspace(args[1 ^ swap]);
            return {
                args: swap ? [vs, type.float] : [type.float, vs],
                res: vs,
                generator: (a, modifs, codebuilder) => usescalarmult(vs)([a[0 ^ swap], a[1 ^ swap]], modifs, codebuilder)
            };
        }
        //complex vectorspaces by complex scalar
        else if (issubtypeof(args[0 ^ swap], type.complex) && (iscvectorspace(args[1 ^ swap]))) {
            let vs = getcvectorspace(args[1 ^ swap]);
            return {
                args: swap ? [vs, type.complex] : [type.complex, vs],
                res: vs,
                generator: (a, modifs, codebuilder) => usecscalarmult(vs)([a[0 ^ swap], a[1 ^ swap]], modifs, codebuilder)
            };
        }
    }
};

webgl['*'] = webgl['mult'];

webgl["div"] = args => {
    let match = first([
        [
            [type.float, type.float], type.float, useinfix('/')
        ],
        [
            [type.complex, type.complex], type.complex, useincludefunction('divc')
        ],
    ])(args);
    if (match) return match;
    if (issubtypeof(args[1], type.float) && iscvectorspace(args[0])) {
        let vectorspace = getrvectorspace(args[0]);
        if (isnativeglsl(vectorspace)) {
            return {
                args: [vectorspace, type.float],
                res: vectorspace,
                generator: useinfix('/')
            };
        }
        //TODO: implement / for other dimensions; and complex vector spaces
    }
    return false;
}


webgl['/'] = webgl['div'];

webgl['re'] = first([
    [
        [type.complex], type.float, useincludefunction('realc') //TODO: shorter x => `(${x}).x`
    ]
]);

webgl['im'] = first([
    [
        [type.complex], type.float, useincludefunction('imagc')
    ]
]);

webgl["floor"] = first([
    [
        [type.float], type.int, (a => `int(floor(${a}))`)
    ],
    [
        [type.complex], type.complex, usefunction('floor')
    ]
]);

webgl["round"] = first([
    [
        [type.float], type.int, (a => `int(floor(${a}+.5))`)
    ],
    [
        [type.complex], type.complex, (a => `floor(${a}+vec2(.5))`)
    ]
]);

//- ("ceil", 1, OpCeil.class); @done(2015-03-17)
webgl["ceil"] = first([
    [
        [type.float], type.int, (a => `int(ceil(${a}))`)
    ],
    [
        [type.complex], type.complex, usefunction('ceil')
    ]
]);

webgl["mod"] = first([
    [
        [type.int, type.int], type.int, (a, cb) => (`int(${usefunction('mod')('float(' + a[0] + '), float(' + a[1] + ')', cb)})`)
    ], //useinfix('%') '%' : integer modulus operator supported in GLSL ES 3.00 only
    [
        [type.float, type.float], type.float, usefunction('mod')
    ],
    [
        [type.complex, type.complex], type.complex, useincludefunction('mod')
    ], //see https://github.com/CindyJS/CindyJS/issues/272
]);

webgl["random"] = first([
    [
        [], type.float, useincludefunction('random')
    ],
    [
        [type.float], type.float, (a, cb) => (`${useincludefunction('random')([], cb)}*${a[0]}`)
    ],
    [
        [type.complex], type.complex, (a, cb) => (`vec2(${useincludefunction('random')([], cb)},${useincludefunction('random')([], cb)})*${a[0]}`)
    ]

]);


webgl['arctan2'] = first([
    [
        [type.float, type.float], type.float, args => (`atan(${args[1]}, ${args[0]})`) //reverse order
    ],
    [
        [type.complex, type.complex], type.complex, useincludefunction('arctan2c')
    ],
    [
        [type.complex], type.float, useincludefunction('arctan2vec2') //one complex argument
    ],
    [
        [type.vec2], type.float, useincludefunction('arctan2vec2')
    ],
    [
        [type.cvec(2)], type.complex, useincludefunction('arctan2cvec2')
    ]
]);


["red", "green", "blue", "gray", "hue"].forEach(oper => {
    webgl[oper] = first([
        [
            [type.float], type.vec3, useincludefunction(oper)
        ]
    ]);
});
webgl["grey"] = webgl["gray"];


webgl["min"] = first([
    [
        [type.int, type.int], type.int, usefunction('min')
    ],
    [
        [type.float, type.float], type.float, usefunction('min')
    ]
]);

webgl["max"] = first([
    [
        [type.int, type.int], type.int, usefunction('max')
    ],
    [
        [type.float, type.float], type.float, usefunction('max')
    ]
]);


webgl["complex"] = first([
    [
        [type.vec2], type.complex, identity
    ]
]);

webgl["pow"] = first([
    [
        [type.float, type.int], type.float, useincludefunction('powi')
    ],
    [
        [type.complex, type.complex], type.complex, useincludefunction('powc')
    ]
]);

webgl["^"] = webgl["pow"];

webgl["re"] = first([
    [
        [type.complex], type.float, getReal
    ]
]);

webgl["conjugate"] = first([
    [
        [type.complex], type.complex, useincludefunction('conjugate')
    ]
]);

webgl["im"] = first([
    [
        [type.complex], type.float, getImag
    ]
]);

webgl["genList"] = args => {
    let n = args.length;
    if (n > 0) {
        let l = false;
        for (let i in args) {
            l = lca(l, args[i]);
        }
        if (l) {
            let t = list(n, l);
            return {
                args: Array(n).fill(l),
                res: t,
                generator: uselist(t),
            };
        }
    }
    return false;
}

webgl["&"] = first([
    [
        [type.bool, type.bool], type.bool, useinfix('&&')
    ]
]);

webgl["%"] = first([
    [
        [type.bool, type.bool], type.bool, useinfix('||')
    ]
]);


[">", "<", ">=", "<=", "=="].forEach(oper => {
    webgl[oper] = first([
        [
            [type.int, type.int], type.bool, useinfix(oper)
        ],
        [
            [type.float, type.float], type.bool, useinfix(oper)
        ]
    ]);
});


webgl["imagergb"] = first([
    [
        [type.image, type.coordinate2d], type.vec3, useimagergb2
    ],
    [
        [type.coordinate2d, type.coordinate2d, type.image, type.coordinate2d], type.vec3, useimagergb4
    ]
]);

webgl["imagergba"] = first([
    [
        [type.image, type.coordinate2d], type.vec4, useimagergba2
    ],
    [
        [type.coordinate2d, type.coordinate2d, type.image, type.coordinate2d], type.vec4, useimagergba4
    ]
]);


Object.freeze(webgl);

//depends on glsl-implementation
requires['powc'] = ['expc', 'multc', 'logc'];
requires['sqrtc'] = ['expc', 'multc', 'logc'];
requires['arccosc'] = ['multc', 'negc', 'sqrtc', 'addc', 'logc'];
requires['arcsinc'] = ['multc', 'negc', 'sqrtc', 'addc', 'logc'];
requires['tanc'] = ['sinc', 'cosc', 'divc'];
requires['arctanc'] = ['logc', 'addc', 'multc', 'subc'];
requires['arctan2c'] = ['logc', 'divc', 'sqrtc', 'multc'];
requires['arctan2vec2c'] = ['arctan2c'];
requires['hue'] = ['hsv2rgb'];


Object.freeze(requires);
