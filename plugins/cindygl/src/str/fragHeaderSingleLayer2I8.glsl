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
uniform sampler2D oldColorTex;
uniform sampler2D oldDepthTex;
uniform vec2 screenSize;

uniform vec3 cgl_viewPos;
uniform vec4 cgl_viewRect;
uniform vec3 uCenter;
uniform vec3 uOrientation;
uniform mat3 uCubeAxes;
uniform float uRadius;
float cgl_depth;

// split depth into parts of 8-bits each
vec2 cgl_splitDepth(float z) {
  float hi = floor(z*256.0)/256.0;
  float low = 256.0*(z-hi);
  return vec2(hi,low);
}
// recompose depth from parts
float cgl_getDepth(vec2 parts) {
  return parts.r+parts.g/256.0;
}
void cgl_setColor(vec4 color) {
    if(color.a==0.0)discard;
    vec4 oldColor = texture(oldColorTex,gl_FragCoord.xy/screenSize);
    float oldDepth = cgl_getDepth(texture(oldDepthTex,gl_FragCoord.xy/screenSize).rg);
    float newAlpha = oldColor.a + color.a - oldColor.a * color.a;
    if(cgl_depth <= oldDepth || color.a == 0.0) {
        fragColor = vec4(((1.0-color.a)*oldColor.rgb + color.a*color.rgb),newAlpha);
    } else {
        fragColor = vec4(((1.0-oldColor.a)*color.rgb + oldColor.a*oldColor.rgb),newAlpha);
    }
    fragDepth = cgl_splitDepth(min(oldDepth,cgl_depth));
}
void cgl_setDepth(float depth) {
    gl_FragDepth = depth;
}
