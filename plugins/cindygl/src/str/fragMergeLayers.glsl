#version 300 es
precision highp float;

uniform sampler2D src1Color;
uniform sampler2D src1Depth;
uniform sampler2D src2Color;
uniform sampler2D src2Depth;
layout(location=0) out vec4 targetColor;
layout(location=1) out float targetDepth;
in vec2 cgl_pixel;

void main(void) {
	vec4 color1 = texture(src1Color, cgl_pixel);
	vec4 color2 = texture(src2Color, cgl_pixel);
	float depth1 = texture(src1Depth, cgl_pixel).r;
	float depth2 = texture(src2Depth, cgl_pixel).r;

    float newAlpha = color1.a + color2.a - color1.a * color2.a;
    if(depth2 <= depth1) {
        targetColor = vec4(((1.0-color2.a)*color1.rgb + color2.a*color2.rgb),newAlpha);
    } else {
        targetColor = vec4(((1.0-color1.a)*color2.rgb + color1.a*color1.rgb),newAlpha);
    }
    targetDepth = min(depth1,depth2);
}
