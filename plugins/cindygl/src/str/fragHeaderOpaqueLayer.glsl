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
uniform vec2 screenSize;

uniform vec3 cgl_viewPos;
uniform vec3 cgl_viewNormal;
uniform vec4 cgl_viewRect;
uniform vec3 uCenter;
uniform vec3 uOrientation;
uniform mat3 uCubeAxes;
uniform float uRadius;
float cgl_depth;

void cgl_setColor(vec4 color) {
    if(color.a==0.0)discard;
    // TODO? are textures updated if depth-test fails
    fragColor = color;
    fragDepth = cgl_depth;
}
void cgl_setDepth(float depth) {
    gl_FragDepth = depth;
}
