vec2 sqrtc(vec2 a){
    return expc(multc(logc(a),vec2(0.5,0.0))); //TODO: Das koennen wir schneller!
}
