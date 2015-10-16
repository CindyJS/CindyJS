vec2 divc(vec2 a, vec2 b){
  return 1./(b.x*b.x+b.y*b.y)*multc(a,vec2(b.x,-b.y));
}
