// ----------------------------------------------------------------------------
// Shades a particular surface point
// ----------------------------------------------------------------------------
// position     position vector to be shaded
// normal       normal vector at the given position
// ----------------------------------------------------------------------------
void shade(in vec3 position, in vec3 normal) {
  // Reset global colors to black as in an unlit scene
  gAccumDiffuse = vec3(0.0);
  gAccumSpecular = vec3(0.0);

  // Provide values for lighting in global variables
  gPos = position;
  gEye = -normalize(position);
  gNormal = sign(dot(gEye, normal))*normal;

  // Actually do the lighting
  lightScene();
 
  // Modulate pure lighting color at intersection point with
  // intersection point material
  vec3 color = (uAmbient + gAccumDiffuse) * gColor.xyz
    + gAccumSpecular;

  color = clamp(color, 0.0, 1.0);
  gl_FragColor = vec4(color.xyz, gColor.w);
}
