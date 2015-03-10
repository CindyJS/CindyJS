uniform vec3 uAmbient;

varying vec4 vColor;
varying float vShininess;

vec3 gPos;
vec3 gEye;
vec3 gNormal;
vec3 gAccumDiffuse;
vec3 gAccumSpecular;

void commonLight(in vec3 lightDir, in vec3 diffuse, in vec3 specular) {
  vec3 halfVector;    // Direction of maximum highlights
  float diffuseDot;   // Dot(normal, light direction)
  float specularDot;  // Dot(normal, light half vector)
  float specFactor;   // specular factor

  halfVector = normalize(lightDir + gEye);
  diffuseDot = max(0.0, dot(gNormal, lightDir));
  specularDot = max(0.0, dot(gNormal, halfVector));

  // If point is not lit
  if (diffuseDot == 0.0)
    specFactor = 0.0;
  else
    specFactor = pow(specularDot, vShininess);

  // Add light received from this light source to global colors
  gAccumDiffuse  += diffuse * diffuseDot;
  gAccumSpecular += specular * specFactor;
}

void pointLight(in vec3 lightPos, in vec3 diffuse, in vec3 specular) {
  commonLight(normalize(lightPos - gPos), diffuse, specular);
}

void directionalLight(in vec3 lightDir, in vec3 diffuse, in vec3 specular) {
  commonLight(normalize(lightDir), diffuse, specular);
}

void spotLight(in vec3 lightPos, in vec3 spotDir,
               in float spotCosCutoff, in float spotExponent,
               in vec3 diffuse, in vec3 specular) {
  vec3 lightDir;      // direction from surface to light position
  vec3 halfVector;    // Direction of maximum highlights
  float diffuseDot;   // Dot(normal, light direction)
  float specularDot;  // Dot(normal, light half vector)
  float specFactor;   // specular factor
  float spotCosAngle;    // cosine of angle between spotlight
  float spotAttenuation; // spotlight attenuation factor

  lightDir = normalize(lightPos - gPos);
  halfVector = normalize(lightDir + gEye);
  diffuseDot = max(0.0, dot(gNormal, lightDir));
  specularDot = max(0.0, dot(gNormal, halfVector));

  spotCosAngle = dot(-lightDir, normalize(spotDir));
  spotAttenuation =
    step(spotCosCutoff, spotCosAngle) * pow(spotCosAngle, spotExponent);

  // If point is not lit
  if (diffuseDot == 0.0)
    specFactor = 0.0;
  else
    specFactor = pow(specularDot, vShininess);

  // Add light received from this light source to global colors
  gAccumDiffuse  += spotAttenuation * diffuse * diffuseDot;
  gAccumSpecular += spotAttenuation * specular * specFactor;
}
