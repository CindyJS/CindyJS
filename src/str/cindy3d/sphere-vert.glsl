attribute vec2 aVertex;
  
uniform mat4 uProjectionMatrix;

// Sphere center in view space
uniform vec3 sphereCenter;
// Sphere radius
uniform float sphereRadius;

// Surface point in view space
varying vec3 viewSpacePosition;

// ----------------------------------------------------------------------------
// Vertex shader for sphere rendering
// ----------------------------------------------------------------------------
void main() {
  // Compute screen aligned coordinate system
  vec3 dir = normalize(-sphereCenter);
  vec3 right = normalize(cross(dir, vec3(0, 1, 0)));
  vec3 up = normalize(cross(right, dir));

  // Shift vertices of fullscreen quad
  viewSpacePosition = sphereCenter +
	sphereRadius*(right * aVertex.x + up * aVertex.y + dir);

  // Transform position into screen space
  gl_Position = uProjectionMatrix * vec4(viewSpacePosition, 1);
}
