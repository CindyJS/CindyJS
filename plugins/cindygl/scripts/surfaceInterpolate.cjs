// determines minum degree needed for a curve through `pointCount` points in general position
maxDegreeForLen(pointCount):=(
  regional(degree1p);
  // degree points
  // 1    2    3    4    5    6    7     8     ... d
  // 4-1  10-1 20-1 35-1 56-1 84-1 120-1 165-1 ... (d+1)*(d+2)*(d+3)/6 - 1 =: N
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
// TODO? add functions for n-th power coordinates up to degree 16?
// ? write code to auto-generate general homogeneous power-function
// 9 -> 8+1
// 10 -> 8+2
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
        cglLogError("unimplemented: coordsP"+text(n))
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
  cglLazy((x,y,z),cglEval(coordP,(x,y,z,1))*K,coordP->coordPFct,K->K);
);