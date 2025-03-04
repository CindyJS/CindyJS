#version 300 es
precision highp float;

uniform sampler2D sampler;
out vec2 cgl_pixel;

void main(void) {
	gl_FragColor = texture2D(sampler, cgl_pixel);
}
