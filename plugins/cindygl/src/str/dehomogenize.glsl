vec2 dehomogenize(vec3 z) {
  return vec2(z.x, z.y)/z.z;
}
