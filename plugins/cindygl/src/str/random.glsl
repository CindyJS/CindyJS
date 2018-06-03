uniform float rnd_;

float last_rnd = .1231;
float random() {
  last_rnd = fract(rnd_+fract(132422.21*sin(dot(plain_pixel, 343433.671228*vec2(.176574+last_rnd, .1131+rnd_)))));
  return last_rnd;
}
