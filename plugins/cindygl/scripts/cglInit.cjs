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
// empty ist to hold mapping from top layer to list of layers in userdata
cglLayerInfo = [];
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

// TODO is there a way to distinguish modifier and global variables
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

// creates a sphere with the given center and radius
// color can either be a constant color or a cglLazy (<pos>-> <color>) expression, if color is an expression
// the color of the pixels is determined by applying the given cglLazy projection function to the normal vector
// and using the result as input to the color function
cglDrawSphere(center,radius,color,projection):=(
  regional(light,colAndModifs,modifiers,drawBack,ids,topLayer);
  // TODO better way to detect transparency
  drawBack = if(isundefined(cglDrawBack),length(color)==4,cglDrawBack);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  colAndModifs = cglColorExpression(color,modifiers);
  if(drawBack,
    ids = [colorplot3d(cgl3dSphereShaderCode(#,true),center,radius,
      UpixelExpr->colAndModifs_1,Uprojection->projection,Ulight->light,plotModifiers->colAndModifs_2,
      tags->["sphere","backside"]++tags)];
  );
  topLayer = colorplot3d(cgl3dSphereShaderCode(#,false),center,radius,
    UpixelExpr->colAndModifs_1,Uprojection->projection,Ulight->light,plotModifiers->colAndModifs_2,tags->["sphere"]++tags);
  if(drawBack,cglRememberLayers(append(ids,topLayer)),[topLayer]);
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
    // TODO? discard negative distances form view
    (w - (b + r)/a, w - (b - r)/a);
);
// intersections of ray in given direction with cylinder with circular end-caps
cglCappedCylinderDepths(direction):=( // TODO? make idenpendent of render-bounding box
  regional(w,W,BA,U,VA,S,T,a,b,c,D,r,l,v,d,m0t,m1t,m0,m1,low,hi);
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
  l = (- (b + r)/a, - (b - r)/a);
  // intersections with cutof planes
  // normal: U, values at ends: <A,B-A>, <B,B-A>
  // <view + m * dir,(B-A)> = <view,B-A> + m * <dir,B-A>
  d = direction * U;
  v = W * U;
  a = cglPointA * U;
  b = cglPointB * U;
  // b >= v + m*d >= a -> (b-a)/d >= m >= (a-v)/d
  m0t = (a-v)/d;
  m1t = (b-v)/d;
  m0 = min(m0t,m1t);
  m1 = max(m0t,m1t);
  // lowBound: -w, m0, l_1
  // hi Bound: m1, l_2
  low = max(-w,max(m0,l_1));
  hi = min(m1,l_2);
  if(hi<=low,cglDiscard());
  [low+w,hi+w];
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
  regional(light,colAndModifs,modifiers,drawBack,ids,topLayer);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  drawBack = if(isundefined(cglDrawBack),length(color)==4,cglDrawBack);
  colAndModifs = cglColorExpression(color,modifiers);
  if(drawBack,
    ids = [colorplot3d(cgl3dCylinderShaderCodeBack(#),pointA,pointB,radius,
      UpixelExpr->colAndModifs_1,Ulight->light,plotModifiers->colAndModifs_2,tags->["cylinder","backside"]++tags)];
  );
  topLayer = colorplot3d(cgl3dCylinderShaderCode(#),pointA,pointB,radius,
    UpixelExpr->colAndModifs_1,Ulight->light,plotModifiers->colAndModifs_2,tags->["cylinder"]++tags);
  if(drawBack,cglRememberLayers(append(ids,topLayer)),[topLayer]);
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
  regional(light,colAndModifs,modifiers,drawBack,ids,topLayer);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  drawBack = if(isundefined(cglDrawBack),length(color)==4,cglDrawBack);
  colAndModifs = cglColorExpression(color,modifiers);
  if(drawBack,
    ids = [colorplot3d(cgl3dRodShaderCodeBack(#),pointA,pointB,radius,
      UpixelExpr->colAndModifs_1,Ulight->light,plotModifiers->colAndModifs_2,tags->["cylinder","backside"]++tags)];
  );
  topLayer = colorplot3d(cgl3dRodShaderCode(#),pointA,pointB,radius,
    UpixelExpr->colAndModifs_1,Ulight->light,plotModifiers->colAndModifs_2,tags->["cylinder"]++tags);
  if(drawBack,cglRememberLayers(append(ids,topLayer)),[topLayer]);
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
  cglUpdate(objId,UpixelExpr->colAndModifs_1,Ulight->light,plotModifiers->colAndModifs_2);
  cglUpdateBounds(objId,trianglesAndNormals_1,Vnormal->trianglesAndNormals_2,vModifiers->trianglesAndNormals_3);
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

// algebraic surfaces

// simple algrithm for small degree surfaces:
// bisection using rolles theorem
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
// TODO make eval/derivative generic in degree
cglEvalP4(coeffs,t) := coeffs*(1,t,t*t,t*t*t,t*t*t*t);
cglEvalP3(coeffs,t) := coeffs*(1,t,t*t,t*t*t);
cglEvalP2(coeffs,t) := coeffs*(1,t,t*t);
cglEvalP1(coeffs,t) := coeffs*(1,t);
dP4(coeffs) := (coeffs_2, 2*coeffs_3, 3*coeffs_4, 4*coeffs_5, 0);
dP3(coeffs) := (coeffs_2, 2*coeffs_3, 3*coeffs_4, 0);
cglBinSearchP3(poly, x0, x1, def) := (
  regional(v0, v1, m, vm);
  v0 = cglEvalP3(poly, x0);
  v1 = cglEvalP3(poly, x1);
  if(v0*v1<=0,
    repeat(16,
      m = (x0+x1)/2;
      vm = cglEvalP3(poly, m);
      if(v0*vm<=0,
        (x1 = m; v1 = vm;),
        (x0 = m; v0 = vm;)
      );
    );
    m,
    def
  )
);
cglBinSearchP4(poly, x0, x1, def) := (
  regional(v0, v1, m, vm);
  v0 = cglEvalP4(poly, x0);
  v1 = cglEvalP4(poly, x1);
  if(v0*v1<=0,
    repeat(16,
      m = (x0+x1)/2;
      vm = cglEvalP4(poly, m);
      if(v0*vm<=0,
        (x1 = m; v1 = vm;),
        (x0 = m; v0 = vm;)
      );
    );
    m,
    def
  )
);
 //finds the k-th root of poly in interval (l, u). returns def if there is none
cglKthrootP3(k, poly, l, u, def) := (
  regional(p1, p2, p3, p4, a0, b0, b1, c0, c1, c2, count);
  p4 = poly;  //cubic
  p3 = dP3(p4); //quadratic
  p2 = dP3(p3); //linear

  a0 = cglBinSearchP4(p1, l, u, u);
  b0 = cglBinSearchP4(p2, l, a0, l);
  c0 = cglBinSearchP4(p3, l, b0, l);
  count = (l < c0 & c0 < u);
  if(count >= k, c0,
    b1 = cglBinSearchP4(p2, a0, u, u);
    c1 = cglBinSearchP4(p3, b0, b1, c0);
    count = count + (c0 < c1 & c1 < u);
    if(count >= k, c1,
      c2 = cglBinSearchP4(p3, b1, u, u);
      count = count + (c1 < d2 & c2 < u);
      if(count >= k, c2, def);
    );
  );
);
cglKthrootP4(k, poly, l, u, def) := (
  regional(p1, p2, p3, p4, a0, b0, b1,
    c0, c1, c2, d0, d1, d2, d3,count);
  p4 = poly;  //quartic
  p3 = dP4(p4); //cubic
  p2 = dP4(p3); //quadratic
  p1 = dP4(p2); //linear

  a0 = cglBinSearchP4(p1, l, u, u);
  b0 = cglBinSearchP4(p2, l, a0, l);
  c0 = cglBinSearchP4(p3, l, b0, l);
  d0 = cglBinSearchP4(p4, l, c0, l);
  count = (l < d0 & d0 < u);
  if(count >= k, d0,
    b1 = cglBinSearchP4(p2, a0, u, u);
    c1 = cglBinSearchP4(p3, b0, b1, c0);
    d1 = cglBinSearchP4(p4, c0, c1, d0);
    count = count + (d0 < d1 & d1 < u);
    if(count >= k, d1,
      c2 = cglBinSearchP4(p3, b1, u, u);
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
// TODO is there a way to find torus points without solving general degree 4 equation
// TODO? separate bounding box-type for torus
cgl3dTorusShaderCode(direction,layer):=(
  regional(center,radius1,radius2,v,V,vc,b0,c0,D0,x0,x1,
    orientation,b1,c1,E,W,a2,b2,c2,p3,p2,p1,p0,dst,pos3d,pc,
    arcDirection,arcCenter,normal,color,pixelPos);
  // compute torus coordinates from cylinder bounding box arguments
  //   reduces number of needed uniforms
  center = (cglPointA+cglPointB)/2;
  radius1 = radii_1;
  radius2 = radii_2;
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
  orientation = normalize(cglPointA-cglPointB);
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
  cglSetDepth(v+dst);
  pixelPos = cglProjTorusToSquare(normal,arcDirection,orientation);
  color = cglEval(pixelExpr,pixelPos);
  cglEval(light,color,direction,normal);
);

cglDrawTorus(center,orientation,radius1,radius2,color,angle1range,angle2range):=(
  regional(light,colAndModifs,modifiers,drawBack,colorExpr,ids,topLayer);
  orientation=normalize(orientation);
  drawBack = if(isundefined(cglDrawBack),length(color)==4,cglDrawBack);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  colAndModifs = cglColorExpression(color,modifiers);
  colorExpr = colAndModifs_1;
  modifiers = colAndModifs_2;
  if(length(angle1range)>0,
    modifiers = modifiers ++ [
      ["baseColor",colorExpr],
      ["cglTorusAngles1",[angle1range_1,angle1range_2]/(2*pi)]
    ];
    if(length(angle2range)>0,
    modifiers = modifiers ++ [["cglTorusAngles2",[angle2range_1,angle2range_2]/(2*pi)]];
      colorExpr = cglLazy(texPos,
        if(texPos_1 < cglTorusAngles1_1 % texPos_1 > cglTorusAngles1_2,cglDiscard());
        if(texPos_2 < cglTorusAngles2_1 % texPos_2 > cglTorusAngles2_2,cglDiscard());
        cglEval(baseColor,texPos);
      );
    ,
      colorExpr = cglLazy(texPos,
        if(texPos_1 < cglTorusAngles1_1 % texPos_1 > cglTorusAngles1_2,cglDiscard());
        cglEval(baseColor,texPos);
      );
    );
  ,if(length(angle2range)>0,
    modifiers = modifiers ++ [
      ["baseColor",colorExpr],
      ["cglTorusAngles2",[angle2range_1,angle2range_2]/(2*pi)]
    ];
    colorExpr = cglLazy(texPos,
      if(texPos_2 < cglTorusAngles2_1 % texPos_2 > cglTorusAngles2_2,cglDiscard());
      cglEval(baseColor,texPos);
    );
  ));
  if(drawBack,
    // TODO? is it possible to use loop while keeping layerId parameter constant
    [colorplot3d(cgl3dTorusShaderCode(#,4),
      center+radius2*orientation, center-radius2*orientation, radius1+radius2,
      Uradii->[radius1,radius2], UpixelExpr->colorExpr,
      Ulight->light,plotModifiers->modifiers,tags->["torus","backside"]++tags),
    colorplot3d(cgl3dTorusShaderCode(#,3),
      center+radius2*orientation, center-radius2*orientation, radius1+radius2,
      Uradii->[radius1,radius2], UpixelExpr->colorExpr,
      Ulight->light,plotModifiers->modifiers,tags->["torus","backside"]++tags),
    colorplot3d(cgl3dTorusShaderCode(#,2),
      center+radius2*orientation, center-radius2*orientation, radius1+radius2,
      Uradii->[radius1,radius2], UpixelExpr->colorExpr,
      Ulight->light,plotModifiers->modifiers,tags->["torus","backside"]++tags)];
  );
  topLayer = colorplot3d(cgl3dTorusShaderCode(#,1),
    center+radius2*orientation, center-radius2*orientation, radius1+radius2,
    Uradii->[radius1,radius2], UpixelExpr->colorExpr,
    Ulight->light,plotModifiers->modifiers,tags->["torus"]++tags);
  if(drawBack,cglRememberLayers(append(ids,topLayer)),[topLayer]);
);
cglDrawTorus(center,orientation,radius1,radius2,color):=(
  regional(light,modifiers,drawBack);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  drawBack = if(isundefined(cglDrawBack),length(color)==4,cglDrawBack);
  cglDrawTorus(center,orientation,radius1,radius2,color,[],[],
    Ulight->light,plotModifiers->modifiers,cglDrawBack->drawBack);
);
torus(center,orientation,radius1,radius2,color):=(
  regional(light,modifiers,drawBack);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  drawBack = if(isundefined(cglDrawBack),length(color)==4,cglDrawBack);
  cglDrawTorus(center,orientation,radius1,radius2,color,[],[],
    Ulight->light,plotModifiers->modifiers,cglDrawBack->drawBack);
);
colorplotTorus(center,orientation,radius1,radius2,pixelExpr):=(
  regional(light,modifiers,drawBack);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  drawBack = if(isundefined(cglDrawBack),length(color)==4,cglDrawBack);
  cglDrawTorus(center,orientation,radius1,radius2,pixelExpr,[],[],
    Ulight->light,plotModifiers->modifiers,cglDrawBack->drawBack);
);
torusArc(center,orientation,radius1,radius2,color,from,to):=(
  regional(light,modifiers,drawBack);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  drawBack = if(isundefined(cglDrawBack),true,cglDrawBack);
  cglDrawTorus(center,orientation,radius1,radius2,color,[from,to],[],
    Ulight->light,plotModifiers->modifiers,cglDrawBack->drawBack);
);
colorplotArc(center,orientation,radius1,radius2,pixelExpr,from,to):=(
  regional(light,modifiers,drawBack);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  drawBack = if(isundefined(cglDrawBack),true,cglDrawBack);
  cglDrawTorus(center,orientation,radius1,radius2,pixelExpr,[from,to],[],
    Ulight->light,plotModifiers->modifiers,cglDrawBack->drawBack);
);

// get intersections of view-ray with cobius given by center point and (scaled) directions of the three axes
cglCuboidDepths(direction,center,up,left,front):=(
  regional(relCenter,l1,l2,l1t,l2t,d1,d2,d);
  relCenter = center-cglViewPos;
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

// general degree 1 surfaces
// TODO render planes within a given bounding box

// general degree 2 surfaces
cgl3dQuadricShaderCode(direction,isBack):=(
  regional(depths,v4,d4,a,b,c,b2,D,r,dst,pos4,n4,normal,color);
  // discard points outside bounding sphere
  depths = cglEval(cglCutoffRegion,direction);
  v4 = [cglViewPos_1,cglViewPos_2,cglViewPos_3,1];
  d4 = [direction_1,direction_2,direction_3,0];
  a = d4*(cglCoeffMat*d4);
  b = v4*(cglCoeffMat*d4);
  c = v4*(cglCoeffMat*v4);
  D = b*b - a*c;
  if(D<0,cglDiscard());
  b2 = -b/a;
  r = re(sqrt(D))/abs(a);
  dst = b2-r;
  if(dst > depths_2,cglDiscard());
  if(dst < depths_1,
    if(isBack,cglDiscard());
    dst = b2+r;
    if(dst < depths_1 % dst > depths_2,cglDiscard());
  ,if(isBack,
    dst = b2+r;
    if(dst < depths_1 % dst > depths_2,cglDiscard());
  ));
  pos4 = v4 + dst*d4;
  // compute normal vector
  n4 = cglCoeffMat * pos4;
  normal = normalize((n4_1,n4_2,n4_3));
  // TODO? map surface to 2D space
  color = cglEval(pixelExpr,(pos4_1,pos4_2,pos4_3));
  cglSetDepth(dst);
  cglEval(light,color,direction,normal);
);
cglDrawQuadricInSphere(matrix,center,radius,color):=(
  regional(light,colAndModifs,modifiers,drawBack,ids,topLayer,cutoff);
  drawBack = if(isundefined(cglDrawBack),length(color)==4,cglDrawBack);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  cutoff = cglLazy(direction,cglSphereDepths(direction,cglCenter,cglRadius));
  colAndModifs = cglColorExpression(color,modifiers);
  if(drawBack,
    ids = [colorplot3d(cgl3dQuadricShaderCode(#,true),center,radius,
      UpixelExpr->colAndModifs_1,UcglCoeffMat->matrix,Ulight->light,UcglCutoffRegion->cutoff,
      plotModifiers->colAndModifs_2,tags->["quadric","backside"]++tags)];
  );
  topLayer = colorplot3d(cgl3dQuadricShaderCode(#,false),center,radius,
    UpixelExpr->colAndModifs_1,UcglCoeffMat->matrix,Ulight->light,UcglCutoffRegion->cutoff,
    plotModifiers->colAndModifs_2,tags->["quadric"]++tags);
  if(drawBack,cglRememberLayers(append(ids,topLayer)),[topLayer]);
);
cglDrawQuadricInCylinder(matrix,pointA,pointB,radius,color):=(
  regional(light,colAndModifs,modifiers,drawBack,ids,topLayer,cutoff);
  drawBack = if(isundefined(cglDrawBack),length(color)==4,cglDrawBack);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  cutoff = cglLazy(direction,cglCappedCylinderDepths(direction));
  colAndModifs = cglColorExpression(color,modifiers);
  if(drawBack,
    ids = [colorplot3d(cgl3dQuadricShaderCode(#,true),pointA,pointB,radius,
      UpixelExpr->colAndModifs_1,UcglCoeffMat->matrix,Ulight->light,UcglCutoffRegion->cutoff,
      plotModifiers->colAndModifs_2,tags->["quadric","backside"]++tags)];
  );
  topLayer = colorplot3d(cgl3dQuadricShaderCode(#,false),pointA,pointB,radius,
    UpixelExpr->colAndModifs_1,UcglCoeffMat->matrix,Ulight->light,UcglCutoffRegion->cutoff,
    plotModifiers->colAndModifs_2,tags->["quadric"]++tags);
  if(drawBack,cglRememberLayers(append(ids,topLayer)),[topLayer]);
);
cglDrawQuadricInCube(matrix,center,sideLength,color):=(
  regional(radius,light,colAndModifs,modifiers,drawBack,ids,topLayer,cutoff);
  radius = sqrt(3)*sideLength;
  drawBack = if(isundefined(cglDrawBack),length(color)==4,cglDrawBack);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  cutoff = cglLazy(direction,s=cglRadius/sqrt(3);cglCuboidDepths(direction,cglCenter,[s,0,0],[0,s,0],[0,0,s]));
  colAndModifs = cglColorExpression(color,modifiers);
  if(drawBack,
    ids = [colorplot3d(cgl3dQuadricShaderCode(#,true),center,radius,
      UpixelExpr->colAndModifs_1,UcglCoeffMat->matrix,Ulight->light,UcglCutoffRegion->cutoff,
      plotModifiers->colAndModifs_2,tags->["quadric","backside"]++tags)];
  );
  topLayer = colorplot3d(cgl3dQuadricShaderCode(#,false),center,radius,
    UpixelExpr->colAndModifs_1,UcglCoeffMat->matrix,Ulight->light,UcglCutoffRegion->cutoff,
    plotModifiers->colAndModifs_2,tags->["quadric"]++tags);
  if(drawBack,cglRememberLayers(append(ids,topLayer)),[topLayer]);
);
// TODO? use more general cuboi as bounding box

quadric(matrix,center,radius,color):=(
  regional(light,modifiers,drawBack);
  drawBack = if(isundefined(cglDrawBack),length(color)==4,cglDrawBack);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  cglDrawQuadricInSphere(matrix,center,radius,color,Ulight->light,plotModifiers->modifiers,cglDrawBack->drawBack);
);
quadric(matrix,pointA,pointB,radius,color):=(
  regional(light,modifiers,drawBack);
  drawBack = if(isundefined(cglDrawBack),length(color)==4,cglDrawBack);
  modifiers = if(isundefined(plotModifiers),[],plotModifiers);
  light = if(isundefined(Ulight),cglDefaultLight,Ulight);
  cglDrawQuadricInCylinder(matrix,pointA,pointB,radius,color,Ulight->light,plotModifiers->modifiers,cglDrawBack->drawBack);
);

// cubic surfaces

// TODO general degree 3,4 surfaces
// general surfaces

