#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
attribute vec2 vPosition;
void main()
{
  gl_Position = vec4(vPosition, 0.0, 1.0);
}
