#version 300 es
precision highp float;

uniform sampler2D src1Color;
uniform sampler2D src1Depth;
uniform sampler2D src2Color;
uniform sampler2D src2Depth;
layout(location=0) out vec4 target1Color;
layout(location=1) out vec2 target1Depth;
layout(location=2) out vec4 target2Color;
layout(location=3) out vec2 target2Depth;
in vec2 cgl_pixel;

// recompose depth from parts
float cgl_getDepth(vec2 parts) {
  return parts.r+parts.g/256.0;
}
void main(void) {
	vec4 color1 = texture(src1Color, cgl_pixel);
	vec4 color2 = texture(src2Color, cgl_pixel);
	vec2 depth1 = texture(src1Depth, cgl_pixel).rg;
	vec2 depth2 = texture(src2Depth, cgl_pixel).rg;
    if(cgl_getDepth(depth1) <= cgl_getDepth(depth2) || color2.a == 0.0) { // layer2 above layer1 (and not completely transparent)
        target1Color = color1;
        target1Depth = depth1;
        target2Color = color2;
        target2Depth = depth2;
    } else {
        target1Color = color2;
        target1Depth = depth2;
        target2Color = color1;
        target2Depth = depth1;
    }
}
