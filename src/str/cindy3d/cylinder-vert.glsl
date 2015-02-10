uniform mat4 uProjectionMatrix;

uniform mat4 uModelViewMatrix;

attribute vec4 aPoint1;

attribute vec4 aPoint2;

attribute vec4 aColor;

attribute vec4 aRelativeRadius;

varying vec3 vPoint1;

varying vec3 vPoint2;

varying vec3 vPos;

varying vec4 vColor;

varying float vRadius;

// ----------------------------------------------------------------------------
// Vertex shader for cylinder rendering
// ----------------------------------------------------------------------------
void main() {
  // Convert from model to view coordinates
  vec4 hom;
  hom = uModelViewMatrix*aPoint1;
  vPoint1 = hom.xyz / hom.w;
  hom = uModelViewMatrix*aPoint2;
  vPoint2 = hom.xyz / hom.w;
  vec3 dir = normalize(vPoint2 - vPoint1);

  // Establish two directions orthogonal to dir
  vec3 d2, d3;
  if (abs(dir.x) < abs(dir.y))
    d2 = vec3(1, 0, 0);
  else // dir might be close to (±1, 0, 0)
    d2 = vec3(0, 1, 0);
  d2 = normalize(cross(dir, d2));
  d3 = normalize(cross(dir, d2));

  vPos = aRelativeRadius.w*(mat3(dir, d2, d3)*aRelativeRadius.xyz)
    + 0.5*((vPoint2 + vPoint1) + aRelativeRadius.x*(vPoint2 - vPoint1));

  // Copy attributes to varyings for use in the fragment shader
  vColor = aColor;
  vRadius = aRelativeRadius.w;

  // Transform position into screen space
  gl_Position = uProjectionMatrix * vec4(vPos, 1);
}
