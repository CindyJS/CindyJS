uniform mat4 uProjectionMatrix;

// Sphere center in view space
uniform vec3 sphereCenter;
// Sphere radius
uniform float sphereRadius;
// Sphere mode
uniform float sphereMode;

// Surface position in view space
varying vec3 viewSpacePosition;

// ----------------------------------------------------------------------------
// Fragment shader for sphere rendering
// ----------------------------------------------------------------------------
void main() {
  // Vector from eye point to surface position
  vec3 dir = normalize(viewSpacePosition);

  // Compute intersection with sphere
  float b = dot(sphereCenter, dir);
  float c = dot(sphereCenter, sphereCenter) - sphereRadius*sphereRadius;
  float d = b*b - c;
  float lambda = 0.0;
  float hit = 0.0;
  if (d > 0.0) {
    float sqrtD = sqrt(d);
    if (sphereMode == 0.0) {
      // Cull front
      lambda = b + sqrtD;
    } else if (sphereMode == 1.0) {
      // Cull back
      lambda = b - sqrtD;
    } else {
      // Cull none
      lambda = b - sqrtD;
      if (lambda <= 0.0) {
        lambda = b + sqrtD;
      }
    }

    if (lambda > 0.0) {
      hit = 1.0;
    }
  }
  
  // If view ray does not intersect with sphere discard
  if (hit == 0.0) {
    discard;
  }

  // Compute point on sphere
  vec3 pointOnSphere = lambda * dir;
  // Compute normal
  vec3 normal = normalize(pointOnSphere - sphereCenter);
  
  // Shade surface position
  shade(pointOnSphere, normal);

  // Adjust depth value as the depth value of the bounding quad differs
  // from the actual depth value
  vec4 projPoint = uProjectionMatrix * vec4(pointOnSphere, 1);
#ifdef GL_EXT_frag_depth
  gl_FragDepthEXT = (projPoint.z / projPoint.w + 1.0) / 2.0;
#endif
}
