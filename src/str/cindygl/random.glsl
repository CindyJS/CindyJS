uniform float rnd_;

float random() {
  float a = mod(cgl_pixel.x*32.23,1.21);
  float b = mod(cgl_pixel.y*54.21,1.32);
  return mod(12232.212312131213*(1.+rnd_)*dot(cgl_pixel,cgl_pixel)+a+sin(b)+b*cos(dot(cgl_pixel, vec2(232112.121,2232.11)))+rnd_,1.); //TODO make better, lookup
  //return mod(a+b+rnd_, 1.);
}
