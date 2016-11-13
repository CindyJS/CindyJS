#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
attribute float index;
attribute vec2 position;
varying vec2 texCoord;
varying vec2 vPosition;
void main (void) {
    vPosition = position;
    gl_Position = indexedPosition (index);
    texCoord = uvPosition (index);
}
