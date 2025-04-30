// intialization containing implementation for CindyGL3D functions

use("CindyGL");
normalize(v):=(v/|v|); // TODO? make built-in
/** maps the raw depth value given in the interval [0,inf) to a concrete depth in [0,1) and sets cglDepth accordingly */
cglSetDepth(rawDepth):=(
  regional(v);
  v = |cglViewPos|;
  cglDepth = 1-(v/(rawDepth+v));
  cglRawDepth = rawDepth;
);

/////////////////////
// light functions
/////////////////////
cglNoLight = cglLazy((color,viewDirection,normal),color);
cglSimpleLight = cglLazy((color,viewDirection,normal),
  regional(brightness);
  // normal towards view -> .75*brightness  ; normal away from view -> .45 * brightness
  brightness = viewDirection*normal;
  brightness = 0.25+0.6*abs(brightness)-0.15*brightness;
  brightness*color;
);
cglAddLight(material, lightcolor, lightdir, normal, gamma1,gamma2) := (
  regional(illumination,res);
  illumination = max(0,(lightdir/abs(lightdir))*normal);
  res=(illumination^gamma1+illumination^gamma2)*lightcolor;
  material=material+(1,1,1);
  (res_1*material_1,res_2*material_2,res_3*material_3);
);
cglComputeLight(direction,normal,col,pos):=(
  regional(colo,ambient,lightCol,lightdir0);
  lightCol=(1,1,1)*.1;
  lightdir0 = (-10, 10, 0.)-pos;
  ambient=.5;
  colo= col*ambient;
  colo= colo+cglAddLight(col,lightCol, lightdir0, normal, 3,20);
  colo= colo+cglAddLight(col,lightCol, lightdir0, normal, 3,20);
  colo= colo+cglAddLight(col,lightCol, direction, normal, 3,32);
  colo= colo+cglAddLight(col,lightCol, -direction, normal, 3,32);
  colo= colo+cglAddLight(col,lightCol, -direction, normal, 3,32);
);
// store light calculation in separate variable to allow recovering value after setting cglDefaultLight
cglDefaultLight0 = cglLazy((color,direction,normal),
  regional(col3,lightCol);
  // apply calcnextcolor only to first 3 components
  // this code should work for both colors of size 3 and 4
  col3=(color_1,color_2,color_3)*0.75;
  lightCol = 0.75*color; // ensure that lightCol is a float array
  lightCol = color; // local copy of color to ensure value is mutable
  col3=cglComputeLight(direction,normal,col3,cglViewPos+direction*cglRawDepth);
  lightCol_1=col3_1;
  lightCol_2=col3_2;
  lightCol_3=col3_3;
  lightCol;
);
// default light computation
cglDefaultLight=cglDefaultLight0;

/////////////////////
// internal state
/////////////////////

// empty list to hold mapping from top layer to list of layers in userdata
cglLayerInfo = []; // TODO? use dict
cglRememberLayers(layers):=(
  cglLayerInfo:(layers_(length(layers))) = layers;
  layers;
);
cglLayers(topLayer):=(
  regional(layers);
  layers =  cglLayerInfo:topLayer;
  if(isundefined(layers),
    [topLayer]
  ,
    layers;
  );
);

cglDefaultColorSphere = (1,0,0);
cglDefaultColorCylinder = (0,0,0);
cglDefaultColorTorus = (0,0,1);
cglDefaultSizeSphere = 0.5;
cglDefaultSizeCylinder = 0.4;
cglDefaultSizeTorus = 0.4;
cglDefaultCurveSamples = 32;

/////////////////////
// spheres
/////////////////////

cglSphereNormal(direction,center,isBack):=(
  regional(vc,b2,c,D4,r,dst,dst2,pos3d);
  // |v+l*d -c|=r
  vc=cglViewPos-center;
  // -> l*l <d,d> + l * 2<v-c,d> + <v-c,v-c> - r*r
  b2=(vc*direction); // 1/2 * b
  c=vc*vc-cglRadius*cglRadius;
  D4=b2*b2-c; // 1/4* ( b*b - 4 *a*c)
  if(D4<0,cglDiscard()); // discard rays that do not intersect the sphere
  r=re(sqrt(D4));
  dst=-b2-r;// sqrt should always be real
  dst2 = -b2+r;
  if(dst<0,
    if(isBack,cglDiscard());
    dst=dst2;
    if(dst<0,cglDiscard());
  );
  if(isBack,dst=dst2);
  pos3d = cglViewPos+ dst*direction;
  cglSetDepth(dst);
  normalize(pos3d - center);
);
cglSphereDepths(direction,center,radius):=(
  regional(vc,b2,c,D4,r);
  // |v+l*d -c|=r
  vc=cglViewPos-center;
  // -> l*l <d,d> + l * 2<v-c,d> + <v-c,v-c> - r*r
  b2=(vc*direction); // 1/2 * b
  c=vc*vc-radius*radius;
  D4=b2*b2-c; // 1/4* ( b*b - 4 *a*c)
  if(D4<0,cglDiscard()); // discard rays that do not intersect the sphere
  r=re(sqrt(D4)); // sqrt should always be real
  (-b2-r,-b2+r);
);
// stereographic projection from sphere onto C using normal verctor as input
// assumes normal is normalized
cglProjSphereToC(normal):=(
  // A = l (x,y,z) + (1-l) (0,0,1)
  // 0 = l z + (1-l) = 1 + l (z-1) -> l = 1 / (1-z)
  (normal_1)/(1-normal_3) + i* (normal_2)/(1-normal_3);
);
// project sphere onto unit square using normal as input
// 1. convert position into two angles
// 2. map angles onto square
// assumes that normal is normalized
cglProjSphereToSquare(normal):=(
  regional(phi,theta);
  phi = arctan2(-normal_3,normal_1); // (-pi, pi]
  theta = arctan2(|(normal_1,normal_3)|,normal_2); // (-pi, pi]
  (1/(2*pi))*(phi+pi,2*theta+pi);
);

cglDefaultSphereProjection = cglLazy(normal,cglProjSphereToSquare(normal));

cgl3dSphereShaderCode(direction,isBack):=(
  regional(normal,texturePos,color);
  normal = cglSphereNormal(direction,cglCenter,isBack);
  texturePos = cglEval(projection,normal);
  color = cglEval(pixelExpr,texturePos);
  cglEval(light,color,direction,normal);
);

/////////////////////
// cylinder
/////////////////////

// the two distances where the viewRay in the given direction intersects the cylinder defined by cglCenter, cglOrientation and cglRadius
cglCylinderDepths(direction):=(
  regional(w,W,BA,U,VA,S,T,a,b,c,D,r);
    // P lies on infinite cylinder around axis AB with radius r iff
    // |(P-A) - <P-A,B-A>/<B-A,B-A>*(B-A)| = r
    // P = V+l*D, BA = B-A , U := (B - A)/|B-A|²
    // |((V+l*D)-A) - <(V+l*D)-A,BA>*U| = r
    // |(V-A)-<V-A,BA>*U + l*(D-<D,BA>*U)| = r
    // S := (V-A)-<V-A,BA>*U,  T := <D,BA>*U+D
    // |S + l*T| = r
    // <S-l*T,S-l*T>-r²=0 -> l² <T,T> + l 2<S,T> + <S,S> - r^2 =0

    // pick point on viewRay closer to cylinder to increase numeric stability
    w = |cglViewPos-cglCenter|;
    W = cglViewPos + w*direction;
    BA = cglOrientation;
    U = BA/(BA*BA);
    VA = (W-cglCenter);
    S = VA - (VA*BA)*U;
    T = direction - (direction*BA)*U;
    a = T*T;
    b = S*T;
    c = S*S -cglRadius*cglRadius;
    D= b*b-a*c;
    if(D<0,cglDiscard()); // discard rays that do not intersect the cylinder
    r = re(sqrt(D));
    // TODO? discard negative distances form view
    (w - (b + r)/a, w - (b - r)/a);
);
// intersections of ray in given direction with cylinder with circular end-caps
// needed for bounding box computations
cglCappedCylinderDepths(direction):=( // TODO? make indenpendent of render-bounding box
  regional(w,W,BA,U,VA,S,T,a,b,c,o,D,r,l,v,d,m0t,m1t,m0,m1,low,hi);
  w = |cglViewPos-cglCenter|;
  W = cglViewPos + w*direction;
  BA = cglOrientation;
  U = BA/(BA*BA);
  VA = (W-cglCenter);
  S = VA - (VA*BA)*U;
  T = direction - (direction*BA)*U;
  a = T*T;
  b = S*T;
  c = S*S -cglRadius*cglRadius;
  D= b*b-a*c;
  if(D<0,cglDiscard()); // discard rays that do not intersect the cylinder
  r = re(sqrt(D));
  l = (- (b + r)/a, - (b - r)/a);
  // intersections with cutof planes
  // normal: U, values at ends: <A,B-A>, <B,B-A>
  // <view + m * dir,(B-A)> = <view,B-A> + m * <dir,B-A>
  d = direction * U;
  v = W * U;
  c = cglCenter * U;
  o = cglOrientation * U;
  // b >= v + m*d >= a -> (b-a)/d >= m >= (a-v)/d
  m0t = ((c-o)-v)/d;
  m1t = ((c+o)-v)/d;
  m0 = min(m0t,m1t);
  m1 = max(m0t,m1t);
  // lowBound: -w, m0, l_1
  // hi Bound: m1, l_2
  low = max(-w,max(m0,l_1));
  hi = min(m1,l_2);
  if(hi<=low,cglDiscard());
  [low+w,hi+w];
);

// project cylinder onto unit square using normal and height as input
// assumes that normal is normalized, and height is in the range -1..1
cglProjCylinderToSquare(normal,height,orientation):=(
  regional(d1,d2);
  if(orientation_1<orientation_2,
    d1=normalize(cross(orientation,(1,0,0)));
  ,
    d1=normalize(cross(orientation,(0,1,0)));
  );
  d2 = -normalize(cross(orientation,d1));
  ((arctan2(d1*normal,d2*normal)+pi)/(2*pi),0.5*(height+1));
);

// TODO mark all local variables as regional
cglCapOpenShaderFront = cglLazy((direction,cylinderDepths,delta,U,cutVector),
    v2 = (cglViewPos+cylinderDepths_2*direction)-cglCenter;
    delta2 = v2*U;
    if(cglEval(cglCut1,delta2,v2)<-1,
      cglEval(cglCap1back,direction,cylinderDepths,-1,U,cglEval(cglGetCutVector1));
    ,if(cglEval(cglCut2,delta2,v2)>1,
      cglEval(cglCap2back,direction,cylinderDepths,1,U,cglEval(cglGetCutVector2));
    ,
      cglSetDepth(cylinderDepths_2);
      normal = normalize(v2-delta2*BA);
      (normal_1,normal_2,normal_3,delta2);
    ));
);
cglCapOpenShaderBack = cglLazy((direction,cylinderDepths,delta,U,cutVector),
    cglDiscard();
    (0,0,0,0) // compiler cannot detect that code is unreachable -> have to return correct type
    // TODO make compiler realize that code after discard is unreachable
);
cglCapRoundShaderFront = cglLazy((direction,cylinderDepths,delta,U,cutVector),
    m = cglCenter+delta*cglOrientation;
    normal = cglSphereNormal(direction,m,false);
    (normal_1,normal_2,normal_3,delta);
);
cglCapRoundShaderBack = cglLazy((direction,cylinderDepths,delta,U,cutVector),
    m = cglCenter+delta*cglOrientation;
    normal = cglSphereNormal(direction,m,true);
    (normal_1,normal_2,normal_3,delta);
);
cglCapFlatShaderFront = cglLazy((direction,cylinderDepths,delta,U,cutVector),
    m = cglCenter+delta*cglOrientation;
    // <v + a*d,o> = <m,o>
    a = (m*cglOrientation-cglViewPos*cglOrientation)/(direction*cglOrientation);
    if(|cglViewPos + a*direction - m| > cglRadius,cglDiscard());
    cglSetDepth(a);
    normal = normalize(cglOrientation*delta);
    (normal_1,normal_2,normal_3,delta)
);
cglCapFlatShaderBack = cglLazy((direction,cylinderDepths,delta,U,cutVector),
    m = cglCenter+delta*cglOrientation;
    // <v + a*d,o> = <m,o>
    a = (m*cglOrientation-cglViewPos*cglOrientation)/(direction*cglOrientation);
    if(|cglViewPos + a*direction - m| > cglRadius,cglDiscard());
    cglSetDepth(a);
    normal = -normalize(cglOrientation*delta);
    (normal_1,normal_2,normal_3,delta)
);
// TODO? set new delta to hight along cylinder
cglCapAngleFlatShaderFront = cglLazy((direction,cylinderDepths,delta,U,cutVector),
    m = cglCenter+delta*cglOrientation;
    // <v + a*d,n> = <m,n>
    a = (m*cutVector-cglViewPos*cutVector)/(direction*cutVector);
    p = cglViewPos + a*direction;
    o = normalize(cglOrientation);
    if(|p - (p*o)*o| > cglRadius,cglDiscard());
    cglSetDepth(a);
    normal = delta*normalize(cutVector);
    delta = (p-cglCenter)*U;
    (normal_1,normal_2,normal_3,delta)
);
cglCapAngleFlatShaderBack = cglLazy((direction,cylinderDepths,delta,U,cutVector),
    m = cglCenter+delta*cglOrientation;
    // <v + a*d,n> = <m,n>
    a = (m*cutVector-cglViewPos*cutVector)/(direction*cutVector);
    p = cglViewPos + a*direction;
    o = normalize(cglOrientation);
    if(|p - (p*o)*o| > cglRadius,cglDiscard());
    cglSetDepth(a);
    normal = -delta*normalize(cutVector);
    delta = (p-cglCenter)*U;
    (normal_1,normal_2,normal_3,delta)
);
cglCapAngleRoundShaderFront = cglLazy((direction,cylinderDepths,delta,U,cutVector),
  res = cglEval(cglCapRoundShaderFront,direction,cylinderDepths,delta,U,cutVector);
  pos3d = cglViewPos + cglRawDepth * direction;
  if(delta*((pos3d-cglCenter)*cutVector)>1,cglDiscard());
  res
);
cglCapAngleRoundShaderBack = cglLazy((direction,cylinderDepths,delta,U,cutVector),
  res = cglEval(cglCapRoundShaderBack,direction,cylinderDepths,delta,U,cutVector);
  pos3d = cglViewPos + cglRawDepth * direction;
  if(delta*((pos3d-cglCenter)*cutVector)>1,cglDiscard());
  res
);

cglCutOrthogonal = cglLazy((delta,v),delta);
cglCutVector1 = cglLazy((delta,v),v*cglCutDir1);
cglCutVector2 = cglLazy((delta,v),v*cglCutDir2);
cglCutBoth1 = cglLazy((delta,v),min(delta,v*cglCutDir1)); // TODO? better name
cglCutBoth2 = cglLazy((delta,v),max(delta,v*cglCutDir2));

// wrap getting cut-normal in lazy-function to save uniform variable in case where normal is not needed
cglCutVectorNone = cglLazy((),cglOrientation);
cglGetCutVector1 = cglLazy((),cglCutDir1);
cglGetCutVector2 = cglLazy((),cglCutDir2);

// TODO? give constants a second name in cgl-namespace
CylinderCapOpen = {"name":"Open","shaderFront":cglCapOpenShaderFront,"shaderBack":cglCapOpenShaderBack};
CylinderCapFlat = {"name":"Flat","shaderFront":cglCapFlatShaderFront,"shaderBack":cglCapFlatShaderBack};
CylinderCapRound = {"name":"Round","shaderFront":cglCapRoundShaderFront,"shaderBack":cglCapRoundShaderBack};
CylinderCapCutOpen(normal) := {"name":"Cut-Open","cutDirection":normal,"cutOrthogonal":false,
  "shaderFront":cglCapOpenShaderFront,"shaderBack":cglCapOpenShaderBack};
CylinderCapCutFlat(normal) := {"name":"Cut-Flat","cutDirection":normal,"cutOrthogonal":false,
  "shaderFront":cglCapAngleFlatShaderFront,"shaderBack":cglCapAngleFlatShaderBack};
CylinderCapCutRound(normal) := {"name":"Cut-Round","cutDirection":normal,"cutOrthogonal":true,
  "shaderFront":cglCapAngleRoundShaderFront,"shaderBack":cglCapAngleRoundShaderBack};
cglDefaultCapsCylinder = CylinderCapOpen;
cglDefaultCapsConnect = CylinderCapRound;

ConnectOpen = -1;
ConnectRound = 0;
ConnectFlat = 1; // TODO name

cgl3dCylinderShaderCode(direction):=(
  l = cglCylinderDepths(direction);
  BA = cglOrientation;
  U = BA/(BA*BA);
  v1 = (cglViewPos+l_1*direction)-cglCenter;
  delta = (v1*U);
  if(cglEval(cglCut1,delta,v1)<-1, // cap 1
    normalAndHeight = cglEval(cglCap1front,direction,l,-1,U,cglEval(cglGetCutVector1));
    normal = (normalAndHeight_1,normalAndHeight_2,normalAndHeight_3);
    delta = normalAndHeight_4;
  ,if(cglEval(cglCut2,delta,v1)>1, // cap2
    normalAndHeight = cglEval(cglCap2front,direction,l,1,U,cglEval(cglGetCutVector2));
    normal = (normalAndHeight_1,normalAndHeight_2,normalAndHeight_3);
    delta = normalAndHeight_4;
  , // intersection with body of cylinder
    cglSetDepth(l_1);
    normal = normalize(v1-delta*BA);
  ));
  // TODO? include caps in mapping, ? within caps use direction center->point instead of normal for coordinates
  texturePos = cglProjCylinderToSquare(normal,max(-1,min(delta,1)),cglOrientation);
  color = cglEval(pixelExpr,texturePos);
  cglEval(light,color,direction,normal);
);
cgl3dCylinderShaderCodeBack(direction):=(
  l = cglCylinderDepths(direction);
  BA = cglOrientation;
  U = BA/(BA*BA);
  // TODO check if second intersection with cylinder already used (open cap)
  v2 = (cglViewPos+l_2*direction)-cglCenter;
  delta = (v2*U);
  if(cglEval(cglCut1,delta,v2)<-1, // cap 1
    normalAndHeight = cglEval(cglCap1back,direction,l,-1,U,cglEval(cglGetCutVector1));
    normal = (normalAndHeight_1,normalAndHeight_2,normalAndHeight_3);
    delta = normalAndHeight_4;
  ,if(cglEval(cglCut2,delta,v2)>1, // cap2
    normalAndHeight = cglEval(cglCap2back,direction,l,1,U,cglEval(cglGetCutVector2));
    normal = (normalAndHeight_1,normalAndHeight_2,normalAndHeight_3);
    delta = normalAndHeight_4;
  , // intersection with body of cylinder
    cglSetDepth(l_2);
    normal = normalize(v2-delta*BA);
  ));
  // TODO? include caps in mapping, ? within caps use direction center->point instead of normal for coordinates
  texturePos = cglProjCylinderToSquare(normal,max(-1,min(delta,1)),cglOrientation);
  color = cglEval(pixelExpr,texturePos);
  cglEval(light,color,direction,normal);
);

/////////////////////
// user-interface
/////////////////////

cglValOrDefault(val,default):=(
  if(isundefined(val),default,val)
);

// TODO find good list of default modifiers‚
// function->f(#pos,#norm,#kmin,#kmax....) (colorplot on drawn surface)
// thickness -> give rendered surfaces a thinkness (needed for conversion to 3d-printer file)
// ? support for adding arbitary user-data to plot/vertices
// ? rememberId -> remember object id

cglInterface("draw3d",cglDraw3d,(pos3d),(color,size,alpha,light:(color,direction,normal),projection));
cglDraw3d(pos3d):=(
  size = cglValOrDefault(size,cglDefaultSizeSphere);
  cglSphere3d(pos3d,size);
);
cglInterface("draw3d",cglDraw3d,(point1,point2),(color,size,alpha,light:(color,direction,normal),caps));
draw3d(point1,point2):=(
  size = cglValOrDefault(size,cglDefaultSizeCylinder);
  cglCylinder3d(point1,point2,size);
);

cglInterface("sphere3d",cglSphere3d,(center,radius),(color,alpha,light:(color,direction,normal),projection));
cglSphere3d(center,radius):=(
  regional(pixelExpr,needBackFace);
  // TODO how to detect which draw type (color / texture / function is used)
  color = cglValOrDefault(color,cglDefaultColorSphere);
  light = cglValOrDefault(light,cglDefaultLight);
  projection = cglValOrDefault(projection,cglDefaultSphereProjection);
  needBackFace = if(isundefined(alpha),length(color)==4,true);
  pixelExpr = cglLazy(pos,cglColor);
  // TODO support dict as modifiers
  modifiers = {"pixelExpr":pixelExpr,"light": light,"projection":projection,"cglColor":color};
  tags = []; // TODO allow passing tags as modifier
  if(needBackFace,
    ids = [colorplot3d(cgl3dSphereShaderCode(#,true),center,radius,
      plotModifiers->modifiers,tags->["sphere","backside"]++tags)];
  );
  topLayer = colorplot3d(cgl3dSphereShaderCode(#,false),center,radius,
    plotModifiers->modifiers,tags->["sphere"]++tags);
  if(needBackFace,cglRememberLayers(append(ids,topLayer)),topLayer);
);

cglInterface("cylinder3d",cglCylinder3d,(point1,point2,radius),(color,alpha,light:(color,direction,normal),cap1,cap2,caps));
cglCylinder3d(point1,point2,radius):=(
  // TODO? allow independent colors for both endpoints
  color = cglValOrDefault(color,cglDefaultColorCylinder);
  light = cglValOrDefault(light,cglDefaultLight);
  caps = cglValOrDefault(caps,cglDefaultCapsCylinder);
  cap1 = cglValOrDefault(cap1,caps);
  cap2 = cglValOrDefault(cap2,caps);
  overhang = if(cap1_"name" == "Round" % cap2_"name" == "Round",radius,0);
  needBackFace = if(isundefined(alpha),length(color)==4,true);
  pixelExpr = cglLazy(pos,cglColor);
  modifiers = {"pixelExpr":pixelExpr,"light": light,"cglColor":color,
    "cglCap1front":cap1_"shaderFront","cglCap1back":cap1_"shaderBack",
    "cglCap2front":cap2_"shaderFront","cglCap2back":cap2_"shaderBack",
    "cglCut1":cglCutOrthogonal,"cglCut2":cglCutOrthogonal,
    "cglGetCutVector1":cglCutVectorNone,"cglGetCutVector2":cglCutVectorNone};
  if(!isundefined(cap1_"cutDirection"),
     modifiers_"cglCut1" = if(cap1_"cutOrthogonal",cglCutBoth1,cglCutVector1);
    modifiers_"cglGetCutVector1" = cglGetCutVector1;
    n = cap1_"cutDirection";
    modifiers_"cglCutDir1" = n/(0.5*(point2-point1)*n);
    overhang = if(cap1_"name" == "Cut-Round",radius
      ,max(overhang,radius*tan(arccos(|normalize(n)*normalize(point2-point1)|))));
  );
  if(!isundefined(cap2_"cutDirection"),
    modifiers_"cglCut2" = if(cap2_"cutOrthogonal",cglCutBoth2,cglCutVector2);
    modifiers_"cglGetCutVector2" = cglGetCutVector2;
    n = cap2_"cutDirection";
    modifiers_"cglCutDir2" = n/(0.5*(point2-point1)*n);
    overhang = if(cap2_"name" == "Cut-Round",radius,
      max(overhang,radius*tan(arccos(|normalize(n)*normalize(point2-point1)|))));
  );
  tags = []; // TODO allow passing tags as modifier
  if(needBackFace,
    ids = [colorplot3d(cgl3dCylinderShaderCodeBack(#),point1,point2,radius,overhang->overhang,
      plotModifiers->modifiers,tags->["cylinder","backside"]++tags)];
  );
  // TODO handle caps extending beyond cylinder (? "bounding box overhang")
  topLayer = colorplot3d(cgl3dCylinderShaderCode(#),point1,point2,radius,overhang->overhang,
    plotModifiers->modifiers,tags->["cylinder"]++tags);
  if(needBackFace,cglRememberLayers(append(ids,topLayer)),topLayer);
);

// FIXME overhang should be computed from end not from center
// -> ? allow seperate overhang for both ends
// -> ? how much does co-sy for V-shader need to be changed
// TODO handle cutof plane intersecting with end-cap

cglJoint(prev,current,next,jointType):=(
  if(jointType==ConnectRound,
    CylinderCapCutRound((normalize(next-current)+normalize(current-prev))/2);
  ,if(jointType==ConnectFlat,
    CylinderCapCutOpen((normalize(next-current)+normalize(current-prev))/2);
  ,if(jointType==ConnectOpen,
    CylinderCapOpen
  )));
);
cglInterface("connect3d",cglConnect3d,(points),(color,size,alpha,light:(color,direction,normal),caps,cap1,cap2,joints,closed));
cglConnect3d(points):=(
  print(points);
  closed = cglValOrDefault(closed,false);
  color = cglValOrDefault(color,cglDefaultColorCylinder);
  size = cglValOrDefault(size,cglDefaultSizeCylinder);
  light = cglValOrDefault(light,cglDefaultLight);
  caps = cglValOrDefault(caps,cglDefaultCapsConnect);
  cap1 = cglValOrDefault(cap1,caps);
  cap2 = cglValOrDefault(cap2,caps);
  joints = cglValOrDefault(joints,ConnectRound);
  jointEnd = joints;
  jointStart = joints;
  if(length(points)>=3,
    if(closed,
      current1 = points_(length(points)-2);
      current2 = points_(length(points)-1);
      next = points_(length(points));
    ,
      current1 = points_1;
      current2 = points_2;
      next = points_3;
      cglCylinder3d(current1,current2,size,cap1->cap1,
        cap2->cglJoint(current1,current2,next,jointEnd));
    );
    forall(if(closed,1,4)..length(points),i,
      prev = current1;
      current1 = current2;
      current2 = next;
      next = points_i;
      cglCylinder3d(current1,current2,size,
        cap1->cglJoint(prev,current1,current2,jointStart),cap2->cglJoint(current1,current2,next,jointEnd));
    );
    cglCylinder3d(current2,next,size,cap1->cglJoint(current1,current2,next,jointStart),
        cap2->if(closed,cglJoint(current2,next,points_1,jointEnd),cap2));
  ,if(length(points)==2,
    cglCylinder3d(points_1,points_2,size);// TODO? do modifiers need to be updated
  ,if(length(points)==1,
    cglSphere3d(points_1,size);// TODO? do modifiers need to be updated
  )));
);
cglInterface("curve3d",cglCurve3d,(expr:(t),from,to),(color,size,samples,alpha,light:(color,direction,normal),caps,cap1,cap2,joints,closed));
cglCurve3d(expr,from,to):=(
  closed = cglValOrDefault(closed,false);
  color = cglValOrDefault(color,cglDefaultColorCylinder);
  size = cglValOrDefault(size,cglDefaultSizeCylinder);
  light = cglValOrDefault(light,cglDefaultLight);
  caps = cglValOrDefault(caps,cglDefaultCapsConnect);
  cap1 = cglValOrDefault(cap1,caps);
  cap2 = cglValOrDefault(cap2,caps);
  samples = cglValOrDefault(samples,cglDefaultCurveSamples)-1;
  joints = cglValOrDefault(joints,ConnectRound);
  cglConnect3d( apply(0..samples,k,
    t = k/samples;
    cglEval(expr,t*to+(1-t)*from);
  ));
);

cglInterface("torus3d",cglTorus3d,(center,orientation,radius1,radius2),(color,alpha,light:(color,direction,normal)));
cglTorus3d(center,orientation,radius1,radius2):=(

);
// TODO? option to use aspect ratio instead of second radius
cglInterface("circle3d",cglCircle3d,(center,orientation,radius),(color,size,alpha,light:(color,direction,normal)));
cglCircle3d(center,orientation,radius):=(
  size = cglValOrDefault(size,cglDefaultSizeTorus);
  cglTorus3d(center,orientation,radius,size);
);

cglInterface("polygon3d",cglPolygon3d,(vertices),(color,thickness,alpha,light:(color,direction,normal),texture,uv,normals));
cglPolygon3d(vertices):=(

);

cglInterface("triangle3d",cglTriangle3d,(p1,p2,p3),(color,thickness,alpha,light:(color,direction,normal),texture,uv,normals,normal));
cglTriangle3d(p1,p2,p3):=(

);

cglInterface("mesh3d",cglMesh3d,(grid),(color,thickness,alpha,light:(color,direction,normal),texture,uv,vertexNormals,faceNormals,normalExpr));
cglMesh3d(grid):=(

);

// TODO? merge plot and cplot?
cglInterface("plot3d",cglPlot3d,(f:(x,y)),(color,thickness,alpha,light:(color,direction,normal),texture,uv,df:(x,y)));
cglPlot3d(f/*f(x,y)*/):=(

);
cglInterface("cplot3d",cglCPlot3d,(f:(z)),(color,thickness,alpha,light:(color,direction,normal),texture,uv,df:(z)));
cglCPlot3d(f/*f(z)*/):=(

);

// TODO? plane3d
// TODO? quadric3d
// TODO? cubic3d

cglInterface("surface3d",cglSurface3d,(expr:(x)),(color,thickness,alpha,light:(color,direction,normal),texture,uv,normals:(x,y,z)));
cglSurface3d(expr):=(

);