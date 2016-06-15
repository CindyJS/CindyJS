#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform mat4 m;
uniform mat4 v;
uniform mat4 p;
uniform sampler2D sampler;
attribute float index;
varying vec4 vPos;
varying vec2 v_value;
void main (void)
{
    vec4 posValue = texture2D (sampler, uvPosition (index));
    vPos = vec4 (posValue.xyz, 1.0);
    v_value = posValue.zw;
    gl_Position = p * v * m * vPos;
}
