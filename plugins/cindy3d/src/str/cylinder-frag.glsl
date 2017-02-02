varying vec3 vPoint1;

varying vec3 vPoint2;

varying vec3 vPos;

varying float vRadius;

vec3 endcaps(in float mu, inout vec3 pos) {
  vec3 center;
  if (mu < 0.0) {
    center = vPoint1;
  } else if (mu > 1.0) {
    center = vPoint2;
  } else {
    return (1.0 - mu)*vPoint1 + mu*vPoint2;
  }
  pos = sphere(vPos, center, vRadius, -1.0);
  return center;
}

// ----------------------------------------------------------------------------
// Fragment shader for cylinder rendering
// ----------------------------------------------------------------------------
void main() {
  gColor = vColor;

  /* A point P lies on the infinite cylinder around axis AB with radius r iff
   * |(P-A) - ⟨P-A,B-A⟩/⟨B-A,B-A⟩*(B-A)| = r
   * writing BA for B-A
   * |P - A - ⟨P - A,BA⟩/⟨BA,BA⟩*BA| = r
   * with P = λD
   * |λD - A - ⟨λD - A,BA⟩/⟨BA,BA⟩*BA| = r
   * |λ(D - ⟨D,BA⟩/⟨BA,BA⟩*BA) - A + ⟨A,BA⟩/⟨BA,BA⟩*BA| = r
   * writing U = BA/⟨BA,BA⟩
   * |λ(D - ⟨D,BA⟩*U) + (⟨A,BA⟩*U - A)| = r
   * writing V = (D - ⟨D,BA⟩*U) and W = (⟨A,BA⟩*U - A)
   * |λV + W| = r
   * |λV + W|² = r²
   * ⟨λV + W,λV + W⟩ = r²
   * λ²⟨V,V⟩ + 2λ⟨V,W⟩ + ⟨W,W⟩ - r² = 0
   */

  vec3 ba = vPoint2 - vPoint1;
  vec3 u = ba/dot(ba, ba);
  vec3 v = vPos - dot(vPos, ba)*u;
  vec3 w = dot(vPoint1, ba)*u - vPoint1;
  float a = dot(v, v);
  float b = 2.0 * dot(v, w);
  float c = dot(w, w) - vRadius*vRadius;
  float d = b*b - 4.0*a*c;
  if (d < 0.0)
    discard;
  float lambda = (b + sqrt(d))/(-2.0*a);
  vec3 pointOnSurface = lambda*vPos;
  float mu = dot(pointOnSurface - vPoint1, u);
  vec3 center = endcaps(mu, pointOnSurface);
  vec3 normal = normalize(pointOnSurface - center);
  finish(pointOnSurface, normal);
}
