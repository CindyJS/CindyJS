// determines minum degree needed for a curve through `pointCount` points in general position
maxDegreeForLen(pointCount):=(
  regional(degree1p);
  // degree points
  // 1   3
  // 2   9
  // 3   19
  // 4   35
  // 5   55
  // d   (d+1)*(d+2)*(d+3)/6 - 1 =: N
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

squaredCoords(p):=(
  (
    p_1*p_1,p_2*p_2,p_3*p_3,p_4*p_4,
    p_1*p_2,p_1*p_3,p_1*p_4,
    p_2*p_3,p_2*p_4,
    p_3*p_4
  )
);
cubedCoords(p):=(
  regional(s);
  s = squaredCoords(p); // xx yy zz ww xy xz xw yz yw zw
  (
    p_1*s_1,p_2*s_2,p_3*s_3,p_4*s_4,
    p_1*s_2,p_1*s_3,p_1*s_4,p_1*s_5,p_1*s_6,p_1*s_7,p_1*s_8,p_1*s_9,p_1*s_10,
    p_2*s_3,p_2*s_4,p_2*s_8,p_2*s_9,p_2*s_10,
    p_3*s_4,p_3*s_10
  )
);
coordsP4(p):=(
  regional(s);
  s = squaredCoords(p); // xx yy zz ww xy xz xw yz yw zw
  // xxxx yyyy zzzz wwww
  // xxyy xxzz xxww xxxy xxxz xxxw xxyz xxyw xxzw
  // xyyy xyzz xyww xyyz xyyw xyzw  xzzz xzww xzzw xwww
  // yyzz yyww yyyz yyyw yyzw
  // yzzz yzww yzzw ywww
  // zzww zzzw zwww
  (
    s_1*s_1,s_2*s_2,s_3*s_3,s_4*s_4,
    s_1*s_2,s_1*s_3,s_1*s_4,s_1*s_5,s_1*s_6,s_1*s_7,s_1*s_8,s_1*s_9,s_1*s_10,
    s_5*s_2,s_5*s_3,s_5*s_4,s_5*s_8,s_5*s_9,s_5*s_10,s_6*s_3,s_6*s_4,s_6*s_10,s_7*s_4,
    s_2*s_3,s_2*s_4,s_2*s_8,s_2*s_9,s_2*s_10,
    s_8*s_3,s_8*s_4,s_8*s_10,s_9*s_4,
    s_3*s_4,s_3*s_10,s_10*s_4
  )
);
coordsP5(p):=(
  regional(s);
  s = coordsP4(p);
  (
    s_1*p_1,s_2*p_2,s_3*p_3,s_4*p_4,
    p_1*s_2,p_1*s_3,p_1*s_4,p_1*s_5,p_1*s_6,p_1*s_7,p_1*s_8,p_1*s_9,p_1*s_10,p_1*s_11,p_1*s_12,
      p_1*s_13,p_1*s_14,p_1*s_15,p_1*s_16,p_1*s_17,p_1*s_18,p_1*s_19,p_1*s_20,p_1*s_21,p_1*s_22,
      p_1*s_23,p_1*s_24,p_1*s_25,p_1*s_26,p_1*s_27,p_1*s_28,p_1*s_29,p_1*s_30,p_1*s_31,p_1*s_32,
      p_1*s_33,p_1*s_34,p_1*s_35,
    p_2*s_3,p_2*s_4,p_2*s_24,p_2*s_25,p_2*s_26,p_2*s_27,p_2*s_28,p_2*s_29,p_2*s_30,p_2*s_31,
      p_2*s_32,p_2*s_33,p_2*s_34,p_2*s_35,
    p_3*s_4,p_3*s_34,p_3*s_35
  );
);
// TODO? add functions for n-th power coordinates up to degree 16?
// ? write code to auto-generate homogeneous power-function
// 6 -> 4+2
// 7 -> 6+1
// 8 -> 4+4
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
    if(n>5,
      cglLogError("unimplemented: coordsP"+text(n))
    ,
      cglLazy(p,coordsP5(p))
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

pickKernelElement(K):=(
  regional(C,median);
  if(length(K)==1,K_1,
    // TODO find good algorithm to maximize the number of relatively small elements
    if(length(K)==2,
      C=sort(apply(1..(length(K_1)),i,(K_1)_i/(K_2)_i)); // TODO? handle |K_2| >> |K_1|
      median = C_(length(C)/2); // TODO pick element with highest frequency instead of median element
      //  A A+eps A+2*eps  B B C C D D
      K_1-median*K_2;
    ,
      print(K);
      // TODO find element with high number of small entries
      K_1
    )
  )
);

// TODO? make degree modifier, defaulting to maxDegree
interpolateSurface(points):=(
  regional(maxDegree,samples,M,K,coordPFct);
  maxDegree = maxDegreeForLen(length(points));
  degree = cglValOrDefault(degree,maxDegree);
  // restrict degree to maximum allowed degree for lenght
  degree = min(maxDegree,degree);
  // 1. convert samples to d-th power coordinates
  coordPFct = coordsPnFct(degree);
  samples = apply(points,p,cglEval(coordPFct,hom(p)));
  // 2. build matrix of samples points & find solution(s) for matrix equation
  // TODO! handle overdetermined systems
  K = if(length(samples) <= length(samples_1)-1,
    print("underdeterimed: deg"+text(degree)+ " missing: "+(length(samples_1)-length(samples)-1));
    M = samples++apply(1..(length(samples_1)-length(samples)),apply(samples_1,0));
    K = transpose(kernel(M));
    K = pickKernelElement(K);
  ,
    print("overdetermined: deg"+text(degree)+" additional: "+(length(samples)-length(samples_1)+1));
    K = transpose(kernel(transpose(samples)*samples));
    // check if kernel of solution matrix is non-empty
    if(K_1*K_1>0,
      K=pickKernelElement(K);
    , // no solution in kernel, try to find solution with entries adding up to 1
      M = append(samples,apply(samples_1,1));
      b = append(apply(samples,0),1);
      K = linearsolve(transpose(M)*M,transpose(M)*b);
    )
  );
  print(K);
  // TODO 4. simplify resulting equation
  // 5. create surface function from kernel vector
  cglLazy((x,y,z),cglEval(coordP,(x,y,z,1))*K,coordP->coordPFct,K->K);
);