#version 300 es
precision highp float;
precision highp int;

#define pi 3.141592653589793

in vec2 cgl_pixel;
in vec2 plain_pixel;
in vec3 cgl_viewDirection;
out vec4 fragColor;

uniform vec3 cgl_viewPos;
uniform vec3 uCenter;
uniform vec3 uPointA;
uniform vec3 uPointB;
uniform float uRadius;
