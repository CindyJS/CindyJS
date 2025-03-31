// collection of CindyScript functions for drawing elementary shapes with CindyGL3D
use("CindyGL");

normalize(v):=(v/|v|); // TODO? make built-in

/** maps the raw depth value given in the interval [0,inf) to a concrete depth in [0,1) and sets cglDepth accordingly */
cglSetDepth(rawDepth):=(
  regional(v);
  v = |cglViewPos|;
  cglDepth = 1-(v/(rawDepth+v));
);

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
  col3=cglComputeLight(direction,normal,col3,cglViewPos+direction*cglDepth);
  lightCol_1=col3_1;
  lightCol_2=col3_2;
  lightCol_3=col3_3;
  lightCol;
);
// default light computation
cglDefaultLight=cglDefaultLight0;

// TODO? allow image as color-expression
cglColorExpression(color,plotModifiers):=(
  regional(colorExpr);
  colorExpr = if(cglIsLazy(color),
    color
  ,
    plotModifiers = plotModifiers++[["cglDrawColor",color]];
    cglLazy(pos,cglDrawColor);
  );
  [colorExpr,plotModifiers];
);
// TODO is there a way to distinguish modifier and global variables
// TODO? parameter for transparency handling (single-layer/multi-layer ; render 1st/2nd layer)

cglSphereNormalAndDepth(direction,center,isBack):=(
  regional(vc,b2,c,D4,r,dst,dst2,pos3d,normal);
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
  normal = normalize(pos3d - center);
  [normal_1,normal_2,normal_3];
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
cgl3dSphereShaderCode(direction,isBack):=(
  regional(normal,texturePos,color);
  normal = cglSphereNormalAndDepth(direction,cglCenter,isBack);
  texturePos = cglEval(projection,normal);
  color = cglEval(pixelExpr,texturePos);
  cglEval(light,color,direction,normal);
);

// TODO add support for drawing back faces to all shapes

// creates a sphere with the given center and radius
// color can either be a constant color or a cglLazy (<pos>-> <color>) expression, if color is an expression
// the color of the pixels is determined by applying the given cglLazy projection function to the normal vector
// and using the result as input to the color function
cglDrawSphere(center,radius,color,projection):=(
  regional(light,colAndModifs,modifiers,drawBack);
  // TODO better way to detect transparent sphere
  drawBack = if(isundefined(cglDrawBack),length(color)==4,cglDrawBack);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  colAndModifs = cglColorExpression(color,modifiers);
  if(drawBack,
    colorplot3d(cgl3dSphereShaderCode(#,true),center,radius,
      UpixelExpr->colAndModifs_1,Uprojection->projection,Ulight->light,plotModifiers->colAndModifs_2,
      tags->["sphere"]++tags);
  );
  colorplot3d(cgl3dSphereShaderCode(#,false),center,radius,
    UpixelExpr->colAndModifs_1,Uprojection->projection,Ulight->light,plotModifiers->colAndModifs_2,tags->["sphere"]++tags);
);
cglDrawSphere(center,radius,color):=(
  regional(light,modifiers,drawBack);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  drawBack = if(isundefined(cglDrawBack),length(color)==4,cglDrawBack);
  cglDrawSphere(center,radius,pixelExpr,cglLazy(normal,cglProjSphereToSquare(normal)),
    plotModifiers->modifiers,Ulight->light,cglDrawBack->drawBack);
);

// wrapper functions for cglDrawSphere
sphere(center,radius,color):=(
  regional(light,modifiers,drawBack);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  drawBack = if(isundefined(cglDrawBack),length(color)==4,cglDrawBack);
  cglDrawSphere(center,radius,color,cglLazy(normal,0),plotModifiers->modifiers,
    Ulight->light,cglDrawBack->drawBack);
);
// creates a sphere with the given center and radius
// the colors on the surface are defined using the lazy function `pixelExpr` (<pos>)-> <color>
// where the position is computed from the normal vector using the lazy function `projection`
colorplotSphere(center,radius,pixelExpr,projection):=(
  regional(light,modifiers,drawBack);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  drawBack = if(isundefined(cglDrawBack),length(pixelExpr)==4,cglDrawBack);
  cglDrawSphere(center,radius,pixelExpr,projection,plotModifiers->modifiers,
    Ulight->light,cglDrawBack->drawBack);
);
// creates a sphere with the given center and radius
// the colors on the surface are defined using the lazy function `pixelExpr` (<x>,<y>)-> <color>
// where x,y are given in the range [0,1]
colorplotSphere(center,radius,pixelExpr):=(
  regional(light,modifiers,drawBack);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  drawBack = if(isundefined(cglDrawBack),length(pixelExpr)==4,cglDrawBack);
  cglDrawSphere(center,radius,pixelExpr,cglLazy(normal,cglProjSphereToSquare(normal)),plotModifiers->modifiers,
    Ulight->light,cglDrawBack->drawBack);
);
// creates a sphere with the given center and radius
// the colors on the surface are defined using the lazy function `pixelExpr` (<z>)-> <color>
// where z is a complex number obtained using the stereographic projection from the sphere to CP1
colorplotSphereC(center,radius,pixelExpr):=(
  regional(light,modifiers,drawBack);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  drawBack = if(isundefined(cglDrawBack),length(pixelExpr)==4,cglDrawBack);
  cglDrawSphere(center,radius,pixelExpr,cglLazy(normal,cglProjSphereToC(normal)),plotModifiers->modifiers,
    Ulight->light,cglDrawBack->drawBack);
);

// the two distances where the viewRay in the given direction intersects the cylinder defined by cglPointA, cglPointB and cglRadius
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
    w = |cglViewPos-(cglPointA+cglPointB)/2|;
    W = cglViewPos + w*direction;
    BA = cglPointB-cglPointA;
    U = BA/(BA*BA);
    VA = (W-cglPointA);
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
// helper for computing normal and position along cylinder
// sets cglDepth to the first intersection with the cylinder
// returns (...normal, height)
cgl3dCylinderNormalAndHeight(direction):=(
  regional(l,BA,U,v1,delta1,v2,delta2,normal);
  l = cglCylinderDepths(direction);
  BA = cglPointB-cglPointA;
  U = BA/(BA*BA);
  v1 = (cglViewPos+l_1*direction)-cglPointA;
  delta1 = (v1*U);
  if((delta1>0)& (delta1<1),
    cglSetDepth(l_1);
    normal = normalize(v1-delta1*BA);
    (normal_1,normal_2,normal_3,delta1),
    v2 = (cglViewPos+l_2*direction)-cglPointA;
    delta2 = v2*U;
    if((delta2<0) % (delta2>1),cglDiscard());
    cglSetDepth(l_2);
    normal = normalize(v2-delta2*BA);
    (normal_1,normal_2,normal_3,delta2);
  );
);
cgl3dCylinderNormalAndHeightBack(direction):=(
  regional(l,BA,U,v1,delta1,v2,delta2,normal);
  l = cglCylinderDepths(direction);
  BA = cglPointB-cglPointA;
  U = BA/(BA*BA);
  v1 = (cglViewPos+l_1*direction)-cglPointA;
  delta1 = (v1*U);
  if((delta1<0) % (delta1>1),cglDiscard()); // no second intersection
  cglSetDepth(l_1);
  v2 = (cglViewPos+l_2*direction)-cglPointA;
  delta2 = v2*U;
  if((delta2<0) % (delta2>1),cglDiscard());
  cglSetDepth(l_2);
  normal = normalize(v2-delta2*BA);
  (normal_1,normal_2,normal_3,delta2);
);
// project cylinder onto unit square using normal and height as input
// assumes that normal is normalized, and height is between 0 and 1
cglProjCylinderToSquare(normal,height,orientation):=(
  regional(d1,d2);
  if(orientation_1<orientation_2,
    d1=normalize(cross(orientation,(1,0,0)));
  ,
    d1=normalize(cross(orientation,(0,1,0)));
  );
  d2 = -normalize(cross(orientation,d1));
  ((arctan2(d1*normal,d2*normal)+pi)/(2*pi),height);
);
cglCylinderBlendColors(colorA,colorB,plotModifiers):=(
  regional(pixelExpr,colAndModifs,exprA,exprB);
  pixelExpr = if(islist(colorA) & islist(colorB),
    // ensure colors have same length
    if(length(colorA)!=length(colorB),
      if(length(colorA)<length(colorB),
        colorA = colorA ++ [1];
      ,
        colorB = colorB ++ [1];
      );
    );
    plotModifiers = plotModifiers++[["cglDrawColorA",colorA], ["cglDrawColorB",colorB]];
    cglLazy(pos,(pos_2)*cglDrawColorB + (1-pos_2)*cglDrawColorA);
  ,
    exprA = if(islist(colorA),
      plotModifiers = plotModifiers++[["cglDrawColorA",colorA]];
      cglLazy(pos,cglDrawColorA);
    ,
      colAndModifs = cglColorExpression(colorA,plotModifiers);
      plotModifiers = colAndModifs_2;
      colAndModifs_1;
    );
    exprB = if(islist(colorB),
      plotModifiers = plotModifiers++[["cglDrawColorB",colorB]];
      cglLazy(pos,cglDrawColorB);
    ,
      colAndModifs = cglColorExpression(colorB,plotModifiers);
      plotModifiers = colAndModifs_2;
      colAndModifs_1;
    );
    // TODO? is there a way to ensure the pixel-expressions have the same shape?
    // ? add a builtIn: cglAddColors(<color1>,<color2>) that automatically extends vec3 to vec4 if arguments have different lengths
    cglLazy(pos,(pos_2)*exprB(pos) + (1-pos_2)*exprA(pos));
  );
  [pixelExpr,plotModifiers];
);
cgl3dCylinderShaderCode(direction):=(
  regional(normalAndHeight,normal,texturePos,color);
  normalAndHeight = cgl3dCylinderNormalAndHeight(direction);
  normal = (normalAndHeight_1,normalAndHeight_2,normalAndHeight_3);
  texturePos = cglProjCylinderToSquare(normal,normalAndHeight_4,cglPointB-cglPointA);
  color = cglEval(pixelExpr,texturePos);
  cglEval(light,color,direction,normal);
);
cgl3dCylinderShaderCodeBack(direction):=(
  regional(normalAndHeight,normal,texturePos,color);
  normalAndHeight = cgl3dCylinderNormalAndHeightBack(direction);
  normal = (normalAndHeight_1,normalAndHeight_2,normalAndHeight_3);
  texturePos = cglProjCylinderToSquare(normal,normalAndHeight_4,cglPointB-cglPointA);
  color = cglEval(pixelExpr,texturePos);
  cglEval(light,color,direction,normal);
);
// TODO multiple versions of cylinder ( end-cap style, transparency, projection?, skip-back?)

// creates a cylinder with the given endpoints and radius
// color can either be a constant color or a cglLazy (<pos>-> <color>) expression, if color is an expression
// where the position a,h is the angle along the cylinder together with the hight measured from pointA both given in the range [0,1]
cglDrawCylinder(pointA,pointB,radius,color):=(
  regional(light,colAndModifs,modifiers,drawBack);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  drawBack = if(isundefined(cglDrawBack),length(color)==4,cglDrawBack);
  colAndModifs = cglColorExpression(color,modifiers);
  if(drawBack,
    colorplot3d(cgl3dCylinderShaderCodeBack(#),pointA,pointB,radius,
      UpixelExpr->colAndModifs_1,Ulight->light,plotModifiers->colAndModifs_2,tags->["cylinder"]++tags);
  );
  colorplot3d(cgl3dCylinderShaderCode(#),pointA,pointB,radius,
    UpixelExpr->colAndModifs_1,Ulight->light,plotModifiers->colAndModifs_2,tags->["cylinder"]++tags);
);
// like cglDrawCylinder(pointA,pointB,radius,color)
// the color of a pixel is determined by linearly blending between colorA and colorB dependent on the height of the current pixel
cglDrawCylinder(pointA,pointB,radius,colorA,colorB):=(
  regional(light,colAndModifs,modifiers,drawBack);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  drawBack = if(isundefined(cglDrawBack),length(colorA)==4 % length(colorA)==4,cglDrawBack);
  colAndModifs = cglCylinderBlendColors(colorA,colorB,modifiers);
  cglDrawCylinder(pointA,pointB,radius,colAndModifs_1,plotModifiers->colAndModifs_2,
    Ulight->light,cglDrawBack->drawBack);
);
cylinder(pointA,pointB,radius,colorA,colorB):=(
  regional(light,modifiers,drawBack);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  drawBack = if(isundefined(cglDrawBack),length(colorA)==4 % length(colorA)==4,cglDrawBack);
  cglDrawCylinder(pointA,pointB,radius,colorA,colorB,plotModifiers->modifiers,Ulight->light,cglDrawBack->drawBack);
);
colorplotCylinder(pointA,pointB,radius,pixelExpr):=(
  regional(light,modifiers,drawBack);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  drawBack = if(isundefined(cglDrawBack),length(pixelExpr)==4,cglDrawBack);
  cglDrawCylinder(pointA,pointB,radius,pixelExpr,plotModifiers->modifiers,Ulight->light,cglDrawBack->drawBack);
);

cgl3dRodShaderCode(direction):=(
  regional(l,v,BA,delta,center,normal,texturePos);
  // TODO? extract rodNormalAndDepth
  l = cglCylinderDepths(direction);
  v = (cglViewPos+l_1*direction)-cglPointA;
  BA = cglPointB-cglPointA;
  delta = (v*BA)/(BA*BA);
  delta = max(0,min(delta,1));
  center = delta*cglPointB+(1-delta)*cglPointA;
  normal=cglSphereNormalAndDepth(direction,center,false);
  texturePos = cglProjCylinderToSquare(normal,delta,cglPointB-cglPointA);
  cglEval(light,cglEval(pixelExpr,texturePos),direction,normal);
);
cgl3dRodShaderCodeBack(direction):=(
  regional(l,v,BA,delta,center,normal,texturePos);
  l = cglCylinderDepths(direction);
  v = (cglViewPos+l_1*direction)-cglPointA;
  BA = cglPointB-cglPointA;
  delta = (v*BA)/(BA*BA);
  delta = max(0,min(delta,1));
  center = delta*cglPointB+(1-delta)*cglPointA;
  normal=cglSphereNormalAndDepth(direction,center,true);
  texturePos = cglProjCylinderToSquare(normal,delta,cglPointB-cglPointA);
  cglEval(light,cglEval(pixelExpr,texturePos),direction,normal);
);
// cylinder with spherical end caps
cglDrawRod(pointA,pointB,radius,color):=(
  regional(light,colAndModifs,modifiers,drawBack);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  drawBack = if(isundefined(cglDrawBack),length(color)==4,cglDrawBack);
  colAndModifs = cglColorExpression(color,modifiers);
  if(drawBack,
    colorplot3d(cgl3dRodShaderCodeBack(#),pointA,pointB,radius,
      UpixelExpr->colAndModifs_1,Ulight->light,plotModifiers->colAndModifs_2,tags->["cylinder"]++tags);
  );
  colorplot3d(cgl3dRodShaderCode(#),pointA,pointB,radius,
    UpixelExpr->colAndModifs_1,Ulight->light,plotModifiers->colAndModifs_2,tags->["cylinder"]++tags);
);
cglDrawRod(pointA,pointB,radius,colorA,colorB):=(
  regional(light,colAndModifs,modifiers,drawBack);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  drawBack = if(isundefined(cglDrawBack),length(colorA)==4 % length(colorA)==4,cglDrawBack);
  colAndModifs = cglCylinderBlendColors(colorA,colorB,modifiers);
  cglDrawRod(pointA,pointB,radius,colAndModifs_1,plotModifiers->colAndModifs_2,Ulight->light,cglDrawBack->drawBack);
);
rod(pointA,pointB,radius,color):=(
  regional(light,modifiers,drawBack);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  drawBack = if(isundefined(cglDrawBack),length(color)==4,cglDrawBack);
  cglDrawRod(pointA,pointB,radius,color,plotModifiers->modifiers,Ulight->light,cglDrawBack->drawBack);
);
rod(pointA,pointB,radius,colorA,colorB):=(
  regional(light,modifiers,drawBack);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  drawBack = if(isundefined(cglDrawBack),length(colorA)==4 % length(colorA)==4,cglDrawBack);
  cglDrawRod(pointA,pointB,radius,colorA,colorB,plotModifiers->modifiers,Ulight->light,cglDrawBack->drawBack);
);

// TODO use surface for rendering torus
//  will reduce the number of rendered objects when transparency is enabled, can be correctly split into layers
// -> own bounding box for torus, (trianglate larger torus s.t. rendered surface within that torus)
// ? is it faster for opaque to use triangles/arc-rods

// helper for computing normal vector and radius-direction of a arc-rod
cgl3dArcRodNormalAndRadius(direction):=(
  regional(l,pos3d,pc,radiusDirection,arcDirection,planeOffset,arcCenter,normal);
  l = cglCylinderDepths(direction);
  pos3d = (cglViewPos+l_1*direction);
  pc=pos3d-tCenter;
  radiusDirection = normalize(pc-(tOrientation*pc)*tOrientation);
  arcDirection = normalize(cross(radiusDirection,tOrientation));
  planeOffset = pos3d*arcDirection;
  // check if A and B are on same side of normal plane to torus through pos3d, add small tolerance to balance out numerical errors
  if(((cglPointA*arcDirection-planeOffset)*(cglPointB*arcDirection-planeOffset))<1e-5,
    cglSetDepth(l_1);
    arcCenter = tCenter+tRadius*radiusDirection;
    normal = normalize(pos3d - arcCenter),
    // TODO add option to ignore inner side (e.g. for drawing closed torus)
    pos3d = (cglViewPos+l_2*direction);
    pc=pos3d-tCenter;
    radiusDirection = normalize(pc-(tOrientation*pc)*tOrientation);
    arcDirection = normalize(cross(radiusDirection,tOrientation));
    planeOffset = pos3d*arcDirection;
    if(((cglPointA*arcDirection-planeOffset)*(cglPointB*arcDirection-planeOffset))>1e-5,cglDiscard());
    cglSetDepth(l_2);
    arcCenter = tCenter+tRadius*radiusDirection;
    normal = normalize(pos3d - arcCenter);
  );
  (normal,radiusDirection);
);
// the torus with the given orientation onto the unit square using normal vector and radius-direction as input
// assumes that normal and radiusDirection are normalized
cglProjTorusToSquare(normal,radiusDirection,orientation):=(
  regional(v1,v2,phi1,phi2);
  v1 = normalize(cross(orientation,if(orientation_1<orientation_2,(1,0,0),(0,1,0))));
  v2 = -normalize(cross(orientation,v1));
  phi1 = arctan2(radiusDirection*v1,radiusDirection*v2)+pi;
  phi2 = arctan2(normal*radiusDirection,normal*orientation)+pi;
  (phi1,phi2)/(2*pi);
);
cglTorusSegments(center,orientation,radius1,radius2):=(
  regional(alpha0glob,alpha1glob,v1,v2,N,alpha);
  // set alpha0, alpha1 to global value
  // if no value is given set them to 0 and 2pi
  if(isundefined(alpha0),alpha0glob=0,alpha0glob=alpha0);
  if(isundefined(alpha1),alpha1glob=2*pi,alpha1glob=alpha1);
  regional(alpha0,alpha1);
  alpha0=alpha0glob;
  alpha1=alpha1glob;
  // create local coordinate system of torus
  // TODO? make v1 a parameter
  if(orientation_1<orientation_2,
    v1=normalize(cross(orientation,(1,0,0)));
  ,
    v1=normalize(cross(orientation,(0,1,0)));
  );
  v2 = normalize(cross(orientation,v1));
  N = max(48,min(floor(abs(alpha1-alpha0)*(radius1/radius2)),128));
  apply(0..N,n,
    alpha = alpha0+(n/N)*(alpha1-alpha0);
    center + radius1 * (cos(alpha)*v1+sin(alpha)*v2);
  );
);
cgl3dArcRodShaderCode(direction):=(
  regional(normalAndDir,normal,texturePos,color);
  normalAndDir = cgl3dArcRodNormalAndRadius(direction);
  normal = normalAndDir_1;
  texturePos = cglProjTorusToSquare(normal,normalAndDir_2,tOrientation);
  color = cglEval(pixelExpr,texturePos);
  cglEval(light,color,direction,normal);
);
// creates a torus with the given center pointing in the given orientation, with outer radius radius1 and inner radius radius1
// color can be a uniform color or a cglLazy expression, if color is an expression ((<x>,<y>)-> <color>)
// the colors on the surface are defined by evaluating the expression at the current angles around the outer & inner cicles
// given in the range [0,1]
cglDrawTorus(center,orientation,radius1,radius2,color):=(
  regional(points,light,colAndModifs,modifiers);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  colAndModifs = cglColorExpression(color,modifiers);
  // TODO? add way to group multiple sub-objects into a composite object
  points = cglTorusSegments(center,orientation,radius1,radius2);
  forall(consecutive(points),arcEnds,
    colorplot3d(cgl3dArcRodShaderCode(#),arcEnds_1,arcEnds_2,radius2,
      UtCenter->center,UtRadius->radius1,UtOrientation->orientation,
      UpixelExpr->colAndModifs_1,Ulight->light,plotModifiers->colAndModifs_2,tags->["arc","torus"]++tags);
  );
);
// wrappers for cglDrawTorus
torus(center,orientation,radius1,radius2,color):=(
  regional(light,modifiers);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  cglDrawTorus(center,orientation,radius1,radius2,color,Ulight->light,plotModifiers->modifiers);
);
colorplotTorus(center,orientation,radius1,radius2,pixelExpr):=(
  regional(light,modifiers);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  cglDrawTorus(center,orientation,radius1,radius2,pixelExpr,Ulight->light,plotModifiers->modifiers);
);

cgl3dBackgroundShaderCode():=(
  cglEval(colorExpr,cglPixel); // TODO? use plain pixel
);
// draw a single color (or exression) on the whole screen
cglDraw(color):=(
  regional(colAndModifs,light,modifiers);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  light = if(isundefined(Ulight),cglNoLight,Ulight);
  colAndModifs = cglColorExpression(color,modifiers);
  colorplot3d(cgl3dBackgroundShaderCode(),UcolorExpr->colAndModifs_1,Ulight->light,plotModifiers->colAndModifs_2);
);
background(color):=(
  regional(light,modifiers);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  light = if(isundefined(Ulight),cglNoLight,Ulight);
  cglDraw(color,Ulight->light,plotModifiers->modifiers);
);

// triangulates a convex polygon
cglTriangulatePolygon(vertices,vMods):=(
  regional(root,n,triangles,normals,vData,keyVal,rootVal,vals);
  // TODO make algorithm work for non-convex shapes
  // TODO? better triangualtion algorithm (? area maximizing instead of fan)
  root = vertices_1;
  triangles = flatten(apply(2..(length(vertices)-1),i,
    [root,vertices_i,vertices_(i+1)];
  ));
  normals = flatten(apply(2..(length(vertices)-1),i,
    n=normalize(cross((vertices_i)-root,(vertices_(i+1))-root));
    [n,n,n];
  ));
  vData = apply(vMods,keyVal,
    if(islist(keyVal) & length(keyVal) == 2 & isstring(keyVal_1),
      rootVal = keyVal_2_1;
      vals = keyVal_2;
      [keyVal_1,flatten(apply(2..(length(vertices)-1),i,
        [rootVal,vals_i,vals_(i+1)];
      ))];
    ,
      keyVal
    )
  );
  [triangles,normals,vData];
);
cgl3dTriangleShaderCode(direction):=(
  regional(color,normal);
  color = cglEval(pixelExpr,direction);
  normal = cglEval(normalExpr,direction);
  cglEval(light,color,direction,normal);
);

// TODO? allow giving one color/vertex
// TODO correctly map vModifiers to created vertex list

// draw a (convex) polygon with the given set of vertices
// the polygon is either colored with a constant color
// or a color-expression mapping the view direction to a pixel-color
cglDrawPolygon(vertices,color):=(
  regional(light,colAndModifs,modifiers,vMods);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  vMods = if(isundefined(vModifiers),[],vModifiers);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  colAndModifs = cglColorExpression(color,modifiers);
  trianglesAndNormals = cglTriangulatePolygon(vertices,vMods);
  colorplot3d(cgl3dTriangleShaderCode(#),trianglesAndNormals_1,Vnormal->trianglesAndNormals_2,
    UpixelExpr->colAndModifs_1,UnormalExpr->cglLazy(dir,normal),Ulight->light,
    plotModifiers->colAndModifs_2,vModifiers->trianglesAndNormals_3,tags->["polygon"]++tags);
);
polygon3d(vertices,color):=(
  regional(light,modifiers,vMods);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  vMods = if(isundefined(vModifiers),[],vModifiers);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  cglDrawPolygon(vertices,color,Ulight->light,plotModifiers->modifiers,vModifiers->vMods);
);
// replace the polygon with the given id
cglUpdatePolygon3d(objId,vertices,color):=(
  regional(light,colAndModifs,modifiers,vMods);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  vMods = if(isundefined(vModifiers),[],vModifiers);
  if(isundefined(Ulight),light = cglDefaultLight,light = Ulight);
  colAndModifs = cglColorExpression(color,modifiers);
  trianglesAndNormals = cglTriangulatePolygon(vertices,vMods);
  cglMoveTriangles(objId,trianglesAndNormals_1);
  cglUpdate(objId,Vnormal->trianglesAndNormals_2,UpixelExpr->colAndModifs_1,Ulight->light,
    plotModifiers->colAndModifs_2,vModifiers->trianglesAndNormals_3);
);
updatePolygon3d(objId,vertices,color):=(
  regional(light,modifiers,vMods);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  vMods = if(isundefined(vModifiers),[],vModifiers);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  cglUpdatePolygon3d(objId,vertices,color,Ulight->light,plotModifiers->modifiers,vModifiers->vMods);
);

// square mesh
CGLuMESHuNORMALuFACE = 0; // use u as seperation character for uppercase constants (underscore is reserved)
CGLuMESHuNORMALuVERTEX = 1;
cglResolveNormalType(input,default):=(
  if(input == CGLuMESHuNORMALuFACE % input == CGLuMESHuNORMALuVERTEX,
    input
  ,
    default
  );
);
// TODO option to close mesh in x/y direction
cglMeshSamplesToTrianglesV(samples,Nx,Ny):=(
  regional(p00,p01,p10,p11);
  flatten(apply(1..(Ny-1),ny,
    apply(1..(Nx-1),nx,
      p00 = samples_ny_nx;
      p01 = samples_ny_(nx+1);
      p10 = samples_(ny+1)_nx;
      p11 = samples_(ny+1)_(nx+1);
      [p00,p01,p10,p01,p10,p11];
    );
  ),levels->2);
);
cglMeshSamplesToTrianglesF(samples,Nx,Ny):=(
  regional(p00);
  flatten(apply(1..(Ny-1),ny,
    apply(1..(Nx-1),nx,
      p00 = samples_ny_nx;
      [p00,p00,p00,p00,p00,p00];
    );
  ),levels->2);
);
cglMeshGuessNormals(samples,Nx,Ny,normalType):=(
  regional(n,vNormals,p00,p01,p10,p11,n1,n2);
  if(normalType == CGLuMESHuNORMALuFACE,
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
  , // CGLuMESHuNORMALuVERTEX
    // vertex normals -> average face normal of faces containing edges
    //  -> initialize with 0,0,0, add all face normals, divide by count
    // TODO? is there a better algorithm for guessing vertex normals
    vNormals=apply(1..Ny,ny,apply(1..Nx,nx,[0,0,0,0]));
    forall(1..(Ny-1),ny,
      forall(1..(Nx-1),nx,
        p00 = samples_ny_nx;
        p01 = samples_ny_(nx+1);
        p10 = samples_(ny+1)_nx;
        p11 = samples_(ny+1)_(nx+1);
        n1=normalize(cross(p01-p00,p10-p00));
        n2=-normalize(cross(p01-p11,p10-p11));
        n1=[n1_1,n1_2,n1_3,1];
        n2=[n2_1,n2_2,n2_3,1];
        vNormals_ny_nx = vNormals_ny_nx+n1;
        vNormals_ny_(nx+1) = vNormals_ny_(nx+1)+n1+n2;
        vNormals_(ny+1)_nx = vNormals_(ny+1)_nx+n1+n2;
        vNormals_(ny+1)_(nx+1) = vNormals_(ny+1)_(nx+1)+n2;
      );
    );
    forall(1..Ny,ny,
      forall(1..Nx,nx,
        n=vNormals_ny_nx;
        vNormals_ny_nx = [n_1/n_4,n_2/n_4,n_3/n_4];
      );
    );
    // assign normals to corresponding vertices
    cglMeshSamplesToTrianglesV(vNormals,Nx,Ny);
  );
);
cglMeshVertexModifiers(vMods,fMods,Nx,Ny):=(
  apply(fMods,keyVal,
    if(!islist(keyVal) % length(keyVal) != 2 % !isstring(keyVal_1),keyVal,
      [keyVal_1,cglMeshSamplesToTrianglesF(keyVal_2,Nx,Ny)];
    );
  )++apply(vMods,keyVal,
    if(!islist(keyVal) % length(keyVal) != 2 % !isstring(keyVal_1),keyVal,
      [keyVal_1,cglMeshSamplesToTrianglesV(keyVal_2,Nx,Ny)];
    );
  );
);

// TODO? support v-modifiers for meshes
cglDrawMesh(samples,color):=(
  regional(Nx,Ny,pixelExpr,vertices,normals,light,vMods,fMods,vertexMods);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  vMods = if(isundefined(vModifiers),[],vModifiers);
  fMods = if(isundefined(fModifiers),[],fModifiers);
  vertexMods = cglMeshVertexModifiers(vMods,fMods,Nx,Ny);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  Ny = length(samples);
  Nx = length(samples_1);
  vertices = cglMeshSamplesToTrianglesV(samples,Nx,Ny);
  normals = cglMeshGuessNormals(samples,Nx,Ny,cglResolveNormalType(normalType,CGLuMESHuNORMALuFACE));
  colAndModifs = cglColorExpression(color,modifiers);
  colorplot3d(cgl3dTriangleShaderCode(#),vertices,Vnormal->normals,
    UpixelExpr->colAndModifs_1,UnormalExpr->cglLazy(dir,normal),Ulight->light,
    plotModifiers->colAndModifs_2,vModifiers->vertexMods,tags->["mesh"]++tags);
);
cglDrawMesh(samples,normals,color):=(
  regional(Nx,Ny,pixelExpr,vertices,normalExpr,light,vMods,fMods);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  vMods = if(isundefined(vModifiers),[],vModifiers);
  fMods = if(isundefined(fModifiers),[],fModifiers);
  vertexMods = cglMeshVertexModifiers(vMods,fMods,Nx,Ny);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  Ny = length(samples);
  Nx = length(samples_1);
  vertices = cglMeshSamplesToTrianglesV(samples,Nx,Ny);
  if(cglIsLazy(normals),
    normalExpr = normals;
  ,
    if(cglResolveNormalType(normalType,CGLuMESHuNORMALuFACE) == CGLuMESHuNORMALuVERTEX,
      vertexMods = vertexMods ++ [["normal",cglMeshSamplesToTrianglesV(normals,Nx,Ny)]];
    ,
      vertexMods = vertexMods ++ [["normal",cglMeshSamplesToTrianglesF(normals,Nx,Ny)]];
    );
    normalExpr = cglLazy(dir,normal);
  );
  colAndModifs = cglColorExpression(color,modifiers);
  colorplot3d(cgl3dTriangleShaderCode(#),vertices,
    UpixelExpr->colAndModifs_1,UnormalExpr->normalExpr,Ulight->light,
    plotModifiers->colAndModifs_2,vModifiers->vertexMods,tags->["mesh"]++tags);
);
mesh3d(samples,color):=(
  regional(light,modifiers,vMods,fMods);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  vMods = if(isundefined(vModifiers),[],vModifiers);
  fMods = if(isundefined(fModifiers),[],fModifiers);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  cglDrawMesh(samples,color,plotModifiers->modifiers,Ulight->light,vModifiers->vMods,fModifiers->fMods);
);
mesh3d(samples,normals,color):=(
  regional(light,modifiers,vMods,fMods);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  vMods = if(isundefined(vModifiers),[],vModifiers);
  fMods = if(isundefined(fModifiers),[],fModifiers);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  cglDrawMesh(samples,normals,color,plotModifiers->modifiers,Ulight->light,vModifiers->vMods,fModifiers->fMods);
);
colorplotMesh3d(samples,pixelExpr):=(
  regional(light,modifiers,vMods,fMods);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  vMods = if(isundefined(vModifiers),[],vModifiers);
  fMods = if(isundefined(fModifiers),[],fModifiers);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  cglDrawMesh(samples,pixelExpr,plotModifiers->modifiers,Ulight->light,vModifiers->vMods,fModifiers->fMods);
);
colorplotMesh3d(samples,normals,pixelExpr):=(
  regional(light,modifiers,vMods,fMods);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  vMods = if(isundefined(vModifiers),[],vModifiers);
  fMods = if(isundefined(fModifiers),[],fModifiers);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  cglDrawMesh(samples,normals,pixelExpr,plotModifiers->modifiers,Ulight->light,vModifiers->vMods,fModifiers->fMods);
);
