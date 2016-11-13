#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform bool clipping;
varying vec4 vPos;
varying vec2 v_value;
vec3 hue_to_rgb (in float hue)
{
    hue = mod (degrees (hue), 360.0) / 60.0;
    int h = int (floor (hue));
    float f = fract (hue);
    if (h == 0)
        return vec3 (1.0, f, 0.0);
    else if (h == 1)
        return vec3 (1.0 - f, 1.0, 0.0);
    else if (h == 2)
        return vec3 (0.0, 1.0, f);
    else if (h == 3)
        return vec3 (0.0, 1.0 - f, 1.0);
    else if (h == 4)
        return vec3 (f, 0.0, 1.0);
    else if (h == 5)
        return vec3 (1.0, 0.0, 1.0 - f);
}
float sawfct (float x, float dx, float a, float b)
{
    return a + (b - a) * fract (x / dx);
}
void main (void)
{
    if (clipping && vPos.y < 0.0)
        discard;
    float PI = acos (-1.0);
    float angle = atan (v_value.y, v_value.x);
    float blackp = sawfct (angle, PI / 12.0, 0.7, 1.0);
    float blackm = sawfct (log (length (v_value)), PI / 12.0, 0.7, 1.0);
    float black = blackp * blackm;
    gl_FragColor = vec4 (black * hue_to_rgb (angle), gl_FragCoord.z);
}
