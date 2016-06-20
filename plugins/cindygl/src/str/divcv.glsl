vec4 divcv(vec4 a, vec2 b){
  return 1./(b.x*b.x+b.y*b.y)*multcv(vec2(b.x,-b.y), a);
}
