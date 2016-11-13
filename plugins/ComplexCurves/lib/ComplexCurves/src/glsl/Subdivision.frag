#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform int computedRoots;
uniform sampler2D oldSamplers[1 + N/2];
varying vec3 barycentric;
varying vec2 texCoord[3];
varying vec2 texCoordOut;

void main(void) {
    if (barycentric == vec3 (1.0, 0.0, 0.0)) {
        if (computedRoots >= sheets) {
            gl_FragColor = texture2D (oldSamplers[0], texCoord[0]);
        } else {
            int i = computedRoots / 2 + 1;
            for (int j = 1; j < 1 + N/2; j++)
                if (j == i)
                    gl_FragColor = texture2D (oldSamplers[j], texCoord[0]);
        }
    } else if (barycentric == vec3 (0.0, 1.0, 0.0)) {
        if (computedRoots >= sheets) {
            gl_FragColor = texture2D (oldSamplers[0], texCoord[1]);
        } else {
            int i = computedRoots / 2 + 1;
            for (int j = 1; j < 1 + N/2; j++)
                if (j == i)
                    gl_FragColor = texture2D (oldSamplers[j], texCoord[1]);
        }
    } else if (barycentric == vec3 (0.0, 0.0, 1.0)) {
        if (computedRoots >= sheets) {
            gl_FragColor = texture2D (oldSamplers[0], texCoord[2]);
        } else {
            int i = computedRoots / 2 + 1;
            for (int j = 1; j < 1 + N/2; j++)
                if (j == i)
                    gl_FragColor = texture2D (oldSamplers[j], texCoord[2]);
        }
    } else {
        vec2 values[N];
        vec2 position = barycentric.x * texture2D (oldSamplers[0], texCoord[0]).xy
                      + barycentric.y * texture2D (oldSamplers[0], texCoord[1]).xy
                      + barycentric.z * texture2D (oldSamplers[0], texCoord[2]).xy;
        vec2 cs[N+1];
        f (position, cs);
        roots (sheets, cs, values);

        if (computedRoots < sheets) {
            for (int i = 0; i < N; i += 2) {
                if (i == computedRoots)
                    if (computedRoots + 1 < sheets)
                        gl_FragColor = vec4(values[i], values[i + 1]);
                    else
                        gl_FragColor = vec4(values[i], vec2 (0.0, 0.0));
            }
        } else {
            float delta = Delta (position, values);
            gl_FragColor = vec4 (position, delta, 1.0);
        }
    }
}
