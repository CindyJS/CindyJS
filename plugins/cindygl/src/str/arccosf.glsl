vec2 arccosf(float z){
    if(abs(z)<=1.) return vec2(acos(z), 0.);
    else if(z>1.) return vec2(0, log(z+sqrt(z*z-1.)));
    else return vec2(pi, -log(-z+sqrt(z*z-1.)));
}
