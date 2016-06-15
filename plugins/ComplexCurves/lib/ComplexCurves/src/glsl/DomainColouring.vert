#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
attribute vec2 position;
varying vec2 vPosition;
void main () {
    gl_Position = vec4 (position, 0.0, 1.0);
    vPosition = 5.0 * position;
}
