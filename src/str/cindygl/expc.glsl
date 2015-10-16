vec2 expc(vec2 a){
    float n = exp(a.x);
    float r = n * cos(a.y);
    float i = n * sin(a.y);
    return vec2(r,i); 
}
