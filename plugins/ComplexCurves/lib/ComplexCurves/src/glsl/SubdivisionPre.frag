#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D sampler;
varying vec2 texCoord[2];

bool validOutgoingEdge () {
    vec3 next = texture2D (sampler, texCoord[1]).xyz;
    return distance (gl_FragColor.xy, next.xy) < min (gl_FragColor.z, next.z);
}

void main(void) {
    gl_FragColor = texture2D (sampler, texCoord[0]);
    if (gl_FragColor.w == 1.0 && validOutgoingEdge ())
        gl_FragColor.w = 0.0;
}
