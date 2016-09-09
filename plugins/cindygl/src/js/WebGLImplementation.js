webgltype[type.bool] = 'bool';
webgltype[type.int] = 'int';
webgltype[type.float] = 'float';
webgltype[type.complex] = 'vec2';
webgltype[type.voidt] = 'void';
webgltype[type.vec2] = 'vec2';
webgltype[type.vec3] = 'vec3';
webgltype[type.vec4] = 'vec4';
webgltype[type.mat2] = 'mat2';
webgltype[type.mat3] = 'mat3';
webgltype[type.mat4] = 'mat4';
webgltype[type.color] = 'vec4';
webgltype[type.point] = 'vec3'; //use homogenious coordinates
webgltype[type.coordinate2d] = 'vec2';

//(a, b) \in \C^4 \mapsto (re a, im a, re b, im b) \in \R^4
webgltype[type.vec2complex] = 'vec4';

// (a b)    (re a, -im a, re b, -im b)
// (c d) -> (im a,  re a, im b,  re b)
//          (re c, -im c, re d, -im d)
//          (im c,  re c, im d,  re d)
webgltype[type.mat2complex] = 'mat4';


Object.freeze(webgltype);


function usefunction(name) {
    return function(args) { //args?
        if (typeof 'args' === 'string')
            return getPlainName(name) + '(' + args + ')';
        else
            return getPlainName(name) + '(' + args.join(', ') + ')';
    };
}

function useinfix(inf) {
    return function(args) { //args?
        return '(' + args.join(inf) + ')';
    };
}

//subtype inclusion function in WebGL
function identity(x) {
    return x
};


var float2cpl = function(f) {
    return 'vec2(' + f + ', 0.)';
}

var color2vec3 = function(c) {
    return '(' + c + ').rgb';
}
var vec32color = function(v) {
    return 'vec4(' + v + ',1.0)';
}
var vec22point = function(v) {
    return 'vec3(' + v + ',1.0)'; //homogenize
}

var getReal = function(c) {
    return '(' + c + ').x';
}

var getImag = function(c) {
    return '(' + c + ').y';
}

var inclusionfunction = {};
for (let t in type) {
    inclusionfunction[type[t]] = {};
}

inclusionfunction[type.bool][type.int] = usefunction('int'); // use int(...) to cast from boolean to int
inclusionfunction[type.int][type.float] = usefunction('float');
inclusionfunction[type.float][type.complex] = float2cpl;
inclusionfunction[type.float][type.color] = useincludefunction('float2color');

//inclusionfunction[type.complex][type.vec2] = identity;

inclusionfunction[type.color][type.vec3] = color2vec3;
inclusionfunction[type.color][type.vec4] = identity;

//inclusionfunction[type.vec2][type.complex] = identity;
inclusionfunction[type.vec2][type.point] = vec22point;


inclusionfunction[type.vec3][type.color] = vec32color;
inclusionfunction[type.vec3][type.point] = identity;

inclusionfunction[type.vec4][type.color] = identity;

inclusionfunction[type.point][type.vec2] = useincludefunction('dehomogenize');
inclusionfunction[type.point][type.vec3] = identity;


inclusionfunction[type.point][type.coordinate2d] = useincludefunction('dehomogenize');
inclusionfunction[type.vec2][type.coordinate2d] = identity;
inclusionfunction[type.complex][type.coordinate2d] = identity;

inclusionfunction[type.vec2][type.vec2complex] = useincludefunction('vec2complex');
inclusionfunction[type.mat2][type.mat2complex] = useincludefunction('mat2complex');
Object.freeze(inclusionfunction);

webgltr["sqrt"] = [
    [float2complex_fun$1, useincludefunction('sqrtf')],
    [complex_fun$1, useincludefunction('sqrtc')]
];

webgltr['abs'] = [
    [float_fun$1, usefunction('abs')],
    [complex2float_fun$1, usefunction('length')],
    [vec22float_fun$1, usefunction('length')],
    [vec32float_fun$1, usefunction('length')],
    [vec42float_fun$1, usefunction('length')]
];

webgltr['abs_infix'] = webgltr['abs'];

webgltr['dist'] = [
    [float_fun$2, (x => usefunction('abs')(useinfix('-')(x)))],
    [complex2float_fun$2, (x => usefunction('length')(useinfix('-')(x)))],
    [vec22float_fun$2, (x => usefunction('length')(useinfix('-')(x)))],
    [vec32float_fun$2, (x => usefunction('length')(useinfix('-')(x)))],
    [vec42float_fun$2, (x => usefunction('length')(useinfix('-')(x)))]
];


webgltr['dist_infix'] = webgltr['dist'];


webgltr['sin'] = [
    [float_fun$1, usefunction('sin')],
    [complex_fun$1, useincludefunction('sinc')]
];

webgltr['cos'] = [
    [float_fun$1, usefunction('cos')],
    [complex_fun$1, useincludefunction('cosc')]
];

webgltr['tan'] = [
    [float_fun$1, usefunction('tan')],
    [complex_fun$1, useincludefunction('tanc')]
];

webgltr['exp'] = [
    [float_fun$1, usefunction('exp')],
    [complex_fun$1, useincludefunction('expc')]
];

webgltr['arctan'] = [
    [float_fun$1, usefunction('atan')],
    [complex_fun$1, useincludefunction('arctanc')]
];

webgltr['log'] = [
    [float2complex_fun$1, useincludefunction('logr')],
    [complex_fun$1, useincludefunction('logc')]
];

webgltr["add"] = [];
webgltr["sub"] = [];

[int_fun$2, float_fun$2, complex_fun$2, vec2_fun$2, vec3_fun$2, vec4_fun$2, vec2complex_fun$2].forEach(function(t) {
    webgltr["add"].push([t, useinfix('+')]);
    webgltr["sub"].push([t, useinfix('-')]);
});

var negate = function(v) {
    return '-(' + v[1] + ')';
}

let rings = [type.int, type.float, type.complex, type.vec2, type.vec3, type.vec4];
rings.forEach(function(t) {
    webgltr["sub"].push([{
        args: [type.voidt, t],
        res: t
    }, negate]);
});


var accessbyshiftedindex = function(args) {
    if (isFinite(args[1]))
        return '(' + args[0] + ')[' + (args[1] - 1) + ']'; //change index for hardcoded integers
    else
        return '(' + args[0] + ')[' + args[1] + '-1]';
};

var accesscomplexbyshiftedindex = function(args) { //only works for indices that were hardcoded in CindyJS
    if (args[1] === 1)
        return '(' + args[0] + ').xy';
    else if (args[1] === 2)
        return '(' + args[0] + ').zw';
    else
        console.error("access of components of complex[2] only works for indeces that were hardcoded in CindyJS");
    return 'ERROR: SEE CONSOLE (index was ' + args[1] + ') \n';
};

webgltr["_"] = [
    [{
        args: [type.vec2, type.int],
        res: type.float
    }, accessbyshiftedindex],
    [{
        args: [type.vec3, type.int],
        res: type.float
    }, accessbyshiftedindex],
    [{
        args: [type.vec4, type.int],
        res: type.float
    }, accessbyshiftedindex],
    [{
        args: [type.vec2complex, type.int],
        res: type.complex
    }, accesscomplexbyshiftedindex]
];


webgltr['+'] = webgltr['add'];
webgltr['-'] = webgltr['sub'];

webgltr["mult"] = [
    [int_fun$2, useinfix('*')],
    [float_fun$2, useinfix('*')],
    [complex_fun$2, useincludefunction('multc')],
    [{
        args: [type.mat2, type.vec2],
        res: type.vec2
    }, useinfix('*')],
    [{
        args: [type.mat2complex, type.vec2complex],
        res: type.vec2complex
    }, useinfix('*')],
    [{
        args: [type.mat3, type.vec3],
        res: type.vec3
    }, useinfix('*')],
    [{
        args: [type.mat4, type.vec4],
        res: type.vec4
    }, useinfix('*')],
    [vec22float_fun$2, usefunction('dot')],
    [vec32float_fun$2, usefunction('dot')],
    [vec42float_fun$2, usefunction('dot')]
];

rvectorspaces.forEach(function(t) {
    webgltr["mult"].push([{
        args: [type.float, t],
        res: t
    }, useinfix('*')]);
    webgltr["mult"].push([{
        args: [t, type.float],
        res: t
    }, useinfix('*')]);
});

webgltr["mult"].push(
    [{
        args: [type.complex, type.vec2complex],
        res: type.vec2complex
    }, useincludefunction('multcv')]);
webgltr["mult"].push(
    [{
            args: [type.vec2complex, type.complex],
            res: type.vec2complex
        }, (a => (useincludefunction('multcv')([a[1], a[0]]))) //reverse order
    ]);

webgltr['*'] = webgltr['mult'];

webgltr["div"] = [
    [float_fun$2, useinfix('/')],
    [complex_fun$2, useincludefunction('divc')],
];
rvectorspaces.forEach(function(t) {
    webgltr["div"].push([{
        args: [t, type.float],
        res: t
    }, useinfix('/')]);
});
webgltr["div"].push([{
    args: [type.vec2complex, type.complex],
    res: type.vec2complex
}, useincludefunction('divcv')])

webgltr['/'] = webgltr['div'];

webgltr['re'] = [
    [complex2float_fun$1, useincludefunction('realc')]
];

webgltr['im'] = [
    [complex2float_fun$1, useincludefunction('imagc')]
];

webgltr["floor"] = [
    [{
        args: [type.float],
        res: type.int
    }, (a => 'int(floor(' + a + '))')],
    [{
        args: [type.complex],
        res: type.complex
    }, usefunction('floor')]
];

webgltr["round"] = [
    [{
        args: [type.float],
        res: type.int
    }, (a => 'int(floor(' + a + '+.5))')],
    [{
        args: [type.complex],
        res: type.complex
    }, (a => 'floor(' + a + '+vec2(.5))')]
];

//- ("ceil", 1, OpCeil.class); @done(2015-03-17)
webgltr["ceil"] = [
    [{
        args: [type.float],
        res: type.int
    }, (a => 'int(ceil(' + a + '))')],
    [{
        args: [type.complex],
        res: type.complex
    }, usefunction('ceil')]
];

webgltr["mod"] = [
    [int_fun$2, (a, cb) => ('int(' + usefunction('mod')('float(' + a[0] + '), float(' + a[1] + ')', cb) + ')')], //useinfix('%') '%' : integer modulus operator supported in GLSL ES 3.00 only
    [float_fun$2, usefunction('mod')],
    [complex_fun$2, usefunction('mod')] //or implement [complex_fun$2, useincludefunction('modc')], see https://github.com/CindyJS/CindyJS/issues/272
];

webgltr["random"] = [
    [float_fun$0, useincludefunction('random')],
    [float_fun$1, (a, cb) => (useincludefunction('random')([], cb) + '*' + a[0])],
    [complex_fun$1, (a, cb) => ('vec2(' + useincludefunction('random')([], cb) + ',' + useincludefunction('random')([], cb) + ')*' + a[0])]

];


webgltr['arctan2'] = [
    [float_fun$2, args => ("atan(" + args[1] + ", " + args[0] + ")")], //reverse order
    [complex_fun$2, useincludefunction('arctan2c')],
    [complex2float_fun$1, useincludefunction('arctan2vec2')], //one complex argument
    [{
        args: [type.vec2],
        res: type.float
    }, useincludefunction('arctan2vec2')],
    [{
        args: [type.vec2complex],
        res: type.complex
    }, useincludefunction('arctan2vec2c')]
];


["red", "green", "blue", "gray", "hue"].forEach(oper =>
    webgltr[oper] = [
        [{
            args: [type.float],
            res: type.vec3
        }, useincludefunction(oper)]
    ]
);
webgltr["grey"] = webgltr["gray"];


webgltr["min"] = [
    [int_fun$2, usefunction('min')],
    [float_fun$2, usefunction('min')]
];

webgltr["max"] = [
    [int_fun$2, usefunction('max')],
    [float_fun$2, usefunction('max')]
];


webgltr["complex"] = [
    [{
        args: [type.vec2],
        res: type.complex
    }, identity]
];

webgltr["pow"] = [
    [{
            args: [type.float, type.int],
            res: type.float
        },
        useincludefunction('powi')
    ],
    [{
        args: [type.complex, type.complex],
        res: type.complex
    }, useincludefunction('powc')]
];

webgltr["^"] = webgltr["pow"];

webgltr["re"] = [
    [complex2float_fun$1, getReal]
];

webgltr["conjugate"] = [
    [complex_fun$1, useincludefunction('conjugate')]
];

webgltr["im"] = [
    [complex2float_fun$1, getImag]
];

webgltr["genList"] = [
    [{
        args: [type.float, type.float],
        res: type.vec2
    }, usefunction('vec2')],
    [{
        args: [type.float, type.float, type.float],
        res: type.vec3
    }, usefunction('vec3')],
    [{
        args: [type.float, type.float, type.float, type.float],
        res: type.vec4
    }, usefunction('vec4')],
    [{
        args: [type.complex, type.complex],
        res: type.vec2complex
    }, usefunction('vec4')]
    //@TODO: real lists in glsl
];


webgltr["&"] = [
    [bool_fun$2, useinfix('&&')]
];

webgltr["%"] = [
    [bool_fun$2, useinfix('||')]
];


[">", "<", ">=", "<=", "=="].forEach(oper =>
    webgltr[oper] = [
        [int2bool_fun$2, useinfix(oper)],
        [float2bool_fun$2, useinfix(oper)]
    ]
);


webgltr["imagergb"] = [
    [{
        args: [type.image, type.coordinate2d],
        res: type.vec3
    }, useimagergb2],
    [{
        args: [type.coordinate2d, type.coordinate2d, type.image, type.coordinate2d],
        res: type.vec3
    }, useimagergb4]
];

webgltr["imagergba"] = [
    [{
        args: [type.image, type.coordinate2d],
        res: type.vec4
    }, useimagergba2],
    [{
        args: [type.coordinate2d, type.coordinate2d, type.image, type.coordinate2d],
        res: type.vec4
    }, useimagergba4]
];


Object.freeze(webgltr);

//depends on glsl-implementation
requires['divc'] = ['multc'];
requires['divcv'] = ['multcv'];
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
