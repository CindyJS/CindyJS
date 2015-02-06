uniform mat4 uProjectionMatrix;

// Sphere mode: -1 = front, +1 = back
uniform float sphereMode;

// Surface position in view space
varying vec3 vViewSpacePos;

varying vec3 vViewSpaceCenter;

varying float vRadius;

// ----------------------------------------------------------------------------
// Fragment shader for sphere rendering
// ----------------------------------------------------------------------------
void main() {
  // Vector from eye point to surface position
  vec3 dir = normalize(vViewSpacePos);

  /* A point P on the sphere with center C satisfies the following equation:
   * |P-C|=r  ⇔  |P-C|²=r²  ⇔  ⟨P-C,P-C⟩=r²  ⇔  ⟨P,P⟩-2⟨P,C⟩+⟨C,C⟩=r²
   * With P=λD this becomes λ²⟨D,D⟩ - 2λ⟨D,C⟩ + ⟨C,C⟩-r² = 0
   * but since D is normalized, ⟨D,D⟩=1. We solve that equation using
   * λ = (⟨D,C⟩ ± sqrt(⟨D,C⟩² - (⟨C,C⟩ - r²)))
   */

  // Compute intersection with sphere
  float b = dot(vViewSpaceCenter, dir);
  float c = dot(vViewSpaceCenter, vViewSpaceCenter) - vRadius*vRadius;
  float d = b*b - c;
  if (d < 0.0) discard;
  float lambda = b + sphereMode*sqrt(d);
  if (lambda < 0.0) discard;

  // Compute point on sphere
  vec3 pointOnSphere = lambda * dir;
  // Compute normal
  vec3 normal = normalize(pointOnSphere - vViewSpaceCenter);

  // Shade surface position
  shade(pointOnSphere, normal);

#ifdef GL_EXT_frag_depth
  // Adjust depth value as the depth value of the bounding quad differs
  // from the actual depth value
  vec4 projPoint = uProjectionMatrix * vec4(pointOnSphere, 1);
  gl_FragDepthEXT = (projPoint.z / projPoint.w + 1.0) / 2.0;
#endif
}
