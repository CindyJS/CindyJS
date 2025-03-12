#version 300 es
precision highp float;

uniform sampler2D sampler;
layout(location = 0) out vec4 fragColor;
layout(location = 1) out vec2 cgl_pixel;

void main(void) {
	fragColor = texture(sampler, cgl_pixel);
}
