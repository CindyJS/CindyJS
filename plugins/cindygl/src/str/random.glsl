uniform float rnd_;

float last_rnd = .1231;
float random() {
  float a = fract(sin(mod(dot(plain_pixel,           vec2(12.9898,78.233) ), 3.1415)) * 43758.5453);
  float b = fract(sin(mod(dot(plain_pixel, 12345.678*vec2(last_rnd, rnd_) ), 3.1415)) * 21231.1231221);
  float c = rnd_+last_rnd;
  last_rnd = fract(a+b+c);
  return last_rnd;
  
  //return mod(a+b+rnd_, 1.);
}
