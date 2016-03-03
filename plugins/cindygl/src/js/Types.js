/** primitive types
@enum {number} */
const type = { //assert all indices are different
  bool: 1,
  int: 2,
  float: 3,
  complex: 4,
  voidt: 5,
  vec2: 6,
  vec3: 7,
  vec4: 8,
  color: 9, //color is the color type of glsl. CindyJS-colors are vec3
  point: 10, //is never used
  mat2: 11,
  mat3: 12,
  mat4: 13,
  string: 14, //only needed for type detection of imagergb
  coordinate2d: 15, //for accessing 2D textures
  vec2complex: 16,
  mat2complex: 17
    // positivefloat: 14 //@TODO: positive int < int, positive real < real. positivefloat+ positivefloat = positivefloat...
    // nonnegativefloat: 15 //@TODO: negative float...
};
Object.freeze(type);

function typeToString(t) {
  let l = [
    'bool',
    'int',
    'float',
    'complex',
    'voidt',
    'float[2]',
    'float[3]',
    'float[4]',
    'color',
    'point',
    'float[2,2]',
    'float[3,3]',
    'float[4,4]',
    'string',
    '2D-Coordinate',
    'complex[2]',
    'complex[2,2]'
    //'positive float',
    //'non-negative float'
  ];

  return l[t - 1];
}



//all these subtype-inclusions have to be implementented!
// - it is sufficient to list generators only
subtypegen[type.bool] = [type.int];
subtypegen[type.int] = [type.float];
subtypegen[type.float] = [type.complex, type.color]; //color: as gray

//subtypegen[type.complex] = []; //NOT type.vec2: because no automatic cast in cindyJS
//subtypegen[type.color] = [type.vec4]; //NOT type.vec4 because vec3 -> color -> vec4. Only consider vec3 <-> color in the sense of cindyJS

//subtypegen[type.vec2] = [type.point]; //TODO: kein eigentlicher grund fuer kommentar
subtypegen[type.vec3] = [type.color, type.point];
subtypegen[type.vec4] = [type.color]; //color with alpha


//subtypegen[type.nonegativefloat] = [type.positivefloat];
//subtypegen[type.positivefloat] = [type.float];

//subtypegen[type.point] = [type.vec2]; //in R^2 or in RP^3

subtypegen[type.point] = [type.coordinate2d]; //homogenious coordinates
subtypegen[type.vec2] = [type.coordinate2d, type.vec2complex];
subtypegen[type.complex] = [type.coordinate2d];

subtypegen[type.mat2] = [type.mat2complex];
/*
//non-primitive types. No subtype implemented!
const floatlist$2 = {type: "list", length: 2, members: type.float};
const floatlist$3 = {type: "list", length: 3, members: type.float};
const floatlist$4 = {type: "list", length: 4, members: type.float};
*/



const bool_fun$1 = {
  args: [type.bool],
  res: type.bool
};
const bool_fun$2 = {
  args: [type.bool, type.bool],
  res: type.bool
};
const int_fun$1 = {
  args: [type.int],
  res: type.int
};
const int_fun$2 = {
  args: [type.int, type.int],
  res: type.int
};
const float_fun$0 = {
  args: [],
  res: type.float
};
const float_fun$1 = {
  args: [type.float],
  res: type.float
};
const float_fun$2 = {
  args: [type.float, type.float],
  res: type.float
};
const complex_fun$1 = {
  args: [type.complex],
  res: type.complex
};
const complex_fun$2 = {
  args: [type.complex, type.complex],
  res: type.complex
};

const vec2_fun$2 = {
  args: [type.vec2, type.vec2],
  res: type.vec2
};
const vec3_fun$2 = {
  args: [type.vec3, type.vec3],
  res: type.vec3
};
const vec4_fun$2 = {
  args: [type.vec4, type.vec4],
  res: type.vec4
};

const float2complex_fun$1 = {
  args: [type.float],
  res: type.complex
};
const float2complex_fun$2 = {
  args: [type.float, type.float],
  res: type.complex
};
const complex2float_fun$1 = {
  args: [type.complex],
  res: type.float
};
const complex2float_fun$2 = {
  args: [type.complex, type.complex],
  res: type.float
};

const vec22float_fun$1 = {
  args: [type.vec2],
  res: type.float
};
const vec32float_fun$1 = {
  args: [type.vec3],
  res: type.float
};
const vec42float_fun$1 = {
  args: [type.vec4],
  res: type.float
};
const vec22float_fun$2 = {
  args: [type.vec2, type.vec2],
  res: type.float
};
const vec32float_fun$2 = {
  args: [type.vec3, type.vec3],
  res: type.float
};
const vec42float_fun$2 = {
  args: [type.vec4, type.vec4],
  res: type.float
};

const point2float_fun$2 = {
  args: [type.point, type.point],
  res: type.float
};

const int2bool_fun$2 = {
  args: [type.int, type.int],
  res: type.bool
};
const float2bool_fun$2 = {
  args: [type.float, type.float],
  res: type.bool
};

const template1 = makeTemplate(1);
const template2 = makeTemplate(2);
const template3 = makeTemplate(3);



//- ("sqrt", 1, OpSqrt.class); @done(2015-03-17)
typeinference["sqrt"] = [
  float2complex_fun$1, complex_fun$1
];
//- ("abs", 1, OpAbs.class); @done(2015-03-17)
typeinference["abs"] = [
  float_fun$1, complex2float_fun$1, vec22float_fun$1, vec32float_fun$1, vec42float_fun$1
];
//- ("exp", 1, OpExp.class); @done(2015-03-17)
typeinference["exp"] = [
  float_fun$1, complex_fun$1
];
//- ("log", 1, OpLog.class); @done(2015-03-17)
typeinference["log"] = [
  float2complex_fun$1, complex_fun$1
];
//- ("sin", 1, OpSin.class); @done(2015-03-17)
typeinference["sin"] = [
  float_fun$1, complex_fun$1
];
//- ("cos", 1, OpCos.class); @done(2015-03-17)
typeinference["cos"] = [
  float_fun$1, complex_fun$1
];
//- ("tan", 1, OpTan.class); @done(2015-03-17)
typeinference["tan"] = [
  float_fun$1, complex_fun$1
];
//- ("arccos", 1, OpArcCos.class); @done(2015-03-17)
typeinference["arccos"] = [
  float2complex_fun$1, complex_fun$1
];
//- ("arcsin", 1, OpArcSin.class); @done(2015-03-17)
typeinference["arcsin"] = [
  float2complex_fun$1, complex_fun$1
];
//- ("arctan", 1, OpArcTan.class); @done(2015-03-17)
typeinference["arctan"] = [
  float_fun$1, complex_fun$1
];
//- ("arctan2", 2, OpArcTan2.class); @done(2015-03-17)
typeinference["arctan2"] = [
  float_fun$2, complex_fun$2, complex2float_fun$1,
  //- ("arctan2", 1, OpArcTan2_1.class); @done(2015-03-17)
  {
    args: [type.vec2],
    res: type.float
  }, {
    args: [type.vec2complex],
    res: type.complex
  }
];
//- ("add", 2, OpPlus.class); @done(2015-03-17)
typeinference["add"] = [
  int_fun$2, float_fun$2, complex_fun$2, vec2_fun$2, vec3_fun$2, vec4_fun$2
];
//- ("sub", 2, OpMinus.class); @done(2015-03-17)
typeinference["sub"] = [
  int_fun$2, float_fun$2, complex_fun$2, vec2_fun$2, vec3_fun$2, vec4_fun$2, {
    args: [type.voidt, type.int],
    res: type.int
  }, {
    args: [type.voidt, type.float],
    res: type.float
  }, {
    args: [type.voidt, type.complex],
    res: type.complex
  }, {
    args: [type.voidt, type.vec2],
    res: type.vec2
  }, {
    args: [type.voidt, type.vec3],
    res: type.vec3
  }, {
    args: [type.voidt, type.vec4],
    res: type.vec4
  }
];
//- ("mult", 2, OpTimes.class); @done(2015-03-17)
typeinference["mult"] = [
  int_fun$2, float_fun$2
];
//all R-vectorspaces:
let rvectorspaces = [type.complex, type.vec2, type.vec3, type.vec4];
rvectorspaces.forEach(function(t) {
  typeinference["mult"].push({
    args: [type.float, t],
    res: t
  });
  typeinference["mult"].push({
    args: [t, type.float],
    res: t
  });
});

typeinference["mult"] = typeinference["mult"].concat([
  complex_fun$2, {
    args: [type.mat2, type.vec2],
    res: type.vec2
  }, {
    args: [type.mat2complex, type.vec2complex],
    res: type.vec2complex
  }, {
    args: [type.mat3, type.vec3],
    res: type.vec3
  }, {
    args: [type.mat4, type.vec4],
    res: type.vec4
  }
]);

typeinference["mult"].push(vec22float_fun$2); //dot products
typeinference["mult"].push(vec32float_fun$2);
typeinference["mult"].push(vec42float_fun$2);



//- ("div", 2, OpQuot.class); @done(2015-03-17)
typeinference["div"] = [
  float_fun$2, complex_fun$2
];
rvectorspaces.forEach(function(t) {
  typeinference["div"].push({
    args: [t, type.float],
    res: t
  });
});

//- ("pow", 2, OpPow.class); @done(2015-03-17)
typeinference["pow"] = [{
    args: [type.float, type.int],
    res: type.float
  },
  //{args: [type.positivefloat, type.float], res: type.positivefloat},
  //{args: [type.nonnegativefloat, type.nonnegativefloat], res: type.nonnegativefloat},
  //{args: [type.float, type.float], res: type.complex},
  {
    args: [type.complex, type.complex],
    res: type.complex
  }
];
//- ("re", 1, OpRe.class); @done(2015-03-17)
typeinference["re"] = [
  complex2float_fun$1 //no float_fun as not needed
];
//- ("conjugate", 1, OpConjugate.class); @done(2015-03-17)
typeinference["conjugate"] = [
  complex_fun$1
];
//- ("im", 1, OpIm.class); @done(2015-03-17)
typeinference["im"] = [
  complex2float_fun$1 //no float_fun as not needed
];
//- ("round", 1, OpRound.class); @done(2015-03-17)
typeinference["round"] = [{
  args: [type.float],
  res: type.int
}, {
  args: [type.complex],
  res: type.complex
}];
//- ("floor", 1, OpFloor.class); @done(2015-03-17)
typeinference["floor"] = [{
  args: [type.float],
  res: type.int
}, {
  args: [type.complex],
  res: type.complex
}];
//- ("ceil", 1, OpCeil.class); @done(2015-03-17)
typeinference["ceil"] = [{
  args: [type.float],
  res: type.int
}, {
  args: [type.complex],
  res: type.complex
}];
//- ("mod", 2, OpMod.class); @done(2015-03-17)
typeinference["mod"] = [
  int_fun$2,
  float_fun$2,
  complex_fun$2
];
//- ("random", 1, OpRandom.class); @done(2015-03-17)
typeinference["random"] = [
  float_fun$0,
  float_fun$1,
  complex_fun$1
];
//- ("randominteger", 1, OpRandomInteger.class); @done(2015-03-17)
typeinference["randominteger"] = [
  int_fun$1
];
//- ("randomint", 1, OpRandomInteger.class); @done(2015-03-17)
typeinference["randomint"] = [
  int_fun$1
];
//- ("seedrandom", 1, OpSeedRandom.class); @done(2015-03-17)
typeinference["seedrandom"] = [{
  args: [type.float],
  res: type.voidt
}];
//- ("randombool", 0, OpRandomBool.class); @done(2015-03-17)
typeinference["randombool"] = [{
  args: [],
  res: type.bool
}];
//- ("randomnormal", 0, OpRandomNormal.class); @done(2015-03-17)
typeinference["randomnormal"] = [{
  args: [],
  res: type.float
}];



//- ("dist", 2, OpDist.class); @done(2015-03-17)
//- ("perp", 2, OpPerp2.class); @done(2015-03-17)
//- ("perpendicular", 2, OpPerp2.class); @done(2015-03-17)
//- ("parallel", 2, OpPara.class); @done(2015-03-17)
//- ("para", 2, OpPara.class); @done(2015-03-17)
//- ("meet", 2, OpMeet.class); @done(2015-03-17)
//- ("join", 2, OpJoin.class); @done(2015-03-17)
//- ("area", 3, OpArea.class); @done(2015-03-17)
//- ("type.complex", 1, OpComplexFromPt.class); @done(2015-03-17)
//- ("gauss", 1, OpPtFromComplex.class); @done(2015-03-17)
//- ("line", 1, OpLine.class); @done(2015-03-17)
//- ("type.point", 1, OpPotype.int.class); @done(2015-03-17)
//- ("geotype", 1, OpGeotype.class);
//- ("perp", 1, OpPerp.class); @done(2015-03-17)
//- ("perpendicular", 1, OpPerp.class); @done(2015-03-17)
//- ("det", 3, OpDet3.class); @done(2015-03-17)
//- ("cross", 2, OpCross.class); @done(2015-03-17)
//- ("crossratio", 4, OpCrossRatio.class); @rethink




//operators.put(":", 20);
//- operators.put(".", 25); @tricky
//- operators.put("\u00b0", 25);    //Degree @done(2015-03-17)
//- operators.put("_", 50);    //x_i i-tes Element von x @done(2015-03-17)
typeinference["_"] = [{
  args: [type.vec2, type.int],
  res: type.float
}, {
  args: [type.vec3, type.int],
  res: type.float
}, {
  args: [type.vec4, type.int],
  res: type.float
}, {
  args: [type.vec2complex, type.int],
  res: type.complex
}];

//- operators.put("^", 50);    //hoch @done(2015-03-17)
typeinference["^"] = typeinference["pow"];
//- operators.put("*", 100);   //Multiplikation (auch für Vectoren, Scalarmul) @done(2015-03-17)
typeinference["*"] = typeinference["mult"];
//- operators.put("/", 100);   //Division (auch für Vectoren, Scalerdiv) @done(2015-03-17)
typeinference["/"] = typeinference["div"];
//- operators.put("+", 200);   //Addition (auch für Vectoren, Vectorsumme) @done(2015-03-17)
typeinference["+"] = typeinference["add"];
//- operators.put("-", 200);   //Subtraktion (auch für Vectoren, Vectordiff) @done(2015-03-17)
typeinference["-"] = typeinference["sub"];
//- operators.put("!", 200);   //Logisches Not (einstellig) @done(2015-03-17)
//- operators.put("==", 300);  //Equals @done(2015-03-17)
//- operators.put("~=", 300);  //approx Equals @done(2015-03-17)
//- operators.put("~<", 300);  //approx smaller @done(2015-03-17)
//- operators.put("~>", 300);  //approx greater @done(2015-03-17)
//- operators.put("=:=", 300); //Equals after evaluation


//- operators.put(">", 300);   //Größer @done(2015-03-17)
//- operators.put("<", 300);   //Kleiner @done(2015-03-17)
//- operators.put(">=", 300);  //Größergleich @done(2015-03-17)
//- operators.put("<=", 300);  //Kleinergleich @done(2015-03-17)
[">", "<", ">=", "<=", "=="].forEach(oper => //TODO: == also for other types
  typeinference[oper] = [
    int2bool_fun$2, float2bool_fun$2
  ]
);



//- operators.put("~>=", 300);  //ungefähr Größergleich @done(2015-03-17)
//- operators.put("~<=", 300);  //ungefähr Kleinergleich @done(2015-03-17)

//- operators.put("<>", 300);  //Ungleich @done(2015-03-17)
//- operators.put("&", 350);   //Logisches Und @done(2015-03-17)
typeinference["&"] = [
  bool_fun$2
];

//- operators.put("%", 350);   //Logisches Oder @done(2015-03-17)
typeinference["%"] = [
  bool_fun$2
];
//- operators.put("!=", 350);  //Ungleich @done(2015-03-17)
//- operators.put("~!=", 350);  //ungefhr Ungleich @done(2015-03-17)
//- operators.put("..", 350);  //Aufzählung 1..5=(1,2,3,4,5) @done(2015-03-17)
//- operators.put("++", 370);  //Listen Aneinanderhngen @done(2015-03-17)
//- operators.put("--", 370);  //Listen wegnehmen @done(2015-03-17)
//- operators.put("~~", 370);  //Gemeinsame Elemente @done(2015-03-17)
//- operators.put(":>", 370);  //Append List @done(2015-03-17)
//- operators.put("<:", 370);  //Prepend List @done(2015-03-17)
//- operators.put("=", 400);   //Zuweisung @tricky
typeinference["="] = [{
  args: [template1, template2],
  res: template2
}];
//- operators.put(":=", 400);  //Definition @tricky
//- operators.put(":=_", 400);  //Definition
//- operators.put("::=", 400);  //Definition
//- operators.put("->", 400);  //Modifier @done(2015-03-17)
//- operators.put(",", 500);   //Listen und Vektoren Separator @done(2015-03-17)
//- operators.put(";", 500);   //Befehlsseparator @done(2015-03-17)
typeinference[";"] = [{
    args: [template1, type.voidt],
    res: template1
  }, // ; at end of function
  {
    args: [template1, template2],
    res: template2
  }, {
    args: [template1],
    res: template1
  }
];


//- Abs and Dist |.....| @done(2015-03-17)


//Predicates:
//- ("istype.integer", 1, OpIsInteger.class); @done(2015-03-17)
//- ("isreal", 1, OpIsReal.class); @done(2015-03-17)
//- ("istype.complex", 1, OpIsComplex.class); @done(2015-03-17)
//- ("iseven", 1, OpIsEven.class); @done(2015-03-17)
//- ("isodd", 1, OpIsOdd.class); @done(2015-03-17)
//- ("isstring", 1, OpIsString.class); @done(2015-03-17)
//- ("ismatrix", 1, OpIsMatrix.class); @done(2015-03-17)
//- ("islist", 1, OpIsVector.class); @done(2015-03-17)
//- ("isnumbervector", 1, OpIsNumberVector.class); @done(2015-03-17)
//- ("isnumbermatrix", 1, OpIsNumberMatrix.class); @done(2015-03-17)
//- ("isgeometric", 1, OpIsGeometric.class); @rethink
//- ("isselected", 1, OpIsSelected.class);
//- ("istype.point", 1, OpIsPotype.int.class);
//- ("isline", 1, OpIsLine.class);
//- ("isconic", 1, OpIsConic.class);
//- ("iscircle", 1, OpIsCircle.class);
//- ("ismass", 1, OpIsMass.class);
//- ("issun", 1, OpIsSun.class);
//- ("isspring", 1, OpIsSpring.class);
//- ("isundefined", 1, OpIsUndefined.class);
//- ("isinport", 1, OpIsInPort.class);

//String  Functions:
//- ("text", 1, OpText.class);
//- ("parse", 1, OpParse.class); @done(2015-03-17)
//- ("substring", 3, OpSubstring.class); @done(2015-03-17)
//- ("replace", 3, OpReplace.class); @done(2015-03-17)
//- ("replace", 2, OpReplaceEn.class); @done(2015-03-17)
//- ("tokenize", 2, OpTokenizeString.class); @done(2015-03-17)
//- ("indexof", 2, OpFirstIndexOf.class); @done(2015-03-17)
//- ("indexof", 3, OpFirstIndexOf2.class); @done(2015-03-17)
//- ("unicode", 1, OpUnicode.class); @rethink
//- ("candisplay", 1, OpCanDisplay.class);leicht unvollstaendig

//Boolean  Functions:
//- ("not", 1, OpNot.class); @done(2015-03-17)
typeinference["not"] = [
  bool_fun$1
];
//- ("and", 2, OpAnd.class); @done(2015-03-17)
typeinference["and"] = [
  bool_fun$2
];
//- ("or", 2, OpOr.class); @done(2015-03-17)
typeinference["or"] = [
  bool_fun$2
];
//- ("xor", 2, OpXor.class); @done(2015-03-17)
typeinference["xor"] = [
  bool_fun$2
];

//Color functions:
//- ("red", 1, OpRed.class); @done(2015-03-17)
//- ("green", 1, OpGreen.class); @done(2015-03-17)
//- ("blue", 1, OpBlue.class); @done(2015-03-17)
//- ("gray", 1, OpGray.class); @done(2015-03-17)
//- ("grey", 1, OpGray.class); @done(2015-03-17)
//- ("hue", 1, OpHue.class); @done(2015-03-17)
["red", "green", "blue", "gray", "grey", "hue"].forEach(oper =>
  typeinference[oper] = [{
    args: [type.float],
    res: type.vec3
  }]
);




//Drawing functions:
//- ("repatype.int", 0, OpRepatype.int0.class);
//- ("repatype.int", 1, OpRepatype.int1.class);
//- ("wait", 1, OpRepatype.int1.class);
//- ("draw", 1, OpDraw.class);not errored @done(2015-03-17)
//- ("drawall", 1, OpDrawList.class); @done(2015-03-17)
//- ("connect", 1, OpConnectTheDots.class); @done(2015-03-17)
//- ("draw", 2, OpDrawSegment.class); @done(2015-03-17)
//- ("drawpolygon", 1, OpDrawPolygon.class); @done(2015-03-17)
//- ("drawpoly", 1, OpDrawPolygon.class); @done(2015-03-17)
//- ("fillpolygon", 1, OpFillPolygon.class); @done(2015-03-17)
//- ("fillpoly", 1, OpFillPolygon.class); @done(2015-03-17)
//- ("polygon", 1, OpPolygonShape.class); @done(2015-03-17)
//- ("circle", 2, OpCircleShape.class); @done(2015-03-17)
//- ("halfplane", 2, OpHalfplaneShape.class); @done(2015-03-17)
//- ("fill", 1, OpFillShape.class); @done(2015-03-17)
//- ("screen", 0, OpScreenShape.class); @done(2015-03-17)
//- ("clip", 1, OpClipShape.class); @done(2015-03-17)
//- ("drawcircle", 2, OpDrawCircle.class); @done(2015-03-17)
//- ("fillcircle", 2, OpFillCircle.class); @done(2015-03-17)
//- ("canvas", 3, OpCanvas.class); @rethink
//- ("canvas", 4, OpCanvas2.class); @rethink
//- ("canvas", 5, OpCanvas3.class); @rethink
//- ("createimage", 3, OpCreateImage.class); @rethink
//- ("removeimage", 1, OpRemoveImage.class); @rethink
//- ("drawimage", 2, OpDrawImage.class); //Bis auf die reference type.points @done(2015-03-17)
//- ("drawimage", 2, OpDrawImage.class); reference type.points
//- ("drawimage", 3, OpDrawImage2.class); @done(2015-03-17)
//- ("drawimage", 4, OpDrawImage3.class); @done(2015-03-17)
//- ("drawimage", 5, OpDrawImage4.class); @rethink
//- ("mapimage", 2, OpDeformedImage.class); @rethink
//- ("mapgrid", 1, OpDeformedGrid.class); @rethink
//- ("type.pointsize", 1, OpPotype.intSize.class); @done(2015-03-17)
//- ("linesize", 1, OpLineSize.class); @done(2015-03-17)
//- ("linedash", 1, OpLineDash.class);@todo document @rethink
//- ("textsize", 1, OpTextSize.class); @rethink
//- ("type.pointtype.color", 1, OpPotype.intColor.class); @done(2015-03-17)
//- ("linetype.color", 1, OpLineColor.class); @done(2015-03-17)
//- ("texttype.color", 1, OpTextColor.class); @rethink
//- ("type.color", 1, OpAllColor.class); @done(2015-03-17)
//- ("alpha", 1, OpAlpha.class); @done(2015-03-17)
//- ("renderquality", 1, OpRenderQuality.class);
//- ("gsave", 0, OpGsave.class); @done(2015-03-17)
//- ("grestore", 0, OpGrestore.class); @done(2015-03-17)
//- ("greset", 0, OpGreset.class); @done(2015-03-17)

//LAYERS:

//- ("layer", 1, OpLayer.class);  todo document
//- ("clearlayer", 1, OpEmptyLayer.class);  todo document
//- ("clearlayer", 0, OpClearScreen.class); todo document
//- ("clrscr", 0, OpClearScreen.class); todo document @done(2015-03-17)
//- ("autoclearlayer", 2, OpAutoClearLayer.class); todo document
//- ("screenbounds", 0, OpEuclideanBounds.class); todo documnet
//- ("screenresolution", 0, OpEuclideanResolution.class); todo documnet

//- ("imagesize", 1, OpImageSize.class); @done
//- 
//- ("imagergb", 3, OpImagePixel.class);
//- ("clearimage", 1, OpClearImage.class);

//- ("plot", 1, OpPlot.class);not errored @done(2015-03-17)
//- ("fillplot", 1, OpFillPlot.class);not errored @rethink
//- ("fillplot", 2, OpFillPlot2.class);not errored @rethink

//- ("plot", 2, OpPlot2.class);not errored @done(2015-03-17)
//- ("colorplot", 3, OpColorPlot.class);not errored
//- ("drawtext", 2, OpDrawString.class); @done(2015-03-17)
//- ("fontfamilies", 0, OpFontFamilies.class);
//- ("drawtable", 2, OpDrawTable.class);
//- ("drawcurves", 2, OpDrawOszi.class);not errored
//- ("drawforces", 1, OpDrawForces.class);not errored
//- ("drawforces", 0, OpDrawForcesProbe.class);not errored
//- ("drawfield", 1, OpDrawForceField.class);not errored
//- ("drawfieldtype.complex", 1, OpDrawComplexForceField.class);not errored

//- ("translate", 1, OpTranslate.class); @done(2015-03-17)
//- ("rotate", 1, OpRotate.class); @done(2015-03-17)
//- ("scale", 1, OpScale.class); @done(2015-03-17)
//- ("setbasis", 1, OpSetTransformation.class);
//- ("setbasis", 2, OpSetTransformation2.class);
//- ("setbasis", 3, OpSetTransformation3.class);
//- ("setbasis", 4, OpSetTransformation4.class);

//- ("if", 3, OpIfElse.class);  error @done(2015-03-17)
typeinference["if"] = [{
    args: [type.bool, template1, template1],
    res: template1
  }, {
    args: [type.bool, template1, template2],
    res: type.voidt
  }, //branch-types do not match
  //- ("if", 2, OpIf.class);  error @done(2015-03-17)
  {
    args: [type.bool, template1],
    res: template1
  }
];
//- ("trigger", 2, OpTrigger.class); @rethink
//- ("while", 2, OpWhile.class); @done(2015-03-17)
//- ("repeat", 2, OpRepeat.class); @done(2015-03-17)
typeinference["repeat"] = [{
  args: [type.int, template1],
  res: template1
}];
//- ("repeat", 3, OpRepeatVar.class); @done(2015-03-17)
//- ("forall", 2, OpForall.class); @done(2015-03-17)
//- ("forall", 3, OpForallVar.class); @done(2015-03-17)
//- ("createvar", 1, OpCreateLocalVar.class); @done(2015-03-17)
//- ("removevar", 1, OpDestroyLocalVar.class); @done(2015-03-17)
//- ("eval", 1, OpEval.class);
//- ("block", 1, OpBlock.class); d

//- ("d", 2, OpDerivate.class); @rethink
//- ("tangent", 2, OpTangente.class); @rethink

//- ("moveto", 2, OpMoveTo.class);
//- ("clear", 1, OpClear.class);
//- ("clear", 0, OpClearAll.class);
//- ("load", 1, OpLoadFile.class);
//- ("import", 1, OpImport.class);
//- ("importurl", 1, OpImportURL.class);
//- ("setdirectory", 1, OpSetDirectory.class);
//- ("resetclock", 0, OpResetClock.class);
//- ("seconds", 0, OpSeconds.class); @done(2015-03-17)
//- ("simulationtime", 0, OpSimulationtime.class); @rethink
//- ("time", 0, OpTime.class); @rethink
//- ("date", 0, OpDate.class); @rethink
//- ("locusdata", 1, OpLocusData.class);
//- ("amsdata", 0, OpAMSData.class);
//- ("leapdata", 0, OpLEAPData.class);
//- ("calibratedamsdata", 0, OpAMSDataCalibrated.class);
//- ("local", 0, OpLocalVariables.class); @done(2015-03-17)
//- ("regional", 0, OpFunktLocalVariables.class); @done(2015-03-17)
//- ("flocal", 0, OpFunktLocalVariables.class);

//- ("release", 0, OpDestroyLocalVariables.class);
//- nArys.put("release", "*");
//- ("addforce", 2, OpAddForce.class);
//- ("setforce", 2, OpSetForce.class);

//- ("format", 2, OpFormat.class); @done(2015-03-17)
//- ("guess", 1, OpPSLQGuess.class);
//- ("pslq", 1, OpPSLQGuess.class);
//- ("freevariables", 1, OpFreeVars.class);
//- ("simulation", 0, OpSimulation.class);
//- ("force", 1, OpForceProbe.class);

//- ("append", 2, OpAppend.class); @done(2015-03-17)
//- ("prepend", 2, OpPrepend.class); @done(2015-03-17)
//- ("concat", 2, OpConcatLists.class); @done(2015-03-17)
//- ("length", 1, OpLength.class); @done(2015-03-17)
//- ("take", 2, OpTake.class); @done(2015-03-17)
//- ("common", 2, OpCommon.class); @done(2015-03-17)
//- ("co nt ains", 2, OpContains.class); @done(2015-03-17)
//- ("remove", 2, OpRemove.class); @done(2015-03-17)
//- ("flatten", 1, OpFlatten.class); @done(2015-03-17)

//- ("alltype.points", 0, OpAlltype.points.class); @done(2015-03-17)
//- ("allmasses", 0, OpAllmasses.class); @rethink
//- ("alllines", 0, OpAlllines.class); @done(2015-03-17)
//- ("allelements", 0, OpAllElements.class); @rethink
//- ("allconics", 0, OpAllconics.class); @rethink
//- ("allcircles", 0, OpAllcircles.class); @rethink
//- ("allsegments", 0, OpAllsegments.class); @rethink
//- ("allsprings", 0, OpAllsprings.class); @rethink

//- ("select", 2, OpSelect.class); @done(2015-03-17)
//- ("select", 3, OpSelectVar.class); @done(2015-03-17)
//- ("apply", 2, OpApply.class); @done(2015-03-17)
//- ("apply", 3, OpApplyVar.class); @done(2015-03-17)
typeinference["apply"] = [{
  args: [{
    type: "list",
    length: template1,
    members: template2
  }, {
    type: "expression",
    args: template2,
    res: template3
  }],
  res: {
    type: "list",
    length: template1,
    members: template3
  }
}];

//- ("pairs", 1, OpPairs.class); @done(2015-03-17)
//- ("directproduct", 2, OpDirectProduct.class); @done(2015-03-17)
//- ("triples", 1, OpTriples.class); @done(2015-03-17)
//- ("consecutive", 1, OpConsecutive.class); @done(2015-03-17)
//- ("cycle", 1, OpCycle.class); @done(2015-03-17)
//- ("reverse", 1, OpReverse.class); @done(2015-03-17)
//- ("set", 1, OpSet.class); @done(2015-03-17)
//- ("sort", 1, OpSort.class); @done(2015-03-17)
//- ("sort", 2, OpSortByVal.class); @done(2015-03-17)
//- ("sort", 3, OpSortValVar.class); @done(2015-03-17)
//- ("nil", 0, OpEmptyList.class);not used

//- ("sum", 1, OpSum.class); @done(2015-03-17)
//- ("sum", 2, OpSumFun.class); @done(2015-03-17)
//- ("sum", 3, OpSumFunVar.class); @done(2015-03-17)
//- ("product", 1, OpProd.class); @done(2015-03-17)
//- ("product", 2, OpProdFun.class); @done(2015-03-17)
//- ("product", 3, OpProdFunVar.class); @done(2015-03-17)
//- ("max", 1, OpMax.class); @done(2015-03-17)
//- ("max", 2, OpMaxFun.class); @done(2015-03-17)
//- ("max", 3, OpMaxFunVar.class); @done(2015-03-17)
//- ("min", 1, OpMin.class); @done(2015-03-17)
typeinference["min"] = [
  int_fun$2,
  float_fun$2
];

typeinference["max"] = [
  int_fun$2,
  //{args: [type.float, type.positivefloat], res: type.positivefloat},
  //{args: [type.positivefloat, type.float], res: type.positivefloat},
  //{args: [type.float, type.nonnegativefloat], res: type.nonnegativefloat},
  //{args: [type.nonnegativefloat, type.float], res: type.nonnegativefloat},
  float_fun$2
];
//- ("min", 2, OpMinFun.class); @done(2015-03-17)
//- ("min", 3, OpMinFunVar.class); @done(2015-03-17)
//- ("keys", 1, OpKeys.class); @rethink
//- ("matrixrowcolumn", 1, OpMatrixRowColumn.class); @done(2015-03-17)
//- ("transpose", 1, OpTranspose.class); @done(2015-03-17)
//- ("adj", 1, OpAdjotype.int.class); @rethink
//- ("inverse", 1, OpInverse.class); @done(2015-03-17)
//- ("eigenvectors", 1, OpEigenvectors.class); @rethink
//- ("eigenvalues", 1, OpEigenvalues.class); @rethink
//- ("linearsolve", 2, OpLinearSolve.class); @rethink
//- ("row", 2, OpRow.class); @done(2015-03-17)
//- ("column", 2, OpColumn.class); @done(2015-03-17)
//- ("submatrix", 3, OpSubmatrix.class); @rethink
//- ("zerovector", 1, OpZeroVector.class); @done(2015-03-17)
//- ("zeromatrix", 2, OpZeroMatrix.class); @done(2015-03-17)
//- ("det", 1, OpDetJampack.class); @rethink
//- ("rowmatrix", 1, OpRowMatrix.class); @done(2015-03-17)
//- ("columnmatrix", 1, OpColumnMatrix.class); @done(2015-03-17)
//- ("map", 2, OpTransform2.class); @done(2015-03-17)
//- ("map", 4, OpTransform4.class); @done(2015-03-17)
//- ("map", 6, OpTransform6.class); @done(2015-03-17)
//- ("map", 8, OpTransform8.class); @done(2015-03-17)
//- ("type.pointreflect", 1, OpReflectPotype.int.class); @done(2015-03-17)
//- ("linereflect", 1, OpReflectLine.class); @done(2015-03-17)
//- ("roots", 1, OpPolynomialRoot.class); @rethink
//- ("convexhull3d", 1, OpConvexHull3D.class); @rethink

//- ("hermitianproduct", 2, OpScalProd.class); @rethink
//- ("hermiteanproduct", 2, OpScalProd.class); @rethink

//- ("mover", 0, OpLastMover.class); @rethink
//- ("mouse", 0, OpLastMouse.class); @done(2015-03-17)
//- ("key", 0, OpLastKey.class); @rethink

//- ("elementsatmouse", 0, OpElementsAtMouse.class);
//- ("err", 1, OpErr.class);
//- ("message", 1, OpMessage.class);
//- ("clearconsole", 0, OpClearConsole.class);
//- ("prtype.int", 1, OpPrtype.int.class);
//- ("prtype.intln", 1, OpPrtype.intln.class); @done(2015-03-17)
//- ("prtype.intln", 0, OpPrtype.intln0.class);
//- ("assert", 2, OpAssert.class);

//- ("texform", 1, OpTeXForm.class);  todo document
//- ("expressiontree", 1, OpTermTree.class);  todo document
//- ("functionbody", 1, OpFunctionBody.class);  todo document

//- ("pauseanimation", 0, OpAnimationPause.class);
//- ("playanimation", 0, OpAnimationPlay.class);
//- ("stopanimation", 0, OpAnimationStop.class);

//- ("playtone", 1, OpMidiTone.class); @rethink
//- ("stoptone", 1, OpMidiToneOff.class); @rethink
//- ("instrument", 1, OpMidiSetInstrument.class); @rethink
//- ("instrumentnames", 0, OpMidiInstruments.class); @rethink
//- ("midicontrol", 2, OpMidiChannelControl.class); @rethink
//- ("midichannel", 1, OpMidiSetChannel.class); @rethink
//- ("midivolume", 1, OpMidiChannelVolume.class); @rethink
//- ("playfrequency", 1, OpMidiFrequency.class); @rethink
//- ("playmelody", 1, OpMidiSequence.class); @rethink
//- ("midiaddtrack", 1, OpMidiAddTrack.class); @rethink
//- ("midistart", 0, OpMidiStart.class); @rethink
//- ("midistop", 0, OpMidiStop.class); @rethink
//- ("midiposition", 0, OpMidiSequencePosition.class); @rethink
//- ("midiposition", 1, OpMidiSequencePosition1.class); @rethink
//- ("midispeed", 0, OpMidiSequencerSpeed.class); @rethink
//- ("midispeed", 1, OpMidiSequencerSpeed1.class); @rethink

//- ("playfunction", 1, OpPlayFunction.class); @rethink
//- ("playsin", 1, OpPlayCont.class); @rethink
//- ("playwave", 1, OpPlayWave.class); @rethink
//- ("stopsound", 0, OpSoundStop.class); @rethink
//- ("playsample", 1, OpPlaySample.class); @rethink

//- ("startrecording", 0, OpWriteSoundFile.class); @rethink
//- ("writerecording", 1, OpStopSoundRecording.class); @rethink


typeinference["complex"] = [{
  args: [type.vec2],
  res: type.complex
}];

typeinference["re"] = [
  complex2float_fun$1
];

typeinference["im"] = [
  complex2float_fun$1
];

typeinference["genList"] = [{
    args: [type.float, type.float],
    res: type.vec2
  }, {
    args: [type.float, type.float, type.float],
    res: type.vec3
  }, {
    args: [type.float, type.float, type.float, type.float],
    res: type.vec4
  }, {
    args: [type.complex, type.complex],
    res: type.vec2complex
  }
  //@TODO: real lists in glsl
];

typeinference["imagergb"] = [{
  args: [type.string, type.coordinate2d],
  res: type.vec3
}, {
  args: [type.coordinate2d, type.coordinate2d, type.string, type.coordinate2d],
  res: type.vec3
}];

typeinference["imagergba"] = [{
  args: [type.string, type.coordinate2d],
  res: type.vec4
}, {
  args: [type.coordinate2d, type.coordinate2d, type.string, type.coordinate2d],
  res: type.vec4
}];

Object.freeze(typeinference);


preliminaryComputations();

Object.freeze(subtypegen);
Object.freeze(subtype);
Object.freeze(next);
