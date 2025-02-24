attribute vec3 aPos;
attribute vec2 aTexCoord;

varying   vec2 cgl_pixel;
varying   vec3 cgl_pixel3d;
varying   vec2 plain_pixel;

uniform   mat3 transformMatrix;

uniform   mat4 inverseSpaceTransformMatrix;
uniform   mat4 projectionMatrix;

void main(void) {
   gl_Position = projectionMatrix*vec4(aPos, 1.);
   vec4 pos4=inverseSpaceTransformMatrix*vec4(aPos, 1.);
   cgl_pixel3d=pos4.xyz/pos4.w;

   // backwards compatability with 2D mode
   plain_pixel = aTexCoord;
   vec3 r = transformMatrix*vec3(plain_pixel,1);
   cgl_pixel = r.xy/r.z;
}
