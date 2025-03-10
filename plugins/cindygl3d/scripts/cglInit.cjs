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
  if(D4<0,
    cglDepth = -1;
    [0,0,0],
    dst=-b2-re(sqrt(D4));// sqrt should always be real
    pos3d = cglViewPos+ dst*direction;
    cglDepth = dst/(2*|cglViewPos|);
    normal = normalize(pos3d - center);
    [normal_1,normal_2,normal_3]
  )
);
sphere(center,radius,color):=(
  // TODO multiple versions (transparency, color, shading)
  cgl3dSphereShaderCode(direction):=(
    regional(normal,brigthness,color);
    normal = cglSphereNormalAndDepth(direction,cglCenter);
    if(cglDepth<0,
      cglDepth = 2;
      [0,0,0,0], // TODO find way to use glsl `dicard;` built-in
      brigthness = 0.25+0.75*max(-direction*normal,0); // 0.25 ... 1.0
      color = brigthness*cglColor;
      [color_1,color_2,color_3,2]
    )
  );
  colorplot3d(cgl3dSphereShaderCode(#),center,radius,cglColor->color,tags->["sphere"]);
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
    r = re(sqrt(D));
    if(D<0,
      cglDepth = -1;
      (0,0),
      (w - (b + r)/a,
        w - (b - r)/a);
    )
);
cylinder(pointA,pointB,radius,colorA,colorB):=(
  // TODO multiple versions (skip-back, end-cap style, transparency, color, shading)
  cgl3dCylinderShaderCode(direction):=(
    regional(l,v1,delta1,brigthness,color,v2,delta2,BA,U);
    l = cglCylinderDepths(direction);
    BA = cglPointB-cglPointA;
    U = BA/(BA*BA);
    if(cglDepth<0,
      cglDepth = 2;
      [0,0,0,0],
      v1 = (cglViewPos+l_1*direction)-cglPointA;
      delta1 = (v1*U);
      if((delta1>0)& (delta1<1),
        // v1 = X -A
        // normal = X - (B*delta1 + A*(1-delta1))
        //     = v1 - (B-A)*delta1
        brigthness = 0.25+0.75*max(-direction*normalize(v1-delta1*BA),0); // 0.25 ... 1.0
        color = brigthness*((cglColorB*delta1+cglColorA*(1-delta1)));
        cglDepth = (l_1)/(2*|cglViewPos|);
        [color_1,color_2,color_3,1], // TODO? version without back face
        v2 = (cglViewPos+l_2*direction)-cglPointA;
        delta2 = v2*U;
        if((delta2>0) & (delta2<1),
          brigthness = 0.25+.5*max(direction*normalize(v2-delta2*BA),0);
          color = brigthness*((cglColorB*delta2+cglColorA*(1-delta2)));
          cglDepth = (l_2)/(2*|cglViewPos|);
          [color_1,color_2,color_3,1],
          cglDepth = 2;
          [0,0,0,0]
        )
      )
    )
  );
  colorplot3d(cgl3dCylinderShaderCode(#),pointA,pointB,radius,
    cglColorA->colorA,cglColorB->colorB,tags->["cylinder"]);
);
// cylinder with spherical end caps
rod(pointA,pointB,radius,colorA,colorB):=(
  cgl3dRodShaderCode(direction):=(
    regional(l,v,BA,delta,center,normal,brigthness,color);
    l = cglCylinderDepths(direction);
    if(cglDepth<0,
      cglDepth = 2;
      [0,0,0,0],
      v = (cglViewPos+l_1*direction)-cglPointA;
      BA = cglPointB-cglPointA;
      delta = (v*BA)/(BA*BA);
      delta = max(0,min(delta,1));
      center = delta*cglPointB+(1-delta)*cglPointA;
      normal=cglSphereNormalAndDepth(direction,center);
      if(cglDepth<0,
        cglDepth = 2;
        [0,0,0,0],
        brigthness = 0.6 - 0.4*direction*normal; // 0.2 ... 1.0
        color = brigthness*((cglColorB*delta+cglColorA*(1-delta)));
        [color_1,color_2,color_3,1]
      )
    )
  );
  colorplot3d(cgl3dRodShaderCode(#),pointA,pointB,radius,
    cglColorA->colorA,cglColorB->colorB,tags->["rod"]);
);
torus(center,orientation,radius1,radius2,color):=(
  regional(v1,v2,N,alpha0glob,alpha1glob,fromAngle,toAngle,p0,p1);
  // set alpha0, alpha1 to global value
  // if no value is given set them to 0 and 2pi
  if(isundefined(alpha0),alpha0glob=0,alpha0glob=alpha0);
  if(isundefined(alpha1),alpha1glob=2*pi,alpha1glob=alpha1);
  regional(alpha0,alpha1);
  alpha0=alpha0glob;
  alpha1=alpha1glob;
  // create local coordinate system of torus
  orientation=normalize(orientation);
  // TODO? make v1 a parameter
  if(orientation_1<orientation_2,
    v1=normalize(cross(orientation,(1,0,0)));
  ,
    v1=normalize(cross(orientation,(0,1,0)));
  );
  v2 = normalize(cross(orientation,v1));
  N = max(32,min(floor(abs(alpha1-alpha0)*(radius1/radius2)),128));
  cgl3dArcRodShaderCode(direction):=(
    regional(l,pos3d,radiusDirection,arcDirection,arcCenter,planeOffset,normal,brigthness,color);
    l = cglCylinderDepths(direction);
    if(cglDepth<0,
      cglDepth = 2;
      [0,0,0,0],
      pos3d = (cglViewPos+l_1*direction);
      pc=pos3d-cglTCenter;
      radiusDirection = normalize(pc-(cglTOrientation*pc)*cglTOrientation);
      arcDirection = normalize(cross(radiusDirection,cglTOrientation));
      planeOffset = pos3d*arcDirection;
      // check if A and B are on same side of normal plane to torus through pos3d, add small tolerance to balance out numerical errors
      if(((cglPointA*arcDirection-planeOffset)*(cglPointB*arcDirection-planeOffset))<1e-5,
        arcCenter = cglTCenter+cglTRadius*radiusDirection;
        normal = normalize(pos3d - arcCenter);
        brigthness = 0.25 +0.75*max(-direction*normal,0);
        color = brigthness*cglColor;
        cglDepth = (l_1)/(2*|cglViewPos|);
        [color_1,color_2,color_3,1],
        // TODO add option to ignore inner side (e.g. for drawing closed torus)
        pos3d = (cglViewPos+l_2*direction);
        pc=pos3d-cglTCenter;
        radiusDirection = normalize(pc-(cglTOrientation*pc)*cglTOrientation);
        arcDirection = normalize(cross(radiusDirection,cglTOrientation));
        planeOffset = pos3d*arcDirection;
        if(((cglPointA*arcDirection-planeOffset)*(cglPointB*arcDirection-planeOffset))<1e-5,
          arcCenter = cglTCenter+cglTRadius*radiusDirection;
          normal = normalize(pos3d - arcCenter);
          brigthness = 0.25 +0.5*max(direction*normal,0);
          color = brigthness*cglColor;
          cglDepth = (l_2)/(2*|cglViewPos|);
          [color_1,color_2,color_3,1],
          [0,0,0,0]
        )
      );
    )
  );
  // TODO? add way to group multiple sub-objects into a composite object
  repeat(N,n,
    fromAngle=alpha0+((n-1)/N)*(alpha1-alpha0);
    toAngle=alpha0+(n/N)*(alpha1-alpha0);
    p0 = center + radius1 * (cos(fromAngle)*v1+sin(fromAngle)*v2);
    p1 = center + radius1 * (cos(toAngle)*v1+sin(toAngle)*v2);
    colorplot3d(cgl3dArcRodShaderCode(#),p0,p1,radius2,
      cglTCenter->center,cglTRadius->radius1,cglTOrientation->orientation,cglColor->color,tags->["arc","torus"]);
  );
);
