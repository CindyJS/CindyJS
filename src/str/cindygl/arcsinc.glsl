vec2 arcsinc(vec2 a){
    vec2  t2=multc(a,negc(a));
    vec2 tmp=sqrtc(addc(vec2(1.0,0.0),t2));
    vec2 tmp1=addc(multc(a,vec2(0.0,1.0)),tmp);
    vec2 erg=multc(logc(tmp1),vec2(0.0,-1.0));
    return erg;
}
