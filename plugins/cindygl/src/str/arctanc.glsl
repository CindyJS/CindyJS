vec2 arctanc(vec2 a){
    vec2 t1=logc(addc(multc(a,vec2(0.0,-1.0)),vec2(1.0,0.0)));
    vec2 t2=logc(addc(multc(a,vec2(0.0,1.0)),vec2(1.0,0.0)));
    vec2 erg=multc(subc(t1,t2),vec2(0.0,0.5));
    return erg;
}
