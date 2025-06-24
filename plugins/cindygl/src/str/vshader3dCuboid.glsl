#version 300 es
in vec2 aTexCoord;
in vec3 aPos;

out   vec2 cgl_pixel;
out   vec3 cgl_viewDirection;
out   vec2 plain_pixel;

uniform   vec3 uCenter;
uniform   mat3 uCubeAxes;
uniform   vec3 cgl_viewPos;
uniform   mat4 projAndTrafoMatrix;
uniform   mat3 transformMatrix;

void main(void) {
   vec3 pos3 = uCenter+uCubeAxes*aPos;
   // transform to viewSpace
   gl_Position = projAndTrafoMatrix*vec4(pos3,1);
   gl_Position.z=0.0; // ignore z-position (will be rewritten in f-shader)
   cgl_viewDirection = pos3 - cgl_viewPos;
   // 2D coordinates
   plain_pixel = aTexCoord;
   vec3 r = transformMatrix*vec3(plain_pixel,1);
   cgl_pixel = r.xy/r.z;
}
