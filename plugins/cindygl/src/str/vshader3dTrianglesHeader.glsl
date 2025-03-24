#version 300 es
in vec2 aTexCoord;
in vec3 aPos;

out   vec2 cgl_pixel;
out   vec3 cgl_viewDirection;
out   vec2 plain_pixel;

uniform   vec3 cgl_viewPos;
uniform   mat4 projAndTrafoMatrix;
uniform   mat3 transformMatrix;
