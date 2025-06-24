#version 300 es
precision highp float;

uniform sampler2D sampler;
out vec4 fragColor;
in vec2 cgl_pixel;

void main(void) {
	fragColor = texture(sampler, cgl_pixel);
}
