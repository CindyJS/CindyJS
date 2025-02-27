vec2 subpoints(vec3 a, vec3 b) {
  return dehomogenize(a) - dehomogenize(b);
}
