uniform mat4 uProjectionMatrix;

uniform mat4 uModelViewMatrix;

attribute vec4 aCenter;

attribute vec4 aColor;

attribute vec3 aRelative;

attribute float aRadius;

varying vec3 vViewSpacePos;

varying vec3 vViewSpaceCenter;

varying vec4 vColor;

varying float vRadius;

// ----------------------------------------------------------------------------
// Vertex shader for sphere rendering
// ----------------------------------------------------------------------------
void main() {
  // Compute screen aligned coordinate system
  vec4 viewPosHom = uModelViewMatrix*aCenter;
  vViewSpaceCenter = viewPosHom.xyz / viewPosHom.w;
  vec3 dir = normalize(-vViewSpaceCenter);
  vec3 right = normalize(cross(dir, vec3(0, 1, 0)));
  vec3 up = normalize(cross(right, dir));

  // Shift vertices of fullscreen quad
  vViewSpacePos = vViewSpaceCenter +
	aRadius*(right * aRelative.x + up * aRelative.y + dir);

  vColor = aColor;
  vRadius = aRadius;

  // Transform position into screen space
  gl_Position = uProjectionMatrix * vec4(vViewSpacePos, 1);
}
