#version 300 es
precision highp float;
precision highp int;

#define pi 3.141592653589793

in vec2 cgl_pixel;
in vec2 plain_pixel;
in vec3 cgl_viewDirection;
in vec3 cgl_spacePos;

layout(location=0) out vec4 fragColor;
layout(location=1) out vec2 fragDepth;
uniform vec2 screenSize;

uniform vec3 cgl_viewPos;
uniform vec3 uCenter;
uniform vec3 uPointA;
uniform vec3 uPointB;
uniform float uRadius;
float cgl_depth;

// split depth into parts of 8-bits each
vec2 cgl_splitDepth(float z) {
  float hi = floor(z*256.0)/256.0;
  float low = 256.0*(z-hi);
  return vec2(hi,low);
}
void cgl_setColor(vec4 color) {
    fragColor = color;
    fragDepth = cgl_splitDepth(cgl_depth);
}
void cgl_setDepth(float depth) {
    gl_FragDepth = depth;
}
