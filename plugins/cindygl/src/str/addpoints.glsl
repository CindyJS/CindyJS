vec2 addpoints(vec3 a, vec3 b) {
  return dehomogenize(a) + dehomogenize(b);
}
