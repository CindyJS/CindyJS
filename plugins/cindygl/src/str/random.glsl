uniform float rnd_;

float last_rnd = .1231;
float random() {
  float a = mod(rnd_*plain_pixel.x*32.23,1.21);
  float b = mod(last_rnd*plain_pixel.y*54.21,1.32);
  last_rnd = mod(a+b+12232.2213*(1.+rnd_)*dot(plain_pixel,plain_pixel)+a+sin(b)+b*sin(dot(plain_pixel, vec2(232.121+rnd_,2232.11))+last_rnd*121.11)*129.12+rnd_,1.);
  return last_rnd;
  
  //return mod(a+b+rnd_, 1.);
}
