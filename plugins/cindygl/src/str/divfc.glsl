vec2 divfc(float a, vec2 b){
  return a*vec2(b.x,-b.y)/dot(b,b);
}
