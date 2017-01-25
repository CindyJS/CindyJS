#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D sampler;
varying vec2 cgl_pixel;

void main(void) {
	gl_FragColor = texture2D(sampler, cgl_pixel);
}
