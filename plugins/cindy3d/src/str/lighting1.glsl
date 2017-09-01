uniform vec3 uAmbient;
uniform mat4 uModelViewMatrix;

varying vec4 vColor;
varying float vShininess;
varying float vSpecularReflectiveness;

vec4 gColor;
vec3 gPos;
vec3 gEye;
vec3 gNormal;
vec3 gAccumDiffuse;
vec3 gAccumSpecular;

void commonLight(in vec4 lightPos, out vec3 lightDir,
                 out float diffuseFactor, out float specularFactor) {
  vec3 halfVector;       // direction of maximum highlights
  float specularDot;     // dot(normal, light half vector)

  lightDir = normalize(lightPos.xyz - lightPos.w*gPos);
  halfVector = normalize(lightDir + gEye);
  diffuseFactor = max(0.0, dot(gNormal, lightDir));
  specularDot = max(0.0, dot(gNormal, halfVector));

  // If point is not lit
  if (diffuseFactor == 0.0)
    specularFactor = 0.0;
  else
    specularFactor = pow(specularDot, vShininess) * vSpecularReflectiveness;
}

vec4 flipY(in vec4 v) {
  return vec4(v.x, -v.y, v.z, v.w);
}

void pointLight(in vec4 lightPos, in vec3 diffuse, in vec3 specular) {
  vec3 lightDir;         // direction from surface to light position
  float diffuseFactor;   // dot(normal, light direction)
  float specularFactor;  // specular factor

  commonLight(lightPos, lightDir, diffuseFactor, specularFactor);

  // Add light received from this light source to global colors
  gAccumDiffuse  += diffuse * diffuseFactor;
  gAccumSpecular += specular * specularFactor;
}

void cameraPointLight(in vec4 lightPos, in vec3 diffuse, in vec3 specular) {
  pointLight(flipY(lightPos), diffuse, specular);
}

void worldPointLight(in vec4 lightPos, in vec3 diffuse, in vec3 specular) {
  pointLight(-uModelViewMatrix*lightPos, diffuse, specular);
}

void spotLight(
  in vec4 lightPos, in vec4 spotPos, in float spotCosCutoff,
  in float spotExponent, in vec3 diffuse, in vec3 specular)
{
  vec3 lightDir;         // direction from surface to light position
  float diffuseFactor;   // dot(normal, light direction)
  float specularFactor;  // specular factor
  vec3 spotDir;          // direction from light source to spot
  float spotCosAngle;    // cosine of angle between spotlight
  float spotAttenuation; // spotlight attenuation factor

  commonLight(lightPos, lightDir, diffuseFactor, specularFactor);

  spotDir = lightPos.w*spotPos.xyz - spotPos.w*lightPos.xyz;
  spotCosAngle = dot(-lightDir, normalize(spotDir));
  spotAttenuation =
    step(spotCosCutoff, spotCosAngle) * pow(spotCosAngle, spotExponent);

  // Add light received from this light source to global colors
  gAccumDiffuse  += spotAttenuation * diffuse * diffuseFactor;
  gAccumSpecular += spotAttenuation * specular * specularFactor;
}

void cameraSpotLight(
  in vec4 lightPos, in vec4 spotPos, in float spotCosCutoff,
  in float spotExponent, in vec3 diffuse, in vec3 specular)
{
  spotLight(
    flipY(lightPos), flipY(spotPos),
    spotCosCutoff, spotExponent, diffuse, specular);
}

void worldSpotLight(
  in vec4 lightPos, in vec4 spotPos, in float spotCosCutoff,
  in float spotExponent, in vec3 diffuse, in vec3 specular)
{
  spotLight(
    -uModelViewMatrix*lightPos, -uModelViewMatrix*spotPos,
    spotCosCutoff, spotExponent, diffuse, specular);
}
