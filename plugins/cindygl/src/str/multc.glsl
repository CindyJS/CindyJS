vec2 multc(vec2 a, vec2 b){
   return vec2(dot(a,vec2(b.x,-b.y)), dot(a,b.yx));
}
