#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
attribute float index;
varying vec2 texCoord[2];

void main (void) {
    gl_Position = indexedPosition (index);
    float j = 1.0;
    if (mod (index, 3.0) > 1.0)
        j = -2.0;
    texCoord[0] = uvPosition (index);
    texCoord[1] = uvPosition (index + j);
}
