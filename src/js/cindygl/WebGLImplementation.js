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
webgltype[type.point] = 'vec3' //use homogenious coordinates


Object.freeze(webgltype);



function usefunction(name) {
  return function(args) { //args?
    if(typeof 'args' === 'string')
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
inclusionfunction[type.color][type.vec4] = identity;

//inclusionfunction[type.vec2][type.complex] = identity;
inclusionfunction[type.vec2][type.point] = vec22point;


inclusionfunction[type.vec3][type.color] = vec32color;
inclusionfunction[type.vec3][type.point] = identity;

inclusionfunction[type.vec4][type.color] = identity;

inclusionfunction[type.point][type.vec2] = useincludefunction('dehomogenize');
inclusionfunction[type.point][type.vec3] = identity;



Object.freeze(inclusionfunction);

webgltr["sqrt"] = [
  [float2complex_fun$1, useincludefunction('sqrtf')],
  [complex_fun$1, useincludefunction('sqrtc')]
];

webgltr['abs'] = [
  [float_fun$1,   usefunction('abs')  ],
  [complex2float_fun$1, usefunction('length')],
  [vec22float_fun$1, usefunction('length')],
  [vec32float_fun$1, usefunction('length')],
  [vec42float_fun$1, usefunction('length')]
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

webgltr['arctan'] = [
  [float_fun$1,   usefunction('atan')  ],
  [complex_fun$1, useincludefunction('arctanc')]
];

webgltr['log'] = [
  [float2complex_fun$1,   useincludefunction('logr')],
  [complex_fun$1, useincludefunction('logc')]
];

webgltr["add"] = [];
webgltr["sub"] = [];

[int_fun$2, float_fun$2, complex_fun$2, vec2_fun$2, vec3_fun$2, vec4_fun$2].forEach( function(t) {
    webgltr["add"].push([t,  useinfix('+')]);
    webgltr["sub"].push([t,  useinfix('-')]);
  }
);

var negate = function(v) {
  return '-('+ v[1] + ')';
}

let rings = [type.int, type.float, type.complex, type.vec2, type.vec3, type.vec4];
rings.forEach( function(t) {
    webgltr["sub"].push([{args: [type.voidt, t], res: t}, negate]);
  }
);


var accessbyshiftedindex = function(args) { //args?
    if(isFinite(args[1]))
      return '(' + args[0] + ')['+(args[1]-1)+']'; //change index for hardcoded integers
    else
      return '(' + args[0] + ')['+args[1]+'-1]';
};

webgltr["_"] = [
  [{args:[type.vec2, type.int], res: type.float}, accessbyshiftedindex],
  [{args:[type.vec3, type.int], res: type.float}, accessbyshiftedindex],
  [{args:[type.vec4, type.int], res: type.float}, accessbyshiftedindex]
];


webgltr['+'] = webgltr['add'];
webgltr['-'] = webgltr['sub'];

webgltr["mult"] = [
  [int_fun$2, useinfix('*')],
  [float_fun$2, useinfix('*')],
  [complex_fun$2, useincludefunction('multc')],
  [{args: [type.mat2, type.vec2],    res: type.vec2}, useinfix('*')],
  [{args: [type.mat3, type.vec3],    res: type.vec3}, useinfix('*')],
  [{args: [type.mat4, type.vec4],    res: type.vec4}, useinfix('*')],
  [vec22float_fun$2, usefunction('dot')],
  [vec32float_fun$2, usefunction('dot')],
  [vec42float_fun$2, usefunction('dot')]
];

rvectorspaces.forEach(function(t){
  webgltr["mult"].push([{args: [type.float, t], res: t}, useinfix('*')]);
});

webgltr['*'] = webgltr['mult'];

webgltr["div"] = [
  [float_fun$2, useinfix('/')],
  [complex_fun$2, useincludefunction('divc')]
];
rvectorspaces.forEach(function(t){
  webgltr["div"].push([{args: [t, type.float], res: t}, useinfix('/')]);
});
webgltr['/'] = webgltr['div'];

webgltr['re'] = [
  [complex2float_fun$1, useincludefunction('realc')]
];

webgltr['im'] = [
  [complex2float_fun$1, useincludefunction('imagc')]
];


webgltr["mod"] = [
  [int_fun$2, useinfix('%')],
  [float_fun$2, usefunction('mod')]
  //complex_fun$2 TODO
];


webgltr['arctan2'] = [
  [float_fun$2, usefunction('atan')],
  [complex_fun$2, useincludefunction('arctanc')]
//- ("arctan2", 1, OpArcTan2_1.class); @done(2015-03-17)
//  {args:[{type: "list", length: 2, members: type.float}], res: type.float},
//  {args:[{type: "list", length: 2, members: type.complex}], res: type.complex}
];


["red", "green", "blue", "gray", "hue"].forEach( oper =>
  webgltr[oper] = [
    [{args:[type.float], res: type.vec3},  useincludefunction(oper)]
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
  [{args: [type.vec2], res: type.complex}, identity]
];

webgltr["pow"] = [
  [{args: [type.float, type.int], res: type.float}, 
    function(args){return "pow("+args[0]+", float("+args[1]+"))";} //TODO: 0^0=1 in cindyjs
  ],
  [{args: [type.complex, type.complex], res: type.complex}, useincludefunction('powc')]
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
  [{args: [type.float, type.float],             res: type.vec2}, usefunction('vec2')],
  [{args: [type.float, type.float, type.float], res: type.vec3}, usefunction('vec3')],
  [{args: [type.float, type.float, type.float, type.float], res: type.vec4}, usefunction('vec4')]
  //@TODO: real lists in glsl
];


webgltr["&"] = [
  [bool_fun$2, useinfix('&&')]
];


[">","<", ">=", "<=", "=="].forEach( oper =>
  webgltr[oper] = [
    [int2bool_fun$2, useinfix(oper)],
    [float2bool_fun$2, useinfix(oper)]
  ]
);


webgltr["imagergb"] = [
  [{args: [type.vec2, type.vec2, type.string, type.vec2], res: type.vec3},
  useimagergb
   /* function(args) {
      return 'texture2D(' + args[2] + ', computation(uniform_ratioOf' + args[2] + ', ' + args[0] + ', ' + args[1] + ', ' + args[3] +'))';
    }*/
  ]
];



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
