// cindyscript source for drawing elementary geometric objects in CindyGL3D
// TODO is this the correct file extension

// collection of CindyScript code for drawing elementary shapes with CindyGL3D
normalize(v):=(v/|v|); // TODO? make built-in

// TODO merge common code
cglSphereNormalAndDepth(direction,center):=(
  regional(vc,b2,c,D4,dst,pos3d,normal);
  // |v+l*d -c|=r
  vc=cglViewPos-center;
  // -> l*l <d,d> + l * 2<v-c,d> + <v-c,v-c> - r*r
  b2=(vc*direction); // 1/2 * b
  c=vc*vc-cglRadius*cglRadius;
  D4=b2*b2-c; // 1/4* ( b*b - 4 *a*c)
  if(D4<0,cglDiscard()); // discard rays that do not intersect the sphere
  dst=-b2-re(sqrt(D4));// sqrt should always be real
  pos3d = cglViewPos+ dst*direction;
  cglDepth = dst/(2*|cglViewPos|);
  normal = normalize(pos3d - center);
  [normal_1,normal_2,normal_3]
);
cglSphereDepths(direction,center):=(
  regional(vc,b2,c,D4,r);
  // |v+l*d -c|=r
  vc=cglViewPos-center;
  // -> l*l <d,d> + l * 2<v-c,d> + <v-c,v-c> - r*r
  b2=(vc*direction); // 1/2 * b
  c=vc*vc-cglRadius*cglRadius;
  D4=b2*b2-c; // 1/4* ( b*b - 4 *a*c)
  if(D4<0,cglDiscard()); // discard rays that do not intersect the sphere
  r=re(sqrt(D4)); // sqrt should always be real
  (-b2-r,-b2+r)
);
// stereographic projection from sphere onto C using normal verctor as input
// assumes normal is normalized
cglProjSphereToC(normal):=(
  // A = l (x,y,z) + (1-l) (0,0,1)
  // 0 = l z + (1-l) = 1 + l (z-1) -> l = 1 / (1-z)
  (normal_1)/(1-normal_3) + i* (normal_2)/(1-normal_3)
);
// project sphere onto unit square using normal as input
// 1. convert position into two angles
// 2. map angles onto square
// assumes that normal is normalized
cglProjSphereToSquare(normal):=(
  regional(phi,theta);
  phi = arctan2(-normal_3,normal_1); // (-pi, pi]
  theta = arctan2(|(normal_1,normal_3)|,normal_2); // (-pi, pi]
  (1/(2*pi))*(phi+pi,2*theta+pi)
);
cgl3dSphereShaderCode(direction):=(
  regional(normal,texturePos,color,brigthness);
  normal = cglSphereNormalAndDepth(direction,cglCenter);
  texturePos = cglEval(projection,normal);
  color = cglEval(pixelExpr,texturePos);
  brigthness = 0.25+0.75*max(-direction*normal,0); // 0.25 ... 1.0
  brigthness*color
);
// TODO multiple versions (transparency, color, shading)
sphere(center,radius,color):=(
  regional(pixelExpr,projection);
  pixelExpr=cglLazy(pos,color);
  projection=cglLazy(normal,0); // position does not matter
  colorplot3d(cgl3dSphereShaderCode(#),center,radius,
    UpixelExpr->pixelExpr,Uprojection->projection,Ucolor->color,tags->["sphere"]);
);
// creates a sphere with the given center and radius
// the colors on the surface are defined using the lazy function `pixelExpr` (<pos>)-> <color>
// where the position is computed from the normal vector using the lazy function `projection`
colorplotSphere(center,radius,pixelExpr,projection):=(
  colorplot3d(cgl3dSphereShaderCode(#),center,radius,
    UpixelExpr->pixelExpr,Uprojection->projection,tags->["sphere"]);
);
// creates a sphere with the given center and radius
// the colors on the surface are defined using the lazy function `pixelExpr` (<z>)-> <color>
// where z is a complex number obtained using the stereographic projection from the sphere to CP1
colorplotSphere(center,radius,pixelExpr):=(
  colorplotSphere(center,radius,pixelExpr,cglLazy(normal,cglProjSphereToSquare(normal)));
);
// creates a sphere with the given center and radius
// the colors on the surface are defined using the lazy function `pixelExpr` (<x>,<y>)-> <color>
// where x,y are given in the range [0,1]
colorplotSphereC(center,radius,pixelExpr):=(
  colorplotSphere(center,radius,pixelExpr,cglLazy(normal,cglProjSphereC(normal)));
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
// returns (...normal, heigth)
cgl3dCylinderNormalAndHeigth(direction):=(
  regional(l,BA,U,v1,delta1,v2,delta2,normal);
  l = cglCylinderDepths(direction);
  BA = cglPointB-cglPointA;
  U = BA/(BA*BA);
  v1 = (cglViewPos+l_1*direction)-cglPointA;
  delta1 = (v1*U);
  if((delta1>0)& (delta1<1),
    cglDepth = (l_1)/(2*|cglViewPos|);
    normal = normalize(v1-delta1*BA);
    (normal_1,normal_2,normal_3,delta1),
    v2 = (cglViewPos+l_2*direction)-cglPointA;
    delta2 = v2*U;
    if((delta2<0) % (delta2>1),cglDiscard());
    cglDepth = (l_2)/(2*|cglViewPos|);
    normal = normalize(v2-delta2*BA);
    (normal_1,normal_2,normal_3,delta2)
  );
);
// project cylinder onto unit square using normal and heigth as input
// assumes that normal is normalized, and heigth is between 0 and 1
cglProjCylinderToSquare(normal,heigth,orientation):=(
  regional(d1,d2);
  if(orientation_1<orientation_2,
    d1=normalize(cross(orientation,(1,0,0)));
  ,
    d1=normalize(cross(orientation,(0,1,0)));
  );
  d2 = -normalize(cross(orientation,d1));
  ((arctan2(d1*normal,d2*normal)+pi)/(2*pi),heigth)
);
cgl3dCylinderShaderCode(direction):=(
  regional(normalAndHeigth,normal,texturePos,color,brigthness);
  normalAndHeigth=cgl3dCylinderNormalAndHeigth(direction);
  normal = (normalAndHeigth_1,normalAndHeigth_2,normalAndHeigth_3);
  texturePos = cglProjCylinderToSquare(normal,normalAndHeigth_4,cglPointB-cglPointA);
  color = cglEval(pixelExpr,texturePos);
  brigthness = direction*normal;
  // normal towards view -> .75*brigthness  ; normal away from view -> .45 * brigthness
  brigthness = 0.25+0.6*abs(brigthness)-0.15*brigthness;
  brigthness*color
);
// TODO multiple versions of cylinder (skip-back, end-cap style, transparency, color, shading)
cylinder(pointA,pointB,radius,colorA,colorB):=(
  regional(pixelExpr);
  pixelExpr = cglLazy(pos,(pos_2)*colorB + (1-pos_2)*colorA);
  colorplot3d(cgl3dCylinderShaderCode(#),pointA,pointB,radius,
    UpixelExpr->pixelExpr,UcolorA->colorA,UcolorB->colorB,tags->["cylinder"]);
);
// creates a cylinder with the given endpoints and radius
// the colors on the surface are defined using the lazy function `pixelExpr` (<x>,<y>)-> <color>
// where x,y are given in the range [0,1]
colorplotCylinder(pointA,pointB,radius,pixelExpr):=(
  colorplot3d(cgl3dCylinderShaderCode(#),pointA,pointB,radius,UpixelExpr->pixelExpr,tags->["cylinder"]);
);
// cylinder with spherical end caps
rod(pointA,pointB,radius,colorA,colorB):=(
  cgl3dRodShaderCode(direction):=(
    regional(l,v,BA,delta,center,normal,brigthness);
    // TODO? extract rodNormalAndDepth
    l = cglCylinderDepths(direction);
    v = (cglViewPos+l_1*direction)-cglPointA;
    BA = cglPointB-cglPointA;
    delta = (v*BA)/(BA*BA);
    delta = max(0,min(delta,1));
    center = delta*cglPointB+(1-delta)*cglPointA;
    normal=cglSphereNormalAndDepth(direction,center);
    brigthness = 0.6 - 0.4*direction*normal; // 0.2 ... 1.0
    brigthness*((colorB*delta+colorA*(1-delta)))
  );
  colorplot3d(cgl3dRodShaderCode(#),pointA,pointB,radius,
    UcolorA->colorA,UcolorB->colorB,tags->["rod"]);
);

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
    cglDepth = (l_1)/(2*|cglViewPos|);
    arcCenter = tCenter+tRadius*radiusDirection;
    normal = normalize(pos3d - arcCenter),
    // TODO add option to ignore inner side (e.g. for drawing closed torus)
    pos3d = (cglViewPos+l_2*direction);
    pc=pos3d-tCenter;
    radiusDirection = normalize(pc-(tOrientation*pc)*tOrientation);
    arcDirection = normalize(cross(radiusDirection,tOrientation));
    planeOffset = pos3d*arcDirection;
    if(((cglPointA*arcDirection-planeOffset)*(cglPointB*arcDirection-planeOffset))>1e-5,cglDiscard());
    cglDepth = (l_2)/(2*|cglViewPos|);
    arcCenter = tCenter+tRadius*radiusDirection;
    normal = normalize(pos3d - arcCenter);
  );
  (normal,radiusDirection)
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
  N = max(32,min(floor(abs(alpha1-alpha0)*(radius1/radius2)),128));
  apply(0..N,n,
    alpha = alpha0+(n/N)*(alpha1-alpha0);
    center + radius1 * (cos(alpha)*v1+sin(alpha)*v2);
  );
);

cgl3dArcRodShaderCode(direction):=(
  regional(normalAndDir,normal,texturePos,color,brigthness);
  normalAndDir = cgl3dArcRodNormalAndRadius(direction);
  normal = normalAndDir_1;
  texturePos = cglProjTorusToSquare(normal,normalAndDir_2,tOrientation);
  color = cglEval(pixelExpr,texturePos);
  brigthness = direction*normal;
  // normal towards view -> .75*brigthness  ; normal away from view -> .45 * brigthness
  brigthness = 0.25+0.6*abs(brigthness)-0.15*brigthness;
  brigthness*color
);
torus(center,orientation,radius1,radius2,color):=(
  regional(points,pixelExpr);
  points = cglTorusSegments(center,orientation,radius1,radius2);
  pixelExpr = cglLazy(pos,color);
  // TODO? add way to group multiple sub-objects into a composite object
  forall(consecutive(points),arcEnds,
    colorplot3d(cgl3dArcRodShaderCode(#),arcEnds_1,arcEnds_2,radius2,
      UtCenter->center,UtRadius->radius1,UtOrientation->orientation,
      Ucolor->color,UpixelExpr->pixelExpr,tags->["arc","torus"]);
  );
);
// creates a torus with the given center pointing in the given orientation, with outer radius radius1 and inner radius radius1
// the colors on the surface are defined using the lazy function `pixelExpr` (<x>,<y>)-> <color>
// where x,y are given in the range [0,1]
colorplotTorus(center,orientation,radius1,radius2,pixelExpr):=(
  regional(points);
  points = cglTorusSegments(center,orientation,radius1,radius2);
  forall(consecutive(points),arcEnds,
    colorplot3d(cgl3dArcRodShaderCode(#),arcEnds_1,arcEnds_2,radius2,
      UtCenter->center,UtRadius->radius1,UtOrientation->orientation,
      UpixelExpr->pixelExpr,tags->["arc","torus"]);
  );
);
