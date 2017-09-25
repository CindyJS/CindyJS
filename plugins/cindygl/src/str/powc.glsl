vec2 powc(vec2 a, vec2 b){
    return (a.x==0. && a.y==0.) ? vec2(0.) : expc(multc(logc(a),b));
}
