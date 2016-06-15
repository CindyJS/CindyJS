#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
attribute vec4 indexBarycentric;
attribute float indexOffsetIn;
attribute float indexOffsetOut;
varying vec3 barycentric;
varying vec2 texCoord[3];
varying vec2 texCoordOut;

void main (void) {
    float indexOut = indexBarycentric.x + indexOffsetOut;
    gl_Position = indexedPosition (indexOut);
    barycentric = indexBarycentric.yzw;
    texCoord[0] = uvPosition (indexOffsetIn);
    texCoord[1] = uvPosition (indexOffsetIn + 1.0);
    texCoord[2] = uvPosition (indexOffsetIn + 2.0);
    texCoordOut = uvPosition (indexOut);
}
