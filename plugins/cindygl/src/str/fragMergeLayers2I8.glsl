#version 300 es
precision highp float;

uniform sampler2D src1Color;
uniform sampler2D src1Depth;
uniform sampler2D src2Color;
uniform sampler2D src2Depth;
layout(location=0) out vec4 targetColor;
layout(location=1) out vec2 targetDepth;
in vec2 cgl_pixel;

// split depth into parts of 8-bits each
vec2 cgl_splitDepth(float z) {
  float hi = floor(z*256.0)/256.0;
  float low = 256.0*(z-hi);
  return vec2(hi,low);
}
// recompose depth from parts
float cgl_getDepth(vec2 parts) {
  return parts.r+parts.g/256.0;
}
void main(void) {
	vec4 color1 = texture(src1Color, cgl_pixel);
	vec4 color2 = texture(src2Color, cgl_pixel);
	float depth1 = cgl_getDepth(texture(src1Depth, cgl_pixel).rg);
	float depth2 = cgl_getDepth(texture(src2Depth, cgl_pixel).rg);

  float newAlpha = color1.a + color2.a - color1.a * color2.a;
  if(depth2 <= depth1) {
      targetColor = vec4(((1.0-color2.a)*color1.rgb + color2.a*color2.rgb),newAlpha);
  } else {
      targetColor = vec4(((1.0-color1.a)*color2.rgb + color1.a*color1.rgb),newAlpha);
  }
  targetDepth = cgl_splitDepth(min(depth1,depth2));
}
