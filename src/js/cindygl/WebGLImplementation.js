webgltype[type.bool] = 'bool';
webgltype[type.int] = 'int';
webgltype[type.float] = 'float';
webgltype[type.complex] = 'vec2';
webgltype[type.voidt] = 'void';
webgltype[type.vec2] = 'vec2';
webgltype[type.vec3] = 'vec3';
webgltype[type.vec4] = 'vec4';
webgltype[type.color] = 'vec4';
webgltype[type.point] = 'vec3' //use homogenious coordinates


Object.freeze(webgltype);


//subtype inclusion function in WebGL
function identity(x) {return x};


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
for(let t in type) {
  inclusionfunction[type[t]] = {};
}

inclusionfunction[type.bool][type.int] = usefunction('int'); // use int(...) to cast from boolean to int
inclusionfunction[type.int][type.float] = usefunction('float');
inclusionfunction[type.float][type.complex] = float2cpl;
inclusionfunction[type.float][type.color] = useincludefunction('float2color');

//inclusionfunction[type.complex][type.vec2] = identity;
inclusionfunction[type.color][type.vec3] = color2vec3;
//inclusionfunction[type.vec2][type.complex] = identity;
inclusionfunction[type.vec2][type.point] = vec22point;


inclusionfunction[type.vec3][type.color] = vec32color;
inclusionfunction[type.vec3][type.point] = identity;

inclusionfunction[type.point][type.vec2] = useincludefunction('dehomogenize');
inclusionfunction[type.point][type.vec3] = identity;



Object.freeze(inclusionfunction);

webgltr['abs'] = [
  [float_fun$1,   usefunction('abs')  ],
  [complex2float_fun$1, usefunction('length')]
];

webgltr['sin'] = [
  [float_fun$1,   usefunction('sin')  ],
  [complex_fun$1, useincludefunction('sinc')]
];

webgltr['cos'] = [
  [float_fun$1,   usefunction('cos')  ],
  [complex_fun$1, useincludefunction('cosc')]
];

webgltr['exp'] = [
  [float_fun$1,   usefunction('exp')  ],
  [complex_fun$1, useincludefunction('expc')]
];

webgltr['log'] = [
  [float2complex_fun$1,   useincludefunction('logr')],
  [complex_fun$1, useincludefunction('logc')]
];

webgltr["add"] = [
  [int_fun$2,     useinfix('+')],
  [float_fun$2,   useinfix('+')],
  [complex_fun$2, useinfix('+')]
];
webgltr['+'] = webgltr['add'];

webgltr["sub"] = [
  [int_fun$2,     useinfix('-')],
  [float_fun$2,   useinfix('-')],
  [complex_fun$2, useinfix('-')]
];
webgltr['-'] = webgltr['sub'];

webgltr["mult"] = [
  [int_fun$2, useinfix('*')],
  [float_fun$2, useinfix('*')],
  [complex_fun$2, useincludefunction('multc')],
  [vec22float_fun$2, usefunction('dot')],
  [vec32float_fun$2, usefunction('dot')]
];
webgltr['*'] = webgltr['mult'];

webgltr["div"] = [
  [float_fun$2, useinfix('/')],
  [complex_fun$2, useincludefunction('divc')]
];
webgltr['/'] = webgltr['div'];

webgltr['re'] = [
  [complex2float_fun$1, useincludefunction('realc')]
];

webgltr['im'] = [
  [complex2float_fun$1, useincludefunction('imagc')]
];


webgltr['arctan2'] = [
  [float_fun$2, usefunction('atan')],
  [complex_fun$2, useincludefunction('arctanc')]
//- ("arctan2", 1, OpArcTan2_1.class); @done(2015-03-17)
//  {args:[{type: "list", length: 2, members: type.float}], res: type.float},
//  {args:[{type: "list", length: 2, members: type.complex}], res: type.complex}
];

webgltr["hue"] = [
  [{args:[type.float], res: type.color},  useincludefunction('hue')]
];




webgltr["complex"] = [
  [{args: [type.vec2], res: type.complex}, identity]
];

webgltr["re"] = [
  [complex2float_fun$1, getReal]
];

webgltr["im"] = [
  [complex2float_fun$1, getImag]
];

webgltr["genList"] = [
  [{args: [type.float, type.float],             res: type.vec2}, usefunction('vec2')],
  [{args: [type.float, type.float, type.float], res: type.vec3}, usefunction('vec3')]
  //@TODO: real lists in glsl
];


webgltr["&"] = [
  [bool_fun$2, useinfix('&&')]
];


[">","<", ">=", "<="].forEach( oper =>
  webgltr[oper] = [
    [int2bool_fun$2, useinfix(oper)],
    [float2bool_fun$2, useinfix(oper)]
  ]
);




Object.freeze(webgltr);

//depends on glsl-implementation
requires['divc']    = ['multc'];
requires['powc']    = ['expc', 'multc', 'logc'];
requires['sqrtc']   = ['expc', 'multc', 'logc'];
requires['arccosc'] = ['multc', 'negc', 'sqrtc', 'addc', 'logc'];
requires['arcsinc'] = ['multc', 'negc', 'sqrtc', 'addc', 'logc'];
requires['tanc']    = ['sinc', 'cosc', 'divc'];
requires['arctanc'] = ['logc', 'addc', 'multc', 'subc'];

requires['hue'] = ['hsv2rgb'];

Object.freeze(requires);
