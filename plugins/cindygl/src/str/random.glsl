uniform float rnd_;

float last_rnd = .1231;
float random() {
  float a = fract(132422.21*sin(dot(plain_pixel, 343433.671228*vec2(.176574+last_rnd, .1131+rnd_))));
  float b = fract(last_rnd*2321.2312*sin(dot(plain_pixel+vec2(rnd_,last_rnd), plain_pixel) * 43758.5453));
  last_rnd = fract(rnd_ + last_rnd + a + b);
  return last_rnd;
}
