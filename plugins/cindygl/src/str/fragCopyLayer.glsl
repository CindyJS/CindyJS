#version 300 es
precision highp float;

uniform sampler2D srcColor;
uniform sampler2D srcDepth;
layout(location=0) out vec4 targetColor;
layout(location=1) out float targetDepth;
in vec2 cgl_pixel;

void main(void) {
	targetColor = texture(srcColor, cgl_pixel);
	targetDepth = texture(srcDepth, cgl_pixel).r;
}
