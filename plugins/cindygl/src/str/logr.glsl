vec2 logr(float a){
    if(a>=0.) return vec2(log(a),0);
    else return vec2(log(-a), pi);
}
