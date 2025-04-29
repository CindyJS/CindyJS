#version 300 es
in vec2 aTexCoord;
in vec3 aPos;

out   vec2 cgl_pixel;
out   vec3 cgl_viewDirection;
out   vec2 plain_pixel;

uniform   vec3 uCenter;
uniform   vec3 uOrientation;
uniform   float uRadius;
uniform   float uBoxLengthScale;
uniform   vec3 cgl_viewPos;
uniform   mat4 projAndTrafoMatrix;
uniform   mat3 transformMatrix;

void main(void) {
   // pick ray through A or B depending on sign on aPos.y
   // pick point on ray coresponding to distance of the closer of the two points
   vec3 v0 = abs(uOrientation.x)<abs(uOrientation.y)?vec3(1,0,0):vec3(0,1,0);
   vec3 dir1 = normalize(cross(v0,uOrientation));
   vec3 dir2 = normalize(cross(dir1,uOrientation));
   vec3 pos3 = uCenter+uBoxLengthScale*uOrientation*aPos.x+uRadius*(dir1*aPos.y+dir2*aPos.z);
   // transform to viewSpace
   gl_Position = projAndTrafoMatrix*vec4(pos3,1);
   gl_Position.z=0.0;
   cgl_viewDirection = pos3 - cgl_viewPos;
   // 2D coordinates
   plain_pixel = aTexCoord;
   vec3 r = transformMatrix*vec3(plain_pixel,1);
   cgl_pixel = r.xy/r.z;
}
