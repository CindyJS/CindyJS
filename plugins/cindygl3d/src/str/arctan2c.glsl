//As in Wolfram reference for ArcTan:
//If x or y is complex, then ArcTan[x,y] gives −i log((x+iy)/√(x2+y2)). When x2+y2=1, ArcTan[x,y] gives the number ϕ such that x=cos(ϕ) and y=sin(ϕ).
// https://github.com/CindyJS/CindyJS/issues/226

vec2 arctan2c(vec2 x, vec2 y){
  vec2 r = logc(divc(x+vec2(-y.y, y.x), sqrtc(multc(x,x)+multc(y,y))));
  return vec2(r.y, -r.x); //*(-i)
}
