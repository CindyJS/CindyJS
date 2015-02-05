uniform vec4 materialEmission;
uniform vec4 materialAmbient;
// uniform vec4 materialDiffuse;
varying vec4 vColor;
uniform vec4 materialSpecular;
uniform float materialShininess;
// uniform float materialAlpha;

struct lightSourceParameters {
  vec4 position;
  vec4 ambient;
  vec4 diffuse;
  vec4 specular;
  vec3 spotDirection;
  float spotExponent;
  float spotCutoff;
  float spotCosCutoff;
};
uniform lightSourceParameters lightSource[3];

// Global ambient color for a surface point
vec4 Ambient;
// Global diffuse color for a surface point
vec4 Diffuse;
// Global specular color for a surface point
vec4 Specular;

// ----------------------------------------------------------------------------
// Point light shading for a particular surface position
// ----------------------------------------------------------------------------
// position     Surface position to be shaded
// normal       Normal vector at the given surface position
// eye          Normalized vector pointing from surface position to eye point
// lightIdx     Light index needed to retrieve light properties
// ----------------------------------------------------------------------------
void pointLight(in vec3 position, in vec3 normal, in vec3 eye, in vec4 lightPos, in vec4 ambient, in vec4 diffuse, in vec4 specular) {
  vec3 lightDir;      // Direction from surface to light position
  float distance;     // Distance from surface to light source
  float attenuation;  // Attenuation factor
  vec3 halfVector;    // Direction of maximum highlights
  float diffuseDot;   // Dot(normal, light direction)
  float specularDot;  // Dot(normal, light half vector)
  float specFactor;   // specular factor

  // Invert normal for double sided lighting
  if (dot(normal, eye) < 0.0) {
    normal *= -1.0;
  }

  // Compute vector from surface to light position
  lightDir = vec3(lightPos) - position;
  // Compute distance between surface and light position
  distance = length(lightDir);
  // Normalize the vector from surface to light position
  lightDir = normalize(lightDir);

  // Compute reflection half vector
  halfVector = normalize(lightDir + eye);

  // Compute diffuse factor
  diffuseDot = max(0.0, dot(normal, lightDir));
  // Compute specular factor
  specularDot = max(0.0, dot(normal, halfVector));

  // If point is not lit
  if (diffuseDot == 0.0) {
    specFactor = 0.0;
  } else {
    specFactor = pow(specularDot, materialShininess);
  }

  // Add light received from this light source to global colors
  Ambient  += ambient;
  Diffuse  += diffuse * diffuseDot;
  Specular += specular * specFactor;
}

// ----------------------------------------------------------------------------
// Shades a particular surface point
// ----------------------------------------------------------------------------
// position     position vector to be shaded
// normal       normal vector at the given position
// ----------------------------------------------------------------------------
void shade(in vec3 position, in vec3 normal) {
  // Reset global colors to black as in an unlit scene
  Ambient = vec4(0.0);
  Diffuse = vec4(0.0);
  Specular = vec4(0.0);

  // Appropriate code is inserted during shader compiling according
  // to current light settings
  vec3 eye = -normalize(position);
  pointLight(position, normal, eye, lightSource[0].position,
             lightSource[0].ambient, lightSource[0].diffuse, lightSource[0].specular);
 
  // Modulate pure lighting color at intersection point with
  // intersection point material

  vec4 color =
    Ambient  * materialAmbient +
    Diffuse  * vColor +
    Specular * materialSpecular;

  color = clamp(color, 0.0, 1.0);
  gl_FragColor = vec4(color.xyz, vColor.w);
}
