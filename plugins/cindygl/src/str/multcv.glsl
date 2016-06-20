vec4 multcv(vec2 a, vec4 b) {
   return vec4(a.x*b.x-a.y*b.y, a.y*b.x+a.x*b.y,
               a.x*b.z-a.y*b.a, a.y*b.z+a.x*b.a); 
}
