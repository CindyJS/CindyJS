uniform int sheet;
varying vec2 vPosition;
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
    vec2 cs[N+1];
    vec2 ys[N];
    vec2 value;
    f (vPosition, cs);
    roots (sheets, cs, ys);
    int smaller;
    for (int i = 0; i < sheets; i++)
    {
        smaller = 0;
        for (int j = 0; j < sheets; j++)
            if (ys[j].x < ys[i].x)
                smaller++;
        if (smaller == sheet - 1)
            value = ys[i];
    }
        
    float PI = acos (-1.0);
    float angle = atan (value.y, value.x);
    float blackp = sawfct (angle, PI / 12.0, 0.7, 1.0);
    float blackm = sawfct (log (length (value)), PI / 12.0, 0.7, 1.0);
    float black = blackp * blackm;
    gl_FragColor = vec4 (black * hue_to_rgb(angle), 1.0);
}
