vec2 arcsinf(float z){
    if(abs(z)<=1.) return vec2(asin(z), 0.);
    else if(z>1.) return vec2(pi*.5, -log(z+sqrt(z*z-1.)));
    else return vec2(-pi*.5, log(-z+sqrt(z*z-1.)));
}
