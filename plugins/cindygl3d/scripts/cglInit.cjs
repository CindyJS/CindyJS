// cindyscript source for drawing elementary geometric objects in CindyGL3D
// TODO is this the correct file extension

// collection of CindyScript code for drawing elementary shapes with CindyGL3D
normalize(v):=(v/|v|); // TODO? make built-in

cglSphereNormalAndDepth(direction):=(
  // |v+l*d -c|=r
  vc=cglViewPos-cglCenter;
  // -> l*l <d,d> + l * 2<v-c,d> + <v-c,v-c> - r*r
  b2=(vc*direction); // 1/2 * b
  c=vc*vc-cglRadius*cglRadius;
  D4=b2*b2-c; // 1/4* ( b*b - 4 *a*c)
  if(D4<0,
    [0,0,0,2],
    dst=-b2-re(sqrt(D4));// sqrt should always be real
    pos3d = cglViewPos+ dst*direction;
    normal = normalize(pos3d - cglCenter);
    [normal_1,normal_2,normal_3,dst]
  )
);
sphere(center,radius,color):=(
  // TODO multiple versions (transparency, color, shading)
  cgl3dSphereShaderCode(direction):=(
    // |v+l*d -c|=r
    vc=cglViewPos-cglCenter;
    // -> l*l <d,d> + l * 2<v-c,d> + <v-c,v-c> - r*r
    b2=(vc*direction); // 1/2 * b
    c=vc*vc-cglRadius*cglRadius;
    D4=b2*b2-c; // 1/4* ( b*b - 4 *a*c)
    if(D4<0,
      [0,0,0,0],
      dst=-b2-re(sqrt(D4));// sqrt should always be real
      pos3d = cglViewPos+ dst*direction;
      normal = normalize(pos3d - cglCenter);
      brigthness = 0.25+0.75*max(-direction*normal,0); // 0.25 ... 1.0
      color = brigthness*cglColor;
      cglDepth = dst/(2*|cglViewPos|);
      [color_1,color_2,color_3,1]
    )
  );
  colorplot3d(cgl3dSphereShaderCode(#),center,radius,cglColor->color,tags->["sphere"]);
);
cylinder(pointA,pointB,radius,colorA,colorB):=(
  // TODO multiple versions (skip-back, end-cap style, transparency, color, shading)
  cgl3dCylinderShaderCode(direction):=(
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
    BA=cglPointB-cglPointA;
    U=BA/(BA*BA);
    VA = (W-cglPointA);
    S = VA - (VA*BA)*U;
    T = direction - (direction*BA)*U;
    a = T*T;
    b = S*T;
    c = S*S -cglRadius*cglRadius;
    D= b*b-a*c;
    if(D<0,
      [0,0,0,0],
      l1 = -(b + re(sqrt(D)))/a;
      v1 = (W+l1*direction)-cglPointA;
      delta1 = (v1*U);
      if((delta1>0)& (delta1<1),
        // v1 = X -A
        // normal = X - (B*delta1 + A*(1-delta1))
        //     = v1 - (B-A)*delta1
        brigthness = 0.25+0.75*max(-direction*normalize(v1-delta1*BA),0); // 0.25 ... 1.0
        color = brigthness*((cglColorB*delta1+cglColorA*(1-delta1)));
        cglDepth = (w+l1)/(2*|cglViewPos|);
        [color_1,color_2,color_3,1], // TODO? version without back face
        l2 = (-b + re(sqrt(D)))/a;
        v2 = (W+l2*direction)-cglPointA;
        delta2 = v2*U;
        if((delta2>0) & (delta2<1),
          brigthness = .25+.5*max(direction*normalize(v2-delta2*BA),0);
          color = brigthness*((cglColorB*delta2+cglColorA*(1-delta2)));
          cglDepth = (l2+w)/(2*|cglViewPos|);
          [color_1,color_2,color_3,1],
          [0,0,0,0]
        )
      )
    )
  );
  colorplot3d(cgl3dCylinderShaderCode(#),pointA,pointB,radius,
    cglColorA->colorA,cglColorB->colorB,tags->["cylinder"]);
);
// cylinder with spherical end caps
rod(pointA,pointB,radius,colorA,colorB):=( // XXX find good name for shape
  cgl3dRodShaderCode(direction):=(
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
    BA=cglPointB-cglPointA;
    U=BA/(BA*BA);
    VA = (W-cglPointA);
    S = VA - (VA*BA)*U;
    T = direction - (direction*BA)*U;
    a = T*T;
    b = S*T;
    c = S*S -cglRadius*cglRadius;
    D= b*b-a*c;
    if(D<0,
      [0,0,0,0],
      l1 = -(b + re(sqrt(D)))/a;
      v1 = (W+l1*direction)-cglPointA;
      delta = (v1*U);
      delta = max(0,min(delta,1));
      center = delta*cglPointB+(1-delta)*cglPointA;
      // |v+l*d -c|=r
      vc=cglViewPos-center;
      // -> l*l <d,d> + l * 2<v-c,d> + <v-c,v-c> - r*r
      b2=(vc*direction);
      c2=vc*vc-cglRadius*cglRadius;
      D4=b2*b2-c2; // b*b - 1*c  ( <d,d> == 1 )
      if(D4<0,
        [0,0,0,0],
        dst=-b2-re(sqrt(D4));// sqrt should always be real
        pos3d = cglViewPos+ dst*direction;
        normal = normalize(pos3d - center);
        brigthness = 0.6 - 0.4*direction*normal; // 0.2 ... 1.0
        color = brigthness*((cglColorB*delta+cglColorA*(1-delta)));
        cglDepth = dst/(2*|cglViewPos|);
        [color_1,color_2,color_3,1]
      )
    )
  );
  colorplot3d(cgl3dRodShaderCode(#),pointA,pointB,radius,
    cglColorA->colorA,cglColorB->colorB);
);
torus(center,orientation,radius1,radius2,color):=(
  regional(v1,v2,N);
  // create local coordinate system of torus
  orientation=normalize(orientation);
  // TODO? make v1 a parameter
  if(orientation_1<orientation_2,
    v1=normalize(cross(orientation,(1,0,0)));
  ,
    v1=normalize(cross(orientation,(0,1,0)));
  );
  v2 = normalize(cross(orientation,v1));
  alpha0=0; // TODO allow passing starting/end-angle as modifier
  alpha1=2*pi;
  N = max(32,min(floor(abs(alpha1-alpha0)*(radius1/radius2)),128));
  cgl3dArcRodShaderCode(direction):=(
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
    BA=cglPointB-cglPointA; // TODO handle case where B ≈ A
    U=BA/(BA*BA);
    VA = (W-cglPointA);
    S = VA - (VA*BA)*U;
    T = direction - (direction*BA)*U;
    a = T*T;
    b = S*T;
    c = S*S -cglRadius*cglRadius;
    D= b*b-a*c;
    if(D<0,
      [0,0,0,0],
      l1 = -(b + re(sqrt(D)))/a;
      v1 = (W+l1*direction)-cglPointA;
      delta = (v1*U);
      delta = max(0,min(delta,1));
      center = delta*cglPointB+(1-delta)*cglPointA;
      // |v+l*d -c|=r
      vc=cglViewPos-center;
      // -> l*l <d,d> + l * 2<v-c,d> + <v-c,v-c> - r*r
      b2=(vc*direction);
      c2=vc*vc-cglRadius*cglRadius;
      D4=b2*b2-c2; // b*b - 1*c  ( <d,d> == 1 )
      if(D4<0,
        [0,0,0,0],
        dst=-b2-re(sqrt(D4));// sqrt should always be real
        pos3d = cglViewPos+ dst*direction;
        pc=pos3d-cglTCenter;
        arcDirection = normalize(pc-(cglTOrientation*pc)*cglTOrientation);
        arcCenter = cglTCenter+cglTRadius*arcDirection;
        normal = normalize(pos3d - arcCenter);
        brigthness = 0.25 +0.75*max(-direction*normal,0);
        color = brigthness*cglColor;
        cglDepth = dst/(2*|cglViewPos|);
        [color_1,color_2,color_3,1]
      )
    )
  );
  // TODO? add way to group multiple sub-objects into a composite object
  repeat(N,n,
    fromAngle=alpha0+((n-1)/N)*(alpha1-alpha0);
    toAngle=alpha0+(n/N)*(alpha1-alpha0);
    p0 = center + radius1 * (cos(fromAngle)*v1+sin(fromAngle)*v2);
    p1 = center + radius1 * (cos(toAngle)*v1+sin(toAngle)*v2);
    colorplot3d(cgl3dArcRodShaderCode(#),p0,p1,radius2,
      cglTCenter->center,cglTRadius->radius1,cglTOrientation->orientation,cglColor->color);
  );
);
