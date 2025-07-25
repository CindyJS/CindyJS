// initialization script containing implementation for CindyGL3D functions
// opt TODO? would creating minified version to speed up import time

use("CindyGL");
// normalize if non-zero, map (0,0,0) to itself
normalize(v):=(
  regional(l);
  l = |v|;
  if(l>0,v/l,v);
);
/** maps the raw depth value given in the interval [0,inf) to a concrete depth in [-1,1) and sets cglDepth accordingly */
cglSetDepth(rawDepth,direction):=(
  // opt TODO? discard negative distances form view
  regional(v);
  cglRawDepth = rawDepth;
  v = 0.5*(cglViewNormal*cglViewNormal)/(cglViewNormal*direction);
  cglDepth = (rawDepth-v)/rawDepth;
  if(cglDepth<0,cglDiscard());
  cglDepth;
);
cglMod1plus(n,k):=(
  mod(n-1,k)+1;
);
// returns undefined // cindyscript TODO? is there a less hacky way to reliably set a variable to undefined?
cglUndefinedVal():=(regional(nada);nada);

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
// default light computation
cglDefaultLight = cglLazy((color,direction,normal),
  regional(col3,lightCol);
  // apply light calculation only to first 3 components
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

/////////////////////
// internal state
/////////////////////


// color constants
cglBlack = (0,0,0);
cglWhite = (1,1,1);
cglRed = (1,0,0);
cglGreen = (0,1,0);
cglBlue = (0,0,1);
cglYellow = (1,1,0);
cglCyan = (0,1,1);
cglMagenta = (1,0,1);


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
  cglSetDepth(dst,direction);
  normalize(pos3d - center);
);
cglSphereDepths(rayStart,direction,center,radius):=(
  regional(vc,b2,c,D4,r);
  // |v+l*d -c|=r
  vc=rayStart-center;
  // -> l*l <d,d> + l * 2<v-c,d> + <v-c,v-c> - r*r
  b2=(vc*direction); // 1/2 * b
  c=vc*vc-radius*radius;
  D4=b2*b2-c; // 1/4* ( b*b - 4 *a*c)
  if(D4<0,cglDiscard()); // discard rays that do not intersect the sphere
  r=re(sqrt(D4)); // sqrt should always be real
  (-b2-r,-b2+r);
);
// stereographic projection from sphere onto C using normal vector as input
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
// feature TODO? add projection for non-axis aligned coordinate system

cglSphereProjectionEquirect = cglLazy(normal,cglProjSphereToSquare(normal));
cglSphereProjectionStereographicC = cglLazy(normal,cglProjSphereToC(normal));

cgl3dSphereShaderCode(direction,isBack):=(
  regional(normal,texturePos,color);
  normal = cglSphereNormal(direction,cglCenter,isBack);
  texturePos = cglEval(cglProjection,normal);
  color = cglEval(cglPixelExpr,texturePos,cglViewPos + cglRawDepth*direction,normal);
  cglEval(cglLight,color,direction,normal);
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
    (w - (b + r)/a, w - (b - r)/a);
);
// intersections of ray in given direction with cylinder with circular end-caps
// needed for bounding box computations
cglCappedCylinderDepths(rayStart,direction,center,orientation,radius):=(
  regional(w,W,BA,U,VA,S,T,a,b,c,o,D,r,l,v,d,m0t,m1t,m0,m1,low,hi);
  w = |rayStart-center|;
  W = rayStart + w*direction;
  BA = orientation;
  U = BA/(BA*BA);
  VA = (W-center);
  S = VA - (VA*BA)*U;
  T = direction - (direction*BA)*U;
  a = T*T;
  b = S*T;
  c = S*S -radius*radius;
  D= b*b-a*c;
  if(D<0,cglDiscard()); // discard rays that do not intersect the cylinder
  r = re(sqrt(D));
  l = (- (b + r)/a, - (b - r)/a);
  // intersections with cutoff planes
  // normal: U, values at ends: <A,B-A>, <B,B-A>
  // <view + m * dir,(B-A)> = <view,B-A> + m * <dir,B-A>
  d = direction * U;
  v = W * U;
  c = center * U;
  o = orientation * U;
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

cglCylinderProjGetDirection1Default = cglLazy((normal,height,orientation),
  regional(d1);
  if(|orientation_1|<|orientation_2|,
    d1=normalize(cross(orientation,(1,0,0)));
  ,
    d1=normalize(cross(orientation,(0,1,0)));
  );
);
// project cylinder onto unit square using normal and height as input
// assumes that normal is normalized, and height is in the range -1..1
cglProjCylinderToSquare(normal,height,orientation):=(
  regional(d1,d2);
  d1 = cglEval(cglCylinderProjGetDirection1,normal,height,orientation);
  d2 = -normalize(cross(orientation,d1));
  ((arctan2(d1*normal,d2*normal)+pi)/(2*pi),0.5*(height+1));
);

cglCapVoidShader = cglLazy((direction,cylinderDepths,delta,U,cutVector),
    cglDiscard();
    (0,0,0,0) // compiler cannot detect that code is unreachable -> have to return correct type
    // bug TODO make compiler realize that code after discard is unreachable
);
cglCapOpenShaderNoBack = cglLazy((direction,cylinderDepths,delta,U,cutVector),
    regional(v2,delta2,normal);
    v2 = (cglViewPos+cylinderDepths_2*direction)-cglCenter;
    delta2 = v2*cutVector;
    if(delta2*delta>1,cglDiscard());
    cglSetDepth(cylinderDepths_2,direction);
    normal = normalize(v2-delta2*cglOrientation);
    (normal_1,normal_2,normal_3,delta2);
);
cglCapOpenShaderBack = cglCapVoidShader;
cglCapRoundShaderFront = cglLazy((direction,cylinderDepths,delta,U,cutVector),
    regional(m,normal);
    m = cglCenter+delta*cglOrientation;
    normal = cglSphereNormal(direction,m,false);
    (normal_1,normal_2,normal_3,delta);
);
cglCapRoundShaderBack = cglLazy((direction,cylinderDepths,delta,U,cutVector),
    regional(m,normal);
    m = cglCenter+delta*cglOrientation;
    normal = cglSphereNormal(direction,m,true);
    (normal_1,normal_2,normal_3,delta);
);
cglCapFlatShaderFront = cglLazy((direction,cylinderDepths,delta,U,cutVector),
    regional(m,a,normal);
    m = cglCenter+delta*cglOrientation;
    // <v + a*d,o> = <m,o>
    a = (m*cglOrientation-cglViewPos*cglOrientation)/(direction*cglOrientation);
    if(|cglViewPos + a*direction - m| > cglRadius,cglDiscard());
    cglSetDepth(a,direction);
    normal = normalize(cglOrientation*delta);
    (normal_1,normal_2,normal_3,delta)
);
cglCapFlatShaderBack = cglLazy((direction,cylinderDepths,delta,U,cutVector),
    regional(m,a,normal);
    m = cglCenter+delta*cglOrientation;
    // <v + a*d,o> = <m,o>
    a = (m*cglOrientation-cglViewPos*cglOrientation)/(direction*cglOrientation);
    if(|cglViewPos + a*direction - m| > cglRadius,cglDiscard());
    cglSetDepth(a,direction);
    normal = -normalize(cglOrientation*delta);
    (normal_1,normal_2,normal_3,delta)
);
cglCapAngleFlatShaderFront = cglLazy((direction,cylinderDepths,delta,U,cutVector),
    regional(m,a,p,o,normal);
    m = cglCenter+delta*cglOrientation;
    // <v + a*d,n> = <m,n>
    a = (m*cutVector-cglViewPos*cutVector)/(direction*cutVector);
    p = cglViewPos + a*direction;
    o = normalize(cglOrientation);
    if(|p-m - ((p-m)*o)*o| > cglRadius,cglDiscard());
    cglSetDepth(a,direction);
    normal = delta*normalize(cutVector);
    delta = (p-cglCenter)*U;
    (normal_1,normal_2,normal_3,delta)
);
cglCapAngleFlatShaderBack = cglLazy((direction,cylinderDepths,delta,U,cutVector),
    regional(m,a,p,o,normal);
    m = cglCenter+delta*cglOrientation;
    // <v + a*d,n> = <m,n>
    a = (m*cutVector-cglViewPos*cutVector)/(direction*cutVector);
    p = cglViewPos + a*direction;
    o = normalize(cglOrientation);
    if(|p-m - ((p-m)*o)*o| > cglRadius,cglDiscard());
    cglSetDepth(a,direction);
    normal = -delta*normalize(cutVector);
    delta = (p-cglCenter)*U;
    (normal_1,normal_2,normal_3,delta)
);
cglCapAngleVoidRoundShaderFront = cglLazy((direction,cylinderDepths,delta,U,cutVector),
  regional(res,v2);
  res = cglEval(cglCapRoundShaderFront,direction,cylinderDepths,delta,U,cutVector);
  v2 = cglViewPos + cglRawDepth * direction - cglCenter;
  if((delta*(v2*cutVector)>1) % (delta*(v2*U)<1),cglDiscard());
  res
);
cglCapAngleVoidRoundShaderBack = cglLazy((direction,cylinderDepths,delta,U,cutVector),
  regional(res,v2);
  res = cglEval(cglCapRoundShaderBack,direction,cylinderDepths,delta,U,cutVector);
  v2 = cglViewPos + cglRawDepth * direction - cglCenter;
  if((delta*(v2*cutVector)>1) % (delta*(v2*U)<1),cglDiscard());
  res
);
// feature TODO? add open and closed version of capAngle...Round

cglCutOrthogonal = cglLazy((delta,v),delta);
cglCutVector1 = cglLazy((delta,v),v*cglCutDir1);
cglCutVector2 = cglLazy((delta,v),v*cglCutDir2);
cglCutBoth1 = cglLazy((delta,v),min(delta,v*cglCutDir1)); // code TODO? better name
cglCutBoth2 = cglLazy((delta,v),max(delta,v*cglCutDir2));

cglCapCutFlat1 = cglLazy((v2,U),
  v2*U<-1
);
cglCapCutFlat2 = cglLazy((v2,U),
  v2*U>1
);
cglCapCutRound1 = cglLazy((v2,U),
  // v2 = pos3d - center ->  pos3d - m = v2 + center - (center-orientation) = v2 - orientation
  cglEval(cglCapCutFlat1,v2,U) & (|v2 + cglOrientation| > cglRadius)
);
cglCapCutRound2 = cglLazy((v2,U),
  cglEval(cglCapCutFlat2,v2,U) & (|v2 - cglOrientation| > cglRadius)
);
cglCapCutAngle1 = cglLazy((v2,U),
  v2*cglCutDir1<-1
);
cglCapCutAngle2 = cglLazy((v2,U),
  v2*cglCutDir2>1
);
cglCapCutAngleRound1 = cglLazy((v2,U),
  cglEval(cglCapCutRound1,v2,U) % cglEval(cglCapCutAngle1,v2,U);
);
cglCapCutAngleRound2 = cglLazy((v2,U),
  cglEval(cglCapCutRound2,v2,U) % cglEval(cglCapCutAngle2,v2,U);
);

// wrap getting cut-normal in lazy-function to save uniform variable in case where normal is not needed
cglCutVectorNone = cglLazy((U),U);
cglGetCutVector1 = cglLazy((U),cglCutDir1);
cglGetCutVector2 = cglLazy((U),cglCutDir2);

CglCylinderCapVoid = {"name":"Void","shaderFront":cglCapVoidShader,"shaderBack":cglCapVoidShader,
  "shaderNoBack":cglCapVoidShader,"capCut1":cglCapCutFlat1,"capCut2":cglCapCutFlat2};
CglCylinderCapOpen = {"name":"Open","shaderFront":cglCapVoidShader,"shaderBack":cglCapOpenShaderBack,
  "shaderNoBack":cglCapOpenShaderNoBack,"capCut1":cglCapCutFlat1,"capCut2":cglCapCutFlat2};
CglCylinderCapFlat = {"name":"Flat","shaderFront":cglCapFlatShaderFront,"shaderBack":cglCapFlatShaderBack,
  "shaderNoBack":cglCapFlatShaderFront,"capCut1":cglCapCutFlat1,"capCut2":cglCapCutFlat2};
CglCylinderCapRound = {"name":"Round","shaderFront":cglCapRoundShaderFront,"shaderBack":cglCapRoundShaderBack,
  "shaderNoBack":cglCapRoundShaderFront,"capCut1":cglCapCutRound1,"capCut2":cglCapCutRound2};
CglCylinderCapCutVoid(normal) := {"name":"Cut-Void","cutDirection":normal,"cutOrthogonal":false,
  "shaderFront":cglCapVoidShader,"shaderNoBack":cglCapVoidShader,"shaderBack":cglCapVoidShader,
  "capCut1":cglCapCutAngle1,"capCut2":cglCapCutAngle2};
CglCylinderCapCutOpen(normal) := {"name":"Cut-Open","cutDirection":normal,"cutOrthogonal":false,
  "shaderFront":cglCapVoidShader,"shaderNoBack":cglCapOpenShaderNoBack,"shaderBack":cglCapOpenShaderBack,
  "capCut1":cglCapCutAngle1,"capCut2":cglCapCutAngle2};
CglCylinderCapCutFlat(normal) := {"name":"Cut-Flat","cutDirection":normal,"cutOrthogonal":false,
  "shaderFront":cglCapAngleFlatShaderFront,"shaderNoBack":cglCapAngleFlatShaderFront,"shaderBack":cglCapAngleFlatShaderBack,
  "capCut1":cglCapCutAngle1,"capCut2":cglCapCutAngle2};
CglCylinderCapCutVoidRound(normal) := {"name":"Cut-Round","cutDirection":normal,"cutOrthogonal":true,
  "shaderFront":cglCapAngleVoidRoundShaderFront,"shaderNoBack":cglCapAngleVoidRoundShaderFront,"shaderBack":cglCapAngleVoidRoundShaderBack,
  "capCut1":cglCapCutAngleRound1,"capCut2":cglCapCutAngleRound2};

CylinderCapOpen=CglCylinderCapOpen;
CylinderCapFlat=CglCylinderCapFlat;
CylinderCapRound=CglCylinderCapRound;


CglConnectOpen = -1;
CglConnectRound = 0;
CglConnectFlat = 1; // feature TODO? better name
ConnectOpen = CglConnectOpen;
ConnectRound = CglConnectRound;
ConnectFlat = CglConnectFlat;

// feature TODO? separate projection for end-caps
cgl3dCylinderShaderCode(direction):=(
  regional(l,BA,U,v1,delta,normalAndHeight,v2,normal,texturePos,color,pos3d);
  l = cglCylinderDepths(direction);
  BA = cglOrientation;
  U = BA/(BA*BA);
  v1 = (cglViewPos+l_1*direction)-cglCenter;
  delta = (v1*U);
  if(cglEval(cglCut1,delta,v1)<-1, // cap1
    // opt TODO? is there a less nested algorithm for correctly handling intersecting end-caps
    if(cglEval(cglCut2,delta,v1)>1, // cap1 & cap2
      // -> pick cut that is further from viewPosition
      // <v + a*d,n> = <m,n>
      cutVector1=cglEval(cglGetCutVector1,U);
      cutVector2=cglEval(cglGetCutVector2,U);
      a1 = ((cglCenter-cglOrientation)*cutVector1-cglViewPos*cutVector1)/(direction*cutVector1);
      a2 = ((cglCenter+cglOrientation)*cutVector2-cglViewPos*cutVector2)/(direction*cutVector2);
      if(a1<a2,
        normalAndHeight = cglEval(cglCap2front,direction,l,1,U,cglEval(cglGetCutVector2,U));
        v2 = cglViewPos + cglRawDepth*direction - cglCenter;
        if(cglEval(cglCapCut1,v2,U), // cap1 and cap2
          normalAndHeight = cglEval(cglCap1front,direction,l,-1,U,cglEval(cglGetCutVector1,U));
          v2 = cglViewPos + cglRawDepth*direction - cglCenter;
          if(cglEval(cglCapCut2,v2,U),cglDiscard()); // both intersections with caps are cut of by other cap
        );
      ,
        normalAndHeight = cglEval(cglCap1front,direction,l,-1,U,cglEval(cglGetCutVector1,U));
        v2 = cglViewPos + cglRawDepth*direction - cglCenter;
        if(cglEval(cglCapCut2,v2,U), // cap1 and cap2
          normalAndHeight = cglEval(cglCap2front,direction,l,1,U,cglEval(cglGetCutVector2,U));
          v2 = cglViewPos + cglRawDepth*direction - cglCenter;
          if(cglEval(cglCapCut1,v2,U),cglDiscard()); // both intersections with caps are cut of by other cap
        );
      );
    ,
      normalAndHeight = cglEval(cglCap1front,direction,l,-1,U,cglEval(cglGetCutVector1,U));
      v2 = cglViewPos + cglRawDepth*direction - cglCenter;
      // opt TODO? omit check for second cap if both caps are cut orthogonal to cylinder
      if(cglEval(cglCapCut2,v2,U), // cap1 and cap2
        normalAndHeight = cglEval(cglCap2front,direction,l,1,U,cglEval(cglGetCutVector2,U));
        v2 = cglViewPos + cglRawDepth*direction - cglCenter;
        if(cglEval(cglCapCut1,v2,U),cglDiscard()); // both intersections with caps are cut of by other cap
      );
    );
    normal = (normalAndHeight_1,normalAndHeight_2,normalAndHeight_3);
    delta = normalAndHeight_4;
    pos3d = (cglViewPos+cglRawDepth*direction);
    texturePos = cglEval(cglProjection,normalize((pos3d-cglCenter)-delta*BA),max(-1,min(delta,1)),cglOrientation);
  ,if(cglEval(cglCut2,delta,v1)>1, // cap2
    normalAndHeight = cglEval(cglCap2front,direction,l,1,U,cglEval(cglGetCutVector2,U));
    v2 = cglViewPos + cglRawDepth*direction - cglCenter;
    if(cglEval(cglCapCut1,v2,U), // cap1 and cap2
      normalAndHeight = cglEval(cglCap1front,direction,l,-1,U,cglEval(cglGetCutVector1,U));
      v2 = cglViewPos + cglRawDepth*direction - cglCenter;
      if(cglEval(cglCapCut2,v2,U),cglDiscard()); // both intersections with caps are cut of by other cap
    );
    normal = (normalAndHeight_1,normalAndHeight_2,normalAndHeight_3);
    delta = normalAndHeight_4;
    pos3d = (cglViewPos+cglRawDepth*direction);
    texturePos = cglEval(cglProjection,normalize((pos3d-cglCenter)-delta*BA),max(-1,min(delta,1)),cglOrientation);
  , // intersection with body of cylinder
    cglSetDepth(l_1,direction);
    normal = normalize(v1-delta*BA);
    texturePos = cglEval(cglProjection,normal,max(-1,min(delta,1)),cglOrientation);
  ));
  color = cglEval(cglPixelExpr,texturePos,cglViewPos + cglRawDepth*direction,normal);
  cglEval(cglLight,color,direction,normal);
);
cgl3dCylinderShaderCodeBack(direction):=(
  regional(l,BA,U,v2,delta,normalAndHeight,v3,normal,texturePos,color,pos3d);
  l = cglCylinderDepths(direction);
  BA = cglOrientation;
  U = BA/(BA*BA);
  v2 = (cglViewPos+l_2*direction)-cglCenter;
  delta = (v2*U);
  if(cglEval(cglCut1,delta,v2)<-1, // cap 1
    if(cglEval(cglCut2,delta,v2)>1, // cap1 & cap2
      // -> pick cut that is further from viewPosition
      // <v + a*d,n> = <m,n>
      cutVector1=cglEval(cglGetCutVector1,U);
      cutVector2=cglEval(cglGetCutVector2,U);
      a1 = ((cglCenter-cglOrientation)*cutVector1-cglViewPos*cutVector1)/(direction*cutVector1);
      a2 = ((cglCenter+cglOrientation)*cutVector2-cglViewPos*cutVector2)/(direction*cutVector2);
      if(a1<a2,
        normalAndHeight = cglEval(cglCap2back,direction,l,1,U,cglEval(cglGetCutVector2,U));
        v3 = cglViewPos + cglRawDepth*direction - cglCenter;
        if(cglEval(cglCapCut1,v3,U), // cap1 and cap2
          normalAndHeight = cglEval(cglCap1back,direction,l,-1,U,cglEval(cglGetCutVector1,U));
          v3 = cglViewPos + cglRawDepth*direction - cglCenter;
          if(cglEval(cglCapCut2,v3,U),cglDiscard()); // both intersections with caps are cut of by other cap
        );
      ,
        normalAndHeight = cglEval(cglCap1back,direction,l,-1,U,cglEval(cglGetCutVector1,U));
        v3 = cglViewPos + cglRawDepth*direction - cglCenter;
        if(cglEval(cglCapCut2,v3,U), // cap1 and cap2
          normalAndHeight = cglEval(cglCap2back,direction,l,1,U,cglEval(cglGetCutVector2,U));
          v3 = cglViewPos + cglRawDepth*direction - cglCenter;
          if(cglEval(cglCapCut1,v3,U),cglDiscard()); // both intersections with caps are cut of by other cap
        );
      );
    ,
      normalAndHeight = cglEval(cglCap1back,direction,l,-1,U,cglEval(cglGetCutVector1,U));
      v3 = cglViewPos + cglRawDepth*direction - cglCenter;
      if(cglEval(cglCapCut2,v3,U), // cap1 and cap2
        normalAndHeight = cglEval(cglCap2back,direction,l,1,U,cglEval(cglGetCutVector2,U));
        v3 = cglViewPos + cglRawDepth*direction - cglCenter;
        if(cglEval(cglCapCut1,v3,U),cglDiscard()); // both intersections with caps are cut of by other cap
      );
    );
    normal = (normalAndHeight_1,normalAndHeight_2,normalAndHeight_3);
    delta = normalAndHeight_4;
    pos3d = (cglViewPos+cglRawDepth*direction);
    texturePos = cglEval(cglProjection,normalize((pos3d-cglCenter)-delta*BA),max(-1,min(delta,1)),cglOrientation);
  ,if(cglEval(cglCut2,delta,v2)>1, // cap2
    normalAndHeight = cglEval(cglCap2back,direction,l,1,U,cglEval(cglGetCutVector2,U));
    v3 = cglViewPos + cglRawDepth*direction - cglCenter;
    if(cglEval(cglCapCut1,v3,U), // cap1 and cap2
      normalAndHeight = cglEval(cglCap1back,direction,l,-1,U,cglEval(cglGetCutVector1,U));
      v3 = cglViewPos + cglRawDepth*direction - cglCenter;
      if(cglEval(cglCapCut2,v3,U),cglDiscard()); // both intersections with caps are cut of by other cap
    );
    normal = (normalAndHeight_1,normalAndHeight_2,normalAndHeight_3);
    delta = normalAndHeight_4;
    pos3d = (cglViewPos+cglRawDepth*direction);
    texturePos = cglEval(cglProjection,normalize((pos3d-cglCenter)-delta*BA),max(-1,min(delta,1)),cglOrientation);
  , // intersection with body of cylinder
    cglSetDepth(l_2,direction);
    normal = normalize(v2-delta*BA);
    texturePos = cglEval(cglProjection,normal,max(-1,min(delta,1)),cglOrientation);
  ));
  color = cglEval(cglPixelExpr,texturePos,cglViewPos + cglRawDepth*direction,normal);
  cglEval(cglLight,color,direction,normal);
);

/////////////////////
// simple surface-renderer: common
/////////////////////

// simple algorithm for small degree surfaces:
// bisection using Rolles theorem
// between any two roots of p there has to be a root of p'
//     l   u
//      \ /
//   l   a0  u   <-roots of p1
//    \ / \ /
// l   b0  b1  u <-roots of p2
//  \ / \ / \ /
//l  c0  c1  c2  <-roots of p3
// \ / \ / \ / \ /
// d0  d1  d2  d3 <-roots of p4
// use lazy-procedures to allow multiple signatures for same code
// feature TODO? add a way to call same function with multiple signatures
cglEvalP = cglLazy((coeffs,t),
  regional(s);
  s = 0;
  forall(reverse(coeffs),c,s = t*s + c);
  s;
);
cglD = cglLazy(coeffs,
  apply(1..(length(coeffs)-1),k,k*coeffs_(k+1));
);
cglBinSearchP = cglLazy((poly, x0, x1, def),
  regional(v0, v1, m, vm);
  v0 = cglEval(cglEvalP,poly, x0);
  v1 = cglEval(cglEvalP,poly, x1);
  if(v0*v1<=0,
    repeat(16,
      m = (x0+x1)/2;
      vm = cglEval(cglEvalP,poly, m);
      if(v0*vm<=0,
        (x1 = m; v1 = vm;),
        (x0 = m; v0 = vm;)
      );
    );
    m,
    def
  )
);
// wrapper function for cglBinSearchP instantiated for each commonly used degree
cglBinSearchP4(poly, x0, x1, def) := cglEval(cglBinSearchP,poly, x0, x1, def);
cglBinSearchP3(poly, x0, x1, def) := cglEval(cglBinSearchP,poly, x0, x1, def);
cglBinSearchP2(poly, x0, x1, def) := cglEval(cglBinSearchP,poly, x0, x1, def);
cglBinSearchP1(poly, x0, x1, def) := cglEval(cglBinSearchP,poly, x0, x1, def);
 //finds the k-th root of poly in interval (l, u). returns def if there is none
cglKthrootP3(k, poly, l, u, def) := (
  regional(p1, p2, p3, a0, b0, b1, c0, c1, c2, count);
  p3 = poly;  //cubic
  p2 = cglEval(cglD,p3); //quadratic
  p1 = cglEval(cglD,p2); //linear

  a0 = cglBinSearchP1(p1, l, u, u);
  b0 = cglBinSearchP2(p2, l, a0, l);
  c0 = cglBinSearchP3(p3, l, b0, l);
  count = (l < c0 & c0 < u);
  if(count >= k, c0,
    b1 = cglBinSearchP2(p2, a0, u, u);
    c1 = cglBinSearchP3(p3, b0, b1, c0);
    count = count + (c0 < c1 & c1 < u);
    if(count >= k, c1,
      c2 = cglBinSearchP3(p3, b1, u, u);
      count = count + (c1 < c2 & c2 < u);
      if(count >= k, c2, def);
    );
  );
);
cglKthrootP4(k, poly, l, u, def) := (
  regional(p1, p2, p3, p4, a0, b0, b1,
    c0, c1, c2, d0, d1, d2, d3,count);
  p4 = poly;  //quartic
  p3 = cglEval(cglD,p4); //cubic
  p2 = cglEval(cglD,p3); //quadratic
  p1 = cglEval(cglD,p2); //linear

  a0 = cglBinSearchP1(p1, l, u, u);
  b0 = cglBinSearchP2(p2, l, a0, l);
  c0 = cglBinSearchP3(p3, l, b0, l);
  d0 = cglBinSearchP4(p4, l, c0, l);
  count = (l < d0 & d0 < u);
  if(count >= k, d0,
    b1 = cglBinSearchP2(p2, a0, u, u);
    c1 = cglBinSearchP3(p3, b0, b1, c0);
    d1 = cglBinSearchP4(p4, c0, c1, d0);
    count = count + (d0 < d1 & d1 < u);
    if(count >= k, d1,
      c2 = cglBinSearchP3(p3, b1, u, u);
      d2 = cglBinSearchP4(p4, c1, c2, d1);
      count = count + (d1 < d2 & d2 < u);
      if(count >= k, d2,
        d3 = cglBinSearchP4(p4, c2, u, u);
        count = count + (d2 < d3 & d3 < u);
        if(count >= k, d3, def);
      );
    );
  );
);

/////////////////////
// torus
/////////////////////


cglTorusProjGetDirection1Default = cglLazy((normal,radiusDirection,orientation),
  normalize(cross(orientation,if(abs(orientation_1)<abs(orientation_2),(1,0,0),(0,1,0))));
);
// the torus with the given orientation onto the unit square using normal vector and radius-direction as input
// assumes that normal and radiusDirection are normalized
cglProjTorusToSquare(normal,radiusDirection,orientation):=(
  regional(v1,v2,phi1,phi2);
  v1 = cglEval(cglTorusProjGetDirection1,normal,radiusDirection,orientation);
  v2 = -normalize(cross(orientation,v1));
  phi1 = arctan2(radiusDirection*v1,radiusDirection*v2)+pi;
  phi2 = arctan2(normal*radiusDirection,normal*orientation)+pi;
  (phi1,phi2)/(2*pi);
);
// opt TODO? separate bounding box-type for torus
cgl3dTorusShaderCode(direction,layer):=(
  regional(center,radius1,radius2,v,V,vc,b0,c0,D0,x0,x1,
    orientation,b1,c1,E,W,a2,b2,c2,p3,p2,p1,p0,dst,pos3d,pc,
    arcDirection,arcCenter,normal,color,texturePos);
  // compute torus coordinates from cylinder bounding box arguments
  //   reduces number of needed uniforms
  center = cglCenter;
  radius1 = cglRadii_1;
  radius2 = cglRadii_2;
  v=|center-cglViewPos|;
  V=cglViewPos+v*direction;
  // 1. find intersections of view-ray with sphere around center with given radius r1+r2
  // |v+l*d -c|=r
  vc=V-center;
  // -> l*l <d,d> + l * 2<v-c,d> + <v-c,v-c> - r*r
  b0=(vc*direction);
  c0=vc*vc-cglRadius*cglRadius;//cglRadius = r1+r2
  // add small buffer distance to balance out numeric instability in bounding sphere
  D0=b0*b0-c0+0.001;
  if(D0<0,cglDiscard());
  x0=-b0-re(sqrt(D0));
  x1=-b0+re(sqrt(D0));
  orientation = normalize(cglOrientation);
  V = V - cglCenter; // update coordinate system such that center is at (0,0,0)
  // Equation for torus in orthogonal coord-system with unit vectors v1,v2,o
  // (sqrt(<P,v1>²+<P,v2>²)-r1)² + <P,o>² = r2²  =>
  // (<P,P> + r1²-r2²)² = 4 r1 ² (<P-<P,o>o,P-<P,o>o>)
  // P = V + l*D
  // (<V+l*D,V+l*D> + r1²-r2²)² = 4 r1 ² (<V+l*D-<V+l*D,o>o,V+l*D-<V+l*D,o>o>)
  // A² = B with  W := V-<V,o>o  E := D-<D,o>o
  // A := (<V+l*D,V+l*D> + r1²-r2²)
  //    = (<V,V>+l*2<V,D>+l²<D,D> + r1²-r2²)
  // B := 4 R² (<W+l*E,W+l*E>) = 4 r1 ² (<W,W>+l*2<W,E>+l²<E,E>)
  //  a1 := <D,D> = 1 b1 := <V,D> c1 := r1²-r2²+<V,V>
  //  a2 := <E,E> b2 := <W,E> c2 := <W,W>
  // (l² + l 2*b1 + c1)² = 4 r1² (l² a2 + l 2b2 + c2)
  // l⁴
  // l³  4 b1
  // l²  (2 c1 + 4 b1^2) -4 r1² a2
  // l   4 b1 c1 - 4 r1² 2 b2
  //     c1² - 4 r1² c2
  b1 = V * direction;
  c1 = radius1*radius1-radius2*radius2 + V*V;
  E = direction - (direction*orientation)*orientation;
  W = V - (V*orientation)*orientation;
  a2 = E*E;
  b2 = W*E;
  c2 = W*W;
  p3 = 4*b1;
  p2 = 2*c1 + 4*b1*b1 - 4*radius1*radius1*a2;
  p1 =  4*b1*c1 - 8*radius1*radius1*b2;
  p0 =  c1*c1 - 4*radius1*radius1*c2;
  dst=cglKthrootP4(layer,[p0,p1,p2,p3,1],x0,x1,x0-1);
  if(dst<x0,cglDiscard());
  pos3d = cglViewPos+ (v+dst)*direction;
  pc=pos3d-center;
  arcDirection = normalize(pc-(orientation*pc)*orientation);
  arcCenter = center+radius1*arcDirection;
  normal = normalize(pos3d - arcCenter);
  cglSetDepth(v+dst,direction);
  texturePos = cglProjTorusToSquare(normal,arcDirection,orientation);
  cglEval(cglCheckAngle1,texturePos);
  cglEval(cglCheckAngle2,texturePos);
  color = cglEval(cglPixelExpr,texturePos,cglViewPos + cglRawDepth*direction,normal);
  cglEval(cglLight,color,direction,normal);
);

/////////////////////
// polygons & meshes
/////////////////////

cgl3dTriangleShaderCode(direction):=(
  regional(color,normal,texCoord);
  cglRawDepth = |cglViewPos-cglSpacePos|; // set raw depth to correct value (depth is handled by v-shader)
  texCoord = cglEval(cglTextureMapping,cglSpacePos,direction);
  normal = cglEval(cglNormalExpr,cglSpacePos,texCoord);
  color = cglEval(cglPixelExpr,texCoord,cglSpacePos,normal);
  cglEval(cglLight,color,direction,normal);
);

CglNormalFlat = 0;
CglNormalPerFace = 0;
CglNormalPerTriangle = 1;
CglNormalPerVertex = 2;
CglNormalPerPixel = 3;
NormalFlat=CglNormalFlat;
NormalPerFace=CglNormalPerFace;
NormalPerTriangle=CglNormalPerTriangle;
NormalPerVertex=CglNormalPerVertex;
NormalPerPixel = CglNormalPerPixel;

cglTriangulateCorner(elts):=(
  regional(root);
  root = elts_1;
  flatten(apply(2..(length(elts)-1),i,
    [root,elts_i,elts_(i+1)];
  ));
);
cglTriangulateSpiralRec(elts):=(
  regional(eltCount,even,odd);
  eltCount = length(elts);
  if(eltCount<=3,
    if(eltCount<3,[],elts)
  ,
    even = flatten(apply(1..(eltCount/2),i,(elts_(2*i-1),elts_(2*i),elts_(cglMod1plus(2*i+1,eltCount)))));
    odd = apply(1..(eltCount/2),i,elts_(2*i-1));
    if(mod(eltCount,2)==1,
      odd = prepend(elts_eltCount,odd);
    );
    even++cglTriangulateSpiralRec(odd);
  );
);
cglTriangulateCenter(elts):=(
  regional(center);
  center = sum(elts)/length(elts);
  flatten(apply(1..(length(elts)-1),i,
    [center,elts_i,elts_(i+1)];
  ))++[center,elts_(length(elts)),elts_1];
);
cglTriangulatePolygon(triangulator,vertices,vNormals,vModifiers,normalType):=(
  regional(triangles,n,vMap,vData);
  triangles = cglEval(triangulator,vertices);
  if(isundefined(vNormals) & normalType != CglNormalPerPixel,
    vNormals = flatten(apply(1..(length(triangles)/3),i,
      n=normalize(cross(triangles_(3*i)-triangles_(3*i-1),triangles_(3*i-2)-triangles_(3*i-1)));
      [n,n,n];
    ));
    if(normalType==NormalFlat,
      // compute average normal
      vNormals = normalize(sum(vNormals)); // for flat normal-type normals is a single normal
    ,if(normalType==NormalPerVertex,
      vMap = cglEval(triangulator,1..length(vertices));
      vData = apply(vertices,(0,0,0));
      // compute average normal for each vertex
      forall(1..length(vNormals),i,
        vData_(vMap_i) = vData_(vMap_i) + vNormals_i
      );
      forall(1..length(vNormals),i,
        vNormals_i = normalize(vData_(vMap_i));
      );
    ));
  ,
    vNormals = cglEval(triangulator,vNormals);
  );
  vModifiers=apply(vModifiers,e,cglEval(triangulator,e));
  (triangles,vNormals,vModifiers)
);

CglTriangulateCorner = 0; // connect all vertices to first vertex
CglTriangulateCenter = 1; // connect all vertices to additional vertex in center of polygon (mean of vertices)
CglTriangulateSpiral = 2; // cut of all vertices with even index, repeats recursively on remaining vertices
TriangulateCorner = CglTriangulateCorner;
TriangulateCenter = CglTriangulateCenter;
TriangulateSpiral = CglTriangulateSpiral;
CglTriangulateDefault = TriangulateSpiral;

CglTopologyYFactor = 16;
CglTopologyOpen = 0;
CglTopologyClose = 1;

TopologyOpen = CglTopologyOpen;
TopologyCloseX = CglTopologyClose;
TopologyCloseY = CglTopologyYFactor*CglTopologyClose;
TopologyCloseXY = TopologyCloseX+TopologyCloseY;
// feature TODO? allow mirrored closing
cglSampleVertex = 0;
cglSampleFace = 1;
cglSampleTriangle = 2;

cglMeshSamplesToTriangles(samples,Nx,Ny,topology,sampleType):=(
  regional(p00,p01,p10,p11);
  // opt TODO? is handling closure by computing missing elements on demand more efficient
  if(topology_1 == CglTopologyClose,//close X
    if(length(samples_1)<Nx+1,
      samples = apply(samples,row,append(row,row_1));
    );
    Nx=Nx+1;
  );
  if(topology_2 == CglTopologyClose,//close Y
    if(length(samples)<Ny+1,
      samples = append(samples,samples_1);
    );
    Ny=Ny+1;
  );
  flatten(apply(1..(Ny-1),ny,
    apply(1..(Nx-1),nx,
      p00 = samples_ny_nx;
      p01 = samples_ny_(nx+1);
      p10 = samples_(ny+1)_nx;
      p11 = samples_(ny+1)_(nx+1);
      if(sampleType == cglSampleVertex,
        [p00,p01,p10,p01,p10,p11];
      ,if(sampleType == cglSampleFace,
        [p00,p00,p00,p00,p00,p00];
      ,
        [p00,p00,p00,p11,p11,p11];
      ));
    );
  ),levels->2);
);
cglMeshGuessNormals(samples,Nx,Ny,normalType,topology):=(
  regional(n,vNormals,p00,p01,p10,p11,n1,n2,Nx1,Ny1);
  if(normalType == NormalPerTriangle,
    // opt TODO? pass triangles as input, to avoid recomputing triangulation
    if(topology_1 == CglTopologyClose,//close X
      samples = apply(samples,row,append(row,row_1));
      Nx=Nx+1;
    );
    if(topology_2 == CglTopologyClose,//close Y
      samples = append(samples,samples_1);
      Ny=Ny+1;
    );
    flatten(apply(1..(Ny-1),ny,
      apply(1..(Nx-1),nx,
        p00 = samples_ny_nx;
        p01 = samples_ny_(nx+1);
        p10 = samples_(ny+1)_nx;
        p11 = samples_(ny+1)_(nx+1);
        n1=normalize(cross(p01-p00,p10-p00));
        n2=-normalize(cross(p01-p11,p10-p11));
        [n1,n1,n1,n2,n2,n2];
      );
    ),levels->2);
  ,if(normalType == NormalPerFace,
    if(topology_1 == CglTopologyClose,//close X
      samples = apply(samples,row,append(row,row_1));
      Nx=Nx+1;
    );
    if(topology_2 == CglTopologyClose,//close Y
      samples = append(samples,samples_1);
      Ny=Ny+1;
    );
    flatten(apply(1..(Ny-1),ny,
      apply(1..(Nx-1),nx,
        p00 = samples_ny_nx;
        p01 = samples_ny_(nx+1);
        p10 = samples_(ny+1)_nx;
        p11 = samples_(ny+1)_(nx+1);
        n1=normalize(cross(p01-p00,p10-p00));
        n2=-normalize(cross(p01-p11,p10-p11));
        n = normalize(n1+n2);
        [n,n,n,n,n,n];
      );
    ),levels->2);
  , // vertex normals
    if(topology_1 == CglTopologyClose,//close X
      samples = apply(samples,row,append(row,row_1));
      Nx1=Nx+1;
    ,
      Nx1=Nx;
    );
    if(topology_2 == CglTopologyClose,//close Y
      samples = append(samples,samples_1);
      Ny1=Ny+1;
    ,
      Ny1=Ny;
    );
    vNormals=apply(1..Ny,ny,apply(1..Nx,nx,
      p00 = samples_ny_nx;
      n = (0,0,0);
      // normals oriented to point "up" when grid is flat
      if(nx>1 & ny > 1,
        n = n + cross(samples_(ny-1)_nx-p00,samples_ny_(nx-1)-p00);
      );
      if(nx>1 & ny<Ny1,
        n = n + cross(samples_ny_(nx-1)-p00,samples_(ny+1)_nx-p00);
      );
      if(nx<Nx1 & ny > 1,
        n = n + cross(samples_ny_(nx+1)-p00,samples_(ny-1)_nx-p00);
      );
      if(nx<Nx1 & ny<Ny1,
        n = n + cross(samples_(ny+1)_nx-p00,samples_ny_(nx+1)-p00);
      );
      normalize(n)
    ));
    // assign normals to corresponding vertices
    cglMeshSamplesToTriangles(vNormals,Nx,Ny,topology,cglSampleVertex);
  ));
);

/////////////////////
// general algebraic surfaces
/////////////////////

// ray(direction, t) is the point in R^3 that lies at position t on the ray in direction direction
cglRay(direction, t) := (t * direction + cglViewPos);

// casteljau algorithm to evaluate and subdivide polynomials in Bernstein form.
// poly is a vector containing the coefficients, i.e. p(x) = sum(0..N, i, poly_(i+1) * b_(i,N)(x)) where b_(i,N)(x) = choose(N, i)*x^i*(1-x)^(N-1)
cglEvalCasteljau(poly, x) := (
  regional(alpha, beta,N);
  N = length(poly)-1;
  alpha = 1-x;
  beta = x;
  forall(0..N, k,
    repeat(N-k,
      poly_# = alpha*poly_# + beta*poly_(#+1);
    );
  );
  poly_1 // poly contains the bernstein-coefficients of the polynomial in the interval [x,1]
);

cglSurfaceNsign(direction, a, b) := ( // Descartes rule of sign for the interval (a,b)
  regional(poly,ans);
  // obtain the coefficients in bernstein basis of cglSurfaceExpr along the ray in interval (a,b) by interpolation within this interval
  poly = cglInterpMat * apply(cglChebNodes,
    cglEval(cglSurfaceExpr,cglRay(direction, a+#*(b-a))) //evaluate cglSurfaceExpr(ray(direction, ·)) along Chebyshev nodes for (a,b)
  );
  // count the number of sign changes
  ans = 0;
  // last = poly_1;
  forall(2..length(poly), k,
    // if(last == 0, last = poly_k;); this (almost) never happens
    if(min(poly_(k-1), poly_k) <= 0 & 0 <= max(poly_(k-1), poly_k), // sign switch; avoid products due numerics
      ans = ans + 1;
    );
  );
  ans // return value
);
// bisect cglSurfaceExpr(ray(direction, ·)) in [x0, x1] assuming that cglSurfaceExpr(ray(direction, x0)) and cglSurfaceExpr(ray(direction, x1)) have opposite signs
cglSurfaceBisectf(direction, x0, x1) := (
    regional(v0, v1, m, vm);
    v0 = cglEval(cglSurfaceExpr,cglRay(direction, x0));
    v1 = cglEval(cglSurfaceExpr,cglRay(direction, x1));
    repeat(11, // algorithm TODO? why 11, would a larger number be more precise?
        m = (x0 + x1) / 2; vm = cglEval(cglSurfaceExpr,cglRay(direction, m));
        if (min(v0,vm) <= 0 & 0 <= max(v0, vm), // sgn(v0)!=sgn(vm); avoid products due numerics
            (x1 = m; v1 = vm;),
            (x0 = m; v0 = vm;)
        );
    );
    m // return value
);

// temporary algorithm for texture computation on surfaces
// decomposes position into normal part and tangential part, then combine the corresponding texture coordinates
// ! local texture coordinates do not approximate euclidean plane on some flat surfaces (e.g. cylinder)
// map does not seem to be injective
// Feature TODO find better algorithm ; make algorithm customizable
cglSurfaceComputeTextureCoords(pos3d,normal) := (
  regional(phi,theta,p0,pos2d,alpha,ax,ay,S,C);
  // texture-coordinates of normal-vector on sphere
  phi = if(|normal_2|==1,0,arctan2(-normal_3,normal_1)); // (-pi, pi]
  theta = arctan2(|(normal_1,normal_3)|,normal_2); // (-pi, pi]
  p0 = (1/(2*pi))*(phi+pi,2*theta+pi);
  // part of position that is orthogonal to normal
  pos2d = pos3d - (normal*pos3d)*normal;
  // find rotation angle needed to make z-component of normal vector zero
  alpha = arctan2(normal_3,|(normal_1,normal_2)|);
  ax = -normal_2;
  ay = normal_1;
  S = sin(alpha);
  C = cos(alpha);
  // rotation around (ax,ay,0) with angle alpha
  pos2d = ((ax*ax* (1-C) + C, ax*ay* (1-C), ay* S),(ax*ay* (1-C), ay*ay* (1-C) + C, - ax*S),(-ay*S, ax*S, C))*pos2d;
  (pos2d_1+p0_1,pos2d_2+p0_2);
);
// update the color color for the pixel at in direction direction assuming that the surface has been intersected at ray(direction, dst)
// because of the alpha-transparency updatecolor should be called for the intersections with large dst first
cglSurfaceUpdateColor(direction, dst, color) := (
  regional(x,pos3d,normal,pixelCol);
  cglSetDepth(dst,direction);
  x = cglRay(direction, dst); // the intersection point in R^3
  normal = normalize(cglEval(cglNormalExpr,x));
  pos3d = cglViewPos+dst*direction;
  pixelCol = cglEval(cglPixelExpr,cglSurfaceComputeTextureCoords(pos3d,normal),pos3d,normal);
  color = (1 - cglAlpha) * color + cglAlpha * pixelCol;
  cglEval(cglLight,color,direction,normal);
);

// id encodes a node in a binary tree using heap-indices
// 1 is root node and node v has children 2*v and 2*v+1
// computes s=2^depth of a node id: Compute floor(log_2(id));
// purpose: id corresponds interval [id-s,id+1-s]/s
cglSurfaceRootItrGetS(id) := (
  regional(s);
  s = 1;
  repeat(10, // algorithm TODO? is there a reason why 10 is used
    if(2*s<=id,
      s = 2*s;
    )
  );
  s // return value
);
// determines the next node in the binary tree that would be visited by a regular in DFS
// if the children of id are not supposed to be visited
// In interval logic: finds the biggest unvisited interval directly right of the interval of id.
cglSurfaceRootItrNext(id) := (
  id = id+1;
  // now: remove zeros from right (in binary representation) while(id&1) id=id>>1;
  repeat(10,
    if(mod(id,2)==0,
      id = floor(id/2);
    )
  );
  if(id==1, 0, id) // return value - id 0 means we stop our DFS
);
// iterate roots from back to front, merge colors for roots
cglSurfaceIterateRoots(direction,l,u):=(
  regional(a,b,color,id,hasRoot,s,cnt);
  a = l;
  b = u;
  color = cglColor0;
  // traverse binary tree (DFS) using heap-indices
  //1 is root node and node v has children 2*v and 2*v+1
  id = 1;
  hasRoot = false;
  // maximum number of steps
  repeat((length(cglChebNodes)-1)*6,
    // id=0 means we are done; do only a DFS-step if we are not finished yet
    if(id>0,
      s = cglSurfaceRootItrGetS(id); // s = floor(log_2(id))

      // the intervals [a,b] are chosen such that (id in binary notation)
      // id = 1   => [a,b]=[l,u]
      // id = 10  => [a,b]=[l,(u+l)/2]
      // id = 101 => [a,b]=[l,(u+3*l)/4]
      // id = 11  => [a,b]=[(u+l)/2,u]
      //...
      a = u - (u-l)*((id+1)/s-1);
      b = u - (u-l)*((id+0)/s-1);
      // how many sign changes has cglSurfaceExpr(ray(direction, ·)) in (a,b)?
      cnt = cglSurfaceNsign(direction, a, b);
      // algorithm TODO? this way of checking for multi-root seems to create artifacts, is the check necessary/ is there a better way
      if(cnt == 1 /*% (b-a)<.01*cglResolution*/, // in this case we found a root (or it is likely to have a multiple root)
        //=>colorize and break DFS
        color = cglSurfaceUpdateColor(direction, cglSurfaceBisectf(direction, a, b), color);
        hasRoot = true;
        id = cglSurfaceRootItrNext(id)
      ,if(cnt == 0, // there is no root
        id = cglSurfaceRootItrNext(id) // break DFS
      ,
        // otherwise cnt>=2: there are cnt - 2*k roots.
        id = 2*id;  // visit first child within DFS
      ));
    )
  );
  if(!hasRoot,cglDiscard());
  [color_1,color_2,color_3,cglAlpha] // return value
);
// find the k-th root of surface (needed for rendering individual roots)
cglSurfaceKthRoot(direction,l,u,K):=(
  regional(a,b,rootCount,rootDepth,id,s,cnt,color);
  a = l;
  b = u;
  // iterate roots from front to back until k-th root is found, discard pixel if there are less than k roots
  rootDepth = -1;
  id = 1;
  rootCount = 0;
  // maximum number of steps
  repeat((length(cglChebNodes)-1)*6,
    // id=0 means we are done; do only a DFS-step if we are not finished yet
    if(id>0 & rootCount < K,
      s = cglSurfaceRootItrGetS(id); // s = floor(log_2(id))
      a = l - (l-u)*((id+0)/s-1);
      b = l - (l-u)*((id+1)/s-1);
      // how many sign changes has cglSurfaceExpr(ray(direction, ·)) in (a,b)?
      cnt = cglSurfaceNsign(direction, a, b);
      if(cnt == 1 /*% (b-a)<.01*cglResolution*/, // in this case we found a root (or it is likely to have a multiple root)
        //=>colorize and break DFS
        rootDepth = cglSurfaceBisectf(direction, a, b);
        rootCount = rootCount + 1;
        id = cglSurfaceRootItrNext(id);
      ,if(cnt == 0, // there is no root
        id = cglSurfaceRootItrNext(id) // break DFS
      ,
        // otherwise cnt>=2: there are cnt - 2*k roots.
        id = 2*id;  // visit first child within DFS
      ));
    )
  );
  if(rootCount < K,cglDiscard());
  color = cglSurfaceUpdateColor(direction,rootDepth, cglColor0);
  [color_1,color_2,color_3,cglAlpha] // return value
);
// what color should be given to pixel in  direction direction (vec3)
cgl3dSurfaceShaderCode(direction) := (
  regional(depths,u,l);
  // discard points outside bounding sphere
  depths = cglEval(cglCutoffRegion,cglViewPos,direction);
  l = depths_1;
  u = depths_2;
  cglSurfaceIterateRoots(direction,l,u);
);
// what color should be given to pixel in  direction direction (vec3)
cgl3dSurfaceLayerShaderCode(direction) := (
  regional(depths,u,l);
  // discard points outside bounding sphere
  depths = cglEval(cglCutoffRegion,cglViewPos,direction);
  l = depths_1;
  u = depths_2;
  cglSurfaceKthRoot(direction,l,u,K);
);

// maximum degree for interpolating surfaces
// values of kind 4*n-1 are good values, as it means to use vectors of length 4*n.
cglMaxDeg = 23; // for values above ~20 the root-computation becomes unstable
cglMaxAutoDeg = 15;
// cache for interpolation parameters to avoid repeated recomputation
cglSurfaceRenderStateCache = {
  "interpMap":{},
  "chebNodes":{}
};
// opt TODO? would computing elements of Chebyshev-nodes/interpolation-matrix on demand be faster than storing as uniform variable
// N+1 Chebyshev nodes for interval (0, 1)
cglSurfaceChebyshevNodes(N):=(
  regional(cache,val);
  cache=cglSurfaceRenderStateCache_"chebNodes";
  val = cache_N;
  if(isundefined(val),
    val = apply(1..(N+1), k, (cos((2 * k - 1) / (2 * (N+1)) * pi)+1)/2);
    cache_N=val;
    cglSurfaceRenderStateCache_"chebNodes" = cache;
  );
  val
);
// matrix for interpolating polynomials (in Bernstein basis), given the values [p(li_1), p(li_2), ...]
cglSurfaceInterpolationMatrix(N):=(
  regional(cache,val,A);
  cache=cglSurfaceRenderStateCache_"interpMap";
  val = cache_N;
  if(isundefined(val),
    // A is the matrix of the linear map that evaluates a polynomial in bernstein-form at the Chebyshev nodes
    A = apply(cglSurfaceChebyshevNodes(N), node,
      // the i-th column contains the values of the (i,N) bernstein polynomial evaluated at the Chebyshev nodes
      apply(0..N, i, cglEvalCasteljau(
        apply(0..N, if(#==i,1,0)), // e_i = [0,0,0,1,0,0]
        node // evaluate  b_(i,N)(node)
      ))
    );
    val = inverse(A);
    cache_N=val;
    cglSurfaceRenderStateCache_"interpMap" = cache;
  );
  val
);
// FIXME guessing degree this way can lead to wrong results for some rational functions  ( e.g.  (z^3-1)/(z*(z^2+1))  -> 1  )
// guess the degree of the trivariate polynomial F. This approximation is reliable up to degree ~20.
cglGuessdegHelper(F, s, x) := log(|cglEval(F,s*x)|)/log(s*|x|); // is approx. degree+log(leadingcoeff)/log(s*|x|) for large s
cglGuessdeg(F) := max(apply(1 .. 2, // take the best result of 2
  regional(x,s,l,best,it);
  x = [random(), random(), random()];
  s = 1;
  l = 1;
  best = 1;
  it = 0;
  while(l<100 & s < 1e50 & it<100, // throw away Infinity
    best = round(l);
    it = it+1;
    s = 2*s;
    l = 2*cglGuessdegHelper(F,s*s, x)-cglGuessdegHelper(F,s,x); // remove error caused by log(leadingcoeff)
  );
  if(it==100, best = 1000000);
  best
));

// use central difference to approximate dF
cglGuessDerivative(F) := ( // opt TODO? avoid code duplication for repeated application of cglEval
  cglLazy(p,((
      (cglEval(F,p + [eps, 0, 0]) - cglEval(F,p - [eps, 0, 0])),
      (cglEval(F,p + [0, eps, 0]) - cglEval(F,p - [0, eps, 0])),
      (cglEval(F,p + [0, 0, eps]) - cglEval(F,p - [0, 0, eps]))
  ) / (2 * eps)),eps->.001,F->F)
);

CglBoundsUnbounded = {"type":"unbounded"};
CglBoundsSphere(center,radius) := {"type":"sphere","center":center,"radius":radius};
CglBoundsCylinder(point1,point2,radius) := {"type":"cylinder","point1":point1,"point2":point2,"radius":radius};
CglBoundsCuboid(center,v1,v2,v3) := {"type":"cuboid","center":center,"v1":v1,"v2":v2,"v3":v3};

// get intersections of view-ray with cuboid given by center point and (scaled) directions of the three axes
cglCuboidDepths(rayStart,direction,center,up,left,front):=(
  regional(relCenter,l1,l2,l1t,l2t,d1,d2,d);
  relCenter = center-rayStart;
  // + up, - up
  d1 = up*(relCenter-up);
  d2 = up*(relCenter+up);
  d = up*direction;
  l1t = d1/d;
  l2t = d2/d;
  l1 = min(l1t,l2t);
  l2 = max(l1t,l2t);
  l1 = max(l1,0);
 // + left, - left
  d1 = left*(relCenter-left);
  d2 = left*(relCenter+left);
  d = left*direction;
  l1t = d1/d;
  l2t = d2/d;
  l1 = max(l1,min(l1t,l2t));
  l2 = min(l2,max(l1t,l2t));
   // + front, - front
  d1 = front*(relCenter-front);
  d2 = front*(relCenter+front);
  d = front*direction;
  l1t = d1/d;
  l2t = d2/d;
  l1 = max(l1,min(l1t,l2t));
  l2 = min(l2,max(l1t,l2t));
  if(l1>=l2,cglDiscard());
  [l1,l2];
);

// bug TODO support coordinate systems where view-plane is not at z = 0
CglCutoffScreenSphere = {"expr": cglLazy((rayStart,direction),
  regional(viewRect,x0,y0,x1,y1);
  viewRect = cglViewRect(); // [x0,y0,x1,y1]
  x0 = viewRect_1;
  y0 = viewRect_2;
  x1 = viewRect_3;
  y1 = viewRect_4;
  cglSphereDepths(rayStart,direction,(x0+x1,y0+y1,0)/2,min(|x1-x0|,|y1-y0|)/2)
),"bounds": CglBoundsUnbounded,"modifs":{}};
CglCutoffScreenCylinder = {"expr": cglLazy((rayStart,direction),
  regional(viewRect,x0,y0,x1,y1,r);
  viewRect = cglViewRect(); // [x0,y0,x1,y1]
  x0 = viewRect_1;
  y0 = viewRect_2;
  x1 = viewRect_3;
  y1 = viewRect_4;
  r = min(|x1-x0|,|y1-y0|)/2.5;
  cglCappedCylinderDepths(rayStart,direction,(x0+x1,y0+y1,0)/2,[0,r,0],r)
),"bounds": CglBoundsUnbounded,"modifs":{}};
CglCutoffScreenCylinder(orientation) := {"expr": cglLazy((rayStart,direction),
  regional(viewRect,x0,y0,x1,y1,r);
  viewRect = cglViewRect(); // [x0,y0,x1,y1]
  x0 = viewRect_1;
  y0 = viewRect_2;
  x1 = viewRect_3;
  y1 = viewRect_4;
  r = min(|x1-x0|,|y1-y0|)/2.5;
  cglCappedCylinderDepths(rayStart,direction,(x0+x1,y0+y1,0)/2,r*cglBoxOrientation,r)),
  "bounds": CglBoundsUnbounded,"modifs":{"cglBoxOrientation":normalize(orientation)}};
CglCutoffScreenCube = {"expr": cglLazy((rayStart,direction),
  regional(viewRect,x0,y0,x1,y1,r);
  viewRect = cglViewRect(); // [x0,y0,x1,y1]
  x0 = viewRect_1;
  y0 = viewRect_2;
  x1 = viewRect_3;
  y1 = viewRect_4;
  r = min(|x1-x0|,|y1-y0|)/3;
  cglCuboidDepths(rayStart,direction,(0,0,0),[r,0,0],[0,r,0],[0,0,r])
),"bounds": CglBoundsUnbounded,"modifs":{}};

CglCutoffSphere(center,radius) := {"expr":cglLazy((rayStart,direction),
  cglSphereDepths(rayStart,direction,cglCenter,cglRadius)
),"bounds":CglBoundsSphere(center,radius),"modifs":{}};
CglCutoffCylinder(point1,point2,radius) := {"expr":cglLazy((rayStart,direction),
  cglCappedCylinderDepths(rayStart,direction,cglCenter,cglOrientation,cglRadius)
),"bounds":CglBoundsCylinder(point1,point2,radius),"modifs":{}};
CglCutoffCube(center,sideLength) := {"expr":cglLazy((rayStart,direction),
  cglCuboidDepths(rayStart,direction,cglCenter,cglCubeAxes_1,cglCubeAxes_2,cglCubeAxes_3)
),"bounds":CglBoundsCuboid(center,[sideLength,0,0],[0,sideLength,0],[0,0,sideLength]),"modifs":{}};
CglCutoffCube(center,sideLength,up,front) := {
  "expr":cglLazy((rayStart,direction),
    cglCuboidDepths(rayStart,direction,cglCenter,cglCubeAxes_1,cglCubeAxes_2,cglCubeAxes_3)),
  "bounds":CglBoundsCuboid(center,sideLength*normalize(up),sideLength*normalize(front),
    sideLength*normalize(cross(up,front))),"modifs":{}
};
CglCutoffCuboid(center,v1,v2,v3) := {
  "expr":cglLazy((rayStart,direction),
    cglCuboidDepths(rayStart,direction,cglCenter,cglCubeAxes_1,cglCubeAxes_2,cglCubeAxes_3)),
  "bounds":CglBoundsCuboid(center,v1,v2,v3),"modifs":{}
};

CutoffScreenSphere = CglCutoffScreenSphere;
CutoffScreenCylinder = CglCutoffScreenCylinder;
CutoffScreenCube = CglCutoffScreenCube;
CutoffScreenCylinder(orientation) := CglCutoffScreenCylinder(orientation);
CutoffSphere(center,radius) := CglCutoffSphere(center,radius);
CutoffCylinder(point1,point2,radius) := CglCutoffCylinder(point1,point2,radius);
CutoffCube(center,sideLength) := CglCutoffCube(center,sideLength);
CutoffCube(center,sideLength,up,front) := CglCutoffCube(center,sideLength,up,front);
CutoffCuboid(center,v1,v2,v3) := CglCutoffCuboid(center,v1,v2,v3);

// intersect cutoff-region with the half-space {P ; P*normal <= depth} // code TODO? better name
cglInterface("cutoffAddPlane",cglCutoffAddPlane,(oldCutoff,normal:(),depth:()),(plotModifiers));
cglCutoffAddPlane(oldCutoff,normal,depth):=(
  {
    "expr":cglLazy((rayStart,direction),
      regional(depths,l,n);
      depths = cglEval(baseExpr,rayStart,direction);
      // <v + l*d , n> <= x
      // <v,n> + l<d , n> <= x
      // l <= (x-<v,n>)/<d,n>
      n = cglEval(normal); // current compiler does not support direct multplication with constant vector
      l = (cglEval(depth)-(rayStart*n))/(direction*n);
      if(n*direction>0,
        depths_2 = min(depths_2,l);
      ,
        depths_1 = max(depths_1,l);
      );
      if(depths_1>depths_2,cglDiscard());
      depths;
    ,baseExpr->oldCutoff_"expr",normal->normal,depth->depth),
    "bounds":oldCutoff_"bounds",
    "modifs":cglMergeDicts(oldCutoff_"modifs",cglValOrDefault(plotModifiers,{}))
  };
);

cglDefaultStack = [];
cglResetDefaults() := (
  cglDefaults = {};
  cglDefaults_"light" = cglDefaultLight;

  cglDefaults_"sphereColor" = cglRed;
  cglDefaults_"sphereSize" = 0.5;
  cglDefaults_"sphereAlpha" = cglUndefinedVal();
  cglDefaults_"sphereProjection" = cglSphereProjectionEquirect;

  cglDefaults_"cylinderColor" = cglBlack;
  cglDefaults_"cylinderSize" = 0.4;
  cglDefaults_"cylinderAlpha" = cglUndefinedVal();
  cglDefaults_"cylinderCaps" = CglCylinderCapOpen;

  cglDefaults_"lineCutoff" = CglCutoffScreenSphere;

  cglDefaults_"curveSamples" = 32;
  cglDefaults_"curveCaps" = CglCylinderCapRound;
  cglDefaults_"curveJoints" = CglConnectRound;

  cglDefaults_"torusColor" = cglBlue;
  cglDefaults_"torusSize" = 0.25;
  cglDefaults_"torusAlpha" = cglUndefinedVal();

  cglDefaults_"triangleColor" = cglGreen;
  cglDefaults_"triangleAlpha" = cglUndefinedVal();

  cglDefaults_"surfaceColor" = cglCyan;
  cglDefaults_"surfaceAlpha" = 1;
  cglDefaults_"surfaceCutoff" = CglCutoffScreenSphere;
);

cglSaveDefaults() := (
  cglDefaultStack = append(cglDefaultStack,
    apply(cglDefaults,#) // push shallow copy of current defaults
  );
);
cglRestoreDefaults() := (
  if(length(cglDefaultStack)>0,
    // pop previous defaults from default-stack
    cglDefaults = cglDefaultStack_(length(cglDefaultStack));
    // cindyscript FIXME is there realy no direct way to remove the last element of a list
    cglDefaultStack = apply(1..(length(cglDefaultStack)-1),i,cglDefaultStack_i);
  ,
    cglResetDefaults();
  );
);
cglResetDefaults(); // initialisation of code complete -> can initialize default values

/////////////////////
// user-interface
/////////////////////

cglValOrDefault(val,default):=(
  if(isundefined(val),default,val)
);
// cindyscript TODO is there realy no built-in for this
// ? implement in javascript
// add all entries in second dictionary to first dictionary
cglMergeDicts(dict1,dict2):=(
  res = dict1;
  forall(dict2,val,key,res_key=val);
  res;
);

// feature TODO:
// TODO port code for movable codes to library
// TODO find good list of default modifiers‚
// function->f(#pos,#norm,#kmin,#kmax....) (colorplot on drawn surface)
// thickness -> give rendered surfaces a thinkness (needed for conversion to 3d-printer file)
// ? rememberId -> remember object id
// TODO function for updating/resetting defaults
// ? use internal global variables (-> document names of default values)
// ? always use cglAlpha even if explicitly not specified
// TODO? add simple way to specify seperate color(s)/texture for back-side of rendered surface
// * support orthogonal projection, smooth moving between linear and orth projection

// TODO? is the `tags` modifier usefull (currently used by "find object at point" built-in)
// ? replace with explicit "moveable" modifier
// TODO? rename spacePos -> pos3d
// TODO support for zoom-level dependent objects (update bounding-box depending on zoom-level) ?
// a) "dynamic(<expr>)": would need a check in the core-library for every parameter to catch dynamic values within expression
// b) modifier for dynamic size value, how to pass expressions through cindy-script functions?
// c) function that will be run when external system is updated
// onFrame:(objId) -> runs at the start of each frame
// onZoom:(objId) -> runs whenever zoom-level changes
// -> zoom-dependent radius => sphere3d(center,r0,onZoom->update3d(obj,radius->r0*zoom))

// TODO? cglLogLevel(...) built-in for setting log-level

// bug TODO:
// TODO rendering of mesh with overlapping transparent textures is partially broken
//    (when multiple transparent triangles are rendered in single call WebGL ignores lower ones)
//    ? add texture mode to automatically ignore pixels belows certain alpha value
// TODO multi-part in cgl-lazy can lead to wrong result in expression
// * surface3d(p=trafo(x,y,z);f(x,y,z)) leads to invalid normal vectors
// TODO handle radius <= 0
// * <0 -> use abs-value, (? use mirrored texture coordinates)
// * torus with major radius 0 -> sphere with minor radius as radius
// TODO ensure modifiers are correctly initialized when directly calling other implementation
// TODO? support interaction between translucent mesh and other objects in multi-layer rendering mode
// ? render each triangle as a seperate layer (too expensive?)
// ? automatically split self-overlapping translucent meshes into multiple layers when rendering in layered mode
// TODO translucent 3D-objects do not seem to work correctly on some mobile browsers
// TODO curve3d is nummerically unstable if number of sample points gets large
//  ? special case: use round cylinder-caps if all elements are opaque and curve is closed or ends are round
// TODO? connect3d: angled caps might cut into next segment
// TODO spheres&surfaces break if view distance is moved far out (? use trick of "moving view closer to object" from cylinder/torus also for spheres/surfaces)
// TODO connect3d -> textures do not match for closed curves in connect3d (is this even possible if angle direction is constant along cylinders?)

// opt TODO:
// TODO? store texture-name in plotModifier instead of lambda-modifier
// TODO is there a way to avoid recompilation when texture changes
// TODO? prevent recompilation when lambda modifier changes
// TODO? WEBGL.get*Parameter is slow try to avoid use
// TODO? option to conditionally disable rendering (renderIf parameter analogously to opaqueIf)
// TODO?can rendering multiple texture-layeres in single shader call speed up rendering for multi-layered surfaces


// helper functions for resolving of colorExpression/textures
// pick the first defined color expression return undefined if there is none
// code TODO? to which extend can this function be shortened by extracting code
cglResolveColorExpr(hasAlpha):=(
  regional(pixelExpr,usesAlpha,modifiers);
  hasAlpha = cglValOrDefault(hasAlpha,false); // undefined condition would be silent failure
  repeatTexture = cglValOrDefault(repeatTexture,false);
  interpolateTexture = cglValOrDefault(interpolateTexture, true);
  modifiers = {};
  usesAlpha = false;
  if(!isundefined(colorExprRGBA),
    usesAlpha = true;
    pixelExpr = if(hasAlpha,
      cglLazy((texturePos,spacePos),
        regional(col);
        col=cglEval(colorExprRGBA,texturePos,spacePos);
        (col_1,col_2,col_3,col_4*cglAlpha)
      );
    ,
      colorExprRGBA
    );
  );
  // feature TODO warining for re-definition
  if(!isundefined(colorExprRGB),
    pixelExpr = if(hasAlpha,
      cglLazy((texturePos,spacePos),
        regional(col);
        col=cglEval(colorExprRGB,texturePos,spacePos);
        (col_1,col_2,col_3,cglAlpha)
      );
    ,
      colorExprRGB
    );
  );
  if(!isundefined(colorExpr),
    pixelExpr = if(hasAlpha,
      cglLazy((texturePos,spacePos),
        regional(col);
        col=cglEval(colorExpr,texturePos,spacePos);
        (col_1,col_2,col_3,cglAlpha)
      );
    ,
      colorExpr
    );
  );
  if(!isundefined(textureRGBA),
    usesAlpha = true;
    pixelExpr = if(hasAlpha,
      cglLazy((texturePos,spacePos,normal),
        regional(col);
        col=cglTexture(textureRGBA,texturePos,repeat->repeatTexture,interpolate->interpolateTexture);
        (col_1,col_2,col_3,col_4*cglAlpha)
      ,textureRGBA->textureRGBA,repeatTexture->repeatTexture,interpolateTexture->interpolateTexture);
    ,
      cglLazy((texturePos,spacePos,normal),
        cglTexture(textureRGBA,texturePos,repeat->repeatTexture,interpolate->interpolateTexture)
      ,textureRGBA->textureRGBA,repeatTexture->repeatTexture,interpolateTexture->interpolateTexture);
    );
  );
  if(!isundefined(textureRGB),
    pixelExpr = if(hasAlpha,
      cglLazy((texturePos,spacePos,normal),
        regional(col);
        col=cglTextureRGB(textureRGB,texturePos,repeat->repeatTexture,interpolate->interpolateTexture);
        (col_1,col_2,col_3,cglAlpha)
      ,textureRGB->textureRGB,repeatTexture->repeatTexture,interpolateTexture->interpolateTexture);
    ,
      cglLazy((texturePos,spacePos,normal),
        cglTextureRGB(textureRGB,texturePos,repeat->repeatTexture,interpolate->interpolateTexture)
      ,textureRGB->textureRGB,repeatTexture->repeatTexture,interpolateTexture->interpolateTexture);
    );
  );
  if(!isundefined(texture),
    pixelExpr = if(hasAlpha,
      cglLazy((texturePos,spacePos,normal),
        regional(col);
        col=cglTextureRGB(texture,texturePos,repeat->repeatTexture,interpolate->interpolateTexture);
        (col_1,col_2,col_3,cglAlpha)
      ,texture->texture,repeatTexture->repeatTexture,interpolateTexture->interpolateTexture);
    ,
      cglLazy((texturePos,spacePos,normal),
        cglTextureRGB(texture,texturePos,repeat->repeatTexture,interpolate->interpolateTexture)
      ,texture->texture,repeatTexture->repeatTexture,interpolateTexture->interpolateTexture);
    );
  );
  {"pixelExpr":pixelExpr, "usesAlpha": usesAlpha, "modifiers": modifiers}
);
// bring color into standard from
cglNormalColor(color):=( // code TODO better name
  if(length(color)==1,
    (color,color,color)
  ,if(if(length(color)==4, color_4 == 1, false), // cindyscript TODO? is there really no short-circuit and
    (color_1,color_2,color_3)
  ,
    color
  ));
);
cglNormalizeRange(range):=(
  range = range/(2*pi); // scale: 0...2*pi -> 0..1
  range = apply(range,val,mod(val,1)); // pick representant in 0..1
);

cglInterface("draw3d",cglDraw3d,(pos3d),(color,texture,textureRGB,textureRGBA,interpolateTexture,repeatTexture,
  colorExpr:(texturePos,spacePos,normal),colorExprRGB:(texturePos,spacePos,normal),
  colorExprRGBA:(texturePos,spacePos,normal),size,alpha,light:(color,direction,normal),projection,plotModifiers,tags,dynamic));
cglInterface("sphere3d",cglDraw3d,(pos3d),(color,texture,textureRGB,textureRGBA,interpolateTexture,repeatTexture,
  colorExpr:(texturePos,spacePos,normal),colorExprRGB:(texturePos,spacePos,normal),
  colorExprRGBA:(texturePos,spacePos,normal),size,alpha,light:(color,direction,normal),projection,plotModifiers,tags,dynamic));
cglDraw3d(pos3d):=(
  size = cglValOrDefault(size,cglDefaults_"sphereSize");
  cglParamExprs_"center" = cglParamExprs_"pos3d";
  cglParamExprs_"radius" = cglModifExprs_"size";
  cglSphere3d(pos3d,size);
);

cglInterface("sphere3d",cglSphere3d,(center,radius),(color,texture,textureRGB,textureRGBA,interpolateTexture,repeatTexture,
  colorExpr:(texturePos,spacePos,normal),colorExprRGB:(texturePos,spacePos,normal),
  colorExprRGBA:(texturePos,spacePos,normal),alpha,light:(color,direction,normal),projection:normal,plotModifiers,tags,dynamic));
cglSphere3d(center,radius):=(
  regional(needBackFace,modifiers,ids,topLayer,hasAlpha,usesAlpha,exprData,pixelExpr,opacityExpr);
  color = cglValOrDefault(color,cglDefaults_"sphereColor");
  light = cglValOrDefault(light,cglDefaults_"light");
  projection = cglValOrDefault(projection,cglDefaults_"sphereProjection");
  alpha = cglValOrDefault(alpha,cglDefaults_"sphereAlpha");
  hasAlpha = ! isundefined(alpha);
  alpha = cglValOrDefault(alpha,1);
  modifiers = {"cglLight": light,"cglProjection":projection};
  modifiers = cglMergeDicts(modifiers,cglValOrDefault(plotModifiers,{}));
  exprData = cglResolveColorExpr(hasAlpha);
  pixelExpr = exprData_"pixelExpr";
  usesAlpha = exprData_"usesAlpha";
  modifiers = cglMergeDicts(modifiers,exprData_"modifiers");
  if(hasAlpha, modifiers_"cglAlpha" = alpha);
  if(isundefined(pixelExpr),
    color = cglNormalColor(color);
    usesAlpha = length(color)==4;
    if(hasAlpha,
      if(length(color)==4,
        modifiers_"cglPixelExpr" = cglLazy((texPos,pos3d,normal),(cglColor_1,cglColor_2,cglColor_3,cglColor_4*cglAlpha));
      ,
        modifiers_"cglPixelExpr" = cglLazy((texPos,pos3d,normal),(cglColor_1,cglColor_2,cglColor_3,cglAlpha));
      );
    ,
      modifiers_"cglPixelExpr" = cglLazy((texPos,pos3d,normal),cglColor);
    );
    modifiers_"cglColor" = color;
  ,
    modifiers_"cglPixelExpr" = pixelExpr;
  );
  opacityExpr = if(usesAlpha,false,if(hasAlpha,cglLazy(cglAlpha>=1),true));
  needBackFace = hasAlpha % usesAlpha;
  tags = cglValOrDefault(tags,[]);
  if(needBackFace,
    ids = [colorplot3d(cgl3dSphereShaderCode(#,true),center,radius,
      plotModifiers->modifiers,tags->["sphere","backside"]++tags,opaqueIf->opacityExpr)];
  );
  topLayer = colorplot3d(cgl3dSphereShaderCode(#,false),center,radius,
    plotModifiers->modifiers,tags->["sphere"]++tags,opaqueIf->opacityExpr);
  ids=if(needBackFace,append(ids,topLayer),topLayer);
  dynamic = cglValOrDefault(dynamic,false);
  if(dynamic,
    // TODO also update plot-modifiers (!in all uses of dynamic)
    // TODO does not work when radius uses default value
    // TODO add `dynamic` modifier to documentation
    cglEvalOnRender(cglLazy(
      regional(radius);
      cglDebugPrint(cglParamExprs_"center");
      radius = cglValOrDefault(cglEval(cglParamExprs_"radius"),cglDefaults_"sphereSize");
      cglUpdateBounds(ids,cglEval(cglParamExprs_"center"),radius);
      ,ids->ids,cglParamExprs->cglParamExprs
    ));
  );
  ids;
);


cglInterface("draw3d",cglDraw3d,(point1,point2),(color,color1,color2,colors,texture,
  textureRGB,textureRGBA,interpolateTexture,repeatTexture,colorExpr:(texturePos,spacePos,normal),
  colorExprRGB:(texturePos,spacePos,normal),colorExprRGBA:(texturePos,spacePos,normal),size,alpha,
  light:(color,direction,normal),caps,cap1,cap2,projection:(normal,height,orientation),plotModifiers,tags,dynamic));
cglDraw3d(point1,point2):=(
  size = cglValOrDefault(size,cglDefaults_"cylinderSize");
  caps = cglValOrDefault(caps,cglDefaults_"curveCaps");
  cglParamExprs_"radius" = cglModifExprs_"size";
  cglCylinder3d(point1,point2,size);
);
cglInterface("cylinder3d",cglCylinder3d,(point1,point2),(color,color1,color2,colors,texture,
  textureRGB,textureRGBA,interpolateTexture,repeatTexture,colorExpr:(texturePos,spacePos,normal),
  colorExprRGB:(texturePos,spacePos,normal),colorExprRGBA:(texturePos,spacePos,normal),size,alpha,
  light:(color,direction,normal),caps,cap1,cap2,projection:(normal,height,orientation),plotModifiers,tags,dynamic));
cglCylinder3d(point1,point2):=(
  size = cglValOrDefault(size,cglDefaults_"cylinderSize");
  cglParamExprs_"radius" = cglModifExprs_"size";
  cglCylinder3d(point1,point2,size);
);
cglInterface("cylinder3d",cglCylinder3d,(point1,point2,radius),(color,color1,color2,colors,texture,
  textureRGB,textureRGBA,interpolateTexture,repeatTexture,colorExpr:(texturePos,spacePos,normal),
  colorExprRGB:(texturePos,spacePos,normal),colorExprRGBA:(texturePos,spacePos,normal),alpha,
  light:(color,direction,normal),cap1,cap2,caps,projection:(normal,height,orientation),direction1,plotModifiers,tags,dynamic,renderBack));
cglCylinder3d(point1,point2,radius):=(
  regional(overhang,needBackFace,modifiers,n,ids,topLayer,hasAlpha,usesAlpha,pixelExpr,exprData,opacityExpr);
  color = cglValOrDefault(color,cglDefaults_"cylinderColor");
  if(!isundefined(colors),
    if(length(colors)!=2,
      cglLogWarning("wrong length for colors expected 2 got: "+text(length(colors)));
      if(length(colors)<2,
        colors = colors ++ (color,color);
      );
    );
    color1 = cglValOrDefault(color1,colors_1);
    color2 = cglValOrDefault(color2,colors_2);
  ,
    color1 = cglValOrDefault(color1,color);
    color2 = cglValOrDefault(color2,color);
  );
  light = cglValOrDefault(light,cglDefaults_"light");
  caps = cglValOrDefault(caps,cglDefaults_"cylinderCaps");
  cap1 = cglValOrDefault(cap1,caps);
  cap2 = cglValOrDefault(cap2,caps);
  renderBack = cglValOrDefault(renderBack,false); // if true back-face should always be rendered
  projection = cglValOrDefault(projection,
    cglLazy((normal,height,orientation),cglProjCylinderToSquare(normal,height,orientation)));
  overhang = if(cap1_"name" == "Round" % cap2_"name" == "Round",radius,0);
  alpha = cglValOrDefault(alpha,cglDefaults_"cylinderAlpha");
  hasAlpha = !isundefined(alpha);
  alpha = cglValOrDefault(alpha,1);
  modifiers = {"cglLight": light,
    "cglCap1back":cap1_"shaderBack",
    "cglCap2back":cap2_"shaderBack",
    "cglCut1":cglCutOrthogonal,"cglCut2":cglCutOrthogonal,
    "cglGetCutVector1":cglCutVectorNone,"cglGetCutVector2":cglCutVectorNone,
    "cglCapCut1":cap1_"capCut1","cglCapCut2":cap2_"capCut2",
    "cglProjection": projection};
  modifiers = cglMergeDicts(modifiers,cglValOrDefault(plotModifiers,{}));
  exprData = cglResolveColorExpr(hasAlpha);
  pixelExpr = exprData_"pixelExpr";
  usesAlpha = exprData_"usesAlpha";
  modifiers = cglMergeDicts(modifiers,exprData_"modifiers");
  if(hasAlpha, modifiers_"cglAlpha" = alpha);
  // code TODO? is there some way to compress this code
  if(isundefined(pixelExpr),
    color1 = cglNormalColor(color1);
    color2 = cglNormalColor(color2);
    usesAlpha = length(color1)==4 % length(color2)==4;
    if(color1!=color2,
      if(length(color1)<length(color2),
        color1 = (color1_1,color1_2,color1_3,1);
      ,if(length(color2)<length(color1),
        color2 = (color2_1,color2_2,color2_3,1);
      ));
      if(hasAlpha,
        if(length(color1)==4,
          modifiers_"cglPixelExpr" = cglLazy((texPos,pos3d,normal),
            regional(col);col = (1-texPos_2)*cglColor1 + texPos_2*cglColor2;
            (col_1,col_2,col_3,col_4*cglAlpha)
          );
        ,
          modifiers_"cglPixelExpr" = cglLazy((texPos,pos3d,normal),
            regional(col);col = (1-texPos_2)*cglColor1 + texPos_2*cglColor2;
            (col_1,col_2,col_3,cglAlpha)
          );
        );
      ,
        modifiers_"cglPixelExpr" = cglLazy((texPos,pos3d,normal),(1-texPos_2)*cglColor1 + texPos_2*cglColor2);
      );
      modifiers_"cglColor1"=color1;
      modifiers_"cglColor2"=color2;
    ,
      if(hasAlpha,
        if(length(color1)==4,
          modifiers_"cglPixelExpr" = cglLazy((texPos,pos3d,normal),(cglColor_1,cglColor_2,cglColor_3,cglColor_4*cglAlpha));
        ,
          modifiers_"cglPixelExpr" = cglLazy((texPos,pos3d,normal),(cglColor_1,cglColor_2,cglColor_3,cglAlpha));
        );
      ,
        modifiers_"cglPixelExpr" = cglLazy((texPos,pos3d,normal),cglColor);
      );
      modifiers_"cglColor" = color1;
    );
  ,
    modifiers_"cglPixelExpr" = pixelExpr;
  );
  needBackFace = hasAlpha % usesAlpha % renderBack;
  modifiers_"cglCap1front"=cap1_(if(needBackFace,"shaderFront","shaderNoBack"));
  modifiers_"cglCap2front"=cap2_(if(needBackFace,"shaderFront","shaderNoBack"));
  modifiers_"cglCylinderProjGetDirection1" = cglCylinderProjGetDirection1Default;
  if(!isundefined(cap1_"cutDirection"),
    modifiers_"cglCut1" = if(cap1_"cutOrthogonal",cglCutBoth1,cglCutVector1);
    modifiers_"cglGetCutVector1" = cglGetCutVector1;
    n = cap1_"cutDirection";
    modifiers_"cglCutDir1" = n/(0.5*(point2-point1)*n);
    modifiers_"cglDirection1" =
      normalize(n - (normalize(point2-point1)*n)*normalize(point2-point1));
    modifiers_"cglCylinderProjGetDirection1" = cglLazy((normal,height,orientation),
      cglDirection1);
    overhang = max(overhang,radius*tan(arccos(|normalize(n)*normalize(point2-point1)|)));
  );
  if(!isundefined(cap2_"cutDirection"),
    modifiers_"cglCut2" = if(cap2_"cutOrthogonal",cglCutBoth2,cglCutVector2);
    modifiers_"cglGetCutVector2" = cglGetCutVector2;
    n = cap2_"cutDirection";
    modifiers_"cglCutDir2" = n/(0.5*(point2-point1)*n);
    modifiers_"cglDirection1" =
      normalize(n - (normalize(point2-point1)*n)*normalize(point2-point1));
    modifiers_"cglCylinderProjGetDirection1" = cglLazy((normal,height,orientation),
      cglDirection1);
    overhang = max(overhang,radius*tan(arccos(|normalize(n)*normalize(point2-point1)|)));
  );
  if(!isundefined(direction1),
    modifiers_"cglDirection1" = normalize(direction1);
    modifiers_"cglCylinderProjGetDirection1" = cglLazy((normal,height,orientation),
      cglDirection1);
  );
  tags = cglValOrDefault(tags,[]);
  opacityExpr = if(usesAlpha,false,if(hasAlpha,cglLazy(cglAlpha>=1),true));
  if(needBackFace,
    ids = [colorplot3d(cgl3dCylinderShaderCodeBack(#),point1,point2,radius,overhang->overhang,
      plotModifiers->modifiers,tags->["cylinder","backside"]++tags,opaqueIf->opacityExpr)];
  );
  topLayer = colorplot3d(cgl3dCylinderShaderCode(#),point1,point2,radius,overhang->overhang,
    plotModifiers->modifiers,tags->["cylinder"]++tags,opaqueIf->opacityExpr);
  ids=if(needBackFace,append(ids,topLayer),topLayer);
  dynamic = cglValOrDefault(dynamic,false);
  if(dynamic,
    cglEvalOnRender(cglLazy(
      regional(radius);
      radius = cglValOrDefault(cglEval(cglParamExprs_"radius"),cglDefaults_"cylinderSize");
      cglUpdateBounds(ids,cglEval(cglParamExprs_"point1"),cglEval(cglParamExprs_"point2"),radius);
      ,ids->ids,cglParamExprs->cglParamExprs
    ));
  );
  ids;
);
cglInterface("line3d",cglLine3d,(point1,point2),(color,color1,color2,colors,texture,
  textureRGB,textureRGBA,interpolateTexture,repeatTexture,colorExpr:(texturePos,spacePos,normal),
  colorExprRGB:(texturePos,spacePos,normal),colorExprRGBA:(texturePos,spacePos,normal),alpha,size,
  light:(color,direction,normal),cap1,cap2,caps,projection:(normal,height,orientation),direction1,
  plotModifiers,tags,dynamic,renderBack,cutoffRegion));
cglLine3d(point1,point2):=(
  size = cglValOrDefault(size,cglDefaults_"cylinderSize");
  cglParamExprs_"radius" = cglModifExprs_"size";
  cglLine3d(point1,point2,size);
);
cglInterface("line3d",cglLine3d,(point1,point2,radius),(color,color1,color2,colors,texture,
  textureRGB,textureRGBA,interpolateTexture,repeatTexture,colorExpr:(texturePos,spacePos,normal),
  colorExprRGB:(texturePos,spacePos,normal),colorExprRGBA:(texturePos,spacePos,normal),alpha,
  light:(color,direction,normal),cap1,cap2,caps,projection:(normal,height,orientation),direction1,
  plotModifiers,tags,dynamic,renderBack,cutoffRegion));
cglLine3d(point1,point2,radius):=(
  caps = cglValOrDefault(caps,cglDefaults_"curveCaps");
  cutoffRegion = cglValOrDefault(cutoffRegion,cglDefaults_"lineCutoff");
  cutoffExpr = cutoffRegion_"expr";
  V = point2-point1;
  bounds = cglEval(cutoffExpr,point1,V);
  ids = cglCylinder3d(point1+bounds_1*V,point1+bounds_2*V,radius);
  if(dynamic,
    cglEvalOnRender(cglLazy(
      regional(radius,point1,point2,V,bounds);
      radius = cglValOrDefault(cglEval(cglParamExprs_"radius"),cglDefaults_"cylinderSize");
      point1 = cglEval(cglParamExprs_"point1");
      point2 = cglEval(cglParamExprs_"point2");
      V = normalize(point2-point1);
      bounds = cglEvalOrDiscard(cglEval(cutoffExpr,point1,V));
      cglSetVisible(ids,!isundefined(bounds));
      if(!isundefined(bounds),
        cglUpdateBounds(ids,point1+bounds_1*V,point1+bounds_2*V,radius);
      );
      ,ids->ids,cglParamExprs->cglParamExprs,cutoffExpr->cutoffExpr
    ));
  ,
    // TODO? evalOnResize (evaluate when displayed screen region changes)
    cglEvalOnRender(cglLazy(
      regional(V,bounds);
      V = normalize(point2-point1);
      bounds = cglEvalOrDiscard(cglEval(cutoffExpr,point1,V));
      cglSetVisible(ids,!isundefined(bounds));
      if(!isundefined(bounds),
        cglUpdateBounds(ids,point1+bounds_1*V,point1+bounds_2*V,radius);
      );
      ,ids->ids,radius->radius,point1->point1,point2->point2,cutoffExpr->cutoffExpr
    ));
  );
  ids;
);

cglJoint(prev,current,next,jointType):=(
  if(jointType==CglConnectRound,
    CglCylinderCapCutVoidRound((normalize(next-current)+normalize(current-prev))/2);
  ,if(jointType==CglConnectFlat,
    CglCylinderCapCutVoid((normalize(next-current)+normalize(current-prev))/2);
  ,if(jointType==CglConnectOpen,
    CglCylinderCapOpen
  )));
);
// ! calling cylinder3d can mess up modifiers
// code TODO? create wrapper to correctly pass through modifiers
cglInterface("connect3d",cglConnect3d,(points),(color,colors,texture,textureRGB,textureRGBA,interpolateTexture,repeatTexture,
  colorExpr:(texturePos,spacePos,normal),colorExprRGB:(texturePos,spacePos,normal),
  colorExprRGBA:(texturePos,spacePos,normal),size,alpha,light:(color,direction,normal),caps,cap1,cap2,joints,closed,plotModifiers,tags,dynamic));
cglConnect3d(points):=(
  regional(jointEnd,jointStart,totalLength,alpha0,a,b,current1,current2,prev,next,projection,color1,color2,nextColor,direction1,cutDir,renderBack);
  closed = cglValOrDefault(closed,false);
  color = cglValOrDefault(color,cglDefaults_"cylinderColor");
  size = cglValOrDefault(size,cglDefaults_"cylinderSize");
  light = cglValOrDefault(light,cglDefaults_"light");
  plotModifiers = cglValOrDefault(plotModifiers,{});
  caps = cglValOrDefault(caps,cglDefaults_"curveCaps");
  cap1 = cglValOrDefault(cap1,caps);
  cap2 = cglValOrDefault(cap2,caps);
  if(cap1 == CglCylinderCapOpen % cap1 == CglCylinderCapCutOpen %
    cap2 == CglCylinderCapOpen % cap2 == CglCylinderCapCutOpen,
    renderBack = true; // caps are open -> need back face
  );
  joints = cglValOrDefault(joints,cglDefaults_"curveJoints");
  jointEnd = joints;
  jointStart = joints;
  alpha0 = alpha;
  dynamic = cglValOrDefault(dynamic,false);
  if(dynamic,
    cglLogWarning("`dynamic` is not supported on connect3d");
  );
  // remove all points before last point that are equal to last point
  if(!isundefined(colors),
    // feature TODO? sync up colors with used vertices
    // a:col1 b:col2 b:col3 b:col4 c:col5 -> a:col1 b:col2 ; b:col4 c:col5
    colors = remove(apply(1..length(points),i,if(if(i>1,points_(i-1)==points_i,false),-1,colors_i)),-1);
  );
  prev = -1;
  points = remove(apply(points,p,if(p == prev,-1,prev=p;p)),-1);
  if(length(points)>=3,
    // update projection if color is computed per pixel
    if(!isundefined(colorExpr) % !isundefined(texture),
      projection = cglLazy((normal,height,orientation),
        regional(pos0);
        pos0=cglProjCylinderToSquare(normal,height,orientation);
        (pos0_1,cglSegmentEnd*pos0_2+cglSegmentStart*(1-pos0_2))
      );
    );
    totalLength = sum(consecutive(points),pts,|pts_1-pts_2|);
    if(closed,totalLength = totalLength + |points_1-points_(length(points))|);
    a = 0;
    b = 0;
    if(closed,
      current1 = points_(length(points)-1);
      current2 = points_(length(points));
      next = points_1;
      direction1 = normalize(next-current2)+normalize(current2-current1);
      direction1 = normalize(direction1 - (normalize(current2-current1)*direction1)*normalize(current2-current1));
      color1 = if(isundefined(colors),color,colors_(length(points)-1));
      color2 = if(isundefined(colors),color,colors_(length(points)));
      nextColor = if(isundefined(colors),color,colors_1);
      ids = [];
    ,
      current1 = points_1;
      current2 = points_2;
      next = points_3;
      direction1 = normalize(next-current2)+normalize(current2-current1);
      direction1 = normalize(direction1 - (normalize(current2-current1)*direction1)*normalize(current2-current1));
      color1 = if(isundefined(colors),color,colors_1);
      color2 = if(isundefined(colors),color,colors_2);
      nextColor = if(isundefined(colors),color,colors_3);
      a = b;b = a + |current1-current2|/totalLength;
      plotModifiers_"cglSegmentStart"=a;
      plotModifiers_"cglSegmentEnd"=b;
      alpha = alpha0;
      ids = [cglCylinder3d(current1,current2,size,cap1->cap1,colors->(color1,color2),
        cap2->cglJoint(current1,current2,next,jointEnd))];
    );
    ids = ids ++ apply(if(closed,2,4)..length(points),i,
      prev = current1;
      current1 = current2;
      current2 = next;
      next = points_i;
      cutDir = normalize((normalize(current2-current1)+normalize(current1-prev)));
      direction1 = direction1-2*(direction1*cutDir)*cutDir; // mirror direction at cut-plane
      color1 = color2;
      color2 = nextColor;
      nextColor = if(isundefined(colors),color,colors_i);
      a = b;b = a + |current1-current2|/totalLength;
      plotModifiers_"cglSegmentStart"=a;
      plotModifiers_"cglSegmentEnd"=b;
      alpha = alpha0;
      cglCylinder3d(current1,current2,size,colors->(color1,color2),
        cap1->cglJoint(prev,current1,current2,jointStart),cap2->cglJoint(current1,current2,next,jointEnd));
    );
    color1 = color2;
    color2 = nextColor;
    a = b;b = a + |current2-next|/totalLength;
    plotModifiers_"cglSegmentStart"=a;
    plotModifiers_"cglSegmentEnd"=b;
    cutDir = normalize((normalize(next-current2)+normalize(current2-current1)));
    direction1 = direction1-2*(direction1*cutDir)*cutDir; // mirror direction at cut-plane
    alpha = alpha0;
    flatten(append(ids,cglCylinder3d(current2,next,size,colors->(color2,nextColor),
        cap1->cglJoint(current1,current2,next,jointStart),
        cap2->if(closed,cglJoint(current2,next,points_1,jointEnd),cap2))));
  ,if(length(points)==2,
    color1 = if(isundefined(colors),color,colors_1);
    color2 = if(isundefined(colors),color,colors_2);
    cglCylinder3d(points_1,points_2,size);
  ,if(length(points)==1,
    if(!isundefined(colors),
      color = colors_1
    );
    cglSphere3d(points_1,size);
  )));
);
cglInterface("curve3d",cglCurve3d,(expr:(t),from,to),(color,colors,texture,textureRGB,textureRGBA,interpolateTexture,repeatTexture,
  colorExpr:(texturePos,spacePos,normal),colorExprRGB:(texturePos,spacePos,normal),
  colorExprRGBA:(texturePos,spacePos,normal),size,samples,alpha,light:(color,direction,normal),caps,cap1,cap2,joints,closed,plotModifiers,tags,dynamic));
cglCurve3d(expr,from,to):=(
  samples = cglValOrDefault(samples,cglDefaults_"curveSamples")-1;
  if(from==to,
    cglSphere3d(cglEval(expr,from),size);
  ,
    cglConnect3d(apply(0..samples,k,
      t = k/samples;
      cglEval(expr,t*to+(1-t)*from);
    ));
  );
);

cglInterface("torus3d",cglTorus3d,(center,orientation,radius1,radius2),(color,texture,
  textureRGB,textureRGBA,interpolateTexture,repeatTexture,colorExpr:(texturePos,spacePos,normal),
  colorExprRGB:(texturePos,spacePos,normal),colorExprRGBA:(texturePos,spacePos,normal),alpha,
  light:(color,direction,normal),arcRange,angle1range,angle2range,direction1,plotModifiers,tags,dynamic));
cglTorus3d(center,orientation,radius1,radius2):=(
  regional(needBackFace,modifiers,ids,topLayer,hasAlpha,usesAlpha,exprData,pixelExpr,opacityExpr);
  orientation=normalize(orientation);
  color = cglValOrDefault(color,cglDefaults_"torusColor");
  light = cglValOrDefault(light,cglDefaults_"light");
  alpha = cglValOrDefault(alpha,cglDefaults_"torusAlpha");
  hasAlpha = !isundefined(alpha);
  alpha = cglValOrDefault(alpha,1);
  modifiers = {
    "cglLight": light,
    "cglRadii": [radius1,radius2]
  };
  modifiers = cglMergeDicts(modifiers,cglValOrDefault(plotModifiers,{}));
  exprData = cglResolveColorExpr(hasAlpha);
  pixelExpr = exprData_"pixelExpr";
  usesAlpha = exprData_"usesAlpha";
  modifiers = cglMergeDicts(modifiers,exprData_"modifiers");
  if(hasAlpha, modifiers_"cglAlpha" = alpha);
  if(isundefined(pixelExpr),
    color = cglNormalColor(color);
    usesAlpha = length(color)==4;
    if(hasAlpha,
      if(length(color)==4,
        modifiers_"cglPixelExpr" = cglLazy((texPos,pos3d,normal),(cglColor_1,cglColor_2,cglColor_3,cglColor_4*cglAlpha));
      ,
        modifiers_"cglPixelExpr" = cglLazy((texPos,pos3d,normal),(cglColor_1,cglColor_2,cglColor_3,cglAlpha));
      );
    ,
      modifiers_"cglPixelExpr" = cglLazy((texPos,pos3d,normal),cglColor);
    );
    modifiers_"cglColor" = color;
  ,
    modifiers_"cglPixelExpr" = pixelExpr;
  );
  needBackFace = hasAlpha % usesAlpha;
  // use arcRange if angle1range is not given
  angle1range = cglValOrDefault(angle1range,arcRange);
  if(!isundefined(angle1range),
    needBackFace = true;
    angle1range = cglNormalizeRange(angle1range);
    modifiers_"cglAngle1Range" = angle1range;
    if(angle1range_1<angle1range_2,
      modifiers_"cglCheckAngle1" = cglLazy(texturePos,
        if(texturePos_1<cglAngle1Range_1 % texturePos_1>cglAngle1Range_2,cglDiscard());
      );
    ,if(angle1range_1>angle1range_2,
      modifiers_"cglCheckAngle1" = cglLazy(texturePos,
        if(texturePos_1<cglAngle1Range_1 & texturePos_1>cglAngle1Range_2,cglDiscard());
      );
    ,
      modifiers_"cglCheckAngle1" = cglLazy(texturePos,);
    ));
  ,
    modifiers_"cglCheckAngle1" = cglLazy(texturePos,);
  );
  if(!isundefined(angle2range),
    needBackFace = true;
    angle2range = cglNormalizeRange(angle2range);
    modifiers_"cglAngle2Range" = angle2range;
    if(angle2range_1<angle2range_2,
      modifiers_"cglCheckAngle2" = cglLazy(texturePos,
        if(texturePos_2<cglAngle2Range_1 % texturePos_2>cglAngle2Range_2,cglDiscard());
      );
    ,if(angle2range_1>angle2range_2,
      modifiers_"cglCheckAngle2" = cglLazy(texturePos,
        if(texturePos_2<cglAngle2Range_1 & texturePos_2>cglAngle2Range_2,cglDiscard());
      );
    ,
      modifiers_"cglCheckAngle2" = cglLazy(texturePos,);
    ));
  ,
    modifiers_"cglCheckAngle2" = cglLazy(texturePos,);
  );

  modifiers_"cglTorusProjGetDirection1" = cglTorusProjGetDirection1Default;
  if(!isundefined(direction1),
    modifiers_"cglDirection1" = normalize(direction1);
    modifiers_"cglTorusProjGetDirection1" = cglLazy((normal,height,orientation),cglDirection1);
  );
  tags = cglValOrDefault(tags,[]);
  opacityExpr = if(usesAlpha,false,if(hasAlpha,cglLazy(cglAlpha>=1),true));
  if(needBackFace,
    ids = [colorplot3d(cgl3dTorusShaderCode(#,4),
      center-radius2*orientation, center+radius2*orientation, radius1+radius2,
      plotModifiers->modifiers,tags->["torus","backside"]++tags,opaqueIf->opacityExpr),
    colorplot3d(cgl3dTorusShaderCode(#,3),
      center-radius2*orientation, center+radius2*orientation, radius1+radius2,
      plotModifiers->modifiers,tags->["torus","backside"]++tags,opaqueIf->opacityExpr),
    colorplot3d(cgl3dTorusShaderCode(#,2),
      center-radius2*orientation, center+radius2*orientation, radius1+radius2,
      plotModifiers->modifiers,tags->["torus","backside"]++tags,opaqueIf->opacityExpr)];
  );
  topLayer = colorplot3d(cgl3dTorusShaderCode(#,1),
    center-radius2*orientation, center+radius2*orientation, radius1+radius2,
    plotModifiers->modifiers,tags->["torus"]++tags,opaqueIf->opacityExpr);
  ids=if(needBackFace,append(ids,topLayer),topLayer);
  dynamic = cglValOrDefault(dynamic,false);
  if(dynamic,
    cglEvalOnRender(cglLazy(
      regional(center,radius1,radius2,orientation,radii);
      center = cglEval(cglParamExprs_"center");
      radius1 = cglEval(cglParamExprs_"radius1");
      radius2 = cglValOrDefault(cglEval(cglParamExprs_"radius2"),cglDefaults_"torusSize");
      orientation = cglEval(cglParamExprs_"orientation");
      cglUpdateBounds(ids,center-radius2*orientation, center+radius2*orientation, radius1+radius2);
      cglUpdate(ids,UcglRadii -> [radius1,radius2]);
      ,ids->ids,cglParamExprs->cglParamExprs
    ));
  );
  ids;
);
// feature TODO? option to use aspect ratio instead of second radius
cglInterface("circle3d",cglCircle3d,(center,orientation,radius),(color,texture,
  textureRGB,textureRGBA,interpolateTexture,repeatTexture,colorExpr:(texturePos,spacePos,normal),
  colorExprRGB:(texturePos,spacePos,normal),colorExprRGBA:(texturePos,spacePos,normal),texturePos,size,alpha,
  light:(color,direction,normal),arcRange,angle1range,angle2range,direction1,plotModifiers,tags,dynamic));
cglInterface("torus3d",cglCircle3d,(center,orientation,radius),(color,texture,
  textureRGB,textureRGBA,interpolateTexture,repeatTexture,colorExpr:(texturePos,spacePos,normal),
  colorExprRGB:(texturePos,spacePos,normal),colorExprRGBA:(texturePos,spacePos,normal),texturePos,size,alpha,
  light:(color,direction,normal),arcRange,angle1range,angle2range,direction1,plotModifiers,tags,dynamic));
cglCircle3d(center,orientation,radius):=(
  size = cglValOrDefault(size,cglDefaults_"torusSize");
  cglParamExprs_"radius1" = cglParamExprs_"radius";
  cglParamExprs_"radius2" = cglModifExprs_"size";
  cglTorus3d(center,orientation,radius,size);
);

cglCheckSize(vData,vCount,msg,defVal) := (
  if(length(vData)==vCount,
    vData
  ,
    cglLogError(msg+" expected: "+text(vCount)+" got: "+text(length(vData)));
    apply(1..vCount,defVal);
  )
);
cglCheckSize(vData,vCount,msg) := (
  if(length(vData)==vCount,
    vData
  ,
    cglLogError(msg+" expected: "+text(vCount)+" got: "+text(length(vData)));
  )
);

// code TODO? consistent order of spacePos and texture pos
// TODO support `dynamic` for triangles & surfaces
// feature TODO? normalTexture modifier (texture of normal vectors)
cglInterface("draw3d",cglTriangle3d,(p1,p2,p3),(color,colors,texture,textureRGB,textureRGBA,interpolateTexture,repeatTexture,
  colorExpr:(texturePos,spacePos,normal),colorExprRGB:(texturePos,spacePos,normal),
  colorExprRGBA:(texturePos,spacePos,normal),thickness,alpha,light:(color,direction,normal),uv,normal,normals,normalExpr:(spacePos,texturePos),plotModifiers,vertexModifiers,tags));
cglInterface("triangle3d",cglTriangle3d,(p1,p2,p3),(color,colors,texture,textureRGB,textureRGBA,interpolateTexture,repeatTexture,
  colorExpr:(texturePos,spacePos,normal),colorExprRGB:(texturePos,spacePos,normal),
  colorExprRGBA:(texturePos,spacePos,normal),thickness,alpha,light:(color,direction,normal),uv,normal,normals,normalExpr:(spacePos,texturePos),plotModifiers,vertexModifiers,tags));
cglTriangle3d(p1,p2,p3):=(
  regional(modifiers,vModifiers,defNormal,hasAlpha,usesAlpha,exprData,pixelExpr,colLen,opacityExpr);
  color = cglValOrDefault(color,cglDefaults_"triangleColor");
  light = cglValOrDefault(light,cglDefaults_"light");
  uv = cglValOrDefault(uv,[(0,0),(1,0),(0,1)]);
  alpha = cglValOrDefault(alpha,cglDefaults_"triangleAlpha");
  hasAlpha = !isundefined(alpha);
  alpha = cglValOrDefault(alpha,1);
  modifiers = {
    "cglLight": light
  };
  modifiers = cglMergeDicts(modifiers,cglValOrDefault(plotModifiers,{}));
  vModifiers = cglValOrDefault(vertexModifiers,{});
  defNormal = cglValOrDefault(normal,normalize(cross(p2-p1,p3-p1)));
  if(!isundefined(normals),
    if(isundefined(normalExpr),
      normals = cglCheckSize(normals,3,"wrong length for normals",defNormal);
      vModifiers_"cglNormal" = normals;
      normalExpr = cglLazy((spacePos,texturePos),normalize(cglNormal));
    ,
      cglLogWarning(" modifier `normals` is ignored if `normalExpr` is given");
    );
  );
  if(!isundefined(normal),
    if(isundefined(normalExpr),
      modifiers_"cglNormal" = normal;
      normalExpr = cglLazy((spacePos,texturePos),cglNormal);
    ,
      cglLogWarning("modifier `normal` is ignored if `normals` or `normalExpr` is given");
    );
  );
  if(isundefined(normalExpr),
    modifiers_"cglNormal" = defNormal;
    normalExpr = cglLazy((spacePos,texturePos),cglNormal);
  );
  modifiers_"cglNormalExpr" = normalExpr;
  modifiers_"cglTextureMapping" = cglLazy((pos3d,direction),cglTexCoords);
  vModifiers_"cglTexCoords" = uv;
  exprData = cglResolveColorExpr(hasAlpha);
  pixelExpr = exprData_"pixelExpr";
  usesAlpha = exprData_"usesAlpha";
  modifiers = cglMergeDicts(modifiers,exprData_"modifiers");
  if(hasAlpha, modifiers_"cglAlpha" = alpha);
  if(isundefined(pixelExpr),
    if(isundefined(colors),
      color = cglNormalColor(color);
      colLen = length(color)
    ,
      colors = cglCheckSize(colors,3,"wrong length for colors",color);
      colors = apply(colors,col,cglNormalColor(col));
      colLen = max(apply(colors,col,length(col)));
      colors = apply(colors,col,
        if(colLen > length(col),(col_1,col_2,col_3,1),col);
      );
    );
    usesAlpha = colLen == 4;
    if(hasAlpha,
      if(colLen == 4,
        modifiers_"cglPixelExpr" = cglLazy((texPos,pos3d,normal),(cglColor_1,cglColor_2,cglColor_3,cglColor_4*cglAlpha));
      ,
        modifiers_"cglPixelExpr" = cglLazy((texPos,pos3d,normal),(cglColor_1,cglColor_2,cglColor_3,cglAlpha));
      );
    ,
      modifiers_"cglPixelExpr" = cglLazy((texPos,pos3d,normal),cglColor);
    );
    if(isundefined(colors),
      modifiers_"cglColor"=color;
    ,
      vModifiers_"cglColor"=colors;
    );
  ,
    modifiers_"cglPixelExpr" = pixelExpr;
  );
  tags = cglValOrDefault(tags,[]);
  opacityExpr = if(usesAlpha,false,if(hasAlpha,cglLazy(cglAlpha>=1),true));
  colorplot3d(cgl3dTriangleShaderCode(#),[p1,p2,p3],
    plotModifiers->modifiers,vModifiers->vModifiers,tags->["triangle"]++tags,opaqueIf->opacityExpr);
);

// TODO improve triangle rendering
// TODO? support rendering multiple polygons in single call (should be possible with minimal extension of the triangles function)
// TODO? auto-merge rendered triangles with similar parameters into single render-call

// render multiple triangles in a single call
cglInterface("triangles3d",cglTriangles3d,(triangles),(color,colors,texture,textureRGB,textureRGBA,interpolateTexture,repeatTexture,
  colorExpr:(texturePos,spacePos,normal),colorExprRGB:(texturePos,spacePos,normal),
  colorExprRGBA:(texturePos,spacePos,normal),thickness,alpha,light:(color,direction,normal),uv,normals,normalExpr:(spacePos,texturePos),plotModifiers,vertexModifiers,tags));
cglTriangles3d(triangles):=(
  regional(modifiers,vModifiers,defNormal,hasAlpha,usesAlpha,exprData,pixelExpr,colLen,opacityExpr,tri,n,cols);
  color = cglValOrDefault(color,cglDefaults_"triangleColor");
  light = cglValOrDefault(light,cglDefaults_"light");
  uv = if(isundefined(uv),
    flatten(apply(1..(length(triangles)),[(0,0),(1,0),(0,1)]))
  ,
    cglCheckSize(uv,length(triangles),"uv should contain one element for each triangle");
    flatten(apply(1..(length(triangles)),i,
      if(i<length(uv),
        triuv = uv_i;
        if(length(triuv)==3,
          triuv
        ,
          cglCheckSize(triuv,3,"wrong length for triangle uv",defNormal);
          if(length(triuv)>3,
            [triuv_1,triuv_2,triuv_3]
          ,
            [(0,0),(1,0),(0,1)]
          )
        );
      ,
        [(0,0),(1,0),(0,1)]
      );
    ))
  );
  alpha = cglValOrDefault(alpha,cglDefaults_"triangleAlpha");
  hasAlpha = !isundefined(alpha);
  alpha = cglValOrDefault(alpha,1);
  modifiers = {
    "cglLight": light
  };
  modifiers = cglMergeDicts(modifiers,cglValOrDefault(plotModifiers,{}));
  vModifiers = cglValOrDefault(vertexModifiers,{});
  if(isundefined(normalExpr),
    if(isundefined(normals),
      normals = [];
    ,
      cglCheckSize(normals,length(triangles),"normals should contain one element for each triangle");
    );
    normals = flatten(apply(1..(length(triangles)),i,
      tri = triangles_i;
      defNormal = normalize(cross(tri_2-tri_1,tri_3-tri_1));
      if(i<length(normals),
        n = normals_i;
        if(islist(n_1),
          cglCheckSize(n,3,"wrong length for triangle normals",defNormal);
        ,
          [n,n,n]
        )
      ,
        [defNormal,defNormal,defNormal]
      );
    ));
    vModifiers_"cglNormal" = normals;
    normalExpr = cglLazy((spacePos,texturePos),normalize(cglNormal));
  ,
    if(!isundefined(normals),
      cglLogWarning(" modifier `normals` is ignored if `normalExpr` is given");
    );
    modifiers_"cglNormal" = defNormal;
    normalExpr = cglLazy((spacePos,texturePos),cglNormal);
  );
  modifiers_"cglNormalExpr" = normalExpr;
  modifiers_"cglTextureMapping" = cglLazy((pos3d,direction),cglTexCoords);
  vModifiers_"cglTexCoords" = uv;
  exprData = cglResolveColorExpr(hasAlpha);
  pixelExpr = exprData_"pixelExpr";
  usesAlpha = exprData_"usesAlpha";
  modifiers = cglMergeDicts(modifiers,exprData_"modifiers");
  if(hasAlpha, modifiers_"cglAlpha" = alpha);
  if(isundefined(pixelExpr),
    if(isundefined(colors),
      color = cglNormalColor(color);
      colLen = length(color)
    ,
      cglCheckSize(colors,length(triangles),"colors should contain one element for each triangle");
      colors = flatten(apply(1..(length(triangles)),i,
        if(i<length(normals),
          cols = colors_i;
          if(islist(cols_1),
            cglCheckSize(cols,3,"wrong length for triangle colors",color);
          ,
            [cols,cols,cols]
          )
        ,
          [color,color,color]
        );
      ));
      colors = apply(colors,col,cglNormalColor(col));
      colLen = max(apply(colors,col,length(col)));
      colors = apply(colors,col,
        if(colLen > length(col),(col_1,col_2,col_3,1),col);
      );
    );
    usesAlpha = colLen == 4;
    if(hasAlpha,
      if(colLen == 4,
        modifiers_"cglPixelExpr" = cglLazy((texPos,pos3d,normal),(cglColor_1,cglColor_2,cglColor_3,cglColor_4*cglAlpha));
      ,
        modifiers_"cglPixelExpr" = cglLazy((texPos,pos3d,normal),(cglColor_1,cglColor_2,cglColor_3,cglAlpha));
      );
    ,
      modifiers_"cglPixelExpr" = cglLazy((texPos,pos3d,normal),cglColor);
    );
    if(isundefined(colors),
      modifiers_"cglColor"=color;
    ,
      vModifiers_"cglColor"=colors;
    );
  ,
    modifiers_"cglPixelExpr" = pixelExpr;
  );
  tags = cglValOrDefault(tags,[]);
  opacityExpr = if(usesAlpha,false,if(hasAlpha,cglLazy(cglAlpha>=1),true));
  colorplot3d(cgl3dTriangleShaderCode(#),flatten(triangles),
    plotModifiers->modifiers,vModifiers->vModifiers,tags->["triangles"]++tags,opaqueIf->opacityExpr);
);

cglInterface("polygon3d",cglPolygon3d,(vertices),(triangulationMode,color,colors,texture,
  textureRGB,textureRGBA,interpolateTexture,repeatTexture,colorExpr:(texturePos,spacePos,normal),
  colorExprRGB:(texturePos,spacePos,normal),colorExprRGBA:(texturePos,spacePos,normal),thickness,alpha,
  light:(color,direction,normal),uv,normal,normals,normalExpr:(spacePos,texturePos),normalType,plotModifiers,vertexModifiers,tags));
cglPolygon3d(vertices):=(
  regional(modifiers,vModifiers,triangulator,trianglesAndNormals,hasAlpha,usesAlpha,exprData,pixelExpr,colLen,opacityExpr);
  color = cglValOrDefault(color,cglDefaults_"triangleColor");
  light = cglValOrDefault(light,cglDefaults_"light");
  triangulationMode = cglValOrDefault(triangulationMode,CglTriangulateDefault);
  alpha = cglValOrDefault(alpha,cglDefaults_"triangleAlpha");
  hasAlpha = !isundefined(alpha);
  alpha = cglValOrDefault(alpha,1);
  modifiers = {
    "cglLight": light
  };
  modifiers = cglMergeDicts(modifiers,cglValOrDefault(plotModifiers,{}));
  vModifiers = cglValOrDefault(vertexModifiers,{});
  if(isundefined(normalType),
    if(!isundefined(normalExpr),
      normalType = CglNormalPerPixel;
    );
    if(!isundefined(normals),
      if(isundefined(normalType),
        normalType = CglNormalPerVertex;
      ,
        cglLogWarning("modifier `normals` is ignored if `normalExpr` is given");
      )
    );
    if(!isundefined(normal),
      if(isundefined(normalType),
        normalType = CglNormalPerFace;
      ,
        cglLogWarning("modifier `normal` is ignored if `normalExpr` or `normals` is given");
      )
    );
    if(isundefined(normalType),
      normalType = CglNormalPerTriangle;
    );
  );
  if(normalType == CglNormalPerPixel,
    if(isundefined(normalExpr),
      cglLogWarning("modifier `normalExpr` has to be set when using per-pixel normals");
      normals = cglUndefinedVal();
      normalExpr = cglLazy((spacePos,texturePos),normalize(cglNormal));
      normalType = CglNormalPerVertex;
    );
  ,if(normalType == CglNormalPerVertex,
    normalExpr = cglLazy((spacePos,texturePos),normalize(cglNormal));
    if(!isundefined(normals),
      normals = cglCheckSize(normals,length(vertices),"wrong length for normals");
    );
  ,if(normalType == CglNormalPerTriangle,
    normals = cglUndefinedVal();
    normalExpr = cglLazy((spacePos,texturePos),cglNormal);
  ,if(normalType == CglNormalFlat,
    normals = normal; // for flat normal-type normals is a single normal
    normalExpr = cglLazy((spacePos,texturePos),cglNormal);
  ,
    cglLogError("unknown normal-type: "+text(normalType));
  ))));
  modifiers_"cglNormalExpr" = normalExpr;
  if(isundefined(uv),
    regional(n,x,y,xmin,xmax,ymin,ymax,p);
    n = length(vertices);
    xmin=1;ymin=1;xmax=0;ymax=0;
    // 1. pick points at constant distance along unit circle
    // the starting position is chosen such that 4-gons can be scaled to fill the complete unit-square
    uv = apply(0..(n-1),i,
      x = sin(2*pi*(i/n-0.375));
      y = cos(2*pi*(i/n-0.375));
      xmin=min(xmin,x);
      xmax=max(xmax,x);
      ymin=min(ymin,y);
      ymax=max(ymax,y);
      (x,y);
    );
    // 2. scale point to unit square
    uv = apply(uv,p,
      ((p_1-xmin)/(xmax-xmin),(p_2-ymin)/(ymax-ymin))
    );
  );
  modifiers_"cglTextureMapping" = cglLazy((pos3d,direction),cglTexCoords);
  vModifiers_"cglTexCoords" = uv;
  exprData = cglResolveColorExpr(hasAlpha);
  pixelExpr = exprData_"pixelExpr";
  usesAlpha = exprData_"usesAlpha";
  modifiers = cglMergeDicts(modifiers,exprData_"modifiers");
  if(hasAlpha, modifiers_"cglAlpha" = alpha);
  if(isundefined(pixelExpr),
    colLen = if(isundefined(colors),
      color = cglNormalColor(color);
      length(color)
    ,
      colors = cglCheckSize(colors,length(vertices),"wrong length for colors",color);
      colors = apply(colors,col,cglNormalColor(col));
      colLen = max(apply(colors,col,length(col)));
      colors = apply(colors,col,
        if(colLen > length(col),(col_1,col_2,col_3,1),col);
      );
      colLen;
    );
    usesAlpha = colLen == 4;
    if(hasAlpha,
      if(colLen == 4,
        modifiers_"cglPixelExpr" = cglLazy((texPos,pos3d,normal),(cglColor_1,cglColor_2,cglColor_3,cglColor_4*cglAlpha));
      ,
        modifiers_"cglPixelExpr" = cglLazy((texPos,pos3d,normal),(cglColor_1,cglColor_2,cglColor_3,cglAlpha));
      );
    ,
      modifiers_"cglPixelExpr" = cglLazy((texPos,pos3d,normal),cglColor);
    );
    if(isundefined(colors),
      modifiers_"cglColor"=color;
    ,
      vModifiers_"cglColor"=colors;
    );
  ,
    modifiers_"cglPixelExpr" = pixelExpr;
  );
  if(triangulationMode==CglTriangulateSpiral,
    triangulator = cglLazy(elts,cglTriangulateSpiralRec(elts));
  ,if(triangulationMode==CglTriangulateCorner,
    triangulator = cglLazy(elts,cglTriangulateCorner(elts));
  ,
    triangulator = cglLazy(elts,cglTriangulateCenter(elts));
  ));
  trianglesAndNormals = cglTriangulatePolygon(triangulator,vertices,normals,vModifiers,normalType);
  vModifiers = trianglesAndNormals_3;
  if(normalType == CglNormalFlat,
    modifiers_"cglNormal" =trianglesAndNormals_2;
  ,if(normalType != CglNormalPerPixel,
    vModifiers_"cglNormal" =trianglesAndNormals_2;
  ));
  tags = cglValOrDefault(tags,[]);
  opacityExpr = if(usesAlpha,false,if(hasAlpha,cglLazy(cglAlpha>=1),true));
  colorplot3d(cgl3dTriangleShaderCode(#),trianglesAndNormals_1,
    plotModifiers->modifiers,vModifiers->vModifiers,tags->["polygon"]++tags,opaqueIf->opacityExpr);
);

// feature TODO? adjust uv coordinates if side of grid-cell is collapsed
cglInterface("mesh3d",cglMesh3d,(grid),(color,colors,texture,textureRGB,textureRGBA,interpolateTexture,repeatTexture,
  colorExpr:(texturePos,spacePos,normal),colorExprRGB:(texturePos,spacePos,normal),
  colorExprRGBA:(texturePos,spacePos,normal),thickness,alpha,light:(color,direction,normal),uv,normals,normalExpr:(spacePos,texturePos),normalType,topology,plotModifiers,vertexModifiers,tags));
cglMesh3d(grid):=(
  regional(Ny,Nx,triangles,modifiers,vModifiers,exprData,pixelExpr,hasAlpha,usesAlpha,colLen,opacityExpr);
  color = cglValOrDefault(color,cglDefaults_"triangleColor");
  light = cglValOrDefault(light,cglDefaults_"light");
  alpha = cglValOrDefault(alpha,cglDefaults_"triangleAlpha");
  hasAlpha = !isundefined(alpha);
  alpha = cglValOrDefault(alpha,1);
  topology = cglValOrDefault(topology,TopologyOpen);
  topology = (mod(topology,CglTopologyYFactor),floor(topology/CglTopologyYFactor));
  Ny = length(grid);
  Nx = length(grid_1);
  triangles = cglMeshSamplesToTriangles(grid,Nx,Ny,topology,cglSampleVertex);
  if(isundefined(normalType),
    if(!isundefined(normalExpr),
      normalType = CglNormalPerPixel;
    );
    if(!isundefined(normals),
      if(isundefined(normalType),
        normalType = CglNormalPerVertex;
      ,
        cglLogWarning("modifier `normals` is ignored if `normalExpr` is given");
      )
    );
    if(isundefined(normalType),
      normalType = NormalPerTriangle;
    );
  );
  if(normalType == CglNormalPerPixel & isundefined(normalExpr),
      cglLogWarning("modifier `normalExpr` has to be set when using per-pixel normals");
      normals = cglUndefinedVal();
      normalType = CglNormalPerVertex;
  );
  if(normalType != CglNormalPerPixel,
    if(normalType == CglNormalPerVertex,
      // interpolated vector may not be normalized
      normalExpr = cglLazy((spacePos,texturePos),normalize(cglNormal));
    ,
      normalExpr = cglLazy((spacePos,texturePos),cglNormal);
    );
    if(isundefined(normals),
      normals = cglMeshGuessNormals(grid,Nx,Ny,normalType,topology);
    ,if(normalType == CglNormalPerFace,
      normals = cglMeshSamplesToTriangles(normals,Nx,Ny,topology,cglSampleFace);
    ,if(normalType == CglNormalPerTriangle,
      normals = cglMeshSamplesToTriangles(normals,Nx,Ny,topology,cglSampleTriangle);
    ,if(normalType == CglNormalPerVertex,
      normals = cglMeshSamplesToTriangles(normals,Nx,Ny,topology,cglSampleVertex);
    ,
      cglLogError("unknown normal-type: "+text(normalType));
    ))));
  );
  modifiers = {
    "cglLight": light,
    "cglNormalExpr":normalExpr
  };
  modifiers = cglMergeDicts(modifiers,cglValOrDefault(plotModifiers,{}));
  vModifiers = cglValOrDefault(vertexModifiers,{});
  if(isundefined(uv),
    // map grid-positions to unit-square
    regional(nx,ny);
    ny = if(topology_2==CglTopologyOpen,Ny-1,Ny);
    nx = if(topology_1==CglTopologyOpen,Nx-1,Nx);
    uv=apply(0..ny,y,apply(0..nx,x,(x/nx,y/ny)));
  );
  modifiers_"cglTextureMapping" = cglLazy((pos3d,direction),cglTexCoords);
  vModifiers_"cglTexCoords" = uv;
  exprData = cglResolveColorExpr(hasAlpha);
  pixelExpr = exprData_"pixelExpr";
  usesAlpha = exprData_"usesAlpha";
  modifiers = cglMergeDicts(modifiers,exprData_"modifiers");
  if(hasAlpha, modifiers_"cglAlpha" = alpha);
  if(isundefined(pixelExpr),
    if(isundefined(colors),
      color = cglNormalColor(color);
      colLen =  length(color)
    ,
      colors = apply(colors,row,apply(row,col,cglNormalColor(col)));
      colLen = max(apply(colors,row,apply(row,col,length(col))));
      colors = apply(colors,row,apply(row,col,
        if(colLen > length(col),(col_1,col_2,col_3,1),col);
      ));
    );
    usesAlpha = colLen == 4;
    if(hasAlpha,
      if(colLen==4,
        modifiers_"cglPixelExpr" = cglLazy((texPos,pos3d,normal),(cglColor_1,cglColor_2,cglColor_3,cglColor_4*cglAlpha));
      ,
        modifiers_"cglPixelExpr" = cglLazy((texPos,pos3d,normal),(cglColor_1,cglColor_2,cglColor_3,cglAlpha));
      );
    ,
      modifiers_"cglPixelExpr" = cglLazy((texPos,pos3d,normal),cglColor);
    );
    if(isundefined(colors),
      modifiers_"cglColor"=color;
    ,
      vModifiers_"cglColor"=colors;
    );
  ,
    modifiers_"cglPixelExpr" = pixelExpr;
  );
  vModifiers=apply(vModifiers,samples,cglMeshSamplesToTriangles(samples,Nx,Ny,topology,cglSampleVertex));
  if(normalType != NormalPerPixel,
    vModifiers_"cglNormal" = normals;
  );
  tags = cglValOrDefault(tags,[]);
  opacityExpr = if(usesAlpha,false,if(hasAlpha,cglLazy(cglAlpha>=1),true));
  colorplot3d(cgl3dTriangleShaderCode(#),triangles,
    plotModifiers->modifiers,vModifiers->vModifiers,tags->["polygon"]++tags,opaqueIf->opacityExpr);
);

// feature TODO? plane3d
// feature TODO? quadric3d
// feature TODO? cubic3d

// TODO using modifiers in plotted expression leads to errors
//  * evaluate plot-expr with all given plot-modifiers?

// feature TODO? allow equation as expression: transform `f == g` to  `f-g` in last top-level expression
// feature TODO custom projection/uv-mapping from surface to 2D space
cglInterface("surface3d",cglSurface3d,(expr:(x,y,z)),(color,texture,textureRGB,textureRGBA,
  interpolateTexture,repeatTexture,colorExpr:(texturePos,spacePos,normal),colorExprRGB:(texturePos,spacePos,normal),
  colorExprRGBA:(texturePos,spacePos,normal),thickness,alpha,light:(color,direction,normal),
  texture,uv,dF:(x,y,z),cutoffRegion,degree,layers,plotModifiers,tags));
cglSurface3d(fun) := (
    regional(N,nodes,F,normalExpr,N,B,modifiers,viewRect,bounds,usesAlpha,opacityExpr,exprData,pixelExpr);
    color = cglValOrDefault(color,cglDefaults_"surfaceColor");
    light = cglValOrDefault(light,cglDefaults_"light");
    alpha = cglValOrDefault(alpha,cglDefaults_"surfaceAlpha");
    cutoffRegion = cglValOrDefault(cutoffRegion,cglDefaults_"surfaceCutoff");
    layers = cglValOrDefault(layers,0);
    // convert function to form taking vector insteads of 3 arguments
    F = cglLazy(p,cglEval(fun, p.x, p.y, p.z),fun->fun);
    normalExpr = if(isundefined(dF),cglGuessDerivative(F),cglLazy(p,cglEval(dF,p_1,p_2,p_3)));
    if(isundefined(degree),
      N = min(cglTryDetermineDegree(fun),cglMaxAutoDeg);
      if(isundefined(N),
        N = min(cglGuessdeg(F),cglMaxAutoDeg);
      ,if(N<0,
        N=cglMaxAutoDeg
      ));
    ,if(degree<0,
      N = cglMaxAutoDeg;
    ,
      N = max(degree,1);
      if(N>cglMaxDeg,
        cglLogInfo("exceeded maximum allowed degree, interpolating as "+text(cglMaxDeg)+" degree polynomial");
        N = cglMaxDeg;
      );
    ));
    nodes = cglSurfaceChebyshevNodes(N);
    B = cglSurfaceInterpolationMatrix(N);
    viewRect = cglViewRect();
    modifiers = {
      "cglSurfaceExpr":F,"cglNormalExpr":normalExpr,
      "cglChebNodes": nodes,"cglInterpMat":B,
      "cglCutoffRegion":cutoffRegion_"expr",
      "cglLight":light,"cglAlpha":alpha,
      "cglResolution": 2/min(|viewRect_1-viewRect_3|,|viewRect_2-viewRect_4|)
    };
    modifiers = cglMergeDicts(modifiers,cglValOrDefault(plotModifiers,{}));
    repeatTexture = cglValOrDefault(repeatTexture,true); // repeat surface texture by default
    hasAlpha = true;
    exprData = cglResolveColorExpr(false); // do not use alpha-modifier directly in color-expression
    pixelExpr = exprData_"pixelExpr";
    usesAlpha = exprData_"usesAlpha";
    modifiers = cglMergeDicts(modifiers,exprData_"modifiers");
    if(!isundefined(pixelExpr),
      modifiers_"cglPixelExpr" = pixelExpr;
    ,
      color = cglNormalColor(color);
      usesAlpha = length(color) == 4;
      modifiers_"cglPixelExpr" = cglLazy((texPos,pos3d,normal),cglColor);
      modifiers_"cglColor" = color;
    );
    modifiers_"cglColor0" = if(usesAlpha,(0,0,0,0),(0,0,0));
    modifiers = cglMergeDicts(modifiers,cutoffRegion_"modifs");
    bounds = cutoffRegion_"bounds";
    opacityExpr = if(usesAlpha,false,cglLazy(cglAlpha>=1));
    // code TODO? is there a way to avoid duplicate code for bounding box selection
    // ? allow passing lazy-func as first parameter of colorplot3d
    if(layers==0,
      if(bounds_"type" == "unbounded",
        colorplot3d(cgl3dSurfaceShaderCode(#),plotModifiers->modifiers,opaqueIf->opacityExpr)
      ,if(bounds_"type" == "sphere",
        colorplot3d(cgl3dSurfaceShaderCode(#),bounds_"center",bounds_"radius",plotModifiers->modifiers,opaqueIf->opacityExpr)
      ,if(bounds_"type" == "cylinder",
        colorplot3d(cgl3dSurfaceShaderCode(#),bounds_"point1",bounds_"point2",bounds_"radius",plotModifiers->modifiers,opaqueIf->opacityExpr)
      ,if(bounds_"type" == "cuboid",
        colorplot3d(cgl3dSurfaceShaderCode(#),bounds_"center",bounds_"v1",bounds_"v2",bounds_"v3",plotModifiers->modifiers,opaqueIf->opacityExpr)
      ,
        cglLogError("unknown bounding box type: "+text(bounds_"type"));
      ))));
    ,
      if(layers<0,layers=N,layers=min(layers,N));
      while(layers>0,
        modifiers_"K"=layers;
        if(bounds_"type" == "unbounded",
          colorplot3d(cgl3dSurfaceLayerShaderCode(#),plotModifiers->modifiers,opaqueIf->opacityExpr)
        ,if(bounds_"type" == "sphere",
          colorplot3d(cgl3dSurfaceLayerShaderCode(#),bounds_"center",bounds_"radius",plotModifiers->modifiers,opaqueIf->opacityExpr)
        ,if(bounds_"type" == "cylinder",
          colorplot3d(cgl3dSurfaceLayerShaderCode(#),bounds_"point1",bounds_"point2",bounds_"radius",plotModifiers->modifiers,opaqueIf->opacityExpr)
        ,if(bounds_"type" == "cuboid",
          colorplot3d(cgl3dSurfaceLayerShaderCode(#),bounds_"center",bounds_"v1",bounds_"v2",bounds_"v3",plotModifiers->modifiers,opaqueIf->opacityExpr)
        ,
          cglLogError("unknown bounding box type: "+text(bounds_"type"));
        ))));
        layers=layers-1;
      );
    );
);

// feature TODO? add ability to scale axes independently from CindyJS coordinate system
cglInterface("plot3d",cglPlot3d,(f:(x,y)),(colortexture,textureRGB,textureRGBA,interpolateTexture,repeatTexture,
  colorExpr:(texturePos,spacePos,normal),colorExprRGB:(texturePos,spacePos,normal),colorExprRGBA:(texturePos,spacePos,normal),
  thickness,alpha,light:(color,direction,normal),texture,uv,df:(x,y),cutoffRegion,degree,plotModifiers,tags));
cglPlot3d(f/*f(x,y)*/):=(
  if(isundefined(degree),
      degree = min(cglTryDetermineDegree(f),cglMaxAutoDeg);
  );
  cglSurface3d(cglLazy((x,y,z),cglEval(f,x,y)-z,f->f),degree->degree);
);
cglInterface("complexplot3d",cglCPlot3d,(f:(z)),(color,texture,textureRGB,textureRGBA,interpolateTexture,
  repeatTexture, colorExpr:(texturePos,spacePos,normal),colorExprRGB:(texturePos,spacePos,normal),
  colorExprRGBA:(texturePos,spacePos,normal),thickness,alpha,light:(color,direction,normal),texture,uv,df:(z),cutoffRegion,degree,plotModifiers,tags));
cglInterface("cplot3d",cglCPlot3d,(f:(z)),(color,texture,textureRGB,textureRGBA,interpolateTexture,
  repeatTexture,colorExpr:(texturePos,spacePos,normal),colorExprRGB:(texturePos,spacePos,normal),
  colorExprRGBA:(texturePos,spacePos,normal),thickness,alpha,light:(color,direction,normal),texture,uv,df:(z),cutoffRegion,degree,plotModifiers,tags));
cglCPlot3d(f/*f(z)*/):=(
  if(isundefined(color) & isundefined(colorExpr), // TODO find better condition for choosing phase-coloring
    colorExpr = cglLazy((texturePos,spacePos,normal),
      regional(z);
      z=cglEval(f,spacePos_1+i*spacePos_2);
      hue((arctan2(re(z),im(z))+pi)/(2*pi))
    ,f->f);
  );
  cglSurface3d(cglLazy((x,y,z),abs(cglEval(f,x+i*y))-z,f->f),degree->cglValOrDefault(degree,-1));
);