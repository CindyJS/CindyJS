#version 300 es
in vec3 aPos;
in vec2 aTexCoord;

out   vec2 cgl_pixel;
out   vec3 cgl_viewDirection;
out   vec2 plain_pixel;

uniform   vec3 cgl_viewPos;
uniform   mat3 transformMatrix;

uniform   mat4 inverseSpaceTransformMatrix;
uniform   mat4 projectionMatrix;

void main(void) {
   gl_Position = projectionMatrix*vec4(aPos, 1.);
   vec4 pos4=inverseSpaceTransformMatrix*vec4(aPos, 1.);
   cgl_viewDirection=(pos4.xyz/pos4.w)-cgl_viewPos;

   // backwards compatability with 2D mode
   plain_pixel = aTexCoord;
   vec3 r = transformMatrix*vec3(plain_pixel,1);
   cgl_pixel = r.xy/r.z;
}
