vec2 divc(vec2 a, vec2 b){
  return vec2(dot(a,b), dot(a,vec2(-b.y,b.x)))/dot(b,b);
}
