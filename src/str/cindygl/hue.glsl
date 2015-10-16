vec4 hue(float a) {
  return vec4(hsv2rgb(vec3(a,1.,1.)),1.);
}
