vec2 invc(vec2 a){
   float n=a.x*a.x+a.y*a.y;
   return vec2(a.x/n,-a.y/n); 
}
