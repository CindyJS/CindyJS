#version 300 es
precision highp float;
precision highp int;

#define pi 3.141592653589793

in vec2 cgl_pixel;
in vec2 plain_pixel;
in vec3 cgl_viewDirection;
in vec3 cgl_spacePos;
out vec4 fragColor;

uniform vec3 cgl_viewPos;
uniform vec3 cgl_viewNormal;
uniform vec4 cgl_viewRect;
uniform vec3 uCenter;
uniform vec3 uOrientation;
uniform mat3 uCubeAxes;
uniform float uRadius;
float cgl_depth;
