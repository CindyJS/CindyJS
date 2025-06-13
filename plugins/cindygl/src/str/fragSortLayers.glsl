#version 300 es
precision highp float;

uniform sampler2D src1Color;
uniform sampler2D src1Depth;
uniform sampler2D src2Color;
uniform sampler2D src2Depth;
layout(location=0) out vec4 target1Color;
layout(location=1) out float target1Depth;
layout(location=2) out vec4 target2Color;
layout(location=3) out float target2Depth;
in vec2 cgl_pixel;

void main(void) {
	vec4 color1 = texture(src1Color, cgl_pixel);
	vec4 color2 = texture(src2Color, cgl_pixel);
	float depth1 = texture(src1Depth, cgl_pixel).r;
	float depth2 = texture(src2Depth, cgl_pixel).r;
    if(depth1 <= depth2 || color2.a == 0.0) { // layer2 above layer1 (and not completely transparent)
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
