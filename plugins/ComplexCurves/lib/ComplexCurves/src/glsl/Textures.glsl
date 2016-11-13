#define W 2048.0
#define H 2048.0
vec2 uvPosition (in float i) {
    const float h = 2048.0;
    return vec2 (mod (i, W) / W + 0.5 / W, floor (i / W) / H + 0.5 / H);
}

vec4 indexedPosition (in float i) {
    float x = mod (i, W) / W;
    float y = floor (i / W) / H;
    return vec4 (x * 2.0 - 1.0 + 1.0 / W, y * 2.0 - 1.0 + 1.0 / H, 0.0, 1.0);
}
