vec2 sqrtf(float a){
    if(a>=0.) return vec2(sqrt(a), 0.);
    else return vec2(0., sqrt(-a));
}
