#ifdef GL_ES
precision highp float;
precision highp int;
#endif

#define pi 3.141592653589793

varying vec2 cgl_pixel;
varying vec2 plain_pixel;
varying vec3 cgl_viewDirection;
uniform vec3 cgl_viewPos;
uniform vec3 uCenter;
uniform vec3 uPointA;
uniform vec3 uPointB;
uniform float uRadius;
