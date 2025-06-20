// determines minum degree needed for a curve through `pointCount` points in general position
maxDegreeForLen(pointCount):=(
  regional(degree1p);
  // degree points
  // 1    2    3    4    5    6    7     8     9     10    ... d
  // 4-1  10-1 20-1 35-1 56-1 84-1 120-1 165-1 220-1 286-1 ... (d+1)*(d+2)*(d+3)/6 - 1 =: N
  // for d>0: (d+1)^3 <= (d+1)*(d+2)*(d+3) <= (d+2)^3
  // -> (d+1)^3 <= 6*(N+1) <= (d+2)^3 -> d+1 <= cbrt(6*(N+1)) <= d+2
  // -> cbrt(6*(N+1))-2 <= d <= cbrt(6*(N+1))-1 <= d+1
  // -> ceil(d) >= floor(cbrt(6*(N+1))-1)
  degree1p = floor((6*(pointCount+1))^(1/3)); // lower-bound for next integer after degree+1
  // return degree+1 if given points more than needed for degree
  if(degree1p*(degree1p+1)*(degree1p+2)/6-1<pointCount,
    degree1p
  ,
    degree1p-1
  );
);

// TODO? is is possible to speed up computations by doing vectorized multiplications on sub-lists, 
//   instead of element wise multiplications
// ? special function that returns true iff in compiled code to choose different algorithm for interpreted and compiled code

squaredCoords(p):=(
  (
    p_1*p_1,p_1*p_2,p_1*p_3,p_1*p_4,
    p_2*p_2,p_2*p_3,p_2*p_4,
    p_3*p_3,p_3*p_4,
    p_4*p_4
  )
);
cubedCoords(p):=(
  regional(s);
  s = squaredCoords(p); // xx xy xz xw yy yz yw zz zw ww
  (
    p_1*s_1,p_1*s_2,p_1*s_3,p_1*s_4,p_1*s_5,p_1*s_6,p_1*s_7,p_1*s_8,p_1*s_9,p_1*s_10,
    p_2*s_5,p_2*s_6,p_2*s_7,p_2*s_8,p_2*s_9,p_2*s_10,
    p_3*s_8,p_3*s_9,p_3*s_10,
    p_4*s_10
  )
);
coordsP4(p):=(
  regional(s);
  s = squaredCoords(p);
  coordsP2toP4(s);
);
coordsP2toP4(s):=(
  //s: xx xy xz xw yy yz yw zz zw ww
  // xxxx xxxy xxxz xxxw xxyy xxyz xxyw xxzz xxzw xxww
  // xyyy xyyz xyyw xyzz xyzw xyww xzzz xzzw xzww xwww
  // yyyy yyyz yyyw yyzz yyzw yyww
  // yzzz yzzw yzww ywww
  // zzzz zzzw zzww zwww
  // wwww
  (
    s_1*s_1,s_1*s_2,s_1*s_3,s_1*s_4,s_1*s_5,s_1*s_6,s_1*s_7,s_1*s_8,s_1*s_9,s_1*s_10,
    s_2*s_5,s_2*s_6,s_2*s_7,s_2*s_8,s_2*s_9,s_2*s_10,s_3*s_8,s_3*s_9,s_3*s_10,s_4*s_10,
    s_5*s_5,s_5*s_6,s_5*s_7,s_5*s_8,s_5*s_9,s_5*s_10,
    s_6*s_8,s_6*s_9,s_6*s_10,s_7*s_10,
    s_8*s_8,s_8*s_9,s_8*s_10,s_9*s_10,
    s_10*s_10
  )
);
coordsP5(p):=(
  regional(s);
  s = coordsP4(p);
  (
    p_1*s_1,p_1*s_2,p_1*s_3,p_1*s_4,p_1*s_5,p_1*s_6,p_1*s_7,p_1*s_8,p_1*s_9,p_1*s_10,p_1*s_11,p_1*s_12,
      p_1*s_13,p_1*s_14,p_1*s_15,p_1*s_16,p_1*s_17,p_1*s_18,p_1*s_19,p_1*s_20,p_1*s_21,p_1*s_22,p_1*s_23,
      p_1*s_24,p_1*s_25,p_1*s_26,p_1*s_27,p_1*s_28,p_1*s_29,p_1*s_30,p_1*s_31,p_1*s_32,p_1*s_33,p_1*s_34,p_1*s_35,
    p_2*s_21,p_2*s_22,p_2*s_23,p_2*s_24,p_2*s_25,p_2*s_26,p_2*s_27,p_2*s_28,p_2*s_29,p_2*s_30,p_2*s_31,
      p_2*s_32,p_2*s_33,p_2*s_34,p_2*s_35,
    p_3*s_31,p_3*s_32,p_3*s_33,p_3*s_34,p_3*s_35,
    p_4*s_35
  );
);
coordsP6(p):=(
  regional(s,q);
  s = squaredCoords(p);
  q = coordsP2toP4(s);
  (
    s_1*q_1,s_1*q_2,s_1*q_3,s_1*q_4,s_1*q_5,s_1*q_6,s_1*q_7,s_1*q_8,s_1*q_9,s_1*q_10,s_1*q_11,s_1*q_12,
      s_1*q_13,s_1*q_14,s_1*q_15,s_1*q_16,s_1*q_17,s_1*q_18,s_1*q_19,s_1*q_20,s_1*q_21,s_1*q_22,s_1*q_23,
      s_1*q_24,s_1*q_25,s_1*q_26,s_1*q_27,s_1*q_28,s_1*q_29,s_1*q_30,s_1*q_31,s_1*q_32,s_1*q_33,s_1*q_34,
      s_1*q_35,
    s_2*q_21,s_2*q_22,s_2*q_23,s_2*q_24,s_2*q_25,s_2*q_26,s_2*q_27,s_2*q_28,s_2*q_29,s_2*q_30,s_2*q_31,
      s_2*q_32,s_2*q_33,s_2*q_34,s_2*q_35,s_3*q_31,s_3*q_32,s_3*q_33,s_3*q_34,s_3*q_35,s_4*q_35,
    s_5*q_21,s_5*q_22,s_5*q_23,s_5*q_24,s_5*q_25,s_5*q_26,s_5*q_27,
      s_5*q_28,s_5*q_29,s_5*q_30,s_5*q_31,s_5*q_32,s_5*q_33,s_5*q_34,s_5*q_35,
    s_6*q_31,s_6*q_32,s_6*q_33,s_6*q_34,s_6*q_35,s_7*q_35,
    s_8*q_31,s_8*q_32,s_8*q_33,s_8*q_34,s_8*q_35,s_9*q_35,
    s_10*q_35
  );
);
coordsP7(p):=(
  regional(s);
  s = coordsP6(p);
  // this is simply the calculation of three scalar-vector products
  // implemented using single list constructor as compiled does not support concatenation
  (
    p_1*s_1,p_1*s_2,p_1*s_3,p_1*s_4,p_1*s_5,p_1*s_6,p_1*s_7,p_1*s_8,p_1*s_9,p_1*s_10,p_1*s_11,p_1*s_12,
      p_1*s_13,p_1*s_14,p_1*s_15,p_1*s_16,p_1*s_17,p_1*s_18,p_1*s_19,p_1*s_20,p_1*s_21,p_1*s_22,p_1*s_23,
      p_1*s_24,p_1*s_25,p_1*s_26,p_1*s_27,p_1*s_28,p_1*s_29,p_1*s_30,p_1*s_31,p_1*s_32,p_1*s_33,p_1*s_34,
      p_1*s_35,p_1*s_36,p_1*s_37,p_1*s_38,p_1*s_39,p_1*s_40,p_1*s_41,p_1*s_42,p_1*s_43,p_1*s_44,p_1*s_45,
      p_1*s_46,p_1*s_47,p_1*s_48,p_1*s_49,p_1*s_50,p_1*s_51,p_1*s_52,p_1*s_53,p_1*s_54,p_1*s_55,p_1*s_56,
      p_1*s_57,p_1*s_58,p_1*s_59,p_1*s_60,p_1*s_61,p_1*s_62,p_1*s_63,p_1*s_64,p_1*s_65,p_1*s_66,p_1*s_67,
      p_1*s_68,p_1*s_69,p_1*s_70,p_1*s_71,p_1*s_72,p_1*s_73,p_1*s_74,p_1*s_75,p_1*s_76,p_1*s_77,p_1*s_78,
      p_1*s_79,p_1*s_80,p_1*s_81,p_1*s_82,p_1*s_83,p_1*s_84,
    p_2*s_57,p_2*s_58,p_2*s_59,p_2*s_60,p_2*s_61,p_2*s_62,p_2*s_63,p_2*s_64,p_2*s_65,p_2*s_66,
      p_2*s_67,p_2*s_68,p_2*s_69,p_2*s_70,p_2*s_71,p_2*s_72,p_2*s_73,p_2*s_74,p_2*s_75,p_2*s_76,p_2*s_77,
      p_2*s_78,p_2*s_79,p_2*s_80,p_2*s_81,p_2*s_82,p_2*s_83,p_2*s_84,
    p_3*s_78,p_3*s_79,p_3*s_80,p_3*s_81,p_3*s_82,p_3*s_83,p_3*s_84,
    p_4*s_84
  );
);
coordsP8(p):=(
  regional(q);
  q = coordsP4(p);
  coordsP4toP8(q);
);
coordsP4toP8(q):=(
  (
    q_1*q_1,q_1*q_2,q_1*q_3,q_1*q_4,q_1*q_5,q_1*q_6,q_1*q_7,q_1*q_8,q_1*q_9,q_1*q_10,q_1*q_11,q_1*q_12,
      q_1*q_13,q_1*q_14,q_1*q_15,q_1*q_16,q_1*q_17,q_1*q_18,q_1*q_19,q_1*q_20,q_1*q_21,q_1*q_22,q_1*q_23,
      q_1*q_24,q_1*q_25,q_1*q_26,q_1*q_27,q_1*q_28,q_1*q_29,q_1*q_30,q_1*q_31,q_1*q_32,q_1*q_33,q_1*q_34,
      q_1*q_35,q_2*q_21,q_2*q_22,q_2*q_23,q_2*q_24,q_2*q_25,q_2*q_26,q_2*q_27,q_2*q_28,q_2*q_29,q_2*q_30,
      q_2*q_31,q_2*q_32,q_2*q_33,q_2*q_34,q_2*q_35,q_3*q_31,q_3*q_32,q_3*q_33,q_3*q_34,q_3*q_35,q_4*q_35,
      q_5*q_21,q_5*q_22,q_5*q_23,q_5*q_24,q_5*q_25,q_5*q_26,q_5*q_27,q_5*q_28,q_5*q_29,q_5*q_30,q_5*q_31,
      q_5*q_32,q_5*q_33,q_5*q_34,q_5*q_35,q_6*q_31,q_6*q_32,q_6*q_33,q_6*q_34,q_6*q_35,q_7*q_35,q_8*q_31,
      q_8*q_32,q_8*q_33,q_8*q_34,q_8*q_35,q_9*q_35,q_10*q_35,q_11*q_21,q_11*q_22,q_11*q_23,q_11*q_24,
      q_11*q_25,q_11*q_26,q_11*q_27,q_11*q_28,q_11*q_29,q_11*q_30,q_11*q_31,q_11*q_32,q_11*q_33,q_11*q_34,
      q_11*q_35,q_12*q_31,q_12*q_32,q_12*q_33,q_12*q_34,q_12*q_35,q_13*q_35,q_14*q_31,q_14*q_32,q_14*q_33,
      q_14*q_34,q_14*q_35,q_15*q_35,q_16*q_35,q_17*q_31,q_17*q_32,q_17*q_33,q_17*q_34,q_17*q_35,q_18*q_35,
      q_19*q_35,q_20*q_35,
    q_21*q_21,q_21*q_22,q_21*q_23,q_21*q_24,q_21*q_25,q_21*q_26,q_21*q_27,q_21*q_28,q_21*q_29,q_21*q_30,
      q_21*q_31,q_21*q_32,q_21*q_33,q_21*q_34,q_21*q_35,q_22*q_31,q_22*q_32,q_22*q_33,q_22*q_34,q_22*q_35,
      q_23*q_35,q_24*q_31,q_24*q_32,q_24*q_33,q_24*q_34,q_24*q_35,q_25*q_35,q_26*q_35,q_27*q_31,q_27*q_32,
      q_27*q_33,q_27*q_34,q_27*q_35,q_28*q_35,q_29*q_35,q_30*q_35,
    q_31*q_31,q_31*q_32,q_31*q_33,q_31*q_34,q_31*q_35,q_32*q_35,q_33*q_35,q_34*q_35,
    q_35*q_35
  );
);
coordsP9(p):=(
  regional(o);
  o = coordsP8(p);
  (
    p_1*o_1,p_1*o_2,p_1*o_3,p_1*o_4,p_1*o_5,p_1*o_6,p_1*o_7,p_1*o_8,p_1*o_9,p_1*o_10,p_1*o_11,p_1*o_12,
      p_1*o_13,p_1*o_14,p_1*o_15,p_1*o_16,p_1*o_17,p_1*o_18,p_1*o_19,p_1*o_20,p_1*o_21,p_1*o_22,p_1*o_23,
      p_1*o_24,p_1*o_25,p_1*o_26,p_1*o_27,p_1*o_28,p_1*o_29,p_1*o_30,p_1*o_31,p_1*o_32,p_1*o_33,p_1*o_34,
      p_1*o_35,p_1*o_36,p_1*o_37,p_1*o_38,p_1*o_39,p_1*o_40,p_1*o_41,p_1*o_42,p_1*o_43,p_1*o_44,p_1*o_45,
      p_1*o_46,p_1*o_47,p_1*o_48,p_1*o_49,p_1*o_50,p_1*o_51,p_1*o_52,p_1*o_53,p_1*o_54,p_1*o_55,p_1*o_56,
      p_1*o_57,p_1*o_58,p_1*o_59,p_1*o_60,p_1*o_61,p_1*o_62,p_1*o_63,p_1*o_64,p_1*o_65,p_1*o_66,p_1*o_67,
      p_1*o_68,p_1*o_69,p_1*o_70,p_1*o_71,p_1*o_72,p_1*o_73,p_1*o_74,p_1*o_75,p_1*o_76,p_1*o_77,p_1*o_78,
      p_1*o_79,p_1*o_80,p_1*o_81,p_1*o_82,p_1*o_83,p_1*o_84,p_1*o_85,p_1*o_86,p_1*o_87,p_1*o_88,p_1*o_89,
      p_1*o_90,p_1*o_91,p_1*o_92,p_1*o_93,p_1*o_94,p_1*o_95,p_1*o_96,p_1*o_97,p_1*o_98,p_1*o_99,p_1*o_100,
      p_1*o_101,p_1*o_102,p_1*o_103,p_1*o_104,p_1*o_105,p_1*o_106,p_1*o_107,p_1*o_108,p_1*o_109,p_1*o_110,
      p_1*o_111,p_1*o_112,p_1*o_113,p_1*o_114,p_1*o_115,p_1*o_116,p_1*o_117,p_1*o_118,p_1*o_119,p_1*o_120,
      p_1*o_121,p_1*o_122,p_1*o_123,p_1*o_124,p_1*o_125,p_1*o_126,p_1*o_127,p_1*o_128,p_1*o_129,p_1*o_130,
      p_1*o_131,p_1*o_132,p_1*o_133,p_1*o_134,p_1*o_135,p_1*o_136,p_1*o_137,p_1*o_138,p_1*o_139,p_1*o_140,
      p_1*o_141,p_1*o_142,p_1*o_143,p_1*o_144,p_1*o_145,p_1*o_146,p_1*o_147,p_1*o_148,p_1*o_149,p_1*o_150,
      p_1*o_151,p_1*o_152,p_1*o_153,p_1*o_154,p_1*o_155,p_1*o_156,p_1*o_157,p_1*o_158,p_1*o_159,p_1*o_160,
      p_1*o_161,p_1*o_162,p_1*o_163,p_1*o_164,p_1*o_165,
    p_2*o_121,p_2*o_122,p_2*o_123,p_2*o_124,p_2*o_125,p_2*o_126,p_2*o_127,p_2*o_128,p_2*o_129,p_2*o_130,
      p_2*o_131,p_2*o_132,p_2*o_133,p_2*o_134,p_2*o_135,p_2*o_136,p_2*o_137,p_2*o_138,p_2*o_139,p_2*o_140,
      p_2*o_141,p_2*o_142,p_2*o_143,p_2*o_144,p_2*o_145,p_2*o_146,p_2*o_147,p_2*o_148,p_2*o_149,p_2*o_150,
      p_2*o_151,p_2*o_152,p_2*o_153,p_2*o_154,p_2*o_155,p_2*o_156,p_2*o_157,p_2*o_158,p_2*o_159,p_2*o_160,
      p_2*o_161,p_2*o_162,p_2*o_163,p_2*o_164,p_2*o_165,
    p_3*o_157,p_3*o_158,p_3*o_159,p_3*o_160,p_3*o_161,p_3*o_162,p_3*o_163,p_3*o_164,p_3*o_165,
    p_4*o_165
  )
);
coordsP10(p):=(
  regional(o);
  s = squaredCoords(p);
  o = coordsP4toP8(coordsP2toP4(s));
  (
    s_1*o_1,s_1*o_2,s_1*o_3,s_1*o_4,s_1*o_5,s_1*o_6,s_1*o_7,s_1*o_8,s_1*o_9,s_1*o_10,s_1*o_11,s_1*o_12,
      s_1*o_13,s_1*o_14,s_1*o_15,s_1*o_16,s_1*o_17,s_1*o_18,s_1*o_19,s_1*o_20,s_1*o_21,s_1*o_22,s_1*o_23,
      s_1*o_24,s_1*o_25,s_1*o_26,s_1*o_27,s_1*o_28,s_1*o_29,s_1*o_30,s_1*o_31,s_1*o_32,s_1*o_33,s_1*o_34,
      s_1*o_35,s_1*o_36,s_1*o_37,s_1*o_38,s_1*o_39,s_1*o_40,s_1*o_41,s_1*o_42,s_1*o_43,s_1*o_44,s_1*o_45,
      s_1*o_46,s_1*o_47,s_1*o_48,s_1*o_49,s_1*o_50,s_1*o_51,s_1*o_52,s_1*o_53,s_1*o_54,s_1*o_55,s_1*o_56,
      s_1*o_57,s_1*o_58,s_1*o_59,s_1*o_60,s_1*o_61,s_1*o_62,s_1*o_63,s_1*o_64,s_1*o_65,s_1*o_66,s_1*o_67,
      s_1*o_68,s_1*o_69,s_1*o_70,s_1*o_71,s_1*o_72,s_1*o_73,s_1*o_74,s_1*o_75,s_1*o_76,s_1*o_77,s_1*o_78,
      s_1*o_79,s_1*o_80,s_1*o_81,s_1*o_82,s_1*o_83,s_1*o_84,s_1*o_85,s_1*o_86,s_1*o_87,s_1*o_88,s_1*o_89,
      s_1*o_90,s_1*o_91,s_1*o_92,s_1*o_93,s_1*o_94,s_1*o_95,s_1*o_96,s_1*o_97,s_1*o_98,s_1*o_99,s_1*o_100,
      s_1*o_101,s_1*o_102,s_1*o_103,s_1*o_104,s_1*o_105,s_1*o_106,s_1*o_107,s_1*o_108,s_1*o_109,s_1*o_110,
      s_1*o_111,s_1*o_112,s_1*o_113,s_1*o_114,s_1*o_115,s_1*o_116,s_1*o_117,s_1*o_118,s_1*o_119,s_1*o_120,
      s_1*o_121,s_1*o_122,s_1*o_123,s_1*o_124,s_1*o_125,s_1*o_126,s_1*o_127,s_1*o_128,s_1*o_129,s_1*o_130,
      s_1*o_131,s_1*o_132,s_1*o_133,s_1*o_134,s_1*o_135,s_1*o_136,s_1*o_137,s_1*o_138,s_1*o_139,s_1*o_140,
      s_1*o_141,s_1*o_142,s_1*o_143,s_1*o_144,s_1*o_145,s_1*o_146,s_1*o_147,s_1*o_148,s_1*o_149,s_1*o_150,
      s_1*o_151,s_1*o_152,s_1*o_153,s_1*o_154,s_1*o_155,s_1*o_156,s_1*o_157,s_1*o_158,s_1*o_159,s_1*o_160,
      s_1*o_161,s_1*o_162,s_1*o_163,s_1*o_164,s_1*o_165,
    s_2*o_121,s_2*o_122,s_2*o_123,s_2*o_124,s_2*o_125,s_2*o_126,s_2*o_127,s_2*o_128,s_2*o_129,s_2*o_130,
      s_2*o_131,s_2*o_132,s_2*o_133,s_2*o_134,s_2*o_135,s_2*o_136,s_2*o_137,s_2*o_138,s_2*o_139,s_2*o_140,
      s_2*o_141,s_2*o_142,s_2*o_143,s_2*o_144,s_2*o_145,s_2*o_146,s_2*o_147,s_2*o_148,s_2*o_149,s_2*o_150,
      s_2*o_151,s_2*o_152,s_2*o_153,s_2*o_154,s_2*o_155,s_2*o_156,s_2*o_157,s_2*o_158,s_2*o_159,s_2*o_160,
      s_2*o_161,s_2*o_162,s_2*o_163,s_2*o_164,s_2*o_165,s_3*o_157,s_3*o_158,s_3*o_159,s_3*o_160,s_3*o_161,
      s_3*o_162,s_3*o_163,s_3*o_164,s_3*o_165,s_4*o_165,
    s_5*o_121,s_5*o_122,s_5*o_123,s_5*o_124,s_5*o_125,s_5*o_126,s_5*o_127,s_5*o_128,s_5*o_129,s_5*o_130,
      s_5*o_131,s_5*o_132,s_5*o_133,s_5*o_134,s_5*o_135,s_5*o_136,s_5*o_137,s_5*o_138,s_5*o_139,s_5*o_140,
      s_5*o_141,s_5*o_142,s_5*o_143,s_5*o_144,s_5*o_145,s_5*o_146,s_5*o_147,s_5*o_148,s_5*o_149,s_5*o_150,
      s_5*o_151,s_5*o_152,s_5*o_153,s_5*o_154,s_5*o_155,s_5*o_156,s_5*o_157,s_5*o_158,s_5*o_159,s_5*o_160,
      s_5*o_161,s_5*o_162,s_5*o_163,s_5*o_164,s_5*o_165,
    s_6*o_157,s_6*o_158,s_6*o_159,s_6*o_160,s_6*o_161,s_6*o_162,s_6*o_163,s_6*o_164,s_6*o_165,s_7*o_165,
    s_8*o_157,s_8*o_158,s_8*o_159,s_8*o_160,s_8*o_161,s_8*o_162,s_8*o_163,s_8*o_164,s_8*o_165,s_9*o_165,
    s_10*o_165
  )
);
// TODO? add functions for n-th power coordinates up to degree 16?
// 11 -> 10+1
// 12 -> 8+4
// 13 -> 12+1
// 14 -> 12+2
// 15 -> 14+1
// 16 -> 8+8
// TODO is there a better way to compute the powers of homogeneous coordinates

coordsPnFct(n):=(
  if(n>4,
    if(n>6,
      if(n>8,
        if(n>10,
          cglLogError("unimplemented: coordsP"+text(n))
        ,
          if(n==10,
            cglLazy(p,coordsP10(p))
          ,// n==9
            cglLazy(p,coordsP9(p))
          )
        )
      ,
        if(n==8,
          cglLazy(p,coordsP8(p))
        ,// n==7
          cglLazy(p,coordsP7(p))
        )
      )
    ,
      if(n==6,
        cglLazy(p,coordsP6(p))
      ,// n==5
        cglLazy(p,coordsP5(p))
      )
    );
  ,
    if(n>2,
      if(n==4,
        cglLazy(p,coordsP4(p))
      ,// n==3
        cglLazy(p,cubedCoords(p))
      )
    ,
      if(n==2,
        cglLazy(p,squaredCoords(p))
      ,// n==1
        cglLazy(p,p);
      )
    )
  )
);
hom(p):=(
  if(length(p)==4,p,
    (p_1,p_2,p_3,1)
  )
);

// TODO? return degree (? and derivative)
// the limiting factor seems to be the computation of matrix-kernel
interpolateSurface(points):=(
  regional(maxDegree,samples,M,MM,K,coordPFct);
  maxDegree = maxDegreeForLen(length(points));
  degree = cglValOrDefault(degree,maxDegree);
  // restrict degree to maximum allowed degree for lenght
  degree = min(maxDegree,degree);
  // 1. convert samples to d-th power coordinates
  coordPFct = coordsPnFct(degree);
  samples = apply(points,p,cglEval(coordPFct,hom(p)));
  // 2. build matrix of samples points & find solution(s) for matrix equation
  // TODO checking the kernel is slow for large matrices -> find better way to obtain solution in singual case
  if(length(samples) <= length(samples_1)-1,
    print("degree: "+text(degree)+" missing: "+(length(samples_1)-length(samples)-1));
  ,
    print("degree: "+text(degree)+" additional: "+(length(samples)-length(samples_1)+1));
  );
  // assume that surface coefficents add up to 1
  M = append(samples,apply(samples_1,1));
  b = append(apply(samples,0),1);
  K = linearsolve(transpose(M)*M,transpose(M)*b);
  print(K);
  // TODO 4. simplify resulting equation
  // 5. create surface function from kernel vector
  {
    "degree": degree,
    "f": cglLazy((x,y,z),cglEval(coordP,(x,y,z,1))*cglCoeffVec,coordP->coordPFct),
    "df":  cglLazy((x,y,z),
      regional(p,n,kx,ky,kz);
      p = cglEval(coordP,(x,y,z,1));
      n = (0,0,0);
      // kx, ky, kz count how often does x/y/z appear in the coordinates of the current term
      // coordsP... returns the coefficients sorted in lexicographical order, 
      //   which allows to compute these factors iteratives using a relatively simple algorithm
      kx=D;ky=0;kz=0;
      repeat(length(cglCoeffVec),i,
        // TODO is there a way to avoid the rendering artifacts close to the coordinate axes
        n = n + cglCoeffVec_i * p_i * (kx/x,ky/y,kz/z);
        if(kz>0,
          kz = kz-1;
        ,if(ky>0,
          ky = ky-1;
          kz = D - (kx+ky);
        ,
          kx = kx-1;
          ky = D - kx;
        ));
      );
      normalize(n);
    ,coordP->coordPFct,D->(degree+1)),
    "plotModifiers":{"cglCoeffVec": K}
  }
  
);