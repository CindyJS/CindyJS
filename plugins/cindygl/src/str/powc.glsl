vec2 powc(vec2 a, vec2 b){
    return (b.x==0. && b.y==0.) ? vec2(1.,0.) : ( (a.x==0. && a.y==0.) ? vec2(0.) : expc(multc(logc(a),b)));
}
