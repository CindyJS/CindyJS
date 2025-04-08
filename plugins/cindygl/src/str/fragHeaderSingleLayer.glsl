#version 300 es
precision highp float;
precision highp int;

#define pi 3.141592653589793

in vec2 cgl_pixel;
in vec2 plain_pixel;
in vec3 cgl_viewDirection;
in vec3 cgl_spacePos;

layout(location=0) out vec4 fragColor;
layout(location=1) out float fragDepth;
uniform sampler2D oldColorTex;
uniform sampler2D oldDepthTex;
uniform vec2 screenSize;

uniform vec3 cgl_viewPos;
uniform vec3 uCenter;
uniform vec3 uPointA;
uniform vec3 uPointB;
uniform float uRadius;
float cgl_depth;

void cgl_setColor(vec4 color) {
    if(color.a==0.0)discard;
    vec4 oldColor = texture(oldColorTex,gl_FragCoord.xy/screenSize);
    float oldDepth = texture(oldDepthTex,gl_FragCoord.xy/screenSize).r;
    float newAlpha = oldColor.a + color.a - oldColor.a * color.a;
    if(cgl_depth <= oldDepth) {
        fragColor = vec4(((1.0-color.a)*oldColor.rgb + color.a*color.rgb),newAlpha);
    } else {
        fragColor = vec4(((1.0-oldColor.a)*color.rgb + oldColor.a*oldColor.rgb),newAlpha);
    }
    fragDepth = min(oldDepth,cgl_depth);
}
void cgl_setDepth(float depth) {
    gl_FragDepth = depth;
}
