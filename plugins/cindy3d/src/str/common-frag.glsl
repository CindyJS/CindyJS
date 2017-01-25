uniform mat4 uProjectionMatrix;

vec3 sphere(in vec3 ray, in vec3 center, in float radius, in float face) {
  // Vector from eye point to surface position
  vec3 dir = normalize(ray);

  /* A point P on the sphere with center C satisfies the following equation:
   * |P-C|=r  ⇔  |P-C|²=r²  ⇔  ⟨P-C,P-C⟩=r²  ⇔  ⟨P,P⟩-2⟨P,C⟩+⟨C,C⟩=r²
   * With P=λD this becomes λ²⟨D,D⟩ - 2λ⟨D,C⟩ + ⟨C,C⟩-r² = 0
   * but since D is normalized, ⟨D,D⟩=1. We solve that equation using
   * λ = (⟨D,C⟩ ± sqrt(⟨D,C⟩² - (⟨C,C⟩ - r²)))
   */

  // Compute intersection with sphere
  float b = dot(center, dir);
  float c = dot(center, center) - radius*radius;
  float d = b*b - c;
  if (d < 0.0) discard;
  float lambda = b + face*sqrt(d);
  if (lambda < 0.0) discard;

  // Compute point on sphere
  return lambda * dir;
}

void finish(in vec3 pos, in vec3 normal) {
  shade(pos, normal);
#ifdef GL_EXT_frag_depth
  vec4 projPoint = uProjectionMatrix * vec4(pos, 1);
  gl_FragDepthEXT = (projPoint.z / projPoint.w + 1.0) / 2.0;
#endif
}
